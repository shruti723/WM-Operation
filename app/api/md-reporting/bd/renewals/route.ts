import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"


export async function GET(req: NextRequest) {
    try {
        const sites = await prisma.site.findMany()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endOfMonth.setHours(0, 0, 0, 0)

        const next3Months = new Date(today)
        next3Months.setMonth(today.getMonth() + 3)
        next3Months.setHours(0, 0, 0, 0)

        const data = sites.map((site: any) => {
            let renewalDate = site.nextRenewalDate

            if (renewalDate) {
                renewalDate = new Date(renewalDate)
                renewalDate.setHours(0, 0, 0, 0)
            }

            let category = "Later"
            let isOverdue = false

            if (renewalDate) {
                const next30 = new Date(today)
                next30.setDate(today.getDate() + 30)

                if (renewalDate >= today && renewalDate <= next30) {
                    category = "Next 30 Days"
                } else if (renewalDate > next30 && renewalDate <= next3Months) {
                    category = "Next 3 Months"
                }

                if (renewalDate < today) {
                    isOverdue = true
                }
            }

            return {
                id: site.id,
                siteName: site.siteName,
                nextRenewalDate: site.nextRenewalDate || null,
                category,
                status: "Pending",
                isOverdue,
                siteType: site.siteType || "CLIENT",
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}