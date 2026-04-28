"use client"

import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, Table, Users } from "lucide-react"
import { ArrowLeft } from "lucide-react"

export default function HRLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    const menu = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/hr_dashboard" },
        { name: "Site Details", icon: Table, path: "/hr_dashboard/site-details" },
        { name: "Manpower", icon: Users, path: "/hr_dashboard/manpower-details" },
    ]

    return (
        <div className="flex bg-gray-50">

            {/* ✅ FIXED SIDEBAR */}
            <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r p-4 flex flex-col">

                <h2 className="font-bold text-lg mb-6">FM Operation</h2>
                {/* 🔙 BACK BUTTON */}
                <button
                    onClick={() => router.push("/supervisor")}
                    className="flex items-center gap-2 w-full p-3 mb-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="space-y-2">
                    {menu.map((item) => {
                        let active = false

                        if (item.path === "/hr_dashboard") {
                            // ✅ exact match only for dashboard
                            active = pathname === item.path
                        } else {
                            // ✅ allow sub-routes for others
                            active =
                                pathname === item.path ||
                                pathname.startsWith(item.path + "/")
                        }

                        const Icon = item.icon

                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition
                                    ${active
                                        ? "bg-blue-100 text-blue-600 font-medium"
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </button>
                        )
                    })}
                </div>

            </div>

            {/* ✅ CONTENT SHIFTED RIGHT */}
            <div className="ml-64 flex-1 min-h-screen p-6 overflow-y-auto">
                {children}
            </div>

        </div>
    )
}