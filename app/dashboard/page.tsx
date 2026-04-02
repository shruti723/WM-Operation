"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"
import {
  ClipboardList,
  TrendingUp,
  MapPin,
  AlertTriangle,
  Phone,
  Trophy,
  Eye,
  X,
  Search,
  MessageSquare,
  Send,
  Filter,
  Bell,
} from "lucide-react"

type RecentSubmission = {
  id: string
  supervisorName: string
  date: string
  time: string
  site: string
  score: number
  status: string
  siteVisitConducted: string
  telephonicCalling: string
}

type DetailAnswer = {
  id: string
  sectionName: string
  source: string
  questionId?: string
  questionText: string
  answerValue: string
  answerReason?: string | null
  siteContext?: string | null
  createdAt?: string
}

type DetailComment = {
  id: string
  authorName: string
  authorRole: string
  message: string
  createdAt: string
}

type NotificationItem = {
  submissionId: string
  authorName: string
  authorRole: string
  message: string
  createdAt?: string
}

type DetailData = {
  id: string
  supervisorName: string
  date: string
  time: string
  site: string
  siteVisitConducted: string
  siteVisitReason: string
  telephonicCalling: string
  telephonicSiteName: string
  telephonicIncharge: string
  answers: DetailAnswer[]
  comments: DetailComment[]
  createdAt?: string
  updatedAt?: string
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: any
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-4">{value}</p>
    </div>
  )
}

function statusClass(status: string) {
  if (status === "Good") return "bg-emerald-100 text-emerald-700"
  if (status === "Average") return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-700"
}

// function scoreColor(status: string) {
//   if (status === "Good") return "#22c55e"
//   if (status === "Average") return "#f59e0b"
//   return "#ef4444"
// }

function formatDateTime(value?: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString("en-IN")
}

function formatReadableLabel(text: string) {
  if (!text) return "-"
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [siteFilter, setSiteFilter] = useState("All")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [supervisorFilter, setSupervisorFilter] = useState("All")
  const [search, setSearch] = useState("")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [sendingComment, setSendingComment] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 6

  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const router = useRouter()

  async function loadNotifications() {
    const storedUser = sessionStorage.getItem("user")
    const user = storedUser ? JSON.parse(storedUser) : null

    if (!user?.role) return

    try {
      const res = await fetch(`/api/checklist/notifications?role=${user.role}`)
      const result = await res.json()

      if (result.success) {
        setUnreadCount(result.unreadCount || 0)
        setNotifications(result.notifications || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!e.target.closest(".notification-wrapper")) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard")
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  async function openDetail(id: string) {
    try {
      setSelectedId(id)
      setDetailLoading(true)

      const res = await fetch(`/api/checklist/${id}`)
      const result = await res.json()

      if (result.success) {
        setDetail(result.data)

        const storedUser = sessionStorage.getItem("user")
        const user = storedUser ? JSON.parse(storedUser) : null

        await fetch("/api/checklist/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: id,
            role: user?.role || "admin",
          }),
        })
        await loadNotifications()

      } else {
        setDetail(null)
      }
    } catch (err) {
      console.error(err)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSendComment() {
    if (!detail?.id || !commentText.trim()) return

    try {
      setSendingComment(true)

      const storedUser = sessionStorage.getItem("user")
      const user = storedUser ? JSON.parse(storedUser) : null

      const res = await fetch("/api/checklist/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: detail.id,
          authorName: user?.name || "Admin",
          authorRole: user?.role || "admin",
          message: commentText.trim(),
        }),
      })

      const result = await res.json()

      if (!result.success) {
        alert(result.message || "Failed to send message")
        return
      }

      setCommentText("")
      await openDetail(detail.id)
      await loadNotifications()

    } catch (err) {
      console.error(err)
      alert("Failed to send message")
    } finally {
      setSendingComment(false)
    }
  }

  const filteredSubmissions: RecentSubmission[] = useMemo(() => {
    if (!data?.recentSubmissions) return []

    return data.recentSubmissions.filter((item: RecentSubmission) => {
      const itemOnlyDate = item.date

      const fromMatch = fromDate ? itemOnlyDate >= fromDate : true
      const toMatch = toDate ? itemOnlyDate <= toDate : true

      const matchSite = siteFilter === "All" || item.site === siteFilter
      const matchStatus = statusFilter === "All" || item.status === statusFilter
      const matchSupervisor =
        supervisorFilter === "All" || item.supervisorName === supervisorFilter

      const matchSearch =
        !search ||
        item.site.toLowerCase().includes(search.toLowerCase()) ||
        item.supervisorName.toLowerCase().includes(search.toLowerCase())

      return fromMatch && toMatch && matchSite && matchStatus && matchSupervisor && matchSearch
    })
  }, [data, fromDate, toDate, siteFilter, statusFilter, supervisorFilter, search])

  const filteredAvgScore = filteredSubmissions.length
    ? Math.round(
      filteredSubmissions.reduce((sum, item) => sum + item.score, 0) /
      filteredSubmissions.length
    )
    : 0

  const siteVisits = filteredSubmissions.filter(
    (s) => s.siteVisitConducted === "Yes"
  ).length

  const telephonicCalls = filteredSubmissions.filter(
    (s) => s.telephonicCalling === "Yes"
  ).length

  const criticalCount = filteredSubmissions.filter(
    (s) => s.status === "Critical"
  ).length

  const goodCount = filteredSubmissions.filter((s) => s.status === "Good").length
  const averageCount = filteredSubmissions.filter((s) => s.status === "Average").length

  const supervisors: string[] = useMemo(() => {
    return Array.from(
      new Set(
        ((data?.recentSubmissions || []) as RecentSubmission[])
          .map((s) => s.supervisorName)
          .filter((name: string) => Boolean(name))
      )
    )
  }, [data])

  const allSites: string[] = useMemo(() => {
    return (data?.allSites || []).filter(
      (site: any): site is string => Boolean(site)
    )
  }, [data])

  const complianceChart = [
    { name: "Good", value: goodCount, color: "#22c55e" },
    { name: "Average", value: averageCount, color: "#f59e0b" },
    { name: "Critical", value: criticalCount, color: "#ef4444" },
  ]

  const submissionTrend = useMemo(() => {
    const map: Record<string, number> = {}

    filteredSubmissions.forEach((item) => {
      map[item.date] = (map[item.date] || 0) + 1
    })

    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredSubmissions])

  const scoreTrend = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}

    filteredSubmissions.forEach((item) => {
      if (!map[item.date]) {
        map[item.date] = { total: 0, count: 0 }
      }

      map[item.date].total += item.score
      map[item.date].count += 1
    })

    return Object.entries(map)
      .map(([date, val]) => ({
        date,
        score: Math.round(val.total / val.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredSubmissions])

  const sitePerformance = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}

    filteredSubmissions.forEach((item) => {
      if (!map[item.site]) {
        map[item.site] = { total: 0, count: 0 }
      }

      map[item.site].total += item.score
      map[item.site].count += 1
    })

    return Object.entries(map)
      .map(([site, val]) => ({
        site,
        score: Math.round(val.total / val.count),
      }))
      .sort((a, b) => b.score - a.score)
  }, [filteredSubmissions])

  const supervisorPerformance = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}

    filteredSubmissions.forEach((item) => {
      if (!map[item.supervisorName]) {
        map[item.supervisorName] = { total: 0, count: 0 }
      }

      map[item.supervisorName].total += item.score
      map[item.supervisorName].count += 1
    })

    return Object.entries(map)
      .map(([name, val]) => ({
        name,
        score: Math.round(val.total / val.count),
      }))
      .sort((a, b) => b.score - a.score)
  }, [filteredSubmissions])

  const topSite = sitePerformance[0]
  const worstSite = sitePerformance[sitePerformance.length - 1]

  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedSubmissions = filteredSubmissions.slice(
    startIndex,
    startIndex + rowsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [siteFilter, fromDate, toDate, statusFilter, supervisorFilter, search])

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Checklist Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track checklist submissions, performance trends, recurring issues and discussion threads
          </p>
        </div>

        <div className="flex items-center gap-3 text-slate-500 relative notification-wrapper">
          {/* <div className="flex items-center">
            <Filter size={18} />
          </div> */}

          <button
            onClick={() => setNotificationOpen((prev) => !prev)}
            className="relative w-10 h-10 rounded-xl border bg-white flex items-center justify-center hover:bg-slate-50"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white border rounded-2xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold text-slate-800">
                Notifications
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((item, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        setNotificationOpen(false)

                        if (item.submissionId) {
                          const storedUser = sessionStorage.getItem("user")
                          const user = storedUser ? JSON.parse(storedUser) : null

                          await fetch("/api/checklist/mark-read", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              submissionId: item.submissionId,
                              role: user?.role || "admin",
                            }),
                          })

                          openDetail(item.submissionId)
                          loadNotifications()
                        }
                      }}
                      className="w-full text-left px-4 py-3 border-b hover:bg-slate-50 bg-blue-50"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {item.authorName || "User"} ({item.authorRole || "unknown"})
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.message || "New message"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="h-11 px-3 rounded-xl border bg-white"
        >
          <option value="All">All Sites</option>
          {allSites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>

        <select
          value={supervisorFilter}
          onChange={(e) => setSupervisorFilter(e.target.value)}
          className="h-11 px-3 rounded-xl border bg-white"
        >
          <option value="All">All Supervisors</option>
          {supervisors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-3 rounded-xl border bg-white"
        >
          <option value="All">All Status</option>
          <option value="Good">Good</option>
          <option value="Average">Average</option>
          <option value="Critical">Critical</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="h-11 px-3 rounded-xl border bg-white"
          placeholder="From date"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="h-11 px-3 rounded-xl border bg-white"
          placeholder="To date"
        />

        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            placeholder="Search site or supervisor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-3 rounded-xl border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Submissions"
          value={filteredSubmissions.length}
          icon={ClipboardList}
          color="bg-slate-700"
        />
        <KpiCard
          label="Avg Score"
          value={`${filteredAvgScore}%`}
          icon={TrendingUp}
          color="bg-indigo-600"
        />
        <KpiCard
          label="Site Visits"
          value={siteVisits}
          icon={MapPin}
          color="bg-violet-600"
        />
        <KpiCard
          label="Telephonic Calls"
          value={telephonicCalls}
          icon={Phone}
          color="bg-cyan-600"
        />
        <KpiCard
          label="Critical Forms"
          value={criticalCount}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Compliance Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={complianceChart} dataKey="value" outerRadius={90}>
                {complianceChart.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {complianceChart.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600">
                  {item.name}: <span className="font-semibold">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Submission Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={submissionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Supervisor Performance</h2>
          <div className="space-y-3">
            {supervisorPerformance.length === 0 ? (
              <p className="text-sm text-slate-400">No data available</p>
            ) : (
              supervisorPerformance.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{item.score}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Daily Performance Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#16a34a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Site Performance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sitePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="site" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-slate-800">Best Site</h2>
          </div>
          {topSite ? (
            <>
              <p className="text-xl font-bold text-slate-900">{topSite.site}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-2">{topSite.score}% score</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-semibold text-slate-800">Worst Site</h2>
          </div>
          {worstSite ? (
            <>
              <p className="text-xl font-bold text-slate-900">{worstSite.site}</p>
              <p className="text-sm text-red-600 font-semibold mt-2">{worstSite.score}% score</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Insights</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Good forms: <span className="font-semibold">{goodCount}</span></p>
            <p>Average forms: <span className="font-semibold">{averageCount}</span></p>
            <p>Critical forms: <span className="font-semibold text-red-600">{criticalCount}</span></p>
            <p>Filtered checklist records: <span className="font-semibold">{filteredSubmissions.length}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-800">Submitted Forms</h2>
          <p className="text-sm text-slate-500">
            Showing {filteredSubmissions.length} result(s)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Supervisor</th>
                <th className="p-3 text-left">Site</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Site Visit</th>
                <th className="p-3 text-center">Telephonic</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No submissions found
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.date}</td>
                    <td className="p-3">{item.supervisorName}</td>
                    <td className="p-3">{item.site}</td>
                    <td className="p-3 text-center font-semibold">{item.score}%</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">{item.siteVisitConducted || "-"}</td>
                    <td className="p-3 text-center">{item.telephonicCalling || "-"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDetail(item.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-2 mt-5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage}
          </span>

          <button
            disabled={startIndex + rowsPerPage >= filteredSubmissions.length}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Top Recurring Issues</h2>
        <div className="space-y-4">
          {(data?.topIssues || []).length === 0 ? (
            <p className="text-sm text-slate-400">No recurring issues found</p>
          ) : (
            (data?.topIssues || []).map((issue: any, index: number) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">
                    {formatReadableLabel(issue.label)}
                  </span>
                  <span className="text-sm font-semibold text-red-500">{issue.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(issue.count * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-slate-800">
                Checklist Detail View
              </h2>
              <button
                onClick={() => {
                  setSelectedId(null)
                  setDetail(null)
                  setCommentText("")
                }}
                className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6">Loading details...</div>
            ) : detail ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <p className="text-xs text-slate-500">Supervisor</p>
                    <p className="font-semibold">{detail.supervisorName}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-semibold">{detail.date}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="font-semibold">{detail.time || "-"}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <p className="text-xs text-slate-500">Site</p>
                    <p className="font-semibold">{detail.site}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs text-slate-500">Site Visit Conducted</p>
                    <p className="font-medium">{detail.siteVisitConducted || "-"}</p>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs text-slate-500">Site Visit Reason</p>
                    <p className="font-medium">{detail.siteVisitReason || "-"}</p>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs text-slate-500">Telephonic Calling</p>
                    <p className="font-medium">{detail.telephonicCalling || "-"}</p>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs text-slate-500">Telephonic Site / Incharge</p>
                    <p className="font-medium">
                      {detail.telephonicSiteName || "-"} / {detail.telephonicIncharge || "-"}
                    </p>
                  </div>
                </div>

                {["Communication", "Site Visit", "Telephonic", "Store", "Basic Details"].map(
                  (section) => {
                    const sectionAnswers = detail.answers.filter(
                      (a) => a.sectionName === section
                    )

                    if (sectionAnswers.length === 0) return null

                    return (
                      <div key={section} className="rounded-2xl border overflow-hidden">
                        <div className="px-4 py-3 bg-slate-100 font-semibold text-slate-800">
                          {section}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="p-3 text-left">Question</th>
                                <th className="p-3 text-left">Answer</th>
                                <th className="p-3 text-left">Reason</th>
                                <th className="p-3 text-left">Context</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sectionAnswers.map((ans) => (
                                <tr key={ans.id} className="border-t">
                                  <td className="p-3">{formatReadableLabel(ans.questionText)}</td>
                                  <td className="p-3 font-medium">{ans.answerValue || "-"}</td>
                                  <td className="p-3">{ans.answerReason || "-"}</td>
                                  <td className="p-3">{ans.siteContext || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  }
                )}

                <div className="rounded-2xl border overflow-hidden">
                  <div className="px-4 py-3 bg-slate-100 font-semibold text-slate-800 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Discussion Thread
                  </div>

                  <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto bg-slate-50">
                    {(detail.comments || []).length === 0 ? (
                      <p className="text-sm text-slate-400">No discussion yet</p>
                    ) : (
                      detail.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-xl border ${comment.authorRole === "admin"
                            ? "bg-red-50 border-red-200"
                            : "bg-blue-50 border-blue-200"
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {comment.authorName} ({comment.authorRole})
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {comment.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t bg-white">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write question / remark for supervisor..."
                      className="w-full min-h-[100px] border rounded-xl p-3 text-sm"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleSendComment}
                        disabled={sendingComment || !commentText.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingComment ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">No detail found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}