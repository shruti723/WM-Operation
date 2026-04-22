import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checklistQuestions } from "@/lib/checklistQuestions"



function formatDate(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}
function getQuestionText(questionId?: string | null, fallback?: string | null) {
    if (!questionId) return fallback || "-"

    // ✅ SPECIAL CASE FIX (ONLY ADD THIS BLOCK)
    if (questionId === "repeatComplaintSite") {
        return "Complaint Site Name"
    }

    if (questionId === "repeatComplaintCount") {
        return "Number of repeat complaints"
    }

    // existing logic
    const allQuestions = Object.values(checklistQuestions).flat()

    const found = allQuestions.find((q: any) => q.id === questionId)

    return found?.question || fallback || questionId
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

                answers: submission.answers.map((a: any) => ({
                    id: a.id,
                    sectionName: a.sectionName,
                    source: a.source,
                    questionId: a.questionId,
                    questionText: getQuestionText(a.questionId, a.questionText),
                    answerValue: a.answerValue,
                    answerReason: a.answerReason,
                    siteContext: a.siteContext,
                    createdAt: a.createdAt,
                })),

                comments: submission.comments.map((c: any) => ({
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
