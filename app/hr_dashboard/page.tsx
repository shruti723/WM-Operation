"use client"
import { Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
    Building2,
    Users,
    UserCheck,
    AlertCircle,
    Clock3,
    CheckCircle2,
} from "lucide-react"

function MetricCard({
    title,
    value,
    icon,
    border,
    bg,
}: {
    title: string
    value: number
    icon: React.ReactNode
    border: string
    bg: string
}) {
    return (
        <div className={`rounded-2xl border-2 ${border} bg-white p-6 shadow-sm hover:shadow-md transition`}>

            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <h4 className="mt-3 text-4xl font-bold text-gray-900">
                        {value}
                    </h4>
                </div>

                <div className={`h-14 w-14 flex items-center justify-center rounded-xl ${bg}`}>
                    {icon}
                </div>

            </div>

        </div>
    )
}

function formatDate(date: string) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

export default function HRAdminDashboard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sitePage, setSitePage] = useState(1)
    const [manpowerPage, setManpowerPage] = useState(1)

    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const ITEMS_PER_PAGE = 12

    const router = useRouter()

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




    const filteredManpower = (data?.manpowerDetails || [])
        .filter((site: any) => {

            const matchesSearch =
                site.site.toLowerCase().includes(search.toLowerCase())

            const matchesStatus =
                status === "all" ||
                (status === "completed" && site.hr3Done) ||
                (status === "pending" && !site.hr3Done)

            const itemDate = site.createdAt ? new Date(site.createdAt) : null

            const start = startDate ? new Date(startDate + "T00:00:00") : null
            const end = endDate ? new Date(endDate + "T23:59:59") : null

            const matchesStart =
                !start || (itemDate && itemDate >= start)

            const matchesEnd =
                !end || (itemDate && itemDate <= end)

            return matchesSearch && matchesStatus && matchesStart && matchesEnd
        })
        .sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )

    // Manpower pagination
    const manpowerStart = (manpowerPage - 1) * ITEMS_PER_PAGE
    const totalPages = Math.max(1, Math.ceil(filteredManpower.length / ITEMS_PER_PAGE))

    useEffect(() => {
        if (manpowerPage > totalPages) {
            setManpowerPage(1)
        }
    }, [filteredManpower.length, totalPages])


    if (loading) return <div className="p-6">Loading...</div>
    // Site pagination
    const siteStart = (sitePage - 1) * ITEMS_PER_PAGE
    const sitePaginated = data?.siteDetails?.slice(siteStart, siteStart + ITEMS_PER_PAGE)
    const manpowerPaginated = filteredManpower.slice(
        manpowerStart,
        manpowerStart + ITEMS_PER_PAGE
    )


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="w-full px-6 space-y-8">

                <div>
                    <h1 className="text-3xl font-bold">Manpower Dashboard</h1>
                    <p className="text-gray-500 text-sm">
                        Complete manpower & recruitment visibility
                    </p>
                </div>

                {/* 🔥 SUMMARY CARDS */}
                {/* 🔥 KEY METRICS */}
                <div className="space-y-6">

                    <div className="h-px bg-slate-200" />

                    <h3 className="text-xl font-semibold text-slate-800">
                        Key Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                        <MetricCard
                            title="Total Sites"
                            value={data?.summary?.totalSites || 0}
                            icon={<Building2 className="h-6 w-6 text-blue-600" />}
                            border="border-blue-200"
                            bg="bg-blue-50"
                        />

                        <MetricCard
                            title="Manpower Authorised"
                            value={data?.summary?.authorised || 0}
                            icon={<Users className="h-6 w-6 text-purple-600" />}
                            border="border-purple-200"
                            bg="bg-purple-50"
                        />

                        <MetricCard
                            title="Manpower Deployed"
                            value={data?.summary?.deployed || 0}
                            icon={<UserCheck className="h-6 w-6 text-green-600" />}
                            border="border-green-200"
                            bg="bg-green-50"
                        />

                        <MetricCard
                            title="Total Shortage"
                            value={data?.summary?.shortage || 0}
                            icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                            border="border-red-200"
                            bg="bg-red-50"
                        />

                        <MetricCard
                            title="Recruitment Needed"
                            value={data?.summary?.needed || 0}
                            icon={<Users className="h-6 w-6 text-orange-600" />}
                            border="border-orange-200"
                            bg="bg-orange-50"
                        />

                        <MetricCard
                            title="Pending HR3 Action"
                            value={data?.summary?.pendingHR3 || 0}
                            icon={<CheckCircle2 className="h-6 w-6 text-indigo-600" />}
                            border="border-indigo-200"
                            bg="bg-indigo-50"
                        />

                    </div>

                </div>



                <div className="bg-white rounded-2xl shadow-sm border">

                    <div className="px-6 py-4 border-b font-semibold">
                        Site Details
                    </div>

                    <div className="min-h-[500px] flex flex-col">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-3 text-left">Site</th>
                                    <th className="p-3">Start Date</th>
                                    <th className="p-3">Last Renewal</th>
                                    <th className="p-3">Next Renewal</th>
                                    <th className="p-3">Total Authorised</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>

                            <tbody className="align-top">

                                {sitePaginated?.map((site: any, i: number) => (
                                    <tr key={i} className="border-t hover:bg-gray-50">

                                        <td className="p-3 font-medium">{site.site}</td>

                                        <td className="p-3 text-center">
                                            {formatDate(site.startDate)}
                                        </td>

                                        <td className="p-3 text-center">
                                            {formatDate(site.lastRenewalDate)}
                                        </td>

                                        <td className="p-3 text-center">
                                            {formatDate(site.nextRenewalDate)}
                                        </td>

                                        <td className="p-3 text-center">
                                            {site.required}
                                        </td>


                                        <td className="p-3 text-center">
                                            <button

                                                onClick={() => router.push(`/hr_dashboard/${site.siteId}?type=hr1`)}
                                                className="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
                                            >
                                                <Eye className="w-5 h-5 text-blue-600" />
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-between items-center p-4 mt-auto">
                            <button
                                disabled={sitePage === 1}
                                onClick={() => setSitePage(sitePage - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            <span className="text-sm">
                                Page {sitePage}
                            </span>

                            <button
                                disabled={siteStart + ITEMS_PER_PAGE >= (data?.siteDetails?.length || 0)}
                                onClick={() => setSitePage(sitePage + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">

                    <input
                        placeholder="Search by site name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setManpowerPage(1)
                        }}
                        className="border px-4 py-2 rounded-lg text-sm w-60"
                    />

                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value)
                            setManpowerPage(1)
                        }}
                        className="border px-4 py-2 rounded-lg text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value)
                            setManpowerPage(1)
                        }}
                        className="border px-3 py-2 rounded-lg text-sm"
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value)
                            setManpowerPage(1)
                        }}
                        className="border px-3 py-2 rounded-lg text-sm"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border">

                    <div className="px-6 py-4 border-b font-semibold">
                        Manpower Details
                    </div>
                    <div className="min-h-[500px] flex flex-col">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-3">Created At</th>
                                    <th className="p-3 text-left">Site Name</th>
                                    <th className="p-3">Authorised</th>
                                    <th className="p-3">Deployed</th>
                                    <th className="p-3">Shortage</th>
                                    <th className="p-3">Needed</th>
                                    <th className="p-3">HR3</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>

                            <tbody className="align-top">
                                {filteredManpower.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-6 text-center text-gray-400 h-[300px] align-middle">
                                            No records found for selected filters
                                        </td>
                                    </tr>
                                ) : (
                                    manpowerPaginated?.map((site: any, i: number) => {


                                        return (
                                            <tr key={i} className="border-t hover:bg-gray-50 transition">

                                                <td className="p-3 text-center">
                                                    {site.createdAt ? formatDate(site.createdAt) : "-"}
                                                </td>

                                                <td className="p-3 font-medium">{site.site}</td>

                                                {/* HR1 */}
                                                <td className="p-3 text-center">{site.required}</td>

                                                {/* HR2 */}
                                                <td className="p-3 text-center text-green-600">
                                                    {site.deployed}
                                                </td>

                                                {/* Shortage */}
                                                <td className="p-3 text-center text-red-600">
                                                    {site.shortage}
                                                </td>

                                                {/* HR2 STATUS */}
                                                <td className="p-3 text-center text-red-600">
                                                    {site.needed}
                                                </td>

                                                {/* HR3 STATUS */}
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${site.hr3Done
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {site.hr3Done ? "Completed" : "Pending"}
                                                    </span>
                                                </td>

                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => router.push(`/hr_dashboard/${site.siteId}?submissionId=${site.submissionId}`)}
                                                        className="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition"
                                                    >
                                                        <Eye className="w-5 h-5 text-blue-600" />
                                                    </button>
                                                </td>

                                            </tr>
                                        )
                                    })
                                )}


                            </tbody>
                        </table>
                        <div className="flex justify-between items-center p-4 mt-auto">
                            <button

                                disabled={manpowerPage === 1}
                                onClick={() => setManpowerPage(manpowerPage - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            <span className="text-sm">
                                Page {manpowerPage} of {totalPages}
                            </span>

                            <button
                                disabled={manpowerPage === totalPages}
                                onClick={() => setManpowerPage(manpowerPage + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            <div className="grid md:grid-cols-2 gap-6">

            </div>
        </div>


    )
}