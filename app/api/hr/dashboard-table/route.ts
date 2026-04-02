import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

export async function GET() {
    try {
        const submissions = await prisma.manpowerSubmission.findMany({
            orderBy: { submittedAt: "desc" },
            include: {
                site: true,
                items: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        const data = submissions.map((submission) => {
            const manpowerList = submission.items.map((item) => ({
                designation: item.designation,
                authorised: item.authorised,
                deployed: item.deployed ?? 0,
                shortage: item.shortage ?? 0,
                needed: item.needed ?? 0,
                recruitmentProcess: item.recruitmentProcess ?? "",
                responsible: item.responsible ?? "",
                cutoffDate: formatDate(item.cutoffDate),
                remarks: item.remarks ?? "",
            }))

            const hasRecruitmentData = submission.items.some(
                (item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
            )

            return {
                submissionId: submission.id,
                site: submission.site.siteName,
                createdOn: formatDate(submission.submittedAt),
                updated: formatDate(submission.updatedAt),
                lastRenewalDate: formatDate(submission.site.lastRenewalDate),
                nextRenewalDate: formatDate(submission.site.nextRenewalDate),
                status: hasRecruitmentData ? "Completed" : "Pending Level 3",
                designation: manpowerList,
                manpowerList,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error("Dashboard table API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load dashboard table" },
            { status: 500 }
        )
    }
}