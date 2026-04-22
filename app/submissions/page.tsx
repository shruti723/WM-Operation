"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  FileText,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Eye,
  X,
  Send,
} from "lucide-react"

type Submission = {
  id: string
  date: string
  time: string
  site: string
  supervisorName: string
  siteVisitConducted: string
  telephonicCalling: string
  score: number
  status: string
  commentCount: number
  latestComment: string
  submittedAt: string

  summary?: {
    totalIssues: number
    openIssues: number
    resolvedIssues: number
    isRepeat: boolean
    issueTags?: string[]
  }
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
}

type DetailComment = {
  id: string
  authorName: string
  authorRole: string
  message: string
  createdAt: string
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
  answers: DetailAnswer[]
  comments: DetailComment[]
  status: string
}

function statusClass(status: string) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700"
  if (status === "needs_action") return "bg-amber-100 text-amber-700"
  if (status === "critical") return "bg-red-100 text-red-700"
  return "bg-slate-100 text-slate-600"
}

function statusLabel(status: string) {
  if (status === "completed") return "Completed"
  if (status === "needs_action") return "Needs Action"
  if (status === "critical") return "Critical"
  return status
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

export default function SubmissionsPage() {
  const router = useRouter()



  const [user, setUser] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editableAnswers, setEditableAnswers] = useState<DetailAnswer[]>([])

  const [filter, setFilter] = useState("all")

  const [search, setSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 10



  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.site.toLowerCase().includes(search.toLowerCase()) ||
      s.supervisorName.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter

    const submissionDate = s.date ? new Date(s.date) : null
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null

    const matchesFrom = !from || !submissionDate || submissionDate >= from
    const matchesTo = !to || !submissionDate || submissionDate <= to

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
  })

  const pendingCount = filteredSubmissions.filter(
    (s) => s.status !== "completed"
  ).length

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)
  )

  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    async function loadSubmissions() {
      try {
        const res = await fetch(
          `/api/checklist/my-submissions?email=${parsedUser.email}`,
          {
            cache: "no-store",
          }
        )
        const result = await res.json()
        console.log("Logged user:", parsedUser)

        if (result.success) {
          setSubmissions(result.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [router])

  async function openDetail(id: string) {
    try {
      setSelectedId(id)
      setDetailLoading(true)
      const res = await fetch(`/api/checklist/${id}`, {
        cache: "no-store",
      })
      const result = await res.json()

      if (result.success) {
        setDetail(result.data)
        setEditableAnswers(
          result.data.answers.map((a: DetailAnswer) => ({
            ...a,
            answerValue: a.answerValue?.toLowerCase() || ""
          }))
        )
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

  async function handleReply() {
    if (!detail?.id || !replyText.trim() || !user) return

    try {
      setSendingReply(true)

      const res = await fetch("/api/checklist/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: detail.id,
          authorName: user.name,
          authorRole: user.role,
          message: replyText.trim(),
        }),
      })

      const result = await res.json()

      if (!result.success) {
        alert(result.message || "Failed to send reply")
        return
      }

      setReplyText("")
      await openDetail(detail.id)
    } catch (err) {
      console.error(err)
      alert("Failed to send reply")
    } finally {
      setSendingReply(false)
    }
  }

  async function handleUpdate() {
    if (!detail?.id) return

    try {
      const res = await fetch("/api/checklist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: detail.id,
          answers: editableAnswers,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        alert("Update failed")
        return
      }

      alert("Updated successfully ✅")

      setEditMode(false)
      await openDetail(detail.id)

    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    }
  }

  if (loading) {
    return <div className="p-6">Loading submissions...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex h-14 items-center px-4">
          <button
            className="mr-2 p-2 rounded-lg hover:bg-slate-100"
            onClick={() => router.push("/supervisor")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold">My Submitted Checklists</span>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-30 mb-6 backdrop-blur-xl bg-white/80 border border-slate-200 shadow-lg rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by site or supervisor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="needs_action">Needs Action</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      <main className="p-4 max-w-5xl mx-auto">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h2 className="text-lg font-semibold text-slate-800">No submissions yet</h2>
            <p className="text-sm text-slate-500 mt-1">
              You have not submitted any checklist yet.
            </p>
            <button
              onClick={() => router.push("/checklist")}
              className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Start New Checklist
            </button>
          </div>
        ) : (
          <>
            {pendingCount > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                ⚠ {pendingCount} checklist(s) require your attention
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-slate-500">
                {filteredSubmissions.length} submission{submissions.length !== 1 ? "s" : ""}
              </div>

              {paginatedSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="group bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                        {submission.site}
                      </h3>
                      {submission.summary && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {submission.summary.issueTags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-200 font-medium"
                            >
                              {tag}
                            </span>
                          ))}



                          {submission.summary?.openIssues > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                              ❗ {submission.summary.openIssues} Open Issues
                            </span>
                          )}

                          {submission.summary?.resolvedIssues > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                              ✅ {submission.summary.resolvedIssues} Resolved
                            </span>
                          )}



                        </div>
                      )}




                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{submission.date}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{submission.time || "-"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{submission.supervisorName}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{submission.commentCount} comment(s)</span>
                        </div>
                      </div>

                      {submission.latestComment && (
                        <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border">
                          <span className="font-medium">Latest admin/supervisor discussion:</span>{" "}
                          {submission.latestComment}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="flex items-center gap-2">

                        {(submission.summary?.totalIssues ?? 0) > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            {submission.summary?.totalIssues} Issues
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            No Issues
                          </span>
                        )}

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                            submission.status
                          )}`}
                        >
                          {statusLabel(submission.status)}
                        </span>

                      </div>

                      <button
                        onClick={() => openDetail(submission.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:opacity-90 transition"                        >
                        <Eye size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-slate-50 disabled:opacity-40"
              >
                ← Prev
              </button>

              <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg shadow-sm border">
                Page <span className="text-indigo-600 font-semibold">{currentPage}</span> of {totalPages}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-slate-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </main>

      {selectedId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-slate-800">
                Submission Detail
              </h2>

              <div className="flex items-center gap-3">
                <button
                  disabled={detail?.status === "completed"}
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition
      ${detail?.status === "completed"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : editMode
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                  {editMode ? "Cancel Edit" : "Update Issues"}
                </button>

                <button
                  onClick={() => {
                    setSelectedId(null)
                    setDetail(null)
                    setReplyText("")
                    setEditMode(false)
                  }}
                  className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
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
                  <div className="p-4 rounded-xl border">
                    <p className="text-xs text-slate-500">Site Visit Reason</p>
                    <p className="font-medium">{detail.siteVisitReason || "-"}</p>
                  </div>
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
                                  <td className="p-3">{formatReadableLabel(ans.questionText)}</td>
                                  <td className="p-3">
                                    {editMode ? (
                                      (() => {
                                        const current = editableAnswers.find(a => a.id === ans.id)
                                        const value = current?.answerValue ?? ans.answerValue ?? ""

                                        const booleanQuestions = [
                                          "pendingemails",
                                          "repeatcomplaint",
                                          "complaintresolved",
                                          "sitevisitconducted",
                                          "telephoniccalling"
                                        ]

                                        const isDropdown = booleanQuestions.includes(
                                          ans.questionText.toLowerCase()
                                        )

                                        // 🔹 CASE 1: Dropdown (Yes/No/Good/Poor)
                                        if (isDropdown) {
                                          return (
                                            <select
                                              value={value}
                                              onChange={(e) => {
                                                setEditableAnswers(prev =>
                                                  prev.map(a =>
                                                    a.id === ans.id
                                                      ? { ...a, answerValue: e.target.value }
                                                      : a
                                                  )
                                                )
                                              }}
                                              className="border rounded-lg px-3 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                                            >
                                              <option value="">Select</option>
                                              <option value="yes">Yes</option>
                                              <option value="no">No</option>
                                              <option value="good">Good</option>
                                              <option value="poor">Poor</option>
                                            </select>
                                          )
                                        }

                                        // 🔹 CASE 2: Number/Text input
                                        return (
                                          <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => {
                                              setEditableAnswers(prev =>
                                                prev.map(a =>
                                                  a.id === ans.id
                                                    ? { ...a, answerValue: e.target.value }
                                                    : a
                                                )
                                              )
                                            }}
                                            className="border rounded-lg px-3 py-1.5 w-24"
                                          />
                                        )
                                      })()
                                    ) : (
                                      <span className="font-medium text-slate-800">
                                        {ans.answerValue || "-"}
                                      </span>
                                    )}
                                  </td>
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
                {editMode && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdate}
                      className="px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 shadow"
                    >
                      Save Updates
                    </button>
                  </div>
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
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply to admin..."
                      className="w-full min-h-[100px] border rounded-xl p-3 text-sm"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingReply ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">No detail found.</div>
            )}
          </div>
        </div >
      )
      }

      {
        submissions.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              className="h-14 px-6 rounded-full shadow-lg bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => router.push("/checklist")}
            >
              New Checklist
            </button>
          </div>
        )
      }
    </div >
  )
}