// export async function GET() {

//   const scriptURL =
//     "https://script.google.com/macros/s/AKfycbxw6kqPgI31dwnYChFFRAbqdcJO4RtZj7i3ELN3qH0-MAaD72icnQ2XpU3Zwt2Vv6NH/exec"

//   const res = await fetch(scriptURL)
//   const data = await res.json()

//   const allData = Array.isArray(data) ? data : []
//   console.log("TOTAL RECORDS:", allData.length)
//   // ✅ LOCAL DATE FIX (IMPORTANT)
//   const todayDate = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   ).toISOString().split("T")[0]
//   console.log("TODAY:", todayDate)
//   console.log("SHEET DATES:", allData.map((d: any) => d.date))
//   // =================
//   // ✅ TODAY COUNT
//   // =================
//   const today = allData.filter((d: any) => {
//     return d.date === todayDate
//   }).length

//   // =================
//   // ✅ WEEK COUNT
//   // =================
//   const now = new Date()

//   const week = allData.filter((d: any) => {
//     if (!d.date) return false

//     const dDate = new Date(d.date)
//     const diff = (now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24)

//     return diff <= 7
//   }).length

//   // =================
//   // ✅ UNIQUE SITES
//   // =================
//   const sites = new Set(
//     allData.map((d: any) => d.siteName).filter(Boolean)
//   ).size

//   // =================
//   // ✅ RECENT DATA
//   // =================
//   const recent = [...allData]
//     .reverse()
//     .slice(0, 5)

//   return Response.json({
//     today,
//     week,
//     sites,
//     recent,
//     allData
//   })

// }



export async function GET() {

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbxw6kqPgI31dwnYChFFRAbqdcJO4RtZj7i3ELN3qH0-MAaD72icnQ2XpU3Zwt2Vv6NH/exec"

  const res = await fetch(scriptURL, { cache: "no-store" })
  const raw = await res.json()

  const data = Array.isArray(raw) ? raw : []

  // ============================
  // 🔥 NORMALIZE KEYS (DYNAMIC)
  // ============================
  function normalizeKey(key: string) {
    return key
      .toLowerCase()
      .replace(/\(.*?\)/g, "") // remove (Reason)
      .replace(/[^a-z0-9]/g, "_")
  }

  const allData = data.map((row: any) => {
    let obj: any = {}

    Object.entries(row).forEach(([key, value]) => {
      const cleanKey = normalizeKey(key)
      obj[cleanKey] = value
    })

    return obj
  })

  console.log("TOTAL RECORDS:", allData.length)

  // ============================
  // 📅 DATE FIX
  // ============================
  const todayDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  ).toISOString().split("T")[0]

  // ============================
  // 📊 TODAY / WEEK
  // ============================
  const today = allData.filter((d: any) => d.date === todayDate).length

  const now = new Date()

  const week = allData.filter((d: any) => {
    if (!d.date) return false
    const diff =
      (now.getTime() - new Date(d.date).getTime()) /
      (1000 * 60 * 60 * 24)

    return diff <= 7
  }).length

  // ============================
  // 🏢 UNIQUE SITES
  // ============================
  const sites = new Set(
    allData.map((d: any) => d.sitename).filter(Boolean)
  ).size

  // ============================
  // 🧠 AUTO FIELD DETECTION
  // ============================
  const schema: any = {
    numericFields: new Set<string>(),
    yesNoFields: new Set<string>(),
    textFields: new Set<string>()
  }

  allData.forEach((row: any) => {
    Object.entries(row).forEach(([key, value]) => {

      if (!value) return

      if (!isNaN(Number(value))) {
        schema.numericFields.add(key)
      } else if (value === "Yes" || value === "No") {
        schema.yesNoFields.add(key)
      } else {
        schema.textFields.add(key)
      }

    })
  })

  // ============================
  // 📦 RECENT DATA
  // ============================
  const recent = [...allData].reverse().slice(0, 5)

  return Response.json({
    today,
    week,
    sites,
    recent,
    allData,
    schema: {
      numericFields: Array.from(schema.numericFields),
      yesNoFields: Array.from(schema.yesNoFields),
      textFields: Array.from(schema.textFields)
    }
  })
}