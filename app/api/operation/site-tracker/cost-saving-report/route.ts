import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            site,
            reductionSavingType,
            description,
            monthlyImpact,
            owner,
            deadline,
            status,
            createdById,
            createdByEmail,
        } = body

        if (!site || !String(site).trim()) {
            return NextResponse.json(
                { success: false, message: "Site is required" },
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

        const record = await prisma.costSavingReport.create({
            data: {
                site: String(site).trim(),
                reductionSavingType: reductionSavingType?.trim() || null,
                description: description?.trim() || null,
                monthlyImpact:
                    monthlyImpact === "" || monthlyImpact === null || monthlyImpact === undefined
                        ? null
                        : Number(monthlyImpact),
                owner: owner?.trim() || null,
                deadline: deadline ? new Date(deadline) : null,
                status: status || "Open",
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            message: "Cost saving report created successfully",
            record,
        })
    } catch (error: any) {
        console.error("POST cost-saving-report error:", error)

        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
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
        const site = searchParams.get("site") || ""
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

        if (site) {
            where.site = {
                contains: site,
                mode: "insensitive",
            }
        }

        if (status) {
            where.status = status
        }

        if (fromDate || toDate) {
            where.createdAt = {}

            if (fromDate) {
                where.createdAt.gte = new Date(fromDate)
            }

            if (toDate) {
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)
                where.createdAt.lte = endDate
            }
        }

        if (search) {
            where.OR = [
                {
                    site: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    reductionSavingType: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    owner: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    status: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ]
        }

        const [records, total] = await Promise.all([
            prisma.costSavingReport.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.costSavingReport.count({ where }),
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
        console.error("GET cost-saving-report error:", error)

        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: 500 }
        )
    }
}