export default function DashboardTable() {

    const data = [
        { site: "Alpha Tower", type: "Finance", status: "Completed", deadline: "2026-03-18", updated: "2026-03-17" },
        { site: "Beta Complex", type: "Petty Cash", status: "Pending", deadline: "2026-03-23", updated: "2026-03-20" },
        { site: "Gamma Plaza", type: "Manpower", status: "Overdue", deadline: "2026-03-15", updated: "2026-03-14" },
    ]

    const statusColor: any = {
        Completed: "bg-green-100 text-green-700",
        Pending: "bg-yellow-100 text-yellow-700",
        Overdue: "bg-red-100 text-red-700"
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border mt-6">

            <div className="p-4 flex justify-between items-center">
                <input
                    placeholder="Search sites..."
                    className="border px-3 py-2 rounded-lg w-1/3"
                />

                <div className="flex gap-2">
                    <select className="border px-3 py-2 rounded-lg">
                        <option>All Status</option>
                    </select>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead className="text-gray-500 border-t">
                    <tr>
                        <th className="p-3 text-left">Site</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Updated</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">

                            <td className="p-3 font-medium">{row.site}</td>
                            <td>{row.type}</td>

                            <td>
                                <span className={`px-3 py-1 rounded-full text-xs ${statusColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>

                            <td>{row.deadline}</td>
                            <td>{row.updated}</td>

                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    )
}