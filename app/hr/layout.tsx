"use client"

import { useState } from "react"
import Sidebar from "@/components/hr/Sidebar"
import Header from "@/components/hr/Header"

export default function Layout({ children }: any) {

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ✅ OVERLAY (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR (FIXED ALWAYS) */}
      <div
        className={`
          fixed md:fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm z-50
          transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300
          md:translate-x-0
        `}
      >
        <Sidebar />
      </div>

      {/* ✅ MAIN AREA */}
      <div className="flex-1 md:ml-64 flex flex-col h-screen">

        {/* HEADER (FIXED TOP) */}
        <div className="bg-gray-50 p-4 border-b">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* CONTENT (SCROLL ONLY HERE) */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </div>

      </div>

    </div>
  )
}