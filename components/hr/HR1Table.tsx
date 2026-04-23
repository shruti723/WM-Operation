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
}
type ManpowerRecord = {
    id: string
    siteName: string
    startDate: string
    lastRenewalDate: string
    nextRenewalDate: string
    manpowerList: ManpowerItem[]
}

type FinanceRecord = {
    id: string
    siteName: string
    incharge: string
    startDate: string
    lastRenewalDate: string
    nextRenewalDate: string
    monthlyBilling: string
    invoiceDate: string
    invoiceAmount: string
    invoiceMonth: string
    paymentStatus: string
    salaryDate: string
    salaryAmount: string
    salaryMonth: string
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function HR1Table() {
    const [activeTab, setActiveTab] = useState<"manpower" | "finance">("manpower")

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* 🔥 HEADER */}
            <div>
                <h2 className="text-2xl font-bold">Business Development Dashboard</h2>
                <p className="text-gray-500 text-sm">
                    Manage your submitted data
                </p>
            </div>

            {/* 🔥 TABS */}
            <div className="flex gap-2 bg-white p-1 rounded-xl w-fit shadow-sm border">
                <button
                    onClick={() => setActiveTab("manpower")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === "manpower"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    Manpower
                </button>

                <button
                    onClick={() => setActiveTab("finance")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === "finance"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    Finance
                </button>
            </div>

            {/* 🔥 CONTENT */}
            {activeTab === "manpower" && <HR1Manpower />}
            {activeTab === "finance" && <HR1Finance />}
        </div>
    )
}
function convertToDisplayDate(date: string) {
    if (!date) return "-"

    const d = new Date(date)

    if (isNaN(d.getTime())) return "-"

    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    return `${day}-${month}-${year}`
}

function convertToInputDate(date: string) {
    if (!date) return ""

    const parts = date.split("-")

    // already yyyy-mm-dd
    if (parts[0].length === 4) {
        return date
    }

    // dd-mm-yyyy → yyyy-mm-dd
    const [day, month, year] = parts
    return `${year}-${month}-${day}`
}

function HR1Manpower() {
    const [data, setData] = useState<ManpowerRecord[]>([])
    const [loading, setLoading] = useState(true)

    const [selected, setSelected] = useState<ManpowerRecord | null>(null)
    const [editMode, setEditMode] = useState(false)

    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [chatOpen, setChatOpen] = useState(false)
    const [chatSubmissionId, setChatSubmissionId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)

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
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch("/api/hr/dashboard-table?role=level1", { cache: "no-store" })
            const json = await res.json()

            const formatted = (json.data || []).map((item: any) => ({
                id: item.submissionId,
                siteName: item.site,
                startDate: item.startDate,
                lastRenewalDate: item.lastRenewalDate,
                nextRenewalDate: item.nextRenewalDate,
                manpowerList: item.manpowerList,
            }))

            setData(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- UPDATE ---------------- */

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
                    submissionId: selected.id,
                    manpowerList: selected.manpowerList,

                    role: "level1",  // 🔥 REQUIRED


                    // ✅ ADD THESE (IMPORTANT)
                    startDate: selected.startDate,
                    lastRenewalDate: selected.lastRenewalDate,
                    nextRenewalDate: selected.nextRenewalDate,
                }),
            })

            alert("Updated successfully")
            setSelected(null)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    /* ---------------- UI ---------------- */

    if (loading) return <div>Loading...</div>

    const filteredData = data.filter((item) => {

        const matchesSearch =
            item.siteName.toLowerCase().includes(search.toLowerCase())

        // 👉 Use nextRenewalDate for filtering
        const itemDate = parseDate(item.nextRenewalDate)

        const matchesFrom =
            !fromDate || (itemDate && itemDate >= new Date(fromDate))

        const matchesTo =
            !toDate || (itemDate && itemDate <= new Date(toDate))

        return matchesSearch && matchesFrom && matchesTo
    })

    const totalPages = Math.ceil(filteredData.length / rowsPerPage)

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    function parseDate(dateStr: string) {
        if (!dateStr) return null

        const parts = dateStr.split("-")
        if (parts.length !== 3) return null

        const [day, month, year] = parts

        return new Date(`${year}-${month}-${day}`)
    }


    return (
        <div className="bg-white rounded-xl shadow-sm border p-5">

            {/* 🔍 SEARCH + HEADER */}
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="text-lg font-semibold">Manpower Records</h3>
                    <p className="text-xs text-gray-500">Manage site manpower details</p>
                </div>


            </div>
            <div className="flex items-center gap-3 mb-5">

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
                            fromYear={2000}
                            toYear={2100}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {/* CLEAR BUTTON */}
                {(fromDate || toDate) && (
                    <button
                        onClick={() => {
                            setFromDate("")
                            setToDate("")
                            setCurrentPage(1)
                        }}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                    >
                        Clear
                    </button>
                )}

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
                            fromYear={2000}
                            toYear={2100}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* CLEAR BUTTON */}
                {(fromDate || toDate) && (
                    <button
                        onClick={() => {
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

            <div className="grid grid-cols-4 gap-6 mb-6">

                {/* Total Sites */}
                <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg text-xl">🏢</div>
                    <div>
                        <p className="text-sm text-gray-500">Total Sites</p>
                        <h2 className="text-2xl font-semibold">{data.length}</h2>
                    </div>
                </div>

                {/* Total Authorised */}
                <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                    <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg text-xl">👥</div>
                    <div>
                        <p className="text-sm text-gray-500">Total Authorised</p>
                        <h2 className="text-2xl font-semibold">
                            {data.reduce((sum, s) =>
                                sum + s.manpowerList.reduce((a, b) => a + b.authorised, 0), 0)}
                        </h2>
                    </div>
                </div>

                {/* Next Renewal (Current Month) */}
                <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
                    <div className="bg-green-100 text-green-600 p-3 rounded-lg text-xl">📅</div>
                    <div>
                        <p className="text-sm text-gray-500">This Month Renewal</p>
                        <h2 className="text-2xl font-semibold">
                            {
                                filteredData.filter(d => {
                                    const date = parseDate(d.nextRenewalDate)
                                    const now = new Date()

                                    if (!date) return false

                                    return (
                                        date.getMonth() === now.getMonth() &&
                                        date.getFullYear() === now.getFullYear()
                                    )
                                }).length
                            }
                        </h2>
                    </div>
                </div>

            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-xl border">

                <table className="w-full text-sm">

                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-5 py-3 text-left">Site</th>
                            <th className="px-5 py-3 text-center">Start Date</th>
                            <th className="px-5 py-3 text-center">Last Renewal</th>
                            <th className="px-5 py-3 text-center">Next Renewal</th>
                            <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t hover:bg-gray-50 transition duration-200"
                            >
                                <td className="px-5 py-3 font-medium text-gray-800">
                                    {item.siteName}
                                </td>

                                <td className="px-5 py-3 text-center text-gray-600">
                                    {item.startDate}
                                </td>

                                <td className="px-5 py-3 text-center text-gray-600">
                                    {item.lastRenewalDate}
                                </td>

                                <td className="px-5 py-3 text-center text-gray-600">
                                    {item.nextRenewalDate}
                                </td>

                                <td className="px-5 py-3">
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
                                            className="bg-blue-600 hover:bg-blue-700"
                                            onClick={() => {
                                                setSelected(item)
                                                setEditMode(true)
                                            }}
                                        >
                                            Edit
                                        </Button>

                                        {/* ✅ NEW CHAT BUTTON */}
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => {
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
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white hover:bg-gray-50"
                    >
                        Previous
                    </button>

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>

            </div>
            {/* MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[90vh] overflow-y-auto p-6">

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-semibold">Manpower Details</h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-gray-500 hover:text-black"
                            >
                                ✖
                            </button>
                        </div>

                        {/* SITE DETAILS */}
                        <div className="grid grid-cols-3 gap-4 mb-6">

                            <div>
                                <label className="text-sm text-gray-600">Site Name</label>
                                <input
                                    value={selected.siteName}
                                    readOnly
                                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">Start Date</label>
                                <input
                                    type="date"
                                    value={convertToInputDate(selected.startDate)}
                                    disabled={!editMode}
                                    onChange={(e) =>
                                        setSelected({
                                            ...selected,
                                            startDate: e.target.value, // ✅ KEEP RAW
                                        })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">Last Renewal</label>
                                <input
                                    type="date"
                                    value={convertToInputDate(selected.lastRenewalDate)}
                                    disabled={!editMode}
                                    onChange={(e) =>
                                        setSelected({
                                            ...selected,
                                            lastRenewalDate: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                        </div>

                        {/* NEXT DATE */}
                        <div className="mb-6">
                            <label className="text-sm text-gray-600">Next Renewal</label>
                            <input
                                type="date"
                                value={convertToInputDate(selected.nextRenewalDate)}
                                disabled={!editMode}
                                onChange={(e) =>
                                    setSelected({
                                        ...selected,
                                        nextRenewalDate: e.target.value,
                                    })
                                }
                                className="w-full border rounded-lg px-3 py-2 mt-1"
                            />
                        </div>

                        {/* MANPOWER */}
                        <div className="mb-3 font-medium">Manpower Details</div>

                        <div className="grid grid-cols-12 text-sm font-semibold mb-2 text-gray-500">
                            <div className="col-span-6">Designation</div>
                            <div className="col-span-4 text-center">Authorised</div>
                            <div className="col-span-2"></div>
                        </div>

                        {selected.manpowerList.map((mp, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2">

                                <input
                                    value={mp.designation}
                                    disabled={!editMode}
                                    onChange={(e) => {
                                        const updated = [...selected.manpowerList]
                                        updated[index].designation = e.target.value
                                        setSelected({ ...selected, manpowerList: updated })
                                    }}
                                    className="col-span-6 border rounded-lg px-3 py-2"
                                />

                                <input
                                    type="number"
                                    value={mp.authorised}
                                    disabled={!editMode}
                                    onChange={(e) => {
                                        const updated = [...selected.manpowerList]
                                        updated[index].authorised = Number(e.target.value)
                                        setSelected({ ...selected, manpowerList: updated })
                                    }}
                                    className="col-span-4 border rounded-lg px-3 py-2 text-center"
                                />

                                {editMode && (
                                    <button
                                        onClick={() => {
                                            const updated = selected.manpowerList.filter((_, i) => i !== index)
                                            setSelected({ ...selected, manpowerList: updated })
                                        }}
                                        className="col-span-2 text-red-500"
                                    >
                                        ❌
                                    </button>
                                )}
                            </div>
                        ))}

                        {editMode && (
                            <button
                                onClick={() =>
                                    setSelected({
                                        ...selected,
                                        manpowerList: [
                                            ...selected.manpowerList,
                                            { designation: "", authorised: 0 },
                                        ],
                                    })
                                }
                                className="text-blue-600 mt-2"
                            >
                                ➕ Add Row
                            </button>
                        )}

                        {/* FOOTER */}
                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">

                            <Button
                                variant="outline"
                                onClick={() => setSelected(null)}
                            >
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
            )}
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


function HR1Finance() {
    const [data, setData] = useState<FinanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<FinanceRecord | null>(null)
    const [editMode, setEditMode] = useState(false)

    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [statusFilter, setStatusFilter] = useState("ALL")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch("/api/hr/finance-table?role=level1", { cache: "no-store" })
            const json = await res.json()

            const formatted = (json.data || []).map((item: any) => ({
                id: item.id,
                siteName: item.siteName || "",
                incharge: item.incharge || "",
                startDate: item.startDate || "",
                lastRenewalDate: item.lastRenewalDate || "",
                nextRenewalDate: item.nextRenewalDate || "",
                monthlyBilling: item.monthlyBilling || "",
                invoiceDate: item.invoiceDate || "",
                invoiceAmount: item.invoiceAmount || "",
                invoiceMonth: item.invoiceMonth || "",
                paymentStatus: item.paymentStatus || "",
                salaryDate: item.salaryDate || "",
                salaryAmount: item.salaryAmount || "",
                salaryMonth: item.salaryMonth || "",
            }))

            setData(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdate() {
        if (!selected) return

        try {
            const res = await fetch("/api/hr/finance", {
                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selected.id,
                    siteName: selected.siteName,
                    incharge: selected.incharge,
                    startDate: selected.startDate,
                    lastRenewalDate: selected.lastRenewalDate,
                    nextRenewalDate: selected.nextRenewalDate,
                    role: "level1",
                }),
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.message || "Update failed")
                return
            }

            alert("Updated successfully")
            setSelected(null)
            fetchData()
        } catch (err) {
            console.error(err)
            alert("Update failed")
        }
    }

    if (loading) return <div>Loading...</div>

    const filteredData = data.filter((item) => {

        const matchesSearch =
            item.siteName.toLowerCase().includes(search.toLowerCase())

        const itemDate = new Date(item.invoiceDate || item.nextRenewalDate)

        const matchesFrom =
            !fromDate || (itemDate && itemDate >= new Date(fromDate))

        const matchesTo =
            !toDate || (itemDate && itemDate <= new Date(toDate))

        const matchesStatus =
            statusFilter === "ALL" || item.paymentStatus === statusFilter

        return matchesSearch && matchesFrom && matchesTo && matchesStatus
    })

    const totalPages = Math.ceil(filteredData.length / rowsPerPage)

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    const totalRecords = filteredData.length

    const thisMonthRenewal = filteredData.filter((item) => {
        if (!item.nextRenewalDate) return false
        const date = new Date(item.nextRenewalDate)
        const now = new Date()

        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        )
    }).length

    const pendingPayments = filteredData.filter(
        (item) => item.paymentStatus === "PENDING"
    ).length

    const totalBilling = filteredData.reduce((sum, item) => {
        const billing = Number(item.monthlyBilling || 0)
        const invoice = Number(item.invoiceAmount || 0)

        return sum + (billing || invoice)
    }, 0)


    const totalInvoiceRaised = totalBilling // same for now

    const totalPaymentReceived = filteredData.reduce((sum, item) => {
        if (item.paymentStatus === "RECEIVED") {
            return sum + Number(item.invoiceAmount || 0)
        }
        return sum
    }, 0)

    const pendingPaymentAmount = filteredData.reduce((sum, item) => {
        if (item.paymentStatus === "PENDING") {
            return sum + Number(item.invoiceAmount || 0)
        }
        return sum
    }, 0)

    return (
        <div className="bg-white rounded-2xl shadow-lg border p-5">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="text-lg font-semibold">Finance Records</h3>
                    <p className="text-xs text-gray-500">
                        Manage finance details
                    </p>
                </div>



            </div>
            <div className="flex items-center gap-3 mb-5">

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
                            fromYear={2000}
                            toYear={2100}
                            initialFocus
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
                            fromYear={2000}
                            toYear={2100}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* CLEAR BUTTON */}
                {(fromDate || toDate) && (
                    <button
                        onClick={() => {
                            setFromDate("")
                            setToDate("")
                            setCurrentPage(1)
                        }}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                    >
                        Clear
                    </button>
                )}
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="border px-3 py-2 rounded-lg bg-white text-sm"
                >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="RECEIVED">Received</option>
                </select>
            </div>




            <div className="grid grid-cols-4 gap-6 mb-6">

                {/* Total Billing */}
                <div className="bg-blue-900 text-white p-5 rounded-xl">
                    <p className="text-sm opacity-70">Total Billing Amount</p>
                    <h2 className="text-2xl font-semibold">
                        ₹{totalBilling.toLocaleString()}
                    </h2>
                </div>

                {/* Invoice Raised */}
                <div className="bg-indigo-900 text-white p-5 rounded-xl">
                    <p className="text-sm opacity-70">Total Invoice Raised</p>
                    <h2 className="text-2xl font-semibold">
                        ₹{totalInvoiceRaised.toLocaleString()}
                    </h2>
                </div>

                {/* Payment Received */}
                <div className="bg-green-600 text-white p-5 rounded-xl">
                    <p className="text-sm opacity-70">Payment Received</p>
                    <h2 className="text-2xl font-semibold">
                        ₹{totalPaymentReceived.toLocaleString()}
                    </h2>
                </div>

                {/* Pending Amount */}
                <div className="bg-red-500 text-white p-5 rounded-xl">
                    <p className="text-sm opacity-70">Pending Payment</p>
                    <h2 className="text-2xl font-semibold">
                        ₹{pendingPaymentAmount.toLocaleString()}
                    </h2>
                </div>

            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">

                {/* Total Records */}
                <div className="bg-white border p-5 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500">Total Records</p>
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {totalRecords}
                    </h2>
                </div>

                {/* Pending Count */}
                <div className="bg-white border p-5 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500">Pending Status Count</p>
                    <h2 className="text-2xl font-semibold text-yellow-600">
                        {pendingPayments}
                    </h2>
                </div>

                {/* This Month Renewal */}
                <div className="bg-white border p-5 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500">This Month Renewal</p>
                    <h2 className="text-2xl font-semibold text-blue-600">
                        {thisMonthRenewal}
                    </h2>
                </div>

            </div>

            <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-5 py-3 text-left">Site</th>
                            <th className="px-5 py-3 text-left">Incharge</th>
                            <th className="px-5 py-3 text-center">Start Date</th>
                            <th className="px-5 py-3 text-center">Last Renewal</th>
                            <th className="px-5 py-3 text-center">Next Renewal</th>
                            <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t hover:bg-gray-50 transition duration-200"
                            >
                                <td className="px-5 py-3 font-medium text-gray-800">
                                    {item.siteName}
                                </td>
                                <td className="px-5 py-3 text-gray-600">
                                    {item.incharge}
                                </td>
                                <td className="px-5 py-3 text-center text-gray-600">
                                    {convertToDisplayDate(item.startDate)}
                                </td>

                                <td className="px-5 py-3 text-center text-gray-600">
                                    {convertToDisplayDate(item.lastRenewalDate)}
                                </td>

                                <td className="px-5 py-3 text-center text-gray-600">
                                    {convertToDisplayDate(item.nextRenewalDate)}
                                </td>
                                <td className="px-5 py-3">
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
                                            className="bg-blue-600 hover:bg-blue-700"
                                            onClick={() => {
                                                setSelected(item)
                                                setEditMode(true)
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-5">

                <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages || 1}
                </div>

                <div className="flex gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white hover:bg-gray-50"
                    >
                        Previous
                    </button>

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 bg-white hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>

            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-semibold">Finance Details</h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-gray-500 hover:text-black"
                            >
                                ✖
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-6">

                            {/* HR1 */}
                            <div>
                                <h3 className="font-semibold mb-2">HR1 Details</h3>

                                <p className="text-sm text-gray-500">Site Name</p>
                                <p>{selected.siteName}</p>

                                <p className="text-sm text-gray-500 mt-2">Incharge</p>
                                {editMode ? (
                                    <input
                                        value={selected.incharge || ""}
                                        onChange={(e) =>
                                            setSelected({ ...selected, incharge: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded mt-1"
                                    />
                                ) : (
                                    <p>{selected.incharge || "-"}</p>
                                )}

                                <p className="text-sm text-gray-500 mt-2">Start Date</p>
                                {editMode ? (
                                    <input
                                        type="date"
                                        value={convertToInputDate(selected.startDate)}
                                        onChange={(e) =>
                                            setSelected({ ...selected, startDate: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded mt-1"
                                    />
                                ) : (
                                    <p>{selected.startDate || "-"}</p>
                                )}

                                <p className="text-sm text-gray-500 mt-2">Last Renewal</p>
                                {editMode ? (
                                    <input
                                        type="date"
                                        value={convertToInputDate(selected.lastRenewalDate)}
                                        onChange={(e) =>
                                            setSelected({ ...selected, lastRenewalDate: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded mt-1"
                                    />
                                ) : (
                                    <p>{selected.lastRenewalDate || "-"}</p>
                                )}

                                <p className="text-sm text-gray-500 mt-2">Next Renewal</p>
                                {editMode ? (
                                    <input
                                        type="date"
                                        value={convertToInputDate(selected.nextRenewalDate)}
                                        onChange={(e) =>
                                            setSelected({ ...selected, nextRenewalDate: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded mt-1"
                                    />
                                ) : (
                                    <p>{selected.nextRenewalDate || "-"}</p>
                                )}
                            </div>

                            {/* A1 */}
                            <div>
                                <h3 className="font-semibold mb-2">A1 (Finance) Details</h3>

                                <p className="text-sm text-gray-500">Monthly Billing (Contract / Yearly Avg)</p>
                                <p>{selected.monthlyBilling || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Last Invoice Raised - Date</p>
                                <p>{selected.invoiceDate || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Invoice Amount</p>
                                <p>{selected.invoiceAmount || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Invoice For Month</p>
                                <p>{selected.invoiceMonth || "-"}</p>

                                <p className="text-sm text-gray-500 mt-2">Payment Status</p>
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
                                        <p className="font-medium mt-1">
                                            {selected.salaryDate || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Salary Disbursement - INR Amount
                                        </p>
                                        <p className="font-medium mt-1">
                                            {selected.salaryAmount || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Salary Disbursement - For Month of
                                        </p>
                                        <p className="font-medium mt-1">
                                            {selected.salaryMonth || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                            <Button variant="outline" onClick={() => setSelected(null)}>
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
            )}
        </div>
    )
}