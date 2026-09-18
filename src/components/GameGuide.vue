<template>
  <div v-if="showMask" class="start_screen_overlay">
    <div class="divine_modal_card">
      <!-- SACRED OM EMBLEM -->
      <div class="om_emblem_wrap">
        <div class="om_radiance"></div>
        <span class="om_symbol">ॐ</span>
      </div>

      <!-- TITLE -->
      <div class="title_group">
        <span class="subtext_sanskrit">॥ श्री गणेशाय नमः ॥</span>
        <h1 class="main_game_title">VIGHNAHARTA</h1>
        <div class="subtitle_pill">SUBWAY RUNNER</div>
      </div>

      <!-- START BUTTON -->
      <button class="divine_start_btn" @click="$emit('start')">
        <span class="play_icon">▶</span>
        <span class="play_text">TAP TO RUN (PRESS P)</span>
      </button>

      <!-- CONTROLS TUTORIAL CARD -->
      <div class="controls_guide_card">
        <div class="control_col">
          <div class="key_badge_row">
            <span class="key_chip">A</span>
            <span class="key_chip">D</span>
            <span class="chip_or">/</span>
            <span class="key_chip">←</span>
            <span class="key_chip">→</span>
          </div>
          <span class="action_label">Switch Tracks</span>
        </div>

        <div class="control_divider"></div>

        <div class="control_col">
          <div class="key_badge_row">
            <span class="key_chip">W</span>
            <span class="key_chip">SPACE</span>
            <span class="chip_or">/</span>
            <span class="key_chip">↑</span>
          </div>
          <span class="action_label">Super Leap</span>
        </div>

        <div class="control_divider"></div>

        <div class="control_col">
          <div class="key_badge_row">
            <span class="key_chip">S</span>
            <span class="chip_or">/</span>
            <span class="key_chip">↓</span>
          </div>
          <span class="action_label">Sacred Roll</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showMask: boolean;
}>();

defineEmits<{
  (e: 'start'): void;
}>();
</script>

<style scoped>
.start_screen_overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 40%, rgba(28, 8, 4, 0.65) 0%, rgba(12, 3, 2, 0.88) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 500;
  font-family: 'Cinzel', 'Poppins', sans-serif;
  user-select: none;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.4s ease-out;
}

.divine_modal_card {
  width: 90%;
  max-width: 480px;
  background: linear-gradient(180deg, #38100C 0%, #200806 100%);
  border: 2.5px solid #FFD54F;
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 35px rgba(255, 179, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 28px 28px;
  position: relative;
  text-align: center;
}

/* ── OM EMBLEM ───────────────────────────────────────── */
.om_emblem_wrap {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFB300, #E65100);
  border: 3px solid #FFE082;
  box-shadow: 0 0 25px rgba(255, 179, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 16px;
}

.om_radiance {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 0 30px #FFB300;
  animation: pulseGlow 2s infinite alternate;
}

.om_symbol {
  font-size: 40px;
  font-family: serif;
  color: #FFFDE7;
  font-weight: bold;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  line-height: 1;
}

/* ── TITLES ──────────────────────────────────────────── */
.title_group {
  margin-bottom: 24px;
}

.subtext_sanskrit {
  font-size: 13px;
  color: #FFE082;
  letter-spacing: 2px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

.main_game_title {
  margin: 0;
  font-size: 38px;
  font-weight: 900;
  color: #FFF8E1;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFD54F 50%, #FF8F00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.8));
}

.subtitle_pill {
  display: inline-block;
  background: linear-gradient(90deg, #B71C1C, #D32F2F);
  border: 1.5px solid #FFD54F;
  border-radius: 14px;
  padding: 3px 14px;
  font-size: 11px;
  font-weight: 800;
  color: #FFE57F;
  letter-spacing: 3px;
  margin-top: 6px;
}

/* ── START BUTTON ────────────────────────────────────── */
.divine_start_btn {
  width: 100%;
  padding: 16px 24px;
  border-radius: 40px;
  background: linear-gradient(135deg, #FFB300 0%, #FF6F00 50%, #E65100 100%);
  border: 2px solid #FFF8E1;
  box-shadow: 0 8px 24px rgba(255, 111, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 179, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  margin-bottom: 22px;
}

.divine_start_btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 30px rgba(255, 111, 0, 0.6), 0 0 24px rgba(255, 215, 0, 0.8);
}

.divine_start_btn:active {
  transform: translateY(1px) scale(0.98);
}

.play_icon {
  font-size: 18px;
  color: #3E1A00;
}

.play_text {
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #3E1A00;
  font-family: 'Poppins', sans-serif;
}

/* ── CONTROLS GUIDE CARD ─────────────────────────────── */
.controls_guide_card {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 213, 79, 0.3);
  border-radius: 16px;
  padding: 14px 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-sizing: border-box;
}

.control_col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.key_badge_row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.key_chip {
  background: #FFE082;
  color: #3E1A00;
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

.chip_or {
  color: #FFB300;
  font-size: 11px;
  font-weight: 700;
}

.action_label {
  font-size: 10px;
  color: #FFF8E1;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.control_divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 213, 79, 0.25);
}

@keyframes pulseGlow {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0.9; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
</style>
