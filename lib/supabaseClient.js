import { createClient } from '@supabase/supabase-js'

// Client-side Supabase — uses anon key (safe to expose)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null
