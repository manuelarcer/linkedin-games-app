
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client = null

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey) {
    try {
        client = createClient(supabaseUrl, supabaseAnonKey)
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e)
    }
} else {
    console.warn('Missing Supabase environment variables')
}

export const supabase = client
