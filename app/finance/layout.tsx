"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Wallet,
    Users,
    AlertTriangle,
    Download,
} from "lucide-react"

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    const menu = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/finance/finance-overview" },
        { icon: FileText, label: "Billing", path: "/finance/billing" },
        { icon: CreditCard, label: "Payment", path: "/finance/payment" },
    ]

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* ✅ LIGHT SIDEBAR */}
            <aside className="w-72 bg-white border-r p-4 fixed top-0 left-0 h-screen">

                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    FM Operations
                </h2>

                {/* 🔙 BACK BUTTON */}
                <button
                    onClick={() => router.push("/supervisor")}
                    className="flex items-center gap-2 w-full p-3 mb-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* MENU */}
                {menu.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.path

                    return (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className={`flex w-full items-center gap-3 p-3 rounded-lg mb-2 text-sm transition ${active
                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    )
                })}
            </aside>

            {/* ✅ MAIN CONTENT */}
            <main className="flex-1 ml-72 p-6">

                {/* 🔥 TOP BAR */}
                <div className="flex items-center gap-3 mb-4">


                </div>

                {/* PAGE CONTENT */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    {children}
                </div>

            </main>
        </div>
    )
}