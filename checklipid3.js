const {createClient} = require('@supabase/supabase-js')
const fs = require('fs')
const env = fs.readFileSync('.env.local','utf8')
const get = k => env.match(new RegExp(k+'=(.+)'))[1].trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

async function main() {
  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':'Bearer '+get('OPENAI_API_KEY')},
    body: JSON.stringify({input: 'how many parameters in lipid profile test', model: 'text-embedding-3-small'})
  })
  const embData = await embRes.json()
  const embedding = embData.data[0].embedding

  const {data, error} = await sb.rpc('hybrid_search', {
    query_text: 'how many parameters in lipid profile test',
    query_embedding: embedding,
    match_count: 20
  })
  
  console.log('Error:', error)
  console.log('Results:', data?.length)
  data?.forEach(c => {
    if(c.content.toLowerCase().includes('lipid')) {
      console.log('LIPID FOUND in chunk, doc:', c.document_name)
      console.log(c.content.slice(0,200))
    }
  })
  process.exit(0)
}
main()
