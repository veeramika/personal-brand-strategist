// POST /api/tts  { text: string }
// Priority: Cache → ElevenLabs → OpenAI TTS HD → 404
// Audio is cached in-memory by text hash — same text never calls the API twice

import crypto from 'crypto'

// In-memory cache (persists across requests in the same serverless instance)
const cache = new Map()

function hash(text) { return crypto.createHash('md5').update(text).digest('hex') }

async function elevenLabs(text) {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return null
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify({
      text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true }
    })
  })
  if (!r.ok) { console.error('ElevenLabs:', r.status); return null }
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
  if (!r.ok) { console.error('OpenAI TTS:', r.status); return null }
  return Buffer.from(await r.arrayBuffer())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })

  const processed = text.replace(/\. /g, '. ... ').replace(/— /g, '... ').replace(/\? /g, '? ... ')
  const key = hash(processed)

  // Return cached audio instantly
  if (cache.has(key)) {
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('X-TTS-Cache', 'hit')
    return res.send(cache.get(key))
  }

  try {
    const audio = await elevenLabs(processed) || await openaiTTS(processed)
    if (audio) {
      cache.set(key, audio)
      // Cap cache at 200 entries (~200MB max) to prevent memory issues
      if (cache.size > 200) { const first = cache.keys().next().value; cache.delete(first) }
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('X-TTS-Cache', 'miss')
      return res.send(audio)
    }
    return res.status(404).json({ error: 'no tts available' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
