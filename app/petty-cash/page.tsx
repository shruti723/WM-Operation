"use client"

import { useState } from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Wallet,
  Building2,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"

// ─── Data ────────────────────────────────────────────────────────────────────

type MonthEntry = {
  month: string
  date: string
  person: string
  fixedAmount: number
  paid: number
  statement: number
  auditStatus: "Completed" | "Pending"
  observation: "Raised" | "Not Raised" | "Pending"
  specialNote?: string
}

type SiteData = {
  name: string
  handler: string
  fixedMonthly: number
  entries: MonthEntry[]
}

const SITES: SiteData[] = [
  {
    name: "Crystal IT Park",
    handler: "Deepti Salukhe",
    fixedMonthly: 25000,
    entries: [
      { month: "Jan 2026", date: "2026-01-15", person: "Deepti Salukhe", fixedAmount: 25000, paid: 25000, statement: 23283, auditStatus: "Completed", observation: "Raised" },
      { month: "Feb 2026", date: "2026-02-14", person: "Deepti Salukhe", fixedAmount: 25000, paid: 15000, statement: 24996, auditStatus: "Completed", observation: "Not Raised" },
      { month: "Mar 2026", date: "2026-03-13", person: "Deepti Salukhe", fixedAmount: 25000, paid: 25000, statement: 14975, auditStatus: "Completed", observation: "Pending" },
    ],
  },
  {
    name: "MPSEDC Bhopal",
    handler: "Santosh Dangi",
    fixedMonthly: 15000,
    entries: [
      { month: "Jan 2026", date: "2026-01-18", person: "Santosh Dangi", fixedAmount: 15000, paid: 20000, statement: 13100, auditStatus: "Completed", observation: "Raised", specialNote: "Special Approval" },
      { month: "Feb 2026", date: "2026-02-17", person: "Santosh Dangi", fixedAmount: 15000, paid: 15000, statement: 20013, auditStatus: "Completed", observation: "Not Raised" },
      { month: "Mar 2026", date: "2026-03-16", person: "Santosh Dangi", fixedAmount: 15000, paid: 10000, statement: 14975, auditStatus: "Completed", observation: "Pending" },
    ],
  },
  {
    name: "ISBT Raipur",
    handler: "Shivam Lodhi",
    fixedMonthly: 20000,
    entries: [
      { month: "Jan 2026", date: "2026-01-20", person: "Shivam Lodhi", fixedAmount: 20000, paid: 20000, statement: 20000, auditStatus: "Completed", observation: "Raised" },
      { month: "Feb 2026", date: "2026-02-19", person: "Shivam Lodhi", fixedAmount: 20000, paid: 20000, statement: 19979, auditStatus: "Completed", observation: "Not Raised" },
      { month: "Mar 2026", date: "2026-03-18", person: "Shivam Lodhi", fixedAmount: 20000, paid: 20000, statement: 19289, auditStatus: "Completed", observation: "Pending" },
    ],
  },
]

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN")
}

function obsBadge(status: string) {
  if (status === "Raised")
    return "bg-red-50 text-red-700 ring-1 ring-red-200"
  if (status === "Not Raised")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
}

function auditBadge(status: string) {
  if (status === "Completed")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
}

// ─── Chart Tooltips ──────────────────────────────────────────────────────────

function LineTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-500 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-500 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.fill || p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  icon: Icon,
  color,
  sub,
  barValue,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  sub?: string
  barValue?: number
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {barValue !== undefined && (
        <div className="space-y-1">
          <Progress value={barValue} className="h-1.5" />
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
      )}
      {barValue === undefined && sub && (
        <p className="text-[11px] text-slate-400">{sub}</p>
      )}
    </div>
  )
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function Section({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PettyCashDashboard() {
  const [siteFilter, setSiteFilter] = useState("all")

  // Filtered sites
  const filteredSites =
    siteFilter === "all"
      ? SITES
      : SITES.filter((s) => s.name === siteFilter)

  // All entries flat
  const allEntries = filteredSites.flatMap((s) =>
    s.entries.map((e) => ({ ...e, site: s.name }))
  )

  // KPIs
  const totalDisbursed = allEntries.reduce((sum, e) => sum + e.paid, 0)
  const totalSites = SITES.length
  const completedAudits = allEntries.filter(
    (e) => e.auditStatus === "Completed"
  ).length
  const pendingAudits = allEntries.filter(
    (e) => e.auditStatus === "Pending"
  ).length
  const observationsRaised = allEntries.filter(
    (e) => e.observation === "Raised"
  ).length
  const obsRate =
    allEntries.length > 0
      ? Math.round((observationsRaised / allEntries.length) * 100)
      : 0

  // Line chart data: monthly trend per site
  const months = ["Jan 2026", "Feb 2026", "Mar 2026"]
  const lineData = months.map((m) => {
    const row: any = { month: m }
    SITES.forEach((s) => {
      const entry = s.entries.find((e) => e.month === m)
      row[s.name] = entry ? entry.paid : 0
    })
    return row
  })

  // Grouped bar data: Fixed vs Actual per site per month
  const barData = months.flatMap((m) =>
    filteredSites.map((s) => {
      const entry = s.entries.find((e) => e.month === m)
      return {
        label: `${s.name.split(" ")[0]} ${m.split(" ")[0]}`,
        site: s.name,
        month: m.split(" ")[0],
        fixed: entry ? entry.fixedAmount : 0,
        actual: entry ? entry.paid : 0,
      }
    })
  )

  // Audit summary per site
  const auditSummary = SITES.map((s) => {
    const completed = s.entries.filter(
      (e) => e.auditStatus === "Completed"
    ).length
    const total = s.entries.length
    const raised = s.entries.filter((e) => e.observation === "Raised").length
    return {
      name: s.name,
      handler: s.handler,
      completed,
      total,
      raised,
      rate: Math.round((completed / total) * 100),
    }
  })

  const SITE_COLORS: Record<string, string> = {
    "Crystal IT Park": "#0d9488",
    "MPSEDC Bhopal": "#6366f1",
    "ISBT Raipur": "#f59e0b",
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Petty Cash Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track disbursements, statements &amp; audit compliance across all
            sites
          </p>
        </div>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-56 bg-white border-slate-200 rounded-lg text-sm">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {SITES.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Total Disbursed (YTD)"
          value={fmt(totalDisbursed)}
          icon={Wallet}
          color="bg-teal-600"
          sub={`Across ${filteredSites.length} site${filteredSites.length > 1 ? "s" : ""} in Q1 2026`}
        />
        <Kpi
          label="Sites Tracked"
          value={totalSites}
          icon={Building2}
          color="bg-indigo-600"
          sub="Active facility locations"
        />
        <Kpi
          label="Pending Audits"
          value={pendingAudits}
          icon={ClipboardCheck}
          color={pendingAudits > 0 ? "bg-amber-500" : "bg-emerald-600"}
          barValue={Math.round(
            (completedAudits / (completedAudits + pendingAudits || 1)) * 100
          )}
          sub={`${completedAudits} of ${completedAudits + pendingAudits} audits completed`}
        />
        <Kpi
          label="Observation Rate"
          value={`${obsRate}%`}
          icon={AlertTriangle}
          color={obsRate > 40 ? "bg-red-500" : "bg-emerald-600"}
          barValue={obsRate}
          sub={`${observationsRaised} observations raised of ${allEntries.length} entries`}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Section
            title="Monthly Disbursement Trend"
            sub="Amount paid per site each month"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<LineTip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {SITES.map((s) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={SITE_COLORS[s.name]}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: SITE_COLORS[s.name] }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Section
            title="Fixed vs Actual Disbursement"
            sub="Compare budgeted vs actual amounts paid"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<BarTip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  dataKey="fixed"
                  name="Fixed Amount"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  name="Actual Paid"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Audit Status Summary ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <Section
          title="Audit Compliance Overview"
          sub="Completion status and observation summary per site"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {auditSummary.map((a) => (
            <div
              key={a.name}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-600/10 flex items-center justify-center">
                  <Building2 size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {a.name}
                  </p>
                  <p className="text-[11px] text-slate-400">{a.handler}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Audit Completion</span>
                  <span className="font-semibold text-slate-700">
                    {a.completed}/{a.total}
                  </span>
                </div>
                <Progress value={a.rate} className="h-1.5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {a.rate === 100 ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <Clock size={14} className="text-amber-500" />
                  )}
                  <span
                    className={`text-[11px] font-medium ${
                      a.rate === 100 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {a.rate === 100 ? "All Complete" : "In Progress"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={13} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500">
                    {a.raised} observation{a.raised !== 1 ? "s" : ""} raised
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed Monthly Tables (Tabs) ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <Section
          title="Monthly Disbursement Details"
          sub="Detailed breakdown per site with audit and observation tracking"
        />
        <Tabs defaultValue={filteredSites[0]?.name || SITES[0].name}>
          <TabsList className="mb-4">
            {filteredSites.map((s) => (
              <TabsTrigger key={s.name} value={s.name} className="text-xs">
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {filteredSites.map((site) => (
            <TabsContent key={site.name} value={site.name}>
              {/* Site header info */}
              <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Handler
                  </span>
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {site.handler}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Monthly Budget
                  </span>
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {fmt(site.fixedMonthly)}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-12">
                        S.No
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Month
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Date
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Person
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                        Fixed Amt
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                        Paid
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                        Statement
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center">
                        Audit
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center">
                        Observation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {site.entries.map((entry, idx) => {
                      const variance = entry.paid - entry.fixedAmount
                      return (
                        <TableRow
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="text-xs text-slate-500 font-medium">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-700">
                            {entry.month}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(entry.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {entry.person}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 text-right font-mono">
                            {fmt(entry.fixedAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-xs font-semibold font-mono ${
                                variance > 0
                                  ? "text-red-600"
                                  : variance < 0
                                    ? "text-amber-600"
                                    : "text-slate-700"
                              }`}
                            >
                              {fmt(entry.paid)}
                            </span>
                            {variance !== 0 && (
                              <span
                                className={`ml-1.5 text-[10px] ${
                                  variance > 0
                                    ? "text-red-400"
                                    : "text-amber-400"
                                }`}
                              >
                                ({variance > 0 ? "+" : ""}
                                {fmt(variance)})
                              </span>
                            )}
                            {entry.specialNote && (
                              <span className="ml-1.5 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                                {entry.specialNote}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 text-right font-mono">
                            {fmt(entry.statement)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${auditBadge(
                                entry.auditStatus
                              )}`}
                            >
                              {entry.auditStatus === "Completed" ? (
                                <CheckCircle2 size={11} />
                              ) : (
                                <Clock size={11} />
                              )}
                              {entry.auditStatus}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${obsBadge(
                                entry.observation
                              )}`}
                            >
                              {entry.observation}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {/* Totals row */}
                    <TableRow className="bg-slate-50/80 border-t-2 border-slate-200">
                      <TableCell
                        colSpan={4}
                        className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        Total
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 text-right font-mono">
                        {fmt(
                          site.entries.reduce(
                            (sum, e) => sum + e.fixedAmount,
                            0
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-teal-700 text-right font-mono">
                        {fmt(
                          site.entries.reduce((sum, e) => sum + e.paid, 0)
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 text-right font-mono">
                        {fmt(
                          site.entries.reduce(
                            (sum, e) => sum + e.statement,
                            0
                          )
                        )}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
