import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
const paths=['/assets/models/ganesha_3d.glb','/assets/models/festival_drum_on_wheels.glb','/assets/models/marigold_market_cart.glb','/assets/models/titanic_lamp.glb','/assets/models/marigold_temple_gate.glb','/assets/models/om_symbol.glb','/assets/models/meshy_mushika_running.glb',...['modak','festival-tram','temple-rooftop','roof-ramp'].map(n=>'/model-review-v1/models/'+n+'.glb')];
const manifest={};let total=0,packed=0;mkdirSync('public/assets/packed',{recursive:true});
for(const path of paths){
  const original=readFileSync('public'+path),hash=createHash('sha256').update(original).digest('hex').slice(0,16);
  const destination='/assets/packed/'+path.split('/').pop().replace('.glb','')+'-'+hash+'.glb.gz';
  const file='public'+destination;
  if(!existsSync(file))writeFileSync(file,gzipSync(original,{level:9}));
  const compressed=readFileSync(file);
  if(!gunzipSync(compressed).equals(original))throw Error('Packed asset differs: '+path);
  manifest[path]=destination;total+=original.length;packed+=compressed.length;
}
const json=JSON.stringify(manifest,null,2)+'\n',target='src/festival/packed-models.json';
if(!existsSync(target)||readFileSync(target,'utf8')!==json)writeFileSync(target,json);
console.log('Lossless models: '+(total/1e6).toFixed(1)+' MB → '+(packed/1e6).toFixed(1)+' MB. All geometry, texture and animation bytes verified.');
