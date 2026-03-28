"use client"

export const dynamic = "force-dynamic" // ✅ ADD THIS LINE

import { useEffect, useState } from "react"

export default function CommunicationPage() {

    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch("https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec?type=checklistDashboard")
            .then(res => res.json())
            .then(res => setData([res])) // ✅ wrap in array
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