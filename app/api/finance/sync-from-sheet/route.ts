import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/* ---------------- TYPES ---------------- */

type IncomingRow = {
    id?: string
    month: string
    srNo: number
    siteName: string
    billAmount: number | string | null
    prepared: string
    prepareDate: string | null
    dispatched: string
    dispatchDate: string | null
    paymentCheque: string
    receivedDate: string | null
    paymentReceivedDays: number | string | null
    salaryStatus: string | null
}

type IncomingPayload = {
    secret?: string
    rows?: IncomingRow[]
    months?: string[]
}

/* ---------------- CONSTANTS ---------------- */

const PORTAL = "WM"

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

    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str

    const d = new Date(str)

    if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0")
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const year = d.getFullYear()

        return `${day}-${month}-${year}`
    }

    return null
}

function cleanSalaryStatus(value: unknown): string | null {
    if (!value) return null

    const str = String(value).trim().toLowerCase()

    if (str === "paid") return "Paid"
    if (str === "unpaid") return "Unpaid"

    return "Unpaid"
}

function cleanNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null

    const cleaned = String(value).replace(/,/g, "").trim()
    const n = Number(cleaned)

    return isNaN(n) ? null : n
}

/* ---------------- MAIN API ---------------- */

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as IncomingPayload

        if (body.secret !== process.env.FINANCE_SYNC_SECRET) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            )
        }

        const rows = Array.isArray(body.rows) ? body.rows : []

        const months = Array.isArray(body.months)
            ? body.months.map((m) => normalizeMonth(m)).filter(Boolean)
            : []

        console.log("FINANCE SYNC STARTED")
        console.log("ROWS RECEIVED:", rows.length)
        console.log("MONTHS RECEIVED:", months)
        console.log("FIRST ROW RECEIVED:", rows[0])

        if (!rows.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No rows received",
                },
                { status: 400 }
            )
        }

        const now = new Date()

        /* ---------------- STEP 1: MARK OLD WM DATA INACTIVE ---------------- */

        if (months.length > 0) {
            await prisma.financeSheetRecord.updateMany({
                where: {
                    portal: PORTAL,
                    month: {
                        in: months,
                    },
                    source: "google-sheet-appscript",
                },
                data: {
                    isActive: false,
                    lastSyncedAt: now,
                },
            })
        }

        let processed = 0
        let skipped = 0
        let failed = 0
        const failedRows: any[] = []

        const batchSize = 50

        /* ---------------- STEP 2: UPSERT WM ROWS ---------------- */

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize)

            await Promise.all(
                batch.map(async (row) => {
                    const normalizedMonth = normalizeMonth(row.month)
                    const normalizedSrNo = Number(row.srNo)

                    const normalizedSiteName = String(row.siteName || "")
                        .trim()
                        .toUpperCase()

                    if (!normalizedMonth || !normalizedSrNo || !normalizedSiteName) {
                        skipped++

                        console.log("SKIPPED ROW:", {
                            row,
                            normalizedMonth,
                            normalizedSrNo,
                            normalizedSiteName,
                        })

                        return
                    }

                    const billAmount = cleanNumber(row.billAmount)
                    const paymentReceivedDays = cleanNumber(row.paymentReceivedDays)

                    try {
                        await prisma.financeSheetRecord.upsert({
                            where: {
                                portal_month_srNo_siteName: {
                                    portal: PORTAL,
                                    month: normalizedMonth,
                                    srNo: normalizedSrNo,
                                    siteName: normalizedSiteName,
                                },
                            },
                            update: {
                                portal: PORTAL,
                                billAmount,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays,
                                salaryStatus: cleanSalaryStatus(row.salaryStatus),
                                source: "google-sheet-appscript",
                                isActive: true,
                                lastSyncedAt: now,
                            },
                            create: {
                                portal: PORTAL,
                                month: normalizedMonth,
                                srNo: normalizedSrNo,
                                siteName: normalizedSiteName,
                                billAmount,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays,
                                salaryStatus: cleanSalaryStatus(row.salaryStatus),
                                source: "google-sheet-appscript",
                                isActive: true,
                                lastSyncedAt: now,
                            },
                        })

                        processed++
                    } catch (err: any) {
                        failed++

                        console.error("ROW FAILED:", {
                            row,
                            error: err?.message || err,
                        })

                        failedRows.push({
                            row,
                            error: err?.message || String(err),
                        })
                    }
                })
            )
        }

        console.log("FINANCE SYNC COMPLETED:", {
            totalReceived: rows.length,
            processed,
            skipped,
            failed,
            monthsSynced: months.length,
        })

        return NextResponse.json({
            success: true,
            portal: PORTAL,
            totalReceived: rows.length,
            processed,
            skipped,
            failed,
            monthsSynced: months.length,
            sampleFailedRows: failedRows.slice(0, 5),
        })
    } catch (error: any) {
        console.error("FULL ERROR:", error)

        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Unknown error",
                stack: error?.stack || null,
            },
            { status: 500 }
        )
    }
}