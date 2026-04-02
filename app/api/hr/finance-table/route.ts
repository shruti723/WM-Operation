import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

function mapPaymentStatus(value: string | null) {
    if (!value) return "Unknown"
    if (value === "PAID") return "Paid"
    if (value === "PENDING") return "Payment Pending"
    if (value === "PARTIAL") return "Partial"
    return value
}

export async function GET() {
    try {
        const records = await prisma.financeRecord.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                site: true,
            },
        })

        const data = records.map((row) => ({
            site: row.site?.siteName || "-",
            incharge: row.incharge || "-",
            startDate: formatDate(row.site?.startDate ?? null),
            lastRenewalDate: formatDate(row.site?.lastRenewalDate ?? null),
            nextRenewalDate: formatDate(row.site?.nextRenewalDate ?? null),
            billing: row.monthlyBilling || 0,
            invoiceDate: formatDate(row.invoiceDate),
            invoiceAmount: row.invoiceAmount || 0,
            invoiceMonth: row.invoiceMonth || "-",
            paymentStatus: mapPaymentStatus(row.paymentStatus as any),
            salaryDate: formatDate(row.salaryDate),
            salaryAmount: row.salaryAmount || 0,
            salaryMonth: row.salaryMonth || "-",
            updatedOn: formatDate(row.updatedOn),
        }))

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error("Finance table API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load finance table" },
            { status: 500 }
        )
    }
}