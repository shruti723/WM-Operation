"use client"

import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Legend, ResponsiveContainer
} from "recharts"

export default function Charts({ stats }: any) {

    // ✅ Dynamic Pie Data
    const pieData = [
        { name: "Completed", value: stats.completed },
        { name: "Pending", value: stats.pending },
        { name: "Overdue", value: stats.overdue },
    ]

    const COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

    // ✅ Simple Bar (overall view)
    const barData = [
        {
            name: "Sites",
            completed: stats.completed,
            pending: stats.pending,
            overdue: stats.overdue
        }
    ]

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">

            {/* 🔵 PIE CHART */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="font-semibold mb-4 text-gray-700">
                    Status Overview
                </h2>

                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={50} // 🔥 donut style (premium look)
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* 🟡 BAR CHART */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="font-semibold mb-4 text-gray-700">
                    Overall Performance
                </h2>

                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />

                        <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="overdue" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    )
}