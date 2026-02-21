import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  const { profileId } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    fetch(`/api/profile?profileId=${profileId}`)
      .then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileId])

  async function generate() {
    setGenerating(true)
    const res = await fetch('/api/generate-strategy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    })
    const body = await res.json()
    setGenerating(false)
    if (res.ok) fetch(`/api/profile?profileId=${profileId}`).then(r => r.json()).then(d => setData(d))
    else alert(body.error || 'Failed')
  }

  if (!profileId) return <main className="container"><p className="note" style={{ marginTop: 80, textAlign: 'center' }}>No profile found. <a href="/" style={{ color: 'var(--accent)' }}>Start onboarding →</a></p></main>
  if (loading || !data) return <main className="container"><p className="note" style={{ marginTop: 80, textAlign: 'center' }}>Loading…</p></main>

  const { profile, business, niche, platforms, contentPreferences, postingPlan, contentIdeas } = data

  const cards = [
    { title: 'Positioning', content: niche?.generated_summary || 'Not generated yet — hit the button below.' },
    { title: 'Platforms', content: platforms ? `Focus on ${platforms.platforms?.join(', ')}` : 'No platforms set' },
    { title: 'Posting Plan', content: postingPlan?.recommended_frequency || 'Not generated yet' },
    { title: 'Weekly Schedule', content: postingPlan?.weekly_schedule ? JSON.stringify(postingPlan.weekly_schedule, null, 2) : 'Not generated yet' },
  ]

  return (
    <main className="container">
      <h1>Dashboard</h1>
      <p className="description">Your brand profile and AI-generated strategy.</p>

      <section>
        <h3>Brand Profile</h3>
        <div className="stat-value">{profile.full_name}</div>
        <p className="note" style={{ marginTop: 4 }}>
          {profile.profession} · {profile.industry} · {profile.years_experience} yrs experience
        </p>
        {business && <p className="note" style={{ marginTop: 8 }}>{business.business_type} → {business.target_audience}</p>}
      </section>

      {cards.map((c) => (
        <section key={c.title}>
          <h3>{c.title}</h3>
          <p className="note" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>
        </section>
      ))}

      <section>
        <h3>Content Ideas</h3>
        {contentIdeas?.length > 0 ? (
          <ul>
            {contentIdeas.map((c) => <li key={c.id}>{c.idea}</li>)}
          </ul>
        ) : (
          <p className="note">No ideas yet — generate a strategy to get started.</p>
        )}
      </section>

      <div className="btn-row">
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? 'Generating…' : '✨ Generate AI Strategy'}
        </button>
        <button className="btn-secondary" onClick={() => router.push('/')}>Edit Onboarding</button>
      </div>

      <p className="note" style={{ marginTop: 20, textAlign: 'center' }}>
        Coming soon: analytics, scheduling, and content calendar.
      </p>
    </main>
  )
}
