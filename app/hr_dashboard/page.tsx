"use client"

import { useEffect, useState } from "react"
import {
    Building2,
    Users,
    UserCheck,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"

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

/* ---------- CARD ---------- */
function MetricCard({ title, value, icon, border, bg }: any) {
    return (
        <div className="
            group relative overflow-hidden
            rounded-2xl border bg-white/80 backdrop-blur
            p-6 shadow-sm hover:shadow-xl transition-all duration-300
        ">
            {/* subtle glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-xs text-gray-400 tracking-wide uppercase">
                        {title}
                    </p>

                    <h4 className="mt-3 text-4xl font-semibold text-gray-900">
                        {value}
                    </h4>
                </div>

                <div className={`
                    h-14 w-14 flex items-center justify-center rounded-xl
                    ${bg} shadow-inner
                `}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

/* ---------- DATE ---------- */

function formatDate(date: string) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    })
}

/* ---------- PAGE ---------- */

export default function HRAdminDashboard() {

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [chartIndex, setChartIndex] = useState(0)
    const ITEMS_PER_CHART = 4

    const [neededIndex, setNeededIndex] = useState(0)
    const ITEMS_PER_CARD = 7

    const filteredNeeded = (data?.allNeeded || []).filter(
        (site: any) => (site.needed || 0) > 0
    )
    const visibleNeeded = filteredNeeded.slice(
        neededIndex,
        neededIndex + ITEMS_PER_CARD
    )

    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const clearFilters = () => {
        setSearch("")
        setStatus("all")
        setStartDate("")
        setEndDate("")
        setChartIndex(0)
    }


    useEffect(() => {
        setChartIndex(0)
    }, [search, status, startDate, endDate])

    useEffect(() => {
        async function loadData() {
            try {
                const query = new URLSearchParams({
                    search,
                    status,
                    startDate,
                    endDate,
                })

                const res = await fetch(`/api/hr/admin-dashboard?${query}`, {
                    cache: "no-store",
                })

                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [search, status, startDate, endDate])

    if (loading) return <div className="p-6">Loading...</div>

    /* ---------- CHART DATA ---------- */

    const summary = data?.summary || {}
    const chartDataFull = data?.chartData || []
    const statusData = data?.statusData || []
    const trendData = data?.trendData || []

    const recentActivity = data?.recentActivity || []
    const chartData = chartDataFull.slice(
        chartIndex,
        chartIndex + ITEMS_PER_CHART
    )



    /* ---------- UI ---------- */

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">

            <div className="space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Manpower Dashboard</h1>
                    <p className="text-gray-500 text-sm">
                        Complete manpower & recruitment visibility
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-5 shadow-md hover:shadow-xl transition">

                    {/* LEFT SIDE */}
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            placeholder="Search site..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border px-4 py-2 rounded-lg text-sm w-56"
                        />

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border px-4 py-2 rounded-lg text-sm"
                        >
                            <option value="all">All</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                        </select>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border px-3 py-2 rounded-lg text-sm"
                        />

                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border px-3 py-2 rounded-lg text-sm"
                        />
                    </div>

                    {/* RIGHT SIDE */}
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Clear Filters
                    </button>

                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    <MetricCard
                        title="Total Sites"
                        value={summary.totalSites}
                        icon={<Building2 className="h-6 w-6 text-blue-600" />}
                        border="border-blue-200"
                        bg="bg-blue-100/60"
                    />

                    <MetricCard
                        title="Manpower Authorised"
                        value={summary.authorised}
                        icon={<Users className="h-6 w-6 text-purple-600" />}
                        border="border-purple-200"
                        bg="bg-violet-100/60"
                    />

                    <MetricCard
                        title="Manpower Deployed"
                        value={summary.deployed}
                        icon={<UserCheck className="h-6 w-6 text-green-600" />}
                        border="border-green-200"
                        bg="bg-emerald-100/60"
                    />

                    {/* <MetricCard
                        title="Total Shortage"
                        value={summary.shortage}
                        icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                        border="border-red-200"
                        bg="bg-rose-100/60"
                    /> */}

                    <MetricCard
                        title="Recruitment Needed"
                        value={summary.needed}
                        icon={<Users className="h-6 w-6 text-orange-600" />}
                        border="border-orange-200"
                        bg="bg-amber-100/60"
                    />

                    <MetricCard
                        title="Recruitment Pending Form"
                        value={summary.pendingHR3}
                        icon={<CheckCircle2 className="h-6 w-6 text-indigo-600" />}
                        border="border-indigo-200"
                        bg="bg-indigo-100/60"
                    />

                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Bar */}
                    <div className="bg-white rounded-2xl border p-5 col-span-2">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Authorised vs Deployed
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Scroll through all sites
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setChartIndex((prev) => Math.max(prev - ITEMS_PER_CHART, 0))}
                                    disabled={chartIndex === 0}
                                    className={`border rounded px-2 py-1 ${chartIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
                                        }`}
                                >
                                    ←
                                </button>

                                <button
                                    onClick={() =>
                                        setChartIndex((prev) =>
                                            prev + ITEMS_PER_CHART < chartDataFull.length
                                                ? prev + ITEMS_PER_CHART
                                                : prev
                                        )
                                    }
                                    disabled={chartIndex + ITEMS_PER_CHART >= chartDataFull.length}
                                    className={`border rounded px-2 py-1 ${chartIndex + ITEMS_PER_CHART >= chartDataFull.length
                                        ? "opacity-40 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                        }`}
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div className="h-[350px]">
                            <ResponsiveContainer>
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="#e5e7eb" />



                                    <XAxis
                                        dataKey="name"
                                        interval={0}
                                        height={60}
                                        tick={(props) => {
                                            const { x, y, payload } = props

                                            const words = payload.value.split(" ")

                                            const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ")
                                            const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ")

                                            return (
                                                <g transform={`translate(${x},${Number(y) + 10})`}>
                                                    <text
                                                        textAnchor="middle"
                                                        fill="#6b7280"
                                                        fontSize={11}
                                                    >
                                                        <tspan x="0" dy="0">{firstLine}</tspan>
                                                        <tspan x="0" dy="14">{secondLine}</tspan>
                                                    </text>
                                                </g>
                                            )
                                        }}
                                    />

                                    <YAxis
                                        tick={{ fill: "#6b7280" }}
                                        domain={[0, 'dataMax + 10']}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "10px",
                                            border: "none",
                                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                                        }}
                                    />

                                    <Bar
                                        dataKey="authorised"
                                        fill="#3b82f6"
                                        radius={[6, 6, 0, 0]}
                                    />

                                    <Bar
                                        dataKey="deployed"
                                        fill="#10b981"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie */}
                    <div className="bg-white rounded-2xl border p-5">
                        <h3 className="text-sm font-semibold">Form Status</h3>

                        <div className="h-[220px] flex flex-col justify-center">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#ef4444" />
                                    </Pie>

                                    {/* ✅ CENTER TEXT */}
                                    <text
                                        x="50%"
                                        y="45%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-2xl font-bold fill-gray-800"
                                    >
                                        {summary.totalSites}
                                    </text>

                                    <text
                                        x="50%"
                                        y="60%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-xs fill-gray-400"
                                    >
                                        Total Sites
                                    </text>

                                    <Tooltip />
                                </PieChart>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-gray-600">Completed:  </span>
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            {statusData[0]?.value || 0}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-gray-600">Pending:  </span>
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            {statusData[1]?.value || 0}
                                        </span>
                                    </div>
                                </div>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Trend */}
                {/* <div className="bg-white rounded-2xl border p-5">
                    <h3 className="text-sm font-semibold">Manpower Trend</h3>

                    <div className="h-[300px]">
                        <ResponsiveContainer>
                            <AreaChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <defs>
                                    <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>

                                    <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <Area type="monotone" dataKey="authorised" stroke="#3b82f6" fill="url(#blue)" />
                                <Area type="monotone" dataKey="deployed" stroke="#10b981" fill="url(#green)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 🔴 Top Shortage */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Recruitment Needed
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Sites needing immediate attention
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setNeededIndex((prev) => Math.max(prev - ITEMS_PER_CARD, 0))
                                    }
                                    disabled={neededIndex === 0}
                                    className={`border rounded px-2 py-1 ${neededIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
                                        }`}
                                >
                                    ←
                                </button>

                                <button
                                    onClick={() =>
                                        setNeededIndex((prev) =>
                                            prev + ITEMS_PER_CARD < filteredNeeded.length
                                                ? prev + ITEMS_PER_CARD
                                                : prev
                                        )
                                    }
                                    disabled={neededIndex + ITEMS_PER_CARD >= filteredNeeded.length}
                                    className={`border rounded px-2 py-1 ${neededIndex + ITEMS_PER_CARD >= filteredNeeded.length
                                        ? "opacity-40 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                        }`}
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        {visibleNeeded.length ? (
                            <div className="space-y-3">
                                {visibleNeeded.map((site: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{site.site}</span>
                                        <span className="font-semibold text-orange-600">
                                            {site.needed || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-10">
                                No data for selected filters
                            </p>
                        )}
                    </div>

                    {/* 🟢 Recent Activity */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Recent Activity
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Latest manpower submissions
                                </p>
                            </div>
                            <CheckCircle2 className="text-blue-500" size={18} />
                        </div>

                        {recentActivity.length ? (
                            <div className="space-y-3">
                                {recentActivity.map((item: any, i: number) => (
                                    <div key={i} className="text-sm">
                                        <p className="text-gray-700 font-medium">
                                            {item.site}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatDate(item.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                No recent submissions
                            </p>
                        )}
                    </div>

                </div>

            </div>
        </div>
    )
}