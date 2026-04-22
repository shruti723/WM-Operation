"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PettyCashPage() {
  const router = useRouter()

  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [form, setForm] = useState({
    siteName: "",
    paymentDate: "",
    individualName: "",
    fixedAmount: "",
    amountPaid: "",
    additionalRequestRaised: "",
    lastDisbursement: "",
    pettyCashStatement: "",
    auditStatus: "",
    auditObservationStatus: "",
    purpose: "",
    currentExpenditureStatus: "",
    remarks: "",
  })

  // 🔐 Protect route
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}")

    if (!user || user.role !== "account2") {
      router.push("/login")
    }
  }, [])

  // 📥 Fetch data
  async function fetchRecords() {
    const res = await fetch("/api/petty-cash")
    const data = await res.json()
    if (data.success) setRecords(data.records)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // 🧾 Handle input
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 💾 Submit
  const handleSubmit = async () => {
    setLoading(true)

    const method = editId ? "PUT" : "POST"
    const url = editId
      ? `/api/petty-cash/${editId}`
      : "/api/petty-cash"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setForm({
      siteName: "",
      paymentDate: "",
      individualName: "",
      fixedAmount: "",
      amountPaid: "",
      additionalRequestRaised: "",
      lastDisbursement: "",
      pettyCashStatement: "",
      auditStatus: "",
      auditObservationStatus: "",
      purpose: "",
      currentExpenditureStatus: "",
      remarks: "",
    })

    setEditId(null)
    fetchRecords()
    setLoading(false)
  }

  // ✏️ Edit
  const handleEdit = (row: any) => {
    setEditId(row.id)
    setForm({
      siteName: row.siteName || "",
      paymentDate: row.paymentDate || "",
      individualName: row.individualName || "",
      fixedAmount: row.fixedAmount || "",
      amountPaid: row.amountPaid || "",
      additionalRequestRaised: row.additionalRequestRaised || "",
      lastDisbursement: row.lastDisbursement || "",
      pettyCashStatement: row.pettyCashStatement || "",
      auditStatus: row.auditStatus || "",
      auditObservationStatus: row.auditObservationStatus || "",
      purpose: row.purpose || "",
      currentExpenditureStatus: row.currentExpenditureStatus || "",
      remarks: row.remarks || "",
    })
  }

  return (
    <div className="p-6 space-y-6">

      {/* 🧾 FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Petty Cash Entry</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-3 gap-4">
          <Input name="siteName" placeholder="Site Name" value={form.siteName} onChange={handleChange} />
          <Input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} />

          <Input name="individualName" placeholder="Individual Name" value={form.individualName} onChange={handleChange} />
          <Input name="fixedAmount" placeholder="Fixed Amount" value={form.fixedAmount} onChange={handleChange} />
          <Input name="amountPaid" placeholder="Amount Paid" value={form.amountPaid} onChange={handleChange} />

          <Input name="additionalRequestRaised" placeholder="Additional Request" value={form.additionalRequestRaised} onChange={handleChange} />
          <Input name="lastDisbursement" placeholder="Last Disbursement" value={form.lastDisbursement} onChange={handleChange} />
          <Input name="pettyCashStatement" placeholder="Petty Cash Statement" value={form.pettyCashStatement} onChange={handleChange} />

          <Input name="auditStatus" placeholder="Audit Status" value={form.auditStatus} onChange={handleChange} />
          <Input name="auditObservationStatus" placeholder="Audit Observation Status" value={form.auditObservationStatus} onChange={handleChange} />
          <Input name="purpose" placeholder="Purpose" value={form.purpose} onChange={handleChange} />

          <Input name="currentExpenditureStatus" placeholder="Expenditure Status" value={form.currentExpenditureStatus} onChange={handleChange} />
          <Input name="remarks" placeholder="Remarks" value={form.remarks} onChange={handleChange} />

          <div className="col-span-3 flex gap-3">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editId ? "Update" : "Save"}
            </Button>

            {editId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditId(null)
                  setForm({
                    siteName: "",
                    paymentDate: "",
                    individualName: "",
                    fixedAmount: "",
                    amountPaid: "",
                    additionalRequestRaised: "",
                    lastDisbursement: "",
                    pettyCashStatement: "",
                    auditStatus: "",
                    auditObservationStatus: "",
                    purpose: "",
                    currentExpenditureStatus: "",
                    remarks: "",
                  })
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 📊 TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Petty Cash Records</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Site</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Fixed</th>
                <th className="p-2 border">Paid</th>
                <th className="p-2 border">Purpose</th>
                <th className="p-2 border">Audit</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((row) => (
                <tr key={row.id}>
                  <td className="p-2 border">{row.siteName}</td>
                  <td className="p-2 border">{row.paymentDate}</td>
                  <td className="p-2 border">{row.individualName}</td>
                  <td className="p-2 border">{row.fixedAmount}</td>
                  <td className="p-2 border">{row.amountPaid}</td>
                  <td className="p-2 border">{row.purpose}</td>
                  <td className="p-2 border">{row.auditStatus}</td>
                  <td className="p-2 border">
                    <Button size="sm" onClick={() => handleEdit(row)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  )
}