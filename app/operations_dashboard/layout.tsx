"use client"

import { ClipboardList, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export default function OperationsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r hidden lg:flex flex-col p-5 space-y-6 fixed left-0 top-0 h-full z-40">

                <h2 className="text-xl font-bold text-indigo-600">
                    WM Operation
                </h2>

                {/* 🔙 BACK BUTTON */}
                <button
                    onClick={() => router.push("/supervisor")} // or router.push("/supervisor")
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-gray-100"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <nav className="space-y-2">
                    <Link href="/operations_dashboard">
                        <div
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition
                            ${pathname === "/operations_dashboard"
                                    ? "bg-indigo-50 text-indigo-600 font-medium"
                                    : "text-slate-600 hover:bg-gray-100"
                                }`}
                        >
                            <ClipboardList size={18} />
                            Dashboard
                        </div>
                    </Link>

                    {/* <Link href="/operations_dashboard/reports">
                        <div
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition
                            ${pathname.includes("/reports")
                                    ? "bg-indigo-50 text-indigo-600 font-medium"
                                    : "text-slate-600 hover:bg-gray-100"
                                }`}
                        >
                            <AlertTriangle size={18} />
                            Reports
                        </div>
                    </Link> */}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 ml-0 lg:ml-64 h-full overflow-y-auto">

                {/* 🔙 MOBILE HEADER BACK BUTTON */}
                <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-30">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-slate-600"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <span className="font-semibold text-slate-800">
                        Back
                    </span>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}