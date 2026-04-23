"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, ArrowLeft } from "lucide-react"
import ChatDrawer from "@/components/chat/ChatDrawer"
import Header from "@/components/hr/Header"


export default function ManpowerPage() {
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [page, setPage] = useState(1)

    const [selectedSite, setSelectedSite] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [onlyNeeded, setOnlyNeeded] = useState(false)

    const [chatOpen, setChatOpen] = useState(false)
    const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)

    const ITEMS_PER_PAGE = 12

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}")
        setCurrentUser(user)
    }, [])


    useEffect(() => {
        function handleOpenChat(event: any) {
            const submissionId = event.detail?.submissionId

            if (submissionId) {
                setChatSubmissionId(submissionId)
                setChatOpen(true)
            }
        }

        window.addEventListener("openChat", handleOpenChat)

        return () => {
            window.removeEventListener("openChat", handleOpenChat)
        }
    }, [])

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
    useEffect(() => {
        setPage(1)
    }, [search, status, selectedSite, startDate, endDate, onlyNeeded])

    if (loading) return <div className="p-6">Loading...</div>
    const siteOptions: string[] = Array.from(
        new Set((data?.manpowerDetails || []).map((s: any) => s.site))
    )

    const filtered = (data?.manpowerDetails || []).filter((site: any) => {

        const matchesSearch =
            site.site.toLowerCase().includes(search.toLowerCase())

        const matchesStatus =
            status === "all" ||
            (status === "completed" && site.hr3Done) ||
            (status === "pending" && !site.hr3Done)

        const matchesSite =
            selectedSite === "all" || site.site === selectedSite

        const itemDate = site.createdAt ? new Date(site.createdAt) : null

        const start = startDate ? new Date(startDate + "T00:00:00") : null
        const end = endDate ? new Date(endDate + "T23:59:59") : null

        const matchesStart = !start || (itemDate && itemDate >= start)
        const matchesEnd = !end || (itemDate && itemDate <= end)

        const matchesNeeded =
            !onlyNeeded || site.needed > 0

        return (
            matchesSearch &&
            matchesStatus &&
            matchesSite &&
            matchesStart &&
            matchesEnd &&
            matchesNeeded
        )
    })

    const start = (page - 1) * ITEMS_PER_PAGE
    const paginated = filtered.slice(start, start + ITEMS_PER_PAGE)
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))

    const clearFilters = () => {
        setSearch("")
        setStatus("all")
        setSelectedSite("all")
        setStartDate("")
        setEndDate("")
        setOnlyNeeded(false)
        setPage(1)
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* 🔔 GLOBAL HEADER */}
            <div className="px-6 pt-4 sticky top-0 z-50 bg-slate-50">
                <Header toggleSidebar={() => { }} />
            </div>

            {/* PAGE CONTENT */}
            <div className="p-6">

                <div className="max-w-7xl mx-auto space-y-6">

                    {/* 🔙 HEADER */}
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Manpower Details
                        </h1>
                        <p className="text-sm text-gray-500">
                            All site manpower summary
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm">

                        {/* 🔍 Search */}
                        <input
                            placeholder="Search site..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border px-4 py-2 rounded-lg text-sm w-52"
                        />

                        {/* 📍 Site Dropdown */}
                        <select
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                            className="border px-4 py-2 rounded-lg text-sm"
                        >
                            <option value="all">All Sites</option>
                            {siteOptions.map((s: string, i: number) => (
                                <option key={i} value={s}>{s}</option>
                            ))}
                        </select>

                        {/* 📅 Date From */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border px-3 py-2 rounded-lg text-sm"
                        />

                        {/* 📅 Date To */}
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border px-3 py-2 rounded-lg text-sm"
                        />

                        {/* ⚠️ Needed > 0 */}
                        <label className="flex items-center gap-2 text-sm px-3">
                            <input
                                type="checkbox"
                                checked={onlyNeeded}
                                onChange={(e) => setOnlyNeeded(e.target.checked)}
                            />
                            Needed &gt; 0
                        </label>

                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition"
                        >
                            Clear Filters
                        </button>

                    </div>

                    {/* 📊 TABLE */}
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                        <div className="px-6 py-4 border-b font-semibold">
                            Manpower Details
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-3 text-center">Created On</th>
                                        <th className="p-3 text-left">Site Name</th>
                                        <th className="p-3 text-center">Authorised</th>
                                        <th className="p-3 text-center">Deployed</th>
                                        <th className="p-3 text-center">Shortage</th>
                                        <th className="p-3 text-center">Needed</th>

                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-gray-400">
                                                No data available
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((site: any, i: number) => (
                                            <tr key={i} className="border-t hover:bg-gray-50">
                                                <td className="p-3 text-center text-slate-600">
                                                    {site.createdAt
                                                        ? new Date(site.createdAt).toLocaleDateString("en-GB")
                                                        : "-"}
                                                </td>

                                                <td className="p-3 font-medium">
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
                                                    <div className="flex justify-center gap-2">

                                                        {/* 👁 View */}
                                                        <button
                                                            onClick={() =>
                                                                router.push(
                                                                    `/hr_dashboard/${site.siteId}?submissionId=${site.submissionId}`
                                                                )
                                                            }
                                                            className="p-2 rounded-lg border hover:bg-blue-50"
                                                        >
                                                            <Eye className="w-5 h-5 text-blue-600" />
                                                        </button>

                                                        {/* 💬 Chat */}
                                                        <button
                                                            onClick={() => {
                                                                setChatSubmissionId(site.submissionId)
                                                                setChatOpen(true)
                                                            }}
                                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                        >
                                                            💬 Chat
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 📄 PAGINATION */}
                        <div className="flex justify-between items-center p-4">

                            {/* LEFT */}
                            <span className="text-sm text-gray-600">
                                Page {page} / {totalPages}
                            </span>

                            {/* RIGHT */}
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>

                        </div>

                    </div>

                </div>
                {chatOpen && chatSubmissionId && currentUser && (
                    <ChatDrawer
                        submissionId={chatSubmissionId}
                        user={currentUser}
                        siteName={
                            filtered.find((s: any) => s.submissionId === chatSubmissionId)?.site
                        }
                        onClose={() => {
                            setChatOpen(false)
                            setChatSubmissionId(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}