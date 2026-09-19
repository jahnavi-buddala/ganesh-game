import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadApprovedModels } from './approved';
import { resolveMotion } from './rules';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { advance, clears, collect, freshState, hit, move, obstaclePattern, obstacleSpacing, reward, type Obstacle, type RunState } from './rules';

type Entity = { mesh:T.Group; lane:number; kind:Obstacle|'modak'|'om'|'ramp'|'rooftop'; checked:boolean; elevation:number };
const palette = {gold:0xe9aa35, red:0x9e2034, stone:0xba7956, ivory:0xffdfac, pink:0xd8918e};
const geo = {
  box:new RoundedBoxGeometry(1,1,1,2,.035), sphere:new T.SphereGeometry(1,24,18),
  cylinder:new T.CylinderGeometry(1,1,1,20), cone:new T.ConeGeometry(1,1,24),
  plane:new T.PlaneGeometry(1,1), torus:new T.TorusGeometry(1,.07,6,32),
};
const materials = new Map<string,T.MeshStandardMaterial>();
function mat(color:number, glow=0) {
  const key = `${color}:${glow}`;
  if (!materials.has(key)) materials.set(key,new T.MeshStandardMaterial({color,roughness:.72,envMapIntensity:.4,metalness:color===palette.gold?.55:0,emissive:color,emissiveIntensity:glow}));
  return materials.get(key)!;
}
function mesh(parent:T.Object3D, kind:keyof typeof geo, color:number, pos:number[], scale:number[], glow=0) {
  const m=new T.Mesh(geo[kind],mat(color,glow)); m.position.set(pos[0],pos[1],pos[2]);m.scale.set(scale[0],scale[1],scale[2]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function canvasTexture(w:number,h:number,draw:(ctx:CanvasRenderingContext2D)=>void) {
  const c=document.createElement('canvas'); c.width=w;c.height=h;draw(c.getContext('2d')!);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
function label(text:string,w=512,h=160) {
  return canvasTexture(w,h,c=>{c.fillStyle='#732129';c.fillRect(0,0,w,h);c.strokeStyle='#ffc66e';c.lineWidth=8;c.strokeRect(12,12,w-24,h-24);c.font=`bold ${text==='ॐ'?112:46}px Georgia`;c.fillStyle='#ffe0a2';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2);});
}
function panel(parent:T.Object3D, texture:T.Texture, pos:number[],scale:number[]) {
  const m=new T.Mesh(geo.plane,new T.MeshStandardMaterial({map:texture,roughness:.8,side:T.DoubleSide}));m.position.set(pos[0],pos[1],pos[2]);m.scale.set(scale[0],scale[1],1);parent.add(m);return m;
}
function curve(parent:T.Object3D, points:T.Vector3[], radius:number,color:number) {
  const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,6,false),mat(color));parent.add(m);return m;
}
// Batch static scenery by material so rich streets do not require thousands of draw calls.
function batch(group:T.Group) {
  group.updateMatrixWorld(true);
  const byMaterial=new Map<T.Material,T.BufferGeometry[]>();
  group.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)){
    const source=o.geometry.clone().applyMatrix4(o.matrixWorld);const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
    for(const name of Object.keys(geometry.attributes))if(name!=='position'&&name!=='normal')geometry.deleteAttribute(name);
    if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);
    byMaterial.get(o.material)!.push(geometry);
  }});
  const result=new T.Group();
  for(const [material,geometries] of byMaterial){const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(geometry){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;result.add(m);}}
  return result;
}
function modak() {
  const group=new T.Group();
  const points=[new T.Vector2(0,0),new T.Vector2(.3,.04),new T.Vector2(.45,.23),new T.Vector2(.4,.48),new T.Vector2(.22,.75),new T.Vector2(.07,.96),new T.Vector2(0,1.12)];
  const geometry=new T.LatheGeometry(points,36);
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),r=1+.065*Math.cos(a*12);p.setXYZ(i,x*r,p.getY(i),z*r);}
  geometry.computeVertexNormals();
  const body=new T.Mesh(geometry,mat(0xffce47,.45));body.castShadow=true;group.add(body);
  return group;
}
function omGift(){
  const group=new T.Group();
  const texture=canvasTexture(256,256,c=>{const glow=c.createRadialGradient(128,128,8,128,128,124);glow.addColorStop(0,'#fff8cfff');glow.addColorStop(.28,'#ffc83faa');glow.addColorStop(.7,'#ff8a221f');glow.addColorStop(1,'#ff8a2200');c.fillStyle=glow;c.fillRect(0,0,256,256);c.font='bold 138px Georgia';c.textAlign='center';c.textBaseline='middle';c.shadowColor='#ffbd38';c.shadowBlur=24;c.fillStyle='#fff1a6';c.fillText('ॐ',128,137);});
  const symbol=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,toneMapped:false}));symbol.position.y=1.45;symbol.scale.set(3.15,3.15,1);symbol.renderOrder=9;symbol.userData.fallback=true;group.add(symbol);
  const ring=mesh(group,'torus',0xffc640,[0,0,0],[1.05,1.05,1.05],.8);ring.rotation.x=Math.PI/2;
  const outer=mesh(group,'torus',0xffe58c,[0,.04,0],[1.35,1.35,1.35],.6);outer.rotation.x=Math.PI/2;
  const beam=new T.Mesh(new T.CylinderGeometry(.14,.72,6,20,1,true),new T.MeshBasicMaterial({color:0xffcf55,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));beam.position.y=2.2;group.add(beam);
  const light=new T.PointLight(0xffc247,7,13,1.8);light.position.y=1.2;group.add(light);
  return group;
}
function mouse() {
  const g=new T.Group();const fur=0x989095;
  mesh(g,'sphere',fur,[0,.9,0],[.49,.68,.39]);
  mesh(g,'sphere',0xbab0ac,[0,1.65,-.09],[.5,.46,.44]);
  mesh(g,'sphere',0xbab0ac,[0,1.47,-.43],[.27,.24,.37]);
  mesh(g,'sphere',palette.pink,[0,1.51,-.75],[.105,.075,.075]);
  for(const side of [-1,1]) {
    const ear=mesh(g,'sphere',fur,[side*.48,1.98,-.03],[.39,.46,.16]);ear.rotation.z=side*-.22;
    const inside=mesh(g,'sphere',palette.pink,[side*.49,1.99,.1],[.3,.35,.065]);inside.rotation.z=side*-.22;
    mesh(g,'sphere',0x17141b,[side*.29,1.73,-.4],[.1,.13,.065]);
    mesh(g,'sphere',0xffffff,[side*.3,1.77,-.447],[.035,.04,.016]);
    mesh(g,'sphere',fur,[side*.47,.99,-.06],[.12,.34,.14]).rotation.z=side*-.28;
    mesh(g,'sphere',palette.pink,[side*.5,.73,-.16],[.13,.11,.18]);
  }
  const feet=new T.Group();g.add(feet);
  for(const side of [-1,1]) mesh(feet,'sphere',palette.pink,[side*.26,.15,0],[.18,.13,.33]);
  const tail=curve(g,[new T.Vector3(0,.5,.25),new T.Vector3(.22,.26,.8),new T.Vector3(.7,.14,1.1),new T.Vector3(.94,.24,1.45)],.048,palette.pink);
  const capeG=new T.PlaneGeometry(.91,1.06,12,12);const cape=new T.Mesh(capeG,new T.MeshStandardMaterial({color:palette.red,side:T.DoubleSide,roughness:.7}));cape.position.set(0,.94,.4);cape.rotation.x=-.14;g.add(cape);
  curve(g,[new T.Vector3(-.42,1.45,.37),new T.Vector3(-.48,.8,.48),new T.Vector3(-.51,.43,.55),new T.Vector3(0,.38,.61),new T.Vector3(.51,.43,.55),new T.Vector3(.48,.8,.48),new T.Vector3(.42,1.45,.37)],.022,palette.gold);
  panel(g,label('ॐ',256,160),[0,1.03,.455],[.55,.4]);
  mesh(g,'torus',palette.gold,[0,1.48,0],[.4,.27,.4]).rotation.x=Math.PI/2;
  return {g,feet,tail,cape};
}
function obstacle(kind:Obstacle) {
  const g=new T.Group();
  if(kind==='drum') {
    mesh(g,'cylinder',palette.red,[0,.7,0],[.77,1.3,.77]).rotation.z=Math.PI/2;
    for(const x of [-.68,.68]) {
      mesh(g,'cylinder',palette.ivory,[x,.7,0],[.75,.08,.75]).rotation.z=Math.PI/2;
      mesh(g,'torus',palette.gold,[x,.7,0],[.78,.78,.78]).rotation.y=Math.PI/2;
    }
    for(let i=0;i<10;i++){const a=i*Math.PI/5;mesh(g,'box',palette.gold,[0,.7+Math.sin(a)*.76,Math.cos(a)*.76],[1.4,.025,.025]);}
    for(const x of [-.48,.48])mesh(g,'sphere',0x463639,[x,.1,.35],[.17,.17,.17]);
  }else if(kind==='cart'){
    mesh(g,'box',palette.red,[0,1.05,0],[1.9,1.6,2.05]);
    for(const x of [-.91,.91])for(const z of [-.8,.8]){
      mesh(g,'cylinder',0x332730,[x,.35,z],[.33,.17,.33]).rotation.z=Math.PI/2;
      mesh(g,'cylinder',palette.gold,[x,1.65,z],[.055,2.6,.055]);
    }
    mesh(g,'box',palette.red,[0,2.94,0],[2.2,.23,2.35]);
    mesh(g,'sphere',palette.red,[0,2.96,0],[1.15,.4,1.2]);
    mesh(g,'box',palette.gold,[0,1.9,1.05],[1.95,.12,.07]);
    mesh(g,'box',palette.gold,[0,.4,1.05],[1.95,.1,.07]);
    panel(g,label('ॐ'),[0,1.23,1.032],[1.3,1]);
  }else{
    for(const x of [-1,1])mesh(g,'box',0x714841,[x,1.2,0],[.12,2.4,.25]);
    mesh(g,'box',palette.red,[0,1.72,0],[2.3,.58,.28]);
    for(let i=-2;i<=2;i++)mesh(g,'box',palette.ivory,[i*.45,1.72,.16],[.19,.58,.04]).rotation.z=-.4;
    for(const x of [-1,1])mesh(g,'box',palette.gold,[x,.1,0],[.5,.15,.8]);
  }
  return g;
}

export default class FestivalWorld {
  state:RunState=freshState(); startTheme=0;
  scene=new T.Scene();camera=new T.PerspectiveCamera(62,1,.1,210);renderer:T.WebGLRenderer;composer:EffectComposer;bloom:UnrealBloomPass;
  runner=mouse();chunks:T.Group[]=[];entities:Entity[]=[];templates:{[key:string]:T.Group};
  clock=new T.Clock();raf=0;time=0;spawnIn=15;lastTheme=-1;starfield:T.Points;
  pixelRatio=Math.min(devicePixelRatio,navigator.maxTouchPoints>0?1.25:1.5);frameEma=1/60;qualityTimer=0;lastUiSync=0;
  onChange:(s:RunState)=>void;onNotice:(message:string)=>void;
  currentNotice='';noticeTime=0;disposed=false; observer:ResizeObserver;
  audio:AudioContext|null=null;muted=false;beat=0;gateOptions:string[]=[];
  gateResume:'running'|'gate'='running';boundKey:(e:KeyboardEvent)=>void;boundVisibility:()=>void;
  pointer:{x:number;y:number}|null=null;pointerStart:(e:PointerEvent)=>void;pointerEnd:(e:PointerEvent)=>void;
  shrine:T.Group; aura:T.Mesh; blessingHalo:T.Sprite; blessingGroundAura:T.Group; runnerShadow:T.Mesh; themeDecor:T.Group[]=[]; lastMoveTime=-10; fireworks:T.Points[]=[];
  assetsReady:Promise<void>; approved=false; mixer?:T.AnimationMixer; clips:T.AnimationClip[]=[]; motion=''; routeCount=0; patternIndex=0; hitTime=0; hitFlickerTime=0; deathTime=0; introTime=0; blessingVisual=0;
  constructor(public canvas:HTMLCanvasElement,onChange:(s:RunState)=>void,onNotice:(message:string)=>void) {
    this.onChange=onChange;this.onNotice=onNotice;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(this.pixelRatio);this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(1,1),.38,.3,.92);this.composer.addPass(this.bloom);
    const studio=new RoomEnvironment();const pmrem=new T.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(studio,.04).texture;studio.dispose();pmrem.dispose();
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.scene.fog=new T.Fog(0x77759a,40,145);
    this.scene.background=canvasTexture(8,512,c=>{const grd=c.createLinearGradient(0,0,0,512);grd.addColorStop(0,'#29476f');grd.addColorStop(.42,'#86658c');grd.addColorStop(.72,'#f2a06d');grd.addColorStop(1,'#ffd39a');c.fillStyle=grd;c.fillRect(0,0,8,512);});
    const ambient=new T.HemisphereLight(0x8ea8d8,0x6b3c32,.92);this.scene.add(ambient);
    const sun=new T.DirectionalLight(0xff9d4d,2.85);sun.position.set(-15,22,12);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:25,bottom:-25,far:100});sun.shadow.bias=-.0008;this.scene.add(sun);
    const fill=new T.DirectionalLight(0x829ee8,.72);fill.position.set(8,11,-12);this.scene.add(fill);
    this.camera.position.set(0,3.45,10.1);this.camera.lookAt(0,1.4,-5);
    const roadTexture=canvasTexture(512,512,c=>{
      c.fillStyle='#342c33';c.fillRect(0,0,512,512);
      for(let y=0;y<8;y++)for(let x=-1;x<5;x++){
        const n=(x*7+y*11+20)%9;c.fillStyle=`hsl(${285+n*.35},${10+n*.4}%,${20+n*.55}%)`;const px=x*128+(y%2)*64;
        c.fillRect(px+3,y*64+3,122,58);c.fillStyle='#d79d6740';c.fillRect(px+5,y*64+3,117,2);
      }
    });roadTexture.wrapS=roadTexture.wrapT=T.RepeatWrapping;roadTexture.repeat.set(2,4);roadTexture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
    const roadMat=new T.MeshStandardMaterial({map:roadTexture,roughness:.62,bumpMap:roadTexture,bumpScale:.055,color:0xa78988,envMapIntensity:.72});
    const windowTex=canvasTexture(128,256,c=>{
      c.fillStyle='#794a42';c.fillRect(0,0,128,256);c.beginPath();c.moveTo(18,245);c.lineTo(18,90);c.quadraticCurveTo(18,35,64,14);c.quadraticCurveTo(110,35,110,90);c.lineTo(110,245);c.closePath();c.fillStyle='#f8bd67';c.fill();c.strokeStyle='#ddb376';c.lineWidth=9;c.stroke();
      c.fillStyle='#5f3e42';for(let x=32;x<110;x+=18)c.fillRect(x,70,5,180);for(let y=90;y<240;y+=28)c.fillRect(18,y,92,4);
    });
    const signs=['Fresh Modaks','Phool Bazaar','Ganpati Bappa','Morya!','Temple Street'];
    const signTex=signs.map(x=>label(x));
    const glow=canvasTexture(64,64,c=>{const gradient=c.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fff6dfff');gradient.addColorStop(.12,'#ffd66c99');gradient.addColorStop(.45,'#ff981b33');gradient.addColorStop(1,'#ff981b00');c.fillStyle=gradient;c.fillRect(0,0,64,64);});
    const glowMat=new T.SpriteMaterial({map:glow,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.58});
    for(let i=0;i<10;i++){const c=batch(this.makeChunk(roadMat,windowTex,signTex,[0,1,2,0,3,1][i%6]));c.position.z=12-i*18;for(const side of [-1,1])for(const z of [-6,3]){const light=new T.Sprite(glowMat);light.position.set(side*6.2,3.7,z);light.scale.setScalar(2.6);c.add(light);}this.scene.add(c);this.chunks.push(c);}
    this.makeThemeDecor();
    this.shrine=this.makeShrine();this.scene.add(this.shrine);
    this.runner.g.position.z=3;this.scene.add(this.runner.g);
    this.aura=mesh(this.runner.g,'torus',0xffe772,[0,.85,.1],[1.3,1.5,1.3],2);this.aura.visible=false;
    const blessingTexture=new T.TextureLoader().load('/assets/images/blessing_aura.webp');blessingTexture.colorSpace=T.SRGBColorSpace;
    this.blessingHalo=new T.Sprite(new T.SpriteMaterial({map:blessingTexture,color:0xffd36b,transparent:true,opacity:.88,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,toneMapped:false}));
    this.blessingHalo.position.set(0,1.15,.08);this.blessingHalo.scale.setScalar(3.65);this.blessingHalo.visible=false;this.blessingHalo.renderOrder=8;this.runner.g.add(this.blessingHalo);
    const blessingGroundTexture=new T.TextureLoader().load('/assets/images/golden_blessing_ring.png');blessingGroundTexture.colorSpace=T.SRGBColorSpace;
    const groundRing=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:blessingGroundTexture,transparent:true,opacity:.9,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,side:T.DoubleSide}));
    groundRing.position.y=.03;groundRing.rotation.x=-Math.PI/2;groundRing.scale.setScalar(2.8);groundRing.renderOrder=7;
    this.blessingGroundAura=new T.Group();this.blessingGroundAura.position.set(0,0,3);this.blessingGroundAura.visible=false;this.blessingGroundAura.add(groundRing);this.scene.add(this.blessingGroundAura);
    const contact=canvasTexture(128,128,c=>{const gradient=c.createRadialGradient(64,64,8,64,64,62);gradient.addColorStop(0,'#251924aa');gradient.addColorStop(.5,'#25192466');gradient.addColorStop(1,'#25192400');c.fillStyle=gradient;c.fillRect(0,0,128,128);});
    this.runnerShadow=new T.Mesh(new T.PlaneGeometry(2.2,1.65),new T.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,opacity:.8}));this.runnerShadow.rotation.x=-Math.PI/2;this.runnerShadow.position.set(0,.025,3);this.scene.add(this.runnerShadow);
    this.templates={modak:modak(),om:omGift(),drum:obstacle('drum'),cart:obstacle('cart'),barrier:obstacle('barrier')};
    const positions=new Float32Array(360*3);for(let i=0;i<360;i++){positions[i*3]=(Math.random()-.5)*34;positions[i*3+1]=Math.random()*14;positions[i*3+2]=Math.random()*-140;}
    const particles=new T.BufferGeometry();particles.setAttribute('position',new T.BufferAttribute(positions,3));
    this.starfield=new T.Points(particles,new T.PointsMaterial({color:0xffd078,size:.075,transparent:true,opacity:.85}));this.scene.add(this.starfield);
    for(let burst=0;burst<3;burst++){
      const vertices=new Float32Array(80*3);for(let i=0;i<80;i++){const a=i/80*Math.PI*2;vertices[i*3]=Math.cos(a)*(4+Math.random()*3);vertices[i*3+1]=Math.sin(a)*(4+Math.random()*3);vertices[i*3+2]=Math.random()*2;}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(vertices,3));const firework=new T.Points(geometry,new T.PointsMaterial({color:[0xffd580,0xff95ca,0xffd580][burst],size:.23,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));firework.position.set((burst-1)*24,25+burst*3,-90);this.scene.add(firework);this.fireworks.push(firework);
    }
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
    this.boundKey=e=>{const map:Record<string,'left'|'right'|'jump'|'slide'>={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',w:'jump',' ':'jump',ArrowDown:'slide',s:'slide'};
      if(map[e.key]){if((e.target as HTMLElement).closest('input,textarea,select')||(e.key===' '&&(e.target as HTMLElement).closest('button')))return;e.preventDefault();if(!e.repeat)this.action(map[e.key]);}
      if(e.key==='Escape'||e.key.toLowerCase()==='p'){if(this.state.status==='paused')this.resume();else this.pause();}
    };
    this.boundVisibility=()=>{if(document.hidden)this.pause();};window.addEventListener('keydown',this.boundKey);document.addEventListener('visibilitychange',this.boundVisibility);
    this.pointerStart=e=>{this.pointer={x:e.clientX,y:e.clientY};};
    this.pointerEnd=e=>{if(!this.pointer)return;const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;this.pointer=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;this.action(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':'slide');};
    canvas.addEventListener('pointerdown',this.pointerStart);canvas.addEventListener('pointerup',this.pointerEnd);
    this.seed();this.assetsReady=this.installApproved();this.animate();
  }
  async installApproved(){
    const fbx=new FBXLoader();
    const [models,slideSource,jumpSource,deathSource]=await Promise.all([
      loadApprovedModels(),
      fbx.loadAsync('/assets/models/meshy_mushika_slide.fbx'),
      fbx.loadAsync('/assets/models/meshy_mushika_jump.fbx'),
      fbx.loadAsync('/assets/models/meshy_mushika_death.fbx'),
    ]);if(this.disposed)return;
    this.runner.g.clear();const hero=models['meshy-mushika-running'].scene;hero.rotation.y=Math.PI;hero.updateMatrixWorld(true);const heroBounds=new T.Box3().setFromObject(hero),heroSize=heroBounds.getSize(new T.Vector3()),heroCenter=heroBounds.getCenter(new T.Vector3()),heroScale=2.35/Math.max(.001,heroSize.y);hero.scale.setScalar(heroScale);hero.position.set(-heroCenter.x*heroScale,-heroBounds.min.y*heroScale,-heroCenter.z*heroScale);this.runner.g.add(hero,this.aura,this.blessingHalo);
    this.mixer=new T.AnimationMixer(hero);this.clips=models['meshy-mushika-running'].animations.slice(0,1).flatMap(clip=>{const run=clip.clone();run.name='Run';const intro=clip.clone();intro.name='Intro';return[intro,run];});
    const boneMap:Record<string,string>={Hips:'Hips',Spine:'Spine',Spine1:'Spine01',Spine2:'Spine02',Neck:'neck',Head:'Head',LeftShoulder:'LeftShoulder',LeftArm:'LeftArm',LeftForeArm:'LeftForeArm',LeftHand:'LeftHand',RightShoulder:'RightShoulder',RightArm:'RightArm',RightForeArm:'RightForeArm',RightHand:'RightHand',LeftUpLeg:'LeftUpLeg',LeftLeg:'LeftLeg',LeftFoot:'LeftFoot',LeftToeBase:'LeftToeBase',RightUpLeg:'RightUpLeg',RightLeg:'RightLeg',RightFoot:'RightFoot',RightToeBase:'RightToeBase'};
    const retarget=(source:T.Group,name:string)=>{const clip=source.animations[0];if(!clip)return;const tracks=clip.tracks.flatMap(track=>{const match=/^mixamorig([^\.]+)\.(.+)$/.exec(track.name);if(!match)return[];const targetName=boneMap[match[1]],sourceBone=source.getObjectByName(`mixamorig${match[1]}`),targetBone=hero.getObjectByName(targetName);if(!targetName||!sourceBone||!targetBone)return[];const copy=track.clone();copy.name=`${targetName}.${match[2]}`;
      if(match[2]==='quaternion'){
        if(name==='Slide'&&['Hips','Spine','Spine1','Spine2'].includes(match[1]))return[];
        // Mixamo's jump and slide clips contain root-hip roll. On Mushika's
        // differently oriented rig that roll tips the entire character sideways.
        // Preserve a limited forward pitch, but remove root yaw and lateral roll.
        const targetRotation=(targetBone as T.Bone).quaternion.clone(),correction=targetRotation.clone().multiply((sourceBone as T.Bone).quaternion.clone().invert()),pose=new T.Quaternion(),delta=new T.Quaternion(),rootSpace=targetRotation.clone().invert(),euler=new T.Euler(0,0,0,'YXZ');
        for(let i=0;i<copy.values.length;i+=4){pose.fromArray(copy.values,i).premultiply(correction).normalize();if(match[1]==='Hips'&&name!=='Death'){delta.copy(rootSpace).multiply(pose);euler.setFromQuaternion(delta,'YXZ');euler.z=T.MathUtils.clamp(euler.z,-.82,.82);euler.x=0;euler.y=0;delta.setFromEuler(euler);pose.copy(targetRotation).multiply(delta).normalize();}pose.toArray(copy.values,i);}
      }
      else if(match[1]==='Hips'&&match[2]==='position'){const targetPosition=(targetBone as T.Bone).position,baseY=copy.values[1],unitScale=Math.abs(baseY)>.001?targetPosition.y/baseY:.01,minY=name==='Death'?targetPosition.y*.5:-Infinity;for(let i=0;i<copy.values.length;i+=3){copy.values[i]=targetPosition.x;copy.values[i+1]=Math.max(minY,targetPosition.y+(copy.values[i+1]-baseY)*unitScale);copy.values[i+2]=targetPosition.z;}}
      else return[];return[copy];});this.clips.push(new T.AnimationClip(name,clip.duration,tracks));};
    retarget(jumpSource,'Jump');retarget(slideSource,'Slide');retarget(deathSource,'Death');
    const hitClip=models['meshy-mushika-hit'].animations[0]?.clone();if(hitClip){hitClip.name='Hit';this.clips.push(hitClip);}
    const wrap=(id:string,scale:number[])=>{const g=new T.Group();const model=models[id].scene;model.scale.set(scale[0],scale[1],scale[2]);g.add(model);return g;};
    const normalized=(id:string,target:number[])=>{const g=new T.Group(),model=models[id].scene;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=Math.min(target[0]/Math.max(.001,size.x),target[1]/Math.max(.001,size.y),target[2]/Math.max(.001,size.z));model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);g.add(model);return g;};
    const fitted=(id:string,target:number[])=>{const g=new T.Group(),model=models[id].scene;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=new T.Vector3(target[0]/Math.max(.001,size.x),target[1]/Math.max(.001,size.y),target[2]/Math.max(.001,size.z));model.scale.copy(scale);model.position.set(-center.x*scale.x,-bounds.min.y*scale.y,-center.z*scale.z);g.add(model);return g;};
    this.templates.modak=wrap('modak',[1,1,1]);this.templates.cart=wrap('festival-tram',[1,1,1]);
    this.templates.drum=fitted('tribal-drum',[1.75,1.48,1.35]);this.templates.marketCart=fitted('marigold-market-cart',[1.95,1.48,1.75]);this.templates.barrier=fitted('marigold-temple-gate',[2.85,2.5,1.05]);this.templates.ramp=wrap('roof-ramp',[1,1,1]);
    this.templates.rooftop=fitted('temple-rooftop',[2.472,2.67,11]);
    this.templates.lamp=normalized('titanic-lamp',[1.35,4.4,1.35]);
    const omPickup=omGift(),fallback=omPickup.children.find(child=>child.userData.fallback);if(fallback)omPickup.remove(fallback);const omModel=normalized('om-symbol',[1.9,2.35,.85]);omModel.position.y=.12;omPickup.add(omModel);this.templates.om=omPickup;
    // The supplied lantern-path mesh contains broad baked white bands and large
    // yellow markers. Keep the asset available, but use the clearer stone road.
    for(const chunk of this.chunks)for(const side of [-1,1])for(const z of [0]){const lamp=this.templates.lamp.clone();lamp.position.set(side*6.2,.12,z);lamp.rotation.y=side<0?Math.PI:0;chunk.add(lamp);}
    this.shrine.clear();this.shrine.position.z=-114;const deity=models.ganesha.scene;deity.rotation.y=-Math.PI/2;
    deity.updateMatrixWorld(true);const deityBounds=new T.Box3().setFromObject(deity),deitySize=deityBounds.getSize(new T.Vector3()),deityCenter=deityBounds.getCenter(new T.Vector3());
    const deityScale=12/Math.max(.001,deitySize.y);deity.scale.setScalar(deityScale);deity.position.set(-deityCenter.x*deityScale,6-deityBounds.min.y*deityScale,-deityCenter.z*deityScale);this.shrine.add(deity);
    const shrineGlowTexture=canvasTexture(128,128,c=>{const r=c.createRadialGradient(64,64,3,64,64,64);r.addColorStop(0,'#fff7cfff');r.addColorStop(.18,'#ffc64dcc');r.addColorStop(.52,'#ff8b284d');r.addColorStop(1,'#ff8b2800');c.fillStyle=r;c.fillRect(0,0,128,128);});
    const shrineHalo=new T.Sprite(new T.SpriteMaterial({map:shrineGlowTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.8}));shrineHalo.position.set(0,14,-2);shrineHalo.scale.set(30,30,1);this.shrine.add(shrineHalo);
    const shrineGlow=new T.PointLight(0xffb23f,32,60,1.45);shrineGlow.position.set(0,13,6);this.shrine.add(shrineGlow);
    for(let i=0;i<6;i++){mesh(this.shrine,'box',i%2?0xefc378:0xb74649,[0,i+.5,0],[24-i*1.6,1,13-i*.6]);mesh(this.shrine,'box',palette.gold,[0,i+.96,6.5-i*.3],[24-i*1.6,.09,.12]);}
    for(const side of [-1,1]){
      mesh(this.shrine,'cylinder',0xffe1a6,[side*10,9,-1],[.8,18,.8]);
      for(const y of [1,5,12,17])mesh(this.shrine,'cylinder',palette.gold,[side*10,y,-1],[1.2,.4,1.2]);
      for(let i=0;i<5;i++)mesh(this.shrine,'cylinder',i%2?0xf7c969:0xd86043,[side*10,18+i*.8,-1],[2.4-i*.4,.85,2.4-i*.4]);
      mesh(this.shrine,'sphere',palette.gold,[side*10,22,-1],[.35,.7,.35]);
    }
    deity.traverse(o=>{if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.fog=true;}});
    this.approved=true;this.seed();
  }
  makeChunk(roadMat:T.Material,windowTex:T.Texture,signs:T.Texture[],variant=0) {
    const g=new T.Group();const road=new T.Mesh(geo.box,roadMat);road.scale.set(10.6,.2,18);road.position.y=-.15;road.receiveShadow=true;g.add(road);
    for(const x of [-1.55,1.55])for(let z=-8.5;z<9;z+=1.5)mesh(g,'box',0xc88a35,[x,-.026,z],[.035,.016,1.38],.08);
    for(const side of [-1,1]) {
      mesh(g,'box',0xc49b76,[side*7.1,.03,0],[3.65,.28,18]);
      for(let z=-8.8;z<9;z+=.72)mesh(g,'box',0xdfb679,[side*5.38,.12,z],[.3,.3,.65]);
      for(let z=-8.8;z<9;z+=.7)mesh(g,'sphere',z%2>1?0xffbc26:0xe57b17,[side*5.63,.28,z],[.18,.17,.28]);
      for(let index=0;index<3;index++){
        const z=index*6-6, height=7.5+((index+variant)%3)*1.35,facade=(index+variant+(side===1?1:0))%4;const building=new T.Group();building.position.set(side*(9.8+((index+variant)%2)*.45),0,z);building.rotation.y=-side*Math.PI/2;g.add(building);
        mesh(building,'box',[0xc96955,0x4d8b91,0x9f5f7d,0xb67d49][(index+variant)%4],[0,height/2,-1.8],[5.8,height,3.7]);
        for(const y of [3.2,6.5,height]){mesh(building,'box',0xffdba5,[0,y,.1],[6,.25,.7]);mesh(building,'box',0xc56f40,[0,y-.2,.1],[5.9,.12,.48]);}
        for(const x of [-2.6,2.6]){
          mesh(building,'cylinder',0xe0b383,[x,height/2,.3],[.19,height,.19]);
          for(const y of [.3,3.1,6.5])mesh(building,'box',palette.gold,[x,y,.3],[.6,.19,.55]);
        }
        for(const x of [-1.65,0,1.65])for(const y of [4.7,7.7]){if(y>height-1)continue;
          panel(building,windowTex,[x,y,.16],[1.12,2.15]);
          for(const edge of [-.64,.64])mesh(building,'cylinder',0xffe2b3,[x+edge,y-.1,.23],[.085,1.9,.085]);
          const arch=new T.Mesh(new T.TorusGeometry(.64,.095,8,20,Math.PI),mat(0xffe2b3));arch.position.set(x,y+.74,.23);building.add(arch);
          mesh(building,'box',0x347d83,[x,y-.5,.26],[.85,.055,.08]);
          for(const bar of [-.24,0,.24])mesh(building,'box',0x347d83,[x+bar,y-.05,.27],[.035,1.35,.07]);
          mesh(building,'box',0xffd49a,[x,y-1.12,.37],[1.55,.18,.65]);
        }
        mesh(building,'box',0xffd49a,[0,3.65,.65],[5.65,.18,1.25]);
        for(let rail=-2.5;rail<=2.5;rail+=.36)mesh(building,'cylinder',0xffebc5,[rail,4.03,1.15],[.045,.75,.045]);
        mesh(building,'box',0xb2623b,[0,4.43,1.15],[5.55,.10,.14]);
        mesh(building,'box',0x653639,[0,1.5,.11],[4.5,2.7,.14]);
        panel(building,signs[(index+(side===1?2:0))%signs.length],[0,2.9,.6],[4.35,.75]);
        for(let x=-2.5;x<2.6;x+=.5){const a=mesh(building,'box',Math.round(x*2)%2?palette.red:0xdca242,[x,2.7,1.08],[.51,.09,1.4]);a.rotation.x=.22;}
        mesh(building,'box',0x784336,[0,.75,.7],[4.6,.9,1.2]);
        for(let k=0;k<10;k++)mesh(building,'sphere',0xffcf65,[-1.9+k*.4,1.26,.85],[.16,.14,.16]);
        for(let k=0;k<18;k++){const x=-2.5+k*.294;mesh(building,'sphere',0xffaa21,[x,3.82-Math.sin(k/17*Math.PI)*.55,.57],[.14,.13,.14]);}
        if(facade===1){const entry=new T.Mesh(new T.TorusGeometry(1.15,.15,8,24,Math.PI),mat(0xffd27c,.12));entry.position.set(0,1.55,1.25);building.add(entry);}
        if(facade===2)for(const x of [-2,2]){mesh(building,'sphere',0xffc24f,[x,2.2,1.28],[.22,.28,.18],.7);mesh(building,'cylinder',0x704534,[x,1.86,1.2],[.045,.7,.045]);}
        if(facade===3){mesh(building,'box',0x6e4547,[0,1.35,1.29],[4.25,2.05,.12]);for(let y=.48;y<2.3;y+=.28)mesh(building,'box',0xc78a68,[0,y,1.37],[4.1,.035,.04]);}
        for(let level=0;level<5;level++){
          const width=2.25-level*.37;mesh(building,'cylinder',level%2?0xf1ba69:0xc57048,[0,height+.3+level*.48,-1.2],[width,.48,width*.85]);
          mesh(building,'torus',palette.gold,[0,height+.56+level*.48,-1.2],[width,.65,width*.85]).rotation.x=Math.PI/2;
        }
        mesh(building,'sphere',0xfbd887,[0,height+2.65,-1.2],[.32,.5,.32]);
        mesh(building,'cone',palette.gold,[0,height+3.18,-1.2],[.16,.55,.16]);
      }
      for(const z of [-6,3]) {
        mesh(g,'sphere',0x855039,[side*5.75,.35,z+1.5],[.42,.14,.42]);
        mesh(g,'sphere',0xffbe45,[side*5.75,.58,z+1.5],[.08,.27,.08],3);
      }
      // Festival visitors stay on the sidewalks, outside the playable lanes.
      for(let i=0;i<2;i++) {
        const p=new T.Group();p.position.set(side*(7.65+((i+variant)%2)*.68),.18,i*6-5+(variant%3)*.7);p.scale.setScalar(.67+((variant+i)%4)*.045);g.add(p);
        mesh(p,'cone',[0x197c78,0xc23d51,0xe4a035][i],[0,.9,0],[.28,1.25,.22]);
        mesh(p,'sphere',0xba815f,[0,1.72,0],[.17,.2,.16]);
        mesh(p,'sphere',0x39282c,[0,1.87,-.025],[.175,.10,.16]);
        for(const dx of [-.06,.06])mesh(p,'sphere',0x352524,[dx,1.76,.145],[.018,.022,.012]);
        for(const side of [-1,1]){
          mesh(p,'sphere',[0x197c78,0xc23d51,0xe4a035][i],[side*.28,1.20,0],[.10,.28,.10]).rotation.z=side*.22;
          mesh(p,'sphere',0xba815f,[side*.32,.94,.025],[.075,.14,.075]);
          mesh(p,'box',0x5b4141,[side*.1,.22,0],[.12,.44,.15]);
          mesh(p,'sphere',0x382d30,[side*.1,.025,.055],[.09,.06,.16]);
        }
        mesh(p,'box',0xffdc94,[0,1.37,.14],[.09,.35,.035]);
      }
    }
    const points=[];for(let i=0;i<=20;i++){const x=-9+i*.9;points.push(new T.Vector3(x,14-Math.sin(i/20*Math.PI)*1.5,-5));}
    curve(g,points,.022,0x714838);
    for(let i=0;i<=20;i++){
      const x=-9+i*.9,y=14-Math.sin(i/20*Math.PI)*1.5;
      mesh(g,'sphere',0xffd775,[x,y,-5],[.07,.09,.07],2);
      if(i%2===0){const flag=mesh(g,'cone',i%4===0?palette.red:0xf4aa27,[x,y-.4,-5],[.3,.7,.035]);flag.rotation.z=Math.PI;}
    }
    // Small painted rangoli repeated down the paving.
    const rangoli=new T.Group();rangoli.position.set(0,.002,-7);g.add(rangoli);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const p=mesh(rangoli,'torus',i%2?0xdc426b:0xf9b94b,[Math.cos(a)*.45,0,Math.sin(a)*.45],[.37,.37,.37]);p.rotation.x=-Math.PI/2;}
    return g;
  }
  makeThemeDecor() {
    const root=new T.Group();
    for(let theme=0;theme<5;theme++){
      const g=new T.Group();
      if(theme===0){
        for(const side of [-1,1])for(const z of [-5,4]){
          mesh(g,'cylinder',0xc59e79,[side*8.4,2.3,z],[.33,4.6,.33]);
          mesh(g,'sphere',palette.gold,[side*8.4,4.9,z],[.48,.6,.48],.35);
          mesh(g,'torus',0xffcf62,[side*8.4,4.9,z],[.72,.72,.72],.45).rotation.x=Math.PI/2;
        }
      }
      if(theme===1){
        for(const side of [-1,1]){
          mesh(g,'box',0x7b3429,[side*6.9,.6,-2],[1.8,1.1,3]);
          for(let i=0;i<5;i++)for(let j=0;j<3;j++)mesh(g,'sphere',j%2?0xe9bb28:0xe67c32,[side*6.9+(j-1)*.37,1.2,-3+i*.46],[.21,.2,.2]);
          const awning=mesh(g,'box',0xd9a633,[side*7,2.8,-2],[2.1,.14,3.5]);awning.rotation.z=side*.15;
          for(const z of [-3.6,-.4])mesh(g,'cylinder',0x63432e,[side*6.1,1.4,z],[.06,2.8,.06]);
        }
      }
      if(theme===2||theme===3){
        const arc=new T.Mesh(new T.TorusGeometry(7,.16,8,48,Math.PI),mat(theme===2?0xe83d72:palette.gold,.25));arc.position.set(0,5,-2);g.add(arc);
        for(const s of [-1,1])mesh(g,'cylinder',theme===2?0xca3569:palette.gold,[s*7,2.5,-2],[.18,5,.18]);
        for(let i=0;i<=28;i++){const a=i/28*Math.PI;mesh(g,'sphere',i%2?0xffb427:0xf05374,[Math.cos(a)*7,5+Math.sin(a)*7,-1.9],[.19,.19,.19],.15);}
        if(theme===3)for(const s of [-1,1])for(let i=0;i<3;i++)mesh(g,'sphere',0xef3d74,[s*(6.2+i*.4),.18,1],[.19,.1,.25]);
      }
      if(theme===4){
        for(const side of [-1,1])mesh(g,'box',0x7e6e65,[side*8,11,0],[3,1,18]);
        for(const s of [-1,1])for(const z of [-6,3]){
          mesh(g,'cylinder',0x92795e,[s*6.7,5.1,z],[.55,10.2,.55]);
          for(const y of [.4,4.7,9.5])mesh(g,'box',0xd4ad6c,[s*6.7,y,z],[1.4,.4,1.4]);
        }
        const arc=new T.Mesh(new T.TorusGeometry(6.6,.4,8,48,Math.PI),mat(0xd2a674));arc.position.set(0,4,-6);g.add(arc);
      }
      const optimized=batch(g);optimized.userData.theme=theme;root.add(optimized);
    }
    for(let i=0;i<10;i++){const c=root.clone();c.position.z=12-i*18;this.scene.add(c);this.themeDecor.push(c);}
  }
  makeShrine() {
    const g=new T.Group();g.position.set(0,0,-94);
    for(const side of [-1,1]){
      mesh(g,'box',0xce986e,[side*8,7,0],[4,14,5]);
      for(let i=0;i<5;i++)mesh(g,'cylinder',i%2?palette.gold:0xd4a782,[side*8,14+i*1.4,0],[2.8-i*.45,1.4,2.8-i*.45]);
      mesh(g,'cone',palette.gold,[side*8,21.6,0],[.7,2,.7]);
      panel(g,label('ॐ'),[side*8,10,2.55],[2.5,2]);
    }
    mesh(g,'box',0xcb8769,[0,13,0],[18,2,4]);
    const arch=mesh(g,'torus',palette.gold,[0,5,1],[6,7,1]);
    arch.material=mat(palette.gold,.1);
    const deity=new T.Group();deity.position.set(0,15,1);g.add(deity);
    mesh(deity,'sphere',0xedb38a,[0,1.4,0],[1.7,2,.7]);
    mesh(deity,'sphere',0xf2bd91,[0,4,0],[1.15,1.25,.7]);
    for(const s of [-1,1]){
      mesh(deity,'sphere',0xeaa780,[s*1.15,3.9,0],[.95,1.1,.3]);
      mesh(deity,'sphere',0xeaa780,[s*1.7,1.6,0],[.45,1.1,.4]).rotation.z=s*.7;
      mesh(deity,'sphere',palette.red,[s*1.25,-.1,0],[1.35,.5,.7]);
      mesh(deity,'sphere',0x684839,[s*.38,4.2,.66],[.08,.07,.04]);
    }
    curve(deity,[new T.Vector3(0,3.8,.65),new T.Vector3(0,2.9,1),new T.Vector3(.5,2.35,1),new T.Vector3(.75,2.65,1)],.22,0xf2bd91);
    mesh(deity,'cone',palette.gold,[0,5.6,0],[1.1,1.7,.7]);
    mesh(deity,'torus',palette.gold,[0,3,.1],[2.9,3.2,1],.5);
    return g;
  }
  seed(){for(const e of this.entities)this.scene.remove(e.mesh);this.entities=[];this.routeCount=0;for(const lane of [-1,0,1])for(let z=-10-lane*2;z>-34;z-=7)this.add('modak',lane,z);this.add('drum',-1,-42);this.add('barrier',0,-54);this.add('drum',1,-66,0,'marketCart');this.add('cart',0,-80);}
  addRoute(lane:number,z:number){this.add('ramp',lane,z);this.add('cart',lane,z-4.1);this.add('rooftop',lane,z-11.9);for(let i=0;i<6;i++)this.add('modak',lane,z-3-i*2.4,2.67);}
  add(kind:Entity['kind'],lane:number,z:number,elevation=0,appearance?:string){const selected=this.templates[appearance||kind]||this.templates[kind];if(!selected)return;const mesh=selected.clone();mesh.position.set(lane*3.1,kind==='modak'?.75+elevation:kind==='om'?elevation:0,z);mesh.userData.appearance=selected===this.templates[appearance||kind]?(appearance||kind):kind;this.scene.add(mesh);this.entities.push({mesh,lane,kind,checked:false,elevation});}
  resetRunnerPose(intro:boolean){this.runner.g.position.set(0,0,3);this.runner.g.rotation.set(0,0,0);this.runner.g.scale.set(1,1,1);this.runner.g.visible=true;this.runnerShadow.position.set(0,.025,3);this.runnerShadow.scale.setScalar(1);this.blessingGroundAura.visible=false;this.blessingVisual=0;this.mixer?.stopAllAction();this.motion='';if(intro&&this.mixer){const clip=T.AnimationClip.findByName(this.clips,'Intro');if(clip){const action=this.mixer.clipAction(clip);action.reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();this.motion='Intro';this.mixer.update(0);}}}
  start(theme=0) {if(!this.approved){this.notice('Loading the approved 3D models…');return;}this.startTheme=theme;this.state=freshState(theme);this.state.status='running';this.spawnIn=18;this.patternIndex=0;this.lastMoveTime=-10;this.hitTime=0;this.hitFlickerTime=0;this.deathTime=0;this.introTime=1.45;this.seed();this.resetRunnerPose(true);const portrait=this.camera.aspect<.8;this.camera.position.set(-2.8,portrait?4.4:2.75,portrait?12.0:8.4);this.camera.lookAt(0,1.35,-5);this.clock.getDelta();this.enableAudio();this.notice('Ganpati Bappa Morya!');this.tone(523.25,.18);this.onChange({...this.state});}
  menu(){this.state=freshState(this.startTheme);this.patternIndex=0;this.hitTime=0;this.hitFlickerTime=0;this.deathTime=0;this.introTime=0;this.seed();this.resetRunnerPose(false);this.onChange({...this.state});}
  pause(){if(this.state.status==='running'||this.state.status==='gate'){this.gateResume=this.state.status;this.state.status='paused';this.onChange({...this.state});}}
  resume(){if(this.state.status==='paused'){this.state.status=this.gateResume;this.clock.getDelta();this.onChange({...this.state});}}
  action(action:'left'|'right'|'jump'|'slide'){if(this.state.status==='running'&&this.introTime<=0){this.hitTime=0;if(action==='left'||action==='right')this.lastMoveTime=this.state.elapsed;}move(this.state,action);}
  choose(value:string){if(this.state.status!=='gate')return;this.state.status='running';if(value==='modak'){collect(this.state);const result=reward(this.state);this.state.blessing=10;this.notice(result==='maha'?'Correct! Maha Aashirwad activated!':'Correct! Blessing Mode activated!');this.tone(660,.22);}else{this.state.combo=0;this.state.blessing=0;this.state.maha=false;this.state.invincible=0;hit(this.state);this.notice(value==='timeout'?'The gate closed. Keep going!':'That answer was not correct. Keep going!');}this.onChange({...this.state});}
  celebrate(prefix:string){reward(this.state);this.notice(`${prefix}  +150`);this.tone(660,.17);}
  notice(message:string){this.currentNotice=message;this.noticeTime=2.7;this.onNotice(message);}
  enableAudio(){if(!this.audio){try{this.audio=new AudioContext();}catch{}}if(this.audio?.state==='suspended')void this.audio.resume();}
  tone(freq:number,length=.08){if(this.muted||!this.audio)return;const a=this.audio,o=a.createOscillator(),gain=a.createGain();o.type='sine';o.frequency.setValueAtTime(freq,a.currentTime);gain.gain.setValueAtTime(.035,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+length);o.connect(gain);gain.connect(a.destination);o.start();o.stop(a.currentTime+length);}
  resize(){const {width,height}=this.canvas.getBoundingClientRect();if(!width||!height)return;this.renderer.setSize(width,height,false);this.composer.setSize(width,height);this.camera.aspect=width/height;const portrait=width/height<.8;this.camera.fov=portrait?66:62;this.camera.position.z=portrait?12.6:10.1;this.camera.position.y=portrait?4.9:3.45;this.camera.updateProjectionMatrix();}
  animate=()=>{
    if(this.disposed)return;this.raf=requestAnimationFrame(this.animate);const rawDt=this.clock.getDelta(),dt=Math.min(rawDt,.05);this.time+=dt;
    this.frameEma+=((Math.min(rawDt,.1))-this.frameEma)*.045;this.qualityTimer+=rawDt;
    if(this.qualityTimer>2){this.qualityTimer=0;const ceiling=Math.min(devicePixelRatio,navigator.maxTouchPoints>0?1.25:1.5);let next=this.pixelRatio;if(this.frameEma>.023)next=Math.max(1,next-.15);else if(this.frameEma<.018)next=Math.min(ceiling,next+.1);if(Math.abs(next-this.pixelRatio)>.01){this.pixelRatio=next;this.renderer.setPixelRatio(next);}}
    const s=this.state;const was=s.status;const before={...s};
    const introActive=was==='running'&&this.introTime>0;if(introActive)this.introTime=Math.max(0,this.introTime-dt);
    let travel=advance(s,introActive?0:dt,this.startTheme)||0;
    if(was==='running'){
      const requested=travel;const result=resolveMotion(s,before,this.entities.map(e=>({kind:e.kind,x:e.lane*3.1,z:e.mesh.position.z,disabled:!e.mesh.visible||e.mesh.userData.hit===true})),requested);
      travel=result.travel;s.distance=before.distance+travel;s.score=before.score+travel*(s.maha&&s.blessing>0?4:2);
      if(result.blocked>=0){const obstacle=this.entities[result.blocked];if(s.blessing>0){obstacle.mesh.visible=false;obstacle.checked=true;this.notice('Blessing cleared the path!');}else if(hit(s)){obstacle.checked=true;obstacle.mesh.userData.hit=true;if(s.hearts<=0){s.status='dying';this.deathTime=3.08;this.hitTime=0;this.hitFlickerTime=0;for(const entity of this.entities)if(entity.kind!=='modak'&&entity.mesh.position.z>-4&&entity.mesh.position.z<8)entity.mesh.visible=false;this.onNotice('');this.tone(105,.7);}else{this.hitTime=1.6;this.hitFlickerTime=.34;this.notice(`Blocked by ${obstacle.mesh.userData.appearance==='marketCart'?'market cart':obstacle.kind}! Jump, slide, or change lanes`);this.tone(160,.22);}}}
    }
    if(was==='running'&&s.nextGate!==before.nextGate){const giftLane=((Math.floor(s.elapsed/120)+this.patternIndex)%3-1) as -1|0|1;this.add('om',giftLane,-72);this.notice('A sacred Om gift has appeared!');this.tone(784,.28);}
    if(s.status==='running'){
      for(const c of this.chunks){c.position.z+=travel;if(c.position.z>30)c.position.z-=180;}
      for(const c of this.themeDecor){c.position.z+=travel;if(c.position.z>30)c.position.z-=180;}
      this.spawnIn-=travel;
      if(this.spawnIn<=0){const lane=Math.floor(Math.random()*3)-1;this.routeCount++;const routeEvery=s.distance>1200?4:s.distance>600?5:6,route=this.approved&&this.routeCount%routeEvery===0;this.spawnIn=route?Math.max(25,34-s.distance/300):obstacleSpacing(s.distance)+Math.random()*2.5;if(route)this.addRoute(lane,-147);else{const pattern=obstaclePattern(this.patternIndex++,s.distance);for(const item of pattern.obstacles)this.add(item.kind,item.lane,-147,0,item.appearance);for(let i=0;i<6;i++)this.add('modak',pattern.safeLane,-151-i*3.2);}}
      for(const e of this.entities){
        e.mesh.position.z+=travel;
        if(e.kind==='modak'){e.mesh.rotation.y+=dt;e.mesh.position.y=e.elevation+.85+Math.sin(this.time*3+e.mesh.position.z)*.12;}
        if(e.kind==='om'){e.mesh.rotation.y+=dt*.9;e.mesh.position.y=e.elevation+.12+Math.sin(this.time*2.4)*.12;const pulse=1+Math.sin(this.time*4)*.06;e.mesh.scale.setScalar(pulse);}
        const dx=Math.abs(s.x-e.lane*3.1),dz=e.mesh.position.z-3;
        if(!e.checked&&dz>(e.kind==='modak'?-.65:e.kind==='cart'?2.75:e.kind==='rooftop'?5.9:1.2)){
          e.checked=true;
          if(e.kind==='modak'){
            if((dx<1.2&&Math.abs(s.jump-e.elevation)<1.7)||s.blessing>0){collect(s);e.mesh.visible=false;this.tone(940+s.modaks%4*120);}
          }else if(e.kind==='om'){
            if(dx<1.2){s.blessing=10;s.maha=true;s.score+=500;e.mesh.visible=false;this.notice('Maha Aashirwad Mode activated!');this.tone(1046.5,.36);}
          }else if(e.kind==='ramp'){
            // A ramp is traversable, never an impact obstacle.
          }else if(dx<1.18){
            if((e.kind==='cart'||e.kind==='rooftop')&&s.jump>=2.02||e.kind!=='rooftop'&&clears(s,e.kind)){if(s.blessing<=0)this.celebrate('Beautiful dodge!');}
          }else if(dx<3.8&&s.elapsed-this.lastMoveTime<.65&&s.blessing<=0){this.celebrate('Near miss!');}
        }
      }
      this.entities=this.entities.filter(e=>{if(e.mesh.position.z>18){this.scene.remove(e.mesh);return false;}return true;});
      this.beat+=dt;if(this.beat>1.1){this.beat=0;this.tone([196,246.94,293.66,392][Math.floor(s.elapsed)%4],.18);}
    }
    if(s.theme!==this.lastTheme){this.lastTheme=s.theme;const tones=[0x77769b,0x716f98,0x80759f,0x73709a,0x5e5e82];(this.scene.fog as T.Fog).color.setHex(tones[s.theme]);(this.scene.fog as T.Fog).near=s.theme===4?36:42;(this.scene.fog as T.Fog).far=s.theme===4?120:145;for(const c of this.themeDecor)for(const decoration of c.children)decoration.visible=decoration.userData.theme===s.theme;this.shrine.visible=true;if(s.distance>2)this.notice(['Temple Street','Market Street','Festival Avenue','Pandal Zone','Temple Corridor'][s.theme]);}
    const running=s.status==='running', phase=this.time*(s.blessing>0?22:17);
    this.runner.g.position.x=s.x;this.runner.g.position.y=s.jump+(s.ground>0?.14:0)+(running?Math.abs(Math.sin(phase))*.07:Math.sin(this.time*2)*.025);
    this.runnerShadow.position.set(s.x,s.ground+.025,3);this.runnerShadow.scale.setScalar(1+Math.max(0,s.jump-s.ground)*.12);(this.runnerShadow.material as T.MeshBasicMaterial).opacity=.8/(1+Math.max(0,s.jump-s.ground)*.7);
    this.blessingGroundAura.position.set(s.x,s.ground,3);this.blessingGroundAura.rotation.y+=dt*.22;const blessingTarget=s.blessing>0?1:0;this.blessingVisual+=(blessingTarget-this.blessingVisual)*Math.min(1,dt*(blessingTarget?6:2.8));this.blessingGroundAura.visible=this.blessingVisual>.015;const ring=this.blessingGroundAura.children[0] as T.Mesh,ringMaterial=ring.material as T.MeshBasicMaterial;ringMaterial.opacity=this.blessingVisual*(s.maha?.98:.82);const ringPulse=2.8*(1+Math.sin(this.time*3.2)*.035*this.blessingVisual);ring.scale.setScalar(ringPulse);
    this.runner.g.scale.y=1;this.runner.g.rotation.z=(s.lane*3.1-s.x)*-.08;
    if(s.status==='dying'){this.deathTime=Math.max(0,this.deathTime-dt);if(this.deathTime===0){s.status='over';this.onChange({...s});}}
    if(this.mixer&&s.status!=='paused'&&s.status!=='gate'&&s.status!=='over'){const airborne=s.jump>s.ground+.05;this.hitTime=Math.max(0,this.hitTime-dt);const motion=s.status==='dying'?'Death':introActive?'Intro':!running?'Idle':this.hitTime>0?'Hit':s.slide>0?'Slide':airborne?'Jump':'Run';if(motion!==this.motion){const previous=this.motion?this.mixer.clipAction(T.AnimationClip.findByName(this.clips,this.motion)):undefined;const clip=T.AnimationClip.findByName(this.clips,motion);if(clip){const action=this.mixer.clipAction(clip);action.enabled=true;action.setEffectiveWeight(1);action.setEffectiveTimeScale(1);if(motion==='Jump'||motion==='Slide'||motion==='Hit'||motion==='Death'||motion==='Intro'){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}else{action.setLoop(T.LoopRepeat,Infinity);action.clampWhenFinished=false;}if(motion==='Slide')action.timeScale=clip.duration/.85;if(motion==='Intro')action.timeScale=Math.max(.55,clip.duration/1.45);action.reset().fadeIn(.16).play();previous?.fadeOut(.16);}this.motion=motion;}this.mixer.update(dt);}
    this.runner.feet.children.forEach((f,i)=>{f.position.z=running?Math.sin(phase+i*Math.PI)*.24:0;f.position.y=.15+(running?Math.max(0,Math.cos(phase+i*Math.PI))*.15:0);});
    this.runner.tail.rotation.y=Math.sin(this.time*6)*.15;
    const p=this.runner.cape.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*6+this.time*10)*.045*(1-p.getY(i)));p.needsUpdate=true;
    this.hitFlickerTime=Math.max(0,this.hitFlickerTime-dt);const flickerElapsed=.34-this.hitFlickerTime;this.runner.g.visible=this.hitFlickerTime<=0||flickerElapsed<.08||flickerElapsed>=.2;this.aura.visible=false;this.blessingHalo.visible=false;
    const pos=this.starfield.geometry.attributes.position;if(running)for(let i=0;i<pos.count;i++){let z=pos.getZ(i)+travel*.7;if(z>12)z=-140;pos.setZ(i,z);pos.setY(i,(pos.getY(i)+dt*.15)%14);}pos.needsUpdate=true;
    (this.starfield.material as T.PointsMaterial).color.setHex(s.maha?0xff7f9a:0xffd078);(this.starfield.material as T.PointsMaterial).size=s.maha?.17:.075;
    if(s.maha&&running)for(let i=0;i<pos.count;i++)pos.setY(i,(pos.getY(i)-dt*2+14)%14);
    this.fireworks.forEach((f,i)=>{const phase=(this.time+i*1.7)%6/6;f.visible=s.theme!==4;f.scale.setScalar(.15+phase);(f.material as T.PointsMaterial).opacity=Math.sin(phase*Math.PI)*.8;});
    if(s.status==='dying'){const cinematic=new T.Vector3(s.x+2.15,2.2+s.ground,.15);this.camera.position.lerp(cinematic,Math.min(1,dt*4.2));this.camera.lookAt(s.x,1.05+s.ground,3);}
    else if(introActive){const progress=1-this.introTime/1.45,eased=1-Math.pow(1-progress,3),portrait=this.camera.aspect<.8;this.camera.position.x=T.MathUtils.lerp(-2.8,0,eased);this.camera.position.y=T.MathUtils.lerp(portrait?4.4:2.75,portrait?4.9:3.45,eased);this.camera.position.z=T.MathUtils.lerp(portrait?12.0:8.4,portrait?12.6:10.1,eased);this.camera.lookAt(T.MathUtils.lerp(s.x,0,eased),1.35,-5);}
    else{this.camera.position.x+=(s.x*.14-this.camera.position.x)*dt*4;const targetHeight=(this.camera.aspect<.8?4.9:3.45)+s.ground*.78,targetZ=this.camera.aspect<.8?12.6:10.1;this.camera.position.y+=(targetHeight-this.camera.position.y)*Math.min(1,dt*6);this.camera.position.z+=(targetZ-this.camera.position.z)*Math.min(1,dt*6);this.camera.lookAt(this.camera.position.x*.35,1.4+s.ground*.68,-5);}
    if(this.noticeTime>0&&s.status!=='paused'){this.noticeTime-=dt;if(this.noticeTime<=0)this.onNotice('');}
    this.composer.render();if(this.time-this.lastUiSync>=.08||s.status!==was){this.lastUiSync=this.time;this.onChange({...s});}
  }
  dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();window.removeEventListener('keydown',this.boundKey);document.removeEventListener('visibilitychange',this.boundVisibility);this.canvas.removeEventListener('pointerdown',this.pointerStart);this.canvas.removeEventListener('pointerup',this.pointerEnd);void this.audio?.close();
    this.composer.dispose();const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();
    const release=(o:T.Object3D)=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Sprite){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);}}};
    this.scene.traverse(release);Object.values(this.templates).forEach(t=>t.traverse(release));if(this.scene.background instanceof T.Texture)textures.add(this.scene.background);if(this.scene.environment)textures.add(this.scene.environment);geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());materials.clear();this.renderer.dispose();
  }
}
