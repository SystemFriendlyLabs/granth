'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './chat.css'

interface Source { name: string; url: string | null }
interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  query_log_id?: string
  score?: number
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': user?.email || '' },
      body: JSON.stringify({ question, history })
    })
    const data = await res.json()
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.answer || data.error || 'No response.',
      sources: data.sources || [],
      query_log_id: data.query_log_id
    }])
    setLoading(false)
  }

  async function handleScore(query_log_id: string, score: number, msgIndex: number) {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_log_id, score, chunk_ids: [] })
    })
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, score } : m))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="root">
      <div className={sidebarOpen ? 'overlay open' : 'overlay'} onClick={() => setSidebarOpen(false)}/>
      <div className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sb-head">
          <div className="sb-logo">ग्रंथ</div>
          <button className="sb-close" onClick={() => setSidebarOpen(false)}>&#x2715;</button>
        </div>
        <div className="sb-nav">
          <div className="nav-sect">Navigation</div>
          <div className="nav-item active" onClick={() => setSidebarOpen(false)}>
            <div className="nav-dot"/>Ask anything
          </div>
          {user?.role === 'admin' && (
            <a className="nav-item" href="/admin">
              <div className="nav-dot" style={{background:'#888'}}/>Knowledge vault
            </a>
          )}
        </div>
        <div className="sb-foot">
          <div>
            <span className="sb-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
            <span className="online"/>
            <span style={{fontSize:'11px',color:'#10b981',fontWeight:500}}>Online</span>
          </div>
          <span className="sb-email">{user?.email}</span>
          <button className="sb-logout" onClick={() => { localStorage.removeItem('granth_user'); fetch('/api/auth/logout', {method:'POST'}); router.push('/') }}>Sign out</button>
        </div>
      </div>

      <div className="main">
        <div className="main-head">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <div className="hbar"/><div className="hbar"/><div className="hbar"/>
          </button>
          <span className="head-title">SFL Knowledge Base</span>
          <span className="head-badge">&#x25CF; Online</span>
        </div>

        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty">
              <div className="empty-logo">ग्रंथ</div>
              <div className="empty-sub">Ask anything about SFL</div>
              <div className="suggestions">
                {['Leave policy?','LIMS bugs?','LFT parameters?','InventoryCloud features?'].map(s => (
                  <div key={s} className="sug" onClick={() => setInput(s)}>{s}</div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg, i) => msg.role === 'user' ? (
                <div key={i} className="msg-user" style={{marginBottom:'20px'}}>
                  <div className="bubble-user">{msg.content}</div>
                </div>
              ) : (
                <div key={i} className="msg-ai" style={{marginBottom:'20px'}}>
                  <div className="ai-av">ग</div>
                  <div className="ai-body">
                    <div className="ai-bubble">
                      <div className="ai-text">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          table: ({children}) => <div className="table-wrap"><table>{children}</table></div>
                        }}>{msg.content}</ReactMarkdown>
                      </div>
                      {(msg.sources?.length || msg.query_log_id) && (
                        <div className="sources">
                          {msg.sources?.map((s, j) => s.url ? (
                            <span key={j} style={{display:'inline-flex',gap:'4px',alignItems:'center'}}>
                              <a className="src-chip" href={s.url} target="_blank" rel="noopener noreferrer">&#x2197; {s.name}</a>
                              <a className="src-dl" href={s.url} download>&#x2193;</a>
                            </span>
                          ) : (
                            <span key={j} className="src-chip nolink">{s.name}</span>
                          ))}
                          {msg.query_log_id && (
                            <div className="score-wrap">
                              <button className={msg.score === 1 ? 'score-btn up' : 'score-btn'} onClick={() => handleScore(msg.query_log_id!, 1, i)}>&#x1F44D;</button>
                              <button className={msg.score === -1 ? 'score-btn down' : 'score-btn'} onClick={() => handleScore(msg.query_log_id!, -1, i)}>&#x1F44E;</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="msg-ai">
                  <div className="ai-av">ग</div>
                  <div className="ai-bubble" style={{padding:'14px 18px'}}>
                    <div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>
          )}
        </div>

        <div className="input-zone">
          <div className="input-wrap">
            <textarea ref={textareaRef} className="chat-input" placeholder="Ask anything..."
              value={input} onChange={handleTextareaChange} onKeyDown={handleKey} rows={1} disabled={loading}/>
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div className="hint">Enter to send</div>
        </div>
      </div>
    </div>
  )
}
