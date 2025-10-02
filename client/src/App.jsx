import { Outlet, NavLink } from 'react-router-dom'
import { http } from './api/http'
import { useEffect, useState } from 'react'

export default function App() {
  const [me, setMe] = useState(undefined) // undefined = loading
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    http.get('/auth/me')
      .then(r => setMe(r.data.user))
      .catch(() => setMe(null))
  }, [])

  const logout = async () => {
    await http.post('/auth/logout')
    window.location.href = '/'
  }

  // Active-link styling
  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      isActive 
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`

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
      'ADMIN': 'bg-purple-100 text-purple-800',
      'DOCTOR': 'bg-blue-100 text-blue-800',
      'NURSE': 'bg-green-100 text-green-800',
      'PATIENT': 'bg-orange-100 text-orange-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  // Optional: small loading state while fetching /auth/me
  if (me === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-xl border-r border-gray-200 hidden lg:block">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏥</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Hospital</h2>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </aside>
        
        {/* Mobile sidebar overlay */}
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
        
        <main className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r border-gray-200 hidden lg:block">
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🏥</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Hospital</h2>
          </div>

          {/* User Info */}
          {me && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {me.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{me.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm">{getRoleIcon(me.role)}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(me.role)}`}>
                      {me.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <NavLink to="/app/dashboard" className={linkClass}>
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </NavLink>

            {me?.role === 'ADMIN' && (
              <>
                <NavLink to="/app/admin/patients/new" className={linkClass}>
                  <span className="text-lg">➕</span>
                  <span>Register Patient</span>
                </NavLink>
                <NavLink to="/app/admin/users" className={linkClass}>
                  <span className="text-lg">👥</span>
                  <span>Manage Users</span>
                </NavLink>
                <NavLink to="/app/admin/patients" end className={linkClass}>
                  <span className="text-lg">🏥</span>
                  <span>Patients</span>
                </NavLink>
              </>
            )}

            {(me?.role === 'DOCTOR' || me?.role === 'NURSE') && (
              <NavLink to="/app/scan" className={linkClass}>
                <span className="text-lg">📱</span>
                <span>Scan QR</span>
              </NavLink>
            )}

            {me?.role === 'PATIENT' && (
              <NavLink to="/app/my/records" className={linkClass}>
                <span className="text-lg">📋</span>
                <span>My Records</span>
              </NavLink>
            )}

            {/* Profile link for all users */}
            <NavLink to="/app/profile" className={linkClass}>
              <span className="text-lg">👤</span>
              <span>Profile</span>
            </NavLink>
          </nav>

          {/* Logout */}
          <button 
            onClick={logout} 
            className="mt-6 w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 font-medium"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Hospital</h2>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* User Info */}
            {me && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {me.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{me.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm">{getRoleIcon(me.role)}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(me.role)}`}>
                        {me.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              <NavLink to="/app/dashboard" className={linkClass} onClick={() => setSidebarOpen(false)}>
                <span className="text-lg">📊</span>
                <span>Dashboard</span>
              </NavLink>

              {me?.role === 'ADMIN' && (
                <>
                  <NavLink to="/app/admin/patients/new" className={linkClass} onClick={() => setSidebarOpen(false)}>
                    <span className="text-lg">➕</span>
                    <span>Register Patient</span>
                  </NavLink>
                  <NavLink to="/app/admin/users" className={linkClass} onClick={() => setSidebarOpen(false)}>
                    <span className="text-lg">👥</span>
                    <span>Manage Users</span>
                  </NavLink>
                  <NavLink to="/app/admin/patients" end className={linkClass} onClick={() => setSidebarOpen(false)}>
                    <span className="text-lg">🏥</span>
                    <span>Patients</span>
                  </NavLink>
                </>
              )}

              {(me?.role === 'DOCTOR' || me?.role === 'NURSE') && (
                <NavLink to="/app/scan" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <span className="text-lg">📱</span>
                  <span>Scan QR</span>
                </NavLink>
              )}

              {me?.role === 'PATIENT' && (
                <NavLink to="/app/my/records" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <span className="text-lg">📋</span>
                  <span>My Records</span>
                </NavLink>
              )}

              {/* Profile link for all users */}
              <NavLink to="/app/profile" className={linkClass} onClick={() => setSidebarOpen(false)}>
                <span className="text-lg">👤</span>
                <span>Profile</span>
              </NavLink>
            </nav>

            {/* Logout */}
            <button 
              onClick={logout} 
              className="mt-6 w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 font-medium"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">☰</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏥</span>
              </div>
              <span className="font-semibold text-gray-900">Hospital</span>
            </div>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
