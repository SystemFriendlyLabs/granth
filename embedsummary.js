const {createClient} = require('@supabase/supabase-js')
const fs = require('fs')
const env = fs.readFileSync('.env.local','utf8')
const get = k => env.match(new RegExp(k+'=(.+)'))[1].trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

async function main() {
  // Get chunks with no embedding
  const {data: chunks} = await sb
    .from('chunks')
    .select('id, content')
    .is('embedding', null)
  
  console.log('Chunks needing embedding:', chunks?.length)
  
  for (const chunk of chunks || []) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+get('OPENAI_API_KEY')},
      body: JSON.stringify({input: chunk.content.slice(0,8000), model: 'text-embedding-3-small'})
    })
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (!embedding) { console.log('Failed:', chunk.id); continue }
    
    await sb.from('chunks').update({embedding}).eq('id', chunk.id)
    console.log('Embedded chunk:', chunk.id)
  }
  console.log('Done')
  process.exit(0)
}
main()
