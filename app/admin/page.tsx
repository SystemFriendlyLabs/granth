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
  const [analytics, setAnalytics] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('reader')
  const [newEntity, setNewEntity] = useState({ name: '', aliases: '', type: 'person', description: '' })
  const [activeTab, setActiveTab] = useState<'docs'|'users'|'entities'|'analytics'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [fileContext, setFileContext] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('granth_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/chat'); return }
    setUser(u); fetchDocs(); fetchUsers(); fetchEntities(); fetchAnalytics()
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
  async function fetchAnalytics() {
    const res = await fetch('/api/analytics')
    const data = await res.json()
    setAnalytics(data)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadedBy', user.email)
    if (fileContext.trim()) formData.append('context', fileContext.trim())
    const res = await fetch('/api/ingest', { method: 'POST', body: formData })
    const data = await res.json()
    setUploadMsg(data.success ? 'success' : `error:${data.error}`)
    if (data.success) { fetchDocs(); if (fileRef.current) fileRef.current.value = ''; setFileName(''); setFileContext('') }
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
    if (!confirm(`Delete "${name}"?`)) return
    await fetch('/api/docs', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    fetchDocs()
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/auth/users', { method: 'POST', body: JSON.stringify({ email: newEmail, role: newRole }), headers: { 'Content-Type': 'application/json' } })
    setNewEmail(''); fetchUsers()
  }

  async function handleRemoveUser(email: string) {
    if (!confirm(`Remove ${email}?`)) return
    await fetch('/api/auth/users', { method: 'DELETE', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } })
    fetchUsers()
  }

  async function handleAddEntity(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/entities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEntity, aliases: newEntity.aliases.split(',').map(a => a.trim()).filter(Boolean) })
    })
    setNewEntity({ name: '', aliases: '', type: 'person', description: '' }); fetchEntities()
  }

  async function handleDeleteEntity(id: string) {
    await fetch('/api/entities', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    fetchEntities()
  }

  const tabs = [
    { id: 'docs', label: 'Documents', count: documents.length },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'entities', label: 'Entities', count: entities.length },
    { id: 'analytics', label: 'Analytics', count: analytics?.total || 0 },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#f7f6f2;}
        .root{min-height:100vh;background:#f7f6f2;font-family:'DM Sans',sans-serif;color:#1a1a1a;}
        .nav{background:#fff;border-bottom:1px solid #ebe8e2;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
        .nav-logo{font-family:'DM Serif Display',serif;font-size:22px;color:#1a1a1a;letter-spacing:-0.5px;}
        .nav-sub{font-size:12px;color:#999;margin-left:8px;font-weight:300;}
        .nav-links{display:flex;gap:8px;align-items:center;}
        .nav-link{font-size:13px;color:#666;text-decoration:none;background:none;border:none;cursor:pointer;padding:6px 12px;border-radius:8px;transition:all 0.15s;font-family:'DM Sans',sans-serif;}
        .nav-link:hover{background:#f7f6f2;color:#1a1a1a;}
        .body{max-width:900px;margin:0 auto;padding:32px 20px;}
        
        .tab-bar{display:flex;gap:2px;background:#fff;border:1px solid #ebe8e2;border-radius:12px;padding:4px;width:fit-content;margin-bottom:28px;overflow-x:auto;}
        .tab{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:400;cursor:pointer;transition:all 0.15s;color:#666;border:none;background:none;font-family:'DM Sans',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:6px;}
        .tab.active{background:#1a1a1a;color:#fff;font-weight:500;}
        .tab:hover:not(.active){background:#f7f6f2;color:#1a1a1a;}
        .tab-count{font-size:10px;background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:10px;}
        .tab.active .tab-count{background:rgba(255,255,255,0.2);}
        .tab:not(.active) .tab-count{background:#f0ede8;color:#999;}

        .section{background:#fff;border:1px solid #ebe8e2;border-radius:16px;margin-bottom:16px;overflow:hidden;}
        .section-head{padding:16px 20px;border-bottom:1px solid #f7f6f2;display:flex;align-items:center;justify-content:space-between;}
        .section-title{font-size:14px;font-weight:500;color:#1a1a1a;}
        .section-count{font-size:12px;color:#999;background:#f7f6f2;padding:3px 10px;border-radius:20px;}
        .section-body{padding:20px;}
        .section-hint{font-size:12px;color:#999;margin-bottom:14px;line-height:1.5;}

        .field{margin-bottom:14px;}
        .field-label{display:block;font-size:12px;font-weight:500;color:#666;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;}
        .field-input{width:100%;padding:11px 14px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:10px;color:#1a1a1a;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:all 0.2s;}
        .field-input::placeholder{color:#bbb;}
        .field-input:focus{border-color:#1a1a1a;background:#fff;}
        .field-textarea{width:100%;padding:11px 14px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:10px;color:#1a1a1a;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:all 0.2s;resize:vertical;}
        .field-textarea::placeholder{color:#bbb;}
        .field-textarea:focus{border-color:#1a1a1a;background:#fff;}
        .field-select{width:100%;padding:11px 14px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:10px;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;}

        input[type=file]{display:none;}
        .file-zone{border:2px dashed #ebe8e2;border-radius:12px;padding:20px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;background:#faf9f6;margin-bottom:14px;}
        .file-zone:hover{border-color:#1a1a1a;background:#f7f6f2;}
        .file-icon{font-size:24px;}
        .file-info{flex:1;}
        .file-name-text{font-size:13px;color:#444;word-break:break-all;}
        .file-hint{font-size:11px;color:#bbb;margin-top:2px;}

        .btn{padding:11px 20px;background:#1a1a1a;border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.2s;}
        .btn:hover{background:#2d2d2d;transform:translateY(-1px);}
        .btn:active{transform:translateY(0);}
        .btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
        .btn-full{width:100%;}
        .btn-sm{padding:7px 14px;font-size:12px;}
        .btn-ghost{background:transparent;color:#666;border:1.5px solid #ebe8e2;}
        .btn-ghost:hover{background:#f7f6f2;color:#1a1a1a;border-color:#1a1a1a;}

        .msg-ok{font-size:13px;color:#10b981;margin-top:10px;padding:10px 14px;background:#f0fdf9;border:1px solid #bbf7d0;border-radius:8px;}
        .msg-err{font-size:13px;color:#e53e3e;margin-top:10px;padding:10px 14px;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;}

        .item-row{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f7f6f2;gap:12px;transition:background 0.1s;cursor:default;}
        .item-row:last-child{border-bottom:none;}
        .item-row:hover{background:#faf9f6;}
        .item-info{flex:1;min-width:0;}
        .item-name{font-size:14px;color:#1a1a1a;font-weight:500;display:flex;align-items:center;gap:8px;flex-wrap:wrap;word-break:break-word;}
        .item-meta{font-size:11px;color:#bbb;margin-top:3px;}
        .item-sum{font-size:12px;color:#666;margin-top:4px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .badge{font-size:10px;font-weight:500;padding:2px 8px;border-radius:6px;border:1px solid;}
        .badge-google{color:#4285f4;background:#eff6ff;border-color:#bfdbfe;}
        .badge-admin{color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe;}
        .badge-reader{color:#666;background:#f7f6f2;border-color:#ebe8e2;}
        .link-open{font-size:11px;color:#666;text-decoration:none;border:1px solid #ebe8e2;border-radius:6px;padding:3px 8px;transition:all 0.15s;}
        .link-open:hover{border-color:#1a1a1a;color:#1a1a1a;}
        .link-dl{font-size:11px;color:#10b981;text-decoration:none;border:1px solid #bbf7d0;border-radius:6px;padding:3px 8px;background:#f0fdf9;transition:all 0.15s;}
        .link-dl:hover{background:#dcfce7;}
        .del-btn{font-size:12px;color:#bbb;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.15s;flex-shrink:0;font-family:'DM Sans',sans-serif;}
        .del-btn:hover{color:#e53e3e;background:#fff5f5;}
        .empty-msg{padding:32px;text-align:center;font-size:14px;color:#bbb;}

        .user-form{display:flex;gap:8px;flex-wrap:wrap;}
        .user-input{flex:1;min-width:180px;padding:11px 14px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:10px;color:#1a1a1a;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;}
        .user-input::placeholder{color:#bbb;}
        .user-input:focus{border-color:#1a1a1a;background:#fff;}
        .role-select{padding:11px 14px;background:#f7f6f2;border:1.5px solid #ebe8e2;border-radius:10px;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;}

        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        @media(max-width:600px){.grid-2{grid-template-columns:1fr;}}

        .stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;}
        @media(max-width:600px){.stat-grid{grid-template-columns:1fr;}}
        .stat-card{background:#f7f6f2;border-radius:12px;padding:16px;text-align:center;}
        .stat-val{font-size:28px;font-weight:600;color:#1a1a1a;line-height:1;}
        .stat-label{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-top:6px;}

        .log-table{width:100%;border-collapse:collapse;font-size:13px;}
        .log-table th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0ede8;background:#faf9f6;}
        .log-table td{padding:12px 14px;border-bottom:1px solid #f7f6f2;vertical-align:middle;}
        .log-table tr:hover td{background:#faf9f6;cursor:pointer;}
        .log-table tr:last-child td{border-bottom:none;}
        .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;}

        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
        .modal{background:#fff;border-radius:20px;max-width:680px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,0.15);}
        .modal-head{padding:20px 24px;border-bottom:1px solid #f0ede8;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:1;}
        .modal-title{font-size:15px;font-weight:600;color:#1a1a1a;}
        .modal-close{background:none;border:none;cursor:pointer;font-size:20px;color:#999;padding:4px;border-radius:8px;transition:all 0.15s;}
        .modal-close:hover{background:#f7f6f2;color:#1a1a1a;}
        .modal-body{padding:24px;}
        .modal-field{margin-bottom:20px;}
        .modal-label{font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
        .modal-val{font-size:14px;color:#1a1a1a;line-height:1.7;background:#f7f6f2;border-radius:10px;padding:12px 14px;white-space:pre-wrap;}
        .modal-q{font-size:16px;font-weight:600;color:#1a1a1a;}
        .vote-display{font-size:24px;}

        @media(max-width:480px){.nav-sub{display:none;} .body{padding:20px 16px;}}
      `}</style>
      <div className="root">
        <nav className="nav">
          <div style={{display:'flex',alignItems:'center'}}>
            <span className="nav-logo">ग्रंथ</span>
            <span className="nav-sub">Admin</span>
          </div>
          <div className="nav-links">
            <a className="nav-link" href="/chat">Open chat</a>
            <button className="nav-link" onClick={() => { localStorage.removeItem('granth_user'); router.push('/') }}>Sign out</button>
          </div>
        </nav>

        <div className="body">
          <div className="tab-bar">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id as any); if (t.id === 'analytics') fetchAnalytics() }}>
                {t.label}
                <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          {activeTab === 'docs' && <>
            <div className="section">
              <div className="section-head"><span className="section-title">Upload file</span></div>
              <div className="section-body">
                <input ref={fileRef} type="file" id="fi" accept=".pdf,.docx,.xlsx,.xls,.pptx,.md,.txt,.png,.jpg,.jpeg"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>
                <label htmlFor="fi" className="file-zone">
                  <span className="file-icon">📎</span>
                  <div className="file-info">
                    <div className="file-name-text">{fileName || 'Choose a file to upload'}</div>
                    <div className="file-hint">PDF, Word, Excel, PPT, MD, Image</div>
                  </div>
                </label>
                <div className="field">
                  <label className="field-label">Document context (optional)</label>
                  <textarea className="field-textarea" rows={2}
                    placeholder="Describe what this document is for — e.g. 'SFL product pricing for hospital clients FY2026'"
                    value={fileContext} onChange={e => setFileContext(e.target.value)}/>
                </div>
                <button className="btn btn-full" onClick={handleUpload as any} disabled={uploading}>
                  {uploading ? 'Indexing...' : 'Upload & index'}
                </button>
                {uploadMsg === 'success' && <div className="msg-ok">✓ Document uploaded and indexed successfully</div>}
                {uploadMsg.startsWith('error:') && <div className="msg-err">✗ {uploadMsg.slice(6)}</div>}
              </div>
            </div>

            <div className="section">
              <div className="section-head"><span className="section-title">Add Google link</span></div>
              <div className="section-body">
                <div className="section-hint">Set sharing to "Anyone with the link can view" before adding. For Google Sheets, add each tab separately using its URL.</div>
                <form onSubmit={handleGoogleLink}>
                  <input className="field-input" style={{marginBottom:'14px'}} type="url" placeholder="https://docs.google.com/..."
                    value={googleUrl} onChange={e => setGoogleUrl(e.target.value)} required/>
                  <button className="btn btn-full" type="submit" disabled={googleLoading}>
                    {googleLoading ? 'Fetching & indexing...' : 'Add Google link'}
                  </button>
                  {googleMsg === 'success' && <div className="msg-ok">✓ Indexed successfully</div>}
                  {googleMsg.startsWith('error:') && <div className="msg-err">✗ {googleMsg.slice(6)}</div>}
                </form>
              </div>
            </div>

            <div className="section">
              <div className="section-head">
                <span className="section-title">Knowledge base</span>
                <span className="section-count">{documents.length} documents</span>
              </div>
              {documents.length === 0 ? <div className="empty-msg">No documents yet. Upload something above.</div> : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="item-row">
                    <div className="item-info">
                      <div className="item-name">
                        {doc.name}
                        {doc.type === 'google' && <span className="badge badge-google">Google</span>}
                        {doc.source_url && <a className="link-open" href={doc.source_url} target="_blank" rel="noopener noreferrer">↗ Open</a>}
                        {doc.source_url && <a className="link-dl" href={doc.source_url} download>↓ Download</a>}
                      </div>
                      {doc.summary && <div className="item-sum">{doc.summary}</div>}
                      <div className="item-meta">{new Date(doc.created_at).toLocaleDateString('en-IN')} · {doc.uploaded_by}</div>
                    </div>
                    <button className="del-btn" onClick={() => handleDelete(doc.id, doc.name)}>Remove</button>
                  </div>
                ))
              )}
            </div>
          </>}

          {activeTab === 'users' && <>
            <div className="section">
              <div className="section-head"><span className="section-title">Add user</span></div>
              <div className="section-body">
                <form onSubmit={handleAddUser} className="user-form">
                  <input className="user-input" type="email" placeholder="name@systemfriendly.com"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)} required/>
                  <select className="role-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="reader">Reader</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn" type="submit">Add</button>
                </form>
              </div>
            </div>
            <div className="section">
              <div className="section-head">
                <span className="section-title">Team members</span>
                <span className="section-count">{users.length} users</span>
              </div>
              {users.length === 0 ? <div className="empty-msg">No users yet.</div> : (
                users.map((u: any) => (
                  <div key={u.id} className="item-row">
                    <div className="item-info">
                      <div className="item-name">
                        {u.email}
                        <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-reader'}`}>{u.role}</span>
                      </div>
                      <div className="item-meta">Added {new Date(u.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <button className="del-btn" onClick={() => handleRemoveUser(u.email)}>Revoke</button>
                  </div>
                ))
              )}
            </div>
          </>}

          {activeTab === 'entities' && <>
            <div className="section">
              <div className="section-head"><span className="section-title">Add entity</span></div>
              <div className="section-body">
                <div className="section-hint">Add people, products, or vendors so Granth recognizes them in queries.</div>
                <form onSubmit={handleAddEntity}>
                  <div className="grid-2">
                    <div className="field">
                      <label className="field-label">Name</label>
                      <input className="field-input" placeholder="Surabhi" value={newEntity.name}
                        onChange={e => setNewEntity({...newEntity, name: e.target.value})} required/>
                    </div>
                    <div className="field">
                      <label className="field-label">Type</label>
                      <select className="field-select" value={newEntity.type}
                        onChange={e => setNewEntity({...newEntity, type: e.target.value})}>
                        <option value="person">Person</option>
                        <option value="product">Product</option>
                        <option value="vendor">Vendor</option>
                        <option value="client">Client</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Aliases (comma separated)</label>
                    <input className="field-input" placeholder="Surabhi M, Surabhi Mishra"
                      value={newEntity.aliases} onChange={e => setNewEntity({...newEntity, aliases: e.target.value})}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Description</label>
                    <input className="field-input" placeholder="QA Engineer at SFL, reports bugs for LIMS and InventoryCloud"
                      value={newEntity.description} onChange={e => setNewEntity({...newEntity, description: e.target.value})} required/>
                  </div>
                  <button className="btn btn-full" type="submit">Add entity</button>
                </form>
              </div>
            </div>
            <div className="section">
              <div className="section-head">
                <span className="section-title">Known entities</span>
                <span className="section-count">{entities.length}</span>
              </div>
              {entities.length === 0 ? <div className="empty-msg">No entities added yet.</div> : (
                entities.map((e: any) => (
                  <div key={e.id} className="item-row">
                    <div className="item-info">
                      <div className="item-name">
                        {e.name}
                        <span className="badge badge-reader">{e.type}</span>
                      </div>
                      <div className="item-sum">{e.description}</div>
                      {e.aliases?.length > 0 && <div className="item-meta">Also: {e.aliases.join(', ')}</div>}
                    </div>
                    <button className="del-btn" onClick={() => handleDeleteEntity(e.id)}>Remove</button>
                  </div>
                ))
              )}
            </div>
          </>}

          {activeTab === 'analytics' && <>
            <div className="stat-grid">
              {[
                { label: 'Total queries', val: analytics?.total || 0, color: '#1a1a1a' },
                { label: 'Upvoted 👍', val: analytics?.upvotes || 0, color: '#10b981' },
                { label: 'Downvoted 👎', val: analytics?.downvotes || 0, color: '#e53e3e' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-val" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="section-head">
                <span className="section-title">Query log</span>
                <button className="btn btn-sm btn-ghost" onClick={fetchAnalytics}>Refresh</button>
              </div>
              {!analytics?.logs?.length ? <div className="empty-msg">No queries yet.</div> : (
                <div style={{overflowX:'auto'}}>
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Question</th>
                        <th>Answer preview</th>
                        <th style={{textAlign:'center'}}>Vote</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.logs.map((log: any) => (
                        <tr key={log.id} onClick={() => setSelectedLog(log)}>
                          <td style={{color:'#999',fontSize:'12px',whiteSpace:'nowrap'}}>
                            {new Date(log.created_at).toLocaleDateString('en-IN')}<br/>
                            <span style={{color:'#bbb'}}>{new Date(log.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                          </td>
                          <td style={{color:'#666',fontSize:'12px'}}>{log.user_email?.split('@')[0] || '—'}</td>
                          <td><div className="truncate" style={{color:'#1a1a1a',fontWeight:'500'}}>{log.question}</div></td>
                          <td><div className="truncate" style={{color:'#666'}}>{log.answer?.slice(0,80)}</div></td>
                          <td style={{textAlign:'center',fontSize:'16px'}}>{log.score === 1 ? '👍' : log.score === -1 ? '👎' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {analytics?.topQuestions?.length > 0 && (
              <div className="section">
                <div className="section-head"><span className="section-title">Top questions</span></div>
                {analytics.topQuestions.map((q: any, i: number) => (
                  <div key={i} className="item-row">
                    <div className="item-info">
                      <div style={{fontSize:'14px',color:'#1a1a1a'}}>{q.question}</div>
                    </div>
                    <span className="section-count">{q.count}×</span>
                  </div>
                ))}
              </div>
            )}

            {analytics?.failed?.length > 0 && (
              <div className="section" style={{borderColor:'#fecaca'}}>
                <div className="section-head" style={{borderBottomColor:'#fff5f5'}}>
                  <span className="section-title" style={{color:'#e53e3e'}}>Needs better docs</span>
                  <span className="section-count" style={{color:'#e53e3e',background:'#fff5f5'}}>{analytics.failed.length} downvoted</span>
                </div>
                {analytics.failed.map((q: string, i: number) => (
                  <div key={i} className="item-row">
                    <span style={{fontSize:'14px',color:'#e53e3e'}}>✗ {q}</span>
                  </div>
                ))}
              </div>
            )}
          </>}
        </div>

        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <span className="modal-title">Query detail</span>
                <button className="modal-close" onClick={() => setSelectedLog(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <div className="modal-label">Question</div>
                  <div className="modal-q">{selectedLog.question}</div>
                </div>
                <div className="modal-field">
                  <div className="modal-label">Answer</div>
                  <div className="modal-val">{selectedLog.answer}</div>
                </div>
                {selectedLog.sources?.length > 0 && (
                  <div className="modal-field">
                    <div className="modal-label">Sources</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'4px'}}>
                      {selectedLog.sources.map((s: any, i: number) => (
                        <span key={i} style={{fontSize:'12px',color:'#666',background:'#f7f6f2',border:'1px solid #ebe8e2',borderRadius:'6px',padding:'4px 10px'}}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:'flex',gap:'24px'}}>
                  <div className="modal-field">
                    <div className="modal-label">User</div>
                    <div style={{fontSize:'14px',color:'#444'}}>{selectedLog.user_email}</div>
                  </div>
                  <div className="modal-field">
                    <div className="modal-label">Time</div>
                    <div style={{fontSize:'14px',color:'#444'}}>{new Date(selectedLog.created_at).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="modal-field">
                    <div className="modal-label">Feedback</div>
                    <div className="vote-display">{selectedLog.score === 1 ? '👍' : selectedLog.score === -1 ? '👎' : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
