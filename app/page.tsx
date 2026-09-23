'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/users')
    const { users } = await res.json()
    const user = users?.find((u: any) => u.email === email)
    if (!user) { setError('ACCESS DENIED — contact your admin'); setLoading(false); return }
    localStorage.setItem('granth_user', JSON.stringify(user))
    router.push(user.role === 'admin' ? '/admin' : '/chat')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&family=Orbitron:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#f0f4ff;}
        .root{min-height:100vh;background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;position:relative;overflow:hidden;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,80,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,255,0.05) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;}
        .card{position:relative;z-index:1;width:400px;padding:48px 40px;background:#fff;border:2px solid #c0ccff;}
        .corner{position:absolute;width:14px;height:14px;}
        .c-tl{top:-2px;left:-2px;border-top:3px solid #2040cc;border-left:3px solid #2040cc;}
        .c-tr{top:-2px;right:-2px;border-top:3px solid #2040cc;border-right:3px solid #2040cc;}
        .c-bl{bottom:-2px;left:-2px;border-bottom:3px solid #2040cc;border-left:3px solid #2040cc;}
        .c-br{bottom:-2px;right:-2px;border-bottom:3px solid #2040cc;border-right:3px solid #2040cc;}
        .logo{text-align:center;margin-bottom:36px;}
        .sanskrit{font-family:'Orbitron',monospace;font-size:52px;color:#2040cc;line-height:1;margin-bottom:6px;text-shadow:3px 3px 0 #c0ccff;}
        .eng{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:5px;color:#9090c0;text-transform:uppercase;}
        .accent-line{height:3px;background:linear-gradient(to right,#2040cc,#00aaff,transparent);margin-bottom:32px;}
        .divider{display:flex;align-items:center;gap:10px;margin-bottom:28px;}
        .div-line{flex:1;height:1px;background:#c0ccff;}
        .div-txt{font-family:'Share Tech Mono',monospace;font-size:8px;color:#9090c0;letter-spacing:2px;}
        .label{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6070a0;letter-spacing:2px;display:block;margin-bottom:6px;}
        .input{width:100%;padding:11px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:13px;font-family:'Rajdhani',sans-serif;outline:none;transition:border-color 0.2s;letter-spacing:0.3px;margin-bottom:14px;}
        .input::placeholder{color:#9090c0;}
        .input:focus{border-color:#2040cc66;background:#fff;}
        .btn{width:100%;padding:12px;background:#2040cc;border:none;color:#fff;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;cursor:pointer;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);transition:background 0.15s;}
        .btn:hover{background:#1030aa;}
        .btn:disabled{opacity:0.5;cursor:not-allowed;}
        .error{font-family:'Share Tech Mono',monospace;font-size:9px;color:#cc2040;margin-top:10px;letter-spacing:1px;}
        .footer{text-align:center;margin-top:28px;font-family:'Share Tech Mono',monospace;font-size:8px;color:#c0cccc;letter-spacing:2px;}
      `}</style>
      <div className="root">
        <div className="grid"/>
        <div className="card">
          <div className="corner c-tl"/><div className="corner c-tr"/>
          <div className="corner c-bl"/><div className="corner c-br"/>
          <div className="logo">
            <div className="sanskrit">ग्रंथ</div>
            <div className="eng">Granth // SFL Knowledge Core</div>
          </div>
          <div className="accent-line"/>
          <div className="divider">
            <div className="div-line"/><div className="div-txt">AUTHENTICATE</div><div className="div-line"/>
          </div>
          <form onSubmit={handleLogin}>
            <label className="label">Identity</label>
            <input className="input" type="email" placeholder="your@systemfriendly.com"
              value={email} onChange={e => setEmail(e.target.value)} required/>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'VERIFYING...' : 'INITIALIZE SESSION'}
            </button>
            {error && <div className="error">⚠ {error}</div>}
          </form>
          <div className="footer">SFL INTERNAL · RESTRICTED ACCESS</div>
        </div>
      </div>
    </>
  )
}
