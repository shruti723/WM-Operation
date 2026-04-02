"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export default function FinancePage() {
    const [siteList, setSiteList] = useState<string[]>([])

    const [form, setForm] = useState({
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
    })

    useEffect(() => {
        async function loadSites() {
            try {
                const res = await fetch("/api/hr/manpower/sites")
                const data = await res.json()
                setSiteList(data.sites || [])
            } catch (err) {
                console.error("Failed to load sites:", err)
            }
        }

        loadSites()
    }, [])

    function handleChange(e: any) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    function handleNumberChange(e: any) {
        const { name, value } = e.target

        // integer only
        if (/^\d*$/.test(value)) {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }))
        }
    }

    async function handleSubmit(e: any) {
        e.preventDefault()

        if (!form.siteName) {
            alert("Please select site")
            return
        }

        if (form.monthlyBilling && !/^\d+$/.test(form.monthlyBilling)) {
            alert("Monthly Billing must be number only")
            return
        }

        if (form.invoiceAmount && !/^\d+$/.test(form.invoiceAmount)) {
            alert("Invoice Amount must be number only")
            return
        }

        if (form.salaryAmount && !/^\d+$/.test(form.salaryAmount)) {
            alert("Salary Amount must be number only")
            return
        }

        const data = {
            updatedOn: new Date().toISOString(),
            ...form
        }

        try {
            const res = await fetch("/api/hr/finance", {
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

            setForm({
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
            })
        } catch (error) {
            console.error(error)
            alert("Error submitting data ❌")
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">Finance Details</h1>
            <p className="text-gray-500 mb-6">
                Submit financial details for a site.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Site Name
                        </label>
                        <select
                            name="siteName"
                            value={form.siteName}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="">Select site</option>

                            {siteList.map((site) => (
                                <option key={site} value={site}>
                                    {site}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Incharge
                            </label>
                            <input
                                name="incharge"
                                value={form.incharge}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Renewal Date
                            </label>
                            <input
                                type="date"
                                name="lastRenewalDate"
                                value={form.lastRenewalDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Next Renewal Due
                            </label>
                            <input
                                type="date"
                                name="nextRenewalDate"
                                value={form.nextRenewalDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Monthly Billing (₹)
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="monthlyBilling"
                                value={form.monthlyBilling}
                                onChange={handleNumberChange}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Enter amount"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Invoice Raise Date
                            </label>
                            <input
                                type="date"
                                name="invoiceDate"
                                value={form.invoiceDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Invoice Raise Amount
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="invoiceAmount"
                                value={form.invoiceAmount}
                                onChange={handleNumberChange}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Enter amount"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Invoice Raise Month
                            </label>
                            <select
                                name="invoiceMonth"
                                value={form.invoiceMonth}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Month</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Invoice Payment Status
                            </label>
                            <select
                                name="paymentStatus"
                                value={form.paymentStatus}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select</option>
                                <option value="Paid">Paid</option>
                                <option value="Payment Pending">Payment Pending</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Salary Disbursement Date
                            </label>
                            <input
                                type="date"
                                name="salaryDate"
                                value={form.salaryDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Salary Disbursement Amount
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="salaryAmount"
                                value={form.salaryAmount}
                                onChange={handleNumberChange}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Enter amount"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Salary Disbursement Month
                            </label>
                            <select
                                name="salaryMonth"
                                value={form.salaryMonth}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Month</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-lg rounded-lg"
                    >
                        Submit Report
                    </Button>
                </form>
            </div>
        </div>
    )
}