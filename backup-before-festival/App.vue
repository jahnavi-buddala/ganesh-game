<template>
  <div class="app_root">
    <!-- 1) FESTIVE LOADING SCREEN -->
    <div v-if="!isReady" class="festive_loading_overlay">
      <div class="loading_card">
        <div class="om_loading_icon">
          <span class="om_glyph">ॐ</span>
        </div>
        <h2 class="loading_title">VIGHNAHARTA RUN</h2>
        <span class="loading_status_text">{{ loadingMessage }}</span>

        <!-- GOLDEN PROGRESS BAR -->
        <div class="progress_bar_track">
          <div class="progress_bar_fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress_count">{{ loadingData.itemsLoaded || 0 }} / {{ loadingData.itemsTotal || 0 }} assets loaded</span>
      </div>
    </div>

    <!-- 2) IN-GAME HUD (TOP-LEFT PAUSE + TOP-RIGHT COINS & SCORE) -->
    <ScorePanel 
      v-if="isReady" 
      :score="score" 
      :coin="coin" 
      :mistake="mistake" 
      @pause="handlePause"
    />

    <!-- 3) START / READY SCREEN -->
    <GameGuide 
      :show-mask="isReady && gameStatus === 'ready'" 
      @start="handleStart"
    />

    <!-- 4) PAUSE MODAL -->
    <PauseModal 
      :visible="isReady && gameStatus === 'pause'"
      @resume="handleResume"
      @restart="handleRestart"
    />

    <!-- 5) GAME OVER MODAL -->
    <GameOverModal 
      :visible="isReady && gameStatus === 'end'"
      :score="score"
      :coin="coin"
      @restart="handleRestart"
    />

    <!-- 6) 3D WEBGL CANVAS -->
    <div class="experience">
      <canvas ref="exp_canvas" class="experience__canvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';
import ScorePanel from './components/ScorePanel.vue';
import GameGuide from './components/GameGuide.vue';
import PauseModal from './components/PauseModal.vue';
import GameOverModal from './components/GameOverModal.vue';
import Game from './Game';

// State
const isReady = ref(false);
const score = ref(0);
const coin = ref(0);
const mistake = ref(0);
const gameStatus = ref('ready');
let loadingData: any = ref({});
const exp_canvas = ref<HTMLElement>();
let gameInstance: Game | null = null;

const progressPercent = computed(() => {
  const total = loadingData.value.itemsTotal || 0;
  const loaded = loadingData.value.itemsLoaded || 0;
  if (total === 0) return 15;
  return Math.min(100, Math.round((loaded / total) * 100));
});

const loadingMessage = computed(() => {
  if (loadingData.value.type === 'successLoad') return 'Blessings Ready! Entering Tracks...';
  if (loadingData.value.url) {
    const filename = loadingData.value.url.split('/').pop() || '';
    return `Loading ${filename}...`;
  }
  return 'Loading Divine Subway Tracks...';
});

// User Actions
const handleStart = () => {
  gameInstance?.startGame();
};

const handlePause = () => {
  gameInstance?.togglePause();
};

const handleResume = () => {
  gameInstance?.resumeGame();
};

const handleRestart = () => {
  gameInstance?.restartGame();
};

onMounted(() => {
  gameInstance = new Game(exp_canvas.value);

  // Resource Loading Manager
  gameInstance.on('progress', (data: any) => {
    const { type } = data;
    if (type === 'successLoad') {
      loadingData.value.type = 'successLoad';
      setTimeout(() => {
        isReady.value = true;
      }, 400);
    } else {
      loadingData.value = data;
    }
  });

  // Game Status Listener
  gameInstance.on('gameStatus', (data: any) => {
    gameStatus.value = data;
  });

  // Game Data Listener
  gameInstance.on('gameData', (data: any) => {
    score.value = data.score;
    coin.value = data.coin;
    mistake.value = data.mistake;
  });
});

onUnmounted(() => {
  gameInstance?.disposeGame();
});
</script>

<style scoped>
.app_root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: 'Cinzel', 'Poppins', sans-serif;
}

/* ── FESTIVE LOADING SCREEN ──────────────────────────── */
.festive_loading_overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, #3B100C 0%, #170403 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading_card {
  width: 88%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.om_loading_icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFB300, #E65100);
  border: 2.5px solid #FFE082;
  box-shadow: 0 0 25px rgba(255, 179, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  animation: pulseOm 1.5s infinite alternate ease-in-out;
}

.om_glyph {
  font-size: 38px;
  color: #FFFDE7;
  font-family: serif;
  font-weight: bold;
}

.loading_title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #FFF8E1;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFD54F 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.loading_status_text {
  font-size: 13px;
  color: #FFE082;
  font-family: 'Poppins', sans-serif;
  margin-bottom: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.progress_bar_track {
  width: 100%;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1.5px solid #FFD54F;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
}

.progress_bar_fill {
  height: 100%;
  background: linear-gradient(90deg, #FF8F00, #FFD54F);
  border-radius: 12px;
  box-shadow: 0 0 10px #FFD54F;
  transition: width 0.25s ease-out;
}

.progress_count {
  font-size: 11px;
  color: #FFE57F;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
}

/* ── 3D CANVAS VIEWPORT ──────────────────────────────── */
.experience {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
}

.experience__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

@keyframes pulseOm {
  0% { transform: scale(0.95); box-shadow: 0 0 15px rgba(255, 179, 0, 0.4); }
  100% { transform: scale(1.06); box-shadow: 0 0 35px rgba(255, 215, 0, 0.85); }
}
</style>