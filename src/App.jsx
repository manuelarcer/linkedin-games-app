
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabase)

  // Debug state
  const [lastEvent, setLastEvent] = useState('NONE')
  const [debugUrl, setDebugUrl] = useState('')
  const [manualLoginStatus, setManualLoginStatus] = useState('IDLE')

  useEffect(() => {
    // Capture URL on mount to see if hash is present
    setDebugUrl(window.location.href)

    // Manual hash parsing for auth tokens
    if (window.location.hash.includes('access_token')) {
      setManualLoginStatus('DETECTED_TOKENS')
      const params = new URLSearchParams(window.location.hash.replace('#', ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (access_token && refresh_token) {
        setManualLoginStatus('ATTEMPTING_LOGIN')
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ data, error }) => {
            if (error) {
              console.error('Manual login error:', error)
              setManualLoginStatus(`ERROR: ${error.message}`)
            } else if (data.session) {
              console.log('Manual login success:', data.session)
              setManualLoginStatus('SUCCESS')
              setSession(data.session)
              // Clear hash to prevent re-processing
              window.history.replaceState(null, '', window.location.pathname)
            } else {
              setManualLoginStatus('NO_SESSION_RETURNED')
            }
          })
      } else {
        setManualLoginStatus('MISSING_TOKENS')
      }
    }

    if (!supabase) {
      setConfigError(true)
      setLoading(false)
      return
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session)
      setLastEvent(event)
      if (session) {
        setSession(session)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Debug UI Component
  const DebugPanel = () => {
    const hash = window.location.hash
    const search = window.location.search
    const params = new URLSearchParams(hash.replace('#', ''))
    const searchParams = new URLSearchParams(search)

    const error = params.get('error_description') || searchParams.get('error_description') || params.get('error') || 'None'
    const hasAT = params.has('access_token')
    const hasRT = params.has('refresh_token')

    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY

    return (
      <div className="fixed bottom-0 left-0 w-full bg-black/90 text-xs text-green-400 p-2 font-mono break-all z-50 border-t border-green-900 opacity-95">
        <p>LOADING: {loading.toString()}</p>
        <p>EVENT: {lastEvent}</p>
        <p>MANUAL: {manualLoginStatus}</p>
        <p>URL Config: {url}</p>
        <p>Key Config: {key ? key.substring(0, 15) + '...' : 'MISSING'}</p>
        <p>SESSION: {session ? session.user.email : 'NULL'}</p>
        <p>HASH: {hash.substring(0, 20)}...</p>
        <p>TOKENS: AT={hasAT ? 'YES' : 'NO'}, RT={hasRT ? 'YES' : 'NO'}</p>
        <p>ERROR: {error}</p>
        <p>Config Error: {configError.toString()}</p>
        <button
          onClick={() => {
            localStorage.clear()
            window.location.href = window.location.origin
          }}
          className="mt-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
        >
          CLEAR DATA & RELOAD
        </button>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center p-4">
        {/* ... existing error UI ... */}
        <div className="max-w-md bg-red-900/20 border border-red-700 p-6 rounded-xl text-center">
          {/* Same error content */}
          <h1 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h1>
          <code className="block text-gray-400">VITE_SUPABASE_URL</code>
        </div>
        <DebugPanel />
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <AuthComponent />
        <DebugPanel />
      </>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#242424] text-white">
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DebugPanel />
      </div>
    </Router>
  )
}

export default App
