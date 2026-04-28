import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const role = searchParams.get("role") // 👈 NEW

        const reports = await prisma.bDReport.findMany({
            where: role
                ? {
                    role: {
                        equals: role,
                        mode: "insensitive", // ✅ FIX
                    },
                }
                : {}, // 👈 FILTER
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                createdAt: true,
                role: true,        // ✅ ADD

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