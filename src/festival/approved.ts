import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export async function loadApprovedModels(onProgress?:(progress:number,label:string)=>void,lowPower=false) {
  const manager=new T.LoadingManager();manager.onProgress=(url,loaded,total)=>onProgress?.(loaded/Math.max(1,total),url.split('/').pop()||'festival asset');
  const loader=new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
  const required=lowPower?['ganesha','meshy-mushika-running-mobile','meshy-mushika-hit-animation','meshy-mushika-recover']:['ganesha','meshy-mushika-running','meshy-mushika-hit-animation','meshy-mushika-recover'];
  const premium=lowPower?[]:['modak','festival-tram','temple-rooftop','roof-ramp','om-symbol','tribal-drum','marigold-market-cart','titanic-lamp','marigold-temple-gate'];
  const path=(name:string)=>name==='ganesha'?'/assets/models/ganesha_3d.glb':name==='tribal-drum'?'/assets/models/festival_drum_on_wheels.glb':name==='marigold-market-cart'?'/assets/models/marigold_market_cart.glb':name==='titanic-lamp'?'/assets/models/titanic_lamp.glb':name==='marigold-temple-gate'?'/assets/models/marigold_temple_gate.glb':name==='om-symbol'?'/assets/models/om_symbol.glb':name==='meshy-mushika-running'?'/assets/models/meshy_mushika_running.glb':name==='meshy-mushika-running-mobile'?'/assets/models/meshy_mushika_running_mobile.glb':name==='meshy-mushika-hit-animation'?'/assets/models/meshy_mushika_hit_animation.glb':name==='meshy-mushika-recover'?'/assets/models/meshy_mushika_recover.glb':`/model-review-v1/models/${name}.glb`;
  const requiredModels=await Promise.all(required.map(async name=>[name,await loader.loadAsync(path(name))] as const));
  const materials=new Map<T.Material,T.MeshStandardMaterial>();
  const realtime=(source:T.Material)=>{
    if(materials.has(source))return materials.get(source)!;
    const m=source as T.MeshStandardMaterial;
    const result=new T.MeshStandardMaterial({color:m.color,roughness:Math.max(.3,m.roughness),metalness:m.metalness*.8,envMapIntensity:.8,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity});
    materials.set(source,result);return result;
  };
  const prepare=(entries:(readonly [string,Awaited<ReturnType<GLTFLoader['loadAsync']>>])[])=>{for(const [name,model] of entries) model.scene.traverse(object=>{
    if(object instanceof T.Mesh){
      if(name!=='ganesha'&&name!=='tribal-drum'&&name!=='marigold-market-cart'&&name!=='titanic-lamp'&&name!=='marigold-temple-gate'&&name!=='om-symbol'&&name!=='meshy-mushika-running'&&name!=='meshy-mushika-running-mobile')object.material=Array.isArray(object.material)?object.material.map(realtime):realtime(object.material);
      else for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)material.envMapIntensity=.65;
      for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)for(const texture of [material.map,material.normalMap,material.roughnessMap,material.metalnessMap,material.emissiveMap])if(texture){texture.anisotropy=lowPower?1:Math.min(4,navigator.maxTouchPoints>0?2:4);texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;}
      object.castShadow=false;object.receiveShadow=true;
    }
  });return Object.fromEntries(entries);};
  const models=prepare(requiredModels);
  const premiumReady=lowPower?Promise.resolve({}):Promise.allSettled(premium.map(async name=>[name,await loader.loadAsync(path(name))] as const)).then(results=>prepare(results.flatMap(result=>result.status==='fulfilled'?[result.value]:[])));
  return {models,premiumReady};
}
