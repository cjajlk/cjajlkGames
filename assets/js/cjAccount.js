/**
 * CJajlk Account System
 * Mode test local – localStorage uniquement
 * Aucune synchronisation cloud
 */

const CJ_ACCOUNT_KEY = "cjajlk_account";

/**
 * Crée un compte par défaut
 */
function createDefaultAccount() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
    pseudo: "CJ",
    cjBalance: 0,
    totalCjEarned: 0,
    games: {
      attrape: { lastSync: 0, cjEarned: 0 },
      breaker: { lastSync: 0, cjEarned: 0 }
    },
    purchases: {},
    shopMeta: {
      version: 1,
      futureFlags: {}
    },
    version: "1.0.0",
    createdAt: Date.now()
  };
}

/**
 * Fallback UUID generator (si crypto.randomUUID n'est pas disponible)
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Valide et corrige la structure du compte (rétrocompatibilité)
 * Utilisé pour migrer les anciens comptes vers la nouvelle structure
 */
function validateAccountStructure(account) {
  if (!account) return false;

  // Créer purchases s'il n'existe pas
  if (!account.purchases || typeof account.purchases !== 'object') {
    account.purchases = {};
  }

  // Créer shopMeta s'il n'existe pas
  if (!account.shopMeta || typeof account.shopMeta !== 'object') {
    account.shopMeta = {
      version: 1,
      futureFlags: {}
    };
  } else {
    // Assurer que les propriétés de shopMeta existent
    if (!account.shopMeta.version) account.shopMeta.version = 1;
    if (!account.shopMeta.futureFlags) account.shopMeta.futureFlags = {};
  }

  // Assurer que games existe
  if (!account.games || typeof account.games !== 'object') {
    account.games = {
      attrape: { lastSync: 0, cjEarned: 0 },
      breaker: { lastSync: 0, cjEarned: 0 }
    };
  }

  return true;
}

/**
 * Charge le compte CJajlk depuis localStorage
 */
function loadCJAccount() {
  try {
    const raw = localStorage.getItem(CJ_ACCOUNT_KEY);
    if (!raw) {
      const account = createDefaultAccount();
      saveCJAccount(account);
      return account;
    }
    
    const account = JSON.parse(raw);
    
    // Valider et corriger la structure (rétrocompatibilité)
    if (validateAccountStructure(account)) {
      // Sauvegarder la structure corrigée
      saveCJAccount(account);
    }
    
    return account;
  } catch (error) {
    console.error("Erreur lors du chargement du compte CJajlk:", error);
    const account = createDefaultAccount();
    saveCJAccount(account);
    return account;
  }
}

/**
 * Sauvegarde le compte CJajlk dans localStorage
 */
function saveCJAccount(account) {
  try {
    localStorage.setItem(CJ_ACCOUNT_KEY, JSON.stringify(account));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du compte CJajlk:", error);
  }
}

/**
 * Ajoute des CJ au compte depuis un jeu
 * @param {string} gameId - ID du jeu (ex: "attrape", "breaker")
 * @param {number} amount - Nombre de CJ à ajouter
 */
function addCjToAccount(gameId, amount) {
  const account = loadCJAccount();

  // Vérifier que le jeu existe dans la structure
  if (!account.games[gameId]) {
    console.warn(`Jeu '${gameId}' non reconnu dans le compte CJajlk`);
    return;
  }

  // Ajouter les CJ
  account.cjBalance = Math.max(0, account.cjBalance + amount);
  account.totalCjEarned = Math.max(0, account.totalCjEarned + amount);
  account.games[gameId].cjEarned += amount;
  account.games[gameId].lastSync = Date.now();

  saveCJAccount(account);
  
  // Mettre à jour l'affichage si la fonction existe
  if (typeof renderCJAccount === 'function') {
    renderCJAccount();
  }
}

/**
 * Réinitialise le compte CJajlk (mode test)
 */
function resetCJAccount() {
  const account = createDefaultAccount();
  saveCJAccount(account);
  if (typeof renderCJAccount === 'function') {
    renderCJAccount();
  }
  return account;
}

/**
 * Affiche les infos du compte dans la console (debug)
 */
function debugCJAccount() {
  const account = loadCJAccount();
  console.log("=== CJajlk Account ===");
  console.log("ID:", account.id);
  console.log("Pseudo:", account.pseudo);
  console.log("CJ Actuels:", account.cjBalance);
  console.log("Total gagnés:", account.totalCjEarned);
  console.log("Jeux:", account.games);
  console.log("Version:", account.version);
  console.log("Créé le:", new Date(account.createdAt).toLocaleString());
  console.log("========================");
}

/**
 * Affiche le compte CJajlk dans le DOM
 */
function renderCJAccount() {
  try {
    const account = loadCJAccount();
    const displayEl = document.getElementById('account-display');
    
    if (!displayEl) return; // Section pas disponible
    
    const html = `
      <div class="account-info">
        <div class="account-card">
          <p class="account-pseudo">Pseudo : <strong>${escapeHtml(account.pseudo)}</strong></p>
          <p class="account-balance">CJ Universels : <strong>${account.cjBalance}</strong></p>
          <p class="account-total">Total gagnés : <strong>${account.totalCjEarned}</strong></p>
        </div>
        <div class="account-games">
          <p class="games-title">CJ gagnés par jeu :</p>
          <div class="games-list">
            <p class="game-item">Attrape-les-tous : <strong>${account.games.attrape?.cjEarned || 0}</strong></p>
            <p class="game-item">Breaker : <strong>${account.games.breaker?.cjEarned || 0}</strong></p>
          </div>
        </div>
      </div>
    `;
    
    displayEl.innerHTML = html;
  } catch (error) {
    console.error("Erreur lors de l'affichage du compte CJajlk:", error);
  }
}

/**
 * Échappe les caractères HTML pour éviter XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Achète un item de la boutique
 * @param {string} itemId - ID de l'item
 * @param {number} price - Prix en CJ
 * @returns {boolean} - true si achat réussi, false sinon
 */
function buyShopItem(itemId, price) {
  const account = loadCJAccount();

  // Vérifier que purchases existe (sécurité)
  if (!account.purchases) {
    account.purchases = {};
  }

  // Vérifier si déjà acheté
  if (account.purchases[itemId]) {
    console.warn(`Item '${itemId}' déjà débloqué`);
    return false;
  }

  // Vérifier les CJ suffisants
  if (account.cjBalance < price) {
    console.warn(`CJ insuffisants pour acheter '${itemId}'`);
    return false;
  }

  // Effectuer l'achat
  account.cjBalance -= price;
  account.purchases[itemId] = {
    purchasedAt: Date.now(),
    price: price
  };

  saveCJAccount(account);
  return true;
}

/**
 * Vérifie si un item a été acheté
 * @param {string} itemId - ID de l'item
 * @returns {boolean}
 */
function isItemPurchased(itemId) {
  const account = loadCJAccount();
  return account.purchases && !!account.purchases[itemId];
}

/**
 * Initialise le compte au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
  try {
    renderCJAccount();
  } catch (error) {
    console.warn("Impossible d'afficher le compte CJajlk:", error.message);
  }
});

/**
 * Exporte les commandes disponibles
 */
window.loadCJAccount = loadCJAccount;
window.saveCJAccount = saveCJAccount;
window.addCjToAccount = addCjToAccount;
window.resetCJAccount = resetCJAccount;
window.buyShopItem = buyShopItem;
window.isItemPurchased = isItemPurchased;

window.CJajlkAccount = {
  load: loadCJAccount,
  save: saveCJAccount,
  add: addCjToAccount,
  reset: resetCJAccount,
  debug: debugCJAccount,
  buy: buyShopItem,
  isPurchased: isItemPurchased
};
