"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  IndianRupee,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Plane,
  Wallet,
  ShieldAlert,
} from "lucide-react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  charts: {
    siteWise: any[]
    monthWise: any[]
    userWise: any[]
    statusSummary: any[]
    costStatus: any[]
  }
  latestActivity: any[]
}

function formatMoney(value: any) {
  const amount = Number(value || 0)

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })
}

function formatDate(value: any) {
  if (!value) return "-"

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const CHART_COLORS = {
  indigo: "#4f46e5",
  violet: "#7c3aed",
  orange: "#f97316",
  amber: "#f59e0b",
  rose: "#e11d48",
  pink: "#ec4899",
  emerald: "#10b981",
  teal: "#14b8a6",
  slate: "#334155",
}

const PIE_COLORS = [
  "#4f46e5",
  "#f97316",
  "#e11d48",
  "#10b981",
  "#7c3aed",
  "#f59e0b",
  "#14b8a6",
  "#334155",
]

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  tone = "indigo",
}: {
  title: string
  value: string | number
  sub?: string
  icon: any
  tone?: "indigo" | "orange" | "rose" | "emerald" | "slate"
}) {
  const tones: any = {
    indigo: "from-indigo-600 to-violet-600",
    orange: "from-orange-600 to-amber-600",
    rose: "from-rose-600 to-pink-600",
    emerald: "from-emerald-600 to-teal-600",
    slate: "from-slate-800 to-slate-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">{value}</h3>
          {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-sm`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>
      <div className="h-[320px]">{children}</div>
    </div>
  )
}

export default function OperationTrackerDashboardPage() {
  const router = useRouter()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedSite, setSelectedSite] = useState("all")
  const [selectedUser, setSelectedUser] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const user = useMemo(() => {
    if (typeof window === "undefined") return null

    const stored = sessionStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)

      const params = new URLSearchParams()

      if (selectedSite !== "all") params.set("site", selectedSite)
      if (selectedUser !== "all") params.set("createdById", selectedUser)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const res = await fetch(`/api/operation/amitoj-dashboard?${params.toString()}`, {
        cache: "no-store",
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load dashboard")
      }

      setData(json)
    } catch (error) {
      console.error(error)
      alert("Dashboard data load nahi hua. Console check karo.")
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

    setTimeout(() => {
      loadDashboard()
    }, 100)
  }

  const totals = data?.totals || {}

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <div className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <BarChart3 size={20} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-950">
                Operation Tracker Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Daily site, travel, cost leak and cost saving overview
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            Logged in as <span className="font-semibold text-slate-800">{user?.name || "-"}</span>
          </div>
        </div>
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
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
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
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
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            />

            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Reset
              </button>

              <button
                onClick={applyFilters}
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Daily Site Reports"
                value={totals.dailyReports || 0}
                sub="Total submitted reports"
                icon={ClipboardList}
                tone="indigo"
              />

              <StatCard
                title="Travel Plans"
                value={totals.travelPlans || 0}
                sub={`${totals.followUpRequired || 0} follow-up required`}
                icon={Plane}
                tone="orange"
              />

              <StatCard
                title="Cost Leak Reports"
                value={totals.costLeaks || 0}
                sub={`Open: ${totals.openLeaks || 0}`}
                icon={TrendingDown}
                tone="rose"
              />

              <StatCard
                title="Cost Saving Reports"
                value={totals.costSavings || 0}
                sub={`Open: ${totals.openSavings || 0}`}
                icon={TrendingUp}
                tone="emerald"
              />
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Monthly Leakage ₹"
                value={`₹ ${formatMoney(totals.totalLeakage)}`}
                sub="Total leakage impact"
                icon={AlertTriangle}
                tone="rose"
              />

              <StatCard
                title="Monthly Saving ₹"
                value={`₹ ${formatMoney(totals.totalSaving)}`}
                sub="Total saving impact"
                icon={Wallet}
                tone="emerald"
              />

              <StatCard
                title="Net Impact ₹"
                value={`₹ ${formatMoney(totals.netImpact)}`}
                sub="Saving minus leakage"
                icon={IndianRupee}
                tone={Number(totals.netImpact || 0) >= 0 ? "emerald" : "rose"}
              />

              <StatCard
                title="Operational Alerts"
                value={
                  (totals.paymentPending || 0) +
                  (totals.salaryIssues || 0) +
                  (totals.hrIssues || 0) +
                  (totals.operationalRisks || 0)
                }
                sub="Payment, salary, HR and risk issues"
                icon={ShieldAlert}
                tone="slate"
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <ChartCard title="Monthly Leakage vs Saving">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.monthWise || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="leakage"
                      name="Leakage ₹"
                      fill={CHART_COLORS.rose}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="saving"
                      name="Saving ₹"
                      fill={CHART_COLORS.emerald}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Site-wise Reports">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.charts?.siteWise || []).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="site" tick={{ fill: "#475569", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="dailyReports"
                      name="Daily Reports"
                      fill={CHART_COLORS.indigo}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="travelPlans"
                      name="Travel Plans"
                      fill={CHART_COLORS.orange}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <ChartCard title="User-wise Submissions">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.userWise || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="dailyReports"
                      name="Daily Reports"
                      fill={CHART_COLORS.indigo}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="travelPlans"
                      name="Travel Plans"
                      fill={CHART_COLORS.orange}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="leaks"
                      name="Leaks"
                      fill={CHART_COLORS.rose}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="savings"
                      name="Savings"
                      fill={CHART_COLORS.emerald}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Important Status Summary">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.statusSummary || []}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label
                    >
                      {(data?.charts?.statusSummary || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Latest Activity
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest submissions from all 4 trackers
                  </p>
                </div>

                <Calendar size={18} className="text-slate-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Date / Time</th>
                      <th className="px-4 py-3 text-left">Tracker</th>
                      <th className="px-4 py-3 text-left">Site</th>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Amount ₹</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Submitted By</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data?.latestActivity?.length ? (
                      data.latestActivity.map((item) => (
                        <tr key={`${item.type}-${item.id}`} className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.type}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.site}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.amount ? `₹ ${formatMoney(item.amount)}` : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.createdBy}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}