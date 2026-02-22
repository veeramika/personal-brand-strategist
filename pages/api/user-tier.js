// GET /api/user-tier?userId=xxx
// Returns { tier: 'free' | 'premium' }
// Checks Supabase users table for subscription status

import getAdminClient from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { userId } = req.query
  if (!userId) return res.json({ tier: 'free' })

  try {
    const admin = getAdminClient()
    const { data } = await admin
      .from('user_tiers')
      .select('tier')
      .eq('user_id', userId)
      .single()

    return res.json({ tier: data?.tier || 'free' })
  } catch {
    // Supabase not configured or table doesn't exist — default free
    return res.json({ tier: 'free' })
  }
}
