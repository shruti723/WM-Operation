export const checklistQuestions = {
    communication: [
        {
            id: "emailsReceived",
            question: "How many official emails/messages were received today?",
            type: "number"
        },
        {
            id: "emailsReplied",
            question: "How many emails/messages were replied today?",
            type: "number"
        },
        {
            id: "pendingEmails",
            question: "Are there any emails pending more than 24 hours?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "clientCalls",
            question: "How many client calls were received?",
            type: "number"
        },
        {
            id: "followupCalls",
            question: "How many outbound follow-up calls were made?",
            type: "number"
        },
        {
            id: "repeatComplaint",
            question: "Any repeat complaint from same site?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "complaintResolved",
            question: "Complaint resolved?",
            type: "yesno",
            requireReasonOnNo: true
        }
    ],

    manpower: [
        {
            id: "sanctionedManpower",
            question: "What is total sanctioned manpower for the site?",
            type: "number"
        },
        {
            id: "staffPresent",
            question: "How many staff are present today?",
            type: "number"
        },
        {
            id: "staffAbsent",
            question: "How many staff are absent?",
            type: "number"
        },
        {
            id: "shortageAffecting",
            question: "Is shortage affecting operations?",
            type: "yesno",
            requireReasonOnNo: true
        }
    ],

    store: [
        {
            id: "stockRegisterUpdated",
            question: "Was stock register updated today?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "openIssues",
            question: "How many open issues from previous day?",
            type: "number"
        },
        {
            id: "issuesClosed",
            question: "How many issues closed today?",
            type: "number"
        },
        {
            id: "safetyRisk",
            question: "Any safety risk observed?",
            type: "yesno",
            requireReasonOnNo: true
        }
    ]
}