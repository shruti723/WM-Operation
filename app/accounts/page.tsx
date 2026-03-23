"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import {
  IndianRupee, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Building2, ArrowUpRight, ArrowDownRight,
  Receipt, Wallet, CircleDollarSign, FileText,
} from "lucide-react"

// ─── Currency formatter (Indian) ─────────────────────────────────────────────

function fmt(n: number): string {
  return "₹" + n.toLocaleString("en-IN")
}

function fmtShort(n: number): string {
  if (n >= 10_00_000) return "₹" + (n / 100000).toFixed(1) + "L"
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K"
  return fmt(n)
}

// ─── Data ────────────────────────────────────────────────────────────────────

const sites = [
  { name: "Daly College",              monthlyBilling: 450000, lastInvoice: 448500, invoiceDate: "26 Feb 2026", payment: "Received", lastSalaryDate: "26 Feb 2026", salary: 385000 },
  { name: "Daly College (DCBS/DCBM)",  monthlyBilling: 85000,  lastInvoice: 84200,  invoiceDate: "26 Feb 2026", payment: "Pending",  lastSalaryDate: "26 Feb 2026", salary: 72000  },
  { name: "Khajrana Ganesh Temple",     monthlyBilling: 650000, lastInvoice: 648000, invoiceDate: "26 Feb 2026", payment: "Received", lastSalaryDate: "26 Feb 2026", salary: 590000 },
  { name: "Khajrana Garden Services",   monthlyBilling: 120000, lastInvoice: 118500, invoiceDate: "26 Feb 2026", payment: "Pending",  lastSalaryDate: "26 Feb 2026", salary: 105000 },
  { name: "Crystal IT Park",           monthlyBilling: 1250000,lastInvoice: 1245000,invoiceDate: "26 Feb 2026", payment: "Received", lastSalaryDate: "26 Feb 2026", salary: 1080000},
  { name: "ISBT Raipur",               monthlyBilling: 875000, lastInvoice: 870000, invoiceDate: "26 Feb 2026", payment: "Partial",  lastSalaryDate: "26 Feb 2026", salary: 750000 },
  { name: "MPSEDC Bhopal",             monthlyBilling: 520000, lastInvoice: 518000, invoiceDate: "26 Feb 2026", payment: "Received", lastSalaryDate: "26 Feb 2026", salary: 445000 },
  { name: "MPIDC Gwalior",             monthlyBilling: 380000, lastInvoice: 375000, invoiceDate: "26 Feb 2026", payment: "Pending",  lastSalaryDate: "26 Feb 2026", salary: 320000 },
  { name: "IDA Manpower",              monthlyBilling: 720000, lastInvoice: 715000, invoiceDate: "26 Feb 2026", payment: "Received", lastSalaryDate: "26 Feb 2026", salary: 610000 },
]

const totalBilling   = sites.reduce((s, d) => s + d.monthlyBilling, 0)
const totalInvoiced  = sites.reduce((s, d) => s + d.lastInvoice, 0)
const totalSalary    = sites.reduce((s, d) => s + d.salary, 0)
const received       = sites.filter(s => s.payment === "Received").reduce((a, b) => a + b.lastInvoice, 0)
const pending        = sites.filter(s => s.payment === "Pending").reduce((a, b) => a + b.lastInvoice, 0)
const partial        = sites.filter(s => s.payment === "Partial").reduce((a, b) => a + b.lastInvoice, 0)
const collectionRate = Math.round((received / totalInvoiced) * 100)
const pendingSites   = sites.filter(s => s.payment !== "Received").length

// Bar chart data: billing vs collection
const barData = sites.map(s => ({
  name: s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name,
  fullName: s.name,
  billing: s.monthlyBilling,
  collected: s.payment === "Received" ? s.lastInvoice : s.payment === "Partial" ? Math.round(s.lastInvoice * 0.6) : 0,
}))

// Pie chart data
const pieData = [
  { name: "Received", value: sites.filter(s => s.payment === "Received").length, color: "#10b981" },
  { name: "Pending",  value: sites.filter(s => s.payment === "Pending").length,  color: "#f59e0b" },
  { name: "Partial",  value: sites.filter(s => s.payment === "Partial").length,  color: "#6366f1" },
]

// 6-month revenue trend
const trendData = [
  { month: "Sep 25", billing: 4150000, collected: 3600000 },
  { month: "Oct 25", billing: 4320000, collected: 3850000 },
  { month: "Nov 25", billing: 4480000, collected: 4100000 },
  { month: "Dec 25", billing: 4600000, collected: 4200000 },
  { month: "Jan 26", billing: 4800000, collected: 4400000 },
  { month: "Feb 26", billing: totalBilling, collected: received },
]

// Outstanding items
const outstandingItems = sites.filter(s => s.payment !== "Received")

// ─── Custom chart tooltip ────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-500 font-medium mb-1.5">{payload[0]?.payload?.fullName || label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-slate-800 font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function TrendTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-500 font-medium mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function Kpi({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string; value: string; sub?: string; icon: any
  color: string; trend?: string; trendUp?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-[28px] font-bold tracking-tight text-slate-900 leading-none">{value}</p>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </span>
        )}
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}

// ─── Payment badge ───────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Received: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Pending:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Partial:  "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  }
  const icons: Record<string, any> = {
    Received: CheckCircle2,
    Pending:  Clock,
    Partial:  AlertTriangle,
  }
  const Ic = icons[status] || Clock
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
      <Ic size={12} />
      {status}
    </span>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function Section({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AccountsDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts & Finance</h1>
          <p className="text-sm text-slate-400 mt-1">Billing, invoices, and payment tracking across all sites</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <FileText size={14} />
          <span>Last updated: <span className="font-medium text-slate-600">26 Feb 2026</span></span>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Total Monthly Billing"
          value={fmt(totalBilling)}
          sub="across 9 sites"
          icon={IndianRupee}
          color="bg-amber-500"
          trend="+4.2%"
          trendUp
        />
        <Kpi
          label="Total Outstanding"
          value={fmt(pending + partial)}
          sub={`${pendingSites} sites pending`}
          icon={Wallet}
          color="bg-red-500"
          trend="3 sites"
          trendUp={false}
        />
        <Kpi
          label="Collection Rate"
          value={collectionRate + "%"}
          sub="of invoiced amount"
          icon={TrendingUp}
          color="bg-emerald-500"
          trend="+2.1%"
          trendUp
        />
        <Kpi
          label="Total Salary Outflow"
          value={fmt(totalSalary)}
          sub="monthly payroll"
          icon={CircleDollarSign}
          color="bg-indigo-500"
          trend="+1.8%"
          trendUp
        />
      </div>

      {/* ── Quick Stats Bar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Collection Progress</p>
          <p className="text-sm font-bold text-slate-700">{fmt(received)} <span className="text-slate-400 font-normal text-xs">/ {fmt(totalInvoiced)}</span></p>
        </div>
        <Progress value={collectionRate} className="h-2.5" />
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Received: <span className="font-semibold text-slate-700">{fmt(received)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-500">Pending: <span className="font-semibold text-slate-700">{fmt(pending)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-slate-500">Partial: <span className="font-semibold text-slate-700">{fmt(partial)}</span></span>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Revenue trend */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <Section title="Revenue Trend" sub="6-month billing vs collection" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtShort(v)} />
                    <Tooltip content={<TrendTip />} />
                    <Line type="monotone" dataKey="billing" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} name="Billing" />
                    <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} name="Collected" />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment status pie */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <Section title="Payment Status" sub="Distribution across sites" />
              <div className="h-72 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} sites`, name]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 -mt-4">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-500">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar chart: billing vs collection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Section title="Billing vs Collection by Site" sub="Current month comparison" />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtShort(v)} />
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="billing" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Billing" />
                  <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Invoices ──────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <Section title="Invoice Tracking" sub="All site invoices and payment status for Feb 2026" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Site Name</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Monthly Billing</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Invoice Amount</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Invoice Date</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Payment Status</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Salary Amount</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Salary Date</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s, i) => {
                    const margin = s.lastInvoice - s.salary
                    const marginPct = Math.round((margin / s.lastInvoice) * 100)
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                              <Building2 size={14} className="text-amber-600" />
                            </div>
                            <span className="font-medium text-slate-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{fmt(s.monthlyBilling)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{fmt(s.lastInvoice)}</td>
                        <td className="px-5 py-3.5 text-center text-slate-500">{s.invoiceDate}</td>
                        <td className="px-5 py-3.5 text-center"><PaymentBadge status={s.payment} /></td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{fmt(s.salary)}</td>
                        <td className="px-5 py-3.5 text-center text-slate-500">{s.lastSalaryDate}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-emerald-700">{fmt(margin)}</span>
                            <span className="text-[11px] text-slate-400">{marginPct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 border-t border-slate-200">
                    <td className="px-5 py-3.5 font-bold text-slate-800">Total ({sites.length} Sites)</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{fmt(totalBilling)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{fmt(totalInvoiced)}</td>
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{fmt(totalSalary)}</td>
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{fmt(totalInvoiced - totalSalary)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Outstanding ───────────────────────────────────────── */}
        <TabsContent value="outstanding" className="mt-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Section title="Outstanding Payments" sub="Sites with pending or partial payments requiring follow-up" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Pending Amount</p>
                <p className="text-xl font-bold text-amber-800">{fmt(pending)}</p>
                <p className="text-xs text-amber-600 mt-1">{sites.filter(s => s.payment === "Pending").length} sites</p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-1">Partial Amount</p>
                <p className="text-xl font-bold text-indigo-800">{fmt(partial)}</p>
                <p className="text-xs text-indigo-600 mt-1">{sites.filter(s => s.payment === "Partial").length} sites</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-1">Total Outstanding</p>
                <p className="text-xl font-bold text-red-800">{fmt(pending + partial)}</p>
                <p className="text-xs text-red-600 mt-1">{pendingSites} sites need follow-up</p>
              </div>
            </div>

            <div className="space-y-3">
              {outstandingItems.map((s, i) => {
                const progress = s.payment === "Partial" ? 60 : 0
                return (
                  <div key={i} className="rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          s.payment === "Pending" ? "bg-amber-50" : "bg-indigo-50"
                        }`}>
                          {s.payment === "Pending"
                            ? <Clock size={18} className="text-amber-600" />
                            : <AlertTriangle size={18} className="text-indigo-600" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Invoice: {s.invoiceDate} &middot; {fmt(s.lastInvoice)}</p>
                        </div>
                      </div>
                      <PaymentBadge status={s.payment} />
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Payment collected</span>
                        <span className="font-semibold text-slate-700">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>Due: <span className="font-semibold text-slate-700">{fmt(s.lastInvoice)}</span></span>
                      <span>Collected: <span className="font-semibold text-slate-700">{fmt(s.payment === "Partial" ? Math.round(s.lastInvoice * 0.6) : 0)}</span></span>
                      <span>Remaining: <span className="font-semibold text-red-600">{fmt(s.payment === "Partial" ? Math.round(s.lastInvoice * 0.4) : s.lastInvoice)}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
