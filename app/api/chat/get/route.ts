import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const submissionId = searchParams.get("submissionId")

        if (!submissionId) return NextResponse.json([])

        const messages = await prisma.manpowerChat.findMany({
            where: { submissionId },
            orderBy: { createdAt: "asc" },

            // ✅ FIX: use safe include
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error("CHAT GET ERROR:", error)
        return NextResponse.json([], { status: 200 }) // ✅ prevent crash
    }
}