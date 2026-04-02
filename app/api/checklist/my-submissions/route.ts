import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

function normalizeValue(v: any) {
    if (!v) return ""
    const val = String(v).trim().toLowerCase()

    if (["yes", "1", "done", "completed"].includes(val)) return "yes"
    if (["no", "0", "not done"].includes(val)) return "no"
    if (["good", "satisfactory"].includes(val)) return "good"
    if (["poor", "bad"].includes(val)) return "poor"

    return ""
}

function calcScore(answers: any[]) {
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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const supervisorName = searchParams.get("supervisorName")

        if (!supervisorName) {
            return NextResponse.json(
                { success: false, message: "supervisorName is required" },
                { status: 400 }
            )
        }

        const submissions = await prisma.checklistSubmission.findMany({
            where: {
                supervisorName,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                answers: true,
                comments: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        const data = submissions.map((item) => {
            const score = calcScore(item.answers)
            return {
                id: item.id,
                date: formatDate(item.date),
                time: item.timeText || "",
                site:
                    item.siteName ||
                    item.telephonicSiteName ||
                    "General Submission",
                supervisorName: item.supervisorName,
                siteVisitConducted: item.siteVisitConducted || "",
                telephonicCalling: item.telephonicCalling || "",
                score,
                status: getStatus(score),
                commentCount: item.comments.length,
                latestComment:
                    item.comments.length > 0
                        ? item.comments[item.comments.length - 1].message
                        : "",
                submittedAt: item.createdAt,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error("My submissions API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load submissions" },
            { status: 500 }
        )
    }
}