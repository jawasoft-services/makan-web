import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Exercise the actual client handlers with controlled responses, without a browser or network.
function form({ siteKey = '', responses = [200], component = 'contact' } = {}) {
  const hooks=[]; let cursor=0, effects=[], focused='', reset=0, tree
  const requests=[]
  const react={
    useState(initial) { const i=cursor++; if (!(i in hooks)) hooks[i]=initial; return [hooks[i], value => { hooks[i]=typeof value==='function'?value(hooks[i]):value }] },
    useRef(initial) { const i=cursor++; if (!(i in hooks)) hooks[i]={current:initial}; return hooks[i] },
    useEffect(fn) { effects.push(fn) },
  }
  const jsx=(type,props)=>({type,props})
  const exports={}
  const source=ts.transpileModule(readFileSync(component === 'partner' ? 'app/[locale]/partner/PartnerForm.tsx' : component === 'android' ? 'components/AndroidWaitlist.tsx' : 'app/[locale]/contact/ContactForm.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText
  runInNewContext(source,{exports,
    FormData:class { get(key) { return key==='website'?'':'' } },
    fetch:async(url,options)=>{requests.push({url,options});const status=responses.shift()??200;return {ok:status===200,json:async()=>status===200?{success:true}:{error:'Fixture delivery failed'}}},
    require(id){
      if(id==='@vercel/analytics') return {track(){}}
      if(id==='@/lib/api-validation') return {FIELD_MAX:{name:100,email:254,restaurant:200,city:120,message:2000}}
      if(id==='react') return react
      if(id==='react/jsx-runtime') return {jsx,jsxs:jsx}
      if(id==='next-intl') return {useLocale:()=> 'id',useTranslations:namespace=>key=>`${namespace}.${key}`}
      if(id==='next/link') return {default:'a'}
      if(id==='next/image') return {default:'img'}
      if(id==='@/components/PlayfulArrow') return {default:'svg'}
      if(id==='@/i18n/paths') return {localizePath:(_,path)=>path==='/tos'?path:`/id${path==='/'?'':path}`}
      if(id==='@/components/Turnstile') return {default:'turnstile',TURNSTILE_SITE_KEY:siteKey,resetTurnstile:()=>reset++}
      if(id.endsWith('.module.css')) return {default:new Proxy({}, {get:(_,key)=>key})}
      throw new Error(`Unexpected client dependency ${id}`)
    },
  })
  function nodes(value=tree){
    if(!value || typeof value!=='object') return []
    if(Array.isArray(value)) return value.flatMap(v=>nodes(v))
    return [value,...(value.props?.children === undefined ? [] : nodes(value.props.children))]
  }
  function render(){
    cursor=0;effects=[];tree=exports.default()
    for(const node of nodes()) if(node.props?.ref) node.props.ref.current={focus:()=>{focused=node.props.id??node.props.role??node.type}}
    effects.forEach(fn=>fn())
    return tree
  }
  const input=id=>nodes().find(n=>n.type==='input'&&n.props.id===id)
  function fill(id,value){input(id).props.onChange({target:{value}});render()}
  async function submit(){let prevented=false;await nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){prevented=true},currentTarget:{querySelector:selector=>({focus:()=>{focused=selector.slice(1)}})}});assert.equal(prevented,true);render()}
  render()
  return {render,nodes,input,fill,submit,requests,get focused(){return focused},get reset(){return reset}}
}

test('required fields focus the correct control without sending',async()=>{
  const run=form();assert.equal(run.nodes().find(node=>node.type==='form').props.method,'dialog');await run.submit();assert.equal(run.focused,'contact-name');assert.equal(run.requests.length,0)
  assert.equal(run.input('contact-name').props['aria-invalid'],true)
  run.fill('contact-name','Alex');run.fill('contact-email','not an email');await run.submit()
  assert.equal(run.focused,'contact-email');assert.equal(run.requests.length,0)
  assert.equal(run.input('contact-email').props['aria-describedby'],'contact-feedback')
  assert.equal(run.input('contact-name').props.maxLength,100);assert.equal(run.input('contact-email').props.maxLength,254)
})

test('failed delivery keeps input and allows a successful retry with announced focus',async()=>{
  const run=form({responses:[503,200]});run.fill('contact-name',' Alex ');run.fill('contact-email',' alex@example.test ')
  await run.submit();assert.equal(run.focused,'contact-feedback');assert.equal(run.reset,1)
  assert.equal(run.input('contact-name').props.value,' Alex ');assert.equal(run.input('contact-email').props.value,' alex@example.test ')
  assert.equal(run.requests.length,1);assert.equal(run.requests[0].url,'/api/contact')
  const body=JSON.parse(run.requests[0].options.body);assert.equal(body.name,'Alex');assert.equal(body.email,'alex@example.test');assert.equal(body.website,'')
  await run.submit();assert.equal(run.requests.length,2);assert.equal(run.focused,'status')
  assert.equal(run.nodes().filter(node=>node.type==='h1').length,1)
  assert.equal(run.nodes().filter(node=>node.type==='form').length,0)
})

test('configured bot verification remains required and its token is sent unchanged',async()=>{
  const run=form({siteKey:'public-test-key'});run.fill('contact-name','Alex');run.fill('contact-email','alex@example.test')
  await run.submit();assert.equal(run.requests.length,0);assert.equal(run.focused,'contact-feedback')
  run.nodes().find(node=>node.type==='turnstile').props.onToken('controlled-test-token');run.render();await run.submit()
  assert.equal(JSON.parse(run.requests[0].options.body).turnstileToken,'controlled-test-token')
})


test('partner validation, error retention, retry and success use the real handler', async()=>{
 const run=form({component:'partner',responses:[503,200]});await run.submit();assert.equal(run.requests.length,0)
 run.fill('partner-name','Alex');run.fill('partner-email','bad');await run.submit();assert.equal(run.requests.length,0)
 run.fill('partner-email','alex@example.test');await run.submit();assert.equal(run.requests.length,0)
 run.fill('partner-restaurant','Kitchen');run.fill('partner-city','London');await run.submit();assert.equal(run.reset,1);assert.equal(run.input('partner-restaurant').props.value,'Kitchen')
 await run.submit();assert.equal(run.requests.length,2);assert(!run.nodes().some(n=>n.type==='form'))
})

test('Android waitlist validation, bot token gate, failed retry and success',async()=>{
 const gated=form({component:'android',siteKey:'test'});gated.fill('android-waitlist-email','a@example.test');await gated.submit();assert.equal(gated.requests.length,0)
 const run=form({component:'android',responses:[503,200]});await run.submit();assert.equal(run.requests.length,0)
 run.fill('android-waitlist-email','a@example.test');await run.submit();assert.equal(run.reset,1);assert.equal(run.input('android-waitlist-email').props.value,'a@example.test')
 await run.submit();assert.equal(run.input('android-waitlist-email').props.value,'');assert.equal(JSON.parse(run.requests[0].options.body).source,'android-waitlist')
})

test('Turnstile removes a widget created after the mount effect when the form unmounts',()=>{
 const exports={};const effects=[];const removed=[];let tree
 const jsx=(type,props)=>({type,props})
 const win={}
 const source=ts.transpileModule(readFileSync('components/Turnstile.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
 runInNewContext(source,{exports,process:{env:{NEXT_PUBLIC_TURNSTILE_SITE_KEY:'controlled'}},window: win,require(name){if(name==='next/script')return{default:'script'};if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='react')return{useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};throw new Error(name)}})
 tree=exports.default({onToken(){}});const children=tree.props.children;children.find(n=>n.type==='div').props.ref.current={}
 // Script is not available during the real initial effect; create it after setup.
 const render=children.find(n=>n.type==='script').props.onLoad
 const cleanup=effects.map(fn=>fn()).filter(fn=>typeof fn==='function');win.turnstile={render:()=> 'late-widget',remove:value=>removed.push(value)};render();cleanup.forEach(fn=>fn());assert.deepEqual(removed,['late-widget'])
})
