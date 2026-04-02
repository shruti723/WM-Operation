import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const submission = await prisma.checklistSubmission.findUnique({
            where: { id: params.id },
            include: {
                answers: {
                    orderBy: { createdAt: "asc" },
                },
                comments: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        if (!submission) {
            return NextResponse.json(
                { success: false, message: "Submission not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                id: submission.id,
                supervisorName: submission.supervisorName,
                date: formatDate(submission.date),
                time: submission.timeText || "",
                site:
                    submission.siteName ||
                    submission.telephonicSiteName ||
                    "General Submission",
                siteVisitConducted: submission.siteVisitConducted || "",
                siteVisitReason: submission.siteVisitReason || "",
                telephonicCalling: submission.telephonicCalling || "",
                telephonicSiteName: submission.telephonicSiteName || "",
                telephonicIncharge: submission.telephonicIncharge || "",
                createdAt: submission.createdAt,
                updatedAt: submission.updatedAt,

                answers: submission.answers.map((a) => ({
                    id: a.id,
                    sectionName: a.sectionName,
                    source: a.source,
                    questionId: a.questionId,
                    questionText: a.questionText,
                    answerValue: a.answerValue,
                    answerReason: a.answerReason,
                    siteContext: a.siteContext,
                    createdAt: a.createdAt,
                })),

                comments: submission.comments.map((c) => ({
                    id: c.id,
                    authorName: c.authorName,
                    authorRole: c.authorRole,
                    message: c.message,
                    createdAt: c.createdAt,
                })),
            },
        })
    } catch (error) {
        console.error("Checklist detail API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load checklist detail" },
            { status: 500 }
        )
    }
}