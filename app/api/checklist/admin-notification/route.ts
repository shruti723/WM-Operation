import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const unreadCount = await prisma.checklistComment.count({
            where: {
                authorRole: "supervisor",  // messages from supervisors
                readByAdmin: false,        // unread by admin
            },
        })

        return NextResponse.json({
            success: true,
            unreadCount,
        })
    } catch (error) {
        return NextResponse.json(
            { success: false },
            { status: 500 }
        )
    }
}