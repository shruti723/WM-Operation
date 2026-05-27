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

type DailySiteRecord = {
    id: string
    date: string
    siteName: string
    projectHead: string | null
    manpowerAuthorized: string | null
    deployed: string | null
    needed: string | null
    billSubmittedDate: string | null
    billAmountAuthorised: number | null
    billAmountClaimed: number | null
    paymentStatus: string | null
    paymentCreditDate: string | null
    salariesPaidForMonth: string | null
    salaryRelatedIssue: string | null
    operationalRisks: string | null
    risksIfAny: string | null
    operationalStatus: string | null
    hrIssue: string | null
    issueDetails: string | null
    clientStatus: string | null
    siteStatus: string | null
    createdAt: string
}

type WmSiteOption = {
    id: string
    siteName: string
    manpowerAuthorized: number
}

const initialForm = {
    date: new Date().toISOString().slice(0, 10),
    siteName: "",
    projectHead: "",

    manpowerAuthorized: "",
    deployed: "",
    needed: "",

    billSubmittedDate: "",
    billAmountAuthorised: "",
    billAmountClaimed: "",
    paymentStatus: "",
    paymentCreditDate: "",

    salariesPaidForMonth: "",
    salaryRelatedIssue: "",

    operationalRisks: "",
    risksIfAny: "",
    operationalStatus: "",

    hrIssue: "",
    issueDetails: "",

    clientStatus: "",
    siteStatus: "",
}

export default function DailySiteReportPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState(initialForm)
    const [records, setRecords] = useState<DailySiteRecord[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [search, setSearch] = useState("")
    const [siteFilter, setSiteFilter] = useState("")
    const [operationalStatusFilter, setOperationalStatusFilter] = useState("")
    const [operationalRiskFilter, setOperationalRiskFilter] = useState("")
    const [hrIssueFilter, setHrIssueFilter] = useState("")
    const [clientStatusFilter, setClientStatusFilter] = useState("")
    const [siteStatusFilter, setSiteStatusFilter] = useState("")
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
            if (operationalStatusFilter) params.set("operationalStatus", operationalStatusFilter)
            if (operationalRiskFilter) params.set("operationalRisks", operationalRiskFilter)
            if (hrIssueFilter) params.set("hrIssue", hrIssueFilter)
            if (clientStatusFilter) params.set("clientStatus", clientStatusFilter)
            if (siteStatusFilter) params.set("siteStatus", siteStatusFilter)
            if (fromDate) params.set("fromDate", fromDate)
            if (toDate) params.set("toDate", toDate)

            const siteControlRoles = ["Ravi", "Suyesh", "Mahendra", "Lakhan", "Deepak"]

            if (siteControlRoles.includes(user?.role)) {
                params.set("createdByEmail", user.email)
            }

            const res = await fetch(
                `/api/operation/site-tracker/daily-site-report?${params.toString()}`,
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

        setForm((prev) => {
            const updated = {
                ...prev,
                [name]: value,
            }

            if (name === "siteName") {
                const selectedSite = wmSites.find((site) => site.siteName === value)

                updated.manpowerAuthorized = selectedSite
                    ? String(selectedSite.manpowerAuthorized)
                    : ""
            }

            return updated
        })
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            alert("Please login again")
            return
        }

        if (!form.date) {
            alert("Date is required")
            return
        }

        if (!form.siteName.trim()) {
            alert("Site name is required")
            return
        }

        try {
            setSubmitting(true)

            const res = await fetch("/api/operation/site-tracker/daily-site-report", {
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

            alert("Daily site report submitted successfully")
            setForm({
                ...initialForm,
                date: new Date().toISOString().slice(0, 10),
            })
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
        setOperationalStatusFilter("")
        setOperationalRiskFilter("")
        setHrIssueFilter("")
        setClientStatusFilter("")
        setSiteStatusFilter("")
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

    const amount = (value: number | null) => {
        if (value === null || value === undefined) return "-"
        return value.toLocaleString("en-IN")
    }

    const pillClass = (value?: string | null) => {
        if (!value) return "bg-slate-50 text-slate-600 border-slate-100"

        if (["Open", "Normal", "No", "Paid", "Completed", "Green"].includes(value)) {
            return "bg-emerald-50 text-emerald-700 border-emerald-100"
        }

        if (["Partial", "Pending"].includes(value)) {
            return "bg-amber-50 text-amber-700 border-amber-100"
        }

        if (["Closed", "Disrupted", "Yes", "Unpaid", "Blocked", "Red"].includes(value)) {
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
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <ClipboardList size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            Daily Site Consolidation
                        </h1>

                    </div>
                </div>

                <div className="ml-auto text-xs text-slate-500">
                    {user?.name ? `Logged in as ${user.name}` : ""}
                </div>
            </header>

            <main className="w-full px-6 py-8">
                {/* FORM */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex items-center justify-between">
                        <div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Covers all sites under coordinator. Daily consolidation by 7 PM.
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
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Site Name <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="siteName"
                                    value={form.siteName}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                    Project Head
                                </label>
                                <input
                                    name="projectHead"
                                    value={form.projectHead}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Manpower Authorized
                                </label>
                                <input
                                    name="manpowerAuthorized"
                                    value={form.manpowerAuthorized}
                                    readOnly
                                    type="number"
                                    placeholder="Auto filled"
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Deployed
                                </label>
                                <input
                                    name="deployed"
                                    value={form.deployed}
                                    onChange={handleChange}
                                    type="number"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Needed
                                </label>
                                <input
                                    name="needed"
                                    value={form.needed}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="Enter needed manpower"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Bill Submitted Date
                                </label>
                                <input
                                    name="billSubmittedDate"
                                    value={form.billSubmittedDate}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Bill Amount Authorised
                                </label>
                                <input
                                    name="billAmountAuthorised"
                                    value={form.billAmountAuthorised}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Bill Amount Claimed
                                </label>
                                <input
                                    name="billAmountClaimed"
                                    value={form.billAmountClaimed}
                                    onChange={handleChange}
                                    type="number"

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Payment Status
                                </label>
                                <input
                                    name="paymentStatus"
                                    value={form.paymentStatus}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />


                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Payment Credit Date
                                </label>
                                <input
                                    name="paymentCreditDate"
                                    value={form.paymentCreditDate}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Salaries paid for the month?
                                </label>
                                <input
                                    name="salariesPaidForMonth"
                                    value={form.salariesPaidForMonth}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />

                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Salary Related Issue
                                </label>
                                <input
                                    name="salaryRelatedIssue"
                                    value={form.salaryRelatedIssue}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Operational Risks?
                                </label>
                                <select
                                    name="operationalRisks"
                                    value={form.operationalRisks}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Operational Status
                                </label>
                                <select
                                    name="operationalStatus"
                                    value={form.operationalStatus}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Disrupted">Disrupted</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Risks (if any)
                                </label>

                                <input
                                    name="risksIfAny"
                                    value={form.risksIfAny}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    HR Issue? (Forms, Recruitment, Ops)
                                </label>
                                <select
                                    name="hrIssue"
                                    value={form.hrIssue}
                                    onChange={handleChange}
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="select">Select</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Issue Details (if any)
                                </label>
                                <input
                                    name="issueDetails"
                                    value={form.issueDetails}
                                    onChange={handleChange}

                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Client satisfaction Status
                                </label>
                                <select
                                    name="clientStatus"
                                    value={form.clientStatus}
                                    onChange={handleChange}
                                    className={`w-full h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20
    ${form.clientStatus === "Green"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : form.clientStatus === "Red"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-white border-slate-200 text-slate-700"
                                        }`}
                                >
                                    <option value="select">Select</option>
                                    <option value="Green">Green</option>
                                    <option value="Red">Red</option>
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
                                    className={`w-full h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20
    ${form.siteStatus === "Green"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : form.siteStatus === "Red"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-white border-slate-200 text-slate-700"
                                        }`}
                                >
                                    <option value="">Select</option>
                                    <option value="Green">Green</option>
                                    <option value="Red">Red</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {submitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                                Submit
                            </button>
                        </div>
                    </form>
                </section>



                {/* TABLE */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-200 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Submitted Daily Site Reports
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

                        {/* Filters */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-3 relative">
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search site, head, issue..."
                                        className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <select
                                    value={operationalStatusFilter}
                                    onChange={(e) => setOperationalStatusFilter(e.target.value)}
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">Ops Status</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Disrupted">Disrupted</option>
                                </select>

                                <select
                                    value={operationalRiskFilter}
                                    onChange={(e) => setOperationalRiskFilter(e.target.value)}
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">Ops Risk</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>

                                <select
                                    value={hrIssueFilter}
                                    onChange={(e) => setHrIssueFilter(e.target.value)}
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">HR Issue</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>

                                <select
                                    value={clientStatusFilter}
                                    onChange={(e) => setClientStatusFilter(e.target.value)}
                                    className="md:col-span-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">Client</option>
                                    <option value="Green">Green</option>
                                    <option value="Red">Red</option>
                                </select>

                                <select
                                    value={siteStatusFilter}
                                    onChange={(e) => setSiteStatusFilter(e.target.value)}
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">Site Status</option>
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                </select>

                                <input
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    type="date"
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                />

                                <input
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    type="date"
                                    className="md:col-span-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                                />

                                <div className="md:col-span-8 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-[2200px] w-full text-sm">
                            <thead className="bg-slate-900 text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Site Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Project Head</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Authorized</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Deployed</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Needed</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Bill Submitted</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap">Bill Authorised</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap">Bill Claimed</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Payment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Credit Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Salary Paid</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Salary Issue</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Ops Risk</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Risks</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Ops Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">HR Issue</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Issue Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Client Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Site Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td
                                            colSpan={20}
                                            className="px-4 py-10 text-center text-sm text-slate-400"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="border-b border-slate-100 hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                                {record.siteName}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.projectHead || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.manpowerAuthorized || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.deployed || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {record.needed || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {formatDate(record.billSubmittedDate)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                                                {amount(record.billAmountAuthorised)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                                                {amount(record.billAmountClaimed)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.paymentStatus)}`}>
                                                    {record.paymentStatus || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {formatDate(record.paymentCreditDate)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.salariesPaidForMonth)}`}>
                                                    {record.salariesPaidForMonth || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[180px]">
                                                {record.salaryRelatedIssue || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.operationalRisks)}`}>
                                                    {record.operationalRisks || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">
                                                {record.risksIfAny || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.operationalStatus)}`}>
                                                    {record.operationalStatus || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.hrIssue)}`}>
                                                    {record.hrIssue || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 min-w-[220px]">
                                                {record.issueDetails || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.clientStatus)}`}>
                                                    {record.clientStatus || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass(record.siteStatus)}`}>
                                                    {record.siteStatus || "-"}
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