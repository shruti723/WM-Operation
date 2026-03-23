"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { sites } from "@/lib/siteList"

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export default function FinancePage() {

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

    function handleChange(e: any) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    async function handleSubmit(e: any) {
        e.preventDefault()

        const data = {
            updatedOn: new Date().toISOString(),
            ...form
        }

        try {
            await fetch("https://script.google.com/macros/s/AKfycbxiRXN-O1ECmw5Ru2UtVR9ZAlTfgx0rLGfXXPz8xDNDf9X01zvQmb7WaKLgpzO9a44K/exec", {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            alert("Data submitted successfully ✅")

        } catch (error) {
            console.error(error)
            alert("Error submitting data ❌")
        }
    }

    return (
        <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <h1 className="text-2xl font-bold">Finance Details</h1>
            <p className="text-gray-500 mb-6">
                Submit financial details for a site.
            </p>

            {/* CARD */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SITE */}
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

                            {sites.map((site) => (
                                <option key={site} value={site}>
                                    {site}
                                </option>
                            ))}

                        </select>
                    </div>

                    {/* GRID */}
                    <div className="grid md:grid-cols-2 gap-4">

                        {/* INCHARGE */}
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

                        {/* START DATE */}
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

                        {/* LAST RENEWAL */}
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

                        {/* NEXT RENEWAL */}
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

                        {/* BILLING */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Monthly Billing (₹)
                            </label>
                            <input
                                name="monthlyBilling"
                                value={form.monthlyBilling}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* INVOICE DATE */}
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

                        {/* INVOICE AMOUNT */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Invoice Raise Amount
                            </label>
                            <input
                                name="invoiceAmount"
                                value={form.invoiceAmount}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* INVOICE MONTH */}
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

                        {/* PAYMENT STATUS */}
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

                        {/* SALARY DATE */}
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

                        {/* SALARY AMOUNT */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Last Salary Disbursement Amount
                            </label>
                            <input
                                name="salaryAmount"
                                value={form.salaryAmount}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* SALARY MONTH */}
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