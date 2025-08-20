import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { http } from '../api/http'

export default function PatientView() {
    const { id } = useParams()
    const [patient, setPatient] = useState(null)
    const [record, setRecord] = useState({ entries: [] })
    const [err, setErr] = useState('')
    const [entry, setEntry] = useState({ type: 'DIAGNOSIS', text: '' })
    const [canAdd, setCanAdd] = useState(false)
    const [me, setMe] = useState(null)
    const [loading, setLoading] = useState(true)
    const [attachments, setAttachments] = useState([])

    const fetchAll = async () => {
        setErr('')
        setLoading(true)
        try {
            const [p, r, meResp] = await Promise.all([
                http.get(`/patients/${id}`),
                http.get(`/records/${id}`),
                http.get('/auth/me')
            ])
            setPatient(p.data.patient)
            setRecord(r.data.record || { entries: [] })
            setMe(meResp.data.user)
            setCanAdd(['DOCTOR', 'ADMIN'].includes(meResp.data.user?.role))
        } catch (e) {
            setErr(e.response?.data?.message || 'Load failed')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [id])

    const addEntry = async (e) => {
        e.preventDefault()
        setErr('')
        
        if (!entry.text.trim()) {
            setErr('Please enter record details')
            return
        }

        try {
            const formData = new FormData()
            formData.append('type', entry.type)
            formData.append('text', entry.text)
            
            // Add attachments if any
            attachments.forEach((file, index) => {
                formData.append(`attachments`, file)
            })

            const { data } = await http.post(`/records/${id}/entries`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setRecord(data.record)
            setEntry({ type: 'DIAGNOSIS', text: '' })
            setAttachments([])
        } catch (e) {
            setErr(e.response?.data?.message || 'Add failed')
        }
    }

    const rotateToken = async () => {
        if (!confirm('This will invalidate the current QR code. Continue?')) return
        try {
            await http.post(`/patients/${id}/rotate-token`)
            alert('QR token rotated successfully. Please download the new QR code.')
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to rotate token')
        }
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        setAttachments(prev => [...prev, ...files])
    }

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const getEntryTypeColor = (type) => {
        const colors = {
            'DIAGNOSIS': 'from-red-500 to-pink-600',
            'PRESCRIPTION': 'from-blue-500 to-cyan-600',
            'TEST_RESULT': 'from-green-500 to-emerald-600',
            'NOTE': 'from-gray-500 to-gray-600'
        }
        return colors[type] || 'from-gray-500 to-gray-600'
    }

    const getEntryTypeIcon = (type) => {
        const icons = {
            'DIAGNOSIS': '🏥',
            'PRESCRIPTION': '💊',
            'TEST_RESULT': '🔬',
            'NOTE': '📝'
        }
        return icons[type] || '📄'
    }

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-center mt-4 text-gray-600">Loading patient records...</p>
            </div>
        </div>
    )

    if (!patient) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Patient Not Found</h2>
                <p className="text-gray-600">The requested patient could not be found</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Patient Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                        <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {patient.firstName} {patient.lastName}
                                </h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">👤</span>
                                        <span>Gender: {patient.gender}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">🎂</span>
                                        <span>DOB: {new Date(patient.dob).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">📞</span>
                                        <span>Phone: {patient.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">⚠️</span>
                                        <span>Allergies: {(patient.allergies || []).join(', ') || 'None'}</span>
                                    </div>
                                </div>
                                {patient.medicalHistory && (
                                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-orange-600">📋</span>
                                            <span className="font-semibold text-orange-900">Medical History</span>
                                        </div>
                                        <p className="text-orange-800 text-sm">{patient.medicalHistory}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-sm font-semibold text-gray-700 mb-2">QR Token</div>
                            <div className="font-mono text-sm bg-white p-3 rounded-lg border">
                                {patient.qr?.token?.slice(0, 20)}...
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Records */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="mr-3">📋</span>
                            Medical Records
                        </h2>
                        <div className="text-sm text-gray-500">
                            {record.entries?.length || 0} entries
                        </div>
                    </div>
                    
                    {record.entries && record.entries.length > 0 ? (
                        <div className="space-y-6">
                            {record.entries.slice().reverse().map((e, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${getEntryTypeColor(e.type)} rounded-xl flex items-center justify-center text-white text-lg`}>
                                                {getEntryTypeIcon(e.type)}
                                            </div>
                                            <div>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800`}>
                                                    {e.type.replace('_', ' ')}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(e.createdAt || e.updatedAt || Date.now()).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        {e.author?.name && (
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">{e.author.name}</div>
                                                <div className="text-xs text-gray-500">{e.author.role}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-xl p-4">{e.text}</div>
                                    
                                    {/* Attachments */}
                                    {e.attachments && e.attachments.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                <span className="mr-2">📎</span>
                                                Attachments:
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {e.attachments.map((att, attIdx) => (
                                                    <a
                                                        key={attIdx}
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                                                    >
                                                        📎 {att.name}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">📋</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Medical Records</h3>
                            <p className="text-gray-600">Records will appear here once added by healthcare providers.</p>
                        </div>
                    )}
                </div>

                {/* Add New Entry Form */}
                {canAdd && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="mr-3">➕</span>
                            Add Medical Record Entry
                        </h3>
                        <form onSubmit={addEntry} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Type</label>
                                    <select 
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                        value={entry.type} 
                                        onChange={e => setEntry(s => ({ ...s, type: e.target.value }))}
                                    >
                                        <option value="DIAGNOSIS">🏥 Diagnosis</option>
                                        <option value="TEST_RESULT">🔬 Test Result</option>
                                        <option value="PRESCRIPTION">💊 Prescription</option>
                                        <option value="NOTE">📝 Note</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
                                    <input 
                                        type="file" 
                                        multiple
                                        onChange={handleFileChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                </div>
                            </div>
                            
                            {attachments.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Selected Files:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border">
                                                <span className="text-sm text-gray-700">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Details</label>
                                <textarea 
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    rows={6} 
                                    placeholder="Enter medical record details..."
                                    value={entry.text} 
                                    onChange={e => setEntry(s => ({ ...s, text: e.target.value }))}
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                💾 Add Entry
                            </button>
                        </form>
                    </div>
                )}

                {/* Error Display */}
                {err && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <div className="flex items-center">
                            <span className="text-red-500 mr-2">⚠️</span>
                            <div className="text-red-800">{err}</div>
                        </div>
                    </div>
                )}
                
                {/* Admin Actions */}
                {me?.role === 'ADMIN' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="mr-3">⚙️</span>
                            Admin Actions
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={rotateToken}
                                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                🔄 Rotate QR Token
                            </button>
                            <a
                                href={`/api/patients/${id}/qr.png`}
                                download
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-center"
                            >
                                📥 Download QR Code
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
