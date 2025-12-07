
import { useState } from 'react'
import { parseScore, calculatePoints } from '../utils/scoreParser'
import { supabase } from '../utils/supabaseClient'
import { Calendar, Clipboard, Gamepad2, Timer, Trophy } from 'lucide-react'

export default function ScoreInput({ onScoreSubmitted, user }) {
    const [activeTab, setActiveTab] = useState('paste') // 'manual' | 'paste'
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null) // { type: 'success'|'error', text: '' }

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        gameType: 'Queens',
        puzzleId: '',
        timeStr: '', // MM:SS
        date: new Date().toISOString().split('T')[0]
    })

    // Paste Form State
    const [pasteText, setPasteText] = useState('')

    const handleManualSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (!manualForm.timeStr.includes(':')) throw new Error('Time must be in MM:SS format')
            const [mins, secs] = manualForm.timeStr.split(':').map(Number)
            const timeSeconds = (mins * 60) + secs

            await submitScore({
                gameType: manualForm.gameType,
                puzzleId: parseInt(manualForm.puzzleId),
                puzzleDate: manualForm.date,
                timeSeconds
            })

            setManualForm({ ...manualForm, puzzleId: '', timeStr: '' })
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handlePasteSubmit = async () => {
        if (!pasteText) return
        setLoading(true)
        setMessage(null)

        try {
            const parsed = parseScore(pasteText)
            if (!parsed) {
                throw new Error('Could not find a valid score in the text. Make sure it matches the LinkedIn share format.')
            }

            await submitScore({
                gameType: parsed.gameType,
                puzzleId: parsed.puzzleId,
                puzzleDate: new Date().toISOString().split('T')[0], // Default to today for paste
                timeSeconds: parsed.timeSeconds
            })

            setPasteText('')
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    const submitScore = async ({ gameType, puzzleId, puzzleDate, timeSeconds }) => {
        // Check if score exists? Index should handle unique constraint
        const { error } = await supabase
            .from('scores')
            .insert({
                user_id: user.id,
                game_type: gameType,
                puzzle_id: puzzleId,
                puzzle_date: puzzleDate,
                time_seconds: timeSeconds
            })

        if (error) {
            if (error.code === '23505') throw new Error('You have already submitted a score for this puzzle.')
            throw error
        }

        setMessage({ type: 'success', text: `Successfully saved your ${gameType} score!` })
        if (onScoreSubmitted) onScoreSubmitted()
    }

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'manual' ? 'bg-[#2a2a2a] text-[#646cff]' : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual Entry
                </button>
                <button
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'paste' ? 'bg-[#2a2a2a] text-[#646cff]' : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('paste')}
                >
                    Paste Result
                </button>
            </div>

            <div className="p-6">
                {message && (
                    <div className={`p-3 mb-6 rounded text-sm ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Manual Form */}
                {activeTab === 'manual' && (
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Game</label>
                                <div className="relative">
                                    <Gamepad2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <select
                                        className="w-full bg-[#242424] border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-[#646cff]"
                                        value={manualForm.gameType}
                                        onChange={(e) => setManualForm({ ...manualForm, gameType: e.target.value })}
                                    >
                                        <option>Queens</option>
                                        <option>Tango</option>
                                        <option>Zip</option>
                                        <option>Sudoku</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Puzzle #</label>
                                <div className="relative">
                                    <Trophy className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[#242424] border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-[#646cff]"
                                        placeholder="e.g. 123"
                                        value={manualForm.puzzleId}
                                        onChange={(e) => setManualForm({ ...manualForm, puzzleId: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Time (MM:SS)</label>
                                <div className="relative">
                                    <Timer className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        pattern="\d+:[0-5]\d"
                                        title="Format: MM:SS (e.g. 01:30)"
                                        className="w-full bg-[#242424] border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-[#646cff]"
                                        placeholder="00:00"
                                        value={manualForm.timeStr}
                                        onChange={(e) => setManualForm({ ...manualForm, timeStr: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-[#242424] border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-[#646cff]"
                                        value={manualForm.date}
                                        onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-[#646cff] hover:bg-[#535bf2] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Score'}
                        </button>
                    </form>
                )}

                {/* Paste Form */}
                {activeTab === 'paste' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Paste WhatsApp Text</label>
                            <div className="relative">
                                <textarea
                                    autoFocus
                                    className="w-full h-32 bg-[#242424] border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#646cff]"
                                    placeholder={`Example:
Queens #123 1:30
You keep the streak alive!`}
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                />
                                <Clipboard className="absolute right-3 bottom-3 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                We'll automatically extract the game type, puzzle number, and time.
                            </p>
                        </div>

                        <button
                            onClick={handlePasteSubmit}
                            disabled={loading || !pasteText}
                            className="w-full py-2.5 bg-[#646cff] hover:bg-[#535bf2] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Parse & Save'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
