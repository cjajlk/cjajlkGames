/**
 * 🎮 CJEngine.js - MOTEUR OFFICIEL D'ACCUMULATION CJ
 * ⚠️ ÉLÉMENT CRITIQUE DE L'ÉCOSYSTÈME
 * 
 * Gère automatiquement l'accumulation de CJ basée sur le temps de jeu ACTIF
 * 
 * Avantages :
 * ✅ Un seul moteur pour tous les jeux
 * ✅ Protection anti-farming (visibilité + jeu actif)
 * ✅ Sauvegarde dans localStorage
 * ✅ Synchronisation entre onglets
 * ✅ Intégré avec cjAccount.js (source de vérité)
 */

// 1️⃣ Versioning strict (reset automatique après mise à jour)
const CJ_ENGINE_VERSION = "2026.02.19";
function checkEngineVersion() {
    const storedVersion = localStorage.getItem("CJEngine_version");
    if (storedVersion !== CJ_ENGINE_VERSION) {
        console.log("🔄 Version CJEngine changée → reset sécurisé");
        localStorage.removeItem("CJEngine");
        localStorage.setItem("CJEngine_version", CJ_ENGINE_VERSION);
    }
}
checkEngineVersion();

// 2️⃣ Protection anti double initialisation
if (window.__CJ_ENGINE_INITIALIZED__) {
    console.warn("CJEngine déjà initialisé → arrêt");
} else {
    window.__CJ_ENGINE_INITIALIZED__ = true;

const CJEngine = (function () {
    "use strict";

    // ═══════════════════════════════════════════════════════════════════════════
    // 3️⃣ Auto-correction timer bloqué (dans la boucle moteur, à intégrer dans le tick principal)
    // À placer dans la boucle principale/tick du moteur (exemple générique)
    // if (!state.engineActive && Date.now() - state.lastTick > 5000) {
    //   warn("⚠ Timer incohérent détecté → réactivation");
    //   state.engineActive = true;
    // }
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        CJ_EARN_MS: 600000,      // ⏱️ 10 minutes = +1 CJ (production)
        DEBUG: false,             // Logs console désactivés par défaut
        ANIMATION_DURATION: 1200,  // Durée popup (ms)
        MAX_FRAME_DELTA: 200,      // 🔒 Protection anti delta hack (ms)
        TEST_CJ_POPUP: true        // 🧪 TEMP (2 jours) : notif +1 CJ universel
    };

    // Activer debug si window.CJ_DEBUG === true
    if (window.CJ_DEBUG === true) {
        CONFIG.DEBUG = true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 ÉTAT INTERNE
    // ═══════════════════════════════════════════════════════════════════════════

    let state = {
        timers: {},          // {gameName: activeMs}
        debugEl: null,
        cjPopupCount: 0,
        engineActive: false, // 🔒 Protection anti multi-onglet
        testPopupActive: false
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 💾 LOCALSTORAGE
    // ═══════════════════════════════════════════════════════════════════════════

    function loadTimersFromStorage() {
        try {
            const saved = localStorage.getItem("cjEngineTimers");
            if (saved) {
                state.timers = JSON.parse(saved);
                debug(`📂 Timers chargés: ${JSON.stringify(state.timers)}`);
            }
        } catch (e) {
            warn(`Erreur lecture cjEngineTimers: ${e.message}`);
        }
    }

    function saveTimersToStorage() {
        try {
            localStorage.setItem("cjEngineTimers", JSON.stringify(state.timers));
        } catch (e) {
            warn(`Erreur sauvegarde cjEngineTimers: ${e.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITAIRES
    // ═══════════════════════════════════════════════════════════════════════════

    function debug(message) {
        if (!CONFIG.DEBUG) return;
        console.log(`[CJEngine] ${message}`);
    }

    function warn(message) {
        console.warn(`[CJEngine] ⚠️ ${message}`);
    }

    function ensureDebugEl() {
        if (!CONFIG.DEBUG || state.debugEl) return;
        state.debugEl = document.createElement("div");
        state.debugEl.id = "cjEngineDebug";
        state.debugEl.style.position = "fixed";
        state.debugEl.style.left = "10px";
        state.debugEl.style.bottom = "10px";
        state.debugEl.style.zIndex = "9999";
        state.debugEl.style.padding = "6px 8px";
        state.debugEl.style.borderRadius = "6px";
        state.debugEl.style.background = "rgba(0,0,0,0.8)";
        state.debugEl.style.color = "#0f0";
        state.debugEl.style.font = "11px/1.4 monospace";
        state.debugEl.style.pointerEvents = "none";
        state.debugEl.style.maxWidth = "300px";
        document.body.appendChild(state.debugEl);
    }

    function removeDebugEl() {
        if (!state.debugEl) return;
        state.debugEl.remove();
        state.debugEl = null;
    }

    function updateDebug(gameName) {
        if (!CONFIG.DEBUG) {
            removeDebugEl();
            return;
        }
        ensureDebugEl();
        const activeMs = state.timers[gameName] || 0;
        const remainingMs = Math.max(0, CONFIG.CJ_EARN_MS - activeMs);
        state.debugEl.textContent =
            `[CJEngine] ${gameName}\nactive: ${Math.floor(activeMs)}ms\nremaining: ${Math.floor(remainingMs)}ms`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 VÉRIFICATION D'ÉTAT DE JEU
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Fonction de callback fournie par le jeu
     * Doit retourner {running: Boolean}
     */
    function getGameState() {
        if (typeof window.getGameState !== "function") {
            return { running: false };
        }
        return window.getGameState();
    }

    /**
     * Vérifie si une session est VRAIMENT active
     * (onglet visible ET jeu en cours)
     */
    function isActiveSession() {
        const gameState = getGameState();
        const isVisible = document.visibilityState === "visible";
        const isRunning = !!(gameState && gameState.running);
        return isVisible && isRunning;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 💰 GESTION DES RÉCOMPENSES CJ
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Récompense les CJ gagnés
     * Intègre avec cjAccount.js (source de vérité)
     */
    function rewardCJ(gameName, amount) {
        if (!gameName || amount <= 0) {
            warn(`rewardCJ: paramètres invalides (${gameName}, ${amount})`);
            return;
        }

        // ✅ SYNCHRONISER AVEC cjAccount.js
        if (window.cjAccount && typeof window.cjAccount.addCJ === "function") {
            window.cjAccount.addCJ(gameName, amount);
            debug(`✅ ${gameName} +${amount} CJ → cjAccount.js`);
        } else if (window.CJajlkAccount && typeof window.CJajlkAccount.add === "function") {
            // Fallback sur ancien alias
            window.CJajlkAccount.add(gameName, amount);
            debug(`✅ ${gameName} +${amount} CJ → CJajlkAccount (fallback)`);
        } else {
            warn(`cjAccount.js non disponible pour ${gameName}`);
        }

        // 🧪 Notification temporaire +1 CJ universel (2 jours)
        showCJTestNotification();
    }

    function ensureTestPopupStyles() {
        if (document.getElementById("cjTestPopupStyles")) return;
        const style = document.createElement("style");
        style.id = "cjTestPopupStyles";
        style.textContent = "\
.cj-test-popup{\
position:fixed;\
right:20px;\
bottom:90px;\
z-index:10000;\
padding:12px 18px;\
border-radius:12px;\
background:rgba(25,15,55,0.85);\
border:1px solid rgba(170,140,255,0.5);\
color:#f2eaff;\
font-weight:700;\
font-size:1rem;\
text-shadow:0 0 12px rgba(180,140,255,0.6);\
box-shadow:0 0 20px rgba(120,90,255,0.4);\
animation:cjTestFade 1.4s ease-out forwards;\
}\
@keyframes cjTestFade{\
0%{opacity:0;transform:translateY(12px);}\
20%{opacity:1;}\
100%{opacity:0;transform:translateY(-14px);}\
}\
";
        document.head.appendChild(style);
    }

    function showCJTestNotification() {
        if (!CONFIG.TEST_CJ_POPUP) return;
        if (state.testPopupActive) return;
        state.testPopupActive = true;

        ensureTestPopupStyles();
        const el = document.createElement("div");
        el.className = "cj-test-popup";
        el.textContent = "✨ +1 CJ universel";
        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
            state.testPopupActive = false;
        }, CONFIG.ANIMATION_DURATION);
    }

    function showCJPopup(amount) {
        const el = document.createElement("div");
        el.className = "cj-popup";
        el.textContent = "+" + amount + " CJ";
        el.style.position = "fixed";
        el.style.right = "20px";
        el.style.color = "#0f0";
        el.style.fontWeight = "bold";
        el.style.zIndex = "10000";

        const offset = Math.min(state.cjPopupCount, 5) * 22;
        el.style.bottom = (80 + offset) + "px";
        state.cjPopupCount += 1;

        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
            state.cjPopupCount = Math.max(0, state.cjPopupCount - 1);
        }, CONFIG.ANIMATION_DURATION);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ⏱️ SYSTÈME DE TICK
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Accumule le temps de jeu actif
     * Appelé par le jeu à chaque frame avec deltaMs
     */
    function tick(deltaMs, gameName) {
        if (!deltaMs || deltaMs <= 0) return;
        if (!gameName) {
            warn("tick: gameName manquant");
            return;
        }

        // 🔒 Protection anti multi-onglet
        if (!state.engineActive) {
            return;
        }

        // 🔒 Protection anti delta hack
        if (deltaMs > CONFIG.MAX_FRAME_DELTA) {
            return;
        }

        // Initialiser le timer si nécessaire
        if (!(gameName in state.timers)) {
            state.timers[gameName] = 0;
            debug(`✨ Timer créé pour ${gameName}`);
        }

        // Vérifier si la session est ACTIVE
        if (!isActiveSession()) {
            updateDebug(gameName);
            return;
        }

        // Accumuler le temps
        state.timers[gameName] += deltaMs;

        // Vérifier si 1+ CJ doivent être gagnés
        if (state.timers[gameName] >= CONFIG.CJ_EARN_MS) {
            const earned = Math.floor(state.timers[gameName] / CONFIG.CJ_EARN_MS);
            state.timers[gameName] = state.timers[gameName] % CONFIG.CJ_EARN_MS;
            
            rewardCJ(gameName, earned);
            saveTimersToStorage();
            debug(`🎉 ${gameName} a gagné ${earned} CJ!`);
        } else {
            saveTimersToStorage();
        }

        updateDebug(gameName);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔄 GESTION DU CYCLE DE VIE
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        loadTimersFromStorage();
        
        // 🔒 Protection anti multi-onglet
        const sessionLock = localStorage.getItem("cjSessionLock");
        if (sessionLock) {
            state.engineActive = false;
            debug("⚠️ Engine désactivé - session active dans un autre onglet");
        } else {
            localStorage.setItem("cjSessionLock", Date.now().toString());
            state.engineActive = true;
            debug("🔒 Session lock créé");
            
            window.addEventListener("beforeunload", () => {
                localStorage.removeItem("cjSessionLock");
                saveTimersToStorage();
                debug("🔓 Session fermée proprement");
            });
        }
        
        debug("🚀 CJEngine initialisé");
        debug(`⏱️ Configuration: ${CONFIG.CJ_EARN_MS}ms (${CONFIG.CJ_EARN_MS / 1000}s) = +1 CJ`);
    }

    function reset(gameName) {
        if (!gameName) {
            warn("reset: gameName manquant");
            return;
        }
        
        if (gameName in state.timers) {
            state.timers[gameName] = 0;
            saveTimersToStorage();
            debug(`🔄 Timer réinitialisé pour ${gameName}`);
        }
    }

    function resetAll() {
        state.timers = {};
        saveTimersToStorage();
        debug("🔄 Tous les timers réinitialisés");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES
    // ═══════════════════════════════════════════════════════════════════════════

    function getStats(gameName) {
        if (!gameName) {
            warn("getStats: gameName manquant");
            return null;
        }

        const activeMs = state.timers[gameName] || 0;
        const remainingMs = Math.max(0, CONFIG.CJ_EARN_MS - activeMs);
        const progressPercent = (activeMs / CONFIG.CJ_EARN_MS) * 100;

        return {
            gameName,
            activeMs: Math.floor(activeMs),
            remainingMs: Math.floor(remainingMs),
            progressPercent: Math.floor(progressPercent),
            nextCJIn: Math.ceil(remainingMs / 1000) + "s"
        };
    }

    function getAllStats() {
        const stats = {};
        for (const gameName in state.timers) {
            stats[gameName] = getStats(gameName);
        }
        return stats;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 API PUBLIQUE
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        // Cycle de vie
        init,
        reset,
        resetAll,

        // Tick et session
        tick,
        isActiveSession,

        // Statistiques
        getStats,
        getAllStats,

        // Debug
        setDebug: (enabled) => {
            CONFIG.DEBUG = enabled;
            if (enabled) {
                debug("🔍 Debug mode ACTIVÉ");
            } else {
                removeDebugEl();
            }
        },

        // Config
        getConfig: () => ({ ...CONFIG })
    };
})();

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 EXPOSITION GLOBALE
// ═══════════════════════════════════════════════════════════════════════════

window.CJEngine = CJEngine;

// Initialiser automatiquement
if (typeof CJEngine.init === "function") {
    CJEngine.init();
}

console.log("✅ CJEngine.js chargé et actif");
}
