
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client

if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey)
} else {
    console.error('Missing Supabase environment variables. App will not function correctly.')
    // Fallback dummy client to prevent crash at import time
    client = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signOut: () => Promise.resolve()
        },
        from: () => ({
            select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }) }),
            upsert: () => Promise.resolve({ error: 'Missing Credentials' }),
            insert: () => Promise.resolve({ error: 'Missing Credentials' })
        })
    }
}

export const supabase = client
