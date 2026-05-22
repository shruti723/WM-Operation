import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return NextResponse.json([], { status: 200 })
        }

        const notifications = await prisma.wmNotification.findMany({
            where: {
                userId: userId,   // 🔥 IMPORTANT
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        })

        return NextResponse.json(notifications)

    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error)
        return NextResponse.json([], { status: 500 })
    }
}