import { useEffect, useState } from 'react'
import { http } from '../api/http'

export default function Protected({ children }) {
    const [loading, setLoading] = useState(true)
    const [ok, setOk] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Checking authentication...')
                const response = await http.get('/auth/me')
                console.log('Auth check response:', response.data)
                setOk(!!response.data.user)
                if (!response.data.user) {
                    console.log('No user found, redirecting to login')
                }
            } catch (error) {
                console.error('Auth check error:', error)
                setError(error.message)
                setOk(false)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    if (!ok) {
        console.log('User not authenticated, redirecting to login')
        window.location.href = '/'
        return null
    }

    return children
}
