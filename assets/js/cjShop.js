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
 * Récupère les données CJ officielles via CJajlkAccount
 */
function getCJAccountData() {
    if (window.CJajlkAccount && typeof CJajlkAccount.getTotal === "function") {
        return { totalCJ: CJajlkAccount.getTotal() };
    }
    return { totalCJ: 0 };
}

/**
 * Affiche le solde CJ universel dans la boutique
 */
function updateShopBalance() {
    try {
        const account = getCJAccountData();
        const balanceEl = document.getElementById("cjAmount");
        if (balanceEl) {
            balanceEl.textContent = account.totalCJ;
        }
    } catch (error) {
        console.error("Erreur mise à jour solde CJ :", error);
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
    const account = getCJAccountData();
    const canAfford = account.totalCJ >= item.price;
    const priceLabel = `${item.price} CJ`;
    const lockLabel = '🔒 CJ insuffisants';
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
              : `<button class="btn-buy buy-btn ${!canAfford ? 'disabled' : ''}" data-item="${item.id}" data-price="${item.price}" ${!canAfford ? 'disabled' : ''}>${!canAfford ? lockLabel : 'Acheter'}</button>`
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
function buyShopItem(itemId) {
  // Trouver le prix via SHOP_ITEMS
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    showMessage("Item introuvable", "error");
    return;
  }
  // Vérifier solde
  const account = getCJAccountData();
  if (account.totalCJ < item.price) {
    showMessage("CJ insuffisants", "error");
    return;
  }
  // Débiter le solde CJ via API officielle
  window.CJajlkAccount.remove("hub", item.price);
  // Débloquer le badge (à adapter selon logique réelle)
  // window.CJajlkAccount.unlockItem(itemId); // À implémenter si besoin
  updateShopBalance();
  renderShopCatalog();
  const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
  if (itemCard) {
    itemCard.classList.add('purchase-glow');
    setTimeout(() => itemCard.classList.remove('purchase-glow'), 800);
  }
  showMessage("Badge débloqué !", "success");
}

/**
 * Attache les handlers d'achat sur les boutons
 */
function initShopButtons() {
  document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.item;
      buyShopItem(itemId);
    });
  });
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
  updateShopBalance();
  renderShopCatalog();
  initShopButtons();
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
