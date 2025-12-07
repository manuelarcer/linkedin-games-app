
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { Trophy, Medal } from 'lucide-react'

export default function Leaderboard() {
    const [rankings, setRankings] = useState({})
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month') // 'month' | 'all'

    useEffect(() => {
        fetchLeaderboardData()
    }, [])

    const fetchLeaderboardData = async () => {
        setLoading(true)
        try {
            // Fetch scores and profiles
            const { data: scores, error } = await supabase
                .from('scores')
                .select(`
          *,
          profiles (username, avatar_url)
        `)

            if (error) throw error

            const calculated = calculateRankings(scores || [])
            setRankings(calculated)
        } catch (error) {
            console.error('Error fetching leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    // Client-side point calculation logic (ported from notebook)
    const calculateRankings = (scores) => {
        // 1. Group by Game -> Puzzle ID
        const puzzles = {} // { 'Queens-123': [score1, score2...] }

        scores.forEach(score => {
            const key = `${score.game_type}-${score.puzzle_id}`
            if (!puzzles[key]) puzzles[key] = []
            puzzles[key].push(score)
        })

        // 2. Assign points per puzzle
        // Dense rank: Sort by time asc.
        const userPoints = {} // { userId: { username, total: 0, games: { Queens: 0... } } }

        Object.values(puzzles).forEach(puzzleScores => {
            // Sort by time
            puzzleScores.sort((a, b) => a.time_seconds - b.time_seconds)

            // Determine rank (handle ties)
            let currentRank = 1
            let currentPoints = 3 // 3 for 1st

            // Map time -> rank/points
            // If tie, same points.
            // Next non-tie gets next rank points?
            // Notebook used `method='dense'`: ties get same rank, next is +1.
            // Points map: 1->3, 2->2, 3->1.

            const timeToRank = {}
            let rankCounter = 1

            puzzleScores.forEach((s, index) => {
                if (index > 0 && s.time_seconds > puzzleScores[index - 1].time_seconds) {
                    rankCounter++
                }
                // If s.timeSeconds == prev, rankCounter stays same

                let points = 0
                if (rankCounter === 1) points = 3
                if (rankCounter === 2) points = 2
                if (rankCounter === 3) points = 1

                // Add to user total
                if (!userPoints[s.user_id]) {
                    userPoints[s.user_id] = {
                        username: s.profiles?.username || 'Unknown',
                        total: 0,
                        games: { Queens: 0, Tango: 0, Zip: 0, Sudoku: 0 }
                    }
                }

                userPoints[s.user_id].total += points
                userPoints[s.user_id].games[s.game_type] += points
            })
        })

        // Convert to array and sort by total
        return Object.values(userPoints).sort((a, b) => b.total - a.total)
    }

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-yellow-500 w-6 h-6" />
                <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-8">Calculating scores...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-500 text-sm border-b border-gray-800">
                                <th className="py-3 pl-4">Rank</th>
                                <th className="py-3">Player</th>
                                <th className="py-3 text-center">Queens</th>
                                <th className="py-3 text-center">Tango</th>
                                <th className="py-3 text-center">Zip</th>
                                <th className="py-3 text-center">Sudoku</th>
                                <th className="py-3 pr-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((user, index) => (
                                <tr key={user.username} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="py-4 pl-4 font-mono text-gray-400">
                                        {index + 1 === 1 ? <Medal className="w-5 h-5 text-yellow-500" /> :
                                            index + 1 === 2 ? <Medal className="w-5 h-5 text-gray-400" /> :
                                                index + 1 === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                                                    `#${index + 1}`}
                                    </td>
                                    <td className="py-4 font-medium text-white">{user.username}</td>
                                    <td className="py-4 text-center text-gray-400">{user.games.Queens}</td>
                                    <td className="py-4 text-center text-gray-400">{user.games.Tango}</td>
                                    <td className="py-4 text-center text-gray-400">{user.games.Zip}</td>
                                    <td className="py-4 text-center text-gray-400">{user.games.Sudoku}</td>
                                    <td className="py-4 pr-4 text-right font-bold text-[#646cff]">{user.total} pts</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
