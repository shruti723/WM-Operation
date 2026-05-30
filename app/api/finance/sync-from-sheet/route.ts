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
                        return
                    }

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
                                billAmount:
                                    row.billAmount !== null && row.billAmount !== undefined
                                        ? Number(row.billAmount)
                                        : null,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays:
                                    row.paymentReceivedDays !== null &&
                                        row.paymentReceivedDays !== undefined
                                        ? Number(row.paymentReceivedDays)
                                        : null,
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
                                billAmount:
                                    row.billAmount !== null && row.billAmount !== undefined
                                        ? Number(row.billAmount)
                                        : null,
                                prepared: normalizeYesNo(row.prepared),
                                prepareDate: cleanDate(row.prepareDate),
                                dispatched: normalizeYesNo(row.dispatched),
                                dispatchDate: cleanDate(row.dispatchDate),
                                paymentCheque: normalizeYesNo(row.paymentCheque),
                                receivedDate: cleanDate(row.receivedDate),
                                paymentReceivedDays:
                                    row.paymentReceivedDays !== null &&
                                        row.paymentReceivedDays !== undefined
                                        ? Number(row.paymentReceivedDays)
                                        : null,
                                salaryStatus: cleanSalaryStatus(row.salaryStatus),
                                source: "google-sheet-appscript",
                                isActive: true,
                                lastSyncedAt: now,
                            },
                        })

                        processed++
                    } catch (err) {
                        console.error("ROW FAILED:", row, err)
                    }
                })
            )
        }

        return NextResponse.json({
            success: true,
            portal: PORTAL,
            processed,
            monthsSynced: months.length,
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