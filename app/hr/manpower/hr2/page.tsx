"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

/* TYPES */
type ManpowerItem = {
    designation: string
    authorised: number
    deployed?: number
    shortage?: number
}

type FormType = {
    siteName: string
    manpowerList: ManpowerItem[]
}

export default function HR2ManpowerPage() {
    const [form, setForm] = useState<FormType>({
        siteName: "",
        manpowerList: [],
    })

    const [siteList, setSiteList] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)

    const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser))
        setUserLoaded(true)
    }, [])

    /* LOAD SITES */
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

    /* FETCH SITE DATA */
    async function fetchSiteData(siteName: string) {
        if (!siteName) {
            setForm({
                siteName: "",
                manpowerList: [],
            })
            return
        }

        const res = await fetch(
            `/api/hr/manpower?siteName=${encodeURIComponent(siteName)}`,
            {
                cache: "no-store",
            }
        )

        const data = await res.json()

        if (data.success) {
            setForm({
                siteName,
                manpowerList: (data.manpowerList || []).map((item: any) => ({
                    designation: item.designation,
                    authorised: Number(item.authorised || 0),
                    deployed: 0,
                    shortage: Number(item.authorised || 0),
                })),
            })
        }
    }

    /* SUBMIT */
    async function handleSubmit(e: any) {
        e.preventDefault()

        try {
            setLoading(true)

            const res = await fetch("/api/hr/manpower", {
                cache: "no-store",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    role: user?.role,
                }),
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
            <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 border">

                <h1 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 border-b pb-2">
                    ➡ Manpower Details
                </h1>

                <p className="text-sm text-gray-500 mb-5">
                    Update manpower deployment for selected site.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SITE DROPDOWN */}
                    {/* SITE DROPDOWN */}
                    <div className="w-full relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Name
                        </label>

                        <button
                            type="button"
                            onClick={() => setSiteDropdownOpen((prev) => !prev)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white text-left text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between gap-3"
                        >
                            <span className="truncate">
                                {form.siteName || "Select Site"}
                            </span>

                            <span className="text-gray-500 shrink-0">
                                ▼
                            </span>
                        </button>

                        {siteDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({
                                            siteName: "",
                                            manpowerList: [],
                                        })
                                        setSiteDropdownOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b"
                                >
                                    Select Site
                                </button>

                                {siteList.map((site) => (
                                    <button
                                        key={site}
                                        type="button"
                                        onClick={() => {
                                            setForm({
                                                ...form,
                                                siteName: site,
                                                manpowerList: [],
                                            })

                                            fetchSiteData(site)
                                            setSiteDropdownOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 break-words ${form.siteName === site
                                            ? "bg-blue-600 text-white hover:bg-blue-600"
                                            : "text-gray-800"
                                            }`}
                                    >
                                        {site}
                                    </button>
                                ))}
                            </div>
                        )}

                        {form.siteName && (
                            <p className="mt-1 text-xs text-gray-400 break-words">
                                Selected: {form.siteName}
                            </p>
                        )}
                    </div>

                    {/* TABLE */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">
                            Deployment Details
                        </h2>

                        <div className="overflow-x-auto rounded-xl border">
                            <div className="min-w-[650px]">

                                {/* HEADER */}
                                <div className="grid grid-cols-12 bg-gray-50 text-sm font-semibold text-gray-500 border-b">
                                    <div className="col-span-4 px-4 py-3">
                                        Designation
                                    </div>
                                    <div className="col-span-2 px-4 py-3 text-center">
                                        Auth
                                    </div>
                                    <div className="col-span-3 px-4 py-3 text-center">
                                        Deployed
                                    </div>
                                    <div className="col-span-3 px-4 py-3 text-center">
                                        Shortage
                                    </div>
                                </div>

                                {/* ROWS */}
                                {form.manpowerList.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                                        Select a site to view manpower details.
                                    </div>
                                ) : (
                                    form.manpowerList.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 gap-2 items-center border-b last:border-b-0 px-4 py-3"
                                        >
                                            <div className="col-span-4 text-sm font-medium text-gray-700 break-words">
                                                {item.designation}
                                            </div>

                                            <div className="col-span-2 text-center text-sm font-semibold text-gray-700">
                                                {item.authorised}
                                            </div>

                                            <input
                                                type="number"
                                                min={0}
                                                value={item.deployed ?? ""}
                                                onChange={(e) => {
                                                    const updated = [...form.manpowerList]
                                                    const val = Math.max(0, Number(e.target.value))

                                                    updated[index].deployed = val
                                                    updated[index].shortage =
                                                        Number(item.authorised || 0) - val

                                                    setForm({
                                                        ...form,
                                                        manpowerList: updated,
                                                    })
                                                }}
                                                className="col-span-3 border border-gray-300 rounded-xl px-3 py-2 text-center outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                            <div
                                                className={`col-span-3 text-center text-sm font-semibold ${(item.shortage || 0) > 0
                                                    ? "text-red-500"
                                                    : "text-green-600"
                                                    }`}
                                            >
                                                {item.shortage || 0}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !form.siteName || form.manpowerList.length === 0}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Submit"}
                    </Button>
                </form>
            </div>
        </div>

    )
}