import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {

        // ========================
        // 🔵 ROLE
        // ========================
        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role")

        // ========================
        // 🔵 MANPOWER VARIABLES
        // ========================
        let totalSites = 0
        let submitted = 0
        let pending = 0
        let overdue = 0
        let completed = 0

        // ========================
        // 🔵 HR1 → SITE TABLE
        // ========================
        if (role === "level1") {

            const sites = await prisma.site.findMany()

            totalSites = sites.length

            completed = sites.filter(
                (s) => s.startDate && s.lastRenewalDate && s.nextRenewalDate
            ).length

            pending = totalSites - completed

            submitted = totalSites
        }

        // ========================
        // 🟣 HR2 / HR3 → SUBMISSION TABLE
        // ========================
        else {

            const submissions = await prisma.manpowerSubmission.findMany({
                orderBy: { submittedAt: "desc" },
                include: {
                    site: true,
                    items: true,
                },
            })

            totalSites = await prisma.site.count()

            submitted = submissions.length

            completed = submissions.filter((submission) =>
                submission.items.some((item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
                )
            ).length

            pending = submissions.length - completed

            const today = new Date()

            overdue = submissions.filter((submission) => {
                const hasData = submission.items.some((item) =>
                    (item.needed ?? 0) > 0 ||
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
                )

                if (hasData) return false

                const deadline = new Date(submission.submittedAt)
                deadline.setDate(deadline.getDate() + 1)

                return deadline < today
            }).length
        }

        // ========================
        // 🟡 FINANCE DATA
        // ========================

        const financeRecords = await prisma.financeRecord.findMany()

        let totalRecords = financeRecords.length
        let pendingA1 = 0
        let pendingHR2 = 0
        let completedFinance = 0

        financeRecords.forEach((row) => {
            if (row.status === "completed") {
                completedFinance++
            } else if (row.status === "pending" && row.currentStage === "account1") {
                pendingA1++
            } else if (row.status === "pending" && row.currentStage === "level2") {
                pendingHR2++
            }
        })

        // ========================
        // RESPONSE
        // ========================

        return NextResponse.json({
            manpower: {
                totalSites,
                submitted,
                pending,
                overdue,
                completed,
            },
            finance: {
                totalRecords,
                pendingA1,
                pendingHR2,
                completedFinance
            }
        })

    } catch (error) {
        console.error("Dashboard error:", error)
        return NextResponse.json(
            { success: false },
            { status: 500 }
        )
    }
}