/**
 * CJajlk Shop System
 * Gestion de la boutique CJ
 */

/**
 * Catalogue d'items - Phase 1 : Badges
 */
const SHOP_ITEMS = [
  {
    id: "badge_explorer",
    name: "Explorateur Nocturne",
    description: "Badge cosmétique pour explorateurs de l'univers CJajlk.",
    price: 10,
    type: "badge",
    game: "global",
    icon: "🌙"
  },
  {
    id: "badge_fidele",
    name: "Joueur Fidèle",
    description: "Badge récompensant votre fidélité à l'écosystème.",
    price: 25,
    type: "badge",
    game: "global",
    icon: "⭐"
  },
  {
    id: "badge_centre",
    name: "Compagnon du Centre",
    description: "Badge exclusif des joueurs du centre CJajlk.",
    price: 50,
    type: "badge",
    game: "global",
    icon: "🔮"
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
 * Affiche le catalogue d'items - Phase 1 : Badges actifs
 */
function renderShopCatalog() {
  updateShopBalance();
  
  const catalogContainer = document.getElementById('shop-catalog-items');
  if (!catalogContainer) return;
  
  // Générer le HTML pour chaque badge
  const itemsHTML = SHOP_ITEMS.map(item => {
    const isPurchased = window.isItemPurchased ? window.isItemPurchased(item.id) : false;
    const account = window.loadCJAccount ? window.loadCJAccount() : { cjBalance: 0 };
    // Gestion des prix : si item.type === 'companion' ou item.game === 'breaker', utiliser les diamants
    const useDiamonds = item.type === 'companion' || item.game === 'breaker';
    const diamonds = Number(localStorage.getItem('breakerDiamonds')) || 0;
    const canAfford = useDiamonds ? (diamonds >= item.price) : (account.cjBalance >= item.price);
    const priceLabel = useDiamonds ? `${item.price} 💎` : `${item.price} CJ`;
    const lockLabel = useDiamonds ? '🔒 Diamants insuffisants' : '🔒 CJ insuffisants';
    return `
      <div class="shop-item ${isPurchased ? 'purchased' : ''}" data-item-id="${item.id}">
        <div class="item-icon">${item.icon}</div>
        <div class="item-info">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-description">${item.description}</p>
          <div class="item-footer">
            <span class="item-price">${priceLabel}</span>
            ${isPurchased 
              ? '<button class="btn-purchased" disabled>✅ Débloqué</button>'
              : `<button class="btn-buy ${!canAfford ? 'disabled' : ''}" 
                   onclick="purchaseItem('${item.id}', ${item.price}, ${useDiamonds})" 
                   ${!canAfford ? 'disabled' : ''}>
                   ${!canAfford ? lockLabel : 'Acheter'}
                 </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  catalogContainer.innerHTML = itemsHTML;
}

/**
 * Achète un item de la boutique - Phase 1 actif
 */
function purchaseItem(itemId, price, useDiamonds) {
  // Gestion achat par diamants ou CJ
  if (useDiamonds) {
    if (typeof window.spendDiamonds !== 'function') {
      showMessage("Erreur système (diamants)", "error");
      return;
    }
    const ok = window.spendDiamonds(price);
    if (!ok) {
      showMessage("Diamants insuffisants", "error");
      return;
    }
    // Succès : marquer comme acheté (si logique d'achat custom à ajouter ici)
    showMessage("Achat réussi avec diamants !", "success");
    renderShopCatalog();
    updateDiamondsUI();
    // Animation visuelle
    const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemCard) {
      itemCard.classList.add('purchase-glow');
      setTimeout(() => itemCard.classList.remove('purchase-glow'), 800);
    }
    return;
  }
  // Achat classique CJ
  if (typeof window.buyShopItem !== 'function') {
    console.error("buyShopItem n'est pas disponible");
    showMessage("Erreur système", "error");
    return;
  }
  // Effectuer l'achat CJ
  const success = window.buyShopItem(itemId, price);
  if (success) {
    updateShopBalance();
    renderShopCatalog();
    const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemCard) {
      itemCard.classList.add('purchase-glow');
      setTimeout(() => itemCard.classList.remove('purchase-glow'), 800);
    }
    showMessage("Badge débloqué !", "success");
  } else {
    if (typeof window.loadCJAccount === 'function') {
      const account = window.loadCJAccount();
      if (account.cjBalance < price) {
        showMessage("CJ insuffisants", "error");
      } else {
        showMessage("Déjà débloqué", "info");
      }
    }
  }
}

/**
 * Affiche un message temporaire
 */
function showMessage(text, type = "info") {
  const existing = document.querySelector('.shop-message');
  if (existing) existing.remove();
  
  const message = document.createElement('div');
  message.className = `shop-message shop-message-${type}`;
  message.textContent = text;
  document.body.appendChild(message);
  
  setTimeout(() => message.classList.add('show'), 10);
  setTimeout(() => {
    message.classList.remove('show');
    setTimeout(() => message.remove(), 300);
  }, 2000);
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
