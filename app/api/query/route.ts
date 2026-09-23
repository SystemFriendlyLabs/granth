import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 45

function isCountingQuery(q: string): boolean {
  return ['how many','count','total','number of','how much','tally','sum'].some(w => q.toLowerCase().includes(w))
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

    // PASS 1 — broad search, top 20 chunks across all docs
    const { data: topChunks, error } = await supabaseAdmin.rpc('match_chunks', {
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

    // PASS 2 — group by document, pick best 3 chunks per doc
    const docChunkMap = new Map<string, any[]>()
    for (const chunk of topChunks) {
      if (!docChunkMap.has(chunk.document_id)) docChunkMap.set(chunk.document_id, [])
      const arr = docChunkMap.get(chunk.document_id)!
      if (arr.length < 3) arr.push(chunk)
    }

    let chunks = Array.from(docChunkMap.values()).flat()

    // For counting or multi-doc — fetch ALL chunks from matched docs
    if (counting || multiDoc) {
      const docIds = [...docChunkMap.keys()]
      const { data: allChunks } = await supabaseAdmin
        .from('chunks')
        .select('id, document_id, content')
        .in('document_id', docIds)

      if (allChunks && allChunks.length > 0) {
        const nameMap = Object.fromEntries(topChunks.map((c: any) => [c.document_id, c.document_name]))
        chunks = allChunks.map((c: any) => ({ ...c, document_name: nameMap[c.document_id] }))
      }
    }

    // Entity context
    const { data: entities } = await supabaseAdmin.from('entities').select('name, aliases, type, description')
    let entityContext = ''
    if (entities && entities.length > 0) {
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

    // Build context grouped by document
    const docGroups = new Map<string, { name: string; chunks: string[] }>()
    for (const chunk of chunks) {
      if (!docGroups.has(chunk.document_id)) {
        docGroups.set(chunk.document_id, { name: chunk.document_name, chunks: [] })
      }
      docGroups.get(chunk.document_id)!.chunks.push(chunk.content)
    }

    const context = Array.from(docGroups.values())
      .map(doc => `=== SOURCE: ${doc.name} ===\n${doc.chunks.join('\n')}`)
      .join('\n\n')
      .slice(0, 14000)

    // Sources
    const docIds = [...new Set(chunks.map((c: any) => c.document_id))]
    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('id, name, source_url')
      .in('id', docIds)

    const docMap = Object.fromEntries((docs || []).map((d: any) => [d.id, d]))
    const sources = [...new Map(chunks.map((c: any) => [c.document_id, {
      name: c.document_name,
      url: docMap[c.document_id]?.source_url || null
    }])).values()]

    const systemPrompt = discovery
      ? `You are GRANTH, the internal knowledge assistant for SystemFriendly Labs (SFL).

The user wants to DISCOVER where information lives. Your job:
- List every document where relevant info was found
- For each document, summarize what it contains about the topic
- Use this format:

**Found in [Document Name]:**
Brief summary of what's there. Key points: X, Y, Z.

**Found in [Another Document]:**
Brief summary...

Then give a collated summary at the end.
Always cite document names clearly.`
      : `You are GRANTH, the internal knowledge assistant for SystemFriendly Labs (SFL).

STRICT RULES:
- Answer ONLY from the documents provided — never from general knowledge
- If not found: "This information is not in the Granth knowledge base."
- Never make up data, estimates, or guesses
- For multi-document answers, clearly label which info came from which document

NOT ALLOWED: code, philosophy, opinions, small talk, general advice

FORMATTING:
- Data/comparisons/lists → markdown TABLE
- Steps → NUMBERED LIST
- Simple fact → plain text
- Multi-source answer → group by source with clear labels
- Always cite which document(s) the answer came from`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
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

    return NextResponse.json({ answer, sources })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
