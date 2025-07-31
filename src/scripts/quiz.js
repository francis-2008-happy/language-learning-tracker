// src/quiz.js

export let currentQuiz = [];
let currentIndex = 0;
let score = 0;
let questionsData = {};

export async function loadQuestions() {
  try {
    const res = await fetch('/question.json');
    questionsData = await res.json();
  } catch (error) {
    alert("Failed to load quiz questions.");
    console.error(error);
  }
}

export function startQuiz(language) {
  if (!questionsData[language]) return alert("Language not available.");
  currentQuiz = questionsData[language];
  currentIndex = 0;
  score = 0;
  document.getElementById("quiz-section").classList.remove("hidden");
  document.getElementById("result-section").classList.add("hidden");
  document.getElementById("language-select").classList.add("hidden");
  showQuestion();

}

export function showQuestion() {
  const q = currentQuiz[currentIndex];
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <h3>Question ${currentIndex + 1}: ${q.q}</h3>
    ${q.options.map((opt, i) =>
      `<label><input type="radio" name="answer" value="${i}" /> ${opt}</label><br>`
    ).join("")}
  `;
}

export function nextQuestion() {
  const selected = document.querySelector('input[name="answer"]:checked');
  if (!selected) return alert("Please select an answer.");
  if (parseInt(selected.value) === currentQuiz[currentIndex].answer) score++;
  currentIndex++;
  if (currentIndex < currentQuiz.length) {
    showQuestion();
  } else {
    document.getElementById("quiz-section").classList.add("hidden");
    document.getElementById("result-section").classList.remove("hidden");
    document.getElementById("score").textContent = score;
  }
}

export function restartQuiz() {
  document.getElementById("language-select").classList.remove("hidden");
  document.getElementById("result-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");
}

export function quitQuiz() {
  location.reload();
}

