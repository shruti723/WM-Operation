"use client"

import { useEffect, useState } from "react"
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

    // ✅ ADD THESE
    recruitmentProcess?: string
    responsible?: string
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


    const filteredData = data.filter((item) => {

        const matchesSearch =
            item.siteName.toLowerCase().includes(search.toLowerCase())

        const itemDate = new Date(item.createdAt)

        const matchesFrom =
            !fromDate || itemDate >= new Date(fromDate)

        const matchesTo =
            !toDate || itemDate <= new Date(toDate)

        return matchesSearch && matchesFrom && matchesTo
    })

    /* ✅ LATEST RECORD PER SITE */
    const latestMap = new Map<string, RecordType>()

    filteredData.forEach((item) => {
        if (!latestMap.has(item.siteName)) {
            latestMap.set(item.siteName, item)
        }
    })

    const latestData = Array.from(latestMap.values())

    /* PAGINATION */
    const paginatedData = filteredData.slice(
        (page - 1) * perPage,
        page * perPage
    )

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

                const totalAuthorised = item.totalAuthorised || 0
                const totalDeployed = item.totalDeployed || 0
                const totalNeeded = item.totalNeeded || 0

                return {
                    id: item.submissionId,
                    siteName: item.site,
                    createdAt: item.createdOn || item.createdAt || "",

                    totalAuthorised,
                    totalDeployed,
                    totalNeeded,

                    recruitmentProcess: list[0]?.recruitmentProcess || "",
                    responsible: list[0]?.responsible || "",
                    remarks: list[0]?.remarks || "",

                    manpowerList: list.map((mp: any) => ({
                        ...mp,
                        cutoffDate: mp.cutoffDate || ""
                    }))
                }
            })

            setData(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- UPDATE (HR3 ONLY) ---------------- */

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
                    role: "level3", // 🔥 REQUIRED
                    submissionId: selected.id,
                    manpowerList: selected.manpowerList.map((mp) => ({
                        designation: mp.designation,
                        recruitmentProcess: mp.recruitmentProcess,
                        responsible: mp.responsible,
                        cutoffDate: mp.cutoffDate,
                        remarks: mp.remarks,
                    }))
                }),
            })

            alert("Updated successfully")
            setSelected(null)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">

                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-6 space-y-6">

                    {/* HEADER */}
                    <div className="mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Manpower Records
                        </h3>
                        <p className="text-sm text-gray-500">
                            Manage site manpower details
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">

                        <input
                            placeholder="Search site..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="h-11 w-[240px] rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-blue-300"
                        />

                        <span className="text-sm text-gray-500 font-medium">Filter:</span>

                        {/* FROM DATE */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="h-11 w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-left hover:bg-slate-50">
                                    {fromDate ? format(new Date(fromDate), "dd-MM-yyyy") : "From Date"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 bg-white shadow-lg border">
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

                        <span className="text-gray-400 text-sm">to</span>

                        {/* TO DATE */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="h-11 w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-left hover:bg-slate-50">
                                    {toDate ? format(new Date(toDate), "dd-MM-yyyy") : "To Date"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 bg-white shadow-lg border">
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

                        {(search || fromDate || toDate) && (
                            <button
                                onClick={() => {
                                    setSearch("")
                                    setFromDate("")
                                    setToDate("")
                                    setPage(1)
                                }}
                                className="h-11 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                        {/* TOTAL AUTH */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl text-lg">
                                👥
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Authorized</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce(
                                        (sum, item) =>
                                            sum +
                                            item.manpowerList.reduce(
                                                (a: number, b: ManpowerItem) => a + (b.authorised || 0),
                                                0
                                            ),
                                        0
                                    )}
                                </h2>
                            </div>
                        </div>

                        {/* DEPLOYED */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-green-100 text-green-600 p-3 rounded-xl text-lg">
                                👷
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Deployed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, i) => sum + i.totalDeployed, 0)}
                                </h2>
                            </div>
                        </div>

                        {/* NEEDED */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border">
                            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl text-lg">
                                📌
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Needed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, i) => sum + i.totalNeeded, 0)}
                                </h2>
                            </div>
                        </div>

                    </div>

                    {/* TABLE */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                        <table className="w-full text-sm table-fixed min-w-[1100px]">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-5 py-3 text-left">Site Name</th>
                                    <th className="px-5 py-3 text-center">Created On</th>
                                    <th className="px-5 py-3 text-center">Authorised</th>
                                    <th className="px-5 py-3 text-center">Deployed</th>
                                    <th className="px-5 py-3 text-center">Needed</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedData.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`border-t transition ${item.totalNeeded > 0
                                            ? "bg-red-50 hover:bg-red-100"
                                            : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <td className="px-5 py-3 font-medium text-slates-900">
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

                                        <td className={`px-5 py-3 text-center font-semibold ${item.totalNeeded > 0 ? "text-red-600" : "text-green-600"
                                            }`}>
                                            {item.totalNeeded || 0}
                                        </td>

                                        <td className="px-5 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelected(item)
                                                        setEditMode(false)
                                                    }}
                                                >
                                                    View
                                                </Button>

                                                <Button
                                                    onClick={() => {
                                                        setSelected(item)
                                                        setEditMode(true)
                                                    }}
                                                >
                                                    Update
                                                </Button>

                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => {
                                                        setSelected(null) // ✅ close modal if open
                                                        setChatSubmissionId(item.id)
                                                        setChatOpen(true)
                                                    }}
                                                >
                                                    💬 Chat
                                                </Button>
                                            </div> {/* 🔥 THIS WAS MISSING */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-white">

                            {/* LEFT TEXT */}
                            <p className="text-sm text-slate-500">
                                Page {page} of {Math.ceil(filteredData.length / perPage) || 1}
                            </p>

                            {/* BUTTONS */}
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Previous
                                </button>

                                <button
                                    disabled={page * perPage >= filteredData.length}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* MODAL */}
                    {
                        selected && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

                                <div className="bg-white p-6 rounded-xl w-[1200px] max-w-[95vw] max-h-[85vh] overflow-auto">

                                    <h3 className="text-lg font-semibold mb-4">
                                        Manpower Details
                                    </h3>



                                    {/* HR3 EDITABLE SECTION */}
                                    <div className="mt-6 border rounded-xl overflow-hidden">
                                        <div className="min-w-[1100px]">

                                            <table className="w-full text-sm table-fixed min-w-[1100px]">
                                                <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-2">Designation</th>
                                                        <th className="px-4 py-2 text-center">Auth</th>
                                                        <th className="px-4 py-2 text-center">Deployed</th>
                                                        <th className="px-4 py-2 text-center">Needed</th>
                                                        <th className="px-4 py-2">Process</th>
                                                        <th className="px-4 py-2">Responsible</th>
                                                        <th className="px-4 py-2">Cutoff</th>
                                                        <th className="px-4 py-2">Remarks</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {selected.manpowerList.map((mp, index) => (
                                                        <tr key={index} className="border-t">

                                                            {/* DESIGNATION */}
                                                            <td className="px-4 py-2">{mp.designation}</td>

                                                            {/* AUTH */}
                                                            <td className="px-4 py-2 text-center font-semibold text-yellow-600">
                                                                {mp.authorised}
                                                            </td>

                                                            {/* DEPLOYED */}
                                                            <td className="px-4 py-2 text-center text-blue-600 font-semibold">
                                                                {mp.deployed || 0}
                                                            </td>

                                                            {/* NEEDED */}
                                                            <td className="px-4 py-2 text-center text-orange-600 font-semibold">
                                                                {mp.needed || 0}
                                                            </td>

                                                            {/* PROCESS */}
                                                            <td className="px-4 py-2">
                                                                {editMode ? (
                                                                    <select
                                                                        value={mp.recruitmentProcess || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].recruitmentProcess = e.target.value
                                                                            setSelected({ ...selected, manpowerList: updated })
                                                                        }}
                                                                        className="w-full border rounded px-2 py-1"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="Under Process">Under Process</option>
                                                                        <option value="Completed">Completed</option>
                                                                        <option value="Not Required">Not Required</option>
                                                                        <option value="Unknown">Unknown</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600">
                                                                        {mp.recruitmentProcess || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* RESPONSIBLE */}
                                                            <td className="px-4 py-2">
                                                                {editMode ? (
                                                                    <select
                                                                        value={mp.responsible || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].responsible = e.target.value
                                                                            setSelected({ ...selected, manpowerList: updated })
                                                                        }}
                                                                        className="w-full border rounded px-2 py-1"
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="HR">HR</option>
                                                                        <option value="Assistant Manager">Assistant Manager</option>
                                                                        <option value="Site Supervisor">Site Supervisor</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-600">
                                                                        {mp.responsible || "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* CUTOFF */}
                                                            <td className="px-4 py-2">
                                                                {editMode ? (
                                                                    <input
                                                                        type="date"
                                                                        value={mp.cutoffDate || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].cutoffDate = e.target.value
                                                                            setSelected({ ...selected, manpowerList: updated })
                                                                        }}
                                                                        className="w-full border rounded px-2 py-1"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600">
                                                                        {mp.cutoffDate && !isNaN(new Date(mp.cutoffDate).getTime())
                                                                            ? format(new Date(mp.cutoffDate), "dd-MM-yyyy")
                                                                            : "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* REMARKS */}
                                                            <td className="px-4 py-2">
                                                                {editMode ? (
                                                                    <input
                                                                        value={mp.remarks || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...selected.manpowerList]
                                                                            updated[index].remarks = e.target.value
                                                                            setSelected({ ...selected, manpowerList: updated })
                                                                        }}
                                                                        className="w-full border rounded px-2 py-1"
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
                                    <div className="flex justify-end gap-3 mt-6">

                                        <Button onClick={() => setSelected(null)}>
                                            Close
                                        </Button>

                                        {editMode && (
                                            <Button onClick={handleUpdate}>
                                                Save Changes
                                            </Button>
                                        )}

                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div>
            {chatOpen && chatSubmissionId && currentUser && (
                <ChatDrawer
                    submissionId={chatSubmissionId}
                    user={currentUser}
                    siteName={data.find(d => d.id === chatSubmissionId)?.siteName}
                    onClose={() => {
                        setChatOpen(false)
                        setChatSubmissionId(null)
                    }}
                />
            )}
        </div>
    )
}