<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import FestivalWorld from './festival/world';
import { freshState, THEMES } from './festival/rules';
import { getTopScores, submitLeaderboardScore, type LeaderboardEntry } from './leaderboard';
const canvas=ref<HTMLCanvasElement>(),state=ref(freshState()),notice=ref(''),panel=ref(''),ready=ref(false),error=ref(''),selectedTheme=ref(0),muted=ref(false),fullscreen=ref(false);
const scores=ref<{score:number;modaks:number;distance:number;combo:number;date:string}[]>([]);
const leaderboard=ref<LeaderboardEntry[]>([]),leaderboardLoading=ref(false),leaderboardError=ref('');
const playerName=ref(''),scoreSubmitting=ref(false),scoreSubmitted=ref(false),scoreSubmitMessage=ref('');
let world:FestivalWorld|undefined,saved=false;
const fmt=(n:number)=>Math.floor(n).toLocaleString('en-IN');
const clock=computed(()=>`${Math.floor(state.value.elapsed/60)}:${String(Math.floor(state.value.elapsed%60)).padStart(2,'0')}`);
const highScore=computed(()=>scores.value[0]?.score||0),active=computed(()=>state.value.status!=='ready');
function start(){panel.value='';saved=false;scoreSubmitted.value=false;scoreSubmitMessage.value='';world?.start(selectedTheme.value);(document.activeElement as HTMLElement)?.blur();}
function menu(){panel.value='';world?.menu();}
function sound(){muted.value=!muted.value;if(world){world.muted=muted.value;world.enableAudio();}}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}
function syncFullscreen(){fullscreen.value=!!document.fullscreenElement;}
function handleEscape(e:KeyboardEvent){if(e.key==='Escape'&&panel.value)panel.value='';}
async function refreshLeaderboard(){leaderboardLoading.value=true;leaderboardError.value='';try{leaderboard.value=await getTopScores();}catch(error){leaderboardError.value='The online leaderboard is temporarily unavailable.';console.error(error);}finally{leaderboardLoading.value=false;}}
function openLeaderboard(){panel.value='leaderboard';void refreshLeaderboard();}
async function submitFinalScore(){
  if(scoreSubmitting.value||scoreSubmitted.value||state.value.status!=='over')return;
  scoreSubmitMessage.value='';const cleanName=playerName.value.trim().replace(/\s+/g,' ');
  if(cleanName.length<2||cleanName.length>20){scoreSubmitMessage.value='Enter a name between 2 and 20 characters.';return;}
  scoreSubmitting.value=true;
  try{playerName.value=await submitLeaderboardScore(cleanName,state.value.score);scoreSubmitted.value=true;scoreSubmitMessage.value='Score submitted. Check the Hall of Blessings for the Top 10.';try{localStorage.setItem('vighnaharta-player-name',playerName.value);}catch{}await refreshLeaderboard();}
  catch(error){scoreSubmitMessage.value='The score could not be submitted. Please try again.';console.error(error);}
  finally{scoreSubmitting.value=false;}
}
onMounted(()=>{
  try{const rows=JSON.parse(localStorage.getItem('vighnaharta-runs-v1')||'[]');if(Array.isArray(rows))scores.value=rows.filter(r=>r&&Number.isFinite(r.score)&&Number.isFinite(r.modaks)&&Number.isFinite(r.distance)).slice(0,8);}catch{}
  try{playerName.value=localStorage.getItem('vighnaharta-player-name')||'';}catch{}
  document.addEventListener('fullscreenchange',syncFullscreen);window.addEventListener('keydown',handleEscape);
  try{world=new FestivalWorld(canvas.value!,s=>{
    state.value=s;
    if(s.status==='over'&&!saved){saved=true;scores.value=[...scores.value,{score:Math.floor(s.score),modaks:s.modaks,distance:Math.floor(s.distance),combo:s.bestCombo,date:new Date().toLocaleDateString()}].sort((a,b)=>b.score-a.score).slice(0,8);try{localStorage.setItem('vighnaharta-runs-v1',JSON.stringify(scores.value));}catch{}}
  },message=>notice.value=message);void world.assetsReady.then(()=>{ready.value=true;}).catch(e=>{error.value='The approved models could not load. Please reload to try again.';console.error(e);});}catch(e){error.value='The 3D scene could not start. Please enable hardware acceleration and reload.';console.error(e);}
});
onUnmounted(()=>{world?.dispose();document.removeEventListener('fullscreenchange',syncFullscreen);window.removeEventListener('keydown',handleEscape);});
</script>
<template>
  <main class="game-shell" :class="{'is-playing':active,'has-blessing':state.blessing>0}">
    <canvas ref="canvas" class="world" aria-label="Vighnaharta Run 3D game. Use arrow keys to move, jump and slide." />
    <div class="screen-vignette" aria-hidden="true"></div><div v-if="!active" class="cover-art" aria-hidden="true"></div>
    <header v-if="!active" class="topbar"><a class="wordmark" href="#" @click.prevent="menu"><span class="brand-seal">ॐ</span><span>VIGHNAHARTA<span class="wordmark-sub">THE FESTIVAL RUN</span></span></a><div class="topbar-right"><span class="edition">GANESH CHATURTHI EDITION</span><button class="icon-button" @click="sound" :aria-label="muted?'Enable sound':'Mute sound'">{{muted?'♫̸':'♫'}}</button><button class="icon-button" @click="toggleFullscreen" :aria-label="fullscreen?'Exit fullscreen':'Enter fullscreen'">⛶</button></div></header>
    <section v-if="!active" class="main-menu" aria-label="Main menu">
      <div class="eyebrow">A LITTLE HERO. A DIVINE ADVENTURE.</div><div class="title-emblem" aria-hidden="true"><span>ॐ</span></div><h1>Vighnaharta<span>RUN</span></h1><p class="tagline">Beat the Vighna. Earn the Blessing.</p><p class="menu-description">A little courage. A trail of modaks.<br>One unforgettable journey to Bappa.</p>
      <button class="play-button" @click="start" :disabled="!ready"><span>▶</span>{{ready?'LET’S PLAY':'PREPARING THE FESTIVAL…'}}<span>→</span></button>
      <div class="menu-links"><button @click="panel='guide'">⌨ &nbsp; How to play</button><button @click="openLeaderboard">♜ &nbsp; Leaderboard</button></div>
      <button class="journey-button" @click="panel='journey'"><span class="journey-dot"></span><span><small>YOUR JOURNEY BEGINS IN</small>{{THEMES[selectedTheme]}}</span><span>⌄</span></button>
      <div v-if="highScore" class="personal-best">PERSONAL BEST <b>{{fmt(highScore)}}</b></div><p v-if="error" class="error">{{error}}</p>
    </section>
    <div v-if="!active" class="cover-caption"><span class="caption-line"></span><p>Small paws.<br><em>Infinite blessings.</em></p><span class="caption-label">MEET MUSHAK · BAPPA’S LITTLE HERO</span></div>
    <footer v-if="!active" class="menu-footer"><span>✧ <i>Ganpati Bappa Morya!</i></span><div><span class="desktop-hint">DESKTOP & MOBILE</span><span class="footer-dot">•</span><button @click="panel='credits'">Credits</button></div></footer>
    <div v-if="state.status==='dying'" class="death-cinematic" aria-label="Mushika has fallen"><span>THE JOURNEY PAUSES</span><small>Bappa awaits another brave run</small></div>
    <template v-if="active&&state.status!=='dying'">
      <header class="hud"><div class="hud-left"><button class="pause-button" @click="world?.pause()" aria-label="Pause game">Ⅱ</button><div class="modak-counter"><span class="modak-symbol"></span><b>{{fmt(state.modaks)}}</b><small>MODAKS</small></div></div><div class="run-location"><span class="live-dot"></span>{{THEMES[state.theme]}}<small>◷ {{clock}}</small></div><div class="hud-score"><span>SCORE</span><strong>{{fmt(state.score).padStart(5,'0')}}</strong><div><small>DISTANCE</small> {{fmt(state.distance)}} <small>m</small></div><div class="hearts" aria-label="Lives remaining"><span v-for="n in 3" :key="n" :class="{lost:n>state.hearts}">♥</span></div></div></header>
      <div v-if="state.combo>0" class="combo-meter"><span>✦</span><div><b>×{{state.combo}} COMBO</b><small>{{state.blessing>0?'Bappa is with you':'Keep the run flowing'}}</small></div><div class="combo-dots"><i v-for="n in 5" :key="n" :class="{lit:n<=state.combo}"></i></div></div>
      <Transition name="notice"><div v-if="notice&&state.status==='running'" class="run-notice" role="status">{{notice}}</div></Transition>
      <div v-if="state.blessing>0" class="blessing-banner"><b>✦ {{state.maha?'MAHA AASHIRWAD':'BLESSING MODE'}} ✦</b><span>{{state.maha?'2× score · ':''}}Auto collect · Invincibility · {{Math.ceil(state.blessing)}}s</span><div :style="{transform:`scaleX(${state.blessing/10})`}"></div></div>
      <div class="run-bottom"><div class="keyboard-help"><span><kbd>←</kbd><kbd>→</kbd> Move</span><span><kbd>↑</kbd> Jump</span><span><kbd>↓</kbd> Slide</span></div><span class="run-mantra">Ganpati Bappa Morya!</span><button class="icon-button" @click="sound" :aria-label="muted?'Enable sound':'Mute sound'">{{muted?'♫̸':'♫'}}</button></div>
      <nav class="touch-controls" aria-label="Touch game controls"><button @click="world?.action('left')" aria-label="Move left">←</button><button @click="world?.action('jump')" aria-label="Jump">↑</button><button @click="world?.action('slide')" aria-label="Slide">↓</button><button @click="world?.action('right')" aria-label="Move right">→</button></nav>
    </template>
    <div v-if="panel||['paused','over'].includes(state.status)" class="modal-overlay">
      <section v-if="panel" class="modal-card" :class="{'wide-card':panel==='journey'}" role="dialog" aria-modal="true" :aria-label="panel">
        <button class="close-button" @click="panel=''" aria-label="Close dialog">×</button><span class="modal-ornament">✦ ॐ ✦</span>
        <template v-if="panel==='guide'"><p class="eyebrow">YOUR FIRST FESTIVAL RUN</p><h2>A little courage goes a long way.</h2><div class="guide-rows"><div><span>← →</span><p><b>Find your path</b>Arrow keys or A / D to switch lanes.</p></div><div><span>↑</span><p><b>Jump onto vehicle roofs</b>Up, W or Space to jump. Run up ramps and continue across rooftops.</p></div><div><span>↓</span><p><b>Duck under barriers</b>Down or S to slide. Jump onto carts or dodge around them.</p></div><div><span>ॐ</span><p><b>Receive Maha Aashirwad</b>An Om gift appears every two minutes. Collect it for double score, auto collect, and invincibility.</p></div></div><p class="help-note">On mobile, swipe or use the on-screen buttons. Escape or P pauses your run.</p><button class="play-button" @click="start">I’M READY <span>→</span></button></template>
        <template v-if="panel==='leaderboard'"><p class="eyebrow">TOP 10 FESTIVAL RUNNERS</p><h2>Hall of blessings</h2><p class="help-note">The best journeys shared by players everywhere.</p><div v-if="leaderboardLoading" class="empty-state"><span>ॐ</span><p>Gathering the blessings…</p></div><div v-else-if="leaderboard.length" class="score-table online-scores"><div class="table-head"><span>RANK</span><span>PLAYER</span><span>SCORE</span></div><div v-for="(run,i) in leaderboard" :key="run.created_at+i"><span>{{String(i+1).padStart(2,'0')}}</span><span>{{run.player_name}}</span><b>{{fmt(run.score)}}</b></div></div><div v-else class="empty-state"><span>♜</span><p>Your first adventure awaits.</p><small>{{leaderboardError||'Finish a run to leave your mark here.'}}</small></div><button class="play-button" @click="start">START A RUN <span>→</span></button></template>
        <template v-if="panel==='journey'"><p class="eyebrow">FIVE PLACES. ONE CELEBRATION.</p><h2>Choose your first street</h2><p class="help-note">The atmosphere changes every 500 metres.</p><div class="theme-grid"><button v-for="(theme,i) in THEMES" :key="theme" class="theme-card" :class="['theme-'+i,{selected:selectedTheme===i}]" @click="selectedTheme=i"><span class="theme-number">0{{i+1}}</span><span class="theme-name">{{theme}}<small>{{['Sunset & sandstone','Bustling stalls & warm light','Pink skies & festive flags','Golden light & temple views','Dusky mist & glowing lamps'][i]}}</small></span><span v-if="selectedTheme===i" class="theme-check">✓</span></button></div><button class="play-button" @click="start">PLAY {{THEMES[selectedTheme].toUpperCase()}} <span>→</span></button></template>
        <template v-if="panel==='credits'"><p class="eyebrow">MADE FOR THE FESTIVAL</p><h2>Vighnaharta Run</h2><p class="credits-copy">A celebration of courage, joy, and the blessings that meet us along the way.</p><p class="help-note">Built with Vue and Three.js using custom and creator-supplied 3D festival assets, procedural street scenery, and adaptive graphics for mobile devices. Menu illustration created with OpenAI image generation. Sound effects are supplied or synthesized in the browser.</p><p class="credits-mantra">Ganpati Bappa Morya!</p><button class="secondary-button" @click="panel=''">Back to the festival</button></template>
      </section>
      <section v-else-if="state.status==='paused'" class="modal-card compact-card" role="dialog" aria-modal="true" aria-label="Game paused"><span class="modal-ornament">ॐ</span><p class="eyebrow">TAKE A BREATH</p><h2>The festival can wait.</h2><p class="help-note">Your journey will be right here.</p><button class="play-button" @click="world?.resume()">CONTINUE RUN <span>▶</span></button><button class="secondary-button" @click="start">Start again</button><button class="text-button" @click="menu">Main menu</button></section>
      <section v-else-if="state.status==='over'" class="modal-card over-card" role="dialog" aria-modal="true" aria-label="Run complete"><span class="modal-ornament">ॐ</span><p class="eyebrow">EVERY JOURNEY IS AN OFFERING</p><h2>You offered {{state.modaks}} modaks<br>to Lord Ganesha.</h2><div class="final-score"><span>FINAL SCORE</span><strong>{{fmt(state.score)}}</strong></div><dl class="results"><div><dt>Best combo</dt><dd>×{{state.bestCombo}}</dd></div><div><dt>Modaks collected</dt><dd>{{state.modaks}}</dd></div><div><dt>Distance</dt><dd>{{fmt(state.distance)}} m</dd></div><div><dt>Time</dt><dd>{{clock}}</dd></div></dl><div class="score-submit"><label for="leaderboard-name">ENTER THE HALL OF BLESSINGS</label><div><input id="leaderboard-name" v-model="playerName" maxlength="20" autocomplete="nickname" placeholder="Your name" :disabled="scoreSubmitting||scoreSubmitted" @keyup.enter="submitFinalScore"><button type="button" @click="submitFinalScore" :disabled="scoreSubmitting||scoreSubmitted">{{scoreSubmitted?'SAVED':scoreSubmitting?'SAVING…':'SUBMIT'}}</button></div><small :class="{success:scoreSubmitted}">{{scoreSubmitMessage||'Your name and final score will appear on the global leaderboard.'}}</small></div><blockquote>“May wisdom guide your path today.”</blockquote><button class="play-button" @click="start">PLAY AGAIN <span>↻</span></button><button class="text-button" @click="menu">Main menu</button></section>
    </div>
  </main>
</template>

