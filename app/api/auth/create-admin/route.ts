import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export async function GET() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL)
    try {
        const usersToCreate = [
            {
                name: "Supervisor 1",
                email: "nitesh@fm.com",
                password: "1234",
                role: UserRole.supervisor,
                portal: "FM",
            },
            {
                name: "Supervisor 2",
                email: "naveen@fm.com",
                password: "1234",
                role: UserRole.supervisor,
                portal: "FM",
            },
            {
                name: "Account 1",
                email: "a1@fm.com",
                password: "1234",
                role: UserRole.account1,
                portal: "FM",
            },
            {
                name: "Account 2",
                email: "a2@fm.com",
                password: "1234",
                role: UserRole.account2,
                portal: "FM",
            },
            {
                name: "WM Admin",
                email: "admin@wm.com",
                password: "1234",
                role: UserRole.admin,
                portal: "WM",
            },
            {
                name: "WM HR 1",
                email: "hr1@wm.com",
                password: "1234",
                role: UserRole.level1,
                portal: "WM",
            },
            {
                name: "WM HR 2",
                email: "hr2@wm.com",
                password: "1234",
                role: UserRole.level2,
                portal: "WM",
            },
            {
                name: "WM HR 3",
                email: "hr3@wm.com",
                password: "1234",
                role: UserRole.level3,
                portal: "WM",
            },
            {
                name: "Admin",
                email: "admin@fm.com",
                password: "1234",
                role: UserRole.admin,
                portal: "FM",
            },
            {
                name: "HR 1",
                email: "hr1@fm.com",
                password: "1234",
                role: UserRole.level1,
                portal: "FM",
            },
            {
                name: "HR 2",
                email: "hr2@fm.com",
                password: "1234",
                role: UserRole.level2,
                portal: "FM",
            },
            {
                name: "HR 3",
                email: "hr3@fm.com",
                password: "1234",
                role: UserRole.level3,
                portal: "FM",
            },
            {
                name: "Ravi",
                email: "ravi@wm.com",
                password: "1234",
                role: UserRole.Ravi,
                portal: "wm",
            },
            {
                name: "Amitoj",
                email: "amitoj@wm.com",
                password: "1234",
                role: UserRole.Amitoj,
                portal: "wm",
            },
            {
                name: "Deepak",
                email: "deepak@wm.com",
                password: "1234",
                role: UserRole.Deepak,
                portal: "wm",
            },
            {
                name: "Lakhan",
                email: "lakhan@wm.com",
                password: "1234",
                role: UserRole.Lakhan,
                portal: "wm",
            },
            {
                name: "Mahendra",
                email: "mahendra@wm.com",
                password: "1234",
                role: UserRole.Mahendra,
                portal: "wm",
            },
            {
                name: "Suyesh",
                email: "suyesh@wm.com",
                password: "1234",
                role: UserRole.Suyesh,
                portal: "wm",
            },
        ]

        const createdUsers = []

        for (const u of usersToCreate) {
            const existing = await prisma.user.findUnique({
                where: { email: u.email },
            })

            if (!existing) {
                const hashedPassword = await bcrypt.hash(u.password, 10)

                const user = await prisma.user.create({
                    data: {
                        name: u.name,
                        email: u.email,
                        passwordHash: hashedPassword,
                        role: u.role,
                        portal: u.portal,
                    },
                })
                createdUsers.push(user)
            }
        }

        return Response.json({
            success: true,
            message: "Users created (if not existing)",
            createdUsers,
        })
    } catch (err: any) {
        console.error(err)
        return Response.json({ success: false, message: err.message })
    }
}