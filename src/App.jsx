
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabase)

  useEffect(() => {
    // Manual hash parsing for auth tokens
    // This is required to catch the session when Supabase redirects back
    if (window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.replace('#', ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ data, error }) => {
            if (!error && data.session) {
              setSession(data.session)
              // Clear hash to prevent re-processing
              window.history.replaceState(null, '', window.location.pathname)
            }
            setLoading(false)
          })
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (configError) {
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-red-900/20 border border-red-700 p-6 rounded-xl text-center">
          {/* Same error content */}
          <h1 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h1>
          <code className="block text-gray-400">VITE_SUPABASE_URL</code>
        </div>

      </div>
    )
  }

  if (!session) {
    return (
      <>
        <AuthComponent />

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

      </div>
    </Router>
  )
}

export default App
