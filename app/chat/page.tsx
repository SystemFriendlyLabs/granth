'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history })
    })
    const data = await res.json()

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.answer || data.error || 'Something went wrong.',
      sources: data.sources
    }])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold">ग्रंथ</h1>
        <div className="flex gap-4 items-center">
          {user?.role === 'admin' && (
            <button onClick={() => router.push('/admin')} className="text-sm text-gray-400 hover:text-white">Admin →</button>
          )}
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }} className="text-sm text-gray-400 hover:text-red-400">Logout</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <p className="text-4xl mb-4">ग्रंथ</p>
            <p className="text-gray-400">Ask anything about SFL — policies, products, processes, people.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-100 border border-gray-800'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400">Sources: {msg.sources.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
              <p className="text-sm text-gray-400">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-800 px-4 py-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium disabled:opacity-50 transition">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
