import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get pending quizzes for a user
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ quizzes: [] })

  const { data: assignments } = await supabaseAdmin
    .from('quiz_assignments')
    .select('*, quizzes(*)')
    .eq('user_email', email)
    .is('completed_at', null)

  return NextResponse.json({ pending: assignments || [] })
}

// Submit quiz attempt
export async function POST(req: NextRequest) {
  const { quiz_id, user_email, answers } = await req.json()

  const { data: questions } = await supabaseAdmin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz_id)
    .order('order_num')

  if (!questions) return NextResponse.json({ error: 'No questions' }, { status: 404 })

  let score = 0
  const results = questions.map((q: any) => {
    const userAnswer = answers[q.id]
    const correct = userAnswer === q.correct_answer
    if (correct) score++
    return { ...q, userAnswer, correct }
  })

  const total = questions.length
  const pct = Math.round((score / total) * 100)

  await supabaseAdmin.from('quiz_attempts').insert({
    quiz_id, user_email, answers, score, total,
    completed_at: new Date().toISOString()
  })

  await supabaseAdmin.from('quiz_assignments')
    .update({ completed_at: new Date().toISOString(), score: pct })
    .eq('quiz_id', quiz_id).eq('user_email', user_email)

  return NextResponse.json({ score, total, pct, results })
}
