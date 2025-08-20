import { useEffect, useState } from 'react'
import { http } from '../../api/http'

export default function MyRecords() {
    const [data, setData] = useState(null)
    const [err, setErr] = useState('')

    useEffect(() => {
        (async () => {
            try {
                const { data } = await http.get('/me/records')
                setData(data)
            } catch (e) {
                setErr(e.response?.data?.message || 'Failed to load records')
            }
        })()
    }, [])

    if (err) return <div className="text-red-600">{err}</div>
    if (!data) return <div>Loading…</div>

    const { patient, record } = data
    return (
        <div className="max-w-3xl">
            <h1 className="text-xl font-semibold mb-2">My Medical Records</h1>
            <div className="text-sm text-gray-600 mb-4">
                {patient.firstName} {patient.lastName} • {patient.gender} • {new Date(patient.dob).toLocaleDateString()}
            </div>
            <div className="space-y-2">
                {(record.entries || []).slice().reverse().map((e, i) => (
                    <div key={i} className="border rounded p-3">
                        <div className="text-xs text-gray-500">
                            {new Date(e.createdAt || e.updatedAt || Date.now()).toLocaleString()}
                            {e.author?.name ? ` • by ${e.author.name} (${e.author.role})` : ''}
                        </div>
                        <div className="text-xs font-semibold mt-1">{e.type}</div>
                        <div className="mt-1 whitespace-pre-wrap">{e.text}</div>
                    </div>
                ))}
                {!record.entries?.length && <div className="text-sm">No entries yet.</div>}
            </div>
        </div>
    )
}
