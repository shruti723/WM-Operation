// app/api/amitoj-tracker/site-control/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            site,
            coordinator,
            authorisedAmount,
            underBillingAmount,
            commitmentDate,
            billingStatus,
            siteStatus,
            clientControl,
            politicalRisk,
            coordinatorPerformance,
            riskMdContext,
            lastAction,
            nextAction,
            owner,
            deadline,
            createdById,
            createdByEmail,
        } = body

        if (!site?.trim()) {
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

        const record = await prisma.amitojSiteControl.create({
            data: {
                site: site.trim(),
                coordinator: coordinator?.trim() || null,
                authorisedAmount:
                    authorisedAmount === "" || authorisedAmount === null || authorisedAmount === undefined
                        ? null
                        : Number(authorisedAmount),
                underBillingAmount:
                    underBillingAmount === "" || underBillingAmount === null || underBillingAmount === undefined
                        ? null
                        : Number(underBillingAmount),
                commitmentDate: commitmentDate ? new Date(commitmentDate) : null,
                billingStatus: billingStatus?.trim() || null,
                siteStatus: siteStatus?.trim() || null,
                clientControl: clientControl?.trim() || null,
                politicalRisk: politicalRisk?.trim() || null,
                coordinatorPerformance: coordinatorPerformance?.trim() || null,
                riskMdContext: riskMdContext?.trim() || null,
                lastAction: lastAction?.trim() || null,
                nextAction: nextAction?.trim() || null,
                owner: owner?.trim() || null,
                deadline: deadline ? new Date(deadline) : null,
                createdById: userId,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Site control report submitted successfully",
            record,
        })
    } catch (error: any) {
        console.error("POST site-control error:", error)

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
        const billingStatus = searchParams.get("billingStatus") || ""
        const siteStatus = searchParams.get("siteStatus") || ""
        const coordinatorPerformance = searchParams.get("coordinatorPerformance") || ""
        const createdByEmail = searchParams.get("createdByEmail") || ""

        const clientControl = searchParams.get("clientControl") || ""
        const politicalRisk = searchParams.get("politicalRisk") || ""

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

        if (billingStatus) where.billingStatus = billingStatus
        if (siteStatus) where.siteStatus = siteStatus
        if (coordinatorPerformance) where.coordinatorPerformance = coordinatorPerformance

        if (clientControl) where.clientControl = clientControl
        if (politicalRisk) where.politicalRisk = politicalRisk

        if (search) {
            where.OR = [
                { site: { contains: search, mode: "insensitive" } },
                { coordinator: { contains: search, mode: "insensitive" } },
                { billingStatus: { contains: search, mode: "insensitive" } },
                { siteStatus: { contains: search, mode: "insensitive" } },
                { clientControl: { contains: search, mode: "insensitive" } },
                { politicalRisk: { contains: search, mode: "insensitive" } },
                { coordinatorPerformance: { contains: search, mode: "insensitive" } },
                { riskMdContext: { contains: search, mode: "insensitive" } },
                { lastAction: { contains: search, mode: "insensitive" } },
                { nextAction: { contains: search, mode: "insensitive" } },
                { owner: { contains: search, mode: "insensitive" } },
            ]
        }

        const [records, total] = await Promise.all([
            prisma.amitojSiteControl.findMany({
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
            prisma.amitojSiteControl.count({ where }),
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
        console.error("GET site-control error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}