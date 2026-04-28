"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Eye,
    X,
    Search,
    MessageSquare,
    Send,
    Bell,
} from "lucide-react"

type RecentSubmission = {
    id: string
    supervisorName: string
    date: string
    time: string
    site: string
    issueTags?: string[]
    siteVisitConducted: string
    telephonicCalling: string

    // ✅ ADD THESE
    siteVisitScore?: number | null
    telephonicScore?: number | null
    storeScore?: number | null
}

type DetailAnswer = {
    id: string
    sectionName: string
    source: string
    questionId?: string
    questionText: string
    answerValue: string
    answerReason?: string | null
    siteContext?: string | null
    createdAt?: string
}

type DetailComment = {
    id: string
    authorName: string
    authorRole: string
    message: string
    createdAt: string
}

type NotificationItem = {
    submissionId: string
    authorName: string
    authorRole: string
    message: string
    createdAt?: string
}

type DetailData = {
    id: string
    supervisorName: string
    date: string
    time: string
    site: string
    siteVisitConducted: string
    siteVisitReason: string
    telephonicCalling: string
    telephonicSiteName: string
    telephonicIncharge: string

    // ✅ ADD THESE
    communicationScore?: number | null
    siteVisitScore?: number | null
    telephonicScore?: number | null
    storeScore?: number | null
    score: number

    answers: DetailAnswer[]
    comments: DetailComment[]
    createdAt?: string
    updatedAt?: string
}

function formatDateTime(value?: string) {
    if (!value) return "-"
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toLocaleString("en-IN")
}

function formatReadableLabel(text: string) {
    if (!text) return "-"
    return text
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ReportsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [siteFilter, setSiteFilter] = useState("All")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [supervisorFilter, setSupervisorFilter] = useState("All")
    const [search, setSearch] = useState("")

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<DetailData | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const [commentText, setCommentText] = useState("")
    const [sendingComment, setSendingComment] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 12

    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationOpen, setNotificationOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotificationItem[]>([])

    const router = useRouter()

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")

        if (!storedUser) {
            router.replace("/login") // IMPORTANT: use replace
        }
    }, [])

    async function loadNotifications() {
        const storedUser = sessionStorage.getItem("user")
        const user = storedUser ? JSON.parse(storedUser) : null

        if (!user?.role) return

        try {
            const res = await fetch(`/api/checklist/notifications?role=${user.role}`)
            const result = await res.json()

            if (result.success) {
                setUnreadCount(result.unreadCount || 0)
                setNotifications(result.notifications || [])
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (!e.target.closest(".notification-wrapper")) {
                setNotificationOpen(false)
            }
        }

        document.addEventListener("click", handleClickOutside)
        return () => document.removeEventListener("click", handleClickOutside)
    }, [])

    useEffect(() => {
        async function loadDashboard() {
            try {
                const res = await fetch("/api/dashboard", {

                    cache: "no-store"
                })

                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadDashboard()
    }, [])

    useEffect(() => {
        loadNotifications()

        const interval = setInterval(loadNotifications, 10000)
        return () => clearInterval(interval)
    }, [])

    async function openDetail(id: string) {
        try {
            setSelectedId(id)
            setDetailLoading(true)

            const res = await fetch(`/api/checklist/${id}`)
            const result = await res.json()

            if (result.success) {
                setDetail(result.data)

                const storedUser = sessionStorage.getItem("user")
                const user = storedUser ? JSON.parse(storedUser) : null

                await fetch("/api/checklist/mark-read", {
                    cache: "no-store",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        submissionId: id,
                        role: user?.role || "admin",
                    }),
                })
                await loadNotifications()

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

    async function handleSendComment() {
        if (!detail?.id || !commentText.trim()) return

        try {
            setSendingComment(true)

            const storedUser = sessionStorage.getItem("user")
            const user = storedUser ? JSON.parse(storedUser) : null

            const res = await fetch("/api/checklist/comment", {
                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    submissionId: detail.id,
                    authorName: user?.name || "Admin",
                    authorRole: user?.role || "admin",
                    message: commentText.trim(),
                }),
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.message || "Failed to send message")
                return
            }

            setCommentText("")
            await openDetail(detail.id)
            await loadNotifications()

        } catch (err) {
            console.error(err)
            alert("Failed to send message")
        } finally {
            setSendingComment(false)
        }
    }

    const supervisors: string[] = useMemo(() => {
        return Array.from(
            new Set(
                ((data?.recentSubmissions || []) as RecentSubmission[])
                    .map((s) => s.supervisorName)
                    .filter((name: string) => Boolean(name))
            )
        )
    }, [data])

    const allSites: string[] = useMemo(() => {
        return (data?.allSites || []).filter(
            (site: any): site is string => Boolean(site)
        )
    }, [data])





    const startIndex = (currentPage - 1) * rowsPerPage
    const filteredSubmissions = useMemo(() => {
        if (!data?.recentSubmissions) return []

        return data.recentSubmissions.filter((item: RecentSubmission) => {
            const matchSearch =
                !search ||
                item.site.toLowerCase().includes(search.toLowerCase()) ||
                item.supervisorName.toLowerCase().includes(search.toLowerCase())

            const matchSite = siteFilter === "All" || item.site === siteFilter

            const matchSupervisor =
                supervisorFilter === "All" || item.supervisorName === supervisorFilter

            const itemDate = new Date(item.date).getTime()

            const fromMatch = fromDate ? itemDate >= new Date(fromDate).getTime() : true
            const toMatch = toDate ? itemDate <= new Date(toDate).getTime() : true

            return matchSearch && matchSite && matchSupervisor && fromMatch && toMatch
        })
    }, [data, search, siteFilter, supervisorFilter, fromDate, toDate])

    const sortedSubmissions = [...filteredSubmissions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const paginatedSubmissions = sortedSubmissions.slice(
        startIndex,
        startIndex + rowsPerPage
    )


    function formatDateDMY(dateStr: string) {
        if (!dateStr) return "-"
        const d = new Date(dateStr)

        const day = String(d.getDate()).padStart(2, "0")
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const year = d.getFullYear()

        return `${day}-${month}-${year}`
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [siteFilter, fromDate, toDate, supervisorFilter, search])

    if (loading) {
        return <div className="p-6">Loading dashboard...</div>
    }

    function getIssuesFromAnswers(item: any) {
        const issues: string[] = []
        const answers = (item as any).answers || []

        answers.forEach((a: any) => {
            const q = a.questionText?.toLowerCase()?.trim()
            const ans = a.answerValue?.toLowerCase()?.trim()

            if (q?.includes("are there any emails pending more than 24 hours") && ans === "yes") {
                issues.push("Emails Pending > 24h")
            }

            if (q?.includes("any repeat complaint from same site") && ans === "yes") {
                issues.push("Repeat Complaint")
            }

            if (q?.includes("complaint resolved") && ans === "no") {
                issues.push("Complaint Not Resolved")
            }

            if (q?.includes("any urgent issue observed at the site") && ans === "yes") {
                issues.push("Urgent Issue")
            }

            if (q?.includes("is manpower shortage affecting operations") && ans === "yes") {
                issues.push("Manpower Shortage")
            }

            if (q?.includes("is replacement arranged") && ans === "no") {
                issues.push("Replacement Not Arranged")
            }

            if (q?.includes("is hiring request raised") && ans === "yes") {
                issues.push("Hiring Request Raised")
            }

            if (q?.includes("any safety risk observed") && ans === "yes") {
                issues.push("Safety Risk")
            }
        })

        return [...new Set(issues)]
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        View and manage all checklist submissions with actions and discussion
                    </p>
                </div>

                <div className="flex items-center gap-3 text-slate-500 relative notification-wrapper self-start">
                    <button
                        onClick={() => setNotificationOpen((prev) => !prev)}
                        className="relative w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {notificationOpen && (
                        <div className="absolute top-12 right-0 w-80 bg-white border rounded-2xl shadow-xl z-20 overflow-hidden">
                            <div className="px-4 py-3 border-b font-semibold text-slate-800">
                                Notifications
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-400">No new notifications</div>
                                ) : (
                                    notifications.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={async () => {
                                                setNotificationOpen(false)

                                                if (item.submissionId) {
                                                    const storedUser = sessionStorage.getItem("user")
                                                    const user = storedUser ? JSON.parse(storedUser) : null

                                                    await fetch("/api/checklist/mark-read", {
                                                        cache: "no-store",
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            submissionId: item.submissionId,
                                                            role: user?.role || "admin",
                                                        }),
                                                    })

                                                    openDetail(item.submissionId)
                                                    loadNotifications()
                                                }
                                            }}
                                            className="w-full text-left px-4 py-3 border-b hover:bg-slate-50 bg-blue-50"
                                        >
                                            <p className="text-sm font-medium text-slate-800">
                                                {item.authorName || "User"} ({item.authorRole || "unknown"})
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {item.message || "New message"}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="h-11 px-3 rounded-xl border bg-white"
                >
                    <option value="All">All Sites</option>
                    {allSites.map((site) => (
                        <option key={site} value={site}>
                            {site}
                        </option>
                    ))}
                </select>

                <select
                    value={supervisorFilter}
                    onChange={(e) => setSupervisorFilter(e.target.value)}
                    className="h-11 px-3 rounded-xl border bg-white"
                >
                    <option value="All">All Supervisors</option>
                    {supervisors.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-11 px-3 rounded-xl border bg-white"
                    placeholder="From date"
                />

                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-11 px-3 rounded-xl border bg-white"
                    placeholder="To date"
                />

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                        placeholder="Search site or supervisor"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-xl border"
                    />
                </div>
            </div>



            <div id="submissionTable" className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="font-semibold text-slate-800">Submitted Forms</h2>
                    <p className="text-sm text-slate-500">
                        Showing {filteredSubmissions.length} result(s)
                    </p>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">Supervisor</th>
                                <th className="p-3 text-left">Site</th>
                                <th className="p-3 text-left">Visit Type</th>
                                <th className="p-3 text-left">Issues</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-slate-400">
                                        No submissions found
                                    </td>
                                </tr>
                            ) : (
                                paginatedSubmissions.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b hover:bg-slate-50 transition
    ${item.siteVisitConducted !== "Yes" && !item.telephonicCalling ? "bg-red-50" : ""}
    ${item.siteVisitConducted !== "Yes" && item.telephonicCalling ? "bg-yellow-50" : ""}
  `}
                                    >
                                        <td className="p-3">{formatDateDMY(item.date)}</td>
                                        <td className="p-3">{item.supervisorName}</td>
                                        <td className="p-3">{item.site}</td>
                                        <td className="p-3">
                                            {item.siteVisitConducted === "Yes"
                                                ? "Physical Visit"
                                                : item.telephonicCalling === "Yes"
                                                    ? "Remote Audit"
                                                    : "Visit Pending"}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(item.issueTags?.length ? item.issueTags : getIssuesFromAnswers(item)).length ? (
                                                    (item.issueTags?.length ? item.issueTags : getIssuesFromAnswers(item)).map((tag: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600"
                                                        >
                                                            {formatReadableLabel(tag)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => openDetail(item.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center gap-2 mt-5">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {Math.ceil(filteredSubmissions.length / rowsPerPage)}
                    </span>

                    <button
                        disabled={startIndex + rowsPerPage >= filteredSubmissions.length}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {selectedId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
                    <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-semibold text-slate-800">
                                Checklist Detail View
                            </h2>
                            <button
                                onClick={() => {
                                    setSelectedId(null)
                                    setDetail(null)
                                    setCommentText("")
                                }}
                                className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="p-6">Loading details...</div>
                        ) : detail ? (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl border bg-slate-50">
                                        <p className="text-xs text-slate-500">Supervisor</p>
                                        <p className="font-semibold">{detail.supervisorName}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50">
                                        <p className="text-xs text-slate-500">Date</p>
                                        <p className="font-semibold">{detail.date}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50">
                                        <p className="text-xs text-slate-500">Time</p>
                                        <p className="font-semibold">{detail.time || "-"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50">
                                        <p className="text-xs text-slate-500">Site</p>
                                        <p className="font-semibold">{detail.site}</p>
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border">
                                        <p className="text-xs text-slate-500">Site Visit Conducted</p>
                                        <p className="font-medium">{detail.siteVisitConducted || "-"}</p>
                                    </div>

                                    {/* ✅ SHOW ONLY WHEN YES */}
                                    {detail.siteVisitConducted === "Yes" && (
                                        <div className="p-4 rounded-xl border">
                                            <p className="text-xs text-slate-500">Site Name</p>
                                            <p className="font-medium">{detail.site || "-"}</p>
                                        </div>
                                    )}

                                    {/* ✅ SHOW ONLY WHEN NO */}
                                    {detail.siteVisitConducted !== "Yes" && (
                                        <div className="p-4 rounded-xl border">
                                            <p className="text-xs text-slate-500">Reason</p>
                                            <p className="font-medium">{detail.siteVisitReason || "-"}</p>
                                        </div>
                                    )}
                                    <div className="p-4 rounded-xl border">
                                        <p className="text-xs text-slate-500">Telephonic Calling</p>
                                        <p className="font-medium">{detail.telephonicCalling || "-"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border">
                                        <p className="text-xs text-slate-500">Telephonic Site / Incharge</p>
                                        <p className="font-medium">
                                            {detail.telephonicSiteName || "-"} / {detail.telephonicIncharge || "-"}
                                        </p>
                                    </div>
                                </div>

                                {["Communication", "Site Visit", "Telephonic", "Store", "Basic Details"].map(
                                    (section) => {
                                        const sectionAnswers = detail.answers.filter(
                                            (a) => a.sectionName === section
                                        )

                                        if (sectionAnswers.length === 0) return null

                                        return (
                                            <div key={section} className="rounded-2xl border overflow-hidden">
                                                <div className="px-4 py-3 bg-slate-100 font-semibold text-slate-800">
                                                    {section}
                                                </div>

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
                                                            {sectionAnswers.map((ans) => (
                                                                <tr key={ans.id} className="border-t">
                                                                    <td className="p-3">
                                                                        {ans.questionText || "-"}
                                                                    </td>
                                                                    <td className="p-3 font-medium">{ans.answerValue || "-"}</td>
                                                                    <td className="p-3">{ans.answerReason || "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )
                                    }
                                )}

                                <div className="rounded-2xl border overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-100 font-semibold text-slate-800 flex items-center gap-2">
                                        <MessageSquare size={18} />
                                        Discussion Thread
                                    </div>

                                    <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto bg-slate-50">
                                        {(detail.comments || []).length === 0 ? (
                                            <p className="text-sm text-slate-400">No discussion yet</p>
                                        ) : (
                                            detail.comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className={`p-3 rounded-xl border ${comment.authorRole === "admin"
                                                        ? "bg-red-50 border-red-200"
                                                        : "bg-blue-50 border-blue-200"
                                                        }`}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {comment.authorName} ({comment.authorRole})
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDateTime(comment.createdAt)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                        {comment.message}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-4 border-t bg-white">
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write question / remark for supervisor..."
                                            className="w-full min-h-[100px] border rounded-xl p-3 text-sm"
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={handleSendComment}
                                                disabled={sendingComment || !commentText.trim()}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                <Send size={16} />
                                                {sendingComment ? "Sending..." : "Send Message"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">No detail found.</div>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}