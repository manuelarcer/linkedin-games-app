
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'

// Debug state
const [lastEvent, setLastEvent] = useState('NONE')
const [debugUrl, setDebugUrl] = useState('')

useEffect(() => {
  // Capture URL on mount to see if hash is present
  setDebugUrl(window.location.href)

  if (!supabase) {
    setConfigError(true)
    setLoading(false)
    return
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setLoading(false)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session)
    setLastEvent(event)
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

// Debug UI Component
const DebugPanel = () => (
  <div className="fixed bottom-0 left-0 w-full bg-black/90 text-xs text-green-400 p-2 font-mono break-all z-50 border-t border-green-900 opacity-75 hover:opacity-100 transition-opacity">
    <p>LOADING: {loading.toString()}</p>
    <p>EVENT: {lastEvent}</p>
    <p>SESSION: {session ? session.user.email : 'NULL'}</p>
    <p>URL contains hash: {debugUrl.includes('#') ? 'YES' : 'NO'}</p>
    <p>Config Error: {configError.toString()}</p>
  </div>
)

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
