import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role")

        if (!role) {
            return NextResponse.json(
                { success: false, message: "Role is required" },
                { status: 400 }
            )
        }

        const lowerRole = role.toLowerCase()

        let unreadCount = 0
        let notifications: any[] = []

        if (lowerRole === "admin") {
            unreadCount = await prisma.checklistComment.count({
                where: {
                    readByAdmin: false,
                    authorRole: {
                        not: "admin",
                    },
                },
            })

            notifications = await prisma.checklistComment.findMany({
                where: {
                    readByAdmin: false,
                    authorRole: {
                        not: "admin",
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
        } else {
            unreadCount = await prisma.checklistComment.count({
                where: {
                    readBySupervisor: false,
                    authorRole: "admin",
                },
            })

            notifications = await prisma.checklistComment.findMany({
                where: {
                    readBySupervisor: false,
                    authorRole: "admin",
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
        }

        return NextResponse.json({
            success: true,
            unreadCount,
            notifications,
        })
    } catch (error) {
        console.error("Checklist notification count API error:", error)

        return NextResponse.json(
            { success: false, message: "Failed to load notifications" },
            { status: 500 }
        )
    }
}