/**
 * Met à jour dynamiquement le badge cosmétique du Hero dans la boutique
 */
function updateHeroBadge() {
  const badgeId = window.CJajlkAccount && typeof CJajlkAccount.getSelectedBadge === "function"
    ? CJajlkAccount.getSelectedBadge()
    : null;
  const badgeContainer = document.getElementById("heroBadge");
  if (!badgeContainer) return;
  if (!badgeId) {
    badgeContainer.innerHTML = "";
    return;
  }
  const badgeMap = {
    badge_explorer: { icon: "🌙", label: "Explorateur Nocturne" },
    badge_fidele: { icon: "⭐", label: "Joueur Fidèle" },
    badge_centre: { icon: "🔮", label: "Compagnon du Centre" }
  };
  const badge = badgeMap[badgeId];
  if (!badge) return;
  badgeContainer.innerHTML = `
    <div class="hero-badge-card glow-${badgeId}">
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-label">${badge.label}</span>
    </div>
  `;
}
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
  const selectedBadge = window.CJajlkAccount && typeof CJajlkAccount.getSelectedBadge === "function" ? CJajlkAccount.getSelectedBadge() : null;
  const itemsHTML = SHOP_ITEMS.map(item => {
    const isPurchased = window.CJajlkAccount && typeof CJajlkAccount.isBadgeUnlocked === "function"
      ? CJajlkAccount.isBadgeUnlocked(item.id)
      : false;
    const account = getCJAccountData();
    const canAfford = account.totalCJ >= item.price;
    const priceLabel = `${item.price} CJ`;
    const lockLabel = '🔒 CJ insuffisants';
    let buttonHtml = '';
    let cardClass = '';
    if (selectedBadge === item.id) {
      cardClass = 'equipped-badge';
      buttonHtml = '<button class="btn-equiped" disabled>Équipé</button>';
    }
    else if (isPurchased) {
      buttonHtml = `<button class="btn-equip buy-btn" data-item="${item.id}" data-equip="1">Équiper</button>`;
    } else {
      buttonHtml = `<button class="btn-buy buy-btn ${!canAfford ? 'disabled' : ''}" data-item="${item.id}" data-price="${item.price}" ${!canAfford ? 'disabled' : ''}>${!canAfford ? lockLabel : 'Acheter'}</button>`;
    }
    const badgeActiveLabel = (selectedBadge === item.id)
      ? '<span class="badge-active-label">Badge Actif</span>'
      : '';
    return `
      <div class="shop-item ${isPurchased ? 'purchased' : ''} ${cardClass}" data-item-id="${item.id}">
        ${badgeActiveLabel}
        <div class="item-icon">${item.icon}</div>
        <div class="item-info">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-description">${item.description}</p>
          <div class="item-footer">
            <span class="item-price">${priceLabel}</span>
            ${buttonHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
  catalogContainer.innerHTML = itemsHTML;
}

function equipBadge(badgeId) {
    if (window.CJajlkAccount && typeof CJajlkAccount.setSelectedBadge === "function") {
        CJajlkAccount.setSelectedBadge(badgeId);
        renderShopCatalog();
        if (typeof updateHeroBadge === "function") updateHeroBadge();
    }
}

/**
 * Achète un item de la boutique - Phase 1 actif
 */
function buyShopItem(itemId) {
  // Empêcher le double achat
  if (window.CJajlkAccount && typeof CJajlkAccount.isBadgeUnlocked === "function") {
    if (CJajlkAccount.isBadgeUnlocked(itemId)) {
      showMessage("Badge déjà débloqué");
      return;
    }
  }
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
  // 💳 Débiter puis débloquer le badge
if (window.CJajlkAccount.remove("hub", item.price)) {

    // 🔓 Débloque le badge
    window.CJajlkAccount.unlockBadge(itemId);

    // 👑 Auto-équipement du badge
    window.CJajlkAccount.setSelectedBadge(itemId);

    showMessage("Badge débloqué ! ✨");

    // 🔄 Mise à jour UI
    updateShopBalance();
    renderShopCatalog();

    // ✨ Effet visuel sur la carte
    const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemCard) {
        itemCard.classList.add("purchase-glow");
        setTimeout(() => {
            itemCard.classList.remove("purchase-glow");
        }, 800);
    }
}

/**
 * Attache les handlers d'achat sur les boutons
 */
function initShopButtons() {
  document.querySelectorAll(".buy-btn").forEach(button => {
      button.addEventListener("click", () => {
        const itemId = button.dataset.item;
        if (button.dataset.equip === "1") {
          equipBadge(itemId);
        } else {
          buyShopItem(itemId);
        }
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
  updateHeroBadge();
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
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Shop DOM chargé");
    renderShopCatalog();
});
