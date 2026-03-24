"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Header() {

    const [open, setOpen] = useState(false)

    const notifications = [
        {
            text: "Form pending for Alpha Tower – Petty Cash",
            time: "2 hours ago",
            type: "pending"
        },
        {
            text: "Deadline approaching for Delta Hub – Finance",
            time: "5 hours ago",
            type: "warning"
        },
        {
            text: "Overdue: Gamma Plaza – Manpower form",
            time: "1 day ago",
            type: "danger"
        }
    ]

    const iconColor: any = {
        pending: "text-yellow-500",
        warning: "text-orange-500",
        danger: "text-red-500"
    }

    return (
        <div className="flex justify-end items-center mb-6 relative">

            {/* 🔔 BELL */}
            <div
                className="relative cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <Bell size={22} />

                {/* Badge */}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    3
                </span>
            </div>

            {/* 🔔 DROPDOWN */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border z-50"
                    >

                        {/* HEADER */}
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="font-semibold">Notifications</h3>
                            <button className="text-blue-500 text-sm">
                                Mark all read
                            </button>
                        </div>

                        {/* LIST */}
                        <div className="max-h-80 overflow-y-auto">

                            {notifications.map((n, i) => (
                                <div
                                    key={i}
                                    className="p-3 border-b hover:bg-gray-50"
                                >
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
    )
}