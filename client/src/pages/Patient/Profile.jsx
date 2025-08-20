import { useEffect, useState } from 'react'
import { http } from '../../api/http'

export default function Profile() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: ''
    })
    const [err, setErr] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const userRes = await http.get('/auth/me')
            const user = userRes.data.user
            
            let additionalData = null
            
            // Fetch role-specific data
            if (user.role === 'PATIENT') {
                try {
                    const patientRes = await http.get('/me/patient')
                    additionalData = patientRes.data.patient
                } catch (error) {
                    console.warn('No patient data found:', error)
                }
            }
            
            setProfile({ user, additionalData })
            setForm({
                name: user.name,
                email: user.email,
                phone: additionalData?.phone || ''
            })
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            setErr('Failed to load profile information')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErr('')
        setSuccess('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErr('')
        setSuccess('')
        setLoading(true)

        try {
            await http.patch('/users/profile', {
                name: form.name,
                phone: form.phone
            })

            setSuccess('Profile updated successfully!')
            setEditing(false)
            await fetchProfile() // Refresh data
        } catch (error) {
            setErr(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': 'bg-purple-100 text-purple-800',
            'DOCTOR': 'bg-blue-100 text-blue-800',
            'NURSE': 'bg-green-100 text-green-800',
            'PATIENT': 'bg-orange-100 text-orange-800'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    const getRoleIcon = (role) => {
        const icons = {
            'ADMIN': '👨‍💼',
            'DOCTOR': '👨‍⚕️',
            'NURSE': '👩‍⚕️',
            'PATIENT': '👤'
        }
        return icons[role] || '👤'
    }

    if (loading && !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                    <p className="text-center mt-4 text-gray-600">Loading your profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load profile</h2>
                    <p className="text-gray-600 mb-6">We couldn't load your profile information</p>
                    <button 
                        onClick={fetchProfile}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    const { user, additionalData } = profile

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-2xl">{getRoleIcon(user.role)}</span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>

                    {err && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                <div className="text-red-800">{err}</div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <div className="text-green-800">{success}</div>
                            </div>
                        </div>
                    )}

                    {editing ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        disabled
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                            </div>

                            {user.role === 'PATIENT' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            )}

                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                                >
                                    {loading ? '💾 Saving...' : '💾 Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false)
                                        setForm({
                                            name: user.name,
                                            email: user.email,
                                            phone: additionalData?.phone || ''
                                        })
                                        setErr('')
                                        setSuccess('')
                                    }}
                                    className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-colors duration-200 font-medium"
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <div className="text-gray-900 text-lg">{user.name}</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <div className="text-gray-900 text-lg">{user.email}</div>
                                </div>
                            </div>

                            {user.role === 'PATIENT' && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <div className="text-gray-900 text-lg">{additionalData?.phone || 'Not provided'}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl">{getRoleIcon(user.role)}</span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        user.status === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.status === 'ACTIVE' ? '✅ Active' : '❌ Inactive'}
                                    </div>
                                </div>
                            </div>

                            {/* Role-specific content */}
                            {user.role === 'PATIENT' && additionalData && (
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="mr-2">🏥</span>
                                        Patient Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                            <div className="text-gray-900">
                                                {new Date(additionalData.dob).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                            <div className="text-gray-900">{additionalData.gender}</div>
                                        </div>
                                    </div>
                                    
                                    {additionalData.allergies && additionalData.allergies.length > 0 && (
                                        <div className="mt-6 bg-white rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">⚠️ Allergies</label>
                                            <div className="text-gray-900">
                                                {additionalData.allergies.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {additionalData.medicalHistory && (
                                        <div className="mt-6 bg-white rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Medical History</label>
                                            <div className="text-gray-900">{additionalData.medicalHistory}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(user.role === 'DOCTOR' || user.role === 'NURSE') && (
                                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="mr-2">👨‍⚕️</span>
                                        Medical Staff Information
                                    </h3>
                                    <div className="bg-white rounded-xl p-4">
                                        <p className="text-gray-700">
                                            As a {user.role.toLowerCase()}, you have access to patient records and can perform medical procedures.
                                            Use the QR scanner to access patient information quickly.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {user.role === 'ADMIN' && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="mr-2">👨‍💼</span>
                                        Administrator Access
                                    </h3>
                                    <div className="bg-white rounded-xl p-4">
                                        <p className="text-gray-700">
                                            You have full administrative access to manage users, patients, and system settings.
                                            Use the admin panel to oversee all hospital operations.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
