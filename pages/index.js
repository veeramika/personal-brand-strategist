import { useEffect, useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((p) => [data.message, ...p])
        setContent('')
        setStatus({ type: 'success', text: 'Saved' })
      } else {
        setStatus({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Network error' })
    }
    setLoading(false)
  }

  return (
    <main className="container">
      <h1>Personal Brand — Demo UI</h1>
      <p className="description">Simple Next.js UI with a server API route. Works with Supabase when env vars are provided.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a short message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Post'}</button>
      </form>

      {status && <div className="note">{status.text}</div>}

      <ul>
        {messages.length === 0 && <li className="badge">No messages yet — post one above</li>}
        {messages.map((m) => (
          <li key={m.id || m.created_at}>
            <div>{m.content}</div>
            <div className="badge">{new Date(m.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>

      <div className="note">Environment variables: <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code></div>
    </main>
  )
}
