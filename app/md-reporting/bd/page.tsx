"use client"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import {
    ArrowLeft,
    CalendarClock,
    FileText,
    History,
    MessageSquare,
    RefreshCw,
    Search,
    TrendingUp,
} from "lucide-react"

type RenewalItem = {
    id: string
    siteName: string
    nextRenewalDate: string | null
    category: "Next 30 Days" | "Next 3 Months" | "Later"
    status: "Pending" | "In Progress" | "Confirmed"
}

type HistoryItem = {
    id: string
    createdAt: string
}



function getStatusClasses(status: RenewalItem["status"]) {
    switch (status) {
        case "Pending":
            return "bg-amber-50 text-amber-700 border-amber-200"
        case "In Progress":
            return "bg-sky-50 text-sky-700 border-sky-200"
        case "Confirmed":
            return "bg-emerald-50 text-emerald-700 border-emerald-200"
        default:
            return "bg-slate-50 text-slate-700 border-slate-200"
    }
}

function getCategoryClasses(category: RenewalItem["category"]) {
    switch (category) {
        case "Next 30 Days":
            return "bg-indigo-50 text-indigo-700 border-indigo-200"
        case "Next 3 Months":
            return "bg-violet-50 text-violet-700 border-violet-200"
        case "Later":
            return "bg-slate-50 text-slate-700 border-slate-200"
        default:
            return "bg-slate-50 text-slate-700 border-slate-200"
    }
}

function parseDate(dateStr: string) {
    if (!dateStr) return null

    const parts = dateStr.split("-")
    if (parts.length !== 3) return null

    // ✅ Case 1: yyyy-mm-dd (from input/API)
    if (parts[0].length === 4) {
        return new Date(dateStr)
    }

    // ✅ Case 2: dd-mm-yyyy (your old format)
    const [day, month, year] = parts
    return new Date(`${year}-${month}-${day}`)
}

export default function BDPage() {
    const router = useRouter()

    const [renewalData, setRenewalData] = useState<any[]>([])

    useEffect(() => {
        const fetchRenewals = async () => {
            const res = await fetch("/api/md-reporting/bd/renewals", { cache: "no-store" })
            const data = await res.json()

            if (data.success) {
                setRenewalData(data.data)
            }
        }

        fetchRenewals()
    }, [])

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/md-reporting/bd/history", { cache: "no-store" })
                const data = await res.json()

                if (data.success) {
                    setHistoryData(data.data)
                }
            } catch (error) {
                console.error("History fetch error:", error)
            }
        }

        fetchHistory()
    }, [])

    const [search, setSearch] = useState("")
    const [form, setForm] = useState({
        proposalsUnderProcess: "",
        proposalsSent: "",
        tendersUnderProcess: "",
        tendersSubmitted: "",
        misc: "",
    })
    const [filter, setFilter] = useState<
        "All" | "Next 30 Days" | "Next 3 Months" | "Overdue"
    >("All")

    const renewalsNext30Days = renewalData.filter((r) => {
        const d = parseDate(r.nextRenewalDate)
        if (!d) return false

        const today = new Date()
        const next30 = new Date()
        next30.setDate(today.getDate() + 30)

        return d >= today && d <= next30
    }).length

    const renewalsNext3Months = renewalData.filter(
        (r) => r.category === "Next 3 Months"
    ).length

    const handleChange = (
        key: keyof typeof form,
        value: string
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            const res = await fetch("/api/md-reporting/bd/save", {
                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (data.success) {
                alert("Report saved successfully ✅")

                // ✅ CLEAR FORM
                setForm({
                    proposalsUnderProcess: "",
                    proposalsSent: "",
                    tendersUnderProcess: "",
                    tendersSubmitted: "",
                    misc: "",
                })

                // refresh history
                const historyRes = await fetch("/api/md-reporting/bd/history", { cache: "no-store" })
                const historyJson = await historyRes.json()

                if (historyJson.success) {
                    setHistoryData(historyJson.data)
                    setHistoryPage(1)
                }
            } else {
                alert("Failed to save ❌")
            }
        } catch (err) {
            console.error(err)
            alert("Error saving report ❌")
        }
    }

    const [historyData, setHistoryData] = useState<HistoryItem[]>([])
    const [historyPage, setHistoryPage] = useState(1)
    const historyPerPage = 12

    const filteredRenewals = useMemo(() => {
        const q = search.trim().toLowerCase()

        return renewalData.filter((item) => {
            const d = parseDate(item.nextRenewalDate)

            // ✅ FILTER LOGIC
            if (filter === "Next 30 Days") {
                const d = parseDate(item.nextRenewalDate)
                if (!d) return false

                const today = new Date()
                const next30 = new Date()
                next30.setDate(today.getDate() + 30)

                if (!(d >= today && d <= next30)) return false
            }
            if (filter === "Next 3 Months" && item.category !== "Next 3 Months") return false
            if (filter === "Overdue" && !item.isOverdue) return false

            // ✅ DEFAULT (All)
            if (filter === "All") {
            }

            // ✅ SEARCH
            if (!q) return true

            const dateStr = d
                ? d.toLocaleDateString("en-GB").replace(/\//g, "-")
                : ""

            return (
                item.siteName.toLowerCase().includes(q) ||
                item.status.toLowerCase().includes(q) ||
                dateStr.includes(q)
            )
        })
    }, [search, renewalData, filter])

    const totalHistoryPages = Math.ceil(historyData.length / historyPerPage)

    const paginatedHistory = historyData.slice(
        (historyPage - 1) * historyPerPage,
        historyPage * historyPerPage
    )

    const overdue = renewalData.filter((r) => {
        const d = parseDate(r.nextRenewalDate)
        if (!d) return false

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        d.setHours(0, 0, 0, 0)

        return d < today
    }).length

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-slate-200 px-5 sm:px-8 py-5 sm:py-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <button
                                    onClick={() => router.push("/md-reporting")}
                                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>

                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                                    Business Development
                                </h1>

                            </div>

                        </div>
                    </div>

                    <div className="bg-slate-50 px-5 sm:px-8 py-5 sm:py-6 space-y-5">
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* 🟣 LEFT SIDE - CARDS */}
                            <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6 h-fit">

                                {/* Card 1 */}
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-500 uppercase">
                                        Renewals Next 30 Days
                                    </p>
                                    <p className="mt-3 text-4xl font-bold text-slate-900">
                                        {renewalsNext30Days}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Sites due in next 30 days
                                    </p>
                                </div>

                                {/* Card 2 */}
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-500 uppercase">
                                        Renewals Next 3 Months
                                    </p>
                                    <p className="mt-3 text-4xl font-bold text-slate-900">
                                        {renewalsNext3Months}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Upcoming pipeline
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-500 uppercase">
                                        Total Sites
                                    </p>
                                    <p className="mt-3 text-4xl font-bold text-slate-900">
                                        {renewalData.length}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Active contracts
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-red-600 uppercase">
                                        Overdue Renewals
                                    </p>
                                    <p className="mt-3 text-4xl font-bold text-red-700">
                                        {overdue}
                                    </p>
                                    <p className="text-sm text-red-500 mt-1">
                                        Needs immediate action
                                    </p>
                                </div>

                            </div>

                            {/* 🔵 RIGHT SIDE - TABLE */}
                            <div className="lg:col-span-8">

                                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                                    {/* Header */}
                                    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                                <RefreshCw size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-semibold text-slate-900">
                                                    Site Renewals
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Showing {filteredRenewals.length} sites
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">

                                            {/* FILTER BUTTONS */}
                                            <div className="flex flex-wrap gap-2">
                                                {["All", "Next 30 Days", "Next 3 Months", "Overdue"].map((f) => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setFilter(f as any)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-medium border ${filter === f
                                                            ? "bg-indigo-600 text-white border-indigo-600"
                                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* SEARCH */}
                                            <div className="relative w-full lg:w-[260px]">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search sites..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Site</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Next Renewal Date</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Category</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredRenewals.map((item, index) => (
                                                    <tr key={item.id} className="border-t">
                                                        <td className="px-6 py-4 font-medium text-slate-800">
                                                            {item.siteName}
                                                        </td>

                                                        <td className="px-6 py-4 text-slate-600">
                                                            {(() => {
                                                                const d = parseDate(item.nextRenewalDate)
                                                                return d
                                                                    ? d.toLocaleDateString("en-GB").replace(/\//g, "-")
                                                                    : "-"
                                                            })()}
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 text-xs rounded-full border ${getCategoryClasses(item.category)}`}>
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>

                            </div>

                        </div>



                        {/* Proposals */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        New Proposals
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Add brief details for each
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Proposal Under Process
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="List proposals currently being prepared..."
                                        value={form.proposalsUnderProcess}
                                        onChange={(e) =>
                                            handleChange("proposalsUnderProcess", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Proposal Sent
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="List proposals sent to clients..."
                                        value={form.proposalsSent}
                                        onChange={(e) =>
                                            handleChange("proposalsSent", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tenders */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Tenders Submission
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Pipeline status
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Under Process
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="Describe tenders under process..."
                                        value={form.tendersUnderProcess}
                                        onChange={(e) =>
                                            handleChange("tendersUnderProcess", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Submitted
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="Describe submitted tenders..."
                                        value={form.tendersSubmitted}
                                        onChange={(e) =>
                                            handleChange("tendersSubmitted", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Misc */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <MessageSquare size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Miscellaneous / Remarks
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Anything else worth flagging
                                    </p>
                                </div>
                            </div>

                            <textarea
                                rows={6}
                                placeholder="Write additional notes..."
                                value={form.misc}
                                onChange={(e) => handleChange("misc", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                            />
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">


                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                <FileText size={16} />
                                Save Report
                            </button>
                        </div>


                        {/* Report history bottom */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <History size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Report History
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Past submissions
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                                {paginatedHistory.map((item) => {
                                    const createdDate = new Date(item.createdAt)

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => router.push(`/md-reporting/bd/${item.id}`)}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                                        >
                                            <p className="text-xl font-semibold text-slate-900">
                                                {createdDate
                                                    .toLocaleDateString("en-GB")
                                                    .replace(/\//g, "-")}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Created at{" "}
                                                {createdDate.toLocaleTimeString("en-GB", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>

                                            <p className="mt-4 text-sm font-medium text-indigo-600">
                                                View / Edit →
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Page {historyPage} of {totalHistoryPages || 1}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        disabled={historyPage === 1}
                                        onClick={() => setHistoryPage((p) => p - 1)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        disabled={historyPage === totalHistoryPages || totalHistoryPages === 0}
                                        onClick={() => setHistoryPage((p) => p + 1)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}