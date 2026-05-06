"use client"

import { Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/* ---------- HELPERS ---------- */

function formatDate(date: string) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

/* ---------- REUSABLE CARD ---------- */

function TableCard({ title, children }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border">
            <div className="px-6 py-4 border-b font-semibold text-slate-800">
                {title}
            </div>
            <div className="min-h-[500px] flex flex-col">
                {children}
            </div>
        </div>
    )
}

/* ---------- PAGE ---------- */

export default function ManpowerDetailsPage() {
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processFilter, setProcessFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [onlyNeeded, setOnlyNeeded] = useState(false)
    const [siteType, setSiteType] = useState("all")
    const [page, setPage] = useState(1)
    const ITEMS_PER_PAGE = 12

    /* ---------- FETCH ---------- */
    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch("/api/hr/admin-dashboard", { cache: "no-store" })
                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    /* ---------- FILTER LOGIC ---------- */
    const filtered = (data?.manpowerDetails || [])
        .filter((site: any) => {
            const matchesSearch =
                site.site.toLowerCase().includes(search.toLowerCase())

            const matchesStatus =
                status === "all" ||
                (status === "completed" && site.hr3Done) ||
                (status === "pending" && !site.hr3Done)

            const matchesType =
                siteType === "all" ||
                (site.siteCategory || "").toUpperCase() === siteType

            const itemDate = site.createdAt ? new Date(site.createdAt) : null

            const start = startDate ? new Date(startDate + "T00:00:00") : null
            const end = endDate ? new Date(endDate + "T23:59:59") : null

            const matchesStart =
                !start || (itemDate && itemDate >= start)

            const matchesEnd =
                !end || (itemDate && itemDate <= end)

            // const matchesNeeded =
            //     !onlyNeeded || Number(site.needed || 0) > 0

            const hasOnlyCompleted =
                site.processList?.length === 1 &&
                site.processList?.includes("Completed")

            const matchesNeeded =
                !onlyNeeded ||
                (
                    Number(site.needed || 0) > 0 &&
                    !hasOnlyCompleted
                )

            const matchesProcess =
                processFilter === "all" ||

                // ✅ check inside full list
                (processFilter !== "multiple" &&
                    processFilter !== "empty" &&
                    site.processList?.includes(processFilter)) ||

                // multiple
                (processFilter === "multiple" && site.processCount > 1) ||

                // empty
                (processFilter === "empty" && site.processCount === 0)

            return (
                matchesSearch &&
                matchesStatus &&
                matchesStart &&
                matchesEnd &&
                matchesNeeded &&
                matchesType &&
                matchesProcess

            )
        })
        .sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )

    /* ---------- PAGINATION ---------- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    /* ---------- FIX HOOK POSITION ---------- */
    useEffect(() => {
        if (page > totalPages) setPage(1)
    }, [filtered.length, totalPages])

    function clearFilters() {
        setSearch("")
        setStatus("all")
        setStartDate("")
        setEndDate("")
        setOnlyNeeded(false)
        setProcessFilter("all")
        setPage(1)
    }

    /* ---------- RETURN AFTER ALL HOOKS ---------- */
    if (loading) return <div className="p-6">Loading...</div>



    /* ---------- UI ---------- */

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Manpower Details
                </h1>
                <p className="text-sm text-slate-400">
                    Complete manpower records with filtering & tracking
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">

                <input
                    placeholder="Search by site name..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="border px-4 py-2 rounded-lg text-sm w-60"
                />

                {/* <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value)
                        setPage(1)
                    }}
                    className="border px-4 py-2 rounded-lg text-sm"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                </select> */}

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                        setStartDate(e.target.value)
                        setPage(1)
                    }}
                    className="border px-3 py-2 rounded-lg text-sm"
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                        setEndDate(e.target.value)
                        setPage(1)
                    }}
                    className="border px-3 py-2 rounded-lg text-sm"
                />

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={onlyNeeded}
                        onChange={(e) => {
                            setOnlyNeeded(e.target.checked)
                            setPage(1)
                        }}
                    />
                    <span>Needed &gt; 0</span>
                </label>

                <select
                    value={processFilter}
                    onChange={(e) => {
                        setProcessFilter(e.target.value)
                        setPage(1)
                    }}
                    className="border px-4 py-2 rounded-lg text-sm"
                >
                    <option value="all">All Process</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Required">Not Required</option>
                    <option value="Unknown">Unknown</option>

                </select>

                <select
                    value={siteType}
                    onChange={(e) => {
                        setSiteType(e.target.value)
                        setPage(1)
                    }}
                    className="border px-4 py-2 rounded-lg text-sm"
                >
                    <option value="all">All Types</option>
                    <option value="EXTERNAL">External</option>
                    <option value="OWN">Own</option>
                    <option value="MISC">Misc</option>
                </select>

                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                    Clear
                </button>

            </div>

            {/* Table */}
            <TableCard
                title={`Manpower Details (${filtered.length})`}
            >

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="p-3 text-center">Created At</th>
                            <th className="p-3 text-left">Site Name</th>
                            <th className="p-3 text-center">Authorised</th>
                            <th className="p-3 text-center">Deployed</th>
                            <th className="p-3 text-center">Shortage</th>
                            <th className="p-3 text-center">Needed</th>
                            <th className="p-3 text-center">Recruitment Process</th>
                            <th className="p-3 text-center">View</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-400 h-[300px]">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paginated.map((site: any, i: number) => (
                                <tr key={i} className="border-t hover:bg-gray-50 transition">

                                    <td className="p-3 text-center">
                                        {formatDate(site.createdAt)}
                                    </td>

                                    <td className="p-3 font-medium text-slate-800">
                                        {site.site}
                                    </td>

                                    <td className="p-3 text-center">
                                        {site.required}
                                    </td>

                                    <td className="p-3 text-center text-green-600">
                                        {site.deployed}
                                    </td>

                                    <td className="p-3 text-center text-red-600">
                                        {site.shortage}
                                    </td>

                                    <td className="p-3 text-center text-orange-600">
                                        {site.needed}
                                    </td>

                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${site.processLabel === "-"
                                            ? "bg-gray-100 text-gray-500"
                                            : site.processCount > 1
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-green-100 text-green-700"
                                            }`}>
                                            {site.processLabel}
                                        </span>
                                    </td>

                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/hr_dashboard/${site.siteId}?submissionId=${site.submissionId}` +
                                                    `&onlyNeeded=${onlyNeeded}` +
                                                    `&process=${processFilter}` +
                                                    `&siteType=${siteType}`
                                                )
                                            }
                                            className="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
                                        >
                                            <Eye className="w-5 h-5 text-blue-600" />
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 mt-auto border-t">

                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>

                </div>

            </TableCard>

        </div>
    )
}