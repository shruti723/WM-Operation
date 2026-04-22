import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: any) {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
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
        const email = searchParams.get("email")

        console.log("👉 Incoming email:", email)
        const user = await prisma.user.findUnique({
            where: { email: email?.toLowerCase() || "" },
        })

        console.log("👉 User from DB:", user)

        let possibleNames: string[] = []

        if (user?.name) {
            possibleNames.push(user.name.trim())
        }

        // 🔥 auto-handle old data (important logic)
        const oldNameFromEmail = email?.split("@")[0] // nitesh@fm.com → nitesh

        if (oldNameFromEmail) {
            possibleNames.push(
                oldNameFromEmail.charAt(0).toUpperCase() + oldNameFromEmail.slice(1)
            )
        }

        console.log("👉 possibleNames:", possibleNames)

        if (!email) {
            return NextResponse.json(
                { success: false, message: "email is required" },
                { status: 400 }
            )
        }

        const submissions = await prisma.checklistSubmission.findMany({
            where: {
                supervisorName: {
                    in: possibleNames,
                    mode: "insensitive",
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                answers: true,
                comments: {
                    orderBy: { createdAt: "asc" },
                },
                issues: true, // ✅ IMPORTANT (we need this)
            },
        })


        // 🔥 STEP 1: detect repeat sites
        const siteCountMap: Record<string, number> = {}

        submissions.forEach((item: any) => {
            const site =
                item.siteName ||
                item.telephonicSiteName ||
                "General Submission"

            siteCountMap[site] = (siteCountMap[site] || 0) + 1
        })

        // 🔥 STEP 2: build response
        const data = submissions.map((item: any) => {
            const score = calcScore(item.answers || [])

            const site =
                item.siteName ||
                item.telephonicSiteName ||
                "General Submission"

            // const issues = item.issues || []

            // const openIssues = issues.filter(i => i.status === "open")
            // const resolvedIssues = issues.filter(i => i.status === "resolved")
            const answers = item.answers || []



            const siteVisitMissed = item.siteVisitConducted?.toLowerCase() === "no"

            const telephonicOnly = item.telephonicCalling?.toLowerCase() === "yes"


            const totalIssues = item.issues?.length || 0
            const issueTags: string[] = []

            answers.forEach((ans: any) => {
                const q = (ans.questionText || "").toLowerCase().trim()
                const val = (ans.answerValue || "").toLowerCase().trim()

                // ✅ EMAIL PENDING
                if (q === "pendingemails" && val === "yes") {
                    issueTags.push("Emails Pending > 24h")
                }

                // ✅ REPEAT COMPLAINT (COUNT > 0)
                if (q === "repeatcomplaintcount" && Number(val) > 0) {
                    issueTags.push("Repeat Complaint")
                }

                // ✅ NOT RESOLVED
                if (q === "complaintresolved" && val === "no") {
                    issueTags.push("Complaint Not Resolved")
                }

                // ✅ URGENT ISSUE
                if (q === "urgentissue" && val === "yes") {
                    issueTags.push("Urgent Issue")
                }

                // ✅ MANPOWER
                if (q === "manpowershortage" && val === "yes") {
                    issueTags.push("Manpower Shortage")
                }

                // ✅ REPLACEMENT
                if (q === "replacementarranged" && val === "no") {
                    issueTags.push("Replacement Not Arranged")
                }

                // ✅ HIRING
                if (q === "hiringrequest" && val === "yes") {
                    issueTags.push("Hiring Request Raised")
                }

                // ✅ SAFETY
                if (q === "safetyrisk" && val === "yes") {
                    issueTags.push("Safety Risk")
                }
            })

            const summary = {
                totalIssues: issueTags.length,
                openIssues: issueTags.length,
                resolvedIssues: 0,

                isRepeat: siteCountMap[site] > 1,

                issueTags,
            }


            return {
                id: item.id,
                date: formatDate(item.date),
                time: item.timeText || "",
                site,
                supervisorName: item.supervisorName,
                siteVisitConducted: item.siteVisitConducted || "",
                telephonicCalling: item.telephonicCalling || "",
                score,
                status: issueTags.length > 0 ? "needs_action" : "completed",

                summary, // ✅ NEW

                commentCount: item.comments?.length || 0,
                latestComment:
                    item.comments?.length
                        ? item.comments[item.comments.length - 1].message
                        : "",
                submittedAt: item.createdAt,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error: any) {
        console.error("❌ FULL ERROR:", error)
        console.error("❌ STACK:", error?.stack)

        return NextResponse.json(
            { success: false, message: error?.message || "Server Error" },
            { status: 500 }
        )
    }
}