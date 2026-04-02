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

export async function POST(req: Request) {
    try {
        const data = await req.json()

        console.log("📦 Incoming Checklist Data:", data)

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
            },
        })

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
                submissionId: submission.id,
                source, // must match ChecklistSource enum values
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

        if (answersToCreate.length) {
            await prisma.checklistAnswer.createMany({
                data: answersToCreate,
            })
        }

        return Response.json({
            success: true,
            submissionId: submission.id,
        })
    } catch (err: any) {
        console.error("❌ Checklist API ERROR:", err)

        return Response.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}