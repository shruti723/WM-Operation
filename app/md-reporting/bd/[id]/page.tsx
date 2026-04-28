"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, MessageSquare } from "lucide-react"

export default function EditBDPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string
    const [role, setRole] = useState("")
    const [userRole, setUserRole] = useState("")
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        proposalsUnderProcess: "",
        proposalsSent: "",
        tendersUnderProcess: "",
        tendersSubmitted: "",
        misc: "",
    })

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")

        if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUserRole(parsedUser.role)
        }
    }, [])

    useEffect(() => {
        if (!id) return

        const fetchReport = async () => {
            try {
                const res = await fetch(`/api/md-reporting/bd/${id}`)
                const data = await res.json()

                if (data.success && data.data) {
                    setForm({
                        proposalsUnderProcess: data.data.proposalsUnderProcess || "",
                        proposalsSent: data.data.proposalsSent || "",
                        tendersUnderProcess: data.data.tendersUnderProcess || "",
                        tendersSubmitted: data.data.tendersSubmitted || "",
                        misc: data.data.misc || "",
                    })
                    setRole(data.data.role)
                } else {
                    alert("Report not found ❌")
                    router.push("/md-reporting/bd")
                }
            } catch (error) {
                console.error("Fetch report error:", error)
                alert("Failed to load report ❌")
                router.push("/md-reporting/bd")
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [id, router])

    const handleChange = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleUpdate = async () => {
        try {
            const res = await fetch(`/api/md-reporting/bd/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (data.success) {
                alert("Updated successfully ✅")

                if (userRole === "level1") {
                    router.push("/hr/manpower/hr1-fm-bd-reporting")
                } else {
                    router.push("/md-reporting/bd")
                }
            } else {
                alert("Update failed ❌")
            }
        } catch (error) {
            console.error("Update error:", error)
            alert("Error updating report ❌")
        }
    }

    if (loading) {
        return <div className="p-6">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-5 sm:px-8 py-5 sm:py-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <button
                                    onClick={() => {
                                        if (userRole === "level1") {
                                            router.push("/hr/manpower/hr1-fm-bd-reporting")
                                        } else {
                                            router.push("/md-reporting/bd")
                                        }
                                    }}
                                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>

                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                                    Edit Business Development Report
                                </h1>

                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-5 sm:px-8 py-6 sm:py-8 space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        New Proposals
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Proposal Under Process
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.proposalsUnderProcess}
                                        onChange={(e) =>
                                            handleChange("proposalsUnderProcess", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Proposal Sent
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.proposalsSent}
                                        onChange={(e) =>
                                            handleChange("proposalsSent", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Tenders Submission
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Under Process
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.tendersUnderProcess}
                                        onChange={(e) =>
                                            handleChange("tendersUnderProcess", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                        Submitted
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.tendersSubmitted}
                                        onChange={(e) =>
                                            handleChange("tendersSubmitted", e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <MessageSquare size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Misc / Remarks
                                    </h2>
                                </div>
                            </div>

                            <textarea
                                rows={6}
                                value={form.misc}
                                onChange={(e) => handleChange("misc", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    if (userRole === "level1") {
                                        router.push("/hr/manpower/hr1-fm-bd-reporting")
                                    } else {
                                        router.push("/md-reporting/bd")
                                    }
                                }}
                                className="h-12 rounded-2xl px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdate}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                <FileText size={16} />
                                Update Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}