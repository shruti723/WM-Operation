"use client"

import ModuleLayout from "@/components/module-layout"
import { LayoutDashboard, Users, MapPin, TrendingDown, FileBarChart } from "lucide-react"

const menu = [
  { name: "Overview",          path: "/hr",            icon: LayoutDashboard },
  { name: "Site Manpower",     path: "/hr/sites",      icon: MapPin          },
  { name: "Shortages",         path: "/hr/shortages",  icon: TrendingDown    },
  { name: "Staff Directory",   path: "/hr/staff",      icon: Users           },
  { name: "Reports",           path: "/hr/reports",    icon: FileBarChart    },
]

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout title="Human Resources" subtitle="Manpower & Staffing" accent="sky" menu={menu}>
      {children}
    </ModuleLayout>
  )
}
