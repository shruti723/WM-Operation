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
    ArrowLeft
} from "lucide-react"
const mdModules = [
    {
        id: "bd",
        title: "Business Development",
        icon: Briefcase,
        path: "/md-reporting/bd",
        gradient: "from-indigo-500 to-purple-500",
    },
    {
        id: "ops",
        title: "Operations",
        icon: Wrench,
        path: "/md-reporting/operations",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        id: "manpower",
        title: "Manpower",
        icon: Users,
        path: "/md-reporting/manpower",
        gradient: "from-emerald-500 to-teal-500",
    },
    {
        id: "finance",
        title: "Finance",
        icon: Wallet,
        path: "/md-reporting/finance",
        gradient: "from-orange-500 to-amber-500",
    },
    {
        id: "salary",
        title: "Solaris",
        icon: BookOpen,
        path: "/md-reporting/salary",
        gradient: "from-pink-500 to-rose-500",
    },
    {
        id: "tech",
        title: "Tech / Decisions",
        icon: Cpu,
        path: "/md-reporting/tech",
        gradient: "from-slate-600 to-slate-800",
    },
]
function Card({ mod, onClick }: any) {
    const Icon = mod.icon
    return (
        <button
            onClick={onClick}
            className="group w-full text-left rounded-2xl border border-slate-200 bg-white 
      hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
        >
            {/* top strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${mod.gradient}`} />

            <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-sm`}>
                        <Icon size={22} className="text-white" />
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                    {mod.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                    {mod.desc}
                </p>
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
                        {/* Back Button */}
                        <button
                            onClick={() => router.push("/supervisor")}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
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