/* ══════════════════════════════════════════════════════════════════════════
   catalogue.js — shared product data layer
   Both the store page (script.js) and admin panel (admin.js) read/write
   the same localStorage key: 'zowie-catalogue'
   ══════════════════════════════════════════════════════════════════════════ */

const ZowieCatalogue = (() => {
  'use strict';

  const STORAGE_KEY = 'zowie-catalogue';

  /* ── Default products (used only on first load, never overwritten) ──────── */
  const DEFAULT_PRODUCTS = [
    /* ── BUILDING MATERIALS ─────────────────────────────────────── */
    { id: 'p001', category: 'building-materials', emoji: '🧱', name: 'Cement Bag 50kg',             price: 89,  description: 'General purpose Portland cement. Suitable for concrete, mortar, and plaster.', inStock: true },
    { id: 'p002', category: 'building-materials', emoji: '⛱️', name: 'River Sand 50kg',             price: 45,  description: 'Fine river sand for mixing concrete and mortar. Clean and washed.', inStock: true },
    { id: 'p003', category: 'building-materials', emoji: '🧱', name: 'Building Bricks (Pack of 10)', price: 55,  description: 'Standard clay face bricks, suitable for structural walls and landscaping.', inStock: true },
    { id: 'p004', category: 'building-materials', emoji: '🏗️', name: 'Plaster Sand 40kg',           price: 38,  description: 'Fine-grade plastering sand for smooth wall and ceiling finishes.', inStock: true },
    { id: 'p005', category: 'building-materials', emoji: '🪵', name: 'Pine Plank 2.4m',             price: 72,  description: 'Structural pine plank 38×114mm, ideal for framing and general construction.', inStock: true },
    { id: 'p006', category: 'building-materials', emoji: '🏠', name: 'Corrugated Iron Sheet 1.8m',  price: 145, description: 'Galvanised corrugated iron roofing sheet. 0.3mm thickness, 1.8m length.', inStock: true },
    { id: 'p007', category: 'building-materials', emoji: '🔧', name: 'PVC Pipe 3m (110mm)',          price: 185, description: 'Heavy-duty PVC sewer pipe 110mm diameter, 3m length. Class 34.', inStock: true },
    { id: 'p008', category: 'building-materials', emoji: '🧱', name: 'Hollow Concrete Block',        price: 18,  description: 'Standard 390×190×190mm hollow concrete masonry block.', inStock: true },

    /* ── BUILDERS' TOOLS ─────────────────────────────────────────── */
    { id: 'p009', category: 'builders-tools', emoji: '🔨', name: 'Claw Hammer 450g',        price: 129, description: 'Heavy-duty steel claw hammer with rubber grip handle. 450g head weight.', inStock: true },
    { id: 'p010', category: 'builders-tools', emoji: '🪚', name: 'Hand Saw 500mm',          price: 149, description: 'Hardpoint hand saw with 7 TPI. Cuts timber, boards, and softwood.', inStock: true },
    { id: 'p011', category: 'builders-tools', emoji: '🔧', name: 'Hacksaw Frame & Blade',   price: 89,  description: 'Adjustable hacksaw frame 300mm with 24 TPI bi-metal blade. Cuts metal and pipe.', inStock: true },
    { id: 'p012', category: 'builders-tools', emoji: '📏', name: 'Spirit Level 600mm',      price: 175, description: 'Aluminium spirit level with 3 vials for horizontal, vertical, and 45° checks.', inStock: true },
    { id: 'p013', category: 'builders-tools', emoji: '📐', name: 'Tape Measure 5m',         price: 65,  description: 'Auto-lock 5m steel tape measure with magnetic end hook. Belt clip included.', inStock: true },
    { id: 'p014', category: 'builders-tools', emoji: '🧰', name: 'Brick Trowel 280mm',      price: 95,  description: 'High-carbon steel brick trowel with hardwood handle. 280mm blade.', inStock: true },
    { id: 'p015', category: 'builders-tools', emoji: '🛒', name: 'Wheelbarrow 65L',         price: 699, description: 'Heavy-duty steel 65 litre construction wheelbarrow with pneumatic tyre.', inStock: true },
    { id: 'p016', category: 'builders-tools', emoji: '🪛', name: 'Screwdriver Set (6pc)',   price: 119, description: '6-piece set with flat and Phillips heads in assorted sizes. Ergonomic handles.', inStock: true },
    { id: 'p017', category: 'builders-tools', emoji: '⚙️', name: 'Angle Grinder 115mm',    price: 549, description: '850W electric angle grinder with safety guard and side handle. Disc included.', inStock: true },

    /* ── PAINT & SUPPLIES ────────────────────────────────────────── */
    { id: 'p018', category: 'paint-supplies', emoji: '🎨', name: 'Interior Wall Paint White 5L', price: 279, description: 'Premium washable interior emulsion paint. White base, excellent coverage.', inStock: true },
    { id: 'p019', category: 'paint-supplies', emoji: '🏠', name: 'Exterior Masonry Paint 20L',   price: 749, description: 'Weather-resistant exterior paint with fungicidal protection. Various colors.', inStock: true },
    { id: 'p020', category: 'paint-supplies', emoji: '🖌️', name: 'Paint Roller Set 230mm',       price: 89,  description: '9-inch roller frame with 2 medium-pile sleeves, paint tray, and frame.', inStock: true },
    { id: 'p021', category: 'paint-supplies', emoji: '🖌️', name: 'Primer Sealer 5L',             price: 195, description: 'Multi-surface alkali-resistant primer sealer. Use before topcoats on new plaster.', inStock: true },

    /* ── FASTENERS & FIXINGS ─────────────────────────────────────── */
    { id: 'p022', category: 'fasteners', emoji: '📦', name: 'Nails Assorted Box 500g',       price: 49, description: 'Assorted round-head wire nails in 500g box. Sizes 25mm, 38mm, 50mm, 75mm.', inStock: true },
    { id: 'p023', category: 'fasteners', emoji: '🔩', name: 'Wood Screws Box (200pc)',        price: 65, description: 'Countersunk wood screws 4×40mm, 200 pieces per box. Yellow zinc plated.', inStock: true },
    { id: 'p024', category: 'fasteners', emoji: '🔩', name: 'Rawl Plugs & Anchors Pack',      price: 55, description: '100-piece assorted wall plugs and anchors for masonry, drywall, and tile.', inStock: true },

    /* ── PLUMBING ────────────────────────────────────────────────── */
    { id: 'p025', category: 'plumbing', emoji: '🚰', name: 'Basin Tap Chrome (Pair)', price: 249, description: 'Chrome pillar taps for basin. 1/2" inlet, ceramic disc cartridge.', inStock: true },
    { id: 'p026', category: 'plumbing', emoji: '⚙️', name: 'Ball Valve 15mm',         price: 65,  description: 'Brass full-bore ball valve 15mm (1/2"). For water shut-off applications.', inStock: true },
    { id: 'p027', category: 'plumbing', emoji: '🔧', name: 'Flexi Hose 300mm',        price: 45,  description: 'Braided stainless flexi hose 300mm 3/8" female×female. For basin and toilet.', inStock: true },

    /* ── ELECTRICAL ──────────────────────────────────────────────── */
    { id: 'p028', category: 'electrical', emoji: '🔌', name: 'Extension Cord 5m',          price: 189, description: '4-way surge-protected extension cord, 5m cable. South African plug (Type M).', inStock: true },
    { id: 'p029', category: 'electrical', emoji: '💡', name: 'Light Switch Single (Surface)', price: 35, description: 'Single surface-mount light switch 10A. White. Suitable for indoor use.', inStock: true },
    { id: 'p030', category: 'electrical', emoji: '💡', name: 'LED Bulb 9W E27',              price: 29,  description: 'Energy-saving 9W LED bulb, E27 base, 6500K cool white. 800 lumen output.', inStock: true },

    /* ── GARDEN & OUTDOOR ────────────────────────────────────────── */
    { id: 'p031', category: 'garden-outdoor', emoji: '🌿', name: 'Garden Fork',    price: 189, description: '4-tine digging fork with ash handle. Ideal for turning soil and composting.', inStock: true },
    { id: 'p032', category: 'garden-outdoor', emoji: '🌱', name: 'Garden Spade',   price: 175, description: 'Long-handle digging spade with steel head and D-grip. For all soil types.', inStock: true },
    { id: 'p033', category: 'garden-outdoor', emoji: '💧', name: 'Garden Hose 20m', price: 259, description: 'Reinforced 20m garden hose with spray nozzle and tap connector. Kink-resistant.', inStock: true },

    /* ── SAFETY & PPE ────────────────────────────────────────────── */
    { id: 'p034', category: 'safety', emoji: '⛑️', name: 'Safety Helmet / Hard Hat',  price: 89,  description: 'SABS-approved hard hat with 6-point harness. UV-stabilised ABS shell.', inStock: true },
    { id: 'p035', category: 'safety', emoji: '🧤', name: 'Work Safety Gloves',         price: 45,  description: 'Anti-slip leather palm work gloves, reinforced fingers. Sizes S–XL.', inStock: true },
    { id: 'p036', category: 'safety', emoji: '👢', name: 'Safety Boots (Steel Toe)',   price: 399, description: 'SABS-approved steel-toe safety boots with anti-slip sole. Sizes 5–12.', inStock: true },
  ];

  /* ── Category labels map ─────────────────────────────────────────────────── */
  const CATEGORY_LABELS = {
    'building-materials': 'Building Materials',
    'builders-tools':     "Builders' Tools",
    'paint-supplies':     'Paint & Supplies',
    'plumbing':           'Plumbing',
    'electrical':         'Electrical',
    'garden-outdoor':     'Garden & Outdoor',
    'safety':             'Safety & PPE',
    'fasteners':          'Fasteners & Fixings',
  };

  /* ── Public API ──────────────────────────────────────────────────────────── */

  /** Return current catalogue (array of product objects). */
  function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    // First visit — seed with defaults
    save(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS.slice();
  }

  /** Persist the full catalogue array. */
  function save(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  /** Get a single product by id. */
  function getById(id) {
    return getAll().find(p => p.id === id) || null;
  }

  /** Add a new product. Returns the new product. */
  function add(product) {
    const products = getAll();
    const newProduct = {
      id:          'p' + Date.now(),
      category:    product.category    || 'building-materials',
      emoji:       product.emoji       || '📦',
      name:        (product.name       || '').trim(),
      price:       parseFloat(product.price) || 0,
      description: (product.description || '').trim(),
      inStock:     product.inStock !== false,
    };
    products.push(newProduct);
    save(products);
    return newProduct;
  }

  /** Update fields on an existing product. Returns updated product or null. */
  function update(id, fields) {
    const products = getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...fields };
    // Ensure price is always a number
    products[idx].price = parseFloat(products[idx].price) || 0;
    save(products);
    return products[idx];
  }

  /** Remove a product by id. Returns true if removed. */
  function remove(id) {
    const products = getAll();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    save(filtered);
    return true;
  }

  /** Reset catalogue back to factory defaults. */
  function reset() {
    save(DEFAULT_PRODUCTS);
  }

  /** Expose category labels for UI rendering. */
  function getCategoryLabel(key) {
    return CATEGORY_LABELS[key] || key;
  }

  function getAllCategories() {
    return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }));
  }

  return { getAll, save, getById, add, update, remove, reset, getCategoryLabel, getAllCategories };
})();
