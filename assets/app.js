/* Mavs Airsoft — demo shop logic (vanilla JS, no build step).
 * Data: window.PRODUCTS (assets/products.js)
 * Storage: localStorage (demo only — the real system uses PHP + MySQL).
 */
(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const peso = n => '₱' + Number(n).toLocaleString('en-PH');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mavs_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('mavs_' + k, JSON.stringify(v)); } catch { /* storage blocked */ } }
  };
  const img = (id, w = 400) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const imgAlt = (id, w = 400) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#141512"/><text x="200" y="158" text-anchor="middle" font-family="Arial" font-size="18" fill="#555">No photo</text></svg>');

  // Image fallback: Drive thumbnail → googleusercontent → placeholder
  window.__imgFail = el => {
    const id = el.dataset.id, w = el.dataset.w || 400;
    if (!el.dataset.tried) { el.dataset.tried = 1; el.src = imgAlt(id, w); }
    else { el.onerror = null; el.src = PLACEHOLDER; }
  };
  const imgTag = (p, w = 400, cls = '') =>
    `<img class="${cls}" src="${img(p.img, w)}" data-id="${p.img}" data-w="${w}" alt="${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" onload="this.parentElement.classList.remove('loading')" onerror="__imgFail(this)">`;

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg || 'Copied!'); }
    catch { toast('Copy blocked by the browser — select the text and copy manually.'); }
  }

  // ---------- data ----------
  const stockOverride = store.get('stock', {});           // admin "sold out / available" toggles
  const PRODUCTS = window.PRODUCTS.map(p => ({ ...p, s: p.id in stockOverride ? stockOverride[p.id] : p.s }));
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const inStock = p => p.s && p.p != null;

  const CAT_ORDER = ['New Arrivals', 'AEG Rifles', 'GBB Pistols', 'GBB Rifles', 'Sniper Rifles', 'CO2 Guns', 'Budget Units', 'Spring Pistols',
    'Inventory Sale', 'Accessories', 'AEG Parts', 'GBB Parts', 'Sniper Parts', 'HPA', 'Batteries', 'BBs & Gas', 'Conversion Kits', 'Tactical Gear'];

  const state = { cat: 'All', q: '', brand: '', min: '', max: '', stock: false, sort: 'featured', limit: 24 };

  // ---------- cart ----------
  let cart = store.get('cart', []); // [{id, qty}]
  const saveCart = () => { store.set('cart', cart); renderCartCount(); };
  const cartTotal = () => cart.reduce((s, c) => s + (byId[c.id]?.p || 0) * c.qty, 0);
  function addToCart(id, qty = 1) {
    const p = byId[id];
    if (!p || !inStock(p)) return toast('Sorry, sold out.');
    const line = cart.find(c => c.id === id);
    line ? line.qty = Math.min(line.qty + qty, 20) : cart.push({ id, qty });
    saveCart(); toast(`Added: ${p.n}`);
    const cc = $('#cartCount'); cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump');
  }
  function renderCartCount() { $('#cartCount').textContent = cart.reduce((s, c) => s + c.qty, 0); }

  function renderCart() {
    const box = $('#cartItems');
    if (!cart.length) { box.innerHTML = '<p class="muted center" style="padding:40px 0">Empty pa ang cart mo.</p>'; }
    else box.innerHTML = cart.map(c => {
      const p = byId[c.id];
      return `<div class="ci">
        <div class="thumb loading" style="aspect-ratio:auto">${imgTag(p, 200)}</div>
        <div><div class="ci-name">${esc(p.n)}</div><div class="ci-price">${peso(p.p)} each</div>
          <button class="ci-rm" data-rm="${p.id}">Remove</button></div>
        <div class="qty"><button data-dec="${p.id}" aria-label="Decrease">−</button><span>${c.qty}</span><button data-inc="${p.id}" aria-label="Increase">+</button></div>
      </div>`;
    }).join('');
    $('#cartSub').textContent = peso(cartTotal());
    $('#goCheckout').disabled = !cart.length;
  }
  $('#cartItems').addEventListener('click', e => {
    const t = e.target, id = +(t.dataset.rm || t.dataset.dec || t.dataset.inc);
    if (!id) return;
    const line = cart.find(c => c.id === id);
    if (t.dataset.rm) cart = cart.filter(c => c.id !== id);
    if (t.dataset.inc) line.qty = Math.min(line.qty + 1, 20);
    if (t.dataset.dec) { line.qty--; if (line.qty < 1) cart = cart.filter(c => c.id !== id); }
    saveCart(); renderCart();
  });
  const openCart = () => { renderCart(); $('#drawer').hidden = false; };
  const closeCart = () => { $('#drawer').hidden = true; };
  $('#cartBtn').onclick = openCart;
  $$('[data-close-cart]').forEach(b => b.onclick = closeCart);
  $('#goCheckout').onclick = () => { closeCart(); location.hash = 'checkout'; };

  // ---------- shop ----------
  function filtered() {
    const q = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = PRODUCTS.filter(p => {
      if (state.cat === 'New Arrivals' ? !p.new : state.cat !== 'All' && p.c !== state.cat) return false;
      if (state.brand && p.b !== state.brand) return false;
      if (state.stock && !inStock(p)) return false;
      if (state.min !== '' && (p.p ?? 0) < +state.min) return false;
      if (state.max !== '' && (p.p ?? Infinity) > +state.max) return false;
      if (q.length) { const hay = `${p.n} ${p.b} ${p.c} ${describeProduct(p).tag}`.toLowerCase(); if (!q.every(w => hay.includes(w))) return false; }
      return true;
    });
    const priceKey = p => p.p ?? Infinity;
    if (state.sort === 'low') list.sort((a, b) => priceKey(a) - priceKey(b));
    if (state.sort === 'high') list.sort((a, b) => (b.p ?? -1) - (a.p ?? -1));
    if (state.sort === 'az') list.sort((a, b) => a.n.localeCompare(b.n));
    if (state.sort === 'featured') list.sort((a, b) => inStock(b) - inStock(a)); // sold-out items last
    return list;
  }

  function card(p) {
    const out = !inStock(p);
    return `<article class="card ${out ? 'out' : ''}" data-open="${p.id}">
      <div class="thumb loading">${imgTag(p)}
        <div class="badges">${p.new ? '<span class="badge b-new">New</span>' : ''}${p.sale ? '<span class="badge b-sale">Sale</span>' : ''}${out ? '<span class="badge b-out">Sold out</span>' : ''}</div>
      </div>
      <div class="card-body">
        <span class="brand">${esc(p.b || p.c)}</span>
        <span class="pname">${esc(p.n)}</span>
        <span class="ptag">${esc(describeProduct(p).tag)}</span>
        <span class="price ${p.p == null ? 'na' : ''}">${p.p == null ? 'Ask for price' : peso(p.p)}</span>
      </div>
      <div class="card-act"><button class="btn ${out ? 'btn-ghost' : 'btn-red'} btn-sm" data-add="${p.id}" ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to cart'}</button></div>
    </article>`;
  }

  function renderShop() {
    const list = filtered();
    $('#grid').innerHTML = list.length ? list.slice(0, state.limit).map(card).join('')
      : `<div class="empty">Walang nahanap para sa “${esc(state.q)}”.<br>Try ibang keyword o i-reset ang filters.</div>`;
    $('#resultTitle').textContent = state.q ? `Results for “${state.q}”` : state.cat === 'All' ? 'All products' : state.cat;
    $('#resultCount').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
    $('#loadMore').hidden = list.length <= state.limit;
    $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === state.cat));
    const n = [state.brand, state.min, state.max, state.stock, state.sort !== 'featured'].filter(Boolean).length;
    $('#filterCount').textContent = n ? `(${n})` : '';
  }

  function renderChips() {
    const counts = {};
    PRODUCTS.forEach(p => { counts[p.c] = (counts[p.c] || 0) + 1; if (p.new) counts['New Arrivals'] = (counts['New Arrivals'] || 0) + 1; });
    const cats = ['All', ...CAT_ORDER.filter(c => counts[c])];
    $('#chips').innerHTML = cats.map(c => `<button class="chip" role="tab" data-cat="${esc(c)}">${esc(c)}<small>${c === 'All' ? PRODUCTS.length : counts[c]}</small></button>`).join('');
  }
  function renderBrands() {
    const brands = [...new Set(PRODUCTS.map(p => p.b).filter(Boolean))].sort();
    $('#fBrand').insertAdjacentHTML('beforeend', brands.map(b => `<option>${esc(b)}</option>`).join(''));
    $('#statBrands').textContent = new Set(PRODUCTS.map(p => p.c)).size;
    $('#statItems').textContent = PRODUCTS.length;
  }

  function setCat(cat) {
    state.cat = cat; state.limit = 24; renderShop();
    if (location.hash !== '#shop' && location.hash !== '') location.hash = 'shop';
    $('#chips').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]'); if (chip) return setCat(chip.dataset.cat);
    const add = e.target.closest('[data-add]'); if (add) { e.stopPropagation(); return addToCart(+add.dataset.add); }
    const open = e.target.closest('[data-open]'); if (open) return openProduct(+open.dataset.open);
  });

  let searchT;
  $('#search').addEventListener('input', e => {
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      state.q = e.target.value; state.limit = 24;
      if (state.q && state.cat !== 'All') state.cat = 'All';
      if (location.hash && location.hash !== '#shop') location.hash = 'shop';
      renderShop();
    }, 180);
  });
  $('#fBrand').onchange = e => { state.brand = e.target.value; renderShop(); };
  $('#fMin').oninput = e => { state.min = e.target.value; renderShop(); };
  $('#fMax').oninput = e => { state.max = e.target.value; renderShop(); };
  $('#fStock').onchange = e => { state.stock = e.target.checked; renderShop(); };
  $('#fSort').onchange = e => { state.sort = e.target.value; renderShop(); };
  $('#fReset').onclick = () => {
    Object.assign(state, { cat: 'All', q: '', brand: '', min: '', max: '', stock: false, sort: 'featured', limit: 24 });
    $('#search').value = ''; $('#fBrand').value = ''; $('#fMin').value = ''; $('#fMax').value = ''; $('#fStock').checked = false; $('#fSort').value = 'featured';
    renderShop();
  };
  $('#filtersToggle').onclick = () => {
    const open = $('#filters').classList.toggle('open');
    $('#filtersToggle').setAttribute('aria-expanded', open);
  };
  $('#loadMore').onclick = () => { state.limit += 24; renderShop(); };

  // ---------- product modal ----------
  let modalP = null, modalQty = 1;
  function openProduct(id) {
    const p = byId[id]; if (!p) return;
    modalP = p; modalQty = 1;
    viewer.load(p);
    renderDesc(p);
    $('#mBrand').textContent = p.b || p.c;
    $('#mName').textContent = p.n;
    $('#mPrice').textContent = p.p == null ? 'Ask for price' : peso(p.p);
    $('#mCat').textContent = p.c;
    const ok = inStock(p);
    $('#mStock').textContent = ok ? '● In stock — ready for order' : '● Sold out — message Mavs for restock';
    $('#mStock').className = 'stock ' + (ok ? 'ok' : 'no');
    $('#mAdd').disabled = !ok; $('#mQty').textContent = 1;
    const rel = PRODUCTS.filter(x => x.id !== p.id && x.b && x.b === p.b).slice(0, 6);
    $('#mRelated').innerHTML = rel.length ? rel.map(r => `<div class="rel" data-open="${r.id}">${imgTag(r, 300)}<div>${esc(r.n)}</div></div>`).join('') : '<p class="muted small">—</p>';
    $('.rel-title').hidden = !rel.length;
    $('#modal').hidden = false; document.body.style.overflow = 'hidden';
    $('.modal-card').scrollTop = 0;
  }
  const closeModal = () => { $('#modal').hidden = true; document.body.style.overflow = ''; viewer.stop(); };

  // ---------- description panel ----------
  function renderDesc(p) {
    const d = describeProduct(p);
    $('#mDesc').innerHTML = `
      <h4 class="desc-tag">${esc(d.tag)}</h4>
      <p>${esc(d.text)}</p>
      ${d.points.length ? `<ul class="desc-points">${d.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${d.brand ? `<p class="desc-brand"><b>About ${esc(p.b)}:</b> ${esc(d.brand)}</p>` : ''}
      <p class="desc-note">${d.specific ? 'Based on the manufacturer\'s published features.' : 'General overview.'} Exact FPS and specs can vary per unit/version, so confirm with Mavs before buying.</p>`;
  }

  // ---------- image viewer: zoom, pan, auto-motion, optional 360° ----------
  // 360°: if a product has  spin: ['driveId1', 'driveId2', ...]  (24–36 turntable photos),
  // dragging left/right rotates through the frames. Without it, drag pans the zoomed photo.
  const viewer = (() => {
    const stage = $('#vStage'), im = $('#mImg');
    let s = 1, x = 0, y = 0, frames = null, frame = 0, motion = null, pointers = new Map(), last = null, pinch0 = null;
    const apply = () => { im.style.transform = `translate(${x}px, ${y}px) scale(${s})`; };
    const clamp = () => {
      const r = stage.getBoundingClientRect(), mx = (r.width * (s - 1)) / 2, my = (r.height * (s - 1)) / 2;
      x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
    };
    const zoom = (f) => { s = Math.max(1, Math.min(4, s * f)); if (s === 1) { x = 0; y = 0; } clamp(); apply(); };
    const reset = () => { s = 1; x = 0; y = 0; apply(); };
    const setSrc = (id) => { im.dataset.id = id; im.dataset.w = 1200; delete im.dataset.tried; im.onerror = () => __imgFail(im); im.src = img(id, 1200); };
    function stop() { if (motion) cancelAnimationFrame(motion); motion = null; $('#vMotion').setAttribute('aria-pressed', 'false'); $('#vMotion').textContent = '▶ Motion'; }
    function start() {
      stop(); $('#vMotion').setAttribute('aria-pressed', 'true'); $('#vMotion').textContent = '❚❚ Motion';
      const t0 = performance.now();
      const tick = (t) => {
        const k = (t - t0) / 1000;
        if (frames) { frame = Math.floor(k * 10) % frames.length; setSrc(frames[frame]); }
        else { s = 1.6; const r = stage.getBoundingClientRect(); x = Math.sin(k * 0.6) * r.width * 0.3; y = Math.sin(k * 0.9) * r.height * 0.12; clamp(); apply(); }
        motion = requestAnimationFrame(tick);
      };
      motion = requestAnimationFrame(tick);
    }
    function load(p) {
      stop(); reset(); frames = Array.isArray(p.spin) && p.spin.length > 1 ? p.spin : null; frame = 0;
      setSrc(frames ? frames[0] : p.img); im.alt = p.n;
      $('#v360').hidden = !frames;
      $('#vHint').textContent = frames ? 'Drag left/right to rotate 360° · scroll or pinch to zoom' : 'Scroll or pinch to zoom · drag to look around · double-click to zoom';
    }
    stage.addEventListener('wheel', e => { e.preventDefault(); stop(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    stage.addEventListener('dblclick', () => { stop(); s > 1 ? reset() : zoom(2.2); });
    stage.addEventListener('pointerdown', e => { stop(); stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY];
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = [Math.hypot(a[0] - b[0], a[1] - b[1]), s]; } });
    stage.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2 && pinch0) { const [a, b] = [...pointers.values()]; s = Math.max(1, Math.min(4, pinch0[1] * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0[0])); clamp(); apply(); return; }
      const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY];
      if (frames && s === 1) { if (Math.abs(dx) >= 1) { frame = (frame + (dx > 0 ? -1 : 1) + frames.length) % frames.length; setSrc(frames[frame]); } return; }
      if (s > 1) { x += dx; y += dy; clamp(); apply(); }
    });
    const up = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    $('#vIn').onclick = () => { stop(); zoom(1.4); };
    $('#vOut').onclick = () => { stop(); zoom(1 / 1.4); };
    $('#vReset').onclick = () => { stop(); reset(); };
    $('#vMotion').onclick = () => { motion ? (stop(), reset()) : start(); };
    return { load, stop };
  })();
  $$('[data-close]').forEach(b => b.onclick = closeModal);
  $('#mPlus').onclick = () => { modalQty = Math.min(modalQty + 1, 20); $('#mQty').textContent = modalQty; };
  $('#mMinus').onclick = () => { modalQty = Math.max(modalQty - 1, 1); $('#mQty').textContent = modalQty; };
  $('#mAdd').onclick = () => { addToCart(modalP.id, modalQty); closeModal(); };
  $('#mAsk').onclick = () => copy(`Hi Boss Mavs! Available pa po ba ang ${modalP.n}${modalP.p ? ` (${peso(modalP.p)})` : ''}? Salamat po!`, 'Inquiry copied — paste it in Messenger.');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); } });

  // ---------- checkout ----------
  const radio = n => $(`input[name="${n}"]:checked`).value;
  function syncCheckout() {
    const pickup = radio('delivery') === 'Store pickup';
    $('#addrWrap').hidden = pickup;
    const cop = $('input[value="Cash on pickup"]');
    cop.closest('.opt').classList.toggle('disabled', !pickup);
    if (!pickup && cop.checked) $('input[value="GCash"]').checked = true;
    $('#sumShip').textContent = pickup ? 'Free (pickup)' : 'To be quoted';
  }
  function renderSummary() {
    $('#sumItems').innerHTML = cart.map(c => { const p = byId[c.id]; return `<div class="s-item"><span>${c.qty}× ${esc(p.n)}</span><b>${peso(p.p * c.qty)}</b></div>`; }).join('');
    $('#sumSub').textContent = $('#sumTotal').textContent = peso(cartTotal());
    syncCheckout();
  }
  $$('input[name="delivery"]').forEach(r => r.onchange = syncCheckout);

  $('#checkoutForm').addEventListener('input', e => e.target.classList.remove('is-invalid'));
  const PH_MOBILE = /^(09|\+639)\d{9}$/;
  $('#checkoutForm').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#formError'); err.textContent = '';
    $$('.is-invalid').forEach(x => x.classList.remove('is-invalid'));
    const name = $('#cName').value.trim(), phone = $('#cPhone').value.replace(/[\s-]/g, ''), addr = $('#cAddr').value.trim();
    const pickup = radio('delivery') === 'Store pickup';
    const bad = [];
    if (name.length < 3) bad.push($('#cName'));
    if (!PH_MOBILE.test(phone)) bad.push($('#cPhone'));
    if (!pickup && addr.length < 10) bad.push($('#cAddr'));
    if (bad.length) { bad.forEach(x => x.classList.add('is-invalid')); bad[0].focus(); err.textContent = 'Paki-check ang mga field na naka-pula (valid name, 11-digit mobile, at address kung ipapadala).'; return; }
    if (!$('#cAgree').checked) { err.textContent = 'Please confirm the age / valid ID requirement.'; return; }
    if (!cart.length) { err.textContent = 'Empty ang cart.'; return; }

    const d = new Date();
    const no = `MAVS-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = {
      no, date: d.toISOString(), name, phone, fb: $('#cFb').value.trim(), delivery: radio('delivery'), address: pickup ? '' : addr,
      payment: radio('payment'), notes: $('#cNotes').value.trim(), status: 0,
      items: cart.map(c => ({ id: c.id, n: byId[c.id].n, p: byId[c.id].p, qty: c.qty })), total: cartTotal()
    };
    const orders = store.get('orders', []); orders.unshift(order); store.set('orders', orders);
    cart = []; saveCart(); e.target.reset(); syncCheckout();
    showDone(order);
  });

  function orderText(o) {
    const lines = [`ORDER ${o.no}`, `Name: ${o.name}`, `Mobile: ${o.phone}`];
    if (o.fb) lines.push(`FB: ${o.fb}`);
    lines.push('', ...o.items.map(i => `• ${i.qty}× ${i.n} — ${peso(i.p * i.qty)}`), '',
      `Subtotal: ${peso(o.total)}`, `Delivery: ${o.delivery}${o.address ? ' — ' + o.address : ''}`, `Payment: ${o.payment}`);
    if (o.notes) lines.push(`Notes: ${o.notes}`);
    return lines.join('\n');
  }
  let lastOrder = null;
  function showDone(o) {
    lastOrder = o;
    $('#doneNo').textContent = o.no;
    $('#doneText').textContent = orderText(o);
    location.hash = 'done';
  }
  $('#copyOrder').onclick = () => lastOrder && copy(orderText(lastOrder), 'Order copied — paste it to Mavs on Messenger.');
  $('#doneTrack').onclick = () => { if (lastOrder) setTimeout(() => { $('#tNo').value = lastOrder.no; $('#tPhone').value = lastOrder.phone; doTrack(); }, 0); };

  // ---------- tracking ----------
  const STATUSES = ['Pending', 'Confirmed', 'Paid', 'Packed', 'Shipped / Ready', 'Completed'];
  const SAMPLE = [
    { no: 'MAVS-DEMO-0001', sample: true, date: new Date(Date.now() - 864e5 * 2).toISOString(), name: 'Juan Dela Cruz', phone: '09171234567', delivery: 'LBC', address: 'Brgy. San Jose, Pagadian City', payment: 'GCash', status: 4, notes: '', items: [{ id: 1, n: 'TRIDENT MKII SPR M', p: 22000, qty: 1 }], total: 22000 },
    { no: 'MAVS-DEMO-0002', sample: true, date: new Date(Date.now() - 864e5).toISOString(), name: 'Mark Santos', phone: '09281112222', delivery: 'Store pickup', address: '', payment: 'Cash on pickup', status: 1, notes: 'Black color please', items: [{ id: 0, n: 'BUSHIDO 0.25 BB', p: 650, qty: 2 }], total: 1300 },
    { no: 'MAVS-DEMO-0003', sample: true, date: new Date().toISOString(), name: 'Ana Reyes', phone: '09998887777', delivery: 'J&T Express', address: 'Ozamiz City', payment: 'Bank transfer', status: 0, notes: '', items: [{ id: 0, n: 'TM 5.1 HICAPA', p: 10000, qty: 1 }], total: 10000 }
  ];
  const allOrders = () => [...store.get('orders', []), ...SAMPLE.map(s => ({ ...s, status: store.get('sampleStatus', {})[s.no] ?? s.status }))];

  function doTrack() {
    const no = $('#tNo').value.trim().toUpperCase(), ph = $('#tPhone').value.replace(/[\s-]/g, '');
    const o = allOrders().find(x => x.no === no && x.phone === ph);
    const box = $('#trackResult');
    if (!o) { box.innerHTML = '<div class="track-card"><b>Walang order na tugma.</b><p class="muted small">Check the order number and the mobile number you used.</p></div>'; return; }
    box.innerHTML = `<div class="track-card">
      <div class="track-head"><div><p class="eyebrow">Order</p><h3 class="mono">${esc(o.no)}</h3></div>
        <div><span class="pill">${esc(STATUSES[o.status])}</span></div></div>
      <div class="timeline">${STATUSES.map((s, i) => `<div class="step ${i < o.status ? 'done' : i === o.status ? 'current' : ''}"><i></i>${s}</div>`).join('')}</div>
      ${o.items.map(i => `<div class="s-item"><span>${i.qty}× ${esc(i.n)}</span><b>${peso(i.p * i.qty)}</b></div>`).join('')}
      <div class="sum-line total"><span>Total</span><b>${peso(o.total)}</b></div>
      <p class="muted small">${esc(o.delivery)} · ${esc(o.payment)} · placed ${new Date(o.date).toLocaleString('en-PH')}</p>
    </div>`;
  }
  $('#trackForm').addEventListener('submit', e => { e.preventDefault(); doTrack(); });
  $('#tryDemo').onclick = () => { $('#tNo').value = 'MAVS-DEMO-0001'; $('#tPhone').value = '09171234567'; doTrack(); };

  // ---------- admin preview ----------
  function renderAdmin() {
    const orders = allOrders();
    const pending = orders.filter(o => o.status === 0).length;
    const revenue = orders.filter(o => o.status >= 2).reduce((s, o) => s + o.total, 0);
    const sold = PRODUCTS.filter(p => !inStock(p)).length;
    $('#kpis').innerHTML = [
      [orders.length, 'Total orders'], [pending, 'Waiting for confirmation'], [peso(revenue), 'Paid sales'], [sold, 'Items marked sold out']
    ].map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join('');

    $('#adminOrders').innerHTML = `<table><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Delivery / Payment</th><th>Status</th></tr></thead><tbody>
      ${orders.map(o => `<tr>
        <td class="mono">${esc(o.no)}${o.sample ? ' <span class="pill">sample</span>' : ''}<br><span class="muted small">${new Date(o.date).toLocaleDateString('en-PH')}</span></td>
        <td>${esc(o.name)}<br><span class="muted small">${esc(o.phone)}</span></td>
        <td>${o.items.map(i => `${i.qty}× ${esc(i.n)}`).join('<br>')}</td>
        <td><b>${peso(o.total)}</b></td>
        <td>${esc(o.delivery)}<br><span class="muted small">${esc(o.payment)}</span></td>
        <td><select data-order="${esc(o.no)}">${STATUSES.map((s, i) => `<option value="${i}" ${i === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      </tr>`).join('')}</tbody></table>`;
    renderStockTable();
  }
  $('#adminOrders').addEventListener('change', e => {
    const no = e.target.dataset.order; if (!no) return;
    const v = +e.target.value;
    if (no.startsWith('MAVS-DEMO')) { const m = store.get('sampleStatus', {}); m[no] = v; store.set('sampleStatus', m); }
    else { const os = store.get('orders', []); const o = os.find(x => x.no === no); if (o) o.status = v; store.set('orders', os); }
    toast(`${no} → ${STATUSES[v]}`); renderAdmin();
  });
  function renderStockTable() {
    const q = $('#stockSearch').value.trim().toLowerCase();
    const list = PRODUCTS.filter(p => p.p != null && (!q || `${p.n} ${p.b}`.toLowerCase().includes(q))).slice(0, 60);
    $('#stockTable').innerHTML = `<table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Available</th></tr></thead><tbody>
      ${list.map(p => `<tr><td>${esc(p.n)}<br><span class="muted small">${esc(p.b)}</span></td><td>${esc(p.c)}</td><td>${peso(p.p)}</td>
      <td><label class="switch"><input type="checkbox" data-stock="${p.id}" ${p.s ? 'checked' : ''}> ${p.s ? 'In stock' : 'Sold out'}</label></td></tr>`).join('')}
      </tbody></table>${list.length === 60 ? '<p class="muted small" style="padding:8px 12px">Showing first 60 — search to narrow down.</p>' : ''}`;
  }
  $('#stockSearch').addEventListener('input', renderStockTable);
  $('#stockTable').addEventListener('change', e => {
    const id = +e.target.dataset.stock; if (!id) return;
    byId[id].s = e.target.checked; stockOverride[id] = e.target.checked; store.set('stock', stockOverride);
    toast(`${byId[id].n}: ${e.target.checked ? 'available' : 'sold out'}`); renderAdmin(); renderShop();
  });
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.toggle('active', x === t));
    $('#adminOrders').hidden = t.dataset.tab !== 'orders';
    $('#adminStock').hidden = t.dataset.tab !== 'stock';
  });

  // ---------- router ----------
  const VIEWS = ['shop', 'checkout', 'done', 'track', 'admin'];
  function route() {
    let v = location.hash.slice(1) || 'shop';
    if (!VIEWS.includes(v)) v = 'shop';
    if (v === 'checkout' && !cart.length) { v = 'shop'; history.replaceState(null, '', '#shop'); toast('Add items to your cart first.'); }
    if (v === 'done' && !lastOrder) v = 'shop';
    VIEWS.forEach(x => $('#view-' + x).hidden = x !== v);
    if (v === 'checkout') renderSummary();
    if (v === 'admin') renderAdmin();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- demo bar ----------
  if (store.get('demoClosed', false)) $('#demoBar').hidden = true;
  $('#demoClose').onclick = () => { $('#demoBar').hidden = true; store.set('demoClosed', true); };

  // ---------- init ----------
  renderChips(); renderBrands(); renderShop(); renderCartCount(); syncCheckout(); route();
})();
