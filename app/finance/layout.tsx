"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

import {
    ArrowLeft,
    LayoutDashboard,
    FileText,
    CreditCard,
    Menu,
    X,
    WalletCards,
} from "lucide-react"

export default function FinanceLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const router = useRouter()
    const pathname = usePathname()

    const [sidebarOpen, setSidebarOpen] =
        useState(false)

    const menu = [
        {
            icon: LayoutDashboard,
            label: "Dashboard",
            path: "/finance/finance-overview",
        },
        {
            icon: FileText,
            label: "Billing",
            path: "/finance/billing",
        },
        {
            icon: CreditCard,
            label: "Payment",
            path: "/finance/payment",
        },
        {
            icon: WalletCards,
            label: "FM Outstanding",
            path: "/finance/fm-outstanding",
        },
    ]

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ================= MOBILE HEADER ================= */}

            <div className="lg:hidden sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">

                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                    <Menu size={20} />
                    Menu
                </button>

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-slate-600"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
            </div>

            {/* ================= MOBILE SIDEBAR ================= */}

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">

                    {/* OVERLAY */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* SIDEBAR */}
                    <aside className="absolute left-0 top-0 h-full w-72 bg-white border-r p-5 shadow-xl overflow-y-auto">

                        <div className="flex items-center justify-between mb-6">

                            <h2 className="text-xl font-bold text-gray-800">
                                FM Operations
                            </h2>

                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BACK */}
                        <button
                            onClick={() => {
                                setSidebarOpen(false)
                                router.push("/supervisor")
                            }}
                            className="flex items-center gap-2 w-full p-3 mb-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                        {/* MENU */}
                        <div className="space-y-2">

                            {menu.map((item) => {

                                const Icon = item.icon

                                const active =
                                    pathname === item.path

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            router.push(item.path)
                                            setSidebarOpen(false)
                                        }}
                                        className={`flex w-full items-center gap-3 p-3 rounded-lg text-sm transition
                                            
                                            ${active
                                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                                : "text-gray-600 hover:bg-gray-100"
                                            }
                                        `}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </button>
                                )
                            })}
                        </div>
                    </aside>
                </div>
            )}

            <div className="flex">

                {/* ================= DESKTOP SIDEBAR ================= */}

                <aside className="hidden lg:block w-72 bg-white border-r p-4 fixed top-0 left-0 h-screen">

                    <h2 className="text-xl font-bold mb-4 text-gray-800">
                        FM Operations
                    </h2>

                    {/* BACK */}
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

                        const active =
                            pathname === item.path

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.path)}
                                className={`flex w-full items-center gap-3 p-3 rounded-lg mb-2 text-sm transition
                                    
                                    ${active
                                        ? "bg-indigo-50 text-indigo-600 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        )
                    })}
                </aside>

                {/* ================= MAIN CONTENT ================= */}

                <main className="flex-1 lg:ml-72 w-full overflow-x-hidden">

                    <div className="w-full max-w-full">
                        {children}
                    </div>

                </main>
            </div>
        </div>
    )
}