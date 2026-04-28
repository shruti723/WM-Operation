import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        console.log("BODY:", body)

        const record = await prisma.bDReport.create({
            data: {
                proposalsUnderProcess: body.proposalsUnderProcess || "",
                proposalsSent: body.proposalsSent || "",
                tendersUnderProcess: body.tendersUnderProcess || "",
                tendersSubmitted: body.tendersSubmitted || "",
                misc: body.misc || "",
                role: body.role ? body.role.toLowerCase().trim() : "level1",

            },
        })

        return NextResponse.json({ success: true, data: record })
    } catch (error) {
        console.error("BD SAVE ERROR:", error)

        return NextResponse.json(
            { success: false, message: "Failed to save" },
            { status: 500 }
        )
    }
}