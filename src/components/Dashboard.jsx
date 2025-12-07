import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import ScoreInput from './ScoreInput'
import Leaderboard from './Leaderboard'

export default function Dashboard({ session }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      checkProfile(session.user)
      fetchScores(session.user.id)
    }
  }, [session])

  const checkProfile = async (user) => {
    // Upsert profile to ensure it exists
    // In a real app, you might want to ask for username first
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.email.split('@')[0],
        updated_at: new Date()
      }, { onConflict: 'id' })

    if (error) console.error('Error creating profile:', error)
  }

  const fetchScores = async (userId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setScores(data || [])
    } catch (error) {
      console.error('Error fetching scores:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Games Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome, {session.user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Input */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[#646cff]">Submit New Score</h2>
          <ScoreInput user={session.user} onScoreSubmitted={() => fetchScores(session.user.id)} />
        </div>

        {/* Right Column: Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[#646cff]">Recent Activity</h2>
          {loading ? (
            <div className="text-gray-500 animate-pulse">Loading scores...</div>
          ) : scores.length === 0 ? (
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 text-center text-gray-400">
              <p>No scores submitted yet.</p>
              <p className="text-sm mt-2">Paste your first result to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <div key={score.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white">{score.game_type}</span>
                    <span className="text-gray-500 text-sm ml-2">#{score.puzzle_id}</span>
                    <div className="text-xs text-gray-500">{score.puzzle_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[#646cff] font-bold">
                      {Math.floor(score.time_seconds / 60)}:{(score.time_seconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Width Leaderboard */}
      <Leaderboard />
    </div>
  )
}
