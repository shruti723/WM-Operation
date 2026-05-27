"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Search,
    Send,
    Wallet,
} from "lucide-react"

type CostLeakRecord = {
    id: string
    site: string
    leakageType: string | null
    description: string | null
    monthlyImpact: number | null
    rootCause: string | null
    correctiveAction: string | null
    owner: string | null
    deadline: string | null
    status: string | null
    createdAt: string
}

type WmSiteOption = {
    id: string
    siteName: string
    manpowerAuthorized: number
}

const initialForm = {
    site: "",
    leakageType: "",
    description: "",
    monthlyImpact: "",
    rootCause: "",
    correctiveAction: "",
    owner: "",
    deadline: "",
    status: "Open",
}

export default function CostLeakReportPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState(initialForm)
    const [records, setRecords] = useState<CostLeakRecord[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [search, setSearch] = useState("")
    const [siteFilter, setSiteFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [wmSites, setWmSites] = useState<WmSiteOption[]>([])

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

    const fetchWmSites = async () => {
        try {
            const res = await fetch("/api/operation/site-tracker/wm-sites", {
                cache: "no-store",
            })

            const data = await res.json()

            if (!data.success) {
                alert(data.message || "Failed to fetch sites")
                return
            }

            setWmSites(data.sites || [])
        } catch (error) {
            console.error(error)
            alert("Failed to fetch WM sites")
        }
    }

    const fetchRecords = async () => {
        if (!user) return

        try {
            setLoading(true)

            const params = new URLSearchParams()
            params.set("page", String(page))
            params.set("limit", String(limit))

            if (search.trim()) params.set("search", search.trim())
            if (siteFilter.trim()) params.set("site", siteFilter.trim())
            if (statusFilter) params.set("status", statusFilter)
            if (fromDate) params.set("fromDate", fromDate)
            if (toDate) params.set("toDate", toDate)

            const siteControlRoles = ["Ravi", "Suyesh", "Mahendra", "Lakhan", "Deepak"]

            if (siteControlRoles.includes(user?.role)) {
                params.set("createdByEmail", user.email)
            }

            const res = await fetch(`/api/operation/site-tracker/cost-leak-report?${params.toString()}`, {
                cache: "no-store",
            })

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page])

    useEffect(() => {
        if (!user) return
        fetchRecords()
        fetchWmSites()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            alert("Please login again")
            return
        }

        if (!form.site.trim()) {
            alert("Site is required")
            return
        }

        try {
            setSubmitting(true)

            const res = await fetch("/api/operation/site-tracker/cost-leak-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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

            alert("Cost leak report submitted successfully")
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
        setSiteFilter("")
        setStatusFilter("")
        setFromDate("")
        setToDate("")
        setPage(1)

        setTimeout(() => {
            fetchRecords()
        }, 0)
    }

    const formatDate = (date?: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const formatDateTime = (date?: string | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
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
                    <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
                        <Wallet size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            Cost Leak Report
                        </h1>

                    </div>
                </div>

                <div className="ml-auto text-xs text-slate-500">
                    {user?.name ? `Logged in as ${user.name}` : ""}
                </div>
            </header>

            <main className="w-full px-6 py-8">
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 flex items-center justify-between">
                        <div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Fill this form to submit a new cost leakage entry.
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
                                    Site <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="site"
                                    value={form.site}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                >
                                    <option value="">Select Site</option>

                                    {wmSites.map((site) => (
                                        <option key={site.id} value={site.siteName}>
                                            {site.siteName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Leakage Description
                                </label>
                                <input
                                    name="leakageType"
                                    value={form.leakageType}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Monthly Impact ₹
                                </label>
                                <input
                                    name="monthlyImpact"
                                    value={form.monthlyImpact}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Owner
                                </label>
                                <input
                                    name="owner"
                                    value={form.owner}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}

                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Root Cause
                                </label>
                                <textarea
                                    name="rootCause"
                                    value={form.rootCause}
                                    onChange={handleChange}

                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Corrective Action
                                </label>
                                <textarea
                                    name="correctiveAction"
                                    value={form.correctiveAction}
                                    onChange={handleChange}

                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
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
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                                >
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Submit
                            </button>
                        </div>
                    </form>
                </section>


                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Submitted Cost Leak Reports
                            </h2>
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

                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                            <div className="md:col-span-2 relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search site..."
                                    className="w-full h-10 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>



                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs">Date / Time</th>
                                    <th className="px-4 py-3 text-left text-xs">Site</th>
                                    <th className="px-4 py-3 text-left text-xs">Leakage Type</th>
                                    <th className="px-4 py-3 text-left text-xs">Description</th>
                                    <th className="px-4 py-3 text-right text-xs">Monthly Impact ₹</th>
                                    <th className="px-4 py-3 text-left text-xs">Root Cause</th>
                                    <th className="px-4 py-3 text-left text-xs">Corrective Action</th>
                                    <th className="px-4 py-3 text-left text-xs">Owner</th>
                                    <th className="px-4 py-3 text-left text-xs">Deadline</th>
                                    <th className="px-4 py-3 text-left text-xs">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(record.createdAt)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{record.site}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.leakageType || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[240px]">{record.description || "-"}</td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                                                {record.monthlyImpact !== null && record.monthlyImpact !== undefined
                                                    ? record.monthlyImpact.toLocaleString("en-IN")
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[240px]">{record.rootCause || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[240px]">{record.correctiveAction || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.owner || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(record.deadline)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${record.status === "Closed"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                        : "bg-amber-50 text-amber-700 border border-amber-100"
                                                        }`}
                                                >
                                                    {record.status || "Open"}
                                                </span>
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