// =============================
// ULTRA PREMIUM FULL SYSTEM
// Checklist + API + Dashboard (High-Tech)
// =============================

// =============================
// 1. DASHBOARD PAGE (FINAL ULTRA)
// =============================
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function UltraDashboard() {

  const [data, setData] = useState<any>({})
  const [site, setSite] = useState("all")
  const [range, setRange] = useState("7")
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData)
  }, [])



  const allData = data.allData || []
  function normalizeKey(key: string) {
    return key
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/[^a-z0-9]/g, "_")
  }

  const normalizedData = allData.map((row: any) => {
    let obj: any = {}

    Object.entries(row).forEach(([key, value]) => {
      obj[normalizeKey(key)] = value
    })

    return obj
  })



  // =====================
  // FILTER
  // =====================
  const filtered = normalizedData.filter((d: any) => {

    if (!d.date) return false

    const diff =
      (Date.now() - new Date(d.date).getTime()) /
      (1000 * 60 * 60 * 24)

    const withinRange = diff <= Number(range)

    const siteMatch =
      site === "all" || d.siteName === site

    return withinRange && siteMatch
  })

  // =====================
  // SITE LIST
  // =====================
  const sites = Array.from(
    new Set(
      allData
        .map((d: any) => d.siteName)
        .filter((s: string) => typeof s === "string")
    )
  ) as string[]

  // =====================
  // SCORE
  // =====================
  function score(item: any) {
    let total = 0, good = 0
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

  function riskScore(item: any) {
    let risk = 0

    if (item.safetyRisk === "Yes") risk += 30
    if (item.pendingEmails === "Yes") risk += 10
    if (item.shortageAffecting === "Yes") risk += 20
    if (Number(item.openIssues) > Number(item.issuesClosed)) risk += 20

    return Math.min(risk, 100)
  }

  // =====================
  // KPIs
  // =====================
  let totalEmails = 0, totalReplied = 0, pending = 0
  let present = 0, absent = 0
  let open = 0, closed = 0

  filtered.forEach((d: any) => {

    Object.entries(d).forEach(([key, value]) => {

      if (key.includes("received") && !isNaN(Number(value))) {
        totalEmails += Number(value)
      }

      if (key.includes("replied") && !isNaN(Number(value))) {
        totalReplied += Number(value)
      }

      if (key.includes("pending") && value === "Yes") {
        pending++
      }

      if (key.includes("present")) {
        present += Number(value || 0)
      }

      if (key.includes("absent")) {
        absent += Number(value || 0)
      }

      if (key.includes("open")) {
        open += Number(value || 0)
      }

      if (key.includes("closed")) {
        closed += Number(value || 0)
      }

    })

  })

  const replyRate = totalEmails ? Math.round((totalReplied / totalEmails) * 100) : 0
  const manpower = present + absent ? Math.round((present / (present + absent)) * 100) : 0
  const store = open + closed ? Math.round((closed / (open + closed)) * 100) : 0

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((a: any, b: any) => a + score(b), 0) / filtered.length)
    : 0

  const avgRisk = filtered.length
    ? Math.round(filtered.reduce((a: any, b: any) => a + riskScore(b), 0) / filtered.length)
    : 0

  // =====================
  // CHART DATA
  // =====================
  const dailyMap: any = {}
  filtered.forEach((d: any) => {
    if (!d.date) return
    dailyMap[d.date] = (dailyMap[d.date] || 0) + score(d)
  })

  const dailyData = Object.keys(dailyMap)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(d => ({ date: d, count: dailyMap[d] }))

  // =====================
  // SITE PERFORMANCE
  // =====================
  const siteMap: any = {}
  allData.forEach((d: any) => {
    if (!d.siteName) return
    if (!siteMap[d.siteName]) siteMap[d.siteName] = []
    siteMap[d.siteName].push(score(d))
  })

  const siteData = Object.keys(siteMap).map(s => ({
    site: s,
    score: Math.round(siteMap[s].reduce((a: any, b: any) => a + b, 0) / siteMap[s].length)
  }))

  const sortedSites = [...siteData].sort((a, b) => b.score - a.score)

  const bestSite = sortedSites[0]
  const worstSite = sortedSites[sortedSites.length - 1]


  const issueMap: any = {}

  filtered.forEach((d: any) => {
    Object.entries(d).forEach(([key, value]) => {
      if (value === "No" || value === "Poor") {
        issueMap[key] = (issueMap[key] || 0) + 1
      }
    })
  })

  const issueData = Object.keys(issueMap).map(k => ({
    question: formatLabel(k),
    issues: issueMap[k]
  }))

  const topIssues = issueData
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 3)

  // =====================
  // AI INSIGHTS
  // =====================
  let insightList: string[] = []

  if (avgScore < 60 && avgRisk > 50) {
    insightList.push("🚨 Critical: High risk + low performance")
  } else if (avgScore < 60) {
    insightList.push("⚠️ Performance needs improvement")
  }

  if (replyRate < 50) {
    insightList.push("📧 Communication response is poor")
  }

  if (manpower < 70) {
    insightList.push("👷 Staff shortage impacting operations")
  }

  if (store < 60) {
    insightList.push("📦 Store efficiency is low")
  }

  if (dailyData.length >= 2) {
    const last = dailyData[dailyData.length - 1].count
    const prev = dailyData[dailyData.length - 2].count

    if (last < prev) {
      insightList.push("📉 Submission trend decreasing")
    }
  }

  if (insightList.length === 0) {
    insightList.push("✅ All systems operating smoothly")
  }


  // =====================
  // UI
  // =====================
  function formatLabel(key: string) {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
  }
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* 🔥 SIDEBAR */}
      <div className="w-64 bg-white shadow-xl p-5 flex flex-col justify-between">

        <div>
          <h2 className="text-2xl font-bold mb-6">FM Panel</h2>

          <div className="space-y-2">
            {["Overview", "Communication", "Manpower", "Store", "Issues"].map((item) => (
              <div
                key={item}
                className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* LOGOUT */}
        <button className="mt-10 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">
          Logout
        </button>
      </div>

      {/* 🔥 MAIN */}
      <div className="flex-1 p-6 space-y-6">

        {/* 🔥 TOP BAR */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <div className="flex gap-4">
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger className="w-[180px] bg-white shadow">
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[150px] bg-white shadow">
                <SelectValue placeholder="Range" />
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Score", value: `${avgScore}%` },
            { label: "Risk", value: `${avgRisk}%` },
            { label: "Reply Rate", value: `${replyRate}%` },
            { label: "Manpower", value: `${manpower}%` },
            { label: "Store", value: `${store}%` },
          ].map((k, i) => (
            <Card
              key={i}
              className="backdrop-blur-lg bg-white/70 shadow-md hover:shadow-xl transition rounded-2xl"
            >
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold">{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 🔥 HIGHLIGHTS */}
        <div className="grid md:grid-cols-3 gap-4">

          <Card className="p-4 shadow-md rounded-2xl">
            <p className="text-sm text-gray-500">Top Site</p>
            <p className="text-xl font-bold text-green-600">{bestSite?.site}</p>
          </Card>

          <Card className="p-4 shadow-md rounded-2xl">
            <p className="text-sm text-gray-500">Needs Attention</p>
            <p className="text-xl font-bold text-red-500">{worstSite?.site}</p>
          </Card>

          <Card className="p-4 shadow-md rounded-2xl">
            <p className="text-sm text-gray-500">Submissions</p>
            <p className="text-xl font-bold">{filtered.length}</p>
          </Card>

        </div>

        {/* 🔥 CHARTS */}
        <div className="grid md:grid-cols-2 gap-4">

          <Card className="p-4 rounded-2xl shadow-md">
            <CardTitle>Daily Trend</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 rounded-2xl shadow-md">
            <CardTitle>Site Performance</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
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
        <Card className="p-4 rounded-2xl shadow-md">
          <CardTitle>Top Issues</CardTitle>

          {topIssues.map((t, i) => (
            <div key={i} className="flex justify-between border-b py-2">
              <span>{t.question}</span>
              <span className="text-red-500 font-bold">{t.issues}</span>
            </div>
          ))}
        </Card>

        {/* 🔥 AI INSIGHTS */}
        <Card className="p-4 rounded-2xl shadow-md">
          <CardTitle>AI Insights</CardTitle>

          {insightList.map((i, index) => (
            <p key={index} className="text-sm mt-1">{i}</p>
          ))}
        </Card>

      </div>
    </div>
  )
}

// =============================
// DONE: FULL ULTRA DASHBOARD
// =============================







// // =============================
// // ULTRA PREMIUM FULL SYSTEM
// // Checklist + API + Dashboard (High-Tech)
// // =============================

// // =============================
// // 1. DASHBOARD PAGE (FINAL ULTRA)
// // =============================
// "use client"

// import { useEffect, useState } from "react"
// import { Card, CardContent, CardTitle } from "@/components/ui/card"
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

// export default function UltraDashboard() {

//   const [data, setData] = useState<any>({})
//   const [site, setSite] = useState("all")
//   const [range, setRange] = useState("7")
//   const [selectedItem, setSelectedItem] = useState<any>(null)

//   useEffect(() => {
//     fetch("/api/dashboard")
//       .then(res => res.json())
//       .then(setData)
//   }, [])

//   const allData = data.allData || []

//   // =====================
//   // FILTER
//   // =====================
//   const filtered = allData.filter((d: any) => {

//     if (!d.date) return false

//     const diff =
//       (Date.now() - new Date(d.date).getTime()) /
//       (1000 * 60 * 60 * 24)

//     const withinRange = diff <= Number(range)

//     const siteMatch =
//       site === "all" || d.siteName === site

//     return withinRange && siteMatch
//   })

//   // =====================
//   // SITE LIST
//   // =====================
//   const sites = Array.from(
//     new Set(
//       allData
//         .map((d: any) => d.siteName)
//         .filter((s: string) => typeof s === "string")
//     )
//   ) as string[]

//   // =====================
//   // SCORE
//   // =====================
//   function score(item: any) {
//     let total = 0, good = 0
//     Object.values(item).forEach((v: any) => {
//       if (["Yes", "No"].includes(v)) {
//         total++
//         if (v === "Yes") good++
//       }
//       if (["Good", "Satisfactory", "Poor"].includes(v)) {
//         total++
//         if (v === "Good") good++
//       }
//     })
//     return total ? Math.round((good / total) * 100) : 0
//   }

//   function riskScore(item: any) {
//     let risk = 0

//     if (item.safetyRisk === "Yes") risk += 30
//     if (item.pendingEmails === "Yes") risk += 10
//     if (item.shortageAffecting === "Yes") risk += 20
//     if (Number(item.openIssues) > Number(item.issuesClosed)) risk += 20

//     return Math.min(risk, 100)
//   }

//   // =====================
//   // KPIs
//   // =====================
//   let totalEmails = 0, totalReplied = 0, pending = 0
//   let present = 0, absent = 0
//   let open = 0, closed = 0

//   filtered.forEach((d: any) => {
//     totalEmails += Number(d.emailsReceived || 0)
//     totalReplied += Number(d.emailsReplied || 0)
//     if (d.pendingEmails === "Yes") pending++

//     present += Number(d.staffPresent || d["Number of staff present today"] || 0)
//     absent += Number(d.staffAbsent || d["Number of staff absent"] || 0)

//     open += Number(d.openIssues || 0)
//     closed += Number(d.issuesClosed || 0)
//   })

//   const replyRate = totalEmails ? Math.round((totalReplied / totalEmails) * 100) : 0
//   const manpower = present + absent ? Math.round((present / (present + absent)) * 100) : 0
//   const store = open + closed ? Math.round((closed / (open + closed)) * 100) : 0

//   const avgScore = filtered.length
//     ? Math.round(filtered.reduce((a: any, b: any) => a + score(b), 0) / filtered.length)
//     : 0

//   const avgRisk = filtered.length
//     ? Math.round(filtered.reduce((a: any, b: any) => a + riskScore(b), 0) / filtered.length)
//     : 0

//   // =====================
//   // CHART DATA
//   // =====================
//   const dailyMap: any = {}
//   filtered.forEach((d: any) => {
//     if (!d.date) return
//     dailyMap[d.date] = (dailyMap[d.date] || 0) + score(d)
//   })

//   const dailyData = Object.keys(dailyMap)
//     .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
//     .map(d => ({ date: d, count: dailyMap[d] }))

//   // =====================
//   // SITE PERFORMANCE
//   // =====================
//   const siteMap: any = {}
//   allData.forEach((d: any) => {
//     if (!d.siteName) return
//     if (!siteMap[d.siteName]) siteMap[d.siteName] = []
//     siteMap[d.siteName].push(score(d))
//   })

//   const siteData = Object.keys(siteMap).map(s => ({
//     site: s,
//     score: Math.round(siteMap[s].reduce((a: any, b: any) => a + b, 0) / siteMap[s].length)
//   }))

//   const sortedSites = [...siteData].sort((a, b) => b.score - a.score)

//   const bestSite = sortedSites[0]
//   const worstSite = sortedSites[sortedSites.length - 1]


//   const issueMap: any = {}

//   filtered.forEach((d: any) => {
//     Object.entries(d).forEach(([key, value]) => {
//       if (value === "No" || value === "Poor") {
//         issueMap[key] = (issueMap[key] || 0) + 1
//       }
//     })
//   })

//   const issueData = Object.keys(issueMap).map(k => ({
//     question: formatLabel(k),
//     issues: issueMap[k]
//   }))

//   const topIssues = issueData
//     .sort((a, b) => b.issues - a.issues)
//     .slice(0, 3)

//   // =====================
//   // AI INSIGHTS
//   // =====================
//   let insightList: string[] = []

//   if (avgScore < 60 && avgRisk > 50) {
//     insightList.push("🚨 Critical: High risk + low performance")
//   } else if (avgScore < 60) {
//     insightList.push("⚠️ Performance needs improvement")
//   }

//   if (replyRate < 50) {
//     insightList.push("📧 Communication response is poor")
//   }

//   if (manpower < 70) {
//     insightList.push("👷 Staff shortage impacting operations")
//   }

//   if (store < 60) {
//     insightList.push("📦 Store efficiency is low")
//   }

//   if (dailyData.length >= 2) {
//     const last = dailyData[dailyData.length - 1].count
//     const prev = dailyData[dailyData.length - 2].count

//     if (last < prev) {
//       insightList.push("📉 Submission trend decreasing")
//     }
//   }

//   if (insightList.length === 0) {
//     insightList.push("✅ All systems operating smoothly")
//   }


//   // =====================
//   // UI
//   // =====================
//   function formatLabel(key: string) {
//     return key
//       .replace(/_/g, " ")
//       .replace(/([A-Z])/g, " $1")
//       .replace(/^./, (str) => str.toUpperCase())
//   }
//   return (
//     <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">

//       <h1 className="text-3xl font-bold tracking-tight">
//         FM Operations Dashboard
//       </h1>


//       <div className="flex gap-4">

//         {/* SITE FILTER */}
//         <Select value={site} onValueChange={setSite}>
//           <SelectTrigger className="w-[200px]">
//             <SelectValue placeholder="Select Site" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Sites</SelectItem>
//             {sites.map((s) => (
//               <SelectItem key={s} value={s}>
//                 {s}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         {/* DATE FILTER */}
//         <Select value={range} onValueChange={setRange}>
//           <SelectTrigger className="w-[150px]">
//             <SelectValue placeholder="Select Range" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="1">Today</SelectItem>
//             <SelectItem value="7">7 Days</SelectItem>
//             <SelectItem value="30">30 Days</SelectItem>
//           </SelectContent>
//         </Select>

//       </div>

//       {/* KPI */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[
//           { label: "Score", value: `${avgScore}%` },
//           { label: "Risk", value: `${avgRisk}%` },
//           { label: "Reply Rate", value: `${replyRate}%` },
//           { label: "Manpower", value: `${manpower}%` },
//           { label: "Store", value: `${store}%` },
//         ].map((k, i) => (
//           <Card key={i}><CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold">{k.value}</p>
//             <p className="text-xs text-gray-500">{k.label}</p>
//           </CardContent></Card>
//         ))}
//       </div>
//       <div className="grid md:grid-cols-2 gap-4">

//         <Card>
//           <CardContent className="p-4">
//             <p className="text-sm text-gray-500">Top Performing Site</p>
//             <p className="text-xl font-bold">{bestSite?.site}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <p className="text-sm text-gray-500">Needs Attention</p>
//             <p className="text-xl font-bold text-red-500">{worstSite?.site}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <CardTitle>Recent Submissions</CardTitle>

//             <div className="space-y-2 mt-3">
//               {filtered.slice(0, 5).map((item: any, i: number) => (
//                 <div
//                   key={i}
//                   className="flex justify-between items-center border p-2 rounded"
//                 >
//                   <div>
//                     <p className="font-medium">{item.siteName}</p>
//                     <p className="text-xs text-gray-500">{item.date}</p>
//                   </div>

//                   <button
//                     className="text-blue-600 text-sm"
//                     onClick={() => setSelectedItem(item)}
//                   >
//                     View Report
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//       </div>
//       {/* CHARTS */}
//       <div className="grid md:grid-cols-2 gap-4">
//         <Card><CardContent>
//           <CardTitle>Daily Trend</CardTitle>
//           <ResponsiveContainer width="100%" height={200}>
//             <LineChart data={dailyData}>
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Line dataKey="count" stroke="#3b82f6" />
//             </LineChart>
//           </ResponsiveContainer>
//         </CardContent></Card>

//         <Card><CardContent>
//           <CardTitle>Site Performance</CardTitle>
//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart data={siteData}>
//               <XAxis dataKey="site" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="score" fill="#22c55e" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent></Card>
//       </div>

//       <Card>
//         <CardContent>
//           <CardTitle>Communication Performance</CardTitle>

//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart data={[
//               { name: "Emails", value: totalEmails },
//               { name: "Replied", value: totalReplied },
//               { name: "Pending", value: pending }
//             ]}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="value" fill="#6366f1" />
//             </BarChart>
//           </ResponsiveContainer>

//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent>
//           <CardTitle>🔥 Problem Area Analysis</CardTitle>

//           <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={issueData}>
//               <XAxis dataKey="question" hide />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="issues" fill="#ef4444" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent>
//           <CardTitle>🧠 AI Root Cause</CardTitle>

//           {topIssues.map((t, i) => (
//             <p key={i}>• {t.question}</p>
//           ))}
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent>
//           <CardTitle>🏆 Site Ranking</CardTitle>

//           {sortedSites.map((s, i) => (
//             <div key={i} className="flex justify-between border-b py-2">
//               <span>{i + 1}. {s.site}</span>
//               <span className="font-semibold">{s.score}%</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* AI */}
//       <Card><CardContent>
//         <CardTitle>AI Insight</CardTitle>
//         {insightList.map((i, index) => (
//           <p key={index}>{i}</p>
//         ))}
//       </CardContent></Card>

//       {selectedItem && (
//         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
//           <div className="bg-white p-6 rounded-xl w-[800px] max-h-[90vh] overflow-y-auto">

//             <h2 className="text-xl font-bold mb-4">
//               {selectedItem.siteName} - Inspection Report
//             </h2>

//             {/* GROUPED SECTIONS */}

//             {/* COMMUNICATION */}
//             <div>
//               <h3 className="font-semibold text-lg mb-2">📧 Communication</h3>

//               {[
//                 "emailsReceived",
//                 "emailsReplied",
//                 "pendingEmails",
//                 "clientCalls",
//                 "followupCalls",
//                 "repeatComplaint",
//                 "complaintResolved"
//               ].map((key) => (
//                 <div
//                   key={key}
//                   className={`p-3 mb-2 rounded border ${selectedItem[key] === "No"
//                     ? "bg-red-50 border-red-300"
//                     : "bg-green-50 border-green-200"
//                     }`}
//                 >
//                   <p className="font-medium">{formatLabel(key)}</p>
//                   <div className="flex justify-between items-center p-3 mb-2 rounded border">
//                     <span>{formatLabel(key)}</span>

//                     <span className={`font-semibold ${selectedItem[key] === "Yes" || selectedItem[key] === "Good"
//                       ? "text-green-600"
//                       : "text-red-600"
//                       }`}>
//                       {selectedItem[key]}
//                     </span>
//                   </div>

//                   {selectedItem[`reason_${key}`] && selectedItem[key] === "No" && (
//                     <p className="text-xs text-gray-500">
//                       Reason: {selectedItem[`reason_${key}`]}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>

//             {/* MANPOWER */}
//             <div className="mt-4">
//               <h3 className="font-semibold text-lg mb-2">👷 Manpower</h3>

//               {[
//                 "sanctionedManpower",
//                 "staffPresent",
//                 "staffAbsent",
//                 "shortageAffecting"
//               ].map((key) => (
//                 <div
//                   key={key}
//                   className={`p-3 mb-2 rounded border ${selectedItem[key] === "Yes"
//                     ? "bg-red-50 border-red-300"
//                     : "bg-green-50 border-green-200"
//                     }`}
//                 >
//                   <p className="font-medium">{formatLabel(key)}</p>
//                   <p>{selectedItem[key]}</p>

//                   {selectedItem[`reason_${key}`] && selectedItem[key] === "Yes" && (
//                     <p className="text-xs text-gray-500">
//                       Reason: {selectedItem[`reason_${key}`]}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>

//             {/* STORE */}
//             <div className="mt-4">
//               <h3 className="font-semibold text-lg mb-2">📦 Store</h3>

//               {[
//                 "stockRegisterUpdated",
//                 "openIssues",
//                 "issuesClosed",
//                 "safetyRisk"
//               ].map((key) => (
//                 <div
//                   key={key}
//                   className={`p-3 mb-2 rounded border ${selectedItem[key] === "No" || selectedItem[key] === "Yes"
//                     ? "bg-red-50 border-red-300"
//                     : "bg-green-50 border-green-200"
//                     }`}
//                 >
//                   <p className="font-medium">{formatLabel(key)}</p>
//                   <p>{selectedItem[key]}</p>

//                   {selectedItem[`reason_${key}`] && (
//                     <p className="text-xs text-gray-500">
//                       Reason: {selectedItem[`reason_${key}`]}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>

//             <button
//               className="mt-4 bg-black text-white px-4 py-2 rounded"
//               onClick={() => setSelectedItem(null)}
//             >
//               Close
//             </button>

//           </div>
//         </div>
//       )}

//     </div>
//   )
// }

// // =============================
// // DONE: FULL ULTRA DASHBOARD
// // =============================









