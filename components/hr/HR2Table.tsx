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

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab("manpower")}
                    className={`px-4 py-2 rounded ${activeTab === "manpower"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                        }`}
                >
                    Manpower
                </button>

                {/* <button
                    onClick={() => setActiveTab("finance")}
                    className={`px-4 py-2 rounded ${activeTab === "finance"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                        }`}
                >
                    Finance
                </button> */}
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
                    <div className="grid grid-cols-3 gap-6 mb-6">

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
                    <div className="overflow-hidden rounded-xl border">

                        <table className="w-full text-sm">

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

            {activeTab === "finance" && (
                <HR2Finance />
            )}

            {/* MODAL */}
            {
                selected && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-[1000px] max-h-[90vh] overflow-y-auto p-6">
                            {/* HEADER */}
                            <div className="flex justify-between items-center mb-4 border-b pb-3">
                                <h2 className="text-xl font-semibold">
                                    Manpower Details - {selected.siteName}
                                </h2>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="text-gray-500 hover:text-black"
                                >
                                    ✖
                                </button>
                            </div>
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
                                    <div className="col-span-3">{mp.designation}</div>

                                    <div className="col-span-2 text-center">
                                        {mp.authorised}
                                    </div>
                                    {/* HR2 EDIT */}
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
                                        className="col-span-2 border rounded px-2 py-1"
                                    />



                                    <input
                                        type="number"
                                        value={mp.needed ?? ""}
                                        disabled={!editMode}
                                        onChange={(e) => {
                                            const updated = [...selected.manpowerList]
                                            updated[index].needed = Math.max(0, Number(e.target.value))

                                            setSelected({
                                                ...selected,
                                                manpowerList: updated,
                                            })
                                        }}
                                        className="col-span-3 border rounded px-2 py-1"
                                    />
                                </div>
                            ))}
                            {/* HR3 DATA PER DESIGNATION */}
                            <div className="mt-6 border rounded-xl overflow-hidden">

                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2">Designation</th>
                                            <th className="px-4 py-2">Process</th>
                                            <th className="px-4 py-2">Responsible</th>
                                            <th className="px-4 py-2">Cutoff</th>
                                            <th className="px-4 py-2">Remarks</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selected.manpowerList.map((mp, index) => (
                                            <tr key={index} className="border-t">

                                                <td className="px-4 py-2">{mp.designation}</td>

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

                            {/* BUTTONS */}
                            <div className="flex justify-end gap-3 mt-6 border-t pt-4">

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
                )
            }
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
function HR2Finance() {
    const [data, setData] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)
    const [editMode, setEditMode] = useState(false)

    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const res = await fetch("/api/hr/finance-table?role=level2", {
            cache: "no-store",
        })
        const json = await res.json()
        setData(json.data || [])
    }

    async function handleUpdate() {
        if (!selected) return

        await fetch("/api/hr/finance", {

            cache: "no-store",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: selected.id,
                salaryDate: selected.salaryDate,
                salaryAmount: selected.salaryAmount,
                salaryMonth: selected.salaryMonth,
                role: "level2",
            }),
        })

        alert("Updated successfully")
        setSelected(null)
        fetchData()
    }

    /* ---------------- FILTER ---------------- */

    const filteredData = data.filter((item) => {
        const matchesSearch =
            item.siteName?.toLowerCase().includes(search.toLowerCase())

        const itemDate = item.salaryDate ? new Date(item.salaryDate) : null

        const matchesFrom =
            !fromDate || (itemDate && itemDate >= new Date(fromDate))

        const matchesTo =
            !toDate || (itemDate && itemDate <= new Date(toDate))

        const matchesStatus =
            status === "all" || item.paymentStatus === status

        return matchesSearch && matchesFrom && matchesTo && matchesStatus
    })

    /* ---------------- SUMMARY ---------------- */

    const totalBilling = filteredData.reduce(
        (sum, i) => sum + (i.monthlyBilling || 0),
        0
    )

    const totalRecords = filteredData.length

    const pendingCount = filteredData.filter(
        (i) => i.paymentStatus === "PENDING"
    ).length

    const thisMonthRenewal = filteredData.filter((i) => {
        if (!i.nextRenewalDate) return false

        const d = new Date(i.nextRenewalDate)
        const now = new Date()

        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        )
    }).length

    const totalInvoice = filteredData.reduce(
        (sum, i) => sum + (i.invoiceAmount || 0),
        0
    )

    const received = filteredData
        .filter((i) => i.paymentStatus === "RECEIVED")
        .reduce((sum, i) => sum + (i.invoiceAmount || 0), 0)

    const pending = filteredData
        .filter((i) => i.paymentStatus === "PENDING")
        .reduce((sum, i) => sum + (i.invoiceAmount || 0), 0)

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    return (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h3 className="text-lg font-semibold">Finance Records</h3>
                <p className="text-sm text-gray-500">Manage finance details</p>
            </div>

            {/* FILTER ROW */}
            <div className="flex gap-3 flex-wrap items-center">

                <input
                    placeholder="Search site..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded-lg w-60"
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

                {/* STATUS */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border px-3 py-2 rounded-lg"
                >
                    <option value="all">All Status</option>
                    <option value="RECEIVED">Received</option>
                    <option value="PENDING">Pending</option>
                </select>

                {(search || fromDate || toDate || status !== "all") && (
                    <button
                        onClick={() => {
                            setSearch("")
                            setFromDate("")
                            setToDate("")
                            setStatus("all")
                            setCurrentPage(1)
                        }}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-4 gap-4">

                <div className="bg-blue-900 text-white p-4 rounded-xl">
                    <p className="text-sm">Total Billing Amount</p>
                    <h2 className="text-xl font-semibold">₹{totalBilling}</h2>
                </div>

                <div className="bg-purple-800 text-white p-4 rounded-xl">
                    <p className="text-sm">Total Invoice Raised</p>
                    <h2 className="text-xl font-semibold">₹{totalInvoice}</h2>
                </div>

                <div className="bg-green-600 text-white p-4 rounded-xl">
                    <p className="text-sm">Payment Received</p>
                    <h2 className="text-xl font-semibold">₹{received}</h2>
                </div>

                <div className="bg-red-500 text-white p-4 rounded-xl">
                    <p className="text-sm">Pending Payment</p>
                    <h2 className="text-xl font-semibold">₹{pending}</h2>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">

                {/* Total Records */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Records</p>
                    <h2 className="text-xl font-semibold">{totalRecords}</h2>
                </div>

                {/* Pending Status Count */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Pending Status Count</p>
                    <h2 className="text-xl font-semibold text-orange-600">
                        {pendingCount}
                    </h2>
                </div>

                {/* This Month Renewal */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">This Month Renewal</p>
                    <h2 className="text-xl font-semibold text-blue-600">
                        {thisMonthRenewal}
                    </h2>
                </div>

            </div>

            {/* TABLE */}
            <div className="border rounded-xl overflow-hidden">

                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="px-4 py-2 text-left">Site</th>
                            <th className="text-center">Incharge</th>
                            <th className="text-center">Start Date</th>
                            <th className="text-center">Last Salary Date</th>
                            <th className="text-center">Amount</th>
                            <th className="text-center">Month</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-gray-50">

                                <td className="px-4 py-2 font-medium">
                                    {item.siteName}
                                </td>

                                <td className="text-center">
                                    {item.incharge || "-"}
                                </td>

                                <td className="text-center">
                                    {item.startDate || "-"}
                                </td>

                                <td className="text-center">
                                    {item.salaryDate || "-"}
                                </td>

                                <td className="text-center">
                                    ₹{item.salaryAmount || 0}
                                </td>

                                <td className="text-center">
                                    {item.salaryMonth || "-"}
                                </td>

                                <td className="text-center flex justify-center gap-2 py-2">

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
                                        className="bg-blue-600 text-white"
                                        onClick={() => {
                                            setSelected(item)
                                            setEditMode(true)
                                        }}
                                    >
                                        Edit
                                    </Button>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center">

                <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                </span>

                <div className="flex gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-3 py-2 border rounded"
                    >
                        Previous
                    </button>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-3 py-2 border rounded"
                    >
                        Next
                    </button>
                </div>

            </div>
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-2xl shadow-xl w-[900px] p-6">

                        <h2 className="text-xl font-semibold mb-4">
                            Finance Details
                        </h2>

                        <div className="grid grid-cols-3 gap-6">

                            {/* HR1 */}
                            <div>
                                <h3 className="font-semibold mb-2">HR1 Details</h3>

                                <p className="text-sm text-gray-500">Site Name</p>
                                <p>{selected.siteName || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Incharge</p>
                                <p>{selected.incharge || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Start Date</p>
                                <p>{selected.startDate || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Last Renewal</p>
                                <p>{selected.lastRenewalDate || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Next Renewal</p>
                                <p>{selected.nextRenewalDate || "-"}</p>
                            </div>

                            {/* A1 */}
                            <div>
                                <h3 className="font-semibold mb-2">A1 (Finance) Details</h3>

                                <p className="text-sm text-gray-500">
                                    Monthly Billing (Contract / Yearly Avg)
                                </p>
                                <p>{selected.monthlyBilling || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">
                                    Last Invoice Raised - Date
                                </p>
                                <p>{selected.invoiceDate || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">
                                    Invoice Amount
                                </p>
                                <p>{selected.invoiceAmount || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">
                                    Invoice For Month
                                </p>
                                <p>{selected.invoiceMonth || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">
                                    Payment Status
                                </p>
                                <p>{selected.paymentStatus || "-"}</p>
                            </div>


                            {/* HR2 */}
                            <div>
                                <h3 className="font-semibold mb-2">HR2 Details</h3>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Salary Disbursement - Date
                                        </p>

                                        {editMode ? (
                                            <input
                                                type="date"
                                                value={selected.salaryDate || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        salaryDate: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded mt-1"
                                            />
                                        ) : (
                                            <p className="font-medium mt-1">
                                                {selected.salaryDate || "-"}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Salary Disbursement - INR Amount
                                        </p>

                                        {editMode ? (
                                            <input
                                                type="number"
                                                value={selected.salaryAmount || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        salaryAmount: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded mt-1"
                                            />
                                        ) : (
                                            <p className="font-medium mt-1">
                                                {selected.salaryAmount || "-"}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Salary Disbursement - For Month of
                                        </p>

                                        {editMode ? (
                                            <input
                                                value={selected.salaryMonth || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        salaryMonth: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded mt-1"
                                            />
                                        ) : (
                                            <p className="font-medium mt-1">
                                                {selected.salaryMonth || "-"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button onClick={() => setSelected(null)}>
                                Close
                            </Button>

                            {editMode && (
                                <Button onClick={handleUpdate}>
                                    Save
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

            )}

        </div>

    )
}