import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { role } = body

        if (!role) {
            return NextResponse.json(
                { success: false, message: "role is required" },
                { status: 400 }
            )
        }

        const lowerRole = String(role).toLowerCase()

        if (lowerRole === "admin") {
            await prisma.checklistComment.updateMany({
                where: {
                    readByAdmin: false,
                },
                data: {
                    readByAdmin: true,
                },
            })
        } else {
            await prisma.checklistComment.updateMany({
                where: {
                    readBySupervisor: false,
                },
                data: {
                    readBySupervisor: true,
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Checklist mark-read API error:", error)

        return NextResponse.json(
            { success: false, message: "Failed to mark notifications as read" },
            { status: 500 }
        )
    }
}