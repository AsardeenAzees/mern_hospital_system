import { useState } from 'react'
import { http } from '../api/http'

export default function Login() {
    const [isLogin, setIsLogin] = useState(true)
    const [isPatientLogin, setIsPatientLogin] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'DOCTOR',
        patientId: '',
        nic: ''
    })
    const [err, setErr] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErr('') // Clear error when user types
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setErr('')
        setLoading(true)

        if (!form.email || !form.password) {
            setErr('Please fill in all required fields')
            setLoading(false)
            return
        }

        try {
            console.log('Attempting login with:', { email: form.email })
            const { data } = await http.post('/auth/login', {
                email: form.email,
                password: form.password
            })
            console.log('Login successful:', data)

            const role = data?.user?.role
            if (role === 'ADMIN') window.location.href = '/app/admin/users'
            else if (role === 'DOCTOR' || role === 'NURSE') window.location.href = '/app/scan'
            else window.location.href = '/app/dashboard' // PATIENT
        } catch (e) {
            console.error('Login error:', e)
            console.error('Error response:', e.response)

            if (e.code === 'ERR_NETWORK') {
                setErr('Network error: Please check if the server is running')
            } else if (e.response?.status === 401) {
                setErr('Invalid email or password. Please try again.')
            } else if (e.response?.status === 500) {
                setErr('Server error: Please try again later')
            } else {
                setErr(e.response?.data?.message || 'Login failed. Please check your credentials.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setErr('')
        setLoading(true)

        // Validation
        if (!form.name || !form.email || !form.password || !form.confirmPassword) {
            setErr('Please fill in all required fields')
            setLoading(false)
            return
        }

        if (form.password !== form.confirmPassword) {
            setErr('Passwords do not match')
            setLoading(false)
            return
        }

        if (form.password.length < 6) {
            setErr('Password must be at least 6 characters long')
            setLoading(false)
            return
        }

        try {
            const { data } = await http.post('/auth/register', {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role
            })

            // Auto-login after successful registration
            setErr('Registration successful! Logging you in...')
            setTimeout(() => {
                const role = data?.user?.role
                if (role === 'ADMIN') window.location.href = '/app/admin/users'
                else if (role === 'DOCTOR' || role === 'NURSE') window.location.href = '/app/scan'
                else window.location.href = '/app/dashboard'
            }, 1000)
        } catch (e) {
            setErr(e.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'DOCTOR'
        })
        setErr('')
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white text-3xl">🏥</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Management</h1>
                    <p className="text-gray-600">Sign in to your account or create a new one</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Toggle Buttons */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                        <button
                            onClick={() => { setIsLogin(true); setIsPatientLogin(false); resetForm() }}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${isLogin
                                    ? 'bg-white text-gray-900 shadow-sm transform scale-105'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            🔐 Sign In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setIsPatientLogin(false); resetForm() }}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${!isLogin
                                    ? 'bg-white text-gray-900 shadow-sm transform scale-105'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            ✨ Sign Up
                        </button>
                    </div>
                    {/* Staff vs Patient login */}
                    {isLogin && (
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                            <button
                                onClick={() => { setIsPatientLogin(false); resetForm() }}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${!isPatientLogin
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Staff Login
                            </button>
                            <button
                                onClick={() => { setIsPatientLogin(true); resetForm() }}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${isPatientLogin
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Patient Login (PatientID + NIC)
                            </button>
                        </div>
                    )}

                    {err && (
                        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center ${err.includes('successful')
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            <span className="mr-2">
                                {err.includes('successful') ? '✅' : '⚠️'}
                            </span>
                            {err}
                        </div>
                    )}

                    {isLogin && !isPatientLogin ? (
                        // Login Form
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    name="email"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    name="password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 px-4 font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {loading ? '🔄 Signing In...' : '🚀 Sign In'}
                            </button>
                        </form>
                    ) : isLogin && isPatientLogin ? (
                        // Patient Login Form
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            setErr('')
                            setLoading(true)
                            try {
                                const { data } = await http.post('/auth/login/patient', { patientId: form.patientId, nic: form.nic })
                                const role = data?.user?.role
                                if (role === 'PATIENT') window.location.href = '/app/dashboard'
                                else window.location.href = '/app/scan'
                            } catch (e) {
                                setErr(e.response?.data?.message || 'Login failed')
                            } finally {
                                setLoading(false)
                            }
                        }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🆔 Patient ID</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="text"
                                    placeholder="e.g., PT000001"
                                    value={form.patientId}
                                    onChange={handleChange}
                                    name="patientId"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🪪 NIC</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="text"
                                    placeholder="Enter your NIC"
                                    value={form.nic}
                                    onChange={handleChange}
                                    name="nic"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 px-4 font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {loading ? '🔄 Signing In...' : '🚀 Sign In'}
                            </button>
                        </form>
                    ) : (
                        // Registration Form
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Full Name</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    name="name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    name="email"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🎭 Role</label>
                                <div className="relative">
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                                        value={form.role}
                                        onChange={handleChange}
                                        name="role"
                                        required
                                    >
                                        <option value="DOCTOR">👨‍⚕️ Doctor</option>
                                        <option value="NURSE">👩‍⚕️ Nurse</option>
                                        <option value="ADMIN">👨‍💼 Admin</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-400">▼</span>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                                    <span>{getRoleIcon(form.role)}</span>
                                    <span>Selected role: {form.role}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    name="password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🔐 Confirm Password</label>
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    name="confirmPassword"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl py-3 px-4 font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {loading ? '🔄 Creating Account...' : '✨ Create Account'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => { setIsLogin(!isLogin); resetForm() }}
                                className="ml-1 text-blue-600 hover:text-blue-800 font-semibold underline"
                            >
                                {isLogin ? 'Sign up here' : 'Sign in here'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-xs text-gray-500">
                        © 2024 Hospital Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
