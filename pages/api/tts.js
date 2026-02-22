// POST /api/tts  { text: string }
// Priority: R2 cache → ElevenLabs → OpenAI → 404
// Generated audio is stored in Cloudflare R2 permanently

import crypto from 'crypto'
import * as r2 from '../../lib/r2'

function hash(text) { return crypto.createHash('md5').update(text).digest('hex') }

// In-memory fallback cache (when R2 not configured)
const memCache = new Map()

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
  const key = hash(processed) + '.mp3'

  // 1. Check R2
  const r2Url = await r2.getAudioUrl(key)
  if (r2Url && await r2.exists(key)) {
    return res.redirect(302, r2Url)
  }

  // 2. Check memory cache
  if (memCache.has(key)) {
    res.setHeader('Content-Type', 'audio/mpeg')
    return res.send(memCache.get(key))
  }

  // 3. Generate
  try {
    const audio = await elevenLabs(processed) || await openaiTTS(processed)
    if (!audio) return res.status(404).json({ error: 'no tts available' })

    // Store in R2 (async, don't block response)
    r2.upload(key, audio).catch(() => {})

    // Store in memory cache as fallback
    memCache.set(key, audio)
    if (memCache.size > 200) { memCache.delete(memCache.keys().next().value) }

    res.setHeader('Content-Type', 'audio/mpeg')
    return res.send(audio)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
