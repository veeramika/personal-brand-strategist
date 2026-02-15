import getAdminClient from '../../lib/supabaseAdmin'

// POST /api/generate-strategy { profileId }
// - fetches profile data, generates (mock or via OPENAI_API_KEY) strategy payload
// - saves niche_positioning, posting_plan, content_ideas

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')
  const admin = getAdminClient()
  const { profileId } = req.body || {}
  if (!profileId) return res.status(400).json({ error: 'profileId required' })

  try {
    // fetch aggregated profile
    const { data: profile } = await admin.from('profiles').select('*').eq('id', profileId).single()
    if (!profile) return res.status(404).json({ error: 'profile not found' })

    const [{ data: business }] = await Promise.all([
      admin.from('business_models').select('*').eq('profile_id', profileId).limit(1)
    ])

    // Build a prompt-like summary (we'll use this for a real AI call later)
    const seed = {
      name: profile.full_name || 'Creator',
      profession: profile.profession || '',
      industry: profile.industry || '',
      years_experience: profile.years_experience || 0,
      business_type: (business && business[0] && business[0].business_type) || ''
    }

    // If OPENAI_API_KEY present, call OpenAI (ChatCompletion) — otherwise return mocked data
    let result
    if (process.env.OPENAI_API_KEY) {
      // Simple structured prompt — you can extend this later
      const prompt = `Create a short niche positioning summary, platform growth strategy, recommended posting frequency, content mix, and 10 content ideas for a user with: ${JSON.stringify(seed)}`
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
      })
      const body = await resp.json()
      const text = (body?.choices?.[0]?.message?.content) || ''
      // naive parse — store the raw text in generated_summary and split last lines as ideas
      result = { summary: text, posting: '3x/week', contentMix: '40% short-form, 30% long-form, 30% repurposed', ideas: Array.from({ length: 10 }).map((_, i) => `AI idea ${i + 1}: ${text.slice(0, 40)}...`) }
    } else {
      // mocked strategy (useful for demo / offline)
      result = {
        summary: `${seed.name} — short positioning: Experienced ${seed.profession} in ${seed.industry} building authority and monetizable audience.`,
        posting: '3x/week (mix: 2 short-form, 1 long-form)',
        contentMix: 'Short-form (50%), Long-form (30%), Educational (20%)',
        ideas: [
          `How I started in ${seed.industry}`,
          `Top 5 mistakes in ${seed.profession}`,
          `A day in the life — ${seed.profession}`,
          `Case study: small wins that scaled`,
          `Quick tip: actionable advice for ${seed.target_audience || 'your audience'}`,
          `My toolkit for ${seed.profession}`,
          `Before / After client story`,
          `Mini-tutorial — 5 minutes to improve results`,
          `Trend take: what I agree/disagree with`,
          `Monthly roundup: learnings and experiments`
        ]
      }
    }

    // persist outputs
    await admin.from('niche_positioning').upsert({ profile_id: profileId, generated_summary: result.summary, primary_goal: null, why_build: null, known_for: null })

    await admin.from('posting_plan').upsert({ profile_id: profileId, recommended_frequency: result.posting, weekly_schedule: { suggested: result.posting } })

    // replace older ideas with the new set (simple approach)
    await admin.from('content_ideas').insert(result.ideas.map((idea) => ({ profile_id: profileId, idea })))

    return res.status(200).json({ result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
