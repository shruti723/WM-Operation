"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Building2, LogOut, ChevronRight, Bell, Home,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

interface Props {
  title:    string
  subtitle: string
  accent:   string          // e.g. "indigo", "emerald", "amber"
  menu:     NavItem[]
  children: React.ReactNode
}

const accentMap: Record<string, { bg: string; text: string; ring: string; sidebar: string }> = {
  indigo:  { bg: "bg-indigo-600",  text: "text-indigo-600",  ring: "ring-indigo-200",  sidebar: "bg-indigo-600"  },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", ring: "ring-emerald-200", sidebar: "bg-emerald-600" },
  amber:   { bg: "bg-amber-600",   text: "text-amber-600",   ring: "ring-amber-200",   sidebar: "bg-amber-600"   },
  rose:    { bg: "bg-rose-600",    text: "text-rose-600",    ring: "ring-rose-200",    sidebar: "bg-rose-600"    },
  sky:     { bg: "bg-sky-600",     text: "text-sky-600",     ring: "ring-sky-200",     sidebar: "bg-sky-600"     },
  violet:  { bg: "bg-violet-600",  text: "text-violet-600",  ring: "ring-violet-200",  sidebar: "bg-violet-600"  },
}

export default function ModuleLayout({ title, subtitle, accent, menu, children }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const colors = accentMap[accent] ?? accentMap.indigo

  useEffect(() => {
    const u = sessionStorage.getItem("user")
    if (u) setUser(JSON.parse(u))
  }, [])

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "FM"

  // Build page title from menu
  const pageTitles: Record<string, string> = {}
  menu.forEach(m => { pageTitles[m.path] = m.name })
  const pageTitle = pageTitles[pathname] ?? menu[0]?.name ?? title

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ──────── SIDEBAR ──────── */}
      <aside className="w-60 shrink-0 bg-slate-950 flex flex-col">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-800">
          <div className={`w-8 h-8 rounded-lg ${colors.sidebar} flex items-center justify-center`}>
            <Building2 size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{title}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Back to Home */}
        <button
          onClick={() => router.push("/home")}
          className="mx-3 mt-4 mb-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Home size={14} />
          <span>Back to Home</span>
        </button>

        {/* Nav label */}
        <p className="px-5 pt-4 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {menu.map(({ name, path, icon: Icon }) => {
            const active = pathname === path
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? `${colors.sidebar} text-white`
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{name}</span>
                {active && <ChevronRight size={13} className="opacity-60" />}
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition group">
            <div className={`w-8 h-8 rounded-full ${colors.sidebar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name ?? "Admin"}</p>
              <p className="text-slate-500 text-[11px] truncate">{user?.role ?? "admin"}</p>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem("user"); router.push("/") }}
              className="text-slate-600 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ──────── MAIN ──────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">{title}</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-700 font-medium">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden md:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
            </span>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition">
              <Bell size={14} />
            </button>
            <div className={`w-8 h-8 rounded-full ${colors.sidebar} flex items-center justify-center text-white text-xs font-bold`}>
              {initials}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
