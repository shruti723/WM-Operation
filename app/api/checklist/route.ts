import { prisma } from "@/lib/db"

function parseDate(value: string | undefined) {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
}

function detectSource(key: string) {
    const lower = key.toLowerCase()

    if (key === "supervisorName" || key === "date" || key === "time") {
        return "BASIC"
    }

    if (key.startsWith("site_") || key.includes("(Site Visit)")) {
        return "SITE_VISIT"
    }

    if (key.startsWith("telephonic_") || key.includes("(Telephonic)")) {
        return "TELEPHONIC"
    }

    if (
        lower.includes("stockregisterupdated") ||
        lower.includes("openissues") ||
        lower.includes("issuesclosed") ||
        lower.includes("safetyrisk")
    ) {
        return "STORE"
    }

    return "COMMUNICATION"
}

function detectSectionName(source: string) {
    if (source === "BASIC") return "Basic Details"
    if (source === "SITE_VISIT") return "Site Visit"
    if (source === "TELEPHONIC") return "Telephonic"
    if (source === "STORE") return "Store"
    return "Communication"
}

function cleanQuestionText(key: string) {
    return key
        .replace(/^site_/, "")
        .replace(/^telephonic_/, "")
        .replace(" (Site Visit)", "")
        .replace(" (Telephonic)", "")
        .trim()
}

function normalizeAnswer(value: any) {
    if (!value) return ""
    const v = String(value).trim().toLowerCase()

    if (["yes", "done", "completed"].includes(v)) return "yes"
    if (["no", "not done"].includes(v)) return "no"
    if (["good", "satisfactory"].includes(v)) return "good"
    if (["poor", "bad"].includes(v)) return "poor"

    return ""
}

function calculateCounts(answers: any[], section: string) {
    const filtered = answers.filter((a) => a.sectionName === section)

    if (!filtered.length) return null

    let ok = 0
    let issues = 0

    filtered.forEach((a) => {
        const val = normalizeAnswer(a.answerValue)
        const q = a.questionText.toLowerCase()

        // 🔹 Reverse logic questions
        const isReverse =
            q.includes("pending") ||
            q.includes("complaint") ||
            q.includes("issue") ||
            q.includes("risk") ||
            q.includes("delay")

        if (isReverse) {
            if (val === "no") ok++
            else if (val === "yes") issues++
        } else {
            if (val === "yes" || val === "good") ok++
            else if (val === "no" || val === "poor") issues++
        }
    })

    return { ok, issues }
}

// function calculateScore(answers: any[], section: string) {
//     const filtered = answers.filter((a) => a.sectionName === section)

//     if (!filtered.length) return null

//     let total = 0

//     filtered.forEach((a) => {
//         const val = normalizeAnswer(a.answerValue)

//         if (val === "yes" || val === "good") total += 1
//         if (val === "no" || val === "poor") total += 0
//     })

//     return Math.round((total / filtered.length) * 100)
// }

export async function PUT(req: Request) {
    try {
        const data = await req.json()

        console.log("✏️ Update Request:", data)

        const { submissionId, answers } = data

        if (!submissionId || !answers) {
            return Response.json({ success: false, message: "Invalid data" }, { status: 400 })
        }

        // 🔹 Update each answer
        for (const ans of answers) {
            await prisma.checklistAnswer.update({
                where: { id: ans.id },
                data: {
                    answerValue: ans.answerValue,
                    answerReason: ans.answerReason || null,
                },
            })
        }

        return Response.json({ success: true })

    } catch (err: any) {
        console.error("❌ UPDATE ERROR:", err)

        return Response.json(
            { success: false, message: err.message },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json()

        console.log("📦 Incoming Checklist Data:", data)

        const ignoreKeys = new Set([
            "type",
            "supervisorName",
            "date",
            "time",
            "siteVisit",
            "siteVisit (Reason)",
            "siteName",
            "telephonicCalling",
            "telephonicCalling (Reason)",
            "telephonicSiteName",
            "telephonicIncharge",
        ])

        const answersToCreate: any[] = []

        for (const [key, value] of Object.entries(data)) {
            if (ignoreKeys.has(key)) continue
            if (key.endsWith("(Reason)")) continue

            const reasonKey = `${key} (Reason)`
            const reasonValue = data[reasonKey] || ""

            const source = detectSource(key)
            const sectionName = detectSectionName(source)

            answersToCreate.push({
                source,
                sectionName,
                questionId: key,
                questionText: cleanQuestionText(key),
                siteContext:
                    source === "SITE_VISIT"
                        ? data.siteName || null
                        : source === "TELEPHONIC"
                            ? data.telephonicSiteName || null
                            : null,
                answerValue: value == null ? "" : String(value),
                answerReason: reasonValue ? String(reasonValue) : null,
            })
        }

        const communicationStats = calculateCounts(answersToCreate, "Communication")
        const siteVisitStats = calculateCounts(answersToCreate, "Site Visit")
        const telephonicStats = calculateCounts(answersToCreate, "Telephonic")
        const storeStats = calculateCounts(answersToCreate, "Store")

        let totalOk = 0
        let totalIssues = 0

            ;[communicationStats, siteVisitStats, telephonicStats, storeStats]
                .filter(Boolean)
                .forEach((s: any) => {
                    totalOk += s.ok
                    totalIssues += s.issues
                })

        const issues: string[] = []

        answersToCreate.forEach((a) => {
            const val = normalizeAnswer(a.answerValue)
            const q = a.questionText.toLowerCase()

            if (q.includes("pending email") && val === "no") {
                issues.push("Pending Emails")
            }

            if (q.includes("safety risk") && val === "yes") {
                issues.push("Safety Risk")
            }

            if (q.includes("repeat complaint") && val === "yes") {
                issues.push("Repeat Complaint")
            }
        })

        const uniqueIssues = [...new Set(issues)]
        console.log("Detected issues:", uniqueIssues)

        let status = "completed"

        if (totalIssues > 0 && totalIssues <= 3) {
            status = "needs_action"
        }

        if (totalIssues > 3 || uniqueIssues.length > 0) {
            status = "critical"
        }

        const submission = await prisma.checklistSubmission.create({
            data: {
                supervisorName: data.supervisorName || "",
                date: parseDate(data.date),
                timeText: data.time || "",

                siteVisitConducted: data.siteVisit || null,
                siteVisitReason: data["siteVisit (Reason)"] || null,
                siteName: data.siteName || null,

                telephonicCalling: data.telephonicCalling || null,
                telephonicSiteName: data.telephonicSiteName || null,
                telephonicIncharge: data.telephonicIncharge || null,

                okCount: totalOk,
                issueCount: totalIssues,
                status, // ⭐ ADD THIS
            },
        })

        if (answersToCreate.length) {
            await prisma.checklistAnswer.createMany({
                data: answersToCreate.map((answer) => ({
                    submissionId: submission.id,
                    ...answer,
                })),
            })
        }

        return Response.json({
            success: true,
            submissionId: submission.id,
            // scores: {
            //     communicationScore,
            //     siteVisitScore,
            //     telephonicScore,
            //     storeScore,
            //     finalScore,
            // },
            issues: uniqueIssues,
        })
    } catch (err: any) {
        console.error("❌ Checklist API ERROR:", err)

        return Response.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}