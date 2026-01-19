/***********************
 * CJajlk Games  Script principal
 * Version : 1.0
 * Effets : apparition douce, bascule daide, interaction jeux
 ***********************/

/* === Apparition douce au chargement === */
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 1.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});

/* === Bascule de la section "Aider le dveloppeur" === */
const toggleButton = document.querySelector('.support-toggle');
const supportOptions = document.querySelector('.support-options');

if (toggleButton && supportOptions) {
  toggleButton.addEventListener('click', () => {
    const visible = supportOptions.classList.toggle('visible');
    supportOptions.classList.toggle('hidden', !visible);

    // effet sonore doux (optionnel si tu ajoutes un petit son dans assets)
    if (visible) {
      toggleButton.textContent = " Merci pour ton soutien";
    } else {
      toggleButton.textContent = " Aider le dveloppeur";
    }
  });
}

/* === Interaction visuelle sur les cartes de jeux === */
const gameCards = document.querySelectorAll('.game-card');

gameCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
    card.style.transform = 'scale(1.03)';
    card.style.boxShadow = '0 0 25px rgba(180,130,255,0.4)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'scale(1.0)';
    card.style.boxShadow = '0 0 15px rgba(130,90,255,0.25)';
  });
});

/* === (Optionnel) Scroll fluide vers les sections === */
const smoothLinks = document.querySelectorAll('a[href^="#"]');
smoothLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/***********************
 * Bêta Android – Gestion simple et sincère
 ***********************/

const MAX_TESTERS = 12;
const STORAGE_KEY = "betaTesters";

const form = document.getElementById("betaForm");
const emailInput = document.getElementById("betaEmail");
const feedback = document.getElementById("betaFeedback");
const countText = document.getElementById("betaCountText");
const progressBar = document.getElementById("betaProgressBar");

// Récupération des inscrits
function getTesters() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Mise à jour compteur + barre
function updateCounter() {
  const count = getTesters().length;
  countText.textContent = `${count} / ${MAX_TESTERS}`;
  progressBar.style.width = `${(count / MAX_TESTERS) * 100}%`;
}

// Initialisation
updateCounter();

// Soumission du formulaire
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;

  const testers = getTesters();

  if (testers.includes(email)) {
    feedback.textContent =
      "🌙 Tu es déjà inscrit à la bêta. Merci pour ton soutien.";
    return;
  }

  if (testers.length >= MAX_TESTERS) {
    feedback.textContent =
      "✨ La bêta est complète. Merci pour ton intérêt.";
    return;
  }

  testers.push(email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(testers));

  feedback.textContent =
    "💜 Merci. Ton inscription a bien été prise en compte. Tu recevras l’invitation dès que possible.";

  emailInput.value = "";
  updateCounter();
});
