let allQuestions = {};
let questions = [];
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft = 15;
let selectedAnswers = [];
let isMuted = localStorage.getItem("quizMute") === "true";
let isDark = localStorage.getItem("quizDark") === "true";

// DOM Elements
const categoryBox = document.getElementById('category-box');
const quizBox = document.getElementById('quiz-box');
const scoreBox = document.getElementById('score-box');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const timeEl = document.getElementById('time');
const barEl = document.getElementById('bar');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const currentQEl = document.getElementById('current-question');
const totalQEl = document.getElementById('total-questions');
const reviewEl = document.getElementById('review-container');
const profileScore = document.getElementById('user-score');
const userNameDisplay = document.getElementById('user-name');

const soundToggleBtn = document.getElementById("sound-toggle");
const darkToggleBtn = document.getElementById("dark-mode-toggle");

// Sounds
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const clickSound = document.getElementById('click-sound');

// Apply Dark Mode
document.body.classList.toggle("dark", isDark);
darkToggleBtn.textContent = isDark ? "☀" : "🌙";
darkToggleBtn.onclick = () => {
  isDark = !isDark;
  localStorage.setItem("quizDark", isDark);
  document.body.classList.toggle("dark", isDark);
  darkToggleBtn.textContent = isDark ? "☀" : "🌙";
};

// Sound Toggle
soundToggleBtn.textContent = isMuted ? "🔇" : "🔊";
soundToggleBtn.onclick = () => {
  isMuted = !isMuted;
  localStorage.setItem("quizMute", isMuted);
  soundToggleBtn.textContent = isMuted ? "🔇" : "🔊";
};

function playSound(sound) {
  if (!isMuted && sound?.play) {
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Load questions from JSON
async function loadQuestionsFile() {
  try {
    const res = await fetch("questions.json");
    if (!res.ok) throw new Error("HTTP error");
    allQuestions = await res.json();
    setupCategoryButtons();
    updateProfile();
    showUserName();
  } catch (err) {
    alert("❌ Failed to load questions.json");
    console.error("Error loading questions:", err);
  }
}

function showUserName() {
  const username = localStorage.getItem("quiz_user") || "Guest";
  if (userNameDisplay) {
    userNameDisplay.textContent = `👤 Welcome, ${username}!`;
  }
}

function setupCategoryButtons() {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.onclick = () => startQuiz(btn.dataset.category);
  });
}

function startQuiz(category) {
  if (!allQuestions[category] || allQuestions[category].length === 0) {
    alert(`⚠️ No questions available for '${category}'`);
    return;
  }

  questions = [...allQuestions[category]];
  shuffleArray(questions);
  questions = questions.slice(0, 15);
  questions.forEach((q) => shuffleArray(q.options));

  selectedAnswers = [];
  score = 0;
  currentQuestion = 0;

  totalQEl.textContent = questions.length;
  categoryBox.style.display = "none";
  quizBox.style.display = "block";
  scoreBox.style.display = "none";

  loadQuestion();
}

function loadQuestion() {
  const q = questions[currentQuestion];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";
  currentQEl.textContent = currentQuestion + 1;

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn animated-button";
    btn.onclick = () => selectOption(opt, btn);
    optionsEl.appendChild(btn);
  });

  timeLeft = 15;
  timeEl.textContent = timeLeft;
  timeEl.style.color = "";

  barEl.style.animation = "none";
  void barEl.offsetWidth;
  barEl.style.animation = "shrinkBar 15s linear forwards";

  startTimer();
}

function selectOption(selectedText, selectedBtn) {
  stopTimer();
  const q = questions[currentQuestion];
  const correctAnswer = q.answer;
  const isCorrect = selectedText === correctAnswer;

  Array.from(optionsEl.children).forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correctAnswer) btn.classList.add("correct");
    if (btn === selectedBtn && !isCorrect) btn.classList.add("wrong");
  });

  selectedAnswers.push({
    question: q.question,
    selected: selectedText,
    correct: correctAnswer,
    isCorrect,
  });

  if (isCorrect) {
    score++;
    playSound(correctSound);
  } else {
    playSound(wrongSound);
  }

  setTimeout(() => nextQuestion(), 1200);
}

function handleTimeout() {
  const q = questions[currentQuestion];
  const correctAnswer = q.answer;

  Array.from(optionsEl.children).forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correctAnswer) btn.classList.add("correct");
  });

  selectedAnswers.push({
    question: q.question,
    selected: null,
    correct: correctAnswer,
    isCorrect: false,
  });

  playSound(wrongSound);
  setTimeout(() => nextQuestion(), 1200);
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 5) timeEl.style.color = "red";
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  quizBox.style.display = "none";
  scoreBox.style.display = "block";
  playSound(clickSound);
  scoreEl.textContent = score;
  totalEl.textContent = questions.length;

  saveScoreToProfile();
  showReview();
}

function showReview() {
  reviewEl.innerHTML = `<h3>Answer Review</h3>`;
  selectedAnswers.forEach((ans, i) => {
    const qDiv = document.createElement("div");
    qDiv.className = "review-question";
    qDiv.innerHTML = `
      <strong>Q${i + 1}: ${ans.question}</strong><br>
      Your Answer: <span class="${ans.isCorrect ? "correct" : "wrong"}">${ans.selected ?? "No Answer"}</span><br>
      Correct Answer: <span class="correct">${ans.correct}</span>
    `;
    reviewEl.appendChild(qDiv);
  });
}

function saveScoreToProfile() {
  let stats = JSON.parse(localStorage.getItem("overallStats")) || {
    totalScore: 0,
    quizzes: 0,
  };
  stats.totalScore += score;
  stats.quizzes += 1;
  localStorage.setItem("overallStats", JSON.stringify(stats));
  updateProfile();
}

function updateProfile() {
  const stats = JSON.parse(localStorage.getItem("overallStats")) || {
    totalScore: 0,
    quizzes: 0,
  };
  if (profileScore) {
    profileScore.textContent = `🏆 Score: ${stats.totalScore} (from ${stats.quizzes} quizzes)`;
  }
}

// Init on page load
window.onload = () => {
  const user = localStorage.getItem("quiz_user");
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadQuestionsFile();
  }
};

// Logout handler
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});
