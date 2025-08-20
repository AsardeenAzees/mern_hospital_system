import { useEffect, useState } from 'react'
import { http } from '../../api/http'
import { Link } from 'react-router-dom'

export default function PatientsList() {
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [data, setData] = useState({ total: 0, patients: [] })
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')

    const load = async () => {
        setLoading(true); setErr('')
        try {
            const { data } = await http.get('/patients', { params: { q, page, limit } })
            setData(data)
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to load patients')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [page]) // load on page change

    const onSearch = (e) => {
        e.preventDefault()
        setPage(1)
        load()
    }

    const downloadQr = async (p) => {
        try {
            const res = await http.get(`/patients/${p._id}/qr`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `${p.lastName || 'patient'}-qr.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (e) {
            alert(e.response?.data?.message || 'QR download failed')
        }
    }

    const rotateQr = async (p) => {
        if (!confirm(`Rotate QR token for ${p.firstName} ${p.lastName}?`)) return
        try {
            await http.post(`/patients/${p._id}/rotate-token`)
            alert('QR token rotated. Please download the new QR.')
            load()
        } catch (e) {
            alert(e.response?.data?.message || 'Rotate failed')
        }
    }

    const totalPages = Math.max(Math.ceil((data.total || 0) / limit), 1)

    return (
        <div className="max-w-6xl">
            <h1 className="text-xl font-semibold mb-4">Patients</h1>

            <form onSubmit={onSearch} className="flex gap-2 mb-4">
                <input
                    className="border rounded p-2 w-80"
                    placeholder="Search by name or phone…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <button className="bg-black text-white rounded px-4">Search</button>
            </form>

            {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
            {loading && <div>Loading…</div>}

            <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left border-b bg-gray-50">
                            <th className="p-2">Name</th>
                            <th className="p-2">Gender</th>
                            <th className="p-2">DOB</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2">Created</th>
                            <th className="p-2">Token (last 6)</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.patients || []).map(p => (
                            <tr key={p._id} className="border-b">
                                <td className="p-2">{p.firstName} {p.lastName}</td>
                                <td className="p-2">{p.gender}</td>
                                <td className="p-2">{p.dob ? new Date(p.dob).toLocaleDateString() : '-'}</td>
                                <td className="p-2">{p.phone || '-'}</td>
                                <td className="p-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                                <td className="p-2 monospace">
                                    {p.qr?.token ? p.qr.token.slice(-6) : '-'}
                                </td>
                                <td className="p-2">
                                    <div className="flex gap-2">
                                        <Link className="underline" to={`/app/patients/${p._id}`}>View</Link>
                                        <button className="underline" onClick={() => downloadQr(p)}>Download QR</button>
                                        <button className="underline" onClick={() => rotateQr(p)}>Rotate QR</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!data.patients?.length && !loading && (
                            <tr><td className="p-2 text-gray-500" colSpan={7}>No patients.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center gap-2 mt-3">
                <button
                    className="border rounded px-2 py-1"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                >Prev</button>
                <div className="text-sm">Page {page} / {totalPages}</div>
                <button
                    className="border rounded px-2 py-1"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                >Next</button>
            </div>
        </div>
    )
}
