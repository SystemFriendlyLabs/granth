import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'granth-sfl-secret-change-in-production'
)

export async function signToken(payload: { email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { email: string; role: string }
  } catch {
    return null
  }
}

export async function getUser(req: NextRequest) {
  const token = req.cookies.get('granth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
