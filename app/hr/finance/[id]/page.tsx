"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function FinanceDetailPage() {
    const params = useParams()
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    // ✅ get user
    useEffect(() => {
        const stored = sessionStorage.getItem("user")
        if (stored) setUser(JSON.parse(stored))
    }, [])

    // ✅ fetch record
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/hr/finance/${params.id}`)
                const result = await res.json()

                if (!result.success) {
                    alert("Failed to load")
                    router.push("/hr")
                    return
                }

                setData(result.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) load()
    }, [params.id])

    async function handleUpdate() {
        try {
            const res = await fetch(`/api/hr/finance/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    user,
                    role: user?.role,
                })
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.message)
                return
            }

            alert("Updated successfully ✅")
            router.push("/hr")
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <p className="p-6">Loading...</p>

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-semibold">Finance Details</h1>
                    <p className="text-sm text-gray-500">
                        Update financial data for this site
                    </p>
                </div>
                {/* ================= HR1 EDIT ================= */}
                {user?.role === "level1" && (
                    <>
                        <h3 className="font-semibold mt-4">HR1 Details</h3>

                        <input
                            value={data.incharge}
                            onChange={(e) => setData({ ...data, incharge: e.target.value })}
                            className="w-full border p-2"
                        />

                        <input
                            type="date"
                            value={data.startDate}
                            onChange={(e) => setData({ ...data, startDate: e.target.value })}
                            className="w-full border p-2"
                        />

                        <input
                            type="date"
                            value={data.lastRenewalDate}
                            onChange={(e) =>
                                setData({ ...data, lastRenewalDate: e.target.value })
                            }
                            className="w-full border p-2"
                        />

                        <input
                            type="date"
                            value={data.nextRenewalDate}
                            onChange={(e) =>
                                setData({ ...data, nextRenewalDate: e.target.value })
                            }
                            className="w-full border p-2"
                        />
                    </>
                )}


                {/* A1 EDIT */}
                {/* ================= A1 EDIT ================= */}
                {user?.role === "account1" && (
                    <>
                        <h3 className="font-semibold mt-4 text-lg">Finance Details</h3>

                        <div className="grid md:grid-cols-2 gap-4">

                            {/* 🔵 HR1 VIEW (READ ONLY) */}
                            <div>
                                <label>Site Name</label>
                                <input value={data.site} disabled className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100" />
                            </div>

                            <div>
                                <label>Incharge</label>
                                <input value={data.incharge} disabled className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100" />
                            </div>

                            <div>
                                <label>Start Date</label>
                                <input value={data.startDate} disabled className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100" />
                            </div>

                            <div>
                                <label>Last Renewal Date</label>
                                <input value={data.lastRenewalDate} disabled className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100" />
                            </div>

                            <div>
                                <label>Next Renewal Due</label>
                                <input value={data.nextRenewalDate} disabled className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100" />
                            </div>

                            {/* 🟡 A1 EDIT FIELDS */}
                            <div>
                                <label>Monthly Billing as per Contract / as per average yearly</label>
                                <input
                                    value={data.monthlyBilling || ""}
                                    onChange={(e) =>
                                        setData({ ...data, monthlyBilling: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label>Last Invoice Raise - On Date</label>
                                <input
                                    type="date"
                                    value={data.invoiceDate || ""}
                                    onChange={(e) =>
                                        setData({ ...data, invoiceDate: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label>Last Invoice Raise - Amount</label>
                                <input
                                    value={data.invoiceAmount || ""}
                                    onChange={(e) =>
                                        setData({ ...data, invoiceAmount: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label>Last Invoice Raise - For Month</label>
                                <select
                                    value={data.invoiceMonth || ""}
                                    onChange={(e) =>
                                        setData({ ...data, invoiceMonth: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"                                >
                                    <option value="">Select Month</option>
                                    {months.map((m: string) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Invoice Payment Status</label>
                                <select
                                    value={data.paymentStatus || ""}
                                    onChange={(e) =>
                                        setData({ ...data, paymentStatus: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    <option value="Payment Received">Payment Received</option>
                                    <option value="Payment Pending">Payment Pending</option>
                                </select>
                            </div>

                        </div>
                    </>
                )}

                {/* HR2 EDIT */}
                {/* ================= HR2 EDIT ================= */}
                {user?.role === "level2" && (
                    <>
                        <div className="grid md:grid-cols-2 gap-4">

                            {/* 🔵 HR1 VIEW */}
                            <div>
                                <label>Site Name</label>
                                <input value={data.site} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Incharge</label>
                                <input value={data.incharge} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Start Date</label>
                                <input value={data.startDate} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Last Renewal Date</label>
                                <input value={data.lastRenewalDate} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Next Renewal Due On</label>
                                <input value={data.nextRenewalDate} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            {/* 🟡 A1 VIEW */}
                            <div>
                                <label>Monthly Billing as per Contract/ as per average yearly</label>
                                <input value={data.monthlyBilling || ""} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Last Invoice Raise - Date</label>
                                <input value={data.invoiceDate || ""} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Last Invoice Raise - Amount</label>
                                <input value={data.invoiceAmount || ""} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Last Invoice Raise - For Month of</label>
                                <input value={data.invoiceMonth || ""} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            <div>
                                <label>Invoice Payment Status</label>
                                <input value={data.paymentStatus || ""} disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100" />
                            </div>

                            {/* 🟢 HR2 EDIT */}
                            <div>
                                <label>Last Salary Disbursement - Date</label>
                                <input
                                    type="date"
                                    value={data.salaryDate || ""}
                                    onChange={(e) =>
                                        setData({ ...data, salaryDate: e.target.value })
                                    }
                                    className="w-full border rounded-xl px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Salary Disbursement - INR Amount</label>
                                <input
                                    value={data.salaryAmount || ""}
                                    onChange={(e) =>
                                        setData({ ...data, salaryAmount: e.target.value })
                                    }
                                    className="w-full border rounded-xl px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Salary Disbursement - For Month of</label>
                                <select
                                    value={data.salaryMonth || ""}
                                    onChange={(e) =>
                                        setData({ ...data, salaryMonth: e.target.value })
                                    }
                                    className="w-full border rounded-xl px-3 py-2"
                                >
                                    <option value="">Select Month</option>
                                    {months.map((m: string) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </>
                )}

                {/* SAVE BUTTON */}
                {(
                    (user?.role === "account1" && data.currentStage === "account1") ||
                    (user?.role === "level2" && data.currentStage === "level2")
                ) && (
                        <button
                            onClick={handleUpdate}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>
                    )}
            </div>
        </div>
    )
}