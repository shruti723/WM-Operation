"use client"

import ModuleLayout from "@/components/module-layout"
import { LayoutDashboard, Receipt, ClipboardCheck, FileBarChart } from "lucide-react"

const menu = [
  { name: "Overview",       path: "/petty-cash",          icon: LayoutDashboard },
  { name: "Disbursements",  path: "/petty-cash/records",  icon: Receipt         },
  { name: "Audit Status",   path: "/petty-cash/audit",    icon: ClipboardCheck  },
  { name: "Reports",        path: "/petty-cash/reports",  icon: FileBarChart    },
]

export default function PettyCashLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout title="Petty Cash" subtitle="Expense Tracking" accent="emerald" menu={menu}>
      {children}
    </ModuleLayout>
  )
}
