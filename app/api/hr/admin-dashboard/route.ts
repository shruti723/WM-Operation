import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"


function toNumber(value: any) {
    return Number(value || 0)
}

function getPercent(value: number, total: number) {
    if (!total) return 0
    return Number(((value / total) * 100).toFixed(1))
}

function daysUntil(date: any) {
    if (!date) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = new Date(date)
    target.setHours(0, 0, 0, 0)

    return Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
}

function getRenewalStatus(nextRenewalDate: any) {
    const days = daysUntil(nextRenewalDate)

    if (days === null) return "Unknown"
    if (days < 0) return "Expired"
    if (days <= 30) return "Due in 30 Days"
    if (days <= 90) return "Due in 90 Days"
    return "Safe"
}

function getRiskLevelByNeeded(needed: number) {
    if (needed >= 8) return "Critical"
    if (needed >= 3) return "High"
    if (needed >= 1) return "Medium"
    return "Low"
}

function getRiskScore(item: any) {
    const needed = Math.max(toNumber(item.needed), 0)

    const renewalDays = daysUntil(item.nextRenewalDate)

    let renewalScore = 0
    if (needed > 0 && renewalDays !== null) {
        if (renewalDays < 0) renewalScore = 20
        else if (renewalDays <= 30) renewalScore = 15
        else if (renewalDays <= 90) renewalScore = 10
    }

    let processScore = 0

    if (needed > 0 && !item.hr3Done) {
        processScore += 20
    }

    if (
        needed > 0 &&
        ["-", "not required", "select", ""].includes(
            String(item.processLabel || "").toLowerCase()
        )
    ) {
        processScore += 15
    }

    const score =
        needed * 10 +
        renewalScore +
        processScore

    return Math.round(score)
}
function isRecruitmentCompleted(item: any) {
    const processList = Array.isArray(item.processList)
        ? item.processList
        : []

    return (
        String(item.processLabel || "")
            .toLowerCase()
            .includes("completed") ||
        processList.some((process: string) =>
            String(process || "")
                .toLowerCase()
                .includes("completed")
        )
    )
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const search = searchParams.get("search")?.toLowerCase().trim() || ""
        const status = searchParams.get("status")?.toLowerCase() || "all"
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const siteType = searchParams.get("siteType")?.toUpperCase() || "ALL"

        const neededFilter = searchParams.get("needed") || "all"
        const riskFilter = searchParams.get("risk") || "all"
        const renewalFilter = searchParams.get("renewal") || "all"
        const processFilter = searchParams.get("process") || "all"

        const sites = await prisma.wmSite.findMany({
            include: {
                manpowerTemplate: true,
                manpowerSubmissions: {
                    include: {
                        items: true,
                    },
                },
            },
        }) as any[]

        /* ---------------- HR1 SITE DETAILS ---------------- */

        const siteDetails = sites.map((site: any) => {
            const required = (site.manpowerTemplate || []).reduce(
                (sum: number, item: any) => sum + (item.authorised || 0),
                0
            )

            return {
                siteId: site.id,
                site: site.siteName,
                startDate: site.startDate,
                lastRenewalDate: site.lastRenewalDate,
                nextRenewalDate: site.nextRenewalDate,
                required,
                siteCategory: site.siteCategory,
                siteRemark: site.siteRemark,
            }
        })

        /* ---------------- ALL HR2 SUBMISSIONS ---------------- */

        const manpowerDetails = sites.flatMap((site: any) => {
            const submissions = (site.manpowerSubmissions || [])
                .filter((sub: any) =>
                    String(sub.submittedByRole || "")
                        .toLowerCase()
                        .includes("level2")
                )
                .sort(
                    (a: any, b: any) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )

            function getProcessSummary(items: any[]) {
                const processes = items
                    .map((i) => i.recruitmentProcess)
                    .filter((p) => p && p !== "Select")

                const unique = [...new Set(processes)]

                if (unique.length === 0) {
                    return { label: "-", count: 0, all: [] }
                }

                const priority = ["Under Process", "Completed", "Not Required"]

                const sorted = unique.sort((a: any, b: any) => {
                    const aIndex = priority.indexOf(a)
                    const bIndex = priority.indexOf(b)

                    return (
                        (aIndex === -1 ? 999 : aIndex) -
                        (bIndex === -1 ? 999 : bIndex)
                    )
                })

                if (sorted.length === 1) {
                    return { label: sorted[0], count: 1, all: sorted }
                }

                return {
                    label: `${sorted[0]} + ${sorted.length - 1} more`,
                    count: sorted.length,
                    all: sorted,
                }
            }

            return submissions.map((sub: any) => {
                let required = 0
                let deployed = 0
                let shortage = 0
                let siteNeeded = 0

                const designationMap: Record<
                    string,
                    {
                        authorised: number
                        deployed: number
                        needed: number
                    }
                > = {}

                    ; (site.manpowerTemplate || []).forEach((item: any) => {
                        const key = item.designation || "Unknown"

                        if (!designationMap[key]) {
                            designationMap[key] = {
                                authorised: 0,
                                deployed: 0,
                                needed: 0,
                            }
                        }

                        designationMap[key].authorised += item.authorised || 0
                    })

                    ; (sub.items || []).forEach((item: any) => {
                        const key = item.designation || "Unknown"

                        if (!designationMap[key]) {
                            designationMap[key] = {
                                authorised: 0,
                                deployed: 0,
                                needed: 0,
                            }
                        }

                        designationMap[key].deployed += item.deployed || 0
                        designationMap[key].needed += item.needed || 0
                    })

                Object.values(designationMap).forEach((item: any) => {
                    required += item.authorised
                    deployed += item.deployed
                    shortage += item.authorised - item.deployed
                    siteNeeded += item.needed || 0
                })

                const items = Array.isArray(sub.items) ? sub.items : []
                const processSummary = getProcessSummary(items)
                const hr3Done = items.some(
                    (item: any) =>
                        !!item.recruitmentProcess ||
                        !!item.responsible ||
                        !!item.cutoffDate ||
                        !!item.remarks
                )

                return {
                    siteId: site.id,
                    submissionId: sub.id,
                    site: site.siteName,
                    siteCategory: site.siteCategory,
                    createdAt: sub.createdAt,
                    siteRemark: site.siteRemark,

                    startDate: site.startDate,
                    lastRenewalDate: site.lastRenewalDate,
                    nextRenewalDate: site.nextRenewalDate,

                    required,
                    deployed,
                    shortage,
                    needed: siteNeeded,
                    hr3Done,


                    // ✅ NEW PROCESS DATA
                    processLabel: processSummary.label,
                    processCount: processSummary.count,
                    processList: processSummary.all,
                }
            })
        })

        /* ---------------- FILTER ALL SUBMISSIONS ---------------- */

        const filteredDetails = manpowerDetails.filter((item: any) => {
            const matchesSearch =
                !search || item.site?.toLowerCase().includes(search)

            const matchesStatus =
                status === "all" ||
                (status === "completed" && item.hr3Done) ||
                (status === "pending" && !item.hr3Done)

            const itemDate = item.createdAt ? new Date(item.createdAt) : null
            const start = startDate ? new Date(startDate + "T00:00:00") : null
            const end = endDate ? new Date(endDate + "T23:59:59") : null

            const matchesStart = !start || (itemDate && itemDate >= start)
            const matchesEnd = !end || (itemDate && itemDate <= end)

            const matchesSiteType =
                siteType === "ALL" ||
                String(item.siteCategory || "").toUpperCase() === siteType

            return (
                matchesSearch &&
                matchesStatus &&
                matchesStart &&
                matchesEnd &&
                matchesSiteType
            )
        })



        /* ---------------- LATEST RECORD PER SITE FOR METRICS ---------------- */

        const latestBySite = new Map<string, any>()

        filteredDetails.forEach((item: any) => {
            const existing = latestBySite.get(item.siteId)

            if (
                !existing ||
                new Date(item.createdAt).getTime() >
                new Date(existing.createdAt).getTime()
            ) {
                latestBySite.set(item.siteId, item)
            }
        })

        const latestRecords = Array.from(latestBySite.values())

        /* ---------------- SITES WITHOUT MANPOWER ACTION ---------------- */

        const latestSiteIds = new Set(
            latestRecords.map((item: any) => item.siteId)
        )

        const noActionSites = siteDetails
            .filter((site: any) => {
                const matchesSearch =
                    !search || site.site?.toLowerCase().includes(search)

                const matchesSiteType =
                    siteType === "ALL" ||
                    String(site.siteCategory || "").toUpperCase() === siteType

                return (
                    matchesSearch &&
                    matchesSiteType &&
                    !latestSiteIds.has(site.siteId)
                )
            })
            .map((site: any) => ({
                siteId: site.siteId,
                site: site.site,
                authorised: site.required,
                siteCategory: site.siteCategory,
                remark: site.siteRemark || "-",
                nextRenewalDate: site.nextRenewalDate,
            }))

        /* ---------------- SUMMARY FROM LATEST RECORDS ONLY ---------------- */



        const riskRecords = latestRecords.map((item: any) => {
            const riskScore = getRiskScore(item)

            return {
                ...item,
                deploymentPercent: getPercent(item.deployed, item.required),
                shortagePercent: getPercent(
                    Math.max(toNumber(item.shortage), 0),
                    item.required
                ),
                renewalStatus: getRenewalStatus(item.nextRenewalDate),
                riskScore,
                riskLevel: getRiskLevelByNeeded(toNumber(item.needed)),
            }
        })

        const dashboardRecords = riskRecords.filter((item: any) => {
            const neededValue = toNumber(item.needed)

            const matchesNeeded =
                neededFilter === "all" ||
                (neededFilter === "gt0" && neededValue > 0) ||
                (neededFilter === "zero" && neededValue === 0) ||
                (neededFilter === "1-2" && neededValue >= 1 && neededValue <= 2) ||
                (neededFilter === "3-7" && neededValue >= 3 && neededValue <= 7) ||
                (neededFilter === "8plus" && neededValue >= 8)

            const matchesRisk =
                riskFilter === "all" || item.riskLevel === riskFilter

            const matchesRenewal =
                renewalFilter === "all" || item.renewalStatus === renewalFilter

            const processList = Array.isArray(item.processList)
                ? item.processList
                : []

            const processText = [
                item.processLabel,
                ...processList,
            ]
                .join(" ")
                .toLowerCase()

            const matchesProcess =
                processFilter === "all" ||
                processText.includes(String(processFilter).toLowerCase())

            return (
                matchesNeeded &&
                matchesRisk &&
                matchesRenewal &&
                matchesProcess
            )
        })


        const externalSites = dashboardRecords.filter(
            (item: any) => String(item.siteCategory || "").toUpperCase() === "EXTERNAL"
        ).length

        const ownSites = dashboardRecords.filter(
            (item: any) => String(item.siteCategory || "").toUpperCase() === "OWN"
        ).length

        const authorised = dashboardRecords.reduce(
            (sum: number, item: any) => sum + toNumber(item.required),
            0
        )

        const deployed = dashboardRecords.reduce(
            (sum: number, item: any) => sum + toNumber(item.deployed),
            0
        )

        const shortage = dashboardRecords.reduce(
            (sum: number, item: any) => sum + toNumber(item.shortage),
            0
        )

        const overDeployed = dashboardRecords.reduce(
            (sum: number, item: any) =>
                sum + Math.abs(Math.min(toNumber(item.shortage), 0)),
            0
        )

        const needed = dashboardRecords.reduce((sum: number, item: any) => {
            if (isRecruitmentCompleted(item)) return sum

            return sum + toNumber(item.needed)
        }, 0)

        const summary = {
            totalSites: sites.length,
            filteredSites: dashboardRecords.length,

            externalSites,
            ownSites,

            authorised,
            deployed,
            shortage,
            overDeployed,
            needed,

            deploymentPercent: getPercent(deployed, authorised),
            shortagePercent: getPercent(shortage, authorised),

            completedHR3: dashboardRecords.filter((item: any) => item.hr3Done).length,
            pendingHR3: dashboardRecords.filter((item: any) => !item.hr3Done).length,

            underProcessSites: dashboardRecords.filter((item: any) => {
                const processList = Array.isArray(item.processList)
                    ? item.processList
                    : []

                return processList.some((process: string) =>
                    String(process || "").toLowerCase().includes("under process")
                )
            }).length,

            criticalSites: dashboardRecords.filter((item: any) => {
                const processList = Array.isArray(item.processList)
                    ? item.processList
                    : []

                const isCompleted =
                    String(item.processLabel || "")
                        .toLowerCase()
                        .includes("completed") ||
                    processList.some((process: string) =>
                        String(process || "")
                            .toLowerCase()
                            .includes("completed")
                    )

                return (
                    toNumber(item.needed) > 0 &&
                    !isCompleted &&
                    item.riskLevel === "Critical"
                )
            }).length,

            highRiskSites: dashboardRecords.filter((item: any) => {
                const processList = Array.isArray(item.processList)
                    ? item.processList
                    : []

                const isCompleted =
                    String(item.processLabel || "")
                        .toLowerCase()
                        .includes("completed") ||
                    processList.some((process: string) =>
                        String(process || "")
                            .toLowerCase()
                            .includes("completed")
                    )

                return (
                    toNumber(item.needed) > 0 &&
                    !isCompleted &&
                    item.riskLevel === "High"
                )
            }).length,

            renewalExpired: dashboardRecords.filter(
                (item: any) => item.renewalStatus === "Expired"
            ).length,

            renewalDue30: dashboardRecords.filter(
                (item: any) => item.renewalStatus === "Due in 30 Days"
            ).length,

            renewalDue90: dashboardRecords.filter(
                (item: any) => item.renewalStatus === "Due in 90 Days"
            ).length,
        }

        /* ---------------- CHARTS FROM LATEST RECORDS ---------------- */

        const chartData = dashboardRecords.map((item: any) => ({
            siteId: item.siteId,
            name: item.site,
            siteCategory: item.siteCategory,

            authorised: item.required,
            deployed: item.deployed,
            shortage: Math.max(toNumber(item.shortage), 0),
            overDeployed: Math.abs(Math.min(toNumber(item.shortage), 0)),
            needed: item.needed,

            deploymentPercent: item.deploymentPercent,
            shortagePercent: item.shortagePercent,

            riskScore: item.riskScore,
            riskLevel: item.riskLevel,
        }))

        const statusData = [
            {
                name: "Completed",
                value: dashboardRecords.filter((item: any) => item.hr3Done).length,
            },
            {
                name: "Pending",
                value: dashboardRecords.filter((item: any) => !item.hr3Done).length,
            },
        ]

        /* ---------------- TREND FROM ALL FILTERED SUBMISSIONS ---------------- */

        const trendMap: Record<
            string,
            {
                rawDate: Date
                date: string
                authorised: number
                deployed: number
                shortage: number
                needed: number
            }
        > = {}

        filteredDetails.forEach((item: any) => {
            if (!item.createdAt) return

            const rawDate = new Date(item.createdAt)

            const date = rawDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            })

            if (!trendMap[date]) {
                trendMap[date] = {
                    rawDate,
                    date,
                    authorised: 0,
                    deployed: 0,
                    shortage: 0,
                    needed: 0,
                }
            }

            trendMap[date].authorised += item.required || 0
            trendMap[date].deployed += item.deployed || 0
            trendMap[date].shortage += item.shortage || 0
            trendMap[date].needed += item.needed || 0
        })

        const trendData = Object.values(trendMap)
            .sort(
                (a: any, b: any) =>
                    new Date(a.rawDate).getTime() -
                    new Date(b.rawDate).getTime()
            )
            .map(({ rawDate, ...rest }: any) => rest)

        /* ---------------- EXTRA DASHBOARD DATA ---------------- */

        const allNeeded = [...dashboardRecords]
            .sort((a, b) => (b.needed || 0) - (a.needed || 0))


        const recentActivity = [...filteredDetails]
            .sort(
                (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )


        const topShortageSites = [...dashboardRecords]
            .filter((item: any) => toNumber(item.shortage) > 0)
            .sort((a: any, b: any) => toNumber(b.shortage) - toNumber(a.shortage))

            .map((item: any) => ({
                siteId: item.siteId,
                site: item.site,
                shortage: item.shortage,
                authorised: item.required,
                deployed: item.deployed,
                riskLevel: item.riskLevel,
            }))

        const topNeededSites = [...dashboardRecords]
            .filter((item: any) => toNumber(item.needed) > 0)
            .sort((a: any, b: any) => toNumber(b.needed) - toNumber(a.needed))
            .map((item: any) => ({
                siteId: item.siteId,
                submissionId: item.submissionId, // ✅ IMPORTANT
                site: item.site,
                needed: item.needed,
                processLabel: item.processLabel,
                riskLevel: item.riskLevel,
            }))

        const overDeployedSites = [...dashboardRecords]
            .filter((item: any) => toNumber(item.shortage) < 0)
            .sort((a: any, b: any) => toNumber(a.shortage) - toNumber(b.shortage))

            .map((item: any) => ({
                siteId: item.siteId,
                site: item.site,
                overDeployed: Math.abs(item.shortage),
                authorised: item.required,
                deployed: item.deployed,
            }))



        const criticalSites = [...dashboardRecords]
            .filter((item: any) => {
                const processList = Array.isArray(item.processList)
                    ? item.processList
                    : []

                const isCompleted =
                    String(item.processLabel || "")
                        .toLowerCase()
                        .includes("completed") ||
                    processList.some((process: string) =>
                        String(process || "")
                            .toLowerCase()
                            .includes("completed")
                    )

                return (
                    toNumber(item.needed) > 0 &&
                    !isCompleted &&
                    ["Critical", "High", "Medium"].includes(item.riskLevel)
                )
            })

            .map((item: any) => ({
                siteId: item.siteId,
                submissionId: item.submissionId, // ✅ IMPORTANT
                site: item.site,
                riskScore: item.riskScore,
                riskLevel: item.riskLevel,
                needed: item.needed,
                renewalStatus: item.renewalStatus,
                processLabel: item.processLabel,
            }))

        const siteTypeData = [
            {
                name: "External",
                value: externalSites,
            },
            {
                name: "Own",
                value: ownSites,
            },
        ]

        const processMap: Record<string, number> = {}

        dashboardRecords.forEach((item: any) => {
            const processes = Array.isArray(item.processList)
                ? item.processList
                : []

            if (processes.length === 0) {
                processMap["Not Required"] = (processMap["Not Required"] || 0) + 1
            } else {
                processes.forEach((process: string) => {
                    processMap[process] = (processMap[process] || 0) + 1
                })
            }
        })

        const processData = Object.entries(processMap).map(([name, value]) => ({
            name,
            value,
        }))

        const renewalRiskData = dashboardRecords
            .map((item: any) => ({
                siteId: item.siteId,
                site: item.site,
                nextRenewalDate: item.nextRenewalDate,
                remark: item.siteRemark || "-",
                renewalStatus: item.renewalStatus,
                daysLeft: daysUntil(item.nextRenewalDate), // keep only for sorting
            }))
            .filter((item: any) =>
                ["Expired", "Due in 30 Days", "Due in 90 Days"].includes(
                    item.renewalStatus
                )
            )
            .sort((a: any, b: any) => {
                const aDays = a.daysLeft ?? 99999
                const bDays = b.daysLeft ?? 99999
                return aDays - bDays
            })

        const designationMap: Record<
            string,
            {
                designation: string
                authorised: number
                deployed: number
                shortage: number
                needed: number
            }
        > = {}

        dashboardRecords.forEach((item: any) => {
            const site = sites.find((s: any) => s.id === item.siteId)
            if (!site) return

            const latestSubmission = site.manpowerSubmissions
                ?.filter((sub: any) => sub.id === item.submissionId)?.[0]

            const map: Record<string, any> = {}

                ; (site.manpowerTemplate || []).forEach((template: any) => {
                    const key = template.designation || "Unknown"

                    if (!map[key]) {
                        map[key] = {
                            authorised: 0,
                            deployed: 0,
                            needed: 0,
                        }
                    }

                    map[key].authorised += toNumber(template.authorised)
                })

                ; (latestSubmission?.items || []).forEach((subItem: any) => {
                    const key = subItem.designation || "Unknown"

                    if (!map[key]) {
                        map[key] = {
                            authorised: 0,
                            deployed: 0,
                            needed: 0,
                        }
                    }

                    map[key].deployed += toNumber(subItem.deployed)
                    map[key].needed += toNumber(subItem.needed)
                })

            Object.entries(map).forEach(([designation, value]: any) => {
                if (!designationMap[designation]) {
                    designationMap[designation] = {
                        designation,
                        authorised: 0,
                        deployed: 0,
                        shortage: 0,
                        needed: 0,
                    }
                }

                designationMap[designation].authorised += value.authorised
                designationMap[designation].deployed += value.deployed
                designationMap[designation].needed += value.needed
                designationMap[designation].shortage += Math.max(
                    value.authorised - value.deployed,
                    0
                )
            })
        })

        const designationShortageData = Object.values(designationMap)
            .filter((item: any) => toNumber(item.needed) > 0)
            .sort((a: any, b: any) => toNumber(b.needed) - toNumber(a.needed))

        return NextResponse.json({
            success: true,

            summary,

            siteDetails,

            manpowerDetails: filteredDetails,

            latestRecords: dashboardRecords,
            dashboardRecords,

            chartData,
            statusData,
            trendData,

            allNeeded,
            recentActivity,

            topShortageSites,
            topNeededSites,
            overDeployedSites,
            criticalSites,
            siteTypeData,
            processData,
            renewalRiskData,
            designationShortageData,
            noActionSites,
        })
    } catch (error: any) {
        console.error("🔥 ADMIN DASHBOARD ERROR:", error)

        return NextResponse.json(
            {
                success: false,
                error: error?.message,
                stack: error?.stack,
            },
            { status: 500 }
        )
    }
}