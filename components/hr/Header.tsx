"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")

        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }

        setUserLoaded(true)
    }, [])

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


                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}