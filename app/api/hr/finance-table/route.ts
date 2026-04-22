import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}

function getStatusLabel(status: string, stage: string) {
    if (status === "completed") return "Completed ✅"

    if (status === "pending" && stage === "account1") {
        return "Pending - A1"
    }

    if (status === "pending" && stage === "level2") {
        return "Pending - HR2"
    }

    return "Pending"
}

export async function GET() {
    try {
        const records = await prisma.financeRecord.findMany({
            orderBy: { createdAt: "desc" },
        })

        const data = records.map((row) => ({
            id: row.id,

            // 🔹 BASIC
            siteName: row.siteName || "",
            incharge: row.incharge || "",

            // 🔹 HR1 FIELDS
            startDate: formatDate(row.startDate),
            lastRenewalDate: formatDate(row.lastRenewalDate),
            nextRenewalDate: formatDate(row.nextRenewalDate),

            // 🔹 OPTIONAL (for later)
            monthlyBilling: row.monthlyBilling || "",
            invoiceDate: formatDate(row.invoiceDate),
            invoiceAmount: row.invoiceAmount || "",
            invoiceMonth: row.invoiceMonth || "",
            paymentStatus: row.paymentStatus || "",

            salaryDate: formatDate(row.salaryDate),
            salaryAmount: row.salaryAmount || "",
            salaryMonth: row.salaryMonth || "",

            // 🔹 STATUS
            status: row.status,
            statusLabel: getStatusLabel(row.status, row.currentStage),
            currentStage: row.currentStage,
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