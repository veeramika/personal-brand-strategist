// POST /api/tts  { text: string }
// Priority: ElevenLabs → Google Cloud TTS → 404 (client uses browser speech)

// ElevenLabs: calm, meditative voice
async function elevenLabs(text) {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return null

  // "Rachel" — calm, warm female voice. Replace with your preferred voice ID.
  // Browse voices: https://elevenlabs.io/voice-library
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'  // Rachel

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.7,        // higher = more consistent, calmer
        similarity_boost: 0.75,
        style: 0.4,            // subtle expressiveness
        use_speaker_boost: true
      }
    })
  })
  if (!r.ok) return null
  return Buffer.from(await r.arrayBuffer())
}

// Google Cloud TTS: "Journey" neural voice — calm, meditative
async function googleTTS(text) {
  const key = process.env.GOOGLE_TTS_API_KEY
  if (!key) return null

  const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Journey-F'  // calm female Journey voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.85,
        pitch: -1.0             // slightly lower for calm feel
      }
    })
  })
  if (!r.ok) return null
  const body = await r.json()
  if (!body.audioContent) return null
  return Buffer.from(body.audioContent, 'base64')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })

  // Add natural pauses
  const processed = text
    .replace(/\. /g, '. ... ')
    .replace(/— /g, '... ')
    .replace(/\? /g, '? ... ')

  try {
    // Try ElevenLabs first
    let audio = await elevenLabs(processed)
    if (audio) {
      res.setHeader('Content-Type', 'audio/mpeg')
      return res.send(audio)
    }

    // Fallback: Google Cloud TTS
    audio = await googleTTS(processed)
    if (audio) {
      res.setHeader('Content-Type', 'audio/mpeg')
      return res.send(audio)
    }

    // No TTS available — client will use browser SpeechSynthesis
    return res.status(404).json({ error: 'no tts available' })
  } catch (err) {
    console.error('TTS error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
