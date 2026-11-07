import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'

test('responsive phone and portrait variants preserve every visible channel at their target resolution',async()=>{
 for(const name of ['diary-iphone','eat-or-yeet-iphone','feed-seafood-risotto','fictional-diners']){
  const extension=name.endsWith('iphone')?'png':'webp'
  for(const width of [400,600,800,1066]){
   const expected=await sharp(`public/redesign/${name}.${extension}`).rotate().resize({width,withoutEnlargement:true,fit:'inside'}).ensureAlpha().raw().toBuffer()
   const actual=await sharp(`public/static-images/v1/redesign/${name}-${width}.webp`).ensureAlpha().raw().toBuffer()
   assert.equal(actual.length,expected.length,`${name} ${width}`)
   for(let i=0;i<actual.length;i+=4){
    assert.equal(actual[i+3],expected[i+3],`${name}: alpha`)
    if(!actual[i+3])continue
    if(actual[i]!==expected[i]||actual[i+1]!==expected[i+1]||actual[i+2]!==expected[i+2])assert.fail(`${name} ${width}: visible pixel changed`)
   }
  }
 }
})
