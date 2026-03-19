
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
        "Email And Calling",
        "Site Visit In Person",
        "Site Visit Telephonic",
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

    function clearSiteQuestions() {
        setForm((prev: any) => {
            const updated = { ...prev }

            Object.values(siteQuestions).forEach((site: any) => {
                site.forEach((q: any) => {
                    delete updated[q.question]
                })
            })

            return updated
        })
    }

    function clearTelephonicQuestions() {
        setForm((prev: any) => {
            const updated = { ...prev }

            checklistQuestions["site visit telephonic"].forEach((q: any) => {
                if (
                    !["telephonicCalling", "telephonicSiteName", "telephonicIncharge"].includes(q.id)
                ) {
                    delete updated[q.id || q.question]
                }
            })

            return updated
        })
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

    function validate() {

        /* ✅ EXISTING CHECKLIST VALIDATION */
        for (const [sectionName, section] of Object.entries(checklistQuestions)) {

            // ✅ SKIP TELEPHONIC SECTION COMPLETELY
            if (
                sectionName === "site visit telephonic" &&
                form.telephonicCalling?.value !== "Yes"
            ) {
                continue
            }


            for (const q of section as any[]) {
                // 🔥 SKIP SITE VISIT FIELD
                if (
                    q.id === "siteName" &&
                    form.siteVisit?.value !== "Yes"
                ) {
                    continue
                }

                const ans = form[q.id] || form[q.question]

                if (!ans || !ans.value) {
                    console.log("❌ Failed Question:", {
                        id: q.id,
                        question: q.question,
                        value: form[q.id],
                        fullForm: form
                    })

                    alert(`${q.question} is required`)
                    return false
                }

                // 🔥 REASON ON NO
                if (
                    q.type === "yesno" &&
                    q.requireReasonOnNo &&
                    ans.value === "No" &&
                    !ans.reason
                ) {
                    alert(`Reason required for: ${q.question}`)
                    return false
                }

                // 🔥 REASON ON YES
                if (
                    q.type === "yesno" &&
                    q.requireReasonOnYes &&
                    ans.value === "Yes" &&
                    !ans.reason
                ) {
                    alert(`Reason required for: ${q.question}`)
                    return false
                }
            }
        }
        if (form.hiringRequest?.value === "Yes") {
            if (!form.hiringRequestDetails?.value) {
                alert("Please enter to whom hiring request was raised")
                return false
            }
        }
        // 🔥 TELEPHONIC VALIDATION
        if (form.telephonicCalling?.value === "Yes") {

            if (!form.telephonicSiteName?.value) {
                alert("Select telephonic site")
                return false
            }

            if (!form.telephonicIncharge?.value) {
                alert("Enter incharge name")
                return false
            }
        }

        // ✅ REPEAT COMPLAINT VALIDATION
        if (form.repeatComplaint?.value === "Yes") {

            if (!form.repeatComplaintSite?.value) {
                alert("Please select complaint site")
                return false
            }

            if (!form.repeatComplaintCount?.value) {
                alert("Please enter number of repeat complaints")
                return false
            }
        }


        /* ✅ ADD THIS BLOCK HERE (SITE VALIDATION) */
        if (form.siteVisit?.value === "Yes" && form.siteName?.value) {

            const siteQs = siteQuestions[form.siteName.value] || []

            for (const q of siteQs) {

                const ans = form[q.question]

                if (!ans || !ans.value) {
                    console.log("❌ Failed Question:", {
                        id: q.id,
                        question: q.question,
                        value: form[q.id],
                        fullForm: form
                    })

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

        if (step === 1) {
            for (const q of checklistQuestions.communication) {
                const ans = form[q.id]

                if (!ans || !ans.value) {
                    alert(`${q.question} is required`)
                    return false
                }
            }
        }

        if (step === 3) {
            if (!form.telephonicCalling?.value) {
                alert("Please select telephonic calling")
                return false
            }

            if (form.telephonicCalling.value === "Yes") {

                if (!form.telephonicSiteName?.value) {
                    alert("Please select site")
                    return false
                }

                if (!form.telephonicIncharge?.value) {
                    alert("Please enter incharge name")
                    return false
                }
            }
        }

        if (step === 4) {
            for (const q of checklistQuestions.store) {
                const ans = form[q.id]

                if (!ans || !ans.value) {
                    alert(`${q.question} is required`)
                    return false
                }
            }
        }

        return true
    }
    const questionMap: any = {}

    Object.values(checklistQuestions).forEach((section: any) => {
        section.forEach((q: any) => {
            questionMap[q.id] = q.question
        })
    })
    Object.values(siteQuestions).forEach((site: any) => {
        site.forEach((q: any) => {
            if (q.id) {
                questionMap[q.id] = q.question
            }
        })
    })
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

                    // ✅ get question text
                    const questionText =
                        questionMap[key] || key

                    // ✅ store answer
                    formattedData[questionText] = form[key].value

                    // ✅ ALWAYS create reason column (clean)
                    formattedData[`${questionText} (Reason)`] =
                        form[key]?.reason || ""

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
        const key = q.id || q.question

        if (q.type === "rating") {
            return (
                <Select
                    value={form[key]?.value || ""}
                    onValueChange={(v) => update(key, v)}
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
            )
        }

        // keep your existing yesno, number, etc...


        if (q.type === "number") {
            return (
                <Input
                    type="number"
                    min={0}
                    value={form[key]?.value || ""}
                    onChange={(e) =>
                        update(key, String(Math.max(0, Number(e.target.value))))
                    }
                />
            )
        }
        if (q.type === "longtext") {
            return (
                <textarea
                    className="w-full border rounded p-2 min-h-[100px]"
                    placeholder="Enter detailed tasks performed..."
                    value={form[key]?.value || ""}
                    onChange={(e) => update(key, e.target.value)}
                />
            )
        }
        if (q.type === "yesno") {
            return (
                <div className="space-y-2">

                    <Select
                        value={form[key]?.value || ""}
                        onValueChange={(v) => {
                            update(key, v)

                            if (q.id === "hiringRequest" && v === "No") {
                                setForm((prev: any) => ({
                                    ...prev,
                                    hiringRequestDetails: undefined
                                }))
                            }


                            // 🔥 CLEAR DEPENDENT FIELDS
                            if (q.id === "repeatComplaint" && v === "No") {
                                setForm((prev: any) => ({
                                    ...prev,
                                    repeatComplaintSite: undefined,
                                    repeatComplaintCount: undefined
                                }))
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* ✅ REASON (FOR NO) */}
                    {/* 🔥 REASON ON NO */}
                    {q.requireReasonOnNo && form[key]?.value === "No" && (
                        <Input

                            placeholder="Enter reason (mandatory)"
                            value={form[key]?.reason || ""}
                            onChange={(e) => updateReason(key, e.target.value)}
                        />
                    )}

                    {/* 🔥 NEW: REASON ON YES */}
                    {q.requireReasonOnYes && form[key]?.value === "Yes" && (
                        <Input
                            placeholder="Enter reason (mandatory)"
                            value={form[key]?.reason || ""}
                            onChange={(e) => updateReason(key, e.target.value)}

                        />
                    )}
                    {/* 🔥 HIRING REQUEST EXTRA FIELD */}
                    {q.id === "hiringRequest" &&
                        form[key]?.value === "Yes" && (
                            <Input
                                placeholder="To whom request was raised?"
                                value={form.hiringRequestDetails?.value || ""}
                                onChange={(e) =>
                                    update("hiringRequestDetails", e.target.value)
                                }
                            />
                        )}
                    {/* 🔥 SPECIAL CASE: REPEAT COMPLAINT */}
                    {q.id === "repeatComplaint" && form[key]?.value === "Yes" && (
                        <div className="space-y-2 mt-2 border p-3 rounded">

                            {/* SITE NAME */}
                            <label className="text-sm">Select Complaint Site</label>
                            <Select
                                value={form.repeatComplaintSite?.value || ""}
                                onValueChange={(v) => update("repeatComplaintSite", v)}
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

                            {/* NUMBER OF COMPLAINTS */}
                            <label className="text-sm">Number of repeat complaints</label>
                            <Input
                                type="number"
                                min={1}
                                value={form.repeatComplaintCount?.value || ""}
                                onChange={(e) =>
                                    update("repeatComplaintCount", String(Math.max(1, Number(e.target.value))))
                                }
                            />

                        </div>
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
                            {/* STEP 1: SITE VISIT */}
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

                            {/* REASON IF NO */}
                            {form.siteVisit?.value === "No" && (
                                <Input
                                    placeholder="Enter reason (mandatory)"
                                    value={form.siteVisit?.reason || ""}
                                    onChange={(e) =>
                                        updateReason("siteVisit", e.target.value)
                                    }
                                />
                            )}

                            {/* STEP 2: SITE NAME */}
                            {form.siteVisit?.value === "Yes" && (
                                <>
                                    <label>Site Name</label>

                                    <Select
                                        onValueChange={(v) => {
                                            clearSiteQuestions()
                                            update("siteName", v)
                                        }}
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

                            {/* STEP 3: QUESTIONS (🔥 SAME AS TELEPHONIC) */}
                            {form.siteVisit?.value === "Yes" &&
                                form.siteName?.value &&
                                siteQuestions[form.siteName.value]?.map((q: any) => (
                                    <div key={q.question}>
                                        <label>{q.question}</label>
                                        {renderQuestion(q)}
                                    </div>
                                ))}
                        </>
                    )}


                    {/* 🔥 SITE VISIT TELEPHONIC */}
                    {step === 3 && (
                        <>

                            {/* STEP 1: CALLING */}
                            <label>Was telephonic calling done today?</label>
                            <Select
                                value={form.telephonicCalling?.value || ""}
                                onValueChange={(v) => {
                                    update("telephonicCalling", v)

                                    if (v === "No") {
                                        clearTelephonicQuestions()
                                        setForm((prev: any) => ({
                                            ...prev,
                                            telephonicSiteName: undefined,
                                            telephonicIncharge: undefined
                                        }))
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* STEP 2: SITE */}
                            {form.telephonicCalling?.value === "Yes" && (
                                <>
                                    <label>Select Site</label>
                                    <Select
                                        value={form.telephonicSiteName?.value || ""}
                                        onValueChange={(v) => {
                                            update("telephonicSiteName", v)
                                            clearTelephonicQuestions()
                                        }}
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

                            {/* STEP 3: INCHARGE */}
                            {form.telephonicCalling?.value === "Yes" &&
                                form.telephonicSiteName?.value && (
                                    <>
                                        <label>Site Incharge Name</label>
                                        <Input
                                            placeholder="Enter name"
                                            value={form.telephonicIncharge?.value || ""}
                                            onChange={(e) =>
                                                update("telephonicIncharge", e.target.value)
                                            }
                                        />
                                    </>
                                )}

                            {/* STEP 4: QUESTIONS */}
                            {form.telephonicCalling?.value === "Yes" &&
                                form.telephonicSiteName?.value && (
                                    checklistQuestions["site visit telephonic"]
                                        .filter((q: any) =>
                                            !["telephonicCalling", "telephonicSiteName", "telephonicIncharge"].includes(q.id)
                                        )
                                        .map((q: any, index: number) => (
                                            <div key={index}>
                                                <label>{q.question}</label>
                                                {renderQuestion(q)}
                                            </div>
                                        ))
                                )}

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