"use client"

<<<<<<< HEAD
import StatCard from "@/components/hr/StatCard"
import DashboardTable from "@/components/hr/DashboardTable"
import Charts from "@/components/hr/Charts"

import {
    FileText, ClipboardList, Clock, AlertTriangle, CheckCircle
} from "lucide-react"
import Header from "@/components/hr/Header"

export default function HRDashboard() {
    return (
        <div>
            <Header />

            {/* HEADER */}
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 mb-6">
                Overview of all sites and form submissions
            </p>

            {/* STATS */}
            <div className="grid md:grid-cols-5 gap-4">

                <StatCard title="Total Sites" value="8" icon={ClipboardList} color="blue" />
                <StatCard title="Forms Submitted" value="24" icon={FileText} color="blue" />
                <StatCard title="Pending" value="7" icon={Clock} color="yellow" />
                <StatCard title="Overdue" value="4" icon={AlertTriangle} color="red" />
                <StatCard title="Completed" value="13" icon={CheckCircle} color="green" />

            </div>

            {/* CHARTS */}
            <Charts />

            {/* TABLE */}
            <DashboardTable />

        </div>
    )
}
=======
import { useState, useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import {
  Users, Building2, UserCheck, UserMinus, TrendingUp,
  AlertTriangle, Shield, Wrench, Sparkles, ClipboardList,
  ArrowDownRight, ArrowUpRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoleEntry {
  role: string
  category: "Security" | "Housekeeping" | "Technical" | "Admin" | "Support" | "Other"
  authorized: number
  deployed: number
}

interface SiteData {
  name: string
  shortName: string
  roles: RoleEntry[]
}

// ─── Hardcoded Data ──────────────────────────────────────────────────────────

const SITES: SiteData[] = [
  {
    name: "Crystal IT Park",
    shortName: "Crystal IT",
    roles: [
      { role: "Manager Electrical", category: "Technical", authorized: 2, deployed: 2 },
      { role: "Electrician", category: "Technical", authorized: 12, deployed: 10 },
      { role: "Plumber", category: "Technical", authorized: 6, deployed: 5 },
      { role: "Housekeeping Staff", category: "Housekeeping", authorized: 28, deployed: 26 },
      { role: "Security Personnel", category: "Security", authorized: 40, deployed: 38 },
      { role: "HVAC Technician", category: "Technical", authorized: 8, deployed: 7 },
      { role: "Supervisor", category: "Admin", authorized: 4, deployed: 4 },
      { role: "Help Desk", category: "Admin", authorized: 3, deployed: 3 },
      { role: "Gardner", category: "Support", authorized: 3, deployed: 3 },
    ],
  },
  {
    name: "Raipur ISBT",
    shortName: "Raipur ISBT",
    roles: [
      { role: "Property Manager", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Help Desk Executive", category: "Admin", authorized: 4, deployed: 4 },
      { role: "Housekeeping Staff", category: "Housekeeping", authorized: 30, deployed: 28 },
      { role: "Security Personnel", category: "Security", authorized: 36, deployed: 19 },
      { role: "Fire Technician", category: "Technical", authorized: 4, deployed: 3 },
      { role: "Electrician", category: "Technical", authorized: 12, deployed: 10 },
      { role: "Plumber", category: "Technical", authorized: 8, deployed: 7 },
      { role: "Supervisor", category: "Admin", authorized: 6, deployed: 5 },
      { role: "HVAC Technician", category: "Technical", authorized: 10, deployed: 8 },
      { role: "Sweeper", category: "Housekeeping", authorized: 20, deployed: 18 },
      { role: "Gardner", category: "Support", authorized: 5, deployed: 4 },
      { role: "Lift Operator", category: "Technical", authorized: 6, deployed: 6 },
      { role: "Pest Control", category: "Support", authorized: 4, deployed: 4 },
    ],
  },
  {
    name: "MPSEDC Bhopal",
    shortName: "MPSEDC",
    roles: [
      { role: "Facility Manager", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Security Guard", category: "Security", authorized: 16, deployed: 14 },
      { role: "Support Staff", category: "Support", authorized: 18, deployed: 18 },
      { role: "Gardner", category: "Support", authorized: 3, deployed: 3 },
      { role: "Electrician", category: "Technical", authorized: 4, deployed: 3 },
      { role: "Housekeeping", category: "Housekeeping", authorized: 5, deployed: 5 },
    ],
  },
  {
    name: "MPIDC Gwalior",
    shortName: "MPIDC",
    roles: [
      { role: "Computer Operator", category: "Admin", authorized: 9, deployed: 9 },
      { role: "Pump Operator", category: "Technical", authorized: 27, deployed: 5 },
      { role: "Electrician", category: "Technical", authorized: 7, deployed: 3 },
      { role: "Housekeeping Staff", category: "Housekeeping", authorized: 10, deployed: 8 },
      { role: "Security Guard", category: "Security", authorized: 8, deployed: 6 },
      { role: "Supervisor", category: "Admin", authorized: 3, deployed: 2 },
      { role: "Plumber", category: "Technical", authorized: 2, deployed: 1 },
    ],
  },
  {
    name: "Daly College (DCBM/DCBS)",
    shortName: "DC DCBM",
    roles: [
      { role: "Security Guard", category: "Security", authorized: 7, deployed: 7 },
    ],
  },
  {
    name: "Daly College (HMS)",
    shortName: "DC HMS",
    roles: [
      { role: "ASO", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Supervisor", category: "Admin", authorized: 2, deployed: 2 },
      { role: "Surveillance Operator", category: "Security", authorized: 4, deployed: 4 },
      { role: "Security Guard", category: "Security", authorized: 20, deployed: 20 },
      { role: "Housekeeping", category: "Housekeeping", authorized: 4, deployed: 4 },
    ],
  },
  {
    name: "IDA Manpower",
    shortName: "IDA MP",
    roles: [
      { role: "Junior Engineer", category: "Technical", authorized: 15, deployed: 0 },
      { role: "Surveyor", category: "Technical", authorized: 8, deployed: 6 },
      { role: "Data Entry Operator", category: "Admin", authorized: 10, deployed: 10 },
      { role: "Peon / Office Boy", category: "Support", authorized: 12, deployed: 12 },
      { role: "Driver", category: "Support", authorized: 6, deployed: 5 },
      { role: "Security Guard", category: "Security", authorized: 10, deployed: 8 },
      { role: "Sweeper", category: "Housekeeping", authorized: 8, deployed: 6 },
      { role: "Electrician", category: "Technical", authorized: 3, deployed: 2 },
    ],
  },
  {
    name: "IDA PRO",
    shortName: "IDA PRO",
    roles: [
      { role: "PR Officer", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Graphic Designer", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Social Media Expert", category: "Admin", authorized: 1, deployed: 1 },
      { role: "Content Writer", category: "Admin", authorized: 1, deployed: 1 },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function siteTotals(site: SiteData) {
  const authorized = site.roles.reduce((s, r) => s + r.authorized, 0)
  const deployed = site.roles.reduce((s, r) => s + r.deployed, 0)
  const shortage = authorized - deployed
  const fulfillment = authorized > 0 ? Math.round((deployed / authorized) * 100) : 100
  return { authorized, deployed, shortage, fulfillment }
}

function statusLabel(pct: number) {
  if (pct >= 90) return "Optimal"
  if (pct >= 75) return "Adequate"
  if (pct >= 50) return "Low"
  return "Critical"
}

function statusBadgeClass(pct: number) {
  if (pct >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (pct >= 75) return "bg-sky-50 text-sky-700 border-sky-200"
  if (pct >= 50) return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-red-50 text-red-700 border-red-200"
}

function statusDot(pct: number) {
  if (pct >= 90) return "bg-emerald-500"
  if (pct >= 75) return "bg-sky-500"
  if (pct >= 50) return "bg-amber-500"
  return "bg-red-500"
}

const CATEGORY_COLORS: Record<string, string> = {
  Security: "#6366f1",
  Housekeeping: "#06b6d4",
  Technical: "#f59e0b",
  Admin: "#8b5cf6",
  Support: "#10b981",
  Other: "#94a3b8",
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-500 font-medium mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="text-slate-900 font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-slate-900 font-bold">{payload[0].name}</p>
      <p className="text-slate-500">{payload[0].value} personnel</p>
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function Kpi({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string; value: string | number; sub?: string; icon: any
  color: string; trend?: string; trendUp?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </span>
          )}
          {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
        </div>
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const [selectedSite, setSelectedSite] = useState("all")

  // Compute data
  const filteredSites = useMemo(() => {
    if (selectedSite === "all") return SITES
    return SITES.filter(s => s.name === selectedSite)
  }, [selectedSite])

  const grandTotals = useMemo(() => {
    let authorized = 0, deployed = 0
    filteredSites.forEach(site => {
      const t = siteTotals(site)
      authorized += t.authorized
      deployed += t.deployed
    })
    const shortage = authorized - deployed
    const fulfillment = authorized > 0 ? Math.round((deployed / authorized) * 100) : 100
    return { authorized, deployed, shortage, fulfillment, sites: filteredSites.length }
  }, [filteredSites])

  // Chart data: site-wise authorized vs deployed
  const barChartData = useMemo(() => {
    return filteredSites.map(site => {
      const t = siteTotals(site)
      return { name: site.shortName, Authorized: t.authorized, Deployed: t.deployed }
    })
  }, [filteredSites])

  // Role category distribution (pie/donut)
  const categoryData = useMemo(() => {
    const map: Record<string, { authorized: number; deployed: number }> = {}
    filteredSites.forEach(site => {
      site.roles.forEach(r => {
        if (!map[r.category]) map[r.category] = { authorized: 0, deployed: 0 }
        map[r.category].authorized += r.authorized
        map[r.category].deployed += r.deployed
      })
    })
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: v.deployed, authorized: v.authorized }))
      .sort((a, b) => b.value - a.value)
  }, [filteredSites])

  // Critical shortages
  const criticalShortages = useMemo(() => {
    const gaps: { site: string; role: string; authorized: number; deployed: number; gap: number }[] = []
    filteredSites.forEach(site => {
      site.roles.forEach(r => {
        const gap = r.authorized - r.deployed
        if (gap > 0) {
          gaps.push({ site: site.name, role: r.role, authorized: r.authorized, deployed: r.deployed, gap })
        }
      })
    })
    return gaps.sort((a, b) => b.gap - a.gap).slice(0, 8)
  }, [filteredSites])

  // Site table data
  const siteTableData = useMemo(() => {
    return filteredSites.map(site => {
      const t = siteTotals(site)
      return { name: site.name, ...t }
    })
  }, [filteredSites])

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Human Resources
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manpower deployment overview across all facility management sites
          </p>
        </div>

        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {SITES.map(s => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi
          label="Total Sites"
          value={grandTotals.sites}
          sub="active locations"
          icon={Building2}
          color="bg-indigo-600"
        />
        <Kpi
          label="Authorized"
          value={grandTotals.authorized}
          sub="sanctioned positions"
          icon={ClipboardList}
          color="bg-violet-600"
        />
        <Kpi
          label="Deployed"
          value={grandTotals.deployed}
          sub="currently active"
          icon={UserCheck}
          color="bg-emerald-600"
          trend={`${grandTotals.fulfillment}%`}
          trendUp={grandTotals.fulfillment >= 80}
        />
        <Kpi
          label="Shortage"
          value={grandTotals.shortage}
          sub="positions vacant"
          icon={UserMinus}
          color="bg-red-500"
          trend={`${100 - grandTotals.fulfillment}% gap`}
          trendUp={false}
        />
        <Kpi
          label="Fulfillment Rate"
          value={`${grandTotals.fulfillment}%`}
          icon={TrendingUp}
          color="bg-sky-600"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Bar Chart: Authorized vs Deployed */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <Section title="Site-wise Manpower" sub="Authorized vs Deployed comparison" />
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "#64748b" }}
                />
                <Bar dataKey="Authorized" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deployed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Category Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <Section title="Role Category Distribution" sub="Deployed personnel by category" />
          <div className="h-52 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Other}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.Other }}
                />
                <span className="text-xs text-slate-600 truncate">{cat.name}</span>
                <span className="text-xs font-semibold text-slate-900 ml-auto">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Site-wise Manpower Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <Section title="Site Manpower Summary" sub="Staffing levels across all managed locations" />
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Site Name</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Authorized</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Deployed</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Shortage</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Fulfillment</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {siteTableData.map((row, i) => (
                <tr
                  key={row.name}
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(row.fulfillment)}`} />
                      <span className="font-medium text-slate-700">{row.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3.5 px-4 text-slate-600 font-medium">{row.authorized}</td>
                  <td className="text-center py-3.5 px-4 text-slate-600 font-medium">{row.deployed}</td>
                  <td className="text-center py-3.5 px-4">
                    <span className={`font-semibold ${row.shortage > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {row.shortage > 0 ? `-${row.shortage}` : "0"}
                    </span>
                  </td>
                  <td className="text-center py-3.5 px-4">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16">
                        <Progress value={row.fulfillment} className="h-1.5" />
                      </div>
                      <span className="text-xs text-slate-500 font-medium w-10">{row.fulfillment}%</span>
                    </div>
                  </td>
                  <td className="text-center py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass(row.fulfillment)}`}>
                      {statusLabel(row.fulfillment)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Grand total footer */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="py-3.5 px-4 font-bold text-slate-800">Total</td>
                <td className="text-center py-3.5 px-4 font-bold text-slate-800">{grandTotals.authorized}</td>
                <td className="text-center py-3.5 px-4 font-bold text-slate-800">{grandTotals.deployed}</td>
                <td className="text-center py-3.5 px-4 font-bold text-red-600">-{grandTotals.shortage}</td>
                <td className="text-center py-3.5 px-4 font-bold text-slate-800">{grandTotals.fulfillment}%</td>
                <td className="text-center py-3.5 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass(grandTotals.fulfillment)}`}>
                    {statusLabel(grandTotals.fulfillment)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Critical Shortages ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <AlertTriangle size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Critical Shortages</h2>
            <p className="text-xs text-slate-400 mt-0.5">Roles with the largest manpower gaps requiring immediate attention</p>
          </div>
        </div>

        {criticalShortages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No shortages found -- all positions are fully staffed.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {criticalShortages.map((item, i) => {
              const pct = item.authorized > 0 ? Math.round((item.deployed / item.authorized) * 100) : 0
              return (
                <div
                  key={`${item.site}-${item.role}-${i}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800 truncate">{item.role}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadgeClass(pct)}`}>
                        {pct}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{item.site}</p>
                    <div className="mt-2">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-red-600">-{item.gap}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.deployed}/{item.authorized} filled</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Category Breakdown Bars ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <Section title="Category-wise Fulfillment" sub="Authorized vs deployed breakdown by role category" />
        <div className="space-y-4 mt-2">
          {categoryData.map(cat => {
            const pct = cat.authorized > 0 ? Math.round((cat.value / cat.authorized) * 100) : 100
            const CategoryIcon =
              cat.name === "Security" ? Shield :
              cat.name === "Technical" ? Wrench :
              cat.name === "Housekeeping" ? Sparkles :
              cat.name === "Admin" ? ClipboardList : Users
            return (
              <div key={cat.name} className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.Other}18` }}
                >
                  <CategoryIcon
                    size={14}
                    style={{ color: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.Other }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                    <span className="text-xs text-slate-400">
                      {cat.value} / {cat.authorized}
                      <span className="ml-2 font-semibold text-slate-600">{pct}%</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.Other,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
>>>>>>> origin/feature/dashboard-hr-merge-25mar2025
