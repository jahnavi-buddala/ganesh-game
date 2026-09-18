<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  GANESH_STORY,
  QUIZ_QUESTIONS,
  generateBalancedQuizSet,
  generateExtendedBalancedQuiz,
  type Question,
  type Difficulty
} from './data';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Sound synthesis using Web Audio API
class QuizSoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Suspense heartbeat pulse
  heartbeat(urgency = 1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60 * urgency, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.25 * urgency, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  // Tension tick
  tick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // Correct answer chime (temple bell harmony)
  correct() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const now = this.ctx!.currentTime + idx * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    } catch {}
  }

  // Incorrect answer dull chime
  wrong() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [293.66, 277.18]; // D4, C#4
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const now = this.ctx!.currentTime + idx * 0.12;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch {}
  }

  // Adrenaline alarm sting
  alarm() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }
}

const sounds = new QuizSoundManager();
const soundMuted = ref(false);

function toggleSound() {
  soundMuted.value = !soundMuted.value;
  sounds.enabled = !soundMuted.value;
}

// Game State
type GameView = 'intro' | 'playing' | 'story' | 'summary';
type QuizMode = 'balanced6' | 'balanced18' | 'all50';

const currentView = ref<GameView>('intro');
const selectedMode = ref<QuizMode>('balanced6'); // Default to 3 Easy, 1 Medium, 2 Hard
const targetPacingSeconds = ref<number>(45);

const availablePacings = [
  { label: '40s (Fast & Thrilling)', value: 40 },
  { label: '45s (Optimal Adrenaline & Focus)', value: 45 },
  { label: '60s (Relaxed Story Time)', value: 60 }
];

const availableModes = [
  {
    id: 'balanced6',
    title: '👶 Kid’s Balanced Round (6 Questions)',
    desc: '3 Easy + 1 Medium + 2 Hard questions. Perfect for students and quick fun!'
  },
  {
    id: 'balanced18',
    title: '🌟 Balanced Adventure (18 Questions)',
    desc: '3 complete cycles of 3 Easy, 1 Medium, and 2 Hard questions.'
  },
  {
    id: 'all50',
    title: '🏆 Grand Marathon (All 50 Questions)',
    desc: 'The complete bank of 20 Easy, 15 Medium, and 15 Hard questions.'
  }
];

// Randomized questions list
const randomizedQuestions = ref<Question[]>([]);
const currentIndex = ref(0);
const selectedOption = ref<number | null>(null);
const isLocked = ref(false);
const isRevealed = ref(false);

// Timer values
const timeRemaining = ref(45);
let timerInterval: number | null = null;
let lastHeartbeatSecond = -1;

// Scoring & Stats
interface AnswerRecord {
  questionId: number;
  questionText: string;
  selectedOption: number | null;
  correctOption: number;
  options: string[];
  explanation: string;
  isCorrect: boolean;
  timeSpent: number;
  category: string;
  difficulty: Difficulty;
}

const userAnswers = ref<AnswerRecord[]>([]);
const score = ref(0);
const combo = ref(0);
const maxCombo = ref(0);
const modaksWon = ref(0);

const currentQuestion = computed(() => randomizedQuestions.value[currentIndex.value] || null);
const timerPercent = computed(() => {
  return Math.max(0, Math.min(100, (timeRemaining.value / targetPacingSeconds.value) * 100));
});

const isAdrenalineSurge = computed(() => {
  return timeRemaining.value <= 15 && timeRemaining.value > 0 && !isRevealed.value;
});

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startQuiz() {
  if (selectedMode.value === 'balanced6') {
    randomizedQuestions.value = generateBalancedQuizSet();
  } else if (selectedMode.value === 'balanced18') {
    randomizedQuestions.value = generateExtendedBalancedQuiz(3);
  } else {
    randomizedQuestions.value = shuffle(QUIZ_QUESTIONS);
  }
  currentIndex.value = 0;
  userAnswers.value = [];
  score.value = 0;
  combo.value = 0;
  maxCombo.value = 0;
  modaksWon.value = 0;
  currentView.value = 'playing';
  prepareQuestion();
}

function prepareQuestion() {
  selectedOption.value = null;
  isLocked.value = false;
  isRevealed.value = false;
  timeRemaining.value = targetPacingSeconds.value;
  lastHeartbeatSecond = -1;
  startTimer();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
      
      const currentSec = timeRemaining.value;
      if (currentSec <= 15 && currentSec > 0 && currentSec !== lastHeartbeatSecond) {
        lastHeartbeatSecond = currentSec;
        sounds.heartbeat(1.4);
      } else if (currentSec % 5 === 0 && currentSec > 0) {
        sounds.tick();
      }

      if (currentSec === 15) {
        sounds.alarm();
      }
    } else {
      handleTimeExpired();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleSelectOption(index: number) {
  if (isRevealed.value) return;
  selectedOption.value = index;
  isLocked.value = true;
  sounds.tick();
}

function revealCurrentAnswer() {
  if (isRevealed.value) return;
  stopTimer();
  isRevealed.value = true;

  const q = currentQuestion.value;
  if (!q) return;

  const isCorrect = selectedOption.value === q.correctIndex;
  const timeSpent = targetPacingSeconds.value - timeRemaining.value;

  if (isCorrect) {
    sounds.correct();
    combo.value++;
    if (combo.value > maxCombo.value) maxCombo.value = combo.value;
    const diffBonus = q.difficulty === 'hard' ? 200 : q.difficulty === 'medium' ? 150 : 100;
    const points = diffBonus + combo.value * 20 + Math.max(0, timeRemaining.value * 2);
    score.value += points;
    modaksWon.value += 1 + (combo.value >= 3 ? 1 : 0);
  } else {
    sounds.wrong();
    combo.value = 0;
  }

  userAnswers.value.push({
    questionId: q.id,
    questionText: q.question,
    selectedOption: selectedOption.value,
    correctOption: q.correctIndex,
    options: q.options,
    explanation: q.explanation,
    isCorrect,
    timeSpent,
    category: q.category,
    difficulty: q.difficulty
  });
}

function handleTimeExpired() {
  revealCurrentAnswer();
}

function nextQuestion() {
  if (!isRevealed.value) {
    revealCurrentAnswer();
    return;
  }

  if (currentIndex.value < randomizedQuestions.value.length - 1) {
    currentIndex.value++;
    prepareQuestion();
  } else {
    stopTimer();
    currentView.value = 'summary';
  }
}

const storyActiveTab = ref(0);

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div class="ganesh-quiz-container">
    <!-- Top Bar Navigation -->
    <header class="quiz-topbar">
      <div class="topbar-brand">
        <span class="sacred-om">ॐ</span>
        <div>
          <h1>GANESH CHATURTHI ADRENALINE QUIZ</h1>
          <p class="subtitle">Kid-Friendly Story Edition · 3 Easy, 1 Med, 2 Hard · 45s Delay</p>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="nav-pill" @click="currentView = currentView === 'story' ? 'playing' : 'story'">
          📖 {{ currentView === 'story' ? 'Return to Quiz' : 'Read Story' }}
        </button>
        <button class="icon-pill" @click="toggleSound" :title="soundMuted ? 'Unmute Sound' : 'Mute Sound'">
          {{ soundMuted ? '🔇' : '🔊' }}
        </button>
        <button class="icon-pill close-pill" @click="emit('close')" title="Exit Quiz">
          ✕
        </button>
      </div>
    </header>

    <!-- MAIN VIEW: INTRO -->
    <div v-if="currentView === 'intro'" class="quiz-view intro-view">
      <div class="intro-hero-card">
        <div class="hero-badge">🧒 KID-FRIENDLY & BALANCED FUN</div>
        <h2 class="hero-title">The Sacred Legend of Lord Ganesha</h2>
        <p class="hero-narrative">
          A wonderful and joyful adventure for young champions! From Mother Parvati shaping Ganesha from golden turmeric to Ganesha writing the great epic with his broken tusk and outsmarting the proud moon.
        </p>

        <!-- Mode Selection Box -->
        <div class="mode-select-box">
          <label class="section-label">Select Quiz Mode for This User:</label>
          <div class="mode-cards-grid">
            <button
              v-for="m in availableModes"
              :key="m.id"
              class="mode-card-btn"
              :class="{ active: selectedMode === m.id }"
              @click="selectedMode = m.id as QuizMode"
            >
              <div class="mode-title">{{ m.title }}</div>
              <p class="mode-desc">{{ m.desc }}</p>
              <span v-if="selectedMode === m.id" class="check-badge">✓ Selected</span>
            </button>
          </div>
        </div>

        <div class="adrenaline-explanation">
          <div class="adrenaline-icon">⏱️</div>
          <div>
            <h3>The 45-Second Adrenaline Pacing</h3>
            <p>
              Each question gives kids a comfortable <strong>45-second timer</strong> to think and explore before the answer is revealed. In the final 15 seconds, adrenaline surge mode begins with exciting heartbeat ticks!
            </p>
          </div>
        </div>

        <div class="pacing-selector">
          <label>Question Delay / Timer:</label>
          <div class="pacing-buttons">
            <button
              v-for="p in availablePacings"
              :key="p.value"
              :class="{ active: targetPacingSeconds === p.value }"
              @click="targetPacingSeconds = p.value"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="intro-stats-grid">
          <div class="stat-card">
            <span class="stat-num">20</span>
            <span class="stat-label">⭐ Easy Questions</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">15</span>
            <span class="stat-label">⭐⭐ Medium Questions</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">15</span>
            <span class="stat-label">⭐⭐⭐ Hard Questions</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ targetPacingSeconds }}s</span>
            <span class="stat-label">Adrenaline Delay</span>
          </div>
        </div>

        <div class="intro-actions">
          <button class="btn-primary-golden" @click="startQuiz">
            <span>START BALANCED QUIZ (3 Easy, 1 Med, 2 Hard)</span>
            <span class="arrow">▶</span>
          </button>
          <button class="btn-secondary-outline" @click="currentView = 'story'">
            📖 Read Full Story First
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN VIEW: PLAYING -->
    <div v-else-if="currentView === 'playing' && currentQuestion" class="quiz-view playing-view">
      <!-- HUD Bar -->
      <div class="hud-strip">
        <div class="hud-item progress-item">
          <span class="hud-label">QUESTION</span>
          <span class="hud-val">{{ currentIndex + 1 }} <span>/ {{ randomizedQuestions.length }}</span></span>
        </div>
        <div class="hud-item difficulty-item">
          <span class="hud-label">DIFFICULTY</span>
          <span class="hud-diff-badge" :class="currentQuestion.difficulty">
            {{ currentQuestion.difficulty === 'easy' ? '⭐ Easy' : currentQuestion.difficulty === 'medium' ? '⭐⭐ Medium' : '⭐⭐⭐ Hard' }}
          </span>
        </div>
        <div class="hud-item score-item">
          <span class="hud-label">SCORE</span>
          <span class="hud-val">{{ score }}</span>
        </div>
        <div class="hud-item combo-item" :class="{ 'has-combo': combo >= 2 }">
          <span class="hud-label">COMBO</span>
          <span class="hud-val">×{{ combo }}</span>
        </div>
        <div class="hud-item modak-item">
          <span class="hud-label">MODAKS</span>
          <span class="hud-val">🥟 {{ modaksWon }}</span>
        </div>
      </div>

      <!-- Live 45s Adrenaline Timer Strip -->
      <div class="adrenaline-bar-wrap" :class="{ 'surge-active': isAdrenalineSurge }">
        <div class="adrenaline-timer-info">
          <div class="timer-countdown" :class="{ 'urgent-text': timeRemaining <= 15 }">
            <span class="pulse-icon">{{ isAdrenalineSurge ? '🔥' : '⏳' }}</span>
            <span class="seconds-display">{{ timeRemaining }}s</span>
            <span class="delay-mode">ADRENALINE TIMER ({{ targetPacingSeconds }}s)</span>
          </div>
          <div v-if="isAdrenalineSurge" class="surge-pill">
            ⚠️ 15 SECONDS LEFT! ADRENALINE SURGE!
          </div>
          <div v-else-if="isLocked && !isRevealed" class="locked-pill">
            🔒 ANSWER LOCKED IN · WAITING FOR REVEAL
          </div>
        </div>

        <div class="timer-track">
          <div
            class="timer-fill"
            :class="{ urgent: timeRemaining <= 15 }"
            :style="{ width: timerPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Question Card -->
      <main class="question-main-card" :class="{ 'card-surge': isAdrenalineSurge }">
        <div class="q-header">
          <div class="q-badges">
            <span class="difficulty-pill" :class="currentQuestion.difficulty">
              {{ currentQuestion.difficulty === 'easy' ? '⭐ Easy Question' : currentQuestion.difficulty === 'medium' ? '⭐⭐ Medium Question' : '⭐⭐⭐ Hard Question' }}
            </span>
            <span class="q-number-pill">QUESTION {{ currentIndex + 1 }} OF {{ randomizedQuestions.length }}</span>
          </div>
          <span class="story-ref">{{ currentQuestion.category }}</span>
        </div>

        <h2 class="q-text">{{ currentQuestion.question }}</h2>

        <!-- 4 Options Grid -->
        <div class="options-grid">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option-card"
            :class="{
              selected: selectedOption === idx,
              'correct-answer': isRevealed && idx === currentQuestion.correctIndex,
              'wrong-answer': isRevealed && selectedOption === idx && idx !== currentQuestion.correctIndex,
              locked: isLocked && !isRevealed
            }"
            :disabled="isRevealed"
            @click="handleSelectOption(idx)"
          >
            <div class="option-marker">
              {{ ['A', 'B', 'C', 'D'][idx] }}
            </div>
            <div class="option-content">
              {{ opt }}
            </div>
            <div v-if="isRevealed && idx === currentQuestion.correctIndex" class="verdict-icon">
              ✓
            </div>
            <div v-else-if="isRevealed && selectedOption === idx && idx !== currentQuestion.correctIndex" class="verdict-icon wrong">
              ✕
            </div>
          </button>
        </div>

        <!-- Explanation & Story Citation -->
        <transition name="fade">
          <div v-if="isRevealed" class="explanation-box" :class="{ success: selectedOption === currentQuestion.correctIndex }">
            <div class="explanation-badge">
              {{ selectedOption === currentQuestion.correctIndex ? '✨ BAPPA BLESSES YOU! CORRECT!' : '🕉️ STORY REVELATION' }}
            </div>
            <p class="explanation-text">{{ currentQuestion.explanation }}</p>
          </div>
        </transition>

        <!-- Bottom Action Bar -->
        <footer class="card-footer-actions">
          <div class="status-tip">
            <span v-if="!isLocked">👉 Tap your answer to lock it in!</span>
            <span v-else-if="isLocked && !isRevealed">🔒 Locked in! Enjoy the 45s countdown or reveal answer:</span>
            <span v-else>💡 Read the wonderful story fact above!</span>
          </div>

          <div class="action-buttons">
            <button
              v-if="!isRevealed"
              class="btn-reveal"
              :disabled="selectedOption === null"
              @click="revealCurrentAnswer"
            >
              {{ selectedOption === null ? 'Select an Option' : 'Lock & Reveal Answer Now' }}
            </button>

            <button
              v-else
              class="btn-next-question"
              @click="nextQuestion"
            >
              <span>{{ currentIndex < randomizedQuestions.length - 1 ? 'NEXT QUESTION (45s)' : 'VIEW FINAL BLESSINGS' }}</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
        </footer>
      </main>
    </div>

    <!-- MAIN VIEW: STORY READER -->
    <div v-else-if="currentView === 'story'" class="quiz-view story-view">
      <div class="story-book-card">
        <div class="story-header">
          <h2>{{ GANESH_STORY.title }}</h2>
          <p class="story-subtitle">{{ GANESH_STORY.subtitle }}</p>
          <div class="chapter-nav-tabs">
            <button
              v-for="(ch, idx) in GANESH_STORY.chapters"
              :key="idx"
              class="chapter-tab"
              :class="{ active: storyActiveTab === idx }"
              @click="storyActiveTab = idx"
            >
              Ch. {{ idx + 1 }}
            </button>
          </div>
        </div>

        <article class="chapter-body">
          <h3 class="chapter-title">{{ GANESH_STORY.chapters[storyActiveTab].title }}</h3>
          <div class="chapter-text-content">
            <p v-for="(p, pIdx) in GANESH_STORY.chapters[storyActiveTab].content.split('\n\n')" :key="pIdx">
              {{ p }}
            </p>
          </div>
        </article>

        <footer class="story-footer">
          <div class="story-nav-buttons">
            <button
              class="btn-story-nav"
              :disabled="storyActiveTab === 0"
              @click="storyActiveTab--"
            >
              ← Previous Chapter
            </button>
            <span class="chapter-indicator">Chapter {{ storyActiveTab + 1 }} of {{ GANESH_STORY.chapters.length }}</span>
            <button
              class="btn-story-nav"
              :disabled="storyActiveTab === GANESH_STORY.chapters.length - 1"
              @click="storyActiveTab++"
            >
              Next Chapter →
            </button>
          </div>
          <button class="btn-primary-golden" @click="currentView = randomizedQuestions.length ? 'playing' : 'intro'">
            {{ randomizedQuestions.length ? 'Return to Active Quiz' : 'Begin Quiz Challenge' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- MAIN VIEW: SUMMARY & RESULTS -->
    <div v-else-if="currentView === 'summary'" class="quiz-view summary-view">
      <div class="summary-hero-card">
        <div class="sacred-seal">ॐ</div>
        <h2 class="summary-title">Divine Journey Complete!</h2>
        <p class="summary-tagline">May Lord Vighnaharta bless your learning and fill your life with joy!</p>

        <div class="final-score-showcase">
          <div class="score-large">
            <span class="score-label">FINAL SCORE</span>
            <span class="score-number">{{ score }}</span>
          </div>
          <div class="summary-pills">
            <div class="summary-pill">
              <span class="p-num">{{ userAnswers.filter(a => a.isCorrect).length }} / {{ userAnswers.length }}</span>
              <span class="p-label">Correct Answers</span>
            </div>
            <div class="summary-pill">
              <span class="p-num">{{ Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100) }}%</span>
              <span class="p-label">Sacred Accuracy</span>
            </div>
            <div class="summary-pill">
              <span class="p-num">×{{ maxCombo }}</span>
              <span class="p-label">Max Combo</span>
            </div>
            <div class="summary-pill">
              <span class="p-num">🥟 {{ modaksWon }}</span>
              <span class="p-label">Modaks Won</span>
            </div>
          </div>
        </div>

        <div class="summary-actions">
          <button class="btn-primary-golden" @click="startQuiz">
            <span>PLAY AGAIN (NEW RANDOM SET)</span>
            <span class="arrow">↻</span>
          </button>
          <button class="btn-secondary-outline" @click="currentView = 'story'">
            📖 Read Full Story
          </button>
          <button class="btn-secondary-outline" @click="emit('close')">
            Back to Festival Runner
          </button>
        </div>

        <!-- Question Review Ledger -->
        <section class="review-ledger">
          <h3 class="ledger-title">Question-by-Question Story Review</h3>
          <div class="ledger-list">
            <div
              v-for="(item, idx) in userAnswers"
              :key="idx"
              class="ledger-item"
              :class="{ correct: item.isCorrect, incorrect: !item.isCorrect }"
            >
              <div class="ledger-header">
                <div>
                  <span class="item-num">Q{{ idx + 1 }}</span>
                  <span class="difficulty-pill-sm" :class="item.difficulty">
                    {{ item.difficulty === 'easy' ? '⭐ Easy' : item.difficulty === 'medium' ? '⭐⭐ Med' : '⭐⭐⭐ Hard' }}
                  </span>
                  <span class="item-category">{{ item.category }}</span>
                </div>
                <span class="verdict-tag">{{ item.isCorrect ? '✓ CORRECT' : '✕ MISSED' }}</span>
              </div>
              <h4 class="item-q">{{ item.questionText }}</h4>
              <div class="item-answer-row">
                <div class="your-ans">
                  <strong>Your Pick:</strong>
                  <span>{{ item.selectedOption !== null ? item.options[item.selectedOption] : 'Time Expired (None)' }}</span>
                </div>
                <div class="correct-ans">
                  <strong>Correct Answer:</strong>
                  <span>{{ item.options[item.correctOption] }}</span>
                </div>
              </div>
              <p class="item-exp"><strong>Sacred Lore:</strong> {{ item.explanation }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ganesh-quiz-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 20%, #2b1102 0%, #120701 60%, #080301 100%);
  color: #fff3e0;
  font-family: 'Cinzel', 'Segoe UI', serif, sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
  position: relative;
  z-index: 100;
}

/* TOPBAR */
.quiz-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: rgba(20, 7, 2, 0.9);
  border-bottom: 2px solid rgba(245, 166, 35, 0.35);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sacred-om {
  font-size: 2.2rem;
  color: #ffaa00;
  text-shadow: 0 0 16px rgba(255, 170, 0, 0.7);
  font-family: serif;
}

.topbar-brand h1 {
  font-size: 1.25rem;
  margin: 0;
  color: #ffe082;
  letter-spacing: 2px;
  font-weight: 700;
}

.topbar-brand .subtitle {
  font-size: 0.8rem;
  margin: 2px 0 0;
  color: #d7ccc8;
  letter-spacing: 0.5px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-pill, .icon-pill {
  background: rgba(255, 170, 0, 0.12);
  border: 1px solid rgba(255, 170, 0, 0.3);
  color: #ffecb3;
  padding: 8px 16px;
  border-radius: 24px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.icon-pill {
  padding: 8px 14px;
  font-size: 1.1rem;
}

.close-pill {
  background: rgba(239, 83, 80, 0.15);
  border-color: rgba(239, 83, 80, 0.4);
  color: #ffcdd2;
}

.nav-pill:hover, .icon-pill:hover {
  background: rgba(255, 170, 0, 0.3);
  transform: translateY(-1px);
}

/* VIEWS CONTAINER */
.quiz-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* INTRO VIEW */
.intro-hero-card {
  background: linear-gradient(145deg, rgba(45, 18, 5, 0.95), rgba(24, 9, 2, 0.95));
  border: 2px solid rgba(255, 170, 0, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 153, 0, 0.1);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 880px;
  margin: auto;
}

.hero-badge {
  display: inline-block;
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid #66bb6a;
  color: #c8e6c9;
  font-size: 0.82rem;
  font-weight: bold;
  letter-spacing: 2px;
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
}

.hero-title {
  font-size: 2.3rem;
  color: #fff8e1;
  text-shadow: 0 2px 10px rgba(255, 170, 0, 0.4);
  margin-bottom: 16px;
  font-weight: 800;
}

.hero-narrative {
  font-size: 1.05rem;
  line-height: 1.7;
  color: #ffecb3;
  margin-bottom: 28px;
}

/* MODE SELECTION GRID */
.mode-select-box {
  margin-bottom: 28px;
  text-align: left;
}

.section-label {
  display: block;
  font-size: 0.9rem;
  color: #ffd54f;
  margin-bottom: 12px;
  font-weight: 700;
  text-align: center;
}

.mode-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mode-card-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 170, 0, 0.25);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  color: #ffecb3;
  text-align: left;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.mode-card-btn:hover {
  background: rgba(255, 170, 0, 0.15);
  border-color: #ffd54f;
  transform: translateY(-2px);
}

.mode-card-btn.active {
  background: rgba(255, 143, 0, 0.22);
  border-color: #ffb300;
  box-shadow: 0 0 16px rgba(255, 143, 0, 0.4);
}

.mode-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffe082;
  margin-bottom: 6px;
}

.mode-desc {
  font-size: 0.8rem;
  line-height: 1.4;
  color: #d7ccc8;
  margin: 0;
  flex: 1;
}

.check-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #a5d6a7;
  margin-top: 8px;
}

.adrenaline-explanation {
  display: flex;
  align-items: center;
  gap: 18px;
  background: rgba(255, 87, 34, 0.12);
  border: 1px solid rgba(255, 87, 34, 0.4);
  padding: 18px 24px;
  border-radius: 14px;
  text-align: left;
  margin-bottom: 28px;
}

.adrenaline-icon {
  font-size: 2.2rem;
}

.adrenaline-explanation h3 {
  margin: 0 0 6px;
  color: #ffab91;
  font-size: 1.1rem;
}

.adrenaline-explanation p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #fbe9e7;
}

.pacing-selector {
  margin-bottom: 30px;
}

.pacing-selector label {
  display: block;
  font-size: 0.9rem;
  color: #ffd54f;
  margin-bottom: 10px;
  font-weight: 600;
}

.pacing-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.pacing-buttons button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 170, 0, 0.3);
  color: #ffecb3;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s;
}

.pacing-buttons button.active {
  background: #ff8f00;
  border-color: #ffd54f;
  color: #210d02;
  font-weight: bold;
  box-shadow: 0 0 16px rgba(255, 143, 0, 0.6);
}

.intro-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 170, 0, 0.2);
  border-radius: 12px;
  padding: 16px 8px;
}

.stat-num {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffd54f;
}

.stat-label {
  font-size: 0.78rem;
  color: #bcaaa4;
}

.intro-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* BUTTONS */
.btn-primary-golden {
  background: linear-gradient(135deg, #ffb300 0%, #ff8f00 50%, #e65100 100%);
  color: #1a0800;
  border: none;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 15px 32px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 143, 0, 0.45);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transition: all 0.25s ease;
}

.btn-primary-golden:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(255, 143, 0, 0.65);
  filter: brightness(1.1);
}

.btn-secondary-outline {
  background: transparent;
  border: 1.5px solid rgba(255, 170, 0, 0.5);
  color: #ffe082;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 14px 26px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary-outline:hover {
  background: rgba(255, 170, 0, 0.15);
  border-color: #ffd54f;
}

/* PLAYING HUD */
.hud-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: rgba(20, 8, 2, 0.85);
  border: 1px solid rgba(255, 170, 0, 0.25);
  border-radius: 12px;
  padding: 10px 20px;
  margin-bottom: 14px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hud-label {
  font-size: 0.68rem;
  color: #bcaaa4;
  letter-spacing: 1px;
}

.hud-val {
  font-size: 1.15rem;
  font-weight: bold;
  color: #ffe082;
}

.hud-diff-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  margin-top: 2px;
}

.hud-diff-badge.easy, .difficulty-pill.easy, .difficulty-pill-sm.easy {
  background: rgba(76, 175, 80, 0.25);
  border: 1px solid #4caf50;
  color: #a5d6a7;
}

.hud-diff-badge.medium, .difficulty-pill.medium, .difficulty-pill-sm.medium {
  background: rgba(255, 152, 0, 0.25);
  border: 1px solid #ff9800;
  color: #ffcc80;
}

.hud-diff-badge.hard, .difficulty-pill.hard, .difficulty-pill-sm.hard {
  background: rgba(233, 30, 99, 0.25);
  border: 1px solid #e91e63;
  color: #f48fb1;
}

/* ADRENALINE BAR */
.adrenaline-bar-wrap {
  width: 100%;
  background: rgba(30, 12, 3, 0.9);
  border: 1.5px solid rgba(255, 170, 0, 0.3);
  border-radius: 14px;
  padding: 12px 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.adrenaline-bar-wrap.surge-active {
  border-color: #ff3d00;
  box-shadow: 0 0 24px rgba(255, 61, 0, 0.45);
  background: rgba(45, 10, 2, 0.95);
  animation: pulseSurge 1.2s infinite alternate;
}

@keyframes pulseSurge {
  0% { transform: scale(1); }
  100% { transform: scale(1.008); }
}

.adrenaline-timer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timer-countdown {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffe082;
  font-weight: 700;
}

.seconds-display {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffd54f;
  font-variant-numeric: tabular-nums;
}

.urgent-text .seconds-display {
  color: #ff5252;
  text-shadow: 0 0 10px rgba(255, 82, 82, 0.7);
  animation: urgentPulse 0.5s infinite alternate;
}

@keyframes urgentPulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}

.delay-mode {
  font-size: 0.75rem;
  color: #bcaaa4;
  margin-left: 6px;
}

.surge-pill {
  background: rgba(255, 61, 0, 0.25);
  border: 1px solid #ff3d00;
  color: #ffab91;
  font-size: 0.78rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
  animation: blinkSurge 0.8s infinite alternate;
}

.locked-pill {
  background: rgba(255, 170, 0, 0.2);
  border: 1px solid #ffd54f;
  color: #ffe082;
  font-size: 0.78rem;
  padding: 4px 12px;
  border-radius: 12px;
}

@keyframes blinkSurge {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

.timer-track {
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8f00, #ffb300);
  transition: width 1s linear;
}

.timer-fill.urgent {
  background: linear-gradient(90deg, #ff1744, #ff5252);
  box-shadow: 0 0 12px #ff1744;
}

/* MAIN QUESTION CARD */
.question-main-card {
  width: 100%;
  background: linear-gradient(160deg, rgba(38, 15, 4, 0.95), rgba(18, 7, 2, 0.98));
  border: 2px solid rgba(255, 170, 0, 0.35);
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
}

.question-main-card.card-surge {
  border-color: rgba(255, 61, 0, 0.6);
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.q-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}

.difficulty-pill {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 14px;
}

.difficulty-pill-sm {
  font-size: 0.72rem;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 8px;
  margin-left: 8px;
}

.q-number-pill {
  background: rgba(255, 170, 0, 0.18);
  border: 1px solid rgba(255, 170, 0, 0.4);
  color: #ffe082;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 14px;
}

.story-ref {
  font-size: 0.8rem;
  color: #bcaaa4;
}

.q-text {
  font-size: 1.45rem;
  line-height: 1.5;
  color: #fff8e1;
  margin-bottom: 28px;
  font-weight: 700;
}

/* OPTIONS GRID */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.option-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 170, 0, 0.25);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  text-align: left;
  color: #ffecb3;
  transition: all 0.2s ease;
  position: relative;
}

.option-card:hover:not(:disabled) {
  background: rgba(255, 170, 0, 0.14);
  border-color: #ffd54f;
  transform: translateY(-2px);
}

.option-card.selected {
  background: rgba(255, 143, 0, 0.22);
  border-color: #ffb300;
  box-shadow: 0 0 16px rgba(255, 143, 0, 0.35);
}

.option-card.correct-answer {
  background: rgba(46, 125, 50, 0.35) !important;
  border-color: #66bb6a !important;
  color: #e8f5e9 !important;
  box-shadow: 0 0 18px rgba(76, 175, 80, 0.4);
}

.option-card.wrong-answer {
  background: rgba(198, 40, 40, 0.35) !important;
  border-color: #ef5350 !important;
  color: #ffebee !important;
}

.option-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 170, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffd54f;
  flex-shrink: 0;
}

.option-card.selected .option-marker {
  background: #ff8f00;
  color: #1a0800;
}

.option-content {
  font-size: 0.98rem;
  line-height: 1.4;
  flex: 1;
}

.verdict-icon {
  font-size: 1.3rem;
  font-weight: bold;
  color: #66bb6a;
}

.verdict-icon.wrong {
  color: #ef5350;
}

/* EXPLANATION BOX */
.explanation-box {
  background: rgba(255, 170, 0, 0.08);
  border-left: 4px solid #ffa000;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.explanation-box.success {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.explanation-badge {
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffe082;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.explanation-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #f5f5f5;
  margin: 0;
}

/* FOOTER ACTIONS */
.card-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 170, 0, 0.15);
}

.status-tip {
  font-size: 0.85rem;
  color: #bcaaa4;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-reveal {
  background: rgba(255, 170, 0, 0.2);
  border: 1.5px solid #ffb300;
  color: #ffe082;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reveal:hover:not(:disabled) {
  background: #ffb300;
  color: #1a0800;
}

.btn-reveal:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-next-question {
  background: linear-gradient(135deg, #ff8f00, #ff6f00);
  border: none;
  color: #1a0800;
  padding: 13px 28px;
  border-radius: 26px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(255, 111, 0, 0.4);
  transition: all 0.2s;
}

.btn-next-question:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

/* STORY READER VIEW */
.story-book-card {
  background: linear-gradient(160deg, rgba(38, 15, 4, 0.96), rgba(18, 7, 2, 0.98));
  border: 2px solid rgba(255, 170, 0, 0.35);
  border-radius: 20px;
  padding: 36px;
  width: 100%;
  box-sizing: border-box;
}

.story-header {
  text-align: center;
  border-bottom: 1px solid rgba(255, 170, 0, 0.25);
  padding-bottom: 24px;
  margin-bottom: 28px;
}

.story-header h2 {
  font-size: 2rem;
  color: #ffe082;
  margin: 0 0 8px;
}

.story-subtitle {
  color: #d7ccc8;
  font-size: 1rem;
  margin: 0 0 20px;
}

.chapter-nav-tabs {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.chapter-tab {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 170, 0, 0.25);
  color: #d7ccc8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-tab.active {
  background: #ff8f00;
  color: #1a0800;
  font-weight: bold;
  border-color: #ffd54f;
}

.chapter-title {
  font-size: 1.5rem;
  color: #ffd54f;
  margin-bottom: 20px;
}

.chapter-text-content p {
  font-size: 1.08rem;
  line-height: 1.8;
  color: #ffecb3;
  margin-bottom: 20px;
  text-align: justify;
}

.story-footer {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 170, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.story-nav-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-story-nav {
  background: rgba(255, 170, 0, 0.15);
  border: 1px solid rgba(255, 170, 0, 0.3);
  color: #ffe082;
  padding: 8px 16px;
  border-radius: 18px;
  cursor: pointer;
}

.btn-story-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.chapter-indicator {
  font-size: 0.85rem;
  color: #bcaaa4;
}

/* SUMMARY & LEDGER */
.summary-hero-card {
  background: linear-gradient(150deg, rgba(42, 16, 4, 0.95), rgba(18, 7, 2, 0.98));
  border: 2px solid rgba(255, 170, 0, 0.4);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.sacred-seal {
  font-size: 3.5rem;
  color: #ffd54f;
  text-shadow: 0 0 24px rgba(255, 213, 79, 0.6);
  margin-bottom: 8px;
}

.summary-title {
  font-size: 2.3rem;
  color: #fff8e1;
  margin: 0 0 8px;
}

.summary-tagline {
  font-size: 1.05rem;
  color: #ffcc80;
  margin-bottom: 28px;
}

.final-score-showcase {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 170, 0, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
}

.score-large .score-label {
  font-size: 0.85rem;
  color: #bcaaa4;
  letter-spacing: 2px;
}

.score-large .score-number {
  display: block;
  font-size: 3.5rem;
  font-weight: 800;
  color: #ffd54f;
  text-shadow: 0 0 20px rgba(255, 213, 79, 0.5);
}

.summary-pills {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.summary-pill {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 170, 0, 0.2);
  border-radius: 10px;
  padding: 12px 8px;
}

.summary-pill .p-num {
  display: block;
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffb300;
}

.summary-pill .p-label {
  font-size: 0.75rem;
  color: #bcaaa4;
}

.summary-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

/* REVIEW LEDGER */
.review-ledger {
  text-align: left;
  border-top: 1px solid rgba(255, 170, 0, 0.25);
  padding-top: 30px;
}

.ledger-title {
  font-size: 1.4rem;
  color: #ffe082;
  margin-bottom: 20px;
  text-align: center;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ledger-item {
  background: rgba(0, 0, 0, 0.35);
  border-left: 4px solid #ffa000;
  border-radius: 8px;
  padding: 18px 20px;
}

.ledger-item.correct {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.ledger-item.incorrect {
  border-left-color: #ef5350;
  background: rgba(239, 83, 80, 0.05);
}

.ledger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.item-num {
  font-weight: bold;
  color: #ffd54f;
  font-size: 0.85rem;
}

.item-category {
  font-size: 0.78rem;
  color: #bcaaa4;
  margin-left: 8px;
}

.verdict-tag {
  font-size: 0.78rem;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 8px;
}

.ledger-item.correct .verdict-tag {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.ledger-item.incorrect .verdict-tag {
  background: rgba(239, 83, 80, 0.2);
  color: #e57373;
}

.item-q {
  font-size: 1.05rem;
  color: #fff8e1;
  margin: 0 0 12px;
}

.item-answer-row {
  display: flex;
  gap: 24px;
  font-size: 0.88rem;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.your-ans {
  color: #ffcc80;
}

.correct-ans {
  color: #a5d6a7;
}

.item-exp {
  font-size: 0.85rem;
  color: #d7ccc8;
  margin: 0;
  line-height: 1.5;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
  .mode-cards-grid {
    grid-template-columns: 1fr;
  }
  .intro-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .summary-pills {
    grid-template-columns: 1fr 1fr;
  }
  .hud-strip {
    flex-wrap: wrap;
    gap: 8px;
  }
  .topbar-brand h1 {
    font-size: 1rem;
  }
}
</style>
