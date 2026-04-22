import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""

    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    return `${day}-${month}-${year}`
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role")

        // ========================
        // 🔵 HR1 → SITE TABLE
        // ========================
        if (role === "level1") {

            const submissions = await prisma.manpowerSubmission.findMany({
                orderBy: { submittedAt: "desc" },
                include: {
                    site: true,
                    items: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            })

            // ✅ KEEP ONLY LATEST PER SITE
            const latestMap = new Map()

            for (const sub of submissions) {
                if (!latestMap.has(sub.siteId)) {
                    latestMap.set(sub.siteId, sub)
                }
            }

            const latestSubmissions = Array.from(latestMap.values())

            // ✅ NOW USE THIS
            const data = latestSubmissions.map((submission: any) => ({
                submissionId: submission.id,
                site: submission.site.siteName,

                startDate: formatDate(submission.site.startDate),
                lastRenewalDate: formatDate(submission.site.lastRenewalDate),
                nextRenewalDate: formatDate(submission.site.nextRenewalDate),

                manpowerList: submission.items.map((item: any) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                })),
            }))

            return NextResponse.json({
                success: true,
                data,
            })
        }

        // ========================
        // 🟣 HR2 / HR3 → SUBMISSION TABLE
        // ========================
        // ========================
        // 🟣 HR2 / HR3 → SUBMISSION TABLE
        // ========================
        const submissions = await prisma.manpowerSubmission.findMany({
            orderBy: { submittedAt: "desc" },
            include: {
                site: true,
                items: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        // ✅ CREATE LATEST MAP HERE ALSO
        const latestMap = new Map()

        for (const sub of submissions) {
            if (!latestMap.has(sub.siteId)) {
                latestMap.set(sub.siteId, sub)
            }
        }

        const latestSubmissions = Array.from(latestMap.values())

        // ✅ NOW USE IT
        const data = latestSubmissions.map((submission: any) => {

            let totalDeployed = 0
            let totalNeeded = 0
            let totalAuthorised = 0

            const manpowerList = submission.items.map((item: any) => {

                const authorised = item.authorised ?? 0
                const deployed = item.deployed ?? 0
                const needed = item.needed ?? 0

                totalAuthorised += authorised
                totalDeployed += deployed
                totalNeeded += needed

                return {
                    designation: item.designation,
                    authorised,
                    deployed,
                    shortage: item.shortage ?? (authorised - deployed),
                    needed,
                    recruitmentProcess: item.recruitmentProcess ?? "",
                    responsible: item.responsible ?? "",
                    cutoffDate: item.cutoffDate
                        ? new Date(item.cutoffDate).toISOString().split("T")[0]
                        : "",
                    remarks: item.remarks ?? "",
                }
            })

            return {
                submissionId: submission.id,
                site: submission.site.siteName,

                createdAt: submission.createdAt,

                totalAuthorised, // ✅ THIS WILL NOW WORK
                totalDeployed,
                totalNeeded,

                status:
                    role === "level2"
                        ? "Pending HR3"
                        : submission.items.some((i: any) => i.recruitmentProcess)
                            ? "Completed"
                            : "Pending",

                manpowerList,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })

    } catch (error) {
        console.error("Dashboard API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load dashboard" },
            { status: 500 }
        )
    }
}