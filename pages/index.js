import { useState } from 'react'
import { useRouter } from 'next/router'

const STEPS = [
  'Personal Info',
  'Brand Vision',
  'Business Model',
  'Platforms & Posting',
  'Content Preferences'
]

function StepDots({ step }) {
  return (
    <div>
      <div className="steps-row">
        {STEPS.map((_, i) => (
          <div key={i} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
        ))}
      </div>
      <div className="note" style={{ marginBottom: 24 }}>
        Step {step + 1} of {STEPS.length} — <strong style={{ color: '#e2e8f0' }}>{STEPS[step]}</strong>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '', profession: '', industry: '', yearsExperience: '',
    primaryGoal: 'authority', whyBuild: '', knownFor: '',
    businessType: '', targetAudience: '', offers: '',
    platforms: ['Twitter', 'LinkedIn'], postingFrequency: '3x/week', timePerWeek: 5,
    contentFormats: ['short-form'], cameraComfort: 'medium', contentStrengths: '', editingSkill: 'basic'
  })

  const u = (p) => setForm((f) => ({ ...f, ...p }))
  const next = () => step < STEPS.length - 1 && setStep((s) => s + 1)
  const back = () => step > 0 && setStep((s) => s - 1)

  async function finish() {
    setSubmitting(true)
    try {
      const r = await fetch('/api/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName, profession: form.profession, industry: form.industry,
          years_experience: parseInt(form.yearsExperience || 0, 10),
          brandVision: { primary_goal: form.primaryGoal, why: form.whyBuild, known_for: form.knownFor },
          businessModel: { business_type: form.businessType, target_audience: form.targetAudience, offers: form.offers },
          platforms: { platforms: form.platforms, posting_frequency: form.postingFrequency, time_per_week: form.timePerWeek },
          contentPreferences: { content_formats: form.contentFormats, camera_comfort_level: form.cameraComfort, content_strengths: form.contentStrengths, editing_skill_level: form.editingSkill }
        })
      })
      const data = await r.json()
      if (r.ok) router.push(`/dashboard?profileId=${data.profileId}`)
      else alert(data.error || 'Failed to save onboarding')
    } catch (err) { alert(String(err)) }
    setSubmitting(false)
  }

  const fields = {
    0: [
      ['Full name', 'fullName'], ['Profession', 'profession'],
      ['Industry', 'industry'], ['Years of experience', 'yearsExperience']
    ],
    2: [
      ['Business type', 'businessType'], ['Target audience', 'targetAudience'],
      ['Offers / services', 'offers']
    ],
    3: [
      ['Platforms (comma-separated)', 'platforms', true],
      ['Posting frequency', 'postingFrequency'],
      ['Time available per week (hrs)', 'timePerWeek']
    ]
  }

  return (
    <main className="container">
      <h1>Personal Brand Strategist</h1>
      <p className="description">Answer a few questions and we'll build your brand profile and AI-powered content strategy.</p>

      <StepDots step={step} />

      <section>
        {fields[step] ? fields[step].map(([label, key, isArray]) => (
          <div key={key}>
            <label>{label}</label>
            <input
              value={isArray ? form[key].join(', ') : form[key]}
              onChange={(e) => u({ [key]: isArray ? e.target.value.split(',').map(s => s.trim()) : e.target.value })}
              placeholder={label}
            />
          </div>
        )) : step === 1 ? (
          <>
            <label>Primary goal</label>
            <select value={form.primaryGoal} onChange={(e) => u({ primaryGoal: e.target.value })}>
              <option value="authority">Authority</option>
              <option value="leads">Leads</option>
              <option value="growth">Growth</option>
              <option value="monetization">Monetization</option>
            </select>
            <label>Why do you want to build a brand?</label>
            <input value={form.whyBuild} onChange={(e) => u({ whyBuild: e.target.value })} placeholder="Your motivation" />
            <label>What do you want to be known for?</label>
            <input value={form.knownFor} onChange={(e) => u({ knownFor: e.target.value })} placeholder="Your expertise" />
          </>
        ) : (
          <>
            <label>Content formats (comma-separated)</label>
            <input value={form.contentFormats.join(', ')} onChange={(e) => u({ contentFormats: e.target.value.split(',').map(s=>s.trim()) })} placeholder="short-form, threads, video" />
            <label>Camera comfort level</label>
            <select value={form.cameraComfort} onChange={(e) => u({ cameraComfort: e.target.value })}>
              <option value="none">None</option><option value="low">Low</option>
              <option value="medium">Medium</option><option value="high">High</option>
            </select>
            <label>Content strengths</label>
            <input value={form.contentStrengths} onChange={(e) => u({ contentStrengths: e.target.value })} placeholder="Writing, storytelling, data…" />
            <label>Editing skill level</label>
            <select value={form.editingSkill} onChange={(e) => u({ editingSkill: e.target.value })}>
              <option value="none">None</option><option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </>
        )}
      </section>

      <div className="btn-row">
        <button className="btn-secondary" onClick={back} disabled={step === 0}>← Back</button>
        {step < STEPS.length - 1 ? (
          <button className="btn-primary" onClick={next}>Next →</button>
        ) : (
          <button className="btn-primary" onClick={finish} disabled={submitting}>
            {submitting ? 'Saving…' : '✨ Finish & Generate Strategy'}
          </button>
        )}
      </div>

      <p className="note" style={{ marginTop: 20, textAlign: 'center' }}>You can update these later from the Dashboard.</p>
      <p className="note" style={{ marginTop: 12, textAlign: 'center' }}>
        Or try <a href="/meditate" style={{ color: 'var(--accent)' }}>🙏 Veda Verse</a> — AI-powered meditation.
      </p>
    </main>
  )
}
