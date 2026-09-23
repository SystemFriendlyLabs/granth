import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('granth_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ users: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('granth_users')
      .upsert({ email, role: role || 'reader' }, { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('granth_users')
      .delete()
      .eq('email', email)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
