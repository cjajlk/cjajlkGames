/**
 * CJajlk Shop System
 * Gestion de la boutique CJ
 */

/**
 * Catalogue d'items (structure évolutive)
 */
const SHOP_ITEMS = [
  {
    id: "halo_violet",
    name: "Halo Violet Multivers",
    description: "Un halo mystique violet, marque de prestige.",
    price: 10,
    type: "cosmetic",
    active: true,
    eventId: null,
    futureUnlock: false
  },
  {
    id: "aura_nocturne",
    name: "Aura Nocturne",
    description: "Émet une lueur douce et mystérieuse.",
    price: 15,
    type: "cosmetic",
    active: true,
    eventId: null,
    futureUnlock: false
  },
  {
    id: "orbe_doree",
    name: "Orbe Dorée",
    description: "Un trésor brillant de l'univers CJajlk.",
    price: 20,
    type: "cosmetic",
    active: true,
    eventId: null,
    futureUnlock: false
  }
];

/**
 * Affiche le solde CJ dans le header de la boutique
 */
function updateShopBalance() {
  try {
    if (typeof window.loadCJAccount !== 'function' || !window.loadCJAccount) {
      console.warn("loadCJAccount n'est pas encore disponible");
      document.getElementById('shop-balance').textContent = '0';
      return;
    }
    const account = window.loadCJAccount();
    const balanceEl = document.getElementById('shop-balance');
    if (balanceEl) {
      balanceEl.textContent = account.cjBalance || 0;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du solde:", error);
    const balanceEl = document.getElementById('shop-balance');
    if (balanceEl) {
      balanceEl.textContent = '?';
    }
  }
}

/**
 * Affiche le catalogue d'items
 * MODE DORMANT : Rendu minimaliste en attente de stabilisation
 */
function renderShopCatalog() {
  // Mise à jour du solde uniquement
  updateShopBalance();
}

/**
 * Achète un item de la boutique
 * [MODE DORMANT] Fonction en attente de réactivation du catalogue
 */
function purchaseItem(itemId, price) {
  // Vérifier que la fonction existe
  if (typeof window.buyShopItem !== 'function') {
    console.error("buyShopItem n'est pas disponible");
    return;
  }

  // Effectuer l'achat
  const success = window.buyShopItem(itemId, price);

  if (success) {
    // Mettre à jour l'affichage
    updateShopBalance();
    renderShopCatalog();
    
    // Feedback visuel léger
    const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemCard) {
      itemCard.classList.add('purchased-flash');
      setTimeout(() => itemCard.classList.remove('purchased-flash'), 600);
    }
  } else {
    // Afficher un message d'erreur simple
    if (typeof window.loadCJAccount === 'function') {
      const account = window.loadCJAccount();
      if (account.cjBalance < price) {
        console.warn("CJ insuffisants");
      }
    }
  }
}

/**
 * Initialise la boutique au chargement du DOM et de cjAccount.js
 */
document.addEventListener('DOMContentLoaded', function() {
  if (window.CJajlkAccount) {
    console.log("✅ cjAccount.js chargé, initialisation du shop");
    updateShopBalance();
    renderShopCatalog();
  } else {
    console.error("❌ cjAccount.js n'est pas disponible");
  }
});

/**
 * [FUTUR] Réactive le rendu complet des items de la boutique
 * À utiliser quand l'écosystème CJ est totalement stabilisé
 */
function activateShopItems() {
  console.log("Activation du catalogue CJ en cours...");
  // À implémenter : rendu complet du catalogue
  console.log("Prêt pour V2.0 avec catalogue actif");
}

/**
 * Exporte les commandes pour la console (debug)
 */
window.CJajlkShop = {
  render: renderShopCatalog,
  balance: updateShopBalance,
  catalog: SHOP_ITEMS,
  activate: activateShopItems
};
