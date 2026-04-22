"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    Bell,
    Building2,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    IndianRupee,
    Search,
    Users,
    Wallet,
    TrendingUp,
    ArrowRight,
    ClipboardList,
} from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

type StageKey = "hr1" | "account1" | "level2" | "completed"
type StatusKey = "pending" | "completed" | "overdue"

type QuestionAnswer = {
    question: string
    answer: string
    updatedBy?: string
    updatedAt?: string
}

type TimelineItem = {
    title: string
    actor: string
    at: string
    note?: string
}

type FinanceRecord = {
    id: string
    siteName: string
    incharge: string
    stage: StageKey
    status: StatusKey
    billing: number
    invoice: number
    salary: number
    updatedAt: string
    agingDays: number
    hr1Answers?: QuestionAnswer[]
    a1Answers?: QuestionAnswer[]
    hr2Answers?: QuestionAnswer[]
    timeline?: TimelineItem[]
}

type DashboardResponse = {
    summary: {
        totalSites: number
        completed: number
        pendingHr1: number
        pendingA1: number
        pendingHr2: number
        overdue: number
        totalBilling: number
        totalInvoice: number
        totalSalary: number
    }
    records: FinanceRecord[]
}

const STAGE_LABEL: Record<StageKey, string> = {
    hr1: "HR1",
    account1: "A1",
    level2: "HR2",
    completed: "Completed",
}

const STAGE_LONG_LABEL: Record<StageKey, string> = {
    hr1: "HR1 – Entry",
    account1: "A1 – Billing",
    level2: "HR2 – Salary",
    completed: "Completed",
}

const STAGE_COLORS: Record<StageKey, string> = {
    hr1: "#7c4ed8",
    account1: "#2f7fd7",
    level2: "#f4a000",
    completed: "#31b26b",
}



function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ")
}

function formatCompactLakhs(value: number | null | undefined) {
    if (!value) return "₹0"
    return `₹${value.toFixed(1)}L`
}

function formatINR(value: number) {
    if (!value) return "—"
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value)
}

function formatDateTime(date: string) {
    if (!date) return "—"

    const d = new Date(date)

    // ✅ IMPORTANT FIX
    if (isNaN(d.getTime())) return date // return original value if not valid date

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(d)
}

function formatDateOnly(date: string) {
    if (!date) return "—"

    const d = new Date(date)

    if (isNaN(d.getTime())) return date

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d)
}

function getStatusBadge(status: StatusKey) {
    if (status === "completed") {
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>
    }
    if (status === "overdue") {
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

function getStageBadge(stage: StageKey) {
    const classes: Record<StageKey, string> = {
        hr1: "bg-violet-100 text-violet-700 hover:bg-violet-100",
        account1: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        level2: "bg-amber-100 text-amber-700 hover:bg-amber-100",
        completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    }
    return <Badge className={classes[stage]}>{STAGE_LABEL[stage]}</Badge>
}

function getPaymentStatus(row: FinanceRecord) {
    const raw = row.a1Answers?.find(
        (q) => q.question.toLowerCase().includes("invoice payment status")
    )?.answer

    const payment = raw?.toLowerCase().trim()

    if (!payment || payment === "—") return "unknown"
    if (payment.includes("received") || payment.includes("paid")) return "received"
    if (payment.includes("pending")) return "pending"
    if (payment.includes("partial")) return "partial"

    return "unknown"
}

function MetricCard({
    title,
    value,
    icon,
    iconWrap,
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    iconWrap: string
}) {
    return (
        <Card className="rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between">

                    {/* LEFT TEXT */}
                    <div>
                        <div className="text-xs text-slate-500">{title}</div>
                        <div className="text-xl font-bold text-slate-900">
                            {value}
                        </div>
                    </div>

                    {/* RIGHT ICON */}
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${iconWrap}`}>
                        {icon}
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}

function SectionTitle({ title }: { title: string }) {
    return <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
}

function QaBlock({ title, data }: { title: string; data?: QuestionAnswer[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 w-full h-full">
            <div className="mb-4 text-lg font-semibold text-slate-900">{title}</div>
            {!data || data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    No answers available for this stage.
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-white bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-slate-500">{item.question}</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{item.question.toLowerCase().includes("date")
                                ? formatDateOnly(item.answer)
                                : item.answer || "—"}</div>
                            {(item.updatedBy || item.updatedAt) && (
                                <div className="mt-2 text-xs text-slate-500">
                                    {item.updatedBy ? `Updated by ${item.updatedBy}` : ""}
                                    {item.updatedBy && item.updatedAt ? " • " : ""}
                                    {item.updatedAt || ""}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function FinanceAdminDashboardPage() {
    const [data, setData] = useState<DashboardResponse>({
        summary: {
            totalSites: 0,
            completed: 0,
            pendingHr1: 0,
            pendingA1: 0,
            pendingHr2: 0,
            overdue: 0,
            totalBilling: 0,
            totalInvoice: 0,
            totalSalary: 0,
        },
        records: [],
    })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [stageFilter, setStageFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    useEffect(() => {
        let mounted = true

        async function loadDashboard() {
            try {
                const res = await fetch("/api/hr/finance/dashboard", { cache: "no-store" })
                const json = await res.json()

                if (!res.ok) {
                    throw new Error(json?.message || "Failed to load dashboard")
                }

                if (mounted) {
                    setData(json)
                }
            } catch (error) {
                console.error("Dashboard load error:", error)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadDashboard()
        return () => {
            mounted = false
        }
    }, [])

    const filteredRecords = useMemo(() => {
        return data.records.filter((row) => {
            const q = search.trim().toLowerCase()
            const matchesSearch =
                !q || row.siteName.toLowerCase().includes(q) || row.incharge.toLowerCase().includes(q)
            const matchesStage = stageFilter === "all" || row.stage === stageFilter
            const matchesStatus =
                statusFilter === "all" || getPaymentStatus(row) === statusFilter
            return matchesSearch && matchesStage && matchesStatus
        })
    }, [data.records, search, stageFilter, statusFilter])

    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredRecords.slice(start, start + pageSize)
    }, [filteredRecords, currentPage])

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))

    useEffect(() => {
        setCurrentPage(1)
    }, [search, stageFilter, statusFilter])

    const stageCounts = useMemo(() => {
        return [
            { name: "HR1", value: data.summary.pendingHr1, color: STAGE_COLORS.hr1 },
            { name: "A1", value: data.summary.pendingA1, color: STAGE_COLORS.account1 },
            { name: "HR2", value: data.summary.pendingHr2, color: STAGE_COLORS.level2 },
            { name: "Completed", value: data.summary.completed, color: STAGE_COLORS.completed },
        ]
    }, [data.summary])

    const financialChartData = useMemo(
        () => [
            { name: "Billing", value: data.summary.totalBilling },
            { name: "Invoice", value: data.summary.totalInvoice },
            { name: "Salary", value: data.summary.totalSalary },
        ],
        [data.summary]
    )

    const avgDelayData = useMemo(() => {
        const source = data.records.filter((r) => r.stage !== "completed")
        const avg = (stage: StageKey) => {
            const items = source.filter((r) => r.stage === stage)
            if (!items.length) return 0
            return Number((items.reduce((sum, row) => sum + row.agingDays, 0) / items.length).toFixed(1))
        }

        return [
            { name: "HR1", value: avg("hr1"), fill: STAGE_COLORS.hr1 },
            { name: "A1", value: avg("account1"), fill: STAGE_COLORS.account1 },
            { name: "HR2", value: avg("level2"), fill: STAGE_COLORS.level2 },
        ]
    }, [data.records])

    const highestBillingRecord = useMemo(() => {
        return [...data.records].sort((a, b) => b.billing - a.billing)[0]
    }, [data.records])

    const paymentCompletionRate = useMemo(() => {
        if (!data.summary.totalSites) return 0
        return Math.round((data.summary.completed / data.summary.totalSites) * 100)
    }, [data.summary])

    const pipelineCards = [
        {
            label: STAGE_LONG_LABEL.hr1,
            key: "hr1",
            count: data.summary.pendingHr1,
            pct: data.summary.totalSites ? Math.round((data.summary.pendingHr1 / data.summary.totalSites) * 100) : 0,
            color: "from-violet-600 to-violet-500",
            line: "bg-violet-300",
            border: "border-violet-400",
        },
        {
            label: STAGE_LONG_LABEL.account1,
            key: "account1",
            count: data.summary.pendingA1,
            pct: data.summary.totalSites ? Math.round((data.summary.pendingA1 / data.summary.totalSites) * 100) : 0,
            color: "from-blue-600 to-blue-500",
            line: "bg-blue-300",
            border: "border-blue-400",
        },
        {
            label: STAGE_LONG_LABEL.level2,
            key: "level2",
            count: data.summary.pendingHr2,
            pct: data.summary.totalSites ? Math.round((data.summary.pendingHr2 / data.summary.totalSites) * 100) : 0,
            color: "from-amber-500 to-orange-400",
            line: "bg-amber-200",
            border: "border-amber-300",
        },
        {
            label: STAGE_LONG_LABEL.completed,
            key: "completed",
            count: data.summary.completed,
            pct: data.summary.totalSites ? Math.round((data.summary.completed / data.summary.totalSites) * 100) : 0,
            color: "from-emerald-600 to-emerald-500",
            line: "bg-emerald-200",
            border: "border-emerald-300",
        },
    ] as const

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="w-full px-4 md:px-6 lg:px-8">
                <Card className="overflow-hidden rounded-[28px] border border-slate-200 shadow-sm">
                    <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-sm">
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">FM Admin Dashboard</h1>
                                    <p className="text-xl text-slate-500">Finance Workflow Tracker</p>
                                </div>
                            </div>

                            {/* <div className="flex items-center gap-3 self-start md:self-auto">
                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 bg-white relative">
                                    <Bell className="h-5 w-5 text-slate-600" />
                                    <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                                        11
                                    </span>
                                </Button>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
                                    A
                                </div>
                            </div> */}
                        </div>
                    </div>

                    <div className="space-y-6 bg-slate-100 p-6 md:p-8">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <MetricCard title="Total Sites" value={data.summary.totalSites} icon={<ClipboardList className="h-6 w-6 text-blue-500" />} iconWrap="bg-blue-50" />
                            <MetricCard title="Completed" value={data.summary.completed} icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />} iconWrap="bg-emerald-50" />
                            <MetricCard title="Pending at A1" value={data.summary.pendingA1} icon={<FileText className="h-6 w-6 text-amber-500" />} iconWrap="bg-amber-50" />
                            <MetricCard title="Pending at HR2" value={data.summary.pendingHr2} icon={<Clock3 className="h-6 w-6 text-amber-500" />} iconWrap="bg-amber-50" />
                            {/* <MetricCard title="Total Billing" value={formatCompactLakhs(data.summary.totalBilling)} icon={<IndianRupee className="h-7 w-7 text-blue-500" />} iconWrap="bg-blue-50" />
                            <MetricCard title="Total Invoice" value={formatCompactLakhs(data.summary.totalInvoice)} icon={<Wallet className="h-7 w-7 text-blue-500" />} iconWrap="bg-blue-50" />
                            <MetricCard title="Salary Disbursed" value={formatCompactLakhs(data.summary.totalSalary)} icon={<CreditCard className="h-7 w-7 text-emerald-500" />} iconWrap="bg-emerald-50" /> */}
                        </div>

                        {/* <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                            <CardContent className="p-6 md:p-8">
                                <SectionTitle title="Workflow Pipeline" />
                                <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-center">
                                    {pipelineCards.map((item, index) => (
                                        <React.Fragment key={item.key}>
                                            <div className={cn("rounded-[28px] border-2 bg-gradient-to-br p-6 text-white shadow-sm", item.color, item.border)}>
                                                <div className="text-2xl font-semibold">{item.label}</div>
                                                <div className="mt-4 text-6xl font-bold leading-none">{item.count}</div>
                                                <div className="mt-4 h-2 rounded-full bg-white/25">
                                                    <div className={cn("h-2 rounded-full", item.line)} style={{ width: `${item.pct}%` }} />
                                                </div>
                                                <div className="mt-3 text-xl text-white/90">{item.pct}% of total</div>
                                            </div>
                                            {index < pipelineCards.length - 1 && (
                                                <div className="hidden items-center justify-center xl:flex">
                                                    <ArrowRight className="h-10 w-10 text-slate-500" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </CardContent>
                        </Card> */}

                        <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                                    <SectionTitle title="Site Records" />
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search site or incharge..."
                                                className="h-14 w-full rounded-2xl border-slate-200 pl-12 text-lg md:w-[320px]"
                                            />
                                        </div>

                                        {/* <Select value={stageFilter} onValueChange={setStageFilter}>
                                            <SelectTrigger className="h-14 w-[170px] rounded-2xl border-slate-200 text-lg">
                                                <SelectValue placeholder="All Stages" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Stages</SelectItem>
                                                <SelectItem value="hr1">HR1</SelectItem>
                                                <SelectItem value="account1">A1</SelectItem>
                                                <SelectItem value="level2">HR2</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select> */}

                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-14 w-[190px] rounded-2xl border-slate-200 text-lg">
                                                <SelectValue placeholder="All Payment Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Payment Status</SelectItem>
                                                <SelectItem value="received">Payment Received</SelectItem>
                                                <SelectItem value="pending">Payment Pending</SelectItem>

                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                <TableHead className="h-16 px-6 text-base font-semibold text-slate-600">Site Name</TableHead>
                                                <TableHead className="text-base font-semibold text-slate-600">Incharge</TableHead>
                                                <TableHead className="w-[220px] text-base font-semibold text-slate-600">
                                                    <div className="leading-tight">
                                                        <div>Monthly Billing</div>
                                                        <div className="leading-tight">
                                                            (as per Contract / avg yearly)
                                                        </div>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="w-[200px] text-base font-semibold text-slate-600">
                                                    <div className="leading-tight">
                                                        <div>Last Invoice Raise</div>
                                                        <div className="leading-tight">(Amount)</div>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="w-[200px] text-base font-semibold text-slate-600">
                                                    <div className="leading-tight">
                                                        <div>Last Salary Disbursement</div>
                                                        <div className="leading-tight">(INR Amount)</div>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="w-[200px] text-base font-semibold text-slate-600">
                                                    <div className="leading-tight">
                                                        <div>Invoice Payment</div>
                                                        <div className="leading-tight">(Status)</div>
                                                    </div>
                                                </TableHead>

                                                <TableHead className="text-right text-base font-semibold text-slate-600">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRecords.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center text-lg text-slate-500">
                                                        {loading ? "Loading records..." : "No finance records found."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedRecords.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        className="h-16 cursor-pointer hover:bg-slate-50"
                                                        onClick={() => setSelectedRecord(row)}
                                                    >
                                                        <TableCell className="px-6 text-sm font-semibold text-slate-900">
                                                            {row.siteName}
                                                        </TableCell>

                                                        <TableCell className="text-sm text-slate-600">
                                                            {row.incharge}
                                                        </TableCell>

                                                        <TableCell className="text-sm text-slate-800">
                                                            {formatINR(row.billing)}
                                                        </TableCell>

                                                        <TableCell className="text-sm text-slate-800">
                                                            {formatINR(row.invoice)}
                                                        </TableCell>

                                                        <TableCell className="text-sm text-slate-800">
                                                            {formatINR(row.salary)}
                                                        </TableCell>

                                                        {/* ✅ Payment Status */}

                                                        <TableCell>
                                                            {getPaymentStatus(row) === "received" ? (
                                                                <span className="text-emerald-600 font-semibold">Payment Received</span>
                                                            ) : getPaymentStatus(row) === "pending" ? (
                                                                <span className="text-amber-600 font-semibold">Payment Pending</span>
                                                            ) : (
                                                                <span className="text-slate-400 font-semibold">—</span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="outline"
                                                                className="rounded-xl border-slate-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedRecord(row)
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                                    <div className="text-lg text-slate-500">
                                        Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                                            ‹
                                        </Button>
                                        {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                                            const page = i + 1
                                            const active = page === currentPage
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={active ? "default" : "outline"}
                                                    className={cn(
                                                        "h-12 w-12 rounded-2xl p-0",
                                                        active ? "bg-blue-600 text-white hover:bg-blue-600" : "border-slate-200"
                                                    )}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </Button>
                                            )
                                        })}
                                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 p-0" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                                            ›
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                                <CardContent className="p-6 md:p-8">
                                    <SectionTitle title="Stage Distribution" />
                                    <div className="mt-6 h-[360px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stageCounts}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={70}
                                                    outerRadius={110}
                                                    paddingAngle={3}
                                                    label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                                                >
                                                    {stageCounts.map((entry) => (
                                                        <Cell key={entry.name} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                                <CardContent className="p-6 md:p-8">
                                    <SectionTitle title="Financial Overview (₹ Lakhs)" />
                                    <div className="mt-6 h-[360px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={financialChartData}>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 15 }} />
                                                <YAxis tick={{ fontSize: 15 }} />
                                                <Tooltip formatter={(value: any) => `${value} Lakhs`} />
                                                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#3366d6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div> */}

                        {/* <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                            <CardContent className="p-6 md:p-8">
                                <SectionTitle title="Avg Delay by Stage (Days)" />
                                <div className="mt-6 h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={avgDelayData}>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 15 }} />
                                            <YAxis tick={{ fontSize: 15 }} />
                                            <Tooltip formatter={(value: any) => [`${value} days`, "Delay"]} />
                                            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                                {avgDelayData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card> */}

                        {/* <Card className="rounded-[28px] border border-slate-200 shadow-sm">
                            <CardContent className="p-6 md:p-8">
                                <SectionTitle title="Alerts & Insights" />
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="flex items-center gap-4 rounded-3xl bg-amber-50 px-5 py-5 text-xl font-medium text-slate-800">
                                        <Clock3 className="h-7 w-7 text-amber-500" />
                                        <span>{data.summary.pendingA1} records stuck in A1 stage</span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-3xl bg-red-50 px-5 py-5 text-xl font-medium text-slate-800">
                                        <AlertTriangle className="h-7 w-7 text-red-500" />
                                        <span>{data.summary.overdue} sites overdue {`>`} 7 days</span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-3xl bg-slate-100 px-5 py-5 text-xl font-medium text-slate-800">
                                        <TrendingUp className="h-7 w-7 text-blue-500" />
                                        <span>Highest billing: {highestBillingRecord?.siteName || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-3xl bg-rose-50 px-5 py-5 text-xl font-medium text-slate-800">
                                        <ArrowRight className="h-7 w-7 rotate-45 text-red-500" />
                                        <span>Payment completion rate: {paymentCompletionRate}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}
                    </div>
                </Card>
            </div>

            <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[92vh] p-0 rounded-3xl overflow-hidden">

                    {selectedRecord && (
                        <>
                            <DialogHeader className="border-b border-slate-200 px-6 py-5 md:px-8">
                                <DialogTitle className="text-3xl font-bold text-slate-900">{selectedRecord.siteName}</DialogTitle>
                                {/* <DialogDescription className="text-base text-slate-500">
                                    {selectedRecord.incharge} • {STAGE_LONG_LABEL[selectedRecord.stage]} • Last updated {formatDateTime(selectedRecord.updatedAt)}
                                </DialogDescription> */}
                            </DialogHeader>

                            <div className="h-full overflow-y-auto">
                                <div className="space-y-6 p-6 md:p-8 w-full">
                                    {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-4"> */}
                                    {/* <Card className="rounded-3xl border border-slate-200 shadow-none">
                                            <CardContent className="p-5">
                                                <div className="text-sm text-slate-500">Billing</div>
                                                <div className="mt-2 text-3xl font-bold text-slate-900">{formatINR(selectedRecord.billing)}</div>
                                            </CardContent>
                                        </Card> */}
                                    {/* <Card className="rounded-3xl border border-slate-200 shadow-none">
                                            <CardContent className="p-5">
                                                <div className="text-sm text-slate-500">Invoice</div>
                                                <div className="mt-2 text-3xl font-bold text-slate-900">{formatINR(selectedRecord.invoice)}</div>
                                            </CardContent>
                                        </Card> */}
                                    {/* <Card className="rounded-3xl border border-slate-200 shadow-none">
                                            <CardContent className="p-5">
                                                <div className="text-sm text-slate-500">Salary</div>
                                                <div className="mt-2 text-3xl font-bold text-slate-900">{formatINR(selectedRecord.salary)}</div>
                                            </CardContent>
                                        </Card> */}
                                    {/* <Card className="rounded-3xl border border-slate-200 shadow-none">
                                            <CardContent className="p-5">
                                                <div className="text-sm text-slate-500">Aging</div>
                                                <div className="mt-2 text-3xl font-bold text-slate-900">{selectedRecord.agingDays} days</div>
                                            </CardContent>
                                        </Card> */}
                                    {/* //  </div> */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <QaBlock title="HR1 Questions & Answers" data={selectedRecord.hr1Answers} />
                                        <QaBlock title="A1 Questions & Answers" data={selectedRecord.a1Answers} />
                                        <QaBlock title="HR2 Questions & Answers" data={selectedRecord.hr2Answers} />

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 w-full h-full">
                                            <div className="mb-4 text-lg font-semibold text-slate-900">Workflow Timeline</div>
                                            {!selectedRecord.timeline || selectedRecord.timeline.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                                                    No timeline available.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {selectedRecord.timeline.map((item, idx) => (
                                                        <div key={idx} className="flex gap-4 rounded-xl border border-white bg-white p-4 shadow-sm">
                                                            <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />
                                                            <div>
                                                                <div className="text-base font-semibold text-slate-900">{item.title}</div>
                                                                <div className="mt-1 text-sm text-slate-500">
                                                                    {item.actor} • {formatDateTime(item.at)}
                                                                </div>
                                                                {item.note ? (
                                                                    <div className="mt-2 text-sm text-slate-700">{item.note}</div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
