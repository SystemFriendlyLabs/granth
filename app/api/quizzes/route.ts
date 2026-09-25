import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('quizzes')
    .select('*, quiz_questions(*), quiz_assignments(*)')
    .order('created_at', { ascending: false })
  return NextResponse.json({ quizzes: data || [] })
}

export async function POST(req: NextRequest) {
  const { title, description, questions, assignTo, created_by } = await req.json()
  
  const { data: quiz, error } = await supabaseAdmin
    .from('quizzes')
    .insert({ title, description, created_by })
    .select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (questions?.length) {
    await supabaseAdmin.from('quiz_questions').insert(
      questions.map((q: any, i: number) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        order_num: i
      }))
    )
  }

  if (assignTo?.length) {
    await supabaseAdmin.from('quiz_assignments').insert(
      assignTo.map((email: string) => ({ quiz_id: quiz.id, user_email: email }))
    )
  }

  return NextResponse.json({ success: true, quiz })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('quizzes').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
