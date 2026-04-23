"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3, ClipboardList, FileText,
  Users, Wallet, BookOpen, Wrench,
  LogOut, ChevronRight, Building2,
  Lock, Bell,
} from "lucide-react"

// ─── Dashboard modules ────────────────────────────────────────────────────────

const adminModules = [
  {
    id: "operations",
    title: "Operations",
    desc: "Site visits, checklists, performance scores & field reports",
    icon: BarChart3,
    path: "/operations_dashboard",
    gradient: "from-indigo-600 to-violet-600",
    badge: null,
    available: true,
  },
  {
    id: "hr",
    title: "Manpower",
    desc: "Manpower tracking, site staffing, shortage reports & recruitment",
    icon: Users,
    path: "/hr_dashboard",
    gradient: "from-sky-500 to-cyan-500",
    badge: null,
    available: true,
  },

  {
    id: "accounts",
    title: "Finance",
    desc: "Invoices, billing, vendor payments & financial summaries",
    icon: BookOpen,
    path: "/account-dashboard",
    gradient: "from-amber-500 to-orange-500",
    badge: null,
    available: true,
  },
  {
    id: "financeSheet",
    title: "Finance Sheet",
    desc: "Monthly billing data from accounts team (Google Sheet based dashboard)",
    icon: Wallet,
    path: "/finance/finance-overview",
    gradient: "from-emerald-500 to-teal-500",
    badge: null,
    available: true,
  },
  {
    id: "mdReporting",
    title: "MD Reporting",
    desc: "Daily MD reporting: BD, Ops, Manpower, Finance & Decisions",
    icon: ClipboardList,
    path: "/md-reporting",
    gradient: "from-pink-500 to-rose-500",
    badge: null,
    available: true,
  },
]

const supervisorModules = [
  {
    id: "checklist",
    title: "Start Checklist",
    desc: "Submit a new site inspection checklist",
    icon: ClipboardList,
    path: "/checklist",
    gradient: "from-indigo-600 to-violet-600",
    available: true,
  },
  {
    id: "submissions",
    title: "My Submissions",
    desc: "View and review your past submissions",
    icon: FileText,
    path: "/submissions",
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
  const [count, setCount] = useState(0)

  const [notifications, setNotifications] = useState<any[]>([])
  // const [financeData, setFinanceData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const u = sessionStorage.getItem("user")

    if (!u) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(u)

    // Block HR access - redirect to HR module
    if (["level1", "level2", "level3", "hr"].includes(parsedUser.role)) {
      router.push("/hr")
      return
    }

    setUser(parsedUser)
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/checklist/notifications?role=${user.role}`)
        const data = await res.json()

        if (data.success) {
          setCount(data.unreadCount)
          setNotifications(data.notifications)
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }

    fetchNotifications()

    const interval = setInterval(fetchNotifications, 5000)

    return () => clearInterval(interval)
  }, [user])



  useEffect(() => {
    const handleClick = (e: any) => {
      if (!e.target.closest(".notification-wrapper")) {
        setOpen(false)
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  if (!user) return null

  const modules = user.role === "admin" ? adminModules : supervisorModules

  const initials = user.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "FM"

  const hour = new Date().getHours()

  let greeting = "Hello"

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning"
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good evening"
  } else {
    greeting = "Hello"
  }

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

          {/* 🔔 Notification Bell */}
          <div className="relative notification-wrapper">
            <div
              onClick={async (e) => {
                e.stopPropagation()
                setOpen((prev) => !prev)

                if (count > 0) {
                  await fetch("/api/checklist/mark-read", {
                    cache: "no-store",
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ role: user.role }),
                  })

                  setCount(0)
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 transition cursor-pointer"
            >
              <Bell size={16} className="text-slate-600" />
            </div>

            {open && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="px-4 py-2 border-b text-sm font-semibold text-slate-700">
                  Notifications
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                          router.push(`/submissions?id=${n.submissionId}`)
                        }}
                        className="px-4 py-3 border-b last:border-none hover:bg-slate-50 cursor-pointer bg-blue-50"
                      >
                        <p className="text-xs font-semibold text-slate-700">
                          {n.authorName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>

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
            onClick={() => {
              sessionStorage.removeItem("user")
              router.push("/")
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>

        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-[1400px] mx-auto px-8 py-10">

        {/* Welcome block */}
        <div className="mb-12">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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