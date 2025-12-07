
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'

// Fallback Dashboard manually defined for now until we create the file
// const Dashboard = () => <div className="p-4"><h1>Dashboard</h1><p>Welcome to Score Tracker</p></div>


function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
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
