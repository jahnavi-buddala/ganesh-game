import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as T from 'three';
const source=readFileSync('src/festival/instances.ts','utf8').replace("'three'",JSON.stringify(import.meta.resolve('three')));
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {ModelInstances}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const scene=new T.Scene(),template=new T.Group(),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
const part=new T.Mesh(geometry,material);part.position.set(.2,1,0);part.scale.set(1,2,1);template.add(part);
const pool=new ModelInstances(scene,template),camera=new T.PerspectiveCamera(60,1,.1,200);
camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
const sync=()=>pool.sync(camera,frustum,100);
const handle=pool.create();handle.position.set(0,0,-10);handle.rotation.y=.4;handle.scale.setScalar(2);scene.add(handle);sync();
assert.equal(pool.parts[0].mesh.geometry,geometry);assert.equal(pool.parts[0].mesh.material,material);
const actual=new T.Matrix4();pool.parts[0].mesh.getMatrixAt(0,actual);const expected=new T.Matrix4().multiplyMatrices(handle.matrixWorld,part.matrixWorld);
actual.elements.forEach((v,i)=>assert.ok(Math.abs(v-expected.elements[i])<1e-5));
console.log('PASS original geometry/materials and nested transforms preserved');
handle.visible=false;sync();assert.equal(pool.parts[0].mesh.count,0);handle.visible=true;
handle.position.z=10;sync();assert.equal(pool.parts[0].mesh.count,0);
handle.position.z=-110;sync();assert.equal(pool.parts[0].mesh.count,0);
handle.position.z=-99;sync();assert.equal(pool.parts[0].mesh.count,1);
console.log('PASS collected, off-camera and fully fogged instances omitted without edge popping');
const parent=new T.Group();scene.add(parent);parent.add(handle);parent.visible=false;sync();assert.equal(pool.parts[0].mesh.count,0);parent.visible=true;
parent.position.z=89;sync();assert.equal(pool.parts[0].mesh.count,1);pool.parts[0].mesh.getMatrixAt(0,actual);expected.multiplyMatrices(handle.matrixWorld,part.matrixWorld);assert.ok(Math.abs(actual.elements[14]-expected.elements[14])<1e-5);
console.log('PASS recycled street parents and hidden ancestors handled');
for(let i=0;i<70;i++){const h=pool.create();h.position.z=-10;scene.add(h);}sync();assert.equal(pool.parts[0].mesh.count,71);assert.equal(pool.parts[0].mesh.geometry,geometry);
for(const h of [...pool.handles])pool.remove(h);sync();assert.equal(pool.parts[0].mesh.count,0);
console.log('PASS capacity growth, collection removal and restart cleanup');
let disposed=0;geometry.addEventListener('dispose',()=>disposed++);pool.dispose();assert.equal(disposed,0);assert.equal(pool.handles.size,0);
console.log('PASS instance buffers dispose without destroying shared model resources');

// Exercise the actual street merger with different colors and a textured panel.
const worldSource=readFileSync('src/festival/world.ts','utf8');
const batchSource=worldSource.slice(worldSource.indexOf('function batch('),worldSource.indexOf('function modak('));
const batchModule='import * as T from '+JSON.stringify(import.meta.resolve('three'))+';import {mergeGeometries} from '+JSON.stringify(import.meta.resolve('three/addons/utils/BufferGeometryUtils.js'))+';const materials=new Map();const streetMaterials=new Map();'+batchSource+'export function merge(group,eligible){eligible.forEach((m,i)=>materials.set(i,m));return batch(group);}';
const batchJS=ts.transpileModule(batchModule,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {merge}=await import('data:text/javascript;base64,'+Buffer.from(batchJS).toString('base64'));
const street=new T.Group(),red=new T.MeshStandardMaterial({color:0x982334,roughness:.72,emissiveIntensity:0}),blue=new T.MeshStandardMaterial({color:0x345789,roughness:.72,emissiveIntensity:0});
const redMesh=new T.Mesh(new T.BoxGeometry(),red),blueMesh=new T.Mesh(new T.BoxGeometry(),blue);blueMesh.position.x=4;street.add(redMesh,blueMesh);
const texture=new T.Texture(),mapped=new T.Mesh(new T.PlaneGeometry(),new T.MeshStandardMaterial({map:texture}));street.add(mapped);
const merged=merge(street,[red,blue]);assert.equal(merged.children.length,2);
const solid=merged.children.find(m=>m.material.vertexColors),expanded=solid.geometry.toNonIndexed(),color=expanded.attributes.color;
const redCount=redMesh.geometry.index.count,blueStart=redCount;
for(const [index,original] of [[0,red],[blueStart,blue]]){assert.ok(Math.abs(color.getX(index)-original.color.r)<1e-6);assert.ok(Math.abs(color.getY(index)-original.color.g)<1e-6);assert.ok(Math.abs(color.getZ(index)-original.color.b)<1e-6);}
assert.equal(expanded.attributes.position.count,redMesh.geometry.index.count+blueMesh.geometry.index.count);
assert.equal(solid.material.roughness,red.roughness);assert.equal(solid.material.metalness,red.metalness);
const panel=merged.children.find(m=>m.material.map);assert.equal(panel.material.map,texture);
assert.deepEqual([...panel.geometry.toNonIndexed().attributes.uv.array],[...mapped.geometry.toNonIndexed().attributes.uv.array]);
assert.ok(solid.geometry.attributes.position.count<expanded.attributes.position.count);
console.log('PASS merged streets retain linear colors, lighting, every triangle and mapped UVs');

// Ten repeating street rows must be one instanced draw of the merged mesh, not
// ten cloned copies. 4GB GPUs pay for every extra draw of those buildings.
const streetPool=new ModelInstances(scene,merged);
const rows=[];for(let i=0;i<10;i++){const row=streetPool.create();row.position.z=-8-i*12;scene.add(row);rows.push(row);}
streetPool.sync(camera,frustum,200);
assert.equal(streetPool.parts.length,merged.children.length);
assert.ok(streetPool.parts.every(part=>part.mesh.count===10));
rows[0].visible=false;rows[9].position.z=40;streetPool.sync(camera,frustum,200);
assert.ok(streetPool.parts.every(part=>part.mesh.count===8));
console.log('PASS ten street rows share original merged draws and cull recycled copies');
streetPool.dispose();

const casterTemplate=new T.Group(),casterMesh=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());
casterMesh.castShadow=true;casterTemplate.add(casterMesh);
const casterPool=new ModelInstances(scene,casterTemplate);
const behind=casterPool.create();behind.position.z=12;scene.add(behind);casterPool.sync(camera,frustum,200);
assert.equal(casterPool.parts[0].mesh.count,0,'buildings behind the camera must not be transformed just because they cast shadows');
const ahead=casterPool.create();ahead.position.z=-12;scene.add(ahead);casterPool.sync(camera,frustum,200);
assert.equal(casterPool.parts[0].mesh.count,1);
console.log('PASS shadow-casting street rows still frustum cull');
casterPool.dispose();

assert.ok(worldSource.includes('streetPools'),'street rows must use instance pools');
assert.equal(worldSource.includes('streetTemplates.get(variant)!.clone()'),false,'street rows must not clone merged buildings');
assert.ok(worldSource.includes('themePools'),'theme decorations must use instance pools');
assert.equal(/\broot\.clone\(\)/.test(worldSource),false,'theme rows must not clone every theme into the scene');
assert.ok(worldSource.includes('prepareModel('),'approved models must merge submeshes before instancing');
assert.ok(!/this\.scene\.add\(this\.omLight\)/.test(worldSource.split('installApproved')[0]),'idle Om light must stay out of the scene so unused point lighting is not paid every frame');
assert.ok(worldSource.includes('alpha:false'),'opaque canvas avoids extra Android compositor work over the HUD');
assert.ok(worldSource.includes('PCFShadowMap'),'4GB Adreno/Mali phones must not run 9-tap soft shadows');
console.log('PASS 4GB path instances streets/themes, merges model draws, and keeps the idle Om light off the light list');

const approvedSource=readFileSync('src/festival/approved.ts','utf8');
assert.ok(approvedSource.includes("const names=fullNames"),'every approved model stays loaded');
assert.ok(approvedSource.includes('fitTextureSize'),'oversized maps must be fitted to the screen before they reach a 4GB heap');
assert.ok(approvedSource.includes('isLowMemoryDevice'));
assert.match(approvedSource,/memory<=4/);
assert.match(approvedSource,/\?1024:4096/);
console.log('PASS approved models stay complete while fitting oversized textures on 4GB devices');
