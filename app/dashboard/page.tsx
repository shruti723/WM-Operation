"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie } from "recharts"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  LineChart, Line,
  BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import {
  ClipboardList, TrendingUp, MapPin, RotateCcw,
  AlertCircle, Phone, Trophy, AlertTriangle, Users,
  Loader2, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
function CountTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-xl px-3 py-2 text-xs shadow">
      <p>{label}</p>
      <p className="font-bold">{payload[0].value} submissions</p>
    </div>
  )
}
function normalizeValue(v: any) {
  if (!v) return ""

  const val = v.toString().trim().toLowerCase()

  if (["yes", "1", "done", "completed"].includes(val)) return "yes"
  if (["no", "0", "not done"].includes(val)) return "no"

  if (["good", "satisfactory"].includes(val)) return "good"
  if (["poor", "bad"].includes(val)) return "poor"

  // ❗ IGNORE random text like "busy at event"
  return ""
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getValue(obj: any, key: string) {
  if (!obj) return ""

  return normalizeValue(
    obj[key] ||
    obj[key.toLowerCase()] ||
    obj[key.replaceAll(" ", "_")] ||
    ""
  )
}

function calcScore(item: any) {
  let total = 0, good = 0

  Object.entries(item).forEach(([key, v]: any) => {
    const val = normalizeValue(v)

    if (!val) return // ✅ ignore invalid

    total++

    if (val === "yes" || val === "good") {
      good++
    }
  })

  return total ? Math.round((good / total) * 100) : 0
}

function statusLabel(s: number) {
  return s >= 80 ? "Good" : s >= 50 ? "Average" : "Critical"
}

function statusClass(s: number) {
  if (s >= 80) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
  if (s >= 50) return "bg-amber-50  text-amber-700  ring-1 ring-amber-200"
  return "bg-red-50    text-red-700    ring-1 ring-red-200"
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-900 font-bold text-sm">{payload[0].value}%</p>
    </div>
  )
}


// ─── KPI card ─────────────────────────────────────────────────────────────────

function Kpi({
  label, value, icon: Icon, color, barValue, danger,
}: {
  label: string; value: string | number; icon: any
  color: string; barValue?: number; danger?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${danger ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </p>
      {barValue !== undefined && (
        <div className="space-y-1">
          <Progress value={barValue} className="h-1.5" />
          <p className="text-[11px] text-slate-400">{barValue}% compliance rate</p>
        </div>
      )}
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────

function Section({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const [data, setData] = useState<any>({})
  const [site, setSite] = useState("all")
  const [range, setRange] = useState("7")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(r => { setData(r); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
      </div>
    )
  }

  const allData: any[] = data.allData || []

  // Filter
  function getRowDate(d: any) {
    return (
      d.date ||
      d.timestamp ||
      d.start_date ||
      d.created_on ||
      null
    )
  }
  const compliance = data.compliance || { good: 0, avg: 0, critical: 0 }
  const submissionData = data.submissionData || []
  const supervisorPerf = data.supervisorPerf || []

  function parseDate(dateStr: string) {
    if (!dateStr) return null

    let d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d

    // handle DD/MM/YYYY
    const [datePart, timePart] = dateStr.split(" ")
    const [day, month, year] = datePart.split("/")

    d = new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`)
    return isNaN(d.getTime()) ? null : d
  }
  const filtered = allData.filter((d: any) => {
    const rawDate = getRowDate(d)
    if (!rawDate) return false

    const parsed = parseDate(rawDate)
    if (!parsed) return false

    const days = (Date.now() - parsed.getTime()) / 86_400_000

    return days <= Number(range) && (site === "all" || d.site === site)
  })

  const sites: string[] = Array.from(new Set(allData.map((d: any) => d.site).filter(Boolean)))

  // KPIs
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((a, b) => a + calcScore(b), 0) / filtered.length) : 0
  const siteVisits = filtered.filter((d: any) => getValue(d, "site_visit") === "yes").length
  const repeatComps = filtered.filter((d: any) => getValue(d, "repeat_complaint") === "yes").length
  const urgentCount = filtered.filter((d: any) => getValue(d, "urgent_issue") === "yes").length
  const callCount = filtered.filter((d: any) => getValue(d, "telephonic_calling") === "yes").length
  const manpower = filtered.filter((d: any) => getValue(d, "manpower_issue") === "yes")

  // Daily trend
  const dayMap: Record<string, { total: number; count: number }> = {}
  filtered.forEach((d: any) => {
    const rawDate = getRowDate(d)
    const parsed = parseDate(rawDate)
    if (!parsed) return

    const key = parsed.toISOString().split("T")[0]
    if (!dayMap[key]) dayMap[key] = { total: 0, count: 0 }
    dayMap[key].total += calcScore(d)
    dayMap[key].count += 1
  })
  const trendData = Object.keys(dayMap)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(d => ({
      date: d.slice(5),          // MM-DD only
      score: Math.round(dayMap[d].total / dayMap[d].count),
    }))

  // Site performance
  const siteMap: Record<string, number[]> = {}
  allData.forEach((d: any) => {
    if (!d.site) return
    if (!siteMap[d.site]) siteMap[d.site] = []
    siteMap[d.site].push(calcScore(d))
  })
  const sitePerf = Object.keys(siteMap).map(s => ({
    site: s,
    score: Math.round(siteMap[s].reduce((a, b) => a + b, 0) / siteMap[s].length),
  })).sort((a, b) => b.score - a.score)

  const topSite = sitePerf[0]
  const worstSite = sitePerf[sitePerf.length - 1]

  // Top issues
  const issueMap: Record<string, number> = {}
  filtered.forEach((d: any) => {
    Object.entries(d).forEach(([k, v]) => {
      const val = normalizeValue(v)
      if (val === "no" || val === "poor") issueMap[k] = (issueMap[k] || 0) + 1
    })
  })
  const topIssues = Object.keys(issueMap)
    .map(k => ({ label: k.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase()), count: issueMap[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxIssue = topIssues[0]?.count || 1

  // Bar colors — single-family progression
  const barScore = (s: number) => s >= 80 ? "#4f46e5" : s >= 50 ? "#818cf8" : "#e0e7ff"

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Operations Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time performance across all sites</p>
        </div>
        <div className="flex gap-2">
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-40 h-9 text-sm bg-white border-slate-200 shadow-none">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 h-9 text-sm bg-white border-slate-200 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Critical banner ── */}
      {worstSite && worstSite.score < 50 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{worstSite.site}</span> is critically underperforming at{" "}
            <span className="font-semibold">{worstSite.score}%</span> — immediate action required.
          </p>
        </div>
      )}

      {/* Smart Insights */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
        <p className="font-semibold mb-1">Insights</p>

        {avgScore < 60 && <p>⚠️ Overall performance is low. Immediate monitoring required.</p>}
        {urgentCount > 0 && <p>🚨 Urgent issues detected across sites.</p>}
        {repeatComps > 0 && <p>🔁 Repeat complaints indicate unresolved problems.</p>}
        {topSite && <p>🏆 Best site: {topSite.site} ({topSite.score}%)</p>}
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Submissions" value={filtered.length} icon={ClipboardList} color="bg-slate-700" />
        <Kpi label="Avg Score" value={`${avgScore}%`} icon={TrendingUp} color="bg-indigo-600" barValue={avgScore} />
        <Kpi label="Site Visits" value={siteVisits} icon={MapPin} color="bg-violet-600" />
        <Kpi label="Repeat Complaints" value={repeatComps} icon={RotateCcw} color="bg-amber-500" />
        <Kpi label="Urgent Issues" value={urgentCount} icon={AlertCircle} color="bg-red-500" danger={urgentCount > 0} />
        <Kpi label="Outstation Calls" value={callCount} icon={Phone} color="bg-cyan-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Compliance */}
        <div className="bg-white rounded-xl border p-5">
          <Section title="Compliance Overview" sub="Distribution of performance" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: "Good", value: compliance.good },
                  { name: "Average", value: compliance.avg },
                  { name: "Critical", value: compliance.critical },
                ]}
                dataKey="value"
                outerRadius={80}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Submission trend */}
        <div className="bg-white rounded-xl border p-5">
          <Section title="Submission Volume" sub="Daily submission count" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={submissionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Supervisor leaderboard */}
        <div className="bg-white rounded-xl border p-5">
          <Section title="Supervisor Performance" sub="Average score by supervisor" />

          <div className="space-y-3">
            {supervisorPerf.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-slate-700">{s.name}</span>
                <span className="text-sm font-bold text-indigo-600">{s.score}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Trend — wider */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <Section title="Daily Performance Trend" sub="Average score per day across filtered submissions" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ left: -20, right: 10, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="none" tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="none" tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: "#e2e8f0" }} />
              <Line
                type="monotone" dataKey="score"
                stroke="#6366f1" strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#4f46e5" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Site performance — narrower */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <Section title="Site Performance" sub="Overall score by site" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sitePerf} margin={{ left: -20, right: 0, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="site" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="none" tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="none" tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {sitePerf.map((s, i) => (
                  <Cell key={i} fill={barScore(s.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── Table + Summary row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recent activity table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <Section title="Recent Activity" sub={`Showing latest ${Math.min(filtered.length, 8)} submissions`} />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Site", "Date", "Score", "Status"].map(h => (
                  <th key={h} className={`pb-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide ${h === "Score" || h === "Status" ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.slice(0, 8).map((d: any, i: number) => {
                const s = calcScore(d)
                return (
                  <tr key={i} className="hover:shadow-lg transition-all duration-300">
                    <td className="py-2.5 font-medium text-slate-800">{d.site}</td>
                    <td className="py-2.5 text-slate-400 text-xs">{getRowDate(d)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-700">{s}%</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusClass(s)}`}>
                        {statusLabel(s)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                    No submissions found for selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Best / Worst */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={13} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Best</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{topSite?.site || "—"}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                <ArrowUpRight size={12} />{topSite?.score ?? "—"}%
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-red-400" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Worst</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{worstSite?.site || "—"}</p>
              <p className="text-xs text-red-500 font-semibold mt-0.5 flex items-center gap-0.5">
                <ArrowDownRight size={12} />{worstSite?.score ?? "—"}%
              </p>
            </div>
          </div>

          {/* Manpower */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Manpower Shortages</p>
              {manpower.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold bg-red-50 text-red-600 ring-1 ring-red-200 rounded-full px-2 py-0.5">
                  {manpower.length}
                </span>
              )}
            </div>
            {manpower.length === 0 ? (
              <p className="text-xs text-slate-400">No shortages in selected period</p>
            ) : (
              <div className="space-y-1.5">
                {manpower.slice(0, 5).map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{d.site}</span>
                    <span className="text-[11px] font-semibold text-red-500">Shortage</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Top issues ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <AlertCircle size={15} className="text-red-400" />
          <h2 className="text-sm font-semibold text-slate-700">Top Recurring Issues</h2>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} submissions analysed</span>
        </div>

        {topIssues.length === 0 ? (
          <p className="text-xs text-slate-400">No issues found in selected range</p>
        ) : (
          <div className="space-y-3">
            {topIssues.map((item, i) => {
              const pct = Math.round((item.count / maxIssue) * 100)
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-5 text-xs text-slate-400 font-medium text-right shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                      <span className="text-xs font-bold text-red-500">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
