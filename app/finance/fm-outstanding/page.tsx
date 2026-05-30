"use client"

import { useEffect, useMemo, useState } from "react"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts"
import {
    AlertTriangle,
    Banknote,
    FileText,
    IndianRupee,
    RefreshCw,
    Search,
    ShieldCheck,
    TrendingUp,
    WalletCards,
    Send,
    BadgeCheck,
    Clock,
    ReceiptIndianRupee,
    DatabaseZap,
} from "lucide-react"

/* ================= TYPES ================= */

type FinanceRecord = {
    id: string
    month: string
    siteName: string
    billAmount: number | null
    receivedDate: string | null
    paymentReceivedDays: number | null
    salaryDisbursementDate: string | null
    prepared?: string
    dispatched?: string
    paymentCheque?: string
    salaryStatus?: "Paid" | "Unpaid" | string
    prepareDate?: string | null
    dispatchDate?: string | null
}

type SecurityRecord = {
    srNo: number | string
    siteName: string
    emd: number
    bankGuarantee: number
    billingSd: number
    performanceSecurityFd: number
}

/* ================= CONSTANTS ================= */

const BILL_PAGE_SIZE = 10
const SECURITY_PAGE_SIZE = 10

const MONTH_MAP: Record<string, number> = {
    JAN: 0,
    JANUARY: 0,
    FEB: 1,
    FEBRUARY: 1,
    MAR: 2,
    MARCH: 2,
    APR: 3,
    APRIL: 3,
    MAY: 4,
    JUN: 5,
    JUNE: 5,
    JUL: 6,
    JULY: 6,
    AUG: 7,
    AUGUST: 7,
    SEP: 8,
    SEPT: 8,
    SEPTEMBER: 8,
    OCT: 9,
    OCTOBER: 9,
    NOV: 10,
    NOVEMBER: 10,
    DEC: 11,
    DECEMBER: 11,
}

const MONTH_LABELS = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
]

/* ================= HELPERS ================= */

function formatCurrency(value: number) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`
}

function normalizeText(value?: string | null) {
    return String(value || "").trim().toLowerCase()
}

function isYes(value?: string | null) {
    return normalizeText(value) === "yes"
}

function isNo(value?: string | null) {
    return normalizeText(value) === "no"
}

function isPaid(value?: string | null) {
    return normalizeText(value) === "paid"
}

function isUnpaid(value?: string | null) {
    return normalizeText(value) === "unpaid"
}

function parseMonth(value: string) {
    if (!value) return new Date(0)

    const parts = value.trim().split(" ")
    const monthText = parts[0]?.toUpperCase()
    const yearText = parts[1]

    const monthIndex = MONTH_MAP[monthText] ?? 0
    const year = Number(yearText || 1970)

    return new Date(year, monthIndex, 1)
}

function getMonthKey(value: string) {
    const date = parseMonth(value)
    return `${date.getFullYear()}-${date.getMonth()}`
}

function formatMonth(date: Date) {
    return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
}

function getRunningMonthKeys(selectedMonth: string) {
    const selectedDate = parseMonth(selectedMonth)

    return Array.from({ length: 3 }).map((_, index) => {
        const date = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() - index,
            1
        )

        return {
            label: formatMonth(date),
            key: `${date.getFullYear()}-${date.getMonth()}`,
            date,
        }
    })
}

function parsePrepareDate(value?: string | null) {
    if (!value) return null

    const cleanDate = String(value)
        .trim()
        .replaceAll("/", "-")

    const parts = cleanDate.split("-")

    if (parts.length !== 3) return null

    const [day, month, year] = parts

    const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12,
        0,
        0
    )

    if (isNaN(parsedDate.getTime())) return null

    return parsedDate
}

function getBillStatus(row: FinanceRecord) {
    return isYes(row.paymentCheque) ? "Collected" : "Pending"
}

function getAgeingDays(row: FinanceRecord) {
    const preparedDate = parsePrepareDate(row.prepareDate)

    if (!preparedDate) return 0

    const today = new Date()
    const diff = today.getTime() - preparedDate.getTime()

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function getAgeingBucket(days: number) {
    if (days <= 30) return "0-30"
    if (days <= 60) return "31-60"
    if (days <= 90) return "61-90"
    return "90+"
}

/* ================= SMALL UI ================= */

function StatusBadge({ status }: { status: string }) {
    const paid = status === "Collected"

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paid
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
        >
            {status}
        </span>
    )
}

function YesNoBadge({ value }: { value?: string | null }) {
    if (isYes(value)) {
        return (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Yes
            </span>
        )
    }

    if (isNo(value)) {
        return (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                No
            </span>
        )
    }

    return (
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 border border-slate-200">
            —
        </span>
    )
}

function KpiCard({
    title,
    value,
    subtitle,
    icon,
    tone,
}: {
    title: string
    value: string | number
    subtitle: string
    icon: any
    tone: "blue" | "green" | "red" | "amber" | "violet" | "slate" | "orange"
}) {
    const Icon = icon

    const styles: Record<string, string> = {
        blue: "from-blue-50 to-white border-blue-100 text-blue-700",
        green: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
        red: "from-rose-50 to-white border-rose-100 text-rose-700",
        amber: "from-amber-50 to-white border-amber-100 text-amber-700",
        violet: "from-violet-50 to-white border-violet-100 text-violet-700",
        slate: "from-slate-50 to-white border-slate-200 text-slate-700",
        orange: "from-orange-50 to-white border-orange-100 text-orange-700",
    }

    return (
        <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm hover:shadow-md transition ${styles[tone]}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                        {value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        {subtitle}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

function ActionCard({
    title,
    value,
    subtitle,
    tone,
    icon,
}: {
    title: string
    value: string | number
    subtitle: string
    tone: "red" | "amber" | "blue" | "green"
    icon: any
}) {
    const Icon = icon

    const styles: Record<string, string> = {
        red: "bg-rose-50 border-rose-200 text-rose-700",
        amber: "bg-amber-50 border-amber-200 text-amber-700",
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    }

    return (
        <div className={`rounded-3xl border p-5 shadow-sm ${styles[tone]}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold">
                        {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                        {value}
                    </h3>

                    <p className="mt-1 text-xs opacity-80">
                        {subtitle}
                    </p>
                </div>

                <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

function InsightMiniCard({
    title,
    value,
    subtitle,
    tone,
}: {
    title: string
    value: string | number
    subtitle: string
    tone: "blue" | "green" | "amber" | "red" | "violet" | "slate"
}) {
    const styles: Record<string, string> = {
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        green: "bg-emerald-50 border-emerald-100 text-emerald-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
        red: "bg-rose-50 border-rose-100 text-rose-700",
        violet: "bg-violet-50 border-violet-100 text-violet-700",
        slate: "bg-slate-50 border-slate-200 text-slate-700",
    }

    return (
        <div className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {title}
            </p>

            <h4 className="mt-1 text-2xl font-black">
                {value}
            </h4>

            <p className="mt-1 text-xs opacity-75">
                {subtitle}
            </p>
        </div>
    )
}

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string
    subtitle?: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-950">
                    {title}
                </h3>

                {subtitle && (
                    <p className="mt-1 text-sm text-slate-500">
                        {subtitle}
                    </p>
                )}
            </div>

            {children}
        </div>
    )
}

/* ================= MAIN ================= */

export default function FMOutstandingPage() {
    const [billingData, setBillingData] = useState<FinanceRecord[]>([])
    const [securityData, setSecurityData] = useState<SecurityRecord[]>([])

    const [loading, setLoading] = useState(true)
    const [securityLoading, setSecurityLoading] = useState(false)
    const [securityLoaded, setSecurityLoaded] = useState(false)

    const [activeTab, setActiveTab] =
        useState<"running" | "old" | "security">("running")

    const [billPage, setBillPage] = useState(1)
    const [securityPage, setSecurityPage] = useState(1)

    const [selectedAction, setSelectedAction] = useState<
        | "preparedNotDispatched"
        | "dispatchedPaymentPending"
        | "salaryPaidPaymentPending"
        | "paymentReceivedSalaryUnpaid"
    >("dispatchedPaymentPending")

    const [selectedSecurityInsight, setSelectedSecurityInsight] = useState<
        "cashBlockedSites" | "bankGuaranteeOnlySites" | "multiSecuritySites" | "zeroSecuritySites"
    >("cashBlockedSites")

    const [billChartIndex, setBillChartIndex] = useState(0)
    const BILL_CHART_PAGE_SIZE = 4

    const [filters, setFilters] = useState({
        search: "",
        month: "",
        status: "All",
        delay: "All",
        fromDate: "",
        toDate: "",
    })

    async function loadData() {
        try {
            setLoading(true)

            const billingRes = await fetch("/api/finance/dashboard", {
                cache: "no-store",
            })

            const billingJson = await billingRes.json()
            const records: FinanceRecord[] = billingJson.records || []

            setBillingData(records)

            if (records.length) {
                const latestMonthList: string[] = records
                    .map((r: FinanceRecord) => String(r.month || ""))
                    .filter((month: string) => month.trim() !== "")

                const latestMonth =
                    Array.from(new Set<string>(latestMonthList))
                        .sort((a: string, b: string) =>
                            parseMonth(b).getTime() - parseMonth(a).getTime()
                        )[0] || ""

                setFilters(prev => ({
                    ...prev,
                    month: latestMonth,
                }))
            }
        } catch (error) {
            console.error("FM Outstanding billing load error:", error)
        } finally {
            setLoading(false)
        }
    }

    async function loadSecurityData(force = false) {
        if (!force && (securityLoaded || securityLoading)) return

        try {
            setSecurityLoading(true)

            const securityRes = await fetch("/api/finance/category3-collections", {
                cache: "no-store",
            })

            const securityJson = await securityRes.json()

            setSecurityData(securityJson.rows || [])
            setSecurityLoaded(true)
        } catch (error) {
            console.error("FM Outstanding security load error:", error)
        } finally {
            setSecurityLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        loadSecurityData()
    }, [])

    useEffect(() => {
        setBillPage(1)
        setSecurityPage(1)
    }, [filters, activeTab])

    useEffect(() => {
        setBillChartIndex(0)
    }, [activeTab, filters])

    const monthOptions = useMemo<string[]>(() => {
        const months: string[] = billingData
            .map((item: FinanceRecord) => String(item.month || ""))
            .filter((month: string) => month.trim() !== "")

        return Array.from(new Set<string>(months))
            .sort((a: string, b: string) =>
                parseMonth(b).getTime() - parseMonth(a).getTime()
            )
    }, [billingData])

    const selectedMonth = filters.month || monthOptions[0] || ""

    const runningMonths = useMemo(() => {
        if (!selectedMonth) return []
        return getRunningMonthKeys(selectedMonth)
    }, [selectedMonth])

    const runningKeys = useMemo(() => {
        return runningMonths.map(item => item.key)
    }, [runningMonths])

    const oldCutoffDate = useMemo(() => {
        if (!runningMonths.length) return new Date(0)

        const thirdMonth = runningMonths[2].date

        return new Date(
            thirdMonth.getFullYear(),
            thirdMonth.getMonth(),
            1
        )
    }, [runningMonths])

    const filteredBillingBase = useMemo(() => {
        return billingData.filter(row => {
            if (
                filters.search &&
                !row.siteName.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false
            }

            if (filters.status === "Collected" && !isYes(row.paymentCheque)) {
                return false
            }

            if (filters.status === "Pending" && !isNo(row.paymentCheque)) {
                return false
            }

            const delay = row.paymentReceivedDays || 0

            if (filters.delay === "0-7" && !(delay <= 7)) return false
            if (filters.delay === "8-15" && !(delay > 7 && delay <= 15)) return false
            if (filters.delay === "15+" && !(delay > 15)) return false

            const recordDate = parsePrepareDate(row.prepareDate)

            if ((filters.fromDate || filters.toDate) && !recordDate) {
                return false
            }

            if (recordDate && filters.fromDate) {
                const fromDate = new Date(filters.fromDate + "T00:00:00")

                if (recordDate < fromDate) {
                    return false
                }
            }

            if (recordDate && filters.toDate) {
                const toDate = new Date(filters.toDate + "T23:59:59")
                toDate.setHours(23, 59, 59, 999)

                if (recordDate > toDate) {
                    return false
                }
            }

            return true
        })
    }, [billingData, filters])

    const runningBillRows = useMemo(() => {
        return filteredBillingBase.filter(row =>
            runningKeys.includes(getMonthKey(row.month))
        )
    }, [filteredBillingBase, runningKeys])

    const oldBillRows = useMemo(() => {
        return filteredBillingBase.filter(row => {
            const rowDate = parseMonth(row.month)
            return rowDate < oldCutoffDate
        })
    }, [filteredBillingBase, oldCutoffDate])

    const filteredSecurityRows = useMemo(() => {
        return securityData.filter(row => {
            if (!filters.search) return true

            return row.siteName
                .toLowerCase()
                .includes(filters.search.toLowerCase())
        })
    }, [securityData, filters.search])

    function getBillSummary(rows: FinanceRecord[]) {
        let total = 0
        let collected = 0
        let pending = 0
        let pendingCount = 0
        let collectedCount = 0
        let highDelay = 0
        let preparedNotDispatchedAmount = 0
        let preparedNotDispatchedCount = 0
        let dispatchedPaymentPendingAmount = 0
        let dispatchedPaymentPendingCount = 0
        let salaryPaidPaymentPendingAmount = 0
        let salaryPaidPaymentPendingCount = 0
        let paymentReceivedSalaryUnpaidAmount = 0
        let paymentReceivedSalaryUnpaidCount = 0
        let missingBillAmount = 0
        let missingSalaryStatus = 0
        let missingPrepareDate = 0
        let missingPaymentDate = 0

        rows.forEach(row => {
            const amount = row.billAmount || 0
            total += amount

            if (isYes(row.paymentCheque)) {
                collected += amount
                collectedCount++
            } else {
                pending += amount
                pendingCount++
            }

            if (isNo(row.paymentCheque) && (row.paymentReceivedDays || 0) > 15) {
                highDelay++
            }

            if (isYes(row.prepared) && !isYes(row.dispatched)) {
                preparedNotDispatchedAmount += amount
                preparedNotDispatchedCount++
            }

            if (isYes(row.dispatched) && !isYes(row.paymentCheque)) {
                dispatchedPaymentPendingAmount += amount
                dispatchedPaymentPendingCount++
            }

            if (isPaid(row.salaryStatus) && !isYes(row.paymentCheque)) {
                salaryPaidPaymentPendingAmount += amount
                salaryPaidPaymentPendingCount++
            }

            if (isYes(row.paymentCheque) && isUnpaid(row.salaryStatus)) {
                paymentReceivedSalaryUnpaidAmount += amount
                paymentReceivedSalaryUnpaidCount++
            }

            if (row.billAmount === null || row.billAmount === undefined) {
                missingBillAmount++
            }

            if (!normalizeText(row.salaryStatus)) {
                missingSalaryStatus++
            }

            if (!row.prepareDate) {
                missingPrepareDate++
            }

            if (isYes(row.paymentCheque) && !row.receivedDate) {
                missingPaymentDate++
            }
        })

        const efficiency = total > 0
            ? Number(((collected / total) * 100).toFixed(1))
            : 0

        return {
            total,
            collected,
            pending,
            pendingCount,
            collectedCount,
            highDelay,
            efficiency,
            records: rows.length,
            preparedNotDispatchedAmount,
            preparedNotDispatchedCount,
            dispatchedPaymentPendingAmount,
            dispatchedPaymentPendingCount,
            salaryPaidPaymentPendingAmount,
            salaryPaidPaymentPendingCount,
            paymentReceivedSalaryUnpaidAmount,
            paymentReceivedSalaryUnpaidCount,
            missingBillAmount,
            missingSalaryStatus,
            missingPrepareDate,
            missingPaymentDate,
        }
    }

    const runningSummary = useMemo(
        () => getBillSummary(runningBillRows),
        [runningBillRows]
    )

    const oldSummary = useMemo(
        () => getBillSummary(oldBillRows),
        [oldBillRows]
    )

    const securitySummary = useMemo(() => {
        const totalEmd = filteredSecurityRows.reduce(
            (sum, row) => sum + Number(row.emd || 0),
            0
        )

        const totalBankGuarantee = filteredSecurityRows.reduce(
            (sum, row) => sum + Number(row.bankGuarantee || 0),
            0
        )

        const totalBillingSd = filteredSecurityRows.reduce(
            (sum, row) => sum + Number(row.billingSd || 0),
            0
        )

        const totalPerformanceFd = filteredSecurityRows.reduce(
            (sum, row) => sum + Number(row.performanceSecurityFd || 0),
            0
        )

        const cashBlocked =
            totalEmd +
            totalBillingSd +
            totalPerformanceFd

        return {
            totalSites: filteredSecurityRows.length,
            totalEmd,
            totalBankGuarantee,
            totalBillingSd,
            totalPerformanceFd,
            cashBlocked,
            guaranteeExposure: totalBankGuarantee,
            grandTotal:
                totalEmd +
                totalBankGuarantee +
                totalBillingSd +
                totalPerformanceFd,
        }
    }, [filteredSecurityRows])

    const securityInsights = useMemo(() => {
        let cashBlockedSites = 0
        let bankGuaranteeOnlySites = 0
        let multiSecuritySites = 0
        let zeroSecuritySites = 0

        filteredSecurityRows.forEach(row => {
            const emd = Number(row.emd || 0)
            const bankGuarantee = Number(row.bankGuarantee || 0)
            const billingSd = Number(row.billingSd || 0)
            const performanceFd = Number(row.performanceSecurityFd || 0)

            const cashBlocked =
                emd +
                billingSd +
                performanceFd

            const total =
                emd +
                bankGuarantee +
                billingSd +
                performanceFd

            const activeSecurityTypes = [
                emd,
                bankGuarantee,
                billingSd,
                performanceFd,
            ].filter(amount => amount > 0).length

            if (cashBlocked > 0) {
                cashBlockedSites++
            }

            if (
                bankGuarantee > 0 &&
                emd === 0 &&
                billingSd === 0 &&
                performanceFd === 0
            ) {
                bankGuaranteeOnlySites++
            }

            if (activeSecurityTypes >= 2) {
                multiSecuritySites++
            }

            if (total === 0) {
                zeroSecuritySites++
            }
        })

        return {
            cashBlockedSites,
            bankGuaranteeOnlySites,
            multiSecuritySites,
            zeroSecuritySites,
        }
    }, [filteredSecurityRows])

    const selectedSecurityInsightRows = useMemo(() => {
        return filteredSecurityRows
            .map(row => {
                const emd = Number(row.emd || 0)
                const bankGuarantee = Number(row.bankGuarantee || 0)
                const billingSd = Number(row.billingSd || 0)
                const performanceFd = Number(row.performanceSecurityFd || 0)

                const cashBlocked = emd + billingSd + performanceFd
                const total = emd + bankGuarantee + billingSd + performanceFd

                const activeSecurityTypes = [
                    { label: "EMD", amount: emd },
                    { label: "Bank Guarantee", amount: bankGuarantee },
                    { label: "Billing SD", amount: billingSd },
                    { label: "Performance FD", amount: performanceFd },
                ].filter(item => item.amount > 0)

                return {
                    ...row,
                    emd,
                    bankGuarantee,
                    billingSd,
                    performanceFd,
                    cashBlocked,
                    total,
                    activeSecurityTypes,
                }
            })
            .filter(row => {
                if (selectedSecurityInsight === "cashBlockedSites") {
                    return row.cashBlocked > 0
                }

                if (selectedSecurityInsight === "bankGuaranteeOnlySites") {
                    return (
                        row.bankGuarantee > 0 &&
                        row.emd === 0 &&
                        row.billingSd === 0 &&
                        row.performanceFd === 0
                    )
                }

                if (selectedSecurityInsight === "multiSecuritySites") {
                    return row.activeSecurityTypes.length >= 2
                }

                if (selectedSecurityInsight === "zeroSecuritySites") {
                    return row.total === 0
                }

                return false
            })
            .sort((a, b) => b.total - a.total)
    }, [filteredSecurityRows, selectedSecurityInsight])

    const securityInsightConfig = {
        cashBlockedSites: {
            title: "Cash Blocked Sites",
            subtitle: "Sites with EMD, Billing SD or Performance FD amount",
            tone: "amber",
        },
        bankGuaranteeOnlySites: {
            title: "BG Only Sites",
            subtitle: "Sites having only Bank Guarantee exposure",
            tone: "green",
        },
        multiSecuritySites: {
            title: "Multi Security Sites",
            subtitle: "Sites having two or more security types",
            tone: "violet",
        },
        zeroSecuritySites: {
            title: "Zero Security Sites",
            subtitle: "Sites where all security amount fields are zero",
            tone: "red",
        },
    } as const

    const activeBillRows =
        activeTab === "running"
            ? runningBillRows
            : oldBillRows

    const activeBillSummary =
        activeTab === "running"
            ? runningSummary
            : oldSummary

    const actionSummary = useMemo(() => {
        const allRows = [...runningBillRows, ...oldBillRows]

        return getBillSummary(allRows)
    }, [runningBillRows, oldBillRows])

    const actionConfig = {
        preparedNotDispatched: {
            title: "Prepared Not Dispatched",
            subtitle: "Bills are prepared but not dispatched to client",
            tone: "amber",
        },
        dispatchedPaymentPending: {
            title: "Dispatched Payment Pending",
            subtitle: "Bills are dispatched but payment is not received",
            tone: "red",
        },
        salaryPaidPaymentPending: {
            title: "Salary Paid, Payment Pending",
            subtitle: "Salary paid but client payment is still pending",
            tone: "blue",
        },
        paymentReceivedSalaryUnpaid: {
            title: "Payment Received, Salary Unpaid",
            subtitle: "Client payment received but salary still unpaid",
            tone: "green",
        },
    } as const

    const selectedActionRows = useMemo(() => {
        const allRows = [...runningBillRows, ...oldBillRows]

        if (selectedAction === "preparedNotDispatched") {
            return allRows.filter(row =>
                isYes(row.prepared) && !isYes(row.dispatched)
            )
        }

        if (selectedAction === "dispatchedPaymentPending") {
            return allRows.filter(row =>
                isYes(row.dispatched) && !isYes(row.paymentCheque)
            )
        }

        if (selectedAction === "salaryPaidPaymentPending") {
            return allRows.filter(row =>
                isPaid(row.salaryStatus) && !isYes(row.paymentCheque)
            )
        }

        if (selectedAction === "paymentReceivedSalaryUnpaid") {
            return allRows.filter(row =>
                isYes(row.paymentCheque) && isUnpaid(row.salaryStatus)
            )
        }

        return []
    }, [runningBillRows, oldBillRows, selectedAction])

    const selectedActionSites = useMemo(() => {
        const map = new Map<string, {
            siteName: string
            totalAmount: number
            months: string[]
            count: number
            maxAgeingDays: number
        }>()

        selectedActionRows.forEach(row => {
            const key = row.siteName.trim().toLowerCase()

            if (!map.has(key)) {
                map.set(key, {
                    siteName: row.siteName,
                    totalAmount: 0,
                    months: [],
                    count: 0,
                    maxAgeingDays: 0,
                })
            }

            const item = map.get(key)!
            const ageingDays = getAgeingDays(row)

            item.totalAmount += Number(row.billAmount || 0)
            item.count += 1
            item.maxAgeingDays = Math.max(item.maxAgeingDays, ageingDays)

            if (row.month && !item.months.includes(row.month)) {
                item.months.push(row.month)
            }
        })

        return Array.from(map.values())
            .map(item => ({
                ...item,
                months: item.months.sort(
                    (a, b) => parseMonth(b).getTime() - parseMonth(a).getTime()
                ),
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount)
    }, [selectedActionRows])

    const selectedActionAmount = useMemo(() => {
        return selectedActionRows.reduce(
            (sum, row) => sum + Number(row.billAmount || 0),
            0
        )
    }, [selectedActionRows])

    const billChartData = useMemo(() => {
        const map = new Map<string, any>()

        activeBillRows.forEach(row => {
            if (!map.has(row.month)) {
                map.set(row.month, {
                    month: row.month,
                    bill: 0,
                    collected: 0,
                    pending: 0,
                })
            }

            const item = map.get(row.month)
            const amount = row.billAmount || 0

            item.bill += amount

            if (isYes(row.paymentCheque)) {
                item.collected += amount
            } else {
                item.pending += amount
            }
        })

        return Array.from(map.values()).sort(
            (a, b) => parseMonth(a.month).getTime() - parseMonth(b.month).getTime()
        )
    }, [activeBillRows])

    const paginatedBillChartData = useMemo(() => {
        return billChartData.slice(
            billChartIndex,
            billChartIndex + BILL_CHART_PAGE_SIZE
        )
    }, [billChartData, billChartIndex])

    const isBillChartPrevDisabled = billChartIndex === 0

    const isBillChartNextDisabled =
        billChartIndex + BILL_CHART_PAGE_SIZE >= billChartData.length

    const collectionEfficiencyTrend = useMemo(() => {
        return billChartData.map(item => ({
            month: item.month,
            efficiency: item.bill > 0
                ? Number(((item.collected / item.bill) * 100).toFixed(1))
                : 0,
        }))
    }, [billChartData])

    const billPieData = useMemo(() => {
        return [
            {
                name: "Collected",
                value: activeBillSummary.collected,
            },
            {
                name: "Pending",
                value: activeBillSummary.pending,
            },
        ]
    }, [activeBillSummary])

    const securityChartData = useMemo(() => {
        return [
            { name: "EMD", value: securitySummary.totalEmd },
            { name: "Bank Guarantee", value: securitySummary.totalBankGuarantee },
            { name: "Billing SD", value: securitySummary.totalBillingSd },
            { name: "Performance FD", value: securitySummary.totalPerformanceFd },
        ]
    }, [securitySummary])

    const ageingChartData = useMemo(() => {
        const buckets: Record<string, number> = {
            "0-30": 0,
            "31-60": 0,
            "61-90": 0,
            "90+": 0,
        }

        activeBillRows
            .filter(row => !isYes(row.paymentCheque))
            .forEach(row => {
                const days = getAgeingDays(row)
                const bucket = getAgeingBucket(days)

                buckets[bucket] += Number(row.billAmount || 0)
            })

        return [
            { name: "0-30 Days", shortName: "0-30", value: buckets["0-30"] },
            { name: "31-60 Days", shortName: "31-60", value: buckets["31-60"] },
            { name: "61-90 Days", shortName: "61-90", value: buckets["61-90"] },
            { name: "90+ Days", shortName: "90+", value: buckets["90+"] },
        ]
    }, [activeBillRows])

    const totalBillPages = Math.max(
        1,
        Math.ceil(activeBillRows.length / BILL_PAGE_SIZE)
    )

    const totalSecurityPages = Math.max(
        1,
        Math.ceil(filteredSecurityRows.length / SECURITY_PAGE_SIZE)
    )

    const paginatedBillRows = useMemo(() => {
        const start = (billPage - 1) * BILL_PAGE_SIZE
        return activeBillRows.slice(start, start + BILL_PAGE_SIZE)
    }, [activeBillRows, billPage])

    const paginatedSecurityRows = useMemo(() => {
        const start = (securityPage - 1) * SECURITY_PAGE_SIZE
        return filteredSecurityRows.slice(start, start + SECURITY_PAGE_SIZE)
    }, [filteredSecurityRows, securityPage])

    const topPendingSites = useMemo(() => {
        const map = new Map<string, {
            siteName: string
            totalAmount: number
            months: string[]
            count: number
            maxAgeingDays: number
        }>()

        activeBillRows
            .filter(row => !isYes(row.paymentCheque))
            .forEach(row => {
                const key = row.siteName.trim().toLowerCase()

                if (!map.has(key)) {
                    map.set(key, {
                        siteName: row.siteName,
                        totalAmount: 0,
                        months: [],
                        count: 0,
                        maxAgeingDays: 0,
                    })
                }

                const item = map.get(key)!
                const days = getAgeingDays(row)

                item.totalAmount += Number(row.billAmount || 0)
                item.count += 1
                item.maxAgeingDays = Math.max(item.maxAgeingDays, days)

                if (row.month && !item.months.includes(row.month)) {
                    item.months.push(row.month)
                }
            })

        return Array.from(map.values())
            .map(item => ({
                ...item,
                months: item.months.sort(
                    (a, b) => parseMonth(b).getTime() - parseMonth(a).getTime()
                ),
            }))
            .sort((a, b) => {
                if (b.totalAmount !== a.totalAmount) {
                    return b.totalAmount - a.totalAmount
                }

                return b.maxAgeingDays - a.maxAgeingDays
            })

    }, [activeBillRows])

    const highestSecuritySites = useMemo(() => {
        return [...filteredSecurityRows]
            .map(row => ({
                ...row,
                total:
                    Number(row.emd || 0) +
                    Number(row.bankGuarantee || 0) +
                    Number(row.billingSd || 0) +
                    Number(row.performanceSecurityFd || 0),
            }))
            .filter(row => row.total > 0)
            .sort((a, b) => b.total - a.total)
    }, [filteredSecurityRows])

    if (loading) {
        return (
            <div className="p-8 text-slate-600">
                Loading FM Outstanding...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="space-y-6">

                {/* TOP SUMMARY */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Running Outstanding"
                        value={formatCurrency(runningSummary.pending)}
                        subtitle={`${runningSummary.pendingCount} pending bills in last 3 months`}
                        icon={TrendingUp}
                        tone="blue"
                    />

                    <KpiCard
                        title="Old Outstanding"
                        value={formatCurrency(oldSummary.pending)}
                        subtitle={`${oldSummary.pendingCount} pending bills older than running period`}
                        icon={AlertTriangle}
                        tone="red"
                    />

                    <KpiCard
                        title="Cash Blocked"
                        value={formatCurrency(securitySummary.cashBlocked)}
                        subtitle="EMD + Billing SD + Performance FD"
                        icon={WalletCards}
                        tone="amber"
                    />

                    <KpiCard
                        title="Guarantee Exposure"
                        value={formatCurrency(securitySummary.guaranteeExposure)}
                        subtitle="Bank Guarantee exposure"
                        icon={ShieldCheck}
                        tone="violet"
                    />
                </div>

                {/* ACTION ALERTS */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <button
                        onClick={() => setSelectedAction("preparedNotDispatched")}
                        className={`text-left rounded-3xl transition ${selectedAction === "preparedNotDispatched"
                            ? "ring-2 ring-amber-500 ring-offset-2"
                            : ""
                            }`}
                    >
                        <ActionCard
                            title="Prepared Not Dispatched"
                            value={formatCurrency(actionSummary.preparedNotDispatchedAmount)}
                            subtitle={`${actionSummary.preparedNotDispatchedCount} bills prepared but not dispatched`}
                            tone="amber"
                            icon={Send}
                        />
                    </button>

                    <button
                        onClick={() => setSelectedAction("dispatchedPaymentPending")}
                        className={`text-left rounded-3xl transition ${selectedAction === "dispatchedPaymentPending"
                            ? "ring-2 ring-rose-500 ring-offset-2"
                            : ""
                            }`}
                    >
                        <ActionCard
                            title="Dispatched Payment Pending"
                            value={formatCurrency(actionSummary.dispatchedPaymentPendingAmount)}
                            subtitle={`${actionSummary.dispatchedPaymentPendingCount} dispatched bills unpaid`}
                            tone="red"
                            icon={Clock}
                        />
                    </button>

                    <button
                        onClick={() => setSelectedAction("salaryPaidPaymentPending")}
                        className={`text-left rounded-3xl transition ${selectedAction === "salaryPaidPaymentPending"
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : ""
                            }`}
                    >
                        <ActionCard
                            title="Salary Paid, Payment Pending"
                            value={formatCurrency(actionSummary.salaryPaidPaymentPendingAmount)}
                            subtitle={`${actionSummary.salaryPaidPaymentPendingCount} cashflow risk cases`}
                            tone="blue"
                            icon={ReceiptIndianRupee}
                        />
                    </button>

                    <button
                        onClick={() => setSelectedAction("paymentReceivedSalaryUnpaid")}
                        className={`text-left rounded-3xl transition ${selectedAction === "paymentReceivedSalaryUnpaid"
                            ? "ring-2 ring-emerald-500 ring-offset-2"
                            : ""
                            }`}
                    >
                        <ActionCard
                            title="Payment Received, Salary Unpaid"
                            value={formatCurrency(actionSummary.paymentReceivedSalaryUnpaidAmount)}
                            subtitle={`${actionSummary.paymentReceivedSalaryUnpaidCount} salary follow-up cases`}
                            tone="green"
                            icon={BadgeCheck}
                        />
                    </button>
                </div>

                {/* SMART ACTION DETAIL PANEL */}
                <SectionCard
                    title={`${actionConfig[selectedAction].title} Details`}
                    subtitle={actionConfig[selectedAction].subtitle}
                >
                    {/* Compact Summary */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
                        <div className="rounded-2xl bg-slate-50 border px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Total Sites
                            </p>
                            <h3 className="mt-1 text-xl font-black text-slate-900">
                                {selectedActionSites.length}
                            </h3>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Total Records
                            </p>
                            <h3 className="mt-1 text-xl font-black text-slate-900">
                                {selectedActionRows.length}
                            </h3>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Total Amount
                            </p>
                            <h3 className="mt-1 text-xl font-black text-slate-900">
                                {formatCurrency(selectedActionAmount)}
                            </h3>
                        </div>
                    </div>

                    {/* Top Site Chips */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Top Sites
                            </p>

                            <p className="text-xs text-slate-400">
                                Scroll horizontally to view more
                            </p>
                        </div>

                        <div className="overflow-x-auto pb-2">
                            <div className="flex w-max gap-3">
                                {selectedActionSites.length === 0 ? (
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                        No sites found.
                                    </div>
                                ) : (
                                    selectedActionSites.map((site, index) => (
                                        <div
                                            key={`${site.siteName}-${index}`}
                                            className="w-[260px] shrink-0 rounded-2xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition"
                                        >
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {site.siteName}
                                            </p>

                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                <p className="text-xs text-slate-500">
                                                    {site.count} record{site.count > 1 ? "s" : ""}
                                                </p>

                                                <p className="text-sm font-black text-rose-600">
                                                    {formatCurrency(site.totalAmount)}
                                                </p>
                                            </div>

                                            <p className="mt-1 truncate text-[11px] text-slate-400">
                                                {site.months.join(", ")}

                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Compact Table */}
                    <div className="overflow-hidden rounded-2xl border">
                        <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                                        <th className="p-3 text-left">Site Name</th>
                                        <th className="p-3 text-left">Month</th>
                                        <th className="p-3 text-right">Bill Amount</th>
                                        <th className="p-3 text-left">Prepared</th>
                                        <th className="p-3 text-left">Dispatched</th>
                                        <th className="p-3 text-left">Payment</th>
                                        <th className="p-3 text-left">Salary</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedActionRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-slate-500">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedActionRows.map((row, index) => (
                                            <tr
                                                key={`${row.id}-${index}`}
                                                className="border-b hover:bg-slate-50"
                                            >
                                                <td className="p-3 font-semibold text-slate-800">
                                                    {row.siteName}
                                                </td>

                                                <td className="p-3 text-slate-600">
                                                    {row.month}
                                                </td>

                                                <td className="p-3 text-right font-bold">
                                                    {formatCurrency(row.billAmount || 0)}
                                                </td>

                                                <td className="p-3">
                                                    <YesNoBadge value={row.prepared} />
                                                </td>

                                                <td className="p-3">
                                                    <YesNoBadge value={row.dispatched} />
                                                </td>

                                                <td className="p-3">
                                                    <StatusBadge status={getBillStatus(row)} />
                                                </td>

                                                <td className="p-3">
                                                    {row.salaryStatus || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t bg-slate-50 p-3 text-xs text-slate-500">
                            Showing {selectedActionRows.length} record
                            {selectedActionRows.length > 1 ? "s" : ""}. Scroll inside the table to view all.
                        </div>
                    </div>
                </SectionCard>

                {/* FILTERS */}
                <div className="rounded-3xl border bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

                        <div className="flex flex-col gap-1 xl:col-span-2">
                            <label className="text-xs font-medium text-slate-500">
                                Search
                            </label>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters(prev => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    placeholder="Search site..."
                                    className="w-full rounded-2xl border px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500">
                                Base Month
                            </label>

                            <select
                                value={filters.month}
                                onChange={(e) =>
                                    setFilters(prev => ({
                                        ...prev,
                                        month: e.target.value,
                                    }))
                                }
                                className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {monthOptions.map(month => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500">
                                Payment Status
                            </label>

                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters(prev => ({
                                        ...prev,
                                        status: e.target.value,
                                    }))
                                }
                                className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="All">All Status</option>
                                <option value="Collected">Collected</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500">
                                Delay
                            </label>

                            <select
                                value={filters.delay}
                                onChange={(e) =>
                                    setFilters(prev => ({
                                        ...prev,
                                        delay: e.target.value,
                                    }))
                                }
                                className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="All">All Delay</option>
                                <option value="0-7">0-7 Days</option>
                                <option value="8-15">8-15 Days</option>
                                <option value="15+">15+ Days</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500">
                                From Date
                            </label>

                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) =>
                                    setFilters(prev => ({
                                        ...prev,
                                        fromDate: e.target.value,
                                    }))
                                }
                                className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500">
                                To Date
                            </label>

                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) =>
                                    setFilters(prev => ({
                                        ...prev,
                                        toDate: e.target.value,
                                    }))
                                }
                                className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={() =>
                                setFilters({
                                    search: "",
                                    month: monthOptions[0] || "",
                                    status: "All",
                                    delay: "All",
                                    fromDate: "",
                                    toDate: "",
                                })
                            }
                            className="h-[42px] self-end rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"                        >
                            Clear
                        </button>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Running period:{" "}
                        <span className="font-bold text-slate-950">
                            {runningMonths.map(item => item.label).join(" , ")}
                        </span>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setActiveTab("running")}
                        className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${activeTab === "running"
                            ? "bg-blue-600 text-white shadow"
                            : "bg-white text-slate-600 border hover:bg-slate-50"
                            }`}
                    >
                        Running Bill
                    </button>

                    <button
                        onClick={() => setActiveTab("old")}
                        className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${activeTab === "old"
                            ? "bg-rose-600 text-white shadow"
                            : "bg-white text-slate-600 border hover:bg-slate-50"
                            }`}
                    >
                        Old Bill
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("security")
                            loadSecurityData()
                        }}
                        className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${activeTab === "security"
                            ? "bg-violet-600 text-white shadow"
                            : "bg-white text-slate-600 border hover:bg-slate-50"
                            }`}
                    >
                        EMD, FD and SD
                    </button>
                </div>

                {/* BILL TABS */}
                {activeTab !== "security" && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                title="Total Bills"
                                value={activeBillSummary.records}
                                subtitle="Records found"
                                icon={FileText}
                                tone="slate"
                            />

                            <KpiCard
                                title="Billing Amount"
                                value={formatCurrency(activeBillSummary.total)}
                                subtitle="Total bill value"
                                icon={Banknote}
                                tone="blue"
                            />

                            <KpiCard
                                title="Collected"
                                value={formatCurrency(activeBillSummary.collected)}
                                subtitle={`${activeBillSummary.efficiency}% collection efficiency`}
                                icon={WalletCards}
                                tone="green"
                            />

                            <KpiCard
                                title="Pending"
                                value={formatCurrency(activeBillSummary.pending)}
                                subtitle={`${activeBillSummary.pendingCount} pending bills`}
                                icon={AlertTriangle}
                                tone="red"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-950">
                                            {activeTab === "running"
                                                ? "Running Bill Trend"
                                                : "Old Bill Trend"}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Month wise billing, collection and pending movement
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setBillChartIndex(prev =>
                                                    Math.max(prev - BILL_CHART_PAGE_SIZE, 0)
                                                )
                                            }
                                            disabled={isBillChartPrevDisabled}
                                            className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                                        >
                                            Prev
                                        </button>

                                        <button
                                            onClick={() =>
                                                setBillChartIndex(prev =>
                                                    prev + BILL_CHART_PAGE_SIZE < billChartData.length
                                                        ? prev + BILL_CHART_PAGE_SIZE
                                                        : prev
                                                )
                                            }
                                            disabled={isBillChartNextDisabled}
                                            className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={paginatedBillChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 11 }}
                                                interval={0}
                                            />

                                            <YAxis
                                                tickFormatter={(val) =>
                                                    `₹${(Number(val) / 100000).toFixed(1)}L`
                                                }
                                            />

                                            <Tooltip
                                                formatter={(val) =>
                                                    formatCurrency(Number(val))
                                                }
                                            />

                                            <Bar
                                                dataKey="bill"
                                                fill="#6366f1"
                                                radius={[10, 10, 0, 0]}
                                            />

                                            <Bar
                                                dataKey="collected"
                                                fill="#22c55e"
                                                radius={[10, 10, 0, 0]}
                                            />

                                            <Bar
                                                dataKey="pending"
                                                fill="#ef4444"
                                                radius={[10, 10, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <SectionCard
                                title="Pending Payment Ageing"
                                subtitle="How many days payments have been pending from bill prepare date"

                            >
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ageingChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                            />

                                            <YAxis
                                                tickFormatter={(val) => `₹${(Number(val) / 100000).toFixed(1)}L`}
                                            />

                                            <Tooltip
                                                formatter={(val) => [
                                                    formatCurrency(Number(val)),
                                                    "Pending Amount",
                                                ]}
                                                labelFormatter={(label) => `${label} Pending`}
                                            />

                                            <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </SectionCard>


                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
                            {/* <SectionCard
                                title="Collection Status"
                                subtitle="Collected vs pending split"
                            >
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={billPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={70}
                                                outerRadius={105}
                                                label={({ name, percent }) =>
                                                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                                }
                                            >
                                                <Cell fill="#22c55e" />
                                                <Cell fill="#ef4444" />
                                            </Pie>

                                            <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </SectionCard> */}

                            <SectionCard
                                title="Pending Payment Sites"
                            >
                                <div className="max-h-[420px] overflow-y-auto pr-2">
                                    {topPendingSites.length === 0 ? (
                                        <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                                            No pending bills found.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            {topPendingSites.map((site, index) => (
                                                <div
                                                    key={`${site.siteName}-${index}`}
                                                    className="rounded-2xl border bg-white p-4 hover:bg-slate-50 transition"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {site.siteName}
                                                            </p>

                                                            <p
                                                                className="mt-1 text-xs text-slate-500"
                                                                title={site.months.join(", ")}
                                                            >
                                                                {site.months.join(", ")}
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-400">
                                                                {site.count} pending bill{site.count > 1 ? "s" : ""} •{" "}
                                                                {site.months.length} month{site.months.length > 1 ? "s" : ""} •{" "}
                                                                oldest {site.maxAgeingDays} days
                                                            </p>
                                                        </div>

                                                        <p className="shrink-0 text-sm font-black text-rose-600">
                                                            {formatCurrency(site.totalAmount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        <SectionCard
                            title={
                                activeTab === "running"
                                    ? "Running Bill Details"
                                    : "Old Bill Details"
                            }
                            subtitle="Detailed site wise outstanding records"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                                            <th className="p-4">Site Name</th>
                                            <th className="p-4">Month</th>
                                            <th className="p-4 text-right">Bill Amount</th>
                                            <th className="p-4">Payment</th>
                                            <th className="p-4">Ageing</th>
                                            <th className="p-4">Prepared</th>
                                            <th className="p-4">Dispatched</th>
                                            <th className="p-4">Salary</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedBillRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-slate-500">
                                                    No records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedBillRows.map((row, index) => (
                                                <tr
                                                    key={`${row.id}-${index}`}
                                                    className="border-b hover:bg-slate-50"
                                                >
                                                    <td className="p-4 font-semibold text-slate-800">
                                                        {row.siteName}
                                                    </td>

                                                    <td className="p-4 text-slate-600">
                                                        {row.month}
                                                    </td>

                                                    <td className="p-4 text-right font-bold">
                                                        {formatCurrency(row.billAmount || 0)}
                                                    </td>

                                                    <td className="p-4">
                                                        <StatusBadge status={getBillStatus(row)} />
                                                    </td>

                                                    <td className="p-4 text-slate-600">
                                                        {getAgeingDays(row)} days
                                                    </td>

                                                    <td className="p-4">
                                                        <YesNoBadge value={row.prepared} />
                                                    </td>

                                                    <td className="p-4">
                                                        <YesNoBadge value={row.dispatched} />
                                                    </td>

                                                    <td className="p-4">
                                                        {row.salaryStatus || "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                page={billPage}
                                totalPages={totalBillPages}
                                onPrev={() => setBillPage(prev => Math.max(prev - 1, 1))}
                                onNext={() => setBillPage(prev => Math.min(prev + 1, totalBillPages))}
                            />
                        </SectionCard>
                    </>
                )}

                {/* SECURITY LOADING */}
                {activeTab === "security" && securityLoading && (
                    <div className="rounded-3xl border bg-white p-8 text-center text-slate-500 shadow-sm">
                        Loading EMD, FD and SD data...
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === "security" && !securityLoading && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                title="Total Sites"
                                value={securitySummary.totalSites}
                                subtitle="Security records"
                                icon={FileText}
                                tone="slate"
                            />

                            <KpiCard
                                title="Cash Blocked"
                                value={formatCurrency(securitySummary.cashBlocked)}
                                subtitle="EMD + Billing SD + Performance FD"
                                icon={WalletCards}
                                tone="amber"
                            />

                            <KpiCard
                                title="Bank Guarantee"
                                value={formatCurrency(securitySummary.guaranteeExposure)}
                                subtitle="Guarantee exposure"
                                icon={ShieldCheck}
                                tone="green"
                            />

                            <KpiCard
                                title="Security Exposure"
                                value={formatCurrency(securitySummary.grandTotal)}
                                subtitle="Total security / guarantee exposure"
                                icon={IndianRupee}
                                tone="violet"
                            />


                        </div>

                        {/* SECURITY INSIGHTS */}
                        <SectionCard
                            title="Security Insights"
                            subtitle="Click any card to view included sites"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <button
                                    onClick={() => setSelectedSecurityInsight("cashBlockedSites")}
                                    className={`text-left rounded-2xl transition ${selectedSecurityInsight === "cashBlockedSites"
                                        ? "ring-2 ring-amber-400 ring-offset-2"
                                        : ""
                                        }`}
                                >
                                    <InsightMiniCard
                                        title="Cash Blocked Sites"
                                        value={securityInsights.cashBlockedSites}
                                        subtitle="Sites with EMD / Billing SD / FD amount"
                                        tone="amber"
                                    />
                                </button>

                                <button
                                    onClick={() => setSelectedSecurityInsight("bankGuaranteeOnlySites")}
                                    className={`text-left rounded-2xl transition ${selectedSecurityInsight === "bankGuaranteeOnlySites"
                                        ? "ring-2 ring-emerald-400 ring-offset-2"
                                        : ""
                                        }`}
                                >
                                    <InsightMiniCard
                                        title="BG Only Sites"
                                        value={securityInsights.bankGuaranteeOnlySites}
                                        subtitle="Sites having only Bank Guarantee"
                                        tone="green"
                                    />
                                </button>

                                <button
                                    onClick={() => setSelectedSecurityInsight("multiSecuritySites")}
                                    className={`text-left rounded-2xl transition ${selectedSecurityInsight === "multiSecuritySites"
                                        ? "ring-2 ring-violet-400 ring-offset-2"
                                        : ""
                                        }`}
                                >
                                    <InsightMiniCard
                                        title="Multi Security Sites"
                                        value={securityInsights.multiSecuritySites}
                                        subtitle="Sites having 2 or more security types"
                                        tone="violet"
                                    />
                                </button>

                                <button
                                    onClick={() => setSelectedSecurityInsight("zeroSecuritySites")}
                                    className={`text-left rounded-2xl transition ${selectedSecurityInsight === "zeroSecuritySites"
                                        ? "ring-2 ring-rose-400 ring-offset-2"
                                        : ""
                                        }`}
                                >
                                    <InsightMiniCard
                                        title="Zero Security Sites"
                                        value={securityInsights.zeroSecuritySites}
                                        subtitle="Check if zero amount is valid or missing"
                                        tone="red"
                                    />
                                </button>
                            </div>

                            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900">
                                            {securityInsightConfig[selectedSecurityInsight].title}
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            {securityInsightConfig[selectedSecurityInsight].subtitle}
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-slate-700">
                                        {selectedSecurityInsightRows.length} site
                                        {selectedSecurityInsightRows.length > 1 ? "s" : ""}
                                    </p>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto pr-1">
                                    {selectedSecurityInsightRows.length === 0 ? (
                                        <div className="rounded-xl bg-white p-5 text-center text-sm text-slate-500">
                                            No sites found.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {selectedSecurityInsightRows.map((site, index) => (
                                                <div
                                                    key={`${site.siteName}-${index}`}
                                                    className="rounded-2xl border bg-white p-4 shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {site.siteName}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Sr.No {site.srNo}
                                                            </p>

                                                            <p className="mt-2 text-xs text-slate-500">
                                                                {site.activeSecurityTypes.length > 0
                                                                    ? site.activeSecurityTypes
                                                                        .map(item => item.label)
                                                                        .join(" + ")
                                                                    : "No security amount"}
                                                            </p>
                                                        </div>

                                                        <p className="shrink-0 text-sm font-black text-violet-700">
                                                            {formatCurrency(site.total)}
                                                        </p>
                                                    </div>

                                                    {selectedSecurityInsight !== "zeroSecuritySites" && (
                                                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                                                            <div>EMD: {formatCurrency(site.emd)}</div>
                                                            <div>BG: {formatCurrency(site.bankGuarantee)}</div>
                                                            <div>Billing SD: {formatCurrency(site.billingSd)}</div>
                                                            <div>FD: {formatCurrency(site.performanceFd)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <SectionCard
                                title="Security Exposure Distribution"
                                subtitle="EMD, Bank Guarantee, Billing SD and Performance FD"
                            >
                                <div className="h-[330px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={securityChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis tickFormatter={(val) => `₹${(Number(val) / 100000).toFixed(1)}L`} />
                                            <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                                            <Bar dataKey="value" fill="#7c3aed" radius={[12, 12, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </SectionCard>

                            <SectionCard
                                title="Sites with Highest Blocked Security Amount"
                                subtitle="Total of EMD, Bank Guarantee, Billing SD and Performance FD site-wise"
                            >
                                <div className="max-h-[330px] overflow-y-auto">
                                    {highestSecuritySites.map((row, index) => (
                                        <div
                                            key={`${row.siteName}-${index}`}
                                            className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 hover:bg-slate-50"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {row.siteName}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    Sr.No {row.srNo}
                                                </p>
                                            </div>

                                            <p className="text-sm font-black text-violet-700">
                                                {formatCurrency(row.total)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        </div>

                        <SectionCard
                            title="EMD, FD and SD Details"
                            subtitle="Site-wise blocked money and guarantee exposure"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                                            <th className="p-4">Sr.No</th>
                                            <th className="p-4">Site Name</th>
                                            <th className="p-4 text-right">EMD</th>
                                            <th className="p-4 text-right">Bank Guarantee</th>
                                            <th className="p-4 text-right">Billing SD</th>
                                            <th className="p-4 text-right">Performance FD</th>
                                            <th className="p-4 text-right">Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedSecurityRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                                    No security records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedSecurityRows.map((row, index) => {
                                                const total =
                                                    Number(row.emd || 0) +
                                                    Number(row.bankGuarantee || 0) +
                                                    Number(row.billingSd || 0) +
                                                    Number(row.performanceSecurityFd || 0)

                                                return (
                                                    <tr
                                                        key={`${row.siteName}-${index}`}
                                                        className="border-b hover:bg-slate-50"
                                                    >
                                                        <td className="p-4">
                                                            {row.srNo}
                                                        </td>

                                                        <td className="p-4 font-semibold text-slate-800">
                                                            {row.siteName}
                                                        </td>

                                                        <td className="p-4 text-right">
                                                            {formatCurrency(row.emd || 0)}
                                                        </td>

                                                        <td className="p-4 text-right">
                                                            {formatCurrency(row.bankGuarantee || 0)}
                                                        </td>

                                                        <td className="p-4 text-right">
                                                            {formatCurrency(row.billingSd || 0)}
                                                        </td>

                                                        <td className="p-4 text-right">
                                                            {formatCurrency(row.performanceSecurityFd || 0)}
                                                        </td>

                                                        <td className="p-4 text-right font-black text-violet-700">
                                                            {formatCurrency(total)}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                page={securityPage}
                                totalPages={totalSecurityPages}
                                onPrev={() => setSecurityPage(prev => Math.max(prev - 1, 1))}
                                onNext={() => setSecurityPage(prev => Math.min(prev + 1, totalSecurityPages))}
                            />
                        </SectionCard>
                    </>
                )}
            </div>
        </div>
    )
}

/* ================= PAGINATION ================= */

function Pagination({
    page,
    totalPages,
    onPrev,
    onNext,
}: {
    page: number
    totalPages: number
    onPrev: () => void
    onNext: () => void
}) {
    return (
        <div className="mt-5 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-slate-500">
                Page <span className="font-bold text-slate-800">{page}</span> of{" "}
                <span className="font-bold text-slate-800">{totalPages}</span>
            </p>

            <div className="flex gap-2">
                <button
                    onClick={onPrev}
                    disabled={page <= 1}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                >
                    Previous
                </button>

                <button
                    onClick={onNext}
                    disabled={page >= totalPages}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                >
                    Next
                </button>
            </div>
        </div>
    )
}
