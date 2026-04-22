import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

// ✅ GET ALL RECORDS
export async function GET() {
    try {
        const records = await prisma.pettyCashRecord.findMany({
            orderBy: { createdAt: "desc" },
        })

        const formatted = records.map((row) => ({
            id: row.id,
            siteName: row.siteName,
            month: row.month || "",
            paymentDate: formatDate(row.paymentDate),
            individualName: row.individualName || "",
            fixedAmount: row.fixedAmount || 0,
            amountPaid: row.amountPaid || 0,
            purpose: row.purpose || "",
            auditStatus: row.auditStatus || "",
        }))

        return NextResponse.json({ success: true, records })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

// ✅ CREATE RECORD
export async function POST(req: Request) {
    try {
        const body = await req.json()

        const record = await prisma.pettyCashRecord.create({
            data: {
                siteName: body.siteName,
                month: body.month,
                paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
                individualName: body.individualName,
                fixedAmount: Number(body.fixedAmount || 0),
                amountPaid: Number(body.amountPaid || 0),
                additionalRequestRaised: body.additionalRequestRaised,
                lastDisbursement: body.lastDisbursement,
                pettyCashStatement: body.pettyCashStatement,
                auditStatus: body.auditStatus,
                auditObservationStatus: body.auditObservationStatus,
                purpose: body.purpose,
                currentExpenditureStatus: body.currentExpenditureStatus,
                remarks: body.remarks,
            },
        })

        return NextResponse.json({ success: true, record })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}