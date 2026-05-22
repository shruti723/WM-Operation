"use client"
import { useRouter } from "next/navigation"
import {
    Briefcase,
    Wrench,
    Users,
    Wallet,
    BookOpen,
    Cpu,
    ChevronRight,
    ShieldCheck,
    ArrowLeft
} from "lucide-react"
const mdModules = [
    {
        id: "bd",
        title: "Business Development",
        icon: Briefcase,
        path: "/md-reporting/bd",
        gradient: "from-indigo-500 to-purple-500",
        desc: "Track proposals, tenders & pipeline",
    },
    {
        id: "ops",
        title: "Operations",
        icon: Wrench,
        path: "/md-reporting/operation",
        gradient: "from-blue-500 to-cyan-500",
        desc: "Site visits, Critical site issues & Top Recurring issues",
    },
    {
        id: "manpower",
        title: "Manpower",
        icon: Users,
        path: "/md-reporting/manpower",
        gradient: "from-emerald-500 to-teal-500",
        desc: "Site Staff authorized, needed & hiring process",
    },
    {
        id: "finance",
        title: "Finance",
        icon: Wallet,
        path: "/md-reporting/finance",
        gradient: "from-orange-500 to-amber-500",
        desc: "Site Billing, payments & collections",
    },
    {
        id: "Solaris",
        title: "Solaris",
        icon: BookOpen,
        path: "/md-reporting/salary",
        gradient: "from-pink-500 to-rose-500",
        // desc: "Salary tracking & disbursement",
    },
    {
        id: "tech",
        title: "Tech",
        icon: Cpu,
        path: "/md-reporting/tech",
        gradient: "from-slate-600 to-slate-800",
        desc: "System issues & technical updates",
    },
    {
        id: "decisions",
        title: "Decisions",
        icon: ShieldCheck,
        path: "/md-reporting/decisions",
        gradient: "from-indigo-600 to-indigo-800",
        desc: "Key approvals & management decisions",
    },

]
function Card({ mod, onClick }: any) {
    const Icon = mod.icon

    return (
        <button
            onClick={onClick}
            className="group w-full text-left rounded-2xl border border-slate-200 bg-white 
            hover:shadow-md hover:-translate-y-0.5s transition-all duration-200 overflow-hidden"
        >
            {/* top strip */}
            <div className={`h-2 w-full bg-gradient-to-r ${mod.gradient} -mt-[1px]`} />

            <div className="p-4 flex items-center justify-between">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-4">

                    {/* ICON */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md`}>
                        <Icon size={22} className="text-white" />
                    </div>

                    {/* TEXT */}
                    <div>
                        <h3 className="text-[15px] font-semibold text-slate-800">
                            {mod.title}
                        </h3>
                        <p className="text-[12px] text-slate-500 mt-1">
                            {mod.desc}
                        </p>
                    </div>
                </div>

                {/* RIGHT ARROW */}
                <ChevronRight className="text-slate-400 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
            </div>
        </button>
    )
}
export default function MDReportingPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-[1400px] mx-auto px-8 py-10">
                {/* 🔙 Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">

                        {/* Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                MD Reporting
                            </h1>
                            <p className="text-sm text-slate-400">
                                Daily summary for Managing Director
                            </p>
                        </div>
                    </div>
                </div>
                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                    {mdModules.map((mod) => (
                        <Card
                            key={mod.id}
                            mod={mod}
                            onClick={() => router.push(mod.path)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}