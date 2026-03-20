"use client"

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

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
  }, [])

  const allData = data.allData || []

  // =====================
  // FILTER
  // =====================
  const filtered = allData.filter((d: any) => {
    if (!d.date) return false

    const diff =
      (Date.now() - new Date(d.date).getTime()) /
      (1000 * 60 * 60 * 24)

    return diff <= Number(range) &&
      (site === "all" || d.site_name === site)
  })

  // =====================
  // SITES
  // =====================
  const sites = Array.from(
    new Set(allData.map((d: any) => d.site_name).filter(Boolean))
  )

  // =====================
  // SCORE
  // =====================
  function score(item: any) {
    let total = 0,
      good = 0

    Object.values(item).forEach((v: any) => {
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
    dailyMap[d.date] = (dailyMap[d.date] || 0) + score(d)
  })

  const dailyData = Object.keys(dailyMap).map((d) => ({
    date: d,
    count: dailyMap[d],
  }))

  // =====================
  // SITE PERFORMANCE
  // =====================
  const siteMap: any = {}

  allData.forEach((d: any) => {
    if (!d.site_name) return
    if (!siteMap[d.site_name]) siteMap[d.site_name] = []
    siteMap[d.site_name].push(score(d))
  })

  const siteData = Object.keys(siteMap).map((s) => ({
    site: s,
    score: Math.round(
      siteMap[s].reduce((a: any, b: any) => a + b, 0) /
      siteMap[s].length
    ),
  }))

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
    <div className="p-6 space-y-6">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Overview</h1>

        <div className="flex gap-4">
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((s: any) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]">
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

      {/* 🔥 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><h2 className="text-3xl">{avgScore}%</h2><p>Score</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><h2 className="text-3xl">{filtered.length}</h2><p>Submissions</p></CardContent></Card>
      </div>

      {/* 🔥 CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <CardTitle>Daily Trend</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="count" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <CardTitle>Site Performance</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={siteData}>
              <XAxis dataKey="site" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 🔥 ISSUES */}
      <Card className="p-4">
        <CardTitle>Top Issues</CardTitle>
        {topIssues.map((i, index) => (
          <div key={index} className="flex justify-between py-2 border-b">
            <span>{i.question}</span>
            <span className="text-red-500">{i.issues}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}