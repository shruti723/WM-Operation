"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

/* ---------------- MAIN ---------------- */

export default function A1Table() {
    const [data, setData] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [status, setStatus] = useState("all")

    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const res = await fetch("/api/hr/finance-table?role=account1")
        const json = await res.json()
        setData(json.data || [])
    }

    async function handleUpdate() {
        if (!selected) return

        const res = await fetch("/api/hr/finance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: selected.id,
                siteName: selected.siteName, // 🔥 ADD THIS
                monthlyBilling: selected.monthlyBilling,
                invoiceDate: selected.invoiceDate,
                invoiceAmount: selected.invoiceAmount,
                invoiceMonth: selected.invoiceMonth,
                paymentStatus: selected.paymentStatus,
                role: "account1",
            })
        })

        const result = await res.json()
        console.log("API Response:", result)

        if (!result.success) {
            alert(result.message)
            return
        }

        alert("Updated successfully")

        setSelected(null)

        // 🔥 IMPORTANT: wait before refetch
        setTimeout(() => {
            fetchData()
        }, 300)
    }
    const filteredData = data.filter((item) => {

        const matchesSearch =
            item.siteName?.toLowerCase().includes(search.toLowerCase())

        const itemDate = item.invoiceDate ? new Date(item.invoiceDate) : null

        const matchesFrom =
            !fromDate || (itemDate && itemDate >= new Date(fromDate))

        const matchesTo =
            !toDate || (itemDate && itemDate <= new Date(toDate))

        const matchesStatus =
            status === "all" || item.paymentStatus === status

        return matchesSearch && matchesFrom && matchesTo && matchesStatus
    })

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    function clearFilters() {
        setSearch("")
        setFromDate("")
        setToDate("")
        setStatus("all")
        setCurrentPage(1)
    }

    return (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h3 className="text-lg font-semibold">Finance Records</h3>
                <p className="text-sm text-gray-500">Manage finance details</p>
            </div>

            <div className="flex gap-3 flex-wrap items-center mb-2">

                <input
                    placeholder="Search site..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                    }}
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

                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="border px-3 py-2 rounded-lg"
                >
                    <option value="all">All Status</option>
                    <option value="RECEIVED">Received</option>
                    <option value="PENDING">Pending</option>
                </select>
                {(search || fromDate || toDate || status !== "all") && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                    >
                        Clear
                    </button>
                )}

            </div>


            <div className="grid grid-cols-4 gap-5 mb-2">

                <div className="bg-blue-900 text-white p-4 rounded-xl">
                    <p className="text-sm">Total Billing Amount</p>
                    <h2 className="text-xl font-semibold">
                        ₹{data.reduce((s, i) => s + (i.monthlyBilling || 0), 0)}
                    </h2>
                </div>

                <div className="bg-purple-800 text-white p-4 rounded-xl">
                    <p className="text-sm">Total Invoice Raised</p>
                    <h2 className="text-xl font-semibold">
                        ₹{data.reduce((s, i) => s + (i.invoiceAmount || 0), 0)}
                    </h2>
                </div>

                <div className="bg-green-600 text-white p-4 rounded-xl">
                    <p className="text-sm">Payment Received</p>
                    <h2 className="text-xl font-semibold">
                        ₹{
                            data
                                .filter(i => i.paymentStatus === "RECEIVED")
                                .reduce((s, i) => s + (i.invoiceAmount || 0), 0)
                        }
                    </h2>
                </div>

                <div className="bg-red-500 text-white p-4 rounded-xl">
                    <p className="text-sm">Pending Payment</p>
                    <h2 className="text-xl font-semibold">
                        ₹{
                            data
                                .filter(i => i.paymentStatus === "PENDING")
                                .reduce((s, i) => s + (i.invoiceAmount || 0), 0)
                        }
                    </h2>
                </div>

            </div>

            <div className="grid grid-cols-3 gap-5 mb-4">

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Records</p>
                    <h2 className="text-xl font-semibold">{data.length}</h2>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Pending Status Count</p>
                    <h2 className="text-xl font-semibold text-orange-600">
                        {data.filter(i => i.paymentStatus === "PENDING").length}
                    </h2>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">This Month Renewal</p>
                    <h2 className="text-xl font-semibold text-blue-600">
                        {data.filter(i => {
                            if (!i.nextRenewalDate) return false
                            const d = new Date(i.nextRenewalDate)
                            const now = new Date()
                            return d.getMonth() === now.getMonth() &&
                                d.getFullYear() === now.getFullYear()
                        }).length}
                    </h2>
                </div>

            </div>

            {/* TABLE */}
            <div className="rounded-xl border overflow-hidden mt-2">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="px-5 py-3 text-left">Site</th>
                            <th className="px-5 py-3 text-right">Monthly Billing</th>
                            <th className="px-5 py-3 text-center">Invoice Date</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3 text-center">Month</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-gray-50">

                                {/* SITE */}
                                <td className="px-5 py-3 text-left font-medium">
                                    {item.siteName}
                                </td>

                                {/* BILLING */}
                                <td className="px-5 py-3 text-right">
                                    {item.monthlyBilling || "-"}
                                </td>

                                {/* DATE */}
                                <td className="px-5 py-3 text-center">
                                    {item.invoiceDate
                                        ? new Date(item.invoiceDate).toLocaleDateString("en-GB")
                                        : "-"}
                                </td>

                                {/* AMOUNT */}
                                <td className="px-5 py-3 text-right">
                                    {item.invoiceAmount || "-"}
                                </td>

                                {/* MONTH */}
                                <td className="px-5 py-3 text-center">
                                    {item.invoiceMonth || "-"}
                                </td>

                                {/* STATUS */}
                                <td className="px-5 py-3 text-center">
                                    {item.paymentStatus ? (
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.paymentStatus === "RECEIVED"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {item.paymentStatus === "RECEIVED"
                                                ? "Payment Received"
                                                : "Payment Pending"}
                                        </span>
                                    ) : "-"}
                                </td>

                                {/* ACTION */}
                                <td className="px-5 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelected({ ...item, mode: "view" })}
                                        >
                                            View
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="bg-black text-white"
                                            onClick={() => setSelected({ ...item, mode: "edit" })}
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

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>

                <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </div>

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
                    <div className="bg-white rounded-2xl shadow-xl w-[1000px] max-h-[90vh] overflow-y-auto p-6">

                        <h3 className="text-xl font-semibold">
                            Finance Details
                        </h3>



                        {/* ---------------- A1 SECTION ---------------- */}
                        <div className="grid grid-cols-3 gap-8">

                            {/* ---------------- HR1 SECTION ---------------- */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-1">
                                    HR1 Details
                                </h4>

                                <div className="space-y-4 text-sm">

                                    <div>
                                        <p className="text-gray-500">Site Name</p>
                                        <p className="font-medium">
                                            {selected.siteName || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-500">Incharge</p>
                                        <p className="font-medium">
                                            {selected.incharge || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-500">Start Date</p>
                                        <p className="font-medium">
                                            {selected.startDate || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-500">Last Renewal</p>
                                        <p className="font-medium">
                                            {selected.lastRenewalDate || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-500">Next Renewal</p>
                                        <p className="font-medium">
                                            {selected.nextRenewalDate || "-"}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* ---------------- A1 SECTION ---------------- */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-1">
                                    A1 (Finance) Details
                                </h4>

                                <div className="space-y-4">

                                    {/* Monthly Billing */}
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Monthly Billing (Contract / Yearly Avg)
                                        </p>

                                        {selected.mode === "view" ? (
                                            <p className="font-medium mt-1">
                                                {selected.monthlyBilling || "-"}
                                            </p>
                                        ) : (
                                            <input
                                                type="number"
                                                value={selected.monthlyBilling || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        monthlyBilling: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* Invoice Date */}
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Last Invoice Raised - Date
                                        </p>

                                        {selected.mode === "view" ? (
                                            <p className="font-medium mt-1">
                                                {selected.invoiceDate || "-"}
                                            </p>
                                        ) : (
                                            <input
                                                type="date"
                                                value={selected.invoiceDate || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        invoiceDate: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Invoice Amount
                                        </p>

                                        {selected.mode === "view" ? (
                                            <p className="font-medium mt-1">
                                                {selected.invoiceAmount || "-"}
                                            </p>
                                        ) : (
                                            <input
                                                type="number"
                                                value={selected.invoiceAmount || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        invoiceAmount: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* Month */}
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Invoice For Month
                                        </p>

                                        {selected.mode === "view" ? (
                                            <p className="font-medium mt-1">
                                                {selected.invoiceMonth || "-"}
                                            </p>
                                        ) : (
                                            <input
                                                value={selected.invoiceMonth || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        invoiceMonth: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* Payment Status */}
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Payment Status
                                        </p>

                                        {selected.mode === "view" ? (
                                            <p className={`font-medium mt-1 ${selected.paymentStatus === "RECEIVED"
                                                ? "text-green-600"
                                                : "text-yellow-600"
                                                }`}>
                                                {!selected.paymentStatus
                                                    ? "-"
                                                    : selected.paymentStatus === "RECEIVED"
                                                        ? "Payment Received"
                                                        : "Payment Pending"}
                                            </p>
                                        ) : (
                                            <select
                                                value={selected.paymentStatus || ""}
                                                onChange={(e) =>
                                                    setSelected({
                                                        ...selected,
                                                        paymentStatus: e.target.value,
                                                    })
                                                }
                                                className="w-full border px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="PENDING">Payment Pending</option>
                                                <option value="RECEIVED">Payment Received</option>
                                            </select>
                                        )}
                                    </div>

                                </div>
                            </div>

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

                        {/* ACTION */}
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setSelected(null)}>
                                Close
                            </Button>

                            {selected.mode === "edit" && (
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