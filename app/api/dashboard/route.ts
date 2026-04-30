import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ChecklistSubmission, ChecklistAnswer } from "@prisma/client"

// ✅ ADD THIS LINE HERE
export const dynamic = "force-dynamic"
export const revalidate = 0

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

function calcSectionScore(answers: any[], sectionName: string) {
  const sectionAnswers = answers.filter((a) => a.sectionName === sectionName)

  let total = 0
  let good = 0

  for (const ans of sectionAnswers) {
    const val = normalizeValue(ans.answerValue)
    if (!val) continue

    total++
    if (val === "yes" || val === "good") good++
  }

  return total ? Math.round((good / total) * 100) : null
}

function calcFinalScore(submission: any) {
  const answers = submission.answers

  const communicationScore = calcSectionScore(answers, "Communication")
  const siteVisitScore =
    submission.siteVisitConducted === "Yes"
      ? calcSectionScore(answers, "Site Visit")
      : null

  const telephonicScore =
    submission.telephonicCalling === "Yes"
      ? calcSectionScore(answers, "Telephonic")
      : null

  const storeScore = calcSectionScore(answers, "Store")

  let totalWeight = 0
  let finalScore = 0

  // 🔥 WEIGHTS (you can tweak later)
  if (communicationScore !== null) {
    finalScore += communicationScore * 0.3
    totalWeight += 0.3
  }

  if (siteVisitScore !== null) {
    finalScore += siteVisitScore * 0.4
    totalWeight += 0.4
  }

  if (telephonicScore !== null) {
    finalScore += telephonicScore * 0.2
    totalWeight += 0.2
  }

  if (storeScore !== null) {
    finalScore += storeScore * 0.1
    totalWeight += 0.1
  }

  finalScore = totalWeight ? Math.round(finalScore / totalWeight) : 0

  return {
    finalScore,
    communicationScore,
    siteVisitScore,
    telephonicScore,
    storeScore,
  }
}

function getStatus(score: number) {
  if (score >= 80) return "Good"
  if (score >= 50) return "Average"
  return "Critical"
}

function getBestSiteName(submission: any) {
  if (submission.siteName) return submission.siteName
  if (submission.telephonicSiteName) return submission.telephonicSiteName
  if (submission.siteVisitConducted === "No") return "No Site Visit"
  if (submission.telephonicCalling === "No") return "No Telephonic Contact"
  return "General Submission"
}

export async function GET() {
  try {
    const submissions = await prisma.checklistSubmission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        answers: true,
      },
    })

    const allRows = submissions.map((submission) => {
      const scoreData = calcFinalScore(submission)
      const site = getBestSiteName(submission)
      const safeDate = formatDate(submission.date) || formatDate(submission.createdAt)

      const issueTags: string[] = []

      submission.answers.forEach((ans: any) => {
        const qRaw = ans.questionText
        const vRaw = ans.answerValue

        const q = (qRaw || "").toLowerCase().trim()
        const val = normalizeValue(vRaw)

        console.log("---- DEBUG ----")
        console.log("QUESTION:", qRaw)
        console.log("NORMALIZED Q:", q)
        console.log("VALUE:", vRaw)
        console.log("NORMALIZED VALUE:", val)

        // ✅ EMAIL PENDING > 24h
        if
          (q === "pendingemails" &&
          val === "yes"
        ) {
          issueTags.push("Emails Pending > 24h")
        }

        // ✅ REPEAT COMPLAINT
        if (q === "repeatcomplaint" && val === "yes") {
          issueTags.push("Repeat Complaint")
        }

        // ✅ COMPLAINT NOT RESOLVED
        if (
          (q.includes("complaint resolved") || q.includes("resolved")) &&
          val === "no"
        ) {
          issueTags.push("Complaint Not Resolved")
        }



        // ✅ MANPOWER SHORTAGE
        if (
          (q.includes("manpower shortage") || q.includes("shortfall")) &&
          val === "yes"
        ) {
          issueTags.push("Manpower Shortage")
        }

        // ✅ REPLACEMENT NOT ARRANGED
        if (
          (q.includes("replacement arranged") || q.includes("replacement")) &&
          val === "no"
        ) {
          issueTags.push("Replacement Not Arranged")
        }

        // ✅ HIRING REQUEST
        if (
          (q.includes("hiring request") || q.includes("request raised")) &&
          val === "yes"
        ) {
          issueTags.push("Hiring Request Raised")
        }

        // ✅ SAFETY RISK
        if (
          (q.includes("safety risk") || q.includes("risk")) &&
          val === "yes"
        ) {
          issueTags.push("Safety Risk")
        }
      })

      return {
        id: submission.id,
        supervisorName: submission.supervisorName,
        date: safeDate,
        time: submission.timeText || "",
        site,

        answers: submission.answers, // ✅ ADD THIS

        score: scoreData.finalScore,
        status: getStatus(scoreData.finalScore),

        communicationScore: scoreData.communicationScore,
        siteVisitScore: scoreData.siteVisitScore,
        telephonicScore: scoreData.telephonicScore,
        storeScore: scoreData.storeScore,

        siteVisitConducted: submission.siteVisitConducted || "",
        telephonicCalling: submission.telephonicCalling || "",

        issueTags,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      }
    })

    const compliance = {
      good: allRows.filter((r) => r.score >= 80).length,
      avg: allRows.filter((r) => r.score >= 50 && r.score < 80).length,
      critical: allRows.filter((r) => r.score < 50).length,
    }

    const submissionMap: Record<string, number> = {}
    allRows.forEach((row) => {
      const safeDate = row.date || formatDate(row.createdAt)
      submissionMap[safeDate] = (submissionMap[safeDate] || 0) + 1
    })

    const submissionData = Object.entries(submissionMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, count]) => ({
        date,
        count,
      }))

    const supervisorMap: Record<string, number[]> = {}
    allRows.forEach((row) => {
      if (!supervisorMap[row.supervisorName]) supervisorMap[row.supervisorName] = []
      supervisorMap[row.supervisorName].push(row.score)
    })

    const supervisorPerf = Object.entries(supervisorMap)
      .map(([name, scores]) => ({
        name,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.score - a.score)

    const siteMap: Record<string, number[]> = {}
    allRows.forEach((row) => {
      if (!siteMap[row.site]) siteMap[row.site] = []
      siteMap[row.site].push(row.score)
    })

    const sitePerf = Object.entries(siteMap)
      .map(([site, scores]) => ({
        site,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.score - a.score)

    const trendMap: Record<string, { total: number; count: number }> = {}
    allRows.forEach((row) => {
      const safeDate = row.date || formatDate(row.createdAt)
      if (!trendMap[safeDate]) {
        trendMap[safeDate] = { total: 0, count: 0 }
      }
      trendMap[safeDate].total += row.score
      trendMap[safeDate].count += 1
    })

    const trendData = Object.entries(trendMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, val]) => ({
        date,
        score: Math.round(val.total / val.count),
      }))

    const issueMap: Record<string, number> = {
      "Emails Pending > 24h": 0,
      "Repeat Complaint": 0,
      "Complaint Not Resolved": 0,
      "Manpower Shortage": 0,
      "Replacement Not Arranged": 0,
      "Hiring Request Raised": 0,
      "Safety Risk": 0,
    }

    allRows.forEach((row) => {
      row.issueTags?.forEach((label: string) => {
        issueMap[label] = (issueMap[label] || 0) + 1
      })
    })

    const topIssues = Object.entries(issueMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)


    return NextResponse.json({
      success: true,
      totalSubmissions: allRows.length,
      avgScore: allRows.length
        ? Math.round(allRows.reduce((a, b) => a + b.score, 0) / allRows.length)
        : 0,
      compliance,
      submissionData,
      supervisorPerf,
      sitePerf,
      trendData,
      topIssues,
      recentSubmissions: allRows,
      allSites: Array.from(
        new Set(allRows.map((r) => r.site).filter(Boolean))
      ),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}