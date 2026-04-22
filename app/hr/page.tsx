"use client"

import { useEffect, useState } from "react"
import HR1Table from "@/components/hr/HR1Table"
import HR2Table from "@/components/hr/HR2Table"
import HR3Table from "@/components/hr/HR3Table"
import A1Table from "@/components/hr/A1Table"

export default function DashboardPage() {
  const [role, setRole] = useState("")

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}")
    setRole(user?.role)
  }, [])

  if (!role) return null

  if (role === "level1") return <HR1Table />
  if (role === "level2") return <HR2Table />
  if (role === "level3") return <HR3Table />
  if (role === "account1") return <A1Table />

  return <div>No Access</div>
}