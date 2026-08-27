/* ══════════════════════════════════════════════════════════════════════════
   admin.js — Zowie's Hardware Admin Panel
   ══════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── Auth credentials (change these!) ───────────────────────────────────── */
  // Store a simple hash — NOT plain text. To generate a new hash, open the
  // browser console on any page and run:
  //   await ZowieAdmin.hashPassword('yourNewPassword')
  // then paste the result below as PASS_HASH.
  const VALID_USERNAME = 'zowie';
  // Default password: zowie2026  ← change this after first login
  const PASS_HASH = '675e0428b87a8556303ad4f796f05fea68bf97ca7a2ab38fd38d72f0f81ba645';
  // Session key
  const SESSION_KEY = 'zowie-admin-session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

  /* ── Simple hash (SHA-256-like via Web Crypto) ──────────────────────────── */
  async function hashPassword(plain) {
    const enc = new TextEncoder().encode('zowie-salt::' + plain);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Expose hash helper to console for admin setup ─────────────────────── */
  window.ZowieAdmin = { hashPassword };

  /* ════════════════════════════════════════════════════════════════════════
     AUTH
     ════════════════════════════════════════════════════════════════════════ */
  function isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const { ts } = JSON.parse(raw);
      if (Date.now() - ts > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return false; }
      return true;
    } catch { return false; }
  }

  function login() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  /* ── Show/hide screens ──────────────────────────────────────────────────── */
  const loginScreen = document.getElementById('login-screen');
  const dashboard   = document.getElementById('dashboard');

  function showLogin() {
    if (loginScreen) loginScreen.style.display = '';
    if (dashboard)   dashboard.hidden = true;
  }

  function showDashboard() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard)   { dashboard.hidden = false; }
    initDashboard();
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }

  /* ── Login form ─────────────────────────────────────────────────────────── */
  const loginForm  = document.getElementById('login-form');
  const loginErr   = document.getElementById('login-error');
  const loginBtn   = document.getElementById('login-btn');
  const showPwBtn  = document.getElementById('show-pw-btn');
  const pwInput    = document.getElementById('login-password');

  showPwBtn?.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    showPwBtn.textContent = isText ? '👁' : '🙈';
    showPwBtn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
  });

  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    if (loginErr) loginErr.hidden = true;
    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Signing in…'; }

    try {
      const hash = await hashPassword(password);
      // Accept both the stored hash AND allow default password via direct compare
      // so the panel works out of the box. Remove the second condition after setting
      // your own PASS_HASH.
      const validHash   = hash === PASS_HASH;
      const defaultPass = (username === 'admin' && password === 'zowie2026');

      if (username === VALID_USERNAME && (validHash || defaultPass)) {
        login();
        showDashboard();
      } else {
        if (loginErr) loginErr.hidden = false;
      }
    } catch {
      if (loginErr) { loginErr.hidden = false; loginErr.textContent = 'Sign-in failed. Please try again.'; }
    } finally {
      if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = 'Sign In <span>→</span>'; }
    }
  });

  /* ── Logout ─────────────────────────────────────────────────────────────── */
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('topbar-logout')?.addEventListener('click', logout);


  /* ════════════════════════════════════════════════════════════════════════
     DASHBOARD INIT
     ════════════════════════════════════════════════════════════════════════ */
  let dashboardReady = false;

  function initDashboard() {
    if (dashboardReady) { renderCatalogue(); renderOverview(); return; }
    dashboardReady = true;

    initSidebar();
    initSidebarMobile();
    populateCategoryFilters();
    renderCatalogue();
    renderOverview();
    initItemForm();
    initSearch();
    initStockFilter();
    initCatFilter();
    initModals();
  }

  /* ════════════════════════════════════════════════════════════════════════
     SIDEBAR NAVIGATION
     ════════════════════════════════════════════════════════════════════════ */
  function initSidebar() {
    document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
  }

  function switchSection(id) {
    document.querySelectorAll('.admin-section').forEach(s => { s.classList.remove('active'); s.hidden = true; });
    document.querySelectorAll('.nav-item[data-section]').forEach(b => b.classList.remove('active'));

    const section = document.getElementById(`section-${id}`);
    const navBtn  = document.querySelector(`.nav-item[data-section="${id}"]`);
    if (section) { section.classList.add('active'); section.hidden = false; }
    if (navBtn)  navBtn.classList.add('active');

    if (id === 'stats') renderOverview();
  }

  function initSidebarMobile() {
    const sidebar       = document.getElementById('sidebar');
    const topbarMenuBtn = document.getElementById('topbar-menu-btn');

    // Create overlay dynamically
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function openSidebar()  { sidebar?.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar?.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

    topbarMenuBtn?.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sidebar?.classList.contains('open')) closeSidebar(); });

    // Close sidebar when a nav item is clicked on mobile
    document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => { if (window.innerWidth < 769) closeSidebar(); });
    });
  }


  /* ════════════════════════════════════════════════════════════════════════
     CATALOGUE RENDERING
     ════════════════════════════════════════════════════════════════════════ */
  let searchQuery  = '';
  let filterCat    = 'all';
  let filterStock  = 'all';

  function getFiltered() {
    return ZowieCatalogue.getAll().filter(p => {
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery);
      const matchCat   = filterCat  === 'all' || p.category === filterCat;
      const matchStock = filterStock === 'all' ||
        (filterStock === 'instock' && p.inStock) ||
        (filterStock === 'outofstock' && !p.inStock);
      return matchSearch && matchCat && matchStock;
    });
  }

  function renderCatalogue() {
    const tbody  = document.getElementById('product-tbody');
    const empty  = document.getElementById('catalogue-empty');
    if (!tbody) return;

    const products = getFiltered();
    tbody.innerHTML = '';

    // Update stats from full catalogue (not filtered)
    const all = ZowieCatalogue.getAll();
    const inStock = all.filter(p => p.inStock).length;
    setText('stat-total',      all.length);
    setText('stat-instock',    inStock);
    setText('stat-outofstock', all.length - inStock);

    if (products.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    products.forEach(p => {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      tr.innerHTML = `
        <td>
          <div class="td-product">
            <span class="td-emoji">${escHtml(p.emoji || '📦')}</span>
            <div>
              <div class="td-name">${escHtml(p.name)}</div>
              <div class="td-desc">${escHtml(p.description || '')}</div>
            </div>
          </div>
        </td>
        <td>${escHtml(ZowieCatalogue.getCategoryLabel(p.category))}</td>
        <td class="col-price">
          <div class="price-display">
            <span class="price-value">R${Number(p.price).toFixed(0)}</span>
            <button class="btn-edit-price" data-id="${p.id}" data-name="${escHtml(p.name)}" data-price="${p.price}" aria-label="Edit price for ${escHtml(p.name)}">Edit</button>
          </div>
        </td>
        <td class="col-stock">
          <button class="stock-badge ${p.inStock ? 'in-stock' : 'out-stock'}" data-id="${p.id}" title="Click to toggle stock status">
            ${p.inStock ? '✓ In Stock' : '✕ Out of Stock'}
          </button>
        </td>
        <td class="col-actions">
          <div class="action-btns">
            <button class="btn-edit" data-id="${p.id}">✏️ Edit</button>
            <button class="btn-delete" data-id="${p.id}" data-name="${escHtml(p.name)}">🗑 Delete</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    // Bind events
    tbody.querySelectorAll('.btn-edit-price').forEach(btn => {
      btn.addEventListener('click', () => openPriceModal(btn.dataset.id, btn.dataset.name, btn.dataset.price));
    });
    tbody.querySelectorAll('.stock-badge').forEach(btn => {
      btn.addEventListener('click', () => toggleStock(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  function toggleStock(id) {
    const p = ZowieCatalogue.getById(id);
    if (!p) return;
    ZowieCatalogue.update(id, { inStock: !p.inStock });
    renderCatalogue();
    toast(`${p.name}: marked as ${!p.inStock ? 'In Stock' : 'Out of Stock'}`);
  }

  function initSearch() {
    document.getElementById('admin-search')?.addEventListener('input', e => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderCatalogue();
    });
  }

  function initCatFilter() {
    document.getElementById('admin-cat-filter')?.addEventListener('change', e => {
      filterCat = e.target.value;
      renderCatalogue();
    });
  }

  function initStockFilter() {
    document.getElementById('admin-stock-filter')?.addEventListener('change', e => {
      filterStock = e.target.value;
      renderCatalogue();
    });
  }

  function populateCategoryFilters() {
    const cats = ZowieCatalogue.getAllCategories();

    // Catalogue filter dropdown
    const catFilter = document.getElementById('admin-cat-filter');
    if (catFilter) {
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.key; opt.textContent = c.label;
        catFilter.appendChild(opt);
      });
    }

    // Add/Edit form category select
    const itemCat = document.getElementById('item-category');
    if (itemCat) {
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.key; opt.textContent = c.label;
        itemCat.appendChild(opt);
      });
    }
  }


  /* ════════════════════════════════════════════════════════════════════════
     ADD / EDIT ITEM FORM
     ════════════════════════════════════════════════════════════════════════ */
  function initItemForm() {
    const form      = document.getElementById('item-form');
    const stockInput = document.getElementById('item-instock');
    const stockLabel = document.getElementById('stock-label');
    const cancelBtn  = document.getElementById('item-cancel-btn');

    stockInput?.addEventListener('change', () => {
      if (stockLabel) stockLabel.textContent = stockInput.checked ? 'In Stock' : 'Out of Stock';
    });

    cancelBtn?.addEventListener('click', resetItemForm);

    form?.addEventListener('submit', e => {
      e.preventDefault();
      const editId = document.getElementById('edit-item-id')?.value;

      const data = {
        name:        document.getElementById('item-name')?.value.trim(),
        category:    document.getElementById('item-category')?.value,
        price:       parseFloat(document.getElementById('item-price')?.value) || 0,
        emoji:       document.getElementById('item-emoji')?.value.trim() || '📦',
        description: document.getElementById('item-description')?.value.trim(),
        inStock:     document.getElementById('item-instock')?.checked ?? true,
      };

      if (!data.name || !data.category) {
        showFormFeedback('error', 'Please fill in the product name and category.');
        return;
      }
      if (data.price < 0) {
        showFormFeedback('error', 'Price cannot be negative.');
        return;
      }

      if (editId) {
        ZowieCatalogue.update(editId, data);
        showFormFeedback('success', `✓ "${data.name}" updated successfully.`);
        toast(`"${data.name}" updated`);
      } else {
        ZowieCatalogue.add(data);
        showFormFeedback('success', `✓ "${data.name}" added to the catalogue.`);
        toast(`"${data.name}" added to catalogue`);
        form.reset();
        if (stockLabel) stockLabel.textContent = 'In Stock';
      }

      renderCatalogue();
      renderOverview();
    });
  }

  function openEditForm(id) {
    const p = ZowieCatalogue.getById(id);
    if (!p) return;

    // Switch to add-item section
    switchSection('add-item');

    // Fill form
    const editIdEl = document.getElementById('edit-item-id');
    if (editIdEl) editIdEl.value = p.id;
    setValue('item-name',        p.name);
    setValue('item-category',    p.category);
    setValue('item-price',       p.price);
    setValue('item-emoji',       p.emoji || '');
    setValue('item-description', p.description || '');

    const stockInput = document.getElementById('item-instock');
    const stockLabel = document.getElementById('stock-label');
    if (stockInput) stockInput.checked = p.inStock;
    if (stockLabel) stockLabel.textContent = p.inStock ? 'In Stock' : 'Out of Stock';

    // Update UI
    setText('item-form-title', 'Edit Item');
    setText('item-form-desc',  `Editing: ${p.name}`);
    const submitBtn = document.getElementById('item-submit-btn');
    if (submitBtn) submitBtn.innerHTML = 'Save Changes <span>→</span>';
    const cancelBtn = document.getElementById('item-cancel-btn');
    if (cancelBtn) cancelBtn.hidden = false;

    hideEl('item-form-feedback');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetItemForm() {
    document.getElementById('item-form')?.reset();
    setValue('edit-item-id', '');
    setText('item-form-title', 'Add New Item');
    setText('item-form-desc',  'Fill in the details below to add a product to the store catalogue.');
    const submitBtn = document.getElementById('item-submit-btn');
    if (submitBtn) submitBtn.innerHTML = 'Add to Catalogue <span>→</span>';
    const cancelBtn = document.getElementById('item-cancel-btn');
    if (cancelBtn) cancelBtn.hidden = true;
    const stockLabel = document.getElementById('stock-label');
    if (stockLabel) stockLabel.textContent = 'In Stock';
    hideEl('item-form-feedback');
  }

  function showFormFeedback(type, message) {
    const el = document.getElementById('item-form-feedback');
    if (!el) return;
    el.className = `form-feedback ${type}`;
    el.textContent = message;
    el.hidden = false;
    if (type === 'success') setTimeout(() => hideEl('item-form-feedback'), 4000);
  }


  /* ════════════════════════════════════════════════════════════════════════
     OVERVIEW
     ════════════════════════════════════════════════════════════════════════ */
  function renderOverview() {
    const products = ZowieCatalogue.getAll();
    const cats     = ZowieCatalogue.getAllCategories();

    const inStock    = products.filter(p => p.inStock).length;
    const outOfStock = products.length - inStock;
    const avgPrice   = products.length
      ? (products.reduce((s, p) => s + p.price, 0) / products.length).toFixed(0)
      : 0;

    const grid = document.getElementById('overview-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="overview-card">
          <span class="ov-value">${products.length}</span>
          <span class="ov-label">Total Products</span>
        </div>
        <div class="overview-card">
          <span class="ov-value" style="color:#2ea44f">${inStock}</span>
          <span class="ov-label">In Stock</span>
        </div>
        <div class="overview-card">
          <span class="ov-value" style="color:var(--red)">${outOfStock}</span>
          <span class="ov-label">Out of Stock</span>
        </div>
        <div class="overview-card">
          <span class="ov-value">R${avgPrice}</span>
          <span class="ov-label">Avg. Price</span>
        </div>
        <div class="overview-card">
          <span class="ov-value">${cats.length}</span>
          <span class="ov-label">Categories</span>
        </div>`;
    }

    const breakdown = document.getElementById('cat-breakdown');
    if (breakdown) {
      breakdown.innerHTML = '';
      cats.forEach(c => {
        const count = products.filter(p => p.category === c.key).length;
        if (count === 0) return;
        const row = document.createElement('div');
        row.className = 'cat-row';
        row.innerHTML = `<span class="cat-row-name">${escHtml(c.label)}</span><span class="cat-row-count">${count}</span>`;
        breakdown.appendChild(row);
      });
    }
  }


  /* ════════════════════════════════════════════════════════════════════════
     MODALS
     ════════════════════════════════════════════════════════════════════════ */
  function initModals() {
    // Close on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeAllModals(); });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => { m.hidden = true; });
  }

  // ── Price modal ────────────────────────────────────────────────────────
  let priceModalId = null;

  function openPriceModal(id, name, currentPrice) {
    priceModalId = id;
    setText('price-modal-name', name);
    setValue('price-modal-input', Number(currentPrice).toFixed(2));
    showEl('price-modal');
    document.getElementById('price-modal-input')?.focus();
  }

  document.getElementById('price-modal-close')?.addEventListener('click',  closeAllModals);
  document.getElementById('price-modal-cancel')?.addEventListener('click', closeAllModals);
  document.getElementById('price-modal-save')?.addEventListener('click',   savePriceModal);

  document.getElementById('price-modal-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') savePriceModal();
  });

  function savePriceModal() {
    if (!priceModalId) return;
    const raw = document.getElementById('price-modal-input')?.value;
    const price = parseFloat(raw);
    if (isNaN(price) || price < 0) { alert('Please enter a valid price.'); return; }
    const p = ZowieCatalogue.update(priceModalId, { price });
    closeAllModals();
    renderCatalogue();
    renderOverview();
    toast(`Price updated: ${p?.name || ''} → R${price.toFixed(0)}`);
    priceModalId = null;
  }

  // ── Delete modal ───────────────────────────────────────────────────────
  let deleteModalId = null;

  function openDeleteModal(id, name) {
    deleteModalId = id;
    setText('delete-product-name', name);
    showEl('delete-modal');
  }

  document.getElementById('delete-modal-close')?.addEventListener('click',  closeAllModals);
  document.getElementById('delete-cancel-btn')?.addEventListener('click',   closeAllModals);
  document.getElementById('delete-confirm-btn')?.addEventListener('click',  confirmDelete);

  function confirmDelete() {
    if (!deleteModalId) return;
    const p = ZowieCatalogue.getById(deleteModalId);
    ZowieCatalogue.remove(deleteModalId);
    closeAllModals();
    renderCatalogue();
    renderOverview();
    toast(`"${p?.name || 'Item'}" deleted from catalogue`);
    deleteModalId = null;
  }

  // ── Reset catalogue ────────────────────────────────────────────────────
  document.getElementById('reset-catalogue-btn')?.addEventListener('click', () => {
    if (!confirm('Reset the entire catalogue to factory defaults? This cannot be undone.')) return;
    ZowieCatalogue.reset();
    renderCatalogue();
    renderOverview();
    toast('Catalogue reset to defaults');
  });


  /* ════════════════════════════════════════════════════════════════════════
     TOAST
     ════════════════════════════════════════════════════════════════════════ */
  let toastTimer = null;

  function toast(message, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.hidden = true; }, 260);
    }, duration);
  }


  /* ════════════════════════════════════════════════════════════════════════
     DOM HELPERS
     ════════════════════════════════════════════════════════════════════════ */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
  function showEl(id) { const el = document.getElementById(id); if (el) el.hidden = false; }
  function hideEl(id) { const el = document.getElementById(id); if (el) el.hidden = true;  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
