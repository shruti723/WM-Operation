export function calculateScore(item: any) {
    let total = 0, good = 0

    Object.values(item).forEach((v: any) => {
        if (["Yes", "No"].includes(v)) {
            total++
            if (v === "Yes") good++
        }

        if (["Good", "Satisfactory", "Poor"].includes(v)) {
            total++
            if (v === "Good") good++
        }
    })

    return total ? Math.round((good / total) * 100) : 0
}

export function calculateRisk(item: any) {
    let risk = 0

    if (item.safety_risk === "Yes") risk += 30
    if (item.pending_emails === "Yes") risk += 10
    if (item.manpower_shortage === "Yes") risk += 20

    return Math.min(risk, 100)
}