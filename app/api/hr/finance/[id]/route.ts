import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null) {
    if (!date) return ""
    return date.toISOString().split("T")[0]
}


function mapPaymentStatus(value: string | null | undefined): "RECEIVED" | "PENDING" | null {
    if (!value) return null

    if (value === "Payment Received") return "RECEIVED"
    if (value === "Payment Pending") return "PENDING"

    return null
}

// =========================
// 🔹 GET → Fetch full record
// =========================
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const record = await prisma.financeRecord.findUnique({
            where: { id }
        })

        if (!record) {
            return NextResponse.json(
                { success: false, message: "Record not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                id: record.id,

                // 🔹 BASIC
                site: record.siteName || "-",
                incharge: record.incharge || "",

                // 🔹 HR1
                startDate: formatDate(record.startDate),
                lastRenewalDate: formatDate(record.lastRenewalDate),
                nextRenewalDate: formatDate(record.nextRenewalDate),
                monthlyBilling: record.monthlyBilling || "",

                // 🔹 A1
                invoiceDate: formatDate(record.invoiceDate),
                invoiceAmount: record.invoiceAmount || "",
                invoiceMonth: record.invoiceMonth || "",
                paymentStatus: record.paymentStatus || "",

                // 🔹 HR2
                salaryDate: formatDate(record.salaryDate),
                salaryAmount: record.salaryAmount || "",
                salaryMonth: record.salaryMonth || "",

                // 🔹 WORKFLOW
                status: record.status,
                currentStage: record.currentStage,

                createdAt: formatDate(record.createdAt),
            },
        })
    } catch (error) {
        console.error("Finance GET by ID error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to fetch record" },
            { status: 500 }
        )
    }
}

// =========================
// 🔹 PUT → Update record
// =========================
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await req.json()

        const user = body.user
        const role = body.role || user?.role

        const existing = await prisma.financeRecord.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json({
                success: false,
                message: "Record not found",
            })
        }

        // =========================
        // 🟠 A1 UPDATE
        // =========================
        if (role === "account1") {
            if (existing.currentStage !== "account1") {
                return NextResponse.json({
                    success: false,
                    message: "Not allowed",
                })
            }

            console.log("PUT BODY:", body)
            console.log("PUT USER:", user)
            console.log("PUT ROLE:", role)

            const updated = await prisma.financeRecord.update({
                where: { id },
                data: {
                    monthlyBilling:
                        body.monthlyBilling !== undefined && body.monthlyBilling !== ""
                            ? Number(body.monthlyBilling)
                            : null,

                    invoiceDate: body.invoiceDate
                        ? new Date(body.invoiceDate)
                        : null,

                    invoiceAmount:
                        body.invoiceAmount !== undefined && body.invoiceAmount !== ""
                            ? Number(body.invoiceAmount)
                            : null,

                    invoiceMonth: body.invoiceMonth || null,
                    paymentStatus: mapPaymentStatus(body.paymentStatus),

                    currentStage: "level2",
                    updatedBy: user?.id || null,
                },
            })

            return NextResponse.json({
                success: true,
                message: "A1 updated successfully",
                data: updated,
            })
        }

        // =========================
        // 🟢 HR2 FINAL UPDATE
        // =========================
        if (role === "level2") {
            if (existing.currentStage !== "level2") {
                return NextResponse.json({
                    success: false,
                    message: "Not allowed",
                })
            }

            const updated = await prisma.financeRecord.update({
                where: { id },
                data: {
                    salaryDate: body.salaryDate
                        ? new Date(body.salaryDate)
                        : null,
                    salaryAmount: body.salaryAmount
                        ? Number(body.salaryAmount)
                        : null,
                    salaryMonth: body.salaryMonth || null,

                    status: "completed",
                    currentStage: "completed",
                    updatedBy: user?.id || null,
                },
            })

            return NextResponse.json({
                success: true,
                message: "HR2 completed record ✅",
                data: updated,
            })
        }

        return NextResponse.json({
            success: false,
            message: "Invalid role",
        })
    } catch (error) {
        console.error("Finance PUT error:", error)
        return NextResponse.json(
            { success: false, message: "Update failed" },
            { status: 500 }
        )
    }
}