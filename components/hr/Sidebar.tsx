"use client"

import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, DollarSign, Wallet, Users } from "lucide-react"

export default function Sidebar() {

    const router = useRouter()
    const pathname = usePathname()

    const menu = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/hr" },
        { name: "Finance Form", icon: DollarSign, path: "/hr/finance" },
        { name: "Petty Cash", icon: Wallet, path: "/hr/petty" },
        { name: "Manpower", icon: Users, path: "/hr/manpower" },
    ]

    return (
        <div className="w-64 h-screen bg-white border-r p-4">

<<<<<<< HEAD
            <h1 className="text-lg font-bold mb-6">FM Operation</h1>
=======
            <h1 className="text-lg font-bold mb-6">FM Ops HR</h1>
>>>>>>> origin/feature/dashboard-hr-merge-25mar2025

            {menu.map((item, i) => {
                const Icon = item.icon
                const active = pathname === item.path

                return (
                    <div
                        key={i}
                        onClick={() => router.push(item.path)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2
              ${active ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`}
                    >
                        <Icon size={18} />
                        {item.name}
                    </div>
                )
            })}
        </div>
    )
}