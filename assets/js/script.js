/***********************
 * CJajlk Games – Script principal
 * Version : 1.0
 * Effets : apparition douce, bascule d’aide, interaction jeux
 ***********************/

/* === Apparition douce au chargement === */
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 1.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});

/* === Bascule de la section "Aider le développeur" === */
const toggleButton = document.querySelector('.support-toggle');
const supportOptions = document.querySelector('.support-options');

if (toggleButton && supportOptions) {
  toggleButton.addEventListener('click', () => {
    const visible = supportOptions.classList.toggle('visible');
    supportOptions.classList.toggle('hidden', !visible);

    // effet sonore doux (optionnel si tu ajoutes un petit son dans assets)
    if (visible) {
      toggleButton.textContent = "💜 Merci pour ton soutien";
    } else {
      toggleButton.textContent = "🤝 Aider le développeur";
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

