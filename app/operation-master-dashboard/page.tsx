"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    IndianRupee,
    Plane,
    RefreshCw,
    Search,
    ShieldAlert,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react"

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

type DashboardData = {
    success: boolean
    filters: {
        users: any[]
        sites: string[]
    }
    totals: any
    countExplanation: any[]
    charts: any
    highRiskSites: any[]
    latestActivity: any[]
    records: {
        dailySiteReports: any[]
        travelVisitPlans: any[]
        costLeakReports: any[]
        costSavingReports: any[]
        amitojCommandTargets: any[]
        amitojSiteControls: any[]
        amitojTravelVisitPlans: any[]
    }
}

type TabKey =
    | "overview"
    | "dailySiteReports"
    | "travelVisitPlans"
    | "costLeakReports"
    | "costSavingReports"
    | "amitojCommandTargets"
    | "amitojSiteControls"
    | "amitojTravelVisitPlans"

type Column = {
    key: string
    label: string
    render?: (row: any) => React.ReactNode
}

const PAGE_SIZE = 8

const COLORS = {
    indigo: "#4f46e5",
    violet: "#7c3aed",
    orange: "#f97316",
    amber: "#f59e0b",
    rose: "#e11d48",
    pink: "#ec4899",
    emerald: "#10b981",
    teal: "#14b8a6",
    sky: "#0284c7",
    slate: "#334155",
    red: "#dc2626",
}

const PIE_COLORS = [
    COLORS.indigo,
    COLORS.orange,
    COLORS.rose,
    COLORS.emerald,
    COLORS.violet,
    COLORS.amber,
    COLORS.teal,
    COLORS.sky,
    COLORS.slate,
]

function formatMoney(value: any) {
    const amount = Number(value || 0)

    return amount.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })
}

function formatDate(value: any) {
    if (!value) return "-"

    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatDateTime(value: any) {
    if (!value) return "-"

    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function statusClass(value: any) {
    const v = String(value || "").toLowerCase()

    if (
        v.includes("open") ||
        v.includes("pending") ||
        v.includes("risk") ||
        v.includes("red") ||
        v.includes("weak") ||
        v.includes("disrupted") ||
        v.includes("not raised")
    ) {
        return "bg-rose-50 text-rose-700 ring-rose-200"
    }

    if (
        v.includes("follow") ||
        v.includes("partial") ||
        v.includes("progress") ||
        v.includes("yellow")
    ) {
        return "bg-amber-50 text-amber-700 ring-amber-200"
    }

    if (
        v.includes("closed") ||
        v.includes("resolved") ||
        v.includes("received") ||
        v.includes("normal") ||
        v.includes("green") ||
        v.includes("completed") ||
        v.includes("yes") ||
        v.includes("manageable")
    ) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-200"
    }

    return "bg-slate-100 text-slate-700 ring-slate-200"
}

function StatusPill({ value }: { value: any }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(
                value
            )}`}
        >
            {String(value || "-")}
        </span>
    )
}

function StatCard({
    title,
    value,
    sub,
    icon: Icon,
    tone = "indigo",
}: {
    title: string
    value: string | number
    sub: string
    icon: any
    tone?: "indigo" | "orange" | "rose" | "emerald" | "slate" | "sky"
}) {
    const tones: any = {
        indigo: "from-indigo-600 to-violet-600",
        orange: "from-orange-500 to-amber-500",
        rose: "from-rose-600 to-pink-600",
        emerald: "from-emerald-600 to-teal-600",
        slate: "from-slate-800 to-slate-600",
        sky: "from-sky-600 to-cyan-500",
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-black text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {value}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{sub}</p>
                </div>

                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-lg`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    )
}

function ChartCard({
    title,
    sub,
    children,
}: {
    title: string
    sub: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-black text-slate-950">{title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>
            </div>

            <div className="h-[330px]">{children}</div>
        </div>
    )
}

function EmptyState({ label = "No records found" }: { label?: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400">
            {label}
        </div>
    )
}

function TableView({
    title,
    sub,
    rows,
    columns,
    search,
    page,
    onPageChange,
}: {
    title: string
    sub: string
    rows: any[]
    columns: Column[]
    search: string
    page: number
    onPageChange: (page: number) => void
}) {
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return rows

        return rows.filter((row) => {
            return JSON.stringify(row).toLowerCase().includes(q)
        })
    }, [rows, search])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)

    const start = (safePage - 1) * PAGE_SIZE
    const paginatedRows = filteredRows.slice(start, start + PAGE_SIZE)

    return (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center">
                <div>
                    <h3 className="text-base font-black text-slate-950">{title}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>
                </div>

                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                    Showing {paginatedRows.length} of {filteredRows.length} rows
                </div>
            </div>

            <div className="overflow-x-auto">
                {paginatedRows.length ? (
                    <table className="w-full min-w-[1200px] text-sm">
                        <thead className="bg-slate-950 text-white">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-4 py-3 text-left font-black">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedRows.map((row, index) => (
                                <tr
                                    key={row.id || index}
                                    className="border-b border-slate-100 hover:bg-slate-50"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className="whitespace-nowrap px-4 py-3 text-slate-600"
                                        >
                                            {col.render ? col.render(row) : row[col.key] || "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-5">
                        <EmptyState />
                    </div>
                )}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center">
                <p className="text-xs font-semibold text-slate-500">
                    Page {safePage} of {totalPages}
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, safePage - 1))}
                        disabled={safePage <= 1}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                        Prev
                    </button>

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                        disabled={safePage >= totalPages}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default function OperationMasterDashboardPage() {
    const router = useRouter()

    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const [selectedSite, setSelectedSite] = useState("all")
    const [selectedUser, setSelectedUser] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const [activeTab, setActiveTab] = useState<TabKey>("overview")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const user = useMemo(() => {
        if (typeof window === "undefined") return null

        const stored = sessionStorage.getItem("user")
        return stored ? JSON.parse(stored) : null
    }, [])

    async function loadDashboard(overrides?: {
        site?: string
        user?: string
        start?: string
        end?: string
    }) {
        try {
            setLoading(true)

            const params = new URLSearchParams()

            const siteValue = overrides?.site ?? selectedSite
            const userValue = overrides?.user ?? selectedUser
            const startValue = overrides?.start ?? startDate
            const endValue = overrides?.end ?? endDate

            if (siteValue !== "all") params.set("site", siteValue)
            if (userValue !== "all") params.set("createdById", userValue)
            if (startValue) params.set("startDate", startValue)
            if (endValue) params.set("endDate", endValue)

            const res = await fetch(
                `/api/operation/master-dashboard?${params.toString()}`,
                {
                    cache: "no-store",
                }
            )

            const json = await res.json()

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load dashboard")
            }

            setData(json)
            setPage(1)
            setSearch("")
        } catch (error) {
            console.error(error)
            alert("Master dashboard data load nahi hua. Console check karo.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboard()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function applyFilters() {
        loadDashboard()
    }

    function resetFilters() {
        setSelectedSite("all")
        setSelectedUser("all")
        setStartDate("")
        setEndDate("")

        loadDashboard({
            site: "all",
            user: "all",
            start: "",
            end: "",
        })
    }

    function changeTab(tab: TabKey) {
        setActiveTab(tab)
        setSearch("")
        setPage(1)
    }

    const totals = data?.totals || {}

    const tabs: {
        key: TabKey
        label: string
        count: number
        description: string
    }[] = [
            {
                key: "overview",
                label: "Overview",
                count: totals.totalSubmissions || 0,
                description: "Summary, charts and important counts",
            },
            {
                key: "dailySiteReports",
                label: "Daily Site Report",
                count: totals.dailySiteReports || 0,
                description: "Billing, manpower, payment, salary, client and site status",
            },
            {
                key: "travelVisitPlans",
                label: "Travel Visit Plan",
                count: totals.travelVisitPlans || 0,
                description: "Person travelling, site to visit, purpose and follow-up",
            },
            {
                key: "costLeakReports",
                label: "Cost Leak Report",
                count: totals.costLeakReports || 0,
                description: "Leakage type, monthly impact, root cause and action",
            },
            {
                key: "costSavingReports",
                label: "Cost Saving Report",
                count: totals.costSavingReports || 0,
                description: "Saving type, monthly impact, owner and deadline",
            },
            {
                key: "amitojCommandTargets",
                label: "Amitoj Command Target",
                count: totals.amitojCommandTargets || 0,
                description: "Target area, target value, actual, gap and next action",
            },
            {
                key: "amitojSiteControls",
                label: "Amitoj Site Control",
                count: totals.amitojSiteControls || 0,
                description: "Billing status, site status, client control and political risk",
            },
            {
                key: "amitojTravelVisitPlans",
                label: "Amitoj Travel Visit Plan",
                count: totals.amitojTravelVisitPlans || 0,
                description: "Amitoj travel outcome, pending work and follow-up",
            },
        ]

    const dailyColumns: Column[] = [
        { key: "date", label: "Date", render: (r) => formatDate(r.date) },
        { key: "siteName", label: "Site Name" },
        { key: "projectHead", label: "Project Head" },
        { key: "manpowerAuthorized", label: "Manpower Authorized" },
        { key: "deployed", label: "Deployed" },
        { key: "gap", label: "Gap" },
        {
            key: "billAmountAuthorised",
            label: "Bill Amount Authorised",
            render: (r) => `₹ ${formatMoney(r.billAmountAuthorised)}`,
        },
        {
            key: "billAmountClaimed",
            label: "Bill Amount Claimed",
            render: (r) => `₹ ${formatMoney(r.billAmountClaimed)}`,
        },
        {
            key: "paymentStatus",
            label: "Payment Status",
            render: (r) => <StatusPill value={r.paymentStatus} />,
        },
        {
            key: "salaryRelatedIssue",
            label: "Salary Related Issue",
            render: (r) => <StatusPill value={r.salaryRelatedIssue} />,
        },
        {
            key: "operationalRisks",
            label: "Operational Risks",
            render: (r) => <StatusPill value={r.operationalRisks} />,
        },
        {
            key: "clientStatus",
            label: "Client Status",
            render: (r) => <StatusPill value={r.clientStatus} />,
        },
        {
            key: "siteStatus",
            label: "Site Status",
            render: (r) => <StatusPill value={r.siteStatus} />,
        },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const travelColumns: Column[] = [
        {
            key: "travelDate",
            label: "Travel Date",
            render: (r) => formatDate(r.travelDate),
        },
        { key: "personTravelling", label: "Person Travelling" },
        { key: "siteToVisit", label: "Site To Visit" },
        { key: "purpose", label: "Purpose" },
        { key: "problemToAddress", label: "Problem To Address" },
        { key: "expectedOutcome", label: "Expected Outcome" },
        {
            key: "estimatedCost",
            label: "Estimated Cost",
            render: (r) => `₹ ${formatMoney(r.estimatedCost)}`,
        },
        {
            key: "issueResolved",
            label: "Issue Resolved",
            render: (r) => <StatusPill value={r.issueResolved ? "Resolved" : "Pending"} />,
        },
        {
            key: "followUpRequired",
            label: "Follow-up Required",
            render: (r) => <StatusPill value={r.followUpRequired ? "Yes" : "No"} />,
        },
        { key: "stillPending", label: "Still Pending" },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const costLeakColumns: Column[] = [
        { key: "site", label: "Site" },
        { key: "leakageType", label: "Leakage Type" },
        { key: "description", label: "Description" },
        {
            key: "monthlyImpact",
            label: "Monthly Impact",
            render: (r) => `₹ ${formatMoney(r.monthlyImpact)}`,
        },
        { key: "rootCause", label: "Root Cause" },
        { key: "correctiveAction", label: "Corrective Action" },
        { key: "owner", label: "Owner" },
        { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
        {
            key: "status",
            label: "Status",
            render: (r) => <StatusPill value={r.status} />,
        },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const costSavingColumns: Column[] = [
        { key: "site", label: "Site" },
        { key: "reductionSavingType", label: "Reduction / Saving Type" },
        { key: "description", label: "Description" },
        {
            key: "monthlyImpact",
            label: "Monthly Impact",
            render: (r) => `₹ ${formatMoney(r.monthlyImpact)}`,
        },
        { key: "owner", label: "Owner" },
        { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
        {
            key: "status",
            label: "Status",
            render: (r) => <StatusPill value={r.status} />,
        },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const commandTargetColumns: Column[] = [
        { key: "targetArea", label: "Target Area" },
        { key: "targetValue", label: "Target Value" },
        { key: "actual", label: "Actual" },
        { key: "gap", label: "Gap" },
        {
            key: "status",
            label: "Status",
            render: (r) => <StatusPill value={r.status} />,
        },
        { key: "mdContextReason", label: "MD Context / Reason" },
        { key: "nextAction", label: "Next Action" },
        { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
        { key: "supportNeeded", label: "Support Needed" },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const siteControlColumns: Column[] = [
        { key: "site", label: "Site" },
        { key: "coordinator", label: "Coordinator" },
        {
            key: "authorisedAmount",
            label: "Authorised Amount",
            render: (r) => `₹ ${formatMoney(r.authorisedAmount)}`,
        },
        {
            key: "underBillingAmount",
            label: "Under Billing Amount",
            render: (r) => `₹ ${formatMoney(r.underBillingAmount)}`,
        },
        {
            key: "commitmentDate",
            label: "Commitment Date",
            render: (r) => formatDate(r.commitmentDate),
        },
        {
            key: "billingStatus",
            label: "Billing Status",
            render: (r) => <StatusPill value={r.billingStatus} />,
        },
        {
            key: "siteStatus",
            label: "Site Status",
            render: (r) => <StatusPill value={r.siteStatus} />,
        },
        {
            key: "clientControl",
            label: "Client Control",
            render: (r) => <StatusPill value={r.clientControl} />,
        },
        {
            key: "politicalRisk",
            label: "Political Risk",
            render: (r) => <StatusPill value={r.politicalRisk} />,
        },
        {
            key: "coordinatorPerformance",
            label: "Coordinator Performance",
            render: (r) => <StatusPill value={r.coordinatorPerformance} />,
        },
        { key: "riskMdContext", label: "Risk MD Context" },
        { key: "lastAction", label: "Last Action" },
        { key: "nextAction", label: "Next Action" },
        { key: "owner", label: "Owner" },
        { key: "deadline", label: "Deadline", render: (r) => formatDate(r.deadline) },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    const amitojTravelColumns: Column[] = [
        {
            key: "travelDate",
            label: "Travel Date",
            render: (r) => formatDate(r.travelDate),
        },
        { key: "personTravelling", label: "Person Travelling" },
        { key: "siteToVisit", label: "Site To Visit" },
        { key: "purpose", label: "Purpose" },
        { key: "problemToAddress", label: "Problem To Address" },
        { key: "expectedOutcome", label: "Expected Outcome" },
        {
            key: "estimatedCost",
            label: "Estimated Cost",
            render: (r) => `₹ ${formatMoney(r.estimatedCost)}`,
        },
        { key: "visitOutcome", label: "Visit Outcome" },
        {
            key: "issueResolved",
            label: "Issue Resolved",
            render: (r) => <StatusPill value={r.issueResolved ? "Resolved" : "Pending"} />,
        },
        {
            key: "followUpRequired",
            label: "Follow-up Required",
            render: (r) => <StatusPill value={r.followUpRequired ? "Yes" : "No"} />,
        },
        { key: "whatWasResolved", label: "What Was Resolved" },
        { key: "stillPending", label: "Still Pending" },
        {
            key: "createdBy",
            label: "Submitted By",
            render: (r) => r.createdBy?.name || "-",
        },
    ]

    function renderTabTable() {
        if (!data) return null

        if (activeTab === "dailySiteReports") {
            return (
                <TableView
                    title="Daily Site Report"
                    sub="Count means total Daily Site Report rows submitted after selected filters."
                    rows={data.records.dailySiteReports || []}
                    columns={dailyColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "travelVisitPlans") {
            return (
                <TableView
                    title="Travel Visit Plan"
                    sub="Count means total Travel Visit Plan rows submitted after selected filters."
                    rows={data.records.travelVisitPlans || []}
                    columns={travelColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "costLeakReports") {
            return (
                <TableView
                    title="Cost Leak Report"
                    sub="Count means total Cost Leak Report rows. Monthly Impact is used in Cost Leakage."
                    rows={data.records.costLeakReports || []}
                    columns={costLeakColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "costSavingReports") {
            return (
                <TableView
                    title="Cost Saving Report"
                    sub="Count means total Cost Saving Report rows. Monthly Impact is used in Cost Saving."
                    rows={data.records.costSavingReports || []}
                    columns={costSavingColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "amitojCommandTargets") {
            return (
                <TableView
                    title="Amitoj Command Target"
                    sub="Count means total Amitoj Command Target rows. Open status is included in Open Actions."
                    rows={data.records.amitojCommandTargets || []}
                    columns={commandTargetColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "amitojSiteControls") {
            return (
                <TableView
                    title="Amitoj Site Control"
                    sub="Count means total Amitoj Site Control rows. Under Billing Amount is used in Net Impact."
                    rows={data.records.amitojSiteControls || []}
                    columns={siteControlColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        if (activeTab === "amitojTravelVisitPlans") {
            return (
                <TableView
                    title="Amitoj Travel Visit Plan"
                    sub="Count means total Amitoj Travel Visit Plan rows."
                    rows={data.records.amitojTravelVisitPlans || []}
                    columns={amitojTravelColumns}
                    search={search}
                    page={page}
                    onPageChange={setPage}
                />
            )
        }

        return null
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <div className="ml-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-100">
                            <BarChart3 size={22} />
                        </div>

                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-950">
                                Operation Master Dashboard
                            </h1>
                            <p className="text-xs font-semibold text-slate-500">
                                Tab-wise view of all operation trackers with clear counts,
                                charts, search and pagination
                            </p>
                        </div>
                    </div>

                    <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:block">
                        Logged in as{" "}
                        <span className="font-black text-slate-800">
                            {user?.name || "-"}
                        </span>
                    </div>
                </div>
            </header>

            <main className="space-y-6 p-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <select
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Sites</option>
                            {data?.filters?.sites?.map((site) => (
                                <option key={site} value={site}>
                                    {site}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Users</option>
                            {data?.filters?.users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} - {user.role}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50"
                            >
                                <RefreshCw size={16} />
                                Reset
                            </button>

                            <button
                                onClick={applyFilters}
                                className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white hover:bg-slate-800"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center text-slate-500 shadow-sm">
                        Loading master dashboard...
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Total Submissions"
                                value={totals.totalSubmissions || 0}
                                sub="All tracker rows after selected filters"
                                icon={ClipboardList}
                                tone="indigo"
                            />

                            <StatCard
                                title="Net Impact"
                                value={`₹ ${formatMoney(totals.netImpact)}`}
                                sub="Cost Saving - Cost Leakage - Under Billing"
                                icon={IndianRupee}
                                tone={Number(totals.netImpact || 0) >= 0 ? "emerald" : "rose"}
                            />

                            <StatCard
                                title="Under Billing Amount"
                                value={`₹ ${formatMoney(totals.totalUnderBilling)}`}
                                sub="From Amitoj Site Control"
                                icon={AlertTriangle}
                                tone="rose"
                            />

                            <StatCard
                                title="Open Actions"
                                value={totals.openActions || 0}
                                sub="Open leak, saving, target and travel follow-up"
                                icon={ShieldAlert}
                                tone="orange"
                            />
                        </section>

                        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Daily Site Report"
                                value={totals.dailySiteReports || 0}
                                sub={`${totals.paymentPending || 0} payment pending`}
                                icon={Building2}
                                tone="sky"
                            />

                            <StatCard
                                title="Travel Visit Plan"
                                value={
                                    (totals.travelVisitPlans || 0) +
                                    (totals.amitojTravelVisitPlans || 0)
                                }
                                sub={`₹ ${formatMoney(totals.totalTravelCost)} estimated cost`}
                                icon={Plane}
                                tone="orange"
                            />

                            <StatCard
                                title="Cost Leak Report"
                                value={`₹ ${formatMoney(totals.totalLeakage)}`}
                                sub={`${totals.openCostLeakReports || 0} open cost leak reports`}
                                icon={TrendingDown}
                                tone="rose"
                            />

                            <StatCard
                                title="Cost Saving Report"
                                value={`₹ ${formatMoney(totals.totalSaving)}`}
                                sub={`${totals.openCostSavingReports || 0} open cost saving reports`}
                                icon={TrendingUp}
                                tone="emerald"
                            />
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => changeTab(tab.key)}
                                        className={`min-w-max rounded-2xl px-4 py-3 text-left transition ${activeTab === tab.key
                                                ? "bg-slate-950 text-white shadow-lg"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black">{tab.label}</span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-black ${activeTab === tab.key
                                                        ? "bg-white/20 text-white"
                                                        : "bg-white text-slate-700"
                                                    }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </div>

                                        <p
                                            className={`mt-1 max-w-[260px] truncate text-xs font-semibold ${activeTab === tab.key ? "text-slate-300" : "text-slate-400"
                                                }`}
                                        >
                                            {tab.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {activeTab !== "overview" ? (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value)
                                            setPage(1)
                                        }}
                                        placeholder="Search inside selected tab..."
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white"
                                    />
                                </div>
                            </section>
                        ) : null}

                        {activeTab === "overview" ? (
                            <>
                                <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
                                    {data?.countExplanation?.map((item, index) => (
                                        <div
                                            key={`${item.label}-${index}`}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-black text-slate-500">
                                                        {item.label}
                                                    </p>

                                                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                                                        {item.label.toLowerCase().includes("impact")
                                                            ? `₹ ${formatMoney(item.value)}`
                                                            : item.value}
                                                    </h3>

                                                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                                                        {item.meaning}
                                                    </p>
                                                </div>

                                                <Activity size={20} className="text-slate-400" />
                                            </div>
                                        </div>
                                    ))}
                                </section>

                                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                    <ChartCard
                                        title="Monthly Financial Impact"
                                        sub="Uses Monthly Impact from Cost Leak Report and Cost Saving Report"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data?.charts?.monthWise || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: "#475569", fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar
                                                    dataKey="leakageAmount"
                                                    name="Cost Leakage"
                                                    fill={COLORS.rose}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="savingAmount"
                                                    name="Cost Saving"
                                                    fill={COLORS.emerald}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="underBillingAmount"
                                                    name="Under Billing"
                                                    fill={COLORS.orange}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="travelCost"
                                                    name="Travel Cost"
                                                    fill={COLORS.indigo}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    <ChartCard
                                        title="User-wise Submissions"
                                        sub="Shows how many rows each user submitted in every tracker"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data?.charts?.userWise || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fill: "#475569", fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar
                                                    dataKey="dailySiteReports"
                                                    name="Daily Site Report"
                                                    fill={COLORS.indigo}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="travelVisitPlans"
                                                    name="Travel Visit Plan"
                                                    fill={COLORS.orange}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="costLeakReports"
                                                    name="Cost Leak Report"
                                                    fill={COLORS.rose}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="costSavingReports"
                                                    name="Cost Saving Report"
                                                    fill={COLORS.emerald}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="amitojSiteControls"
                                                    name="Amitoj Site Control"
                                                    fill={COLORS.violet}
                                                    radius={[8, 8, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </section>

                                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                    <ChartCard
                                        title="Important Status Summary"
                                        sub="Risk and issue count from Daily Site Report and Amitoj Site Control"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data?.charts?.statusSummary || []}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    outerRadius={110}
                                                    label
                                                >
                                                    {(data?.charts?.statusSummary || []).map(
                                                        (_entry: any, index: number) => (
                                                            <Cell
                                                                key={`status-${index}`}
                                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    <ChartCard
                                        title="Submission Trend"
                                        sub="Monthly count of rows submitted in each tracker"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data?.charts?.monthWise || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: "#475569", fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="dailySiteReports"
                                                    name="Daily Site Report"
                                                    stroke={COLORS.indigo}
                                                    strokeWidth={3}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="travelVisitPlans"
                                                    name="Travel Visit Plan"
                                                    stroke={COLORS.orange}
                                                    strokeWidth={3}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="costLeakReports"
                                                    name="Cost Leak Report"
                                                    stroke={COLORS.rose}
                                                    strokeWidth={3}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="costSavingReports"
                                                    name="Cost Saving Report"
                                                    stroke={COLORS.emerald}
                                                    strokeWidth={3}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </section>

                                <TableView
                                    title="High Risk Sites"
                                    sub="Risk score is calculated from open issues, payment pending, operational risks, billing status, site status, client control and political risk."
                                    rows={data?.highRiskSites || []}
                                    search=""
                                    page={1}
                                    onPageChange={() => { }}
                                    columns={[
                                        { key: "site", label: "Site" },
                                        {
                                            key: "riskScore",
                                            label: "Risk Score",
                                            render: (r) => <StatusPill value={r.riskScore} />,
                                        },
                                        {
                                            key: "leakageAmount",
                                            label: "Cost Leakage",
                                            render: (r) => `₹ ${formatMoney(r.leakageAmount)}`,
                                        },
                                        {
                                            key: "savingAmount",
                                            label: "Cost Saving",
                                            render: (r) => `₹ ${formatMoney(r.savingAmount)}`,
                                        },
                                        {
                                            key: "underBillingAmount",
                                            label: "Under Billing Amount",
                                            render: (r) => `₹ ${formatMoney(r.underBillingAmount)}`,
                                        },
                                        {
                                            key: "travelCost",
                                            label: "Travel Cost",
                                            render: (r) => `₹ ${formatMoney(r.travelCost)}`,
                                        },
                                        { key: "dailySiteReports", label: "Daily Site Report" },
                                        { key: "costLeakReports", label: "Cost Leak Report" },
                                        { key: "costSavingReports", label: "Cost Saving Report" },
                                    ]}
                                />

                                <TableView
                                    title="Latest Activity"
                                    sub="Latest submitted rows from all trackers combined."
                                    rows={data?.latestActivity || []}
                                    search=""
                                    page={1}
                                    onPageChange={() => { }}
                                    columns={[
                                        {
                                            key: "createdAt",
                                            label: "Date / Time",
                                            render: (r) => formatDateTime(r.createdAt),
                                        },
                                        { key: "tracker", label: "Tracker" },
                                        { key: "siteOrArea", label: "Site / Area" },
                                        { key: "title", label: "Title" },
                                        {
                                            key: "amount",
                                            label: "Amount",
                                            render: (r) => (r.amount ? `₹ ${formatMoney(r.amount)}` : "-"),
                                        },
                                        {
                                            key: "status",
                                            label: "Status",
                                            render: (r) => <StatusPill value={r.status} />,
                                        },
                                        { key: "submittedBy", label: "Submitted By" },
                                    ]}
                                />
                            </>
                        ) : (
                            renderTabTable()
                        )}
                    </>
                )}
            </main>
        </div>
    )
}