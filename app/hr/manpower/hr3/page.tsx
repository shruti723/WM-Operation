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
    recruitmentProcess?: string
    responsible?: string
    cutoffDate?: string
    remarks?: string
}

type FormType = {
    siteName: string
    manpowerList: ManpowerItem[]
}

export default function HR3ManpowerPage() {
    const [form, setForm] = useState<FormType>({
        siteName: "",
        manpowerList: [],
    })

    const [siteList, setSiteList] = useState<string[]>([])
    const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)

    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userLoaded, setUserLoaded] = useState(false)

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

    /* FETCH HR2 DATA */
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
                    deployed: Number(item.deployed || 0),
                    shortage:
                        item.shortage !== undefined && item.shortage !== null
                            ? Number(item.shortage || 0)
                            : Number(item.authorised || 0) - Number(item.deployed || 0),

                    // HR3 editable fields
                    needed: Number(item.needed || 0),
                    recruitmentProcess: item.recruitmentProcess || "",
                    responsible: item.responsible || "",
                    cutoffDate: item.cutoffDate || "",
                    remarks: item.remarks || "",
                })),
            })
        }
    }

    const totalAuthorised = form.manpowerList.reduce(
        (sum, item) => sum + Number(item.authorised || 0),
        0
    )

    const totalDeployed = form.manpowerList.reduce(
        (sum, item) => sum + Number(item.deployed || 0),
        0
    )

    const totalShortage = form.manpowerList.reduce(
        (sum, item) => sum + Number(item.shortage || 0),
        0
    )

    const totalNeeded = form.manpowerList.reduce(
        (sum, item) => sum + Number(item.needed || 0),
        0
    )

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

                    // If your backend expects "level3", keep this fallback.
                    // If session role is already "level3", it will remain same.
                    role:
                        user?.role === "wmlevel3" || user?.role === "fmlevel3"
                            ? "level3"
                            : user?.role || "level3",
                }),
            })

            const result = await res.json()
            alert(result.message || "Saved")
        } catch {
            alert("Error ❌")
        } finally {
            setLoading(false)
        }
    }

    if (!userLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 text-gray-500">
                Loading user...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-6">
            <div className="w-full max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                HR3 Recruitment Dashboard
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Update needed manpower and recruitment progress based on HR2 deployment data.
                            </p>
                        </div>

                        <div className="text-xs sm:text-sm bg-purple-50 text-purple-700 border border-purple-100 px-4 py-2 rounded-xl">
                            HR3 can update Needed, Process, Responsible, Cutoff Date and Remarks.
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SITE SELECT CARD */}
                    <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                        <div className="w-full relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site Name
                            </label>

                            <button
                                type="button"
                                onClick={() => setSiteDropdownOpen((prev) => !prev)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white text-left text-sm sm:text-base outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between gap-3"
                            >
                                <span className="truncate">
                                    {form.siteName || "Select Site"}
                                </span>

                                <span className="text-gray-500 shrink-0">
                                    ▼
                                </span>
                            </button>

                            {siteDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm({
                                                siteName: "",
                                                manpowerList: [],
                                            })
                                            setSiteDropdownOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 border-b"
                                    >
                                        Select Site
                                    </button>

                                    {siteList.map((site) => (
                                        <button
                                            key={site}
                                            type="button"
                                            onClick={() => {
                                                setForm({
                                                    siteName: site,
                                                    manpowerList: [],
                                                })

                                                fetchSiteData(site)
                                                setSiteDropdownOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 break-words ${form.siteName === site
                                                    ? "bg-purple-600 text-white hover:bg-purple-600"
                                                    : "text-gray-800"
                                                }`}
                                        >
                                            {site}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {form.siteName && (
                                <p className="mt-2 text-xs text-gray-400 break-words">
                                    Selected: {form.siteName}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border shadow-sm p-5">
                            <p className="text-sm text-gray-500">Total Authorised</p>
                            <h2 className="text-2xl font-bold text-gray-900 mt-1">
                                {totalAuthorised}
                            </h2>
                        </div>

                        <div className="bg-white rounded-2xl border shadow-sm p-5">
                            <p className="text-sm text-gray-500">Total Deployed</p>
                            <h2 className="text-2xl font-bold text-green-600 mt-1">
                                {totalDeployed}
                            </h2>
                        </div>

                        <div className="bg-white rounded-2xl border shadow-sm p-5">
                            <p className="text-sm text-gray-500">Total Shortage</p>
                            <h2 className="text-2xl font-bold text-red-500 mt-1">
                                {totalShortage}
                            </h2>
                        </div>

                        <div className="bg-white rounded-2xl border shadow-sm p-5">
                            <p className="text-sm text-gray-500">Total Needed by HR3</p>
                            <h2 className="text-2xl font-bold text-purple-600 mt-1">
                                {totalNeeded}
                            </h2>
                        </div>
                    </div>

                    {/* MANPOWER TABLE */}
                    <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Recruitment Details
                            </h2>
                            <p className="text-sm text-gray-500">
                                Enter needed manpower and recruitment status for each designation.
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full min-w-[1100px] text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Designation</th>
                                        <th className="px-4 py-3 text-center">Auth</th>
                                        <th className="px-4 py-3 text-center">Deployed</th>
                                        <th className="px-4 py-3 text-center">Shortage</th>
                                        <th className="px-4 py-3 text-center">Needed</th>
                                        <th className="px-4 py-3 text-left">Process</th>
                                        <th className="px-4 py-3 text-left">Responsible</th>
                                        <th className="px-4 py-3 text-left">Cutoff</th>
                                        <th className="px-4 py-3 text-left">Remarks</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {form.manpowerList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                Select a site to view HR2 deployment data.
                                            </td>
                                        </tr>
                                    ) : (
                                        form.manpowerList.map((item, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {item.designation}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {item.authorised}
                                                </td>

                                                <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                                    {item.deployed || 0}
                                                </td>

                                                <td
                                                    className={`px-4 py-3 text-center font-semibold ${(item.shortage || 0) > 0
                                                            ? "text-red-500"
                                                            : "text-green-600"
                                                        }`}
                                                >
                                                    {item.shortage || 0}
                                                </td>

                                                {/* HR3 EDITABLE NEEDED */}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={item.needed ?? ""}
                                                        onChange={(e) => {
                                                            const updated = [...form.manpowerList]
                                                            updated[index].needed = Math.max(
                                                                0,
                                                                Number(e.target.value)
                                                            )

                                                            setForm({
                                                                ...form,
                                                                manpowerList: updated,
                                                            })
                                                        }}
                                                        className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-center outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <select
                                                        value={item.recruitmentProcess || ""}
                                                        onChange={(e) => {
                                                            const updated = [...form.manpowerList]
                                                            updated[index].recruitmentProcess =
                                                                e.target.value

                                                            setForm({
                                                                ...form,
                                                                manpowerList: updated,
                                                            })
                                                        }}
                                                        className="w-36 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Not Started">
                                                            Not Started
                                                        </option>
                                                        <option value="Ongoing">
                                                            Ongoing
                                                        </option>
                                                        <option value="Completed">
                                                            Completed
                                                        </option>
                                                        <option value="On Hold">
                                                            On Hold
                                                        </option>
                                                    </select>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <input
                                                        value={item.responsible || ""}
                                                        onChange={(e) => {
                                                            const updated = [...form.manpowerList]
                                                            updated[index].responsible =
                                                                e.target.value

                                                            setForm({
                                                                ...form,
                                                                manpowerList: updated,
                                                            })
                                                        }}
                                                        placeholder="Name"
                                                        className="w-40 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={item.cutoffDate || ""}
                                                        onChange={(e) => {
                                                            const updated = [...form.manpowerList]
                                                            updated[index].cutoffDate =
                                                                e.target.value

                                                            setForm({
                                                                ...form,
                                                                manpowerList: updated,
                                                            })
                                                        }}
                                                        className="w-40 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <input
                                                        value={item.remarks || ""}
                                                        onChange={(e) => {
                                                            const updated = [...form.manpowerList]
                                                            updated[index].remarks =
                                                                e.target.value

                                                            setForm({
                                                                ...form,
                                                                manpowerList: updated,
                                                            })
                                                        }}
                                                        placeholder="Remarks"
                                                        className="w-56 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ACTION */}
                    <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                        <Button
                            type="submit"
                            disabled={loading || !form.siteName || form.manpowerList.length === 0}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 disabled:opacity-60"
                        >
                            {loading ? "Saving..." : "Submit HR3 Recruitment Update"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}