
const questions = [
  {
    text: "ผู้ป่วยมีอาการหายใจเร็ว RR = 30 ครั้ง/นาที ควรประเมินอะไรต่อเป็นอันดับแรก",
    choices: [
      { body: "วัดความดันโลหิต", emoji: "🩸" },
      { body: "ฟังเสียงปอด", emoji: "🫁" },
      { body: "ตรวจหู", emoji: "👂" },
      { body: "ชั่งน้ำหนัก", emoji: "⚖️" }
    ],
    correct: 1,
    rationale: "เมื่อพบอัตราการหายใจผิดปกติ ควรประเมินระบบทางเดินหายใจต่อทันทีตามหลัก ABCDE การฟังเสียงปอดช่วยบอกสาเหตุ เช่น เสียง wheeze, crepitation หรือ pleural effusion ก่อนประเมินระบบอื่น"
  },
  {
    text: "ผู้ป่วยซึมลง พูดไม่รู้เรื่อง ควรประเมินสิ่งใดต่อไปนี้เป็นอันดับแรกตามหลัก ABCDE",
    choices: [
      { body: "ระดับความรู้สึกตัว (Disability)", emoji: "🧠" },
      { body: "วัดอุณหภูมิร่างกาย", emoji: "🌡️" },
      { body: "ถามประวัติแพ้ยา", emoji: "💊" },
      { body: "ตรวจการได้ยิน", emoji: "👂" }
    ],
    correct: 0,
    rationale: "อาการซึมลงและพูดไม่รู้เรื่องบ่งชี้ถึงการเปลี่ยนแปลงระดับความรู้สึกตัว ซึ่งจัดอยู่ใน D (Disability) ควรประเมิน GCS และระดับน้ำตาลในเลือดทันทีเพื่อหาสาเหตุที่แก้ไขได้เร่งด่วน"
  },
  {
    text: "พบผู้ป่วยริมฝีปากเขียวคล้ำ ออกซิเจนในเลือดต่ำ ควรทำอะไรก่อน",
    choices: [
      { body: "ให้ออกซิเจนเสริม", emoji: "🫧" },
      { body: "พลิกตะแคงตัว", emoji: "🔄" },
      { body: "วัดส่วนสูง", emoji: "📏" },
      { body: "บันทึกประวัติครอบครัว", emoji: "📋" }
    ],
    correct: 0,
    rationale: "ภาวะ cyanosis และ oxygen saturation ต่ำเป็นสัญญาณอันตรายที่ต้องแก้ไขทันที การให้ออกซิเจนเสริมช่วยลดความเสี่ยงภาวะขาดออกซิเจนเฉียบพลันก่อนสืบหาสาเหตุอื่น"
  }
];

let current = 0;

let audioCtx = null;
let soundOn = true;
let musicTimer = null;
let musicStep = 0;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, duration, type, gainPeak, startOffset, startTime) {
  const ctx = getCtx();
  const t0 = (startTime || ctx.currentTime) + (startOffset || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak || 0.12, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playClick() {
  if (!soundOn) return;
  tone(720, 0.09, 'triangle', 0.1);
  tone(980, 0.07, 'triangle', 0.06, 0.03);
}

function playTick(low) {
  if (!soundOn) return;
  tone(low ? 880 : 660, 0.06, 'square', 0.045);
}

function playCorrect() {
  if (!soundOn) return;
  tone(523.25, 0.12, 'triangle', 0.12);
  tone(659.25, 0.12, 'triangle', 0.12, 0.1);
  tone(783.99, 0.18, 'triangle', 0.12, 0.2);
}

function playWrong() {
  if (!soundOn) return;
  tone(330, 0.16, 'sawtooth', 0.07);
  tone(277, 0.22, 'sawtooth', 0.06, 0.09);
}

const MELODY = [/*523.25, 587.33, 659.25, 587.33, 659.25, 783.99, 659.25, 587.33*/];
function startMusic() {
  if (musicTimer) return;
  musicStep = 0;
  musicTimer = setInterval(() => {
    if (soundOn) {
      const note = MELODY[musicStep % MELODY.length];
      tone(note, 0.5, 'sine', 0.035);
      tone(note * 1.5, 0.4, 'sine', 0.015, 0.05);
    }
    musicStep++;
  }, 620);
}
function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
  getCtx();
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) { startMusic(); } else { stopMusic(); }
});

let score = 0;
let answered = false;
let timeLeft = 30;
let timerId = null;
const TOTAL_TIME = 30;

const scorePill = document.getElementById('scorePill');
const timerPill = document.getElementById('timerPill');
const qBadge = document.getElementById('qBadge');
const qText = document.getElementById('qText');
const answersEl = document.getElementById('answers');
const feedbackBox = document.getElementById('feedbackBox');
const fbTitle = document.getElementById('fbTitle');
const fbBody = document.getElementById('fbBody');
const nextBtn = document.getElementById('nextBtn');
const panel = document.getElementById('panel');
const progressFill = document.getElementById('progressFill');

function startTimer() {
  clearInterval(timerId);
  timeLeft = TOTAL_TIME;
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    playTick(timeLeft <= 10);
    if (timeLeft <= 0) {
      clearInterval(timerId);
      if (!answered) selectAnswer(-1);
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerPill.innerHTML = (timeLeft <= 10 ? "⏰" : "⏰") + " " + timeLeft;
  timerPill.style.color = timeLeft <= 10 ? "#ff6b6b" : "#2bb6a3";
  timerPill.style.borderColor = timeLeft <= 10 ? "#ffd3d3" : "#c9f0e6";
}

function renderQuestion() {
  const q = questions[current];
  answered = false;

  qBadge.textContent = "🩹 ข้อ " + (current + 1) + " จาก " + questions.length;
  qText.textContent = q.text;
  scorePill.innerHTML = "⭐ " + score + "/" + questions.length;
  progressFill.style.width = (current / questions.length * 100) + "%";

  feedbackBox.className = "feedback-box";
  nextBtn.classList.remove('show');

  const letters = ["A", "B", "C", "D"];
  answersEl.innerHTML = "";
  q.choices.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = "ans";
    div.innerHTML =
      '<span class="sparkle">' + c.emoji + '</span>' +
      '<div class="letter">' + letters[i] + '</div>' +
      '<div class="body">' + c.body + '</div>';
    div.addEventListener('click', () => { playClick(); selectAnswer(i); });
    answersEl.appendChild(div);
  });

  startTimer();
}

function selectAnswer(i) {
  if (answered) return;
  answered = true;
  clearInterval(timerId);
  const q = questions[current];
  const opts = document.querySelectorAll('.ans');
  const isCorrect = i === q.correct;
  const timedOut = i === -1;

  opts.forEach((el, idx) => {
    el.classList.add('locked');
    if (idx === q.correct) {
      el.classList.add('correct');
    } else if (idx === i) {
      el.classList.add('wrong');
    } else {
      el.classList.add('dim');
    }
  });

  if (isCorrect) score++;
  scorePill.innerHTML = "⭐ " + score + "/" + questions.length;

  if (isCorrect) { playCorrect(); } else { playWrong(); }

  feedbackBox.classList.add('show', isCorrect ? 'is-correct' : 'is-wrong');
  fbTitle.textContent = timedOut ? "⏳ หมดเวลาจ้า" : (isCorrect ? "🎉 เก่งมาก ตอบถูก!" : "💭 ยังไม่ถูกนะ");
  fbBody.textContent = q.rationale;

  nextBtn.classList.add('show');
  nextBtn.textContent = current < questions.length - 1 ? "ข้อถัดไป →" : "ดูผลคะแนน →";
}

nextBtn.addEventListener('click', () => {
  playClick();
  current++;
  if (current >= questions.length) {
    showDone();
  } else {
    renderQuestion();
  }
});

function showDone() {
  clearInterval(timerId);
  progressFill.style.width = "100%";
  const pct = Math.round((score / questions.length) * 100);
  const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "🌟" : "🌱";
  panel.innerHTML =
    '<div class="done">' +
      '<div class="ring-wrap"><div class="ring" style="--pct:' + pct + '">' +
        '<div class="ring-inner"><div class="n">' + score + '/' + questions.length + '</div><div class="d">คะแนน</div></div>' +
      '</div></div>' +
      '<h2>' + emoji + ' เสร็จแล้วจ้า เก่งมาก!</h2>' +
      '<p>Head to toe assessment · Part 1</p>' +
      '<button class="retry-btn" id="retryBtn">ทำอีกครั้ง 🔁</button>' +
    '</div>';
  document.getElementById('retryBtn').addEventListener('click', () => { playClick(); location.reload(); });
}

const introScreen = document.getElementById('introScreen');
const quizScreen = document.getElementById('quizScreen');
const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', () => {
  getCtx();
  playClick();
  startMusic();
  introScreen.style.display = 'none';
  quizScreen.style.display = 'block';
  renderQuestion();
});
