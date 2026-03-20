"use client"
import { calculateScore } from "@/lib/dashboardHelpers"
import { useEffect, useState } from "react"


export default function SitePage() {

    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch("/api/dashboard")
            .then(res => res.json())
            .then(res => setData(res.allData))
    }, [])

    const siteMap: any = {}

    data.forEach((d) => {
        if (!d.site_name) return

        if (!siteMap[d.site_name]) siteMap[d.site_name] = []
        siteMap[d.site_name].push(calculateScore(d))
    })

    const siteData = Object.keys(siteMap).map((s) => ({
        site: s,
        score:
            Math.round(
                siteMap[s].reduce((a: any, b: any) => a + b, 0) /
                siteMap[s].length
            )
    }))

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Site Analytics</h1>

            {siteData.map((s) => (
                <div key={s.site} className="p-3 border mb-2">
                    {s.site} → {s.score}%
                </div>
            ))}
        </div>
    )
}