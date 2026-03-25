"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  // ✅ FIX: ensure client render
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  const handleLogin = (e: any) => {
    e.preventDefault()
    const users = [
      { email: "admin@fm.com", password: "1234", role: "admin", name: "Admin" },
      { email: "nitesh@fm.com", password: "1234", role: "supervisor", name: "Nitesh" },
      { email: "naveen@fm.com", password: "1234", role: "supervisor", name: "Naveen" },
<<<<<<< HEAD
      { email: "hr@fm.com", password: "1234", role: "hr", name: "HR Executive" },
      { email: "vikash@fm.com", password: "1234", role: "level1", name: "Vikash" },
      { email: "anjali@fm.com", password: "1234", role: "level2", name: "Anjali" },
      { email: "atul@fm.com", password: "1234", role: "level3", name: "Atul" }
=======
      { email: "hr@fm.com", password: "1234", role: "hr", name: "HR Executive" }
>>>>>>> origin/feature/dashboard-hr-merge-25mar2025
    ]
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    )
    if (foundUser) {
      sessionStorage.setItem("user", JSON.stringify(foundUser))
<<<<<<< HEAD
      // ✅ All HR workflow users go to same dashboard
      if (["level1", "level2", "level3", "hr"].includes(foundUser.role)) {
        router.push("/hr")
      } else {
        router.push("/supervisor")
      }
    } else {
=======

      if (foundUser.role === "hr") {
        router.push("/hr") // 👉 HR dashboard
      } else {
        router.push("/supervisor") // 👉 supervisor/admin dashboard
      }
    }
    else {
>>>>>>> origin/feature/dashboard-hr-merge-25mar2025
      setError("Invalid email or password")
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl backdrop-blur-xl bg-white/80 border border-gray-200">
        {/* HEADER */}
        <CardHeader className="text-center space-y-2">
          <div className="text-4xl">🏢</div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            FM Operations
          </CardTitle>
          <p className="text-sm text-gray-500">
            Login to manage operations
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Email</label>
              <Input
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                className="h-11 rounded-xl focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* PASSWORD */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Password</label>
              <div className="relative">
                <Input
                  placeholder="Enter password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  className="h-11 rounded-xl pr-10 focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 text-sm"           >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {/* ERROR */}
            {error && (
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
            )}
            {/* BUTTON */}
            <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 transition">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}