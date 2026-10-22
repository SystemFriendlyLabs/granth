import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE() {
  await supabaseAdmin.from('query_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  return NextResponse.json({ success: true })
}

export async function GET() {
  const { count } = await supabaseAdmin.from('query_cache').select('*', { count: 'exact', head: true })
  return NextResponse.json({ count })
}
