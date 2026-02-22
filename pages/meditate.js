import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

const PHASE_INPUT = 'input'
const PHASE_LOADING = 'loading'
const PHASE_SESSION = 'session'

/* ─── Floating Particles (Canvas) ─── */
function Particles({ playing }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    let raf, particles = []
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    for (let i = 0; i < 60; i++) particles.push({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 2.5 + 0.5, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
      o: Math.random() * 0.5 + 0.2
    })
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height)
      const speed = playing ? 1.5 : 0.5
      particles.forEach(p => {
        p.x += p.vx * speed; p.y += p.vy * speed
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width }
        if (p.x < -10) p.x = c.width + 10; if (p.x > c.width + 10) p.x = -10
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212,175,130,${p.o})`; ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [playing])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

/* ─── Ripple on tap ─── */
function useRipple() {
  const [ripples, setRipples] = useState([])
  const add = useCallback((e) => {
    const r = { x: e.clientX, y: e.clientY, id: Date.now() }
    setRipples(prev => [...prev, r])
    setTimeout(() => setRipples(prev => prev.filter(p => p.id !== r.id)), 800)
  }, [])
  return { ripples, add }
}

function RippleLayer({ ripples }) {
  return <>{ripples.map(r => (
    <div key={r.id} className="vv-ripple" style={{ left: r.x, top: r.y }} />
  ))}</>
}

/* ─── Speech-to-Text ─── */
function useSpeechToText(onResult) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const toggle = useCallback(() => {
    if (!supported) return
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'; rec.interimResults = false; rec.continuous = false
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start(); recRef.current = rec; setListening(true)
  }, [listening, supported, onResult])
  return { listening, toggle, supported }
}

/* ─── Breathing Orb Loader ─── */
function BreathingLoader() {
  return (
    <div className="vv-loader">
      <div className="vv-orb vv-orb-breathe" />
      <p className="vv-loader-text">Crafting your experience…</p>
      <p className="vv-loader-hint">Breathe with the orb</p>
    </div>
  )
}

/* ─── Session Player ─── */
function SessionPlayer({ session, onReset }) {
  // Build unified steps: script steps + shloka as final step
  const allSteps = [
    ...session.script.steps,
    { label: session.culturalElement.type, text: `${session.culturalElement.translation}. ${session.culturalElement.context}`, isShloka: true }
  ]
  const totalSteps = allSteps.length

  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const timerRef = useRef(null)
  const audioCtxRef = useRef(null)
  const audioOscRef = useRef(null)
  const ttsAudioRef = useRef(null)
  const ripple = useRipple()

  const current = allSteps[stepIdx]
  const isLast = stepIdx >= totalSteps - 1
  const isShloka = current.isShloka

  // Per-step background gradient shift
  const stepGradients = [
    session.atmosphere.gradient,
    ...session.script.steps.slice(1).map((_, i) => {
      const hue = 220 + i * 25
      return `linear-gradient(160deg, hsl(${hue},40%,8%) 0%, hsl(${hue + 30},35%,15%) 50%, hsl(${hue + 60},30%,12%) 100%)`
    }),
    // Shloka step: warm golden glow
    'linear-gradient(160deg, #1a0a2e 0%, #4a2040 40%, #c4956a 100%)'
  ]
  const bg = stepGradients[stepIdx] || session.atmosphere.gradient

  // Auto-advance when speech ends
  function onSpeechEnd() {
    setSpeaking(false)
    timerRef.current = setTimeout(() => {
      if (isLast) { stopAudio(); setPlaying(false) }
      else { setStepIdx(i => i + 1) }
    }, 2000)
  }

  // Voice narration — speech-driven (no fixed timer)
  useEffect(() => {
    if (!playing) return
    clearTimeout(timerRef.current)
    let cancelled = false
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null }
    window.speechSynthesis?.cancel()
    setSpeaking(true)

    // Try OpenAI TTS
    fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: current.text })
    }).then(r => {
      if (!r.ok || cancelled) throw new Error('no tts')
      return r.blob()
    }).then(blob => {
      if (cancelled) return
      const audio = new Audio(URL.createObjectURL(blob))
      audio.volume = 0.95
      audio.onended = () => { if (!cancelled) onSpeechEnd() }
      audio.play()
      ttsAudioRef.current = audio
    }).catch(() => {
      if (cancelled) return
      const u = new SpeechSynthesisUtterance(current.text)
      u.rate = 0.55; u.pitch = 0.9; u.volume = 0.85
      const voices = window.speechSynthesis?.getVoices() || []
      const calm = voices.find(v => /samantha|karen|daniel|google uk/i.test(v.name)) || voices.find(v => v.lang.startsWith('en'))
      if (calm) u.voice = calm
      u.onend = () => { if (!cancelled) onSpeechEnd() }
      window.speechSynthesis?.speak(u)
    })

    return () => {
      cancelled = true; clearTimeout(timerRef.current)
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null }
      window.speechSynthesis?.cancel()
    }
  }, [playing, stepIdx])

  // Raga audio engine (unchanged logic, extracted for clarity)
  const RAGAS = {
    darbari:      { notes: [130.81, 155.56, 174.61, 196.00, 233.08], character: 'heavy' },
    shivaranjani: { notes: [196.00, 220.00, 233.08, 293.66, 329.63], character: 'poignant' },
    punnagavarali:{ notes: [174.61, 185.00, 220.00, 261.63, 277.18], character: 'serpentine' },
    ahirbhairav:  { notes: [146.83, 155.56, 185.00, 196.00, 220.00], character: 'devotional' },
    hamsadhwani:  { notes: [261.63, 293.66, 329.63, 392.00, 493.88], character: 'bright' },
    yaman:        { notes: [261.63, 293.66, 329.63, 370.00, 392.00], character: 'serene' },
    bhimpalasi:   { notes: [196.00, 220.00, 233.08, 261.63, 293.66], character: 'soulful' },
  }

  function startAudio() {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    ac.resume()
    const ragaKey = session.soundProfile?.raga || 'darbari'
    const raga = RAGAS[ragaKey] || RAGAS.darbari
    const master = ac.createGain()
    master.gain.value = raga.character === 'heavy' || raga.character === 'serpentine' ? 0.08 : 0.1
    master.connect(ac.destination)
    const nodes = []

    const drone = ac.createOscillator(); drone.type = 'sine'; drone.frequency.value = raga.notes[0]
    const dg = ac.createGain(); dg.gain.value = 0.5; drone.connect(dg).connect(master); drone.start(); nodes.push(drone)

    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08
    const lg = ac.createGain(); lg.gain.value = 0.15; lfo.connect(lg).connect(dg.gain); lfo.start(); nodes.push(lfo)

    const fifth = ac.createOscillator(); fifth.type = 'sine'; fifth.frequency.value = raga.notes[3] || raga.notes[0] * 1.5
    const fg = ac.createGain(); fg.gain.value = 0.2; fifth.connect(fg).connect(master); fifth.start(); nodes.push(fifth)

    const melody = ac.createOscillator(); melody.type = 'triangle'; melody.frequency.value = raga.notes[1]
    const mg = ac.createGain(); mg.gain.value = 0.12; melody.connect(mg).connect(master); melody.start(); nodes.push(melody)

    let ni = 1
    const mi = setInterval(() => { ni = (ni + 1) % raga.notes.length; melody.frequency.setTargetAtTime(raga.notes[ni], ac.currentTime, 2) }, 8000)

    audioCtxRef.current = ac; audioOscRef.current = { nodes, melodyInterval: mi }
  }

  function stopAudio() {
    clearTimeout(timerRef.current)
    if (audioOscRef.current) { clearInterval(audioOscRef.current.melodyInterval); audioOscRef.current.nodes?.forEach(n => { try { n.stop() } catch {} }) }
    try { audioCtxRef.current?.close() } catch {}
    audioOscRef.current = null; audioCtxRef.current = null
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null }
    window.speechSynthesis?.cancel()
  }

  function toggle() {
    if (playing) { stopAudio(); setPlaying(false); setSpeaking(false) }
    else { startAudio(); setPlaying(true) }
  }

  function goNext(e) { e?.stopPropagation(); if (!isLast) { clearTimeout(timerRef.current); setStepIdx(i => i + 1) } }
  function goPrev(e) { e?.stopPropagation(); if (stepIdx > 0) { clearTimeout(timerRef.current); setStepIdx(i => i - 1) } }

  useEffect(() => () => stopAudio(), [])
  const { soundProfile, culturalElement } = session

  return (
    <div className="vv-session" style={{ '--atm': bg }} onClick={ripple.add}>
      <Particles playing={playing} />
      <RippleLayer ripples={ripple.ripples} />
      <div className="vv-mesh vv-mesh-1" /><div className="vv-mesh vv-mesh-2" /><div className="vv-mesh vv-mesh-3" />

      <div className="vv-session-inner">
        {/* Step counter */}
        <p className="vv-step-counter">{stepIdx + 1} / {totalSteps}</p>

        {/* Breathing orb = play/pause */}
        <div className="vv-orb-wrap">
          <button className={`vv-orb ${playing ? 'vv-orb-breathe' : ''}`} onClick={(e) => { e.stopPropagation(); toggle() }}>
            <span className="vv-orb-icon">{playing ? '⏸' : '▶'}</span>
          </button>
          {playing && <p className="vv-orb-hint">🔊 Raga {soundProfile.raga || 'ambient'}</p>}
        </div>

        {/* Script / Shloka card */}
        <div className={`vv-glass ${isShloka ? 'vv-shloka-card' : 'vv-script-card'}`}>
          {isShloka && <div className="vv-shloka-glow" />}
          <div className={isShloka ? 'vv-shloka-type' : 'vv-step-label'}>{current.label}</div>
          {isShloka ? (
            <>
              <p className="vv-shloka-original">{culturalElement.original}</p>
              <p className="vv-shloka-translation">{culturalElement.translation}</p>
              <p className="vv-shloka-context">{culturalElement.context}</p>
            </>
          ) : (
            <p className="vv-script-text">{current.text}</p>
          )}
          {speaking && <div className="vv-speaking-dot" />}
        </div>

        {/* Navigation: prev / next */}
        <div className="vv-nav-row" onClick={e => e.stopPropagation()}>
          <button className="vv-nav-arrow" onClick={goPrev} disabled={stepIdx === 0}>← Prev</button>
          <button className="vv-nav-arrow" onClick={goNext} disabled={isLast}>Next →</button>
        </div>

        {/* Sound badge */}
        <div className="vv-glass vv-sound-badge">
          <span className="vv-sound-freq">{soundProfile.frequency}Hz {soundProfile.wave}</span>
          <span className="vv-sound-desc">{soundProfile.description}</span>
        </div>

        <button className="vv-exit" onClick={(e) => { e.stopPropagation(); stopAudio(); onReset() }}>← New Session</button>
      </div>
    </div>
  )
}

/* ─── Input Page ─── */
export default function Meditate() {
  const [phase, setPhase] = useState(PHASE_INPUT)
  const [mood, setMood] = useState('')
  const [session, setSession] = useState(null)
  const handleSpeech = useCallback((text) => setMood(prev => prev ? prev + ' ' + text : text), [])
  const speech = useSpeechToText(handleSpeech)

  async function submit(e) {
    e.preventDefault()
    if (!mood.trim()) return
    setPhase(PHASE_LOADING)
    try {
      const r = await fetch('/api/meditate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood }) })
      const data = await r.json()
      await new Promise(res => setTimeout(res, 5000))
      setSession(data); setPhase(PHASE_SESSION)
    } catch { alert('Something went wrong.'); setPhase(PHASE_INPUT) }
  }
  function reset() { setPhase(PHASE_INPUT); setSession(null); setMood('') }

  if (phase === PHASE_LOADING) return (
    <main className="vv-page">
      <Head><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /></Head>
      <Particles playing={false} />
      <div className="vv-mesh vv-mesh-1" /><div className="vv-mesh vv-mesh-2" />
      <BreathingLoader />
      <style jsx global>{globalStyles}</style>
    </main>
  )

  if (phase === PHASE_SESSION && session) return (
    <>
      <Head><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /></Head>
      <SessionPlayer session={session} onReset={reset} />
      <style jsx global>{globalStyles}</style>
    </>
  )

  return (
    <main className="vv-page vv-landing">
      <Head><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /></Head>
      <Particles playing={false} />

      {/* Water / lotus background layers */}
      <div className="vv-water" />
      <div className="vv-lotus vv-lotus-1">❁</div>
      <div className="vv-lotus vv-lotus-2">✿</div>
      <div className="vv-lotus vv-lotus-3">❁</div>
      <div className="vv-mandala" />

      <div className="vv-input-center">
        {/* Sanskrit Om */}
        <div className="vv-om">ॐ</div>
        <h1 className="vv-title">Veda Verse</h1>
        <p className="vv-sanskrit-line">तमसो मा ज्योतिर्गमय</p>
        <p className="vv-subtitle">From darkness, lead me to light.<br/>Speak or type how your heart feels — we'll craft a meditation just for you.</p>

        <form onSubmit={submit} className="vv-form">
          <div className="vv-input-line">
            <input className="vv-mood-input" value={mood} onChange={e => setMood(e.target.value)}
              placeholder="I'm feeling…" autoFocus />
            {speech.supported && (
              <button type="button" className={`vv-voice-btn ${speech.listening ? 'active' : ''}`}
                onClick={speech.toggle} aria-label="Voice input">
                <span className="vv-voice-ring" />
                {speech.listening ? '⏹' : '🎙'}
              </button>
            )}
          </div>
          {speech.listening && <p className="vv-listening-label">Listening…</p>}
          <button type="submit" className="vv-begin" disabled={!mood.trim()}>Begin Your Journey 🙏</button>
        </form>

        <p className="vv-footer-mantra">Guided by Vedic wisdom · Ragas · Shlokas · Mantras</p>
      </div>
      <style jsx global>{globalStyles}</style>
    </main>
  )
}

/* ─── All Styles ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');

  /* ── Base ── */
  .vv-page, .vv-session {
    min-height:100vh; position:relative; overflow:hidden;
    font-family:'Inter',sans-serif; color:#e2e8f0;
    background:#080c18;
  }
  .vv-session { background: var(--atm, #080c18); transition: background 2s ease; }

  /* ── Mesh gradient blobs ── */
  .vv-mesh {
    position:fixed; border-radius:50%; filter:blur(100px); opacity:0.35; pointer-events:none;
    animation: meshDrift 20s ease-in-out infinite alternate;
  }
  .vv-mesh-1 { width:600px; height:600px; top:-200px; left:-150px; background:radial-gradient(circle,#4c1d95,#1e1b4b,transparent); }
  .vv-mesh-2 { width:500px; height:500px; bottom:-150px; right:-100px; background:radial-gradient(circle,#312e81,#0f172a,transparent); animation-delay:-7s; }
  .vv-mesh-3 { width:400px; height:400px; top:30%; left:50%; background:radial-gradient(circle,#5b21b6,transparent); animation-delay:-13s; }
  @keyframes meshDrift {
    0% { transform:translate(0,0) scale(1); }
    100% { transform:translate(40px,30px) scale(1.15); }
  }

  /* ── Ripple ── */
  .vv-ripple {
    position:fixed; width:0; height:0; border-radius:50%; pointer-events:none; z-index:50;
    background:radial-gradient(circle,rgba(167,139,250,0.3),transparent 70%);
    animation: rippleOut 0.8s ease-out forwards;
    transform:translate(-50%,-50%);
  }
  @keyframes rippleOut { to { width:300px; height:300px; opacity:0; } }

  /* ── Glassmorphism ── */
  .vv-glass {
    background:rgba(255,255,255,0.04);
    backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:20px; padding:28px; margin-bottom:20px;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);
  }

  /* ── Breathing Orb ── */
  .vv-orb {
    width:100px; height:100px; border-radius:50%; border:none; cursor:pointer;
    background:radial-gradient(circle at 40% 40%, rgba(167,139,250,0.6), rgba(99,60,200,0.3), transparent);
    box-shadow:0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(139,92,246,0.1);
    display:flex; align-items:center; justify-content:center;
    transition:transform 0.3s, box-shadow 0.3s;
  }
  .vv-orb-idle { width:80px; height:80px; animation:orbPulseIdle 4s ease-in-out infinite; cursor:default; }
  .vv-orb-breathe { animation:orbBreathe 5s ease-in-out infinite; }
  .vv-orb-icon { font-size:28px; color:#fff; filter:drop-shadow(0 0 8px rgba(255,255,255,0.5)); }
  .vv-orb-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:28px; }
  .vv-orb-hint { font-size:12px; color:rgba(167,139,250,0.6); }
  @keyframes orbBreathe {
    0%,100% { transform:scale(0.85); box-shadow:0 0 40px rgba(139,92,246,0.2); }
    50% { transform:scale(1.15); box-shadow:0 0 80px rgba(139,92,246,0.5), 0 0 160px rgba(139,92,246,0.15); }
  }
  @keyframes orbPulseIdle {
    0%,100% { transform:scale(0.95); opacity:0.7; }
    50% { transform:scale(1.05); opacity:1; }
  }

  /* ── Loader ── */
  .vv-loader { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; gap:24px; }
  .vv-loader-text { font-size:18px; font-weight:500; color:#e2e8f0; }
  .vv-loader-hint { font-size:13px; color:#7a8599; }

  /* ── Input Page — Indian Folk Cultural ── */
  .vv-landing {
    background:linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 30%, #1a2a3a 60%, #0a1520 100%);
  }

  /* Water reflection at bottom */
  .vv-water {
    position:fixed; bottom:0; left:0; right:0; height:35vh; z-index:0; pointer-events:none;
    background:linear-gradient(180deg, transparent 0%, rgba(20,80,100,0.15) 40%, rgba(30,100,120,0.2) 100%);
    mask-image:linear-gradient(180deg, transparent 0%, black 100%);
    -webkit-mask-image:linear-gradient(180deg, transparent 0%, black 100%);
  }

  /* Floating lotus flowers */
  .vv-lotus {
    position:fixed; z-index:0; pointer-events:none;
    font-size:48px; opacity:0.15;
    animation:lotusFloat 12s ease-in-out infinite;
    filter:drop-shadow(0 0 20px rgba(200,150,100,0.3));
  }
  .vv-lotus-1 { bottom:8vh; left:8%; animation-delay:0s; font-size:56px; opacity:0.2; color:#d4a574; }
  .vv-lotus-2 { bottom:12vh; right:12%; animation-delay:-4s; font-size:40px; color:#e8c9a0; }
  .vv-lotus-3 { bottom:5vh; left:45%; animation-delay:-8s; font-size:36px; color:#c4956a; }
  @keyframes lotusFloat {
    0%,100% { transform:translateY(0) rotate(0deg); }
    25% { transform:translateY(-8px) rotate(2deg); }
    75% { transform:translateY(4px) rotate(-1deg); }
  }

  /* Mandala background pattern */
  .vv-mandala {
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    width:600px; height:600px; z-index:0; pointer-events:none; opacity:0.04;
    border-radius:50%;
    background:
      repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(200,160,100,0.3) 10deg 11deg),
      repeating-conic-gradient(from 5deg, transparent 0deg 15deg, rgba(200,160,100,0.2) 15deg 16deg);
    animation:mandalaSpin 120s linear infinite;
  }
  @keyframes mandalaSpin { to { transform:translate(-50%,-50%) rotate(360deg); } }

  /* Om symbol */
  .vv-om {
    font-size:64px; color:rgba(212,165,116,0.6);
    text-shadow:0 0 40px rgba(212,165,116,0.3), 0 0 80px rgba(212,165,116,0.1);
    animation:omGlow 4s ease-in-out infinite;
    margin-bottom:8px;
  }
  @keyframes omGlow {
    0%,100% { opacity:0.6; text-shadow:0 0 40px rgba(212,165,116,0.3); }
    50% { opacity:1; text-shadow:0 0 60px rgba(212,165,116,0.5), 0 0 120px rgba(212,165,116,0.2); }
  }

  /* Sanskrit decorative line */
  .vv-sanskrit-line {
    font-family:'Lora',serif; font-size:18px; color:rgba(212,165,116,0.5);
    letter-spacing:2px; margin-bottom:4px;
  }

  .vv-input-center {
    position:relative; z-index:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; min-height:100vh; padding:24px; text-align:center;
  }
  .vv-title {
    font-family:'Lora',serif; font-size:48px; font-weight:600; margin-top:4px;
    background:linear-gradient(135deg, #f5e6d0 0%, #d4a574 40%, #c4956a 70%, #a07850 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    letter-spacing:1px;
  }
  .vv-subtitle { color:rgba(200,190,175,0.6); font-size:15px; margin:12px 0 32px; max-width:400px; line-height:1.6; }
  .vv-footer-mantra { margin-top:28px; font-size:11px; color:rgba(212,165,116,0.3); letter-spacing:1px; }

  .vv-form { width:100%; max-width:420px; }
  .vv-input-line { position:relative; }
  .vv-mood-input {
    width:100%; padding:16px 56px 16px 20px; border-radius:50px;
    border:1px solid rgba(212,165,116,0.15);
    background:rgba(212,165,116,0.05); backdrop-filter:blur(12px);
    color:#e8d5c0; font-size:16px; font-family:inherit; outline:none;
    transition:border-color 0.3s, box-shadow 0.3s;
  }
  .vv-mood-input:focus { border-color:rgba(212,165,116,0.4); box-shadow:0 0 0 4px rgba(212,165,116,0.1); }
  .vv-mood-input::placeholder { color:rgba(200,180,160,0.3); }

  .vv-voice-btn {
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    width:40px; height:40px; border-radius:50%; border:none;
    background:rgba(212,165,116,0.15); color:#d4a574; font-size:20px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all 0.3s; font-family:inherit;
  }
  .vv-voice-btn:hover { background:rgba(212,165,116,0.25); }
  .vv-voice-btn.active { background:rgba(239,68,68,0.3); color:#fff; }
  .vv-voice-btn.active .vv-voice-ring {
    position:absolute; inset:-4px; border-radius:50%;
    border:2px solid rgba(239,68,68,0.5);
    animation:voiceRing 1.5s ease-in-out infinite;
  }
  .vv-voice-ring { display:none; }
  .vv-voice-btn.active .vv-voice-ring { display:block; }
  @keyframes voiceRing { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:0} }
  .vv-listening-label { font-size:13px; color:#ef4444; margin-top:10px; text-align:center; }

  .vv-begin {
    margin-top:20px; width:100%; padding:14px; border-radius:50px; border:none;
    background:linear-gradient(135deg, #a07850, #c4956a, #d4a574); color:#1a1a2e;
    font-size:16px; font-weight:600; cursor:pointer; font-family:'Lora',serif;
    transition:opacity 0.2s, transform 0.15s;
    box-shadow:0 4px 24px rgba(212,165,116,0.25);
    letter-spacing:0.5px;
  }
  .vv-begin:hover:not(:disabled) { opacity:0.9; }
  .vv-begin:active:not(:disabled) { transform:scale(0.98); }
  .vv-begin:disabled { opacity:0.3; cursor:not-allowed; }

  /* ── Session ── */
  .vv-session-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; padding:48px 20px 64px; }

  /* Script card */
  .vv-step-label { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.4); margin-bottom:14px; }
  .vv-script-text { font-family:'Inter',sans-serif; font-size:17px; line-height:1.8; color:rgba(255,255,255,0.88); margin-bottom:20px; }
  .vv-bar-track { height:3px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
  .vv-bar-fill { height:100%; background:linear-gradient(90deg,#8b5cf6,#c4b5fd); border-radius:3px; transition:width 1s linear; }
  .vv-timer { font-size:11px; color:rgba(255,255,255,0.3); margin-top:6px; text-align:right; }

  /* Shloka card — celebrated */
  .vv-shloka-card { text-align:center; position:relative; overflow:hidden; }
  .vv-shloka-glow {
    position:absolute; top:50%; left:50%; width:200%; height:200%;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%);
    pointer-events:none;
  }
  .vv-shloka-type { font-size:10px; text-transform:uppercase; letter-spacing:2px; color:rgba(167,139,250,0.5); margin-bottom:16px; position:relative; }
  .vv-shloka-original {
    font-family:'Lora',serif; font-size:26px; font-weight:600; color:#fff;
    line-height:1.6; margin-bottom:12px; position:relative;
    text-shadow:0 0 30px rgba(139,92,246,0.2);
  }
  .vv-shloka-translation {
    font-family:'Lora',serif; font-size:15px; font-style:italic;
    color:rgba(255,255,255,0.6); line-height:1.6; margin-bottom:14px; position:relative;
  }
  .vv-shloka-context { font-size:13px; color:rgba(255,255,255,0.35); line-height:1.5; position:relative; }

  /* Sound badge */
  .vv-sound-badge { display:flex; align-items:center; gap:14px; padding:16px 24px; }
  .vv-sound-freq { font-size:13px; font-weight:600; color:#a78bfa; white-space:nowrap; }
  .vv-sound-desc { font-size:12px; color:rgba(255,255,255,0.4); line-height:1.4; }

  /* Step counter */
  .vv-step-counter { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); letter-spacing:2px; margin-bottom:8px; }

  /* Nav row */
  .vv-nav-row { display:flex; justify-content:center; gap:12px; margin-bottom:20px; }
  .vv-nav-arrow {
    padding:8px 20px; border-radius:50px; border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5);
    font-size:13px; cursor:pointer; font-family:inherit; transition:all 0.2s;
    backdrop-filter:blur(8px);
  }
  .vv-nav-arrow:hover:not(:disabled) { color:#fff; border-color:rgba(255,255,255,0.25); background:rgba(255,255,255,0.08); }
  .vv-nav-arrow:disabled { opacity:0.2; cursor:not-allowed; }

  /* Speaking indicator */
  .vv-speaking-dot {
    width:8px; height:8px; border-radius:50%; background:#a78bfa; margin:12px auto 0;
    animation:speakPulse 1.2s ease-in-out infinite;
  }
  @keyframes speakPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }

  .vv-exit {
    display:block; margin:28px auto 0; padding:10px 24px; border-radius:50px;
    border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; font-family:inherit;
    transition:all 0.2s;
  }
  .vv-exit:hover { color:#fff; background:rgba(255,255,255,0.08); }

  @media(max-width:600px) {
    .vv-title { font-size:34px; }
    .vv-om { font-size:48px; }
    .vv-sanskrit-line { font-size:14px; }
    .vv-shloka-original { font-size:20px; }
    .vv-script-text { font-size:15px; }
    .vv-orb { width:80px; height:80px; }
    .vv-orb-icon { font-size:22px; }
    .vv-mandala { width:350px; height:350px; }
    .vv-lotus { font-size:32px !important; }
  }
`
