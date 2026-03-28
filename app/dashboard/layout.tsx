"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ChevronRight,
  Bell,
  ArrowLeft,
  LogOut,
} from "lucide-react"

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/communication": "Communication",
  "/dashboard/site": "Site",
  "/dashboard/manpower": "Manpower",
  "/dashboard/store": "Store",
  "/dashboard/issues": "Issues",
  "/dashboard/reports": "Reports",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = sessionStorage.getItem("user")
    if (u) setUser(JSON.parse(u))
  }, [])

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "FM"

  const pageTitle = pageTitles[pathname] ?? "Dashboard"

  function logout() {
    sessionStorage.removeItem("user")
    router.push("/")
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">

      {/* ─────── HEADER ─────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">

        {/* 🔙 Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-4">
          <span className="text-slate-400">Dashboard</span>

          <ChevronRight size={14} className="text-slate-300" />

          <span className="text-slate-700 font-medium">
            {pageTitle}
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-4">

          {/* Date */}
          <span className="text-xs text-slate-400 hidden md:block">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric"
            })}
          </span>

          {/* Notification */}
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <Bell size={14} />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>

        </div>
      </header>

      {/* ─────── CONTENT ─────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}