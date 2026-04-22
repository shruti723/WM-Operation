import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const sites = await prisma.site.findMany({
            include: {
                manpowerTemplate: true,
                manpowerSubmissions: {
                    include: { items: true }
                }
            }
        }) as any

        let totalAuthorised = 0
        let totalDeployed = 0
        let totalShortage = 0
        let totalNeeded = 0
        let pendingHR3 = 0

        // HR1 site details
        const siteDetails = sites.map((site: any) => {
            const required = (site.manpowerTemplate || []).reduce(
                (sum: number, i: any) => sum + (i.authorised || 0),
                0
            )

            totalAuthorised += required

            return {
                siteId: site.id,
                site: site.siteName,
                startDate: site.startDate,
                lastRenewalDate: site.lastRenewalDate,
                nextRenewalDate: site.nextRenewalDate,
                required
            }
        })

        // HR2/HR3 manpower history
        const manpowerDetails = sites.flatMap((site: any) => {
            const submissions = (site.manpowerSubmissions || [])
                .filter((s: any) =>
                    String(s.submittedByRole || "").toLowerCase().includes("level2")
                )
                .sort(
                    (a: any, b: any) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )

            return submissions.map((sub: any) => {
                let required = 0
                let deployed = 0
                let shortage = 0
                let hr3Done = false

                const designationMap: Record<
                    string,
                    { authorised: number; deployed: number; needed: number }
                > = {}

                    ; (site.manpowerTemplate || []).forEach((item: any) => {
                        const key = item.designation

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
                        const key = item.designation

                        if (!designationMap[key]) {
                            designationMap[key] = {
                                authorised: 0,
                                deployed: 0,
                                needed: 0,
                            }
                        }

                        designationMap[key].deployed += item.deployed || 0
                        designationMap[key].needed = item.needed || 0
                    })

                const items = Array.isArray(sub.items) ? sub.items : []

                hr3Done = items.some(
                    (item: any) =>
                        !!item.recruitmentProcess ||
                        !!item.responsible ||
                        !!item.cutoffDate ||
                        !!item.remarks
                )

                let siteNeeded = 0

                Object.values(designationMap).forEach((d: any) => {
                    required += d.authorised
                    deployed += d.deployed
                    shortage += d.authorised - d.deployed
                    siteNeeded += d.needed || 0
                })



                return {
                    siteId: site.id,
                    submissionId: sub.id,
                    site: site.siteName,
                    createdAt: sub.createdAt,

                    startDate: site.startDate,
                    lastRenewalDate: site.lastRenewalDate,
                    nextRenewalDate: site.nextRenewalDate,

                    required,
                    deployed,
                    shortage,
                    needed: siteNeeded,
                    hr3Done,
                }
            })
        })

        const latestBySite = new Map()

        manpowerDetails.forEach((item: any) => {
            if (
                !latestBySite.has(item.siteId) ||
                new Date(item.createdAt) > new Date(latestBySite.get(item.siteId).createdAt)
            ) {
                latestBySite.set(item.siteId, item)
            }
        })

        const latestRecords = Array.from(latestBySite.values())

        // RESET totals
        totalDeployed = 0
        totalShortage = 0
        totalNeeded = 0
        pendingHR3 = 0

        latestRecords.forEach((item: any) => {
            totalDeployed += item.deployed
            totalShortage += item.shortage
            totalNeeded += item.needed

            if (!item.hr3Done) pendingHR3++
        })

        return NextResponse.json({
            summary: {
                totalSites: sites.length,
                authorised: totalAuthorised,
                deployed: totalDeployed,
                shortage: totalShortage,
                needed: totalNeeded,
                pendingHR3,
            },
            siteDetails,
            manpowerDetails,
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