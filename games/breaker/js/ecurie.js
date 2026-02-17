/* ==========================================
   🐾 BREAKER ÉCURIE - AAA PROFESSIONAL EDITION
   ========================================== */

// ===== Canvas Setup =====
const canvasEl = document.getElementById("ecurieCanvas");
if (!canvasEl) throw new Error("ecurieCanvas introuvable");

const ctx = canvasEl.getContext("2d");
const showcaseEl = document.querySelector(".companion-showcase");
const DPR = window.devicePixelRatio || 1;
let canvasW = 0;
let canvasH = 0;

function resize() {
    const width = showcaseEl ? showcaseEl.clientWidth : window.innerWidth;
    const height = showcaseEl ? showcaseEl.clientHeight : window.innerHeight;

    canvasW = width;
    canvasH = height;

    canvasEl.width = Math.floor(width * DPR);
    canvasEl.height = Math.floor(height * DPR);
    canvasEl.style.width = width + "px";
    canvasEl.style.height = height + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener("resize", resize);
resize();

// ===== Companions Data =====
const companions = [
    { id: "aube", name: "Aube", unlocked: true, level: 1, xp: 0, orbType: "void" },
    { id: "aqua", name: "Aqua", unlocked: false, level: 0, xp: 0, orbType: "water" },
    { id: "ignis", name: "Ignis", unlocked: false, level: 0, xp: 0, orbType: "fire" },
    { id: "astral", name: "Astral", unlocked: false, level: 0, xp: 0, orbType: "light" },
    { id: "flora", name: "Flora", unlocked: false, level: 0, xp: 0, orbType: "nature" }
];

const ORB_LABELS = {
    water: "Eau",
    fire: "Feu",
    light: "Lumiere",
    nature: "Nature",
    void: "Void"
};

const ORB_ICONS = {
    water: "💧",
    fire: "🔥",
    light: "✨",
    nature: "🌿",
    void: "🟣"
};

const FEED_VIDEO_BY_COMPANION = {
    aube: "aube",
    aqua: "blue",
    ignis: "fire",
    astral: "light",
    flora: "nature"
};

// Load companion images
companions.forEach(c => {
    const img = new Image();
    if (c.id === "astral") {
        // Astral a un chemin spécial
        img.src = `../shop/categories/companions/light/astral_idle.png`;
    } else {
        img.src = `../assets/companions/${c.id}/${c.id}_idle.png`;
    }
    c.img = img;
});

// Ensure Aube is first
companions.sort((a, b) => {
    if (a.id === "aube") return -1;
    if (b.id === "aube") return 1;
    return 0;
});

// ===== State Variables =====
let selectedIndex = 0;
let selectedCompanion = companions[0];
let floatTime = 0;
let equipTransition = 0;
let playingFeed = false;
let feedVideo = null;
let feedSkipBtn = null;

// ===== Toast Notification System =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Update Orb HUD =====
function updateOrbHUD() {
    if (typeof getPlayerProfile !== "function") return;
    
    const profile = getPlayerProfile();
    const orbs = profile.orbs || {};
    
    const updateOrb = (id, type) => {
        const el = document.getElementById(id);
        if (el) el.textContent = orbs[type] || 0;
    };
    
    updateOrb('orbAqua', 'water');
    updateOrb('orbIgnis', 'fire');
    updateOrb('orbAstral', 'light');
    updateOrb('orbFlora', 'nature');
    updateOrb('orbVoid', 'void');
}

// ===== Update Info Panel =====
function updateInfoPanel() {
    const nameEl = document.getElementById('companionName');
    const levelEl = document.getElementById('companionLevel');
    const xpEl = document.getElementById('companionXP');
    const bonusEl = document.getElementById('companionBonus');
    const infoPanel = document.querySelector('.companion-info-panel');
    
    if (nameEl) nameEl.textContent = selectedCompanion.name;
    
    if (!selectedCompanion.unlocked) {
        // Compagnon verrouillé
        if (levelEl) levelEl.textContent = i18nT("ecurie.locked");
        if (xpEl) xpEl.style.width = '0%';
        if (bonusEl) bonusEl.textContent = '🔒 --';
    } else {
        // Compagnon débloqué
        const maxLevel = typeof COMPANION_CONFIG !== 'undefined' ? COMPANION_CONFIG.MAX_LEVEL : 50;
        const isMax = selectedCompanion.level >= maxLevel;
        
        if (levelEl) {
            const levelLabel = i18nT("common.levelShort");
            const maxLabel = i18nT("ecurie.max");
            levelEl.textContent = isMax 
                ? `${levelLabel} ${selectedCompanion.level} ${maxLabel}` 
                : `${levelLabel} ${selectedCompanion.level}/${maxLevel}`;
        }
        
        if (xpEl) {
            if (isMax) {
                xpEl.style.width = '100%';
            } else {
                const xpPercent = (selectedCompanion.xp / 100) * 100;
                xpEl.style.width = xpPercent + '%';
            }
        }
        
        // Afficher le bonus
        if (bonusEl && typeof getCompanionBonusInfo === 'function') {
            const bonusInfo = getCompanionBonusInfo(selectedCompanion.id, selectedCompanion.level);
            if (bonusInfo) {
                bonusEl.textContent = `${bonusInfo.bonusIcon} ${bonusInfo.formatted}`;
                bonusEl.title = bonusInfo.bonusDescription;
            } else {
                bonusEl.textContent = '--';
            }
        }
    }

    if (infoPanel) {
        const orbType = selectedCompanion.orbType;
        const orbIcon = ORB_ICONS[orbType] || "";
        const orbLabel = ORB_LABELS[orbType] || orbType;
        let orbHint = infoPanel.querySelector('.orb-hint');
        if (!orbHint) {
            orbHint = document.createElement('div');
            orbHint.className = 'orb-hint';
            infoPanel.appendChild(orbHint);
        }
        orbHint.textContent = `Orbe: ${orbIcon} ${orbLabel}`;
    }
}

// ===== Generate Companion Slots =====
function generateSlots() {
    const container = document.getElementById('slotsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    companions.forEach((c, index) => {
        const slot = document.createElement('div');
        slot.className = 'companion-slot';
        
        if (!c.unlocked) {
            slot.classList.add('locked');
        }
        
        if (index === selectedIndex) {
            slot.classList.add('selected');
        }
        
        // Afficher l'image même si verrouillé (avec style locked)
        if (c.img && c.img.complete) {
            const img = document.createElement('img');
            img.src = c.img.src;
            img.alt = c.name;
            slot.appendChild(img);
        }

        const orbBadge = document.createElement('span');
        orbBadge.className = 'orb-badge';
        orbBadge.textContent = ORB_ICONS[c.orbType] || '';
        orbBadge.title = `Orbe: ${ORB_LABELS[c.orbType] || c.orbType}`;
        slot.appendChild(orbBadge);
        
        slot.addEventListener('click', () => {
            if (c.unlocked) {
                selectCompanion(index);
            } else {
                showToast(i18nT("ecurie.lockedToast"), 'error');
            }
        });
        
        container.appendChild(slot);
    });
}

// ===== Select Companion =====
function selectCompanion(index) {
    if (index < 0 || index >= companions.length) return;
    if (!companions[index].unlocked) return;
    
    selectedIndex = index;
    selectedCompanion = companions[index];
    
    updateInfoPanel();
    generateSlots();
    
    // Visual feedback
    equipTransition = 0.3;
}

// ===== Equip Companion =====
function equipCompanion() {
    if (!selectedCompanion.unlocked) {
        showToast(i18nT("ecurie.equipLockedToast"), 'error');
        return;
    }
    
    equipTransition = 1;
    
    const profile = getPlayerProfile();
    console.log("⚔️ Equipping companion:", selectedCompanion.id);
    console.log("📋 Before equip - equippedCompanion:", profile.equippedCompanion);
    
    profile.equippedCompanion = selectedCompanion.id;
    savePlayerProfile(profile);
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ After equip - equippedCompanion:", verified.equippedCompanion);
    
    showToast(`⚔️ ${selectedCompanion.name} équipé !`, 'success');
}

// ===== Feed Companion =====
function feedCompanion() {
    let profile = getPlayerProfile();
    if (!profile || !selectedCompanion) return;
    
    if (!selectedCompanion.unlocked) {
        showToast(i18nT("ecurie.equipLockedToast"), 'error');
        return;
    }
    
    // Vérifier le niveau max
    const maxLevel = typeof COMPANION_CONFIG !== 'undefined' ? COMPANION_CONFIG.MAX_LEVEL : 50;
    if (selectedCompanion.level >= maxLevel && selectedCompanion.xp >= 100) {
        showToast(i18nT("ecurie.maxLevel", { name: selectedCompanion.name, max: maxLevel }), 'info');
        return;
    }
    
    const orbType = selectedCompanion.orbType;
    const orbCount = profile.orbs?.[orbType] || 0;
    
    if (orbCount <= 0) {
        showToast(`${i18nT("ecurie.feedNoOrbs")} ${orbType} !`, 'error');
        return;
    }
    
    // Consume 1 orb
    if (!consumeOrb(orbType, 1)) return;

    // Refresh profile to keep orb changes before further saves
    profile = getPlayerProfile();
    
    // Update profile
    const companionId = selectedCompanion.id;
    if (!profile.companions) profile.companions = {};
    if (!profile.companions[companionId]) {
        profile.companions[companionId] = { level: 1, xp: 0 };
    }
    
    profile.companions[companionId].xp += 10;
    
    console.log("🍖 Feeding companion:", companionId);
    console.log("📊 Before save - Level:", profile.companions[companionId].level, "XP:", profile.companions[companionId].xp);
    
    let leveledUp = false;
    
    // Level up check
    if (profile.companions[companionId].xp >= 100 && profile.companions[companionId].level < maxLevel) {
        profile.companions[companionId].xp = 0;
        profile.companions[companionId].level += 1;
        leveledUp = true;
        
        // Afficher le nouveau bonus
        if (typeof getCompanionBonusInfo === 'function') {
            const bonusInfo = getCompanionBonusInfo(companionId, profile.companions[companionId].level);
            if (bonusInfo) {
                showToast(`🎉 ${i18nT("common.levelShort")} ${profile.companions[companionId].level} ! ${bonusInfo.bonusIcon} ${bonusInfo.formatted}`, 'success');
            } else {
                showToast(i18nT("ecurie.levelUp", { name: selectedCompanion.name, level: profile.companions[companionId].level }), 'success');
            }
        } else {
            showToast(i18nT("ecurie.levelUp", { name: selectedCompanion.name, level: profile.companions[companionId].level }), 'success');
        }
    } else {
        showToast(i18nT("ecurie.feedXp", { name: selectedCompanion.name }), 'info');
    }
    
    savePlayerProfile(profile);
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ After save - Level:", verified.companions[companionId].level, "XP:", verified.companions[companionId].xp);
    updateOrbHUD();
    
    // Update local companion data
    selectedCompanion.level = profile.companions[companionId].level;
    selectedCompanion.xp = profile.companions[companionId].xp;
    updateInfoPanel();
    
    // Play feeding video
    playFeedingVideo();
}

// ===== Play Feeding Video =====
function playFeedingVideo() {
    if (playingFeed) return;
    
    feedVideo = document.getElementById('feedVideoOverlay');
    if (!feedVideo) return;

    if (feedSkipBtn) {
        feedSkipBtn.classList.add('show');
    }
    
    const videoKey = FEED_VIDEO_BY_COMPANION[selectedCompanion.id] || selectedCompanion.id;
    feedVideo.src = `../assets/video/${videoKey}.mp4`;
    feedVideo.style.display = 'block';
    feedVideo.currentTime = 0;
    
    feedVideo.play().catch(err => {
        console.error('Video playback error:', err);
        feedVideo.style.display = 'none';
    });
    
    playingFeed = true;
    
    feedVideo.onended = () => {
        stopFeedingVideo(true);
    };
}

function stopFeedingVideo(withFlash) {
    if (!playingFeed) return;

    if (feedVideo) {
        feedVideo.pause();
        feedVideo.currentTime = 0;
        feedVideo.style.display = 'none';
        feedVideo.onended = null;
    }

    playingFeed = false;

    if (feedSkipBtn) {
        feedSkipBtn.classList.remove('show');
    }

    if (!withFlash) return;

    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.background = 'white';
    flash.style.opacity = '0.6';
    flash.style.zIndex = '10000';
    flash.style.transition = 'opacity 0.4s ease';
    flash.style.pointerEvents = 'none';
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 100);
}

// ===== Draw Companion in Center =====
function drawCenter() {
    if (!selectedCompanion?.img || !selectedCompanion.img.complete) return;
    
    const cx = canvasW * 0.5;
    const uiOffset = canvasW < 480 ? 60 : canvasW < 768 ? 40 : 20;
    const baseCenterY = canvasW < 480 ? canvasH * 0.28 : canvasW < 768 ? canvasH * 0.36 : canvasH * 0.5;
    const cy = baseCenterY - uiOffset;
    const floatY = Math.sin(floatTime) * 10;
    
    let scale = 1;
    
    if (equipTransition > 0) {
        equipTransition -= 0.05;
        scale = 1 + equipTransition * 0.5;
    }
    
    ctx.save();
    
    // Responsive size
    let baseSize = 400;
    if (canvasW < 480) {
        baseSize = 200;
    } else if (canvasW < 768) {
        baseSize = 280;
    } else if (canvasW < 1024) {
        baseSize = 350;
    }
    
    const size = baseSize * scale;
    
    // Glow effect
    ctx.shadowColor = 'rgba(143, 211, 255, 0.5)';
    ctx.shadowBlur = 30;
    
    ctx.drawImage(
        selectedCompanion.img,
        cx - size / 2,
        cy - size / 2 + floatY,
        size,
        size
    );
    
    ctx.restore();
}

// ===== Main Animation Loop =====
function loop() {
    if (playingFeed) {
        requestAnimationFrame(loop);
        return;
    }
    
    ctx.clearRect(0, 0, canvasW, canvasH);
    
    drawCenter();
    
    floatTime += 0.03;
    
    requestAnimationFrame(loop);
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Load profile and sync companions
    const profile = getPlayerProfile();
    
    companions.forEach(c => {
        if (profile.companions && profile.companions[c.id]) {
            c.level = profile.companions[c.id].level;
            c.xp = profile.companions[c.id].xp || 0;
        }
        c.unlocked = profile.unlockedCompanions?.includes(c.id) || c.id === 'aube';
    });
    
    // Sélectionner le premier compagnon débloqué
    const firstUnlocked = companions.findIndex(c => c.unlocked);
    if (firstUnlocked >= 0) {
        selectedIndex = firstUnlocked;
        selectedCompanion = companions[firstUnlocked];
    }
    
    console.log("🐾 Compagnons débloqués:", companions.filter(c => c.unlocked).map(c => c.id));
    console.log("✅ Compagnon sélectionné:", selectedCompanion.id);
    
    // Setup UI
    generateSlots();
    updateOrbHUD();
    updateInfoPanel();
    
    // Button event listeners
    const btnEquip = document.getElementById('btnEquip');
    const btnFeed = document.getElementById('btnFeed');
    feedSkipBtn = document.getElementById('feedSkipBtn');
    
    if (btnEquip) {
        btnEquip.addEventListener('click', equipCompanion);
    }
    
    if (btnFeed) {
        btnFeed.addEventListener('click', feedCompanion);
    }

    if (feedSkipBtn) {
        feedSkipBtn.addEventListener('click', () => {
            stopFeedingVideo(false);
        });
    }
    
    // Start animation loop
    loop();

    document.addEventListener('languagechange', () => {
        updateInfoPanel();
    });
});


