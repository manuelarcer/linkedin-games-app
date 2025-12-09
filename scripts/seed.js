
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Error: Please provide VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
    console.log('Usage: VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function seed() {
    try {
        // 1. Read Data
        const jsonPath = path.join(__dirname, '../games_scores_data.json')
        const rawData = fs.readFileSync(jsonPath, 'utf-8')
        const data = JSON.parse(rawData)

        console.log(`Loaded ${data.raw_scores.length} scores from JSON.`)

        // 2. Identify Unique Players
        const players = [...new Set(data.raw_scores.map(s => s.player))]
        console.log('Found players:', players)

        const playerMap = {} // Name -> UUID

        // 3. Create or Update Users
        for (const name of players) {
            const email = `${name.toLowerCase().replace(/\s+/g, '')}@example.com`
            const password = 'password123'

            console.log(`Processing user: ${name} (${email})...`)

            // Check if user exists by email (simplified) - creating usually fails if exists
            // We'll try to create, if catch error, we search.
            let userId = null

            // This requires SERVICE_ROLE_KEY to use admin functions
            const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { username: name }
            })

            if (createError) {
                // Assume user exists or error
                // Try to list users to find this one
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
                const existing = users.find(u => u.email === email)

                if (existing) {
                    userId = existing.id
                    console.log(`  - User exists: ${userId}`)
                } else {
                    console.error(`  - Failed to create/find users: ${createError.message}`)
                    continue;
                }
            } else {
                userId = user.id
                console.log(`  - Created user: ${userId}`)
            }

            playerMap[name] = userId

            // Ensure Profile Exists
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    username: name,
                    updated_at: new Date()
                })

            if (profileError) {
                console.error(`  - Profile error: ${profileError.message}`)
            }
        }

        // 4. Transform and Insert Scores
        console.log('Inserting scores...')

        const scoresToInsert = data.raw_scores.map(item => {
            const userId = playerMap[item.player]
            if (!userId) return null

            return {
                user_id: userId,
                game_type: item.game, // Mapping 'Zip' -> 'Zip'
                puzzle_id: item.id,
                puzzle_date: item.puzzle_date,
                time_seconds: item.time_sec,
                created_at: item.message_datetime || new Date().toISOString()
            }
        }).filter(Boolean)

        // Batch insert to avoid timeouts
        const BATCH_SIZE = 1000
        for (let i = 0; i < scoresToInsert.length; i += BATCH_SIZE) {
            const batch = scoresToInsert.slice(i, i + BATCH_SIZE)
            const { error } = await supabase.from('scores').upsert(batch, {
                onConflict: 'user_id, game_type, puzzle_id',
                ignoreDuplicates: true
            })

            if (error) {
                console.error(`Error inserting batch ${i}:`, error.message)
            } else {
                console.log(`  - Inserted batch ${i} - ${i + batch.length}`)
            }
        }

        console.log('Seeding complete!')

    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

seed()
