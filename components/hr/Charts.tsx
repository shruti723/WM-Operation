"use client"

import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts"

export default function Charts() {

    const pieData = [
        { name: "Completed", value: 13 },
        { name: "Pending", value: 7 },
        { name: "Overdue", value: 4 },
    ]

    const COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

    const barData = [
        { name: "Alpha", completed: 3, pending: 1, overdue: 1 },
        { name: "Beta", completed: 2, pending: 2, overdue: 0 },
        { name: "Gamma", completed: 1, pending: 2, overdue: 1 },
        { name: "Delta", completed: 2, pending: 1, overdue: 1 },
    ]

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">

            {/* PIE */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="font-semibold mb-4">Status Overview</h2>

                <PieChart width={300} height={250}>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>

            {/* BAR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="font-semibold mb-4">Site-wise Performance</h2>

                <BarChart width={350} height={250} data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="completed" fill="#22c55e" />
                    <Bar dataKey="pending" fill="#f59e0b" />
                    <Bar dataKey="overdue" fill="#ef4444" />
                </BarChart>
            </div>

        </div>
    )
}