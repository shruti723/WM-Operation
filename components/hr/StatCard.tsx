"use client"

import { motion } from "framer-motion"

export default function StatCard({ title, value, icon: Icon, color }: any) {

    const colors: any = {
        blue: "from-blue-500 to-indigo-500",
        purple: "from-purple-500 to-violet-500",
        yellow: "from-yellow-400 to-orange-400",
        orange: "from-orange-400 to-amber-500",
        red: "from-red-400 to-pink-500",
        green: "from-green-400 to-emerald-500",
        teal: "from-teal-400 to-cyan-500"
    }

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            className={`p-5 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${colors[color]}`}
        >
            <div className="flex justify-between items-center">

                <div>
                    <p className="text-sm opacity-80">{title}</p>
                    <h2 className="text-2xl font-bold">{value}</h2>
                </div>

                {/* ✅ SAFE CHECK */}
                {Icon && <Icon size={30} />}

            </div>
        </motion.div>
    )
}