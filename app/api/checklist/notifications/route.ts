import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userName = searchParams.get("userName")

        if (!userName) {
            return NextResponse.json(
                { success: false, message: "UserName is required" },
                { status: 400 }
            )
        }

        let unreadCount = 0

        // ✅ unread count per user (FIXED)
        unreadCount = await prisma.checklistComment.count({
            where: {
                submission: {
                    supervisorName: userName,
                },
                authorRole: "admin",            // ✅ ONLY admin messages
                readBySupervisor: false,        // ✅ unread
                NOT: {
                    authorName: userName,         // ✅ exclude own messages
                },
            },
        })

        // ✅ ONLY USER-SPECIFIC DATA
        const notifications = await prisma.checklistComment.findMany({
            where: {
                submission: {
                    supervisorName: userName,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            select: {
                id: true,
                submissionId: true,
                authorName: true,
                authorRole: true,
                message: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            success: true,
            unreadCount,
            notifications,
        })
    } catch (error) {
        console.error("Checklist notification API error:", error)

        return NextResponse.json(
            { success: false, message: "Failed to load notifications" },
            { status: 500 }
        )
    }
}