"use client"

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
            <h1 className="text-2xl font-bold">HR Dashboard</h1>
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