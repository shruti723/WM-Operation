import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/* ---------------- TYPES ---------------- */

type IncomingRow = {
    month: string
    srNo: number
    siteName: string
    billAmount: number | null
    prepared: string
    prepareDate: string | null
    dispatched: string
    dispatchDate: string | null
    paymentCheque: string
    receivedDate: string | null
    paymentReceivedDays: number | null
    salaryStatus: string | null
}

type IncomingPayload = {
    secret?: string
    rows?: IncomingRow[]
    months?: string[]
}

/* ---------------- HELPERS ---------------- */

function normalizeMonth(value: unknown): string {
    return String(value || "").trim().toUpperCase()
}

function normalizeYesNo(value: unknown): string {
    if (value === null || value === undefined || value === "") return "No"
    const str = String(value).trim().toLowerCase()
    return ["yes", "y", "true"].includes(str) ? "Yes" : "No"
}

function cleanDate(value: unknown): string | null {
    if (!value) return null

    const str = String(value).trim()

    // dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str

    // fallback parse
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0")
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const year = d.getFullYear()
        return `${day}-${month}-${year}`
    }

    return null
}

/* ---------------- MAIN API ---------------- */

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as IncomingPayload

        // 🔐 SECURITY
        if (body.secret !== process.env.FINANCE_SYNC_SECRET) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        const rows = Array.isArray(body.rows) ? body.rows : []

        // ✅ Normalize months from payload
        const months = Array.isArray(body.months)
            ? body.months.map((m) => normalizeMonth(m)).filter(Boolean)
            : []

        if (!rows.length) {
            return NextResponse.json(
                { success: false, message: "No rows received" },
                { status: 400 }
            )
        }

        const now = new Date()

        /* ---------------- STEP 1: MARK OLD DATA INACTIVE ---------------- */

        await prisma.financeSheetRecord.updateMany({
            where: {
                month: { in: months },
                source: "google-sheet-appscript",
            },
            data: {
                isActive: false,
                lastSyncedAt: now,
            },
        })

        let processed = 0

        /* ---------------- STEP 2: UPSERT ROWS ---------------- */
        const batchSize = 50

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize)

            await Promise.all(

                batch.map(async (row) => {
                    console.log("SALARY STATUS API:", row.salaryStatus)
                    const normalizedMonth = normalizeMonth(row.month)
                    const normalizedSrNo = Number(row.srNo)

                    const normalizedSiteName = String(row.siteName || "")
                        .trim()
                        .toUpperCase()

                    if (!normalizedMonth || !normalizedSrNo || !normalizedSiteName) {
                        return
                    }

                    // 🧪 DEBUG LOG
                    if (process.env.NODE_ENV === "development") {
                        console.log("ROW DEBUG:", {
                            original: row,
                            normalizedMonth,
                            normalizedSrNo,
                            normalizedSiteName,
                        })
                    }

                    try {
                        await prisma.financeSheetRecord.upsert({
                            where: {
                                month_srNo_siteName: {
                                    month: normalizedMonth,
                                    srNo: normalizedSrNo,
                                    siteName: normalizedSiteName,
                                },
                            },
                            update: {
                                billAmount: row.billAmount ? Number(row.billAmount) : null,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays:
                                    row.paymentReceivedDays != null
                                        ? Number(row.paymentReceivedDays)
                                        : null,
                                salaryStatus: row.salaryStatus
                                    ? String(row.salaryStatus).trim().toLowerCase() === "paid"
                                        ? "Paid"
                                        : "Unpaid"
                                    : null,
                                isActive: true,
                                lastSyncedAt: now,
                            },
                            create: {
                                month: normalizedMonth,
                                srNo: normalizedSrNo,
                                siteName: normalizedSiteName,
                                billAmount: row.billAmount ? Number(row.billAmount) : null,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays:
                                    row.paymentReceivedDays != null
                                        ? Number(row.paymentReceivedDays)
                                        : null,
                                salaryStatus: row.salaryStatus
                                    ? String(row.salaryStatus).trim().toLowerCase() === "paid"
                                        ? "Paid"
                                        : "Unpaid"
                                    : null,
                                source: "google-sheet-appscript",
                                isActive: true,
                                lastSyncedAt: now,
                            },
                        })

                        processed++
                    } catch (err) {
                        console.error("❌ ROW FAILED:", row, err)
                    }
                })
            )
        }

        /* ---------------- RESPONSE ---------------- */

        return NextResponse.json({
            success: true,
            processed,
            monthsSynced: months.length,
        })
    } catch (error: any) {
        console.error("🔥 FULL ERROR:", error)

        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Unknown error",
                stack: error?.stack || null,   // 👈 VERY IMPORTANT
            },
            { status: 500 }
        )
    }
}