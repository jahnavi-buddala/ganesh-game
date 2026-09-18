import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Review assets only. Nothing in the running game imports this workbench.
const here=path.dirname(fileURLToPath(import.meta.url));
const output=path.resolve(here,'../public/model-review-v1');
mkdirSync(path.join(output,'models'),{recursive:true});
class Reader {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}
}
globalThis.FileReader=Reader;
let seed=812;
const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const v=p=>new T.Vector3(...p);
const C={gold:0xd6a042,lightGold:0xf3cf76,red:0x98152c,deepRed:0x570e20,fur:0x929091,pink:0xd98e96,skin:0xe1a07e,ivory:0xf7e6c5};
function material(name,color,roughness=.65,metalness=0,extra={}){const m=new T.MeshPhysicalMaterial({color,roughness,metalness,...extra});m.name=name;return m;}
const M={
 fur:material('Mushika • warm silver fur',0x858185,.93,0,{sheen:.22,sheenColor:new T.Color(0xb9b1aa),sheenRoughness:.8}),
 cream:material('Mushika • cream muzzle',0xc8c0b4,.92,0,{sheen:.5}),
 pink:material('Rose velvet ears and paws',C.pink,.66,0),
 ear:material('Ear inner warm rose',0xc97980,.78,0),
 nose:material('Soft rose nose',0xc97982,.34,0,{clearcoat:.25}),
 red:material('Crimson woven silk',C.red,.48,0,{sheen:.75,sheenColor:new T.Color(0xf88769),sheenRoughness:.65}),
 darkRed:material('Oxblood lacquer',C.deepRed,.35,0,{clearcoat:.4}),
 gold:material('Antique golden embroidery',C.gold,.33,.76),
 goldLight:material('Polished gold edges',C.lightGold,.25,.78),
 ivory:material('Warm ivory',C.ivory,.45),
 black:material('Warm charcoal',0x171217,.75),
 sclera:material('Pearl eye whites',0xfff2dc,.24,0,{clearcoat:.8,clearcoatRoughness:.1}),
 iris:material('Amber brown irises',0x79411c,.22,0,{clearcoat:1,clearcoatRoughness:.04}),
 pupil:material('Glossy black pupils',0x100c0a,.08,0,{clearcoat:1}),
 glint:material('Eye catchlights',0xffffff,.12,0,{emissive:0x888888,emissiveIntensity:.22}),
 skin:material('Ganesha • peach clay',C.skin,.58,0,{sheen:.2,sheenColor:new T.Color(0xefbf9d)}),
 skinLight:material('Ganesha • warm highlights',0xe5aa87,.63),
 rose:material('Ganesha • ear inner',0xc78571,.8),
 ruby:material('Ruby glass',0xa60829,.18,.25,{clearcoat:1}),
 emerald:material('Emerald glass',0x147969,.2,.3,{clearcoat:1}),
 marigold:material('Marigold saffron',0xf8a326,.82),
 petal:material('Lotus rose petals',0xdf6587,.69),
 stone:material('Carved sandstone',0x956d58,.94),
 wood:material('Deep teak',0x4d2721,.74),
 modak:material('Modak • warm golden sweet',0xf9c959,.46,0,{sheen:.2}),
 glass:material('Indigo carriage windows',0x1a4353,.16,.2,{clearcoat:1}),
 rubber:material('Wheels',0x2b2530,.89),
};
function group(parent,name,pos=[0,0,0]){const g=new T.Group();g.name=name;g.position.copy(v(pos));parent?.add(g);return g;}
function mesh(parent,geometry,mat,name=''){const m=new T.Mesh(geometry,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent?.add(m);return m;}
function ellipsoid(parent,pos,scale,mat,name='',detail=40){const m=mesh(parent,new T.SphereGeometry(1,detail,Math.floor(detail*.7)),mat,name);m.position.copy(v(pos));m.scale.copy(v(scale));return m;}
function box(parent,pos,scale,mat,round=.04,name=''){const m=mesh(parent,new RoundedBoxGeometry(...scale,2,Math.min(round,...scale.map(x=>x/2))),mat,name);m.position.copy(v(pos));return m;}
function tube(parent,points,radius,mat,name='',segments=32){const curve=new T.CatmullRomCurve3(points.map(v));return mesh(parent,new T.TubeGeometry(curve,segments,radius,7,false),mat,name);}
function ring(parent,pos,radius,thick,mat,scale=[1,1,1]){const m=mesh(parent,new T.TorusGeometry(radius,thick,8,64),mat);m.position.copy(v(pos));m.scale.copy(v(scale));return m;}
function cylinder(parent,pos,rt,rb,height,mat,segments=48){const m=mesh(parent,new T.CylinderGeometry(rt,rb,height,segments),mat);m.position.copy(v(pos));return m;}
function swept(parent,points,radii,mat,name='',sides=20,steps=56){
 const curve=new T.CatmullRomCurve3(points.map(v));const frames=curve.computeFrenetFrames(steps,false);const positions=[],indices=[];
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPointAt(t),rIndex=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(rIndex)),f=rIndex-j,r=T.MathUtils.lerp(radii[j],radii[j+1],f);
  for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,q=p.clone().addScaledVector(frames.normals[i],-Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);positions.push(q.x,q.y,q.z);if(i<steps&&k<sides){const n=i*(sides+1)+k;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(parent,geo,mat,name);
}
function batchStatic(g){
 g.updateMatrixWorld(true);const mats=new Map();
 g.traverse(o=>{if(o.isMesh){let geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geometry.index)geometry=geometry.toNonIndexed();geometry.deleteAttribute('uv');if(!mats.has(o.material))mats.set(o.material,[]);mats.get(o.material).push(geometry);}});
 const out=new T.Group();out.name=g.name;
 for(const [mat,geometries] of mats){const merged=mergeGeometries(geometries);if(!merged)throw new Error('Static batching failed for '+mat.name);mesh(out,merged,mat,mat.name);geometries.forEach(g=>g.dispose());}
 return out;
}
// A real vector Om glyph, taken from the installed Devanagari font, not an image decal.
const glyphCmd=`Add-Type -AssemblyName System.Drawing
$gp=[System.Drawing.Drawing2D.GraphicsPath]::new()
$gp.AddString([string][char]0x0950,[System.Drawing.FontFamily]::new('Nirmala UI'),0,100,[System.Drawing.PointF]::new(0,0),[System.Drawing.StringFormat]::GenericDefault)
$pts=@();for($i=0;$i -lt $gp.PointCount;$i++){$pts+=,@($gp.PathPoints[$i].X,$gp.PathPoints[$i].Y,[int]$gp.PathTypes[$i])}
ConvertTo-Json -InputObject $pts -Compress`;
const glyph=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',glyphCmd],{encoding:'utf8',windowsHide:true}));
function om(parent,pos,size,mat=M.goldLight){
 const shapes=[],x0=69.58,y0=59.2;let shape;
 for(let i=0;i<glyph.length;i++){const [x,y,type]=glyph[i],kind=type&7;if(kind===0){shape=new T.Shape();shape.moveTo(x-x0,y0-y);shapes.push(shape);}else if(kind===1)shape.lineTo(x-x0,y0-y);else if(kind===3){const b=glyph[++i],c=glyph[++i];shape.bezierCurveTo(x-x0,y0-y,b[0]-x0,y0-b[1],c[0]-x0,y0-c[1]);if(c[2]&128)shape.closePath();}if(type&128)shape.closePath();}
 const geo=new T.ExtrudeGeometry(shapes,{depth:.7,bevelEnabled:true,bevelThickness:.25,bevelSize:.25,bevelSegments:2,curveSegments:10});geo.scale(size/100,size/100,size/100);const m=mesh(parent,geo,mat,'Embroidered Om');m.position.copy(v(pos));return m;
}
// Fine tapered fur strips follow each sculpted surface and retain real geometry in GLB.
function fur(parent,center,scale,count,color=0xa7a29c,mask=()=>true){
 const positions=[],colors=[],base=new T.Color(color);
 for(let i=0;i<count;i++){
  const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y),n=new T.Vector3(r*Math.cos(a),y,r*Math.sin(a));if(!mask(n))continue;
  const p=new T.Vector3(n.x*scale[0]+center[0],n.y*scale[1]+center[1],n.z*scale[2]+center[2]);
  const normal=new T.Vector3(n.x/scale[0],n.y/scale[1],n.z/scale[2]).normalize();
  let flow=new T.Vector3(n.x*.2,-.65,n.z*.12);flow.addScaledVector(normal,-flow.dot(normal)).normalize();
  const len=.012+rand()*.022;const end=p.clone().addScaledVector(normal,len*.62).addScaledVector(flow,len);
  const side=new T.Vector3().crossVectors(normal,flow).normalize().multiplyScalar(.0016+rand()*.0015);
  positions.push(p.x-side.x,p.y-side.y,p.z-side.z,p.x+side.x,p.y+side.y,p.z+side.z,end.x,end.y,end.z);
  const c=base.clone().multiplyScalar(.77+rand()*.48);for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const fm=material('Fine geometric fur',0xb0a8a3,.92,0,{vertexColors:true,side:T.DoubleSide,sheen:.15,sheenColor:new T.Color(0xc8c1b8)});return mesh(parent,geo,fm,'Fine fur');
}
function ear(parent,side){
 const g=group(parent,side<0?'Ear_L':'Ear_R',[side*.51,.32,-.1]);g.rotation.z=side*-.23;g.rotation.y=side*.18;
 ellipsoid(g,[0,0,-.06],[.39,.43,.06],M.fur,'Furry outer ear');fur(g,[0,0,-.06],[.392,.432,.062],1800,0xa19a96,n=>n.z<.25||Math.abs(n.y)>.8);
 const positions=[],indices=[],steps=20,sides=64;
 for(let j=0;j<=steps;j++){const r=j/steps;for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;positions.push(Math.cos(a)*r*.319,Math.sin(a)*r*.36,.012+.025*r*r+Math.sin(a*2)*r*.005);if(j<steps&&i<sides){const n=j*(sides+1)+i;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,M.pink,'Sculpted inner ear');
 ring(g,[0,0,.026],1,.023,M.fur,[.333,.375,1]);
 tube(g,[[-.16,-.27,.04],[-.08,-.15,.027],[.02,-.1,.021],[.04,.03,.02]],.007,M.ear,'Ear fold',20);
 return g;
}
function eyes(parent,y,z,x=.285,scale=1,ganesha=false){
 for(const side of [-1,1]){
  const g=group(parent,ganesha?'GaneshaEye'+side:'Eye'+side,[side*x,y,z]);g.rotation.y=side*(ganesha?.12:.36);g.rotation.z=side*(ganesha?.07:-.08);g.scale.setScalar(scale);
  ellipsoid(g,[0,0,0],[.185,.215,.112],ganesha?M.skinLight:M.cream,'Eye socket');
  ellipsoid(g,[0,0,.035],[.15,ganesha?.092:.177,.092],M.sclera,'Sclera');
  ellipsoid(g,[-side*.012,-.007,.117],[ganesha?.061:.117,ganesha?.069:.140,.038],M.iris,'Amber iris');
  ellipsoid(g,[-side*.012,-.003,.15],[ganesha?.034:.078,ganesha?.047:.099,.022],M.pupil,'Pupil');
  ellipsoid(g,[-.027,.054,.17],[.025,.032,.012],M.glint,'Catchlight');
  ellipsoid(g,[.032,-.041,.168],[.009,.013,.009],M.glint,'Small catchlight');
  tube(g,[[-.14,.03,.052],[-.10,ganesha?.097:.166,.062],[0,ganesha?.119:.196,.05],[.10,ganesha?.088:.152,.064],[.145,.025,.045]],ganesha?.013:.011,ganesha?M.black:M.fur,'Upper eyelid',28);
  if(ganesha)tube(g,[[-.15,.145,.013],[0,.193,.014],[.15,.14,.006]],.022,M.black,'Eyebrow',24);
 }
}
function makeMushika(){
 const root=group(null,'Mushika');const body=group(root,'Body');
 ellipsoid(body,[0,.93,-.025],[.40,.57,.35],M.fur,'Pear-shaped body',56);fur(body,[0,.93,-.025],[.403,.574,.353],8000,0xaaa59f);
 ellipsoid(body,[0,.88,.284],[.29,.40,.105],M.cream,'Cream belly');fur(body,[0,.88,.288],[.29,.40,.107],2200,0xccc4b6,n=>n.z>0);
 const head=group(body,'Head',[0,1.57,.015]);
 ellipsoid(head,[0,.12,0],[.445,.425,.365],M.fur,'Sculpted head',64);
 fur(head,[0,.12,0],[.448,.428,.369],11000,0xb5b0a8,n=>!(n.z>.4&&Math.abs(n.x)>.32&&n.y>-.3&&n.y<.75));
 ear(head,-1);ear(head,1);
 ellipsoid(head,[0,-.09,.3],[.292,.197,.259],M.cream,'Tapered muzzle',56);
 for(const s of [-1,1])ellipsoid(head,[s*.16,-.075,.275],[.215,.19,.208],M.cream,'Soft cheek');
 fur(head,[0,-.09,.3],[.293,.198,.26],1600,0xcac2b6,n=>n.z>.2&&n.y>-.05);
 eyes(head,.14,.285);
 ellipsoid(head,[0,-.035,.552],[.102,.073,.065],M.nose,'Heart-shaped pink nose');
 ellipsoid(head,[-.031,-.035,.606],[.021,.013,.009],M.ear,'Nostril');ellipsoid(head,[.031,-.035,.606],[.021,.013,.009],M.ear,'Nostril');
 tube(head,[[-.151,-.147,.491],[-.08,-.179,.53],[0,-.184,.548],[.08,-.179,.53],[.151,-.147,.491]],.009,M.black,'Gentle smile');
 for(const s of [-1,1])box(head,[s*.022,-.202,.522],[.041,.05,.025],M.ivory,.009,'Front tooth');
 for(const s of [-1,1])for(let i=0;i<3;i++)tube(head,[[s*.17,-.065-i*.034,.47],[s*.32,-.08+(i-1)*.044,.50],[s*(.62-i*.025),-.05+(i-1)*.12,.42]],.0026,M.cream,'Whisker',20);
 for(let i=0;i<6;i++)swept(head,[[0,.43,-.04],[.045*(i-2.5),.53+i*.006,-.03],[.045*(i-2),.60+i*.005,-.08]],[.033,.022,0],M.fur,'Head tuft',8,12);
 for(const s of [-1,1]){
  const hip=group(body,s<0?'Hip_L':'Hip_R',[s*.255,.56,-.05]);
  ellipsoid(hip,[0,-.12,0],[.195,.275,.19],M.fur,'Hind thigh');fur(hip,[0,-.12,0],[.197,.278,.192],1000,0x9c9893);
  const ankle=group(hip,s<0?'Ankle_L':'Ankle_R',[0,-.34,.02]);
  ellipsoid(ankle,[0,-.045,.13],[.15,.095,.26],M.pink,'Hind paw');
  for(let toe=0;toe<4;toe++){const x=(toe-1.5)*.062;ellipsoid(ankle,[x,-.057,.33-Math.abs(toe-1.5)*.022],[.039,.043,.075],M.pink,'Toe');ellipsoid(ankle,[x,-.046,.385-Math.abs(toe-1.5)*.022],[.018,.014,.024],M.ivory,'Toe nail');}
  const shoulder=group(body,s<0?'Shoulder_L':'Shoulder_R',[s*.355,1.26,.018]);shoulder.rotation.z=s*.14;
  ellipsoid(shoulder,[s*.062,-.145,.002],[.122,.23,.127],M.fur,'Upper foreleg');fur(shoulder,[s*.062,-.145,.002],[.124,.23,.129],700,0xaaa39b);
  const wrist=group(shoulder,s<0?'Wrist_L':'Wrist_R',[s*.073,-.31,.05]);
  ellipsoid(wrist,[0,-.045,.04],[.088,.14,.095],M.pink,'Front paw');
  for(let finger=0;finger<4;finger++)ellipsoid(wrist,[(finger-1.5)*.042,-.142,.081],[.026,.067,.029],M.pink,'Finger');
  ellipsoid(wrist,[-s*.087,-.06,.1],[.036,.064,.037],M.pink,'Thumb');
 }
 const tail=group(body,'Tail',[0,.56,-.25]);
 swept(tail,[[0,0,0],[.08,-.22,-.3],[.35,-.37,-.62],[.74,-.39,-.96],[1.01,-.27,-1.02],[1.08,-.19,-.88]],[.061,.052,.041,.032,.020,.003],M.pink,'Tapered tail',16,72);
 const cape=group(body,'Cape');
 const capePoint=(u,t)=>new T.Vector3(u*(.33+t*.25),1.43-t*.96,-.26-t*.25-.055*Math.cos(u*Math.PI*3)*Math.sin(t*Math.PI));
 const positions=[],indices=[],uv=[];const cw=40,ch=38;
 for(let j=0;j<=ch;j++)for(let i=0;i<=cw;i++){const p=capePoint(i/cw*2-1,j/ch);positions.push(p.x,p.y,p.z);uv.push(i/cw,j/ch);if(i<cw&&j<ch){const n=j*(cw+1)+i;indices.push(n,n+cw+1,n+1,n+1,n+cw+1,n+cw+2);}}
 const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(positions,3));cg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cg.setIndex(indices);cg.computeVertexNormals();const cloth=M.red.clone();cloth.side=T.DoubleSide;mesh(cape,cg,cloth,'Folded crimson cape');
 for(const u of [-1,-.9,.9,1]){const pts=[];for(let i=0;i<=28;i++){const p=capePoint(u,i/28);p.z-=.008;pts.push(p.toArray());}tube(cape,pts,u===1||u===-1?.014:.005,M.goldLight,'Gold embroidered border');}
 for(const t of [.93,1]){const pts=[];for(let i=0;i<=32;i++){const p=capePoint(i/16-1,t);p.z-=.009;pts.push(p.toArray());}tube(cape,pts,t===1?.013:.005,M.goldLight,'Cape hem');}
 for(const s of [-1,1])for(let i=0;i<7;i++){
  const t=.18+i*.103,pts=[];for(let j=0;j<=20;j++){const a=j/20*Math.PI*2,p=capePoint(s*(.947+.037*Math.sin(a)),t+.032*Math.cos(a));p.z-=.013;pts.push(p.toArray());}tube(cape,pts,.004,M.goldLight,'Paisley edge embroidery',20);
 }
 const emblem=om(cape,[0,1.08,-.475],.40);emblem.rotation.y=Math.PI;
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2;ellipsoid(cape,[Math.sin(a)*.23,1.08+Math.cos(a)*.24,-.465],[.008,.011,.007],M.gold,'Emblem stitch',12);}
 const collar=ring(body,[0,1.39,-.015],.286,.021,M.goldLight,[1,.80,1]);collar.rotation.x=Math.PI/2;
 ellipsoid(body,[0,1.30,.305],[.055,.061,.022],M.goldLight,'Cape clasp');
 const clips=[];const times=Array.from({length:17},(_,i)=>i*.8/16);
 const quat=(name,times,angles)=>new T.QuaternionKeyframeTrack(name+'.quaternion',times,angles.flatMap(([x,y,z])=>{const q=new T.Quaternion().setFromEuler(new T.Euler(x,y,z));return q.toArray();}));
 const run=[new T.VectorKeyframeTrack('Body.position',times,times.flatMap(t=>[0,Math.pow(Math.sin(t/.8*Math.PI*2),2)*.055,0]))];
 for(const s of [-1,1]){const wave=times.map(t=>Math.sin(t/.8*Math.PI*2+(s===1?Math.PI:0)));run.push(quat(s<0?'Hip_L':'Hip_R',times,wave.map(x=>[x*.62,0,0])));run.push(quat(s<0?'Shoulder_L':'Shoulder_R',times,wave.map(x=>[-x*.62,0,s*.14])));run.push(quat(s<0?'Ankle_L':'Ankle_R',times,wave.map(x=>[Math.max(0,-x)*.35,0,0])));}
 run.push(quat('Head',times,times.map(t=>[Math.sin(t/.8*Math.PI*4)*.025,0,Math.sin(t/.8*Math.PI*2)*.015])));
 run.push(quat('Cape',times,times.map(t=>[.025+Math.sin(t/.8*Math.PI*2)*.055,Math.sin(t/.8*Math.PI*2)*.05,0])));
 run.push(quat('Tail',times,times.map(t=>[0,Math.sin(t/.8*Math.PI*2)*.18,0])));clips.push(new T.AnimationClip('Run',.8,run));
 const idleTimes=[0,1,2,3,4];clips.push(new T.AnimationClip('Idle',4,[new T.VectorKeyframeTrack('Body.scale',idleTimes,[1,1,1,1,1.013,1.006,1,1,1,1,1.013,1.006,1,1,1]),quat('Head',idleTimes,[[0,0,0],[-.025,.07,0],[0,0,0],[-.02,-.07,0],[0,0,0]])]));
 const jt=[0,.15,.4,.7,.92,1.1];const jump=[new T.VectorKeyframeTrack('Body.position',jt,[0,0,0,0,-.10,0,0,.55,0,0,.66,0,0,.13,0,0,0,0])];
 for(const s of [-1,1]){jump.push(quat(s<0?'Hip_L':'Hip_R',jt,[[0,0,0],[-.2,0,0],[-.8,0,0],[-.9,0,0],[-.35,0,0],[0,0,0]]));jump.push(quat(s<0?'Shoulder_L':'Shoulder_R',jt,[[0,0,s*.14],[.2,0,s*.2],[-.9,0,s*.4],[-.75,0,s*.4],[.2,0,s*.14],[0,0,s*.14]]));}
 jump.push(quat('Cape',jt,[[0,0,0],[.1,0,0],[-.25,0,0],[-.2,0,0],[.1,0,0],[0,0,0]]));clips.push(new T.AnimationClip('Jump',1.1,jump));
 const st=[0,.16,.35,.75,.9,1.12];const slide=[new T.VectorKeyframeTrack('Body.position',st,[0,0,0,0,-.24,.1,0,-.33,.15,0,-.33,.15,0,-.2,.1,0,0,0]),quat('Body',st,[[0,0,0],[-.45,0,0],[-.75,0,0],[-.75,0,0],[-.35,0,0],[0,0,0]])];
 for(const s of [-1,1]){slide.push(quat(s<0?'Hip_L':'Hip_R',st,[[0,0,0],[-.75,0,s*.1],[-1.15,0,s*.1],[-1.15,0,s*.1],[-.6,0,0],[0,0,0]]));slide.push(quat(s<0?'Shoulder_L':'Shoulder_R',st,[[0,0,s*.14],[.5,0,s*.2],[.8,0,s*.25],[.8,0,s*.25],[.4,0,s*.14],[0,0,s*.14]]));}
 clips.push(new T.AnimationClip('Slide',1.12,slide));
 clips.push(new T.AnimationClip('Land',.65,[new T.VectorKeyframeTrack('Body.position',[0,.16,.36,.65],[0,.2,0,0,-.12,0,0,.035,0,0,0,0]),quat('Head',[0,.16,.36,.65],[[0,0,0],[.12,0,0],[-.035,0,0],[0,0,0]])]));
 root.userData={asset:'Mushika',reviewStatus:'Awaiting visual approval',forward:'+Z',clips:['Idle','Run','Jump','Slide','Land'],note:'Articulated part animation. Fine fur geometry is a review-detail asset; gameplay LOD and skin rig refinement follow approval.'};
 return {root,clips};
}
function makeModak(){
 const root=group(null,'Golden_Modak');const positions=[],indices=[],colors=[];const h=56,w=128;
 const profile=new T.CatmullRomCurve3([[0,.014,0],[.23,.03,0],[.385,.14,0],[.405,.29,0],[.34,.43,0],[.205,.60,0],[.07,.79,0],[.012,.88,0],[0,.9,0]].map(v));
 for(let j=0;j<=h;j++){const t=j/h,p=profile.getPoint(t);for(let i=0;i<=w;i++){const a=i/w*Math.PI*2,flute=1+.13*Math.cos(14*a+.11*t)*Math.pow(Math.sin(Math.PI*t),.65);positions.push(Math.cos(a)*p.x*flute,p.y,Math.sin(a)*p.x*flute);const c=new T.Color(0xffd96e).lerp(new T.Color(0xd99a27),.14+.10*(1-Math.cos(a*14)));colors.push(c.r,c.g,c.b);if(j<h&&i<w){const n=j*(w+1)+i;indices.push(n,n+w+1,n+1,n+1,n+w+1,n+w+2);}}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();const mm=M.modak.clone();mm.vertexColors=true;mm.color.setHex(0xffffff);mesh(root,geo,mm,'Fourteen hand-pleated folds');root.userData={asset:'Golden modak',role:'Collectible',reviewStatus:'Awaiting approval'};return {root,clips:[]};
}
function flower(parent,pos,radius=.12,mat=M.marigold){const g=group(parent,'Flower',pos);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ellipsoid(g,[Math.cos(a)*radius*.47,Math.sin(a)*radius*.47,0],[radius*.48,radius*.36,radius*.30],mat,'Petal',12).rotation.z=a;}ellipsoid(g,[0,0,.03],[radius*.35,radius*.35,radius*.25],M.gold,'Flower center',12);return g;}
function hand(parent,pos,scale=1,raised=true){const g=group(parent,'Hand',pos);g.scale.setScalar(scale);ellipsoid(g,[0,0,0],[.16,.18,.085],M.skin,'Palm');for(let i=0;i<4;i++){const x=(i-1.5)*.075;ellipsoid(g,[x,.22-Math.abs(i-1.4)*.023,.0],[.045,.155,.044],M.skin,'Finger');}ellipsoid(g,[-.18,.035,.015],[.064,.115,.06],M.skin,'Thumb').rotation.z=-.5;if(!raised)g.rotation.z=-Math.PI/2;return g;}
function makeGanesha(){
 const g=group(null,'Seated_Ganesha');
 cylinder(g,[0,.12,0],1.43,1.5,.24,M.gold);cylinder(g,[0,.30,0],1.33,1.43,.14,M.darkRed);
 for(let tier=0;tier<2;tier++)for(let i=0;i<20;i++){const a=i*Math.PI/10+(tier?.08:0),p=ellipsoid(g,[Math.cos(a)*(1.04-tier*.08),.37+tier*.13,Math.sin(a)*(1.04-tier*.08)],[.20,.16,.43],tier?M.goldLight:M.gold,'Lotus pedestal petal',24);p.rotation.y=Math.PI/2-a;}
 cylinder(g,[0,.51,0],1.04,1.14,.12,M.red);
 // Lotus seat and folded dhoti establish a seated, welcoming silhouette.
 for(const s of [-1,1]){
  const leg=ellipsoid(g,[s*.68,.75,.28],[.63,.31,.52],M.red,'Folded dhoti');leg.rotation.z=s*.12;
  ellipsoid(g,[s*.36,.64,.70],[.34,.17,.28],M.skin,'Seated foot');
  for(let i=0;i<5;i++)ellipsoid(g,[s*.36+(i-2)*.074,.64,.916-Math.abs(i-2)*.017],[.042,.06,.071],M.skinLight,'Toe',20);
  for(let i=0;i<5;i++)tube(g,[[s*.33,.92,.63-i*.075],[s*.70,.92-i*.025,.68-i*.07],[s*1.07,.8-i*.022,.35-i*.02]],.011,i===0?M.goldLight:M.darkRed,'Dhoti fold',22);
 }
 ellipsoid(g,[0,1.37,.02],[.73,.80,.55],M.skin,'Gentle rounded belly',64);
 ellipsoid(g,[0,1.53,.505],[.08,.10,.018],M.rose,'Navel',24);
 ellipsoid(g,[0,2.20,.015],[.45,.39,.37],M.skin,'Neck');
 ellipsoid(g,[0,2.58,.02],[.60,.63,.48],M.skin,'Elephant head',64);
 for(const s of [-1,1]){
  ellipsoid(g,[s*.64,2.52,-.09],[.49,.59,.16],M.skin,'Large elephant ear',52).rotation.z=s*-.18;
  ellipsoid(g,[s*.68,2.53,.043],[.36,.47,.075],M.rose,'Ear inner',48).rotation.z=s*-.18;
  tube(g,[[s*.70,2.94,.091],[s*.51,2.63,.12],[s*.75,2.32,.12],[s*.85,2.10,.055]],.016,M.skinLight,'Ear sculpted fold');
  ring(g,[s*.86,2.10,.13],.12,.025,M.goldLight);
  ellipsoid(g,[s*.86,1.92,.14],[.055,.075,.036],M.ruby,'Earring jewel',24);
 }
 const face=group(g,'Face',[0,0,0]);eyes(face,2.68,.404,.237,.9,true);
 swept(g,[[0,2.52,.40],[0,2.24,.64],[.0,1.99,.79],[-.13,1.72,.89],[-.02,1.58,.98],[.21,1.62,.95],[.28,1.76,.91]],[.205,.18,.145,.117,.09,.063,.026],M.skin,'Curled trunk',28,80);
 for(let i=0;i<4;i++){const y=2.35-i*.10;const z=.67+(2.35-y)*.56;tube(g,[[-.09,y,z-.01],[0,y-.021,z+.018],[.09,y,z-.01]],.006,M.rose,'Trunk crease',18);}
 for(const s of [-1,1])swept(g,[[s*.28,2.34,.37],[s*.37,2.20,.52],[s*.34,2.14,.68],[s*.26,2.22,.72]],[.077,.063,.03,0],M.ivory,'Ivory tusk',18,32);
 tube(g,[[0,2.96,.413],[0,2.87,.461],[0,2.79,.474]],.031,M.red,'Vertical tilak',20);
 for(let i=0;i<3;i++)tube(g,[[-.135,2.98+i*.045,.35],[0,2.965+i*.045,.418],[.135,2.98+i*.045,.35]],.012,M.ivory,'Forehead sacred mark',20);
 // Four arms: blessing hand, modak offering, lotus and a small ceremonial goad.
 for(const s of [-1,1]){
  swept(g,[[s*.48,1.97,-.04],[s*.92,2.07,-.15],[s*1.1,2.46,-.12]],[.19,.155,.105],M.skin,'Upper arm',24,38);
  const upper=hand(g,[s*1.1,2.46,-.06],.68);upper.rotation.z=s*.15;
  ring(g,[s*1.07,2.29,-.09],.12,.024,M.goldLight).rotation.x=Math.PI/2;
 }
 swept(g,[[-.50,1.93,.12],[-.89,1.55,.27],[-.99,1.72,.54]],[.20,.155,.11],M.skin,'Blessing arm',24,42);
 hand(g,[-.99,1.89,.57],.78,true);om(g,[-.985,1.88,.641],.08,M.red);
 swept(g,[[.5,1.93,.11],[.99,1.36,.2],[1.02,1.16,.51]],[.20,.16,.105],M.skin,'Offering arm',24,42);
 const hold=hand(g,[1.08,1.17,.55],.68,false);hold.rotation.x=-.7;
 const tray=cylinder(g,[1.09,1.25,.64],.25,.24,.055,M.goldLight);tray.rotation.x=.05;
 const sweet=makeModak().root;sweet.scale.setScalar(.34);sweet.position.set(1.09,1.29,.64);g.add(sweet);
 for(const pos of [[-.98,1.71,.50],[1.02,1.25,.48]])ring(g,pos,.125,.03,M.goldLight).rotation.x=Math.PI/2;
 tube(g,[[1.12,2.58,-.02],[1.15,2.9,-.02],[1.12,3.08,-.02]],.018,M.gold,'Lotus stem');flower(g,[1.12,3.08,-.01],.19,M.petal);
 tube(g,[[-1.10,2.60,-.03],[-1.12,2.98,-.02],[-1.04,3.09,-.02],[-.90,3.06,-.02],[-.9,2.95,-.02]],.03,M.goldLight,'Ceremonial goad');
 // Layered necklaces and marigold garland.
 for(let row=0;row<3;row++)for(let i=0;i<29;i++){const t=i/28*Math.PI,x=Math.cos(t)*(.43+row*.10),y=2.11-Math.sin(t)*(.36+row*.12),z=.39+Math.sin(t)*.20;ellipsoid(g,[x,y,z],[.031,.034,.025],row%2?M.goldLight:M.gold,'Necklace bead',16);}
 ellipsoid(g,[0,1.47,.63],[.12,.15,.04],M.goldLight,'Central pendant');ellipsoid(g,[0,1.47,.674],[.052,.078,.016],M.ruby,'Pendant ruby',24);
 for(let i=0;i<28;i++){const t=i/27*Math.PI,x=Math.cos(t)*.57,y=2.07-Math.sin(t)*.92,z=.31+Math.sin(t)*.27;flower(g,[x,y,z],.072,i%4===0?M.petal:M.marigold);}
 // Crown with fluted gold tiers and inset jewels.
 cylinder(g,[0,3.11,-.015],.54,.54,.15,M.goldLight);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ellipsoid(g,[Math.cos(a)*.535,3.13,Math.sin(a)*.48],[.044,.076,.027],i%2?M.ruby:M.emerald,'Crown jewel',20).rotation.y=Math.PI/2-a;}
 for(let tier=0;tier<5;tier++){const y=3.23+tier*.13,r=.48-tier*.075;cylinder(g,[0,y,-.015],r-.05,r,.14,M.gold);ring(g,[0,y+.025,-.015],r-.01,.022,M.goldLight).rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ellipsoid(g,[Math.cos(a)*r,y+.02,Math.sin(a)*r-.015],[.026,.055,.018],M.goldLight,'Crown chased leaf',16).rotation.y=Math.PI/2-a;}}
 ellipsoid(g,[0,3.89,-.015],[.10,.16,.10],M.goldLight,'Crown finial');
 // Freestanding ornamental halo behind the seated figure.
 const halo=group(g,'Halo',[0,2.15,-.64]);ring(halo,[0,0,0],1.61,.063,M.gold);ring(halo,[0,0,.015],1.48,.025,M.goldLight);ring(halo,[0,0,0],1.73,.021,M.gold);
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const p=ellipsoid(halo,[Math.sin(a)*1.64,Math.cos(a)*1.64,0],[.082,.17,.039],M.goldLight,'Halo lotus leaf',20);p.rotation.z=-a;ellipsoid(halo,[Math.sin(a)*1.49,Math.cos(a)*1.49,.055],[.034,.034,.025],i%4===0?M.ruby:M.goldLight,'Halo bead',16);}
 const root=batchStatic(g);root.userData={asset:'Seated Ganesha',role:'Distant devotional landmark',reviewStatus:'Awaiting approval',placement:'Faces Mushika. Remains distant during endless running.'};return {root,clips:[]};
}
function makeTram(){
 const g=group(null,'Festival_Roof_Tram');
 box(g,[0,.52,0],[2.22,.36,4.5],M.wood,.08);box(g,[0,1.05,0],[2.16,.8,4.35],M.red,.08);
 for(const s of [-1,1])for(const z of [-1.55,1.55]){const wheel=cylinder(g,[s*1.13,.47,z],.43,.43,.19,M.rubber);wheel.rotation.z=Math.PI/2;const hub=cylinder(g,[s*1.24,.47,z],.19,.19,.025,M.goldLight);hub.rotation.z=Math.PI/2;}
 for(const x of [-1.035,1.035])for(const z of [-2.1,-.7,.7,2.1])cylinder(g,[x,1.86,z],.053,.053,1.6,M.goldLight,20);
 for(const s of [-1,1])for(const z of [-1.42,0,1.42]){
  box(g,[s*1.04,1.84,z],[.035,.91,1.20],M.glass,.025);
  for(const y of [1.38,2.30])box(g,[s*1.07,y,z],[.065,.045,1.3],M.gold,.01);
 }
 for(const z of [-2.11,2.11]){
  box(g,[0,1.85,z],[1.86,.9,.055],M.glass,.04);box(g,[0,1.36,z],[1.97,.12,.07],M.gold,.02);
  const symbol=om(g,[0,1.025,z+(z>0?.074:-.074)],.39);if(z<0)symbol.rotation.y=Math.PI;
  for(const s of [-1,1])ellipsoid(g,[s*.78,1.14,z+(z>0?.09:-.09)],[.11,.12,.07],M.ivory,'Headlamp');
 }
 box(g,[0,2.53,0],[2.40,.24,4.7],M.darkRed,.085,'Walkable flat roof');
 box(g,[0,2.657,0],[2.14,.016,4.45],M.red,.006,'Roof landing surface');
 for(const s of [-1,1]){box(g,[s*1.16,2.56,0],[.046,.055,4.54],M.goldLight,.012);for(let i=0;i<16;i++){const z=-2+i*.266;flower(g,[s*1.13,1.32,z],.070,M.marigold).rotation.y=s*Math.PI/2;}}
 for(const z of [-2.24,2.24])box(g,[0,2.56,z],[2.34,.052,.045],M.goldLight,.01);
 const root=batchStatic(g);root.userData={asset:'Festival tram',role:'Jump onto roof and run along it',roofHeight:2.67,roofWidth:2.14,roofLength:4.45,reviewStatus:'Awaiting approval'};return {root,clips:[]};
}
function makeBarrier(){
 const g=group(null,'Slide_Barrier');
 for(const s of [-1,1]){box(g,[s*1.20,.12,0],[.64,.24,.90],M.wood,.05);box(g,[s*1.20,1.17,0],[.13,2.14,.16],M.gold,.026);ellipsoid(g,[s*1.20,2.30,0],[.14,.14,.14],M.goldLight);}
 box(g,[0,1.72,0],[2.6,.54,.25],M.red,.025);
 for(const z of [-.134,.134])for(let i=-4;i<=4;i++){const stripe=box(g,[i*.285,1.72,z],[.13,.52,.012],M.ivory,.001);stripe.rotation.z=-.25;}
 for(const s of [-1,1])flower(g,[s*1.2,2.1,.15],.1);
 const root=batchStatic(g);root.userData={asset:'Slide barrier',role:'Slide underneath',clearance:1.45,reviewStatus:'Awaiting approval'};return {root,clips:[]};
}
function makeRooftop(){
 const g=group(null,'Temple_Rooftop');
 box(g,[0,1.47,0],[4.8,2.94,5.2],M.stone,.06);box(g,[0,3.02,0],[5.15,.2,5.5],M.gold,.04);box(g,[0,3.15,0],[4.90,.075,5.23],M.stone,.015,'Walkable terrace');
 for(const s of [-1,1])for(let i=0;i<9;i++){
  const z=-2.4+i*.6;cylinder(g,[s*2.43,3.43,z],.06,.095,.5,M.stone,16);ellipsoid(g,[s*2.43,3.67,z],[.095,.095,.095],M.gold,'Balustrade cap',16);
 }
 for(const s of [-1,1])box(g,[s*2.43,3.71,0],[.16,.10,5.24],M.goldLight,.02);
 for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)box(g,[i*.51,3.197,j*.57],[.495,.006,.55],(i+j)%3===0?M.gold:M.stone,.002,'Terrace paving');
 for(const s of [-1,1])for(let i=0;i<3;i++){
  const z=(i-1)*1.5;box(g,[s*2.408,1.8,z],[.025,1.10,.78],M.darkRed,.08);for(const y of [1.23,2.36])box(g,[s*2.43,y,z],[.07,.08,.89],M.gold,.01);
 }
 const root=batchStatic(g);root.userData={asset:'Temple rooftop',role:'Rooftop running and gaps',roofHeight:3.20,reviewStatus:'Awaiting approval'};return {root,clips:[]};
}
function makeRamp(){
 const g=group(null,'Roof_Ramp');const shape=new T.Shape();shape.moveTo(-1.7,0);shape.lineTo(1.7,0);shape.lineTo(1.7,2.67);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:2.08,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-1.04,0,0);mesh(g,geo,M.wood,'Sloped approach');
 for(let i=0;i<=14;i++){const z=1.7-i*3.4/14,y=i*2.67/14;box(g,[0,y+.025,z],[2.08,.06,.12],i%3===0?M.gold:M.red,.01);}
 const root=batchStatic(g);root.userData={asset:'Vehicle access ramp',role:'Run up onto a vehicle',height:2.67,reviewStatus:'Awaiting approval'};return {root,clips:[]};
}

const definitions=[['mushika',makeMushika],['modak',makeModak],['ganesha',makeGanesha],['festival-tram',makeTram],['slide-barrier',makeBarrier],['temple-rooftop',makeRooftop],['roof-ramp',makeRamp]];
const manifest=[];
for(const [id,build] of definitions){
 const {root,clips}=build();root.updateMatrixWorld(true);let triangles=0,meshes=0;
 root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
 const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips,onlyVisible:true});writeFileSync(path.join(output,'models',id+'.glb'),Buffer.from(binary));
 manifest.push({id,name:root.userData.asset,filename:`models/${id}.glb`,triangles:Math.round(triangles),meshes,bytes:binary.byteLength,size:size.toArray(),clips:clips.map(c=>c.name),...root.userData});
 console.log(id,Math.round(triangles)+' triangles',binary.byteLength+' bytes',clips.map(c=>c.name).join(', '));
}
writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
const vendorFiles=['build/three.module.js','examples/jsm/controls/OrbitControls.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/environments/RoomEnvironment.js'];
for(const f of vendorFiles){const dest=path.join(output,'vendor',f);mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(path.resolve(here,'../node_modules/three',f),dest);}
console.log('Review assets saved to',output);

