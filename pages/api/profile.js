import getAdminClient from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
  const admin = getAdminClient()
  const profileId = req.query.profileId || null

  try {
    // if no profileId provided, return demo profile for demo@example.com
    if (!profileId) {
      const { data: u } = await admin.from('users').select('id').eq('email', 'demo@example.com').limit(1).single()
      if (!u) return res.status(404).json({ error: 'demo user not found' })
      const { data: p } = await admin.from('profiles').select('*').eq('user_id', u.id).limit(1).single()
      if (!p) return res.status(404).json({ error: 'profile not found for demo user' })
      return fetchAggregatedProfile(admin, p.id, res)
    }

    return fetchAggregatedProfile(admin, profileId, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

async function fetchAggregatedProfile(admin, profileId, res) {
  const [{ data: profile }, { data: business }, { data: niche }, { data: platforms }, { data: contentPref }, { data: posting }, { data: ideas }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', profileId).single(),
    admin.from('business_models').select('*').eq('profile_id', profileId).limit(1),
    admin.from('niche_positioning').select('*').eq('profile_id', profileId).limit(1),
    admin.from('user_platforms').select('*').eq('profile_id', profileId).limit(1),
    admin.from('content_preferences').select('*').eq('profile_id', profileId).limit(1),
    admin.from('posting_plan').select('*').eq('profile_id', profileId).limit(1),
    admin.from('content_ideas').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50)
  ])

  res.status(200).json({ profile, business: business[0] || null, niche: niche[0] || null, platforms: platforms[0] || null, contentPreferences: contentPref[0] || null, postingPlan: posting[0] || null, contentIdeas: ideas || [] })
}
