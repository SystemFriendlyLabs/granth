import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const embedding = await generateEmbedding(question)

    const { data: chunks, error } = await supabaseAdmin.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: 5
    })

    if (error) throw error

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ answer: 'No relevant information found in the knowledge base.', sources: [] })
    }

    const context = chunks.map((c: any) => `[From: ${c.document_name}]\n${c.content}`).join('\n\n')

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
            content: `You are GRANTH, the internal knowledge AI for SystemFriendly Labs (SFL).

FORMATTING RULES — follow strictly:
- Structured data, comparisons, multiple items with attributes → markdown TABLE
- Steps or sequences → NUMBERED LIST  
- Simple fact or short answer → plain text
- Code → code block
- Be concise and precise
- Always cite which document the info came from

Answer only from the provided context. If not found, say so clearly.`
          },
          ...history,
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
        ],
        max_tokens: 1500
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
