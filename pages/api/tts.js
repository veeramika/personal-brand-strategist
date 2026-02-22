// POST /api/tts  { text: string }
// Priority: ElevenLabs → OpenAI TTS HD → 404 (client uses browser speech)

async function elevenLabs(text) {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return null
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true }
    })
  })
  if (!r.ok) return null
  return Buffer.from(await r.arrayBuffer())
}

async function openaiTTS(text) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'tts-1-hd', voice: 'alloy', input: text, speed: 0.75 })
  })
  if (!r.ok) return null
  return Buffer.from(await r.arrayBuffer())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })

  const processed = text.replace(/\. /g, '. ... ').replace(/— /g, '... ').replace(/\? /g, '? ... ')

  try {
    const audio = await elevenLabs(processed) || await openaiTTS(processed)
    if (audio) { res.setHeader('Content-Type', 'audio/mpeg'); return res.send(audio) }
    return res.status(404).json({ error: 'no tts available' })
  } catch (err) {
    console.error('TTS error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
