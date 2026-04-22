import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// ✅ SAFE DATE PARSER
function parseDate(value: string | null | undefined) {
    if (!value) return null

    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
}

// ✅ PAYMENT STATUS MAPPER
function mapPaymentStatus(value: string | null | undefined) {
    if (!value) return null

    if (value === "RECEIVED") return "RECEIVED"
    if (value === "PENDING") return "PENDING"

    return null
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const role = String(body.role || "").toLowerCase()
        const siteName = String(body.siteName || body.site || "").trim()

        // =========================
        // 🟡 HR1 → CREATE / UPDATE
        // =========================
        if (role === "level1") {

            if (body.id) {
                // 🔥 GET EXISTING (IMPORTANT)
                const existing = await prisma.financeRecord.findUnique({
                    where: { id: body.id },
                })

                if (!existing) {
                    return NextResponse.json({
                        success: false,
                        message: "Record not found",
                    })
                }

                const record = await prisma.financeRecord.update({
                    where: { id: body.id },
                    data: {
                        incharge: body.incharge || existing.incharge,

                        startDate:
                            body.startDate
                                ? parseDate(body.startDate)
                                : existing.startDate,

                        lastRenewalDate:
                            body.lastRenewalDate
                                ? parseDate(body.lastRenewalDate)
                                : existing.lastRenewalDate,

                        nextRenewalDate:
                            body.nextRenewalDate
                                ? parseDate(body.nextRenewalDate)
                                : existing.nextRenewalDate,

                        monthlyBilling:
                            body.monthlyBilling !== undefined && body.monthlyBilling !== ""
                                ? Number(body.monthlyBilling)
                                : existing.monthlyBilling,

                        updatedBy: body.userId || null,
                    },
                })

                return NextResponse.json({
                    success: true,
                    message: "HR1 updated successfully",
                    record,
                })
            }

            // 🔥 CREATE NEW
            if (!siteName) {
                return NextResponse.json(
                    { success: false, message: "Site name is required" },
                    { status: 400 }
                )
            }

            const record = await prisma.financeRecord.create({
                data: {
                    siteName: siteName,
                    incharge: body.incharge || null,
                    startDate: parseDate(body.startDate),

                    monthlyBilling:
                        body.monthlyBilling
                            ? Number(body.monthlyBilling)
                            : null,

                    lastRenewalDate: parseDate(body.lastRenewalDate),
                    nextRenewalDate: parseDate(body.nextRenewalDate),

                    currentStage: "account1",
                    status: "pending",
                    createdBy: body.userId || null,
                },
            })

            return NextResponse.json({
                success: true,
                message: "HR1 submitted → sent to A1",
                record,
            })
        }

        // =========================
        // 🟠 A1 → UPDATE
        // =========================
        if (role === "account1") {

            const existing = await prisma.financeRecord.findUnique({
                where: { id: body.id },
            })

            if (!existing) {
                return NextResponse.json({
                    success: false,
                    message: "Record not found",
                })
            }

            const record = await prisma.financeRecord.update({
                where: { id: body.id },
                data: {
                    updatedBy: body.userId || null,

                    monthlyBilling:
                        body.monthlyBilling !== undefined && body.monthlyBilling !== ""
                            ? Number(body.monthlyBilling)
                            : existing.monthlyBilling,

                    invoiceDate:
                        body.invoiceDate
                            ? parseDate(body.invoiceDate)
                            : existing.invoiceDate,

                    invoiceAmount:
                        body.invoiceAmount !== undefined && body.invoiceAmount !== ""
                            ? Number(body.invoiceAmount)
                            : existing.invoiceAmount,

                    invoiceMonth:
                        body.invoiceMonth || existing.invoiceMonth,

                    paymentStatus:
                        mapPaymentStatus(body.paymentStatus) || existing.paymentStatus,
                },
            })

            return NextResponse.json({
                success: true,
                message: "A1 updated successfully",
                record,
            })
        }

        // =========================
        // 🟢 HR2 → UPDATE
        // =========================
        if (role === "level2") {

            const existing = await prisma.financeRecord.findUnique({
                where: { id: body.id },
            })

            if (!existing) {
                return NextResponse.json({
                    success: false,
                    message: "Record not found",
                })
            }

            const record = await prisma.financeRecord.update({
                where: { id: body.id },
                data: {
                    salaryDate:
                        body.salaryDate
                            ? parseDate(body.salaryDate)
                            : existing.salaryDate,

                    salaryAmount:
                        body.salaryAmount !== undefined && body.salaryAmount !== ""
                            ? Number(body.salaryAmount)
                            : existing.salaryAmount,

                    salaryMonth:
                        body.salaryMonth || existing.salaryMonth,

                    updatedBy: body.userId || null,
                },
            })

            return NextResponse.json({
                success: true,
                message: "HR2 updated successfully",
                record,
            })
        }

        return NextResponse.json({
            success: false,
            message: "Invalid role",
        })

    } catch (error) {
        console.error("🔥 Finance API error:", error)

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Something went wrong",
            },
            { status: 500 }
        )
    }
}