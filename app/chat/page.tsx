'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
    if (!query_log_id) return
    const msg = messages[msgIndex]
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&family=Orbitron:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;height:100dvh;background:#f0f4ff;overflow:hidden;}
        .root{display:flex;height:100vh;height:100dvh;font-family:'Rajdhani',sans-serif;color:#1a2040;background:#f0f4ff;position:relative;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,80,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,255,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;}
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,20,80,0.3);z-index:10;}
        .overlay.open{display:block;}
        .sidebar{width:210px;min-width:210px;background:#e8eeff;border-right:2px solid #c0ccff;display:flex;flex-direction:column;z-index:11;transition:transform 0.25s ease;}
        @media(max-width:768px){.sidebar{position:fixed;top:0;left:0;height:100%;height:100dvh;transform:translateX(-100%);}.sidebar.open{transform:translateX(0);}}
        .sb-head{padding:20px 18px 16px;border-bottom:2px solid #c0ccff;position:relative;}
        .sb-sanskrit{font-family:'Orbitron',monospace;font-size:20px;color:#2040cc;line-height:1;text-shadow:2px 2px 0 #c0ccff;}
        .sb-sub{font-family:'Share Tech Mono',monospace;font-size:8px;color:#9090c0;letter-spacing:3px;margin-top:4px;}
        .sb-accent{height:2px;background:linear-gradient(to right,#2040cc,#00aaff,transparent);margin-top:8px;}
        .sb-close{display:none;position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;color:#9090c0;cursor:pointer;}
        @media(max-width:768px){.sb-close{display:block;}}
        .sb-nav{padding:16px 12px;flex:1;}
        .nav-sect{font-family:'Share Tech Mono',monospace;font-size:8px;color:#b0b8d8;letter-spacing:2px;padding:0 8px;margin:12px 0 6px;}
        .nav-item{display:flex;align-items:center;gap:8px;padding:10px 10px;margin-bottom:2px;font-size:14px;color:#8090c0;cursor:pointer;border-left:2px solid transparent;transition:all 0.15s;letter-spacing:0.5px;text-decoration:none;}
        .nav-item.active{color:#2040cc;border-left-color:#2040cc;background:#2040cc10;}
        .nav-item:hover{color:#2040cc99;background:#2040cc08;}
        .nav-icon{font-family:'Share Tech Mono',monospace;font-size:10px;width:14px;}
        .sb-foot{padding:14px 18px;border-top:2px solid #c0ccff;}
        .sb-email{font-family:'Share Tech Mono',monospace;font-size:9px;color:#9090b0;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-logout{font-family:'Share Tech Mono',monospace;font-size:9px;color:#b0b8cc;background:none;border:none;cursor:pointer;padding:0;margin-top:4px;letter-spacing:1px;transition:color 0.15s;}
        .sb-logout:hover{color:#cc2040;}
        .status{display:flex;align-items:center;gap:5px;margin-top:6px;}
        .sdot{width:5px;height:5px;border-radius:50%;background:#00cc66;animation:blink 2s infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        .stxt{font-family:'Share Tech Mono',monospace;font-size:8px;color:#b0b8cc;letter-spacing:2px;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;z-index:1;min-width:0;}
        .main-head{padding:12px 20px;border-bottom:2px solid #c0ccff;display:flex;align-items:center;justify-content:space-between;background:#e8eeff;gap:12px;}
        .hamburger{display:none;background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0;flex-direction:column;gap:4px;}
        @media(max-width:768px){.hamburger{display:flex;}}
        .hbar{width:20px;height:2px;background:#2040cc;}
        .head-title{font-family:'Share Tech Mono',monospace;font-size:10px;color:#6070a0;letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        @media(max-width:480px){.head-title{font-size:8px;letter-spacing:1px;}}
        .head-badge{font-family:'Share Tech Mono',monospace;font-size:9px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc30;padding:3px 10px;letter-spacing:2px;white-space:nowrap;flex-shrink:0;}
        @media(max-width:480px){.head-badge{display:none;}}
        .messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:18px;-webkit-overflow-scrolling:touch;}
        @media(max-width:480px){.messages{padding:14px;gap:14px;}}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:20px;}
        .empty-glyph{font-family:'Orbitron',monospace;font-size:48px;color:#2040cc;text-shadow:3px 3px 0 #c0ccff;}
        @media(max-width:480px){.empty-glyph{font-size:36px;}}
        .empty-line{width:80px;height:2px;background:linear-gradient(to right,transparent,#2040cc,transparent);}
        .empty-txt{font-family:'Share Tech Mono',monospace;font-size:9px;color:#9090c0;letter-spacing:2px;text-align:center;}
        .suggestions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px;}
        .sug{padding:8px 14px;border:1px solid #c0ccff;color:#6070a0;font-size:12px;font-family:'Share Tech Mono',monospace;letter-spacing:1px;cursor:pointer;background:#fff;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);transition:all 0.15s;}
        .sug:hover,.sug:active{border-color:#2040cc66;color:#2040cc;background:#f0f4ff;}
        .msg-user{display:flex;justify-content:flex-end;}
        .bubble-user{max-width:75%;background:#2040cc;padding:10px 14px;font-size:14px;color:#fff;line-height:1.6;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%);letter-spacing:0.3px;word-break:break-word;}
        @media(max-width:480px){.bubble-user{max-width:88%;font-size:13px;}}
        .msg-ai{display:flex;gap:10px;align-items:flex-start;}
        .ai-av{width:28px;height:28px;min-width:28px;background:#2040cc;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:10px;color:#fff;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}
        .ai-body{flex:1;min-width:0;}
        .ai-bubble{background:#fff;border:1px solid #c0ccff;border-left:3px solid #2040cc;padding:12px 14px;}
        .ai-text{font-size:13px;color:#2a3060;line-height:1.8;word-break:break-word;}
        .ai-text p{margin-bottom:8px;}
        .ai-text p:last-child{margin-bottom:0;}
        .ai-text table{border-collapse:collapse;width:100%;margin:10px 0;font-size:11px;}
        .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0;}
        .ai-text th{background:#2040cc;color:#fff;padding:7px 10px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1px;text-align:left;white-space:nowrap;}
        .ai-text td{border:1px solid #c0ccff;padding:6px 10px;color:#3a4070;white-space:nowrap;}
        .ai-text tr:nth-child(even) td{background:#f0f4ff;}
        .ai-text code{font-family:'Share Tech Mono',monospace;font-size:11px;background:#f0f4ff;border:1px solid #c0ccff;padding:1px 6px;color:#2040cc;}
        .ai-text pre{background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;padding:12px;margin:8px 0;overflow-x:auto;}
        .ai-text pre code{background:none;border:none;padding:0;}
        .ai-text ul,.ai-text ol{padding-left:20px;margin:6px 0;}
        .ai-text li{margin-bottom:4px;color:#3a4070;}
        .ai-text strong{color:#2040cc;}
        .sources{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #e0e8ff;align-items:center;}
        .src-chip{font-size:9px;font-family:'Share Tech Mono',monospace;letter-spacing:1px;padding:4px 10px;border:1px solid #2040cc30;color:#2040cc;background:#2040cc08;text-decoration:none;display:inline-block;transition:all 0.15s;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}
        .src-chip:hover{background:#2040cc18;border-color:#2040cc66;}
        .src-chip.nolink{color:#9090b0;border-color:#c0ccff;background:#f0f4ff;cursor:default;}
        .score-wrap{display:flex;gap:6px;margin-left:auto;}
        .score-btn{background:none;border:1px solid #c0ccff;padding:4px 8px;cursor:pointer;font-size:12px;border-radius:4px;transition:all 0.15s;line-height:1;}
        .score-btn:hover{border-color:#2040cc66;}
        .score-btn.active-up{background:#00cc4420;border-color:#00cc44;color:#00cc44;}
        .score-btn.active-down{background:#cc204420;border-color:#cc2040;color:#cc2040;}
        .thinking{display:flex;gap:4px;align-items:center;padding:6px 0;}
        .dot{width:6px;height:6px;border-radius:50%;background:#2040cc;animation:pulse 1.2s infinite;}
        .dot:nth-child(2){animation-delay:0.2s;}.dot:nth-child(3){animation-delay:0.4s;}
        @keyframes pulse{0%,100%{opacity:0.2}50%{opacity:1}}
        .input-zone{padding:12px 20px 16px;border-top:2px solid #c0ccff;background:#e8eeff;}
        @media(max-width:480px){.input-zone{padding:10px 14px 14px;}}
        .input-wrap{display:flex;align-items:flex-end;gap:8px;background:#fff;border:2px solid #c0ccff;padding:8px 12px;transition:border-color 0.2s;}
        .input-wrap:focus-within{border-color:#2040cc66;}
        .chat-input{flex:1;background:none;border:none;outline:none;color:#1a2040;font-size:16px;font-family:'Rajdhani',sans-serif;resize:none;min-height:22px;max-height:80px;line-height:1.6;letter-spacing:0.3px;}
        .chat-input::placeholder{color:#9090c0;}
        .send{padding:8px 16px;background:#2040cc;border:none;color:#fff;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;cursor:pointer;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);transition:background 0.15s;white-space:nowrap;flex-shrink:0;}
        .send:hover{background:#1030aa;}
        .send:disabled{opacity:0.3;cursor:not-allowed;}
        .hint{font-family:'Share Tech Mono',monospace;font-size:8px;color:#c0c8d8;letter-spacing:2px;margin-top:6px;text-align:center;}
        @media(max-width:480px){.hint{display:none;}}
      `}</style>
      <div className="root">
        <div className="grid"/>
        <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}/>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sb-close" onClick={() => setSidebarOpen(false)}>✕</button>
          <div className="sb-head">
            <div className="sb-sanskrit">ग्रंथ</div>
            <div className="sb-sub">GRANTH OS // SFL</div>
            <div className="sb-accent"/>
          </div>
          <div className="sb-nav">
            <div className="nav-sect">NAVIGATION</div>
            <div className="nav-item active" onClick={() => setSidebarOpen(false)}><span className="nav-icon">▶</span> Query</div>
            {user?.role === 'admin' && (
              <a className="nav-item" href="/admin" onClick={() => setSidebarOpen(false)}><span className="nav-icon">◈</span> Vault</a>
            )}
          </div>
          <div className="sb-foot">
            <div className="sb-email">{user?.email}</div>
            <button className="sb-logout" onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }}>SIGN OUT</button>
            <div className="status"><div className="sdot"/><span className="stxt">ONLINE</span></div>
          </div>
        </div>

        <div className="main">
          <div className="main-head">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <div className="hbar"/><div className="hbar"/><div className="hbar"/>
            </button>
            <span className="head-title">// SFL KNOWLEDGE CORE</span>
            <span className="head-badge">QUERY MODE</span>
          </div>
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph">ग्रंथ</div>
                <div className="empty-line"/>
                <div className="empty-txt">QUERY THE KNOWLEDGE CORE</div>
                <div className="suggestions">
                  {['Leave policy?','InventoryCloud pricing?','LIMS bugs?','LFT parameters?'].map(s => (
                    <div key={s} className="sug" onClick={() => setInput(s)}>{s}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => msg.role === 'user' ? (
                  <div key={i} className="msg-user">
                    <div className="bubble-user">{msg.content}</div>
                  </div>
                ) : (
                  <div key={i} className="msg-ai">
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
                              <a key={j} className="src-chip" href={s.url} target="_blank" rel="noopener noreferrer">↗ {s.name}</a>
                            ) : (
                              <span key={j} className="src-chip nolink">{s.name}</span>
                            ))}
                            {msg.query_log_id && (
                              <div className="score-wrap">
                                <button
                                  className={`score-btn ${msg.score === 1 ? 'active-up' : ''}`}
                                  onClick={() => handleScore(msg.query_log_id!, 1, i)}
                                  title="Good answer">👍</button>
                                <button
                                  className={`score-btn ${msg.score === -1 ? 'active-down' : ''}`}
                                  onClick={() => handleScore(msg.query_log_id!, -1, i)}
                                  title="Bad answer">👎</button>
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
                    <div className="ai-bubble" style={{padding:'12px 14px'}}>
                      <div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </>
            )}
          </div>
          <div className="input-zone">
            <div className="input-wrap">
              <textarea className="chat-input" placeholder="Query the knowledge core..."
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey} rows={1} disabled={loading}/>
              <button className="send" onClick={handleSend} disabled={loading || !input.trim()}>SEND</button>
            </div>
            <div className="hint">ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</div>
          </div>
        </div>
      </div>
    </>
  )
}
