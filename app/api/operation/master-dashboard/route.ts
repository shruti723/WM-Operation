import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const OPERATION_ROLES = [
    "Mahendra",
    "Deepak",
    "Lakhan",
    "Ravi",
    "Suyesh",
    "Amitoj",
]

function startOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

function endOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

function safeNumber(value: any) {
    const n = Number(value || 0)
    return Number.isFinite(n) ? n : 0
}

function cleanText(value: any) {
    return String(value || "")
        .replace(/[🟢🟡🔴✅❌⚠️]/g, "")
        .trim()
}

function lower(value: any) {
    return cleanText(value).toLowerCase()
}

function monthKey(date: Date) {
    return new Date(date).toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
    })
}

function isOpenStatus(value: any) {
    const v = lower(value)

    return (
        v.includes("open") ||
        v.includes("pending") ||
        v.includes("in progress") ||
        v.includes("follow") ||
        v.includes("not raised") ||
        v.includes("disrupted") ||
        v.includes("weak") ||
        v.includes("red")
    )
}

function isClosedStatus(value: any) {
    const v = lower(value)

    return (
        v.includes("closed") ||
        v.includes("completed") ||
        v.includes("resolved") ||
        v.includes("received") ||
        v.includes("normal") ||
        v.includes("green") ||
        v.includes("done")
    )
}

function isRiskStatus(value: any) {
    const v = lower(value)

    return (
        v.includes("red") ||
        v.includes("risk") ||
        v.includes("high") ||
        v.includes("critical") ||
        v.includes("pending") ||
        v.includes("open") ||
        v.includes("disrupted") ||
        v.includes("weak") ||
        v.includes("not raised")
    )
}

function isYes(value: any) {
    const v = lower(value)
    return v === "yes" || v === "true" || v.includes("yes")
}

function isOverdue(deadline: any, status: any) {
    if (!deadline) return false
    if (isClosedStatus(status)) return false

    const d = new Date(deadline)
    if (Number.isNaN(d.getTime())) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return d.getTime() < today.getTime()
}

function ensureMapItem<T extends Record<string, any>>(
    map: Map<string, T>,
    key: string,
    defaultValue: T
) {
    if (!map.has(key)) map.set(key, defaultValue)
    return map.get(key)!
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const site = searchParams.get("site") || "all"
        const createdById = searchParams.get("createdById") || "all"
        const startDate = searchParams.get("startDate") || ""
        const endDate = searchParams.get("endDate") || ""

        const dateFilter =
            startDate || endDate
                ? {
                    gte: startDate ? startOfDay(new Date(startDate)) : undefined,
                    lte: endDate ? endOfDay(new Date(endDate)) : undefined,
                }
                : undefined

        const createdAtFilter = dateFilter ? { createdAt: dateFilter } : {}

        const userFilter =
            createdById !== "all"
                ? {
                    createdById,
                }
                : {}

        const dailyWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { siteName: site } : {}),
        }

        const travelWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { siteToVisit: site } : {}),
        }

        const costLeakWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { site } : {}),
        }

        const costSavingWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { site } : {}),
        }

        const commandTargetWhere: any = {
            ...createdAtFilter,
            ...userFilter,
        }

        const siteControlWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { site } : {}),
        }

        const amitojTravelWhere: any = {
            ...createdAtFilter,
            ...userFilter,
            ...(site !== "all" ? { siteToVisit: site } : {}),
        }

        const userSelect = {
            id: true,
            name: true,
            email: true,
            role: true,
        }

        const [
            dailySiteReports,
            travelVisitPlans,
            costLeakReports,
            costSavingReports,
            amitojCommandTargets,
            amitojSiteControls,
            amitojTravelVisitPlans,
            users,
            allDailySites,
            allTravelSites,
            allLeakSites,
            allSavingSites,
            allSiteControlSites,
            allAmitojTravelSites,
        ] = await Promise.all([
            prisma.dailySiteReport.findMany({
                where: dailyWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.travelVisitPlan.findMany({
                where: travelWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.costLeakReport.findMany({
                where: costLeakWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.costSavingReport.findMany({
                where: costSavingWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.amitojCommandTarget.findMany({
                where: commandTargetWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.amitojSiteControl.findMany({
                where: siteControlWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.amitojTravelVisitPlan.findMany({
                where: amitojTravelWhere,
                include: { createdBy: { select: userSelect } },
                orderBy: { createdAt: "desc" },
            }),

            prisma.user.findMany({
                where: {
                    role: {
                        in: OPERATION_ROLES as any,
                    },
                },
                select: userSelect,
                orderBy: { name: "asc" },
            }),

            prisma.dailySiteReport.findMany({
                select: { siteName: true },
            }),

            prisma.travelVisitPlan.findMany({
                select: { siteToVisit: true },
            }),

            prisma.costLeakReport.findMany({
                select: { site: true },
            }),

            prisma.costSavingReport.findMany({
                select: { site: true },
            }),

            prisma.amitojSiteControl.findMany({
                select: { site: true },
            }),

            prisma.amitojTravelVisitPlan.findMany({
                select: { siteToVisit: true },
            }),
        ])

        const totalLeakage = costLeakReports.reduce(
            (sum, item) => sum + safeNumber(item.monthlyImpact),
            0
        )

        const totalSaving = costSavingReports.reduce(
            (sum, item) => sum + safeNumber(item.monthlyImpact),
            0
        )

        const totalUnderBilling = amitojSiteControls.reduce(
            (sum, item) => sum + safeNumber(item.underBillingAmount),
            0
        )

        const totalAuthorisedAmount = amitojSiteControls.reduce(
            (sum, item) => sum + safeNumber(item.authorisedAmount),
            0
        )

        const totalBillAuthorised = dailySiteReports.reduce(
            (sum, item) => sum + safeNumber(item.billAmountAuthorised),
            0
        )

        const totalBillClaimed = dailySiteReports.reduce(
            (sum, item) => sum + safeNumber(item.billAmountClaimed),
            0
        )

        const totalTravelCost =
            travelVisitPlans.reduce(
                (sum, item) => sum + safeNumber(item.estimatedCost),
                0
            ) +
            amitojTravelVisitPlans.reduce(
                (sum, item) => sum + safeNumber(item.estimatedCost),
                0
            )

        const paymentPending = dailySiteReports.filter((item) =>
            lower(item.paymentStatus).includes("pending")
        ).length

        const salaryIssues = dailySiteReports.filter((item) => {
            return (
                isYes(item.salaryRelatedIssue) ||
                lower(item.salariesPaidForMonth).includes("pending") ||
                lower(item.salariesPaidForMonth).includes("no")
            )
        }).length

        const hrIssues = dailySiteReports.filter((item) =>
            isYes(item.hrIssue)
        ).length

        const operationalRisks = dailySiteReports.filter((item) =>
            isYes(item.operationalRisks)
        ).length

        const openCostLeakReports = costLeakReports.filter((item) =>
            isOpenStatus(item.status)
        ).length

        const closedCostLeakReports = costLeakReports.filter((item) =>
            isClosedStatus(item.status)
        ).length

        const openCostSavingReports = costSavingReports.filter((item) =>
            isOpenStatus(item.status)
        ).length

        const closedCostSavingReports = costSavingReports.filter((item) =>
            isClosedStatus(item.status)
        ).length

        const travelFollowUpRequired =
            travelVisitPlans.filter((item) => item.followUpRequired === true).length +
            amitojTravelVisitPlans.filter((item) => item.followUpRequired === true)
                .length

        const travelIssuePending =
            travelVisitPlans.filter((item) => item.issueResolved === false).length +
            amitojTravelVisitPlans.filter((item) => item.issueResolved === false)
                .length

        const billingRisk = amitojSiteControls.filter((item) =>
            isRiskStatus(item.billingStatus)
        ).length

        const siteStatusRisk = amitojSiteControls.filter((item) =>
            isRiskStatus(item.siteStatus)
        ).length

        const clientControlRisk = amitojSiteControls.filter((item) =>
            isRiskStatus(item.clientControl)
        ).length

        const politicalRisk = amitojSiteControls.filter((item) =>
            isRiskStatus(item.politicalRisk)
        ).length

        const coordinatorPerformanceRisk = amitojSiteControls.filter((item) =>
            isRiskStatus(item.coordinatorPerformance)
        ).length

        const openCommandTargets = amitojCommandTargets.filter(
            (item) => !isClosedStatus(item.status)
        ).length

        const overdueCommandTargets = amitojCommandTargets.filter((item) =>
            isOverdue(item.deadline, item.status)
        ).length

        const overdueSiteControls = amitojSiteControls.filter((item) =>
            isOverdue(item.deadline, item.siteStatus || item.billingStatus)
        ).length

        const overdueCostLeaks = costLeakReports.filter((item) =>
            isOverdue(item.deadline, item.status)
        ).length

        const overdueCostSavings = costSavingReports.filter((item) =>
            isOverdue(item.deadline, item.status)
        ).length

        const overdueActions =
            overdueCommandTargets +
            overdueSiteControls +
            overdueCostLeaks +
            overdueCostSavings

        const openActions =
            openCostLeakReports +
            openCostSavingReports +
            openCommandTargets +
            travelFollowUpRequired

        const totalSubmissions =
            dailySiteReports.length +
            travelVisitPlans.length +
            costLeakReports.length +
            costSavingReports.length +
            amitojCommandTargets.length +
            amitojSiteControls.length +
            amitojTravelVisitPlans.length

        const netImpact = totalSaving - totalLeakage - totalUnderBilling

        const siteMap = new Map<
            string,
            {
                site: string
                dailySiteReports: number
                travelVisitPlans: number
                amitojTravelVisitPlans: number
                costLeakReports: number
                costSavingReports: number
                amitojSiteControls: number
                leakageAmount: number
                savingAmount: number
                underBillingAmount: number
                travelCost: number
                riskScore: number
            }
        >()

        function ensureSite(siteName: string) {
            return ensureMapItem(siteMap, siteName || "Unknown", {
                site: siteName || "Unknown",
                dailySiteReports: 0,
                travelVisitPlans: 0,
                amitojTravelVisitPlans: 0,
                costLeakReports: 0,
                costSavingReports: 0,
                amitojSiteControls: 0,
                leakageAmount: 0,
                savingAmount: 0,
                underBillingAmount: 0,
                travelCost: 0,
                riskScore: 0,
            })
        }

        dailySiteReports.forEach((item) => {
            const row = ensureSite(item.siteName)
            row.dailySiteReports += 1

            if (isYes(item.operationalRisks)) row.riskScore += 2
            if (isYes(item.hrIssue)) row.riskScore += 1
            if (lower(item.paymentStatus).includes("pending")) row.riskScore += 1
            if (isOpenStatus(item.clientStatus)) row.riskScore += 1
            if (isOpenStatus(item.siteStatus)) row.riskScore += 1
        })

        travelVisitPlans.forEach((item) => {
            const row = ensureSite(item.siteToVisit)
            row.travelVisitPlans += 1
            row.travelCost += safeNumber(item.estimatedCost)

            if (item.followUpRequired) row.riskScore += 1
            if (item.issueResolved === false) row.riskScore += 1
        })

        amitojTravelVisitPlans.forEach((item) => {
            const row = ensureSite(item.siteToVisit)
            row.amitojTravelVisitPlans += 1
            row.travelCost += safeNumber(item.estimatedCost)

            if (item.followUpRequired) row.riskScore += 1
            if (item.issueResolved === false) row.riskScore += 1
        })

        costLeakReports.forEach((item) => {
            const row = ensureSite(item.site)
            row.costLeakReports += 1
            row.leakageAmount += safeNumber(item.monthlyImpact)

            if (isOpenStatus(item.status)) row.riskScore += 2
        })

        costSavingReports.forEach((item) => {
            const row = ensureSite(item.site)
            row.costSavingReports += 1
            row.savingAmount += safeNumber(item.monthlyImpact)

            if (isOpenStatus(item.status)) row.riskScore += 1
        })

        amitojSiteControls.forEach((item) => {
            const row = ensureSite(item.site)
            row.amitojSiteControls += 1
            row.underBillingAmount += safeNumber(item.underBillingAmount)

            if (isRiskStatus(item.billingStatus)) row.riskScore += 2
            if (isRiskStatus(item.siteStatus)) row.riskScore += 2
            if (isRiskStatus(item.clientControl)) row.riskScore += 2
            if (isRiskStatus(item.politicalRisk)) row.riskScore += 3
            if (isRiskStatus(item.coordinatorPerformance)) row.riskScore += 1
        })

        const siteWise = Array.from(siteMap.values()).sort((a, b) => {
            const bScore = b.riskScore * 100000 + b.leakageAmount + b.underBillingAmount
            const aScore = a.riskScore * 100000 + a.leakageAmount + a.underBillingAmount
            return bScore - aScore
        })

        const highRiskSites = siteWise
            .filter((item) => item.riskScore > 0)
            .slice(0, 10)

        const monthMap = new Map<
            string,
            {
                month: string
                dailySiteReports: number
                travelVisitPlans: number
                amitojTravelVisitPlans: number
                costLeakReports: number
                costSavingReports: number
                amitojCommandTargets: number
                amitojSiteControls: number
                leakageAmount: number
                savingAmount: number
                underBillingAmount: number
                travelCost: number
            }
        >()

        function ensureMonth(date: Date) {
            const key = monthKey(date)

            return ensureMapItem(monthMap, key, {
                month: key,
                dailySiteReports: 0,
                travelVisitPlans: 0,
                amitojTravelVisitPlans: 0,
                costLeakReports: 0,
                costSavingReports: 0,
                amitojCommandTargets: 0,
                amitojSiteControls: 0,
                leakageAmount: 0,
                savingAmount: 0,
                underBillingAmount: 0,
                travelCost: 0,
            })
        }

        dailySiteReports.forEach((item) => {
            ensureMonth(item.createdAt).dailySiteReports += 1
        })

        travelVisitPlans.forEach((item) => {
            const row = ensureMonth(item.createdAt)
            row.travelVisitPlans += 1
            row.travelCost += safeNumber(item.estimatedCost)
        })

        amitojTravelVisitPlans.forEach((item) => {
            const row = ensureMonth(item.createdAt)
            row.amitojTravelVisitPlans += 1
            row.travelCost += safeNumber(item.estimatedCost)
        })

        costLeakReports.forEach((item) => {
            const row = ensureMonth(item.createdAt)
            row.costLeakReports += 1
            row.leakageAmount += safeNumber(item.monthlyImpact)
        })

        costSavingReports.forEach((item) => {
            const row = ensureMonth(item.createdAt)
            row.costSavingReports += 1
            row.savingAmount += safeNumber(item.monthlyImpact)
        })

        amitojCommandTargets.forEach((item) => {
            ensureMonth(item.createdAt).amitojCommandTargets += 1
        })

        amitojSiteControls.forEach((item) => {
            const row = ensureMonth(item.createdAt)
            row.amitojSiteControls += 1
            row.underBillingAmount += safeNumber(item.underBillingAmount)
        })

        const monthWise = Array.from(monthMap.values())

        const userMap = new Map<
            string,
            {
                name: string
                role: string
                dailySiteReports: number
                travelVisitPlans: number
                amitojTravelVisitPlans: number
                costLeakReports: number
                costSavingReports: number
                amitojCommandTargets: number
                amitojSiteControls: number
                totalSubmissions: number
            }
        >()

        function ensureUser(user: any) {
            const name = user?.name || "Unknown"

            return ensureMapItem(userMap, name, {
                name,
                role: String(user?.role || "-"),
                dailySiteReports: 0,
                travelVisitPlans: 0,
                amitojTravelVisitPlans: 0,
                costLeakReports: 0,
                costSavingReports: 0,
                amitojCommandTargets: 0,
                amitojSiteControls: 0,
                totalSubmissions: 0,
            })
        }

        dailySiteReports.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.dailySiteReports += 1
            row.totalSubmissions += 1
        })

        travelVisitPlans.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.travelVisitPlans += 1
            row.totalSubmissions += 1
        })

        amitojTravelVisitPlans.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.amitojTravelVisitPlans += 1
            row.totalSubmissions += 1
        })

        costLeakReports.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.costLeakReports += 1
            row.totalSubmissions += 1
        })

        costSavingReports.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.costSavingReports += 1
            row.totalSubmissions += 1
        })

        amitojCommandTargets.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.amitojCommandTargets += 1
            row.totalSubmissions += 1
        })

        amitojSiteControls.forEach((item) => {
            const row = ensureUser(item.createdBy)
            row.amitojSiteControls += 1
            row.totalSubmissions += 1
        })

        const userWise = Array.from(userMap.values()).sort(
            (a, b) => b.totalSubmissions - a.totalSubmissions
        )

        const latestActivity = [
            ...dailySiteReports.map((item) => ({
                id: item.id,
                tracker: "Daily Site Report",
                siteOrArea: item.siteName,
                title: item.projectHead || item.siteName,
                amount: item.billAmountClaimed || item.billAmountAuthorised || null,
                status: item.operationalStatus || item.siteStatus || "-",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...travelVisitPlans.map((item) => ({
                id: item.id,
                tracker: "Travel Visit Plan",
                siteOrArea: item.siteToVisit,
                title: item.personTravelling,
                amount: item.estimatedCost || null,
                status:
                    item.issueResolved === true
                        ? "Resolved"
                        : item.followUpRequired
                            ? "Follow-up Required"
                            : "Pending",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...costLeakReports.map((item) => ({
                id: item.id,
                tracker: "Cost Leak Report",
                siteOrArea: item.site,
                title: item.leakageType || item.description || item.site,
                amount: item.monthlyImpact || null,
                status: item.status || "-",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...costSavingReports.map((item) => ({
                id: item.id,
                tracker: "Cost Saving Report",
                siteOrArea: item.site,
                title: item.reductionSavingType || item.description || item.site,
                amount: item.monthlyImpact || null,
                status: item.status || "-",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...amitojCommandTargets.map((item) => ({
                id: item.id,
                tracker: "Amitoj Command Target",
                siteOrArea: item.targetArea,
                title: item.nextAction || item.mdContextReason || item.targetArea,
                amount: null,
                status: item.status || "-",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...amitojSiteControls.map((item) => ({
                id: item.id,
                tracker: "Amitoj Site Control",
                siteOrArea: item.site,
                title: item.nextAction || item.lastAction || item.coordinator || item.site,
                amount: item.underBillingAmount || item.authorisedAmount || null,
                status: item.siteStatus || item.billingStatus || "-",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...amitojTravelVisitPlans.map((item) => ({
                id: item.id,
                tracker: "Amitoj Travel Visit Plan",
                siteOrArea: item.siteToVisit,
                title: item.personTravelling,
                amount: item.estimatedCost || null,
                status:
                    item.issueResolved === true
                        ? "Resolved"
                        : item.followUpRequired
                            ? "Follow-up Required"
                            : "Pending",
                submittedBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),
        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 100)

        const allSites = Array.from(
            new Set([
                ...allDailySites.map((item) => item.siteName),
                ...allTravelSites.map((item) => item.siteToVisit),
                ...allLeakSites.map((item) => item.site),
                ...allSavingSites.map((item) => item.site),
                ...allSiteControlSites.map((item) => item.site),
                ...allAmitojTravelSites.map((item) => item.siteToVisit),
            ])
        )
            .filter(Boolean)
            .sort()

        return NextResponse.json({
            success: true,

            filters: {
                users,
                sites: allSites,
            },

            totals: {
                totalSubmissions,

                dailySiteReports: dailySiteReports.length,
                travelVisitPlans: travelVisitPlans.length,
                costLeakReports: costLeakReports.length,
                costSavingReports: costSavingReports.length,
                amitojCommandTargets: amitojCommandTargets.length,
                amitojSiteControls: amitojSiteControls.length,
                amitojTravelVisitPlans: amitojTravelVisitPlans.length,

                totalLeakage,
                totalSaving,
                totalUnderBilling,
                totalAuthorisedAmount,
                netImpact,

                totalBillAuthorised,
                totalBillClaimed,
                billingGap: totalBillAuthorised - totalBillClaimed,

                totalTravelCost,

                paymentPending,
                salaryIssues,
                hrIssues,
                operationalRisks,

                openCostLeakReports,
                closedCostLeakReports,
                openCostSavingReports,
                closedCostSavingReports,

                travelFollowUpRequired,
                travelIssuePending,

                billingRisk,
                siteStatusRisk,
                clientControlRisk,
                politicalRisk,
                coordinatorPerformanceRisk,

                openCommandTargets,

                overdueCommandTargets,
                overdueSiteControls,
                overdueCostLeaks,
                overdueCostSavings,
                overdueActions,

                openActions,
            },

            countExplanation: [
                {
                    label: "Total Submissions",
                    value: totalSubmissions,
                    meaning:
                        "Total rows submitted across Daily Site Report, Travel Visit Plan, Cost Leak Report, Cost Saving Report, Amitoj Command Target, Amitoj Site Control and Amitoj Travel Visit Plan.",
                },
                {
                    label: "Net Impact",
                    value: netImpact,
                    meaning:
                        "Cost Saving Report monthly impact minus Cost Leak Report monthly impact minus Amitoj Site Control under billing amount.",
                },
                {
                    label: "Open Actions",
                    value: openActions,
                    meaning:
                        "Open Cost Leak Reports + Open Cost Saving Reports + Open Amitoj Command Targets + Travel follow-ups required.",
                },
                {
                    label: "Risk Count",
                    value:
                        paymentPending +
                        salaryIssues +
                        hrIssues +
                        operationalRisks +
                        billingRisk +
                        siteStatusRisk +
                        clientControlRisk +
                        politicalRisk,
                    meaning:
                        "Combined count of pending payment, salary issue, HR issue, operational risk, billing risk, site status risk, client control risk and political risk.",
                },
            ],

            charts: {
                monthWise,
                siteWise,
                userWise,

                financialSummary: [
                    { name: "Cost Leakage", value: totalLeakage },
                    { name: "Cost Saving", value: totalSaving },
                    { name: "Under Billing", value: totalUnderBilling },
                    { name: "Travel Cost", value: totalTravelCost },
                ],

                statusSummary: [
                    { name: "Payment Pending", value: paymentPending },
                    { name: "Salary Issues", value: salaryIssues },
                    { name: "HR Issues", value: hrIssues },
                    { name: "Operational Risks", value: operationalRisks },
                    { name: "Travel Follow-up Required", value: travelFollowUpRequired },
                    { name: "Client Control Risk", value: clientControlRisk },
                    { name: "Political Risk", value: politicalRisk },
                    { name: "Overdue Actions", value: overdueActions },
                ],

                siteControlRisk: [
                    { name: "Billing Status Risk", value: billingRisk },
                    { name: "Site Status Risk", value: siteStatusRisk },
                    { name: "Client Control Risk", value: clientControlRisk },
                    { name: "Political Risk", value: politicalRisk },
                    {
                        name: "Coordinator Performance Risk",
                        value: coordinatorPerformanceRisk,
                    },
                ],
            },

            highRiskSites,
            latestActivity,

            records: {
                dailySiteReports,
                travelVisitPlans,
                costLeakReports,
                costSavingReports,
                amitojCommandTargets,
                amitojSiteControls,
                amitojTravelVisitPlans,
            },
        })
    } catch (error: any) {
        console.error("Operation master dashboard error:", error)

        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Failed to load operation master dashboard",
            },
            { status: 500 }
        )
    }
}