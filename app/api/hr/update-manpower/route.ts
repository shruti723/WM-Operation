import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function parseDate(value: string | null | undefined) {
    if (!value) return null
    return new Date(value)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const submissionId = String(body.submissionId || "").trim()
        const manpowerList = Array.isArray(body.manpowerList) ? body.manpowerList : []

        if (!submissionId) {
            return NextResponse.json(
                { success: false, message: "submissionId is required" },
                { status: 400 }
            )
        }

        if (!manpowerList.length) {
            return NextResponse.json(
                { success: false, message: "Manpower list is required" },
                { status: 400 }
            )
        }

        const submission = await prisma.manpowerSubmission.findUnique({
            where: { id: submissionId },
            include: { items: true },
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
                await prisma.manpowerSubmissionItem.update({
                    where: { id: existing.id },
                    data: {
                        needed: Number(item.needed || 0),
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
            message: "Saved successfully",
        })
    } catch (error) {
        console.error("Update manpower API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to update manpower" },
            { status: 500 }
        )
    }
}