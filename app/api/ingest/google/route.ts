import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchGoogleDocContent } from '@/lib/google'
import { generateEmbedding, chunkText } from '@/lib/embeddings'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { url, uploadedBy } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const { text, title } = await fetchGoogleDocContent(url)

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Document appears empty or could not be read.' }, { status: 400 })
    }

    const summaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'Summarize the following document in 3 sentences.' },
          { role: 'user', content: text.slice(0, 3000) }
        ],
        max_tokens: 200
      })
    })
    const summaryData = await summaryRes.json()
    const summary = summaryData.choices?.[0]?.message?.content || ''

    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        name: title,
        type: 'google',
        source_url: url,
        summary,
        tags: ['google'],
        uploaded_by: uploadedBy
      })
      .select()
      .single()

    if (docError) throw docError

    const chunks = chunkText(text)
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      await supabaseAdmin.from('chunks').insert({
        document_id: doc.id,
        content: chunk,
        embedding
      })
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
