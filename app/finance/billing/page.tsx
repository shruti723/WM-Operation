"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { DateRangePicker } from "@/components/finance/dateRangePicker"
import { DateRange } from "react-day-picker"

type FinanceRecord = {
    id: string
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
    salaryDisbursementDate: string | null
}

const PAGE_SIZE = 15

function Badge({ value }: { value: string }) {
    if (value === "Yes")
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Yes</span>

    if (value === "No")
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">No</span>

    return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">Missing</span>
}

function parseMonthYear(monthStr: string) {
    if (!monthStr) return { year: 0, month: 0 }

    const parts = monthStr.trim().toUpperCase().split(" ")

    const monthMap: Record<string, number> = {
        JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4,
        MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8,
        SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12
    }

    return {
        year: Number(parts[1]) || 0,
        month: monthMap[parts[0]] || 0
    }
}

function formatCurrency(val: number | null) {
    if (!val) return <Badge value="Missing" />
    return `₹${val.toLocaleString("en-IN")}`
}

export default function BillingPage() {
    const [data, setData] = useState<FinanceRecord[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [paymentFilter, setPaymentFilter] = useState("All")
    const [monthFilter, setMonthFilter] = useState("All")
    const [preparedFilter, setPreparedFilter] = useState("All")
    const [dispatchFilter, setDispatchFilter] = useState("All")

    const [date, setDate] = useState<DateRange | undefined>()

    const [page, setPage] = useState(1)

    useEffect(() => {
        setPage(1)
    }, [search, paymentFilter, preparedFilter, dispatchFilter, monthFilter, date])

    useEffect(() => {
        fetch("/api/finance/dashboard", {
            cache: "no-store",
        })
            .then(res => res.json())
            .then(res => {
                setData(res.records || [])
            })
            .finally(() => setLoading(false))
    }, [])

    // ✅ FILTER LOGIC
    const filtered = useMemo(() => {
        let list = [...data].sort((a, b) => {
            const A = parseMonthYear(a.month)
            const B = parseMonthYear(b.month)

            if (A.year !== B.year) return B.year - A.year
            if (A.month !== B.month) return B.month - A.month

            return a.srNo - b.srNo
        })

        if (search) {
            const q = search.toLowerCase()
            list = list.filter(r =>
                r.siteName.toLowerCase().includes(q)
            )
        }

        // Month filter
        if (monthFilter !== "All") {
            list = list.filter(r => r.month === monthFilter)
        }

        // Prepared filter
        if (preparedFilter !== "All") {
            list = list.filter(r => r.prepared === preparedFilter)
        }

        // Dispatched filter
        if (dispatchFilter !== "All") {
            list = list.filter(r => r.dispatched === dispatchFilter)
        }

        // Payment filter
        if (paymentFilter !== "All") {
            list = list.filter(r => r.paymentCheque === paymentFilter)
        }

        // ✅ SAFE DATE PARSER (outside filter)
        const parseDate = (str: string) => {
            const parts = str.split("-")

            // dd-mm-yyyy
            if (parts.length === 3 && parts[0].length === 2) {
                const [day, month, year] = parts
                return new Date(`${year}-${month}-${day}`)
            }

            return new Date(str)
        }

        // ✅ DATE FILTER (correct)
        if (date?.from && date?.to) {
            list = list.filter(r => {
                if (!r.receivedDate) return false

                const d = parseDate(r.receivedDate)

                return d >= date.from! && d <= date.to!
            })
        }

        return list
    }, [data, search, paymentFilter, preparedFilter, dispatchFilter, monthFilter, date])

    // ✅ PAGINATION
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, page])

    if (loading) return <div className="p-10">Loading...</div>

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Detailed Billing Records</h2>

            {/* ✅ FILTER BAR */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    placeholder="Search site..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                />

                {/* Month */}
                <select
                    value={monthFilter}
                    onChange={e => setMonthFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                >
                    <option value="All">Month: All</option>
                    {[...new Set(data.map(d => d.month))]
                        .sort((a, b) => {
                            const A = parseMonthYear(a)
                            const B = parseMonthYear(b)

                            if (A.year !== B.year) return B.year - A.year
                            return B.month - A.month
                        }).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                </select>

                {/* Prepared */}
                <select
                    value={preparedFilter}
                    onChange={e => setPreparedFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                >
                    <option value="All">Prepared: All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>

                {/* Dispatched */}
                <select
                    value={dispatchFilter}
                    onChange={e => setDispatchFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                >
                    <option value="All">Dispatched: All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>

                {/* Payment */}
                <select
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                >
                    <option value="All">Payment: All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>

                <DateRangePicker date={date} setDate={setDate} />
                <button
                    onClick={() => {
                        setSearch("")
                        setMonthFilter("All")
                        setPreparedFilter("All")
                        setDispatchFilter("All")
                        setPaymentFilter("All")
                        setDate(undefined)
                    }}
                    className="border px-3 py-2 rounded-md bg-gray-100"
                >
                    Clear Filters
                </button>
            </div>

            {/* ✅ TABLE */}
            <div className="overflow-x-auto border rounded-xl">
                <table className="min-w-full text-sm table-auto">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-3 text-left whitespace-nowrap">Month</th>
                            <th className="p-3 text-left">Site Name</th>

                            <th className="p-3 text-right whitespace-nowrap">
                                Bill<br />Amount
                            </th>

                            <th className="p-3 text-center whitespace-nowrap">Prepared</th>

                            <th className="p-3 text-center whitespace-nowrap">
                                Prepare<br />Date
                            </th>

                            <th className="p-3 text-center whitespace-nowrap">Dispatched</th>

                            <th className="p-3 text-center whitespace-nowrap">
                                Dispatch<br />Date
                            </th>

                            <th className="p-3 text-center whitespace-nowrap">
                                Payment/<br />Cheque
                            </th>

                            <th className="p-3 text-center">
                                Payment/Cheque<br />Received Date
                            </th>

                            <th className="p-3 text-center whitespace-nowrap">
                                Payment<br />Days
                            </th>

                            <th className="p-3 text-center">
                                Salary<br />Disbursement Date
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map(row => (
                            <tr key={row.id} className="border-t hover:bg-gray-50">
                                <td className="p-3 whitespace-nowrap">{row.month}</td>

                                <td className="p-3">
                                    {row.siteName}
                                </td>

                                <td className="p-3 text-right whitespace-nowrap">
                                    {formatCurrency(row.billAmount)}
                                </td>

                                <td className="p-3 text-center">
                                    <Badge value={row.prepared} />
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                    {row.prepareDate || "—"}
                                </td>

                                <td className="p-3 text-center">
                                    <Badge value={row.dispatched} />
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                    {row.dispatchDate || "—"}
                                </td>

                                <td className="p-3 text-center">
                                    <Badge value={row.paymentCheque} />
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                    {row.receivedDate || "—"}
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                    {row.paymentReceivedDays ?? <Badge value="Missing" />}
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                    {row.salaryDisbursementDate || "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ PAGINATION */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm">
                    Showing {paginatedData.length} of {filtered.length}
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