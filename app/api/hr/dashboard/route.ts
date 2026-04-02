import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const totalSites = await prisma.site.count()

        const submissions = await prisma.manpowerSubmission.findMany({
            include: {
                items: true,
            },
        })

        const submitted = submissions.length

        const completed = submissions.filter((submission) =>
            submission.items.some(
                (item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
            )
        ).length

        const pending = submissions.filter((submission) =>
            !submission.items.some(
                (item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
            )
        ).length

        const today = new Date()

        const overdue = submissions.filter((submission) => {
            const hasRecruitmentData = submission.items.some(
                (item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
            )

            if (hasRecruitmentData) return false

            const deadline = new Date(submission.submittedAt)
            deadline.setDate(deadline.getDate() + 1)

            return deadline < today
        }).length

        return NextResponse.json({
            totalSites,
            submitted,
            pending,
            overdue,
            completed,
        })
    } catch (error) {
        console.error("HR dashboard API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load HR dashboard" },
            { status: 500 }
        )
    }
}