'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const quotes = [
  { text: "विद्या ददाति विनयम्", meaning: "Knowledge gives humility" },
  { text: "सा विद्या या विमुक्तये", meaning: "That is knowledge which liberates" },
  { text: "ज्ञानं परमं बलम्", meaning: "Knowledge is the highest strength" },
  { text: "विद्वान् सर्वत्र पूज्यते", meaning: "The learned are respected everywhere" },
  { text: "ज्ञानेन तु तदज्ञानं येषां नाशितमात्मनः", meaning: "Knowledge destroys ignorance from within" },
  { text: "नास्ति विद्यासमं चक्षुः", meaning: "There is no eye like knowledge" },
  { text: "विद्या विहीनः पशुः", meaning: "Without knowledge, one is like an animal" },
  { text: "ज्ञानं सर्वेषु भूतेषु", meaning: "Knowledge exists in all beings" },
]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState(quotes[0])
  const [sideQuotes, setSideQuotes] = useState<typeof quotes>([])
  const router = useRouter()

  useEffect(() => {
    setQuote(getRandom(quotes))
    // Pick 4 random quotes for corners/sides
    const shuffled = [...quotes].sort(() => Math.random() - 0.5)
    setSideQuotes(shuffled.slice(0, 4))
  }, [])

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
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&family=Tiro+Devanagari+Sanskrit:ital@0;1&family=Orbitron:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#f0f4ff;}
        .root{min-height:100vh;min-height:100dvh;background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;position:relative;overflow:hidden;padding:20px;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,80,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,255,0.05) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;}

        .float-quote{position:fixed;pointer-events:none;z-index:0;}
        .float-quote .sanskrit-text{font-family:'Tiro Devanagari Sanskrit',serif;color:#2040cc;opacity:0.12;line-height:1.4;text-align:center;}
        .float-quote .meaning-text{font-family:'Share Tech Mono',monospace;color:#2040cc;opacity:0.07;letter-spacing:2px;text-align:center;margin-top:4px;}
        .fq-tl{top:40px;left:40px;max-width:200px;}
        .fq-tr{top:40px;right:40px;max-width:200px;text-align:right;}
        .fq-bl{bottom:60px;left:40px;max-width:200px;}
        .fq-br{bottom:60px;right:40px;max-width:200px;text-align:right;}
        .fq-tl .sanskrit-text{font-size:22px;}
        .fq-tr .sanskrit-text{font-size:18px;}
        .fq-bl .sanskrit-text{font-size:20px;}
        .fq-br .sanskrit-text{font-size:16px;}
        @media(max-width:768px){
          .fq-tl{top:20px;left:12px;max-width:120px;}
          .fq-tr{top:20px;right:12px;max-width:120px;}
          .fq-bl{bottom:20px;left:12px;max-width:120px;}
          .fq-br{bottom:20px;right:12px;max-width:120px;}
          .fq-tl .sanskrit-text,.fq-tr .sanskrit-text,.fq-bl .sanskrit-text,.fq-br .sanskrit-text{font-size:14px;}
          .float-quote .meaning-text{display:none;}
        }

        .card{position:relative;z-index:1;width:100%;max-width:420px;padding:36px 32px;background:#fff;border:2px solid #c0ccff;}
        @media(max-width:480px){.card{padding:28px 20px;}}
        .corner{position:absolute;width:14px;height:14px;}
        .c-tl{top:-2px;left:-2px;border-top:3px solid #2040cc;border-left:3px solid #2040cc;}
        .c-tr{top:-2px;right:-2px;border-top:3px solid #2040cc;border-right:3px solid #2040cc;}
        .c-bl{bottom:-2px;left:-2px;border-bottom:3px solid #2040cc;border-left:3px solid #2040cc;}
        .c-br{bottom:-2px;right:-2px;border-bottom:3px solid #2040cc;border-right:3px solid #2040cc;}

        .monk-wrap{text-align:center;margin-bottom:8px;}
        .monk-img{width:200px;height:220px;object-fit:contain;display:inline-block;}
        @media(max-width:480px){.monk-img{width:160px;height:180px;}}

        .logo{text-align:center;margin-bottom:16px;}
        .sanskrit{font-family:'Orbitron',monospace;font-size:46px;color:#2040cc;line-height:1;margin-bottom:6px;text-shadow:3px 3px 0 #c0ccff;}
        @media(max-width:480px){.sanskrit{font-size:38px;}}
        .eng{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:5px;color:#9090c0;text-transform:uppercase;}

        .quote-strip{background:#f0f4ff;border-left:3px solid #2040cc;padding:10px 14px;margin-bottom:18px;text-align:center;}
        .quote-main{font-family:'Tiro Devanagari Sanskrit',serif;font-size:18px;color:#2040cc;line-height:1.5;}
        .quote-meaning{font-family:'Share Tech Mono',monospace;font-size:8px;color:#9090c0;letter-spacing:2px;margin-top:4px;}

        .accent-line{height:3px;background:linear-gradient(to right,#2040cc,#00aaff,transparent);margin-bottom:18px;}
        .divider{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
        .div-line{flex:1;height:1px;background:#c0ccff;}
        .div-txt{font-family:'Share Tech Mono',monospace;font-size:8px;color:#9090c0;letter-spacing:2px;}
        .label{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6070a0;letter-spacing:2px;display:block;margin-bottom:6px;}
        .input{width:100%;padding:13px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:16px;font-family:'Rajdhani',sans-serif;outline:none;transition:border-color 0.2s;margin-bottom:14px;}
        .input::placeholder{color:#9090c0;}
        .input:focus{border-color:#2040cc66;background:#fff;}
        .btn{width:100%;padding:14px;background:#2040cc;border:none;color:#fff;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:4px;cursor:pointer;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);transition:background 0.15s;}
        .btn:hover{background:#1030aa;}
        .btn:disabled{opacity:0.5;cursor:not-allowed;}
        .error{font-family:'Share Tech Mono',monospace;font-size:9px;color:#cc2040;margin-top:10px;letter-spacing:1px;}
        .footer{text-align:center;margin-top:16px;font-family:'Share Tech Mono',monospace;font-size:8px;color:#c0cccc;letter-spacing:2px;}
      `}</style>
      <div className="root">
        <div className="grid"/>

        {sideQuotes[0] && (
          <div className="float-quote fq-tl">
            <div className="sanskrit-text">{sideQuotes[0].text}</div>
            <div className="meaning-text">{sideQuotes[0].meaning}</div>
          </div>
        )}
        {sideQuotes[1] && (
          <div className="float-quote fq-tr">
            <div className="sanskrit-text">{sideQuotes[1].text}</div>
            <div className="meaning-text">{sideQuotes[1].meaning}</div>
          </div>
        )}
        {sideQuotes[2] && (
          <div className="float-quote fq-bl">
            <div className="sanskrit-text">{sideQuotes[2].text}</div>
            <div className="meaning-text">{sideQuotes[2].meaning}</div>
          </div>
        )}
        {sideQuotes[3] && (
          <div className="float-quote fq-br">
            <div className="sanskrit-text">{sideQuotes[3].text}</div>
            <div className="meaning-text">{sideQuotes[3].meaning}</div>
          </div>
        )}

        <div className="card">
          <div className="corner c-tl"/><div className="corner c-tr"/>
          <div className="corner c-bl"/><div className="corner c-br"/>
          <div className="monk-wrap">
            <img src="/monk.png" alt="Granth" className="monk-img"/>
          </div>
          <div className="logo">
            <div className="sanskrit">ग्रंथ</div>
            <div className="eng">Granth // SFL Knowledge Core</div>
          </div>
          <div className="quote-strip">
            <div className="quote-main">{quote.text}</div>
            <div className="quote-meaning">{quote.meaning}</div>
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
