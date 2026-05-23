"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  Users,
  Wallet,
  LogOut,
  ChevronRight,
  Building2,
  Lock,
  Briefcase,
} from "lucide-react"

const adminModules = [
  {
    id: "operations",
    title: "Operations",
    desc: "Site visits, checklists, performance scores & field reports",
    icon: BarChart3,
    path: "/operation-master-dashboard",
    gradient: "from-indigo-600 to-violet-600",
    badge: null,
    available: true,
  },
  {
    id: "bd",
    title: "Business Development",
    desc: "Manage proposals, tenders and client submissions",
    icon: Briefcase,
    path: "/md-reporting/bd",
    gradient: "from-orange-600 to-amber-600",
    badge: null,
    available: true,
  },
  {
    id: "hr",
    title: "Human Resources",
    desc: "Manpower tracking, site staffing, shortage reports & recruitment",
    icon: Users,
    path: "/hr_dashboard",
    gradient: "from-sky-500 to-cyan-500",
    badge: null,
    available: true,
  },
  // {
  //   id: "financeSheet",
  //   title: "Finance",
  //   desc: "Monthly billing data from accounts team for financial analysis",
  //   icon: Wallet,
  //   path: "/finance/finance-overview",
  //   gradient: "from-emerald-500 to-teal-500",
  //   badge: null,
  //   available: true,
  // },
  // {
  //   id: "mdReporting",
  //   title: "MD Reporting",
  //   desc: "Daily MD reporting: BD, Ops, Manpower, Finance & Decisions",
  //   icon: ClipboardList,
  //   path: "/md-reporting",
  //   gradient: "from-pink-500 to-rose-500",
  //   badge: null,
  //   available: true,
  // },
]

const trackerModules = [
  {
    id: "dailySiteReport",
    title: "Daily Site Consolidation",
    desc: "Submit daily site manpower, billing, salary and risk details",
    icon: ClipboardList,
    path: "/operation/site-tracker/daily-site-report",
    gradient: "from-indigo-600 to-violet-600",
    available: true,
  },
  {
    id: "travelVisitPlan",
    title: "Travel & Visit Plan",
    desc: "Submit travel plan, visit purpose, cost and follow-up details",
    icon: Briefcase,
    path: "/operation/site-tracker/travel-visit-plan",
    gradient: "from-orange-600 to-amber-600",
    available: true,
  },
  {
    id: "costLeakReport",
    title: "Cost Leak Report",
    desc: "Report leakage type, monthly impact, root cause and corrective action",
    icon: Wallet,
    path: "/operation/site-tracker/cost-leak-report",
    gradient: "from-red-500 to-rose-500",
    available: true,
  },
  {
    id: "costSavingReport",
    title: "Cost Reduction / Saving Report",
    desc: "Submit cost saving opportunities, owner, deadline and status",
    icon: BarChart3,
    path: "/operation/site-tracker/cost-saving-report",
    gradient: "from-emerald-500 to-teal-500",
    available: true,
  },
]

const amitojModules = [
  {
    id: "operations",
    title: "Operations",
    desc: "Site visits, checklists, performance scores & field reports",
    icon: BarChart3,
    path: "/operations_dashboard",
    gradient: "from-red-500 to-rose-500",
    badge: null,
    available: true,
  },
  {
    id: "amitojCommandTargets",
    title: "Command Targets",
    desc: "Track WM country head command targets, achievement status and next actions",
    icon: ClipboardList,
    path: "/operation/amitoj-tracker/command-targets",
    gradient: "from-purple-600 to-indigo-600",
    available: true,
  },
  {
    id: "amitojSiteControl",
    title: "Site Control Tracker",
    desc: "Track billing, site status, client control, political risk and coordinator performance",
    icon: BarChart3,
    path: "/operation/amitoj-tracker/site-control",
    gradient: "from-emerald-600 to-teal-600",
    available: true,
  },
  {
    id: "amitojTravelVisit",
    title: "Travel & Visit Plan",
    desc: "Submit travel plans, visit outcomes, pending issues and follow-ups",
    icon: Briefcase,
    path: "/operation/amitoj-tracker/travel-visit-plan",
    gradient: "from-orange-600 to-amber-600",
    available: true,
  },
]
const trackerRoles = ["Ravi", "Suyesh", "Mahendra", "Lakhan", "Deepak"]


const trackerEmails = [
  "ravi@wm.com",
  "suyesh@wm.com",
  "mahendra@wm.com",
  "lakhan@wm.com",
  "deepak@wm.com",
]
function ModuleCard({ mod, onClick }: { mod: any; onClick: () => void }) {
  const Icon = mod.icon

  return (
    <button
      type="button"
      onClick={() => {
        console.log("Clicked:", mod.path)
        onClick()
      }}
      disabled={!mod.available}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden
        ${mod.available
          ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg cursor-pointer"
          : "border-slate-100 bg-slate-50 cursor-not-allowed opacity-70"
        }`}
    >
      <div className={`h-2.5 w-full bg-gradient-to-r ${mod.gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-sm`}
          >
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

        <h3 className="font-semibold text-slate-800 text-sm mb-1">
          {mod.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
      </div>
    </button>
  )
}

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

    if (["level1", "level2", "level3", "hr"].includes(parsedUser.role)) {
      router.push("/hr")
      return
    }

    setUser(parsedUser)
  }, [router])

  if (!user) return null



  const modules =
    trackerRoles.includes(user.role) || trackerEmails.includes(user.email)
      ? trackerModules
      : user.role === "Amitoj" || user.email === "amitoj@wm.com"
        ? amitojModules
        : adminModules

  const initials = user.name
    ? user.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "FM"

  const hour = new Date().getHours()

  let greeting = "Hello"

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning"
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good evening"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">
            WM Operations
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-700">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {user.role}
            </span>
          </div>

          <button
            type="button"
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

      <main className="max-w-[1400px] mx-auto px-8 py-10">
        <div className="mb-12">
          <p className="text-sm text-slate-400 mb-1">{greeting},</p>
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Select a module below to get started
          </p>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            {user.role === "admin" ? "Dashboards" : " Your Trackers"}
          </p>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              onClick={() => mod.available && router.push(mod.path)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}