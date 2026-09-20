export type Status = 'ready' | 'running' | 'paused' | 'gate' | 'dying' | 'over';
export type Obstacle = 'drum' | 'cart' | 'barrier';
export const THEMES = ['Temple Street', 'Market Street', 'Festival Avenue', 'Pandal Zone', 'Temple Corridor'];
export interface RunState {
  status: Status; score: number; modaks: number; distance: number; elapsed: number;
  hearts: number; combo: number; bestCombo: number; blessing: number; maha: boolean;
  lane: number; x: number; jump: number; velocityY: number; slide: number; ground:number;
  invincible: number; gateTime: number; nextGate: number; theme: number;
}
export function freshState(theme = 0): RunState {
  return {status:'ready', score:0, modaks:0, distance:0, elapsed:0, hearts:3,
    combo:0, bestCombo:0, blessing:0, maha:false, lane:0, x:0, jump:0,
    velocityY:0, slide:0, ground:0, invincible:0, gateTime:45, nextGate:60, theme};
}
export function runSpeed(distance:number,blessing=false){
  const progressive=15+Math.min(5,distance/80)+Math.min(5,Math.max(0,distance-400)/180)+Math.min(5,Math.max(0,distance-900)/220);
  return progressive*(blessing?1.2:1);
}
export function obstacleSpacing(distance:number){return Math.max(13,21-Math.min(8,distance/160));}
export function advance(s: RunState, dt: number, startingTheme: number) {
  if (s.status === 'gate') { s.gateTime = Math.max(0, s.gateTime - dt); return; }
  if (s.status !== 'running') return;
  s.elapsed += dt;
  const speed = runSpeed(s.distance,s.blessing>0);
  const travel = speed * dt;
  s.distance += travel; s.score += travel * (s.maha && s.blessing > 0 ? 4 : 2);
  s.x += (s.lane * 3.1 - s.x) * Math.min(1, dt * 13);
  if (s.jump > s.ground || s.velocityY > 0) {
    s.velocityY -= 23 * dt; s.jump = Math.max(s.ground, s.jump + s.velocityY * dt);
    if (s.jump === s.ground) s.velocityY = 0;
  }
  s.slide = Math.max(0, s.slide-dt); s.invincible = Math.max(0, s.invincible-dt);
  s.blessing = Math.max(0, s.blessing-dt); if (!s.blessing) s.maha = false;
  s.theme = (startingTheme + Math.floor(s.distance/500)) % THEMES.length;
  // One-minute milestones now release an Om gift into the live track instead
  // of interrupting the run with a question screen.
  if (s.elapsed >= s.nextGate) s.nextGate += 60;
  return travel;
}
export function move(s:RunState, action:'left'|'right'|'jump'|'slide') {
  if (s.status !== 'running') return;
  if (action === 'left') s.lane = Math.max(-1,s.lane-1);
  if (action === 'right') s.lane = Math.min(1,s.lane+1);
  if (action === 'jump' && s.jump === s.ground) { s.velocityY=12; s.slide=0; }
  if (action === 'slide' && s.jump === s.ground) s.slide=.85;
}
export function collect(s:RunState) { s.modaks++; s.score += s.maha && s.blessing>0 ? 100 : 50; }
export function reward(s:RunState) {
  s.combo++; s.bestCombo=Math.max(s.bestCombo,s.combo); s.score+=150;
  return 'combo';
}
export function hit(s:RunState) {
  if (s.invincible>0 || s.blessing>0 || s.status !== 'running') return false;
  s.hearts--; s.combo=0; s.invincible=1.8;
  if (s.hearts<=0) s.status='over';
  return true;
}
export function clears(s:RunState, kind:Obstacle) {
  return s.blessing>0 || (kind==='drum' && s.jump>1.1) || (kind==='barrier' && s.slide>0);
}

export type PatternObstacle={lane:-1|0|1;kind:Obstacle;appearance?:'marketCart'};
export type RunnerPattern={safeLane:-1|0|1;obstacles:PatternObstacle[]};
const RUNNER_PATTERNS:RunnerPattern[]=[
  {safeLane:-1,obstacles:[{lane:0,kind:'drum'}]},
  {safeLane:1,obstacles:[{lane:-1,kind:'barrier'},{lane:0,kind:'drum'}]},
  {safeLane:0,obstacles:[{lane:-1,kind:'drum',appearance:'marketCart'},{lane:1,kind:'barrier'}]},
  {safeLane:-1,obstacles:[{lane:0,kind:'cart'},{lane:1,kind:'drum'}]},
  {safeLane:1,obstacles:[{lane:-1,kind:'cart'},{lane:0,kind:'barrier'}]},
  {safeLane:0,obstacles:[{lane:-1,kind:'drum'},{lane:1,kind:'drum',appearance:'marketCart'}]},
];
/** Deterministic rows keep at least one lane open and unlock denser layouts over distance. */
export function obstaclePattern(index:number,distance:number):RunnerPattern{
  const available=distance<250?2:distance<650?4:RUNNER_PATTERNS.length;
  return RUNNER_PATTERNS[index%available];
}

/** The road moves toward a runner positioned at z=3. */
export function routeSurface(kind:string,z:number,dx:number):number|null {
  if(dx>1.22)return null;
  const offset=3-z;
  if(kind==='ramp'&&Math.abs(offset)<=1.8)return Math.min(1,Math.max(0,(1.8-offset)/3.6))*2.67;
  if(kind==='cart'&&Math.abs(offset)<=2.4)return 2.67;
  if(kind==='rooftop'&&Math.abs(offset)<=5.56)return 2.67;
  return null;
}

export type Solid = {kind:string; x:number; z:number; disabled?:boolean};
/** Sweep the full motion, including lane changes, rather than testing once at the obstacle center. */
export function resolveMotion(s:RunState, before:RunState, solids:Solid[], requested:number) {
  const targetX=s.x,targetY=s.jump;
  const steps=Math.max(1,Math.ceil(Math.max(requested,Math.abs(targetX-before.x),Math.abs(targetY-before.jump))/.06));
  let x=before.x,y=before.jump,ground=before.ground,travel=0;
  for(let step=1;step<=steps;step++){
    const f=step/steps,nx=before.x+(targetX-before.x)*f,nz=requested*f;
    let ny=before.jump+(targetY-before.jump)*f,ng=0;
    for(const body of solids){if(body.disabled)continue;const surface=routeSurface(body.kind,body.z+nz,Math.abs(nx-body.x));
      const rampHandoff=body.kind==='cart'&&y>2.3&&solids.some(ramp=>ramp.kind==='ramp'&&!ramp.disabled&&Math.abs(ramp.x-body.x)<.01&&Math.abs(ramp.z-body.z-4.1)<.15);
      if(surface!==null&&((body.kind==='ramp'&&Math.abs(nx-body.x)<1.02&&surface<=y+.12)||rampHandoff||(y>=surface-.025&&s.velocityY<=0)))ng=Math.max(ng,surface);
    }
    ny=Math.max(ny,ng);
    const bodyHeight=s.slide>0?1.15:2.15;
    const blocked=solids.findIndex(body=>{
      if(body.disabled||body.kind==='modak')return false;
      const dx=Math.abs(nx-body.x),dz=Math.abs(3-body.z-nz);
      if(body.kind==='ramp'){const h=routeSurface('ramp',body.z+nz,0);return h!==null&&dx<1.35&&ny<h-.12;}
      const length=body.kind==='cart'?2.35:body.kind==='rooftop'?5.5:body.kind==='drum'?.77:.45;
      const width=body.kind==='cart'?1.25:body.kind==='rooftop'?1.24:body.kind==='drum'?.8:1.37;
      if(dx>=width+.9||dz>=length+(body.kind==='cart'||body.kind==='rooftop'?.08:.38))return false;
      if(body.kind==='barrier'){
        if(dx> .99)return ny<2.44;
        return ny<2.12&&ny+bodyHeight>1.45;
      }
      if(body.kind==='cart'&&dx<.65&&solids.some(ramp=>ramp.kind==='ramp'&&!ramp.disabled&&Math.abs(ramp.x-body.x)<.01&&Math.abs(ramp.z-body.z-4.1)<.15))return false;
      if(body.kind==='rooftop'&&dx<.65&&solids.some(cart=>cart.kind==='cart'&&!cart.disabled&&Math.abs(cart.x-body.x)<.01&&Math.abs(cart.z-body.z-7.8)<.15))return false;
      const top=body.kind==='drum'?1.48:2.67;
      // The moving route is sampled in frames. Accept the final few centimetres
      // of its ramp as a valid roof transition so a slower frame cannot hit the
      // vehicle face while the runner is visibly standing on the connected ramp.
      if(top===2.67&&ng>1.2)return false;
      return ny<top-.025;
    });
    if(blocked>=0){s.x=x;s.jump=y;s.ground=ground;if(Math.abs(targetX-before.x)>.005)s.lane=Math.max(-1,Math.min(1,Math.round(before.x/3.1)));return {travel,blocked};}
    x=nx;y=ny;ground=ng;travel=nz;
  }
  s.x=x;s.jump=y;s.ground=ground;if(y===ground&&s.velocityY<0)s.velocityY=0;
  return {travel,blocked:-1};
}
