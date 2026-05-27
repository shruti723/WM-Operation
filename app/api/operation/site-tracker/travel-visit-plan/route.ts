import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function parseBoolean(value: any) {
    if (value === true || value === "true" || value === "Yes") return true
    if (value === false || value === "false" || value === "No") return false
    return null
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            personTravelling,
            siteToVisit,
            purpose,
            problemToAddress,
            expectedOutcome,
            travelDate,
            estimatedCost,
            approvedByAmitoj,
            issueResolved,
            whatWasResolved,
            stillPending,
            followUpRequired,
            createdById,
            createdByEmail,
            mom,
            finalOutcome,
        } = body

        if (!personTravelling?.trim()) {
            return NextResponse.json(
                { success: false, message: "Person travelling is required" },
                { status: 400 }
            )
        }

        if (!siteToVisit?.trim()) {
            return NextResponse.json(
                { success: false, message: "Site to visit is required" },
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

        const record = await prisma.travelVisitPlan.create({
            data: {
                personTravelling: personTravelling.trim(),
                siteToVisit: siteToVisit.trim(),
                purpose: purpose?.trim() || null,
                problemToAddress: problemToAddress?.trim() || null,
                expectedOutcome: expectedOutcome?.trim() || null,
                travelDate: travelDate ? new Date(travelDate) : null,
                estimatedCost:
                    estimatedCost === "" || estimatedCost === null || estimatedCost === undefined
                        ? null
                        : Number(estimatedCost),
                approvedByAmitoj: parseBoolean(approvedByAmitoj),
                issueResolved: parseBoolean(issueResolved),
                whatWasResolved: whatWasResolved?.trim() || null,
                stillPending: stillPending?.trim() || null,
                followUpRequired: parseBoolean(followUpRequired),
                createdById: userId,
                mom: mom?.trim() || null,
                finalOutcome: finalOutcome?.trim() || null,
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
            message: "Travel visit plan submitted successfully",
            record,
        })
    } catch (error: any) {
        console.error("POST travel-visit-plan error:", error)

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
        const site = searchParams.get("site") || ""
        const fromDate = searchParams.get("fromDate") || ""
        const toDate = searchParams.get("toDate") || ""
        const issueResolved = searchParams.get("issueResolved") || ""
        const followUpRequired = searchParams.get("followUpRequired") || ""
        const createdByEmail = searchParams.get("createdByEmail") || ""

        const skip = (page - 1) * limit
        const where: any = {}

        if (createdByEmail) {
            where.createdBy = {
                email: createdByEmail,
            }
        }

        if (site) {
            where.siteToVisit = {
                contains: site,
                mode: "insensitive",
            }
        }

        if (issueResolved) {
            where.issueResolved = parseBoolean(issueResolved)
        }

        if (followUpRequired) {
            where.followUpRequired = parseBoolean(followUpRequired)
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
                { personTravelling: { contains: search, mode: "insensitive" } },
                { siteToVisit: { contains: search, mode: "insensitive" } },
                { purpose: { contains: search, mode: "insensitive" } },
                { problemToAddress: { contains: search, mode: "insensitive" } },
                { expectedOutcome: { contains: search, mode: "insensitive" } },
                { whatWasResolved: { contains: search, mode: "insensitive" } },
                { stillPending: { contains: search, mode: "insensitive" } },
                { mom: { contains: search, mode: "insensitive" } },
                { finalOutcome: { contains: search, mode: "insensitive" } },
            ]
        }

        const [records, total] = await Promise.all([
            prisma.travelVisitPlan.findMany({
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
            prisma.travelVisitPlan.count({ where }),
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
        console.error("GET travel-visit-plan error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}