
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
    if (!supabase) {
      setConfigError(true)
      setLoading(false)
      return
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
    // ... existing config error code ...
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-red-900/20 border border-red-700 p-6 rounded-xl text-center">
          <h1 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h1>
          <p className="mb-4 text-gray-300">The application could not connect to Supabase.</p>

          <div className="text-sm bg-black/50 p-4 rounded-lg text-left overflow-x-auto mb-4 border border-red-900/50">
            <p className="font-semibold text-red-400 mb-1">Missing Environment Variables:</p>
            <code className="block text-gray-400">VITE_SUPABASE_URL</code>
            <code className="block text-gray-400">VITE_SUPABASE_ANON_KEY</code>
          </div>

          <p className="text-sm text-gray-400">
            Please check your Vercel project settings under <br />
            <strong>Settings &rarr; Environment Variables</strong>
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthComponent />
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
