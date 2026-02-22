// POST /api/tts  { text: string }
// Returns audio as mp3 using OpenAI TTS API
// Voice: "alloy" at 0.75 speed via tts-1-hd — calm, natural, gender-neutral

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })
  if (!process.env.OPENAI_API_KEY) return res.status(404).json({ error: 'no tts available' })

  // Add natural pauses for meditative pacing
  const processed = text
    .replace(/\. /g, '. ... ')
    .replace(/— /g, '... ')
    .replace(/\? /g, '? ... ')

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: 'alloy',
        input: processed,
        speed: 0.75
      })
    })
    if (!r.ok) return res.status(500).json({ error: 'tts failed' })
    res.setHeader('Content-Type', 'audio/mpeg')
    const buf = Buffer.from(await r.arrayBuffer())
    return res.send(buf)
  } catch (err) {
    console.error('TTS error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
