'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const quotes = [
  { text: "विद्या ददाति विनयम्", meaning: "Knowledge gives humility" },
  { text: "सा विद्या या विमुक्तये", meaning: "That is knowledge which liberates" },
  { text: "ज्ञानं परमं बलम्", meaning: "Knowledge is the highest strength" },
  { text: "विद्वान् सर्वत्र पूज्यते", meaning: "The learned are respected everywhere" },
  { text: "नास्ति विद्यासमं चक्षुः", meaning: "There is no eye like knowledge" },
  { text: "विद्या विहीनः पशुः", meaning: "Without knowledge, one is like an animal" },
  { text: "ज्ञानं सर्वेषु भूतेषु", meaning: "Knowledge exists in all beings" },
  { text: "ज्ञानेन तु तदज्ञानं", meaning: "Knowledge destroys ignorance" },
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState(quotes[0])
  const [sideQuotes, setSideQuotes] = useState<typeof quotes>([])
  const router = useRouter()

  useEffect(() => {
    const shuffled = [...quotes].sort(() => Math.random() - 0.5)
    setQuote(shuffled[0])
    setSideQuotes(shuffled.slice(1, 5))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/users')
    const { users } = await res.json()
    const user = users?.find((u: any) => u.email === email)
    if (!user) { setError('Access denied — contact your admin'); setLoading(false); return }
    localStorage.setItem('granth_user', JSON.stringify(user))
    router.push(user.role === 'admin' ? '/admin' : '/chat')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&family=Tiro+Devanagari+Sanskrit&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#f7f6f2;}
        .root{min-height:100vh;min-height:100dvh;background:#f7f6f2;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;padding:20px;}
        .bg-dots{position:fixed;inset:0;background-image:radial-gradient(#00000009 1px,transparent 1px);background-size:24px 24px;pointer-events:none;}
        .fq{position:fixed;pointer-events:none;z-index:0;}
        .fq-tl{top:48px;left:48px;max-width:180px;}
        .fq-tr{top:48px;right:48px;max-width:180px;text-align:right;}
        .fq-bl{bottom:80px;left:48px;max-width:160px;}
        .fq-br{bottom:80px;right:48px;max-width:160px;text-align:right;}
        .fq-s{font-family:'Tiro Devanagari Sanskrit',serif;font-size:18px;color:#1a1a1a;opacity:0.07;line-height:1.5;}
        .fq-m{font-size:10px;color:#1a1a1a;opacity:0.04;letter-spacing:1px;margin-top:3px;font-family:'DM Sans',sans-serif;}
        @media(max-width:768px){.fq{display:none;}}
        .card{position:relative;z-index:1;width:100%;max-width:420px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.08);}
        .card-top{padding:40px 40px 28px;text-align:center;border-bottom:1px solid #f0ede8;}
        @media(max-width:480px){.card-top{padding:32px 28px 24px;}}
        .monk-wrap{margin-bottom:16px;}
        .monk-img{width:110px;height:120px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.12));}
        .logo{font-family:'DM Serif Display',serif;font-size:64px;color:#000;line-height:1;margin-bottom:4px;letter-spacing:-1px;}
        @media(max-width:480px){.logo{font-size:52px;}}
        .logo-sub{font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;font-weight:300;}
        .quote-box{margin-top:16px;padding:12px 16px;background:#faf9f6;border-radius:10px;border:1px solid #f0ede8;}
        .qt{font-family:'Tiro Devanagari Sanskrit',serif;font-size:15px;color:#000;line-height:1.6;}
        .qm{font-size:11px;color:#666;margin-top:4px;font-family:'DM Sans',sans-serif;font-weight:300;font-style:italic;}
        .card-body{padding:28px 40px 36px;}
        @media(max-width:480px){.card-body{padding:24px 28px 32px;}}
        .divider{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
        .div-line{flex:1;height:1px;background:#f0ede8;}
        .div-text{font-size:11px;color:#ccc;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;font-family:'DM Sans',sans-serif;}
        .label{display:block;font-size:11px;font-weight:600;color:#999;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;}
        .input{width:100%;padding:13px 16px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:12px;color:#1a1a1a;font-size:15px;font-family:'DM Sans',sans-serif;outline:none;transition:all 0.2s;margin-bottom:14px;}
        .input::placeholder{color:#ccc;}
        .input:focus{border-color:#1a1a1a;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,0.04);}
        .btn{width:100%;padding:14px;background:#1a1a1a;border:none;border-radius:12px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;letter-spacing:0.2px;}
        .btn:hover{background:#2d2d2d;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.15);}
        .btn:active{transform:translateY(0);}
        .btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
        .error{font-size:13px;color:#e53e3e;margin-top:12px;padding:10px 14px;background:#fff5f5;border:1px solid #fecaca;border-radius:8px;text-align:center;}
        .footer{text-align:center;margin-top:20px;font-size:11px;color:#ddd;letter-spacing:1px;text-transform:uppercase;}
      `}</style>
      <div className="root">
        <div className="bg-dots"/>
        {sideQuotes[0] && <div className="fq fq-tl"><div className="fq-s">{sideQuotes[0].text}</div><div className="fq-m">{sideQuotes[0].meaning}</div></div>}
        {sideQuotes[1] && <div className="fq fq-tr"><div className="fq-s">{sideQuotes[1].text}</div><div className="fq-m">{sideQuotes[1].meaning}</div></div>}
        {sideQuotes[2] && <div className="fq fq-bl"><div className="fq-s">{sideQuotes[2].text}</div><div className="fq-m">{sideQuotes[2].meaning}</div></div>}
        {sideQuotes[3] && <div className="fq fq-br"><div className="fq-s">{sideQuotes[3].text}</div><div className="fq-m">{sideQuotes[3].meaning}</div></div>}
        <div className="card">
          <div className="card-top">
            <div className="monk-wrap">
              <img src="/monk.png" alt="Granth" className="monk-img"/>
            </div>
            <div className="logo">ग्रंथ</div>
            <div className="logo-sub">SFL Knowledge Base</div>
            <div className="quote-box">
              <div className="qt">{quote.text}</div>
              <div className="qm">{quote.meaning}</div>
            </div>
          </div>
          <div className="card-body">
            <div className="divider">
              <div className="div-line"/>
              <div className="div-text">Sign in to continue</div>
              <div className="div-line"/>
            </div>
            <form onSubmit={handleLogin}>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@systemfriendly.com"
                value={email} onChange={e => setEmail(e.target.value)} required/>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Enter Granth →'}
              </button>
              {error && <div className="error">{error}</div>}
            </form>
            <div className="footer">SFL Internal · Restricted access</div>
          </div>
        </div>
      </div>
    </>
  )
}
