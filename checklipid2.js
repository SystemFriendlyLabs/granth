const {createClient} = require('@supabase/supabase-js')
const fs = require('fs')
const env = fs.readFileSync('.env.local','utf8')
const get = k => env.match(new RegExp(k+'=(.+)'))[1].trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))
sb.from('chunks').select('id,content').eq('document_id','fefd8978-2cba-4fad-9bcf-47edf5f31551').then(function(res) {
  res.data.forEach(function(c) {
    if(c.content.toLowerCase().includes('lipid profile')) {
      console.log('CHUNK ID:', c.id)
      console.log(c.content.slice(0,500))
      console.log('---')
    }
  })
  process.exit(0)
})
