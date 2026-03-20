"use client"

import { useRouter } from "next/navigation"

export default function DashboardLayout({ children }: any) {
    const router = useRouter()

    const menu = [
        { name: "Overview", path: "/dashboard" },
        { name: "Communication", path: "/dashboard/communication" },
        { name: "Site", path: "/dashboard/site" },
        { name: "Manpower", path: "/dashboard/manpower" },
        { name: "Store", path: "/dashboard/store" },
        { name: "Issues", path: "/dashboard/issues" },
        { name: "Reports", path: "/dashboard/reports" }
    ]

    return (
        <div className="flex min-h-screen">

            {/* SIDEBAR */}
            <div className="w-64 bg-white shadow p-5">
                <h2 className="text-xl font-bold mb-6">FM Panel</h2>

                {menu.map((m) => (
                    <div
                        key={m.path}
                        onClick={() => router.push(m.path)}
                        className="p-3 cursor-pointer hover:bg-blue-50 rounded"
                    >
                        {m.name}
                    </div>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-6">
                {children}
            </div>

        </div>
    )
}