"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarX, ShieldCheck } from "lucide-react"
import Link from "next/link"
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    CalendarClock,
    CheckCircle2,
    CircleAlert,
    Clock,
    Filter,
    Gauge,
    Layers3,
    LineChart,
    RefreshCw,
    Search,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    UserCheck,
    UserRoundCheck,
    Users,
    UsersRound,
    XCircle,
} from "lucide-react"

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

/* -------------------------------- TYPES -------------------------------- */

type Summary = {
    totalSites: number
    filteredSites: number
    externalSites: number
    ownSites: number
    authorised: number
    deployed: number
    shortage: number
    overDeployed: number
    needed: number
    deploymentPercent: number
    shortagePercent: number
    completedHR3: number
    pendingHR3: number
    underProcessSites: number
    underProcessDesignations: number
    criticalSites: number
    highRiskSites: number
    renewalExpired: number
    renewalDue30: number
    renewalDue90: number
    cutoffCrossedCount: number
    cutoffCrossedSites: string[]
}

type ChartItem = {
    siteId: string
    name: string
    siteCategory?: string
    authorised: number
    deployed: number
    shortage: number
    overDeployed: number
    needed: number
    deploymentPercent: number
    shortagePercent: number
    riskScore: number
    riskLevel: string
}

type DashboardData = {
    success: boolean
    summary: Summary
    chartData: ChartItem[]
    statusData: any[]
    trendData: any[]
    topShortageSites: any[]
    topNeededSites: any[]
    overDeployedSites: any[]
    criticalSites: any[]
    siteTypeData: any[]
    processData: any[]
    renewalRiskData: any[]
    designationShortageData: any[]
    recentActivity: any[]
    latestRecords: any[]
    noActionSites: any[]
}

/* ------------------------------ HELPERS ------------------------------ */

function formatNumber(value: number | undefined | null) {
    return Number(value || 0).toLocaleString("en-IN")
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-"

    const date = new Date(value)

    if (isNaN(date.getTime())) return "-"

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function getRiskBadge(level: string) {
    switch (level) {
        case "Critical":
            return "bg-red-50 text-red-700 border-red-200"
        case "High":
            return "bg-orange-50 text-orange-700 border-orange-200"
        case "Medium":
            return "bg-amber-50 text-amber-700 border-amber-200"
        default:
            return "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
}

function getRenewalBadge(status: string) {
    switch (status) {
        case "Expired":
            return "bg-red-50 text-red-700 border-red-200"
        case "Due in 30 Days":
            return "bg-orange-50 text-orange-700 border-orange-200"
        case "Due in 90 Days":
            return "bg-amber-50 text-amber-700 border-amber-200"
        default:
            return "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null

    return (
        <div className="rounded-xl border bg-white p-3 shadow-lg text-sm">
            <p className="font-semibold text-slate-900 mb-2">{label}</p>
            <div className="space-y-1">
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-6"
                    >
                        <span className="text-slate-500">{entry.name}</span>
                        <span className="font-semibold text-slate-900">
                            {formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
/* ------------------------------ COMPONENTS ------------------------------ */

function StatCard({
    title,
    value,
    subtitle,
    icon,
    tone = "blue",
    trend,
}: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    tone?: "blue" | "green" | "red" | "orange" | "purple" | "slate"
    trend?: "up" | "down"
}) {
    const Icon = icon

    const toneClass: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        red: "bg-red-50 text-red-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-violet-50 text-violet-600",
        slate: "bg-slate-100 text-slate-600",
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {title}
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                        <h3 className="text-3xl font-black text-slate-950">
                            {value}
                        </h3>

                    </div>

                    {subtitle && (
                        <p className="mt-2 text-sm text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass[tone]}`}
                >
                    <Icon size={23} />
                </div>
            </div>
        </div>
    )
}

function ChartCard({
    title,
    subtitle,
    icon,
    children,
    right,
}: {
    title: string
    subtitle?: string
    icon?: any
    children: React.ReactNode
    right?: React.ReactNode
}) {
    const Icon = icon

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {Icon && (
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Icon size={20} />
                        </div>
                    )}

                    <div>
                        <h2 className="text-base font-black text-slate-950">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-1 text-sm text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {right}
            </div>

            {children}
        </div>
    )
}

function EmptyState({ text = "No data available" }: { text?: string }) {
    return (
        <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            {text}
        </div>
    )
}

/* ------------------------------ MAIN PAGE ------------------------------ */

export default function HRDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
        siteType: "all",
        status: "all",
        needed: "all",
        risk: "all",
        renewal: "all",
        process: "all",
    })

    const [siteChartPage, setSiteChartPage] = useState(0)

    const PAGE_SIZE = 6

    const [designationPage, setDesignationPage] = useState(0)

    const DESIGNATION_PAGE_SIZE = 4

    const [selectedNeededSite, setSelectedNeededSite] = useState<any>(null)

    const [tablePage, setTablePage] = useState(1)
    const TABLE_PAGE_SIZE = 10

    async function loadDashboard() {
        try {
            setLoading(true)

            const params = new URLSearchParams()

            if (filters.search) params.set("search", filters.search)
            if (filters.startDate) params.set("startDate", filters.startDate)
            if (filters.endDate) params.set("endDate", filters.endDate)
            if (filters.siteType !== "all") {
                params.set("siteType", filters.siteType)
            }
            if (filters.status !== "all") {
                params.set("status", filters.status)
            }
            if (filters.status !== "all") {
                params.set("status", filters.status)
            }

            if (filters.needed !== "all") {
                params.set("needed", filters.needed)
            }

            if (filters.risk !== "all") {
                params.set("risk", filters.risk)
            }

            if (filters.renewal !== "all") {
                params.set("renewal", filters.renewal)
            }

            if (filters.process !== "all") {
                params.set("process", filters.process)
            }

            const res = await fetch(`/api/hr/admin-dashboard?${params.toString()}`, {
                cache: "no-store",
            })

            const json = await res.json()

            if (!json.success) {
                console.error("Dashboard API error:", json)
                setData(null)
                return
            }

            setData(json)
        } catch (error) {
            console.error("Dashboard load error:", error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboard()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])

    useEffect(() => {
        setSiteChartPage(0)
    }, [filters])

    useEffect(() => {
        setDesignationPage(0)
    }, [filters])

    useEffect(() => {
        setSelectedNeededSite(null)
    }, [filters])

    const summary = data?.summary

    const sortedChartData = useMemo(() => {
        const list = data?.chartData || []

        return [...list].sort((a: any, b: any) => {
            const neededDiff = (b.needed || 0) - (a.needed || 0)
            if (neededDiff !== 0) return neededDiff

            return (b.shortage || 0) - (a.shortage || 0)
        })
    }, [data?.chartData])

    const visibleChartData = useMemo(() => {
        const start = siteChartPage * PAGE_SIZE
        return sortedChartData.slice(start, start + PAGE_SIZE)
    }, [sortedChartData, siteChartPage])

    const maxSiteChartPage = Math.max(
        Math.ceil(sortedChartData.length / PAGE_SIZE) - 1,
        0
    )

    // const visibleChartData = useMemo(() => {
    //     const list = data?.chartData || []
    //     const start = siteChartPage * PAGE_SIZE
    //     return list.slice(start, start + PAGE_SIZE)
    // }, [data?.chartData, siteChartPage])

    const MultiLineXAxisTick = ({ x, y, payload }: any) => {
        const value = String(payload.value || "")

        const words = value.split(" ")
        const lines: string[] = []
        let currentLine = ""

        words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word

            // control line length here
            if (testLine.length > 14) {
                if (currentLine) lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        })

        if (currentLine) lines.push(currentLine)

        // keep only 3 lines max
        const finalLines =
            lines.length > 3
                ? [...lines.slice(0, 2), `${lines.slice(2).join(" ").slice(0, 18)}...`]
                : lines

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    textAnchor="middle"
                    fill="#475569"
                    fontSize={11}
                    fontWeight={500}
                >
                    {finalLines.map((line, index) => (
                        <tspan
                            key={index}
                            x={0}
                            dy={index === 0 ? 12 : 14}
                        >
                            {line}
                        </tspan>
                    ))}
                </text>
            </g>
        )
    }

    // const maxSiteChartPage = Math.max(
    //     Math.ceil((data?.chartData?.length || 0) / PAGE_SIZE) - 1,
    //     0
    // )


    const filteredDesignationData = useMemo(() => {
        const list = data?.designationShortageData || []

        if (!selectedNeededSite?.siteId) return list

        return list.filter(
            (item: any) =>
                String(item.siteId) === String(selectedNeededSite.siteId)
        )
    }, [data?.designationShortageData, selectedNeededSite])

    const visibleDesignationData = useMemo(() => {
        const start = designationPage * DESIGNATION_PAGE_SIZE
        return filteredDesignationData.slice(start, start + DESIGNATION_PAGE_SIZE)
    }, [filteredDesignationData, designationPage])

    const maxDesignationPage = Math.max(
        Math.ceil(filteredDesignationData.length / DESIGNATION_PAGE_SIZE) - 1,
        0
    )

    const riskDistribution = useMemo(() => {
        const records = data?.latestRecords || []

        return [
            {
                name: "Critical",
                value: records.filter((x: any) => x.riskLevel === "Critical")
                    .length,
            },
            {
                name: "High",
                value: records.filter((x: any) => x.riskLevel === "High")
                    .length,
            },
            {
                name: "Medium",
                value: records.filter((x: any) => x.riskLevel === "Medium")
                    .length,
            },
            {
                name: "Low",
                value: records.filter((x: any) => x.riskLevel === "Low")
                    .length,
            },
        ]
    }, [data?.latestRecords])

    const deploymentGaugeData = [
        {
            name: "Deployment",
            value: summary?.deploymentPercent || 0,
            fill: "#2563eb",
        },
    ]

    function clearFilters() {
        setFilters({
            search: "",
            startDate: "",
            endDate: "",
            siteType: "all",
            status: "all",
            needed: "all",
            risk: "all",
            renewal: "all",
            process: "all",
        })
    }

    const totalTableRecords = data?.latestRecords?.length || 0
    const totalTablePages = Math.max(
        Math.ceil(totalTableRecords / TABLE_PAGE_SIZE),
        1
    )

    const paginatedLatestRecords = useMemo(() => {
        const records = data?.latestRecords || []
        const start = (tablePage - 1) * TABLE_PAGE_SIZE
        return records.slice(start, start + TABLE_PAGE_SIZE)
    }, [data?.latestRecords, tablePage])

    const tableStart =
        totalTableRecords === 0 ? 0 : (tablePage - 1) * TABLE_PAGE_SIZE + 1

    const tableEnd = Math.min(tablePage * TABLE_PAGE_SIZE, totalTableRecords)

    useEffect(() => {
        setTablePage(1)
    }, [filters])

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-[1600px]">
                    <div className="animate-pulse space-y-6">
                        <div className="h-12 w-80 rounded-2xl bg-slate-200" />
                        <div className="h-24 rounded-3xl bg-slate-200" />
                        <div className="grid grid-cols-4 gap-5">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-32 rounded-3xl bg-slate-200"
                                />
                            ))}
                        </div>
                        <div className="h-96 rounded-3xl bg-slate-200" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <main className="mx-auto max-w-[1600px] px-6 py-8">
                {/* HEADER */}
                <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>


                        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                            Manpower Dashboard
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Complete visibility of authorised manpower,
                            deployment, shortage, recruitment, renewals and
                            critical site risks.
                        </p>
                    </div>


                </div>

                {/* FILTERS */}
                <div className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {/* SEARCH */}
                        <div className="relative xl:col-span-2">
                            <Search
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }))
                                }
                                placeholder="Search site name..."
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* START DATE */}
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    startDate: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        />

                        {/* END DATE */}
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    endDate: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        />

                        {/* SITE TYPE */}
                        <select
                            value={filters.siteType}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    siteType: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        >
                            <option value="all">All Types</option>
                            <option value="EXTERNAL">External</option>
                            <option value="OWN">Own</option>
                        </select>


                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {/* NEEDED FILTER */}
                        <select
                            value={filters.needed}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    needed: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        >
                            <option value="all">All Needed</option>
                            <option value="gt0">Needed &gt; 0</option>
                            <option value="zero">Needed = 0</option>
                            <option value="1-2">Needed 1 to 2</option>
                            <option value="3-7">Needed 3 to 7</option>
                            <option value="8plus">Needed 8+</option>
                        </select>

                        {/* RISK FILTER */}
                        <select
                            value={filters.risk}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    risk: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        >
                            <option value="all">All Risk</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        {/* RENEWAL FILTER */}
                        <select
                            value={filters.renewal}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    renewal: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        >
                            <option value="all">All Renewal</option>
                            <option value="Expired">Expired</option>
                            <option value="Due in 30 Days">Due in 30 Days</option>
                            <option value="Due in 90 Days">Due in 90 Days</option>
                            <option value="Safe">Safe</option>
                        </select>

                        {/* PROCESS FILTER */}
                        <select
                            value={filters.process}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    process: e.target.value,
                                }))
                            }
                            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                        >
                            <option value="all">All Process</option>
                            <option value="Not Required">Not Required</option>
                            <option value="Under Process">Under Process</option>
                            <option value="Completed">Completed</option>
                        </select>

                        {/* CLEAR */}
                        <button
                            onClick={clearFilters}
                            className="h-12 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 hover:bg-red-100"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Sites"
                        value={formatNumber(summary?.totalSites || 0)}
                        subtitle={`External: ${formatNumber(
                            summary?.externalSites || 0
                        )} / Own: ${formatNumber(summary?.ownSites || 0)}`}
                        icon={Building2}
                        tone="blue"
                    />

                    <StatCard
                        title="Authorised Manpower"
                        value={formatNumber(summary?.authorised || 0)}
                        subtitle="Total approved manpower strength"
                        icon={UsersRound}
                        tone="purple"
                    />

                    <StatCard
                        title="Deployed Manpower"
                        value={formatNumber(summary?.deployed || 0)}
                        subtitle={`${summary?.deploymentPercent || 0}% deployment achieved`}
                        icon={UserRoundCheck}
                        tone="green"
                        trend="up"
                    />

                    <StatCard
                        title="Total Shortage"
                        value={formatNumber(summary?.shortage || 0)}
                        subtitle={`${summary?.shortagePercent || 0}% shortage against authorised`}
                        icon={TrendingDown}
                        tone="red"
                        trend="down"
                    />

                    <StatCard
                        title="Recruitment Needed"
                        value={formatNumber(summary?.needed || 0)}
                        subtitle="Positions requiring action"
                        icon={Users}
                        tone="orange"
                    />

                    <StatCard
                        title="Recruitment Under Process"
                        value={formatNumber(summary?.underProcessDesignations || 0)}
                        subtitle="Recruitment currently in progress"
                        icon={Clock}
                        tone="blue"
                    />

                    <StatCard
                        title="Critical / High Risk"
                        value={`${formatNumber(
                            summary?.criticalSites || 0
                        )} / ${formatNumber(summary?.highRiskSites || 0)}`}
                        subtitle="Sites requiring management attention"
                        icon={ShieldAlert}
                        tone="red"
                    />

                    <StatCard
                        title="Renewal Alerts"
                        value={formatNumber(
                            (summary?.renewalExpired || 0) +
                            (summary?.renewalDue30 || 0) +
                            (summary?.renewalDue90 || 0)
                        )}
                        subtitle={`${formatNumber(summary?.renewalExpired || 0)} expired • ${formatNumber(
                            summary?.renewalDue30 || 0
                        )} due in 30 days • ${formatNumber(summary?.renewalDue90 || 0)} due in 90 days`}
                        icon={CalendarClock}
                        tone="orange"
                    />
                </div>

                {/* MANAGEMENT ALERT STRIP */}
                <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-4">
                    <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-700">
                                    Critical Focus
                                </p>
                                <h3 className="text-2xl font-black text-slate-950">
                                    {formatNumber(summary?.criticalSites || 0)}{" "}
                                    Critical Sites
                                </h3>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Sites marked critical due to manpower shortage,
                            recruitment need, renewal urgency or pending recruitment process
                            action.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                <Gauge size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-700">
                                    Deployment Health
                                </p>
                                <h3 className="text-2xl font-black text-slate-950">
                                    {summary?.deploymentPercent || 0}%
                                </h3>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Overall deployed manpower compared with authorised
                            manpower across latest site submissions.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                                <CircleAlert size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-700">
                                    Recruitment Process Pending
                                </p>
                                <h3 className="text-2xl font-black text-slate-950">
                                    {formatNumber(summary?.pendingHR3 || 0)}
                                </h3>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Sites where recruitment process, responsibility,
                            cutoff or remarks are still not updated.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <CalendarX size={22} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-red-700">
                                    Cutoff Date Crossed
                                </p>

                                <h3 className="text-2xl font-black text-slate-950">
                                    {formatNumber(summary?.cutoffCrossedCount || 0)} Designations
                                </h3>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                            {summary?.cutoffCrossedSites?.length
                                ? `Sites: ${summary.cutoffCrossedSites.slice(0, 3).join(", ")}${summary.cutoffCrossedSites.length > 3
                                    ? ` +${summary.cutoffCrossedSites.length - 3} more`
                                    : ""
                                }`
                                : "No crossed cutoff dates."}
                        </p>
                    </div>
                </div>

                {/* ROW 1 CHARTS */}
                <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-1">
                    <div className="xl:col-span-2">
                        <ChartCard
                            title="Authorised vs Deployed vs Needed"
                            subtitle="Site-wise manpower comparison"
                            icon={BarChart3}
                            right={
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={siteChartPage === 0}
                                        onClick={() =>
                                            setSiteChartPage((p) =>
                                                Math.max(p - 1, 0)
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                                    >
                                        ←
                                    </button>
                                    <button
                                        disabled={
                                            siteChartPage >= maxSiteChartPage
                                        }
                                        onClick={() =>
                                            setSiteChartPage((p) =>
                                                Math.min(
                                                    p + 1,
                                                    maxSiteChartPage
                                                )
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                                    >
                                        →
                                    </button>
                                </div>
                            }
                        >
                            <div className="h-[360px]">
                                {visibleChartData.length ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={visibleChartData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11 }}
                                                interval={0}
                                                height={70}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="authorised"
                                                name="Authorised"
                                                fill="#2563eb"
                                                radius={[8, 8, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="deployed"
                                                name="Deployed"
                                                fill="#10b981"
                                                radius={[8, 8, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="needed"
                                                name="Needed"
                                                fill="#f97316"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        </ChartCard>
                    </div>


                </div>

                {/* ROW 2 CHARTS */}
                <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-2">


                    <ChartCard
                        title="Needed Sites"
                        subtitle="Highest recruitment / manpower requirement"
                        icon={Users}
                    >
                        <div className="h-[390px]">
                            {data?.topNeededSites?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.topNeededSites}

                                        margin={{
                                            left: 0,
                                            right: 10,
                                            top: 5,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="site"
                                            interval={0}
                                            height={55}
                                            tick={<MultiLineXAxisTick />}
                                        />

                                        <YAxis tick={{ fontSize: 12 }} />

                                        <Tooltip content={<CustomTooltip />} />

                                        <Legend verticalAlign="bottom" height={20} />

                                        <Bar
                                            dataKey="needed"
                                            name="Needed"
                                            fill="#f97316"
                                            radius={[8, 8, 0, 0]}
                                            cursor="pointer"
                                            onClick={(bar: any) => {
                                                const site = bar?.payload
                                                if (!site?.siteId) return

                                                setSelectedNeededSite(site)
                                                setDesignationPage(0)
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState text="No recruitment needed" />
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Designation-wise Needed"
                        subtitle={
                            selectedNeededSite
                                ? `Showing designation need for ${selectedNeededSite.site}`
                                : "Roles with highest recruitment requirement"
                        }
                        icon={Layers3}
                        right={
                            <div className="flex items-center gap-2">
                                {selectedNeededSite && (
                                    <button
                                        onClick={() => {
                                            setSelectedNeededSite(null)
                                            setDesignationPage(0)
                                        }}
                                        className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100"
                                    >
                                        Clear Site
                                    </button>
                                )}

                                <button
                                    disabled={designationPage === 0}
                                    onClick={() =>
                                        setDesignationPage((p) => Math.max(p - 1, 0))
                                    }
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                                >
                                    ←
                                </button>

                                <button
                                    disabled={designationPage >= maxDesignationPage}
                                    onClick={() =>
                                        setDesignationPage((p) =>
                                            Math.min(p + 1, maxDesignationPage)
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                                >
                                    →
                                </button>
                            </div>
                        }
                    >
                        <div className="h-[390px]">
                            {visibleDesignationData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={visibleDesignationData}
                                        margin={{
                                            top: 0,
                                            right: 10,
                                            left: -10,
                                            bottom: 20,
                                        }}
                                        barCategoryGap="18%"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="designation"
                                            interval={0}
                                            height={55}
                                            tick={<MultiLineXAxisTick />}
                                        />

                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            allowDecimals={false}
                                        />

                                        <Tooltip content={<CustomTooltip />} />

                                        <Legend verticalAlign="top" height={24} />

                                        <Bar
                                            dataKey="authorised"
                                            name="Authorised"
                                            fill="#2563eb"
                                            radius={[8, 8, 0, 0]}
                                            barSize={20}
                                        />

                                        <Bar
                                            dataKey="deployed"
                                            name="Deployed"
                                            fill="#10b981"
                                            radius={[8, 8, 0, 0]}
                                            barSize={20}
                                        />

                                        <Bar
                                            dataKey="needed"
                                            name="Needed"
                                            fill="#f97316"
                                            radius={[8, 8, 0, 0]}
                                            barSize={20}
                                        >
                                            {(data?.topNeededSites || []).map((entry: any, index: number) => (
                                                <Cell
                                                    key={`needed-site-${entry.siteId || index}`}
                                                    cursor="pointer"
                                                    fill={
                                                        selectedNeededSite?.siteId === entry.siteId
                                                            ? "#ea580c"
                                                            : "#f97316"
                                                    }
                                                    onClick={() => {
                                                        setSelectedNeededSite({
                                                            siteId: entry.siteId,
                                                            site: entry.site,
                                                        })
                                                        setDesignationPage(0)
                                                    }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState text="No designation-wise recruitment needed" />
                            )}
                        </div>
                    </ChartCard>


                </div>


                {/* CRITICAL TABLES */}
                <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <ChartCard
                        title="Recruitment Risk Sites"
                        subtitle="Sites classified by manpower needed"
                        icon={ShieldAlert}
                    >
                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm font-black text-red-700">Critical</p>
                                <p className="mt-1 text-xs text-red-600">Needed 8+</p>
                            </div>

                            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                                <p className="text-sm font-black text-orange-700">High</p>
                                <p className="mt-1 text-xs text-orange-600">Needed 3 to 7</p>
                            </div>

                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-sm font-black text-amber-700">Medium</p>
                                <p className="mt-1 text-xs text-amber-600">Needed 1 to 2</p>
                            </div>
                        </div>

                        <div className="max-h-[430px] overflow-y-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Site</th>
                                        <th className="px-4 py-3 text-right">Needed</th>
                                        <th className="px-4 py-3 text-center">Risk</th>
                                        <th className="px-4 py-3 text-center">View</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data?.criticalSites?.length ? (
                                        data.criticalSites.map((item: any) => (
                                            <tr
                                                key={item.siteId}
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-950">
                                                        {item.site}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Renewal: {item.renewalStatus}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-right text-lg font-black text-orange-600">
                                                    {formatNumber(item.needed)}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadge(
                                                            item.riskLevel
                                                        )}`}
                                                    >
                                                        {item.riskLevel}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={`/hr_dashboard/${item.siteId}?submissionId=${item.submissionId}&onlyNeeded=false`}
                                                        className="font-bold text-blue-600 hover:underline"
                                                    >
                                                        Open
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-slate-400"
                                            >
                                                No recruitment risk sites found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Renewal Risk"
                        subtitle="Expired and upcoming renewal alerts"
                        icon={CalendarClock}
                    >
                        <div className="max-h-[560px] overflow-y-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="w-[28%] px-4 py-3 text-left">Site</th>
                                        <th className="w-[18%] px-4 py-3 text-left">
                                            Next Renewal
                                        </th>
                                        <th className="w-[38%] px-4 py-3 text-left">
                                            Remark
                                        </th>
                                        <th className="w-[16%] px-4 py-3 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data?.renewalRiskData?.length ? (
                                        data.renewalRiskData.slice(0, 10).map((item: any) => (
                                            <tr
                                                key={item.siteId}
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-3 font-bold text-slate-950">
                                                    {item.site}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                    {formatDate(item.nextRenewalDate)}
                                                </td>

                                                <td className="px-4 py-3 text-slate-600">
                                                    <p className="line-clamp-2 leading-5">
                                                        {item.remark || "-"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRenewalBadge(
                                                            item.renewalStatus
                                                        )}`}
                                                    >
                                                        {item.renewalStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-slate-400"
                                            >
                                                No renewal risk found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </div>

                {/* ACTION LISTS */}
                <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <ChartCard
                        title="Recruitment Action List"
                        subtitle="Sites where recruitment is needed"
                        icon={Users}
                    >
                        <div className="space-y-3">
                            {data?.topNeededSites?.length ? (
                                data.topNeededSites
                                    .slice(0, 8)
                                    .map((item: any, index: number) => (
                                        <div
                                            key={item.siteId}
                                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {index + 1}. {item.site}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.processSummary || "-"}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xl font-black text-orange-600">
                                                    {item.needed}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Needed
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <EmptyState text="No recruitment needed" />
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Over-Deployed Sites"
                        subtitle="Sites where deployed is greater than authorised"
                        icon={ArrowUpRight}
                    >
                        <div className="space-y-3">
                            {data?.overDeployedSites?.length ? (
                                data.overDeployedSites
                                    .slice(0, 8)
                                    .map((item: any, index: number) => (
                                        <div
                                            key={item.siteId}
                                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {index + 1}. {item.site}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Authorised {item.authorised} / Deployed{" "}
                                                    {item.deployed}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xl font-black text-blue-600">
                                                    +{item.overDeployed}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Extra
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <EmptyState text="No over-deployed sites" />
                            )}
                        </div>
                    </ChartCard>

                    {/* <ChartCard
                        title={`Sites Without Manpower Action (${data?.noActionSites?.length || 0})`}
                        subtitle="Sites where manpower submission is not available"
                        icon={ShieldCheck}
                    >
                        <div className="max-h-[520px] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                {data?.noActionSites?.length ? (
                                    data.noActionSites.map((item: any, index: number) => (
                                        <div
                                            key={item.siteId}
                                            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-950">
                                                        {index + 1}. {item.site}
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Authorised {formatNumber(item.authorised || 0)}
                                                    </p>

                                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                                                        Remark: {item.remark || "-"}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                                        Pending
                                                    </span>

                                                    <p className="mt-2 text-xs text-slate-400">
                                                        No Manpower data
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState text="All sites have manpower action" />
                                )}
                            </div>
                        </div>
                    </ChartCard> */}
                </div>

                {/* ADVANCED MASTER TABLE */}
                <ChartCard
                    title="Site Table"
                    subtitle="Complete site-wise manpower, recruitment, renewal and risk view"
                    icon={BarChart3}
                    right={
                        <div className="text-sm font-semibold text-slate-500">
                            Showing {tableStart}-{tableEnd} of {totalTableRecords}
                        </div>
                    }
                >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1250px] text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Sr No.</th>
                                    <th className="px-4 py-3 text-left">Site</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3 text-right">Authorised</th>
                                    <th className="px-4 py-3 text-right">Deployed</th>
                                    <th className="px-4 py-3 text-right">Shortage</th>
                                    <th className="px-4 py-3 text-right">Needed</th>
                                    <th className="px-4 py-3 text-right">Deploy %</th>
                                    <th className="px-4 py-3 text-center">Process</th>
                                    <th className="px-4 py-3 text-center">Renewal</th>
                                    <th className="px-4 py-3 text-center">View</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedLatestRecords.length ? (
                                    paginatedLatestRecords.map((item: any, index: number) => (
                                        <tr
                                            key={item.siteId}
                                            className="border-t border-slate-100 hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-4 font-bold text-slate-500">
                                                {(tablePage - 1) * TABLE_PAGE_SIZE + index + 1}
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="font-bold text-slate-950">
                                                    {item.site}
                                                </p>
                                                <p className="mt-1 line-clamp-1 max-w-[280px] text-xs text-slate-400">
                                                    {item.siteRemark || "-"}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                    {item.siteCategory || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-blue-600">
                                                {formatNumber(item.required)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-emerald-600">
                                                {formatNumber(item.deployed)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-red-600">
                                                {formatNumber(item.shortage || 0)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold text-orange-600">
                                                {formatNumber(item.needed)}
                                            </td>

                                            <td className="px-4 py-4 text-right font-bold">
                                                {item.deploymentPercent || 0}%
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                    {item.processLabel || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRenewalBadge(
                                                        item.renewalStatus
                                                    )}`}
                                                >
                                                    {item.renewalStatus}
                                                </span>
                                            </td>



                                            <td className="px-4 py-4 text-center">
                                                <Link
                                                    href={`/hr_dashboard/${item.siteId}?submissionId=${item.submissionId}&onlyNeeded=false`}
                                                    className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="px-4 py-12 text-center text-slate-400"
                                        >
                                            No dashboard records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Page {tablePage} of {totalTablePages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={tablePage === 1}
                                onClick={() => setTablePage((prev) => Math.max(prev - 1, 1))}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalTablePages }).map((_, index) => {
                                const page = index + 1

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setTablePage(page)}
                                        className={`h-9 w-9 rounded-xl text-sm font-bold ${tablePage === page
                                            ? "bg-blue-600 text-white"
                                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}

                            <button
                                disabled={tablePage === totalTablePages}
                                onClick={() =>
                                    setTablePage((prev) =>
                                        Math.min(prev + 1, totalTablePages)
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </ChartCard>
            </main>
        </div>
    )
}