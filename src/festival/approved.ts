import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

export async function loadApprovedModels() {
  const loader=new GLTFLoader();
  const fullNames=['modak','ganesha','festival-tram','temple-rooftop','roof-ramp','tribal-drum','marigold-market-cart','titanic-lamp','marigold-temple-gate','om-symbol','meshy-mushika-running'];
  const names=fullNames;
  const path=(name:string)=>name==='ganesha'?'/assets/models/ganesha_3d.glb':name==='tribal-drum'?'/assets/models/festival_drum_on_wheels.glb':name==='marigold-market-cart'?'/assets/models/marigold_market_cart.glb':name==='titanic-lamp'?'/assets/models/titanic_lamp.glb':name==='marigold-temple-gate'?'/assets/models/marigold_temple_gate.glb':name==='om-symbol'?'/assets/models/om_symbol.glb':name==='meshy-mushika-running'?'/assets/models/meshy_mushika_running.glb':`/model-review-v1/models/${name}.glb`;
  const models:Record<string,GLTF>={};
  // Large festival models are intentionally loaded one at a time. Loading all
  // of their compressed buffers and 4K textures together can exhaust a mobile
  // browser's temporary memory even when each individual model is valid.
  for(const name of names){
    for(let attempt=0;attempt<2;attempt++){
      try{models[name]=await loader.loadAsync(path(name));break;}
      catch(error){if(attempt===1)console.warn(`Using the fallback for ${name}.`,error);}
    }
  }
  const materials=new Map<T.Material,T.MeshStandardMaterial>();
  const realtime=(source:T.Material)=>{
    if(materials.has(source))return materials.get(source)!;
    const m=source as T.MeshStandardMaterial;
    const result=new T.MeshStandardMaterial({color:m.color,roughness:Math.max(.3,m.roughness),metalness:m.metalness*.8,envMapIntensity:.8,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity});
    materials.set(source,result);return result;
  };
  for(const [name,model] of Object.entries(models)) model.scene.traverse(object=>{
    if(object instanceof T.Mesh){
      if(name!=='ganesha'&&name!=='tribal-drum'&&name!=='marigold-market-cart'&&name!=='titanic-lamp'&&name!=='marigold-temple-gate'&&name!=='om-symbol'&&name!=='meshy-mushika-running')object.material=Array.isArray(object.material)?object.material.map(realtime):realtime(object.material);
      else for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)material.envMapIntensity=.65;
      object.castShadow=false;object.receiveShadow=true;
    }
  });
  return models;
}
