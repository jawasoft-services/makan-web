import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

test('protected links in both languages keep cache and referrer protections',async()=>{
 const exports={}
 const code=ts.transpileModule(readFileSync('next.config.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 runInNewContext(code,{exports,process:{env:{NODE_ENV:'production'},cwd:()=>process.cwd()},require(name){
  assert.equal(name,'next-intl/plugin');return{default:()=>config=>config}
 }})
 const headers=await exports.default.headers()
 for(const locale of ['', '/id'])for(const kind of ['claim','invite','taste']){
  const route=headers.find(rule=>rule.source===`${locale}/${kind}/:path*`)
  assert.ok(route,`${locale}/${kind}`)
  assert.equal(route.headers.find(header=>header.key==='Referrer-Policy').value,'no-referrer')
  assert.equal(route.headers.find(header=>header.key==='Cache-Control').value,'private, no-store')
 }
})

test('Firebase source upload excludes local credentials and fixture output',()=>{
 const {apphosting:[backend]}=JSON.parse(readFileSync('firebase.json','utf8'))
 for(const item of ['.env*','.next','.next-fixtures','.git','node_modules'])assert(backend.ignore.includes(item),item)
 const config=readFileSync('apphosting.yaml','utf8')
 assert.doesNotMatch(config,/^\s*- variable: (?:GOOGLE_SHEETS_IMPERSONATE_SERVICE_ACCOUNT|NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)$/m)
 assert.match(config,/GOOGLE_SHEET_ID/)
})
