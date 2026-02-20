


// ⚠ Seule source autorisée de modification du solde CJ universel.
// Toute modification du CJ doit passer exclusivement par CJajlkAccount.add().
/**
 * 🔐 cjAccount.js - SYSTÈME OFFICIEL DE COMPTE CENTRALISÉ
 * ⚠️ SOURCE DE VÉRITÉ UNIQUE POUR TOUS LES CJ
 * 
 * Architecture : cjajlkGames/core/ 
 * localStorage key : cjPlayerData (standard)
 * 
 * Accessible depuis :
 * - /games/attrape/ → ../../core/cjAccount.js
 * - /games/breaker/ → ../../core/cjAccount.js
 * - /shop/ → ../core/cjAccount.js
 * - / (racine) → ./core/cjAccount.js
 */

const cjAccount = {
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    init() {
        console.log("✅ cjAccount initialisé (FUSION OFFICIELLE)");
        this.ensureDataStructure();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔍 DONNÉES JOUEUR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Assure que la structure de données joueurn'est existait complète
     */
    ensureDataStructure() {
        let playerData = this.getPlayer();
        
        if (!playerData) {
            playerData = {
                id: this.generateId(),
                pseudo: "Explorateur Nocturne",
                createdAt: Date.now(),
                stats: {
                    totalCJ: 0,
                    byGame: {
                        attrape: 0,
                        breaker: 0
                    }
                },
                items: {
                    unlockedBadges: {},
                    unlockedCosmetics: {}
                },
                preferences: {
                    language: "fr",
                    volume: true
                }
            };
            this.savePlayer(playerData);
        }
        
        return playerData;
    },

    /**
     * Sauvegarde les données du joueur
     */
    savePlayer(playerData) {
        try {
            localStorage.setItem("cjPlayerData", JSON.stringify(playerData));
            console.log("[cjAccount] 💾 Joueur sauvegardé dans cjPlayerData");
        } catch (e) {
            console.error("[cjAccount] ❌ Erreur sauvegarde localStorage:", e);
        }
    },

    /**
     * Charge les données du joueur
     */
    getPlayer() {
        try {
            const raw = localStorage.getItem("cjPlayerData");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error("[cjAccount] ❌ Erreur lecture localStorage:", e);
            return null;
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 💰 GESTION DES CJ
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Ajoute des CJ au compte (appelé par cjEngine)
     */
    addCJ(gameName, amount) {
        // Sécurité : refuser toute valeur non numérique, négative, NaN, undefined
        if (!gameName || typeof amount !== "number" || !isFinite(amount) || isNaN(amount) || amount <= 0) {
            // Protection silencieuse : ne rien faire
            return false;
        }

        // Anti double crédit rapide (anti-spam) : mémorise le dernier crédit par jeu
        if (!this._lastCJCredit) this._lastCJCredit = {};
        const now = Date.now();
        const last = this._lastCJCredit[gameName] || 0;
        // Refuse si moins de 300ms entre deux crédits pour le même jeu
        if (now - last < 300) {
            return false;
        }
        this._lastCJCredit[gameName] = now;

        const playerData = this.ensureDataStructure();

        // Ajouter au jeu spécifique
        playerData.stats.byGame[gameName] = (playerData.stats.byGame[gameName] || 0) + amount;

        // Ajouter au total global
        playerData.stats.totalCJ = (playerData.stats.totalCJ || 0) + amount;

        // Sauvegarder
        this.savePlayer(playerData);

        // Log (silencieux si besoin)
        // console.log(`[cjAccount] 💰 ${gameName} +${amount} CJ | Total global: ${playerData.stats.totalCJ} CJ`);
        return true;
    },

    /**
     * Décrémente le solde CJ global et par jeu
     */
    removeCJ(gameName, amount) {
        if (!gameName || typeof amount !== "number" || amount <= 0) {
            return false;
        }
        const playerData = this.ensureDataStructure();
        if (playerData.stats.totalCJ < amount) {
            return false;
        }
        playerData.stats.totalCJ -= amount;
        if (!playerData.stats.byGame[gameName]) {
            playerData.stats.byGame[gameName] = 0;
        }
        playerData.stats.byGame[gameName] -= amount;
        this.savePlayer(playerData);
        return true;
    },

    /**
     * Retourne le total CJ global
     */
    getTotalCJ() {
        const playerData = this.getPlayer();
        return playerData?.stats?.totalCJ || 0;
    },

    /**
     * Retourne les CJ gagnés par un jeu spécifique
     */
    getCJByGame(gameName) {
        const playerData = this.getPlayer();
        return playerData?.stats?.byGame?.[gameName] || 0;
    },

    /**
     * Retourne tous les CJ par jeu
     */
    getAllCJStats() {
        const playerData = this.getPlayer();
        return playerData?.stats?.byGame || {};
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎫 GESTION DES ITEMS ACHETÉS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Enregistre un badge acheté
     */
    unlockBadge(badgeId) {
        const playerData = this.ensureDataStructure();
        playerData.items.unlockedBadges[badgeId] = {
            unlockedAt: Date.now(),
            price: null // Will be set if cost info available
        };
        this.savePlayer(playerData);
        console.log(`[cjAccount] 🏆 Badge '${badgeId}' débloqué`);
    },

    /**
     * Vérifie si un badge est débloqué
     */
    isBadgeUnlocked(badgeId) {
        const playerData = this.getPlayer();
        return !!playerData?.items?.unlockedBadges?.[badgeId];
    },

    /**
     * Retourne tous les badges débloqués
     */
    getUnlockedBadges() {
        const playerData = this.getPlayer();
        return playerData?.items?.unlockedBadges || {};
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 🦾 UTILITAIRES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Génère un ID unique
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * Authentifie le joueur avec un pseudo
     */
    authenticate(pseudo) {
        const playerData = this.ensureDataStructure();
        playerData.pseudo = pseudo;
        this.savePlayer(playerData);
        console.log(`[cjAccount] 👤 Pseudo défini: ${pseudo}`);
        return true;
    },

    /**
     * Réinitialise complètement le compte (DEV ONLY)
     */
    reset() {
        localStorage.removeItem("cjPlayerData");
        localStorage.removeItem("cjEngineTimers"); // Aussi réinitialiser les timers
        localStorage.removeItem("cjSessionLock");
        console.log("[cjAccount] 🔄 Compte complètement réinitialisé");
    },

    /**
     * Affiche les infos du compte dans la console (DEBUG)
     */
    debug() {
        const playerData = this.getPlayer();
        console.log("═══════════════════════════════════════════");
        console.log("📊 CJAJLK ACCOUNT DEBUG");
        console.log("═══════════════════════════════════════════");
        console.log("ID:", playerData?.id);
        console.log("Pseudo:", playerData?.pseudo);
        console.log("Total CJ:", playerData?.stats?.totalCJ);
        console.log("CJ par jeu:", playerData?.stats?.byGame);
        console.log("Badges débloqués:", playerData?.items?.unlockedBadges);
        console.log("Créé le:", playerData?.createdAt ? new Date(playerData.createdAt).toLocaleString() : "N/A");
        console.log("═══════════════════════════════════════════");
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 ALIAS GLOBAL POUR COMPATIBILITÉ
// ═══════════════════════════════════════════════════════════════════════════

window.CJajlkAccount = {
    // Compatibilité avec ancien API
    add: (gameName, amount) => cjAccount.addCJ(gameName, amount),
    remove: (gameName, amount) => cjAccount.removeCJ(gameName, amount),
    getTotal: () => cjAccount.getTotalCJ(),
    getByGame: (gameName) => cjAccount.getCJByGame(gameName),
    getStats: () => cjAccount.getAllCJStats(),
    debug: () => cjAccount.debug(),
    
    // Nouveau API
    ...cjAccount
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 INITIALISATION AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════════════════

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => cjAccount.init());
} else {
    cjAccount.init();
}

console.log("✅ cjAccount.js chargé (SOURCE DE VÉRITÉ UNIQUE)");
