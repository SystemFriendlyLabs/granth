import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()

    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    // Embed the question
    const embedding = await generateEmbedding(question)

    // Find relevant chunks
    const { data: chunks, error } = await supabaseAdmin.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: 5
    })

    if (error) throw error

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        answer: 'I could not find any relevant information in the knowledge base. Please make sure the relevant documents have been uploaded.',
        sources: []
      })
    }

    // Build context
    const context = chunks.map((c: any) => `[From: ${c.document_name}]\n${c.content}`).join('\n\n')
    const sources = [...new Set(chunks.map((c: any) => c.document_name))]

    // Call Groq
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
            content: `You are Granth, the internal knowledge assistant for SystemFriendly Labs (SFL). 
Answer questions based only on the provided context. 
If the answer is not in the context, say so clearly.
Always be concise, accurate, and helpful.
Mention which document the information came from.`
          },
          ...history,
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 1000
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
