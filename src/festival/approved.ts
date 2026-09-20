import * as T from 'three';
import {loadModelWithRetry,RequiredModelError} from './model-loading';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

function deviceMemory(){
  return (navigator as Navigator&{deviceMemory?:number}).deviceMemory;
}

export function isLowMemoryDevice(){
  const memory=deviceMemory();
  return memory!==undefined&&memory<=4;
}

// 4GB Chrome buckets report 4. Those phones cannot hold 2K–4K albedos from the
// supplied scans in GPU memory at the same time as the street. Gameplay never
// shows a model larger than ~300px, so fitting maps to 1024 does not change
// the pixels on screen - it only stops the tab from swapping.
export function textureSizeLimit(){
  return isLowMemoryDevice()?1024:4096;
}

export function fitTextureSize(texture:T.Texture,maxSize=textureSizeLimit()){
  const image=texture.image as (CanvasImageSource&{width?:number;height?:number;close?:()=>void})|undefined;
  if(!image||!image.width||!image.height||Math.max(image.width,image.height)<=maxSize)return texture;
  const scale=maxSize/Math.max(image.width,image.height);
  const width=Math.max(1,Math.round(image.width*scale));
  const height=Math.max(1,Math.round(image.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)return texture;
  ctx.drawImage(image,0,0,width,height);
  image.close?.();
  texture.image=canvas;texture.needsUpdate=true;
  return texture;
}

// Scan-style GLBs carry triangles that never move a silhouette pixel. Bound the
// error to half a percent of the model so the image stays the same.
async function trimExcessTriangles(model:GLTF){
  try{await MeshoptSimplifier.ready;}catch(error){console.warn('Triangle trimming unavailable.',error);return;}
  model.scene.traverse(object=>{try{
    if(!(object instanceof T.Mesh)||(object as T.Mesh&{isSkinnedMesh?:boolean}).isSkinnedMesh)return;
    let geometry=object.geometry;
    const position=geometry.attributes.position;
    if(!position||position.itemSize!==3||(position as T.InterleavedBufferAttribute).isInterleavedBufferAttribute||position.count<1500)return;
    if(!geometry.index){geometry=mergeVertices(geometry);object.geometry=geometry;}
    if(!geometry.index)return;
    const source=geometry.index.array;
    const indices=source instanceof Uint32Array?source:new Uint32Array(source);
    const target=Math.max(1500,Math.floor(indices.length*.15/3)*3);
    const [simplified]=MeshoptSimplifier.simplify(indices,geometry.attributes.position.array as Float32Array,3,target,.005,['LockBorder']);
    if(simplified.length&&simplified.length<indices.length)geometry.setIndex(new T.BufferAttribute(simplified,1));
  }catch(error){console.warn('Kept the original mesh for one part.',error);}});
}

export async function loadApprovedModels() {
  const loader=new GLTFLoader();
  const fullNames=['modak','ganesha','festival-tram','temple-rooftop','roof-ramp','tribal-drum','marigold-market-cart','titanic-lamp','marigold-temple-gate','om-symbol','meshy-mushika-running'];
  const names=fullNames;
  const path=(name:string)=>name==='ganesha'?'/assets/models/ganesha_3d.glb':name==='tribal-drum'?'/assets/models/festival_drum_on_wheels.glb':name==='marigold-market-cart'?'/assets/models/marigold_market_cart.glb':name==='titanic-lamp'?'/assets/models/titanic_lamp.glb':name==='marigold-temple-gate'?'/assets/models/marigold_temple_gate.glb':name==='om-symbol'?'/assets/models/om_symbol.glb':name==='meshy-mushika-running'?'/assets/models/meshy_mushika_running.glb':`/model-review-v1/models/${name}.glb`;
  const models:Record<string,GLTF>={};
  const maxTexture=textureSizeLimit();
  // Large festival models are intentionally loaded one at a time. Loading all
  // of their compressed buffers and 4K textures together can exhaust a mobile
  // browser's temporary memory even when each individual model is valid.
  for(const name of names){
    try{models[name]=await loadModelWithRetry(url=>loader.loadAsync(url),path(name));await trimExcessTriangles(models[name]);}
    catch(error){
      console.warn('Detailed model unavailable: '+name,error);
      if(name==='ganesha')throw new RequiredModelError('Ganesha could not be downloaded. Check your connection, then tap Retry loading.');
    }
  }

  const materials=new Map<T.Material,T.MeshStandardMaterial>();
  const realtime=(source:T.Material)=>{
    if(materials.has(source))return materials.get(source)!;
    const m=source as T.MeshStandardMaterial;
    const result=new T.MeshStandardMaterial({color:m.color,roughness:Math.max(.3,m.roughness),metalness:m.metalness*.8,envMapIntensity:.8,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity});
    materials.set(source,result);return result;
  };
  const seen=new Set<T.Texture>();
  for(const [name,model] of Object.entries(models)) model.scene.traverse(object=>{
    if(object instanceof T.Mesh){
      if(name!=='ganesha'&&name!=='tribal-drum'&&name!=='marigold-market-cart'&&name!=='titanic-lamp'&&name!=='marigold-temple-gate'&&name!=='om-symbol'&&name!=='meshy-mushika-running')object.material=Array.isArray(object.material)?object.material.map(realtime):realtime(object.material);
      else for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)material.envMapIntensity=.65;
      object.castShadow=false;object.receiveShadow=true;
      for(const material of Array.isArray(object.material)?object.material:[object.material])for(const value of Object.values(material))if(value instanceof T.Texture&&!seen.has(value)){seen.add(value);fitTextureSize(value,maxTexture);}
    }
  });
  return models;
}
