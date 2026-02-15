import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client — uses SERVICE ROLE key (keep secret)
export default function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server')
  return createClient(url, key, { auth: { persistSession: false } })
}
