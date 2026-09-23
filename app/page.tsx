'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/users')
    const { users } = await res.json()

    const user = users?.find((u: any) => u.email === email)
    if (!user) {
      setError('Access denied. Contact your admin.')
      setLoading(false)
      return
    }

    localStorage.setItem('granth_user', JSON.stringify(user))

    if (user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/chat')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ग्रंथ</h1>
          <p className="text-gray-400">Granth — SFL Knowledge Base</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Enter Granth'}
          </button>
        </form>
      </div>
    </div>
  )
}
