'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [googleUrl, setGoogleUrl] = useState('')
  const [googleMsg, setGoogleMsg] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('reader')
  const [activeTab, setActiveTab] = useState<'docs' | 'users'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/chat'); return }
    setUser(u)
    fetchDocs()
    fetchUsers()
  }, [])

  async function fetchDocs() {
    const res = await fetch('/api/docs')
    const { documents } = await res.json()
    setDocuments(documents || [])
  }

  async function fetchUsers() {
    const res = await fetch('/api/auth/users')
    const { users } = await res.json()
    setUsers(users || [])
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadedBy', user.email)
    const res = await fetch('/api/ingest', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.success) {
      setUploadMsg('✓ Document uploaded and indexed successfully')
      fetchDocs()
      if (fileRef.current) fileRef.current.value = ''
    } else {
      setUploadMsg(`✗ Error: ${data.error}`)
    }
    setUploading(false)
  }

  async function handleGoogleLink(e: React.FormEvent) {
    e.preventDefault()
    if (!googleUrl.trim()) return
    setGoogleLoading(true)
    setGoogleMsg('')
    const res = await fetch('/api/ingest/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: googleUrl, uploadedBy: user.email })
    })
    const data = await res.json()
    if (data.success) {
      setGoogleMsg('✓ Google document indexed successfully')
      setGoogleUrl('')
      fetchDocs()
    } else {
      setGoogleMsg(`✗ Error: ${data.error}`)
    }
    setGoogleLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch('/api/docs', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    fetchDocs()
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/auth/users', {
      method: 'POST',
      body: JSON.stringify({ email: newEmail, role: newRole }),
      headers: { 'Content-Type': 'application/json' }
    })
    setNewEmail('')
    fetchUsers()
  }

  async function handleRemoveUser(email: string) {
    if (!confirm(`Remove ${email}?`)) return
    await fetch('/api/auth/users', {
      method: 'DELETE',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    })
    fetchUsers()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ग्रंथ <span className="text-gray-400 text-sm font-normal ml-2">Admin</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => router.push('/chat')} className="text-sm text-gray-400 hover:text-white">Chat →</button>
          <button onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }} className="text-sm text-gray-400 hover:text-red-400">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'docs' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>Documents</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'users' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>Users</button>
        </div>

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.pptx,.md,.txt,.png,.jpg,.jpeg" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" required />
                <button type="submit" disabled={uploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium disabled:opacity-50">
                  {uploading ? 'Processing...' : 'Upload & Index'}
                </button>
                {uploadMsg && <p className={`text-sm ${uploadMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{uploadMsg}</p>}
              </form>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-1">Add Google Doc / Sheet / Slides</h2>
              <p className="text-gray-500 text-xs mb-4">Document must be shared as "Anyone with the link can view"</p>
              <form onSubmit={handleGoogleLink} className="space-y-4">
                <input
                  type="url"
                  placeholder="https://docs.google.com/document/d/..."
                  value={googleUrl}
                  onChange={e => setGoogleUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button type="submit" disabled={googleLoading} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium disabled:opacity-50">
                  {googleLoading ? 'Fetching & Indexing...' : 'Add Google Link'}
                </button>
                {googleMsg && <p className={`text-sm ${googleMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{googleMsg}</p>}
              </form>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
              </div>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-sm p-6">No documents uploaded yet.</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          {doc.type === 'google' && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">Google</span>}
                        </div>
                        {doc.summary && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{doc.summary}</p>}
                        <p className="text-gray-600 text-xs mt-1">{new Date(doc.created_at).toLocaleDateString()} · {doc.uploaded_by}</p>
                      </div>
                      <button onClick={() => handleDelete(doc.id, doc.name)} className="text-red-400 hover:text-red-300 text-xs shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Add User</h2>
              <form onSubmit={handleAddUser} className="flex gap-3">
                <input type="email" placeholder="Email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" required />
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none">
                  <option value="reader">Reader</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add</button>
              </form>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Users ({users.length})</h2>
              </div>
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm p-6">No users added yet.</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {users.map((u: any) => (
                    <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{u.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{u.role}</p>
                      </div>
                      <button onClick={() => handleRemoveUser(u.email)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
