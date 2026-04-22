import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function calcAgingDays(date: Date | null) {
    if (!date) return 0
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDateTime(date: Date | null) {
    if (!date) return ""
    return date.toISOString()
}

function paymentStatusLabel(value: string | null | undefined) {
    if (!value) return ""

    if (value === "PAID" || value === "Payment Received") {
        return "Payment Received"
    }

    if (value === "PENDING" || value === "PARTIAL" || value === "Payment Pending") {
        return "Payment Pending"
    }

    return value
}

export async function GET() {
    try {
        const records = await prisma.financeRecord.findMany({
            orderBy: { createdAt: "desc" },
        })

        const mappedRecords = records.map((r) => {
            const agingDays = calcAgingDays(r.createdAt)

            let stage: "hr1" | "account1" | "level2" | "completed" = "hr1"

            if (r.currentStage === "account1") stage = "account1"
            else if (r.currentStage === "level2") stage = "level2"
            else if (r.currentStage === "completed" || r.status === "completed") stage = "completed"

            let status: "pending" | "completed" | "overdue" = "pending"
            if (r.status === "completed" || r.currentStage === "completed") {
                status = "completed"
            } else if (agingDays > 7) {
                status = "overdue"
            }

            return {
                id: r.id,
                siteName: r.siteName || "—",
                incharge: r.incharge || "—",
                stage,
                status,
                billing: Number(r.monthlyBilling ?? 0),
                invoice: Number(r.invoiceAmount ?? 0),
                salary: Number(r.salaryAmount ?? 0),
                updatedAt: formatDateTime(r.createdAt),
                agingDays,

                hr1Answers: [
                    { question: "Site Name", answer: r.siteName || "—" },
                    { question: "Incharge", answer: r.incharge || "—" },
                    {
                        question: "Start Date",
                        answer: r.startDate ? r.startDate.toISOString().split("T")[0] : "—",
                    },
                    {
                        question: "Last Renewal Date",
                        answer: r.lastRenewalDate ? r.lastRenewalDate.toISOString().split("T")[0] : "—",
                    },
                    {
                        question: "Next Renewal Due On",
                        answer: r.nextRenewalDate ? r.nextRenewalDate.toISOString().split("T")[0] : "—",
                    },
                ],

                a1Answers: [
                    {
                        question: "Monthly Billing as per Contract / as per average yearly",
                        answer: r.monthlyBilling ? `₹${Number(r.monthlyBilling).toLocaleString("en-IN")}` : "—",
                    },
                    {
                        question: "Last Invoice Raise - On Date",
                        answer: r.invoiceDate ? r.invoiceDate.toISOString().split("T")[0] : "—",
                    },
                    {
                        question: "Last Invoice Raise - Amount",
                        answer: r.invoiceAmount ? `₹${Number(r.invoiceAmount).toLocaleString("en-IN")}` : "—",
                    },
                    {
                        question: "Last Invoice Raise - For Month of",
                        answer: r.invoiceMonth || "—",
                    },
                    {
                        question: "Invoice Payment Status",
                        answer: paymentStatusLabel(r.paymentStatus as string),
                    },
                ],

                hr2Answers: [
                    {
                        question: "Last Salary Disbursement - Date",
                        answer: r.salaryDate ? r.salaryDate.toISOString().split("T")[0] : "—",
                    },
                    {
                        question: "Last Salary Disbursement - INR Amount",
                        answer: r.salaryAmount ? `₹${Number(r.salaryAmount).toLocaleString("en-IN")}` : "—",
                    },
                    {
                        question: "Last Salary Disbursement - For Month of",
                        answer: r.salaryMonth || "—",
                    },
                ],

                timeline: [
                    {
                        title: "Record created",
                        actor: "HR1",
                        at: formatDateTime(r.createdAt),
                    },
                    ...(r.currentStage === "level2" || r.currentStage === "completed"
                        ? [
                            {
                                title: "A1 submitted",
                                actor: "A1",
                                at: formatDateTime(r.createdAt),
                            },
                        ]
                        : []),
                    ...(r.currentStage === "completed"
                        ? [
                            {
                                title: "HR2 completed",
                                actor: "HR2",
                                at: formatDateTime(r.createdAt),
                            },
                        ]
                        : []),
                ],
            }
        })

        const summary = {
            totalSites: mappedRecords.length,
            completed: mappedRecords.filter((r) => r.stage === "completed").length,
            pendingHr1: mappedRecords.filter((r) => r.stage === "hr1").length,
            pendingA1: mappedRecords.filter((r) => r.stage === "account1").length,
            pendingHr2: mappedRecords.filter((r) => r.stage === "level2").length,
            overdue: mappedRecords.filter((r) => r.status === "overdue").length,
            totalBilling: Number(
                (
                    mappedRecords.reduce((sum, r) => sum + r.billing, 0) / 100000
                ).toFixed(1)
            ),
            totalInvoice: Number(
                (
                    mappedRecords.reduce((sum, r) => sum + r.invoice, 0) / 100000
                ).toFixed(1)
            ),
            totalSalary: Number(
                (
                    mappedRecords.reduce((sum, r) => sum + r.salary, 0) / 100000
                ).toFixed(1)
            ),
        }

        return NextResponse.json({
            summary,
            records: mappedRecords,
        })
    } catch (error) {
        console.error("Finance dashboard API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load finance dashboard" },
            { status: 500 }
        )
    }
}