const {createClient} = require('@supabase/supabase-js')
const fs = require('fs')
const env = fs.readFileSync('/Users/vikas/Documents/granth/.env.local','utf8')
const get = k => env.match(new RegExp(k+'=(.+)'))[1].trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))
sb.from('chunks').select('content').eq('document_id','fefd8978-2cba-4fad-9bcf-47edf5f31551').then(function(res) {
  var data = res.data
  var lipid = data.find(function(c) { return c.content.toLowerCase().indexOf('lipid') > -1 })
  console.log('Found lipid:', !!lipid)
  if(lipid) console.log(lipid.content.slice(0,400))
  process.exit(0)
})
