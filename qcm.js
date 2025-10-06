// qcm.js — version finale sans webcam mais connectée à Supabase

// ===============================
// CONFIGURATION
// ===============================
const QUESTIONS = [
  { id:1, text: "La cross-contamination peut se produire si on utilise la même planche pour noix et pain sans la nettoyer entre-temps.", ans: true },
  { id:2, text: "Un simple essuyage à l'eau froide élimine complètement les traces d'allergènes protéiques sur un plan de travail.", ans: false },
  { id:3, text: "La cuisson à haute température détruit tous les allergènes alimentaires de façon fiable.", ans: false },
  { id:4, text: "Les étiquettes des ingrédients doivent toujours être conservées pendant au moins 48 heures après préparation.", ans: true },
  { id:5, text: "L'huile de sésame n'est pas à considérer comme un allergène potentiel.", ans: false },
  { id:6, text: "Un conteneur mal étiqueté peut conduire à une réaction allergique grave chez un client.", ans: true },
  { id:7, text: "Le gluten peut être présent à l'état de traces sur des ustensiles si ceux-ci ne sont pas bien nettoyés.", ans: true },
  { id:8, text: "Réchauffer un plat dans un four partagé sans nettoyage n'expose pas au risque d'allergènes.", ans: false },
  { id:9, text: "La moutarde doit être indiquée même si elle est utilisée uniquement comme arôme dans une sauce.", ans: true },
  { id:10, text: "Le poisson et les fruits de mer peuvent partager des allergènes interchangeables.", ans: false },
  { id:11, text: "Un personnel correctement formé peut réduire significativement les incidents d'allergies.", ans: true },
  { id:12, text: "L'affichage ‘peut contenir des traces de…’ est suffisant pour décharger totalement un établissement de toute responsabilité.", ans: false },
  { id:13, text: "Le stockage séparé des ingrédients réduit le risque de contamination croisée.", ans: true },
  { id:14, text: "Les gants sont une solution unique et parfaite pour éviter toute contamination croisée.", ans: false },
  { id:15, text: "Le lavage des mains entre deux préparations est obligatoire même si on a changé de gants.", ans: true },
  { id:16, text: "La friture dans une huile partagée n'est pas un vecteur d'allergènes.", ans: false },
  { id:17, text: "Une formation express peut suffire pour une bonne pratique si elle est bien structurée.", ans: true },
  { id:18, text: "Un tableau allergènes incomplet n'est pas un problème si le chef connaît les recettes.", ans: false },
  { id:19, text: "Certaines épices commerciales peuvent contenir des agents allergènes cachés.", ans: true },
  { id:20, text: "La simple présence d'une photo d'autocollant sur la vitrine remplace la formation du personnel.", ans: false },
  { id:21, text: "Il faut consulter la fiche fournisseur pour connaître la composition exacte d'un produit industriel.", ans: true },
  { id:22, text: "La contamination via la vapeur n'est pas possible entre deux plats fermés côté vapeur.", ans: false },
  { id:23, text: "Les allergènes laitiers peuvent subsister sur un ustensile même après un lavage rapide.", ans: true },
  { id:24, text: "Le personnel doit avoir accès facilement à la feuille d'allergènes pendant le service.", ans: true },
  { id:25, text: "L'absence de réaction immédiate exclut un risque futur pour un client allergique.", ans: false },
  { id:26, text: "Il est acceptable de mélanger des préparations destinées à des régimes différents si l'étiquette est claire.", ans: false },
  { id:27, text: "Les contenants hermétiquement fermés réduisent le risque de contamination croisée.", ans: true },
  { id:28, text: "Conserver un historique des fournisseurs n'est pas utile pour la traçabilité des allergènes.", ans: false },
  { id:29, text: "Un épluchage et rinçage des légumes suffit toujours à éliminer les allergènes de surface.", ans: false },
  { id:30, text: "Les traces d'arachides peuvent provoquer une réaction grave même en très faible quantité.", ans: true },
  { id:31, text: "Déclarer 'sans allergènes' sans preuve documentaire expose l'établissement à un risque légal.", ans: true },
  { id:32, text: "Les émulsions faites maison peuvent masquer la présence d'un allergène.", ans: true },
  { id:33, text: "La formation annuelle n'est pas nécessaire si le turnover du personnel est faible.", ans: false },
  { id:34, text: "Le stockage à température adaptée influence indirectement le risque d'allergènes.", ans: true },
  { id:35, text: "Tenir un registre des incidents allergiques aide à améliorer les procédures internes.", ans: true }
];

const MAX_ATTEMPTS = 2;
const QUIZ_SECONDS = 15 * 60;

// ===============================
// RÉFÉRENCES UI
// ===============================
const startBtn = document.getElementById('startBtn');
const quizForm = document.getElementById('quizForm');
const questionsContainer = document.getElementById('questionsContainer');
const submitBtn = document.getElementById('submitBtn');
const resultBox = document.getElementById('result');
const scoreText = document.getElementById('scoreText');
const retryBtn = document.getElementById('retryBtn');
const attemptsInfo = document.getElementById('attemptsInfo');

let timerInterval = null;
let remaining = QUIZ_SECONDS;
let currentQuestions = [];
let attemptCount = parseInt(localStorage.getItem('qcm_attempts') || '0', 10);

// ===============================
// UTILITAIRES
// ===============================
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===============================
// CONSTRUCTION DES QUESTIONS
// ===============================
function buildQuestions() {
  currentQuestions = shuffleArray(QUESTIONS).slice(0, 15);
  questionsContainer.innerHTML = '';
  currentQuestions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question';
    div.innerHTML = `
      <h3>${idx + 1}. ${q.text}</h3>
      <label><input type="radio" name="q${q.id}" value="oui"> Oui</label>
      <label><input type="radio" name="q${q.id}" value="non"> Non</label>
    `;
    questionsContainer.appendChild(div);
  });
}

// ===============================
// TIMER
// ===============================
function startTimer() {
  remaining = QUIZ_SECONDS;
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert('Temps écoulé — le QCM va être soumis automatiquement.');
      submitQuiz();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

// ===============================
// LOGIQUE DU QCM
// ===============================
function gatherAnswers() {
  const answers = {};
  currentQuestions.forEach(q => {
    const el = document.querySelector(`input[name="q${q.id}"]:checked`);
    answers[q.id] = el ? (el.value === 'oui') : null;
  });
  return answers;
}

function computeScore(answers) {
  let correct = 0;
  let total = currentQuestions.length;
  currentQuestions.forEach(q => {
    const a = answers[q.id];
    if (a === q.ans) correct++;
  });
  return { correct, total, pct: Math.round((correct / total) * 100) };
}

// ===============================
// ENVOI SUPABASE + REDIRECTION
// ===============================
async function submitQuiz() {
  stopTimer();
  const answers = gatherAnswers();
  const score = computeScore(answers);
  attemptCount++;

  // Enregistrement sur Supabase
  const SUPABASE_URL = "https://kxhgfmtygiuxaqbyvjca.supabase.co"; 
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGdmbXR5Z2l1eGFxYnl2amNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4MTIsImV4cCI6MjA3NTM1NDgxMn0.UqVXBKVQ_oqXPv5W7Ad--f-Wp21z_2n90Z_1Vz31fzw";
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const email = localStorage.getItem('agz_current_user') || "anonyme";
  await supabaseClient.from("qcm_results").insert([{ email, score: score.pct }]);

  // Redirection sans afficher le résultat
  window.location.href = "merci.html";
}

// ===============================
// ÉVÉNEMENTS
// ===============================
startBtn.addEventListener('click', () => {
  if (attemptCount >= MAX_ATTEMPTS) {
    alert('Vous avez déjà utilisé vos 2 tentatives.');
    return;
  }

  buildQuestions();
  quizForm.style.display = 'block';
  resultBox.style.display = 'none';
  startBtn.disabled = true;
  startBtn.textContent = 'QCM en cours...';

  startTimer();
});

submitBtn.addEventListener('click', () => {
  if (!confirm('Validez-vous définitivement votre QCM ?')) return;
  submitQuiz();
});

retryBtn.addEventListener('click', () => {
  if (attemptCount >= MAX_ATTEMPTS) {
    alert('Plus de tentatives disponibles.');
    return;
  }
  resultBox.style.display = 'none';
  quizForm.style.display = 'block';
  buildQuestions();
  startTimer();
});
