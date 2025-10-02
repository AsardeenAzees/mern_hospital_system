import { useCallback, useEffect, useState } from 'react'
import { http } from '../../api/http'
import { Link } from 'react-router-dom'

export default function AdminPatients() {
    const [q, setQ] = useState('')
    const [debounced, setDebounced] = useState('')
    const [page, setPage] = useState(1)
    const [data, setData] = useState({ patients: [], total: 0, pages: 1 })
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')
    const [deletingId, setDeletingId] = useState(null)

    const loadList = useCallback(async (pageToUse = page, query = debounced) => {
        setLoading(true); setErr('')
        try {
            const { data } = await http.get('/patients/admin/list', { params: { q: query, page: pageToUse, limit: 10 } })
            setData(data)
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to load patients')
        } finally {
            setLoading(false)
        }
    }, [debounced, page])

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebounced(q.trim()), 300)
        return () => clearTimeout(t)
    }, [q])

    // load list
    useEffect(() => {
        loadList(page, debounced)
    }, [debounced, page, loadList])

    const canPrev = page > 1
    const canNext = page < (data.pages || 1)

    const downloadQR = async (id, name) => {
        try {
            const res = await http.get(`/patients/${id}/qr.png`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `${name}-qr.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (e) {
            alert(e.response?.data?.message || 'QR download failed')
        }
    }

    const rotateToken = async (id) => {
        if (!confirm('This will invalidate the current QR code. Continue?')) return
        try {
            await http.post(`/patients/${id}/rotate-token`)
            alert('QR token rotated successfully. Please download the new QR code.')
            await loadList()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to rotate token')
        }
    }

    const deletePatient = async (patient) => {
        if (!confirm(`Delete patient account for ${patient.firstName} ${patient.lastName}? This will remove their records.`)) return
        try {
            setDeletingId(patient._id)
            await http.delete(`/patients/${patient._id}`)
            alert('Patient account deleted')
            if ((data.patients?.length || 0) === 1 && page > 1) {
                setPage(prev => Math.max(prev - 1, 1))
            } else {
                await loadList()
            }
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete patient')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="max-w-6xl">
            <h1 className="text-xl font-semibold mb-3">Patients</h1>
            <div className="flex gap-2 mb-3">
                <input
                    className="border rounded p-2 w-80"
                    placeholder="Search name / phone / token…"
                    value={q}
                    onChange={e => { setQ(e.target.value); setPage(1) }}
                />
            </div>

            {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
            {loading ? <div>Loading…</div> : (
                <div className="overflow-x-auto border rounded">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Name</th>
                                <th className="p-2">Gender</th>
                                <th className="p-2">DOB</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Allergies</th>
                                <th className="p-2">Token</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.patients?.map(p => {
                                const name = `${p.firstName} ${p.lastName}`
                                return (
                                    <tr key={p._id} className="border-b">
                                        <td className="p-2">{name}</td>
                                        <td className="p-2">{p.gender}</td>
                                        <td className="p-2">{new Date(p.dob).toLocaleDateString()}</td>
                                        <td className="p-2">{p.phone || '-'}</td>
                                        <td className="p-2">{(p.allergies || []).join(', ') || '—'}</td>
                                        <td className="p-2 font-mono text-xs">{p.qr?.token?.slice(0, 10)}…</td>
                                        <td className="p-2 flex gap-2">
                                            <Link className="underline" to={`/app/patients/${p._id}`}>Open</Link>
                                            <button className="underline"
                                                onClick={() => downloadQR(p._id, `${p.firstName}-${p.lastName}`)}>
                                                Download QR
                                            </button>
                                            <button className="underline text-blue-600"
                                                onClick={() => rotateToken(p._id)}>
                                                Rotate Token
                                            </button>
                                            <button
                                                type="button"
                                                className={`underline text-red-600 ${deletingId === p._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={deletingId === p._id}
                                                onClick={() => deletePatient(p)}
                                            >
                                                {deletingId === p._id ? 'Deleting...' : 'Delete Account'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {!data.patients?.length && (
                                <tr><td className="p-2" colSpan={7}>No patients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-3 flex items-center gap-3">
                <button
                    className="border rounded px-3 py-1 disabled:opacity-50"
                    disabled={!canPrev}
                    onClick={() => setPage(p => p - 1)}
                >Previous</button>
                <div className="text-sm">Page {data.page || 1} of {data.pages || 1}</div>
                <button
                    className="border rounded px-3 py-1 disabled:opacity-50"
                    disabled={!canNext}
                    onClick={() => setPage(p => p + 1)}
                >Next</button>
            </div>
        </div>
    )
}
