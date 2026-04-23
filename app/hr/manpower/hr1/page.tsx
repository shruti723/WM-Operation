"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

/* TYPES */
type ManpowerItem = {
    designation: string
    authorised: number
}

type FormType = {
    siteName: string
    startDate: string
    lastRenewalDate: string
    nextRenewalDate: string
    manpowerList: ManpowerItem[]
}

export default function HR1ManpowerPage() {

    const [form, setForm] = useState<FormType>({
        siteName: "",
        startDate: "",
        lastRenewalDate: "",
        nextRenewalDate: "",
        manpowerList: [{ designation: "", authorised: 0 }]
    })

    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
        setUserLoaded(true)
    }, [])

    function handleChange(e: any) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleManpowerChange(index: number, field: keyof ManpowerItem, value: any) {
        const updated = [...form.manpowerList]

        if (field === "authorised") {
            updated[index].authorised = Math.max(0, Number(value))
        } else {
            updated[index].designation = value
        }

        setForm({ ...form, manpowerList: updated })
    }

    function addRow() {
        setForm({
            ...form,
            manpowerList: [...form.manpowerList, { designation: "", authorised: 0 }]
        })
    }

    function removeRow(index: number) {
        if (form.manpowerList.length === 1) return
        const updated = form.manpowerList.filter((_, i) => i !== index)
        setForm({ ...form, manpowerList: updated })
    }

    async function handleSubmit(e: any) {
        e.preventDefault()

        try {
            setLoading(true)

            const res = await fetch("/api/hr/manpower", {

                cache: "no-store",

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    role: user?.role
                })
            })

            const result = await res.json()

            alert(result.message || "Saved")

        } catch (err) {
            alert("Error ❌")
        } finally {
            setLoading(false)
        }
    }

    if (!userLoaded) return null

    return (
        <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-white shadow-lg rounded-2xl p-6 border">

                <h1 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
                    ➡ Manpower Details
                </h1>
                <p className="text-sm text-gray-500 mb-4">
                    Submit manpower details for a site.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SITE NAME */}
                    <div>
                        <label>Site Name</label>
                        <input
                            name="siteName"
                            value={form.siteName}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* DATES */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-gray-600">Start Date</label>
                            <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Last Renewal Date</label>
                            <input type="date" name="lastRenewalDate" value={form.lastRenewalDate} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Next Renewal Due</label>
                            <input type="date" name="nextRenewalDate" value={form.nextRenewalDate} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1" />
                        </div>
                    </div>


                    {/* TABLE */}
                    <div>
                        <label className="font-medium">Manpower Details</label>
                        <div className="grid grid-cols-12 text-sm font-semibold text-gray-500 mt-4 mb-2">
                            <div className="col-span-6">Designation</div>
                            <div className="col-span-4 text-center">Authorised</div>
                            <div className="col-span-2"></div>
                        </div>

                        {form.manpowerList.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">

                                <input
                                    placeholder="Designation"
                                    value={item.designation}
                                    onChange={(e) => handleManpowerChange(index, "designation", e.target.value)}
                                    className="col-span-6 border border-gray-300 rounded-xl px-3 py-2"
                                />

                                <input
                                    type="number"
                                    value={item.authorised}
                                    onChange={(e) => handleManpowerChange(index, "authorised", e.target.value)}
                                    className="col-span-4 border border-gray-300 rounded-xl px-3 py-2 text-center"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="col-span-2 text-red-500 font-semibold"
                                >
                                    ❌
                                </button>

                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addRow}
                            className="mt-3 text-blue-600 font-medium"
                        >
                            ➕ Add Row
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2"
                    >
                        {loading ? "Saving..." : "Submit"}
                    </Button>

                </form>
            </div>
        </div>
    )
}