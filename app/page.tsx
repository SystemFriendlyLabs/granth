'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState(quotes[0])
  const [sideQuotes, setSideQuotes] = useState<typeof quotes>([])
  const router = useRouter()

  useEffect(() => {
    const shuffled = [...quotes].sort(() => Math.random() - 0.5)
    setQuote(shuffled[0])
    setSideQuotes(shuffled.slice(1, 5))

    // Check if already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleAuthUser(session.user.email!)
      }
    })

    // Listen for auth changes (after OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthUser(session.user.email!)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleAuthUser(email: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (!res.ok) {
      await supabase.auth.signOut()
      setError('Access denied — your account is not authorized. Contact your admin.')
      return
    }
    localStorage.setItem('granth_user', JSON.stringify(data.user))
    router.push(data.user.role === 'admin' ? '/admin' : '/chat')
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { hd: 'systemfriendly.com' }
      }
    })
    if (error) { setError(error.message); setLoading(false) }
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
        .divider{display:flex;align-items:center;gap:12px;margin-bottom:24px;}
        .div-line{flex:1;height:1px;background:#f0ede8;}
        .div-text{font-size:11px;color:#ccc;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;font-family:'DM Sans',sans-serif;}
        .google-btn{width:100%;padding:14px;background:#fff;border:1.5px solid #e0e0e0;border-radius:12px;color:#1a1a1a;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;}
        .google-btn:hover{border-color:#1a1a1a;background:#faf9f6;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.08);}
        .google-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .google-icon{width:18px;height:18px;flex-shrink:0;}
        .error{font-size:13px;color:#e53e3e;margin-top:12px;padding:10px 14px;background:#fff5f5;border:1px solid #fecaca;border-radius:8px;text-align:center;}
        .footer{text-align:center;margin-top:20px;font-size:11px;color:#ddd;letter-spacing:1px;text-transform:uppercase;}
        .security-note{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;font-size:11px;color:#bbb;}
        .lock-icon{font-size:12px;}
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
            <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
            {error && <div className="error">{error}</div>}
            <div className="security-note">
              <span className="lock-icon">🔒</span>
              <span>Only @systemfriendly.com accounts allowed</span>
            </div>
            <div className="footer">SFL Internal · Restricted access</div>
          </div>
        </div>
      </div>
    </>
  )
}
