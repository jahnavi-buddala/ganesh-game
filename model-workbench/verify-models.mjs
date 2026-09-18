import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const root = new URL('../public/model-review-v1/', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'));
for (const asset of manifest) {
  const bytes=await fs.readFile(new URL(asset.filename,root));
  if(bytes.readUInt32LE(0)!==0x46546c67 || bytes.readUInt32LE(4)!==2 || bytes.readUInt32LE(8)!==bytes.length) throw Error(asset.id+' invalid GLB');
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let meshes=0;
  gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const name of ['position','normal']){const a=o.geometry.attributes[name];if(a&&!Array.from(a.array).every(Number.isFinite))throw Error(asset.id+' invalid '+name);}});
  const bounds=new T.Box3().setFromObject(gltf.scene);
  if(bounds.isEmpty())throw Error(asset.id+' empty model');
  for(const clip of gltf.animations){if(!clip.validate())throw Error(asset.id+' invalid clip');const mixer=new T.AnimationMixer(gltf.scene);mixer.clipAction(clip).play();for(let i=0;i<12;i++)mixer.update(clip.duration/12);mixer.stopAllAction();}
  console.log(`${asset.id}: loaded ${meshes} meshes; ${gltf.animations.length} valid animations; finite geometry`);
}
if(manifest.length!==7)throw Error('Expected seven assets');
