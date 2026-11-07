import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import ts from 'typescript'

function authLane(env={},fixtures=false){
 const calls=[];const source={identity:'existing ADC'};const exports={}
 class GoogleAuth{constructor(options){this.options=options;calls.push(['ADC',options])}async getClient(){return source}}
 class Impersonated{constructor(options){this.options=options;calls.push(['impersonated',options])}}
 const code=ts.transpileModule(readFileSync('lib/sheets-auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 runInNewContext(code,{exports,process:{env},console:{warn(){}},require(name){
  if(name==='server-only')return{}
  if(name==='@/lib/website-fixtures')return{WEBSITE_FIXTURES:fixtures}
  if(name==='googleapis')return{google:{auth:{GoogleAuth}}}
  if(name==='google-auth-library')return{Impersonated}
  if(name==='./gcp-federation')return{federatedCredentials:()=>null}
  throw new Error('Forbidden dependency '+name)
 }})
 return{api:exports,calls,source}
}
test('local Sheets access reuses approved identity with short-lived, Sheets-scoped credentials',async()=>{
 const principal='website@example.iam.gserviceaccount.com'
 const lane=authLane({GOOGLE_SHEETS_IMPERSONATE_SERVICE_ACCOUNT:principal})
 const auth=await lane.api.getSheetsAuth()
 assert.equal(auth.options.sourceClient,lane.source)
 assert.equal(auth.options.targetPrincipal,principal)
 assert.deepEqual([...auth.options.targetScopes],['https://www.googleapis.com/auth/spreadsheets'])
 assert.equal(auth.options.lifetime,3600)
 assert.equal(lane.calls.length,2)
})
test('hosted ADC remains the default and fixtures never construct a credential client',()=>{
 const hosted=authLane();assert.deepEqual([...hosted.api.getSheetsAuth().options.scopes],['https://www.googleapis.com/auth/spreadsheets'])
 const fixture=authLane({GOOGLE_SHEETS_IMPERSONATE_SERVICE_ACCOUNT:'unused'},true)
 assert.throws(()=>fixture.api.getSheetsAuth(),/disabled/);assert.equal(fixture.calls.length,0)
})
