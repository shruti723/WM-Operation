import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function parseDate(value: string | null | undefined) {
    if (!value) return null
    return new Date(value)
}

function mapPaymentStatus(value: string | null | undefined) {
    if (!value) return null
    if (value === "Paid") return "PAID"
    if (value === "Payment Pending") return "PENDING"
    if (value === "Partial") return "PARTIAL"
    return null
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const siteName = String(body.siteName || "").trim()
        const incharge = String(body.incharge || "").trim()
        const monthlyBilling = String(body.monthlyBilling || "").trim()
        const invoiceAmount = String(body.invoiceAmount || "").trim()
        const salaryAmount = String(body.salaryAmount || "").trim()

        if (!siteName) {
            return NextResponse.json(
                { success: false, message: "Site name is required" },
                { status: 400 }
            )
        }

        if (
            !incharge &&
            !body.startDate &&
            !body.lastRenewalDate &&
            !body.nextRenewalDate &&
            !monthlyBilling &&
            !body.invoiceDate &&
            !invoiceAmount &&
            !body.invoiceMonth &&
            !body.paymentStatus &&
            !body.salaryDate &&
            !salaryAmount &&
            !body.salaryMonth
        ) {
            return NextResponse.json(
                { success: false, message: "Please fill at least one finance field" },
                { status: 400 }
            )
        }

        const site = await prisma.site.findUnique({
            where: { siteName },
        })

        if (!site) {
            return NextResponse.json(
                { success: false, message: "Site not found" },
                { status: 404 }
            )
        }

        await prisma.financeRecord.create({
            data: {
                siteId: site.id,
                incharge: incharge || null,
                monthlyBilling: monthlyBilling ? Number(monthlyBilling) : null,
                invoiceDate: parseDate(body.invoiceDate),
                invoiceAmount: invoiceAmount ? Number(invoiceAmount) : null,
                invoiceMonth: body.invoiceMonth || null,
                paymentStatus: mapPaymentStatus(body.paymentStatus) as any,
                salaryDate: parseDate(body.salaryDate),
                salaryAmount: salaryAmount ? Number(salaryAmount) : null,
                salaryMonth: body.salaryMonth || null,
                updatedOn: body.updatedOn ? new Date(body.updatedOn) : new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: "Finance data submitted successfully",
        })
    } catch (error) {
        console.error("Finance POST API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to submit finance data" },
            { status: 500 }
        )
    }
}