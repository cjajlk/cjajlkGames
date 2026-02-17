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
        if (!gameName || amount <= 0) {
            console.warn(`[cjAccount] addCJ: paramètres invalides (${gameName}, ${amount})`);
            return false;
        }

        const playerData = this.ensureDataStructure();
        
        // Ajouter au jeu spécifique
        playerData.stats.byGame[gameName] = (playerData.stats.byGame[gameName] || 0) + amount;
        
        // Ajouter au total global
        playerData.stats.totalCJ = (playerData.stats.totalCJ || 0) + amount;

        // Sauvegarder
        this.savePlayer(playerData);
        
        console.log(`[cjAccount] 💰 ${gameName} +${amount} CJ | Total global: ${playerData.stats.totalCJ} CJ`);
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
