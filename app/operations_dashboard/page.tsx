"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  AlertTriangle,
  Phone,
  Eye,
  X,
  Search,
  MessageSquare,
  Send,
  Bell,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

type RecentSubmission = {
  id: string
  supervisorName: string
  date: string
  time: string
  site: string
  issueTags?: string[]
  siteVisitConducted: string
  telephonicCalling: string

  // ✅ ADD THESE
  siteVisitScore?: number | null
  telephonicScore?: number | null
  storeScore?: number | null
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

  // ✅ ADD THESE
  communicationScore?: number | null
  siteVisitScore?: number | null
  telephonicScore?: number | null
  storeScore?: number | null
  score: number

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
  hint,
  active,
  onClick,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  hint?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border p-4 shadow-sm hover:shadow-lg transition-all w-full
    ${active ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {label}
          </p>

          <p className="text-2xl font-semibold mt-1 text-slate-900">
            {value}
          </p>

          {hint && (
            <p className="text-xs text-slate-400 mt-1">
              {hint}
            </p>
          )}
        </div>

        {/* RIGHT ICON */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>

      </div>
    </button>
  )
}

const BAR_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#10b981", // green
  "#f59e0b", // amber
]
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

function getCardTitle(card: "all" | "with_issues" | "clean" | "affected_sites") {
  if (card === "with_issues") return "Visits With Issues"
  if (card === "clean") return "Clean Visits"
  if (card === "affected_sites") return "Affected Sites"
  return "Total Visits"
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [cardAnalyticsOpen, setCardAnalyticsOpen] = useState(false)

  const [siteFilter, setSiteFilter] = useState("All")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [supervisorFilter, setSupervisorFilter] = useState("All")
  const [search, setSearch] = useState("")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [sendingComment, setSendingComment] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)

  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)

  const [issueDetailOpen, setIssueDetailOpen] = useState(false)

  const [selectedCard, setSelectedCard] = useState<
    "all" | "with_issues" | "clean" | "affected_sites"
  >("all")





  const router = useRouter()

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")

    if (!storedUser) {
      router.replace("/login") // IMPORTANT: use replace
    }
  }, [])

  async function loadNotifications() {
    const storedUser = sessionStorage.getItem("user")
    const user = storedUser ? JSON.parse(storedUser) : null

    if (!user?.name) return

    try {
      // 🔔 Bell (user-specific)
      const res = await fetch(`/api/checklist/admin-notification`)
      const result = await res.json()

      if (result.success) {
        setUnreadCount(result.unreadCount || 0)
      }

      // 💬 Latest Discussion (global)
      const res2 = await fetch(`/api/checklist/all-notifications`)
      const result2 = await res2.json()

      if (result2.success) {
        setNotifications(result2.notifications || [])
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
        const res = await fetch("/api/dashboard", {

          cache: "no-store"
        })

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
          cache: "no-store",
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
        cache: "no-store",
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

  const baseFilteredSubmissions: RecentSubmission[] = useMemo(() => {
    if (!data?.recentSubmissions) return []

    return data.recentSubmissions.filter((item: RecentSubmission) => {
      const itemOnlyDate = item.date

      const fromMatch = fromDate ? itemOnlyDate >= fromDate : true
      const toMatch = toDate ? itemOnlyDate <= toDate : true

      const matchSite = siteFilter === "All" || item.site === siteFilter
      const matchSupervisor =
        supervisorFilter === "All" || item.supervisorName === supervisorFilter

      const matchSearch =
        !search ||
        item.site.toLowerCase().includes(search.toLowerCase()) ||
        item.supervisorName.toLowerCase().includes(search.toLowerCase())

      return (
        fromMatch &&
        toMatch &&
        matchSite &&
        matchSupervisor &&
        matchSearch
      )
    })
  }, [data, fromDate, toDate, siteFilter, supervisorFilter, search])



  const customIssues = data?.topIssues || []


  const filteredSubmissions: RecentSubmission[] = useMemo(() => {
    if (!baseFilteredSubmissions.length) return []

    return baseFilteredSubmissions.filter((item) => {
      if (!selectedIssue) return true

      const tags = item.issueTags || []
      return tags.includes(selectedIssue)
    })
  }, [baseFilteredSubmissions, selectedIssue])



  const cardAnalyticsData = useMemo(() => {
    let related: RecentSubmission[] = []

    switch (selectedCard) {
      case "with_issues":
        related = filteredSubmissions.filter((s) => (s.issueTags?.length || 0) > 0)
        break

      case "clean":
        related = filteredSubmissions.filter((s) => (s.issueTags?.length || 0) === 0)
        break

      case "affected_sites": {
        const affected = new Set(
          filteredSubmissions
            .filter((s) => (s.issueTags?.length || 0) > 0)
            .map((s) => s.site)
        )
        related = filteredSubmissions.filter((s) => affected.has(s.site))
        break
      }

      case "all":
      default:
        related = filteredSubmissions
        break
    }

    const siteMap: Record<string, number> = {}
    const supervisorMap: Record<string, number> = {}

    related.forEach((item) => {
      siteMap[item.site] = (siteMap[item.site] || 0) + 1
      supervisorMap[item.supervisorName] = (supervisorMap[item.supervisorName] || 0) + 1
    })



    return {
      total: related.length,
      sites: Object.entries(siteMap)
        .map(([site, count]) => ({ site, count }))
        .sort((a, b) => b.count - a.count),
      supervisors: Object.entries(supervisorMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      recent: related.slice(0, 5),
    }
  }, [filteredSubmissions, selectedCard])

  const cardFilteredSubmissions = useMemo(() => {
    switch (selectedCard) {
      case "with_issues":
        return filteredSubmissions.filter((s) => (s.issueTags?.length || 0) > 0)

      case "clean":
        return filteredSubmissions.filter((s) => (s.issueTags?.length || 0) === 0)

      case "affected_sites": {
        const affected = new Set(
          filteredSubmissions
            .filter((s) => (s.issueTags?.length || 0) > 0)
            .map((s) => s.site)
        )
        return filteredSubmissions.filter((s) => affected.has(s.site))
      }

      default:
        return filteredSubmissions
    }
  }, [filteredSubmissions, selectedCard])

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

  const issueBreakdown = useMemo(() => {
    if (!selectedIssue) return null

    const affected = filteredSubmissions.filter((item: any) => {
      const tags = item.issueTags || []
      return tags.includes(selectedIssue)
    })

    const siteMap: Record<string, number> = {}
    const supervisorMap: Record<string, number> = {}

    affected.forEach((item) => {
      siteMap[item.site] = (siteMap[item.site] || 0) + 1
      supervisorMap[item.supervisorName] =
        (supervisorMap[item.supervisorName] || 0) + 1
    })

    return {
      total: affected.length,
      sites: Object.entries(siteMap).map(([site, count]) => ({ site, count })),
      supervisors: Object.entries(supervisorMap).map(([name, count]) => ({
        name,
        count,
      })),
      recent: affected.slice(0, 5),
    }
  }, [selectedIssue, filteredSubmissions])

  const siteIssueData = useMemo(() => {
    if (!filteredSubmissions.length) return []

    const map: Record<string, { site: string; issue: string; count: number }> = {}

    filteredSubmissions.forEach((item) => {
      const tags = item.issueTags || []

      tags.forEach((issue) => {
        // 👉 filter if selectedIssue is applied
        if (selectedIssue && issue !== selectedIssue) return

        const key = `${item.site}-${issue}`

        if (!map[key]) {
          map[key] = {
            site: item.site,
            issue: issue,
            count: 0,
          }
        }

        map[key].count++
      })
    })

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) // top 6
  }, [filteredSubmissions, selectedIssue])

  const submissionsOverTime = useMemo(() => {
    const map: Record<string, number> = {}

    const today = new Date()
    const last7Days = new Date()
    last7Days.setDate(today.getDate() - 6)

    filteredSubmissions.forEach((item) => {
      const date = new Date(item.date)

      // ✅ FILTER LAST 7 DAYS ONLY
      if (date < last7Days || date > today) return

      const key = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })

      map[key] = (map[key] || 0) + 1
    })

    return Object.keys(map)
      .map((key) => {
        const [day, month] = key.split(" ")
        return {
          day: key,
          value: map[key],
          date: new Date(`${day} ${month} 2026`),
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [filteredSubmissions])

  const siteVisitCount = filteredSubmissions.filter(
    (s) => s.siteVisitConducted === "Yes"
  ).length

  const telephonicCount = filteredSubmissions.filter(
    (s) => s.siteVisitConducted !== "Yes" && s.telephonicCalling === "Yes"
  ).length

  const visitTypeData = [
    { name: "Site Visit", value: siteVisitCount },
    { name: "Telephonic", value: telephonicCount },
  ]


  const [issuePage, setIssuePage] = useState(0)
  const ITEMS_PER_PAGE = 4

  const topIssuesData = useMemo(() => {
    return (customIssues || []).map((i: any) => ({
      name: formatReadableLabel(i.label),
      value: i.count,
    }))
  }, [customIssues])

  const paginatedIssues = useMemo(() => {
    const start = issuePage * ITEMS_PER_PAGE
    return topIssuesData.slice(start, start + ITEMS_PER_PAGE)
  }, [topIssuesData, issuePage])

  const totalForms = filteredSubmissions.length




  const sitesWithIssuesCount = new Set(
    filteredSubmissions
      .filter((s) => (s.issueTags?.length || 0) > 0)
      .map((s) => s.site)
  ).size

  const maxIssue = Math.max(
    ...customIssues.map((i: any) => i.count),
    1
  )
  useEffect(() => {
    setCurrentPage(1)
  }, [siteFilter, fromDate, toDate, selectedCard, selectedIssue, supervisorFilter, search])

  useEffect(() => {
    setIssuePage(0)
  }, [topIssuesData])

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props

    const words = payload.value.split(" ")
    const mid = Math.ceil(words.length / 2)

    const line1 = words.slice(0, mid).join(" ")
    const line2 = words.slice(mid).join(" ")

    return (
      <g transform={`translate(${x},${y + 10})`}> {/* 👈 push text down */}
        <text textAnchor="middle" fill="#64748b" fontSize={12}>
          <tspan x="0" dy="0">{line1}</tspan>
          {line2 && <tspan x="0" dy="16">{line2}</tspan>} {/* 👈 more spacing */}
        </text>
      </g>
    )
  }


  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }
  function clearFilters() {
    setSiteFilter("All")
    setSupervisorFilter("All")
    setFromDate("")
    setToDate("")
    setSearch("")
    setSelectedIssue(null)
    setSelectedCard("all")
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Checklist Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Monitor checklist performance, recurring operational issues, supervisor quality, and action areas.
          </p>
        </div>

        <div className="flex items-center gap-3 text-slate-500 relative notification-wrapper self-start">
          <button
            onClick={() => setNotificationOpen((prev) => !prev)}
            className="relative w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
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
                            cache: "no-store",
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
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

      <div className="bg-white rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            placeholder="Search site"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-3 rounded-xl border"
          />
        </div>

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



        <button
          onClick={clearFilters}
          className="h-11 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition text-sm font-medium"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <KpiCard
          label="Total Form Submit"
          value={totalForms}
          icon={ClipboardList}
          color="bg-indigo-600"
          hint="All submitted checklists"
        />

        <KpiCard
          label="Site Visit / Telephonic"
          value={`${siteVisitCount} / ${telephonicCount}`}
          icon={Phone}
          color="bg-amber-500"
          hint="Physical vs remote audits"
        />

        <KpiCard
          label="Sites With Issues"
          value={sitesWithIssuesCount}
          icon={AlertTriangle}
          color="bg-red-500"
          hint="Unique sites affected"
        />

        <KpiCard
          label="Total Issues"
          value={customIssues.reduce((sum: number, i: any) => sum + i.count, 0)}
          icon={MessageSquare}
          color="bg-purple-600"
          hint="All reported issues"
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* 📈 LINE CHART */}
        <div className="bg-white rounded-2xl border p-5 h-full flex flex-col">
          <h3 className="font-semibold text-slate-800">Submissions Over Time</h3>
          <p className="text-xs text-slate-500 mb-3">Last 7 days</p>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={submissionsOverTime} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={50}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, "dataMax + 1"]}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={4}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🥧 PIE CHART */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold text-slate-800">Visit Type Breakdown</h3>
          <p className="text-xs text-slate-500 mb-3">Share of submissions</p>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={visitTypeData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={65}
              >
                <Cell fill="#4f46e5" />
                <Cell fill="#06b6d4" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="text-sm mt-2 space-y-1">
            <p>Site Visit: <b>{siteVisitCount}</b></p>
            <p>Telephonic: <b>{telephonicCount}</b></p>
          </div>
        </div>
        {/* </div> */}

        <div className="bg-white rounded-2xl border p-5 flex flex-col">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Top Issues</h3>
              <p className="text-xs text-slate-500">By category</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIssuePage((p) => Math.max(p - 1, 0))}
                disabled={issuePage === 0}
                className="w-8 h-8 rounded-lg border bg-white disabled:opacity-40"
              >
                ←
              </button>

              <span className="text-xs text-slate-400">
                {topIssuesData.length === 0
                  ? "0 / 0"
                  : `${issuePage + 1} / ${Math.ceil(topIssuesData.length / ITEMS_PER_PAGE)}`
                }
              </span>

              <button
                onClick={() =>
                  setIssuePage((p) =>
                    (p + 1) * ITEMS_PER_PAGE < topIssuesData.length ? p + 1 : p
                  )
                }
                disabled={(issuePage + 1) * ITEMS_PER_PAGE >= topIssuesData.length}
                className="w-8 h-8 rounded-lg border bg-white disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>

          {/* CHART */}
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={issuePage}
                data={paginatedIssues}
                margin={{ top: 20, right: 20, left: 0, bottom: 60 }} // 👈 increase bottom
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  height={70}
                  tick={<CustomXAxisTick />}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {paginatedIssues.map((entry: { name: string; value: number }, index: number) => (
                    <Cell
                      key={entry.name}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 h-full flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3">
            Site Issues
          </h3>

          <p className="text-xs text-slate-500 mb-4">
            Sites with reported issues
          </p>

          {siteIssueData.length === 0 ? (
            <p className="text-sm text-slate-400">No issues found</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {siteIssueData.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex justify-between items-center">
                    {/* LEFT */}
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.site}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {formatReadableLabel(item.issue)}
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div className="text-sm font-bold text-red-500">
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5 flex flex-col h-[690px]">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} />
            <h3 className="font-semibold text-slate-800">Latest Discussion</h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400">No recent messages</p>
            ) : (
              notifications.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  onClick={() => openDetail(item.submissionId)}
                  className={`cursor-pointer p-3 rounded-xl border transition
            ${item.authorRole === "admin"
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.authorName} ({item.authorRole})
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                    {item.message}
                  </p>

                  <p className="text-xs text-indigo-600 mt-2">
                    Click to open conversation →
                  </p>
                </div>
              ))
            )}
          </div>
        </div>



        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Top Recurring Issues</h2>
              <p className="text-sm text-slate-500 mt-1">
                Click an issue to filter affected submissions
              </p>
            </div>

            {selectedIssue && (
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-xs px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Clear Filter
              </button>
            )}
          </div>

          {customIssues.length === 0 ? (
            <p className="text-sm text-slate-400">No recurring issues found</p>
          ) : (
            <div className="space-y-3">
              {customIssues.map((issue: any, index: number) => {
                const isActive = selectedIssue === issue.label

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedIssue(issue.label)
                      setIssueDetailOpen(true)
                    }}
                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-200
          ${isActive
                        ? "bg-slate-100 border-slate-300"
                        : "bg-white hover:bg-slate-50"
                      }
            `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {formatReadableLabel(issue.label)}
                      </span>

                      <span className="text-sm font-bold text-red-500">
                        {issue.count}
                      </span>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
                        style={{
                          width: `${(issue.count / maxIssue) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {
        cardAnalyticsOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    {getCardTitle(selectedCard)} Analysis
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Summary based on current filters
                  </p>
                </div>

                <button
                  onClick={() => setCardAnalyticsOpen(false)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-500 rounded-lg"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <p className="text-xs text-slate-500">Total Records</p>
                  <p className="text-2xl font-bold text-slate-800">{cardAnalyticsData.total}</p>
                </div>

                <div className="p-4 bg-slate-100 rounded-xl border">
                  <p className="text-xs text-slate-500">Unique Sites</p>
                  <p className="text-2xl font-bold text-indigo-700">{cardAnalyticsData.sites.length}</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-500">Supervisors Involved</p>
                  <p className="text-2xl font-bold text-amber-700">{cardAnalyticsData.supervisors.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-slate-800 mb-3">Site Breakdown</h3>
                  <div className="space-y-2">
                    {cardAnalyticsData.sites.length === 0 ? (
                      <p className="text-sm text-slate-400">No site data</p>
                    ) : (
                      cardAnalyticsData.sites.slice(0, 8).map((item) => (
                        <div
                          key={item.site}
                          className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg border"
                        >
                          <span>{item.site}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-800 mb-3">Supervisor Breakdown</h3>
                  <div className="space-y-2">
                    {cardAnalyticsData.supervisors.length === 0 ? (
                      <p className="text-sm text-slate-400">No supervisor data</p>
                    ) : (
                      cardAnalyticsData.supervisors.slice(0, 8).map((item) => (
                        <div
                          key={item.name}
                          className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg border"
                        >
                          <span>{item.name}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">Latest Activity</h3>
                    <p className="text-sm text-slate-500">Recent comments & updates</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 mb-3">Recent Records</h3>
                  <div className="space-y-2">
                    {cardAnalyticsData.recent.length === 0 ? (
                      <p className="text-sm text-slate-400">No recent records</p>
                    ) : (
                      cardAnalyticsData.recent.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg hover:bg-slate-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.site}</p>
                            <p className="text-xs text-slate-500">
                              {item.date} • {item.supervisorName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                              {item.siteVisitConducted === "Yes"
                                ? "Physical Visit"
                                : item.telephonicCalling === "Yes"
                                  ? "Remote Audit"
                                  : "Visit Pending"}
                            </span>

                            <button
                              onClick={() => openDetail(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>


              </div>



              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCardAnalyticsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    setCardAnalyticsOpen(false)
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  View Filtered Table
                </button>
              </div>
            </div>
          </div>
        )
      }






      {
        selectedId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border">
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
                <div className="p-6 space-y-6 pb-24">
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

                    {/* ✅ SHOW ONLY WHEN YES */}
                    {detail.siteVisitConducted === "Yes" && (
                      <div className="p-4 rounded-xl border">
                        <p className="text-xs text-slate-500">Site Name</p>
                        <p className="font-medium">{detail.site || "-"}</p>
                      </div>
                    )}

                    {/* ✅ SHOW ONLY WHEN NO */}
                    {detail.siteVisitConducted !== "Yes" && (
                      <div className="p-4 rounded-xl border">
                        <p className="text-xs text-slate-500">Reason</p>
                        <p className="font-medium">{detail.siteVisitReason || "-"}</p>
                      </div>
                    )}
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
                                </tr>
                              </thead>
                              <tbody>
                                {sectionAnswers.map((ans) => (
                                  <tr key={ans.id} className="border-t">
                                    <td className="p-3">
                                      {ans.questionText || "-"}
                                    </td>
                                    <td className="p-3 font-medium">{ans.answerValue || "-"}</td>
                                    <td className="p-3">{ans.answerReason || "-"}</td>
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
                              : "bg-slate-100 border-slate-200"
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
        )
      }
      {
        issueDetailOpen && selectedIssue && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border p-6 space-y-6">

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Issue Analysis
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">

                    {selectedIssue}
                  </p>
                </div>

                <button
                  onClick={() => setIssueDetailOpen(false)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-500 rounded-lg"
                >
                  Close
                </button>
              </div>

              {/* SUMMARY */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-xs text-slate-500">Total Cases</p>
                  <p className="text-xl font-bold">{issueBreakdown?.total || 0}</p>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-xs text-slate-500">Affected Sites</p>
                  <p className="text-xl font-bold">{issueBreakdown?.sites.length || 0}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-xs text-slate-500">Supervisors Involved</p>
                  <p className="text-xl font-bold">{issueBreakdown?.supervisors.length || 0}</p>
                </div>
              </div>

              {/* TOP SITES */}
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Top Affected Sites</h3>
                <div className="space-y-2">
                  {issueBreakdown?.sites.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg">
                      <span>{s.site}</span>
                      <span className="font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP SUPERVISORS */}
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Responsible Supervisors</h3>
                <div className="space-y-2">
                  {issueBreakdown?.supervisors.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg">
                      <span>{s.name}</span>
                      <span className="font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT CASES */}
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Recent Cases</h3>
                <div className="space-y-2">
                  {issueBreakdown?.recent.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => openDetail(item.id)}
                      className="cursor-pointer p-3 border rounded-lg hover:bg-slate-50 text-sm"
                    >
                      <div className="flex justify-between">
                        <span>{item.site}</span>
                        <span className="font-semibold">
                          {item.siteVisitConducted === "Yes"
                            ? "Visited"
                            : item.telephonicCalling === "Yes"
                              ? "Telephonic"
                              : "Telephonic"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.supervisorName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )
      }
    </div >
  )
}