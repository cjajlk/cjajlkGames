/* =========================================================
   🌙 MODE CAMPAGNE — ATTRAPE-LES-TOUS
   ========================================================= */

let campaignMode = {
    active: false,
    worldId: null,
    currentLevel: 1,
    campaignData: null,
    campaignProgress: {}
};

// Charger les données de campagne
async function loadCampaignData() {
    try {
        const response = await fetch('data/campaignData.json');
        campaignMode.campaignData = await response.json();
        console.log('✅ Données campagne chargées');
    } catch (e) {
        console.error('❌ Erreur chargement campaignData:', e);
    }
}

// Charger la progression du joueur
function loadCampaignProgress() {
    const saved = localStorage.getItem('campaignProgress');
    if (saved) {
        campaignMode.campaignProgress = JSON.parse(saved);
    } else {
        // Initialiser avec tous les mondes
        campaignMode.campaignProgress = {
            'nuit_calme': { levels: [false, false, false, false, false], completed: false, locked: false },
            'foret_nocturne': { levels: [false, false, false, false, false], completed: false, locked: false },
            'cite_astrale': { levels: [false, false, false, false, false], completed: false, locked: true },
            'abysse_nocturne': { levels: [false, false, false, false, false], completed: false, locked: true }
        };
        saveCampaignProgress();
    }
}

// Sauvegarder progression
function saveCampaignProgress() {
    localStorage.setItem('campaignProgress', JSON.stringify(campaignMode.campaignProgress));
    console.log('💾 Progression campagne sauvegardée');
}

// Récupérer monde actuel
function getCurrentWorld() {
    if (!campaignMode.campaignData) return null;
    return campaignMode.campaignData.worlds.find(w => w.id === campaignMode.worldId);
}

// Récupérer niveau actuel
function getCurrentCampaignLevel() {
    const world = getCurrentWorld();
    if (!world || campaignMode.currentLevel < 1 || campaignMode.currentLevel > world.levels.length) {
        return null;
    }
    return world.levels[campaignMode.currentLevel - 1];
}

// Obtenir objectif du niveau
function getCampaignObjective() {
    const level = getCurrentCampaignLevel();
    return level ? level.objective : 0;
}

// Démarrer mode campagne
function startCampaignMode(worldId) {
    campaignMode.active = true;
    campaignMode.worldId = worldId;
    campaignMode.currentLevel = 1;

    console.log(`🌙 Mode Campagne: Monde "${worldId}", Niveau 1`);

    // Réinitialiser le jeu
    resetGameValues();

    // Masquer les menus
    hideMainMenu();
    closeAllMenus();
    hideMenuMascotte();
    stopMenuMascotte();
    hideEventBanner();
    hideCoffreNocturne();

    // Afficher le jeu
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.style.display = 'block';
    showGameUI();

    // Musique
    if (!musicInitialized) {
        initMusic();
    } else {
        playCurrentTrack();
    }

    currentMode = 'campaign';
    isGameRunning = true;
    gameStarted = true;
    timerRunning = false;

    // Adapter les paramètres du mode
    score = 0;
    misses = 0;
    level = 1;
    levelTargetNormal = getCampaignObjective();
    spawnRate = 60; // Mode normal

    updateHUD();
    startGame(GameData);

    // Afficher objectif en haut
    showCampaignHUD();
}

// HUD spécifique campagne
function showCampaignHUD() {
    const world = getCurrentWorld();
    const levelData = getCurrentCampaignLevel();

    if (!world || !levelData) return;

    // Créer/mettre à jour le HUD campagne
    let campaignHud = document.getElementById('campaignHUD');
    if (!campaignHud) {
        campaignHud = document.createElement('div');
        campaignHud.id = 'campaignHUD';
        campaignHud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 10, 50, 0.8);
            border: 1px solid rgba(180, 120, 255, 0.6);
            border-radius: 12px;
            padding: 15px 30px;
            color: #fff;
            font-family: 'Poppins', sans-serif;
            text-align: center;
            z-index: 100;
            backdrop-filter: blur(8px);
        `;
        document.body.appendChild(campaignHud);
    }

    campaignHud.innerHTML = `
        <div style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">
            ${world.name} • ${levelData.name}
        </div>
        <div style="font-size: 1.2rem; font-weight: 600; margin-top: 5px;">
            Objectif: ${levelData.objective} points
        </div>
    `;
}

// Mettre à jour HUD campagne
function updateCampaignHUD() {
    showCampaignHUD();
}

// Fin niveau campagne
function endCampaignLevel(success) {
    if (!campaignMode.active) return;

    const world = getCurrentWorld();
    const levelData = getCurrentCampaignLevel();

    if (!world || !levelData) return;

    if (success && score >= levelData.objective) {
        // ✅ Niveau complété
        const progress = campaignMode.campaignProgress[campaignMode.worldId];
        progress.levels[campaignMode.currentLevel - 1] = true;

        // Vérifier si monde complété
        if (progress.levels.every(l => l)) {
            progress.completed = true;

            // Débloquer prochain monde
            const worldIndex = campaignMode.campaignData.worlds.findIndex(w => w.id === campaignMode.worldId);
            if (worldIndex < campaignMode.campaignData.worlds.length - 1) {
                const nextWorldId = campaignMode.campaignData.worlds[worldIndex + 1].id;
                campaignMode.campaignProgress[nextWorldId].locked = false;
                showMascotteDialog(`Monde complété ! ${campaignMode.campaignData.worlds[worldIndex + 1].name} déverrouillé !`, "happy");
            }
        }

        // Récompenses
        const rewards = levelData.rewards;
        if (rewards.gems) {
            addGems(rewards.gems);
            showMascotteDialog(`Niveau réussi ! +${rewards.gems} 💎`, "happy");
        }

        saveCampaignProgress();

        // Aller au niveau suivant ou fin monde
        setTimeout(() => {
            if (campaignMode.currentLevel < world.levels.length) {
                campaignMode.currentLevel++;
                startCampaignMode(campaignMode.worldId);
            } else {
                // Fin du monde
                showCampaignCompletePopup(world);
            }
        }, 2000);
    } else {
        // ❌ Niveau échoué
        showMascotteDialog("Réessaie, tu vas y arriver !", "sad");

        setTimeout(() => {
            startCampaignMode(campaignMode.worldId);
        }, 2000);
    }
}

// Popup fin monde
function showCampaignCompletePopup(world) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    popup.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #2a0050, #3b0a70);
            border: 1px solid rgba(180, 120, 255, 0.6);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            color: white;
            max-width: 500px;
            box-shadow: 0 10px 50px rgba(150, 100, 255, 0.4);
        ">
            <h2 style="font-size: 2rem; margin: 0 0 20px 0;">🎉 Monde Complété !</h2>
            <p style="font-size: 1.2rem; margin: 0 0 30px 0;">${world.name}</p>
            <button onclick="
                document.body.removeChild(this.closest('div').parentElement);
                window.location.href = 'pages/campaign.html';
            " style="
                background: linear-gradient(135deg, #7c5cff, #b197ff);
                color: white;
                border: none;
                padding: 15px 40px;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            "
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 20px rgba(150, 100, 255, 0.5)'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
            >
                Retour à la Campagne
            </button>
        </div>
    `;

    document.body.appendChild(popup);
}

// Quitter mode campagne
function quitCampaignMode() {
    campaignMode.active = false;
    campaignMode.worldId = null;
    campaignMode.currentLevel = 1;

    const campaignHud = document.getElementById('campaignHUD');
    if (campaignHud) campaignHud.remove();

    window.location.href = 'pages/campaign.html';
}

// Charger données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadCampaignData();
    loadCampaignProgress();

    // Vérifier si on lance une campagne
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'campaign') {
        const worldId = urlParams.get('world');
        if (worldId) {
            setTimeout(() => startCampaignMode(worldId), 500);
        }
    }
});

console.log('✅ campaign.js chargé');
