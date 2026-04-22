import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const email = String(body.email || "").trim().toLowerCase()
        const password = String(body.password || "")

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            )
        }

        const isValidPassword =
            user.passwordHash.startsWith("$2")
                ? await bcrypt.compare(password, user.passwordHash)
                : user.passwordHash === password

        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        })
    } catch (error) {
        console.error("Login API error:", error)
        return NextResponse.json(
            { success: false, message: "Something went wrong" },
            { status: 500 }
        )
    }
}