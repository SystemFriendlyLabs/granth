import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 30

function isCountingQuery(q: string): boolean {
  return ['how many','count','total','number of','how much','tally','sum'].some(w => q.toLowerCase().includes(w))
}

function isMultiDocQuery(q: string): boolean {
  const multiWords = ['compare','vs','versus','difference between','both','across','all products','lims and inventory','inventory and lims']
  return multiWords.some(w => q.toLowerCase().includes(w))
}

async function extractEntities(question: string): Promise<string> {
  const { data: entities } = await supabaseAdmin
    .from('entities')
    .select('name, aliases, type, description')

  if (!entities || entities.length === 0) return ''

  const q = question.toLowerCase()
  const matched = entities.filter((e: any) => {
    const names = [e.name, ...(e.aliases || [])].map((n: string) => n.toLowerCase())
    return names.some(n => q.includes(n))
  })

  if (matched.length === 0) return ''

  return '\n\nKNOWN ENTITIES REFERENCED:\n' + matched.map((e: any) =>
    `- ${e.name} (${e.type}): ${e.description}`
  ).join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const embedding = await generateEmbedding(question)
    const counting = isCountingQuery(question)
    const multiDoc = isMultiDocQuery(question)

    const matchCount = counting || multiDoc ? 20 : 8

    const { data: topChunks, error } = await supabaseAdmin.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: matchCount
    })

    if (error) throw error

    if (!topChunks || topChunks.length === 0) {
      return NextResponse.json({
        answer: 'This information is not in the Granth knowledge base. Ask your admin to add the relevant document.',
        sources: []
      })
    }

    let chunks = topChunks

    // For counting or multi-doc queries — fetch ALL chunks from matched docs
    if (counting || multiDoc) {
      const docIds = [...new Set(topChunks.map((c: any) => c.document_id))]
      const { data: allChunks } = await supabaseAdmin
        .from('chunks')
        .select('id, document_id, content')
        .in('document_id', docIds)

      if (allChunks && allChunks.length > 0) {
        const nameMap = Object.fromEntries(topChunks.map((c: any) => [c.document_id, c.document_name]))
        chunks = allChunks.map((c: any) => ({ ...c, document_name: nameMap[c.document_id] }))
      }
    }

    // Extract entity context
    const entityContext = await extractEntities(question)

    const context = chunks
      .map((c: any) => `[From: ${c.document_name}]\n${c.content}`)
      .join('\n\n')
      .slice(0, 14000)

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are GRANTH, the internal knowledge assistant for SystemFriendly Labs (SFL).

STRICT RULES:
- Answer ONLY from the documents and entity context provided below
- If not found, say: "This information is not in the Granth knowledge base."
- Never use general knowledge or make up information
- For comparisons across documents, analyze all provided document chunks together
- For named people or entities, use the KNOWN ENTITIES section to enrich your answer

NOT ALLOWED:
- Writing code, philosophy, opinions, general advice
- Small talk — redirect to document queries
- Answering ambiguous questions — ask one clarifying question

FORMATTING:
- Data, comparisons, multiple items → markdown TABLE
- Steps → NUMBERED LIST  
- Simple fact → plain text
- Always cite source document(s)
- For multi-document comparisons, clearly label which data came from which document`
          },
          ...history,
          {
            role: 'user',
            content: `Context:\n${context}${entityContext}\n\nQuestion: ${question}`
          }
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
