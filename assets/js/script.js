/***********************
 * CJajlk Games  Script principal
 * Version : 1.0
 * Effets : apparition douce, bascule daide, interaction jeux
 ***********************/

/* === Apparition douce au chargement === */
window.addEventListener('load', () => {
  document.body.classList.add('is-ready');
});

/* === Bascule de la section "Aider le dveloppeur" === */
const toggleButton = document.querySelector('.support-toggle');
const supportOptions = document.querySelector('.support-options');

if (toggleButton && supportOptions) {
  toggleButton.setAttribute('aria-expanded', 'false');
  supportOptions.setAttribute('aria-hidden', 'true');

  toggleButton.addEventListener('click', () => {
    const visible = supportOptions.classList.toggle('visible');
    toggleButton.setAttribute('aria-expanded', String(visible));
    supportOptions.setAttribute('aria-hidden', String(!visible));

    // effet sonore doux (optionnel si tu ajoutes un petit son dans assets)
    if (visible) {
      toggleButton.textContent = "Merci pour ton soutien";
    } else {
      toggleButton.textContent = "Aider le développeur";
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

/*****************************
 * 🌙 Bêta Android – compteur manuel
 *****************************/

document.addEventListener("DOMContentLoaded", () => {

  const MAX_TESTERS = 12;
  const CURRENT_TESTERS = 7; // ← TU MODIFIES ICI

  const countText = document.getElementById("betaCountText");
  const progressBar = document.getElementById("betaProgressBar");

  if (!countText || !progressBar) {
    return;
  }

  function updateCounter() {
    countText.textContent = `${CURRENT_TESTERS} / ${MAX_TESTERS}`;
    progressBar.style.width = `${(CURRENT_TESTERS / MAX_TESTERS) * 100}%`;
  }

  updateCounter();

});

function loadBetaNames(){
  const listEl = document.getElementById("betaList");
  if (!listEl) return;

  const list = JSON.parse(localStorage.getItem("betaNames") || "[]");
  listEl.innerHTML = list.map(n => "• " + n).join("<br>");
}

function addBetaName(){
  const input = document.getElementById("betaName");
  const listEl = document.getElementById("betaList");
  if (!input || !listEl) return;

  const name = input.value.trim();

  if(!name) return;

  let list = JSON.parse(localStorage.getItem("betaNames") || "[]");

  if(!list.includes(name)){
    list.push(name);
    localStorage.setItem("betaNames", JSON.stringify(list));
  }

  input.value = "";
  loadBetaNames();
}

window.addEventListener("load", loadBetaNames);
