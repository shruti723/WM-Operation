import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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

function monthKey(date: Date) {
    return date.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
    })
}

function safeNumber(value: any) {
    const n = Number(value || 0)
    return Number.isFinite(n) ? n : 0
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const site = searchParams.get("site")
        const createdById = searchParams.get("createdById")

        const dateFilter =
            startDate || endDate
                ? {
                    gte: startDate ? startOfDay(new Date(startDate)) : undefined,
                    lte: endDate ? endOfDay(new Date(endDate)) : undefined,
                }
                : undefined

        const userFilter = createdById && createdById !== "all" ? createdById : undefined
        const siteFilter = site && site !== "all" ? site : undefined

        const dailyWhere: any = {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(userFilter ? { createdById: userFilter } : {}),
            ...(siteFilter ? { siteName: siteFilter } : {}),
        }

        const travelWhere: any = {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(userFilter ? { createdById: userFilter } : {}),
            ...(siteFilter ? { siteToVisit: siteFilter } : {}),
        }

        const leakWhere: any = {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(userFilter ? { createdById: userFilter } : {}),
            ...(siteFilter ? { site: siteFilter } : {}),
        }

        const savingWhere: any = {
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(userFilter ? { createdById: userFilter } : {}),
            ...(siteFilter ? { site: siteFilter } : {}),
        }

        const [
            dailyReports,
            travelPlans,
            costLeaks,
            costSavings,
            users,
        ] = await Promise.all([
            prisma.dailySiteReport.findMany({
                where: dailyWhere,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.travelVisitPlan.findMany({
                where: travelWhere,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.costLeakReport.findMany({
                where: leakWhere,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.costSavingReport.findMany({
                where: savingWhere,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.user.findMany({
                where: {
                    role: {
                        in: ["Mahendra", "Deepak", "Lakhan", "Ravi", "Suyesh", "Amitoj"],
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
                orderBy: { name: "asc" },
            }),
        ])

        const totalLeakage = costLeaks.reduce(
            (sum, item) => sum + safeNumber(item.monthlyImpact),
            0
        )

        const totalSaving = costSavings.reduce(
            (sum, item) => sum + safeNumber(item.monthlyImpact),
            0
        )

        const totalBillAuthorised = dailyReports.reduce(
            (sum, item) => sum + safeNumber(item.billAmountAuthorised),
            0
        )

        const totalBillClaimed = dailyReports.reduce(
            (sum, item) => sum + safeNumber(item.billAmountClaimed),
            0
        )

        const paymentPending = dailyReports.filter((item) =>
            String(item.paymentStatus || "").toLowerCase().includes("pending")
        ).length

        const salaryIssues = dailyReports.filter((item) => {
            const salaryIssue = String(item.salaryRelatedIssue || "").toLowerCase()
            const salaryPaid = String(item.salariesPaidForMonth || "").toLowerCase()

            return (
                salaryIssue.trim() !== "" ||
                salaryPaid === "no" ||
                salaryPaid === "pending"
            )
        }).length

        const hrIssues = dailyReports.filter((item) => {
            const value = String(item.hrIssue || "").toLowerCase()
            return value === "yes" || value === "true"
        }).length

        const operationalRisks = dailyReports.filter((item) => {
            const value = String(item.operationalRisks || "").toLowerCase()
            return value === "yes" || value === "true"
        }).length

        const openLeaks = costLeaks.filter(
            (item) => String(item.status || "").toLowerCase() === "open"
        ).length

        const closedLeaks = costLeaks.filter(
            (item) => String(item.status || "").toLowerCase() === "closed"
        ).length

        const openSavings = costSavings.filter(
            (item) => String(item.status || "").toLowerCase() === "open"
        ).length

        const closedSavings = costSavings.filter(
            (item) => String(item.status || "").toLowerCase() === "closed"
        ).length

        const unresolvedTravel = travelPlans.filter(
            (item) => item.issueResolved === false || item.issueResolved === null
        ).length

        const followUpRequired = travelPlans.filter(
            (item) => item.followUpRequired === true
        ).length

        const siteMap = new Map<
            string,
            {
                site: string
                dailyReports: number
                travelPlans: number
                leakAmount: number
                savingAmount: number
            }
        >()

        function ensureSite(siteName: string) {
            if (!siteMap.has(siteName)) {
                siteMap.set(siteName, {
                    site: siteName,
                    dailyReports: 0,
                    travelPlans: 0,
                    leakAmount: 0,
                    savingAmount: 0,
                })
            }

            return siteMap.get(siteName)!
        }

        dailyReports.forEach((item) => {
            ensureSite(item.siteName).dailyReports += 1
        })

        travelPlans.forEach((item) => {
            ensureSite(item.siteToVisit).travelPlans += 1
        })

        costLeaks.forEach((item) => {
            ensureSite(item.site).leakAmount += safeNumber(item.monthlyImpact)
        })

        costSavings.forEach((item) => {
            ensureSite(item.site).savingAmount += safeNumber(item.monthlyImpact)
        })

        const siteWise = Array.from(siteMap.values()).sort(
            (a, b) =>
                b.dailyReports +
                b.travelPlans +
                b.leakAmount +
                b.savingAmount -
                (a.dailyReports + a.travelPlans + a.leakAmount + a.savingAmount)
        )

        const monthMap = new Map<
            string,
            {
                month: string
                leakage: number
                saving: number
                dailyReports: number
                travelPlans: number
            }
        >()

        function ensureMonth(date: Date) {
            const key = monthKey(date)

            if (!monthMap.has(key)) {
                monthMap.set(key, {
                    month: key,
                    leakage: 0,
                    saving: 0,
                    dailyReports: 0,
                    travelPlans: 0,
                })
            }

            return monthMap.get(key)!
        }

        costLeaks.forEach((item) => {
            ensureMonth(item.createdAt).leakage += safeNumber(item.monthlyImpact)
        })

        costSavings.forEach((item) => {
            ensureMonth(item.createdAt).saving += safeNumber(item.monthlyImpact)
        })

        dailyReports.forEach((item) => {
            ensureMonth(item.createdAt).dailyReports += 1
        })

        travelPlans.forEach((item) => {
            ensureMonth(item.createdAt).travelPlans += 1
        })

        const monthWise = Array.from(monthMap.values())

        const userMap = new Map<
            string,
            {
                name: string
                dailyReports: number
                travelPlans: number
                leaks: number
                savings: number
            }
        >()

        function ensureUser(name: string) {
            if (!userMap.has(name)) {
                userMap.set(name, {
                    name,
                    dailyReports: 0,
                    travelPlans: 0,
                    leaks: 0,
                    savings: 0,
                })
            }

            return userMap.get(name)!
        }

        dailyReports.forEach((item) => {
            ensureUser(item.createdBy?.name || "Unknown").dailyReports += 1
        })

        travelPlans.forEach((item) => {
            ensureUser(item.createdBy?.name || "Unknown").travelPlans += 1
        })

        costLeaks.forEach((item) => {
            ensureUser(item.createdBy?.name || "Unknown").leaks += 1
        })

        costSavings.forEach((item) => {
            ensureUser(item.createdBy?.name || "Unknown").savings += 1
        })

        const userWise = Array.from(userMap.values())

        const latestActivity = [
            ...dailyReports.slice(0, 10).map((item) => ({
                id: item.id,
                type: "Daily Site Report",
                site: item.siteName,
                title: item.projectHead || item.siteName,
                amount: item.billAmountClaimed || item.billAmountAuthorised || null,
                status: item.operationalStatus || item.siteStatus || "-",
                createdBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...travelPlans.slice(0, 10).map((item) => ({
                id: item.id,
                type: "Travel Plan",
                site: item.siteToVisit,
                title: item.personTravelling,
                amount: item.estimatedCost || null,
                status:
                    item.issueResolved === true
                        ? "Resolved"
                        : item.followUpRequired
                            ? "Follow-up"
                            : "Pending",
                createdBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...costLeaks.slice(0, 10).map((item) => ({
                id: item.id,
                type: "Cost Leak",
                site: item.site,
                title: item.leakageType || item.description || item.site,
                amount: item.monthlyImpact || null,
                status: item.status || "-",
                createdBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),

            ...costSavings.slice(0, 10).map((item) => ({
                id: item.id,
                type: "Cost Saving",
                site: item.site,
                title: item.reductionSavingType || item.description || item.site,
                amount: item.monthlyImpact || null,
                status: item.status || "-",
                createdBy: item.createdBy?.name || "-",
                createdAt: item.createdAt,
            })),
        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 20)

        const sites = Array.from(
            new Set([
                ...dailyReports.map((item) => item.siteName),
                ...travelPlans.map((item) => item.siteToVisit),
                ...costLeaks.map((item) => item.site),
                ...costSavings.map((item) => item.site),
            ])
        ).sort()

        return NextResponse.json({
            success: true,

            filters: {
                users,
                sites,
            },

            totals: {
                dailyReports: dailyReports.length,
                travelPlans: travelPlans.length,
                costLeaks: costLeaks.length,
                costSavings: costSavings.length,

                totalLeakage,
                totalSaving,
                netImpact: totalSaving - totalLeakage,

                totalBillAuthorised,
                totalBillClaimed,
                billingGap: totalBillAuthorised - totalBillClaimed,

                paymentPending,
                salaryIssues,
                hrIssues,
                operationalRisks,

                openLeaks,
                closedLeaks,
                openSavings,
                closedSavings,

                unresolvedTravel,
                followUpRequired,
            },

            charts: {
                siteWise,
                monthWise,
                userWise,
                statusSummary: [
                    { name: "Payment Pending", value: paymentPending },
                    { name: "Salary Issues", value: salaryIssues },
                    { name: "HR Issues", value: hrIssues },
                    { name: "Operational Risks", value: operationalRisks },
                    { name: "Travel Follow-up", value: followUpRequired },
                ],
                costStatus: [
                    { name: "Open Leaks", value: openLeaks },
                    { name: "Closed Leaks", value: closedLeaks },
                    { name: "Open Savings", value: openSavings },
                    { name: "Closed Savings", value: closedSavings },
                ],
            },

            latestActivity,
        })
    } catch (error: any) {
        console.error("Operation dashboard error:", error)

        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Failed to load dashboard",
            },
            { status: 500 }
        )
    }
}