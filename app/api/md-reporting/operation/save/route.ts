import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const { id, site, note } = body

        if (!site || !note) {
            return NextResponse.json(
                { success: false, message: "Missing fields" },
                { status: 400 }
            )
        }

        let record

        if (id) {
            // ✅ UPDATE EXISTING
            record = await prisma.operationReport.update({
                where: { id },
                data: {
                    site,
                    note,
                },
            })
        } else {
            // ✅ CREATE NEW
            record = await prisma.operationReport.create({
                data: {
                    site,
                    note,
                },
            })
        }

        return NextResponse.json({
            success: true,
            data: record,
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        )
    }
}