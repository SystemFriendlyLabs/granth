import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 45

function isCountingQuery(q: string): boolean {
  return ['how many','count','total','number of','how much','tally','sum','count of'].some(w => q.toLowerCase().includes(w))
}

function isDiscoveryQuery(q: string): boolean {
  return ['where','which document','which doc','find','locate','where can i','what do we have'].some(w => q.toLowerCase().includes(w))
}

function isMultiDocQuery(q: string): boolean {
  return ['compare','vs','versus','difference','both','across','all products'].some(w => q.toLowerCase().includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const embedding = await generateEmbedding(question)
    const counting = isCountingQuery(question)
    const discovery = isDiscoveryQuery(question)
    const multiDoc = isMultiDocQuery(question)

    const { data: topChunks, error } = await supabaseAdmin.rpc('hybrid_search', {
      query_text: question,
      query_embedding: embedding,
      match_count: 20
    })

    if (error) throw error

    if (!topChunks || topChunks.length === 0) {
      return NextResponse.json({
        answer: 'This information is not in the Granth knowledge base. Ask your admin to add the relevant document.',
        sources: []
      })
    }

    const topDocIds = [...new Set(topChunks.map((c: any) => c.document_id))] as string[]
    const nameMap = Object.fromEntries(topChunks.map((c: any) => [c.document_id, c.document_name]))

    let chunks: any[]

    const specificTestTerms = ['lipid','cbc','kft','lft','urine routine','thyroid','vitamin','serology','haematology','biochemistry','cardiology','oncology','immunology','microbiology','endocrinology','liver function','kidney function','blood count','glucose','bilirubin']
    const isSpecificTest = specificTestTerms.some(w => question.toLowerCase().includes(w))
    const isTotalCount = counting && !isSpecificTest

    if (isTotalCount || multiDoc) {
      const { data: allChunks } = await supabaseAdmin
        .from('chunks')
        .select('id, document_id, content')
        .in('document_id', topDocIds)
        .order('id')

      const relevanceOrder = Object.fromEntries(topDocIds.map((id, i) => [id, i]))
      chunks = (allChunks || [])
        .map((c: any) => ({ ...c, document_name: nameMap[c.document_id] }))
        .sort((a: any, b: any) => {
          if (a.content.length < 1000 && b.content.length >= 1000) return -1
          if (b.content.length < 1000 && a.content.length >= 1000) return 1
          return (relevanceOrder[a.document_id] || 99) - (relevanceOrder[b.document_id] || 99)
        })
    } else {
      const docChunkMap = new Map<string, any[]>()
      for (const chunk of topChunks) {
        if (!docChunkMap.has(chunk.document_id)) docChunkMap.set(chunk.document_id, [])
        const arr = docChunkMap.get(chunk.document_id)!
        if (arr.length < 4) arr.push(chunk)
      }
      chunks = Array.from(docChunkMap.values()).flat()
    }

    const { data: entities } = await supabaseAdmin.from('entities').select('name, aliases, type, description')
    let entityContext = ''
    if (entities?.length) {
      const q = question.toLowerCase()
      const matched = entities.filter((e: any) =>
        [e.name, ...(e.aliases || [])].some((n: string) => q.includes(n.toLowerCase()))
      )
      if (matched.length > 0) {
        entityContext = '\n\nKNOWN ENTITIES:\n' + matched.map((e: any) =>
          `- ${e.name} (${e.type}): ${e.description}`
        ).join('\n')
      }
    }

    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('id, name, source_url, summary')
      .in('id', topDocIds)

    const docMeta = Object.fromEntries((docs || []).map((d: any) => [d.id, d]))

    const docGroups = new Map<string, { name: string; summary: string; chunks: string[] }>()
    for (const chunk of chunks) {
      if (!docGroups.has(chunk.document_id)) {
        const meta = docMeta[chunk.document_id] || {}
        docGroups.set(chunk.document_id, {
          name: chunk.document_name,
          summary: meta.summary || '',
          chunks: []
        })
      }
      docGroups.get(chunk.document_id)!.chunks.push(chunk.content)
    }

    const context = Array.from(docGroups.values())
      .map(doc => {
        const summaryLine = doc.summary ? `DOCUMENT SUMMARY: ${doc.summary}\n` : ''
        return `=== SOURCE: ${doc.name} ===\n${summaryLine}${doc.chunks.join('\n')}`
      })
      .join('\n\n')
      .slice(0, 14000)

    const sources = [...new Map(chunks.map((c: any) => [c.document_id, {
      name: c.document_name,
      url: docMeta[c.document_id]?.source_url || null
    }])).values()]

    const systemPrompt = discovery
      ? `You are GRANTH, the internal knowledge assistant for SystemFriendly Labs (SFL).
The user wants to DISCOVER where information lives. List every document where relevant info was found.
For each: **Found in [Document Name]:** brief summary. Then give a collated summary at the end.`
      : `You are GRANTH, the internal knowledge assistant for SystemFriendly Labs (SFL).

STRICT RULES:
- Answer ONLY from the documents provided
- If not found: "This information is not in the Granth knowledge base."
- Never make up data or estimates
- For counting: use DOCUMENT SUMMARY or TOTAL rows
- Label which info came from which document

NOT ALLOWED: code, philosophy, opinions, small talk

FORMATTING:
- Data/comparisons/lists → markdown TABLE
- Steps → NUMBERED LIST
- Simple fact → plain text
- Always cite source document(s)`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: `Context:\n${context}${entityContext}\n\nQuestion: ${question}` }
        ],
        max_tokens: 2000
      })
    })

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || 'No answer generated.'

    // Update session last query
    try {
      await supabaseAdmin.from('sessions').update({
        last_query: question,
        last_seen: new Date().toISOString()
      }).eq('email', req.headers.get('x-user-email') || '')
    } catch {}

    // Log query
    const chunkIds = chunks.map((c: any) => c.id)
    const { data: logEntry } = await supabaseAdmin
      .from('query_logs')
      .insert({
        question,
        answer,
        sources: sources,
        chunk_ids: chunkIds,
        user_email: req.headers.get('x-user-email') || 'unknown'
      })
      .select('id')
      .single()

    return NextResponse.json({ answer, sources, query_log_id: logEntry?.id })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
