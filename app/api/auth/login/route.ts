import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const email = String(body.email || "")
            .trim()
            .toLowerCase()

        const password = String(body.password || "")
        const portal = String(body.portal || "")
            .trim()
            .toLowerCase()

        if (!email || !password || !portal) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email, password and portal are required",
                },
                { status: 400 }
            )
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
                portal,
            },
        })

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized portal access",
                },
                { status: 401 }
            )
        }

        const isValidPassword =
            user.passwordHash.startsWith("$2")
                ? await bcrypt.compare(password, user.passwordHash)
                : user.passwordHash === password

        if (!isValidPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
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
                portal: user.portal,
            },
        })
    } catch (error) {
        console.error("Login API error:", error)

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        )
    }
}