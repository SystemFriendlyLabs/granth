export function extractGoogleDocId(url: string): { type: string; id: string } | null {
  // Google Docs
  const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)
  if (docMatch) return { type: 'doc', id: docMatch[1] }

  // Google Sheets
  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (sheetMatch) return { type: 'sheet', id: sheetMatch[1] }

  // Google Slides
  const slideMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/)
  if (slideMatch) return { type: 'slide', id: slideMatch[1] }

  // Google Drive file
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (driveMatch) return { type: 'drive', id: driveMatch[1] }

  return null
}

export async function fetchGoogleDocContent(url: string): Promise<{ text: string; title: string }> {
  const parsed = extractGoogleDocId(url)
  if (!parsed) throw new Error('Invalid Google Doc URL')

  const { type, id } = parsed
  let exportUrl = ''
  let title = 'Google Document'

  if (type === 'doc') {
    exportUrl = `https://docs.google.com/document/d/${id}/export?format=txt`
    title = 'Google Doc'
  } else if (type === 'sheet') {
    exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
    title = 'Google Sheet'
  } else if (type === 'slide') {
    exportUrl = `https://docs.google.com/presentation/d/${id}/export?format=txt`
    title = 'Google Slides'
  } else if (type === 'drive') {
    exportUrl = `https://drive.google.com/uc?export=download&id=${id}`
    title = 'Google Drive File'
  }

  const res = await fetch(exportUrl)
  if (!res.ok) throw new Error('Could not fetch document. Make sure sharing is set to "Anyone with the link can view".')
  
  const text = await res.text()
  return { text, title }
}
