/* ================================
   TUTORIEL - LOGIQUE ET PROGRESSION
   ================================ */

let currentSceneIndex = 0;
let tutorialScenes = [];
let canvasCtx = null;
let aubeContainer = null;
let speechBubble = null;
let tutorialZonesContainer = null;

// Scènes du tutoriel
const TUTORIAL_SCENES = [
  {
    id: 'welcome',
    title: 'Bienvenue dans Breaker',
    narration: 'Salut! Je m\'appelle Aube. Je vais (moi, ta guide) te montrer comment jouer à ce jeu incroyable!',

    aubePosition: { x: '15%', y: '45%' },
    zones: [],
    animation: 'bounce'
  },
  {
    id: 'controls',
    title: 'Les Contrôles',
    narration: 'Tu peux glisser ton doigt (sur mobile) ou utiliser ta souris pour bouger la raquette. (Je vais te le montrer!) Essaie!',

    aubePosition: { x: '15%', y: '50%' },
    zones: [
      {
        position: { bottom: '80px', right: '30px', width: '200px', height: '80px' },
        title: 'Ta Raquette',
        description: 'Glisse ton doigt pour la bouger'
      }
    ],
    animation: 'point'
  },
  {
    id: 'ball',
    title: 'La Balle',
    narration: 'La balle rebondit sur ta raquette et casse les briques. (Fais attention!) Ne la laisse pas tomber!',

    aubePosition: { x: '15%', y: '40%' },
    zones: [
      {
        position: { top: '100px', left: '50%', width: '150px', height: '60px' },
        title: 'La Balle',
        description: 'Accélère avec chaque rebond'
      }
    ],
    animation: 'idle'
  },
  {
    id: 'bricks',
    title: 'Casse les Briques',
    narration: 'Chaque brique cassée te donne des points. (Je t\'ai appris ça!) Casse-les toutes pour passer au niveau suivant!',

    aubePosition: { x: '15%', y: '35%' },
    zones: [
      {
        position: { top: '150px', left: '50%', width: '200px', height: '150px' },
        title: 'Les Briques',
        description: 'Les vertes donnent peu de points, les rouges plus!'
      }
    ],
    animation: 'celebrate'
  },
  {
    id: 'powerups',
    title: 'Les Bonus',
    narration: 'Parfois, des bonus tombent des briques. (Je les adore!) Attrape-les pour des effets spéciaux!',

    aubePosition: { x: '15%', y: '40%' },
    zones: [
      {
        position: { top: '300px', left: '50%', width: '120px', height: '40px' },
        title: 'Bonus',
        description: 'Ralentir, Agrandir, Attaquer!'
      }
    ],
    animation: 'bounce'
  },
  {
    id: 'companions',
    title: 'Les Compagnons',
    narration: 'Utilise tes compagnons pour obtenir des bonus. (Je suis aussi une!) Chacun a des pouvoirs uniques!',

    aubePosition: { x: '15%', y: '45%' },
    zones: [
      {
        position: { top: '80px', right: '40px', width: '150px', height: '80px' },
        title: 'Compagnon',
        description: 'XP bonus, vitesse, dégâts...'
      }
    ],
    animation: 'idle'
  },
  {
    id: 'feed',
    title: 'Nourrir tes Compagnons',
    narration: 'N\'oublie pas de nourrir tes compagnons! (C\'est très important!) Ils gagneront du XP et deviendront plus forts!',

    aubePosition: { x: '15%', y: '40%' },
    zones: [
      {
        position: { top: '200px', right: '50px', width: '150px', height: '100px' },
        title: 'Écurie',
        description: 'Nourris tes compagnons avec des orbes'
      }
    ],
    animation: 'point'
  },
  {
    id: 'boss',
    title: 'Le Boss',
    narration: 'À la fin de chaque monde, tu affronteras un boss. (Je t\'aiderai!) Sois prudent, il est puissant!',

    aubePosition: { x: '15%', y: '40%' },
    zones: [
      {
        position: { top: '120px', left: '50%', width: '180px', height: '60px' },
        title: 'Boss',
        description: 'Barre de vie, attaques spéciales'
      }
    ],
    animation: 'point'
  },
  {
    id: 'ready',
    title: 'Es-tu Prêt?',
    narration: 'Maintenant, commençons à jouer! (J\'y crois en toi!) Bonne chance, futur champion!',

    aubePosition: { x: '15%', y: '45%' },
    zones: [],
    animation: 'celebrate'
  }
];

// Initialiser le tutoriel
function initTutorial() {
  // Marquer le tutoriel comme complété
  localStorage.setItem('tutorialCompleted', 'true');
  
  aubeContainer = document.querySelector('.aube-container');
  speechBubble = document.querySelector('.aube-speech');
  tutorialZonesContainer = document.querySelector('.tutorial-zones');
  
  const canvas = document.getElementById('tutorialCanvas');
  if (canvas) {
    canvasCtx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Animer le fond
    animateBackground();
  }
  
  // Charger les scènes
  tutorialScenes = TUTORIAL_SCENES.map(scene => ({
    ...scene,
    // Garder les scènes telles quelles pour la version FR
  }));
  
  // Créer les points de progression
  createProgressDots();
  
  // Initialiser les contrôles
  setupControls();
  
  // Afficher la première scène
  showScene(0);
  
  // Gérer le redimensionnement
  window.addEventListener('resize', () => {
    if (canvasCtx) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
}

// Créer les points de progression
function createProgressDots() {
  const progressDots = document.getElementById('progressDots');
  if (!progressDots) return;
  
  progressDots.innerHTML = '';
  tutorialScenes.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (index === 0) dot.classList.add('active');
    dot.dataset.index = index;
    progressDots.appendChild(dot);
  });
}

// Afficher une scène
function showScene(index) {
  if (index < 0 || index >= tutorialScenes.length) return;
  
  currentSceneIndex = index;
  const scene = tutorialScenes[index];
  
  // Mettre à jour la position d'Aube
  aubeContainer.style.left = scene.aubePosition.x;
  aubeContainer.style.top = scene.aubePosition.y;
  
  // Mettre à jour l'animation
  updateAubeAnimation(scene.animation);
  
  // Afficher la bulle de dialogue
  showSpeechBubble(scene.narration);
  
  // Afficher les zones
  showZones(scene.zones);
  
  // Mettre à jour les points de progression
  updateProgressDots(index);
  
  // Mettre à jour les boutons
  updateButtons();
}

// Mettre à jour l'animation d'Aube
function updateAubeAnimation(animationType) {
  const sprite = document.getElementById('aubeCharacter');
  if (!sprite) return;
  
  sprite.style.animation = 'none';
  
  setTimeout(() => {
    switch(animationType) {
      case 'bounce':
        sprite.style.animation = 'characterBounce 3s ease-in-out infinite';
        break;
      case 'point':
        sprite.style.animation = 'characterPoint 2s ease-in-out infinite';
        break;
      case 'celebrate':
        sprite.style.animation = 'characterCelebrate 2s ease-in-out 1';
        break;
      case 'idle':
      default:
        sprite.style.animation = 'characterIdle 4s ease-in-out infinite';
        break;
    }
  }, 10);
}

// Afficher la bulle de dialogue
function showSpeechBubble(text) {
  const speechText = document.getElementById('speechText');
  if (!speechText) return;
  
  // Animation de fermeture
  speechBubble.classList.add('hidden');
  
  setTimeout(() => {
    speechBubble.classList.remove('hidden');
    speechText.innerText = text;
  }, 300);
}

// Afficher les zones de tutoriel
function showZones(zones) {
  // Effacer les zones précédentes
  const oldZones = tutorialZonesContainer.querySelectorAll('.tutorial-zone');
  oldZones.forEach(zone => zone.remove());
  
  // Ajouter les nouvelles zones
  zones.forEach((zone, index) => {
    setTimeout(() => {
      const zoneEl = document.createElement('div');
      zoneEl.className = 'tutorial-zone zone-highlight';
      
      // Positionner la zone
      Object.keys(zone.position).forEach(key => {
        if (key === 'left' || key === 'right') {
          zoneEl.style[key] = 'auto';
          if (zone.position[key] === '50%') {
            zoneEl.style.left = 'calc(50% - 75px)'; // Centrer
          } else {
            zoneEl.style[key] = zone.position[key];
          }
        } else {
          zoneEl.style[key] = zone.position[key];
        }
      });
      
      // Contenu
      zoneEl.innerHTML = `
        <div class="zone-title">${zone.title}</div>
        <div class="zone-description">${zone.description}</div>
      `;
      
      tutorialZonesContainer.appendChild(zoneEl);
    }, index * 200);
  });
}

// Mettre à jour les points de progression
function updateProgressDots(index) {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    if (i === index) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Mettre à jour les boutons
function updateButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.disabled = currentSceneIndex === 0;
  }
  
  if (nextBtn) {
    if (currentSceneIndex === tutorialScenes.length - 1) {
      nextBtn.innerText = 'Commencer!';
    } else {
      nextBtn.innerText = 'Suivant →';
    }
  }
}

// Configurer les contrôles
function setupControls() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const skipBtn = document.querySelector('.skip-btn');
  const dots = document.querySelectorAll('.dot');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentSceneIndex > 0) {
        showScene(currentSceneIndex - 1);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSceneIndex < tutorialScenes.length - 1) {
        showScene(currentSceneIndex + 1);
      } else {
        // Aller au jeu
        window.location.href = 'campaign.html';
      }
    });
  }
  
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      const confirmSkip = () => {
        window.location.href = 'campaign.html';
      };

      if (window.Popup && typeof window.Popup.confirm === 'function') {
        const message = i18nT('tutorial.confirmSkip') || 'Sauter le tutoriel?';
        window.Popup.confirm(message, confirmSkip);
      } else if (confirm('Sauter le tutoriel?')) {
        confirmSkip();
      }
    });
  }
  
  // Cliques sur les points
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showScene(index);
    });
  });
  
  // Navigation au clavier
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      if (currentSceneIndex > 0) showScene(currentSceneIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      if (currentSceneIndex < tutorialScenes.length - 1) {
        showScene(currentSceneIndex + 1);
      } else {
        window.location.href = 'campaign.html';
      }
    }
  });
}

// Animer le fond
function animateBackground() {
  if (!canvasCtx) return;
  
  const canvas = canvasCtx.canvas;
  let particles = [];
  
  // Générer des particules
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2
    });
  }
  
  function animate() {
    // Effacer le canvas
    canvasCtx.fillStyle = 'rgba(11, 15, 26, 0.1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mettre à jour et dessiner les particules
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.opacity *= 0.99;
      
      // Rebondir
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      // Régénérer si invisible
      if (p.opacity < 0.01) {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.opacity = Math.random() * 0.5 + 0.2;
      }
      
      // Dessiner
      canvasCtx.fillStyle = `rgba(100, 150, 255, ${p.opacity})`;
      canvasCtx.beginPath();
      canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      canvasCtx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', initTutorial);

// Ajouter une animation supplémentaire aux styles
const style = document.createElement('style');
style.textContent = `
  @keyframes characterIdle {
    0%, 100% { transform: scale(1) rotateZ(-1deg); }
    50% { transform: scale(1.02) rotateZ(1deg); }
  }
  
  @keyframes characterPoint {
    0%, 100% { transform: translateX(0) rotateZ(-2deg); }
    25% { transform: translateX(10px) rotateZ(5deg); }
    50% { transform: translateX(-10px) rotateZ(-5deg); }
    75% { transform: translateX(10px) rotateZ(5deg); }
  }
  
  @keyframes characterCelebrate {
    0% { transform: scale(1) rotateZ(0deg); }
    25% { transform: scale(1.1) rotateZ(-5deg); }
    50% { transform: scale(1) rotateZ(5deg); }
    75% { transform: scale(1.1) rotateZ(-5deg); }
    100% { transform: scale(1) rotateZ(0deg); }
  }
`;
document.head.appendChild(style);
