// app/api/amitoj-tracker/command-targets/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            targetArea,
            targetValue,
            actual,
            gap,
            status,
            mdContextReason,
            nextAction,
            deadline,
            supportNeeded,
            createdById,
            createdByEmail,
        } = body

        if (!targetArea?.trim()) {
            return NextResponse.json(
                { success: false, message: "Target area is required" },
                { status: 400 }
            )
        }

        let userId = createdById

        if (!userId && createdByEmail) {
            const user = await prisma.user.findUnique({
                where: { email: createdByEmail },
                select: { id: true },
            })

            if (!user) {
                return NextResponse.json(
                    { success: false, message: "User not found" },
                    { status: 404 }
                )
            }

            userId = user.id
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "createdById or createdByEmail is required" },
                { status: 400 }
            )
        }

        const record = await prisma.amitojCommandTarget.create({
            data: {
                targetArea: targetArea.trim(),
                targetValue: targetValue?.trim() || null,
                actual: actual?.trim() || null,
                gap: gap?.trim() || null,
                status: status?.trim() || null,
                mdContextReason: mdContextReason?.trim() || null,
                nextAction: nextAction?.trim() || null,
                deadline: deadline ? new Date(deadline) : null,
                supportNeeded: supportNeeded?.trim() || null,
                createdById: userId,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Command target submitted successfully",
            record,
        })
    } catch (error: any) {
        console.error("POST command-targets error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)

        const page = Number(searchParams.get("page") || "1")
        const limit = Number(searchParams.get("limit") || "15")
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") || ""
        const fromDate = searchParams.get("fromDate") || ""
        const toDate = searchParams.get("toDate") || ""
        const createdByEmail = searchParams.get("createdByEmail") || ""

        const skip = (page - 1) * limit
        const where: any = {}

        if (createdByEmail) {
            where.createdBy = {
                email: createdByEmail,
            }
        }

        if (status) {
            where.status = status
        }

        if (fromDate || toDate) {
            where.createdAt = {}

            if (fromDate) where.createdAt.gte = new Date(fromDate)

            if (toDate) {
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)
                where.createdAt.lte = endDate
            }
        }

        if (search) {
            where.OR = [
                { targetArea: { contains: search, mode: "insensitive" } },
                { targetValue: { contains: search, mode: "insensitive" } },
                { actual: { contains: search, mode: "insensitive" } },
                { gap: { contains: search, mode: "insensitive" } },
                { mdContextReason: { contains: search, mode: "insensitive" } },
                { nextAction: { contains: search, mode: "insensitive" } },
                { supportNeeded: { contains: search, mode: "insensitive" } },
            ]
        }

        const [records, total] = await Promise.all([
            prisma.amitojCommandTarget.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.amitojCommandTarget.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error: any) {
        console.error("GET command-targets error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}