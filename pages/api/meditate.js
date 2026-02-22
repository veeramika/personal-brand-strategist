// POST /api/meditate  { mood: string }
// Returns a structured meditation session JSON

const SYSTEM_PROMPT = `You are a holistic meditation guide with deep knowledge of Vedic traditions, mindfulness, and sound therapy.
Given a user's current emotional state, return ONLY valid JSON (no markdown) with this exact structure:
{
  "script": { "title": "string", "steps": [ { "label": "string (e.g. Settle In)", "text": "string (50-80 words)", "durationSec": number } ] },
  "atmosphere": { "name": "string", "gradient": "linear-gradient(…) using CSS", "animation": "gentle|pulse|wave|still" },
  "soundProfile": { "frequency": number, "wave": "Theta|Alpha|Beta|Delta", "description": "string" },
  "culturalElement": { "type": "Shloka|Mantra|Affirmation", "original": "string (Sanskrit if shloka/mantra)", "translation": "string", "context": "string (why this was chosen)" }
}
Rules:
- Script must have 4-6 steps totalling ~300 words.
- Choose atmosphere colors that psychologically match the mood.
- Pick binaural beat frequency: Delta 1-4Hz (deep sleep/healing), Theta 4-8Hz (deep meditation), Alpha 8-13Hz (relaxation/calm), Beta 13-30Hz (focus/alertness).
- For peace/anxiety use shlokas like "Om Shanti Shanti Shanti" or "Asatoma Ma Sadgamaya". For focus use "Gayatri Mantra". For self-love use affirmations. Always include Sanskrit original + English translation.`

const MOCK = {
  script: {
    title: "Releasing Tension, Finding Stillness",
    steps: [
      { label: "Settle In", text: "Find a comfortable position and gently close your eyes. Take three deep breaths — inhale through the nose for four counts, hold for two, and exhale slowly through the mouth for six. With each exhale, feel your shoulders drop and your jaw soften. You are safe here. There is nothing to fix right now.", durationSec: 60 },
      { label: "Body Scan", text: "Bring your awareness to the crown of your head. Imagine a warm, golden light slowly pouring down — relaxing your forehead, your eyes, your cheeks. Let it flow down your neck and shoulders, melting away any tightness. Feel it travel through your arms to your fingertips, through your chest and belly, down your legs to the soles of your feet.", durationSec: 90 },
      { label: "Breath Anchor", text: "Now rest your attention on the natural rhythm of your breath. Don't try to change it — simply observe. Notice the cool air entering your nostrils and the warm air leaving. If your mind wanders, that's perfectly natural. Gently guide it back to the breath like a leaf returning to a quiet stream.", durationSec: 90 },
      { label: "Mantra", text: "Silently repeat the ancient peace invocation: Om Shanti, Shanti, Shanti. Let each repetition be slower than the last. Om — the sound of universal consciousness. Shanti — peace in body, peace in mind, peace in spirit. Feel the vibration of these words settling into your heart space.", durationSec: 60 },
      { label: "Return", text: "Begin to deepen your breath. Wiggle your fingers and toes gently. When you're ready, slowly open your eyes. Carry this stillness with you. You have given yourself a gift — the gift of pause. Namaste.", durationSec: 45 }
    ]
  },
  atmosphere: { name: "Twilight Calm", gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", animation: "gentle" },
  soundProfile: { frequency: 6, wave: "Theta", description: "6Hz Theta waves promote deep relaxation and reduce anxiety by guiding the brain into a meditative state." },
  culturalElement: { type: "Shloka", original: "ॐ शान्तिः शान्तिः शान्तिः", translation: "Om Peace, Peace, Peace — May there be peace in the body, peace in the mind, and peace in the spirit.", context: "This universal Shanti mantra from the Upanishads is invoked to dissolve the three sources of suffering: physical, mental, and spiritual." }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { mood } = req.body || {}
  if (!mood?.trim()) return res.status(400).json({ error: 'mood is required' })

  if (!process.env.OPENAI_API_KEY) return res.status(200).json(MOCK)

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `My current emotional state: "${mood}"` }
        ],
        max_tokens: 1200,
        temperature: 0.8
      })
    })
    const body = await r.json()
    const raw = body?.choices?.[0]?.message?.content || ''
    const session = JSON.parse(raw)
    return res.status(200).json(session)
  } catch (err) {
    console.error('AI parse error, returning mock:', err.message)
    return res.status(200).json(MOCK)
  }
}
