import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const id = String(body.id || "").trim()
        const remark = body.remark

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Missing ID" },
                { status: 400 }
            )
        }

        // ✅ Update ONLY site remark
        await prisma.site.update({
            where: { id },
            data: {
                siteRemark: remark ? String(remark).trim() : null,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Remark updated successfully",
        })

    } catch (error) {
        console.error("BD remark update error:", error)
        return NextResponse.json(
            { success: false, message: "Failed to update remark" },
            { status: 500 }
        )
    }
}