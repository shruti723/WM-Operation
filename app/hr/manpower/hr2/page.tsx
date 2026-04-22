"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

/* TYPES */
type ManpowerItem = {
    designation: string
    authorised: number
    deployed?: number
    shortage?: number
    needed?: number
}

type FormType = {
    siteName: string
    manpowerList: ManpowerItem[]
}

export default function HR2ManpowerPage() {

    const [form, setForm] = useState<FormType>({
        siteName: "",
        manpowerList: []
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
            const res = await fetch("/api/hr/manpower/sites")
            const data = await res.json()
            setSiteList(data.sites || [])
        }
        loadSites()
    }, [])

    /* 🔥 FETCH SITE DATA */
    async function fetchSiteData(siteName: string) {
        const res = await fetch(`/api/hr/manpower?siteName=${siteName}`)
        const data = await res.json()

        if (data.success) {
            setForm({
                siteName,
                manpowerList: (data.manpowerList || []).map((item: any) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                    deployed: 0,          // 🔥 RESET
                    needed: 0,            // 🔥 RESET
                    shortage: item.authorised // 🔥 DEFAULT
                }))
            })
        }
    }

    /* 🔥 SUBMIT */
    async function handleSubmit(e: any) {
        e.preventDefault()

        try {
            setLoading(true)

            const res = await fetch("/api/hr/manpower", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    role: user?.role
                })
            })

            const result = await res.json()
            alert(result.message || "Saved")

            window.location.reload()

        } catch {
            alert("Error ❌")
        } finally {
            setLoading(false)
        }
    }

    if (!userLoaded) return null

    return (
        <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-white shadow-lg rounded-2xl p-6 border">

                <h1 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">
                    ➡ Manpower Details
                </h1>

                <p className="text-sm text-gray-500 mb-4">
                    Update manpower deployment for selected site.
                </p>

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
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Site</option>
                            {siteList.map(site => (
                                <option key={site}>{site}</option>
                            ))}
                        </select>
                    </div>

                    {/* 🔥 TABLE */}
                    <div>

                        <div className="grid grid-cols-12 text-sm font-semibold text-gray-500 mt-4 mb-2">
                            <div className="col-span-3">Designation</div>
                            <div className="col-span-2 text-center">Auth</div>
                            <div className="col-span-2 text-center">Deployed</div>
                            <div className="col-span-2 text-center">Shortage</div>
                            <div className="col-span-3 text-center">Needed</div>
                        </div>

                        {form.manpowerList.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">

                                <div className="col-span-3">{item.designation}</div>

                                <div className="col-span-2 text-center">{item.authorised}</div>

                                <input
                                    type="number"
                                    value={item.deployed ?? ""}
                                    onChange={(e) => {
                                        const updated = [...form.manpowerList]
                                        let val = Math.max(0, Number(e.target.value))

                                        updated[index].deployed = val
                                        updated[index].shortage = item.authorised - val

                                        setForm({ ...form, manpowerList: updated })
                                    }}
                                    className="col-span-2 border border-gray-300 rounded-xl px-3 py-2 text-center"
                                />

                                <div className={`col-span-2 text-center font-semibold ${(item.shortage || 0) > 0 ? "text-red-500" : "text-green-600"
                                    }`}>
                                    {item.shortage || 0}
                                </div>

                                <input
                                    type="number"
                                    value={item.needed ?? ""}
                                    onChange={(e) => {
                                        const updated = [...form.manpowerList]
                                        updated[index].needed = Math.max(0, Number(e.target.value))
                                        setForm({ ...form, manpowerList: updated })
                                    }}
                                    className="col-span-3 border px-2 py-1"
                                />

                            </div>
                        ))}

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