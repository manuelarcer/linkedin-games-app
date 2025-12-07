
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    // Check if configuration is missing
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
      setConfigError(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (configError) {
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-red-900/20 border border-red-700 p-6 rounded-xl">
          <h1 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h1>
          <p className="mb-4">The application could not connect to the database.</p>
          <div className="text-sm bg-black/50 p-3 rounded">
            <strong>Missing Environment Variable:</strong><br />
            <code>VITE_SUPABASE_URL</code>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            If you are on Vercel, please go to <strong>Settings {'>'} Environment Variables</strong> and add your Supabase credentials.
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
