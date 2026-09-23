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
  const [entities, setEntities] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('reader')
  const [newEntity, setNewEntity] = useState({ name: '', aliases: '', type: 'person', description: '' })
  const [activeTab, setActiveTab] = useState<'docs'|'users'|'entities'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/chat'); return }
    setUser(u); fetchDocs(); fetchUsers(); fetchEntities()
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

  async function fetchEntities() {
    const res = await fetch('/api/entities')
    const { entities } = await res.json()
    setEntities(entities || [])
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

  async function handleAddEntity(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newEntity,
        aliases: newEntity.aliases.split(',').map(a => a.trim()).filter(Boolean)
      })
    })
    setNewEntity({ name: '', aliases: '', type: 'person', description: '' })
    fetchEntities()
  }

  async function handleDeleteEntity(id: string) {
    await fetch('/api/entities', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    fetchEntities()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&family=Orbitron:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#f0f4ff;}
        .root{min-height:100vh;background:#f0f4ff;font-family:'Rajdhani',sans-serif;color:#1a2040;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,80,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,255,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;}
        .nav{background:#e8eeff;border-bottom:2px solid #c0ccff;padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;}
        .nav-logo{display:flex;align-items:baseline;gap:8px;}
        .nav-sanskrit{font-family:'Orbitron',monospace;font-size:18px;color:#2040cc;text-shadow:2px 2px 0 #c0ccff;}
        .nav-label{font-family:'Share Tech Mono',monospace;font-size:8px;color:#9090c0;letter-spacing:2px;}
        @media(max-width:480px){.nav-label{display:none;}}
        .nav-links{display:flex;gap:16px;}
        .nav-link{font-family:'Share Tech Mono',monospace;font-size:9px;color:#9090b0;letter-spacing:1px;text-decoration:none;background:none;border:none;cursor:pointer;transition:color 0.15s;padding:4px;}
        .nav-link:hover{color:#2040cc;}
        .body{max-width:860px;margin:0 auto;padding:28px 16px;position:relative;z-index:1;}
        .tabs{display:flex;gap:2px;margin-bottom:20px;}
        .tab{flex:1;padding:10px 8px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1px;color:#9090b0;background:#fff;border:1px solid #c0ccff;cursor:pointer;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);transition:all 0.15s;text-align:center;}
        .tab.active{color:#fff;background:#2040cc;border-color:#2040cc;}
        .tab:hover:not(.active){color:#2040cc;border-color:#2040cc66;}
        .panel{background:#fff;border:1px solid #c0ccff;border-top:3px solid #2040cc;margin-bottom:12px;}
        .panel-head{padding:12px 16px;border-bottom:1px solid #e8eeff;display:flex;align-items:center;justify-content:space-between;background:#f8f9ff;}
        .panel-title{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6070a0;letter-spacing:2px;}
        .panel-count{font-family:'Share Tech Mono',monospace;font-size:9px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;padding:2px 8px;letter-spacing:1px;}
        .panel-body{padding:16px;}
        .hint{font-family:'Share Tech Mono',monospace;font-size:9px;color:#b0b8cc;letter-spacing:1px;margin-bottom:10px;}
        input[type=file]{display:none;}
        .file-zone{border:2px dashed #c0ccff;padding:16px;display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:12px;transition:border-color 0.15s;background:#f8f9ff;}
        .file-zone:hover{border-color:#2040cc66;background:#f0f4ff;}
        .file-name{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6070a0;letter-spacing:1px;word-break:break-all;}
        .url-in{width:100%;padding:12px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:16px;font-family:'Rajdhani',sans-serif;outline:none;margin-bottom:12px;transition:border-color 0.2s;}
        .url-in::placeholder{color:#b0b8cc;}
        .url-in:focus{border-color:#2040cc66;}
        .field{margin-bottom:10px;}
        .field-label{font-family:'Share Tech Mono',monospace;font-size:8px;color:#6070a0;letter-spacing:2px;display:block;margin-bottom:4px;}
        .field-in{width:100%;padding:10px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:14px;font-family:'Rajdhani',sans-serif;outline:none;transition:border-color 0.2s;}
        .field-in::placeholder{color:#b0b8cc;}
        .field-in:focus{border-color:#2040cc66;}
        .field-select{width:100%;padding:10px 14px;background:#f0f4ff;border:1px solid #c0ccff;color:#6070a0;font-family:'Share Tech Mono',monospace;font-size:9px;outline:none;letter-spacing:1px;}
        .btn{padding:11px 20px;background:#2040cc;border:none;color:#fff;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;cursor:pointer;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:background 0.15s;}
        .btn:hover{background:#1030aa;}
        .btn:disabled{opacity:0.4;cursor:not-allowed;}
        .btn-full{width:100%;}
        .ok{font-family:'Share Tech Mono',monospace;font-size:9px;color:#00aa44;letter-spacing:1px;margin-top:8px;}
        .err{font-family:'Share Tech Mono',monospace;font-size:9px;color:#cc2040;letter-spacing:1px;margin-top:8px;}
        .doc-row{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f4ff;gap:12px;transition:background 0.1s;}
        .doc-row:last-child{border-bottom:none;}
        .doc-row:hover{background:#f8f9ff;}
        .doc-info{flex:1;min-width:0;}
        .doc-name{font-size:13px;color:#2a3870;display:flex;align-items:center;gap:6px;flex-wrap:wrap;word-break:break-word;}
        .doc-open{font-family:'Share Tech Mono',monospace;font-size:8px;color:#2040cc;text-decoration:none;border:1px solid #2040cc30;padding:2px 6px;letter-spacing:1px;}
        .doc-badge{font-family:'Share Tech Mono',monospace;font-size:8px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;padding:2px 6px;letter-spacing:1px;}
        .doc-sum{font-size:11px;color:#7080a0;margin-top:3px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .doc-meta{font-family:'Share Tech Mono',monospace;font-size:8px;color:#b0b8cc;margin-top:4px;letter-spacing:1px;}
        .del-btn{font-family:'Share Tech Mono',monospace;font-size:9px;color:#c0c8d8;background:none;border:1px solid transparent;cursor:pointer;padding:6px 8px;letter-spacing:1px;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
        .del-btn:hover{color:#cc2040;border-color:#cc204022;background:#cc204008;}
        .empty{padding:28px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:9px;color:#c0c8d8;letter-spacing:2px;}
        .user-form{display:flex;gap:8px;flex-wrap:wrap;}
        .user-in{flex:1;min-width:180px;padding:11px 14px;background:#f0f4ff;border:1px solid #c0ccff;border-left:3px solid #2040cc;color:#1a2040;font-size:16px;font-family:'Rajdhani',sans-serif;outline:none;}
        .user-in::placeholder{color:#b0b8cc;}
        .role-sel{padding:11px 10px;background:#f0f4ff;border:1px solid #c0ccff;color:#6070a0;font-family:'Share Tech Mono',monospace;font-size:9px;outline:none;letter-spacing:1px;}
        .user-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f4ff;gap:8px;}
        .user-row:last-child{border-bottom:none;}
        .user-info{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0;}
        .user-email{font-size:13px;color:#2a3870;word-break:break-all;}
        .role-badge{font-family:'Share Tech Mono',monospace;font-size:8px;padding:2px 8px;letter-spacing:1px;white-space:nowrap;}
        .role-admin{color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;}
        .role-reader{color:#9090b0;background:#f0f4ff;border:1px solid #c0ccff;}
        .entity-row{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f4ff;gap:12px;}
        .entity-row:last-child{border-bottom:none;}
        .entity-row:hover{background:#f8f9ff;}
        .entity-info{flex:1;min-width:0;}
        .entity-name{font-size:13px;color:#2a3870;font-weight:500;}
        .entity-type{font-family:'Share Tech Mono',monospace;font-size:8px;color:#2040cc;background:#2040cc10;border:1px solid #2040cc20;padding:2px 6px;letter-spacing:1px;margin-left:8px;}
        .entity-desc{font-size:11px;color:#7080a0;margin-top:3px;line-height:1.5;}
        .entity-aliases{font-family:'Share Tech Mono',monospace;font-size:8px;color:#b0b8cc;margin-top:3px;letter-spacing:1px;}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:480px){.grid-2{grid-template-columns:1fr;}}
      `}</style>
      <div className="root">
        <div className="grid"/>
        <nav className="nav">
          <div className="nav-logo">
            <span className="nav-sanskrit">ग्रंथ</span>
            <span className="nav-label">ADMIN VAULT</span>
          </div>
          <div className="nav-links">
            <a className="nav-link" href="/chat">QUERY</a>
            <button className="nav-link" onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }}>SIGN OUT</button>
          </div>
        </nav>
        <div className="body">
          <div className="tabs">
            <button className={`tab ${activeTab==='docs'?'active':''}`} onClick={() => setActiveTab('docs')}>KNOWLEDGE VAULT</button>
            <button className={`tab ${activeTab==='users'?'active':''}`} onClick={() => setActiveTab('users')}>USER ACCESS</button>
            <button className={`tab ${activeTab==='entities'?'active':''}`} onClick={() => setActiveTab('entities')}>ENTITIES</button>
          </div>

          {activeTab === 'docs' && <>
            <div className="panel">
              <div className="panel-head"><span className="panel-title">UPLOAD FILE</span></div>
              <div className="panel-body">
                <input ref={fileRef} type="file" id="fi" accept=".pdf,.docx,.xlsx,.xls,.pptx,.md,.txt,.png,.jpg,.jpeg"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>
                <label htmlFor="fi" className="file-zone">
                  <span style={{fontSize:18}}>📎</span>
                  <span className="file-name">{fileName || 'TAP TO SELECT FILE — PDF, WORD, EXCEL, PPT, MD, IMAGE'}</span>
                </label>
                <button className="btn btn-full" onClick={handleUpload as any} disabled={uploading}>
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
                  <button className="btn btn-full" type="submit" disabled={googleLoading}>
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
                        <span>{doc.name}</span>
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
                    <div className="user-info">
                      <span className="user-email">{u.email}</span>
                      <span className={`role-badge ${u.role==='admin'?'role-admin':'role-reader'}`}>{u.role.toUpperCase()}</span>
                    </div>
                    <button className="del-btn" onClick={() => handleRemoveUser(u.email)}>REVOKE</button>
                  </div>
                ))
              )}
            </div>
          </>}

          {activeTab === 'entities' && <>
            <div className="panel">
              <div className="panel-head"><span className="panel-title">ADD ENTITY</span></div>
              <div className="panel-body">
                <div className="hint">ADD PEOPLE, PRODUCTS, VENDORS — GRANTH WILL RECOGNIZE THEM IN QUERIES</div>
                <form onSubmit={handleAddEntity}>
                  <div className="grid-2">
                    <div className="field">
                      <label className="field-label">NAME</label>
                      <input className="field-in" placeholder="Surabhi" value={newEntity.name}
                        onChange={e => setNewEntity({...newEntity, name: e.target.value})} required/>
                    </div>
                    <div className="field">
                      <label className="field-label">TYPE</label>
                      <select className="field-select" value={newEntity.type}
                        onChange={e => setNewEntity({...newEntity, type: e.target.value})}>
                        <option value="person">PERSON</option>
                        <option value="product">PRODUCT</option>
                        <option value="vendor">VENDOR</option>
                        <option value="client">CLIENT</option>
                        <option value="other">OTHER</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">ALIASES (comma separated)</label>
                    <input className="field-in" placeholder="Surabhi M, Surabhi Mishra"
                      value={newEntity.aliases}
                      onChange={e => setNewEntity({...newEntity, aliases: e.target.value})}/>
                  </div>
                  <div className="field">
                    <label className="field-label">DESCRIPTION</label>
                    <input className="field-in" placeholder="QA Engineer at SFL, reports bugs for LIMS and InventoryCloud"
                      value={newEntity.description}
                      onChange={e => setNewEntity({...newEntity, description: e.target.value})} required/>
                  </div>
                  <button className="btn btn-full" type="submit">ADD ENTITY</button>
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">KNOWN ENTITIES</span>
                <span className="panel-count">{entities.length} ENTITIES</span>
              </div>
              {entities.length === 0 ? <div className="empty">NO ENTITIES ADDED YET</div> : (
                entities.map((e: any) => (
                  <div key={e.id} className="entity-row">
                    <div className="entity-info">
                      <div>
                        <span className="entity-name">{e.name}</span>
                        <span className="entity-type">{e.type.toUpperCase()}</span>
                      </div>
                      <div className="entity-desc">{e.description}</div>
                      {e.aliases?.length > 0 && (
                        <div className="entity-aliases">ALIASES: {e.aliases.join(', ')}</div>
                      )}
                    </div>
                    <button className="del-btn" onClick={() => handleDeleteEntity(e.id)}>REMOVE</button>
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
