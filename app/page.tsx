// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"

// export default function LoginPage(){

// const router = useRouter()
// const [email,setEmail]=useState("")
// const [password,setPassword]=useState("")

// const handleLogin = (e:any)=>{
// e.preventDefault()

// // 🔐 HARDCODED USERS
// const users = [
//   { email: "admin@fm.com", password: "1234", role: "admin", name: "Admin" },
//   { email: "md@fm.com", password: "1234", role: "admin", name: "MD" },
//   { email: "nitesh@fm.com", password: "1234", role: "supervisor", name: "Nitesh" },
//   { email: "naveen@fm.com", password: "1234", role: "supervisor", name: "Naveen" }
// ]

// // 🔍 CHECK USER
// const foundUser = users.find(
//   (u) => u.email === email && u.password === password
// )

// if(foundUser){

//   // ✅ STORE USER SESSION
//   sessionStorage.setItem("user", JSON.stringify(foundUser))

//   router.push("/home")

// }else{
//   alert("Invalid email or password")
// }
// }

// return(

// <div className="min-h-screen flex items-center justify-center bg-gray-50">

// <Card className="w-full max-w-md shadow-xl rounded-2xl">

// <CardHeader>
// <CardTitle className="text-center text-2xl">
// FM Operations
// </CardTitle>
// </CardHeader>

// <CardContent>

// <form onSubmit={handleLogin} className="space-y-4">

// <Input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
// <Input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}/>

// <Button className="w-full">
// Login
// </Button>

// </form>

// </CardContent>

// </Card>

// </div>

// )
// }

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

  // ✅ FIX: ensure client render
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleLogin = (e: any) => {
    e.preventDefault()

    const users = [
      { email: "admin@fm.com", password: "1234", role: "admin", name: "Admin" },
      { email: "md@fm.com", password: "1234", role: "admin", name: "MD" },
      { email: "nitesh@fm.com", password: "1234", role: "supervisor", name: "Nitesh" },
      { email: "naveen@fm.com", password: "1234", role: "supervisor", name: "Naveen" }
    ]

    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    )

    if (foundUser) {
      sessionStorage.setItem("user", JSON.stringify(foundUser))
      router.push("/home")
    } else {
      alert("Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <Card className="w-full max-w-md shadow-xl rounded-2xl">

        <CardHeader>
          <CardTitle className="text-center text-2xl">
            FM Operations
          </CardTitle>
        </CardHeader>

        <CardContent>

          <form onSubmit={handleLogin} className="space-y-4">

            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <Button className="w-full">
              Login
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  )
}