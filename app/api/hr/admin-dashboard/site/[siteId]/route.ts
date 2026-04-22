import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
    req: Request,
    { params }: { params: { siteId: string } }
) {
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get("submissionId")
    const type = searchParams.get("type")

    try {
        const site = await prisma.site.findUnique({
            where: { id: params.siteId },
            include: {
                manpowerTemplate: true, // HR1
                manpowerSubmissions: {
                    include: { items: true } // HR2 + HR3
                }
            }
        })

        if (!site) {
            return NextResponse.json({ success: false }, { status: 404 })
        }


        // 👇 ADD THIS BLOCK HERE
        if (type === "hr1") {
            const designationMap: any = {}

                ; (site.manpowerTemplate || []).forEach((item: any) => {
                    const key = item.designation

                    if (!designationMap[key]) {
                        designationMap[key] = {
                            designation: key,
                            authorised: 0,
                            deployed: 0,
                            needed: 0,
                            process: "-",
                            responsible: "-",
                            cutoff: null,
                            remarks: "-"
                        }
                    }

                    designationMap[key].authorised += item.authorised || 0
                })

            const designations = Object.values(designationMap).map((d: any) => ({
                ...d,
                deployed: 0,
                shortage: 0,
                needed: 0
            }))

            return NextResponse.json({
                site: {
                    id: site.id,
                    name: site.siteName,
                    startDate: site.startDate,
                    lastRenewalDate: site.lastRenewalDate,
                    nextRenewalDate: site.nextRenewalDate,
                },
                designations,
            })
        }

        const designationMap: any = {}

            // ✅ HR1 (Authorised)
            ; (site.manpowerTemplate || []).forEach((item: any) => {
                const key = item.designation

                if (!designationMap[key]) {
                    designationMap[key] = {
                        designation: key,
                        authorised: 0,
                        deployed: 0,
                        needed: 0,
                        process: "-",
                        responsible: "-",
                        cutoff: null,
                        remarks: "-"
                    }
                }

                designationMap[key].authorised += item.authorised || 0
            })

            // ✅ HR2 + HR3
            ; // ✅ find ONLY selected HR2 submission
        const hr2Sub = (site.manpowerSubmissions || []).find(
            (s: any) => s.id === submissionId
        )

        // ✅ match HR3 using SAME DATE
        const hasHR3Data = (hr2Sub?.items || []).some(
            (item: any) =>
                (item.needed ?? 0) > 0 ||
                !!item.recruitmentProcess ||
                !!item.responsible ||
                !!item.cutoffDate ||
                !!item.remarks
        )


        // ✅ APPLY HR2
        if (hr2Sub) {
            (hr2Sub.items || []).forEach((item: any) => {
                const key = item.designation
                if (!designationMap[key]) return

                designationMap[key].deployed += item.deployed || 0
            })
        }
        // ✅ APPLY HR3 (from same submission)
        if (hasHR3Data && hr2Sub) {
            (hr2Sub.items || []).forEach((item: any) => {
                const key = item.designation
                if (!designationMap[key]) return

                designationMap[key].needed = item.needed || 0
                designationMap[key].process = item.recruitmentProcess || "-"
                designationMap[key].responsible = item.responsible || "-"
                designationMap[key].cutoff = item.cutoffDate || null
                designationMap[key].remarks = item.remarks || "-"
            })
        }


        const designations = Object.values(designationMap).map((d: any) => ({
            ...d,
            shortage: d.authorised - d.deployed
        }))

        const timeline: any[] = []

        // 🟢 HR1 - Record Created
        timeline.push({
            title: "Record created",
            actor: "HR1",
            at: site.createdAt || new Date()
        })

        // 🟡 HR2 Submission (A1/Level2 flow simplified)
        if (hr2Sub) {
            timeline.push({
                title: "HR2 submitted manpower",
                actor: "HR2",
                at: hr2Sub.createdAt || new Date()
            })
        }

        // 🟣 HR3 Completed (if data present)
        if (hasHR3Data && hr2Sub) {
            timeline.push({
                title: "HR3 completed details",
                actor: "HR3",
                at: hr2Sub.updatedAt || hr2Sub.createdAt
            })
        }

        return NextResponse.json({
            site: {
                id: site.id,
                name: site.siteName,
                startDate: site.startDate,
                lastRenewalDate: site.lastRenewalDate,
                nextRenewalDate: site.nextRenewalDate,
            },
            designations,
            timeline // 👈 ADD THIS
        })

    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}