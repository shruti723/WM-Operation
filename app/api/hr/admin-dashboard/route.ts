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

        // ✅ 1. SITE DETAILS (HR1 ONLY)
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


        // ✅ 2. MANPOWER DETAILS (HR2 MULTIPLE ROWS)
        const manpowerDetails = sites.flatMap((site: any) => {

            console.log("SITE:", site.siteName)
            console.log("SUBMISSIONS:", site.manpowerSubmissions)

            const submissions = (site.manpowerSubmissions || [])
                .filter((s: any) =>
                    String(s.submittedByRole || "").toLowerCase().includes("level2")
                )

            // 👉 get latest submission
            const latestSub = [...submissions].sort(
                (a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]

            if (!latestSub) return []

            let required = 0
            let deployed = 0
            let shortage = 0
            let hr3Done = false

            const designationMap: any = {}

                // HR1 template
                ; (site.manpowerTemplate || []).forEach((item: any) => {
                    const key = item.designation

                    if (!designationMap[key]) {
                        designationMap[key] = {
                            authorised: 0,
                            deployed: 0,
                            needed: 0
                        }
                    }

                    designationMap[key].authorised += item.authorised || 0
                })

                // HR2 current submission
                ; (latestSub.items || []).forEach((item: any) => {
                    const key = item.designation
                    if (!designationMap[key]) return

                    designationMap[key].deployed += item.deployed || 0
                })

            // ✅ HR3 MATCH SAME DATE
            // ✅ HR3 is inside SAME submission (no separate level3)
            const items = Array.isArray(latestSub.items) ? latestSub.items : []

            const hasHR3Data = items.some(
                (item: any) =>
                    !!item.recruitmentProcess ||
                    !!item.responsible ||
                    !!item.cutoffDate ||
                    !!item.remarks
            )

            hr3Done = hasHR3Data

            // map needed values
            items.forEach((item: any) => {
                const key = item.designation

                if (!designationMap[key]) {
                    designationMap[key] = {
                        authorised: 0,
                        deployed: 0,
                        needed: 0
                    }
                }

                designationMap[key].needed = item.needed || 0
            })

            // calculations
            let siteNeeded = 0

            Object.values(designationMap).forEach((d: any) => {
                required += d.authorised
                deployed += d.deployed
                shortage += (d.authorised - d.deployed)
                siteNeeded += d.needed || 0
            })

            totalNeeded += siteNeeded

            totalDeployed += deployed
            totalShortage += shortage

            if (!hr3Done) pendingHR3++

            return {
                siteId: site.id,
                submissionId: latestSub.id,
                site: site.siteName,

                startDate: site.startDate,
                lastRenewalDate: site.lastRenewalDate,
                nextRenewalDate: site.nextRenewalDate,

                required,
                deployed,
                shortage,
                needed: siteNeeded, // ✅ ADD THIS

                hr3Done
            }
        })


        // ✅ FINAL RESPONSE
        return NextResponse.json({
            summary: {
                totalSites: sites.length,
                authorised: totalAuthorised,
                deployed: totalDeployed,
                shortage: totalShortage,
                needed: totalNeeded,
                pendingHR3
            },
            siteDetails,       // 🔥 HR1
            manpowerDetails   // 🔥 HR2
        })

    } catch (error: any) {
        console.error("🔥 ADMIN DASHBOARD ERROR:", error)

        return NextResponse.json({
            success: false,
            error: error?.message,
            stack: error?.stack
        }, { status: 500 })
    }
}