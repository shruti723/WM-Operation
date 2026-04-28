import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const data = await prisma.operationReport.findMany({
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { success: false },
            { status: 500 }
        )
    }
}