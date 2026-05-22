"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Briefcase,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Search,
    Send,
} from "lucide-react"

type RecordType = {
    id: string
    personTravelling: string
    siteToVisit: string
    purpose: string | null
    problemToAddress: string | null
    expectedOutcome: string | null
    travelDate: string | null
    estimatedCost: number | null
    visitOutcome: string | null
    issueResolved: boolean | null
    whatWasResolved: string | null
    stillPending: string | null
    followUpRequired: boolean | null
}

const initialForm = {
    personTravelling: "",
    siteToVisit: "",
    purpose: "",
    problemToAddress: "",
    expectedOutcome: "",
    travelDate: "",
    estimatedCost: "",
    visitOutcome: "",
    issueResolved: "",
    whatWasResolved: "",
    stillPending: "",
    followUpRequired: "",
}

export default function AmitojTravelVisitPlanPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState(initialForm)
    const [records, setRecords] = useState<RecordType[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [search, setSearch] = useState("")
    const [siteFilter, setSiteFilter] = useState("")
    const [issueResolvedFilter, setIssueResolvedFilter] = useState("")
    const [followUpFilter, setFollowUpFilter] = useState("")

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
            if (siteFilter.trim()) params.set("site", siteFilter.trim())
            if (issueResolvedFilter) params.set("issueResolved", issueResolvedFilter)
            if (followUpFilter) params.set("followUpRequired", followUpFilter)

            if (user.role === "Amitoj") {
                params.set("createdByEmail", user.email)
            }

            const res = await fetch(
                `/api/operation/amitoj-tracker/travel-visit-plan?${params.toString()}`,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (!form.personTravelling.trim()) {
            alert("Person travelling is required")
            return
        }

        if (!form.siteToVisit.trim()) {
            alert("Site to visit is required")
            return
        }

        try {
            setSubmitting(true)

            const res = await fetch("/api/operation/amitoj-tracker/travel-visit-plan", {
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

            alert("Travel visit plan submitted successfully")
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
        setIssueResolvedFilter("")
        setFollowUpFilter("")
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

    const amount = (value: number | null) => {
        if (value === null || value === undefined) return "-"
        return value.toLocaleString("en-IN")
    }

    const yesNo = (value: boolean | null) => {
        if (value === true) return "Yes"
        if (value === false) return "No"
        return "-"
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
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                        <Briefcase size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            Travel & Visit Plan
                        </h1>

                    </div>
                </div>

                <div className="ml-auto text-xs text-slate-500">
                    {user?.name ? `Logged in as ${user.name}` : ""}
                </div>
            </header>

            <main className="w-full px-6 py-8">
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex items-center justify-between">
                        <div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Submit visit plan, outcome, resolved issues and follow-ups.
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
                                    Person Travelling <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="personTravelling"
                                    value={form.personTravelling}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Site to Visit <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="siteToVisit"
                                    value={form.siteToVisit}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Travel Date
                                </label>
                                <input
                                    name="travelDate"
                                    value={form.travelDate}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Est. Cost ₹
                                </label>
                                <input
                                    name="estimatedCost"
                                    value={form.estimatedCost}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Purpose
                                </label>
                                <textarea
                                    name="purpose"
                                    value={form.purpose}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Problem to Address
                                </label>
                                <textarea
                                    name="problemToAddress"
                                    value={form.problemToAddress}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Expected Outcome
                                </label>
                                <textarea
                                    name="expectedOutcome"
                                    value={form.expectedOutcome}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Visit Outcome
                                </label>
                                <input
                                    name="visitOutcome"
                                    value={form.visitOutcome}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Issue Resolved?
                                </label>
                                <select
                                    name="issueResolved"
                                    value={form.issueResolved}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Follow-up Required?
                                </label>
                                <select
                                    name="followUpRequired"
                                    value={form.followUpRequired}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    What Was Resolved
                                </label>
                                <input
                                    name="whatWasResolved"
                                    value={form.whatWasResolved}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Still Pending
                                </label>
                                <input
                                    name="stillPending"
                                    value={form.stillPending}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
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
                                    placeholder="Search person, site, purpose..."
                                    className="w-full h-10 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <select
                                value={issueResolvedFilter}
                                onChange={(e) => setIssueResolvedFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Issue Resolved</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>

                            <select
                                value={followUpFilter}
                                onChange={(e) => setFollowUpFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Follow-up</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
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
                            <h2 className="text-sm font-bold text-slate-900">Submitted Travel Visit Plans</h2>
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
                                    <th className="px-4 py-3 text-left text-xs">Person</th>
                                    <th className="px-4 py-3 text-left text-xs">Site</th>
                                    <th className="px-4 py-3 text-left text-xs">Purpose</th>
                                    <th className="px-4 py-3 text-left text-xs">Problem</th>
                                    <th className="px-4 py-3 text-left text-xs">Expected Outcome</th>
                                    <th className="px-4 py-3 text-left text-xs">Travel Date</th>
                                    <th className="px-4 py-3 text-right text-xs">Est. Cost ₹</th>
                                    <th className="px-4 py-3 text-left text-xs">Visit Outcome</th>
                                    <th className="px-4 py-3 text-left text-xs">Issue Resolved</th>
                                    <th className="px-4 py-3 text-left text-xs">What Was Resolved</th>
                                    <th className="px-4 py-3 text-left text-xs">Still Pending</th>
                                    <th className="px-4 py-3 text-left text-xs">Follow-up</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-400">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{record.personTravelling}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.siteToVisit}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.purpose || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.problemToAddress || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[240px]">{record.expectedOutcome || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(record.travelDate)}</td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{amount(record.estimatedCost)}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.visitOutcome || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{yesNo(record.issueResolved)}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.whatWasResolved || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.stillPending || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{yesNo(record.followUpRequired)}</td>
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