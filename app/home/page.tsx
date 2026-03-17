// "use client"

// import { useEffect,useState } from "react"
// import { useRouter } from "next/navigation"

// import { Card,CardContent,CardTitle,CardDescription } from "@/components/ui/card"
// import { ClipboardList,FileText,BarChart3 } from "lucide-react"

// export default function HomePage(){

// const router = useRouter()

// const [user,setUser]=useState<any>(null)

// useEffect(()=>{

// const userData=sessionStorage.getItem("user")

// if(userData){
// setUser(JSON.parse(userData))
// }else{
// router.push("/")
// }

// },[])

// if(!user) return null

// return(

// <div className="max-w-5xl mx-auto p-6 space-y-6">

// <h1 className="text-2xl font-bold">
// FM Operations
// </h1>

// <div className="space-y-4">

// {/* START CHECKLIST */}

// <Card
// className="cursor-pointer"
// onClick={()=>router.push("/checklist")}
// >

// <CardContent className="p-6 flex justify-between items-center">

// <div>

// <CardTitle>Start New Checklist</CardTitle>

// <CardDescription>
// Begin a new site visit checklist
// </CardDescription>

// </div>

// <ClipboardList/>

// </CardContent>

// </Card>


// {/* SUBMISSIONS */}

// <Card
// className="cursor-pointer"
// onClick={()=>router.push("/submissions")}
// >

// <CardContent className="p-6 flex justify-between items-center">

// <div>

// <CardTitle>View My Submissions</CardTitle>

// <CardDescription>
// Review submitted checklists
// </CardDescription>

// </div>

// <FileText/>

// </CardContent>

// </Card>


// {/* DASHBOARD */}

// <Card
// className="cursor-pointer"
// onClick={()=>router.push("/dashboard")}
// >

// <CardContent className="p-6 flex justify-between items-center">

// <div>

// <CardTitle>Operations Dashboard</CardTitle>

// <CardDescription>
// View analytics and site performance
// </CardDescription>

// </div>

// <BarChart3/>

// </CardContent>

// </Card>

// </div>

// </div>

// )

// }

"use client"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ClipboardList,FileText,BarChart3 } from "lucide-react"

export default function Home(){

const router = useRouter()
const [user,setUser]=useState<any>(null)

useEffect(()=>{
const u=sessionStorage.getItem("user")
if(!u) router.push("/")
else setUser(JSON.parse(u))
},[])

if(!user) return null

return(

<div className="max-w-5xl mx-auto p-8 space-y-6">

<h1 className="text-3xl font-bold">
Welcome, {user.name}
</h1>

{/* ADMIN */}
{user.role==="admin" && (

<Card
onClick={()=>router.push("/dashboard")}
className="p-10 rounded-2xl cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition"
>

<div className="flex justify-between items-center">

<div>
<h2 className="text-2xl font-semibold">
Operations Dashboard
</h2>
<p className="opacity-80">
Analytics, performance & reports
</p>
</div>

<BarChart3 size={40}/>

</div>

</Card>

)}

{/* SUPERVISOR */}
{user.role==="supervisor" && (

<div className="space-y-4">

<Card className="p-6 cursor-pointer" onClick={()=>router.push("/checklist")}>
<div className="flex justify-between">
<div>
<h3 className="font-semibold">Start Checklist</h3>
<p className="text-sm text-gray-500">New site visit</p>
</div>
<ClipboardList/>
</div>
</Card>

<Card className="p-6 cursor-pointer" onClick={()=>router.push("/submissions")}>
<div className="flex justify-between">
<div>
<h3 className="font-semibold">My Submissions</h3>
<p className="text-sm text-gray-500">View records</p>
</div>
<FileText/>
</div>
</Card>

</div>

)}

</div>

)
}