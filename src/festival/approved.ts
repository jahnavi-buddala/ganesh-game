import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadApprovedModels() {
  const loader=new GLTFLoader();
  const names=['modak','ganesha','festival-tram','temple-rooftop','roof-ramp','tribal-drum','marigold-market-cart','floor-lamp','marigold-temple-gate','om-symbol','meshy-mushika-running','meshy-mushika-hit'];
  const path=(name:string)=>name==='ganesha'?'/assets/models/ganesha_3d.glb':name==='tribal-drum'?'/assets/models/festival_drum_on_wheels.glb':name==='marigold-market-cart'?'/assets/models/marigold_market_cart.glb':name==='floor-lamp'?'/assets/models/floor_lamp.glb':name==='marigold-temple-gate'?'/assets/models/marigold_temple_gate.glb':name==='om-symbol'?'/assets/models/om_symbol.glb':name==='meshy-mushika-running'?'/assets/models/meshy_mushika_running.glb':name==='meshy-mushika-hit'?'/assets/models/meshy_mushika_hit.glb':`/model-review-v1/models/${name}.glb`;
  const models=await Promise.all(names.map(name=>loader.loadAsync(path(name))));
  const materials=new Map<T.Material,T.MeshStandardMaterial>();
  const realtime=(source:T.Material)=>{
    if(materials.has(source))return materials.get(source)!;
    const m=source as T.MeshStandardMaterial;
    const result=new T.MeshStandardMaterial({color:m.color,roughness:Math.max(.3,m.roughness),metalness:m.metalness*.8,envMapIntensity:.8,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity});
    materials.set(source,result);return result;
  };
  for(const [index,model] of models.entries()) model.scene.traverse(object=>{
    if(object instanceof T.Mesh){
      if(names[index]!=='ganesha'&&names[index]!=='tribal-drum'&&names[index]!=='marigold-market-cart'&&names[index]!=='floor-lamp'&&names[index]!=='marigold-temple-gate'&&names[index]!=='om-symbol'&&names[index]!=='meshy-mushika-running'&&names[index]!=='meshy-mushika-hit')object.material=Array.isArray(object.material)?object.material.map(realtime):realtime(object.material);
      else for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)material.envMapIntensity=.65;
      object.castShadow=false;object.receiveShadow=true;
    }
  });
  return Object.fromEntries(names.map((name,i)=>[name,models[i]]));
}
