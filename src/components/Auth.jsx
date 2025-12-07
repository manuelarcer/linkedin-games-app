
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthComponent() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#242424] p-4">
            <div className="w-full max-w-md p-8 bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800">
                <h1 className="text-3xl font-bold text-center mb-2 text-white">Score Tracker</h1>
                <p className="text-center text-gray-400 mb-8">Sign in to track your LinkedIn Games scores</p>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#646cff',
                                    brandAccent: '#535bf2',
                                    inputBackground: '#2a2a2a',
                                    inputText: 'white',
                                    inputBorder: '#4a4a4a',
                                },
                            },
                        },
                    }}
                    providers={['google']}
                    redirectTo={window.location.origin}
                />
            </div>
        </div>
    )
}
