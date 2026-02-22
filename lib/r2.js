// Cloudflare R2 storage for TTS audio files
// R2 is S3-compatible — we use the S3 API with Cloudflare endpoint

const R2_ENDPOINT = process.env.R2_ENDPOINT       // https://<account_id>.r2.cloudflarestorage.com
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY
const R2_SECRET_KEY = process.env.R2_SECRET_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'vedaverse-tts'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL    // https://pub-xxx.r2.dev or custom domain

function isConfigured() {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY && R2_SECRET_KEY)
}

// Simple S3v4 signing for R2 (minimal implementation)
async function signRequest(method, path, body, contentType) {
  const crypto = await import('crypto')
  const now = new Date()
  const date = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dateShort = date.slice(0, 8)
  const region = 'auto'
  const service = 's3'

  const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${path}`)
  const headers = {
    'Host': url.host,
    'x-amz-date': date,
    'x-amz-content-sha256': crypto.createHash('sha256').update(body || '').digest('hex'),
  }
  if (contentType) headers['Content-Type'] = contentType

  const signedHeaders = Object.keys(headers).sort().join(';')
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k.toLowerCase()}:${headers[k]}`).join('\n') + '\n'
  const canonicalRequest = [method, `/${R2_BUCKET}/${path}`, '', canonicalHeaders, signedHeaders, headers['x-amz-content-sha256']].join('\n')

  const scope = `${dateShort}/${region}/${service}/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', date, scope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n')

  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest()
  let sigKey = hmac(`AWS4${R2_SECRET_KEY}`, dateShort)
  sigKey = hmac(sigKey, region)
  sigKey = hmac(sigKey, service)
  sigKey = hmac(sigKey, 'aws4_request')
  const signature = crypto.createHmac('sha256', sigKey).update(stringToSign).digest('hex')

  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  return { url: url.toString(), headers }
}

// Check if audio exists in R2
export async function getAudioUrl(key) {
  if (!isConfigured()) return null
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`
  return null
}

// Check if file exists
export async function exists(key) {
  if (!isConfigured()) return false
  try {
    const { url, headers } = await signRequest('HEAD', key, '')
    const r = await fetch(url, { method: 'HEAD', headers })
    return r.ok
  } catch { return false }
}

// Upload audio buffer to R2
export async function upload(key, buffer) {
  if (!isConfigured()) return false
  try {
    const { url, headers } = await signRequest('PUT', key, buffer, 'audio/mpeg')
    const r = await fetch(url, { method: 'PUT', headers, body: buffer })
    return r.ok
  } catch (e) {
    console.error('R2 upload error:', e.message)
    return false
  }
}
