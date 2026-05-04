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
            requireReasonOnYes: true
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
            requireReasonOnYes: true
        },
        {
            id: "complaintResolved",
            question: "Complaint resolved?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "tasksPerformed",
            question: "Tasks performed today",
            type: "longtext",
            required: true
        }
    ],

    "site visit telephonic": [
        {
            id: "matrixAttendance",  // 🔥 ADD THIS
            question: "Is attendance being recorded on matrix track?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "telephonicCalling",
            question: "Was any site contact made today?",
            type: "yesno"
        },
        {
            id: "telephonicSiteName",
            question: "Select Site",
            type: "dropdown"
        },
        {
            id: "telephonicIncharge",
            question: "Site Incharge Name",
            type: "text"
        },

        {
            id: "manpowerShortage",
            question: "Is manpower shortage affecting operations?",
            type: "yesno",
            requireReasonOnYes: true
        },
        {
            id: "replacementArranged",
            question: "Is replacement arranged?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "hiringRequest",
            question: "Is hiring request raised?",
            type: "yesno",
            requireReasonOnYes: true
        },
        {
            id: "cleaningScheduleFollowed",
            question: "Is cleaning schedule followed?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "toiletsCleaned",
            question: "Are toilets cleaned as per frequency?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "garbageDisposal",
            question: "Is garbage disposal done on time?",
            type: "yesno",
            requireReasonOnNo: true
        },
        {
            id: "machinesWorking",
            question: "Are machines functioning properly?",
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
            requireReasonOnYes: true
        }
    ]
}