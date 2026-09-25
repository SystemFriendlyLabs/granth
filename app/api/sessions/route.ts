import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .order('last_seen', { ascending: false })

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const sessions = (data || []).map(s => ({
      ...s,
      online: s.last_seen > fiveMinutesAgo
    }))

    return NextResponse.json({ sessions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
