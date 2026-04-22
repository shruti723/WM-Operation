"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ManpowerRedirect() {
    const router = useRouter()

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}")
        const role = user?.role

        if (role === "level1") {
            router.push("/hr/manpower/hr1")
        } else if (role === "level2") {
            router.push("/hr/manpower/hr2")
        } else if (role === "level3") {
            router.push("/hr/manpower/hr3")
        }
    }, [])

    return null
}