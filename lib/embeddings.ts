export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text.slice(0, 8000),
      model: 'text-embedding-3-small'
    })
  })
  const data = await response.json()
  if (!data.data?.[0]?.embedding) {
    console.error('OpenAI embedding error:', JSON.stringify(data))
    throw new Error(`Embedding failed: ${data.error?.message || JSON.stringify(data)}`)
  }
  return data.data[0].embedding
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(' ')
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}
