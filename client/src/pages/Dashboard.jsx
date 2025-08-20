import { useEffect, useState } from 'react'
import { http } from '../api/http'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const [me, setMe] = useState(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { 
        const fetchData = async () => {
            try {
                const [userRes, statsRes] = await Promise.all([
                    http.get('/auth/me'),
                    http.get('/dashboard/stats')
                ])
                setMe(userRes.data.user)
                setStats(statsRes.data)
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const getRoleIcon = (role) => {
        const icons = {
            'ADMIN': '👨‍💼',
            'DOCTOR': '👨‍⚕️',
            'NURSE': '👩‍⚕️',
            'PATIENT': '👤'
        }
        return icons[role] || '👤'
    }

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': 'from-purple-500 to-indigo-600',
            'DOCTOR': 'from-blue-500 to-cyan-600',
            'NURSE': 'from-green-500 to-emerald-600',
            'PATIENT': 'from-orange-500 to-red-600'
        }
        return colors[role] || 'from-gray-500 to-gray-600'
    }

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-center mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
        </div>
    )

    if (!me) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load dashboard</h2>
                <p className="text-gray-600">Please try refreshing the page</p>
            </div>
        </div>
    )

    const StatCard = ({ title, value, description, icon, color = 'blue' }) => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{icon}</span>
                        <p className="text-sm font-semibold text-gray-600">{title}</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center opacity-10`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    )

    const QuickAction = ({ title, description, link, icon, color = 'blue' }) => (
        <Link to={link} className={`block p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 group hover:scale-105`}>
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                    <span className="text-xl">→</span>
                </div>
            </div>
        </Link>
    )

    if (me.role === 'ADMIN') {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">{getRoleIcon(me.role)}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-purple-100">Welcome back, {me.name}</p>
                        </div>
                    </div>
                    <p className="text-purple-100">Manage the entire hospital system and oversee all operations</p>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Total Patients" 
                            value={stats.totalPatients} 
                            description="Registered patients"
                            icon="🏥"
                            color="from-blue-500 to-cyan-600"
                        />
                        <StatCard 
                            title="Total Users" 
                            value={stats.totalUsers} 
                            description="System users"
                            icon="👥"
                            color="from-green-500 to-emerald-600"
                        />
                        <StatCard 
                            title="Medical Records" 
                            value={stats.totalRecords} 
                            description="Total entries"
                            icon="📋"
                            color="from-purple-500 to-indigo-600"
                        />
                        <StatCard 
                            title="Active Staff" 
                            value={stats.activeStaff} 
                            description="Doctors & Nurses"
                            icon="👨‍⚕️"
                            color="from-orange-500 to-red-600"
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="mr-3">⚡</span>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <QuickAction 
                            title="Register New Patient"
                            description="Add a new patient to the system"
                            link="/app/admin/patients/new"
                            icon="➕"
                            color="from-green-500 to-emerald-600"
                        />
                        <QuickAction 
                            title="Manage Users"
                            description="Create and manage user accounts"
                            link="/app/admin/users"
                            icon="👥"
                            color="from-blue-500 to-cyan-600"
                        />
                        <QuickAction 
                            title="View All Patients"
                            description="Browse and search patient records"
                            link="/app/admin/patients"
                            icon="🏥"
                            color="from-purple-500 to-indigo-600"
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                {stats?.recentActivity && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="mr-3">📊</span>
                            Recent Activity
                        </h2>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="font-semibold text-gray-900 text-lg">Latest System Events</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {stats.recentActivity.map((activity, index) => (
                                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                    <span className="text-blue-600">📝</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{activity.action}</p>
                                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{activity.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (me.role === 'DOCTOR' || me.role === 'NURSE') {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getRoleColor(me.role)} rounded-2xl p-8 text-white`}>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">{getRoleIcon(me.role)}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Clinical Dashboard</h1>
                            <p className="text-opacity-90">Welcome, {me.name}</p>
                        </div>
                    </div>
                    <p className="text-opacity-90">Access patient records and manage clinical operations</p>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Patients Today" 
                            value={stats.patientsToday || 0} 
                            description="Patients seen today"
                            icon="👥"
                            color="from-blue-500 to-cyan-600"
                        />
                        <StatCard 
                            title="Records Updated" 
                            value={stats.recordsUpdated || 0} 
                            description="Medical records modified"
                            icon="📝"
                            color="from-green-500 to-emerald-600"
                        />
                        <StatCard 
                            title="Pending Tasks" 
                            value={stats.pendingTasks || 0} 
                            description="Tasks to complete"
                            icon="⏳"
                            color="from-orange-500 to-red-600"
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="mr-3">⚡</span>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickAction 
                            title="Scan Patient QR"
                            description="Scan QR code to access patient records"
                            link="/app/scan"
                            icon="📱"
                            color="from-blue-500 to-cyan-600"
                        />
                        <QuickAction 
                            title="Recent Patients"
                            description="View recently accessed patient records"
                            link="/app/dashboard/recent"
                            icon="🕒"
                            color="from-green-500 to-emerald-600"
                        />
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-blue-600 text-xl">💡</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 text-lg mb-2">Getting Started</h3>
                            <p className="text-blue-800">
                                To access a patient's medical records, use the QR scanner from the sidebar. 
                                You can scan QR codes using your device's camera or upload QR images.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Patient Dashboard
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">{getRoleIcon(me.role)}</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
                        <p className="text-orange-100">Welcome, {me.name}</p>
                    </div>
                </div>
                <p className="text-orange-100">Access your medical records and manage your health information</p>
            </div>

            {/* Patient Information */}
            {stats?.patientInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard 
                        title="Medical Records" 
                        value={stats.patientInfo.totalRecords || 0} 
                        description="Total medical entries"
                        icon="📋"
                        color="from-blue-500 to-cyan-600"
                    />
                    <StatCard 
                        title="Last Visit" 
                        value={stats.patientInfo.lastVisit || 'N/A'} 
                        description="Most recent appointment"
                        icon="🏥"
                        color="from-green-500 to-emerald-600"
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="mr-3">⚡</span>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <QuickAction 
                        title="View My Records"
                        description="Access your complete medical history"
                        link="/app/my/records"
                        icon="📋"
                        color="from-blue-500 to-cyan-600"
                    />
                    <QuickAction 
                        title="Update Profile"
                        description="Manage your personal information"
                        link="/app/profile"
                        icon="👤"
                        color="from-green-500 to-emerald-600"
                    />
                </div>
            </div>

            {/* Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600 text-xl">💚</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 text-lg mb-2">Your Medical Records</h3>
                        <p className="text-green-800">
                            Access your complete medical history, including diagnoses, test results, 
                            prescriptions, and notes from healthcare providers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
