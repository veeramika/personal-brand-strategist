// POST /api/tts  { text: string }
// Returns audio as mp3 using OpenAI TTS API
// Voice: "nova" — young, warm, natural, calm (like a yoga instructor)
// Speed: 0.8 — gentle, unhurried meditation pace

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })
  if (!process.env.OPENAI_API_KEY) return res.status(404).json({ error: 'no tts available' })

  // Add breathing pauses to make speech feel more natural/meditative
  const processed = text
    .replace(/\. /g, '... ')       // longer pauses at sentences
    .replace(/— /g, '... ')        // pause at em dashes
    .replace(/\? /g, '?... ')      // pause after questions

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'tts-1-hd',       // HD model — smoother, more natural
        voice: 'nova',            // young, warm, calm — yoga instructor feel
        input: processed,
        speed: 0.8                // gentle meditation pace
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
