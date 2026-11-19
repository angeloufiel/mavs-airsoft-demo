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
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f2f3f5"/><text x="200" y="158" text-anchor="middle" font-family="Arial" font-size="18" fill="#9aa1a8">No photo</text></svg>');

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
  // ---------- inventory (stock quantities) ----------
  // Demo quantities are generated (sold-out items = 0). In the real system Mavs enters the actual counts.
  const qtyStore = store.get('qty', {});
  const seed = id => { let h = Math.imul(id, 2654435761) >>> 0; h = (h ^ (h >>> 13)) >>> 0; return h % 100; };
  const baseQty = p => (!p.s || p.p == null) ? 0 : p.id === 1 ? 4 : (r => r < 12 ? 1 + (r % 3) : 4 + (r % 12))(seed(p.id));
  const PRODUCTS = window.PRODUCTS.map(p => ({ ...p, q: p.id in qtyStore ? qtyStore[p.id] : baseQty(p) }));
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const inv = Object.assign({ low: 3 }, store.get('inv', {}));         // low-stock threshold
  const inStock = p => p.q > 0 && p.p != null;
  const isLow = p => inStock(p) && p.q <= inv.low;
  const invLog = store.get('invlog', []);                               // stock movement history
  const alerts = store.get('alerts', []);                               // low / out-of-stock alerts

  function pushAlert(type, p) {
    const msg = type === 'out' ? `${p.n} is now OUT OF STOCK` : `${p.n} is running low: ${p.q} left`;
    alerts.unshift({ t: Date.now(), id: p.id, type, msg, read: false });
    alerts.length = Math.min(alerts.length, 50); store.set('alerts', alerts);
    toast('🔔 ' + msg);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Mavs Airsoft · Inventory', { body: msg }); } catch { /* not supported */ }
    renderBell();
  }
  function setQty(p, q, reason) {
    const before = p.q; p.q = Math.max(0, Math.min(9999, Math.round(q) || 0));
    if (p.q === before) return;
    qtyStore[p.id] = p.q; store.set('qty', qtyStore);
    invLog.unshift({ t: Date.now(), id: p.id, from: before, to: p.q, reason });
    invLog.length = Math.min(invLog.length, 100); store.set('invlog', invLog);
    if (before > 0 && p.q === 0) pushAlert('out', p);
    else if (p.q > 0 && p.q <= inv.low && before > inv.low) pushAlert('low', p);
  }

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
    const have = line ? line.qty : 0;
    if (have + qty > p.q) { if (have >= p.q) return toast(`Only ${p.q} available, already in your cart.`); qty = p.q - have; toast(`Only ${p.q} available, added the rest.`); }
    line ? line.qty = have + qty : cart.push({ id, qty });
    saveCart(); toast(`Added: ${p.n}`);
    const cc = $('#cartCount'); cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump');
  }
  function renderCartCount() { $('#cartCount').textContent = cart.reduce((s, c) => s + c.qty, 0); $('#hdrTotal').textContent = peso(cartTotal()); }

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
    if (t.dataset.inc) { if (line.qty >= byId[id].q) toast(`Only ${byId[id].q} available.`); else line.qty++; }
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
        <div class="badges">${videosFor(p).length ? '<span class="badge b-vid">▶ Video</span>' : ''}${p.new ? '<span class="badge b-new">New</span>' : ''}${p.sale ? '<span class="badge b-sale">Sale</span>' : ''}${out ? '<span class="badge b-out">Sold out</span>' : isLow(p) ? `<span class="badge b-low">Only ${p.q} left</span>` : ''}</div>
      </div>
      <div class="card-body">
        <span class="brand">${esc(p.b || p.c)}</span>
        <span class="pname">${esc(p.n)}</span>
        <span class="ptag">${esc(describeProduct(p).tag)}</span>
        <span class="price ${p.p == null ? 'na' : ''}">${p.p == null ? 'Ask for price' : peso(p.p)}</span>
        <span class="cstock ${out ? 'no' : isLow(p) ? 'low' : 'ok'}">${out ? 'Out of stock' : isLow(p) ? `Only ${p.q} left` : 'In stock'}</span>
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
    $$('.cat-item, .cn-btn').forEach(c => c.classList.toggle('active', c.dataset.cat === state.cat));
    $('#crumbCat').textContent = state.q ? `Search: “${state.q}”` : state.cat === 'All' ? 'All products' : state.cat;
    const n = [state.brand, state.min, state.max, state.stock, state.sort !== 'featured'].filter(Boolean).length;
    $('#filterCount').textContent = n ? `(${n})` : '';
  }

  function renderChips() {
    const counts = {};
    PRODUCTS.forEach(p => { counts[p.c] = (counts[p.c] || 0) + 1; if (p.new) counts['New Arrivals'] = (counts['New Arrivals'] || 0) + 1; });
    const cats = ['All', ...CAT_ORDER.filter(c => counts[c])];
    $('#chips').innerHTML = cats.map(c => `<button class="cat-item" role="tab" data-cat="${esc(c)}"><span>${esc(c)}</span><small>${c === 'All' ? PRODUCTS.length : counts[c]}</small></button>`).join('');
    const NAV = ['All', 'New Arrivals', 'AEG Rifles', 'GBB Pistols', 'GBB Rifles', 'Sniper Rifles', 'CO2 Guns', 'Accessories', 'AEG Parts', 'GBB Parts', 'HPA', 'BBs & Gas', 'Tactical Gear', 'Inventory Sale'].filter(c => c === 'All' || counts[c]);
    $('#catNav').innerHTML = NAV.map(c => `<button class="cn-btn ${c === 'Inventory Sale' ? 'cn-sale' : c === 'New Arrivals' ? 'cn-new' : ''}" data-cat="${esc(c)}">${c === 'All' ? '☰ All products' : esc(c)}</button>`).join('');
    const TILES = ['AEG Rifles', 'GBB Pistols', 'GBB Rifles', 'Sniper Rifles', 'Accessories', 'AEG Parts', 'Tactical Gear', 'BBs & Gas', 'HPA', 'CO2 Guns', 'Batteries', 'GBB Parts'].filter(c => counts[c]);
    $('#catTiles').innerHTML = TILES.map(c => {
      const p = PRODUCTS.find(x => x.c === c && inStock(x)) || PRODUCTS.find(x => x.c === c);
      return `<button class="ctile" data-cat="${esc(c)}"><span class="ctile-img loading">${imgTag(p, 400)}</span><b>${esc(c)}</b><small>${counts[c]} items</small></button>`;
    }).join('');
  }
  function renderBrands() {
    const brands = [...new Set(PRODUCTS.map(p => p.b).filter(Boolean))].sort();
    $('#fBrand').insertAdjacentHTML('beforeend', brands.map(b => `<option>${esc(b)}</option>`).join(''));
    $('#statBrands').textContent = new Set(PRODUCTS.map(p => p.c)).size;
    $('#statItems').textContent = PRODUCTS.length;
  }

  function setCat(cat) {
    state.cat = cat; state.limit = 24; renderShop();
    if (location.hash !== '#shop' && location.hash !== '') { location.hash = 'shop'; }
    $('#filters').classList.remove('open');
    setTimeout(() => $('#shopTop').scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
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
  function openProduct(id) { if (byId[id]) location.hash = 'product-' + id; }
  function renderProduct(id) {
    const p = byId[id]; if (!p) return false;
    modalP = p; modalQty = 1;
    viewer.load(p);
    renderDesc(p);
    const vids = videosFor(p);
    gallery.set(p, vids);
    $('#mSpecs').innerHTML = specSheetHTML(p, { brand: p.b });
    $('#ptabVideos').hidden = !vids.length;
    $('#ptabVideos').textContent = `Videos (${vids.length})`;
    $('#mVideos').innerHTML = vids.length ? `<p class="muted small">Watch Mavs Airsoft's own review${vids.length > 1 ? 's' : ''} related to this item:</p><div class="m-vlist">${vids.map(v => vidCard(v, 0)).join('')}</div>` : '';
    setPtab('desc');
    $('#pId').textContent = 'MAVS-' + String(p.id).padStart(4, '0');
    $('#mBrand').href = '#shop'; $('#mBrand').dataset.cat = p.c;
    $('#pCrumbs').innerHTML = `<a href="#shop" data-cat="All">Home</a> <span>›</span> <a href="#shop" data-cat="${esc(p.c)}">${esc(p.c)}</a> <span>›</span> <b>${esc(p.n)}</b>`;
    $('#mBrand').textContent = p.b || p.c;
    $('#mName').textContent = p.n;
    $('#mPrice').textContent = p.p == null ? 'Ask for price' : peso(p.p);
    $('#mCat').textContent = p.c;
    const ok = inStock(p);
    $('#mStock').textContent = !ok ? '● Sold out — message Mavs for restock' : isLow(p) ? `● Only ${p.q} left — order soon` : `● In stock — ${p.q} available`;
    $('#mStock').className = 'stock ' + (!ok ? 'no' : isLow(p) ? 'low' : 'ok');
    $('#mAdd').disabled = !ok; $('#mBuy').disabled = !ok; $('#mQty').textContent = 1;
    let rel = PRODUCTS.filter(x => x.id !== p.id && x.b && x.b === p.b);
    let relTitle = `More from ${p.b}`;
    if (rel.length < 2) { rel = PRODUCTS.filter(x => x.id !== p.id && x.c === p.c); relTitle = `More ${p.c}`; }
    rel = rel.sort((a, b) => inStock(b) - inStock(a)).slice(0, 4);
    $('#mRelated').innerHTML = rel.map(card).join('');
    $('.rel-title').textContent = relTitle;
    $('.rel-sec').hidden = !rel.length;
    return true;
  }
  const closeModal = () => viewer.stop();
  function setPtab(name) {
    $$('.ptab').forEach(t => t.classList.toggle('active', t.dataset.ptab === name));
    $$('.ptab-body').forEach(b => b.hidden = b.dataset.pbody !== name);
  }
  $$('.ptab').forEach(t => t.onclick = () => setPtab(t.dataset.ptab));

  // ---------- YouTube videos ----------
  const VIDS = window.VIDEOS || [];
  const vidById = Object.fromEntries(VIDS.map(v => [v.id, v]));
  const ytThumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const vidCard = (v, i = 9) => `<button class="yt-card" data-video="${v.id}" aria-label="Play: ${esc(v.t)}">
      <span class="yt-thumb"><img src="${ytThumb(v.id)}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" referrerpolicy="no-referrer"><span class="yt-play">▶</span></span>
      <span class="yt-title">${esc(v.t)}</span></button>`;
  function videosFor(p) {
    const key = `${p.b}|${p.c}|${p.n}`, ids = [];
    for (const [re, list] of (window.PRODUCT_VIDEOS || [])) if (re.test(key)) list.forEach(id => { if (!ids.includes(id) && vidById[id]) ids.push(id); });
    return ids.slice(0, 3).map(id => vidById[id]);
  }
  function renderVideoRow() { $('#ytRow').innerHTML = VIDS.slice(0, 10).map((v, i) => vidCard(v, i)).join(''); }
  function playVideo(id) {
    const v = vidById[id]; if (!v) return;
    $('#vFrame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="${esc(v.t)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('#vTitle').textContent = v.t;
    $('#vYt').href = `https://www.youtube.com/watch?v=${id}`;
    $('#vmodal').hidden = false;
  }
  function closeVideo() { $('#vmodal').hidden = true; $('#vFrame').innerHTML = ''; }
  $$('[data-close-video]').forEach(b => b.onclick = closeVideo);
  document.addEventListener('click', e => { const b = e.target.closest('[data-video]'); if (b) { e.stopPropagation(); playVideo(b.dataset.video); } }, true);

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
    function stop() { if (motion) cancelAnimationFrame(motion); motion = null; }
    function load(p) {
      stop(); reset(); frames = Array.isArray(p.spin) && p.spin.length > 1 ? p.spin : null; frame = 0;
      setSrc(frames ? frames[0] : p.img); im.alt = p.n;
      $('#v360').hidden = !frames;
      $('#vHint').textContent = frames ? 'Drag left/right to rotate 360° · click to open expanded view' : 'Click image to open expanded view · scroll or pinch to zoom';
    }
    function show(id) { stop(); reset(); setSrc(id); }
    stage.addEventListener('wheel', e => { e.preventDefault(); stop(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    let downAt = null, moved = 0;
    stage.addEventListener('pointerdown', e => { stop(); stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; downAt = Date.now(); moved = 0;
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = [Math.hypot(a[0] - b[0], a[1] - b[1]), s]; } });
    stage.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2 && pinch0) { const [a, b] = [...pointers.values()]; s = Math.max(1, Math.min(4, pinch0[1] * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0[0])); clamp(); apply(); return; }
      const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy);
      if (frames && s === 1) { if (Math.abs(dx) >= 1) { frame = (frame + (dx > 0 ? -1 : 1) + frames.length) % frames.length; setSrc(frames[frame]); } return; }
      if (s > 1) { x += dx; y += dy; clamp(); apply(); }
    });
    const up = e => {
      const wasSingle = pointers.size === 1 && !pinch0;
      pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null;
      if (e.type === 'pointerup' && wasSingle && moved < 6 && Date.now() - downAt < 400) gallery.open(gallery.current());
    };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    $('#vIn').onclick = () => { stop(); zoom(1.4); };
    $('#vOut').onclick = () => { stop(); zoom(1 / 1.4); };
    $('#vReset').onclick = () => { stop(); reset(); };
    $('#vExpand').onclick = () => { stop(); gallery.open(gallery.current()); };
    return { load, stop, show };
  })();

  // ---------- gallery + expanded view (lightbox) ----------
  // Slides: Mavs's own product photos (main + extra angles from his Drive) + his related YouTube videos.
  const gallery = (() => {
    let slides = [], cur = 0, lbZoom = false, touchX = null;
    const thumbUrl = s => s.t === 'vid' ? `https://i.ytimg.com/vi/${s.id}/mqdefault.jpg` : img(s.id, 300);
    function set(p, vids) {
      slides = [p.img, ...(p.x || [])].map(id => ({ t: 'img', id })).concat(vids.map(v => ({ t: 'vid', id: v.id, title: v.t })), [{ t: 'spec', p }]);
      cur = 0; renderThumbs('#pThumbs', 'pt');
    }
    function renderThumbs(sel, cls) {
      $(sel).innerHTML = slides.length > 1 ? slides.map((s, i) => s.t === 'spec'
        ? `<button class="${cls} is-spec ${i === cur ? 'active' : ''}" data-slide="${i}" aria-label="Specifications"><b>SPECS</b><i></i><i></i><i></i></button>`
        : `<button class="${cls} ${i === cur ? 'active' : ''} ${s.t === 'vid' ? 'is-vid' : ''}" data-slide="${i}" aria-label="${s.t === 'vid' ? 'Video' : 'Photo'} ${i + 1}"><img src="${thumbUrl(s)}" alt="" loading="lazy" referrerpolicy="no-referrer"${s.t === 'img' ? ` data-id="${s.id}" data-w="300" onerror="__imgFail(this)"` : ''}>${s.t === 'vid' ? '<span>▶</span>' : ''}</button>`).join('') : '';
    }
    function select(i) {
      const s = slides[i]; if (!s) return;
      if (s.t !== 'img') return open(i);
      cur = i; viewer.show(s.id); renderThumbs('#pThumbs', 'pt');
    }
    function draw() {
      const s = slides[cur]; lbZoom = false;
      $('#lbCount').textContent = `${cur + 1} / ${slides.length}`;
      $('#lbPrev').hidden = $('#lbNext').hidden = slides.length < 2;
      if (s.t === 'spec') {
        $('#lbMedia').innerHTML = `<div class="lb-spec">${specSheetHTML(s.p, { brand: s.p.b })}</div>`;
      } else if (s.t === 'vid') {
        $('#lbMedia').innerHTML = `<div class="lb-video"><iframe src="https://www.youtube-nocookie.com/embed/${s.id}?autoplay=1&rel=0&modestbranding=1" title="${esc(s.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
      } else {
        $('#lbMedia').innerHTML = `<img class="lb-img" src="${img(s.id, 2000)}" data-id="${s.id}" data-w="2000" alt="${esc(modalP ? modalP.n : '')}" referrerpolicy="no-referrer" onerror="__imgFail(this)" draggable="false">`;
      }
      renderThumbs('#lbThumbs', 'lbt');
      const a = $('#lbThumbs .active'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    function open(i) {
      if (!slides.length) return;
      cur = Math.max(0, Math.min(slides.length - 1, i)); viewer.stop();
      $('#lbTitle').textContent = modalP ? modalP.n : '';
      $('#lightbox').hidden = false; document.body.style.overflow = 'hidden'; draw();
    }
    function close() {
      if ($('#lightbox').hidden) return;
      $('#lightbox').hidden = true; $('#lbMedia').innerHTML = ''; document.body.style.overflow = '';
      if (slides[cur] && slides[cur].t === 'img') select(cur); else renderThumbs('#pThumbs', 'pt');
    }
    const go = d => { cur = (cur + d + slides.length) % slides.length; draw(); };
    $('#lbPrev').onclick = () => go(-1);
    $('#lbNext').onclick = () => go(1);
    $('#lbClose').onclick = close;
    $('#lightbox').addEventListener('click', e => {
      const t = e.target.closest('[data-slide]'); if (t) { cur = +t.dataset.slide; return draw(); }
      if (e.target.id === 'lbStage' || e.target.id === 'lbMedia') return close();
      const im = e.target.closest('.lb-img'); if (!im) return;
      lbZoom = !lbZoom; im.classList.toggle('zoomed', lbZoom);
      if (!lbZoom) im.style.transformOrigin = 'center';
    });
    $('#lbMedia').addEventListener('mousemove', e => {
      const im = $('.lb-img.zoomed'); if (!im) return;
      const r = im.getBoundingClientRect(); im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    $('#lbStage').addEventListener('touchstart', e => { touchX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    $('#lbStage').addEventListener('touchend', e => { if (touchX == null || lbZoom) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touchX = null; });
    document.addEventListener('keydown', e => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); }
    }, true);
    $('#pThumbs').addEventListener('click', e => { const t = e.target.closest('[data-slide]'); if (t) select(+t.dataset.slide); });
    return { set, open, close, current: () => cur };
  })();
  $('#mPlus').onclick = () => { if (modalQty >= modalP.q) return toast(`Only ${modalP.q} available.`); modalQty++; $('#mQty').textContent = modalQty; };
  $('#mMinus').onclick = () => { modalQty = Math.max(modalQty - 1, 1); $('#mQty').textContent = modalQty; };
  $('#mAdd').onclick = () => addToCart(modalP.id, modalQty);
  $('#mBuy').onclick = () => { addToCart(modalP.id, modalQty); if (cart.some(c => c.id === modalP.id)) location.hash = 'checkout'; };
  $('#mAsk').onclick = () => copy(`Hi Boss Mavs! Available pa po ba ang ${modalP.n}${modalP.p ? ` (${peso(modalP.p)})` : ''}? Salamat po!`, 'Inquiry copied — paste it in Messenger.');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#vmodal').hidden) return closeVideo(); closeCart(); $('#filters').classList.remove('open'); } });

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
    const short = cart.find(c => c.qty > byId[c.id].q);
    if (short) { err.textContent = `Pasensya po, ${byId[short.id].q} na lang ang natitirang ${byId[short.id].n}. Paki-adjust ang cart.`; return; }

    const d = new Date();
    const no = `MAVS-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = {
      no, date: d.toISOString(), name, phone, fb: $('#cFb').value.trim(), delivery: radio('delivery'), address: pickup ? '' : addr,
      payment: radio('payment'), notes: $('#cNotes').value.trim(), status: 0,
      items: cart.map(c => ({ id: c.id, n: byId[c.id].n, p: byId[c.id].p, qty: c.qty })), total: cartTotal()
    };
    const orders = store.get('orders', []); orders.unshift(order); store.set('orders', orders);
    cart.forEach(c => setQty(byId[c.id], byId[c.id].q - c.qty, `Order ${no}`));   // auto-deduct stock
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
    const priced = PRODUCTS.filter(p => p.p != null);
    const low = priced.filter(isLow).length, out = priced.filter(p => !inStock(p)).length;
    const value = priced.reduce((s, p) => s + p.p * p.q, 0), units = priced.reduce((s, p) => s + p.q, 0);
    $('#kpis').innerHTML = [
      [orders.length, 'Total orders', ''], [pending, 'Waiting for confirmation', ''], [peso(revenue), 'Paid sales', ''],
      [low, 'Low stock items', 'warn'], [out, 'Out of stock', 'bad'], [peso(value), `Inventory value · ${units.toLocaleString()} pcs`, '']
    ].map(([b, s, k]) => `<div class="kpi ${k}"><b>${b}</b><span>${s}</span></div>`).join('');

    $('#adminOrders').innerHTML = `<table><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Delivery / Payment</th><th>Status</th></tr></thead><tbody>
      ${orders.map(o => `<tr>
        <td class="mono">${esc(o.no)}${o.sample ? ' <span class="pill">sample</span>' : ''}<br><span class="muted small">${new Date(o.date).toLocaleDateString('en-PH')}</span></td>
        <td>${esc(o.name)}<br><span class="muted small">${esc(o.phone)}</span></td>
        <td>${o.items.map(i => `${i.qty}× ${esc(i.n)}`).join('<br>')}</td>
        <td><b>${peso(o.total)}</b></td>
        <td>${esc(o.delivery)}<br><span class="muted small">${esc(o.payment)}</span></td>
        <td><select data-order="${esc(o.no)}">${STATUSES.map((s, i) => `<option value="${i}" ${i === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      </tr>`).join('')}</tbody></table>`;
    renderStockTable(); renderBell();
  }
  $('#adminOrders').addEventListener('change', e => {
    const no = e.target.dataset.order; if (!no) return;
    const v = +e.target.value;
    if (no.startsWith('MAVS-DEMO')) { const m = store.get('sampleStatus', {}); m[no] = v; store.set('sampleStatus', m); }
    else { const os = store.get('orders', []); const o = os.find(x => x.no === no); if (o) o.status = v; store.set('orders', os); }
    toast(`${no} → ${STATUSES[v]}`); renderAdmin();
  });
  const statusPill = p => !inStock(p) ? '<span class="pill p-out">Out of stock</span>' : isLow(p) ? '<span class="pill p-low">Low stock</span>' : '<span class="pill p-ok">In stock</span>';
  function renderStockTable() {
    const q = $('#stockSearch').value.trim().toLowerCase(), f = $('#stockFilter').value;
    let list = PRODUCTS.filter(p => p.p != null && (!q || `${p.n} ${p.b} ${p.c}`.toLowerCase().includes(q)));
    if (f === 'low') list = list.filter(isLow);
    if (f === 'out') list = list.filter(p => !inStock(p));
    if (f === 'low-out') list = list.filter(p => isLow(p) || !inStock(p));
    if (f !== 'all') list.sort((a, b) => a.q - b.q);
    const total = list.length; list = list.slice(0, 80);
    $('#stockTable').innerHTML = `<table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map(p => `<tr><td>${esc(p.n)}<br><span class="muted small">${esc(p.b)}</span></td><td>${esc(p.c)}</td><td>${peso(p.p)}</td>
      <td><div class="qty inv-qty"><button data-dq="${p.id}" data-d="-1" aria-label="Decrease stock">−</button><input type="number" min="0" value="${p.q}" data-setq="${p.id}" aria-label="Stock of ${esc(p.n)}"><button data-dq="${p.id}" data-d="1" aria-label="Increase stock">+</button></div></td>
      <td>${statusPill(p)}</td><td><button class="btn btn-ghost btn-sm" data-dq="${p.id}" data-d="10">+10 restock</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted center">Walang item dito. 👍</td></tr>'}
      </tbody></table>${total > 80 ? `<p class="muted small" style="padding:8px 12px">Showing 80 of ${total}. Search or filter to narrow down.</p>` : ''}`;
    $('#invLog').innerHTML = invLog.slice(0, 12).map(l => `<li><span class="muted">${new Date(l.t).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span> · ${esc(byId[l.id]?.n || '')}: <b>${l.from} → ${l.to}</b> <span class="muted">(${esc(l.reason)})</span></li>`).join('') || '<li class="muted">Wala pang stock movement. Try mag-order o mag-restock.</li>';
  }
  $('#stockSearch').addEventListener('input', renderStockTable);
  $('#stockFilter').addEventListener('change', renderStockTable);
  $('#invLow').value = inv.low;
  $('#invLow').addEventListener('change', e => { inv.low = Math.max(0, +e.target.value || 0); store.set('inv', inv); renderAdmin(); renderShop(); toast(`Low-stock alert set to ${inv.low} pcs or fewer`); });
  $('#stockTable').addEventListener('click', e => {
    const b = e.target.closest('[data-dq]'); if (!b) return;
    const p = byId[+b.dataset.dq], d = +b.dataset.d;
    setQty(p, p.q + d, d === 10 ? 'Restock' : 'Manual adjust'); renderAdmin(); renderShop();
  });
  $('#stockTable').addEventListener('change', e => {
    const id = +e.target.dataset.setq; if (!id) return;
    setQty(byId[id], +e.target.value, 'Stock count'); renderAdmin(); renderShop();
  });

  // ---------- alerts bell ----------
  function renderBell() {
    const unread = alerts.filter(a => !a.read).length;
    const needs = PRODUCTS.filter(p => p.p != null && (isLow(p) || !inStock(p))).length;
    $('#bellCount').textContent = unread || '';
    $('#bellCount').hidden = !unread;
    $('#bellList').innerHTML = (alerts.length ? alerts.slice(0, 15).map(a => `<li class="${a.read ? '' : 'unread'} ${a.type}"><span>${a.type === 'out' ? '⛔' : '⚠️'} ${esc(a.msg)}</span><small>${new Date(a.t).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></li>`).join('')
      : '<li class="muted">Wala pang bagong alerts. Lalabas dito kapag may item na paubos o naubos na.</li>')
      + `<li class="bell-sum"><button class="linkish" id="bellShow">${needs} items need restocking: view in Inventory →</button></li>`;
  }
  $('#bellBtn').onclick = () => {
    const panel = $('#bellPanel'); panel.hidden = !panel.hidden;
    if (!panel.hidden) { alerts.forEach(a => a.read = true); store.set('alerts', alerts); setTimeout(renderBell, 1500); }
  };
  $('#bellPanel').addEventListener('click', e => {
    if (e.target.id !== 'bellShow') return;
    $('#bellPanel').hidden = true; $('#stockFilter').value = 'low-out';
    $('[data-tab="stock"]').click();
  });
  $('#notifBtn').onclick = async () => {
    if (!('Notification' in window)) return toast('This browser does not support notifications.');
    try { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Notifications on for this device ✅' : 'Notifications not allowed.'); } catch { toast('Notifications not available here.'); }
  };
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.toggle('active', x === t));
    $('#adminOrders').hidden = t.dataset.tab !== 'orders';
    $('#adminStock').hidden = t.dataset.tab !== 'stock';
    if (t.dataset.tab === 'stock') renderStockTable();
  });

  // ---------- router ----------
  const VIEWS = ['shop', 'product', 'checkout', 'done', 'track', 'admin'];
  function route() {
    let v = location.hash.slice(1) || 'shop';
    closeModal(); gallery.close();
    const pm = v.match(/^product-(\d+)$/);
    if (pm) { v = renderProduct(+pm[1]) ? 'product' : 'shop'; }
    else if (!VIEWS.includes(v) || v === 'product') v = 'shop';
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
  renderVideoRow(); renderChips(); renderBrands(); renderBell(); renderShop(); renderCartCount(); syncCheckout(); route();
})();
