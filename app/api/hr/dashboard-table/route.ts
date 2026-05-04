import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function formatDate(date: Date | null | undefined) {
    if (!date) return ""

    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    return `${day}-${month}-${year}`
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role")

        const submissions = await prisma.manpowerSubmission.findMany({
            orderBy: { submittedAt: "desc" },
            include: {
                site: true,
                items: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })


        if (role === "level1") {

            const sites = await prisma.site.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    manpowerTemplate: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            })

            const data = sites.map((site: any) => ({
                submissionId: null,
                site: site.siteName,

                startDate: formatDate(site.startDate),
                lastRenewalDate: formatDate(site.lastRenewalDate),
                nextRenewalDate: formatDate(site.nextRenewalDate),

                siteType: site.siteType || "CLIENT",

                // ✅ ADD THESE TWO LINES
                siteCategory: site.siteCategory ?? "",
                siteRemark: site.siteRemark ?? "",

                manpowerList: site.manpowerTemplate.map((item: any) => ({
                    designation: item.designation,
                    authorised: item.authorised,
                })),
            }))

            return NextResponse.json({
                success: true,
                data,
            })
        }

        // ========================
        // 🟣 HR2 / HR3 → ALL RECORDS (NO FILTER)
        // ========================

        const data = submissions.map((submission: any) => {

            let totalDeployed = 0
            let totalNeeded = 0
            let totalAuthorised = 0

            const manpowerList = submission.items.map((item: any) => {

                const authorised = item.authorised ?? 0
                const deployed = item.deployed ?? 0
                const needed = item.needed ?? 0

                totalAuthorised += authorised
                totalDeployed += deployed
                totalNeeded += needed

                return {
                    designation: item.designation,
                    authorised,
                    deployed,
                    shortage: item.shortage ?? (authorised - deployed),
                    needed,
                    recruitmentProcess: item.recruitmentProcess ?? "",
                    responsible: item.responsible ?? "",
                    cutoffDate: item.cutoffDate
                        ? new Date(item.cutoffDate).toISOString().split("T")[0]
                        : "",
                    remarks: item.remarks ?? "",
                }
            })

            return {
                submissionId: submission.id,
                siteId: submission.siteId,
                site: submission.site.siteName,
                createdAt: submission.createdAt,
                totalAuthorised,
                totalDeployed,
                totalNeeded,

                status:
                    role === "level2"
                        ? "Pending HR3"
                        : submission.items.some((i: any) => i.recruitmentProcess)
                            ? "Completed"
                            : "Pending",
                manpowerList,
            }
        })

        return NextResponse.json({
            success: true,
            data,
        })

    } catch (error) {
        console.error("Dashboard API error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to load dashboard" },
            { status: 500 }
        )
    }
}