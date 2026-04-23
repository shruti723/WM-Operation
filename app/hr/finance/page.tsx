"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

type FinanceFormType = {
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

const initialForm: FinanceFormType = {
    siteName: "",
    incharge: "",
    startDate: "",
    lastRenewalDate: "",
    nextRenewalDate: "",
    monthlyBilling: "",
    invoiceDate: "",
    invoiceAmount: "",
    invoiceMonth: "",
    paymentStatus: "",
    salaryDate: "",
    salaryAmount: "",
    salaryMonth: ""
}

export default function FinancePage() {
    const [siteList, setSiteList] = useState<string[]>([])
    const [form, setForm] = useState<FinanceFormType>(initialForm)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)
    const [loading, setLoading] = useState(false)

    const role = String(user?.role || "").toLowerCase()

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setUserLoaded(true)
    }, [])

    useEffect(() => {
        async function loadSites() {
            try {
                const res = await fetch("/api/hr/manpower/sites", {
                    cache: "no-store",
                })
                const data = await res.json()
                setSiteList(data.sites || [])
            } catch (err) {
                console.error("Failed to load sites:", err)
            }
        }

        loadSites()
    }, [])

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    function handleNumberChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const { name, value } = e.target

        if (/^\d*$/.test(value)) {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }))
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!user) {
            alert("User not loaded")
            return
        }

        if (!form.siteName) {
            alert("Please select site")
            return
        }

        if (role === "level1") {
            // if (!form.incharge || !form.startDate) {
            //     alert("Please fill HR1 required fields")
            //     return
            // }

            if (form.monthlyBilling && !/^\d+$/.test(form.monthlyBilling)) {
                alert("Monthly Billing must be number only")
                return
            }
        }

        if (role === "account1") {
            if (!form.invoiceDate || !form.invoiceAmount || !form.invoiceMonth || !form.paymentStatus) {
                alert("Please fill A1 required invoice fields")
                return
            }

            if (form.invoiceAmount && !/^\d+$/.test(form.invoiceAmount)) {
                alert("Invoice Amount must be number only")
                return
            }
        }

        if (role === "level2") {
            if (!form.salaryDate || !form.salaryAmount || !form.salaryMonth) {
                alert("Please fill HR2 required salary fields")
                return
            }

            if (form.salaryAmount && !/^\d+$/.test(form.salaryAmount)) {
                alert("Salary Amount must be number only")
                return
            }
        }

        const data = {
            updatedOn: new Date().toISOString(),
            ...form,
            role,
        }

        try {
            setLoading(true)

            const res = await fetch("/api/hr/finance", {

                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.message || "Error submitting data ❌")
                return
            }

            alert(result.message || "Data submitted successfully ✅")
            setForm(initialForm)
        } catch (error) {
            console.error(error)
            alert("Error submitting data ❌")
        } finally {
            setLoading(false)
        }
    }

    if (!userLoaded) return null

    const canEdit =
        role === "level1" ||
        role === "account1" ||
        role === "level2"

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">Finance Details</h1>

            <p className="text-gray-500 mb-6">
                Submit financial details for a site.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {role === "level1" && (
                        <>
                            <div>
                                <label>Site Name</label>
                                <input
                                    name="siteName"
                                    value={form.siteName}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Incharge</label>
                                <input
                                    name="incharge"
                                    value={form.incharge}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Renewal Date</label>
                                <input
                                    type="date"
                                    name="lastRenewalDate"
                                    value={form.lastRenewalDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Next Renewal Due On</label>
                                <input
                                    type="date"
                                    name="nextRenewalDate"
                                    value={form.nextRenewalDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>


                        </>
                    )}
                    {role === "account1" && (
                        <>
                            <div>
                                <label>Monthly Billing</label>
                                <input
                                    type="text"
                                    name="monthlyBilling"
                                    value={form.monthlyBilling}
                                    onChange={handleNumberChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label>Last Invoice Raise - On Date</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    value={form.invoiceDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Invoice Raise - Amount</label>
                                <input
                                    type="text"
                                    name="invoiceAmount"
                                    value={form.invoiceAmount}
                                    onChange={handleNumberChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Invoice Raise - For Month</label>
                                <select
                                    name="invoiceMonth"
                                    value={form.invoiceMonth}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Select Month</option>
                                    {months.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Invoice Payment Status</label>
                                <select
                                    name="paymentStatus"
                                    value={form.paymentStatus}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Select</option>
                                    <option value="Payment Received">Payment Received</option>
                                    <option value="Payment Pending">Payment Pending</option>
                                </select>
                            </div>
                        </>
                    )}
                    {role === "level2" && (
                        <>
                            <div>
                                <label>Last Salary Disbursement - On Date</label>
                                <input
                                    type="date"
                                    name="salaryDate"
                                    value={form.salaryDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Salary Disbursement - Amount</label>
                                <input
                                    type="text"
                                    name="salaryAmount"
                                    value={form.salaryAmount}
                                    onChange={handleNumberChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label>Last Salary Disbursement - Month</label>
                                <select
                                    name="salaryMonth"
                                    value={form.salaryMonth}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Select Month</option>
                                    {months.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}


                    <Button
                        type="submit"
                        disabled={loading || !canEdit}
                        className="w-full h-11 text-lg rounded-lg"
                    >
                        {loading ? "Submitting..." : "Submit Report"}
                    </Button>
                </form>
            </div >
        </div >
    )
}