import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.access_token) {
      await supabaseAdmin.auth.admin.signOut(body.access_token)
    }
  } catch {}
  
  const res = NextResponse.json({ success: true })
  res.cookies.set('granth_token', '', { maxAge: 0, path: '/' })
  return res
}
