'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function QuizPage() {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [streak, setStreak] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showStreak, setShowStreak] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<any>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
    fetchQuiz()
  }, [])

  useEffect(() => {
    if (!questions.length || results) return
    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleNext(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [current, questions.length])

  async function fetchQuiz() {
    const [qRes, questRes] = await Promise.all([
      fetch(`/api/quizzes`),
      fetch(`/api/quizzes/questions?quiz_id=${params.id}`)
    ])
    const { quizzes } = await qRes.json()
    const { questions: qs } = await questRes.json()
    const q = quizzes?.find((q: any) => q.id === params.id)
    setQuiz(q)
    setQuestions(qs)
    setLoading(false)
  }

  function handleSelect(option: string) {
    if (selected) return
    clearInterval(timerRef.current)
    setSelected(option)
    const q = questions[current]
    const correct = option === q.correct_answer
    const newAnswers = { ...answers, [q.id]: option }
    setAnswers(newAnswers)
    if (correct) {
      setStreak(s => s + 1)
      if ((streak + 1) >= 3) setShowStreak(true)
    } else {
      setStreak(0)
      setShowStreak(false)
    }
    if (q.explanation) setShowExplanation(true)
    else setTimeout(() => handleNext(false, newAnswers), 800)
  }

  function handleNext(timedOut = false, currentAnswers = answers) {
    setShowExplanation(false)
    setSelected(null)
    setShowStreak(false)
    if (current + 1 >= questions.length) {
      submitQuiz(currentAnswers)
    } else {
      setCurrent(c => c + 1)
    }
  }

  async function submitQuiz(finalAnswers = answers) {
    setSubmitting(true)
    const stored = localStorage.getItem('granth_user')
    const u = stored ? JSON.parse(stored) : user
    const res = await fetch('/api/quizzes/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: params.id, user_email: u.email, answers: finalAnswers })
    })
    const data = await res.json()
    setResults(data)
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f7f6f2',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{fontSize:'14px',color:'#999'}}>Loading quiz...</div>
    </div>
  )

  if (!quiz || !questions.length) return (
    <div style={{minHeight:'100vh',background:'#f7f6f2',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🤔</div>
        <div style={{fontSize:'16px',color:'#1a1a1a',fontWeight:500}}>Quiz not found</div>
        <button onClick={() => router.push('/chat')} style={{marginTop:'16px',padding:'10px 20px',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px'}}>Go back</button>
      </div>
    </div>
  )

  if (results) {
    const passed = results.pct >= 70
    return (
      <div style={{minHeight:'100vh',background:'#f7f6f2',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif',padding:'20px'}}>
        <div style={{background:'#fff',borderRadius:'24px',padding:'40px',maxWidth:'500px',width:'100%',textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.08)'}}>
          <div style={{fontSize:'64px',marginBottom:'16px'}}>{passed ? '🎉' : '📚'}</div>
          <div style={{fontSize:'28px',fontWeight:700,color:'#1a1a1a',marginBottom:'8px'}}>{passed ? 'Well done!' : 'Keep learning!'}</div>
          <div style={{fontSize:'15px',color:'#666',marginBottom:'24px'}}>{quiz.title}</div>
          <div style={{background:passed?'#f0fdf9':'#fff5f5',border:`1px solid ${passed?'#bbf7d0':'#fecaca'}`,borderRadius:'16px',padding:'24px',marginBottom:'24px'}}>
            <div style={{fontSize:'56px',fontWeight:700,color:passed?'#10b981':'#e53e3e',lineHeight:1}}>{results.pct}%</div>
            <div style={{fontSize:'14px',color:'#666',marginTop:'8px'}}>{results.score} out of {results.total} correct</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px',textAlign:'left'}}>
            {results.results?.map((r: any, i: number) => (
              <div key={i} style={{display:'flex',gap:'10px',padding:'10px 14px',background:r.correct?'#f0fdf9':'#fff5f5',borderRadius:'10px',border:`1px solid ${r.correct?'#bbf7d0':'#fecaca'}`}}>
                <span style={{fontSize:'16px',flexShrink:0}}>{r.correct ? '✓' : '✗'}</span>
                <div>
                  <div style={{fontSize:'13px',color:'#1a1a1a',fontWeight:500}}>{r.question}</div>
                  {!r.correct && <div style={{fontSize:'12px',color:'#10b981',marginTop:'2px'}}>Correct: {r.correct_answer}</div>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/chat')} style={{width:'100%',padding:'14px',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'14px',fontWeight:500}}>
            Back to Granth
          </button>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const progress = ((current) / questions.length) * 100
  const options = q.options as string[]

  return (
    <div style={{minHeight:'100vh',background:'#f7f6f2',display:'flex',flexDirection:'column',fontFamily:'DM Sans,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #f0ede8',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'DM Serif Display,serif',fontSize:'20px',color:'#1a1a1a'}}>ग्रंथ</div>
        <div style={{fontSize:'13px',color:'#666',fontWeight:500}}>{quiz.title}</div>
        <div style={{fontSize:'13px',color:timeLeft<=10?'#e53e3e':'#999',fontWeight:timeLeft<=10?600:400,background:timeLeft<=10?'#fff5f5':'#f7f6f2',padding:'4px 12px',borderRadius:'20px',transition:'all 0.3s'}}>
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:'3px',background:'#f0ede8'}}>
        <div style={{height:'100%',background:'#1a1a1a',width:`${progress}%`,transition:'width 0.4s ease'}}/>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
        <div style={{width:'100%',maxWidth:'560px'}}>
          
          {/* Streak banner */}
          {showStreak && (
            <div style={{textAlign:'center',marginBottom:'16px',animation:'slideIn 0.3s ease'}}>
              <span style={{background:'#1a1a1a',color:'#fff',padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:500}}>
                🔥 {streak} in a row!
              </span>
            </div>
          )}

          {/* Question card */}
          <div style={{background:'#fff',borderRadius:'20px',padding:'32px',boxShadow:'0 2px 16px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
            <div style={{fontSize:'12px',color:'#bbb',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'16px'}}>
              Question {current + 1} of {questions.length}
            </div>
            <div style={{fontSize:'20px',fontWeight:600,color:'#1a1a1a',lineHeight:1.5,marginBottom:'28px'}}>
              {q.question}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {options.map((opt: string, i: number) => {
                const isSelected = selected === opt
                const isCorrect = opt === q.correct_answer
                let bg = '#f7f6f2'
                let border = '1.5px solid #ebe8e2'
                let color = '#1a1a1a'
                if (selected) {
                  if (isCorrect) { bg = '#f0fdf9'; border = '1.5px solid #10b981'; color = '#065f46' }
                  else if (isSelected) { bg = '#fff5f5'; border = '1.5px solid #e53e3e'; color = '#7f1d1d' }
                  else { bg = '#fafafa'; color = '#bbb' }
                }
                return (
                  <button key={i} onClick={() => handleSelect(opt)}
                    style={{padding:'14px 18px',background:bg,border,borderRadius:'12px',color,fontSize:'14px',fontWeight:500,textAlign:'left',cursor:selected?'default':'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'12px'}}>
                    <span style={{width:'24px',height:'24px',borderRadius:'50%',border:`1.5px solid ${selected?(isCorrect?'#10b981':isSelected?'#e53e3e':'#ddd'):'#ddd'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:selected?(isCorrect?'#10b981':isSelected?'#e53e3e':'#ddd'):'#999',flexShrink:0}}>
                      {['A','B','C','D'][i]}
                    </span>
                    {opt}
                    {selected && isCorrect && <span style={{marginLeft:'auto'}}>✓</span>}
                    {selected && isSelected && !isCorrect && <span style={{marginLeft:'auto'}}>✗</span>}
                  </button>
                )
              })}
            </div>

            {showExplanation && q.explanation && (
              <div style={{marginTop:'16px',padding:'14px',background:'#faf9f6',borderRadius:'10px',border:'1px solid #f0ede8'}}>
                <div style={{fontSize:'11px',fontWeight:600,color:'#999',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>Explanation</div>
                <div style={{fontSize:'13px',color:'#444',lineHeight:1.6}}>{q.explanation}</div>
              </div>
            )}
          </div>

          {selected && (
            <button onClick={() => handleNext()}
              style={{width:'100%',padding:'14px',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'14px',fontWeight:500,transition:'all 0.2s'}}>
              {current + 1 >= questions.length ? 'See results →' : 'Next question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
