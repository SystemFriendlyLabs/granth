import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/logout']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()

  const token = req.cookies.get('granth_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await verifyToken(token)
  if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const adminRoutes = ['/api/docs', '/api/ingest', '/api/entities', '/api/auth/users', '/api/analytics']
  if (adminRoutes.some(r => pathname.startsWith(r)) && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Track session
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await sb.from('sessions').upsert({
      email: user.email,
      role: user.role,
      last_seen: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    }, { onConflict: 'email' })
  } catch {}

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-email', user.email)
  requestHeaders.set('x-user-role', user.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: '/api/:path*'
}
