"use client"

import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, DollarSign, Wallet, Users } from "lucide-react"
import { useEffect, useState } from "react"

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const router = useRouter()
    const pathname = usePathname()

    const [role, setRole] = useState<string>("")

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}")
        console.log("USER:", user)
        console.log("ROLE:", user.role)
        setRole(String(user.role || "").toLowerCase())
    }, [])

    const menu = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/hr", roles: ["level1", "level2"] },

        // ✅ Finance → ONLY HR1
        {
            name: "Finance Form",
            icon: DollarSign,
            path: "/hr/finance",
            roles: ["level1"],
        },

        // ✅ Petty Cash → ONLY account2
        {
            name: "Petty Cash",
            icon: Wallet,
            path: "/hr/petty",
            roles: ["account2"],
        },

        // ✅ Manpower → HR1 + HR2
        {
            name: "Manpower",
            icon: Users,
            path: "/hr/manpower",
            roles: ["level1", "level2"],
        },
    ]

    function isActive(path: string) {
        if (path === "/hr") return pathname === "/hr"
        return pathname.startsWith(path)
    }

    function handleNavigate(path: string) {
        router.push(path)
        onNavigate?.()
    }

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-4 md:px-5 border-b">
                <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                    FM Operation
                </h1>
                <p className="text-xs text-slate-400 mt-1 hidden md:block">
                    HR Panel
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4">
                <nav className="space-y-2">
                    {menu
                        .filter((item: any) => {
                            if (!item.roles) return true // no restriction
                            return item.roles.includes(role)
                        })
                        .map((item, i) => {
                            const Icon = item.icon
                            const active = isActive(item.path)

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleNavigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all
                                    ${active
                                            ? "bg-blue-100 text-blue-600 font-medium"
                                            : "text-slate-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span className="text-sm md:text-[15px] truncate">
                                        {item.name}
                                    </span>
                                </button>
                            )
                        })}
                </nav>
            </div>
        </div>
    )
}