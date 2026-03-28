"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {

    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    /* ✅ LOAD USER */
    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
    }, [])

    /* ✅ LOGOUT */
    function handleLogout() {
        sessionStorage.removeItem("user")
        router.push("/") // login page
    }

    /* ✅ REAL NOTIFICATIONS (you can replace with API later) */
    const notifications = [
        { text: "Manpower pending – Alpha Site", time: "2h ago", type: "pending" },
        { text: "Finance deadline – Delta Hub", time: "5h ago", type: "warning" },
        { text: "Overdue – Gamma Plaza", time: "1d ago", type: "danger" }
    ]

    const iconColor: any = {
        pending: "text-yellow-500",
        warning: "text-orange-500",
        danger: "text-red-500"
    }

    return (
        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl shadow-sm border">

            {/* ☰ LEFT SIDE */}
            <div className="flex items-center gap-3">

                {/* MOBILE MENU */}
                <button
                    className="md:hidden"
                    onClick={toggleSidebar}
                >
                    <Menu size={22} />
                </button>

                {/* APP TITLE */}
                <h1 className="font-semibold text-lg hidden md:block">
                    FM Operation
                </h1>
            </div>
            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4 relative">

                {/* 🔔 NOTIFICATION */}
                <div
                    className="relative cursor-pointer"
                    onClick={() => setOpen(!open)}
                >
                    <Bell size={22} />

                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                        {notifications.length}
                    </span>
                </div>

                {/* 👤 USER INFO */}
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                </div>

                {/* 🚪 LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600"
                >
                    <LogOut size={18} />
                </button>

                {/* 🔔 DROPDOWN */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border z-50"
                        >

                            <div className="p-3 border-b font-semibold">
                                Notifications
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((n, i) => (
                                    <div key={i} className="p-3 border-b hover:bg-gray-50">
                                        <p className="text-sm flex gap-2">
                                            <span className={iconColor[n.type]}>●</span>
                                            {n.text}
                                        </p>
                                        <p className="text-xs text-gray-500 ml-4">
                                            {n.time}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
