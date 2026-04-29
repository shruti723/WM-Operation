import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        // ✅ unread count for admin
        const unreadCount = await prisma.checklistComment.count({
            where: {
                authorRole: "supervisor",   // messages from supervisors
                readByAdmin: false,         // not read by admin
            },
        })

        // ✅ latest notifications
        const notifications = await prisma.checklistComment.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
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
            unreadCount,   // ✅ THIS WAS MISSING
            notifications,
        })
    } catch (error) {
        console.error("All notifications API error:", error)

        return NextResponse.json(
            { success: false, message: "Failed to load notifications" },
            { status: 500 }
        )
    }
}