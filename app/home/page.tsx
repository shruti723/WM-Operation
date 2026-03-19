"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, FileText, BarChart3, LogOut, User } from "lucide-react"

export default function Home() {

    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const u = sessionStorage.getItem("user")
        if (!u) router.push("/")
        else setUser(JSON.parse(u))
    }, [])

    function handleLogout() {
        sessionStorage.removeItem("user")
        router.push("/")
    }

    if (!user) return null

    return (

        <div className="min-h-screen bg-gray-50">

            {/* 🔥 HEADER */}
            <div className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">

                <h1 className="text-xl font-bold">
                    FM Operations
                </h1>

                <div className="flex items-center gap-4">

                    {/* USER INFO */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <User size={16} />
                        <span className="text-sm font-medium">
                            {user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                            ({user.role})
                        </span>
                    </div>

                    {/* LOGOUT */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-2"
                    >
                        <LogOut size={16} />
                        Logout
                    </Button>

                </div>
            </div>

            {/* 🔥 MAIN */}
            <div className="max-w-5xl mx-auto p-8 space-y-6">

                <h2 className="text-3xl font-bold">
                    Welcome, {user.name} 👋
                </h2>

                {/* ADMIN */}
                {user.role === "admin" && (

                    <Card
                        onClick={() => router.push("/dashboard")}
                        className="p-10 rounded-2xl cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:scale-[1.03] transition"
                    >
                        <div className="flex justify-between items-center">

                            <div>
                                <h2 className="text-2xl font-semibold">
                                    Operations Dashboard
                                </h2>
                                <p className="opacity-80">
                                    Analytics, performance & reports
                                </p>
                            </div>

                            <BarChart3 size={42} />
                        </div>
                    </Card>
                )}

                {/* SUPERVISOR */}
                {user.role === "supervisor" && (

                    <div className="grid md:grid-cols-2 gap-4">

                        <Card
                            className="p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition"
                            onClick={() => router.push("/checklist")}
                        >
                            <div className="flex justify-between items-center">

                                <div>
                                    <h3 className="font-semibold text-lg">
                                        Start Checklist
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        New site visit
                                    </p>
                                </div>

                                <ClipboardList className="text-blue-600" />
                            </div>
                        </Card>

                        <Card
                            className="p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition"
                            onClick={() => router.push("/submissions")}
                        >
                            <div className="flex justify-between items-center">

                                <div>
                                    <h3 className="font-semibold text-lg">
                                        My Submissions
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        View records
                                    </p>
                                </div>

                                <FileText className="text-green-600" />
                            </div>
                        </Card>

                    </div>
                )}

            </div>

        </div>
    )
}