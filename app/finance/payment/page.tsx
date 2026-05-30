"use client"

import { useEffect, useMemo, useState } from "react"

type FinanceRecord = {
    id: string
    month: string
    siteName: string
    billAmount: number | null
    receivedDate: string | null
    dispatchDate?: string | null
    paymentReceivedDays: number | null
    paymentCheque?: string
}

function formatCurrency(val: number) {
    return `₹${val.toLocaleString("en-IN")}`
}

export default function PaymentPage() {
    const [data, setData] = useState<FinanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: "",
        month: "All",
        status: "All",
        delay: "All",
        fromDate: "",
        toDate: "",
    })
    const PAGE_SIZE = 15
    const [page, setPage] = useState(1)

    useEffect(() => {
        setPage(1)
    }, [filters])

    useEffect(() => {
        fetch("/api/finance/dashboard", {
            cache: "no-store",
        })
            .then(res => res.json())
            .then(res => {
                const records = res.records || []
                setData(records)

                // ✅ AUTO SELECT LATEST MONTH
                if (records.length) {
                    const latestMonth = records
                        .map((r: any) => r.month)
                        .sort((a: string, b: string) => {
                            const parse = (val: string) => {
                                const [month, year] = val.split(" ")
                                return new Date(`${month} 1, ${year}`)
                            }
                            return parse(b).getTime() - parse(a).getTime()
                        })[0]

                    setFilters(prev => ({
                        ...prev,
                        month: latestMonth
                    }))
                }
            })
            .finally(() => setLoading(false))
    }, [])

    const filteredData = useMemo(() => {
        return data.filter(row => {

            // Search
            if (
                filters.search &&
                !row.siteName.toLowerCase().includes(filters.search.toLowerCase())
            ) return false

            // Month
            if (filters.month !== "All" && row.month !== filters.month)
                return false

            // Date Range - based on dispatch date
            const rowDate = row.dispatchDate ? new Date(row.dispatchDate) : null

            const from = filters.fromDate
                ? new Date(filters.fromDate + "T00:00:00")
                : null

            const to = filters.toDate
                ? new Date(filters.toDate + "T23:59:59")
                : null

            if (from && (!rowDate || rowDate < from)) return false
            if (to && (!rowDate || rowDate > to)) return false


            // Delay
            const d = row.paymentReceivedDays || 0

            if (filters.delay === "0-7" && !(d <= 7)) return false
            if (filters.delay === "8-15" && !(d > 7 && d <= 15)) return false
            if (filters.delay === "15+" && !(d > 15)) return false

            return true
        })
    }, [data, filters])

    /* 🔥 GROUP DATA */
    const groupedData = useMemo(() => {
        const map = new Map()

        filteredData.forEach((row) => {
            const key = row.siteName

            if (!map.has(key)) {
                map.set(key, {
                    siteName: key,
                    totalBill: 0,
                    collected: 0,
                    pending: 0,
                    daysList: [] as number[],
                    lastDispatchDate: null as string | null,
                    lastReceivedDate: null as string | null,
                })
            }

            const item = map.get(key)

            const bill = row.billAmount || 0

            const isPaid = row.paymentCheque === "Yes"
            const received = isPaid ? bill : 0

            item.totalBill += bill
            item.collected += received
            item.pending += (bill - received)

            // ✅ only pending records for delay
            if (!isPaid && row.paymentReceivedDays) {
                item.daysList.push(row.paymentReceivedDays)
            }
        })

        return Array.from(map.values()).map((item) => {
            const avgDays = item.daysList.length
                ? Math.round(
                    item.daysList.reduce((a: number, b: number) => a + b, 0) /
                    item.daysList.length
                )
                : null

            let status = "Paid"
            if (item.pending > 0) {
                if (avgDays && avgDays > 15) status = "High Delay"
                else status = "Pending"
            }

            return {
                ...item,
                avgDays,
                status,
            }
        })
    }, [filteredData])

    const finalData = useMemo(() => {
        let list = [...groupedData]

        if (filters.status !== "All") {
            list = list.filter(r => r.status === filters.status)
        }

        return list
    }, [groupedData, filters.status])

    /* 🔥 SUMMARY */
    const summary = useMemo(() => {
        let total = 0
        let collected = 0

        finalData.forEach((r) => {
            total += r.totalBill
            collected += r.collected
        })

        const pending = total - collected
        const efficiency = total
            ? ((collected / total) * 100).toFixed(1)
            : "0"

        return { total, collected, pending, efficiency }
    }, [finalData])



    const totalPages = Math.max(1, Math.ceil(finalData.length / PAGE_SIZE))

    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return finalData.slice(start, start + PAGE_SIZE)
    }, [finalData, page])

    if (loading) return <div className="p-6">Loading...</div>

    return (
        <div className="w-full max-w-full space-y-6 p-4 sm:p-6">

            {/* FILTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm">

                {/* Search */}
                <input
                    placeholder="Search site..."
                    value={filters.search}
                    onChange={(e) =>
                        setFilters(prev => ({ ...prev, search: e.target.value }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                />

                {/* Month */}
                <select
                    value={filters.month}
                    onChange={(e) =>
                        setFilters(prev => ({ ...prev, month: e.target.value }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                >
                    <option value="All">All Months</option>
                    {[...new Set(data.map(d => d.month))]
                        .sort((a, b) => {
                            const parse = (val: string) => new Date(val)
                            return parse(b).getTime() - parse(a).getTime()
                        })
                        .map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                </select>

                {/* From Date */}
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                        setFilters(prev => ({
                            ...prev,
                            fromDate: e.target.value,
                        }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                />

                {/* To Date */}
                <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                        setFilters(prev => ({
                            ...prev,
                            toDate: e.target.value,
                        }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                />

                {/* Status */}
                <select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters(prev => ({ ...prev, status: e.target.value }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="High Delay">High Delay</option>
                </select>

                {/* Delay */}
                <select
                    value={filters.delay}
                    onChange={(e) =>
                        setFilters(prev => ({ ...prev, delay: e.target.value }))
                    }
                    className="border px-3 py-2 rounded-md w-full lg:w-auto"
                >
                    <option value="All">All Delay</option>
                    <option value="0-7">0-7 Days</option>
                    <option value="8-15">8-15 Days</option>
                    <option value="15+">15+ Days</option>
                </select>

                {/* Clear */}
                <button
                    onClick={() =>
                        setFilters({
                            search: "",
                            month: "All",
                            status: "All",
                            delay: "All",
                            fromDate: "",
                            toDate: "",
                        })
                    }
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 w-full lg:w-auto"
                >
                    Clear
                </button>

            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card title="Total Billing" value={formatCurrency(summary.total)} />
                <Card title="Collected" value={formatCurrency(summary.collected)} />
                <Card title="Pending" value={formatCurrency(summary.pending)} />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto max-w-full">
                <table className="min-w-[700px] w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-3 text-left">Site</th>
                            <th className="p-3 text-right">Bill</th>
                            <th className="p-3 text-right">Received</th>
                            <th className="p-3 text-right">Pending</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((row) => (
                            <tr key={row.siteName} className="border-t hover:bg-gray-50">
                                <td className="p-3">{row.siteName}</td>

                                <td className="p-3 text-right">{formatCurrency(row.totalBill)}</td>
                                <td className="p-3 text-right text-green-600">{formatCurrency(row.collected)}</td>

                                <td className="p-3 text-right text-red-600">{formatCurrency(row.pending)}</td>

                                <td className="p-3 text-center">
                                    <StatusBadge status={row.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>

            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mt-4">
                <p className="text-sm">
                    Showing {paginatedData.length} of {finalData.length}
                </p>

                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="px-3 py-1 border rounded">
                        {page} / {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

        </div>
    )
}

/* CARD */
function Card({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-lg font-semibold">{value}</h3>
        </div>
    )
}

/* STATUS BADGE */
function StatusBadge({ status }: { status: string }) {
    if (status === "Paid")
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Paid</span>

    if (status === "High Delay")
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">High Delay</span>

    return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Pending</span>
}