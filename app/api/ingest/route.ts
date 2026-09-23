import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseFile } from '@/lib/parser'
import { generateEmbedding, chunkText } from '@/lib/embeddings'
import { describeImage } from '@/lib/vision'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadedBy = formData.get('uploadedBy') as string
    const tags = formData.get('tags') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type
    const fileName = file.name

    // Parse text from file
    let text = ''
    try {
      text = await parseFile(buffer, mimeType, fileName)
    } catch (e) {
      // If image file, use vision
      if (mimeType.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        text = await describeImage(base64, mimeType)
      } else {
        throw e
      }
    }

    // Generate summary using Groq
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

    // Save document to Supabase
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        name: fileName,
        type: mimeType,
        summary,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        uploaded_by: uploadedBy
      })
      .select()
      .single()

    if (docError) throw docError

    // Chunk and embed
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
