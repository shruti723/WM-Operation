"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

/* TYPES */
type ManpowerItem = {
    designation: string
    authorised: number
    shortage?: number
}

type FormType = {
    siteName: string
    manpowerList: ManpowerItem[]
    recruitmentProcess: string
    responsible: string
    cutoffDate: string
    total: number
    remarks: string
}

export default function HR3ManpowerPage() {

    const [form, setForm] = useState<FormType>({
        siteName: "",
        manpowerList: [],
        recruitmentProcess: "",
        responsible: "",
        cutoffDate: "",
        total: 0,
        remarks: ""
    })

    const [siteList, setSiteList] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
        setUserLoaded(true)
    }, [])

    /* 🔥 LOAD SITES */
    useEffect(() => {
        async function loadSites() {
            const res = await fetch("/api/hr/manpower/sites", {
                cache: "no-store",
            })
            const data = await res.json()
            setSiteList(data.sites || [])
        }
        loadSites()
    }, [])

    /* 🔥 FETCH DATA (HR2 DATA) */
    async function fetchSiteData(siteName: string) {
        const res = await fetch(`/api/hr/manpower?siteName=${siteName}`)
        const data = await res.json()

        if (data.success) {
            setForm({
                siteName,
                manpowerList: data.manpowerList || [],
                recruitmentProcess: data.recruitmentProcess || "",
                responsible: data.responsible || "",
                cutoffDate: data.cutoffDate || "",
                total: data.total || 0,
                remarks: data.remarks || ""
            })
        }
    }

    /* 🔥 AUTO TOTAL */
    useEffect(() => {
        const total = form.manpowerList.reduce(
            (sum, item) => sum + (item.shortage || 0),
            0
        )

        setForm(prev => ({ ...prev, total }))
    }, [form.manpowerList])

    /* 🔥 SUBMIT */
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

        } catch {
            alert("Error ❌")
        } finally {
            setLoading(false)
        }
    }

    if (!userLoaded) return null

    return (
        <div className="max-w-4xl mx-auto">

            <h1 className="text-2xl font-semibold mb-4">HR3 Recruitment</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 🔥 SITE DROPDOWN */}
                <div>
                    <label>Site Name</label>
                    <select
                        value={form.siteName}
                        onChange={(e) => {
                            const site = e.target.value
                            setForm({ ...form, siteName: site })
                            fetchSiteData(site)
                        }}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="">Select Site</option>
                        {siteList.map(site => (
                            <option key={site}>{site}</option>
                        ))}
                    </select>
                </div>

                {/* 🔥 FORM */}
                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <label>Recruitment Process</label>
                        <select
                            name="recruitmentProcess"
                            value={form.recruitmentProcess}
                            onChange={(e) => setForm({ ...form, recruitmentProcess: e.target.value })}
                            className="w-full border px-3 py-2"
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
                            value={form.responsible}
                            onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                            className="w-full border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label>Cutoff Date</label>
                        <input
                            type="date"
                            value={form.cutoffDate}
                            onChange={(e) => setForm({ ...form, cutoffDate: e.target.value })}
                            className="w-full border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label>Total Shortage</label>
                        <input
                            value={form.total}
                            readOnly
                            className="w-full border px-3 py-2 bg-gray-100"
                        />
                    </div>

                    <div className="col-span-2">
                        <label>Remarks</label>
                        <textarea
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            className="w-full border px-3 py-2"
                        />
                    </div>

                </div>

                <Button type="submit" className="w-full">
                    {loading ? "Saving..." : "Submit"}
                </Button>

            </form>
        </div>
    )
}