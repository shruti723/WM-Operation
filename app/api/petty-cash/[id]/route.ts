import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(req: Request, { params }: any) {
    try {
        const body = await req.json()

        const updated = await prisma.pettyCashRecord.update({
            where: { id: params.id },
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

        return NextResponse.json({ success: true, updated })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}