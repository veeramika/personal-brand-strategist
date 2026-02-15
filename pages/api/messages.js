import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  // If Supabase service key is not set, return demo data for GET and error for POST
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (req.method === 'GET') {
      return res.status(200).json({ messages: [
        { id: 'demo-1', content: 'Demo message — configure SUPABASE to persist', created_at: new Date().toISOString() }
      ] })
    }
    if (req.method === 'POST') {
      return res.status(501).json({ error: 'Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY.' })
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('messages').select('id,content,created_at').order('created_at', { ascending: false }).limit(50)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ messages: data })
  }

  if (req.method === 'POST') {
    const { content } = req.body
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'Empty content' })
    const { data, error } = await supabase.from('messages').insert([{ content }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ message: data })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
