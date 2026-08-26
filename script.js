/* ══════════════════════════════════════════════════════════════════════════
   Zowie's Hardware — script.js
   ══════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── WhatsApp number (include country code, no + or spaces) ─────────────── */
  const WA_NUMBER = '256757005001';   // ← replace with real number

  /* ══════════════════════════════════════════════════════════════════════════
     1. DARK / LIGHT MODE
     ══════════════════════════════════════════════════════════════════════════ */
  const htmlEl       = document.documentElement;
  const themeToggle  = document.getElementById('theme-toggle');
  const themeIcon    = themeToggle?.querySelector('.theme-icon');

  // Load saved preference; fall back to OS preference
  const savedTheme = localStorage.getItem('zowie-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme  = savedTheme || (prefersDark ? 'dark' : 'light');

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('zowie-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  applyTheme(currentTheme);

  themeToggle?.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });


  /* ══════════════════════════════════════════════════════════════════════════
     2. MOBILE NAV
     ══════════════════════════════════════════════════════════════════════════ */
  const menuBtn         = document.getElementById('menu-button');
  const mobileNav       = document.getElementById('mobile-nav');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavClose  = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    mobileNav?.classList.add('open');
    mobileNavOverlay?.classList.add('open');
    mobileNav?.setAttribute('aria-hidden', 'false');
    menuBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    mobileNavClose?.focus();
  }

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    mobileNavOverlay?.classList.remove('open');
    mobileNav?.setAttribute('aria-hidden', 'true');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openMobileNav);
  mobileNavClose?.addEventListener('click', closeMobileNav);
  mobileNavOverlay?.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav?.classList.contains('open')) closeMobileNav();
  });

  // Mobile nav tab buttons
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
      closeMobileNav();
    });
  });


  /* ══════════════════════════════════════════════════════════════════════════
     3. TABS
     ══════════════════════════════════════════════════════════════════════════ */
  // All tab buttons: header desktop nav + mobile tab bar + mobile nav drawer
  const tabBtns   = document.querySelectorAll('.tab-btn, .mobile-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function activateTab(tabId) {
    // Sync every tab button regardless of which nav it lives in
    tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    tabPanels.forEach(panel => {
      const isActive = panel.id === `tab-${tabId}`;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sessionStorage.setItem('zowie-tab', tabId);
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Buttons elsewhere on the page that jump to a tab
  document.querySelectorAll('.tab-jump').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  document.querySelectorAll('[href*="tab-"]').forEach(link => {
    const match = link.getAttribute('href').match(/tab-(\w+)/);
    if (match) link.addEventListener('click', (e) => { e.preventDefault(); activateTab(match[1]); });
  });

  // Restore last tab
  const lastTab = sessionStorage.getItem('zowie-tab');
  if (lastTab) activateTab(lastTab);


  /* ══════════════════════════════════════════════════════════════════════════
     3. CART STATE
     ══════════════════════════════════════════════════════════════════════════ */
  let cart = JSON.parse(localStorage.getItem('zowie-cart') || '[]');
  // cart item shape: { name, price, qty }

  function saveCart() {
    localStorage.setItem('zowie-cart', JSON.stringify(cart));
  }

  function cartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function cartItemCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  // Update header cart badge + sticky bar
  function refreshCartUI() {
    const count = cartItemCount();
    const total = cartTotal();

    // header badge
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; });
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) cartBtn.setAttribute('aria-label', `Shopping cart, ${count} items`);

    // live region
    const liveEl = document.getElementById('cart-live');
    if (liveEl) liveEl.textContent = count > 0 ? `${count} item${count !== 1 ? 's' : ''} in cart` : '';

    // sticky bar in In-Store tab
    const cartBar = document.getElementById('view-cart-bar');
    const barCount = document.getElementById('cart-bar-count');
    const barTotal = document.getElementById('cart-bar-total');
    if (cartBar) {
      cartBar.hidden = count === 0;
      if (barCount) barCount.textContent = count;
      if (barTotal) barTotal.textContent = total.toFixed(0);
    }
  }

  refreshCartUI();


  /* ══════════════════════════════════════════════════════════════════════════
     4. CART DRAWER
     ══════════════════════════════════════════════════════════════════════════ */
  const cartDrawer   = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartClose    = document.getElementById('cart-close');
  const cartItemsEl  = document.getElementById('cart-items-list');
  const grandTotalEl = document.getElementById('cart-grand-total');

  function renderCartDrawer() {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>Your cart is empty.</p>
          <p>Browse our <button class="inline-chat-btn tab-jump" data-tab="instore">In Store</button> catalogue to add items.</p>
        </div>`;
      // re-bind tab-jump inside drawer
      cartItemsEl.querySelectorAll('.tab-jump').forEach(btn => {
        btn.addEventListener('click', () => { closCartDrawer(); activateTab(btn.dataset.tab); });
      });
    } else {
      cart.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <span class="cart-item-name">${escHtml(item.name)}</span>
          <span class="cart-item-qty">x${item.qty}</span>
          <span class="cart-item-price">R${(item.price * item.qty).toFixed(0)}</span>
          <button class="cart-item-remove" data-idx="${idx}" aria-label="Remove ${escHtml(item.name)} from cart">✕</button>`;
        cartItemsEl.appendChild(row);
      });
      cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          cart.splice(parseInt(btn.dataset.idx, 10), 1);
          saveCart();
          refreshCartUI();
          renderCartDrawer();
          syncTickedCards();
        });
      });
    }

    if (grandTotalEl) grandTotalEl.textContent = cartTotal().toFixed(0);
  }

  function openCartDrawer() {
    renderCartDrawer();
    if (cartDrawer) {
      cartDrawer.hidden = false;
      requestAnimationFrame(() => cartDrawer.classList.add('is-open'));
    }
    if (cartBackdrop) cartBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.remove('is-open');
      setTimeout(() => { cartDrawer.hidden = true; }, 310);
    }
    if (cartBackdrop) cartBackdrop.hidden = true;
    document.body.style.overflow = '';
  }

  // Open cart
  document.getElementById('cart-button')?.addEventListener('click', openCartDrawer);
  document.getElementById('view-cart-btn')?.addEventListener('click', openCartDrawer);

  // Close cart
  cartClose?.addEventListener('click', closCartDrawer);
  cartBackdrop?.addEventListener('click', closCartDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cartDrawer && !cartDrawer.hidden) closCartDrawer();
  });

  // Clear cart
  document.getElementById('cart-clear-btn')?.addEventListener('click', () => {
    cart = [];
    saveCart();
    refreshCartUI();
    renderCartDrawer();
    syncTickedCards();
  });

  // Send order via WhatsApp
  document.getElementById('cart-whatsapp-btn')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    let msg = `Hello Zowie's Hardware! I'd like to place an order:\n\n`;
    cart.forEach(item => {
      msg += `• ${item.qty}x ${item.name} @ R${item.price}.00 each = R${(item.price * item.qty).toFixed(0)}\n`;
    });
    msg += `\nTOTAL: R${cartTotal().toFixed(0)}\n\nPlease confirm availability and arrange delivery. Thank you!`;
    openWhatsApp(msg);
  });


  /* ══════════════════════════════════════════════════════════════════════════
     5. QUANTITY POPUP
     ══════════════════════════════════════════════════════════════════════════ */
  const qtyPopup      = document.getElementById('qty-popup');
  const popupClose    = document.getElementById('popup-close');
  const popupNameEl   = document.getElementById('popup-product-name');
  const popupUnitEl   = document.getElementById('popup-unit-price');
  const popupTotalEl  = document.getElementById('popup-total');
  const qtyInput      = document.getElementById('qty-input');
  const qtyMinus      = document.getElementById('qty-minus');
  const qtyPlus       = document.getElementById('qty-plus');
  const popupConfirm  = document.getElementById('popup-add-confirm');

  let pendingProduct = null;   // { name, price, card }

  function openQtyPopup(name, price, card) {
    pendingProduct = { name, price, card };
    if (popupNameEl) popupNameEl.textContent = name;
    if (popupUnitEl) popupUnitEl.textContent = price;
    if (qtyInput) qtyInput.value = 1;
    updatePopupTotal();
    if (qtyPopup) qtyPopup.hidden = false;
    qtyInput?.focus();
  }

  function closeQtyPopup() {
    if (qtyPopup) qtyPopup.hidden = true;
    pendingProduct = null;
  }

  function updatePopupTotal() {
    const qty   = Math.max(1, parseInt(qtyInput?.value || '1', 10));
    const price = pendingProduct ? pendingProduct.price : 0;
    if (popupTotalEl) popupTotalEl.textContent = (qty * price).toFixed(0);
  }

  popupClose?.addEventListener('click', closeQtyPopup);
  qtyPopup?.addEventListener('click', e => { if (e.target === qtyPopup) closeQtyPopup(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && qtyPopup && !qtyPopup.hidden) closeQtyPopup();
  });

  qtyMinus?.addEventListener('click', () => {
    if (qtyInput) { qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1); updatePopupTotal(); }
  });
  qtyPlus?.addEventListener('click', () => {
    if (qtyInput) { qtyInput.value = Math.min(999, parseInt(qtyInput.value, 10) + 1); updatePopupTotal(); }
  });
  qtyInput?.addEventListener('input', updatePopupTotal);

  popupConfirm?.addEventListener('click', () => {
    if (!pendingProduct) return;
    const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
    addToCart(pendingProduct.name, pendingProduct.price, qty, pendingProduct.card);
    closeQtyPopup();
  });


  /* ── Add to cart ─────────────────────────────────────────────────────────── */
  function addToCart(name, price, qty, card) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ name, price: parseFloat(price), qty });
    }
    saveCart();
    refreshCartUI();
    syncTickedCards();

    // Visual feedback on card
    if (card) {
      card.classList.add('selected');
      const btn = card.querySelector('.add-to-cart-btn');
      if (btn) {
        btn.textContent = '✓ Added';
        btn.style.background = 'var(--orange)';
        btn.style.color = '#fff';
      }
    }
  }

  // Restore ticked state from saved cart
  function syncTickedCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const btn  = card.querySelector('.add-to-cart-btn');
      const name = btn?.dataset.name;
      if (!name) return;
      const inCart = cart.some(i => i.name === name);
      card.classList.toggle('selected', inCart);
      if (btn) {
        btn.textContent = inCart ? '✓ Added' : 'Add to Cart +';
        btn.style.background = inCart ? 'var(--orange)' : '';
        btn.style.color      = inCart ? '#fff' : '';
      }
    });
  }

  // Wire up all "Add to Cart" buttons → open popup
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.product-card');
      const name  = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      openQtyPopup(name, price, card);
    });
  });

  syncTickedCards();


  /* ══════════════════════════════════════════════════════════════════════════
     6. IN-STORE SEARCH & FILTER
     ══════════════════════════════════════════════════════════════════════════ */
  const searchInput  = document.getElementById('store-search');
  const productCards = document.querySelectorAll('.product-card');
  const noResults    = document.getElementById('store-no-results');
  const pills        = document.querySelectorAll('.pill');

  let activeFilter = 'all';
  let searchQuery  = '';

  function filterProducts() {
    let visibleCount = 0;

    productCards.forEach(card => {
      const matchCat    = activeFilter === 'all' || card.dataset.category === activeFilter;
      const matchSearch = !searchQuery || card.dataset.name.toLowerCase().includes(searchQuery);
      const show = matchCat && matchSearch;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    if (noResults) noResults.hidden = visibleCount > 0 || (!searchQuery && activeFilter === 'all');
  }

  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    filterProducts();
  });

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      filterProducts();
    });
  });


  /* ══════════════════════════════════════════════════════════════════════════
     7. WHATSAPP CHAT WIDGET
     ══════════════════════════════════════════════════════════════════════════ */
  const chatFab    = document.getElementById('chat-fab');
  const chatPanel  = document.getElementById('chat-panel');
  const chatClose  = document.getElementById('chat-close');
  const chatInput  = document.getElementById('chat-message-input');
  const chatSend   = document.getElementById('chat-send');

  function openChat() {
    if (!chatPanel) return;
    chatPanel.hidden = false;
    chatFab?.setAttribute('aria-expanded', 'true');
    chatInput?.focus();
  }

  function closeChat() {
    if (!chatPanel) return;
    chatPanel.hidden = true;
    chatFab?.setAttribute('aria-expanded', 'false');
  }

  chatFab?.addEventListener('click', () => {
    chatPanel?.hidden ? openChat() : closeChat();
  });
  chatClose?.addEventListener('click', closeChat);

  // Quick replies
  document.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput) chatInput.value = btn.dataset.msg;
      sendChatMessage();
    });
  });

  // Send button
  chatSend?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  function sendChatMessage() {
    const msg = chatInput?.value.trim() || "Hi! I'd like to get in touch with Zowie's Hardware.";
    openWhatsApp(msg);
    if (chatInput) chatInput.value = '';
  }

  // "Chat with us" / "open-chat-btn" buttons anywhere on page
  document.querySelectorAll('.open-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => openChat());
  });


  /* ══════════════════════════════════════════════════════════════════════════
     8. LIST YOUR ITEMS FORM
     ══════════════════════════════════════════════════════════════════════════ */
  const itemsForm       = document.getElementById('items-form');
  const formSuccess     = document.getElementById('form-success');
  const sendAnotherBtn  = document.getElementById('send-another-btn');

  itemsForm?.addEventListener('submit', e => {
    e.preventDefault();

    const name    = document.getElementById('customer-name')?.value.trim();
    const phone   = document.getElementById('customer-phone')?.value.trim();
    const email   = document.getElementById('customer-email')?.value.trim();
    const type    = document.getElementById('inquiry-type')?.value;
    const items   = document.getElementById('items-list')?.value.trim();
    const notes   = document.getElementById('additional-notes')?.value.trim();

    if (!name || !phone || !items) {
      alert('Please fill in your name, phone number, and items list.');
      return;
    }

    // Build WhatsApp message
    let msg = `Hello Zowie's Hardware! 📋 *${typeLabel(type)}*\n\n`;
    msg += `*Name:* ${name}\n`;
    msg += `*Phone:* ${phone}\n`;
    if (email) msg += `*Email:* ${email}\n`;
    msg += `\n*Items Required:*\n${items}\n`;
    if (notes) msg += `\n*Additional Notes:*\n${notes}\n`;
    msg += `\nThank you!`;

    // Show success message
    if (itemsForm) itemsForm.hidden = true;
    if (formSuccess) formSuccess.hidden = false;

    // Open WhatsApp
    openWhatsApp(msg);
  });

  sendAnotherBtn?.addEventListener('click', () => {
    if (itemsForm) {
      itemsForm.hidden = false;
      itemsForm.reset();
    }
    if (formSuccess) formSuccess.hidden = true;
  });

  function typeLabel(val) {
    const map = {
      quotation:    'Price Quotation Request',
      availability: 'Stock Availability Check',
      order:        'Order Request',
      bulk:         'Bulk / Site Order',
    };
    return map[val] || 'Enquiry';
  }


  /* ══════════════════════════════════════════════════════════════════════════
     9. HELPER: open WhatsApp
     ══════════════════════════════════════════════════════════════════════════ */
  function openWhatsApp(message) {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ── XSS safety helper ──────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
