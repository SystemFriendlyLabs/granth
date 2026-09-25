import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const quiz_id = req.nextUrl.searchParams.get('quiz_id')
  if (!quiz_id) return NextResponse.json({ questions: [] })

  const { data } = await supabaseAdmin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz_id)
    .order('order_num')

  return NextResponse.json({ questions: data || [] })
}
