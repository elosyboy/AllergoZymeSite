// ===============================
// CONFIGURATION
// ===============================
const QUESTIONS = [
  { id:1, text:"La cross-contamination peut se produire si on utilise la même planche pour noix et pain sans la nettoyer entre-temps.", ans:true },
  { id:2, text:"Un simple essuyage à l'eau froide élimine complètement les traces d'allergènes protéiques sur un plan de travail.", ans:false },
  { id:3, text:"La cuisson à haute température détruit tous les allergènes alimentaires de façon fiable.", ans:false },
  { id:4, text:"Les étiquettes des ingrédients doivent toujours être conservées pendant au moins 48 heures après préparation.", ans:true },
  { id:5, text:"L'huile de sésame n'est pas à considérer comme un allergène potentiel.", ans:false },
  { id:6, text:"Un conteneur mal étiqueté peut conduire à une réaction allergique grave chez un client.", ans:true },
  { id:7, text:"Le gluten peut être présent à l'état de traces sur des ustensiles si ceux-ci ne sont pas bien nettoyés.", ans:true },
  { id:8, text:"Réchauffer un plat dans un four partagé sans nettoyage n'expose pas au risque d'allergènes.", ans:false },
  { id:9, text:"La moutarde doit être indiquée même si elle est utilisée uniquement comme arôme dans une sauce.", ans:true },
  { id:10, text:"Le poisson et les fruits de mer peuvent partager des allergènes interchangeables.", ans:false },
  { id:11, text:"Un personnel correctement formé peut réduire significativement les incidents d'allergies.", ans:true },
  { id:12, text:"L'affichage ‘peut contenir des traces de…’ décharge totalement un établissement de toute responsabilité.", ans:false },
  { id:13, text:"Le stockage séparé des ingrédients réduit le risque de contamination croisée.", ans:true },
  { id:14, text:"Le lavage des mains entre deux préparations est obligatoire même si on a changé de gants.", ans:true },
  { id:15, text:"Les traces d'arachides peuvent provoquer une réaction grave même en très faible quantité.", ans:true }
];

const MAX_ATTEMPTS = 2;
const QUIZ_SECONDS = 15 * 60; // 15 minutes max

// ===============================
// RÉFÉRENCES UI
// ===============================
const startBtn = document.getElementById("startBtn");
const quizForm = document.getElementById("quizForm");
const questionsContainer = document.getElementById("questionsContainer");
const submitBtn = document.getElementById("submitBtn");
const resultBox = document.getElementById("result");
const retryBtn = document.getElementById("retryBtn");

let timerInterval = null;
let remaining = QUIZ_SECONDS;
let currentQuestions = [];
let attemptCount = parseInt(localStorage.getItem("qcm_attempts") || "0", 10);

// ===============================
// UTILITAIRES
// ===============================
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions() {
  currentQuestions = shuffleArray(QUESTIONS).slice(0, 15);
  questionsContainer.innerHTML = "";
  currentQuestions.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <h3>${idx + 1}. ${q.text}</h3>
      <label><input type="radio" name="q${q.id}" value="oui"> Oui</label>
      <label><input type="radio" name="q${q.id}" value="non"> Non</label>
    `;
    questionsContainer.appendChild(div);
  });
}

function gatherAnswers() {
  const answers = {};
  currentQuestions.forEach(q => {
    const el = document.querySelector(`input[name="q${q.id}"]:checked`);
    answers[q.id] = el ? (el.value === "oui") : null;
  });
  return answers;
}

function computeScore(answers) {
  let correct = 0;
  currentQuestions.forEach(q => {
    if (answers[q.id] === q.ans) correct++;
  });
  return Math.round((correct / currentQuestions.length) * 100);
}

// ===============================
// SUPABASE CONFIGURATION
// ===============================
const SUPABASE_URL = "https://kxhgfmtygiuxaqbyvjca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGdmbXR5Z2l1eGFxYnl2amNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4MTIsImV4cCI6MjA3NTM1NDgxMn0.UqVXBKVQ_oqXPv5W7Ad--f-Wp21z_2n90Z_1Vz31fzw";

// ⚠️ On attend que Supabase soit bien chargé avant d'utiliser createClient
let supabaseClient = null;
window.addEventListener("load", () => {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    alert("Erreur critique : Supabase non chargé !");
  }
});

// ===============================
// SUBMISSION
// ===============================
async function submitQuiz() {
  const answers = gatherAnswers();
  const score = computeScore(answers);
  const email = localStorage.getItem("agz_current_user") || "anonyme";

  if (!supabaseClient) {
    alert("Connexion à la base impossible (Supabase non initialisé)");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("qcm_results")
      .insert([{ email, score }])
      .select();

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      alert("Erreur Supabase : " + error.message);
      return;
    }

    console.log("✅ Données enregistrées :", data);
    alert("✅ Vos réponses ont bien été enregistrées !");
    window.location.href = "merci.html";
  } catch (err) {
    console.error("Erreur JS :", err);
    alert("Erreur inattendue : " + err.message);
  }
}

// ===============================
// ÉVÉNEMENTS
// ===============================
startBtn.addEventListener("click", () => {
  if (attemptCount >= MAX_ATTEMPTS) {
    alert("Vous avez déjà utilisé vos 2 tentatives.");
    return;
  }
  buildQuestions();
  quizForm.style.display = "block";
  startBtn.disabled = true;
  startBtn.textContent = "QCM en cours...";
});

submitBtn.addEventListener("click", () => {
  if (!confirm("Validez-vous définitivement votre QCM ?")) return;
  submitQuiz();
});
