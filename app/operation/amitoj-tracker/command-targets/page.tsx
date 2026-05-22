"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Loader2,
    RefreshCw,
    Search,
    Send,
} from "lucide-react"

type RecordType = {
    id: string
    targetArea: string
    targetValue: string | null
    actual: string | null
    gap: string | null
    status: string | null
    mdContextReason: string | null
    nextAction: string | null
    deadline: string | null
    supportNeeded: string | null
    createdAt: string
}

const initialForm = {
    targetArea: "",
    targetValue: "",
    actual: "",
    gap: "",
    status: "Achieved",
    mdContextReason: "",
    nextAction: "",
    deadline: "",
    supportNeeded: "",
}

export default function AmitojCommandTargetsPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState(initialForm)
    const [records, setRecords] = useState<RecordType[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const limit = 15

    const currentDateTime = useMemo(() => {
        return new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }, [])

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")

        if (!storedUser) {
            router.push("/")
            return
        }

        setUser(JSON.parse(storedUser))
    }, [router])

    const fetchRecords = async () => {
        if (!user) return

        try {
            setLoading(true)

            const params = new URLSearchParams()
            params.set("page", String(page))
            params.set("limit", String(limit))

            if (search.trim()) params.set("search", search.trim())
            if (statusFilter) params.set("status", statusFilter)
            if (fromDate) params.set("fromDate", fromDate)
            if (toDate) params.set("toDate", toDate)

            if (user.role === "Amitoj") {
                params.set("createdByEmail", user.email)
            }

            const res = await fetch(
                `/api/operation/amitoj-tracker/command-targets?${params.toString()}`,
                { cache: "no-store" }
            )

            const data = await res.json()

            if (!data.success) {
                alert(data.message || "Failed to fetch records")
                return
            }

            setRecords(data.records || [])
            setTotal(data.pagination?.total || 0)
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error(error)
            alert("Failed to fetch records")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!user) return
        fetchRecords()
    }, [user, page])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            alert("Please login again")
            return
        }

        if (!form.targetArea.trim()) {
            alert("Target area is required")
            return
        }

        try {
            setSubmitting(true)

            const res = await fetch("/api/operation/amitoj-tracker/command-targets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    createdById: user.id,
                    createdByEmail: user.email,
                }),
            })

            const data = await res.json()

            if (!data.success) {
                alert(data.message || "Failed to submit")
                return
            }

            alert("Command target submitted successfully")
            setForm(initialForm)
            setPage(1)
            fetchRecords()
        } catch (error) {
            console.error(error)
            alert("Failed to submit")
        } finally {
            setSubmitting(false)
        }
    }

    const applyFilters = () => {
        setPage(1)
        fetchRecords()
    }

    const resetFilters = () => {
        setSearch("")
        setStatusFilter("")
        setFromDate("")
        setToDate("")
        setPage(1)

        setTimeout(() => fetchRecords(), 0)
    }

    const formatDate = (date?: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const statusClass = (status?: string | null) => {
        if (status === "Achieved") return "bg-emerald-50 text-emerald-700 border-emerald-100"
        if (status === "Not Achieved") return "bg-rose-50 text-rose-700 border-rose-100"

        return "bg-slate-50 text-slate-600 border-slate-100"
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
                <button
                    type="button"
                    onClick={() => router.push("/supervisor")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="ml-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <ClipboardList size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            Command Targets
                        </h1>

                    </div>
                </div>

                <div className="ml-auto text-xs text-slate-500">
                    {user?.name ? `Logged in as ${user.name}` : ""}
                </div>
            </header>

            <main className="w-full px-6 py-8">
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-purple-50 border-b border-purple-100 px-5 py-3 flex items-center justify-between">
                        <div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Track targets, actuals, gap, next action and support needed.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                            <CalendarDays size={14} />
                            {currentDateTime}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Target Area <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="targetArea"
                                    value={form.targetArea}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Target Value
                                </label>
                                <input
                                    name="targetValue"
                                    value={form.targetValue}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Actual
                                </label>
                                <input
                                    name="actual"
                                    value={form.actual}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Gap
                                </label>
                                <input
                                    name="gap"
                                    value={form.gap}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                    <option value="Achieved">Achieved</option>
                                    <option value="Not Achieved">Not Achieved</option>

                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Deadline
                                </label>
                                <input
                                    name="deadline"
                                    value={form.deadline}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Support Needed
                                </label>
                                <input
                                    name="supportNeeded"
                                    value={form.supportNeeded}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    MD Context / Reason
                                </label>
                                <textarea
                                    name="mdContextReason"
                                    value={form.mdContextReason}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Next Action
                                </label>
                                <textarea
                                    name="nextAction"
                                    value={form.nextAction}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Submit
                            </button>
                        </div>
                    </form>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search target, action, support..."
                                    className="w-full h-10 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="Achieved">Achieved</option>
                                <option value="Not Achieved">Not Achieved</option>

                            </select>

                            <input
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                type="date"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />

                            <input
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                type="date"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <RefreshCw size={14} />
                                Reset
                            </button>

                            <button
                                type="button"
                                onClick={applyFilters}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Submitted Command Targets</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Showing {records.length} of {total} records
                            </p>
                        </div>

                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader2 size={14} className="animate-spin" />
                                Loading
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs">Target Area</th>
                                    <th className="px-4 py-3 text-left text-xs">Target Value</th>
                                    <th className="px-4 py-3 text-left text-xs">Actual</th>
                                    <th className="px-4 py-3 text-left text-xs">Gap</th>
                                    <th className="px-4 py-3 text-left text-xs">Status</th>
                                    <th className="px-4 py-3 text-left text-xs">MD Context / Reason</th>
                                    <th className="px-4 py-3 text-left text-xs">Next Action</th>
                                    <th className="px-4 py-3 text-left text-xs">Deadline</th>
                                    <th className="px-4 py-3 text-left text-xs">Support Needed</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                                {record.targetArea}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.targetValue || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.actual || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.gap || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusClass(record.status)}`}>
                                                    {record.status || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[260px]">
                                                {record.mdContextReason || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[260px]">
                                                {record.nextAction || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {formatDate(record.deadline)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[200px]">
                                                {record.supportNeeded || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Page {page} of {totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={14} />
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}