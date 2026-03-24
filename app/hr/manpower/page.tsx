"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { sites } from "@/lib/siteList"

export default function ManpowerPage() {

    const [form, setForm] = useState({
        siteName: "",

        startDate: "",
        lastRenewalDate: "",
        nextRenewalDate: "",

        designation: "",
        authorised: "",
        deployed: "",
        shortage: "",
        needed: "",

        recruitmentProcess: "",
        responsible: "",
        cutoffDate: "",

        total: "",
        remarks: ""
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

        console.log(data)
        alert("Manpower submitted ✅")
    }

    return (
        <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <h1 className="text-2xl font-bold">Manpower Details</h1>
            <p className="text-gray-500 mb-6">
                Submit manpower details for a site.
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

                        {/* DESIGNATION */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Designation
                            </label>
                            <input
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* AUTHORISED */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Manpower Authorised
                            </label>
                            <input
                                name="authorised"
                                value={form.authorised}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* DEPLOYED */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Manpower Deployed
                            </label>
                            <input
                                name="deployed"
                                value={form.deployed}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* SHORTAGE */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Shortage
                            </label>
                            <input
                                name="shortage"
                                value={form.shortage}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* NEEDED */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Manpower Needed
                            </label>
                            <input
                                name="needed"
                                value={form.needed}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* RECRUITMENT */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Recruitment Process
                            </label>
                            <select
                                name="recruitmentProcess"
                                value={form.recruitmentProcess}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Not Started">Not Started</option>
                            </select>
                        </div>

                        {/* RESPONSIBLE */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Person Responsible
                            </label>
                            <input
                                name="responsible"
                                value={form.responsible}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* CUTOFF DATE */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Cutoff Date
                            </label>
                            <input
                                type="date"
                                name="cutoffDate"
                                value={form.cutoffDate}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* TOTAL */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Total
                            </label>
                            <input
                                name="total"
                                value={form.total}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                    </div>

                    {/* REMARKS */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Remarks
                        </label>
                        <textarea
                            name="remarks"
                            value={form.remarks}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
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