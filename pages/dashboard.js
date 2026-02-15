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
    fetch(`/api/profile?profileId=${profileId}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [profileId])

  async function generate() {
    setGenerating(true)
    const res = await fetch('/api/generate-strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId }) })
    const body = await res.json()
    setGenerating(false)
    if (res.ok) {
      // re-fetch
      fetch(`/api/profile?profileId=${profileId}`).then(r => r.json()).then(d => setData(d))
    } else alert(body.error || 'Failed')
  }

  if (!profileId) return <main className="container"><div className="note">No profileId provided. Start onboarding first.</div></main>
  if (loading || !data) return <main className="container"><div className="note">Loading…</div></main>

  const { profile, business, niche, platforms, contentPreferences, postingPlan, contentIdeas } = data

  return (
    <main className="container">
      <h1>Dashboard</h1>
      <p className="description">Brand summary and AI strategy (saved to Supabase).</p>

      <section style={{ marginBottom: 18 }}>
        <h3>Brand summary</h3>
        <div className="note"><strong>{profile.full_name}</strong> — {profile.profession} in {profile.industry} ({profile.years_experience} yrs)</div>
        <div style={{ marginTop: 8 }}>{business && <div><strong>Business:</strong> {business.business_type} — {business.target_audience}</div>}</div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Recommended positioning</h3>
        <div className="note">{(niche && niche.generated_summary) || 'No generated positioning yet'}</div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Platform strategy</h3>
        <div className="note">{platforms ? `Focus on: ${platforms.platforms?.join(', ')}` : 'No platforms set'}</div>
        <div className="note">Posting frequency: {postingPlan?.recommended_frequency || 'Not set'}</div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Weekly posting schedule</h3>
        <div className="note">{postingPlan?.weekly_schedule ? JSON.stringify(postingPlan.weekly_schedule) : 'No schedule yet'}</div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Content mix suggestion</h3>
        <div className="note">{postingPlan?.recommended_frequency || 'No suggestion yet'}</div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Content ideas</h3>
        <ul>
          {contentIdeas && contentIdeas.length > 0 ? contentIdeas.map((c) => <li key={c.id}>{c.idea}</li>) : <li className="badge">No ideas yet</li>}
        </ul>
      </section>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generate} disabled={generating}>{generating ? 'Generating…' : 'Generate AI Strategy'}</button>
        <button onClick={() => router.push('/')}>Edit onboarding</button>
      </div>

      <div className="note" style={{ marginTop: 18 }}>Future features: analytics, scheduling, and content calendar (schema ready).</div>
    </main>
  )
}
