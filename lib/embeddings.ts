let pipeline: any = null

async function getEmbedder() {
  if (!pipeline) {
    const { pipeline: createPipeline } = await import('@xenova/transformers')
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return pipeline
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeder = await getEmbedder()
  const output = await embeder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
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
