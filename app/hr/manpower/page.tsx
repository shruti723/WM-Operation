"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"



/* ✅ TYPES */
type ManpowerItem = {
    designation: string
    authorised: number
    deployed?: number
    shortage?: number
}

type FormType = {
    siteName: string
    startDate: string
    lastRenewalDate: string
    nextRenewalDate: string
    manpowerList: ManpowerItem[]
    recruitmentProcess: string
    responsible: string
    cutoffDate: string
    total: number
    remarks: string
}

export default function ManpowerPage() {

    const [form, setForm] = useState<FormType>({
        siteName: "",
        startDate: "",
        lastRenewalDate: "",
        nextRenewalDate: "",
        manpowerList: [{ designation: "", authorised: 0 }],
        recruitmentProcess: "",
        responsible: "",
        cutoffDate: "",
        total: 0,
        remarks: ""
    })
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    /* ✅ LOAD USER */

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
    }, [])
    const [siteList, setSiteList] = useState<string[]>([])
    useEffect(() => {

        async function loadSites() {
            try {
                const res = await fetch("https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec?type=manpowerSites")
                const data = await res.json()

                console.log("SITE LIST API:", data)

                // 🔥 HANDLE ALL CASES

                console.log("API RESPONSE:", data)

                // ✅ DIRECT FIX
                setSiteList(data.sites || [])

            } catch (err) {
                console.error(err)
            }
        }

        loadSites() // ✅ load for ALL roles
    }, [user])
    /* ✅ AUTO TOTAL */
    useEffect(() => {
        if (user?.role === "level2") {
            const total = form.manpowerList.reduce(
                (sum, item) => sum + (item.shortage || 0),
                0
            )

            setForm(prev => ({ ...prev, total }))
        }
    }, [form.manpowerList, user])

    useEffect(() => {
        console.log("🔥 USER:", user)
        console.log("🔥 SITE LIST:", siteList)
        console.log("🔥 FORM:", form)
    }, [user, siteList, form])

    /* ✅ NORMAL CHANGE */
    function handleChange(e: any) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    /* ✅ MANPOWER CHANGE */
    function handleManpowerChange(
        index: number,
        field: keyof ManpowerItem,
        value: any
    ) {
        const updated = [...form.manpowerList]

        if (field === "authorised") {
            updated[index].authorised = Math.max(1, Number(value)) // ✅ NEVER NEGATIVE
        } else if (field === "designation") {
            updated[index].designation = value
        }

        setForm({ ...form, manpowerList: updated })
    }

    /* ✅ ADD ROW */
    function addRow() {
        setForm({
            ...form,
            manpowerList: [
                ...form.manpowerList,
                { designation: "", authorised: 0 }
            ]
        })
    }

    /* ✅ REMOVE ROW */
    function removeRow(index: number) {
        if (form.manpowerList.length === 1) return
        const updated = form.manpowerList.filter((_, i) => i !== index)
        setForm({ ...form, manpowerList: updated })
    }

    /* ✅ FETCH DATA */
    async function fetchSiteData(siteName: string) {
        try {
            const res = await fetch(
                `https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec?type=manpower&siteName=${siteName}&role=${user?.role}`
            )

            const data = await res.json()


            if (data) {
                setForm(prev => ({
                    ...prev,
                    ...data,
                    manpowerList: data.manpowerList
                        ? (typeof data.manpowerList === "string"
                            ? JSON.parse(data.manpowerList)
                            : data.manpowerList)
                        : prev.manpowerList
                }))
            }

        } catch (err) {
            console.error(err)
        }
    }

    /* ✅ ROLE CONTROL */
    function isVisible(field: string) {
        if (!user) return false

        if (user.role === "level1") {
            return ["siteName", "startDate", "lastRenewalDate", "nextRenewalDate"].includes(field)
        }

        if (user.role === "level2") {
            return ["deployed", "shortage", "needed"].includes(field)
        }

        if (user.role === "level3") {
            return ["recruitmentProcess", "responsible", "cutoffDate", "total", "remarks"].includes(field)
        }

        return false
    }

    /* ✅ SUBMIT */
    async function handleSubmit(e: any) {
        e.preventDefault()

        if (!user) {
            alert("User not loaded")
            return
        }

        if (user?.role === "level1") {
            const invalid = form.manpowerList.some(
                item => !item.designation || item.authorised <= 0
            )

            if (!form.siteName || !form.startDate) {
                alert("Fill basic details")
                return
            }

            if (invalid) {
                alert("Fill all designation rows")
                return
            }
        }
        if (user?.role === "level1") {
            const exists = siteList.some(
                site => site.toLowerCase().trim() === form.siteName.toLowerCase().trim()
            )

            if (exists) {
                alert("Site already exists ❌")
                return
            }
        }

        try {
            setLoading(true) // 🔥 START LOADING

            const res = await fetch("https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec", {
                method: "POST",
                body: JSON.stringify({
                    type: "manpower",
                    ...form,
                    role: user?.role
                })
            })

            const result = await res.json()

            if (result.error) {
                alert(result.error)
            } else {
                alert("✅ You have successfully submitted the form")

                setForm({
                    siteName: "",
                    startDate: "",
                    lastRenewalDate: "",
                    nextRenewalDate: "",
                    manpowerList: [{ designation: "", authorised: 0 }],
                    recruitmentProcess: "",
                    responsible: "",
                    cutoffDate: "",
                    total: 0,
                    remarks: ""
                })
            }

        } catch (err) {
            alert("Error ❌")
        } finally {
            setLoading(false) // 🔥 STOP LOADING
        }
    }

    return (

        <div className="max-w-3xl mx-auto">

            <h1 className="text-2xl font-semibold mb-1">Manpower Details</h1>
            <p className="text-gray-500 mb-6">
                Submit manpower details for a site.
            </p>
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 🔹 GRID LIKE FINANCE FORM */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* SITE NAME → TEXT FIELD ✅ */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Site Name</label>

                            {user?.role === "level1" ? (

                                // ✅ Vikash → TEXT INPUT
                                <input
                                    name="siteName"
                                    value={form.siteName}
                                    onChange={handleChange}
                                    placeholder="Enter site name"
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />

                            ) : (

                                // ✅ Anjali + Atul → DROPDOWN
                                <select
                                    name="siteName"
                                    value={form.siteName}
                                    onChange={(e) => {
                                        handleChange(e)
                                        fetchSiteData(e.target.value) // 🔥 auto fill
                                    }}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                >
                                    <option value="">Select Site</option>

                                    {Array.isArray(siteList) && siteList.map(site => (
                                        <option key={site} value={site}>
                                            {site}
                                        </option>
                                    ))}

                                </select>

                            )}
                        </div>

                        {isVisible("startDate") && (
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <input type="date" name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1" />
                            </div>
                        )}

                        {isVisible("lastRenewalDate") && (
                            <div>
                                <label className="text-sm font-medium">Last Renewal Date</label>
                                <input type="date" name="lastRenewalDate"
                                    value={form.lastRenewalDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1" />
                            </div>
                        )}

                        {isVisible("nextRenewalDate") && (
                            <div>
                                <label className="text-sm font-medium">Next Renewal Due</label>
                                <input type="date" name="nextRenewalDate"
                                    value={form.nextRenewalDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1" />
                            </div>
                        )}
                    </div>

                    {/* 🔥 LEVEL 1 TABLE */}
                    {user?.role === "level1" && (
                        <div>
                            <label className="font-medium mb-3 block">
                                Manpower Details
                            </label>

                            {/* HEADER */}
                            <div className="grid grid-cols-12 text-sm font-semibold mb-2 text-gray-600">
                                <div className="col-span-6">Designation</div>
                                <div className="col-span-4 text-center">Authorised</div>
                                <div className="col-span-2"></div>
                            </div>

                            {form.manpowerList.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2">

                                    <input
                                        placeholder="Designation"
                                        value={item.designation}
                                        onChange={(e) =>
                                            handleManpowerChange(index, "designation", e.target.value)
                                        }
                                        className="col-span-6 border rounded-lg px-3 py-2"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        value={item.authorised}
                                        onChange={(e) =>
                                            handleManpowerChange(index, "authorised", e.target.value)
                                        }
                                        className="col-span-4 border rounded-lg px-3 py-2"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="col-span-2 text-red-500 font-semibold0"
                                    >
                                        ❌
                                    </button>

                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addRow}
                                className="mt-2 text-blue-600 font-medium"
                            >
                                ➕ Add Row
                            </button>
                        </div>
                    )}

                    {/* 🔥 LEVEL 2 TABLE */}
                    {user?.role === "level2" && (
                        <div>
                            <label className="font-medium mb-3 block">
                                Manpower Deployment
                            </label>

                            <div className="grid grid-cols-12 text-sm font-semibold mb-2 text-gray-600">
                                <div className="col-span-4">Designation</div>
                                <div className="col-span-2 text-center">Auth</div>
                                <div className="col-span-3 text-center">Deployed</div>
                                <div className="col-span-3 text-center">Shortage</div>
                            </div>

                            {form.manpowerList.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">

                                    <div className="col-span-4 font-medium text-gray-700">
                                        {item.designation}
                                    </div>

                                    <div className="col-span-2 text-center text-gray-600">
                                        {item.authorised}
                                    </div>

                                    <input
                                        type="number"
                                        value={item.deployed || ""}
                                        onChange={(e) => {
                                            const updated = [...form.manpowerList]

                                            updated[index].deployed = Number(e.target.value)

                                            updated[index].shortage = Math.max(
                                                item.authorised - Number(e.target.value || 0),
                                                0
                                            )

                                            setForm({ ...form, manpowerList: updated })
                                        }}
                                        className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div className="col-span-3 text-center text-red-500 font-semibold font-medium">
                                        {item.shortage || 0}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔥 LEVEL 3 */}
                    {user?.role === "level3" && (
                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <label>Recruitment Process</label>
                                <select
                                    name="recruitmentProcess"
                                    value={form.recruitmentProcess}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                >
                                    <option value="">Select</option>
                                    <option>Ongoing</option>
                                    <option>Completed</option>
                                    <option>Not Started</option>
                                </select>
                            </div>

                            <div>
                                <label>Responsible</label>
                                <input
                                    name="responsible"
                                    value={form.responsible}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <label>Cutoff Date</label>
                                <input
                                    type="date"
                                    name="cutoffDate"
                                    value={form.cutoffDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <label>Total Shortage</label>
                                <input
                                    value={form.total}
                                    readOnly
                                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100"
                                />
                            </div>

                            <div className="col-span-2">
                                <label>Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                        </div>
                    )}

                    {/* BUTTON */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
                    >
                        {loading ? "Submitting..." : "Submit Report"}
                    </Button>

                </form>
            </div >
        </div >
    )
}