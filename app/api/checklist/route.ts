export async function POST(req: Request) {
    try {
        const data = await req.json()

        console.log("📦 Incoming Data:", data)

        const scriptURL =
            "https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec"

        const res = await fetch(scriptURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })

        const text = await res.text()

        console.log("📨 Google Script Response:", text)

        if (!res.ok) {
            return Response.json(
                { success: false, error: text },
                { status: 500 }
            )
        }

        return Response.json({ success: true })

    } catch (err: any) {
        console.error("❌ API ERROR:", err)

        return Response.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}