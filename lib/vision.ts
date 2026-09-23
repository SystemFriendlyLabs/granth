export async function describeImage(imageBase64: string, mimeType: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            },
            {
              text: 'Describe this image in detail. If it contains text, extract all text. If it contains a chart or graph, describe the data and trends shown. If it is a screenshot, describe what is shown.'
            }
          ]
        }]
      })
    }
  )
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
