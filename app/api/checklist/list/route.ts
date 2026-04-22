import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

function normalizeValue(v: any) {
    if (!v) return ""

    const val = v.toString().trim().toLowerCase()

    if (["yes", "1", "done", "completed"].includes(val)) return "yes"
    if (["no", "0", "not done"].includes(val)) return "no"

    if (["good", "satisfactory"].includes(val)) return "good"
    if (["poor", "bad"].includes(val)) return "poor"

    return ""
}

function calcScoreFromAnswers(answers: any[]) {
    let total = 0
    let good = 0

    for (const ans of answers) {
        const val = normalizeValue(ans.answerValue)
        if (!val) continue

        total++
        if (val === "yes" || val === "good") good++
    }

    return total ? Math.round((good / total) * 100) : 0
}

function getStatus(score: number) {
    if (score >= 80) return "Good"
    if (score >= 50) return "Average"
    return "Critical"
}

export async function GET() {
    try {
        const submissions = await prisma.checklistSubmission.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                answers: true,
            },
        })

        const data = submissions.map((item: any) => {
            const score = calcScoreFromAnswers(item.answers)

            return {
                id: item.id,
                supervisorName: item.supervisorName,
                date: formatDate(item.date),
                time: item.timeText || "",
                siteName: item.siteName || item.telephonicSiteName || "-",
                siteVisitConducted: item.siteVisitConducted || "-",
                telephonicCalling: item.telephonicCalling || "-",
                score,
                status: getStatus(score),
                createdAt: item.createdAt,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error("Checklist list API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load checklist submissions" },
            { status: 500 }
        )
    }
}