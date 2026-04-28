"use client"

import { useEffect, useState } from "react"
import { FileText, History, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

type HistoryItem = {
    id: string
    createdAt: string
    role?: string

}

export default function HR1ReportPage() {
    const router = useRouter()

    const [form, setForm] = useState({
        proposalsUnderProcess: "",
        proposalsSent: "",
        tendersUnderProcess: "",
        tendersSubmitted: "",
        misc: "",
    })

    const [historyData, setHistoryData] = useState<HistoryItem[]>([])
    const [historyPage, setHistoryPage] = useState(1)
    const historyPerPage = 12
    const totalHistoryPages = Math.ceil(historyData.length / historyPerPage)


    useEffect(() => {
        fetchHistory()
    }, [])

    async function fetchHistory() {
        const res = await fetch("/api/md-reporting/bd/history?role=level1", {
            cache: "no-store",
        })
        const data = await res.json()

        if (data.success) {
            setHistoryData(data.data)
        }
    }

    function handleChange(key: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        const res = await fetch("/api/md-reporting/bd/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...form,
                role: "level1",
            }),
        })

        const data = await res.json()

        if (data.success) {
            alert("Report saved successfully ✅")
            setForm({
                proposalsUnderProcess: "",
                proposalsSent: "",
                tendersUnderProcess: "",
                tendersSubmitted: "",
                misc: "",
            })
            fetchHistory()
        } else {
            alert("Failed ❌")
        }
    }

    const totalPages = Math.ceil(historyData.length / historyPerPage)

    const paginatedHistory = historyData.slice(
        (historyPage - 1) * historyPerPage,
        historyPage * historyPerPage
    )

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    FM Business Development
                </h1>

            </div>

            {/* ---------------- PROPOSALS ---------------- */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">New Proposals</h2>
                        <p className="text-sm text-slate-500">
                            Add brief details for each
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <textarea
                        rows={5}
                        placeholder="List proposals currently being prepared..."
                        value={form.proposalsUnderProcess}
                        onChange={(e) =>
                            handleChange("proposalsUnderProcess", e.target.value)
                        }
                        className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:bg-white outline-none"
                    />

                    <textarea
                        rows={5}
                        placeholder="List proposals sent to clients..."
                        value={form.proposalsSent}
                        onChange={(e) =>
                            handleChange("proposalsSent", e.target.value)
                        }
                        className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:bg-white outline-none"
                    />
                </div>
            </div>

            {/* ---------------- TENDERS ---------------- */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            Tenders Submission
                        </h2>
                        <p className="text-sm text-slate-500">
                            Pipeline status
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <textarea
                        rows={5}
                        placeholder="Describe tenders under process..."
                        value={form.tendersUnderProcess}
                        onChange={(e) =>
                            handleChange("tendersUnderProcess", e.target.value)
                        }
                        className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:bg-white outline-none"
                    />

                    <textarea
                        rows={5}
                        placeholder="Describe submitted tenders..."
                        value={form.tendersSubmitted}
                        onChange={(e) =>
                            handleChange("tendersSubmitted", e.target.value)
                        }
                        className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:bg-white outline-none"
                    />
                </div>
            </div>

            {/* ---------------- MISC ---------------- */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            Miscellaneous / Remarks
                        </h2>
                        <p className="text-sm text-slate-500">
                            Anything else worth flagging
                        </p>
                    </div>
                </div>

                <textarea
                    rows={6}
                    placeholder="Write additional notes..."
                    value={form.misc}
                    onChange={(e) => handleChange("misc", e.target.value)}
                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:bg-white outline-none"
                />
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm"
                >
                    Save Report
                </button>
            </div>

            {/* ---------------- HISTORY ---------------- */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <History size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            Report History
                        </h2>
                        <p className="text-sm text-slate-500">
                            Past submissions
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {paginatedHistory.map((item) => {
                        const d = new Date(item.createdAt)

                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(`/md-reporting/bd/${item.id}`)}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                            >
                                <p className="text-lg font-semibold text-slate-900">
                                    {d.toLocaleDateString("en-GB")}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Created at{" "}
                                    {d.toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>

                                {/* ✅ NEW */}
                                <p className="mt-2 text-xs font-medium text-slate-600">
                                    Role: <span className="capitalize">{item.role}</span>
                                </p>

                                {/* OPTIONAL */}


                                <p className="mt-4 text-sm font-medium text-indigo-600">
                                    View / Edit →
                                </p>
                            </button>
                        )
                    })}
                </div>

                {/* PAGINATION */}
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page {historyPage} of {totalHistoryPages || 1}
                    </p>

                    <div className="flex gap-2">
                        <button
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage((p) => p - 1)}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>

                        <button
                            disabled={historyPage === totalHistoryPages || totalHistoryPages === 0}
                            onClick={() => setHistoryPage((p) => p + 1)}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}