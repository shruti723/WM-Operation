"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3, ClipboardList, FileText,
  Users, Wallet, BookOpen, Wrench,
  LogOut, ChevronRight, Building2,
  Lock,
} from "lucide-react"

// ─── Dashboard modules ────────────────────────────────────────────────────────

const adminModules = [
  {
    id:       "operations",
    title:    "Operations",
    desc:     "Site visits, checklists, performance scores & field reports",
    icon:     BarChart3,
    path:     "/dashboard",
    gradient: "from-indigo-600 to-violet-600",
    badge:    null,
    available: true,
  },
  {
    id:       "hr",
    title:    "Human Resources",
    desc:     "Manpower tracking, site staffing, shortage reports & recruitment",
    icon:     Users,
    path:     "/hr",
    gradient: "from-sky-500 to-cyan-500",
    badge:    null,
    available: true,
  },
  {
    id:       "petty-cash",
    title:    "Petty Cash",
    desc:     "Monthly disbursements, audit tracking & expense statements",
    icon:     Wallet,
    path:     "/petty-cash",
    gradient: "from-emerald-500 to-teal-500",
    badge:    null,
    available: true,
  },
  {
    id:       "accounts",
    title:    "Accounts",
    desc:     "Invoices, billing, vendor payments & financial summaries",
    icon:     BookOpen,
    path:     "/accounts",
    gradient: "from-amber-500 to-orange-500",
    badge:    null,
    available: true,
  },
  {
    id:       "maintenance",
    title:    "Maintenance",
    desc:     "Work orders, asset tracking & preventive maintenance",
    icon:     Wrench,
    path:     "/maintenance",
    gradient: "from-rose-500 to-pink-500",
    badge:    "Coming soon",
    available: false,
  },
]

const supervisorModules = [
  {
    id:       "checklist",
    title:    "Start Checklist",
    desc:     "Submit a new site inspection checklist",
    icon:     ClipboardList,
    path:     "/checklist",
    gradient: "from-indigo-600 to-violet-600",
    available: true,
  },
  {
    id:       "submissions",
    title:    "My Submissions",
    desc:     "View and review your past submissions",
    icon:     FileText,
    path:     "/submissions",
    gradient: "from-emerald-500 to-teal-500",
    available: true,
  },
]

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod, onClick }: { mod: any; onClick: () => void }) {
  const Icon = mod.icon

  return (
    <button
      onClick={onClick}
      disabled={!mod.available}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden
        ${mod.available
          ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg cursor-pointer"
          : "border-slate-100 bg-slate-50 cursor-not-allowed opacity-70"
        }`}
    >
      {/* Top gradient strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${mod.gradient}`} />

      <div className="p-5">
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-sm`}>
            <Icon size={20} className="text-white" />
          </div>

          {mod.available ? (
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-0.5"
            />
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              <Lock size={9} /> Soon
            </span>
          )}
        </div>

        {/* Text */}
        <h3 className="font-semibold text-slate-800 text-sm mb-1">{mod.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = sessionStorage.getItem("user")

    if (!u) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(u)

    // Block HR access - redirect to HR module
    if (parsedUser.role === "hr") {
      router.push("/hr")
      return
    }

    setUser(parsedUser)
  }, [])

  if (!user) return null

  const modules = user.role === "admin" ? adminModules : supervisorModules

  const initials = user.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "FM"

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening"

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">FM Operations</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-700">{user.name}</span>
            <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => { sessionStorage.removeItem("user"); router.push("/") }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Welcome block */}
        <div className="mb-10">
          <p className="text-sm text-slate-400 mb-1">{greeting},</p>
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Select a module below to get started
          </p>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {user.role === "admin" ? "Dashboards" : "Your Tools"}
          </p>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              onClick={() => mod.available && router.push(mod.path)}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-300 mt-16">
          FM Operations Platform &nbsp;·&nbsp; {new Date().getFullYear()}
        </p>

      </main>
    </div>
  )
}
