import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { redactAnalyticsUrl } from './analytics-url.ts'

function lane({id='G-TEST123',fixtures='0',dnt,privacy=false,path='/app?email=private#secret'}={}) {
 const exports={},location=new URL('https://www.makanofficial.com'+path)
 const win={location,navigator:{doNotTrack:dnt,globalPrivacyControl:privacy}}
 Object.defineProperty(win,'localStorage',{get(){throw new Error('Analytics must not read browser storage')}})
 const code=ts.transpileModule(readFileSync('lib/website-analytics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 runInNewContext(code,{exports,window:win,process:{env:{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:id,NEXT_PUBLIC_MAKAN_WEBSITE_FIXTURES:fixtures}},require(name){
  assert.equal(name,'./analytics-url');return {redactAnalyticsUrl}
 }})
 return {api:exports,win,commands:()=>Array.from(win.dataLayer??[],args=>Array.from(args))}
}

test('unconfigured, fixture, browser privacy and protected-route visits cannot start measurement',()=>{
 for(const options of [{id:''},{id:'invalid'},{fixtures:'1'},{dnt:'1'},{privacy:true},
  ...['/invite/secret','/id/invite/secret','/claim/secret','/id/claim/secret','/taste/person/secret','/id/taste/person/secret','/u/person','/p/place'].map(path=>({path}))]){
  const run=lane(options);assert.equal(run.api.startWebsiteAnalytics(),false,JSON.stringify(options))
  run.api.track('App Store CTA Clicked');assert.equal(run.commands().length,0)
 }
})

test('storage is denied before configuration, automatic pageviews are off, initialization is shared',()=>{
 const run=lane();assert.equal(run.api.startWebsiteAnalytics(),true)
 const commands=run.commands()
 assert.equal(commands[0][0],'consent');assert.equal(commands[0][1],'default')
 assert.deepEqual(Object.values(commands[0][2]),['denied','denied','denied','denied'])
 const config=commands.find(command=>command[0]==='config')[2]
 assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false)
 assert.equal(config.allow_ad_personalization_signals,false)
 assert.equal(config.page_location,'https://www.makanofficial.com/app');assert.equal(config.page_referrer,'')
 run.api.startWebsiteAnalytics();assert.equal(run.commands().length,commands.length)
})

test('only named aggregate events and bounded nonpersonal fields reach the tag',()=>{
 const run=lane();run.api.startWebsiteAnalytics();const before=run.commands().length
 run.api.track('App Store CTA Clicked',{locale:'id',location:'homepage',email:'private@example.com',url:'https://private',step:Infinity,section:'person@example.com'})
 const command=run.commands().at(-1)
 assert.equal(command[1],'app_store_cta_clicked')
 assert.equal(command[2].locale,'id');assert.equal(command[2].location,'homepage')
 assert.equal(command[2].page_location,'https://www.makanofficial.com/app')
 for(const key of ['email','url','step','section'])assert.equal(key in command[2],false)
 run.api.track('arbitrary user text',{locale:'en'});assert.equal(run.commands().length,before+1)
 run.win.location=new URL('https://www.makanofficial.com/id/claim/secret')
  assert.equal(run.api.startWebsiteAnalytics(),false)
  assert.equal(run.win['ga-disable-G-TEST123'],true)
 run.api.track('Claim Link Get App Clicked');assert.equal(run.commands().length,before+1)
})
