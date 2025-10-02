import { useEffect, useState } from 'react'
import { http } from '../../api/http'

export default function Users() {
    const [users, setUsers] = useState([])
    const [err, setErr] = useState('')
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DOCTOR' })
    const [patients, setPatients] = useState([])
    const [linkingUser, setLinkingUser] = useState(null)
    const [selectedPatient, setSelectedPatient] = useState('')

    const load = async () => {
        setErr('')
        try {
            const u = await http.get('/users')
            setUsers(u.data.users)
            // lightweight patient list for linking
            const p = await http.get('/patients/admin/list', { params: { limit: 100 } }) // get more patients for linking
            setPatients(p.data.patients || [])
        } catch (e) {
            setErr(e.response?.data?.message || 'Load failed')
        }
    }

    useEffect(() => { load() }, [])

    const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const createUser = async e => {
        e.preventDefault()
        setErr('')
        try {
            await http.post('/users', form)
            setForm({ name: '', email: '', password: '', role: 'DOCTOR' })
            load()
        } catch (e) {
            setErr(e.response?.data?.message || 'Create failed')
        }
    }

    const updateUser = async (id, payload) => {
        setErr('')
        try {
            await http.patch(`/users/${id}`, payload)
            load()
        } catch (e) {
            setErr(e.response?.data?.message || 'Update failed')
        }
    }

    const linkPatient = async () => {
        if (!linkingUser || !selectedPatient) return
        try {
            await http.post(`/users/${linkingUser}/link-patient`, { patientId: selectedPatient })
            setLinkingUser(null); setSelectedPatient('')
            load()
        } catch (e) {
            setErr(e.response?.data?.message || 'Link failed')
        }
    }

    return (
        <div className="max-w-5xl">
            <h1 className="text-xl font-semibold mb-4">Manage Users</h1>
            {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

            <div className="border rounded p-4 mb-6">
                <h2 className="font-semibold mb-3">Create User</h2>
                <form onSubmit={createUser} className="grid grid-cols-5 gap-2 items-center">
                    <input name="name" value={form.name} onChange={change} placeholder="Name" className="border p-2 rounded" />
                    <input name="email" value={form.email} onChange={change} placeholder="Email" className="border p-2 rounded" />
                    <input name="password" value={form.password} onChange={change} placeholder="Password" type="password" className="border p-2 rounded" />
                    <select name="role" value={form.role} onChange={change} className="border p-2 rounded">
                        <option>DOCTOR</option>
                        <option>NURSE</option>
                        <option>ADMIN</option>
                    </select>
                    <button className="bg-black text-white rounded p-2">Create</button>
                </form>
            </div>

            <div className="border rounded p-4">
                <h2 className="font-semibold mb-3">All Users</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="p-2">Name</th>
                                <th className="p-2">Email</th>
                                <th className="p-2">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className="border-b">
                                    <td className="p-2">{u.name}</td>
                                    <td className="p-2">{u.email}</td>
                                    <td className="p-2">{u.role}</td>
                                </tr>
                            ))}
                            {!users.length && (
                                <tr><td className="p-2 text-gray-500" colSpan={5}>No users.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Link modal (simple inline) */}
            {linkingUser && (
                <div className="fixed inset-0 bg-black/40 grid place-items-center">
                    <div className="bg-white p-4 rounded-xl w-[420px]">
                        <h3 className="font-semibold mb-2">Link Patient to this User</h3>
                        <select className="border p-2 rounded w-full" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">Select patient…</option>
                            {patients.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.firstName} {p.lastName} — {p.gender}
                                </option>
                            ))}
                        </select>
                        <div className="mt-3 flex gap-2 justify-end">
                            <button className="px-3 py-1 rounded border" onClick={() => { setLinkingUser(null); setSelectedPatient('') }}>Cancel</button>
                            <button className="px-3 py-1 rounded bg-black text-white" onClick={linkPatient}>Link</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
