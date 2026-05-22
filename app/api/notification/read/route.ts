import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ success: false })
        }

        await prisma.wmNotification.update({
            where: { id },
            data: { isRead: true },
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("READ NOTIFICATION ERROR:", error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}