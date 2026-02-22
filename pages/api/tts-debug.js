// GET /api/tts-debug — check which TTS providers are configured (no secrets exposed)
export default function handler(req, res) {
  res.json({
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    elevenlabs_key_prefix: process.env.ELEVENLABS_API_KEY?.slice(0, 6) || 'NOT SET',
    elevenlabs_voice: process.env.ELEVENLABS_VOICE_ID || 'default (Rachel)',
    openai: !!process.env.OPENAI_API_KEY,
    openai_key_prefix: process.env.OPENAI_API_KEY?.slice(0, 6) || 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV
  })
}
