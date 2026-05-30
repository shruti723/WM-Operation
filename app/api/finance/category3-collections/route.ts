// import { NextResponse } from "next/server"

// const FALLBACK_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbxTrhzsWpS-MgFJdzoMBBJTBlGwbBzANCmDBqHLeFzHUCw6ey42uTMSlKnIUrp3HNSEDA/exec"

// const FALLBACK_SECRET =
//     "fm_category3_secret_123"

// export async function GET() {
//     try {
//         const scriptUrl =
//             process.env.GOOGLE_CATEGORY3_SCRIPT_URL ||
//             FALLBACK_SCRIPT_URL

//         const secret =
//             process.env.GOOGLE_CATEGORY3_SECRET ||
//             FALLBACK_SECRET

//         if (!scriptUrl || !secret) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: "Google Apps Script URL or secret missing",
//                 },
//                 { status: 500 }
//             )
//         }

//         const url = `${scriptUrl}?secret=${encodeURIComponent(secret)}`

//         const response = await fetch(url, {
//             cache: "no-store",
//         })

//         const text = await response.text()

//         let data: any

//         try {
//             data = JSON.parse(text)
//         } catch {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: "Apps Script did not return valid JSON",
//                     raw: text.slice(0, 300),
//                 },
//                 { status: 500 }
//             )
//         }

//         if (!data.success) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message:
//                         data.message ||
//                         "Failed to fetch Category 3 Collections",
//                     data,
//                 },
//                 { status: 500 }
//             )
//         }

//         return NextResponse.json({
//             success: true,
//             rows: data.rows || [],
//             totalRows: data.totalRows || 0,
//             updatedAt: data.updatedAt || null,
//         })
//     } catch (error) {
//         console.error("Category 3 Collections API Error:", error)

//         return NextResponse.json(
//             {
//                 success: false,
//                 message: "Failed to load Category 3 Collections",
//                 error:
//                     error instanceof Error
//                         ? error.message
//                         : String(error),
//             },
//             { status: 500 }
//         )
//     }
// }

import { NextResponse } from "next/server"

export async function GET() {
    try {
        const scriptUrl = process.env.GOOGLE_CATEGORY3_SCRIPT_URL
        const secret = process.env.GOOGLE_CATEGORY3_SECRET

        if (!scriptUrl || !secret) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "GOOGLE_CATEGORY3_SCRIPT_URL or GOOGLE_CATEGORY3_SECRET missing on server",
                    hasScriptUrl: Boolean(scriptUrl),
                    hasSecret: Boolean(secret),
                },
                { status: 500 }
            )
        }

        const url = `${scriptUrl}?secret=${encodeURIComponent(secret)}`

        const response = await fetch(url, {
            cache: "no-store",
        })

        const text = await response.text()

        let data: any

        try {
            data = JSON.parse(text)
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Apps Script did not return valid JSON",
                    raw: text.slice(0, 300),
                },
                { status: 500 }
            )
        }

        if (!data.success) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        data.message ||
                        "Failed to fetch Category 3 Collections",
                    data,
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            rows: data.rows || [],
            totalRows: data.totalRows || 0,
            updatedAt: data.updatedAt || null,
        })
    } catch (error) {
        console.error("Category 3 Collections API Error:", error)

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load Category 3 Collections",
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            { status: 500 }
        )
    }
}