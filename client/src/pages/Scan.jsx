import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { BrowserMultiFormatReader } from '@zxing/library'
import { http } from '../api/http'
import { useNavigate } from 'react-router-dom'

export default function Scan() {
    const camDivId = 'qr-reader'
    const [camReady, setCamReady] = useState(false)
    const [camActive, setCamActive] = useState(false)
    const [err, setErr] = useState('')
    const [scanning, setScanning] = useState(false)
    const nav = useNavigate()
    const html5QrcodeRef = useRef(null)
    const isScanningRef = useRef(false)

    // parse payload to get token "t"
    const extractToken = (decodedText) => {
        try {
            // supports JSON {"t":"..."} OR URL like ?t=<token>
            if (decodedText.startsWith('{')) {
                const obj = JSON.parse(decodedText)
                return obj.t
            }
            const u = new URL(decodedText)
            return u.searchParams.get('t') || null
        } catch {
            // maybe it's a raw token
            if (decodedText.length > 20) return decodedText
            return null
        }
    }

    const handleDecoded = async (decodedText) => {
        const token = extractToken(decodedText)
        if (!token) { 
            setErr('Could not extract token from QR')
            return 
        }
        
        try {
            setErr('')
            setScanning(true)
            const { data } = await http.get('/patients/resolve', { params: { t: token } })
            
            // Stop scanner before navigation
            if (html5QrcodeRef.current) {
                try {
                    await html5QrcodeRef.current.stop()
                } catch (e) {
                    console.log('Scanner already stopped')
                }
            }
            isScanningRef.current = false
            
            // Navigate to patient page
            nav(`/app/patients/${data.patient.id}`)
        } catch (e) {
            setErr(e.response?.data?.message || 'Resolve failed')
            setScanning(false)
        }
    }

    // Webcam lifecycle
    useEffect(() => {
        return () => {
            const scanner = html5QrcodeRef.current
            if (!scanner) return

            html5QrcodeRef.current = null
            isScanningRef.current = false

            const clearIfMounted = () => {
                const container = document.getElementById(camDivId)
                if (!container) return
                scanner.clear().catch(() => {})
            }

            try {
                Promise.resolve(scanner.stop())
                    .catch(() => {})
                    .finally(() => {
                        clearIfMounted()
                    })
            } catch {
                clearIfMounted()
            }
        }
    }, [])

    const startCamera = async () => {
        try {
            setErr('')
            setCamReady(false)
            setCamActive(true)
            html5QrcodeRef.current = new Html5Qrcode(camDivId)
            const cams = await Html5Qrcode.getCameras()
            if (!cams.length) { 
                setErr('No camera found')
                setCamActive(false)
                return 
            }
            await html5QrcodeRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 250 },
                async (txt) => {
                    if (isScanningRef.current) return
                    isScanningRef.current = true
                    await handleDecoded(txt)
                },
                () => {}
            )
            setCamReady(true)
        } catch (e) {
            setErr(e.message || 'Camera init failed')
            setCamActive(false)
        }
    }

    // File upload (image decoding) fallback with ZXing
    const onFile = async (e) => {
        setErr('')
        setScanning(true)
        const file = e.target.files?.[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const codeReader = new BrowserMultiFormatReader()
                const img = new Image()
                img.onload = async () => {
                    try {
                        const result = await codeReader.decodeFromImageElement(img)
                        await handleDecoded(result.getText())
                    } catch (e) {
                        setErr('Failed to decode image - please ensure it contains a valid QR code')
                        setScanning(false)
                    }
                }
                img.src = reader.result
            } catch (e) {
                setErr('Failed to decode image')
                setScanning(false)
            }
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-white text-3xl">📱</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
                        <p className="text-gray-600">Scan patient QR codes to access medical records</p>
                    </div>

                    {err && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                <div className="text-red-800">{err}</div>
                            </div>
                        </div>
                    )}

                    {scanning && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-3"></div>
                                <div className="text-blue-800 font-medium">Processing scan...</div>
                            </div>
                        </div>
                    )}

                    {/* Camera Scanner */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📷</span>
                            Camera Scanner
                        </h2>
                        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg relative">
                            <div id={camDivId} className="w-full h-80 bg-black"></div>

                            {!camActive && (
                                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                                    <button
                                        onClick={startCamera}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                    >
                                        Scan Patient QR
                                    </button>
                                </div>
                            )}

                            {camActive && !camReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black bg-opacity-40">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                                    <p className="text-lg font-medium">Initializing camera...</p>
                                    <p className="text-sm text-gray-200 mt-2">Please allow camera access</p>
                                </div>
                            )}
                        </div>
                        {!camActive && (
                            <p className="text-sm text-gray-600 mt-3 text-center">
                                Click "Scan Patient QR" to activate your camera.
                            </p>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📁</span>
                            Upload QR Image
                        </h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📷</span>
                            </div>
                            <p className="text-gray-600 mb-4">Drag and drop a QR code image here, or click to browse</p>
                            <label className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl cursor-pointer inline-block">
                                Choose File
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={onFile} 
                                    className="hidden"
                                    disabled={scanning}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 text-xl">💡</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 text-lg mb-2">How to use</h3>
                                <ul className="text-blue-800 space-y-1 text-sm">
                                    <li>• Point your camera at a patient's QR code</li>
                                    <li>• Or upload a QR code image file</li>
                                    <li>• The system will automatically access the patient's records</li>
                                    <li>• Make sure the QR code is clearly visible and well-lit</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
