export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
    }
  )
  const data = await response.json()
  if (Array.isArray(data[0])) return data[0]
  return data
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
