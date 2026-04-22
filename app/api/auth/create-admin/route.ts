import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export async function GET() {
    try {
        const usersToCreate = [
            {
                name: "Admin",
                email: "admin@fm.com",
                password: "1234",
                role: UserRole.admin,
            },
            {
                name: "HR 1",
                email: "hr1@fm.com",
                password: "1234",
                role: UserRole.level1,
            },
            {
                name: "HR 2",
                email: "hr2@fm.com",
                password: "1234",
                role: UserRole.level2,
            },
            {
                name: "HR 3",
                email: "hr3@fm.com",
                password: "1234",
                role: UserRole.level3,
            },
            {
                name: "Supervisor 1",
                email: "nitesh@fm.com",
                password: "1234",
                role: UserRole.supervisor,
            },
            {
                name: "Supervisor 2",
                email: "naveen@fm.com",
                password: "1234",
                role: UserRole.supervisor,
            },
            {
                name: "Account 1",
                email: "a1@fm.com",
                password: "1234",
                role: UserRole.account1,
            },
            {
                name: "Account 2",
                email: "a2@fm.com",
                password: "1234",
                role: UserRole.account2,
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