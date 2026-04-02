import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const { submissionId, authorName, authorRole, message } = body

        if (!submissionId || !authorName || !authorRole || !message?.trim()) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            )
        }

        const submission = await prisma.checklistSubmission.findUnique({
            where: { id: submissionId },
        })

        if (!submission) {
            return NextResponse.json(
                { success: false, message: "Checklist submission not found" },
                { status: 404 }
            )
        }

        const isAdmin = String(authorRole).toLowerCase() === "admin"

        const comment = await prisma.checklistComment.create({
            data: {
                submissionId,
                authorName,
                authorRole,
                message: message.trim(),
                readByAdmin: isAdmin,
                readBySupervisor: !isAdmin,
            },
        })

        return NextResponse.json({
            success: true,
            data: comment,
        })
    } catch (error) {
        console.error("Checklist comment API error:", error)

        return NextResponse.json(
            { success: false, message: "Failed to send message" },
            { status: 500 }
        )
    }
}