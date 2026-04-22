import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// ✅ GET SINGLE REPORT
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            )
        }

        const record = await prisma.bDReport.findUnique({
            where: { id },
        })

        if (!record) {
            return NextResponse.json(
                { success: false, message: "Record not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: record,
        })
    } catch (error) {
        console.error("GET BD REPORT ERROR:", error)

        return NextResponse.json(
            { success: false, message: "Failed to fetch report" },
            { status: 500 }
        )
    }
}

// ✅ UPDATE REPORT
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await req.json()

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            )
        }

        const updated = await prisma.bDReport.update({
            where: { id },
            data: {
                proposalsUnderProcess: body.proposalsUnderProcess || "",
                proposalsSent: body.proposalsSent || "",
                tendersUnderProcess: body.tendersUnderProcess || "",
                tendersSubmitted: body.tendersSubmitted || "",
                misc: body.misc || "",
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error("UPDATE BD REPORT ERROR:", error)

        return NextResponse.json(
            { success: false, message: "Failed to update report" },
            { status: 500 }
        )
    }
}