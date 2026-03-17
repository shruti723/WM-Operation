export async function GET() {

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbxw6kqPgI31dwnYChFFRAbqdcJO4RtZj7i3ELN3qH0-MAaD72icnQ2XpU3Zwt2Vv6NH/exec"

  const res = await fetch(scriptURL)
  const data = await res.json()

  const allData = Array.isArray(data) ? data : []

  // ✅ LOCAL DATE FIX (IMPORTANT)
  const todayDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  ).toISOString().split("T")[0]
  console.log("TODAY:", todayDate)
  console.log("SHEET DATES:", allData.map((d: any) => d.date))
  // =================
  // ✅ TODAY COUNT
  // =================
  const today = allData.filter((d: any) => {
    return d.date === todayDate
  }).length

  // =================
  // ✅ WEEK COUNT
  // =================
  const now = new Date()

  const week = allData.filter((d: any) => {
    if (!d.date) return false

    const dDate = new Date(d.date)
    const diff = (now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24)

    return diff <= 7
  }).length

  // =================
  // ✅ UNIQUE SITES
  // =================
  const sites = new Set(
    allData.map((d: any) => d.siteName).filter(Boolean)
  ).size

  // =================
  // ✅ RECENT DATA
  // =================
  const recent = [...allData]
    .reverse()
    .slice(0, 5)

  return Response.json({
    today,
    week,
    sites,
    recent,
    allData
  })

}