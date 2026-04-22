import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const reports = await prisma.bDReport.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: reports,
        })
    } catch (error) {
        console.error("BD HISTORY ERROR:", error)

        return NextResponse.json(
            { success: false, message: "Failed to load history" },
            { status: 500 }
        )
    }
}