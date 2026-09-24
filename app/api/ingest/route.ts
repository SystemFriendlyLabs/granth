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
    const context = formData.get('context') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type
    const fileName = file.name

    // Upload to Supabase Storage
    const storageKey = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storageKey, buffer, { contentType: mimeType, upsert: false })

    const fileUrl = storageError ? null : supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(storageKey).data.publicUrl

    // Parse text
    let text = ''
    try {
      text = await parseFile(buffer, mimeType, fileName)
    } catch (e) {
      if (mimeType.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        text = await describeImage(base64, mimeType)
      } else {
        throw e
      }
    }

    // Generate summary
    const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Summarize the following document in 3 sentences.' },
          { role: 'user', content: text.slice(0, 3000) }
        ],
        max_tokens: 200
      })
    })
    const summaryData = await summaryRes.json()
    const autoSummary = summaryData.choices?.[0]?.message?.content || ''
    const summary = context ? `${context}\n\n${autoSummary}` : autoSummary

    // Save document
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        name: fileName,
        type: mimeType,
        source_url: fileUrl,
        summary,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        uploaded_by: uploadedBy
      })
      .select()
      .single()

    if (docError) throw docError

    // Chunk and embed — prepend context to first chunk
    const chunks = chunkText(text)
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = (i === 0 && context)
        ? `Document context: ${context}\n\n${chunks[i]}`
        : chunks[i]
      const embedding = await generateEmbedding(chunkContent)
      await supabaseAdmin.from('chunks').insert({
        document_id: doc.id,
        content: chunkContent,
        embedding
      })
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
