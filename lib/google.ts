export function extractGoogleDocId(url: string): { type: string; id: string; gid?: string } | null {
  const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)
  if (docMatch) return { type: 'doc', id: docMatch[1] }

  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (sheetMatch) {
    const gidMatch = url.match(/gid=(\d+)/)
    return { type: 'sheet', id: sheetMatch[1], gid: gidMatch?.[1] }
  }

  const slideMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/)
  if (slideMatch) return { type: 'slide', id: slideMatch[1] }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (driveMatch) return { type: 'drive', id: driveMatch[1] }

  return null
}

async function fetchAllSheetTabs(id: string): Promise<{ gid: string; name: string }[]> {
  try {
    // Use the sheets JSON feed (works for public sheets)
    const res = await fetch(
      `https://spreadsheets.google.com/feeds/worksheets/${id}/public/basic?alt=json`
    )
    if (!res.ok) return []
    const json = await res.json()
    const entries = json.feed?.entry || []
    return entries.map((e: any) => {
      const link = e.link?.find((l: any) => l.rel === 'self')?.href || ''
      const gidMatch = link.match(/\/(\d+)$/) || e.id?.$t?.match(/\/(\d+)$/)
      return {
        name: e.title?.$t || 'Sheet',
        gid: gidMatch?.[1] || '0'
      }
    })
  } catch {
    return []
  }
}

export async function fetchGoogleDocContent(url: string): Promise<{ text: string; title: string }> {
  const parsed = extractGoogleDocId(url)
  if (!parsed) throw new Error('Invalid Google Doc URL')

  const { type, id, gid } = parsed

  if (type === 'doc') {
    const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`)
    if (!res.ok) throw new Error('Could not fetch document. Make sure sharing is set to "Anyone with the link can view".')
    const text = await res.text()
    const title = text.split('\n')[0]?.trim().slice(0, 80) || 'Google Doc'
    return { text, title }
  }

  if (type === 'sheet') {
    if (gid) {
      // Fetch specific tab only
      const csvRes = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`)
      if (!csvRes.ok) throw new Error('Could not fetch sheet. Make sure sharing is set to "Anyone with the link can view".')
      const csv = await csvRes.text()
      const firstRow = csv.split('\n')[0] || ''
      const title = firstRow.split(',')[0]?.replace(/"/g, '').trim().slice(0, 80) || 'Google Sheet'
      return { text: csv, title }
    }

    // Fetch all tabs
    const tabs = await fetchAllSheetTabs(id)
    console.log('Found tabs:', tabs)

    if (tabs.length === 0) {
      const csvRes = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`)
      if (!csvRes.ok) throw new Error('Could not fetch sheet.')
      const csv = await csvRes.text()
      return { text: csv, title: 'Google Sheet' }
    }

    let fullText = ''
    const docTitle = tabs[0]?.name || 'Google Sheet'

    for (const tab of tabs) {
      try {
        const csvRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${tab.gid}`
        )
        if (!csvRes.ok) continue
        const csv = await csvRes.text()
        if (csv.trim()) {
          fullText += `\n\n=== Sheet: ${tab.name} ===\n${csv}`
        }
      } catch {
        continue
      }
    }

    return { text: fullText || 'Empty spreadsheet', title: docTitle }
  }

  if (type === 'slide') {
    const res = await fetch(`https://docs.google.com/presentation/d/${id}/export?format=txt`)
    if (!res.ok) throw new Error('Could not fetch slides.')
    const text = await res.text()
    const title = text.split('\n')[0]?.trim().slice(0, 80) || 'Google Slides'
    return { text, title }
  }

  if (type === 'drive') {
    const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`)
    if (!res.ok) throw new Error('Could not fetch file.')
    const text = await res.text()
    return { text, title: 'Google Drive File' }
  }

  throw new Error('Unsupported Google URL type')
}
