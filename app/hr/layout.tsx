// import Sidebar from "@/components/hr/Sidebar"

// export default function Layout({ children }: any) {
//     return (
//         <div className="flex">
//             <Sidebar />
//             <div className="flex-1 bg-gray-50 min-h-screen p-6">
//                 {children}
//             </div>
//         </div>
//     )
// }


import Sidebar from "@/components/hr/Sidebar"

export default function Layout({ children }: any) {
    return (
        <div className="flex">

            {/* ✅ FIXED SIDEBAR */}
            <div className="w-64 fixed top-0 left-0 h-screen bg-white border-r shadow-sm z-50">
                <Sidebar />
            </div>

            {/* ✅ SCROLLABLE CONTENT */}
            <div className="ml-64 flex-1 bg-gray-50 h-screen overflow-y-auto p-6">
                {children}
            </div>

        </div>
    )
}