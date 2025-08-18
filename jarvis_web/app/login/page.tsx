'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [isElectronMode, setIsElectronMode] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    setIsElectronMode(mode === 'electron')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Jarvis</h1>
        <p className="text-gray-600 mt-2">Continue to Jarvis in local mode.</p>
        {isElectronMode ? (
          <p className="text-sm text-blue-600 mt-1 font-medium">🔗 Login requested from Electron app</p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Local mode will run if you don't sign in.</p>
        )}
      </div>
      
      <div className="w-full max-w-sm">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                if (isElectronMode) {
                  window.location.href = 'jarvis://auth-success?uid=default_user&email=contact@jarvis.com&displayName=Default%20User'
                } else {
                  router.push('/settings')
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Continue in local mode
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}