import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: logs } = await supabaseAdmin
      .from('query_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    const total = logs?.length || 0
    const upvotes = logs?.filter(l => l.score === 1).length || 0
    const downvotes = logs?.filter(l => l.score === -1).length || 0

    // Top questions
    const questionCount: Record<string, number> = {}
    logs?.forEach(l => {
      const q = l.question.toLowerCase().trim()
      questionCount[q] = (questionCount[q] || 0) + 1
    })
    const topQuestions = Object.entries(questionCount)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([q, count]) => ({ question: q, count }))

    // Failed queries (downvoted or no score on recent)
    const failed = logs?.filter(l => l.score === -1).map(l => l.question) || []

    return NextResponse.json({ total, upvotes, downvotes, topQuestions, failed, logs: logs?.slice(0, 20) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
