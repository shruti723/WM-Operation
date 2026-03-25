export async function GET() {

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbw8SDSvKxBr0H7SMYZespI2p1mjhuAVcFddhtzFXuOYMWqlqxxt-qwRv5cvroAjldC2/exec"

  const res = await fetch(scriptURL, { cache: "no-store" })
  const raw = await res.json()

  const data = Array.isArray(raw) ? raw : []

  // ============================
  // 🔥 NORMALIZE KEYS (DYNAMIC)
  // ============================
  function normalizeKey(key: string) {
    return key
      .toLowerCase()
      .replace(/\(reason\)/gi, "") // only remove reason
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")        // remove double underscore
      .replace(/^_|_$/g, "")      // remove starting/ending _
  }

  const FIELD_MAP: any = {
    // ✅ SITE
    sitename: "site",
    telephonicsitename: "site",

    // ✅ BASIC FLAGS
    sitevisit: "site_visit",
    telephoniccalling: "telephonic_calling",
    repeatcomplaint: "repeat_complaint",

    // ✅ URGENT ISSUE
    any_urgent_issue_observed_at_the_site_site_visit: "urgent_issue",

    // ✅ MANPOWER
    is_manpower_shortage_affecting_operations_site_visit: "manpower_issue",
    is_manpower_shortage_affecting_operations_telephonic: "manpower_issue",
  }

  const allData = data.map((row: any) => {
    let obj: any = {}

    Object.entries(row).forEach(([key, value]) => {
      let cleanKey = normalizeKey(key)

      if (FIELD_MAP[cleanKey]) {
        cleanKey = FIELD_MAP[cleanKey]
      }

      if (cleanKey === "site") {
        obj.site = obj.site || value
      } else {
        obj[cleanKey] = value
      }
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
  const today = allData.filter((d: any) => {
    if (!d.date) return false

    const parsedDate = new Date(d.date)
    if (isNaN(parsedDate.getTime())) return false

    return parsedDate.toISOString().split("T")[0] === todayDate
  }).length

  const now = new Date()

  const week = allData.filter((d: any) => {
    if (!d.date) return false

    const parsedDate = new Date(d.date)

    if (isNaN(parsedDate.getTime())) return false

    const diff =
      (now.getTime() - parsedDate.getTime()) /
      (1000 * 60 * 60 * 24)

    return diff <= 7
  }).length

  // ============================
  // 🏢 UNIQUE SITES
  // ============================
  const sites = new Set(
    allData.map((d: any) => d.site).filter(Boolean)
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
  console.log("SAMPLE:", allData[0])
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