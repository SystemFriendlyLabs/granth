import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, count, assignTo, created_by } = await req.json()

    // Search knowledge base for relevant content
    const embedding = await generateEmbedding(topic)
    const { data: chunks } = await supabaseAdmin.rpc('hybrid_search', {
      query_text: topic,
      query_embedding: embedding,
      match_count: 15
    })

    if (!chunks?.length) {
      return NextResponse.json({ error: 'No relevant content found in knowledge base for this topic.' }, { status: 404 })
    }

    const context = chunks.map((c: any) => `[${c.document_name}]\n${c.content}`).join('\n\n').slice(0, 10000)

    const prompt = `You are a quiz generator for an internal knowledge base. Generate exactly ${count} multiple choice questions about "${topic}" based ONLY on the following content from our knowledge base.

Difficulty: ${difficulty}

CONTENT:
${context}

Generate a JSON array of ${count} questions. Each question must have:
- question: string
- options: array of exactly 4 strings (the answer choices)
- correct_answer: string (must exactly match one of the options)
- explanation: string (brief explanation of why this is correct, referencing the source)

Rules:
- Only use facts from the provided content
- Make questions specific and testable
- Vary the question types (what, how many, which, true/false style)
- For ${difficulty} difficulty: ${difficulty === 'easy' ? 'focus on basic facts and definitions' : difficulty === 'medium' ? 'include application and understanding questions' : 'include analysis and complex reasoning questions'}

Return ONLY valid JSON array, no markdown, no explanation.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    })

    const data = await res.json()
    let rawContent = data.choices?.[0]?.message?.content || '[]'
    
    let questions
    try {
      const parsed = JSON.parse(rawContent)
      questions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.quiz || Object.values(parsed)[0]
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Create quiz
    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: `${topic} Quiz`,
        description: `Auto-generated ${difficulty} quiz on ${topic}`,
        created_by
      })
      .select().single()

    if (error) throw error

    await supabaseAdmin.from('quiz_questions').insert(
      questions.map((q: any, i: number) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        order_num: i
      }))
    )

    if (assignTo?.length) {
      await supabaseAdmin.from('quiz_assignments').insert(
        assignTo.map((email: string) => ({ quiz_id: quiz.id, user_email: email }))
      )
    }

    return NextResponse.json({ success: true, quiz, questions })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
