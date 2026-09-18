import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const notes={
 mushika:{title:'Mushika',eyebrow:'CHARACTER STUDY / 01',subtitle:'Small paws. An extraordinary journey.',heading:'Made to feel like Mushika.',description:'A new character study shaped around your reference: warm silver fur, broad pink ears, amber eyes, a soft muzzle and a crimson cape.',features:[['Expression & silhouette','Inspect the face from the front and the side. The rounded body and oversized ears should read clearly during a run.'],['Crimson & gold','A folded cape, raised Om embroidery, paisley edging and a small golden clasp. Switch to Back to inspect it.'],['Five movement previews','Idle, run, jump, slide and land. These are articulated draft motions for review before game integration.']]},
 modak:{title:'Golden modak',eyebrow:'COLLECTIBLE STUDY / 02',subtitle:'Every little offering counts.',heading:'The shape of a blessing.',description:'A full three-dimensional sweet with a rounded base, fourteen sculpted pleats and a pinched tip. Its golden color follows your visual reference.',features:[['Hand-pleated silhouette','The folds remain geometry when you rotate the model; they are not painted onto a sphere.'],['Warm golden finish','A soft surface with a readable highlight. The collection glow will be added in the game after approval.'],['Made for a trail','Designed to repeat along lanes, vehicle roofs and rooftop routes.']]},
 ganesha:{title:'Lord Ganesha',eyebrow:'LANDMARK STUDY / 03',subtitle:'Always ahead. Always waiting for Mushika.',heading:'A welcoming presence.',description:'A seated Ganesha on a lotus pedestal, with a curled trunk, gold crown, ornaments, a modak offering and a blessing hand.',features:[['Seated & welcoming','Four arms, gentle eyes, a raised blessing palm and an offering held close. Review the face and pose carefully.'],['Temple craftsmanship','A layered crown, ruby and emerald accents, necklaces, garland and a lotus-pattern halo.'],['An endless destination','In the approved game, Ganesha will face Mushika and remain in the distance throughout the run.']]},
 'festival-tram':{title:'Festival tram',eyebrow:'TRAVERSAL STUDY / 04',subtitle:'A new route above the street.',heading:'Jump up. Keep running.',description:'A crimson-and-gold festival carriage with dark glass, marigold trim and a clear, flat roof designed for landing and running.',features:[['A usable roof','A broad, unobstructed landing surface. Raised ornaments sit outside the main running route.'],['Festive detail','Gold corner posts, Om emblems, headlamps and flower trim keep it in the Ganesh festival setting.'],['Connected routes','Vehicle roofs will connect to ramps and rooftop sections after model approval.']]},
 'slide-barrier':{title:'Slide barrier',eyebrow:'TRAVERSAL STUDY / 05',subtitle:'Low paws. Quick reactions.',heading:'A clear signal to slide.',description:'A striped crossbar on weighted golden posts, with visible clearance underneath and marigolds at the corners.',features:[['Readable at speed','The crimson and cream diagonal stripes give a clear warning as the barrier approaches.'],['Open underneath','The crossbar leaves space for a crouched sliding pose. The final clearance will be tuned with the approved character.'],['One decisive action','Designed for the downward swipe or slide input in the endless runner.']]},
 'temple-rooftop':{title:'Temple rooftop',eyebrow:'TRAVERSAL STUDY / 06',subtitle:'The festival continues above.',heading:'Room for a rooftop run.',description:'A sandstone terrace with open ends, paved roofing and gold-capped side balustrades. A modular section for a route above the streets.',features:[['Open route','The ends remain open for jumping between buildings and landing from vehicles.'],['Festival architecture','Warm stone, recessed windows and ornamental side rails connect it visually to the temple streets.'],['Made to repeat','The final layout will vary rooftop gaps and heights after the model pack is approved.']]},
 'roof-ramp':{title:'Roof ramp',eyebrow:'TRAVERSAL STUDY / 07',subtitle:'From the street to the skyline.',heading:'A path to the upper lane.',description:'A teak and crimson approach ramp with golden cross strips, sized to meet the carriage roof.',features:[['Sloped approach','An actual wedge with a continuous rising surface for running up.'],['Readable direction','The cross strips show the incline and match the festival carriage palette.'],['Built for connection','The ramp and vehicle roof share a target height for future traversal integration.']]},
};
const $=id=>document.getElementById(id),canvas=$('model-canvas'),viewport=$('viewport');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.01,100);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.51;controls.enablePan=false;controls.autoRotateSpeed=1.0;
const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(room,.05);scene.environment=environment.texture;room.dispose();pmrem.dispose();
const hemi=new THREE.HemisphereLight(0xfce8d2,0x494153,.85);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffe7ca,2.0);key.position.set(-3.5,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-5;key.shadow.normalBias=.018;key.shadow.bias=-.0001;scene.add(key);
const fill=new THREE.DirectionalLight(0xd6dffc,1.1);fill.position.set(4,3,2);scene.add(fill);const rim=new THREE.DirectionalLight(0xffcf90,2.3);rim.position.set(2,4,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(10,96),new THREE.ShadowMaterial({color:0x070405,opacity:.45}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,.035,128),new THREE.MeshStandardMaterial({color:0x51414a,metalness:.1,roughness:.75}));disc.position.y=-.047;disc.receiveShadow=true;scene.add(disc);
const loader=new GLTFLoader(),cache=new Map();const clock=new THREE.Clock();let model,mixer,currentAction,currentID='',currentClip='Idle',manifest=[],ticket=0,baseTarget=new THREE.Vector3(),frameDistance=5,animationPaused=false;
const orientation={front:[0,.12,1],side:[1,.12,0],back:[0,.12,-1],three:[.62,.19,1]};
function setView(name){const dir=new THREE.Vector3(...orientation[name]).normalize();camera.position.copy(baseTarget).addScaledVector(dir,frameDistance);controls.target.copy(baseTarget);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function playClip(name){
 if(!mixer||!model)return;const clip=THREE.AnimationClip.findByName(model.animations,name);if(!clip)return;
 mixer.stopAllAction();currentAction=mixer.clipAction(clip);currentAction.reset().setLoop(THREE.LoopRepeat,Infinity).play();currentClip=name;animationPaused=false;mixer.timeScale=1;$('pause-animation').textContent='Ⅱ';$('pause-animation').setAttribute('aria-label','Pause animation');
 document.querySelectorAll('[data-clip]').forEach(b=>b.classList.toggle('active',b.dataset.clip===name));
}
async function select(id){
 if(!notes[id])id='mushika';const token=++ticket;const n=notes[id];currentID=id;location.hash=id;
 document.querySelectorAll('[data-asset]').forEach(b=>b.classList.toggle('selected',b.dataset.asset===id));
 $('model-title').textContent=n.title;$('eyebrow').textContent=n.eyebrow;$('model-subtitle').textContent=n.subtitle;$('design-heading').textContent=n.heading;$('description').textContent=n.description;
 $('features').replaceChildren(...n.features.map(([title,description])=>{const el=document.createElement('div');el.className='feature';const mark=document.createElement('span');mark.textContent='✧';const body=document.createElement('div');const b=document.createElement('b');b.textContent=title;const p=document.createElement('p');p.textContent=description;body.append(b,p);el.append(mark,body);return el;}));
 $('download-model').href=`./models/${id}.glb`;$('loading').hidden=false;
 try{
  let gltf=cache.get(id);if(!gltf){gltf=await loader.loadAsync(`./models/${id}.glb`);cache.set(id,gltf);}if(token!==ticket)return;
  if(model){mixer?.stopAllAction();scene.remove(model.scene);}model=gltf;scene.add(gltf.scene);gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  gltf.scene.traverse(o=>{if(o.isMesh)o.material.envMapIntensity=.55;});
  mixer=new THREE.AnimationMixer(gltf.scene);const bounds=new THREE.Box3().setFromObject(gltf.scene);const size=bounds.getSize(new THREE.Vector3());baseTarget=bounds.getCenter(new THREE.Vector3());baseTarget.y-=size.y*.045;
  const halfFov=THREE.MathUtils.degToRad(camera.fov/2),limitingAngle=Math.min(halfFov,Math.atan(Math.tan(halfFov)*camera.aspect));frameDistance=size.length()*.5/Math.sin(limitingAngle)*1.08;
  controls.minDistance=frameDistance*.48;controls.maxDistance=frameDistance*2.1;disc.scale.set(Math.max(.45,size.x*.57),1,Math.max(.45,size.z*.57));setView('front');
  $('animation-buttons').replaceChildren();const clips=gltf.animations.map(c=>c.name).sort((a,b)=>['Idle','Run','Jump','Slide','Land'].indexOf(a)-['Idle','Run','Jump','Slide','Land'].indexOf(b));
  for(const name of clips){const button=document.createElement('button');button.textContent=name;button.dataset.clip=name;button.addEventListener('click',()=>playClip(name));$('animation-buttons').append(button);}
  $('animation-bar').hidden=clips.length===0;if(clips.length)playClip('Idle');
  const entry=manifest.find(m=>m.id===id);$('model-details').textContent=entry?`Actual GLB geometry · ${(entry.bytes/1048576).toFixed(1)} MB · ${entry.triangles.toLocaleString()} triangles. Review detail; gameplay optimization follows approval.`:'';
  $('loading').hidden=true;
 }catch(error){console.error(error);$('loading').hidden=false;$('loading').textContent='The model could not load. Please reload the review page.';}
}
function resize(){const {width,height}=viewport.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewport);resize();
document.querySelectorAll('[data-asset]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.asset)));
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
$('turntable').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('turntable').setAttribute('aria-pressed',String(controls.autoRotate));});
$('pause-animation').addEventListener('click',()=>{animationPaused=!animationPaused;if(mixer)mixer.timeScale=animationPaused?0:1;$('pause-animation').textContent=animationPaused?'▶':'Ⅱ';$('pause-animation').setAttribute('aria-label',animationPaused?'Resume animation':'Pause animation');});
$('reference-button').addEventListener('click',()=>$('reference-dialog').showModal());$('close-reference').addEventListener('click',()=>$('reference-dialog').close());
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id!==currentID&&notes[id])select(id);});
function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.06);mixer?.update(dt);controls.update();renderer.render(scene,camera);}render();
try{manifest=await fetch('./manifest.json').then(r=>r.json());}catch{}await select(location.hash.slice(1)||'mushika');
