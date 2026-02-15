import { useState } from 'react'
import { useRouter } from 'next/router'

const STEPS = [
  'Personal Info',
  'Brand Vision',
  'Business Model',
  'Platforms & Posting',
  'Content Preferences'
]

function Progress({ step }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
        <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: 8, background: '#7c3aed', borderRadius: 8 }} />
      </div>
      <div className="note" style={{ marginTop: 8 }}>{STEPS[step]}</div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    profession: '',
    industry: '',
    yearsExperience: '',
    primaryGoal: 'authority',
    whyBuild: '',
    knownFor: '',
    businessType: '',
    targetAudience: '',
    offers: '',
    platforms: ['Twitter', 'LinkedIn'],
    postingFrequency: '3x/week',
    timePerWeek: 5,
    contentFormats: ['short-form'],
    cameraComfort: 'medium',
    contentStrengths: '',
    editingSkill: 'basic'
  })

  function update(partial) {
    setForm((f) => ({ ...f, ...partial }))
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }
  function back() {
    if (step > 0) setStep((s) => s - 1)
  }

  async function finish() {
    setSubmitting(true)
    try {
      const payload = {
        fullName: form.fullName,
        profession: form.profession,
        industry: form.industry,
        years_experience: parseInt(form.yearsExperience || 0, 10),
        brandVision: { primary_goal: form.primaryGoal, why: form.whyBuild, known_for: form.knownFor },
        businessModel: { business_type: form.businessType, target_audience: form.targetAudience, offers: form.offers },
        platforms: { platforms: form.platforms, posting_frequency: form.postingFrequency, time_per_week: form.timePerWeek },
        contentPreferences: { content_formats: form.contentFormats, camera_comfort_level: form.cameraComfort, content_strengths: form.contentStrengths, editing_skill_level: form.editingSkill }
      }
      const r = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await r.json()
      if (r.ok) {
        router.push(`/dashboard?profileId=${data.profileId}`)
      } else {
        alert(data.error || 'Failed to save onboarding')
      }
    } catch (err) {
      alert(String(err))
    }
    setSubmitting(false)
  }

  return (
    <main className="container">
      <h1>Personal Brand — Onboarding</h1>
      <p className="description">A short conversational onboarding to build your brand profile. Progress is saved to Supabase.</p>

      <Progress step={step} />

      {step === 0 && (
        <section>
          <label className="note">Full name</label>
          <input value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
          <label className="note">Profession</label>
          <input value={form.profession} onChange={(e) => update({ profession: e.target.value })} />
          <label className="note">Industry</label>
          <input value={form.industry} onChange={(e) => update({ industry: e.target.value })} />
          <label className="note">Years of experience</label>
          <input value={form.yearsExperience} onChange={(e) => update({ yearsExperience: e.target.value })} />
        </section>
      )}

      {step === 1 && (
        <section>
          <label className="note">Primary goal</label>
          <select value={form.primaryGoal} onChange={(e) => update({ primaryGoal: e.target.value })}>
            <option value="authority">Authority</option>
            <option value="leads">Leads</option>
            <option value="growth">Growth</option>
            <option value="monetization">Monetization</option>
          </select>
          <label className="note">Why do you want to build a brand?</label>
          <input value={form.whyBuild} onChange={(e) => update({ whyBuild: e.target.value })} />
          <label className="note">What do you want to be known for?</label>
          <input value={form.knownFor} onChange={(e) => update({ knownFor: e.target.value })} />
        </section>
      )}

      {step === 2 && (
        <section>
          <label className="note">Business type</label>
          <input value={form.businessType} onChange={(e) => update({ businessType: e.target.value })} />
          <label className="note">Target audience</label>
          <input value={form.targetAudience} onChange={(e) => update({ targetAudience: e.target.value })} />
          <label className="note">Offers / services</label>
          <input value={form.offers} onChange={(e) => update({ offers: e.target.value })} />
        </section>
      )}

      {step === 3 && (
        <section>
          <label className="note">Platforms (comma-separated)</label>
          <input value={form.platforms.join(', ')} onChange={(e) => update({ platforms: e.target.value.split(',').map(s => s.trim()) })} />
          <label className="note">Posting frequency</label>
          <input value={form.postingFrequency} onChange={(e) => update({ postingFrequency: e.target.value })} />
          <label className="note">Time available per week (hrs)</label>
          <input value={form.timePerWeek} onChange={(e) => update({ timePerWeek: e.target.value })} />
        </section>
      )}

      {step === 4 && (
        <section>
          <label className="note">Content formats you are comfortable with</label>
          <input value={form.contentFormats.join(', ')} onChange={(e) => update({ contentFormats: e.target.value.split(',').map(s=>s.trim()) })} />
          <label className="note">Camera comfort level</label>
          <select value={form.cameraComfort} onChange={(e) => update({ cameraComfort: e.target.value })}>
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label className="note">Content strengths</label>
          <input value={form.contentStrengths} onChange={(e) => update({ contentStrengths: e.target.value })} />
          <label className="note">Editing skill level</label>
          <select value={form.editingSkill} onChange={(e) => update({ editingSkill: e.target.value })}>
            <option value="none">None</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={back} disabled={step === 0}>Back</button>
        {step < STEPS.length - 1 ? (
          <button onClick={next}>Next</button>
        ) : (
          <button onClick={finish} disabled={submitting}>{submitting ? 'Saving…' : 'Finish & Generate Strategy'}</button>
        )}
      </div>

      <div className="note" style={{ marginTop: 18 }}>
        Tip: you can update these later in the Dashboard.
      </div>
    </main>
  )
}
