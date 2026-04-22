"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

function formatDate(date: string) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatDateTime(date: string) {
    if (!date) return "-"

    const d = new Date(date)

    if (isNaN(d.getTime())) return date

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(d)
}

export default function SiteDetailsPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [isHR1, setIsHR1] = useState(false)

    useEffect(() => {
        const type = searchParams.get("type")

        if (type === "hr1") {
            setIsHR1(true)
        }

        async function load() {
            const submissionId = searchParams.get("submissionId")

            const res = await fetch(
                `/api/hr/admin-dashboard/site/${params.siteId}?submissionId=${submissionId || ""}`
            )
            const result = await res.json()
            setData(result)
        }

        load()
    }, [params.siteId, searchParams])

    if (!data) return <div className="p-6">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">

            {/* 🔙 BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* 🔹 HEADER */}
            <div>
                <h1 className="text-2xl font-bold">Site Details</h1>
            </div>

            {/* 🔹 SITE INFO */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">

                    <div>
                        <p className="text-gray-500">Site Name</p>
                        <p className="font-semibold text-gray-900">
                            {data.site.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500">Start Date</p>
                        <p>{formatDate(data.site.startDate)}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Last Renewal</p>
                        <p>{formatDate(data.site.lastRenewalDate)}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Next Renewal</p>
                        <p>{formatDate(data.site.nextRenewalDate)}</p>
                    </div>

                </div>

            </div>

            {/* 🔹 HR1 MANPOWER TABLE */}
            <div className="bg-white rounded-2xl border shadow-sm">

                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">
                        Manpower Details
                    </h3>

                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">

                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="p-3 text-left">Designation</th>
                                <th className="p-3 text-center">Authorised</th>

                                {!isHR1 && <th className="p-3 text-center">Deployed</th>}
                                {!isHR1 && <th className="p-3 text-center">Shortage</th>}
                                {!isHR1 && <th className="p-3 text-center">Needed</th>}
                                {!isHR1 && <th className="p-3 text-center">Process</th>}
                                {!isHR1 && <th className="p-3 text-center">Responsible</th>}
                                {!isHR1 && <th className="p-3 text-center">Cutoff</th>}
                                {!isHR1 && <th className="p-3 text-center">Remarks</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {data.designations?.map((d: any, i: number) => (
                                <tr key={i} className="border-t hover:bg-gray-50">

                                    <td className="p-3 font-medium">{d.designation}</td>

                                    <td className="p-3 text-center text-blue-600 font-semibold">
                                        {d.authorised}
                                    </td>

                                    {!isHR1 && (
                                        <>
                                            <td className="p-3 text-center text-green-600">
                                                {d.deployed ?? 0}
                                            </td>

                                            <td className={`p-3 text-center font-semibold ${(d.shortage ?? 0) > 0 ? "text-red-600" : "text-green-600"
                                                }`}>
                                                {d.shortage ?? 0}
                                            </td>

                                            <td className="p-3 text-center">
                                                {d.needed ?? 0}
                                            </td>

                                            <td className="p-3 text-center text-gray-600">
                                                {d.process || "-"}
                                            </td>

                                            <td className="p-3 text-center text-gray-600">
                                                {d.responsible || "-"}
                                            </td>

                                            <td className="p-3 text-center text-gray-600">
                                                {d.cutoff ? formatDate(d.cutoff) : "-"}
                                            </td>

                                            <td className="p-3 text-center text-gray-600">
                                                {d.remarks || "-"}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

            </div>
            {/* 🔹 WORKFLOW TIMELINE */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">

                <h3 className="font-semibold mb-4">Workflow Timeline</h3>

                {!data.timeline || data.timeline.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline available</p>
                ) : (
                    <div className="space-y-4">
                        {data.timeline.map((item: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start">

                                {/* DOT */}
                                <div className="w-3 h-3 mt-2 rounded-full bg-blue-600"></div>

                                {/* CONTENT */}
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {item.title}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {item.actor} • {formatDateTime(item.at)}
                                    </p>

                                    {item.note && (
                                        <p className="text-sm text-gray-700 mt-1">
                                            {item.note}
                                        </p>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}

            </div>

        </div>
    )
}