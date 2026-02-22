import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Phases ─── */
const PHASE_INPUT = 'input'
const PHASE_LOADING = 'loading'
const PHASE_SESSION = 'session'

/* ─── Breathing Loader ─── */
function BreathingLoader() {
  return (
    <div className="m-loader-wrap">
      <div className="m-breath-ring" />
      <p className="m-loader-text">Crafting your experience…</p>
      <p className="m-loader-sub">Breathe in… and out…</p>
      <style jsx>{`
        .m-loader-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:20px; }
        .m-breath-ring {
          width:120px; height:120px; border-radius:50%;
          border:3px solid rgba(255,255,255,0.15);
          box-shadow: 0 0 40px rgba(139,92,246,0.3), inset 0 0 40px rgba(139,92,246,0.1);
          animation: breathe 5s ease-in-out infinite;
        }
        @keyframes breathe {
          0%,100% { transform:scale(0.8); opacity:0.5; }
          50% { transform:scale(1.2); opacity:1; }
        }
        .m-loader-text { font-size:18px; font-weight:500; color:#e2e8f0; }
        .m-loader-sub { font-size:14px; color:#7a8599; }
      `}</style>
    </div>
  )
}

/* ─── Session Player ─── */
function SessionPlayer({ session, onReset }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const steps = session.script.steps
  const current = steps[stepIdx]
  const totalDuration = current.durationSec

  // Timer logic
  useEffect(() => {
    if (!playing) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalDuration) {
          // auto-advance
          if (stepIdx < steps.length - 1) {
            setStepIdx(i => i + 1)
            return 0
          }
          setPlaying(false)
          return totalDuration
        }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [playing, stepIdx, totalDuration, steps.length])

  const goStep = useCallback((i) => { setStepIdx(i); setElapsed(0) }, [])
  const toggle = () => setPlaying(p => !p)
  const pct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0

  const { atmosphere, soundProfile, culturalElement } = session

  return (
    <div className="m-session" style={{ background: atmosphere.gradient, minHeight: '100vh', transition: 'background 1.5s ease' }}>
      <div className="m-session-inner">
        {/* Title */}
        <h1 className="m-title">{session.script.title}</h1>

        {/* Step nav */}
        <div className="m-step-nav">
          {steps.map((s, i) => (
            <button key={i} onClick={() => goStep(i)}
              className={`m-step-btn ${i === stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Script card */}
        <div className="m-card m-script-card">
          <div className="m-step-label">{current.label}</div>
          <p className="m-script-text">{current.text}</p>
          <div className="m-progress-track"><div className="m-progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="m-timer">{elapsed}s / {totalDuration}s</div>
        </div>

        {/* Controls */}
        <div className="m-controls">
          <button className="m-ctrl-btn" onClick={() => goStep(Math.max(0, stepIdx - 1))}>⏮</button>
          <button className="m-ctrl-btn m-play-btn" onClick={toggle}>{playing ? '⏸' : '▶'}</button>
          <button className="m-ctrl-btn" onClick={() => goStep(Math.min(steps.length - 1, stepIdx + 1))}>⏭</button>
        </div>

        {/* Cultural element */}
        <div className="m-card m-culture-card">
          <div className="m-culture-type">{culturalElement.type}</div>
          <p className="m-culture-original">{culturalElement.original}</p>
          <p className="m-culture-translation">{culturalElement.translation}</p>
          <p className="m-culture-context">{culturalElement.context}</p>
        </div>

        {/* Sound profile */}
        <div className="m-card m-sound-card">
          <span className="m-sound-freq">{soundProfile.frequency}Hz {soundProfile.wave}</span>
          <span className="m-sound-desc">{soundProfile.description}</span>
        </div>

        <button className="m-reset-btn" onClick={onReset}>← New Session</button>
      </div>

      <style jsx>{`
        .m-session { padding:0; }
        .m-session-inner { max-width:680px; margin:0 auto; padding:48px 20px 64px; }
        .m-title { font-size:28px; font-weight:700; text-align:center; margin-bottom:28px; color:#fff; text-shadow:0 2px 20px rgba(0,0,0,0.4); }

        .m-step-nav { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-bottom:24px; }
        .m-step-btn {
          padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.6); font-size:12px;
          cursor:pointer; transition:all 0.3s; font-family:inherit;
        }
        .m-step-btn.active { background:rgba(255,255,255,0.18); color:#fff; border-color:rgba(255,255,255,0.3); }
        .m-step-btn.done { color:rgba(52,211,153,0.8); border-color:rgba(52,211,153,0.3); }

        .m-card { background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:24px; margin-bottom:16px; }

        .m-step-label { font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:rgba(255,255,255,0.5); margin-bottom:12px; }
        .m-script-text { font-size:17px; line-height:1.7; color:rgba(255,255,255,0.9); margin-bottom:20px; }

        .m-progress-track { height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; }
        .m-progress-fill { height:100%; background:linear-gradient(90deg,#8b5cf6,#a78bfa); border-radius:4px; transition:width 1s linear; }
        .m-timer { font-size:12px; color:rgba(255,255,255,0.4); margin-top:8px; text-align:right; }

        .m-controls { display:flex; justify-content:center; gap:16px; margin-bottom:24px; }
        .m-ctrl-btn {
          width:48px; height:48px; border-radius:50%; border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.08); color:#fff; font-size:18px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:all 0.2s; font-family:inherit;
        }
        .m-ctrl-btn:hover { background:rgba(255,255,255,0.15); }
        .m-play-btn { width:56px; height:56px; font-size:22px; background:rgba(139,92,246,0.3); border-color:rgba(139,92,246,0.5); }

        .m-culture-card { text-align:center; }
        .m-culture-type { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.4); margin-bottom:12px; }
        .m-culture-original { font-size:22px; font-weight:500; color:#fff; margin-bottom:8px; line-height:1.5; }
        .m-culture-translation { font-size:15px; color:rgba(255,255,255,0.7); font-style:italic; margin-bottom:12px; line-height:1.5; }
        .m-culture-context { font-size:13px; color:rgba(255,255,255,0.4); line-height:1.5; }

        .m-sound-card { display:flex; align-items:center; gap:14px; }
        .m-sound-freq { font-size:14px; font-weight:600; color:#a78bfa; white-space:nowrap; }
        .m-sound-desc { font-size:13px; color:rgba(255,255,255,0.5); line-height:1.4; }

        .m-reset-btn {
          display:block; margin:24px auto 0; padding:10px 24px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.6); font-size:14px; cursor:pointer; font-family:inherit;
          transition:all 0.2s;
        }
        .m-reset-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }

        @media(max-width:600px) {
          .m-title { font-size:22px; }
          .m-script-text { font-size:15px; }
          .m-culture-original { font-size:18px; }
        }
      `}</style>
    </div>
  )
}

/* ─── Main Page ─── */
export default function Meditate() {
  const [phase, setPhase] = useState(PHASE_INPUT)
  const [mood, setMood] = useState('')
  const [session, setSession] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!mood.trim()) return
    setPhase(PHASE_LOADING)
    try {
      const r = await fetch('/api/meditate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
      })
      const data = await r.json()
      // ensure minimum 5s loader for the breathing animation
      await new Promise(res => setTimeout(res, 5000))
      setSession(data)
      setPhase(PHASE_SESSION)
    } catch {
      alert('Something went wrong. Please try again.')
      setPhase(PHASE_INPUT)
    }
  }

  function reset() { setPhase(PHASE_INPUT); setSession(null); setMood('') }

  if (phase === PHASE_LOADING) return (
    <main className="m-page"><BreathingLoader /></main>
  )

  if (phase === PHASE_SESSION && session) return (
    <SessionPlayer session={session} onReset={reset} />
  )

  return (
    <main className="m-page">
      <div className="m-input-wrap">
        <div className="m-logo">🧘</div>
        <h1 className="m-heading">Reactive Meditation</h1>
        <p className="m-sub">An AI-crafted meditation experience, shaped by how you feel right now.</p>

        <form onSubmit={submit} className="m-form">
          <label className="m-label" htmlFor="mood-input">How is your heart / mind feeling right now?</label>
          <textarea
            id="mood-input"
            className="m-textarea"
            rows={3}
            value={mood}
            onChange={e => setMood(e.target.value)}
            placeholder="e.g. I'm feeling high-anxiety and can't stop overthinking…"
          />
          <button type="submit" className="m-submit" disabled={!mood.trim()}>Begin Session ✨</button>
        </form>

        <p className="m-footer">Guided scripts · Vedic shlokas · Binaural sound profiles · Adaptive visuals</p>
      </div>

      <style jsx>{`
        .m-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(160deg,#0a0e1a 0%,#1a1040 50%,#0f172a 100%); padding:24px; }
        .m-input-wrap { max-width:520px; width:100%; text-align:center; }
        .m-logo { font-size:48px; margin-bottom:16px; }
        .m-heading { font-size:32px; font-weight:700; background:linear-gradient(135deg,#fff,#c4b5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:8px; }
        .m-sub { color:#7a8599; font-size:15px; margin-bottom:36px; line-height:1.5; }

        .m-form { text-align:left; }
        .m-label { display:block; font-size:14px; font-weight:500; color:#a78bfa; margin-bottom:10px; }
        .m-textarea {
          width:100%; padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04); color:#e2e8f0; font-size:15px; font-family:inherit;
          resize:vertical; outline:none; transition:border-color 0.2s, box-shadow 0.2s; line-height:1.5;
        }
        .m-textarea:focus { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,0.25); }
        .m-textarea::placeholder { color:#4a5568; }

        .m-submit {
          margin-top:16px; width:100%; padding:14px; border-radius:10px; border:none;
          background:linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; font-size:16px;
          font-weight:600; cursor:pointer; font-family:inherit; transition:opacity 0.2s, transform 0.15s;
        }
        .m-submit:hover:not(:disabled) { opacity:0.9; }
        .m-submit:active:not(:disabled) { transform:scale(0.98); }
        .m-submit:disabled { opacity:0.4; cursor:not-allowed; }

        .m-footer { margin-top:28px; font-size:12px; color:#4a5568; }

        .m-loader-wrap { min-height:100vh; }
      `}</style>
    </main>
  )
}
