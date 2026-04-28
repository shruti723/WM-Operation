"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { sites } from "@/lib/siteList"
import { useRef } from "react"

export default function OperationsPage() {
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedIssue, setSelectedIssue] = useState<string | null>(null)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<any>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const [selectedSite, setSelectedSite] = useState("")
    const [criticalNote, setCriticalNote] = useState("")
    const [history, setHistory] = useState<any[]>([])

    const [page, setPage] = useState(1)
    const pageSize = 12

    const formRef = useRef<HTMLDivElement | null>(null)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [isHistoryView, setIsHistoryView] = useState(false)

    /* ---------------- FETCH DATA ---------------- */

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch("/api/dashboard", {
                    cache: "no-store",
                })
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

    async function loadHistory() {
        try {
            const res = await fetch("/api/md-reporting/operation/history")
            const result = await res.json()

            if (result.success) {
                setHistory(result.data || [])
                setPage(1)
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    async function handleSaveReport() {
        if (!selectedSite || !criticalNote.trim()) {
            alert("Select site and enter critical issue")
            return
        }

        try {
            const res = await fetch("/api/md-reporting/operation/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingId,
                    site: selectedSite,
                    note: criticalNote,
                }),
            })

            const result = await res.json()

            if (result.success) {
                alert(editingId ? "Updated successfully" : "Saved successfully")

                // ✅ CLEAR FORM
                setSelectedSite("")
                setCriticalNote("")
                setEditingId(null)

                // ✅ REFRESH HISTORY
                await loadHistory()
            }
        } catch (err) {
            console.error(err)
        }
    }

    async function openDetail(id: string) {
        try {
            setSelectedId(id)
            setDetailLoading(true)

            const res = await fetch(`/api/checklist/${id}`)
            const result = await res.json()

            if (result.success) {
                setDetail(result.data)
            } else {
                setDetail(null)
            }
        } catch (err) {
            console.error(err)
            setDetail(null)
        } finally {
            setDetailLoading(false)
        }
    }

    /* ---------------- FILTER LOGIC ---------------- */

    const issueOnlySubmissions = useMemo(() => {
        if (!data?.recentSubmissions) return []

        return data.recentSubmissions.filter(
            (item: any) => (item.issueTags?.length || 0) > 0
        )
    }, [data])


    const filteredSubmissions = useMemo(() => {
        if (!issueOnlySubmissions.length) return []

        if (!selectedIssue) return issueOnlySubmissions

        return issueOnlySubmissions.filter((item: any) =>
            item.issueTags?.includes(selectedIssue)
        )
    }, [issueOnlySubmissions, selectedIssue])

    const paginatedHistory = useMemo(() => {
        const start = (page - 1) * pageSize
        return history.slice(start, start + pageSize)
    }, [history, page])

    const totalPages = Math.max(1, Math.ceil(history.length / pageSize))

    if (loading) {
        return <div className="p-6">Loading dashboard...</div>
    }

    /* ---------------- MAX ISSUE (FOR PROGRESS BAR) ---------------- */

    const maxIssue = Math.max(
        ...(data?.topIssues?.map((i: any) => i.count) || [1]),
        1
    )

    /* ---------------- UI ---------------- */

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">

            {/* BACK */}
            <button
                onClick={() => router.push("/md-reporting")}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Operations Dashboard
                </h2>
                <p className="text-sm text-slate-500">
                    Monitor issues, submissions and actions
                </p>
            </div>

            {/* ================= MAIN 2 COLUMN LAYOUT ================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ===== LEFT: ISSUES ===== */}
                <div className="lg:col-span-1 bg-white rounded-2xl border p-5 h-fit sticky top-4">

                    <div className="flex justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-800">
                                Top Recurring Issues
                            </h3>
                            <p className="text-sm text-slate-500">
                                Click to filter submissions
                            </p>
                        </div>

                        {selectedIssue && (
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="text-xs px-3 py-1 bg-slate-100 rounded-lg"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {data?.topIssues?.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No recurring issues
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                            {data.topIssues.map((issue: any, index: number) => {
                                const isActive = selectedIssue === issue.label

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedIssue(issue.label)}
                                        className={`cursor-pointer p-3 rounded-xl border
                                ${isActive
                                                ? "bg-indigo-50 border-indigo-300"
                                                : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">
                                                {issue.label}
                                            </span>

                                            <span className="text-sm font-bold text-red-500">
                                                {issue.count}
                                            </span>
                                        </div>

                                        <div className="h-2 bg-slate-100 rounded-full">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{
                                                    width: `${(issue.count / maxIssue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>


                {/* ===== RIGHT: TABLE ===== */}
                <div className="lg:col-span-2 bg-white rounded-2xl border p-5">

                    <h3 className="font-semibold text-slate-800 mb-4">
                        Submitted Forms ({filteredSubmissions.length})
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Supervisor</th>
                                    <th className="p-3 text-left">Site Name</th>
                                    <th className="p-3 text-left">Issues</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-400">
                                            No submissions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((item: any) => (
                                        <tr key={item.id} className="border-b hover:bg-yellow-50">
                                            <td className="p-3">{item.date}</td>
                                            <td className="p-3">{item.supervisorName}</td>
                                            <td className="p-3">{item.site}</td>

                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.issueTags?.map((tag: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        setIsHistoryView(false)
                                                        openDetail(item.id)
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>



            </div>
            {selectedId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl border">

                        {/* HEADER */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
                            <h2 className="text-lg font-semibold">Checklist Detail View</h2>

                            <button
                                onClick={() => {
                                    setSelectedId(null)
                                    setDetail(null)
                                }}
                                className="text-red-500 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6">
                            {detailLoading ? (
                                <p>Loading...</p>
                            ) : detail ? (
                                isHistoryView ? (

                                    // ✅ SIMPLE HISTORY VIEW
                                    <div className="space-y-4">

                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Site</p>
                                            <p className="font-semibold">{detail.site}</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Date & Time</p>
                                            <p>{new Date(detail.createdAt).toLocaleString()}</p>
                                        </div>

                                        <div className="p-4 border rounded-xl">
                                            <p className="text-xs text-slate-500">Critical Issue</p>
                                            <p className="mt-1">{detail.note}</p>
                                        </div>

                                    </div>

                                ) : (

                                    <div className="space-y-6">

                                        {/* TOP INFO */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="text-xs text-slate-500">Supervisor</p>
                                                <p className="font-semibold">{detail.supervisorName}</p>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="text-xs text-slate-500">Date</p>
                                                <p>{detail.date}</p>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="text-xs text-slate-500">Time</p>
                                                <p>{detail.time}</p>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="text-xs text-slate-500">Site</p>
                                                <p>{detail.site}</p>
                                            </div>
                                        </div>

                                        {/* VISIT INFO */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 border rounded-xl">
                                                <p className="text-xs text-slate-500">Site Visit Conducted</p>
                                                <p>{detail.siteVisitConducted}</p>
                                            </div>

                                            <div className="p-4 border rounded-xl">
                                                <p className="text-xs text-slate-500">Telephonic Calling</p>
                                                <p>{detail.telephonicCalling}</p>
                                            </div>
                                        </div>

                                        {/* QUESTIONS */}
                                        {["Communication", "Site Visit", "Telephonic", "Store", "Basic Details"].map(
                                            (section) => {

                                                const sectionAnswers = detail.answers?.filter(
                                                    (a: any) => a.sectionName === section
                                                )

                                                if (!sectionAnswers || sectionAnswers.length === 0) return null

                                                return (
                                                    <div key={section} className="rounded-2xl border overflow-hidden">

                                                        {/* SECTION HEADER */}
                                                        <div className="px-4 py-3 bg-slate-100 font-semibold text-slate-800">
                                                            {section}
                                                        </div>

                                                        {/* TABLE */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-slate-50 text-slate-600">
                                                                    <tr>
                                                                        <th className="p-3 text-left">Question</th>
                                                                        <th className="p-3 text-left">Answer</th>
                                                                        <th className="p-3 text-left">Reason</th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {sectionAnswers.map((ans: any) => (
                                                                        <tr key={ans.id} className="border-t">
                                                                            <td className="p-3">
                                                                                {ans.questionText || "-"}
                                                                            </td>

                                                                            <td className="p-3 font-medium">
                                                                                {ans.answerValue || "-"}
                                                                            </td>

                                                                            <td className="p-3">
                                                                                {ans.answerReason || "-"}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        )}

                                    </div>
                                )
                            ) : (
                                <p>No detail found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= CRITICAL ISSUE ENTRY ================= */}

            <div
                ref={formRef}
                className={`rounded-2xl border p-6 space-y-5 transition-all duration-300
    ${editingId ? "bg-orange-50 border-orange-400 shadow-md scale-[1.01]" : "bg-white"}`}
            >

                <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                        {editingId ? "✏️ Edit Report" : "Critical Site Issue"}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Report urgent problems for specific site
                    </p>
                </div>

                {/* SITE DROPDOWN */}
                <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl"
                >
                    <option value="">Select Site</option>

                    {sites.map((site) => (
                        <option key={site} value={site}>
                            {site}
                        </option>
                    ))}
                </select>

                {/* TEXT AREA */}
                <textarea
                    value={criticalNote}
                    onChange={(e) => setCriticalNote(e.target.value)}
                    placeholder="Write critical issue..."
                    className="w-full min-h-[120px] border rounded-xl p-3"
                />

                {/* SAVE BUTTON */}
                <div className="flex justify-end gap-3">

                    {editingId && (
                        <button
                            onClick={() => {
                                setEditingId(null)
                                setSelectedSite("")
                                setCriticalNote("")
                            }}
                            className="px-5 py-2 border rounded-xl"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        onClick={handleSaveReport}
                        className={`px-5 py-2 text-white rounded-xl 
            ${editingId ? "bg-orange-600 hover:bg-orange-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                        {editingId ? "Update Report" : "Save Report"}
                    </button>

                </div>
            </div>

            {/* ================= REPORT HISTORY ================= */}

            <div className="bg-white rounded-2xl border p-6 space-y-5">

                <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                        Report History
                    </h3>
                    <p className="text-sm text-slate-500">
                        Past submissions
                    </p>
                </div>

                {history.length === 0 ? (
                    <p className="text-sm text-slate-400">No history found</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

                        {paginatedHistory.map((item: any) => (
                            <div
                                key={item.id}
                                className={`border rounded-xl p-4 space-y-3 
    ${editingId === item.id ? "bg-indigo-50 border-indigo-400" : "bg-slate-50"}`}
                            >
                                <p className="font-semibold text-slate-800">
                                    {new Date(item.createdAt).toLocaleDateString("en-IN")}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {new Date(item.createdAt).toLocaleTimeString()}
                                </p>

                                {/* ✅ SITE */}
                                <p className="text-sm font-medium text-slate-700">
                                    📍 {item.site}
                                </p>

                                {/* ✅ NOTE PREVIEW */}
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {item.note}
                                </p>

                                {/* ACTIONS */}
                                <div className="flex gap-2 pt-2">

                                    {/* VIEW */}
                                    <button
                                        onClick={() => {
                                            setIsHistoryView(true)   // ⭐ THIS IS KEY DIFFERENCE

                                            setDetail({
                                                site: item.site,
                                                note: item.note,
                                                createdAt: item.createdAt
                                            })

                                            setSelectedId(item.id)
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg"
                                    >
                                        View
                                    </button>

                                    {/* EDIT */}
                                    <button
                                        onClick={() => {
                                            setSelectedSite(item.site)
                                            setCriticalNote(item.note)
                                            setEditingId(item.id)

                                            formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                                            setTimeout(() => {
                                                document.querySelector("textarea")?.focus()
                                            }, 300)
                                        }}
                                        className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg"
                                    >
                                        Edit
                                    </button>

                                </div>
                            </div>
                        ))}

                    </div>
                )}
                {/* PAGINATION */}
                {(
                    <div className="flex justify-between items-center mt-6">

                        {/* LEFT: PAGE INFO */}
                        <div className="text-sm text-slate-500">
                            Page {page} of {totalPages} • {history.length} records
                        </div>

                        {/* RIGHT: BUTTONS */}
                        <div className="flex gap-2">

                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Prev
                            </button>

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Next
                            </button>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}