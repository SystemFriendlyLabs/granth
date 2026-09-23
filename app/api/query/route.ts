import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 30

function isCountingQuery(question: string): boolean {
  const countWords = ['how many', 'count', 'total', 'number of', 'how much', 'tally', 'sum']
  const q = question.toLowerCase()
  return countWords.some(w => q.includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const embedding = await generateEmbedding(question)
    const counting = isCountingQuery(question)

    // Step 1: find most relevant chunks
    const { data: topChunks, error } = await supabaseAdmin.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: counting ? 20 : 8
    })

    if (error) throw error
    if (!topChunks || topChunks.length === 0) {
      return NextResponse.json({
        answer: 'This information is not in the Granth knowledge base. Ask your admin to add the relevant document.',
        sources: []
      })
    }

    let chunks = topChunks

    // Step 2: for counting queries, fetch ALL chunks from the matched documents
    if (counting) {
      const docIds = [...new Set(topChunks.map((c: any) => c.document_id))]
      const { data: allChunks } = await supabaseAdmin
        .from('chunks')
        .select('id, document_id, content')
        .in('document_id', docIds)

      if (allChunks && allChunks.length > 0) {
        // add document name from topChunks map
        const nameMap = Object.fromEntries(topChunks.map((c: any) => [c.document_id, c.document_name]))
        chunks = allChunks.map((c: any) => ({ ...c, document_name: nameMap[c.document_id] }))
      }
    }

    const context = chunks.map((c: any) => `[From: ${c.document_name}]\n${c.content}`).join("\n\n").slice(0, 12000)

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

STRICT RULES — follow without exception:

SCOPE:
- Answer ONLY from the documents provided in the context below
- If the answer is not in the context, say exactly: "This information is not in the Granth knowledge base. Ask your admin to add the relevant document."
- Never answer from general knowledge, training data, or assumptions
- Never make up information, estimates, or guesses

ALLOWED:
- Answer questions about SFL products, policies, bugs, features, people, processes, pricing
- Briefly explain a technical term if needed to make an answer understandable
- Summarize, compare, or list information from the documents
- Count, tally, or aggregate data from the documents

NOT ALLOWED:
- Writing or explaining code
- Philosophy, opinions, general advice
- Anything not directly supported by the provided context
- Small talk or casual conversation
- Answering ambiguous questions — ask for clarification instead

FORMATTING RULES:
- Structured data, comparisons, multiple items → markdown TABLE
- Steps or sequences → NUMBERED LIST
- Simple fact → plain text
- Always cite which document the answer came from

If the question is ambiguous, ask one specific clarifying question before answering.`
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
