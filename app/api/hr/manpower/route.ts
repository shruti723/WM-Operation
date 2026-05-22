import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function parseDate(value: string | null | undefined) {
    if (!value) return null
    return new Date(value)
}

function toDateString(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const siteName = searchParams.get("siteName")
        const role = searchParams.get("role")

        if (!siteName) {
            return NextResponse.json(
                { success: false, message: "siteName is required" },
                { status: 400 }
            )
        }

        const site = await prisma.wmSite.findUnique({
            where: { siteName },
            include: {
                manpowerTemplate: {
                    orderBy: { createdAt: "asc" },
                },
                manpowerSubmissions: {
                    orderBy: { submittedAt: "desc" },
                    include: {
                        items: {
                            orderBy: { createdAt: "asc" },
                        },
                    },
                    take: 1,
                },
            },
        })

        if (!site) {
            return NextResponse.json(
                { success: false, message: "Site not found" },
                { status: 404 }
            )
        }

        const latestSubmission = site.manpowerSubmissions[0]

        // HR1 sees master template only
        if (role === "level1") {
            return NextResponse.json({
                success: true,
                siteName: site.siteName,
                startDate: toDateString(site.startDate),
                lastRenewalDate: toDateString(site.lastRenewalDate),
                nextRenewalDate: toDateString(site.nextRenewalDate),
                siteCategory: site.siteCategory ?? "",
                siteRemark: site.siteRemark ?? "",
                manpowerList: site.manpowerTemplate.map((item) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                })),
            })
        }

        // HR2 loads site template, not old submission values
        if (role === "level2") {
            return NextResponse.json({
                success: true,
                siteName: site.siteName,
                startDate: toDateString(site.startDate),
                lastRenewalDate: toDateString(site.lastRenewalDate),
                nextRenewalDate: toDateString(site.nextRenewalDate),
                siteCategory: site.siteCategory ?? "",
                siteRemark: site.siteRemark ?? "",
                manpowerList: site.manpowerTemplate.map((item) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                    deployed: 0,
                    shortage: 0,
                })),
            })
        }

        // HR3 loads latest HR2-created document
        if (role === "level3") {
            if (!latestSubmission) {
                return NextResponse.json(
                    { success: false, message: "No HR2 submission found for this site" },
                    { status: 404 }
                )
            }

            return NextResponse.json({
                success: true,
                submissionId: latestSubmission.id,
                siteName: site.siteName,
                startDate: toDateString(site.startDate),
                lastRenewalDate: toDateString(site.lastRenewalDate),
                nextRenewalDate: toDateString(site.nextRenewalDate),
                submittedAt: toDateString(latestSubmission.submittedAt),
                siteCategory: site.siteCategory ?? "",
                siteRemark: site.siteRemark ?? "",
                manpowerList: latestSubmission.items.map((item) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                    deployed: item.deployed ?? 0,
                    shortage: item.shortage ?? 0,
                    needed: item.needed ?? 0,
                    recruitmentProcess: item.recruitmentProcess ?? "",
                    responsible: item.responsible ?? "",
                    cutoffDate: toDateString(item.cutoffDate),
                    remarks: item.remarks ?? "",
                })),
                total: latestSubmission.items.reduce(
                    (sum, item) => sum + (item.shortage ?? 0),
                    0
                ),
            })
        }

        // default fallback: latest submission if exists, else template
        if (latestSubmission) {
            return NextResponse.json({
                success: true,
                submissionId: latestSubmission.id,
                siteName: site.siteName,
                startDate: toDateString(site.startDate),
                lastRenewalDate: toDateString(site.lastRenewalDate),
                nextRenewalDate: toDateString(site.nextRenewalDate),
                siteCategory: site.siteCategory ?? "",
                siteRemark: site.siteRemark ?? "",
                submittedAt: toDateString(latestSubmission.submittedAt),
                manpowerList: latestSubmission.items.map((item) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                    deployed: item.deployed ?? 0,
                    shortage: item.shortage ?? 0,
                    needed: item.needed ?? 0,
                    recruitmentProcess: item.recruitmentProcess ?? "",
                    responsible: item.responsible ?? "",
                    cutoffDate: toDateString(item.cutoffDate),
                    remarks: item.remarks ?? "",
                })),
            })
        }

        return NextResponse.json({
            success: true,
            siteName: site.siteName,
            startDate: toDateString(site.startDate),
            lastRenewalDate: toDateString(site.lastRenewalDate),
            nextRenewalDate: toDateString(site.nextRenewalDate),
            siteCategory: site.siteCategory ?? "",
            siteRemark: site.siteRemark ?? "",
            manpowerList: site.manpowerTemplate.map((item) => ({
                designation: item.designation,
                authorised: item.authorised,
            })),
        })
    } catch (error) {
        console.error("Manpower GET API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load manpower data" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const role = String(body.role || "")
        const siteName = String(body.siteName || "").trim()

        if (!role || !siteName) {
            return NextResponse.json(
                { success: false, message: "role and siteName are required" },
                { status: 400 }
            )
        }

        // LEVEL 1: create site + master manpower template once
        if (role === "level1") {
            const manpowerList = Array.isArray(body.manpowerList) ? body.manpowerList : []

            if (!body.startDate) {
                return NextResponse.json(
                    { success: false, message: "Start date is required" },
                    { status: 400 }
                )
            }

            if (!manpowerList.length) {
                return NextResponse.json(
                    { success: false, message: "At least one manpower row is required" },
                    { status: 400 }
                )
            }

            const existingSite = await prisma.wmSite.findUnique({
                where: { siteName },
            })

            if (existingSite) {
                return NextResponse.json(
                    { success: false, message: "Site already exists" },
                    { status: 400 }
                )
            }

            await prisma.wmSite.create({
                data: {
                    siteName,
                    startDate: parseDate(body.startDate),
                    lastRenewalDate: parseDate(body.lastRenewalDate),
                    nextRenewalDate: parseDate(body.nextRenewalDate),
                    siteCategory: body.siteCategory
                        ? String(body.siteCategory).toUpperCase()
                        : null,
                    siteRemark: body.siteRemark || null,
                    manpowerTemplate: {
                        create: manpowerList.map((item: any) => ({
                            designation: String(item.designation || "").trim(),
                            authorised: Number(item.authorised || 0),
                        })),
                    },
                },
            })

            return NextResponse.json({
                success: true,
                message: "Level 1 data saved successfully",
            })
        }

        // LEVEL 2: create NEW daily submission document every time
        if (role === "level2") {
            const site = await prisma.wmSite.findUnique({
                where: { siteName },
                include: {
                    manpowerTemplate: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            })

            if (!site) {
                return NextResponse.json(
                    { success: false, message: "Site not found" },
                    { status: 404 }
                )
            }

            const manpowerList = Array.isArray(body.manpowerList) ? body.manpowerList : []

            if (!manpowerList.length) {
                return NextResponse.json(
                    { success: false, message: "At least one manpower row is required" },
                    { status: 400 }
                )
            }

            const templateMap = new Map(
                site.manpowerTemplate.map((item) => [item.designation, item])
            )

            const submission = await prisma.wmManpowerSubmission.create({
                data: {
                    siteId: site.id,
                    submittedByRole: "level2",
                    submittedAt: new Date(),
                    items: {
                        create: manpowerList.map((item: any) => {
                            const template = templateMap.get(String(item.designation || "").trim())

                            return {
                                designation: String(item.designation || "").trim(),
                                authorised: template?.authorised ?? Number(item.authorised || 0),
                                deployed: Number(item.deployed || 0),
                                shortage: Number(item.shortage || 0),
                                needed: Number(item.needed ?? 0), // ✅ ADD HERE
                            }
                        }),
                    },
                },
                include: {
                    items: true,
                },
            })

            return NextResponse.json({
                success: true,
                message: "Level 2 data saved successfully",
                submissionId: submission.id,
            })
        }

        // LEVEL 3: update existing HR2-created submission
        if (role === "level3") {
            const submissionId = String(body.submissionId || "").trim()
            const manpowerList = Array.isArray(body.manpowerList) ? body.manpowerList : []

            if (!submissionId) {
                return NextResponse.json(
                    { success: false, message: "submissionId is required for level3" },
                    { status: 400 }
                )
            }

            const submission = await prisma.wmManpowerSubmission.findUnique({
                where: { id: submissionId },
                include: { items: true, site: true },
            })

            if (!submission) {
                return NextResponse.json(
                    { success: false, message: "Submission not found" },
                    { status: 404 }
                )
            }

            for (const item of manpowerList) {
                const existing = submission.items.find(
                    (m) => m.designation === item.designation
                )

                if (existing) {
                    await prisma.wmManpowerSubmissionItem.update({
                        where: { id: existing.id },
                        data: {
                            recruitmentProcess: item.recruitmentProcess || null,
                            responsible: item.responsible || null,
                            cutoffDate: parseDate(item.cutoffDate),
                            remarks: item.remarks || null,
                        },
                    })
                }
            }

            return NextResponse.json({
                success: true,
                message: "Level 3 data saved successfully",
            })
        }

        return NextResponse.json(
            { success: false, message: "Invalid role" },
            { status: 400 }
        )
    } catch (error) {
        console.error("Manpower POST API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to save manpower data" },
            { status: 500 }
        )
    }
}