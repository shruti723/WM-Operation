"use client"

import { useState } from "react"
import { useEffect } from "react"
import Sidebar from "@/components/hr/Sidebar"
import Header from "@/components/hr/Header"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState("")

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}")
    setRole(String(user.role || "").toLowerCase())
  }, [])

  const showSidebar = ["level1", "level2"].includes(role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <aside
          className={`
      fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r shadow-sm
      transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0
    `}
        >
          <Sidebar />
        </aside>
      )}

      {/* Main area */}
      <div className={`${showSidebar ? "md:ml-[260px]" : ""} min-h-screen flex flex-col`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-gray-50 border-b px-3 py-3 md:px-6 md:py-4">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Page content */}
        <main className="flex-1 px-3 py-4 md:px-6 md:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}