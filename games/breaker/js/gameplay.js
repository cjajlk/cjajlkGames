// =============================
// 💎 DIAMONDS SYSTEM (modulaire)
// =============================
// =============================
// 🐾 Mapping centralisé mascotte → orbe
// =============================
const MASCOT_ORB_MAP = {
    aube: "void",
    aqua: "water",
    ignis: "fire",
    astral: "light",
    flora: "nature"
};
// =============================
// 🥉 STRUCTURE DES RANGS
// =============================
const RANKS = {
    bronze: {
        ballSpeed: 4,
        maxSpeed: 7,
        brickHP: 1,
        lives: 3
    },
    argent: {
        ballSpeed: 4.5,
        maxSpeed: 8,
        brickHP: 1,
        lives: 3
    },
    or: {
        ballSpeed: 5,
        maxSpeed: 9,
        brickHP: 2,
        lives: 2
    },
    diamant: {
        ballSpeed: 5.5,
        maxSpeed: 10,
        brickHP: 2,
        lives: 2
    },
    platine: {
        ballSpeed: 6,
        maxSpeed: 11,
        brickHP: 3,
        lives: 2
    },
    nocturne: {
        ballSpeed: 6.5,
        maxSpeed: 12,
        brickHP: 3,
        lives: 1
    }
};

let currentRank = localStorage.getItem("breaker_rank") || "bronze";
const rankOrder = ["bronze", "argent", "or", "diamant", "platine", "nocturne"];
function getNextRank(rank) {
    const idx = rankOrder.indexOf(rank);
    return idx >= 0 && idx < rankOrder.length - 1 ? rankOrder[idx + 1] : null;
}

function applyRankSettings() {
    const settings = RANKS[currentRank];
    // Appliquer vitesse balle
    ball.speed = settings.ballSpeed;
    ball.maxSpeed = settings.maxSpeed;
    // Appliquer vies
    state.lives = settings.lives;
    // Appliquer HP brique
    for (const b of bricks) {
        b.hp = settings.brickHP;
        b.maxHp = settings.brickHP;
    }
}

function showRankUnlocked(rank) {
    if (window.Popup && typeof window.Popup.confirm === "function") {
        window.Popup.confirm(`Rang ${rank.charAt(0).toUpperCase() + rank.slice(1)} débloqué !`);
    } else {
        alert(`Rang ${rank.charAt(0).toUpperCase() + rank.slice(1)} débloqué !`);
    }
}
  // Import ES6 modules (boss system)
import { createBoss } from '../bosses/bossManager.js';

// Nouvelle gestion unifiée des diamants via profile.js
function addDiamonds(amount) {
    if (window.Profile && typeof window.Profile.addDiamants === 'function') {
        window.Profile.addDiamants(amount);
        updateDiamondsUI();
    }
}
// ...existing code...

function updateDiamondsUI() {
    if (window.getPlayerProfile) {
        const profile = window.getPlayerProfile();
        const diamonds = profile.diamants || 0;
        const uiElements = document.querySelectorAll('.diamonds-count');
        uiElements.forEach(el => {
            el.textContent = diamonds;
        });
    }
}

function spendDiamonds(cost) {
    if (window.getPlayerProfile && window.savePlayerProfile) {
        const profile = window.getPlayerProfile();
        if (profile.diamants < cost) return false;
        profile.diamants -= cost;
        window.savePlayerProfile(profile);
        updateDiamondsUI();
        return true;
    }
    return false;
}
// Ajout : fonction centralisée pour l'XP
function addXP(amount) {
    const prevXP = state.xp;
    state.xp += amount;
    localStorage.setItem("breakerXP", state.xp);
    if (typeof saveProfile === "function") saveProfile();
    console.log("[GAIN XP]", amount, "total", state.xp);
}
/* =====================================================
   🌙 BREAKER – GAMEPLAY CLEAN VERSION
   by CJ + Alia
===================================================== */

/* =============================
    1️⃣ CONFIG
============================= */

// Debug : affichage du timer CJ restant (coin bas droit)
const CONFIG = {
     DEBUG_CJ_TIMER: true // Passe à false pour désactiver l'affichage debug
};

const DPR = window.devicePixelRatio || 1;

// ⏱️ CJ System - Time tracking for deltaMs calculation
let lastFrameTime = 0;

let viewW = 0;
let viewH = 0;

const rows = 5;
const cols = 8;

let brickW, brickH, gap;

/* =============================
   2️⃣ GAME STATE
   
   ⚠️ IMPORTANT - PROGRESSION SYSTÈME :
   
   📊 state.stage (1-6)
   → Niveau de la PARTIE en cours
   → Détermine la difficulté (HP briques, densité, vitesse)
   → Boss activé au stage 6
   → Choix du background
   → Réinitialisé à chaque nouvelle partie
   
   🌟 state.playerLevel (calculé depuis XP)
   → Niveau GLOBAL du joueur
   → Basé sur l'XP accumulée (1000 XP = 1 level)
   → Persiste entre les parties
   → Affiché dans le HUD
   
   ✅ Cette séparation évite les bugs de progression
============================= */
const state = {
    running: true,
    score: 0,
    highScore: Number(localStorage.getItem("breakerHighScore")) || 0,
    xp: Number(localStorage.getItem("breakerXP")) || 0,
    stage: 1,        // ← Niveau de la partie (1-6)
    playerLevel: 1,  // ← Niveau du joueur (basé sur XP global)
    playStartTime: Date.now() // ⏱️ Timestamp de début de partie
};

let combo = 0;
let bestCombo = parseInt(localStorage.getItem("breaker_bestCombo")) || 0;
bestCombo = parseInt(localStorage.getItem("breaker_bestCombo")) || 0;
/**
 * 🎮 Breaker - Expose game state for CJ System (défini tôt pour cjSystem.js)
 * Called by cjSystem to check if game is actively running
 */
window.getGameState = function () {
    return {
        running: state.running
    };
};

// Function to calculate player level based on XP
function calculatePlayerLevel(xp) {
    return Math.floor(xp / 1000) + 1;
}

// ⏱️ Function to save current play session time
function savePlayTime() {
    const playDuration = Math.floor((Date.now() - state.playStartTime) / 1000);
    console.log("⏱️ Session duration:", playDuration, "seconds (", Math.floor(playDuration / 60), "min", playDuration % 60, "sec)");
    
    if (typeof addPlayTime === "function" && playDuration > 0) {
        addPlayTime(playDuration);
        console.log("✅ Play time saved to profile");
        // Reset pour éviter de sauver deux fois
        state.playStartTime = Date.now();
    } else if (!window.addPlayTime) {
        console.warn("⚠️ addPlayTime function not available");
    }
}

// Function to show level up popup
function showLevelUpPopup(newLevel) {
    Popup.confirm(i18nT("gameplay.levelUpTitle", { level: newLevel }));
}

// Function to update level text in HUD (affiche le niveau JOUEUR)
function updateLevelText() {
    const levelText = document.getElementById("levelText");
    if (levelText) {
        levelText.textContent = `${i18nT("gameplay.levelShort")} ${state.playerLevel}`;
    }
}

// Function to update stage text in HUD (affiche le stage actuel)
function updateStageText() {
    const stageText = document.getElementById("stageText");
    if (stageText) {
        stageText.textContent = "Stage " + state.stage;
    }
}


const bricks = [];
let bricksDestroyed = 0;
let levelComplete = false;
    let justResized = false;


/* =============================
   💀 BOSS SYSTEM
============================= */

let boss = {
    active: false,
    phase: 1,
    maxPhases: 3,
    moveDirection: 1,
    moveSpeed: 1.5,
    moveTimer: 0,
    bossType: undefined
};
let modularBoss = null; // Nouvelle instance modulaire (City Guardian uniquement)

/* =============================
   🌟 ORBS SYSTEM (placeholder)
============================= */

const orbs = []; // orbes actives dans la scène
const popups = [];

const ball = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    size: 0,
    speed: 0,
    launched: false,
    trail: []
};

const paddle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    speed: 0,
    maxSpeed: 20 // valeur stable, ajustable
};

/* =============================
   3️⃣ CANVAS SETUP
============================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;

    canvas.width = viewW * DPR;
    canvas.height = viewH * DPR;

    canvas.style.width = viewW + "px";
    canvas.style.height = viewH + "px";

    canvas.style.touchAction = "none";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* =============================
   RESPONSIVE SIZES
============================= */

    // paddle = ~30% largeur écran
    applyPaddleSizeBonus(); // Applique le bonus du compagnon
    paddle.height = viewW * 0.05;

    // balle = ~4% largeur écran, plus grosse sur mobile
    ball.size = viewW < 768 ? viewW * 0.08 : viewW * 0.05;

    /* responsive bricks */
    brickW = viewW * 0.10;
    brickH = brickW * 0.5;
    gap = brickW * 0.05;

    createBricks();
    resetBall();
    justResized = true; // Active la protection pour la prochaine frame
}
 
/* =============================
   🎨 ASSETS
============================= */

const assets = {
    // Images des briques
    brick: new Image(),
    brickCracked: new Image(),

    // Autres assets
    backgrounds: [],
    bossBackground: new Image(),
    barBase: new Image(),
    barFill: new Image(),
    ballNormal: new Image(),
    ballPower: new Image(),

    // Sons associés
    sounds: {}
};

// Attribution des chemins aux assets
assets.brick.src = "../assets/bricks/brick_energy.png";
assets.brickCracked.src = "../assets/bricks/brick_energy_cracked.png";

assets.barBase.src = "../assets/ui/bars/bar_base.png";
assets.barFill.src = "../assets/ui/bars/bar_fill.png";

/* =============================
   🐾 COMPANION SYSTEM (AAA)
============================= */
const companion = {
    image: null,
    loaded: false,
    id: null,
    element: null,
    
    // Position & Animation
    x: 0,
    y: 0,
    size: 120,
    scale: 1,
    opacity: 0,
    
    // État d'encouragement
    showing: false,
    message: "",
    messageLife: 0,
    bounceOffset: 0,
    bounceSpeed: 0,
    
    // Timers
    showTimer: 0,
    hideTimer: 0,
    animTimer: 0
};

// 💬 Messages d'encouragement AAA par événement
const encouragements = {
    orb: [
        "Excellent ! ✨",
        "Bien joué ! 🌟",
        "Continue ! 💫",
        "Magnifique ! ⭐",
        "Super ! 🎆"
    ],
    combo: [
        "Combo incroyable ! 🔥",
        "En feu ! 🔥",
        "Unstoppable ! ⚡",
        "Parfait ! 💥",
        "Incroyable ! 🌟"
    ],
    stage: [
        "Stage complété ! 🎉",
        "Victoire ! 🏆",
        "Bravo champion ! 👑",
        "Fantastique ! 🌟",
        "Tu es le meilleur ! ⭐"
    ],
    levelup: [
        "Level Up ! 🎊",
        "Tu progresses ! 📈",
        "Plus fort ! 💪",
        "Évolution ! ✨",
        "Nouvelle puissance ! ⚡"
    ],
    milestone: [
        "Score incroyable ! 🎯",
        "Légende ! 👑",
        "Record battu ! 🏆",
        "Champion ! 🌟",
        "Impressionnant ! 💎"
    ],
    boss: [
        "Victoire épique ! 🏆",
        "Boss vaincu ! 👑",
        "Héros ! ⚔️",
        "Triomphe ! 🎊",
        "Gloire éternelle ! ✨"
    ]
};

function getEncouragements(type) {
    if (window.I18n) {
        const list = window.I18n.t(`encouragements.${type}`);
        if (Array.isArray(list)) return list;
    }
    return encouragements[type] || encouragements.orb;
}

// 🎮 Charger le compagnon équipé
function loadCompanion() {
    try {
        const profile = typeof getPlayerProfile === 'function' ? getPlayerProfile() : null;
        
        if (!profile || !profile.equippedCompanion) {
            console.log("🐾 Aucun compagnon équipé");
            return;
        }
        
        companion.id = profile.equippedCompanion;
        companion.element = profile.equippedCompanion; // Pour les couleurs
        
        // Charger l'image (gestion spéciale pour astral)
        companion.image = new Image();
        
        if (companion.id === 'astral') {
            companion.image.src = "../shop/categories/companions/light/astral_idle.png";
        } else {
            companion.image.src = `../assets/companions/${companion.id}/${companion.id}_idle.png`;
        }
        
        companion.image.onload = () => {
            companion.loaded = true;
            console.log("✅ Compagnon chargé:", companion.id);
        };
        
        companion.image.onerror = () => {
            console.error("❌ Erreur chargement compagnon:", companion.id);
        };
        
    } catch (error) {
        console.error("❌ Erreur loadCompanion:", error);
    }
}

// 🎬 Afficher un encouragement
function showCompanionEncouragement(type = 'orb') {
    if (!companion.loaded || companion.showing) return;
    
    // Message aléatoire du type
    const messages = getEncouragements(type);
    companion.message = messages[Math.floor(Math.random() * messages.length)];
    
    // Animation d'apparition
    companion.showing = true;
    companion.showTimer = 0;
    companion.messageLife = 120; // 2 secondes à 60fps
    companion.bounceSpeed = 0.15;
    companion.animTimer = 0;
    
    console.log("💬", companion.id, "dit:", companion.message);
}

// 🔧 Polyfill pour roundRect (compatibilité navigateurs)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// 🎨 Dessiner le compagnon avec encouragement
function drawCompanion() {
    if (!companion.loaded) return;
    
    // Position bottom-left responsive
    companion.x = viewW * 0.08;
    companion.y = viewH - companion.size - viewH * 0.08;
    
    // Animation d'apparition/disparition
    if (companion.showing && companion.messageLife > 0) {
        // Fade in rapide
        if (companion.showTimer < 15) {
            companion.opacity = companion.showTimer / 15;
            companion.scale = 0.5 + (companion.showTimer / 15) * 0.5;
            companion.showTimer++;
        } else if (companion.messageLife < 30) {
            // Fade out
            companion.opacity = companion.messageLife / 30;
        } else {
            companion.opacity = 1;
            companion.scale = 1;
        }
        
        // Bounce animation
        companion.animTimer += companion.bounceSpeed;
        companion.bounceOffset = Math.sin(companion.animTimer) * 8;
        
        companion.messageLife--;
        
        if (companion.messageLife <= 0) {
            companion.showing = false;
            companion.opacity = 0;
        }
    } else if (!companion.showing) {
        // Idle state (toujours visible mais discret)
        companion.opacity = 0.3;
        companion.scale = 0.8;
        companion.bounceOffset = Math.sin(Date.now() * 0.001) * 3;
    }
    
    ctx.save();
    ctx.globalAlpha = companion.opacity;
    
    // Dessiner le compagnon
    const drawX = companion.x;
    const drawY = companion.y + companion.bounceOffset;
    const drawSize = companion.size * companion.scale;
    
    // Ombre portée
    if (companion.showing) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
    }
    
    ctx.drawImage(
        companion.image,
        drawX - drawSize / 2,
        drawY - drawSize / 2,
        drawSize,
        drawSize
    );
    
    ctx.shadowColor = "transparent";
    
    // Bulle de dialogue (glass-morphism AAA)
    if (companion.showing && companion.message && companion.messageLife > 10) {
        const bubbleX = drawX + drawSize * 0.6;
        const bubbleY = drawY - drawSize * 0.3;
        
        // Mesurer le texte
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        const textWidth = ctx.measureText(companion.message).width;
        const bubbleWidth = textWidth + 40;
        const bubbleHeight = 50;
        
        // Couleur selon élément
        const elementColors = {
            aqua: "rgba(92, 200, 255, 0.15)",
            ignis: "rgba(255, 107, 61, 0.15)",
            astral: "rgba(255, 216, 107, 0.15)",
            flora: "rgba(139, 255, 123, 0.15)",
            aube: "rgba(200, 150, 255, 0.15)"
        };
        
        const borderColors = {
            aqua: "rgba(92, 200, 255, 0.6)",
            ignis: "rgba(255, 107, 61, 0.6)",
            astral: "rgba(255, 216, 107, 0.6)",
            flora: "rgba(139, 255, 123, 0.6)",
            aube: "rgba(200, 150, 255, 0.6)"
        };
        
        const bgColor = elementColors[companion.element] || "rgba(255, 255, 255, 0.15)";
        const borderColor = borderColors[companion.element] || "rgba(255, 255, 255, 0.6)";
        
        // Bulle glass-morphism
        ctx.save();
        
        // Backdrop blur effect
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        
        // Forme arrondie
        const radius = 15;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, radius);
        ctx.fill();
        ctx.stroke();
        
        // Petit triangle pointer
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(bubbleX - 10, bubbleY + bubbleHeight / 2);
        ctx.lineTo(bubbleX, bubbleY + bubbleHeight / 2 - 8);
        ctx.lineTo(bubbleX, bubbleY + bubbleHeight / 2 + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Texte
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            companion.message,
            bubbleX + bubbleWidth / 2,
            bubbleY + bubbleHeight / 2
        );
        
        ctx.restore();
    }
    
    ctx.restore();
}

assets.ballNormal.src = "../assets/ball/ball_normal.png";
assets.ballPower.src = "../assets/ball/ball_power.png";

// Sons (tu peux ajouter des sons ici de manière similaire)
assets.sounds.ballFall = new Audio("../assets/audio/ball_fall_nocturne.wav");
assets.sounds.brickHit = new Audio("../assets/audio/brick_hit.wav");
assets.sounds.brickBreak = new Audio("../assets/audio/brick_break_crash.wav");
assets.sounds.magicBreak = new Audio("../assets/audio/brick_break_magic.wav");
assets.sounds.paddleHit = new Audio("../assets/audio/paddle_hit_soft.wav");
assets.sounds.wallHit = new Audio("../assets/audio/wall_hit_soft.wav");

// Préchargement backgrounds (Promise)
function preloadBackgrounds() {
    const promises = [];
    // Déterminer le thème du niveau courant
    let themeFolder = "theme1_city_reborn";
    let backgroundsCount = 5;
    let bossBg = "boss.png";
    if (currentLevelData && typeof currentLevelData === "object" && currentLevelData.theme) {
        // Nettoyer le nom du thème pour correspondre au dossier
        themeFolder = currentLevelData.theme.trim();
        // Définir le nombre d'images selon le thème (par défaut 5, ajustable)
        if (themeFolder === "sanctuaire_astral") {
            backgroundsCount = 5; // Ajustez si besoin selon vos assets
            bossBg = "boss.png";
        }
    }
    assets.backgrounds = [];
    for (let i = 1; i <= backgroundsCount; i++) {
        const img = new Image();
        img.src = `../assets/backgrounds/gameplay/${themeFolder}/bg${i}.png`;
        assets.backgrounds.push(img);
        promises.push(new Promise((resolve) => {
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error("Erreur chargement background:", img.src);
                resolve(null);
            };
        }));
    }
    // Boss background
    assets.bossBackground = new Image();
    assets.bossBackground.src = `../assets/backgrounds/gameplay/${themeFolder}/${bossBg}`;
    promises.push(new Promise((resolve) => {
        assets.bossBackground.onload = () => resolve(assets.bossBackground);
        assets.bossBackground.onerror = () => {
            console.error("Erreur chargement boss background:", assets.bossBackground.src);
            resolve(null);
        };
    }));
    return Promise.all(promises);
}

const soundPools = new Map();

function registerSoundPool(sound, poolSize) {
    const pool = [];
    for (let i = 0; i < poolSize; i++) {
        const node = sound.cloneNode();
        node.volume = 0.5;
        pool.push(node);
    }
    soundPools.set(sound, { pool, index: 0 });
}

registerSoundPool(assets.sounds.ballFall, 2);
registerSoundPool(assets.sounds.brickHit, 8);
registerSoundPool(assets.sounds.brickBreak, 4);
registerSoundPool(assets.sounds.magicBreak, 3);
registerSoundPool(assets.sounds.paddleHit, 4);
registerSoundPool(assets.sounds.wallHit, 4);

function playSound(sound) {
    const entry = soundPools.get(sound);
    if (!entry) {
        const s = sound.cloneNode();
        s.volume = 0.5;
        s.play().catch(() => {});
        return;
    }

    const node = entry.pool[entry.index];
    entry.index = (entry.index + 1) % entry.pool.length;
    node.currentTime = 0;
    node.play().catch(() => {});
}

/* =============================
   🐾 COMPANION BONUSES
============================= */

let activeCompanionBonus = null;

function loadActiveCompanionBonus() {
    if (typeof getActiveCompanionBonus === 'function') {
        activeCompanionBonus = getActiveCompanionBonus();
        if (activeCompanionBonus) {
            console.log("🐾 Bonus actif:", activeCompanionBonus.companionName, "-", activeCompanionBonus.formatted);
        } else {
            console.log("🐾 Aucun bonus de compagnon actif");
        }
    }
}

function applyPaddleSizeBonus() {
    // Applique le bonus de taille de paddle (Flora)
    if (activeCompanionBonus && activeCompanionBonus.type === 'paddle_size') {
        const bonusMultiplier = 1 + (activeCompanionBonus.value / 100);
        paddle.width = (viewW * 0.20) * bonusMultiplier;
        console.log(`🛡️ Bonus paddle: ${activeCompanionBonus.value}% (${paddle.width.toFixed(0)}px)`);
    } else {
        paddle.width = viewW * 0.20;
    }
}

function applyBallSpeedBonus() {
    // Le bonus de vitesse sera appliqué dans updateBall()
    if (activeCompanionBonus && activeCompanionBonus.type === 'ball_speed') {
        console.log(`💨 Bonus vitesse: ${activeCompanionBonus.value}%`);
    }
}

function applyXPBonus(baseXP) {
    // Applique le bonus d'XP (Aube)
    if (activeCompanionBonus && activeCompanionBonus.type === 'xp_multiplier') {
        const bonusMultiplier = 1 + (activeCompanionBonus.value / 100);
        return Math.floor(baseXP * bonusMultiplier);
    }
    return baseXP;
}

function applyOrbDropBonus() {
    // Applique le bonus de drop d'orbes (Astral)
    if (activeCompanionBonus && activeCompanionBonus.type === 'orb_drop') {
        const bonusMultiplier = 1 + (activeCompanionBonus.value / 100);
        return 0.18 * bonusMultiplier; // Base 18% chance
    }
    return 0.18; // Base chance
}

function applyBrickDamageBonus(baseDamage = 1) {
    // Applique le bonus de dégâts (Ignis)
    if (activeCompanionBonus && activeCompanionBonus.type === 'brick_damage') {
        const bonusMultiplier = 1 + (activeCompanionBonus.value / 100);
        return Math.ceil(baseDamage * bonusMultiplier);
    }
    return baseDamage;
}

/* =============================
   4️⃣ BRICKS
============================= */

const BRICK_BREAK_DURATION = 20;
const BRICK_HIT_FLASH = 6;

function createBrickBreakFx() {
    const shards = [];
    const shardCount = 12;

    for (let i = 0; i < shardCount; i++) {
        shards.push({
            angle: Math.random() * Math.PI * 2,
            distance: 12 + Math.random() * 22,
            size: 2 + Math.random() * 4
        });
    }

    return shards;
}


function createBricks() {
    boss.bossType = currentLevelData ? currentLevelData.bossType : 'city_guardian';
    bricks.length = 0;

    // Déterminer si c'est un boss (basé sur le STAGE ou les données du niveau)
    boss.active = currentLevelData && currentLevelData.isBoss;
    boss.phase = 1;
    boss.moveTimer = 0;
    boss.bossType = currentLevelData ? currentLevelData.bossType : 'city_guardian';

    // Instanciation du boss modulaire uniquement pour City Guardian
    if (boss.active && boss.bossType === 'city_guardian') {
        modularBoss = createBoss('city_guardian', {
            setBossSpeed: (speed) => { boss.moveSpeed = speed; },
            flashScreen: (type) => { /* TODO: effet visuel warning/danger */ },
            addDiamonds: addDiamonds,
            addXP: (xp) => { state.xp += xp; localStorage.setItem("breakerXP", state.xp); },
            showBossMessage: (key) => { Popup.confirm(i18nT("gameplay.bossDefeated", { xp: 500 }), () => { window.location.href = "../pages/campaign.html"; }); }
        });
    } else {
        modularBoss = null;
    }

    // Recharger les backgrounds si le thème change
    preloadBackgrounds();

    let currentRows = rows;
    let currentCols = cols;
    let density = 0.8;
    let hp = 2;

    if (boss.active) {
        density = currentLevelData.brickDensity || 0.8;
        hp = currentLevelData.brickHp || 5;
        boss.maxPhases = currentLevelData.bossPhases || 3;
        boss.moveSpeed = currentLevelData.moveSpeed || 1.5;
        // Configuration spécifique du Gardien Astral
        if (boss.bossType === 'astral_guardian') {
            console.log('✨ BOSS: Gardien Astral activé!');
            boss.groundMode = false; // Phase 1: gravité normale
            boss.invertMode = false; // Phase 2: gravité inversée
            boss.coreMode = false;   // Phase 3: noyau cosmique
        }
        // Initialiser le boss modulaire si City Guardian
        if (modularBoss) modularBoss.init(currentRows * currentCols);
    } else if (currentLevelData) {
        // Configuration normale (depuis levels.json)
        currentRows = currentLevelData.rows || currentRows;
        currentCols = currentLevelData.cols || currentCols;
        density = currentLevelData.brickDensity || density;
        hp = currentLevelData.brickHp || hp;
    } else {
        // Configuration normale (basée sur le STAGE)
        const densityMap = {
            1: 0.9,
            2: 0.8,
            3: 0.7,
            4: 0.6,
            5: 0.5
        };
        density = densityMap[state.stage] || 0.8;
    
        const hpMap = {
            1: 1,
            2: 2,
            3: 2,
            4: 3,
            5: 3
        };
        hp = hpMap[state.stage] || 2;

        if (state.stage >= 3) currentRows = 6;
        if (state.stage >= 4) currentCols = 9;
        if (state.stage >= 5) currentRows = 7;
    }

    const offsetX = (viewW - currentCols * (brickW + gap)) / 2;
    const offsetY = viewH * 0.12;

    for (let r = 0; r < currentRows; r++) {
        for (let c = 0; c < currentCols; c++) {
            if (Math.random() > density) continue;

            bricks.push({
                x: offsetX + c * (brickW + gap),
                y: offsetY + r * (brickH + gap),
                initialX: offsetX + c * (brickW + gap), // Position initiale pour le boss
                row: r, // Stocker la rangée pour le mouvement
                w: brickW,
                h: brickH,
                hp,
                maxHp: hp,
                cracked: false,
                crackLevel: 0,
                sprite: assets.brick,
                breakFx: null,
                hitTimer: 0,
                destroyed: false,
                destroying: false,
                destroyTimer: 0
            });
        }
    }
    }

/* =============================
   5️⃣ BALL / PADDLE RESET
============================= */

function resetBall() {
    paddle.y = viewH * 0.85;
    paddle.x = viewW / 2 - paddle.width / 2;

    ball.launched = false;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.size;

    ball.dx = 0;
    ball.dy = 0;

    ball.trail = [];
}

function launchBall() {
    if (ball.launched) return;  // La balle ne doit être lancée qu'une seule fois

    ball.launched = true;  // Marque la balle comme lancée

    // Vitesse de base
    let baseSpeed = viewW * 0.006 + state.stage * 0.3;
    
    // Applique le bonus de vitesse (Aqua)
    if (activeCompanionBonus && activeCompanionBonus.type === 'ball_speed') {
        const bonusMultiplier = 1 + (activeCompanionBonus.value / 100);
        baseSpeed *= bonusMultiplier;
    }
    
    ball.speed = baseSpeed;

    ball.dx = ball.speed;
    ball.dy = -ball.speed;
}

/* =============================
   6️⃣ UPDATE
============================= */

function updateBall() {
    if (!ball.launched) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.size;
        return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    ball.trail.push({ x: ball.x, y: ball.y });

    if (ball.trail.length > 12) {
        ball.trail.shift();
    }

    /* paddle collision */
    if (
        ball.y + ball.size / 2 > paddle.y &&
        ball.y - ball.size / 2 < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.dy > 0
    ) {
        ball.dy *= -1; 
        combo = 0;

        playSound(assets.sounds.paddleHit);

        const hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dx = hit * ball.speed * 2;
    }

    /* walls */
    const epsilon = 2;
    if (ball.x < 0 || ball.x > viewW) {
        if (!ball._justBouncedX) {
            ball.dx *= -1;
            playSound(assets.sounds.wallHit);
        }
        // Correction position avec marge
        if (ball.x < 0) ball.x = 0 + epsilon;
        if (ball.x > viewW) ball.x = viewW - epsilon;
    }

    if (ball.y < 0) {
        if (!ball._justBouncedY) {
            ball.dy *= -1;
            playSound(assets.sounds.wallHit);
        }
        if (ball.y < 0) ball.y = epsilon;
    }

    if (ball.y > viewH) {
        playSound(assets.sounds.ballFall);
        resetBall();
        // La partie continue, le tick CJEngine n'est pas interrompu
        // Optionnel : afficher un message ou une animation de perte de balle
    }
    // Réinitialiser les flags de rebond
    ball._justBouncedX = false;
    ball._justBouncedY = false;
}

function updateOrbHUD() {
    const o = getPlayerProfile().orbs;

    if (orbEls.aqua) orbEls.aqua.textContent = "x" + (o.water || 0);
    if (orbEls.ignis) orbEls.ignis.textContent = "x" + (o.fire || 0);
    if (orbEls.astral) orbEls.astral.textContent = "x" + (o.light || 0);
    if (orbEls.flora) orbEls.flora.textContent = "x" + (o.nature || 0);
    if (orbEls.void) orbEls.void.textContent = "x" + (o.void || 0);
}

function updatePaddle() {
    paddle.x += paddle.speed;
    // empêcher sortie écran
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > viewW) {
        paddle.x = viewW - paddle.width;
    }
}

function spawnOrb(x, y) {
    // Nouvelle règle : une seule mascotte équipée, une seule orbe possible
    // Taux d'apparition réduit à 0.02 (2%)
    const orbDropChance = 0.02;
    if (Math.random() > orbDropChance) return;

    // Déterminer la mascotte équipée (companion.id)
    // Si aucune mascotte équipée ou mascotte non reconnue, aucun spawn
    if (!companion.id || !MASCOT_ORB_MAP[companion.id]) return;
    const type = MASCOT_ORB_MAP[companion.id];

    orbs.push({
        x,
        y,
        vy: 2,
        r: 6,
        type,
        time: 0, // Pour animation de pulsation
        rotation: Math.random() * Math.PI * 2 // Rotation aléatoire des particules
    });
}

/* =============================
   7️⃣ COLLISIONS
============================= */

function updateBrickCollision() {
    if (justResized) return; // Bloque toute collision/spawn d'orbe cette frame
    for (const b of bricks) {
        if (b.destroyed) continue;

        // 🌙 collision balle / brique
        if (
            ball.x + ball.size / 2 > b.x &&
            ball.x - ball.size / 2 < b.x + b.w &&
            ball.y + ball.size / 2 > b.y &&
            ball.y - ball.size / 2 < b.y + b.h
        ) {
            // Determine bounce direction based on overlap
            const overlapLeft = (ball.x + ball.size / 2) - b.x;
            const overlapRight = (b.x + b.w) - (ball.x - ball.size / 2);
            const overlapTop = (ball.y + ball.size / 2) - b.y;
            const overlapBottom = (b.y + b.h) - (ball.y - ball.size / 2);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            const epsilon = 2; // marge de sécurité en pixels
            if (minOverlapX < minOverlapY) {
                // Horizontal bounce
                ball.dx *= -1;
                // Position correction based on brick center avec marge
                if (ball.x < b.x + b.w / 2) {
                    ball.x = b.x - ball.size / 2 - epsilon;
                } else {
                    ball.x = b.x + b.w + ball.size / 2 + epsilon;
                }
                // Empêcher double flip dx (mur + brique)
                ball._justBouncedX = true;
            } else {
                // Vertical bounce
                ball.dy *= -1;
                // Position correction based on brick center avec marge
                if (ball.y < b.y + b.h / 2) {
                    ball.y = b.y - ball.size / 2 - epsilon;
                } else {
                    ball.y = b.y + b.h + ball.size / 2 + epsilon;
                }
                ball._justBouncedY = true;
            }

            // dégâts
            const damage = applyBrickDamageBonus(1); // Bonus Ignis
            b.hp -= damage;

            const hitsTaken = Math.min(b.maxHp, b.maxHp - b.hp);
            const crackSteps = state.stage >= 2 ? 2 : 1;

            if (b.maxHp > 1 && hitsTaken > 0) {
                b.cracked = true;
                b.crackLevel = Math.min(
                    crackSteps,
                    Math.max(1, Math.ceil((hitsTaken / b.maxHp) * crackSteps))
                );
                b.sprite = assets.brickCracked;
            }

            b.hitTimer = BRICK_HIT_FLASH;

            // 🔊 hit doux
            playSound(assets.sounds.brickHit);

            // 💥 destruction
            if (b.hp <= 0) {
                if (!b.cracked && b.maxHp > 1) {
                    b.cracked = true;
                    b.crackLevel = Math.max(1, b.crackLevel || 1);
                    b.sprite = assets.brickCracked;
                }

                b.destroying = true;
                b.destroyTimer = BRICK_BREAK_DURATION; // duration of animation in frames
                b.breakFx = b.breakFx || createBrickBreakFx();

                // 🌟 Spawn orbe (18% chance)
                spawnOrb(b.x + b.w / 2, b.y + b.h / 2);

                bricksDestroyed++;
                state.score += 10;

                combo++;

                if (combo > bestCombo) {
                    bestCombo = combo;
                    localStorage.setItem("breaker_bestCombo", bestCombo);
                }

                // Encouragement combo (toutes les 10 briques)
                if (bricksDestroyed % 10 === 0) {
                    showCompanionEncouragement('combo');
                }

                // �🔊 son break magique parfois
                if (Math.random() < 0.3) playSound(assets.sounds.magicBreak);
            }

            break; // stop après 1 collision
        }
    }
}


function updateBricks() {
    // 👹 BOSS: Mouvement des briques
    if (boss.active) {
        boss.moveTimer++;
        // Mouvement horizontal en vague
        if (boss.moveTimer % 2 === 0) {
            const moveAmount = boss.moveSpeed * boss.moveDirection;
            for (const b of bricks) {
                if (b.destroyed || b.destroying) continue;
                b.x += moveAmount;
                // Suppression du clamp individuel : le mouvement est géré par le groupe
                // Détection mur pour inversion direction
                // On vérifie si une brique touche le mur
                const margin = 20;
                if (b.x < margin || b.x + b.w > viewW - margin) {
                    boss._shouldInvertDirection = true;
                }
            }
        }
        // Si une inversion de direction est nécessaire, on l'applique à tout le groupe
        if (boss._shouldInvertDirection) {
            boss.moveDirection *= -1;
            boss._shouldInvertDirection = false;
            // Déplacement immédiat du groupe pour éviter le blocage au mur
            const moveAmount = boss.moveSpeed * boss.moveDirection;
            for (const b of bricks) {
                if (b.destroyed || b.destroying) continue;
                b.x += moveAmount * 1.2; // Léger déplacement supplémentaire
            }
        }

        // 🎯 Gestion des phases du boss
        // (hooks déplacés après collision/destruction)
        // ...existing code...
    }
    // ...existing code...
    // Animation de destruction
    for (let i = bricks.length - 1; i >= 0; i--) {
        const b = bricks[i];
        if (b.destroying) {
            b.destroyTimer--;
            if (b.destroyTimer <= 0) {
                b.destroyed = true;
                b.destroying = false;
            }
        }
    }

    // Check for level completion after all animations are done
    const destroyedCount = bricks.filter(b => b.destroyed).length;
    // Recalcul bricksRemaining pour modularBoss
    const totalBricks = bricks.length;
    const remainingBricks = bricks.filter(b => !b.destroyed && !b.destroying).length;
    const percentRemaining = remainingBricks / totalBricks;

    // Appel hooks boss APRÈS collision/destruction/recalcul
    if (boss.active) {
        if (boss.bossType === 'astral_guardian') {
            // 🌀 GARDIEN ASTRAL - Phases spéciales (legacy)
            if (percentRemaining <= 0.66 && boss.phase === 1) {
                boss.phase = 2;
                boss.moveSpeed = 1.0; // Momentum plus doux pour phase 2
                boss.invertMode = true; // Activer inversion gravité
                ball.dy = -ball.dy; // Inverser la direction de la balle
                Popup.notify(i18nT("gameplay.astralPhase2"));
                console.log("✨ Phase 2: Inversion des Flux activée");
            }
            if (percentRemaining <= 0.33 && boss.phase === 2) {
                boss.phase = 3;
                boss.coreMode = true; // Noyau cosmique
                boss.moveSpeed = 0; // Immobile
                Popup.notify(i18nT("gameplay.astralPhase3"));
                console.log("💫 Phase 3: Cœur Cosmique activé");
            }
        } else if (modularBoss) {
            // City Guardian : déléguer au boss modulaire
            modularBoss.update(remainingBricks);
            boss.phase = modularBoss.phase;
        } else {
            // fallback legacy (autres boss éventuels)
            if (percentRemaining <= 0.66 && boss.phase === 1) {
                boss.phase = 2;
                boss.moveSpeed = 2.5;
                Popup.notify(i18nT("gameplay.bossPhase2"));
            }
            if (percentRemaining <= 0.33 && boss.phase === 2) {
                boss.phase = 3;
                boss.moveSpeed = 3.5;
                Popup.notify(i18nT("gameplay.bossPhase3"));
            }
        }
    }
    // ...existing code...
    // Fin correcte de la fonction updateBricks()
    // (accolade supprimée ici)

    for (const b of bricks) {
        if (b.hitTimer > 0) {
            b.hitTimer--;
        }
    }

    // Animation de destruction
    for (let i = bricks.length - 1; i >= 0; i--) {
        const b = bricks[i];
        if (b.destroying) {
            b.destroyTimer--;
            if (b.destroyTimer <= 0) {
                b.destroyed = true;
                b.destroying = false;
            }
        }
    }

    // Check for level completion after all animations are done
    // (seconde déclaration supprimée)
    if (destroyedCount >= bricks.length && !levelComplete) {
        levelComplete = true;
        bricksDestroyed = 0;

        if (boss.active) {
            // 🏆 BOSS VAINCU
            // Enregistrer la défaite du boss dans le profil
            let profile = JSON.parse(localStorage.getItem('breaker_profile')) || {};
            if (!profile.bossesCompleted) profile.bossesCompleted = [];
            if (!profile.levelsCompleted) profile.levelsCompleted = [];
            if (!profile.bossesCompleted.includes(state.stage)) {
                profile.bossesCompleted.push(state.stage);
            }
            profile.levelsCompleted.push(state.stage);
            localStorage.setItem('breaker_profile', JSON.stringify(profile));

            // City Guardian : déléguer la victoire au boss modulaire
            if (modularBoss) {
                modularBoss.onVictory();
            } else {
                // Legacy Astral Guardian ou fallback
                const bossXP = applyXPBonus(500); // Bonus Aube
                state.xp += bossXP;
                localStorage.setItem("breakerXP", state.xp);
                // 💎 Gain de diamants boss
                addDiamonds(5);
                // 💬 Encouragement boss
                showCompanionEncouragement('boss');
                // ⏱️ Sauvegarder le temps avant de quitter
                savePlayTime();
                let defeatMessage = i18nT("gameplay.bossDefeated", { xp: bossXP });
                if (boss.bossType === 'astral_guardian') {
                    defeatMessage = i18nT("gameplay.astralDefeat", { xp: bossXP });
                }
                Popup.confirm(defeatMessage, () => {
                    window.location.href = "../pages/campaign.html";
                });
            }
        } else {
            // Niveau normal - Passage au STAGE suivant
            // Enregistrer que le niveau est complété
            let profile = JSON.parse(localStorage.getItem('breaker_profile')) || {};
            if (!profile.levelsCompleted) profile.levelsCompleted = [];
            if (!profile.levelsCompleted.includes(state.stage)) {
                profile.levelsCompleted.push(state.stage);
            }
            localStorage.setItem('breaker_profile', JSON.stringify(profile));

            // 💎 Gain de diamant tous les 3 niveaux
            if (state.stage % 3 === 0) {
                addDiamonds(1);
            }

            state.stage++;
            const stageXP = applyXPBonus(100); // Bonus Aube
            state.xp += stageXP;
            localStorage.setItem("breakerXP", state.xp);

            // 💬 Encouragement stage complété
            showCompanionEncouragement('stage');

            // Check for player level up
            const previousPlayerLevel = state.playerLevel;
            state.playerLevel = calculatePlayerLevel(state.xp);
            updateLevelText();

            if (state.playerLevel > previousPlayerLevel) {
                // 💬 Encouragement level up
                showCompanionEncouragement('levelup');
                showLevelUpPopup(state.playerLevel);
            }

            updateCurrentLevelData();
            createBricks();
            resetBall();
            levelComplete = false;
        }
    }
}

function updatePopups() {
    for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];

        p.y -= 0.6; // monte doucement
        p.life--;

        if (p.life <= 0) {
            popups.splice(i, 1);
        }
    }
}

function drawPopups() {
    ctx.save();

    const colors = {
        water: "#5cc8ff",
        fire: "#ff6b3d",
        light: "#ffd86b",
        nature: "#6bbf5a",
        void: "#c26bff"
    };

    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";

    for (const p of popups) {
        ctx.globalAlpha = p.life / 40; // fade smooth
        ctx.font = "bold 22px Arial"; // plus gros

        ctx.fillStyle = colors[p.type] || "#fff";
        ctx.fillText(p.text, p.x, p.y);
    }

    ctx.restore();
}

// =====================
// ORBS UPDATE
// =====================
function updateOrbs() {
    for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];

        o.y += o.vy;
        
        // Animation de rotation des particules
        if (o.rotation !== undefined) {
            o.rotation += 0.05; // Rotation douce
        }

        // collision paddle
        if (
            o.y + o.r > paddle.y &&
            o.x > paddle.x &&
            o.x < paddle.x + paddle.width
        ) {
            // ✅ ajoute l'orbe
            addOrb(o.type, 1);

            // ✅ rafraîchit le HUD
            updateOrbHUD();

            // 💬 Encouragement compagnon
            showCompanionEncouragement('orb');

            // ✅ popup
            popups.push({
                x: o.x,
                y: o.y,
                text: "+1",
                type: o.type,
                life: 40
            });

            // ✅ suppression orbe
            orbs.splice(i, 1);
            continue;
        }

        // hors écran
        if (o.y > viewH) {
            orbs.splice(i, 1);
        }
    }
}

/* =============================
   8️⃣ DRAW
============================= */

function clear() {
    ctx.clearRect(0, 0, viewW, viewH);
}

function drawUI() {
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";

    ctx.fillText("Score : " + state.score, 20, 30);
    ctx.fillText("Best Combo : " + bestCombo, 20, 50);

    // 🏅 Afficher le rang actuel (thème CJ)
    ctx.save();
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    // Dégradé violet/bleu pour le texte
    const gradient = ctx.createLinearGradient(20, 75, 220, 75);
    gradient.addColorStop(0, "#a78bfa"); // violet lumineux
    gradient.addColorStop(1, "#60a5fa"); // bleu doux
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#a78bfa";
    ctx.shadowBlur = 8;
    ctx.fillText(`Rang actuel : ${currentRank.charAt(0).toUpperCase() + currentRank.slice(1)}`, 20, 75);
    ctx.restore();

    // 👹 Afficher la phase du boss et la barre de vie du boss
    if (boss.active) {
        ctx.save();
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = boss.phase === 3 ? "#ff3333" : boss.phase === 2 ? "#ffaa33" : "#ffff33";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        const text = `⚔️ BOSS - PHASE ${boss.phase}/${boss.maxPhases} ⚔️`;
        const textWidth = ctx.measureText(text).width;
        const x = (viewW - textWidth) / 2;
        ctx.strokeText(text, x, 40);
        ctx.fillText(text, x, 40);

        // === BARRE DE VIE DU BOSS ===
        // Calculer le pourcentage de briques restantes (HP boss)
        let totalBossBricks = 0;
        let remainingBossBricks = 0;
        for (const b of bricks) {
            if (!b.destroyed && !b.destroying) remainingBossBricks++;
            if (b.maxHp > 1) totalBossBricks++;
        }
        // Fallback si aucune brique boss détectée
        if (totalBossBricks === 0) totalBossBricks = bricks.length;
        const percent = Math.max(0, Math.min(1, remainingBossBricks / totalBossBricks));

        // Dimensions de la barre
        const barWidth = Math.max(220, viewW * 0.28);
        const barHeight = 22;
        const barX = (viewW - barWidth) / 2;
        const barY = 60;


        // === THEME CJAJLK: BARRE DE VIE NÉON ===
        // Fond arrondi sombre translucide
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = "#0a0a18";
        roundRect(ctx, barX, barY, barWidth, barHeight, 14);
        ctx.fill();
        ctx.restore();

        // Remplissage dynamique dégradé bleu-violet
        ctx.save();
        ctx.globalAlpha = 0.92;
        const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        grad.addColorStop(0, "#5cc8ff"); // bleu clair
        grad.addColorStop(0.5, "#a78bfa"); // violet lumineux
        grad.addColorStop(1, "#7f5cff"); // violet profond
        ctx.fillStyle = grad;
        roundRect(ctx, barX, barY, barWidth * percent, barHeight, 14);
        ctx.shadowColor = "#5cc8ff";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();

        // Contour lumineux
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 3.5;
        roundRect(ctx, barX, barY, barWidth, barHeight, 14);
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Texte HP stylisé
        ctx.save();
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#5cc8ff";
        ctx.shadowBlur = 10;
        ctx.textAlign = "center";
        ctx.fillText(`BOSS HP : ${remainingBossBricks} / ${totalBossBricks}`, barX + barWidth / 2, barY + barHeight - 6);
        ctx.restore();

        // Fonction utilitaire pour arrondir les coins
        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        ctx.restore();
    }

    // === DEBUG CJ TIMER (coin bas droit) ===
    if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG_CJ_TIMER && window.CJEngine && window.CJEngine.getStats) {
        try {
            const stats = window.CJEngine.getStats ? window.CJEngine.getStats('breaker') : null;
            if (stats) {
                ctx.save();
                ctx.font = '13px monospace';
                ctx.fillStyle = '#5cc8ff';
                ctx.globalAlpha = 0.7;
                const sec = Math.ceil((stats.remainingMs || 0) / 1000);
                ctx.fillText(`CJ ⏱️ : ${sec}s`, viewW - 110, viewH - 18);
                ctx.restore();
            }
        } catch (e) {}
    }
}

function drawBricks() {
    for (const b of bricks) {
        if (b && !b.destroyed) {
            // ...existing code...
        for (const b of bricks) {
            if (b.destroyed) continue;

            const img = b.sprite || ((b.hp < b.maxHp) ? assets.brickCracked : assets.brick);

            let drawX = b.x;
            let drawY = b.y;
            let drawW = b.w;
            let drawH = b.h;

            if (b.hitTimer > 0 && !b.destroying) {
                const hitProgress = b.hitTimer / BRICK_HIT_FLASH;
                const punch = hitProgress * 1.5;
                drawX += (Math.random() - 0.5) * punch;
                drawY += (Math.random() - 0.5) * punch;
            }

            // Log et fallback si image non chargée
            if (!img || !img.complete || img.naturalWidth === 0) {
                console.warn('[DEBUG drawBricks] Image brique non chargée, fallback couleur', img);
                ctx.fillStyle = '#4af';
                ctx.fillRect(drawX, drawY, drawW, drawH);
                continue;
            }

            if (b.destroying) {
                // Gold effect with zoom
                const progress = 1 - (b.destroyTimer / BRICK_BREAK_DURATION); // 0 to 1
                const scale = 1 + progress * 0.3; // slight zoom
                const centerX = b.x + b.w / 2;
                const centerY = b.y + b.h / 2;
                const scaledW = b.w * scale;
                const scaledH = b.h * scale;

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 1 - progress * 0.35; // fade out

                ctx.drawImage(
                    img,
                    centerX - scaledW / 2,
                    centerY - scaledH / 2,
                    scaledW,
                    scaledH
                );

                if (b.breakFx) {
                    const glowAlpha = Math.max(0, 1 - progress * 1.1);
                    ctx.strokeStyle = `rgba(150, 220, 255, ${0.95 * glowAlpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, b.w * 0.55 * progress, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = `rgba(180, 230, 255, ${0.95 * glowAlpha})`;
                    for (const shard of b.breakFx) {
                        const dx = Math.cos(shard.angle) * shard.distance * progress;
                        const dy = Math.sin(shard.angle) * shard.distance * progress;
                        const size = shard.size * (1 - progress * 0.5);
                        ctx.beginPath();
                        ctx.arc(centerX + dx, centerY + dy, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.restore();
            } else {
                ctx.drawImage(img, drawX, drawY, drawW, drawH);

                if (b.crackLevel > 1) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = 0.22 + 0.08 * b.crackLevel;
                    ctx.drawImage(img, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
                    ctx.restore();
                }

                if (b.hitTimer > 0) {
                    const hitProgress = b.hitTimer / BRICK_HIT_FLASH;
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.globalAlpha = 0.25 + 0.3 * hitProgress;
                    ctx.drawImage(img, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
                    ctx.restore();
                }
            }
        }
}}}

function drawBackground() {
    // 👹 Utiliser le background du boss si actif
    let bgImg = null;
    // Vérifier si le thème du niveau courant correspond à celui des backgrounds chargés
    let themeFolder = "theme1_city_reborn";
    if (typeof currentLevelData === "object" && currentLevelData.theme) {
        themeFolder = currentLevelData.theme.replace(/theme\s*/i, "").replace(/\s+/g, "_").toLowerCase();
    }
    // Si le dossier de backgrounds ne correspond pas, on recharge
    if (!assets.backgrounds.length || (assets.backgrounds[0] && !assets.backgrounds[0].src.includes(themeFolder))) {
        preloadBackgrounds();
    }
    if (boss.active) {
        bgImg = assets.bossBackground;
    } else {
        const index = (state.stage - 1) % assets.backgrounds.length;
        bgImg = assets.backgrounds[index];
    }
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, viewW, viewH);
    } else {
        ctx.fillStyle = "#0a0a18";
        ctx.fillRect(0, 0, viewW, viewH);
    }
}

function drawBall() {
    // 🌙 TRAÎNÉE
    for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = i / ball.trail.length;
        const pulse = Math.sin(Date.now() * 0.01) * 2;
        const s = ball.size + pulse;

        ctx.globalAlpha = alpha * 0.4;

        ctx.drawImage(
            assets.ballNormal,
            t.x - ball.size / 2,
            t.y - ball.size / 2,
            ball.size,
            ball.size
        );
    }

    ctx.globalAlpha = 1;

    // ✨ Balle principale
    ctx.drawImage(
        assets.ballNormal,
        ball.x - ball.size / 2,
        ball.y - ball.size / 2,
        ball.size,
        ball.size
    );
}

function drawPaddle() {
    // base
    ctx.drawImage(
        assets.barBase,
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );

    // fill lumineux (léger effet énergie)
    ctx.drawImage(
        assets.barFill,
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

function gameOver() {
    state.running = false;

    // (Suppression du reset CJEngine : le timer CJ doit rester global et persistant)

    // ⏱️ Sauvegarder le temps de jeu
    savePlayTime();

    // Always gain XP from the score (10 points = 1 XP)
    const xpGained = Math.floor(state.score / 10);
    const previousPlayerLevel = state.playerLevel;
    addXP(xpGained);
    // Update player level based on new XP
    state.playerLevel = calculatePlayerLevel(state.xp);
    updateLevelText();
    // Check for player level up
    if (state.playerLevel > previousPlayerLevel) {
        showLevelUpPopup(state.playerLevel);
    }

    // Déblocage rang suivant si campagne terminée
    if (levelComplete && currentRank !== "nocturne") {
        const nextRank = getNextRank(currentRank);
        if (nextRank) {
            localStorage.setItem("breaker_rank", nextRank);
            currentRank = nextRank;
            showRankUnlocked(nextRank);
        }
    }

    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem("breaker_bestCombo", bestCombo);
    }

    state.score = 0; // reset pour la prochaine partie
    playSound(assets.sounds.ballFall);
}

function drawOrbs() {
    const colors = {
        water: "#5cc8ff",
        fire: "#ff6b3d",
        light: "#ffd86b",
        nature: "#6bff9c",
        void: "#c26bff"
    };

    // Couleurs secondaires pour gradients
    const lightColors = {
        water: "#aae5ff",
        fire: "#ffaa77",
        light: "#fff4aa",
        nature: "#aaffcc",
        void: "#e5aaff"
    };

    for (const o of orbs) {
        o.time = (o.time || 0) + 0.1; // Animation time
        
        const pulse = 1 + Math.sin(o.time) * 0.15; // Pulsation douce
        const currentR = o.r * pulse;
        
        ctx.save();
        
        // 1️⃣ GLOW extérieur (halo lumineux)
        const glowGradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, currentR * 2.5);
        glowGradient.addColorStop(0, colors[o.type] + "88"); // Semi-transparent au centre
        glowGradient.addColorStop(0.4, colors[o.type] + "44");
        glowGradient.addColorStop(1, colors[o.type] + "00"); // Transparent à l'extérieur
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(o.x, o.y, currentR * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 2️⃣ Anneau brillant externe
        ctx.strokeStyle = lightColors[o.type] + "aa";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(o.x, o.y, currentR * 1.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // 3️⃣ Orbe principale avec gradient 3D
        const mainGradient = ctx.createRadialGradient(
            o.x - currentR * 0.3, 
            o.y - currentR * 0.3, 
            0,
            o.x, 
            o.y, 
            currentR
        );
        mainGradient.addColorStop(0, lightColors[o.type]); // Highlight
        mainGradient.addColorStop(0.5, colors[o.type]);
        mainGradient.addColorStop(1, colors[o.type] + "cc"); // Ombre légère
        
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(o.x, o.y, currentR, 0, Math.PI * 2);
        ctx.fill();
        
        // 4️⃣ Point lumineux (reflet)
        const highlightGradient = ctx.createRadialGradient(
            o.x - currentR * 0.4,
            o.y - currentR * 0.4,
            0,
            o.x - currentR * 0.4,
            o.y - currentR * 0.4,
            currentR * 0.5
        );
        highlightGradient.addColorStop(0, "#ffffff" + "dd");
        highlightGradient.addColorStop(0.6, "#ffffff" + "44");
        highlightGradient.addColorStop(1, "#ffffff" + "00");
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(o.x - currentR * 0.4, o.y - currentR * 0.4, currentR * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 5️⃣ Particules scintillantes autour
        const particleCount = 4;
        for (let i = 0; i < particleCount; i++) {
            const angle = (o.rotation || 0) + (Math.PI * 2 * i) / particleCount;
            const distance = currentR * 1.8;
            const px = o.x + Math.cos(angle) * distance;
            const py = o.y + Math.sin(angle) * distance;
            const particleSize = 1 + Math.sin(o.time + i) * 0.5;
            
            ctx.fillStyle = lightColors[o.type] + "cc";
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function draw() {
    clear();

    drawBackground(); // fond
    drawBricks();
    drawBall();
    drawOrbs();
    drawPaddle();
    drawCompanion(); // 🐾 Compagnon avec encouragements
    drawUI();

    drawPopups(); // ⭐ EN DERNIER
}

/* =============================
   9️⃣ MAIN LOOP
============================= */

function gameLoop() {
    updateBall();
    updatePaddle();
    updateBrickCollision();
    updateBricks();
    updateOrbs(); // ← ICI ❤️
    updatePopups();

    draw(); // 👈 UNE seule entrée graphique

    // ⏱️ CJEngine tick - Moteur centralisé de gestion des CJ
    // Le CJ ne tourne que si la partie est active ET la balle lancée
    if (window.CJEngine && typeof window.CJEngine.tick === "function" && state.running && ball.launched) {
        const now = performance.now();
        // Désactive la protection anti-spawn après la frame de resize
        if (justResized) justResized = false;
        const deltaMs = lastFrameTime ? (now - lastFrameTime) : 0;
        lastFrameTime = now;
        window.CJEngine.tick(deltaMs, "breaker");
    }
    // Boucle de rendu continue
    requestAnimationFrame(gameLoop);
}

/* =============================
   🔟 INPUT / INIT
============================= */
// Initialize player level based on XP
state.playerLevel = calculatePlayerLevel(state.xp);
// Charger le niveau sélectionné depuis localStorage (par défaut 1)
const selectedLevelId = Number(localStorage.getItem("selectedLevel")) || 1;
state.stage = selectedLevelId;

// Charger les données du niveau depuis levels.json
let currentLevelData = null;
let levelsData = null;

function updateCurrentLevelData() {
    if (levelsData) {
        currentLevelData = levelsData.levels.find(l => l.id === state.stage);
        if (!currentLevelData) {
            console.error('Niveau non trouvé:', state.stage);
            state.stage = 1;
            currentLevelData = levelsData.levels.find(l => l.id === 1);
        }
        console.log('📍 Niveau chargé:', currentLevelData);
    }
}
async function loadAndStartGame() {
    try {
        const response = await fetch('../data/levels.json');
        levelsData = await response.json();
        updateCurrentLevelData();
        // Démarrer le jeu une fois les données chargées
        initializeGame();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        state.stage = 1;
        initializeGame();
    }
}

function initializeGame() {
    // ...existing code...
    lastFrameTime = 0;

    updateOrbHUD();
    updateLevelText(); // Initialize level text
    loadCompanion(); // 🐾 Charger le compagnon équipé
    loadActiveCompanionBonus(); // 🎮 Charger les bonus du compagnon
    applyBallSpeedBonus(); // Log du bonus de vitesse
    resizeCanvas();
    applyRankSettings(); // Appliquer les paramètres du rang
    // Vérification des valeurs numériques
    console.log('[DEBUG initializeGame] paddle:', JSON.stringify(paddle));
    console.log('[DEBUG initializeGame] ball:', JSON.stringify(ball));
    console.log('[DEBUG initializeGame] bricks[0]:', bricks[0] ? JSON.stringify(bricks[0]) : 'Aucune brique');
    console.log('HighScore after init:', state.highScore);
    gameLoop();

    // 💎 Synchroniser l'affichage des diamants au démarrage
    updateDiamondsUI();
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("click", launchBall);

const menuBtn = document.getElementById("menuBtn");
const hubBtn = document.getElementById("hubBtn");

function confirmReturnToHub() {
    const message = "Quitter le jeu et revenir au centre de l’univers ?";
    const proceed = () => {
        // ⏱️ Sauvegarder le temps avant de quitter
        savePlayTime();
        window.location.href = "https://cjajlk.github.io/cjajlkGames/";
    };

    if (window.Popup && typeof window.Popup.confirm === "function") {
        window.Popup.confirm(message, proceed);
        return;
    }

    if (window.confirm(message)) {
        proceed();
    }
}

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        // ⏱️ Sauvegarder le temps avant de quitter
        savePlayTime();
        window.location.href = "../pages/mainmenu.html";
    });
}

if (hubBtn) {
    hubBtn.addEventListener("click", confirmReturnToHub);
}

// 🌙 MOBILE TOUCH
canvas.addEventListener("touchmove", e => {
    e.preventDefault();

    const touch = e.touches[0];
    paddle.x = touch.clientX - paddle.width / 2;

}, { passive: false });
// Correction finale : accolade fermante pour terminer le script


  document.addEventListener("keydown", e => {
    if (e.code === "ArrowLeft" || e.key.toLowerCase() === "q") {
        paddle.speed = -paddle.maxSpeed;
    }

    if (e.code === "ArrowRight" || e.key.toLowerCase() === "d") {
        paddle.speed = paddle.maxSpeed;
    }

    if (e.code === "Space") {
        launchBall();
    }
});


document.addEventListener("keyup", () => { 
    paddle.speed = 0;
});

const orbBtn = document.getElementById("orbBtn");
const orbPanel = document.getElementById("orbPanel");

orbBtn.addEventListener("click", () => {
    orbPanel.classList.toggle("hidden");
});

const orbEls = {
    aqua: document.getElementById("orbAqua"),
    ignis: document.getElementById("orbIgnis"),
    astral: document.getElementById("orbAstral"),
    flora: document.getElementById("orbFlora"),
    void: document.getElementById("orbVoid")
};

// Attendre le chargement des données avant de démarrer
window.addEventListener("DOMContentLoaded", () => {
    preloadBackgrounds().then(() => {
        loadAndStartGame();
    });
});

document.addEventListener("languagechange", () => {
    updateLevelText();
});

