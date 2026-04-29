import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userName, role, submissionId } = body

        if (!role) {
            return NextResponse.json(
                { success: false, message: "role is required" },
                { status: 400 }
            )
        }

        // ✅ SUPERVISOR reading ADMIN messages
        if (role === "supervisor") {
            await prisma.checklistComment.updateMany({
                where: {
                    submissionId,
                    authorRole: "admin",
                    readBySupervisor: false,
                },
                data: {
                    readBySupervisor: true,
                },
            })
        }

        // ✅ ADMIN reading SUPERVISOR messages
        if (role === "admin") {
            await prisma.checklistComment.updateMany({
                where: {
                    submissionId,
                    authorRole: "supervisor",
                    readByAdmin: false,
                },
                data: {
                    readByAdmin: true,
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