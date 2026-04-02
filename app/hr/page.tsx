"use client"
import { useEffect, useState } from "react"
import StatCard from "@/components/hr/StatCard"
import DashboardTable from "@/components/hr/DashboardTable"
import Charts from "@/components/hr/Charts"

import {
  FileText, ClipboardList, Clock, AlertTriangle, CheckCircle
} from "lucide-react"

export default function HRDashboard() {

  // ✅ MOVE INSIDE COMPONENT
  const [stats, setStats] = useState({
    totalSites: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
    completed: 0
  })

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/hr/dashboard")
        const data = await res.json()

        console.log("DASHBOARD API:", data)

        setStats(data)

      } catch (err) {
        console.error("Dashboard error:", err)
      }
    }

    loadDashboard()
  }, [])

  return (
    <div>

      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Overview of all sites and form submissions
      </p>

      <div className="grid md:grid-cols-5 gap-4">

        <StatCard title="Total Sites" value={stats.totalSites} icon={ClipboardList} color="blue" />

        <StatCard title="Forms Submitted" value={stats.submitted} icon={FileText} color="blue" />

        <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />

        <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} color="red" />

        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="green" />

      </div>

      <Charts stats={stats} />
      <DashboardTable />

    </div>
  )
}