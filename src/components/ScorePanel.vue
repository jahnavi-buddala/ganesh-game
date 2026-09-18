<template>
  <div class="hud_container">
    <!-- TOP-LEFT: ROYAL PAUSE BUTTON & MULTIPLIER -->
    <div class="top_left_bar">
      <button class="royal_pause_btn" title="Pause Game" @click="$emit('pause')">
        <span class="pause_icon">❚❚</span>
      </button>

      <div class="multiplier_badge">
        <span class="mult_x">x</span><span class="mult_num">3</span>
      </div>
    </div>

    <!-- TOP-RIGHT: COINS & SCORE STACKED PILLS -->
    <div class="top_right_bar">
      <!-- COIN / MODAK PILL -->
      <div class="hud_pill coin_pill">
        <div class="coin_icon_wrap">
          <svg viewBox="0 0 36 36" class="coin_svg">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFE57F" />
                <stop offset="50%" stop-color="#FFC107" />
                <stop offset="100%" stop-color="#FF8F00" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill="url(#goldGrad)" stroke="#FFE082" stroke-width="2" />
            <circle cx="18" cy="18" r="12" fill="none" stroke="#FF8F00" stroke-width="1.5" stroke-dasharray="3 2" />
            <!-- Om symbol in coin -->
            <text x="18" y="24" text-anchor="middle" font-size="14" font-family="serif" font-weight="bold" fill="#78350F">ॐ</text>
          </svg>
        </div>
        <span class="pill_value">{{ coin.toLocaleString() }}</span>
      </div>

      <!-- SCORE PILL -->
      <div class="hud_pill score_pill">
        <span class="score_label">SCORE</span>
        <span class="score_value">{{ score.toLocaleString() }}</span>
      </div>

      <!-- DIYA PROTECTION / CHANCES -->
      <div class="diya_chances" title="Divine Protection (Chances Remaining)">
        <div 
          v-for="idx in 2" 
          :key="idx" 
          class="diya_indicator"
          :class="{ active: (2 - mistake) >= idx }"
        >
          <span class="diya_flame">🪔</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  score: number;
  coin: number;
  mistake: number;
}>();

defineEmits<{
  (e: 'pause'): void;
}>();
</script>

<style scoped>
.hud_container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  box-sizing: border-box;
  font-family: 'Cinzel', 'Poppins', sans-serif;
  user-select: none;
}

/* ── TOP-LEFT ────────────────────────────────────────── */
.top_left_bar {
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
}

.royal_pause_btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FF7043, #D84315 65%, #BF360C);
  border: 2.5px solid #FFE082;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 0 12px rgba(255, 179, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.royal_pause_btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6), 0 0 18px rgba(255, 215, 0, 0.8);
}

.royal_pause_btn:active {
  transform: scale(0.95);
}

.pause_icon {
  font-size: 17px;
  color: #FFF8E1;
  font-weight: 900;
  letter-spacing: -2px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  margin-left: -1px;
}

.multiplier_badge {
  background: linear-gradient(135deg, #FFB300 0%, #FF6F00 100%);
  border: 2px solid #FFE57F;
  border-radius: 20px;
  padding: 4px 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 10px rgba(255, 179, 0, 0.4);
  color: #3E1F00;
  font-weight: 800;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.mult_x {
  font-size: 13px;
  color: #5D2E00;
}

.mult_num {
  font-size: 19px;
  font-weight: 900;
}

/* ── TOP-RIGHT ───────────────────────────────────────── */
.top_right_bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: auto;
}

.hud_pill {
  min-width: 130px;
  background: linear-gradient(135deg, rgba(46, 16, 12, 0.88), rgba(26, 8, 6, 0.94));
  border: 1.8px solid #FFD54F;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 235, 180, 0.3);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  padding: 5px 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

/* Coin Pill */
.coin_pill {
  border-color: #FFCA28;
}

.coin_icon_wrap {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.coin_svg {
  width: 100%;
  height: 100%;
}

.pill_value {
  font-size: 20px;
  font-weight: 800;
  color: #FFF9C4;
  font-family: 'Poppins', sans-serif;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

/* Score Pill */
.score_pill {
  min-width: 145px;
  border-color: #FFB300;
  flex-direction: column;
  align-items: flex-end;
  padding: 4px 16px;
}

.score_label {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: #FFD54F;
  font-weight: 700;
}

.score_value {
  font-size: 24px;
  font-weight: 900;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(255, 179, 0, 0.4);
  line-height: 1.1;
}

/* Diya Protection Indicators */
.diya_chances {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  padding-right: 4px;
}

.diya_indicator {
  font-size: 19px;
  opacity: 0.25;
  filter: grayscale(1);
  transition: opacity 0.3s ease, filter 0.3s ease, transform 0.2s ease;
}

.diya_indicator.active {
  opacity: 1;
  filter: drop-shadow(0 0 6px #FF8F00);
  transform: scale(1.1);
}
</style>
