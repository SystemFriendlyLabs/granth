import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { query_log_id, score, chunk_ids } = await req.json()
    if (!query_log_id) return NextResponse.json({ error: 'No query_log_id' }, { status: 400 })

    // Update query log score
    await supabaseAdmin
      .from('query_logs')
      .update({ score })
      .eq('id', query_log_id)

    // Update chunk scores based on feedback
    if (chunk_ids?.length) {
      const delta = score > 0 ? 0.1 : -0.1
      for (const chunk_id of chunk_ids) {
        await supabaseAdmin.rpc('increment_chunk_score', { chunk_id, delta })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
