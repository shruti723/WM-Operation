import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const search = searchParams.get("search")?.toLowerCase().trim() || ""
        const status = searchParams.get("status") || "all"
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const siteType = searchParams.get("siteType") || "all"

        const sites = await prisma.site.findMany({
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
                    .map(i => i.recruitmentProcess)
                    .filter(p => p && p !== "Select")

                const unique = [...new Set(processes)]

                if (unique.length === 0) {
                    return { label: "-", count: 0, all: [] }
                }

                if (unique.length === 1) {
                    return { label: unique[0], count: 1, all: unique }
                }

                return {
                    label: `${unique[0]} + ${unique.length - 1} more`,
                    count: unique.length,
                    all: unique, // ✅ IMPORTANT
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
                siteType === "all" ||
                (item.siteCategory || "").toUpperCase() === siteType

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

        /* ---------------- SUMMARY FROM LATEST RECORDS ONLY ---------------- */

        const summary = {
            totalSites: sites.length,

            authorised: latestRecords.reduce(
                (sum: number, item: any) => sum + (item.required || 0),
                0
            ),

            deployed: latestRecords.reduce(
                (sum: number, item: any) => sum + (item.deployed || 0),
                0
            ),

            shortage: latestRecords.reduce(
                (sum: number, item: any) => sum + (item.shortage || 0),
                0
            ),

            needed: latestRecords.reduce(
                (sum: number, item: any) => sum + (item.needed || 0),
                0
            ),

            pendingHR3: latestRecords.filter((item: any) => !item.hr3Done).length,
        }

        /* ---------------- CHARTS FROM LATEST RECORDS ---------------- */

        const chartData = latestRecords.map((item: any) => ({
            siteId: item.siteId,
            name: item.site,
            authorised: item.required,
            deployed: item.deployed,
            shortage: item.shortage,
            needed: item.needed,
        }))

        const statusData = [
            {
                name: "Completed",
                value: latestRecords.filter((item: any) => item.hr3Done).length,
            },
            {
                name: "Pending",
                value: latestRecords.filter((item: any) => !item.hr3Done).length,
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

        const allNeeded = [...latestRecords]
            .sort((a, b) => (b.needed || 0) - (a.needed || 0))


        const recentActivity = [...filteredDetails]
            .sort(
                (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, 5)

        return NextResponse.json({
            success: true,

            summary,

            // Site table
            siteDetails,

            // Manpower table: all records/forms visible
            manpowerDetails: filteredDetails,

            // Dashboard: latest per site only
            latestRecords,
            chartData,
            statusData,
            trendData,
            allNeeded,
            recentActivity,
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