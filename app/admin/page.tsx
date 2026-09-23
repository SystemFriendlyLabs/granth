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
  const [activeTab, setActiveTab] = useState<'docs'|'users'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/chat'); return }
    setUser(u); fetchDocs(); fetchUsers()
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
    setUploading(true); setUploadMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadedBy', user.email)
    const res = await fetch('/api/ingest', { method: 'POST', body: formData })
    const data = await res.json()
    setUploadMsg(data.success ? 'success' : `error:${data.error}`)
    if (data.success) { fetchDocs(); if (fileRef.current) fileRef.current.value = ''; setFileName('') }
    setUploading(false)
  }

  async function handleGoogleLink(e: React.FormEvent) {
    e.preventDefault()
    if (!googleUrl.trim()) return
    setGoogleLoading(true); setGoogleMsg('')
    const res = await fetch('/api/ingest/google', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: googleUrl, uploadedBy: user.email })
    })
    const data = await res.json()
    setGoogleMsg(data.success ? 'success' : `error:${data.error}`)
    if (data.success) { setGoogleUrl(''); fetchDocs() }
    setGoogleLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`DELETE: "${name}"?`)) return
    await fetch('/api/docs', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    fetchDocs()
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/auth/users', { method: 'POST', body: JSON.stringify({ email: newEmail, role: newRole }), headers: { 'Content-Type': 'application/json' } })
    setNewEmail(''); fetchUsers()
  }

  async function handleRemoveUser(email: string) {
    if (!confirm(`REMOVE: ${email}?`)) return
    await fetch('/api/auth/users', { method: 'DELETE', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } })
    fetchUsers()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&family=Orbitron:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#f0f4ff;}
        .root{min-height:100vh;background:#f0f4ff;font-family:'Rajdhani',sans-serif;color:#1a2040;position:relative;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,80,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,255,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;}
        .nav{background:#e8eeff;border-bottom:2px solid #c0ccff;padding:0 32px;height:52px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;}
        .nav-logo{display:flex;align-items:baseline;gap:10px;}
        .nav-sanskrit{font-family:'Orbitron',monospace;font-size:20px;color:#2040cc;text-shadow:2px 2px 0 #c0ccff;}
        .nav-label{font-family:'Share Tech Mono',monospace;font-size:9px;color:#9090c0;letter-spacing:3px;}
        .nav-links{display:flex;gap:20px;}
        .nav-link{font-family:'Share Tech Mono',monospace;font-size:9px;color:#9090b0;letter-spacing:2px;text-decoration:none;background:none;border:none;cursor:pointer;transition:color 0.15s;}
        .nav-link:hover{color:#2040cc;}
        .body{max-width:900px;margin:0 auto;padding:36px 24px;position:relative;z-index:1;}
        .tabs{display:flex;gap:2px;margin-bottom:24px;}
        .tab{padding:8px 20px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:#9090b0;background:#fff;border:1px solid #c0ccff;cursor:pointer;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);transition:all 0.15s;}
        .tab.active{color:#fff;background:#2040cc;border-color:#2040cc;}
        .tab:hover:not(.active){color:#2040cc;border-color:#2040cc66;}
        .panel{background:#fff;border:1px solid #c0ccff;border-top:3px solid #2040cc;margin-bottom:12px;position:relative;}
        .panel-head{padding:14px 20px;border-bottom:1px solid #e8eeff;display:flex;align-items:center;justify-content:space-between;background:#f8f9ff;}
        .panel-title{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6070a0;letter-spacing:2px;}
        .panel-count{font-family:'Share Tech Mono',monospace;font-size:9px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;padding:2px 8px;letter-spacing:2px;}
        .panel-body{padding:20px;}
        .hint{font-family:'Share Tech Mono',monospace;font-size:9px;color:#b0b8cc;letter-spacing:1px;margin-bottom:12px;}
        input[type=file]{display:none;}
        .file-zone{border:2px dashed #c0ccff;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;margin-bottom:12px;transition:border-color 0.15s;background:#f8f9ff;}
        .file-zone:hover{border-color:#2040cc66;background:#f0f4ff;}
        .file-icon{font-size:18px;}
        .file-name{font-family:'Share Tech Mono',monospace;font-size:10px;color:#6070a0;letter-spacing:1px;}
        .url-in{width:100%;padding:10px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:13px;font-family:'Rajdhani',sans-serif;outline:none;margin-bottom:12px;transition:border-color 0.2s;}
        .url-in::placeholder{color:#b0b8cc;}
        .url-in:focus{border-color:#2040cc66;}
        .btn{padding:9px 18px;background:#2040cc;border:none;color:#fff;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;cursor:pointer;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:background 0.15s;}
        .btn:hover{background:#1030aa;}
        .btn:disabled{opacity:0.4;cursor:not-allowed;}
        .ok{font-family:'Share Tech Mono',monospace;font-size:9px;color:#00aa44;letter-spacing:1px;margin-top:8px;}
        .err{font-family:'Share Tech Mono',monospace;font-size:9px;color:#cc2040;letter-spacing:1px;margin-top:8px;}
        .doc-row{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f4ff;gap:16px;transition:background 0.1s;}
        .doc-row:last-child{border-bottom:none;}
        .doc-row:hover{background:#f8f9ff;}
        .doc-info{flex:1;min-width:0;}
        .doc-name{font-size:13px;color:#2a3870;letter-spacing:0.3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .doc-open{font-family:'Share Tech Mono',monospace;font-size:8px;color:#2040cc;text-decoration:none;border:1px solid #2040cc30;padding:1px 6px;letter-spacing:1px;transition:all 0.15s;}
        .doc-open:hover{background:#2040cc10;}
        .doc-badge{font-family:'Share Tech Mono',monospace;font-size:8px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;padding:1px 6px;letter-spacing:1px;}
        .doc-sum{font-size:11px;color:#7080a0;margin-top:3px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .doc-meta{font-family:'Share Tech Mono',monospace;font-size:8px;color:#b0b8cc;margin-top:4px;letter-spacing:1px;}
        .del-btn{font-family:'Share Tech Mono',monospace;font-size:9px;color:#c0c8d8;background:none;border:1px solid transparent;cursor:pointer;padding:4px 8px;letter-spacing:1px;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
        .del-btn:hover{color:#cc2040;border-color:#cc204022;background:#cc204008;}
        .empty{padding:32px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:9px;color:#c0c8d8;letter-spacing:2px;}
        .user-form{display:flex;gap:8px;}
        .user-in{flex:1;padding:9px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:13px;font-family:'Rajdhani',sans-serif;outline:none;}
        .user-in::placeholder{color:#b0b8cc;}
        .role-sel{padding:9px 10px;background:#f0f4ff;border:1px solid #c0ccff;color:#6070a0;font-family:'Share Tech Mono',monospace;font-size:9px;outline:none;letter-spacing:1px;}
        .user-row{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #f0f4ff;}
        .user-row:last-child{border-bottom:none;}
        .user-email{font-size:13px;color:#2a3870;}
        .role-badge{font-family:'Share Tech Mono',monospace;font-size:8px;padding:2px 8px;letter-spacing:1px;margin-left:10px;}
        .role-admin{color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;}
        .role-reader{color:#9090b0;background:#f0f4ff;border:1px solid #c0ccff;}
      `}</style>
      <div className="root">
        <div className="grid"/>
        <nav className="nav">
          <div className="nav-logo">
            <span className="nav-sanskrit">ग्रंथ</span>
            <span className="nav-label">ADMIN VAULT</span>
          </div>
          <div className="nav-links">
            <a className="nav-link" href="/chat">QUERY MODE</a>
            <button className="nav-link" onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }}>SIGN OUT</button>
          </div>
        </nav>
        <div className="body">
          <div className="tabs">
            <button className={`tab ${activeTab==='docs'?'active':''}`} onClick={() => setActiveTab('docs')}>KNOWLEDGE VAULT</button>
            <button className={`tab ${activeTab==='users'?'active':''}`} onClick={() => setActiveTab('users')}>USER ACCESS</button>
          </div>

          {activeTab === 'docs' && <>
            <div className="panel">
              <div className="panel-head"><span className="panel-title">UPLOAD FILE</span></div>
              <div className="panel-body">
                <input ref={fileRef} type="file" id="fi" accept=".pdf,.docx,.xlsx,.xls,.pptx,.md,.txt,.png,.jpg,.jpeg"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>
                <label htmlFor="fi" className="file-zone">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{fileName || 'SELECT FILE — PDF, WORD, EXCEL, PPT, MD, IMAGE'}</span>
                </label>
                <button className="btn" onClick={handleUpload as any} disabled={uploading}>
                  {uploading ? 'INDEXING...' : 'UPLOAD + INDEX'}
                </button>
                {uploadMsg === 'success' && <div className="ok">✓ INDEXED SUCCESSFULLY</div>}
                {uploadMsg.startsWith('error:') && <div className="err">✗ {uploadMsg.slice(6)}</div>}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><span className="panel-title">ADD GOOGLE LINK</span></div>
              <div className="panel-body">
                <div className="hint">SET SHARING TO "ANYONE WITH THE LINK" BEFORE ADDING</div>
                <form onSubmit={handleGoogleLink}>
                  <input className="url-in" type="url" placeholder="https://docs.google.com/..."
                    value={googleUrl} onChange={e => setGoogleUrl(e.target.value)} required/>
                  <button className="btn" type="submit" disabled={googleLoading}>
                    {googleLoading ? 'FETCHING...' : 'INDEX LINK'}
                  </button>
                  {googleMsg === 'success' && <div className="ok">✓ INDEXED SUCCESSFULLY</div>}
                  {googleMsg.startsWith('error:') && <div className="err">✗ {googleMsg.slice(6)}</div>}
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">KNOWLEDGE BASE</span>
                <span className="panel-count">{documents.length} INDEXED</span>
              </div>
              {documents.length === 0 ? <div className="empty">NO DOCUMENTS INDEXED YET</div> : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="doc-row">
                    <div className="doc-info">
                      <div className="doc-name">
                        {doc.name}
                        {doc.type === 'google' && <span className="doc-badge">GOOGLE</span>}
                        {doc.source_url && <a className="doc-open" href={doc.source_url} target="_blank" rel="noopener noreferrer">↗ OPEN</a>}
                      </div>
                      {doc.summary && <div className="doc-sum">{doc.summary}</div>}
                      <div className="doc-meta">{new Date(doc.created_at).toLocaleDateString('en-IN')} · {doc.uploaded_by}</div>
                    </div>
                    <button className="del-btn" onClick={() => handleDelete(doc.id, doc.name)}>REMOVE</button>
                  </div>
                ))
              )}
            </div>
          </>}

          {activeTab === 'users' && <>
            <div className="panel">
              <div className="panel-head"><span className="panel-title">GRANT ACCESS</span></div>
              <div className="panel-body">
                <form onSubmit={handleAddUser} className="user-form">
                  <input className="user-in" type="email" placeholder="name@systemfriendly.com"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)} required/>
                  <select className="role-sel" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="reader">READER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                  <button className="btn" type="submit">ADD</button>
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">ACTIVE USERS</span>
                <span className="panel-count">{users.length} USERS</span>
              </div>
              {users.length === 0 ? <div className="empty">NO USERS CONFIGURED</div> : (
                users.map((u: any) => (
                  <div key={u.id} className="user-row">
                    <div style={{display:'flex',alignItems:'center'}}>
                      <span className="user-email">{u.email}</span>
                      <span className={`role-badge ${u.role==='admin'?'role-admin':'role-reader'}`}>{u.role.toUpperCase()}</span>
                    </div>
                    <button className="del-btn" onClick={() => handleRemoveUser(u.email)}>REVOKE</button>
                  </div>
                ))
              )}
            </div>
          </>}
        </div>
      </div>
    </>
  )
}
