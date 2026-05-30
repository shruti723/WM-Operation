"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import ChatDrawer from "@/components/chat/ChatDrawer"

/* ---------------- TYPES ---------------- */

type ManpowerItem = {
    designation: string
    authorised: number
    deployed?: number
    needed?: number
    recruitmentProcess?: string
    responsible?: string
    priority?: string
    cutoffDate?: string
    remarks?: string
}

type RecordType = {
    id: string
    siteName: string
    manpowerList: ManpowerItem[]
    recruitmentProcess?: string
    responsible?: string
    cutoffDate?: string
    remarks?: string
    createdAt: string
    totalDeployed: number
    totalNeeded: number
    totalAuthorised: number
}

/* ---------------- HELPERS ---------------- */

function getHr3Status(item: RecordType) {
    const allNotNeeded =
        item.manpowerList.length > 0 &&
        item.manpowerList.every(
            (mp) => mp.recruitmentProcess === "Not Needed"
        )

    const allJoinedOrNotNeeded =
        item.manpowerList.length > 0 &&
        item.manpowerList.every(
            (mp) =>
                mp.recruitmentProcess === "Joined" ||
                mp.recruitmentProcess === "Not Needed"
        )

    const hasActiveProcess = item.manpowerList.some(
        (mp) =>
            mp.recruitmentProcess === "Source" ||
            mp.recruitmentProcess === "Screened" ||
            mp.recruitmentProcess === "Shortlisted" ||
            mp.recruitmentProcess === "Hired"
    )

    const hasHr3Details = item.manpowerList.some(
        (mp) =>
            Number(mp.needed || 0) > 0 ||
            !!mp.responsible ||
            !!mp.priority ||
            !!mp.cutoffDate ||
            !!mp.remarks
    )

    if (allNotNeeded || allJoinedOrNotNeeded) {
        return "Completed"
    }

    if (hasActiveProcess || hasHr3Details) {
        return "In Progress"
    }

    return "Pending"
}

function getNearestCutoffDate(item: RecordType) {
    const validDates = item.manpowerList
        .map((mp) => mp.cutoffDate)
        .filter((date): date is string => {
            if (!date) return false
            return !isNaN(new Date(date).getTime())
        })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    return validDates[0] || ""
}

function getCutoffStatus(item: RecordType) {
    const cutoffDate = getNearestCutoffDate(item)

    if (!cutoffDate) {
        return "No Cutoff"
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cutoff = new Date(cutoffDate)
    cutoff.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil(
        (cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays < 0) return "Crossed"
    if (diffDays === 0) return "Due Today"
    if (diffDays <= 3) return "Due Soon"

    return "On Track"
}

function getCutoffStatusClass(status: string) {
    if (status === "Crossed") {
        return "bg-red-50 text-red-700 border-red-200"
    }

    if (status === "Due Today") {
        return "bg-orange-50 text-orange-700 border-orange-200"
    }

    if (status === "Due Soon") {
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }

    if (status === "On Track") {
        return "bg-green-50 text-green-700 border-green-200"
    }

    return "bg-slate-50 text-slate-600 border-slate-200"
}

function getStatusClass(status: string) {
    if (status === "Completed") {
        return "bg-green-50 text-green-700 border-green-200"
    }

    if (status === "In Progress") {
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }

    return "bg-red-50 text-red-700 border-red-200"
}

/* ---------------- MAIN ---------------- */

export default function HR3Table() {
    const [data, setData] = useState<RecordType[]>([])
    const [loading, setLoading] = useState(true)

    const [selected, setSelected] = useState<RecordType | null>(null)
    const [editMode, setEditMode] = useState(false)

    const [search, setSearch] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [page, setPage] = useState(1)
    const perPage = 10

    const [chatOpen, setChatOpen] = useState(false)
    const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [onlyNeeded, setOnlyNeeded] = useState(false)

    const [onlyCrossedCutoff, setOnlyCrossedCutoff] = useState(false)

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}")
        setCurrentUser(user)
    }, [])

    useEffect(() => {
        const handler = (e: any) => {
            const submissionId = e.detail.submissionId
            setChatSubmissionId(submissionId)
            setChatOpen(true)
        }

        window.addEventListener("openChat", handler)
        return () => window.removeEventListener("openChat", handler)
    }, [])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch("/api/hr/dashboard-table?role=level3", {
                cache: "no-store",
            })

            const json = await res.json()

            const formatted = (json.data || []).map((item: any) => {
                const list = Array.isArray(item.manpowerList) ? item.manpowerList : []

                const formattedList = list.map((mp: any) => ({
                    ...mp,
                    authorised: Number(mp.authorised || 0),
                    deployed: Number(mp.deployed || 0),
                    needed: Number(mp.needed || 0),
                    cutoffDate: mp.cutoffDate || "",
                    recruitmentProcess: mp.recruitmentProcess || "",
                    responsible: mp.responsible || "",
                    remarks: mp.remarks || "",
                    priority: mp.priority || "",
                }))

                const totalAuthorised =
                    item.totalAuthorised ??
                    formattedList.reduce(
                        (sum: number, mp: ManpowerItem) => sum + Number(mp.authorised || 0),
                        0
                    )

                const totalDeployed =
                    item.totalDeployed ??
                    formattedList.reduce(
                        (sum: number, mp: ManpowerItem) => sum + Number(mp.deployed || 0),
                        0
                    )

                const totalNeeded =
                    item.totalNeeded ??
                    formattedList.reduce(
                        (sum: number, mp: ManpowerItem) => sum + Number(mp.needed || 0),
                        0
                    )

                return {
                    id: item.submissionId,
                    siteName: item.site,
                    createdAt: item.createdOn || item.createdAt || "",

                    totalAuthorised,
                    totalDeployed,
                    totalNeeded,

                    recruitmentProcess: formattedList[0]?.recruitmentProcess || "",
                    responsible: formattedList[0]?.responsible || "",
                    remarks: formattedList[0]?.remarks || "",

                    manpowerList: formattedList,
                }
            })

            setData(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const matchesSearch = item.siteName
                .toLowerCase()
                .includes(search.toLowerCase())

            const itemDate = new Date(item.createdAt)

            const matchesFrom = !fromDate || itemDate >= new Date(fromDate)

            const matchesTo = !toDate || itemDate <= new Date(toDate)

            const matchesNeeded = !onlyNeeded || item.totalNeeded > 0

            const matchesCrossedCutoff =
                !onlyCrossedCutoff || getCutoffStatus(item) === "Crossed"

            return (
                matchesSearch &&
                matchesFrom &&
                matchesTo &&
                matchesNeeded &&
                matchesCrossedCutoff
            )
        })
    }, [data, search, fromDate, toDate, onlyNeeded, onlyCrossedCutoff])

    /* Latest only for summary cards. Main table still shows repeated weekly records. */
    const latestData = useMemo(() => {
        const latestMap = new Map<string, RecordType>()

        filteredData.forEach((item) => {
            const existing = latestMap.get(item.siteName)

            if (
                !existing ||
                new Date(item.createdAt).getTime() > new Date(existing.createdAt).getTime()
            ) {
                latestMap.set(item.siteName, item)
            }
        })

        return Array.from(latestMap.values())
    }, [filteredData])

    const totalPages = Math.ceil(filteredData.length / perPage) || 1

    const paginatedData = filteredData.slice(
        (page - 1) * perPage,
        page * perPage
    )

    async function handleUpdate() {
        if (!selected) return

        try {
            await fetch("/api/hr/update-manpower", {
                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role: "level3",
                    submissionId: selected.id,
                    manpowerList: selected.manpowerList.map((mp) => ({
                        designation: mp.designation,
                        needed: Number(mp.needed || 0),
                        recruitmentProcess: mp.recruitmentProcess,
                        responsible: mp.responsible,
                        priority: mp.priority,
                        cutoffDate: mp.cutoffDate,
                        remarks: mp.remarks,
                    })),
                }),
            })

            alert("Updated successfully")
            setSelected(null)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 text-slate-500">
                Loading...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6">

                <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white shadow-sm p-4 sm:p-6 space-y-6">

                    {/* HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                Recruitment Records
                            </h3>
                            <p className="text-sm text-gray-500">
                                Track weekly manpower records and update needed manpower with recruitment status.
                            </p>
                        </div>


                    </div>

                    {/* FILTERS */}
                    <div className="flex flex-col xl:flex-row xl:items-center gap-3">

                        <input
                            placeholder="Search site..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="h-11 w-full xl:w-[260px] rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className="text-sm text-gray-500 font-medium">
                                Filter:
                            </span>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="h-11 w-full sm:w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-left hover:bg-slate-50">
                                        {fromDate
                                            ? format(new Date(fromDate), "dd-MM-yyyy")
                                            : "From Date"}
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="p-0 bg-white shadow-lg border z-[9999]">
                                    <Calendar
                                        mode="single"
                                        selected={fromDate ? new Date(fromDate) : undefined}
                                        onSelect={(date) => {
                                            if (!date) return
                                            setFromDate(format(date, "yyyy-MM-dd"))
                                            setPage(1)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            <span className="hidden sm:inline text-gray-400 text-sm">
                                to
                            </span>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="h-11 w-full sm:w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-left hover:bg-slate-50">
                                        {toDate
                                            ? format(new Date(toDate), "dd-MM-yyyy")
                                            : "To Date"}
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="p-0 bg-white shadow-lg border z-[9999]">
                                    <Calendar
                                        mode="single"
                                        selected={toDate ? new Date(toDate) : undefined}
                                        onSelect={(date) => {
                                            if (!date) return
                                            setToDate(format(date, "yyyy-MM-dd"))
                                            setPage(1)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <label className="flex items-center gap-2 text-sm cursor-pointer h-11 px-3 rounded-xl border border-gray-200 bg-white">
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

                        <label className="flex items-center gap-2 text-sm cursor-pointer h-11 px-3 rounded-xl border border-gray-200 bg-white">
                            <input
                                type="checkbox"
                                checked={onlyCrossedCutoff}
                                onChange={(e) => {
                                    setOnlyCrossedCutoff(e.target.checked)
                                    setPage(1)
                                }}
                            />
                            <span>Crossed Cutoff</span>
                        </label>

                        {(search || fromDate || toDate || onlyNeeded || onlyCrossedCutoff) && (
                            <button
                                onClick={() => {
                                    setSearch("")
                                    setFromDate("")
                                    setToDate("")
                                    setOnlyNeeded(false)
                                    setOnlyCrossedCutoff(false)
                                    setPage(1)
                                }}
                                className="h-11 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl text-lg">
                                👥
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Authorized</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, item) => sum + item.totalAuthorised, 0)}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-green-100 text-green-600 p-3 rounded-xl text-lg">
                                👷
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Deployed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, item) => sum + item.totalDeployed, 0)}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl text-lg">
                                📌
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Needed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, item) => sum + item.totalNeeded, 0)}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-red-100 text-red-600 p-3 rounded-xl text-lg">
                                ⚠️
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <h2 className="text-2xl font-semibold">
                                    {filteredData.filter((item) => getHr3Status(item) === "Pending").length}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-red-100 text-red-600 p-3 rounded-xl text-lg">
                                ⏰
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Crossed Cutoff</p>
                                <h2 className="text-2xl font-semibold">
                                    {
                                        filteredData.filter(
                                            (item) => getCutoffStatus(item) === "Crossed"
                                        ).length
                                    }
                                </h2>
                            </div>
                        </div>

                    </div>

                    {/* TABLE */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1350px] text-sm table-fixed">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-5 py-3 text-left w-[260px]">Site Name</th>
                                        <th className="px-5 py-3 text-center w-[130px]">Created On</th>
                                        <th className="px-5 py-3 text-center w-[120px]">Authorised</th>
                                        <th className="px-5 py-3 text-center w-[120px]">Deployed</th>
                                        <th className="px-5 py-3 text-center w-[120px]">Needed</th>
                                        <th className="px-5 py-3 text-center w-[150px]">Status</th>
                                        <th className="px-5 py-3 text-center w-[150px]">Cutoff Date</th>
                                        <th className="px-5 py-3 text-center w-[150px]">Cutoff Status</th>
                                        <th className="px-5 py-3 text-center w-[260px]">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-8 text-center text-gray-500"
                                            >
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item) => {
                                            const status = getHr3Status(item)

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`border-t transition ${item.totalNeeded > 0
                                                        ? "bg-orange-50 hover:bg-orange-100"
                                                        : "hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-normal break-words">
                                                        {item.siteName}
                                                    </td>

                                                    <td className="px-5 py-3 text-center text-gray-600">
                                                        {item.createdAt
                                                            ? format(new Date(item.createdAt), "dd-MM-yyyy")
                                                            : "-"}
                                                    </td>

                                                    <td className="px-5 py-3 text-center font-semibold text-yellow-600">
                                                        {item.totalAuthorised || 0}
                                                    </td>

                                                    <td className="px-5 py-3 text-center font-semibold text-blue-600">
                                                        {item.totalDeployed || 0}
                                                    </td>

                                                    <td
                                                        className={`px-5 py-3 text-center font-semibold ${item.totalNeeded > 0
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                            }`}
                                                    >
                                                        {item.totalNeeded || 0}
                                                    </td>



                                                    <td className="px-5 py-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-3 text-center text-gray-700">
                                                        {getNearestCutoffDate(item)
                                                            ? format(new Date(getNearestCutoffDate(item)), "dd-MM-yyyy")
                                                            : "-"}
                                                    </td>

                                                    <td className="px-5 py-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getCutoffStatusClass(
                                                                getCutoffStatus(item)
                                                            )}`}
                                                        >
                                                            {getCutoffStatus(item)}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-3 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-slate-900 hover:bg-slate-800 text-white"
                                                                onClick={() => {
                                                                    setSelected(item)
                                                                    setEditMode(false)
                                                                }}
                                                            >
                                                                View
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                onClick={() => {
                                                                    setSelected(item)
                                                                    setEditMode(true)
                                                                }}
                                                            >
                                                                Update
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => {
                                                                    setSelected(null)
                                                                    setChatSubmissionId(item.id)
                                                                    setChatOpen(true)
                                                                }}
                                                            >
                                                                💬 Chat
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t bg-white">
                            <p className="text-sm text-slate-500">
                                Page {page} of {totalPages}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Previous
                                </button>

                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MODAL */}
                    {selected && (
                        <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
                            <div className="bg-white rounded-2xl w-full max-w-[1250px] max-h-[90vh] overflow-y-auto shadow-2xl">

                                {/* MODAL HEADER */}
                                <div className="sticky top-0 bg-white z-20 border-b px-4 sm:px-6 py-4 rounded-t-2xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                                Manpower Details
                                            </h3>
                                            <p className="text-sm text-gray-500 break-words">
                                                {selected.siteName}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setSelected(null)}
                                            className="self-end sm:self-auto rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 space-y-5">

                                    {/* MODAL SUMMARY */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="rounded-xl border bg-yellow-50 p-4">
                                            <p className="text-xs text-yellow-700">Authorised</p>
                                            <h4 className="text-xl font-bold text-yellow-700">
                                                {selected.totalAuthorised}
                                            </h4>
                                        </div>

                                        <div className="rounded-xl border bg-blue-50 p-4">
                                            <p className="text-xs text-blue-700">Deployed</p>
                                            <h4 className="text-xl font-bold text-blue-700">
                                                {selected.totalDeployed}
                                            </h4>
                                        </div>

                                        <div className="rounded-xl border bg-orange-50 p-4">
                                            <p className="text-xs text-orange-700">Needed</p>
                                            <h4 className="text-xl font-bold text-orange-700">
                                                {selected.manpowerList.reduce(
                                                    (sum, mp) => sum + Number(mp.needed || 0),
                                                    0
                                                )}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* HR3 EDITABLE SECTION */}
                                    <div className="border rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm table-fixed min-w-[1320px]">
                                                <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left w-[220px]">Designation</th>
                                                        <th className="px-4 py-3 text-center w-[100px]">Auth</th>
                                                        <th className="px-4 py-3 text-center w-[110px]">Deployed</th>
                                                        <th className="px-4 py-3 text-center w-[130px]">Needed</th>
                                                        <th className="px-4 py-3 text-left w-[180px]">Process</th>
                                                        <th className="px-4 py-3 text-left w-[150px]">Responsible</th>
                                                        <th className="px-4 py-3 text-left w-[150px]">Priority</th>
                                                        <th className="px-4 py-3 text-left w-[150px]">Cutoff</th>
                                                        <th className="px-4 py-3 text-left w-[220px]">Remarks</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {selected.manpowerList.map((mp, index) => (
                                                        <tr key={index} className="border-t">

                                                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-normal break-words">
                                                                {mp.designation}
                                                            </td>

                                                            <td className="px-4 py-3 text-center font-semibold text-yellow-600">
                                                                {mp.authorised}
                                                            </td>

                                                            <td className="px-4 py-3 text-center text-blue-600 font-semibold">
                                                                {mp.deployed || 0}
                                                            </td>

                                                            {/* ✅ NEEDED IS NOW EDITABLE FOR HR3 */}
                                                            <td className="px-4 py-3 text-center">
                                                                {editMode ? (
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        value={mp.needed ?? ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            const needed = Math.max(
                                                                                0,
                                                                                Number(e.target.value)
                                                                            )

                                                                            updated[index].needed = needed

                                                                            const totalNeeded = updated.reduce(
                                                                                (sum, row) =>
                                                                                    sum + Number(row.needed || 0),
                                                                                0
                                                                            )

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                                totalNeeded,
                                                                            })
                                                                        }}
                                                                        className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center outline-none focus:ring-2 focus:ring-purple-500"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className={`font-semibold ${Number(mp.needed || 0) > 0
                                                                            ? "text-orange-600"
                                                                            : "text-green-600"
                                                                            }`}
                                                                    >
                                                                        {mp.needed || 0}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                {editMode ? (
                                                                    <select
                                                                        value={mp.recruitmentProcess || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].recruitmentProcess = e.target.value

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                            })
                                                                        }}
                                                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="Source">Source</option>
                                                                        <option value="Screened">Screened</option>
                                                                        <option value="Shortlisted">Shortlisted</option>
                                                                        <option value="Hired">Hired</option>
                                                                        <option value="Joined">Joined</option>
                                                                        <option value="Not Needed">Not Needed</option>
                                                                        <option value="Not Started">Not Started</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="inline-flex px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600">
                                                                        {mp.recruitmentProcess || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                {editMode ? (
                                                                    <select
                                                                        value={mp.responsible || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].responsible = e.target.value

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                            })
                                                                        }}
                                                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="HR Team">HR Team</option>
                                                                        <option value="Site Team">Site Team</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="inline-flex px-2 py-1 text-xs rounded-lg bg-green-50 text-green-600">
                                                                        {mp.responsible || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* PRIORITY STATUS */}
                                                            <td className="px-4 py-3">
                                                                {editMode ? (
                                                                    <select
                                                                        value={mp.priority || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].priority = e.target.value

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                            })
                                                                        }}
                                                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="Critical">Critical</option>
                                                                        <option value="High">High</option>
                                                                        <option value="Medium">Medium</option>
                                                                    </select>
                                                                ) : (
                                                                    <span
                                                                        className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${mp.priority === "Critical"
                                                                            ? "bg-red-50 text-red-700"
                                                                            : mp.priority === "High"
                                                                                ? "bg-orange-50 text-orange-700"
                                                                                : mp.priority === "Medium"
                                                                                    ? "bg-yellow-50 text-yellow-700"
                                                                                    : "bg-slate-50 text-slate-600"
                                                                            }`}
                                                                    >
                                                                        {mp.priority || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                {editMode ? (
                                                                    <input
                                                                        type="date"
                                                                        value={mp.cutoffDate || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].cutoffDate = e.target.value

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                            })
                                                                        }}
                                                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600">
                                                                        {mp.cutoffDate &&
                                                                            !isNaN(new Date(mp.cutoffDate).getTime())
                                                                            ? format(new Date(mp.cutoffDate), "dd-MM-yyyy")
                                                                            : "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                {editMode ? (
                                                                    <input
                                                                        value={mp.remarks || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].remarks = e.target.value

                                                                            setSelected({
                                                                                ...selected,
                                                                                manpowerList: updated,
                                                                            })
                                                                        }}
                                                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                                        placeholder="Remarks"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600">
                                                                        {mp.remarks || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* BUTTONS */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSelected(null)}
                                        >
                                            Close
                                        </Button>

                                        {editMode && (
                                            <Button
                                                type="button"
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                onClick={handleUpdate}
                                            >
                                                Save Changes
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {chatOpen && chatSubmissionId && currentUser && (
                <ChatDrawer
                    submissionId={chatSubmissionId}
                    user={currentUser}
                    siteName={data.find((d) => d.id === chatSubmissionId)?.siteName || ""}
                    onClose={() => {
                        setChatOpen(false)
                        setChatSubmissionId(null)
                    }}
                />
            )}
        </div>
    )
}