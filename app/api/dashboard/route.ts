export async function GET() {

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec"

  const res = await fetch(scriptURL + "?type=checklist", { cache: "no-store" })
  const raw = await res.json()
  const data = Array.isArray(raw) ? raw : []

  // ============================
  // 🔧 HELPERS
  // ============================

  function normalizeKey(key: string) {
    return key
      .toLowerCase()
      .replace(/\(reason\)/gi, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  function normalizeValue(v: any) {
    if (!v) return ""

    const val = v.toString().trim().toLowerCase()

    if (["yes", "1", "done", "completed"].includes(val)) return "yes"
    if (["no", "0", "not done"].includes(val)) return "no"
    if (["good", "satisfactory"].includes(val)) return "good"
    if (["poor", "bad"].includes(val)) return "poor"

    return ""
  }

  function calcScore(item: any) {
    let total = 0, good = 0

    Object.values(item).forEach((v: any) => {
      const val = normalizeValue(v)
      if (!val) return

      total++
      if (val === "yes" || val === "good") good++
    })

    return total ? Math.round((good / total) * 100) : 0
  }

  function getRowDate(d: any) {
    return d.date || d.timestamp || d.start_date || d.created_on || null
  }

  function parseDate(dateStr: string) {
    if (!dateStr) return null

    let d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d

    const [datePart, timePart] = dateStr.split(" ")
    const [day, month, year] = datePart.split("/")

    d = new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`)
    return isNaN(d.getTime()) ? null : d
  }

  // ============================
  // 🔁 NORMALIZE DATA
  // ============================

  const FIELD_MAP: any = {
    sitename: "site",
    telephonicsitename: "site",
    sitevisit: "site_visit",
    telephoniccalling: "telephonic_calling",
    repeatcomplaint: "repeat_complaint",
    any_urgent_issue_observed_at_the_site_site_visit: "urgent_issue",
    is_manpower_shortage_affecting_operations_site_visit: "manpower_issue",
    is_manpower_shortage_affecting_operations_telephonic: "manpower_issue",
  }

  const allData = data.map((row: any) => {
    let obj: any = {}

    Object.entries(row).forEach(([key, value]) => {
      if (key.toLowerCase().includes("(reason)")) return

      let cleanKey = normalizeKey(key)

      if (cleanKey.includes("sitevisit")) cleanKey = "site_visit"
      if (cleanKey.includes("telephoniccalling")) cleanKey = "telephonic_calling"
      if (cleanKey.includes("repeatcomplaint")) cleanKey = "repeat_complaint"
      if (cleanKey.includes("urgent_issue")) cleanKey = "urgent_issue"
      if (cleanKey.includes("manpower")) cleanKey = "manpower_issue"

      if (FIELD_MAP[cleanKey]) cleanKey = FIELD_MAP[cleanKey]

      if (cleanKey === "site") {
        obj.site = obj.site || value
      } else {
        obj[cleanKey] = value
      }
    })

    return obj
  })

  // ============================
  // 📊 KPI CALCULATIONS
  // ============================

  const todayDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  ).toISOString().split("T")[0]

  const now = new Date()

  const today = allData.filter(d => {
    const parsed = parseDate(getRowDate(d))
    return parsed && parsed.toISOString().split("T")[0] === todayDate
  }).length

  const week = allData.filter(d => {
    const parsed = parseDate(getRowDate(d))
    if (!parsed) return false

    const diff = (now.getTime() - parsed.getTime()) / 86400000
    return diff <= 7
  }).length

  const sites = new Set(allData.map(d => d.site).filter(Boolean)).size

  const recent = [...allData].reverse().slice(0, 5)

  // ============================
  // 🚀 NEW ADVANCED DATA
  // ============================

  const compliance = {
    good: allData.filter(d => calcScore(d) >= 80).length,
    avg: allData.filter(d => calcScore(d) >= 50 && calcScore(d) < 80).length,
    critical: allData.filter(d => calcScore(d) < 50).length,
  }

  const supervisorMap: any = {}

  allData.forEach(d => {
    if (!d.supervisorname) return

    if (!supervisorMap[d.supervisorname]) {
      supervisorMap[d.supervisorname] = []
    }

    supervisorMap[d.supervisorname].push(calcScore(d))
  })

  const supervisorPerf = Object.keys(supervisorMap).map(name => ({
    name,
    score: Math.round(
      supervisorMap[name].reduce((a: number, b: number) => a + b, 0) /
      supervisorMap[name].length
    )
  }))

  const submissionTrend: any = {}

  allData.forEach(d => {
    const parsed = parseDate(getRowDate(d))
    if (!parsed) return

    const key = parsed.toISOString().split("T")[0]
    submissionTrend[key] = (submissionTrend[key] || 0) + 1
  })

  const submissionData = Object.keys(submissionTrend).map(date => ({
    date,
    count: submissionTrend[date]
  }))

  // ============================
  // 🎯 FINAL RESPONSE
  // ============================

  return Response.json({
    today,
    week,
    sites,
    recent,
    allData,
    compliance,
    supervisorPerf,
    submissionData
  })
}


// export async function GET() {

//   const scriptURL =
//     "https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec"

//   const res = await fetch(
//     scriptURL + "?type=checklist",
//     { cache: "no-store" }
//   )
//   const raw = await res.json()
//   const data = Array.isArray(raw) ? raw : []

//   // ============================
//   // 🔥 NORMALIZE KEYS (DYNAMIC)
//   // ============================
//   function normalizeKey(key: string) {
//     return key
//       .toLowerCase()
//       .replace(/\(reason\)/gi, "") // only remove reason
//       .replace(/[^a-z0-9]/g, "_")
//       .replace(/_+/g, "_")        // remove double underscore
//       .replace(/^_|_$/g, "")      // remove starting/ending _
//   }

//   const FIELD_MAP: any = {
//     // ✅ SITE
//     sitename: "site",
//     telephonicsitename: "site",

//     // ✅ BASIC FLAGS
//     sitevisit: "site_visit",
//     telephoniccalling: "telephonic_calling",
//     repeatcomplaint: "repeat_complaint",

//     // ✅ URGENT ISSUE
//     any_urgent_issue_observed_at_the_site_site_visit: "urgent_issue",

//     // ✅ MANPOWER
//     is_manpower_shortage_affecting_operations_site_visit: "manpower_issue",
//     is_manpower_shortage_affecting_operations_telephonic: "manpower_issue",
//   }

//   // Compliance breakdown
//   const compliance = {
//     good: allData.filter(d => calcScore(d) >= 80).length,
//     avg: allData.filter(d => calcScore(d) >= 50 && calcScore(d) < 80).length,
//     critical: allData.filter(d => calcScore(d) < 50).length,
//   }

//   const supervisorMap: any = {}

//   allData.forEach(d => {
//     if (!d.supervisorname) return

//     if (!supervisorMap[d.supervisorname]) {
//       supervisorMap[d.supervisorname] = []
//     }

//     supervisorMap[d.supervisorname].push(calcScore(d))
//   })

//   const supervisorPerf = Object.keys(supervisorMap).map(name => ({
//     name,
//     score: Math.round(
//       supervisorMap[name].reduce((a, b) => a + b, 0) / supervisorMap[name].length
//     )
//   }))

//   const submissionTrend: any = {}

//   allData.forEach(d => {
//     const date = getRowDate(d)?.split("T")[0]
//     if (!date) return

//     submissionTrend[date] = (submissionTrend[date] || 0) + 1
//   })

//   const submissionData = Object.keys(submissionTrend).map(date => ({
//     date,
//     count: submissionTrend[date]
//   }))

//   const allData = data.map((row: any) => {
//     let obj: any = {}

//     Object.entries(row).forEach(([key, value]) => {

//       // ❌ IGNORE reason columns completely
//       if (key.toLowerCase().includes("(reason)")) return

//       let cleanKey = normalizeKey(key)
//       // 🔥 fallback mapping (handles all variations)
//       if (cleanKey.includes("sitevisit")) cleanKey = "site_visit"
//       if (cleanKey.includes("telephoniccalling")) cleanKey = "telephonic_calling"
//       if (cleanKey.includes("repeatcomplaint")) cleanKey = "repeat_complaint"
//       if (cleanKey.includes("urgent_issue")) cleanKey = "urgent_issue"
//       if (cleanKey.includes("manpower")) cleanKey = "manpower_issue"
//       if (FIELD_MAP[cleanKey]) {
//         cleanKey = FIELD_MAP[cleanKey]
//       }
//       if (cleanKey === "site") {
//         obj.site = obj.site || value
//       } else {
//         obj[cleanKey] = value
//       }
//     })
//     return obj
//   })
//   console.log("TOTAL RECORDS:", allData.length)
//   function getRowDate(d: any) {
//     return (
//       d.date ||
//       d.timestamp ||
//       d.start_date ||
//       d.created_on ||
//       null
//     )
//   }

//   return Response.json({
//     today,
//     week,
//     sites,
//     recent,
//     allData,
//     compliance,
//     supervisorPerf,
//     submissionData,
//     schema
//   })

//   function parseDate(dateStr: string) {
//     if (!dateStr) return null

//     let d = new Date(dateStr)

//     if (!isNaN(d.getTime())) return d

//     // 🔥 HANDLE DD/MM/YYYY FORMAT
//     const [datePart, timePart] = dateStr.split(" ")
//     const [day, month, year] = datePart.split("/")

//     d = new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`)

//     return isNaN(d.getTime()) ? null : d
//   }

//   // ============================
//   // 📅 DATE FIX
//   // ============================
//   const todayDate = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   ).toISOString().split("T")[0]

//   // ============================
//   // 📊 TODAY / WEEK
//   // ============================
//   const today = allData.filter((d: any) => {
//     const rawDate = getRowDate(d)
//     if (!rawDate) return false

//     const parsedDate = parseDate(rawDate)
//     if (!parsedDate) return false

//     return parsedDate.toISOString().split("T")[0] === todayDate
//   }).length
//   const now = new Date()
//   const week = allData.filter((d: any) => {
//     const rawDate = getRowDate(d)
//     if (!rawDate) return false

//     const parsedDate = parseDate(rawDate)
//     if (!parsedDate) return false

//     const diff =
//       (now.getTime() - parsedDate.getTime()) /
//       (1000 * 60 * 60 * 24)

//     return diff <= 7
//   }).length
//   // ============================
//   // 🏢 UNIQUE SITES
//   // ============================
//   const sites = new Set(
//     allData
//       .map((d: any) => d.site || d.site_name || d.telephonic_site_name)
//       .filter(Boolean)
//   ).size
//   console.log("RAW SAMPLE:", raw[0])
//   console.log("NORMALIZED:", allData[0])
//   console.log("DATE:", getRowDate(allData[0]))

//   // ============================
//   // 🧠 AUTO FIELD DETECTION
//   // ============================
//   const schema: any = {
//     numericFields: new Set<string>(),
//     yesNoFields: new Set<string>(),
//     textFields: new Set<string>()
//   }

//   allData.forEach((row: any) => {
//     Object.entries(row).forEach(([key, value]) => {

//       if (!value) return

//       if (!isNaN(Number(value))) {
//         schema.numericFields.add(key)
//       } else if (value === "Yes" || value === "No") {
//         schema.yesNoFields.add(key)
//       } else {
//         schema.textFields.add(key)
//       }

//     })
//   })
//   console.log("SAMPLE:", allData[0])
//   // ============================
//   // 📦 RECENT DATA
//   // ============================
//   const recent = [...allData].reverse().slice(0, 5)

//   return Response.json({
//     today,
//     week,
//     sites,
//     recent,
//     allData,
//     schema: {
//       numericFields: Array.from(schema.numericFields),
//       yesNoFields: Array.from(schema.yesNoFields),
//       textFields: Array.from(schema.textFields)
//     }
//   })
// }