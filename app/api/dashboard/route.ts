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

function getBestSiteName(submission: any) {
  if (submission.siteName) return submission.siteName
  if (submission.telephonicSiteName) return submission.telephonicSiteName
  if (submission.siteVisitConducted === "No") return "No Site Visit"
  if (submission.telephonicCalling === "No") return "No Telephonic Contact"
  return "General Submission"
}

const issueLabelMap: Record<string, string> = {
  pendingEmails: "Pending Emails",
  repeatComplaint: "Repeat Complaint",
  complaintResolved: "Complaint Not Resolved",
  manpowerShortage: "Manpower Shortage",
  replacementArranged: "Replacement Not Arranged",
  cleaningScheduleFollowed: "Cleaning Schedule Not Followed",
  toiletsCleaned: "Toilets Not Cleaned",
  garbageDisposal: "Garbage Disposal Delay",
  machinesWorking: "Machines Not Working",
  stockRegisterUpdated: "Stock Register Not Updated",
  safetyRisk: "Safety Risk",
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
      const score = calcScore(submission.answers)
      const site = getBestSiteName(submission)
      const safeDate = formatDate(submission.date) || formatDate(submission.createdAt)

      return {
        id: submission.id,
        supervisorName: submission.supervisorName,
        date: safeDate,
        time: submission.timeText || "",
        site,
        score,
        status: getStatus(score),
        siteVisitConducted: submission.siteVisitConducted || "",
        telephonicCalling: submission.telephonicCalling || "",
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        answers: submission.answers,
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

    const issueMap: Record<string, number> = {}

    submissions.forEach((submission) => {
      submission.answers.forEach((ans) => {
        const key = String(ans.questionId || ans.questionText || "")
        const val = normalizeValue(ans.answerValue)

        const skipKeys = [
          "supervisorName",
          "date",
          "time",
          "siteVisit",
          "siteName",
          "telephonicCalling",
          "telephonicSiteName",
          "telephonicIncharge",
        ]

        if (skipKeys.includes(key)) return

        const isIssue =
          val === "poor" ||
          val === "no" ||
          (String(ans.answerValue).trim().toLowerCase() === "yes" &&
            ["pendingEmails", "repeatComplaint", "manpowerShortage", "safetyRisk"].includes(key))

        if (!isIssue) return

        const label = issueLabelMap[key] || ans.questionText
        issueMap[label] = (issueMap[label] || 0) + 1
      })
    })

    const topIssues = Object.entries(issueMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

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
      allSites: Array.from(new Set(allRows.map((r) => r.site).filter(Boolean))),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}