// POST /api/tts  { text: string }
// Returns audio as mp3 binary using OpenAI TTS API (voice: "shimmer" — calm, warm)
// Falls back to 404 if no API key (client uses browser SpeechSynthesis)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })
  if (!process.env.OPENAI_API_KEY) return res.status(404).json({ error: 'no tts available' })

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'shimmer',  // calm, warm, meditative voice
        input: text,
        speed: 0.85         // slightly slower for meditation
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
