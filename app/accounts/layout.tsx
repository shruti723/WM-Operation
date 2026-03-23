"use client"

import ModuleLayout from "@/components/module-layout"
import { LayoutDashboard, FileText, CreditCard, AlertCircle, FileBarChart } from "lucide-react"

const menu = [
  { name: "Overview",      path: "/accounts",             icon: LayoutDashboard },
  { name: "Invoices",      path: "/accounts/invoices",    icon: FileText        },
  { name: "Payments",      path: "/accounts/payments",    icon: CreditCard      },
  { name: "Outstanding",   path: "/accounts/outstanding", icon: AlertCircle     },
  { name: "Reports",       path: "/accounts/reports",     icon: FileBarChart    },
]

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout title="Accounts" subtitle="Finance & Billing" accent="amber" menu={menu}>
      {children}
    </ModuleLayout>
  )
}
