import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const sites = await prisma.site.findMany({
            orderBy: { siteName: "asc" },
            select: { siteName: true },
        })

        return NextResponse.json({
            success: true,
            sites: sites.map((s) => s.siteName),
        })
    } catch (error) {
        console.error("Manpower sites API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load sites" },
            { status: 500 }
        )
    }
}