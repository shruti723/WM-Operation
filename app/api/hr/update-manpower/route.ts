import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function parseDate(value: string | null | undefined) {
    if (!value) return null

    // ✅ if coming from input type="date"
    if (value.includes("-") && value.split("-")[0].length === 4) {
        return new Date(value) // yyyy-mm-dd
    }

    // ✅ fallback for dd-mm-yyyy
    const parts = value.split("-")
    if (parts.length !== 3) return null

    const [day, month, year] = parts
    return new Date(`${year}-${month}-${day}`)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const submissionId = String(body.submissionId || "").trim()
        const manpowerList = Array.isArray(body.manpowerList) ? body.manpowerList : []
        const role = body.role
        const siteName = String(body.siteName || "").trim()
        const siteType = body.siteType

        console.log("👉 Incoming siteType from frontend:", siteType)

        const startDate = body.startDate
        const lastRenewalDate = body.lastRenewalDate
        const nextRenewalDate = body.nextRenewalDate

        const siteCategory = body.siteCategory
        const siteRemark = body.siteRemark

        // =========================
        // 🆕 HR1 (NO SUBMISSION) → UPDATE SITE + TEMPLATE
        // =========================
        if (role === "level1" && !submissionId) {

            const site = await prisma.site.findUnique({
                where: { siteName },
                include: { manpowerTemplate: true },
            })

            if (!site) {
                return NextResponse.json(
                    { success: false, message: "Site not found" },
                    { status: 404 }
                )
            }

            // ✅ Update site fields
            await prisma.site.update({
                where: { id: site.id },
                data: {
                    ...(startDate ? { startDate: parseDate(startDate) } : {}),
                    ...(lastRenewalDate ? { lastRenewalDate: parseDate(lastRenewalDate) } : {}),
                    ...(nextRenewalDate ? { nextRenewalDate: parseDate(nextRenewalDate) } : {}),
                    ...(siteType ? { siteType } : {}),

                    ...(siteCategory !== undefined
                        ? { siteCategory: siteCategory ? String(siteCategory).toUpperCase() : null }
                        : {}),

                    ...(siteRemark !== undefined
                        ? { siteRemark: siteRemark ? String(siteRemark).trim() : null }
                        : {}),
                },
            })

            // ✅ Replace manpower template (clean approach)
            await prisma.siteManpower.deleteMany({
                where: { siteId: site.id },
            })

            await prisma.siteManpower.createMany({
                data: manpowerList.map((item: any) => ({
                    siteId: site.id,
                    designation: item.designation,
                    authorised: Number(item.authorised || 0),
                })),
            })

            return NextResponse.json({
                success: true,
                message: "Site updated successfully",
            })
        }

        let submission = null

        if (submissionId) {
            submission = await prisma.manpowerSubmission.findUnique({
                where: { id: submissionId },
                include: { items: true, site: true },
            })
        }

        if (submissionId && !submission) {
            return NextResponse.json(
                { success: false, message: "Submission not found" },
                { status: 404 }
            )
        }

        const safeSubmission = submission as NonNullable<typeof submission>

        /* =========================
     ✅ 1. UPDATE SITE DATES (ONLY HR1)
  ========================= */
        if (role === "level1" && submissionId) {
            await prisma.site.update({
                where: { id: safeSubmission.siteId },
                data: {
                    ...(startDate ? { startDate: parseDate(startDate) } : {}),
                    ...(lastRenewalDate ? { lastRenewalDate: parseDate(lastRenewalDate) } : {}),
                    ...(nextRenewalDate ? { nextRenewalDate: parseDate(nextRenewalDate) } : {}),
                    ...(siteType ? { siteType } : {}),
                    ...(siteCategory !== undefined
                        ? { siteCategory: siteCategory ? String(siteCategory).toUpperCase() : null }
                        : {}),
                    ...(siteRemark !== undefined
                        ? { siteRemark: siteRemark ? String(siteRemark).trim() : null }
                        : {}),
                },
            })
            const updatedSite = await prisma.site.findUnique({
                where: { id: safeSubmission.siteId },
            })

        }

        /* =========================
           ✅ 2. DELETE REMOVED ROWS
        ========================== */
        const incomingDesignations = manpowerList.map((i: any) => i.designation)

        if (role === "level1" || role === "level2") {
            for (const existing of safeSubmission.items) {
                if (!incomingDesignations.includes(existing.designation)) {
                    await prisma.manpowerSubmissionItem.delete({
                        where: { id: existing.id },
                    })
                }
            }
        }

        /* =========================
           ✅ 3. UPDATE + CREATE ROWS
        ========================== */
        for (const item of manpowerList) {
            const existing = safeSubmission.items.find(
                (m) => m.designation === item.designation
            )

            if (existing) {
                // ✅ UPDATE
                // 🔵 HR1 → FULL CONTROL (authorised + designation)
                if (role === "level1") {
                    await prisma.manpowerSubmissionItem.update({
                        where: { id: existing.id },
                        data: {
                            designation: item.designation,
                            authorised: Number(item.authorised || 0),
                        },
                    })
                }
                if (existing) {

                    // 🔵 HR2 → manpower update
                    if (role === "level2") {
                        await prisma.manpowerSubmissionItem.update({
                            where: { id: existing.id },
                            data: {
                                designation: item.designation,
                                authorised: Number(item.authorised || 0),
                                deployed: Number(item.deployed || 0),
                                needed: Number(item.needed || 0),
                                shortage: Number(item.authorised || 0) - Number(item.deployed || 0),
                            }
                        })
                    }

                    // 🟣 HR3 → only recruitment update
                    if (role === "level3") {
                        await prisma.manpowerSubmissionItem.update({
                            where: { id: existing.id },
                            data: {
                                recruitmentProcess: item.recruitmentProcess || null,
                                responsible: item.responsible || null,
                                cutoffDate: parseDate(item.cutoffDate),
                                remarks: item.remarks || null,
                            }
                        })
                    }
                }
            } else {

                // 🔵 HR1 → CREATE NEW ROW
                if (role === "level1") {
                    await prisma.manpowerSubmissionItem.create({
                        data: {
                            submissionId,
                            designation: item.designation,
                            authorised: Number(item.authorised || 0),
                        },
                    })
                }

                continue
            }
        }

        return NextResponse.json({
            success: true,
            message: "Updated successfully",
        })

    } catch (error) {
        console.error("Update manpower API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to update manpower" },
            { status: 500 }
        )
    }
}