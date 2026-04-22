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

        const startDate = body.startDate
        const lastRenewalDate = body.lastRenewalDate
        const nextRenewalDate = body.nextRenewalDate

        if (!submissionId) {
            return NextResponse.json(
                { success: false, message: "submissionId is required" },
                { status: 400 }
            )
        }

        const submission = await prisma.manpowerSubmission.findUnique({
            where: { id: submissionId },
            include: { items: true, site: true },
        })

        if (!submission) {
            return NextResponse.json(
                { success: false, message: "Submission not found" },
                { status: 404 }
            )
        }

        /* =========================
     ✅ 1. UPDATE SITE DATES (ONLY HR1)
  ========================= */
        if (role === "level1") {
            await prisma.site.update({
                where: { id: submission.siteId },
                data: {
                    ...(startDate ? { startDate: parseDate(startDate) } : {}),
                    ...(lastRenewalDate ? { lastRenewalDate: parseDate(lastRenewalDate) } : {}),
                    ...(nextRenewalDate ? { nextRenewalDate: parseDate(nextRenewalDate) } : {}),
                },
            })
        }

        /* =========================
           ✅ 2. DELETE REMOVED ROWS
        ========================== */
        const incomingDesignations = manpowerList.map((i: any) => i.designation)

        if (role === "level1" || role === "level2") {
            for (const existing of submission.items) {
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
            const existing = submission.items.find(
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