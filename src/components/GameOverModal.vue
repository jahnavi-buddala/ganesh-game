<template>
  <div v-if="visible" class="game_over_overlay">
    <div class="game_over_card">
      <!-- HEADER ICON -->
      <div class="crown_emblem_wrap">
        <span class="crown_icon">👑</span>
      </div>

      <!-- TITLE -->
      <div class="over_title_group">
        <span class="sanskrit_blessing">॥ विघ्नहर्ता विजयते ॥</span>
        <h2 class="run_finished_title">RUN FINISHED</h2>
        <div v-if="isNewHighScore" class="new_record_badge">✨ NEW HIGH SCORE! ✨</div>
      </div>

      <!-- STATS GRID -->
      <div class="stats_card_grid">
        <div class="stat_tile primary">
          <span class="stat_tile_label">FINAL SCORE</span>
          <span class="stat_tile_value score_val">{{ score.toLocaleString() }}</span>
        </div>

        <div class="stat_tile_row">
          <div class="stat_tile">
            <span class="stat_tile_label">COINS COLLECTED</span>
            <div class="tile_icon_val">
              <span class="tile_mini_coin">🪙</span>
              <span class="stat_tile_value">{{ coin.toLocaleString() }}</span>
            </div>
          </div>

          <div class="stat_tile">
            <span class="stat_tile_label">BEST SCORE</span>
            <span class="stat_tile_value gold_val">{{ highScore.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- PLAY AGAIN BUTTON -->
      <button class="divine_retry_btn" @click="$emit('restart')">
        <span class="retry_icon">↺</span>
        <span class="retry_text">PLAY AGAIN (PRESS R)</span>
      </button>
    </div>
  </div>
</template>

<script setup lang=ts>
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  visible: boolean;
  score: number;
  coin: number;
}>();

defineEmits<{
  (e: 'restart'): void;
}>();

const highScore = ref(0);
const isNewHighScore = ref(false);

const checkHighScore = () => {
  const stored = localStorage.getItem('vighnaharta_subway_highscore');
  const previous = stored ? parseInt(stored, 10) : 0;
  if (props.score > previous) {
    localStorage.setItem('vighnaharta_subway_highscore', props.score.toString());
    highScore.value = props.score;
    isNewHighScore.value = previous > 0;
  } else {
    highScore.value = previous;
    isNewHighScore.value = false;
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    checkHighScore();
  }
});

onMounted(() => {
  const stored = localStorage.getItem('vighnaharta_subway_highscore');
  highScore.value = stored ? parseInt(stored, 10) : 0;
});
</script>

<style scoped>
.game_over_overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 45%, rgba(35, 10, 6, 0.72) 0%, rgba(10, 2, 2, 0.92) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 600;
  font-family: 'Cinzel', 'Poppins', sans-serif;
  user-select: none;
  backdrop-filter: blur(6px);
  animation: modalFadeIn 0.35s ease-out;
}

.game_over_card {
  width: 90%;
  max-width: 440px;
  background: linear-gradient(180deg, #3A100C 0%, #1E0705 100%);
  border: 2.5px solid #FFD54F;
  border-radius: 26px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 179, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 26px;
  text-align: center;
}

.crown_emblem_wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFCA28, #E65100);
  border: 2.5px solid #FFE082;
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}

.crown_icon {
  font-size: 34px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.over_title_group {
  margin-bottom: 20px;
}

.sanskrit_blessing {
  font-size: 12px;
  color: #FFE082;
  letter-spacing: 2px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

.run_finished_title {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  color: #FFF8E1;
  letter-spacing: 1.5px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFD54F 55%, #FF8F00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));
}

.new_record_badge {
  display: inline-block;
  background: linear-gradient(90deg, #E65100, #FF8F00);
  border: 1.5px solid #FFE082;
  border-radius: 12px;
  padding: 2px 12px;
  font-size: 11px;
  font-weight: 800;
  color: #FFF8E1;
  letter-spacing: 1.5px;
  margin-top: 6px;
  animation: pulseBadge 1.2s infinite alternate;
}

/* ── STATS GRID ──────────────────────────────────────── */
.stats_card_grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.stat_tile_row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat_tile {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 213, 79, 0.35);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.stat_tile.primary {
  background: linear-gradient(180deg, rgba(74, 18, 12, 0.5) 0%, rgba(30, 8, 5, 0.6) 100%);
  border-color: #FFCA28;
  padding: 14px 16px;
}

.stat_tile_label {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: #FFE082;
  font-weight: 700;
}

.stat_tile_value {
  font-size: 20px;
  font-weight: 900;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
}

.score_val {
  font-size: 32px;
  color: #FFD54F;
  text-shadow: 0 0 12px rgba(255, 213, 79, 0.5);
  line-height: 1.1;
}

.gold_val {
  color: #FFCA28;
}

.tile_icon_val {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tile_mini_coin {
  font-size: 16px;
}

/* ── RETRY BUTTON ────────────────────────────────────── */
.divine_retry_btn {
  width: 100%;
  padding: 15px 24px;
  border-radius: 40px;
  background: linear-gradient(135deg, #FFB300 0%, #FF6F00 50%, #E65100 100%);
  border: 2px solid #FFF8E1;
  box-shadow: 0 8px 24px rgba(255, 111, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 179, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.divine_retry_btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 30px rgba(255, 111, 0, 0.6), 0 0 24px rgba(255, 215, 0, 0.8);
}

.divine_retry_btn:active {
  transform: translateY(1px) scale(0.98);
}

.retry_icon {
  font-size: 20px;
  color: #3E1A00;
  font-weight: 900;
}

.retry_text {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #3E1A00;
  font-family: 'Poppins', sans-serif;
}

@keyframes pulseBadge {
  0% { transform: scale(1); }
  100% { transform: scale(1.06); }
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
}
</style>
