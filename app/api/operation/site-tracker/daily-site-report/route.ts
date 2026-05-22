import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            date,
            siteName,
            projectHead,
            manpowerAuthorized,
            deployed,
            gap,
            billSubmittedDate,
            billAmountAuthorised,
            billAmountClaimed,
            paymentStatus,
            paymentCreditDate,
            salariesPaidForMonth,
            salaryRelatedIssue,
            operationalRisks,
            risksIfAny,
            operationalStatus,
            hrIssue,
            issueDetails,
            clientStatus,
            siteStatus,
            createdById,
            createdByEmail,
        } = body

        if (!date) {
            return NextResponse.json(
                { success: false, message: "Date is required" },
                { status: 400 }
            )
        }

        if (!siteName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Site name is required" },
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

        const record = await prisma.dailySiteReport.create({
            data: {
                date: new Date(date),
                siteName: siteName.trim(),
                projectHead: projectHead?.trim() || null,

                manpowerAuthorized: manpowerAuthorized?.trim() || null,
                deployed: deployed?.trim() || null,
                gap: gap?.trim() || null,

                billSubmittedDate: billSubmittedDate ? new Date(billSubmittedDate) : null,
                billAmountAuthorised:
                    billAmountAuthorised === "" || billAmountAuthorised === null || billAmountAuthorised === undefined
                        ? null
                        : Number(billAmountAuthorised),
                billAmountClaimed:
                    billAmountClaimed === "" || billAmountClaimed === null || billAmountClaimed === undefined
                        ? null
                        : Number(billAmountClaimed),

                paymentStatus: paymentStatus?.trim() || null,
                paymentCreditDate: paymentCreditDate ? new Date(paymentCreditDate) : null,

                salariesPaidForMonth: salariesPaidForMonth?.trim() || null,
                salaryRelatedIssue: salaryRelatedIssue?.trim() || null,

                operationalRisks: operationalRisks?.trim() || null,
                risksIfAny: risksIfAny?.trim() || null,
                operationalStatus: operationalStatus?.trim() || null,

                hrIssue: hrIssue?.trim() || null,
                issueDetails: issueDetails?.trim() || null,

                clientStatus: clientStatus?.trim() || null,
                siteStatus: siteStatus?.trim() || null,

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
            message: "Daily site report submitted successfully",
            record,
        })
    } catch (error: any) {
        console.error("POST daily-site-report error:", error)

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
        const operationalStatus = searchParams.get("operationalStatus") || ""
        const operationalRisks = searchParams.get("operationalRisks") || ""
        const hrIssue = searchParams.get("hrIssue") || ""
        const clientStatus = searchParams.get("clientStatus") || ""
        const siteStatus = searchParams.get("siteStatus") || ""
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
            where.siteName = {
                contains: site,
                mode: "insensitive",
            }
        }

        if (operationalStatus) {
            where.operationalStatus = operationalStatus
        }

        if (operationalRisks) {
            where.operationalRisks = operationalRisks
        }

        if (hrIssue) {
            where.hrIssue = hrIssue
        }

        if (clientStatus) {
            where.clientStatus = clientStatus
        }

        if (siteStatus) {
            where.siteStatus = siteStatus
        }

        if (fromDate || toDate) {
            where.date = {}

            if (fromDate) {
                where.date.gte = new Date(fromDate)
            }

            if (toDate) {
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)
                where.date.lte = endDate
            }
        }

        if (search) {
            where.OR = [
                { siteName: { contains: search, mode: "insensitive" } },
                { projectHead: { contains: search, mode: "insensitive" } },
                { manpowerAuthorized: { contains: search, mode: "insensitive" } },
                { deployed: { contains: search, mode: "insensitive" } },
                { gap: { contains: search, mode: "insensitive" } },
                { paymentStatus: { contains: search, mode: "insensitive" } },
                { salariesPaidForMonth: { contains: search, mode: "insensitive" } },
                { salaryRelatedIssue: { contains: search, mode: "insensitive" } },
                { risksIfAny: { contains: search, mode: "insensitive" } },
                { issueDetails: { contains: search, mode: "insensitive" } },
            ]
        }

        const [records, total] = await Promise.all([
            prisma.dailySiteReport.findMany({
                where,
                orderBy: {
                    date: "desc",
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
            prisma.dailySiteReport.count({ where }),
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
        console.error("GET daily-site-report error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}