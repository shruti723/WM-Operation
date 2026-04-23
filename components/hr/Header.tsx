"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")

        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }

        setUserLoaded(true)
    }, [])

    useEffect(() => {
        if (!user?.id) return

        const fetchNotifications = async () => {
            const res = await fetch(`/api/notification/get?userId=${user.id}`)
            const data = await res.json()
            setNotifications(data)
        }

        fetchNotifications()

        const interval = setInterval(fetchNotifications, 5000)
        return () => clearInterval(interval)
    }, [user])

    function handleLogout() {
        sessionStorage.removeItem("user")
        router.push("/")
    }

    if (!userLoaded) return null

    return (
        <div className="flex items-center justify-between gap-3 bg-white px-3 py-3 md:px-4 md:py-3 rounded-xl shadow-sm border">
            {/* LEFT */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    className="md:hidden shrink-0"
                    onClick={toggleSidebar}
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>

                <h1 className="font-semibold text-base md:text-lg truncate">
                    FM Operation
                </h1>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 md:gap-4 relative shrink-0">
                {/* Notification */}
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="relative p-2 rounded-lg hover:bg-gray-100"
                    >
                        <Bell size={20} />

                        {/* 🔴 Badge */}
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                {notifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* User info */}
                <div className="hidden sm:block text-right leading-tight">
                    <p className="text-sm font-medium truncate max-w-[120px] md:max-w-none">
                        {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                        {user?.role}
                    </p>
                </div>

                {/* Mobile user chip */}
                <div className="sm:hidden text-xs font-medium text-gray-700 max-w-[70px] truncate">
                    {user?.name || "User"}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 shrink-0"
                    aria-label="Logout"
                >
                    <LogOut size={18} />
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-12 w-[92vw] max-w-[320px] md:w-80 bg-white rounded-xl shadow-lg border z-50"
                        >
                            <div className="p-3 border-b font-semibold text-sm md:text-base">
                                Notifications
                            </div>
                            <div className="max-h-80 overflow-y-auto">

                                {notifications.length === 0 && (
                                    <p className="p-3 text-sm text-gray-400">No notifications</p>
                                )}

                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={async () => {
                                            // mark as read
                                            await fetch("/api/notification/read", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ id: n.id }),
                                            })

                                            setOpen(false)

                                            if (n.link) {
                                                const submissionId = n.link.split("=")[1]

                                                window.dispatchEvent(
                                                    new CustomEvent("openChat", {
                                                        detail: { submissionId }
                                                    })
                                                )
                                            }
                                        }}
                                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                💬 {n.message}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        {!n.isRead && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                                        )}
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