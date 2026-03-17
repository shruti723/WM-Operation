"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { checklistQuestions } from "@/lib/checklistQuestions"
import { siteQuestions } from "@/lib/siteQuestions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { Loader2 } from "lucide-react"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select"

export default function ChecklistPage() {

    const router = useRouter()

    const steps = [
        "Basic Details",
        "Communication",
        "Site Visit",
        "Manpower",
        "Store"
    ]

    const [step, setStep] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<any>({})

    /* ---------------- UPDATE FORM ---------------- */

    function update(name: string, value: string) {
        setForm((prev: any) => ({
            ...prev,
            [name]: {
                ...prev[name],
                value
            }
        }))
    }

    function updateReason(name: string, reason: string) {
        setForm((prev: any) => ({
            ...prev,
            [name]: {
                ...prev[name],
                reason
            }
        }))
    }

    /* ---------------- AUTO DATE TIME ---------------- */

    useEffect(() => {
        const now = new Date()

        setForm((prev: any) => ({
            ...prev,
            date: now.toISOString().split("T")[0],
            time: now.toLocaleTimeString()
        }))
    }, [])

    /* ---------------- VALIDATION ---------------- */

    // function validate() {
    //     for (const section of Object.values(checklistQuestions)) {
    //         for (const q of section as any[]) {
    //             const ans = form[q.id]

    //             if (!ans || !ans.value) {
    //                 alert(`${q.question} is required`)
    //                 return false
    //             }

    //             if (
    //                 q.type === "yesno" &&
    //                 q.requireReasonOnNo &&
    //                 ans.value === "No" &&
    //                 !ans.reason
    //             ) {
    //                 alert(`Reason required for: ${q.question}`)
    //                 return false
    //             }
    //         }
    //     }
    function validate() {

        /* ✅ EXISTING CHECKLIST VALIDATION */
        for (const section of Object.values(checklistQuestions)) {
            for (const q of section as any[]) {
                const ans = form[q.id]

                if (!ans || !ans.value) {
                    alert(`${q.question} is required`)
                    return false
                }

                if (
                    q.type === "yesno" &&
                    q.requireReasonOnNo &&
                    ans.value === "No" &&
                    !ans.reason
                ) {
                    alert(`Reason required for: ${q.question}`)
                    return false
                }
            }
        }

        /* ✅ ADD THIS BLOCK HERE (SITE VALIDATION) */
        if (form.siteVisit?.value === "Yes" && form.siteName?.value) {

            const siteQs = siteQuestions[form.siteName.value] || []

            for (const q of siteQs) {

                const ans = form[q.question]

                if (!ans || !ans.value) {
                    alert(`${q.question} is required`)
                    return false
                }

                /* OPTIONAL: reason validation for site yes/no */
                if (
                    q.type === "yesno" &&
                    ans.value === "No" &&
                    !ans.reason
                ) {
                    alert(`Reason required for: ${q.question}`)
                    return false
                }
            }
        }

        return true
    }
    //     return true
    // }

    function validateStep() {
        let questions: any[] = []

        if (step === 1) questions = checklistQuestions.communication
        if (step === 3) questions = checklistQuestions.manpower
        if (step === 4) questions = checklistQuestions.store

        for (const q of questions) {
            const ans = form[q.id]

            if (!ans || !ans.value) {
                alert(`${q.question} is required`)
                return false
            }

            if (
                q.type === "yesno" &&
                q.requireReasonOnNo &&
                ans.value === "No" &&
                !ans.reason
            ) {
                alert(`Reason required for: ${q.question}`)
                return false
            }
        }

        return true
    }

    /* ---------------- SUBMIT ---------------- */

    async function submit() {

        if (!validate()) return
        if (loading) return

        setLoading(true)

        try {

            /* ✅ CONVERT FORM STRUCTURE */
            const formattedData: any = {}

            Object.keys(form).forEach((key) => {
                if (form[key]?.value !== undefined) {
                    formattedData[key] = form[key].value
                    if (form[key]?.reason) {
                        formattedData[`${key} (Reason)`] = form[key].reason
                    }
                } else {
                    formattedData[key] = form[key]
                }
            })

            await fetch("/api/checklist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formattedData)
            })

            const existing = JSON.parse(localStorage.getItem("submissions") || "[]")

            existing.push({
                date: formattedData.date,
                siteName: formattedData.siteName,
                supervisorName: formattedData.supervisorName,
                siteVisitConducted: formattedData.siteVisit === "Yes",
                submittedAt: new Date().toISOString()
            })

            localStorage.setItem("submissions", JSON.stringify(existing))

            setSubmitted(true)

        } catch (err) {
            console.error("Submission error", err)
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- QUESTION RENDER ---------------- */

    function renderQuestion(q: any) {

        if (q.type === "number") {
            return (
                <Input
                    type="number"
                    min={0}
                    value={form[q.id]?.value || ""}
                    onChange={(e) =>
                        update(q.id, String(Math.max(0, Number(e.target.value))))
                    }
                />
            )
        }

        if (q.type === "yesno") {
            return (
                <div className="space-y-2">

                    <Select
                        value={form[q.id]?.value || ""}
                        onValueChange={(v) => update(q.id, v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>

                    {q.requireReasonOnNo && form[q.id]?.value === "No" && (
                        <Input
                            placeholder="Enter reason (mandatory)"
                            value={form[q.id]?.reason || ""}
                            onChange={(e) =>
                                updateReason(q.id, e.target.value)
                            }
                        />
                    )}

                </div>
            )
        }
    }

    /* ---------------- SUCCESS SCREEN ---------------- */

    if (submitted) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-10 text-center space-y-6">
                    <h2 className="text-2xl font-bold">
                        Checklist Submitted Successfully
                    </h2>

                    <Button onClick={() => window.location.reload()}>
                        Start New Checklist
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push("/home")}
                    >
                        Back to Home
                    </Button>
                </Card>
            </div>
        )
    }

    /* ---------------- UI ---------------- */

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">

            <h1 className="text-2xl font-bold">
                Daily Checklist
            </h1>

            <Progress value={((step + 1) / steps.length) * 100} />

            <Card>

                <CardHeader>
                    <CardTitle>{steps[step]}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* BASIC DETAILS */}
                    {step === 0 && (
                        <>
                            <label>Supervisor Name</label>

                            <Select
                                value={form.supervisorName?.value || ""}
                                onValueChange={(v) => update("supervisorName", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Supervisor" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Nitesh">Nitesh</SelectItem>
                                    <SelectItem value="Naveen">Naveen</SelectItem>
                                </SelectContent>
                            </Select>

                            <label>Date</label>
                            <Input value={form.date || ""} readOnly />

                            <label>Time</label>
                            <Input value={form.time || ""} readOnly />
                        </>
                    )}

                    {/* COMMUNICATION */}
                    {step === 1 && (
                        <>
                            {checklistQuestions.communication.map((q: any) => (
                                <div key={q.id}>
                                    <label>{q.question}</label>
                                    {renderQuestion(q)}
                                </div>
                            ))}
                        </>
                    )}

                    {/* SITE VISIT */}
                    {step === 2 && (
                        <>
                            <label>Was site visit conducted today?</label>

                            <Select
                                value={form.siteVisit?.value || ""}
                                onValueChange={(v) => update("siteVisit", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* 🔴 REASON IF NO */}
                            {form.siteVisit?.value === "No" && (
                                <Input
                                    placeholder="Enter reason (mandatory)"
                                    value={form.siteVisit?.reason || ""}
                                    onChange={(e) =>
                                        updateReason("siteVisit", e.target.value)
                                    }
                                />
                            )}

                            {/* SITE NAME */}
                            {form.siteVisit?.value === "Yes" && (
                                <>
                                    <label>Site Name</label>

                                    <Select
                                        value={form.siteName?.value || ""}
                                        onValueChange={(v) => update("siteName", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Site" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {Object.keys(siteQuestions).map((site) => (
                                                <SelectItem key={site} value={site}>
                                                    {site}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            )}
                            {form.siteName?.value &&
                                siteQuestions[form.siteName.value]?.map((q: any, index: number) => (

                                    <div key={index}>
                                        <label>{q.question}</label>

                                        {/* ✅ RATING */}
                                        {q.type === "rating" && (
                                            <Select
                                                value={form[q.question]?.value || ""}
                                                onValueChange={(v) => update(q.question, v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select rating" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="Poor">Poor</SelectItem>
                                                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                                                    <SelectItem value="Good">Good</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* ✅ YES / NO */}
                                        {q.type === "yesno" && (
                                            <div className="space-y-2">

                                                <Select
                                                    value={form[q.question]?.value || ""}
                                                    onValueChange={(v) => update(q.question, v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="Yes">Yes</SelectItem>
                                                        <SelectItem value="No">No</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {form[q.question]?.value === "No" && (
                                                    <Input
                                                        placeholder="Enter reason (mandatory)"
                                                        value={form[q.question]?.reason || ""}
                                                        onChange={(e) =>
                                                            updateReason(q.question, e.target.value)
                                                        }
                                                    />
                                                )}

                                            </div>
                                        )}

                                        {/* ✅ NUMBER */}
                                        {q.type === "number" && (
                                            <Input
                                                type="number"
                                                min={0}
                                                value={form[q.question]?.value || ""}
                                                onChange={(e) =>
                                                    update(q.question, String(Math.max(0, Number(e.target.value))))
                                                }
                                            />
                                        )}

                                        {/* ✅ TEXT */}
                                        {q.type === "text" && (
                                            <Input
                                                placeholder="Enter details"
                                                value={form[q.question]?.value || ""}
                                                onChange={(e) =>
                                                    update(q.question, e.target.value)
                                                }
                                            />
                                        )}

                                    </div>

                                ))}
                        </>
                    )}

                    {/* MANPOWER */}
                    {step === 3 && (
                        <>
                            {checklistQuestions.manpower.map((q: any) => (
                                <div key={q.id}>
                                    <label>{q.question}</label>
                                    {renderQuestion(q)}
                                </div>
                            ))}
                        </>
                    )}

                    {/* STORE */}
                    {step === 4 && (
                        <>
                            {checklistQuestions.store.map((q: any) => (
                                <div key={q.id}>
                                    <label>{q.question}</label>
                                    {renderQuestion(q)}
                                </div>
                            ))}
                        </>
                    )}

                </CardContent>
            </Card>

            <div className="flex justify-between">

                <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                >
                    Previous
                </Button>

                {step === steps.length - 1 ? (

                    <Button
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {loading ? "Submitting..." : "Submit"}
                    </Button>

                ) : (

                    <Button
                        onClick={() => {
                            if (!validateStep()) return
                            setStep(step + 1)
                        }}
                    >
                        Next
                    </Button>

                )}

            </div>

        </div>
    )
}