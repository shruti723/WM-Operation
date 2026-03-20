"use client"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

export default function DashboardOverview() {
  const [data, setData] = useState<any>({})
  const [site, setSite] = useState("all")
  const [range, setRange] = useState("7")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        setData(res)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading dashboard...
      </div>
    )
  }

  const allData = data.allData || []

  // =====================
  // FILTER
  // =====================
  const filtered = allData.filter((d: any) => {
    if (!d.date) return false

    const parsedDate = new Date(d.date)

    if (isNaN(parsedDate.getTime())) return false

    const diff =
      (Date.now() - parsedDate.getTime()) /
      (1000 * 60 * 60 * 24)

    return diff <= Number(range) &&
      (site === "all" || d.site === site)
  })

  // =====================
  // SITES
  // =====================
  const sites = Array.from(
    new Set(allData.map((d: any) => d.site).filter(Boolean))
  )

  function getStatus(score: number) {
    if (score >= 80) return "good"
    if (score >= 50) return "average"
    return "critical"
  }

  // =====================
  // SCORE
  // =====================
  function score(item: any) {
    let total = 0, good = 0

    Object.entries(item).forEach(([key, v]: any) => {
      if (key.toLowerCase().includes("reason")) return

      if (["Yes", "No"].includes(v)) {
        total++
        if (v === "Yes") good++
      }

      if (["Good", "Satisfactory", "Poor"].includes(v)) {
        total++
        if (v === "Good") good++
      }
    })

    return total ? Math.round((good / total) * 100) : 0
  }
  // =====================
  // EXTRA INSIGHTS (FIXED)
  // =====================

  // 1. Site Visit
  const siteVisitCount = filtered.filter(
    (d: any) => d.site_visit === "Yes"
  ).length

  // 2. Telephonic
  const telephonicCount = filtered.filter(
    (d: any) => d.telephonic_calling === "Yes"
  ).length

  // 3. Repeat Complaint
  const totalRepeat = filtered.filter(
    (d: any) => d.repeat_complaint === "Yes"
  ).length

  // 4. Urgent Issue (CORRECT FIELD)
  const urgentIssues = filtered.filter(
    (d: any) =>
      d.urgent_issue === "Yes"
  ).length

  // 5. Manpower Shortage (CORRECT FIELD)
  const manpowerIssues = filtered.filter(
    (d: any) =>
      d.manpower_issue === "Yes"
  )


  // =====================
  // KPIs
  // =====================
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((a: any, b: any) => a + score(b), 0) / filtered.length)
    : 0

  // =====================
  // DAILY TREND
  // =====================
  const dailyMap: any = {}

  filtered.forEach((d: any) => {
    if (!d.date) return

    if (!dailyMap[d.date]) {
      dailyMap[d.date] = { total: 0, count: 0 }
    }

    dailyMap[d.date].total += score(d)
    dailyMap[d.date].count += 1
  })

  const dailyData = Object.keys(dailyMap)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((d) => ({
      date: d,
      count: Math.round(dailyMap[d].total / dailyMap[d].count),
    }))

  // =====================
  // SITE PERFORMANCE
  // =====================
  const siteMap: any = {}

  allData.forEach((d: any) => {
    const site = d.site
    if (!site) return

    if (!siteMap[site]) siteMap[site] = []
    siteMap[site].push(score(d))
  })

  const siteData = Object.keys(siteMap).map((s) => ({
    site: s,
    score: Math.round(
      siteMap[s].reduce((a: any, b: any) => a + b, 0) /
      siteMap[s].length
    ),
  }))

  // 6. Top Performing Site
  const rankedSites = [...siteData].sort((a, b) => b.score - a.score)
  const topSite = rankedSites[0]
  const worstSite = rankedSites[rankedSites.length - 1]

  // =====================
  // ISSUES
  // =====================
  const issueMap: any = {}

  filtered.forEach((d: any) => {
    Object.entries(d).forEach(([key, value]) => {
      if (value === "No" || value === "Poor") {
        issueMap[key] = (issueMap[key] || 0) + 1
      }
    })
  })

  const topIssues = Object.keys(issueMap)
    .map((k) => ({
      question: k,
      issues: issueMap[k],
    }))
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 3)

  // =====================
  // UI
  // =====================
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen max-w-7xl mx-auto">

      {/* 🔥 HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">
            Monitor performance, trends & issues
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">

          <input type="date" className="border rounded px-3 py-2 text-sm" />
          <span className="text-gray-500">to</span>
          <input type="date" className="border rounded px-3 py-2 text-sm" />

          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow">
            Show Performance
          </button>

          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((s: any) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px] bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 🔥 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Total Submissions</p>
          <h2 className="text-2xl font-bold">{filtered.length}</h2>
        </Card>

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Avg Score</p>
          <h2 className="text-2xl font-bold">{avgScore}%</h2>
          <Progress value={avgScore} className="mt-2" />
        </Card>

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Site Visits</p>
          <h2 className="text-2xl font-bold">{siteVisitCount}</h2>
        </Card>

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Repeat Complaints</p>
          <h2 className="text-2xl font-bold">{totalRepeat}</h2>
        </Card>

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Urgent Issues</p>
          <h2 className="text-2xl font-bold text-red-600">{urgentIssues}</h2>
        </Card>

        <Card className="p-5 border rounded-xl shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500">Outstation Calls</p>
          <h2 className="text-2xl font-bold">{telephonicCount}</h2>
        </Card>

      </div>


      {worstSite && worstSite.score < 50 && (
        <Card className="p-4 bg-red-100 border border-red-300">
          <p className="text-red-700 font-semibold">
            ⚠️ Critical Alert: {worstSite.site} needs immediate attention ({worstSite.score}%)
          </p>
        </Card>
      )}

      {/* 🔥 CHARTS */}
      {/* 🔥 CHARTS - ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TABLE */}
        <Card className="p-5 rounded-xl shadow-sm border">
          <CardTitle className="mb-4 text-lg font-semibold">Recent Activity</CardTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3 text-left">Site</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.slice(0, 5).map((d: any, i: number) => {
                  const s = score(d)
                  return (
                    <tr key={i} className="border-b">
                      <td className="py-2">{d.site}</td>
                      <td>{d.date}</td>
                      <td>{s}%</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-white ${s > 80 ? "bg-green-500" :
                          s > 50 ? "bg-yellow-500" :
                            "bg-red-500"
                          }`}>
                          {getStatus(s)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* DAILY TREND */}
        <Card className="p-5 rounded-xl shadow-sm border">
          <CardTitle className="mb-4 text-lg font-semibold">
            Daily Performance Trend
          </CardTitle>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <XAxis dataKey="date" stroke="#888" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* 🔥 CHARTS - ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SITE PERFORMANCE */}
        <Card className="p-5 rounded-xl shadow-sm border">
          <CardTitle className="mb-4 text-lg font-semibold">
            Site Performance
          </CardTitle>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={siteData}>
              <XAxis dataKey="site" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ✅ ADD THIS NEW CARD */}
        <Card className="p-5 rounded-xl shadow-sm border">
          <CardTitle>Performance Summary</CardTitle>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span>Best Site</span>
              <span className="text-green-600 font-semibold">
                {topSite?.site || "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Worst Site</span>
              <span className="text-red-600 font-semibold">
                {worstSite?.site || "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Urgent Issues</span>
              <span className="text-red-500 font-semibold">
                {urgentIssues}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Avg Score</span>
              <span className="font-semibold">{avgScore}%</span>
            </div>

          </div>
        </Card>

      </div>

      {/* 🔥 SITE HIGHLIGHTS */}
      <div className="grid md:grid-cols-2 gap-4">

        <Card className="p-5 rounded-2xl bg-green-50 border border-green-200">
          <CardTitle>🏆 Best Performing Site</CardTitle>
          {topSite ? (
            <div className="mt-3">
              <p className="text-lg font-bold">{topSite.site}</p>
              <p
                className={`font-semibold ${getStatus(topSite.score) === "good"
                  ? "text-green-600"
                  : getStatus(topSite.score) === "average"
                    ? "text-yellow-600"
                    : "text-red-600"
                  }`}
              >
                {topSite.score}% ({getStatus(topSite.score)})
              </p>
            </div>
          ) : <p>No Data</p>}
        </Card>

        <Card className="p-5 rounded-2xl bg-red-50 border border-red-200">
          <CardTitle>⚠️ Needs Attention</CardTitle>
          {worstSite ? (
            <div className="mt-3">
              <p className="text-lg font-bold">{worstSite.site}</p>
              <p className="text-red-600 font-semibold">{worstSite.score}% Score</p>
            </div>
          ) : <p>No Data</p>}
        </Card>

      </div>


      {/* 🔥 MANPOWER ISSUES */}
      <Card className="p-5 rounded-xl shadow-sm border hover:shadow-md transition">
        <CardTitle>👷 Manpower Shortage</CardTitle>

        <div className="mt-3 space-y-2">
          {manpowerIssues.map((d: any, i: number) => (
            <div key={i} className="flex justify-between bg-gray-100 p-3 rounded">
              <span>{d.site}</span>
              <span className="text-red-500 font-semibold">Issue</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 🔥 TOP ISSUES */}
      <Card className="p-5 rounded-xl shadow-sm border hover:shadow-md transition">
        <CardTitle className="mb-4 text-lg font-semibold">
          Top Issues 🚨
        </CardTitle>

        <div className="space-y-3">
          {topIssues.map((i, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-3 hover:bg-gray-200 transition"
            >
              <span className="text-sm font-medium">{i.question.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="text-red-600 font-bold">{i.issues}</span>
            </div>
          ))}
        </div>
      </Card>

    </div>
  )
}