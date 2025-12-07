
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthComponent() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const players = ['JC', 'Aman', 'Silvia', 'Juanito', 'ValeriaOrtiz', 'San']

    const handleLogin = async (name) => {
        setLoading(true)
        setError(null)
        const email = `${name.toLowerCase().replace(/\s+/g, '')}@example.com`

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: 'password123',
            })
            if (error) throw error
        } catch (error) {
            console.error('Login error:', error)
            setError('Could not sign in. Did you run the seed script?')
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#242424] p-4 text-white">
            <div className="w-full max-w-md p-8 bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800">
                <h1 className="text-3xl font-bold text-center mb-2">Who are you?</h1>
                <p className="text-center text-gray-400 mb-8">Select your profile to continue</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {players.map((player) => (
                        <button
                            key={player}
                            onClick={() => handleLogin(player)}
                            disabled={loading}
                            className="p-4 bg-gray-800 hover:bg-gray-700 active:bg-blue-600 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2 group border border-gray-700 hover:border-gray-600"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                {player.charAt(0)}
                            </div>
                            <span className="font-medium">{player}</span>
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="mt-6 text-center text-gray-500 text-sm animate-pulse">
                        Signing in...
                    </div>
                )}
            </div>
        </div>
    )
}
