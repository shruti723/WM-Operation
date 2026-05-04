"use client"

import { useEffect, useMemo, useState } from "react"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts"
import { LabelList } from "recharts"

/* ================= TYPES ================= */

type FinanceRecord = {
    id: string
    month: string
    siteName: string
    billAmount: number | null
    receivedDate: string | null
    paymentReceivedDays: number | null
    salaryDisbursementDate: string | null
    prepared?: string
    dispatched?: string
    paymentCheque?: string
    salaryStatus?: "Paid" | "Unpaid"
}

/* ================= HELPERS ================= */

const COLORS = ["#2294c5", "#ef4444"]

function formatCurrency(val: number) {
    return `₹${val.toLocaleString("en-IN")}`
}

/* ================= UI ================= */

function StatCard({ title, value, subtitle, color }: any) {
    return (
        <div className="bg-white rounded-2xl border shadow-sm p-4 relative hover:shadow-md transition">
            <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
            <p className="text-xs text-gray-500 uppercase">{title}</p>
            <h3 className="text-xl font-bold mt-2">{value}</h3>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    )
}

function AlertCard({ title, value, color }: any) {
    return (
        <div className={`rounded-xl p-4 font-semibold ${color}`}>
            <p className="text-sm">{title}</p>
            <h3 className="text-2xl mt-1">{value}</h3>
        </div>
    )
}

function ChartCard({ title, children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-lg transition-all">
            <h3 className="font-semibold mb-3">{title}</h3>
            {children}
        </div>
    )
}

/* ================= MAIN ================= */

export default function Dashboard() {
    const [data, setData] = useState<FinanceRecord[]>([])
    const [loading, setLoading] = useState(true)

    const [monthIndex, setMonthIndex] = useState(0)
    const PAGE_SIZE = 5

    const [effIndex, setEffIndex] = useState(0)

    const [filters, setFilters] = useState({
        search: "",
        month: "All",
        status: "All",   // Paid / Pending
        delay: "All"     // 0-7 / 8-15 / 15+
    })

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

            // Status
            if (filters.status === "Paid" && row.paymentCheque !== "Yes")
                return false

            if (filters.status === "Pending" && row.paymentCheque !== "No")
                return false

            // Delay
            const d = row.paymentReceivedDays || 0

            if (filters.delay === "0-7" && !(d <= 7)) return false
            if (filters.delay === "8-15" && !(d > 7 && d <= 15)) return false
            if (filters.delay === "15+" && !(d > 15)) return false

            return true
        })
    }, [data, filters])

    const highDelayAmount = useMemo(() => {
        let total = 0
        filteredData.forEach(row => {
            if (row.paymentCheque === "No" && (row.paymentReceivedDays || 0) > 15) {
                total += row.billAmount || 0
            }
        })
        return total
    }, [filteredData])

    const monthChart = useMemo(() => {
        const map = new Map()

        filteredData.forEach(row => {
            if (!map.has(row.month)) {
                map.set(row.month, {
                    month: row.month,
                    bill: 0,
                    collected: 0,
                })
            }

            const item = map.get(row.month)
            const bill = row.billAmount || 0

            item.bill += bill
            if (row.paymentCheque === "Yes") item.collected += bill
        })

        const monthOrder: any = {
            JAN: 0,
            FEB: 1,
            MAR: 2,
            APR: 3,
            MAY: 4,
            JUNE: 5,
            JULY: 6,
            AUG: 7,
            SEPT: 8,
            OCT: 9,
            NOV: 10,
            DEC: 11,
        }

        return Array.from(map.values()).sort((a, b) => {
            const parse = (val: string) => {
                const [monthStr, yearStr] = val.split(" ")
                return new Date(`${monthStr} 1, ${yearStr}`)
            }

            return parse(a.month).getTime() - parse(b.month).getTime()
        })
    }, [filteredData])

    const efficiencyChart = useMemo(() => {
        return monthChart.map(m => ({
            month: m.month,
            efficiency:
                m.bill > 0
                    ? Number(((m.collected / m.bill) * 100).toFixed(1))
                    : 0
        }))
    }, [monthChart])

    useEffect(() => {
        if (efficiencyChart.length) {
            setEffIndex(Math.max(efficiencyChart.length - PAGE_SIZE, 0))
        }
    }, [efficiencyChart])

    const paginatedEfficiency = useMemo(() => {
        return efficiencyChart.slice(effIndex, effIndex + PAGE_SIZE)
    }, [efficiencyChart, effIndex])

    useEffect(() => {
        if (monthChart.length) {
            setMonthIndex(Math.max(monthChart.length - PAGE_SIZE, 0))
        }
    }, [monthChart])

    useEffect(() => {
        fetch("/api/finance/dashboard", {
            cache: "no-store",
        })
            .then(res => res.json())
            .then(res => setData(res.records || []))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetch("/api/finance/dashboard", {
            cache: "no-store",
        })
            .then(res => res.json())
            .then(res => {
                const records = res.records || []
                setData(records)

                // ✅ SET DEFAULT MONTH TO LATEST
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

    /* ================= SUMMARY ================= */

    const summary = useMemo(() => {
        let total = 0
        let collected = 0
        let pendingPayments = 0
        let salaryDone = 0
        let highDelay = 0
        let dispatched = 0
        let prepared = 0
        let missingBill = 0
        let salaryPending = 0

        filteredData.forEach(row => {
            const bill = row.billAmount || 0
            total += bill

            if (row.paymentCheque === "Yes") {
                collected += bill
            } else if (row.paymentCheque === "No") {
                pendingPayments++
            }

            if (row.salaryDisbursementDate) salaryDone++

            if (row.paymentCheque === "No" && (row.paymentReceivedDays || 0) > 15) {
                highDelay++
            }

            if (row.dispatched === "Yes") dispatched++
            if (row.prepared === "Yes") prepared++

            if (row.billAmount === null) missingBill++

            if (row.salaryStatus === "Unpaid") {
                salaryPending++
            }
        })



        const pending = total - collected
        const efficiency = total ? ((collected / total) * 100).toFixed(1) : "0"

        return {
            total,
            collected,
            pending,
            efficiency,
            pendingPayments,
            salaryDone,
            highDelay,
            dispatched,
            prepared,
            missingBill,
            totalBills: filteredData.length,
            salaryPending,
        }
    }, [filteredData])




    const completedPayments = filteredData.filter(r => r.paymentCheque === "Yes").length

    const normalize = (val?: string) => val?.trim().toLowerCase()

    const salaryPaid = filteredData.filter(
        r => normalize(r.salaryStatus) === "paid"
    ).length

    const salaryUnpaid = filteredData.filter(
        r => normalize(r.salaryStatus) === "unpaid"
    ).length

    const salaryMissing = filteredData.filter(
        r => !normalize(r.salaryStatus)
    ).length
    const pipelineData = useMemo(() => {
        const prepared = summary.prepared
        const dispatched = summary.dispatched
        const paid = summary.totalBills - summary.pendingPayments


        return [
            { name: "Prepared", value: prepared },
            { name: "Dispatched", value: dispatched },
            { name: "Paid", value: paid },
        ]
    }, [summary])

    /* ================= CHART DATA ================= */



    const paginatedMonths = useMemo(() => {
        return monthChart.slice(monthIndex, monthIndex + PAGE_SIZE)
    }, [monthChart, monthIndex])

    const pieData = useMemo(() => {
        let paidAmount = 0
        let pendingAmount = 0

        filteredData.forEach(row => {
            const bill = row.billAmount || 0

            if (row.paymentCheque === "Yes") paidAmount += bill
            else if (row.paymentCheque === "No") pendingAmount += bill
        })

        return [
            { name: "Collected", value: paidAmount },
            { name: "Pending", value: pendingAmount },
        ]
    }, [filteredData])

    const delayChart = useMemo(() => {
        let low = 0, medium = 0, high = 0

        filteredData.forEach(row => {
            const d = row.paymentReceivedDays || 0
            if (!d) return

            if (d <= 7) low++
            else if (d <= 15) medium++
            else high++
        })

        return [
            { name: "0-7", value: low },
            { name: "8-15", value: medium },
            { name: "15+", value: high },
        ]
    }, [filteredData])


    const topPendingSites = useMemo(() => {
        return filteredData
            .filter(r => r.paymentCheque === "No")
            .sort((a, b) => (b.billAmount || 0) - (a.billAmount || 0))
    }, [filteredData])

    const isRightDisabled = monthIndex + PAGE_SIZE >= monthChart.length

    if (loading) return <div className="p-6">Loading...</div>

    return (
        <div className="p-6 space-y-6">

            <h2 className="text-2xl font-bold">Finance Dashboard</h2>

            {/* ================= FILTER BAR ================= */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm w-full">

                {/* LEFT SIDE */}
                <div className="flex flex-wrap items-center gap-3">

                    <input
                        placeholder="Search site..."
                        value={filters.search}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, search: e.target.value }))
                        }
                        className="border px-3 py-2 rounded-md w-[200px]"
                    />

                    <select
                        value={filters.month}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, month: e.target.value }))
                        }
                        className="border px-3 py-2 rounded-md"
                    >
                        <option value="All">All Months</option>
                        {[...new Set(data.map(d => d.month))]
                            .sort((a, b) => {
                                const parse = (val: string) => {
                                    const [month, year] = val.split(" ")
                                    return new Date(`${month} 1, ${year}`)
                                }

                                return parse(b).getTime() - parse(a).getTime() // DESC order
                            })
                            .map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, status: e.target.value }))
                        }
                        className="border px-3 py-2 rounded-md"
                    >
                        <option value="All">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                    </select>

                    <select
                        value={filters.delay}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, delay: e.target.value }))
                        }
                        className="border px-3 py-2 rounded-md"
                    >
                        <option value="All">All Delay</option>
                        <option value="0-7">0-7 Days</option>
                        <option value="8-15">8-15 Days</option>
                        <option value="15+">15+ Days</option>
                    </select>

                </div>

                {/* RIGHT SIDE */}
                <button
                    onClick={() =>
                        setFilters({
                            search: "",
                            month: "All",
                            status: "All",
                            delay: "All"
                        })
                    }
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                    Clear
                </button>

            </div>

            {/* ================= KPI CARDS ================= */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <StatCard title="Total Bills" value={summary.totalBills} subtitle="Records" color="bg-indigo-500" />
                <StatCard title="Total Billing" value={formatCurrency(summary.total)} subtitle="Amount" color="bg-blue-500" />
                <StatCard title="Collected" value={formatCurrency(summary.collected)} subtitle="Received" color="bg-green-500" />
                <StatCard title="Pending" value={formatCurrency(summary.pending)} subtitle="Outstanding" color="bg-red-500" />

            </div>

            {/* ================= ALERT STRIP ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Pending */}
                <div className="rounded-2xl p-5 bg-red-50 border border-red-200 shadow-sm hover:shadow-md transition">
                    <p className="text-sm text-red-500 font-medium">Pending Payments</p>
                    <h3 className="text-3xl font-bold text-red-600 mt-1">
                        {summary.pendingPayments}
                    </h3>
                    <p className="text-xs text-red-400 mt-1">
                        Requires attention
                    </p>
                </div>

                {/* Completed */}
                <div className="rounded-2xl p-5 bg-green-50 border border-green-200 shadow-sm hover:shadow-md transition">
                    <p className="text-sm text-green-600 font-medium">Completed Payments</p>
                    <h3 className="text-3xl font-bold text-green-600 mt-1">
                        {completedPayments}
                    </h3>
                    <p className="text-xs text-green-500 mt-1">
                        Successfully collected
                    </p>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Salary Paid */}
                <div className="rounded-2xl p-5 bg-green-50 border border-green-200 shadow-sm hover:shadow-md transition">
                    <p className="text-sm text-green-600 font-medium">Salary Paid</p>
                    <h3 className="text-3xl font-bold text-green-700 mt-1">
                        {salaryPaid}
                    </h3>
                    <p className="text-xs text-green-500 mt-1">
                        Successfully disbursed
                    </p>
                </div>

                {/* Salary Unpaid */}
                <div className="rounded-2xl p-5 bg-red-50 border border-red-200 shadow-sm hover:shadow-md transition">
                    <p className="text-sm text-red-600 font-medium">Salary Unpaid</p>
                    <h3 className="text-3xl font-bold text-red-700 mt-1">
                        {summary.salaryPending}
                    </h3>
                    <p className="text-xs text-red-400 mt-1">
                        Pending disbursement
                    </p>
                </div>

            </div>

            {/* ================= CHARTS ================= */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <ChartCard>

                    {/* HEADER WITH ARROWS */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-semibold text-lg">
                                Monthly Billing vs Collection
                            </h3>
                            <p className="text-xs text-gray-500">
                                Track billing vs recovery trend
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setMonthIndex(prev => Math.max(prev - 1, 0))}
                                disabled={monthIndex === 0}
                                className={`px-3 py-1 border rounded 
  ${monthIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}`}

                            >
                                ←
                            </button>

                            <button
                                onClick={() =>
                                    setMonthIndex(prev =>
                                        prev + PAGE_SIZE < monthChart.length
                                            ? prev + 1
                                            : prev
                                    )
                                }
                                disabled={isRightDisabled}
                                className={`px-3 py-1 border rounded 
  ${isRightDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}`}
                            >
                                →
                            </button>
                        </div>
                    </div>

                    {/* CHART */}
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={paginatedMonths}
                            barCategoryGap={30}
                            margin={{ bottom: 20 }}
                        >
                            <defs>
                                <linearGradient id="billGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                                </linearGradient>

                                <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            {/* <XAxis dataKey="month" tick={{ fontSize: 12 }} /> */}
                            <XAxis
                                dataKey="month"
                                interval={0}   // 🔥 THIS FIXES IT
                                height={60}
                                tick={({ x, y, payload }) => {
                                    const [month, year] = payload.value.split(" ")

                                    return (
                                        <g transform={`translate(${x},${Number(y) + 10})`}>
                                            <text textAnchor="middle" fontSize={12} fill="#666">
                                                <tspan x="0" dy="0">{month}</tspan>
                                                <tspan x="0" dy="14">{year}</tspan>
                                            </text>
                                        </g>
                                    )
                                }}
                            />

                            <YAxis
                                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                            />

                            <Tooltip formatter={(val) => formatCurrency(Number(val))} />

                            <Bar
                                dataKey="bill"
                                fill="url(#billGradient)"
                                radius={[10, 10, 0, 0]}
                            />

                            <Bar
                                dataKey="collected"
                                fill="url(#collectionGradient)"
                                radius={[10, 10, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Payment Status">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                innerRadius={50}
                                data={pieData}
                                dataKey="value"
                                outerRadius={100}
                                label={({ name, percent }) =>
                                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                            >
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i]} />
                                ))}
                            </Pie>
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-sm font-semibold fill-gray-700"
                            >
                                {summary.efficiency}%
                            </text>

                            <Tooltip
                                formatter={(value) =>
                                    formatCurrency(Number(value || 0))
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* 🔥 SUMMARY BELOW PIE */}
                    <div className="mt-4 text-sm space-y-1">
                        <p className="text-green-600">
                            Collected: {formatCurrency(pieData[0]?.value || 0)}
                        </p>
                        <p className="text-red-600">
                            Pending: {formatCurrency(pieData[1]?.value || 0)}
                        </p>
                    </div>
                </ChartCard>

                <ChartCard title="Delay Distribution">

                    {/* SUMMARY */}
                    <div className="flex justify-between text-sm mb-3">
                        <span className="text-green-600">
                            0-7 days: {delayChart[0]?.value || 0}
                        </span>
                        <span className="text-yellow-600">
                            8-15 days: {delayChart[1]?.value || 0}
                        </span>
                        <span className="text-red-600">
                            15+ days: {delayChart[2]?.value || 0}
                        </span>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={delayChart}>
                            <defs>
                                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.35} />
                                </linearGradient>

                                <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.35} />
                                </linearGradient>

                                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />

                            <Tooltip
                                formatter={(value) => `${value} cases`}
                                labelFormatter={(label) => `Delay: ${label} days`}
                            />

                            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                {delayChart.map((entry, index) => {
                                    let fill = "url(#greenGrad)"
                                    if (entry.name === "8-15") fill = "url(#yellowGrad)"
                                    if (entry.name === "15+") fill = "url(#redGrad)"

                                    return <Cell key={index} fill={fill} />
                                })}
                                <LabelList dataKey="value" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Invoice Pipeline">

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pipelineData}
                                dataKey="value"
                                outerRadius={100}
                                label={({ name }) => name}
                            >
                                {/* Prepared */}
                                <Cell fill="#f59e0b" />
                                <Cell fill="#3b82f6" />   // Dispatched (Blue)
                                <Cell fill="#22c55e" />   // Paid (Green)  {/* Paid */}
                            </Pie>

                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Summary */}
                    <div className="mt-4 text-sm space-y-1">
                        <p className="text-yellow-600">Prepared: {summary.prepared}</p>
                        <p className="text-indigo-600">Dispatched: {summary.dispatched}</p>
                        <p className="text-green-600">
                            Paid: {summary.totalBills - summary.pendingPayments}
                        </p>
                    </div>

                </ChartCard>

            </div>

            {/* ================= INSIGHTS ================= */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <ChartCard title="Payment Pending Sites">
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                        {topPendingSites.map((site, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 transition"
                            >
                                <p className="text-sm font-medium text-gray-800">
                                    {site.siteName}
                                </p>

                                <span className="text-sm font-semibold text-red-600">
                                    {formatCurrency(site.billAmount || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Bill Summary">
                    <div className="grid grid-cols-3 gap-4 mt-2">

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Bill Prepared</p>
                            <p className="text-lg font-bold text-yellow-600">
                                {summary.prepared}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Bill Dispatched</p>
                            <p className="text-lg font-bold text-blue-600">
                                {summary.dispatched}
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Missing Bills</p>
                            <p className="text-xs text-gray-500">(Amount not mention)</p>
                            <p className="text-lg font-bold text-red-600">
                                {summary.missingBill}
                            </p>
                        </div>

                        {/* Salary Paid */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Salary Paid</p>
                            <p className="text-lg font-bold text-green-600">
                                {salaryPaid}
                            </p>
                        </div>

                        {/* Salary Unpaid */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Salary Unpaid</p>
                            <p className="text-lg font-bold text-red-600">
                                {salaryUnpaid}
                            </p>
                        </div>

                        {/* Salary Missing */}
                        <div className="bg-gray-50 border border-gray-300 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500">Salary Missing</p>
                            <p className="text-lg font-bold text-gray-600">
                                {salaryMissing}
                            </p>
                        </div>

                    </div>
                </ChartCard>


            </div>

        </div>
    )
}