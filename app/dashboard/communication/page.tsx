"use client"
import { useEffect, useState } from "react"

export default function CommunicationPage() {

    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch("/api/dashboard")
            .then(res => res.json())
            .then(res => setData(res.allData))
    }, [])

    let total = 0, replied = 0

    data.forEach((d) => {
        total += Number(d.emails_received || 0)
        replied += Number(d.emails_replied || 0)
    })

    const rate = total ? Math.round((replied / total) * 100) : 0

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Communication</h1>

            <div className="text-xl">Reply Rate: {rate}%</div>
        </div>
    )
}