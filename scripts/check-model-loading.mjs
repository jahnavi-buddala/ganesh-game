import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {gzipSync} from 'node:zlib';
const code=ts.transpileModule(readFileSync('src/festival/model-loading.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {loadModelWithRetry,runLoadQueue}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const urls=[],model={scene:true};
assert.equal(await loadModelWithRetry(async url=>{urls.push(url);if(urls.length<3)throw Error('cached failure');return model;},'/ganesha.glb'),model);
assert.equal(new Set(urls).size,3);assert.ok(urls.every(url=>url.includes('?v=')));
let failures=0;await assert.rejects(loadModelWithRetry(async()=>{failures++;throw Error('offline');},'/ganesha.glb'),/offline/);assert.equal(failures,3);
let calls=0;await loadModelWithRetry(async()=>{calls++;return model;},'/ganesha.glb');assert.equal(calls,1);
console.log('PASS fresh-URL recovery, bounded failure, and no redundant successful download');

for(const concurrency of [1,2]){
  let active=0,peak=0,done=0;
  await runLoadQueue([1,2,3,4,5],concurrency,async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,1));active--;done++;});
  assert.equal(peak,concurrency);assert.equal(done,5);assert.equal(active,0);
}
let started=0;await assert.rejects(runLoadQueue([1,2,3],1,async()=>{started++;throw Error('required model missing');}),/required model missing/);assert.equal(started,1);
console.log('PASS bounded desktop/mobile loading and required failure stops queue');

// Fetch exposes decoded bytes when the server uses Content-Encoding:gzip.
const retryModule='data:text/javascript;base64,'+Buffer.from(code).toString('base64');
let packedSource=readFileSync('src/festival/packed-loader.ts','utf8').replace(/import packedModels from [^;]+;/,"const packedModels={'/fixture.glb':'/fixture.glb.gz'};").replace("'./model-loading'",JSON.stringify(retryModule));
const packedJS=ts.transpileModule(packedSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {loadPackedModel}=await import('data:text/javascript;base64,'+Buffer.from(packedJS).toString('base64'));
const bytes=Buffer.alloc(12);bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(12,8);
const realFetch=globalThis.fetch,realWarn=console.warn;let fallback=0;
try{
  const loader={parseAsync:async data=>{assert.deepEqual(Buffer.from(data),bytes);return model;},loadAsync:async()=>{fallback++;return model;}};
  for(const encoded of [false,true]){
    globalThis.fetch=async()=>new Response(encoded?bytes:gzipSync(bytes),{headers:encoded?{'Content-Encoding':'gzip'}:{}});
    assert.equal(await loadPackedModel(loader,'/fixture.glb'),model);
  }
  assert.equal(fallback,0);
  globalThis.fetch=async()=>new Response('unavailable',{status:404});console.warn=()=>{};
  assert.equal(await loadPackedModel(loader,'/fixture.glb'),model);assert.equal(fallback,1);
}finally{globalThis.fetch=realFetch;console.warn=realWarn;}
console.log('PASS automatic/manual gzip decoding and original-model recovery');
