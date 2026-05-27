import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const sites = await prisma.wmSite.findMany({
            orderBy: { siteName: "asc" },
            select: {
                id: true,
                siteName: true,
                manpowerTemplate: {
                    select: {
                        authorised: true,
                    },
                },
            },
        })

        const formattedSites = sites.map((site) => ({
            id: site.id,
            siteName: site.siteName,
            manpowerAuthorized: site.manpowerTemplate.reduce(
                (sum, item) => sum + Number(item.authorised || 0),
                0
            ),
        }))

        return NextResponse.json({
            success: true,
            sites: formattedSites,
        })
    } catch (error) {
        console.error("WM sites fetch error:", error)

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch WM sites",
            },
            { status: 500 }
        )
    }
}