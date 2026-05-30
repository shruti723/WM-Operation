"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import ChatDrawer from "@/components/chat/ChatDrawer"

/* ---------------- TYPES ---------------- */
function formatDateTimeDMY(date: string) {
    const d = new Date(date)

    if (isNaN(d.getTime())) return "-"

    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, "0")

    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
}

type ManpowerItem = {
    designation: string
    authorised: number
    deployed?: number
    shortage?: number
    needed?: number
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
    siteId: string
    // ✅ ADD THESE
    totalDeployed: number
    totalNeeded: number
}

/* ---------------- MAIN ---------------- */

export default function HR2Table() {
    const [data, setData] = useState<RecordType[]>([])
    const [loading, setLoading] = useState(true)

    const [selected, setSelected] = useState<RecordType | null>(null)
    const [editMode, setEditMode] = useState(false)

    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    const [chatOpen, setChatOpen] = useState(false)
    const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null)

    // get user
    const [currentUser, setCurrentUser] = useState<any>(null)

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

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch("/api/hr/dashboard-table?role=level2", {
                cache: "no-store",
            })
            const json = await res.json()

            const formatted = (json.data || []).map((item: any) => {

                const totalDeployed = item.manpowerList?.reduce(
                    (sum: number, m: any) => sum + (m.deployed || 0),
                    0
                )

                const totalNeeded = item.manpowerList?.reduce(
                    (sum: number, m: any) => sum + (m.needed || 0),
                    0
                )

                return {
                    id: item.submissionId,
                    siteName: item.site,
                    siteId: item.siteId,
                    createdAt: item.createdAt,
                    manpowerList: item.manpowerList,

                    totalDeployed,
                    totalNeeded,


                }
            })

            setData(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- SUBMIT (CREATE NEW) ---------------- */

    async function handleSubmit() {
        if (!selected) return

        try {
            await fetch("/api/hr/update-manpower", {

                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    submissionId: selected.id,
                    manpowerList: selected.manpowerList,
                    role: "level2"   // 🔥 REQUIRED
                })
            })

            alert("Updated successfully")
            setSelected(null)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }
    const [activeTab, setActiveTab] = useState<"manpower" | "finance">("manpower")

    if (loading) return <div>Loading...</div>

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

    const latestMap = new Map()

    filteredData.forEach((item) => {
        if (!latestMap.has(item.siteId)) {
            latestMap.set(item.siteId, item)
        }
    })

    const latestData = Array.from(latestMap.values())

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )



    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-bold">Operation Team Dashboard</h2>
                <p className="text-gray-500 text-sm">
                    Manage manpower deployment and shortage
                </p>
            </div>

            {activeTab === "manpower" && (
                <div className="bg-white rounded-xl shadow-sm border p-5">

                    {/* HEADER */}
                    <div className="mb-5">
                        <h3 className="text-lg font-semibold">Manpower Records</h3>
                        <p className="text-xs text-gray-500">
                            Manage site manpower details
                        </p>
                    </div>

                    {/* SEARCH + FILTER (FIXED ALIGNMENT) */}
                    <div className="flex items-center gap-3 mb-5 flex-wrap">

                        <input
                            type="text"
                            placeholder="Search site..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="border px-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <span className="text-sm text-gray-500 font-medium">Filter:</span>

                        {/* FROM DATE */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-[160px] border px-3 py-2 rounded-lg bg-white text-left hover:bg-gray-50">
                                    {fromDate
                                        ? format(new Date(fromDate), "dd-MM-yyyy")
                                        : "From Date"}
                                </button>
                            </PopoverTrigger>

                            <PopoverContent
                                align="start"
                                side="bottom"
                                className="w-auto p-0 z-[9999] bg-white shadow-lg border"
                            >
                                <Calendar
                                    mode="single"
                                    selected={fromDate ? new Date(fromDate) : undefined}
                                    onSelect={(date) => {
                                        if (!date) return
                                        setFromDate(format(date, "yyyy-MM-dd"))
                                        setCurrentPage(1)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <span className="text-gray-400 text-sm">to</span>

                        {/* TO DATE */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-[160px] border px-3 py-2 rounded-lg bg-white text-left hover:bg-gray-50">
                                    {toDate
                                        ? format(new Date(toDate), "dd-MM-yyyy")
                                        : "To Date"}
                                </button>
                            </PopoverTrigger>

                            <PopoverContent
                                align="start"
                                side="bottom"
                                className="w-auto p-0 z-[9999] bg-white shadow-lg border"
                            >
                                <Calendar
                                    mode="single"
                                    selected={toDate ? new Date(toDate) : undefined}
                                    onSelect={(date) => {
                                        if (!date) return
                                        setToDate(format(date, "yyyy-MM-dd"))
                                        setCurrentPage(1)
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
                                    setCurrentPage(1)
                                }}
                                className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* CARDS (FIXED TO YOUR REQUIREMENT) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

                        {/* Total Authorized */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg text-xl">👥</div>
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

                        {/* Total Deployed */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                            <div className="bg-green-100 text-green-600 p-3 rounded-lg text-xl">👷</div>
                            <div>
                                <p className="text-sm text-gray-500">Total Deployed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, i) => sum + i.totalDeployed, 0)}
                                </h2>
                            </div>
                        </div>

                        {/* Total Needed */}
                        <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg text-xl">📌</div>
                            <div>
                                <p className="text-sm text-gray-500">Total Needed</p>
                                <h2 className="text-2xl font-semibold">
                                    {latestData.reduce((sum, i) => sum + i.totalNeeded, 0)}
                                </h2>
                            </div>
                        </div>

                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[750px] text-sm">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-5 py-3 text-left">Created At</th>
                                    <th className="px-5 py-3 text-left">Site Name</th>

                                    <th className="px-5 py-3 text-center">Deployed</th>
                                    <th className="px-5 py-3 text-center">Needed</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedData.map((item) => (
                                    <tr key={item.id} className="border-t hover:bg-gray-50">

                                        <td className="px-5 py-3 text-gray-600">
                                            {formatDateTimeDMY(item.createdAt)}
                                        </td>
                                        <td className="px-5 py-3 font-medium">{item.siteName}</td>
                                        {/* <td className="px-5 py-3 text-center">
                                            {convertToDisplayDate(item.createdAt)}
                                        </td> */}
                                        <td className="px-5 py-3 text-center text-blue-600 font-semibold">
                                            {item.totalDeployed}
                                        </td>
                                        <td className="px-5 py-3 text-center text-orange-600 font-semibold">
                                            {item.totalNeeded}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex justify-center gap-2">

                                                <Button
                                                    size="sm"
                                                    className="bg-gray-200 text-black hover:bg-gray-300"
                                                    onClick={() => {
                                                        setSelected(item)
                                                        setEditMode(false)
                                                    }}
                                                >
                                                    View
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                                                        setSelected(null) // ✅ close modal if open
                                                        setChatSubmissionId(item.id)
                                                        setChatOpen(true)
                                                    }}
                                                >
                                                    💬 Chat
                                                </Button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center mt-5">

                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages || 1}
                        </div>

                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                </div>
            )}



            {/* MODAL */}
            {/* MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">

                        {/* HEADER */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b pb-3">
                            <h2 className="text-lg sm:text-xl font-semibold">
                                Manpower Details - {selected.siteName}
                            </h2>

                            <button
                                onClick={() => setSelected(null)}
                                className="text-gray-500 hover:text-black self-end sm:self-auto"
                            >
                                ✖
                            </button>
                        </div>

                        {/* SIDE BY SIDE SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* LEFT SIDE - HR1 + HR2 DATA */}
                            <div className="border rounded-xl p-4">
                                <h3 className="font-semibold mb-3 text-gray-700">
                                    Deployment Details
                                </h3>

                                <div className="overflow-x-auto">
                                    <div className="min-w-[560px]">

                                        {/* TABLE HEADER */}
                                        <div className="grid grid-cols-12 text-sm font-semibold mb-2 text-gray-600">
                                            <div className="col-span-3">Designation</div>
                                            <div className="col-span-2 text-center">Auth</div>
                                            <div className="col-span-2 text-center">Deployed</div>
                                            <div className="col-span-3 text-center">Needed</div>
                                        </div>

                                        {/* ROWS */}
                                        {selected.manpowerList.map((mp, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-12 gap-2 mb-2 items-center"
                                            >
                                                {/* HR1 VIEW */}
                                                <div className="col-span-3 text-sm">
                                                    {mp.designation}
                                                </div>

                                                <div className="col-span-2 text-center text-sm">
                                                    {mp.authorised}
                                                </div>

                                                {/* HR2 EDIT - ONLY DEPLOYED */}
                                                <input
                                                    type="number"
                                                    value={mp.deployed ?? ""}
                                                    disabled={!editMode}
                                                    onChange={(e) => {
                                                        const updated = [...selected.manpowerList]
                                                        const val = Math.max(0, Number(e.target.value))

                                                        updated[index].deployed = val
                                                        updated[index].shortage =
                                                            updated[index].authorised - val

                                                        setSelected({
                                                            ...selected,
                                                            manpowerList: updated,
                                                        })
                                                    }}
                                                    className="col-span-2 border rounded px-2 py-1 disabled:bg-gray-100"
                                                />

                                                {/* HR2 VIEW ONLY - NEEDED NOW BELONGS TO HR3 */}
                                                <input
                                                    type="number"
                                                    value={mp.needed ?? ""}
                                                    readOnly
                                                    disabled
                                                    className="col-span-3 border rounded px-2 py-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE - HR3 DATA */}
                            <div className="border rounded-xl p-4">
                                <h3 className="font-semibold mb-3 text-gray-700">
                                    HR3 Recruitment Details
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-sm">
                                        <thead className="bg-gray-100 text-gray-600">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Designation</th>
                                                <th className="px-4 py-2 text-left">Process</th>
                                                <th className="px-4 py-2 text-left">Responsible</th>
                                                <th className="px-4 py-2 text-left">Cutoff</th>
                                                <th className="px-4 py-2 text-left">Remarks</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selected.manpowerList.map((mp, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-4 py-2">
                                                        {mp.designation}
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={mp.recruitmentProcess || ""}
                                                            readOnly
                                                            className="w-full border rounded px-2 py-1 bg-gray-100"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={mp.responsible || ""}
                                                            readOnly
                                                            className="w-full border rounded px-2 py-1 bg-gray-100"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={mp.cutoffDate || ""}
                                                            readOnly
                                                            className="w-full border rounded px-2 py-1 bg-gray-100"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={mp.remarks || ""}
                                                            readOnly
                                                            className="w-full border rounded px-2 py-1 bg-gray-100"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 border-t pt-4">
                            <Button onClick={() => setSelected(null)}>
                                Close
                            </Button>

                            {editMode && (
                                <Button onClick={handleSubmit}>
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* ✅ Chat Drawer (correct place) */}
            {chatOpen && chatSubmissionId && currentUser && (
                <ChatDrawer
                    submissionId={chatSubmissionId as string}
                    user={currentUser}
                    siteName={
                        data.find((d) => d.id === chatSubmissionId)?.siteName || ""
                    }
                    onClose={() => {
                        setChatOpen(false)
                        setChatSubmissionId(null)
                    }}
                />
            )}

        </div >
    )

}