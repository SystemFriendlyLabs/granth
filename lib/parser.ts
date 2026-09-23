import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export async function parseFile(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    const { extractText } = await import('unpdf')
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    return text
  }

  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet')) {
    const workbook = XLSX.read(buffer)
    let text = ''
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      text += `Sheet: ${sheetName}\n`
      text += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
    })
    return text
  }

  if (ext === 'pptx' || mimeType.includes('presentationml')) {
    const { default: officeParser } = await import('officeparser')
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(buffer, (data: string, err: Error) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  if (ext === 'md' || ext === 'txt' || mimeType.includes('text')) {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${ext}`)
}
