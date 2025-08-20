import { useState } from 'react'
import { http } from '../../api/http'

export default function PatientRegister() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', gender: 'Male', dob: '', phone: '', email: '', nic: '', allergies: '', medicalHistory: ''
    })
    const [qr, setQr] = useState(null)
    const [msg, setMsg] = useState('')
    const [loading, setLoading] = useState(false)

    const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async e => {
        e.preventDefault()
        setMsg('')
        setQr(null)
        setLoading(true)
        
        // Validate required fields
        if (!form.firstName || !form.lastName || !form.gender || !form.dob || !form.nic) {
            setMsg('Please fill in all required fields (First Name, Last Name, Gender, Date of Birth, NIC)')
            setLoading(false)
            return
        }

        const payload = {
            ...form,
            allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
            dob: form.dob
        }
        
        try {
            const { data } = await http.post('/patients', payload)
            setQr(data.patient.qr.imageDataUrl)
            setMsg(`Patient registered successfully! ID: ${data.patient.patientId}. QR code generated.`)
            // Reset form after successful creation
            setForm({
                firstName: '', lastName: '', gender: 'Male', dob: '', phone: '', email: '', nic: '', allergies: '', medicalHistory: ''
            })
        } catch (e) {
            setMsg(e.response?.data?.message || 'Failed to register patient')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-xl font-semibold mb-4">Register Patient</h1>
            <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        className="border p-2 rounded" 
                        name="firstName" 
                        placeholder="First name" 
                        value={form.firstName}
                        onChange={change}
                        required
                    />
                    <input 
                        className="border p-2 rounded" 
                        name="lastName" 
                        placeholder="Last name" 
                        value={form.lastName}
                        onChange={change}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <select 
                        className="border p-2 rounded" 
                        name="gender" 
                        value={form.gender}
                        onChange={change}
                        required
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <input 
                        className="border p-2 rounded" 
                        type="date" 
                        name="dob" 
                        value={form.dob}
                        onChange={change}
                        required
                    />
                </div>
                <input 
                    className="border p-2 rounded w-full" 
                    name="phone" 
                    placeholder="Phone" 
                    value={form.phone}
                    onChange={change}
                />
                <input 
                    className="border p-2 rounded w-full" 
                    name="email" 
                    placeholder="Email (optional)" 
                    value={form.email}
                    onChange={change}
                    type="email"
                />
                <input 
                    className="border p-2 rounded w-full" 
                    name="nic" 
                    placeholder="NIC" 
                    value={form.nic}
                    onChange={change}
                    required
                />
                <input 
                    className="border p-2 rounded w-full" 
                    name="allergies" 
                    placeholder="Allergies (comma separated)" 
                    value={form.allergies}
                    onChange={change}
                />
                <textarea 
                    className="border p-2 rounded w-full" 
                    name="medicalHistory" 
                    placeholder="Medical history" 
                    value={form.medicalHistory}
                    onChange={change}
                    rows={3}
                />
                <button 
                    className="bg-black text-white px-4 py-2 rounded disabled:opacity-50" 
                    disabled={loading}
                    type="submit"
                >
                    {loading ? 'Creating...' : 'Create Patient'}
                </button>
            </form>

            {msg && (
                <div className={`mt-3 p-2 rounded ${msg.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {msg}
                </div>
            )}
            
            {qr && (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-2">Patient QR Code</h3>
                    <img src={qr} alt="Patient QR" className="border p-2 bg-white mx-auto" />
                    <a 
                        href={qr} 
                        download="patient-qr.png" 
                        className="block mt-2 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Download QR Code
                    </a>
                </div>
            )}
        </div>
    )
}
