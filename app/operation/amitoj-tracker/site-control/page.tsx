"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Search,
    Send,
} from "lucide-react"

type WmSiteOption = {
    id: string
    siteName: string
}

type RecordType = {
    id: string
    site: string
    coordinator: string | null
    authorisedAmount: number | null
    underBillingAmount: number | null
    commitmentDate: string | null
    billingStatus: string | null
    siteStatus: string | null
    clientControl: string | null
    politicalRisk: string | null
    coordinatorPerformance: string | null
    riskMdContext: string | null
    lastAction: string | null
    nextAction: string | null
    owner: string | null
    deadline: string | null
}

const initialForm = {
    site: "",
    coordinator: "",
    authorisedAmount: "",
    underBillingAmount: "",
    commitmentDate: "",
    billingStatus: "",
    siteStatus: "",
    clientControl: "",
    politicalRisk: "",
    coordinatorPerformance: "",
    riskMdContext: "",
    lastAction: "",
    nextAction: "",
    owner: "",
    deadline: "",
}

export default function AmitojSiteControlPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState(initialForm)
    const [records, setRecords] = useState<RecordType[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [search, setSearch] = useState("")
    const [siteFilter, setSiteFilter] = useState("")
    const [billingStatusFilter, setBillingStatusFilter] = useState("")
    const [siteStatusFilter, setSiteStatusFilter] = useState("")
    const [coordinatorPerformanceFilter, setCoordinatorPerformanceFilter] = useState("")

    const [clientControlFilter, setClientControlFilter] = useState("")
    const [politicalRiskFilter, setPoliticalRiskFilter] = useState("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [wmSites, setWmSites] = useState<WmSiteOption[]>([])
    const coordinators = ["Deepak", "Ravi", "Suyesh", "Mahendra", "Lakhan"]
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
            if (billingStatusFilter) params.set("billingStatus", billingStatusFilter)
            if (siteStatusFilter) params.set("siteStatus", siteStatusFilter)
            if (coordinatorPerformanceFilter) {
                params.set("coordinatorPerformance", coordinatorPerformanceFilter)
            }

            if (user.role === "Amitoj") {
                params.set("createdByEmail", user.email)
            }

            if (clientControlFilter) params.set("clientControl", clientControlFilter)
            if (politicalRiskFilter) params.set("politicalRisk", politicalRiskFilter)

            const res = await fetch(
                `/api/operation/amitoj-tracker/site-control?${params.toString()}`,
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
        fetchWmSites()
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

        if (!form.site.trim()) {
            alert("Site is required")
            return
        }

        try {
            setSubmitting(true)

            const res = await fetch("/api/operation/amitoj-tracker/site-control", {
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

            alert("Site control submitted successfully")
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
        setBillingStatusFilter("")
        setSiteStatusFilter("")
        setCoordinatorPerformanceFilter("")
        setClientControlFilter("")
        setPoliticalRiskFilter("")
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

    const pillClass = (value?: string | null) => {
        if (!value) return "bg-slate-50 text-slate-600 border-slate-100"

        if (["Green", "Smooth", "Submitted", "Received", "Strong", "None"].includes(value)) {
            return "bg-emerald-50 text-emerald-700 border-emerald-100"
        }

        if (["Yellow", "Partial", "Manageable", "Medium", "Raised"].includes(value)) {
            return "bg-amber-50 text-amber-700 border-amber-100"
        }

        if (["Red", "Disrupted", "Weak", "High"].includes(value)) {
            return "bg-rose-50 text-rose-700 border-rose-100"
        }

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
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <BarChart3 size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            Site Control Tracker
                        </h1>

                    </div>
                </div>

                <div className="ml-auto text-xs text-slate-500">
                    {user?.name ? `Logged in as ${user.name}` : ""}
                </div>
            </header>

            <main className="w-full px-6 py-8">
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
                        <div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Track site billing, risks, owner, next action and deadlines.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                            <CalendarDays size={14} />
                            {currentDateTime}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Site <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="site"
                                    value={form.site}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                                    Coordinator
                                </label>
                                <select
                                    name="coordinator"
                                    value={form.coordinator}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="">Select Coordinator</option>

                                    {coordinators.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Authorised Amount ₹
                                </label>
                                <input
                                    name="authorisedAmount"
                                    value={form.authorisedAmount}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Under Billing Amount ₹
                                </label>
                                <input
                                    name="underBillingAmount"
                                    value={form.underBillingAmount}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Commitment Date
                                </label>
                                <input
                                    name="commitmentDate"
                                    value={form.commitmentDate}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Billing Status
                                </label>
                                <select
                                    name="billingStatus"
                                    value={form.billingStatus}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Not Raised">Not Raised</option>
                                    <option value="Raised">Raised</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Received">Received</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Site Status
                                </label>
                                <select
                                    name="siteStatus"
                                    value={form.siteStatus}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Disrupted">Disrupted</option>
                                    <option value="Normal">Normal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Client Control
                                </label>
                                <select
                                    name="clientControl"
                                    value={form.clientControl}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Strong">Strong</option>
                                    <option value="Manageable">Manageable</option>
                                    <option value="Weak">Weak</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Political Risk
                                </label>
                                <select
                                    name="politicalRisk"
                                    value={form.politicalRisk}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="None">None</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Coordinator Performance
                                </label>
                                <select
                                    name="coordinatorPerformance"
                                    value={form.coordinatorPerformance}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Green">Green</option>
                                    <option value="Yellow">Yellow</option>
                                    <option value="Red">Red</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Risk / MD Context
                                </label>
                                <textarea
                                    name="riskMdContext"
                                    value={form.riskMdContext}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Last Action
                                </label>
                                <textarea
                                    name="lastAction"
                                    value={form.lastAction}
                                    onChange={handleChange}
                                    rows={3}

                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
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

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Next Action
                                </label>
                                <input
                                    name="nextAction"
                                    value={form.nextAction}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
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
                            <h2 className="text-sm font-bold text-slate-900">Submitted Site Control Records</h2>
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
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search site, coordinator, action..."
                                    className="w-full h-10 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <input
                                value={siteFilter}
                                onChange={(e) => setSiteFilter(e.target.value)}
                                placeholder="Filter by site"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />

                            <select
                                value={billingStatusFilter}
                                onChange={(e) => setBillingStatusFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Billing Status</option>
                                <option value="Not Raised">Not Raised</option>
                                <option value="Raised">Raised</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Recieved">Recieved</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Closed">Closed</option>
                            </select>

                            <select
                                value={siteStatusFilter}
                                onChange={(e) => setSiteStatusFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Site Status</option>
                                <option value="Partial">Partial</option>
                                <option value="Disrupted">Disrupted</option>
                                <option value="Normal">Normal</option>
                            </select>

                            <select
                                value={coordinatorPerformanceFilter}
                                onChange={(e) => setCoordinatorPerformanceFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Coordinator Performance</option>
                                <option value="Green">Green</option>
                                <option value="Yellow">Yellow</option>
                                <option value="Red">Red</option>
                            </select>

                            <select
                                value={clientControlFilter}
                                onChange={(e) => setClientControlFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Client Control</option>
                                <option value="Strong">Strong</option>
                                <option value="Manageable">Manageable</option>
                                <option value="Weak">Weak</option>
                                <option value="Critical">Critical</option>
                            </select>

                            <select
                                value={politicalRiskFilter}
                                onChange={(e) => setPoliticalRiskFilter(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Political Risk</option>
                                <option value="None">None</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs">Site</th>
                                    <th className="px-4 py-3 text-left text-xs">Coordinator</th>
                                    <th className="px-4 py-3 text-right text-xs">Authorised ₹</th>
                                    <th className="px-4 py-3 text-right text-xs">Under Billing ₹</th>
                                    <th className="px-4 py-3 text-left text-xs">Commitment Date</th>
                                    <th className="px-4 py-3 text-left text-xs">Billing Status</th>
                                    <th className="px-4 py-3 text-left text-xs">Site Status</th>
                                    <th className="px-4 py-3 text-left text-xs">Client Control</th>
                                    <th className="px-4 py-3 text-left text-xs">Political Risk</th>
                                    <th className="px-4 py-3 text-left text-xs">Coordinator Performance</th>
                                    <th className="px-4 py-3 text-left text-xs">Risk / MD Context</th>
                                    <th className="px-4 py-3 text-left text-xs">Last Action</th>
                                    <th className="px-4 py-3 text-left text-xs">Next Action</th>
                                    <th className="px-4 py-3 text-left text-xs">Owner</th>
                                    <th className="px-4 py-3 text-left text-xs">Deadline</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={15} className="px-4 py-10 text-center text-sm text-slate-400">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{record.site}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.coordinator || "-"}</td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{amount(record.authorisedAmount)}</td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{amount(record.underBillingAmount)}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(record.commitmentDate)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.billingStatus)}`}>
                                                    {record.billingStatus || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.siteStatus)}`}>
                                                    {record.siteStatus || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.clientControl)}`}>
                                                    {record.clientControl || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.politicalRisk)}`}>
                                                    {record.politicalRisk || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.coordinatorPerformance)}`}>
                                                    {record.coordinatorPerformance || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[260px]">{record.riskMdContext || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.lastAction || "-"}</td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">{record.nextAction || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.owner || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(record.deadline)}</td>
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