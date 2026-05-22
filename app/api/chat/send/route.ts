import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const { submissionId, message, senderId, senderRole } = body

        if (!submissionId || !message || !senderId || !senderRole) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 }
            )
        }

        const submission = await prisma.wmManpowerSubmission.findUnique({
            where: { id: submissionId },
            include: { site: true },
        })

        if (!submission) {
            return NextResponse.json(
                { error: "Invalid submissionId" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: senderId },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Invalid senderId" },
                { status: 400 }
            )
        }

        console.log("DEBUG:", {
            submissionId,
            senderId,
            senderRole,
        })

        const chat = await prisma.wmManpowerChat.create({
            data: {
                submissionId,
                message,
                senderId,
                senderRole,
            },
        })

        // 🔔 CREATE NOTIFICATIONS

        const submissionData = await prisma.wmManpowerSubmission.findUnique({
            where: { id: submissionId },
            include: { site: true },
        })

        // 👉 send to all except sender (basic version)
        const users = await prisma.user.findMany({
            where: {
                NOT: { id: senderId },
            },
        })

        await Promise.all(
            users.map((u) =>
                prisma.wmNotification.create({
                    data: {
                        userId: u.id,
                        message: `New message on ${submission?.site?.siteName || "site"}`,
                        link: `chat?submissionId=${submissionId}`
                    },
                })
            )
        )

        return NextResponse.json(chat)

    } catch (error) {
        console.error("CHAT SEND ERROR:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}