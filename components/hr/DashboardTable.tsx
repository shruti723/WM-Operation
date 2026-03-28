"use client"

import { useEffect, useState } from "react"

export default function DashboardTable() {
    type ManpowerItem = {
        designation: string
        authorised: number
        deployed: number
        shortage: number
        needed?: number
        recruitmentProcess?: string
        responsible?: string
        cutoffDate?: string
        remarks?: string
    }

    type RowData = {
        site?: string
        startDate?: string
        lastRenewalDate?: string
        nextRenewalDate?: string
        designation?: ManpowerItem[]
        manpowerList?: ManpowerItem[]
        status?: string
        updated?: string
        createdOn?: string
    }


    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [user, setUser] = useState<any>(null)

    const [data, setData] = useState<RowData[]>([])
    const [formData, setFormData] = useState<RowData | null>(null)
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null)

    // 🔥 MODAL STATE

    const [mode, setMode] = useState<"view" | "edit" | null>(null)

    /* ✅ LOAD USER */
    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
    }, [])
    function formatDate(date: string | Date | null | undefined) {
        if (!date) return "-"

        const d = typeof date === "string" ? parseCustomDate(date) : date

        if (!d) return "-"

        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }
    function parseCustomDate(dateStr?: string) {
        if (!dateStr) return null

        let d = new Date(dateStr)

        if (isNaN(d.getTime())) {
            const [datePart, timePart] = dateStr.split(" ")
            const [day, month, year] = datePart.split("/")

            d = new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`)
        }

        return isNaN(d.getTime()) ? null : d
    }
    /* ✅ LOAD TABLE DATA */
    useEffect(() => {
        async function loadTable() {
            try {
                const res = await fetch(
                    "https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec?type=dashboardTable"
                )
                const result = await res.json()
                console.log("TABLE API:", result)
                const parsed = (result?.data || []).map((row: any) => ({
                    ...row,

                    // ✅ HANDLE BOTH CASES
                    site: row.site || row["Site Name"],
                    createdOn: row.startDate || row["Start Date"],
                    updated: row.updated || row["Updated On"],

                    lastRenewalDate: row.lastRenewalDate || row["Last Renewal Date"],
                    nextRenewalDate: row.nextRenewalDate || row["Next Renwal Due On"],

                    status: row.status || row["Status"],

                    designation:
                        typeof row.designation === "string"
                            ? JSON.parse(row.designation || "[]")
                            : row.designation || [],

                    manpowerList:
                        typeof row.manpowerList === "string"
                            ? JSON.parse(row.manpowerList || "[]")
                            : row.manpowerList || []
                }))
                setData(parsed)
                console.log("PARSED DATA:", parsed)

            } catch (err) {
                console.error(err)
            }
        }

        loadTable()
    }, [])

    /* ✅ FILTER */
    const filteredData = data.filter(row => {
        const matchesSearch =
            !search || row.site?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus =
            statusFilter === "All" ||
            row.status?.includes(statusFilter)
        console.log("ROW:", row)
        console.log("SITE:", row.site)
        return matchesSearch && matchesStatus
    })
    async function handleSave() {
        try {
            const list = formData?.manpowerList || []

            // ❌ VALIDATION
            const isEmpty = list.some(item =>
                !item.needed &&
                !item.recruitmentProcess &&
                !item.responsible &&
                !item.cutoffDate &&
                !item.remarks
            )

            if (isEmpty) {
                alert("Please fill at least one field in each row ❌")
                return
            }

            const payload = list.map(item => ({
                designation: item.designation,
                needed: item.needed || 0,
                recruitmentProcess: item.recruitmentProcess || "",
                responsible: item.responsible || "",
                cutoffDate: item.cutoffDate || "",
                remarks: item.remarks || ""
            }))

            await fetch("https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec", {
                method: "POST",
                body: JSON.stringify({
                    type: "updateManpower",
                    site: formData?.site || "",
                    manpowerList: payload
                })
            })

            alert("Saved successfully ✅")

            // 🔥 CLOSE MODAL
            setSelectedRow(null)

            // 🔥 RELOAD DATA
            window.location.reload()

        } catch (err) {
            console.error(err)
            alert("Error saving ❌")
        }
    }

    const normalize = (str?: string) =>
        str?.toLowerCase().replace(/\s+/g, "").trim()

    return (
        <>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 mt-6 overflow-hidden">

                {/* HEADER */}
                <div className="p-4 flex justify-between items-center border-b">

                    <input
                        placeholder="🔍 Search sites..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-[34px] border border-slate-200 rounded-md px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-[34px] border border-slate-200 rounded-md px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending Level 3">Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>


                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">

                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-4 text-left w-[20%]">Site</th>
                                <th className="p-4 text-left w-[18%]">Created On</th>
                                <th className="p-4 text-center w-[14%]">Status</th>
                                <th className="p-4 text-center w-[16%]">Deadline</th>
                                <th className="p-4 text-center w-[18%]">Updated On</th>
                                <th className="p-4 text-center w-[14%]">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-6 text-gray-400">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, i) => (
                                    <tr key={i} className="bg-white hover:bg-gray-50 transition h-[64px]">

                                        {/* SITE */}
                                        <td className="p-4 text-left align-middle">
                                            {row.site}
                                        </td>

                                        {/* START DATE */}
                                        <td className="p-4 text-left text-gray-500 align-middle">
                                            {formatDate(row.createdOn)}
                                        </td>

                                        {/* STATUS */}
                                        <td className="p-4 text-center align-middle">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
${row.status?.includes("Completed")
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : row.status?.includes("Pending")
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                {row.status?.includes("Completed") ? "Completed" : "Pending"}
                                            </span>
                                        </td>

                                        {/* DEADLINE */}
                                        <td className="p-4 text-center align-middle">
                                            {row.createdOn ? (() => {
                                                const d = parseCustomDate(row.createdOn)
                                                if (!d) return "-"
                                                d.setDate(d.getDate() + 1)
                                                return formatDate(d)
                                            })() : "-"}
                                        </td>

                                        {/* UPDATED */}
                                        <td className="p-4 text-center align-middle">
                                            {formatDate(row.updated || row.createdOn)}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-center align-middle">
                                            <div className="flex justify-center gap-3">

                                                <button
                                                    onClick={() => {
                                                        setSelectedRow(row)
                                                        setFormData(row) // ✅ REQUIRED
                                                        setMode("view")
                                                    }}
                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
                                                >
                                                    👁
                                                </button>

                                                {/* ✅ ONLY ATUL CAN EDIT */}
                                                {user?.name?.toLowerCase() === "hr 3" && row.status?.includes("Pending") && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRow(row)
                                                            setFormData(row) // ✅ REQUIRED
                                                            setMode("edit")
                                                        }}
                                                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition shadow-sm"
                                                    >
                                                        ✏
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>
                </div>
            </div>

            {/* 🔥 MODAL */}
            {selectedRow && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">

                    <div className="w-[1100px] max-h-[90vh] overflow-y-auto rounded-3xl 
bg-white shadow-2xl border border-slate-200">

                        {/* HEADER */}
                        <div className="px-8 py-5 flex justify-between items-center border-b bg-white sticky top-0 z-10">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                {mode === "view" ? "👁 View Form" : "✏ Update Form"}
                            </h2>

                            <button
                                onClick={() => setSelectedRow(null)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 🔹 BASIC DETAILS */}
                        <div className="grid grid-cols-3 gap-6 px-8 py-6 border-b">

                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-400">Site Name</p>
                                <p className="font-semibold text-slate-800">{formData?.site}</p>
                            </div>

                            {/* 🔥 START DATE → NOW LAST RENEWAL */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-gray-500">Last Renewal</p>
                                <p className="font-semibold">{formatDate(formData?.lastRenewalDate)}</p>
                            </div>

                            {/* 🔥 LAST RENEWAL → NOW NEXT RENEWAL */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-gray-500">Next Renewal</p>
                                <p className="font-semibold">{formatDate(formData?.nextRenewalDate)}</p>
                            </div>

                        </div>

                        {/* 🔥 MANPOWER TABLE */}
                        <div className="px-8 py-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Manpower Details</h3>

                            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                                <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                                    <tr>
                                        <th className="p-2 w-[40%] text-left">Designation</th>
                                        <th className="p-2 w-[20%] text-center">Authorized</th>
                                        <th className="p-2 w-[20%] text-center">Deployed</th>
                                        <th className="p-2 w-[20%] text-center">Shortage</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {(formData?.designation || []).map((authItem, i) => {

                                        const deployedItem = (formData?.manpowerList || []).find(
                                            (m) =>
                                                normalize(m.designation) === normalize(authItem.designation)
                                        ) || ({} as ManpowerItem)

                                        // fallback if manpowerList missing
                                        const deployedValue =
                                            typeof deployedItem?.deployed === "number"
                                                ? deployedItem.deployed
                                                : null

                                        const shortage =
                                            deployedItem?.shortage ??
                                            (deployedValue !== null
                                                ? authItem.authorised - deployedValue
                                                : "-")

                                        return (
                                            <tr key={i} className="border-b hover:bg-slate-50 transition text-sm">

                                                <td className="p-2 w-[40%] text-left font-medium">
                                                    {authItem.designation}
                                                </td>

                                                <td className="p-2 w-[20%] text-center">
                                                    {authItem.authorised}
                                                </td>

                                                <td className="p-2 w-[20%] text-center text-blue-600 font-semibold">
                                                    {deployedValue ?? "-"}
                                                </td>

                                                <td className={`p-2 w-[20%] text-center font-semibold ${shortage > 0 ? "text-red-500" : "text-green-600"
                                                    }`}>
                                                    {shortage}
                                                </td>

                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>


                        {/* 🔥 HR SECTION */}
                        <div className="px-8 py-6 border-t">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Recruitment Details</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">

                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                                        <tr className="border-b">
                                            <th className="p-3 text-left w-[18%]">Designation</th>
                                            <th className="p-3 text-center w-[14%]">Needed</th>
                                            <th className="p-3 text-center w-[18%]">Process</th>
                                            <th className="p-3 text-center w-[16%]">Responsible</th>
                                            <th className="p-3 text-center w-[16%]">Cutoff</th>
                                            <th className="p-3 text-center w-[18%]">Remarks</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(formData?.manpowerList || []).map((item, i) => (
                                            <tr key={i} className="border-b hover:bg-slate-50 transition text-sm">

                                                <td className="p-2 w-[18%] text-left font-medium">
                                                    {item.designation}
                                                </td>

                                                <td className="p-2 w-[14%] text-center">
                                                    {mode === "view" ? (
                                                        item.needed ?? "-"
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={item.needed ?? ""}
                                                            onChange={(e) => {
                                                                const updated = [...(formData?.manpowerList || [])]
                                                                updated[i].needed = Number(e.target.value)
                                                                setFormData({ ...formData!, manpowerList: updated })
                                                            }}
                                                            className="w-full h-[30px] text-center border border-slate-200 rounded-md text-sm"
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-2 w-[18%] text-center">
                                                    {mode === "view" ? (
                                                        item.recruitmentProcess || "-"
                                                    ) : (
                                                        <select
                                                            value={item.recruitmentProcess || ""}
                                                            onChange={(e) => {
                                                                const updated = [...(formData?.manpowerList || [])]
                                                                updated[i].recruitmentProcess = e.target.value
                                                                setFormData({ ...formData!, manpowerList: updated })
                                                            }}
                                                            className="w-full h-[30px] text-center border border-slate-200 rounded-md text-sm"
                                                        >
                                                            <option value="">Select</option>
                                                            <option>Under Process</option>
                                                            <option>Completed</option>
                                                            <option>Not Required</option>
                                                            <option>Unknown</option>
                                                        </select>
                                                    )}
                                                </td>

                                                <td className="p-2 w-[18%] text-center">
                                                    {mode === "view" ? (
                                                        item.responsible || "-"
                                                    ) : (
                                                        <select
                                                            value={item.responsible || ""}
                                                            onChange={(e) => {
                                                                const updated = [...(formData?.manpowerList || [])]
                                                                updated[i].responsible = e.target.value
                                                                setFormData({ ...formData!, manpowerList: updated })
                                                            }}
                                                            className="w-full h-[30px] text-center border border-slate-200 rounded-md text-sm"
                                                        >
                                                            <option value="">Select</option>
                                                            <option>HR</option>
                                                            <option>Assist. Manager</option>
                                                            <option>Site Supervisor</option>
                                                        </select>
                                                    )}
                                                </td>

                                                <td className="p-2 w-[18%] text-center">
                                                    {mode === "view" ? (
                                                        item.cutoffDate ? formatDate(item.cutoffDate) : "-"
                                                    ) : (
                                                        <input
                                                            type="date"
                                                            value={item.cutoffDate?.split("T")[0] || ""}
                                                            onChange={(e) => {
                                                                const updated = [...(formData?.manpowerList || [])]
                                                                updated[i].cutoffDate = e.target.value
                                                                setFormData({ ...formData!, manpowerList: updated })
                                                            }}
                                                            className="w-full h-[30px] text-center border border-slate-200 rounded-md text-sm"
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-2 w-[18%] text-center">
                                                    {mode === "view" ? (
                                                        item.remarks || "-"
                                                    ) : (
                                                        <input
                                                            value={item.remarks || ""}
                                                            onChange={(e) => {
                                                                const updated = [...(formData?.manpowerList || [])]
                                                                updated[i].remarks = e.target.value
                                                                setFormData({ ...formData!, manpowerList: updated })
                                                            }}
                                                            className="w-full h-[30px] text-center border border-slate-200 rounded-md text-sm"
                                                        />
                                                    )}
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SAVE BUTTON */}
                        {mode === "edit" && (
                            <div className="px-8 py-6 border-t bg-white sticky bottom-0">
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}

                    </div>
                </div >
            )
            }
        </>
    )
}