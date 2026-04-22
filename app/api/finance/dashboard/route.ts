import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

type Summary = {
    month: string
    totalBills: number
    totalBillAmount: number
    collectedAmount: number
    pendingAmount: number
    collectionEfficiency: number
    avgPaymentDays: number
    pendingPayments: number
    dispatchedBills: number
    preparedBills: number
    salaryDisbursed: number
    highDelay: number
    missingBillAmount: number
}

function buildSummary(month: string, rows: any[]): Summary {
    const totalBills = rows.length
    const totalBillAmount = rows.reduce((sum, row) => sum + (row.billAmount || 0), 0)

    const collectedRows = rows.filter((row) => !!row.receivedDate)
    const pendingRows = rows.filter((row) => !row.receivedDate)

    const collectedAmount = collectedRows.reduce((sum, row) => sum + (row.billAmount || 0), 0)
    const pendingAmount = pendingRows.reduce((sum, row) => sum + (row.billAmount || 0), 0)

    function calculateDays(dispatchDate: string | null, receivedDate: string | null) {
        if (!dispatchDate || !receivedDate) return null

        const parse = (d: string) => {
            const [day, month, year] = d.split("-")
            return new Date(`${year}-${month}-${day}`)
        }

        const d1 = parse(dispatchDate)
        const d2 = parse(receivedDate)

        const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))

        return diff > 0 ? diff : null
    }

    const validDayRows = rows
        .map((row) => ({
            ...row,
            calcDays: calculateDays(row.dispatchDate, row.receivedDate),
        }))
        .filter((row) => row.calcDays !== null)

    const avgPaymentDays = validDayRows.length
        ? Math.round(
            validDayRows.reduce((sum, row) => sum + row.calcDays!, 0) /
            validDayRows.length
        )
        : 0

    const preparedBills = rows.filter((row) => row.prepared === "Yes").length
    const dispatchedBills = rows.filter((row) => row.dispatched === "Yes").length
    const salaryDisbursed = rows.filter((row) => !!row.salaryDisbursementDate).length
    const highDelay = rows.filter(
        (row) =>
            typeof row.paymentReceivedDays === "number" &&
            row.paymentReceivedDays > 10 &&
            row.paymentReceivedDays < 1000
    ).length
    const missingBillAmount = rows.filter((row) => row.billAmount === null).length

    const collectionEfficiency = totalBillAmount
        ? Number(((collectedAmount / totalBillAmount) * 100).toFixed(1))
        : 0

    return {
        month,
        totalBills,
        totalBillAmount,
        collectedAmount,
        pendingAmount,
        collectionEfficiency,
        avgPaymentDays,
        pendingPayments: pendingRows.length,
        dispatchedBills,
        preparedBills,
        salaryDisbursed,
        highDelay,
        missingBillAmount,
    }
}

export async function GET() {
    try {
        const records = await prisma.financeSheetRecord.findMany({
            where: { isActive: true },
            orderBy: [{ month: "asc" }, { srNo: "asc" }],
        })

        const overall = buildSummary("All Months", records)

        const grouped = new Map<string, any[]>()

        for (const row of records) {
            if (!grouped.has(row.month)) grouped.set(row.month, [])
            grouped.get(row.month)!.push(row)
        }

        const monthlySummary = [...grouped.entries()].map(([month, rows]) =>
            buildSummary(month, rows)
        )

        return NextResponse.json({
            success: true,
            overall,
            monthlySummary,
            records,
        })
    } catch (error) {
        console.error("finance dashboard error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load finance dashboard" },
            { status: 500 }
        )
    }
}