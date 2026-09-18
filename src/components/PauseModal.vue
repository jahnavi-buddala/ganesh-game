<template>
  <div v-if="visible" class="pause_overlay">
    <div class="pause_card">
      <div class="pause_icon_wrap">
        <span class="pause_glyph">❚❚</span>
      </div>

      <h2 class="pause_title">GAME PAUSED</h2>
      <p class="pause_sub">Take a sacred breath before continuing your run.</p>

      <div class="pause_actions">
        <button class="action_btn resume_btn" @click="$emit('resume')">
          <span class="btn_icon">▶</span>
          <span>RESUME (PRESS P)</span>
        </button>

        <button class="action_btn restart_btn" @click="$emit('restart')">
          <span class="btn_icon">↺</span>
          <span>RESTART (PRESS R)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang=ts>
defineProps<{
  visible: boolean;
}>();

defineEmits<{
  (e: 'resume'): void;
  (e: 'restart'): void;
}>();
</script>

<style scoped>
.pause_overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 45%, rgba(26, 8, 4, 0.7) 0%, rgba(10, 2, 2, 0.9) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 600;
  font-family: 'Cinzel', 'Poppins', sans-serif;
  user-select: none;
  backdrop-filter: blur(8px);
  animation: pauseFadeIn 0.25s ease-out;
}

.pause_card {
  width: 88%;
  max-width: 400px;
  background: linear-gradient(180deg, #38100C 0%, #1A0604 100%);
  border: 2.5px solid #FFD54F;
  border-radius: 26px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 179, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 28px;
  text-align: center;
}

.pause_icon_wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FF7043, #BF360C);
  border: 2.5px solid #FFE082;
  box-shadow: 0 0 20px rgba(255, 112, 67, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.pause_glyph {
  font-size: 22px;
  color: #FFF8E1;
  font-weight: 900;
  letter-spacing: -2px;
  margin-left: -2px;
}

.pause_title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #FFF8E1;
  letter-spacing: 1.5px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFD54F 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pause_sub {
  font-size: 13px;
  color: #FFE082;
  font-family: 'Poppins', sans-serif;
  margin: 8px 0 24px;
}

.pause_actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action_btn {
  width: 100%;
  padding: 14px 20px;
  border-radius: 36px;
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.resume_btn {
  background: linear-gradient(135deg, #FFB300 0%, #FF6F00 50%, #E65100 100%);
  border: 2px solid #FFF8E1;
  color: #3E1A00;
  box-shadow: 0 6px 20px rgba(255, 111, 0, 0.4);
}

.resume_btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 111, 0, 0.6);
}

.restart_btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 213, 79, 0.5);
  color: #FFE082;
}

.restart_btn:hover {
  background: rgba(255, 213, 79, 0.15);
  border-color: #FFD54F;
  color: #FFFFFF;
}

@keyframes pauseFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
