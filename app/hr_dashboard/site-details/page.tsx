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

export default function SiteDetailsPage() {
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sitePage, setSitePage] = useState(1)

    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const ITEMS_PER_PAGE = 12

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

    if (loading) return <div className="p-6">Loading...</div>

    /* ---------- PAGINATION ---------- */

    const filteredSites = (data?.siteDetails || []).filter((site: any) => {

        const matchesSearch =
            site.site.toLowerCase().includes(search.toLowerCase())

        const itemDate = site.startDate ? new Date(site.startDate) : null

        const start = startDate ? new Date(startDate + "T00:00:00") : null
        const end = endDate ? new Date(endDate + "T23:59:59") : null

        const matchesStart =
            !start || (itemDate && itemDate >= start)

        const matchesEnd =
            !end || (itemDate && itemDate <= end)

        return matchesSearch && matchesStart && matchesEnd
    })

    const siteStart = (sitePage - 1) * ITEMS_PER_PAGE

    const sitePaginated = filteredSites.slice(
        siteStart,
        siteStart + ITEMS_PER_PAGE
    )

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSites.length / ITEMS_PER_PAGE)
    )


    /* ---------- UI ---------- */

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Site Details
                </h1>
                <p className="text-sm text-slate-400">
                    Overview of all site contracts and renewals
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">

                <input
                    placeholder="Search by site name..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setSitePage(1)
                    }}
                    className="border px-4 py-2 rounded-lg text-sm w-60"
                />



                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                        setStartDate(e.target.value)
                        setSitePage(1)
                    }}
                    className="border px-3 py-2 rounded-lg text-sm"
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                        setEndDate(e.target.value)
                        setSitePage(1)
                    }}
                    className="border px-3 py-2 rounded-lg text-sm"
                />



            </div>

            {/* Table */}
            <TableCard title="Site Details">

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="p-3 text-left">Site</th>
                            <th className="p-3 text-center">Start Date</th>
                            <th className="p-3 text-center">Last Renewal</th>
                            <th className="p-3 text-center">Next Renewal</th>
                            <th className="p-3 text-center">Total Authorised</th>
                            <th className="p-3 text-center">View</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sitePaginated?.map((site: any, i: number) => (
                            <tr key={i} className="border-t hover:bg-gray-50 transition">

                                {/* Site */}
                                <td className="p-3 font-medium text-slate-800">
                                    {site.site}
                                </td>

                                {/* Dates */}
                                <td className="p-3 text-center">
                                    {formatDate(site.startDate)}
                                </td>

                                <td className="p-3 text-center">
                                    {formatDate(site.lastRenewalDate)}
                                </td>

                                <td className="p-3 text-center">
                                    {formatDate(site.nextRenewalDate)}
                                </td>

                                {/* Authorised */}
                                <td className="p-3 text-center font-medium">
                                    {site.required}
                                </td>

                                {/* Action */}
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() =>
                                            router.push(`/hr_dashboard/${site.siteId}?type=hr1`)
                                        }
                                        className="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
                                    >
                                        <Eye className="w-5 h-5 text-blue-600" />
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 mt-auto border-t">

                    <button
                        disabled={sitePage === 1}
                        onClick={() => setSitePage(sitePage - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="text-sm text-slate-600">
                        Page {sitePage} of {totalPages}
                    </span>

                    <button
                        disabled={sitePage === totalPages}
                        onClick={() => setSitePage(sitePage + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>

                </div>

            </TableCard>

        </div>
    )
}