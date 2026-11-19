/* Spec sheets (Specifications table + Features box).
 * VERIFIED entries are model-specific and come from manufacturer / major retailer listings
 * (Krytac, Evike, Airsoft GI, Patrol Base, Airsoftjunkiez, Redwolf). Values that differ between
 * retailers or versions are shown as a range. Everything else gets a BASIC sheet derived only from
 * what the product category tells us — no guessed numbers.
 */
(function () {
  'use strict';

  const VERIFIED = [
    {
      test: /TRIDENT MKII SPR M\b/, title: ['TRIDENT MKII', 'SPR-M'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Outer barrel', '16"'],
        ['Inner barrel', '416 mm (6.05 mm)'], ['Handguard', 'Licensed KRISS / Defiance TR210 13" M-LOK (free float)'],
        ['Receiver', 'Billet-style aluminum alloy'], ['Gearbox', 'Reinforced V2, 8 mm ball bearings'],
        ['Motor', 'KRYTAC high-torque, 30,000 RPM'], ['Electronics', 'Integrated MOSFET'],
        ['Hop-up', 'Rotary, adjustable'], ['Magazine', '150 rd mid-cap (M4 compatible)'],
        ['Barrel threading', '14 mm CCW'], ['Stock', '6-position KRYTAC battery stock'],
        ['Battery', 'Nunchuck, small LiPo brick, or stick (buffer tube)'],
        ['Length', 'approx. 850–945 mm (adjustable)'], ['Weight', 'approx. 2.5–3.0 kg'],
        ['FPS', 'approx. 350–430 (varies by version)'], ['Fire modes', 'Safe / Semi / Full']
      ],
      features: ['Free-floating 13" M-LOK handguard', 'Reinforced 8 mm bearing gearbox', 'Integrated MOSFET protects trigger contacts', 'Quick-change spring system', 'Ambidextrous fire selector', 'Realistic locking bolt and bolt release', 'KRISS motor grip', 'Three battery options in the stock']
    },
    {
      test: /TRIDENT MKII SPR\b/, title: ['TRIDENT MKII', 'SPR'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Inner barrel', '416 mm (6.05 mm)'],
        ['Rail', 'Licensed KRISS TR110 rail system'], ['Receiver', 'Billet-style aluminum alloy'],
        ['Gearbox', 'V2 full metal, 8 mm ball bearings'], ['Electronics', 'Integrated MOSFET'],
        ['Hop-up', 'Rotary, adjustable'], ['Magazine', '300 rd hi-cap (M4 compatible)'],
        ['Barrel threading', '14 mm CCW'], ['Stock', '6-position KRYTAC battery stock'],
        ['Length', '840–920 mm (adjustable)'], ['Weight', 'approx. 2.7 kg'],
        ['FPS', 'approx. 400'], ['Fire modes', 'Safe / Semi / Full']
      ],
      features: ['Integrated MOSFET', '8 mm ball bearing bushings', 'Quick-change spring system', 'Ambidextrous fire selector', 'Realistic locking bolt and bolt release', 'Adjustable rotary hop-up', 'KRISS motor grip']
    },
    {
      test: /TRIDENT MKII CRB/, title: ['TRIDENT MKII', 'CRB'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Outer barrel', '10.5"'],
        ['Inner barrel', '280 mm (6.05 mm)'], ['Receiver', 'Billet-style aluminum alloy'],
        ['Gearbox', 'V2 full metal, 8 mm ball bearings'], ['Motor', 'KRYTAC high-torque, 30,000 RPM'],
        ['Electronics', 'Integrated MOSFET'], ['Hop-up', 'Rotary, adjustable'],
        ['Length', '675–787 mm (adjustable)'], ['Weight', 'approx. 2.5 kg'],
        ['FPS', 'approx. 380–400'], ['Fire modes', 'Safe / Semi / Full']
      ],
      features: ['Carbine length for CQB and outdoor play', 'Free-floating licensed KRISS handguard', 'Integrated MOSFET', 'Quick-change spring system', 'Ambidextrous fire selector']
    },
    {
      test: /TRIDENT MKII PDW/, title: ['TRIDENT MKII', 'PDW'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Inner barrel', '155 mm'],
        ['Receiver', 'Billet-style aluminum alloy'], ['Gearbox', 'V2 full metal, 8 mm ball bearings'],
        ['Electronics', 'Integrated MOSFET'], ['Hop-up', 'Rotary, adjustable'],
        ['Length', '527–610 mm (adjustable)'], ['FPS', 'approx. 330–350'], ['Fire modes', 'Safe / Semi / Full']
      ],
      features: ['Compact PDW size for CQB', 'Integrated MOSFET', 'Quick-change spring system', 'Ambidextrous fire selector']
    },
    {
      test: /ARP556 3\.0/, title: ['G&G ARP556', '3.0'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Inner barrel', '128 mm'],
        ['Body', 'Polymer and aluminum'], ['Gearbox', 'V2 full metal, MOSFET-integrated (MIG)'],
        ['Electronics', 'ETU 2.0 electronic trigger + MOSFET'], ['Motor', 'Long type'],
        ['Magazine', '105 rd mid-cap (M4 compatible)'], ['Barrel threading', '14 mm CCW'],
        ['Length', '390–605 mm'], ['Weight', 'approx. 1.94 kg'],
        ['FPS', 'approx. 320–330 (0.20 g)'], ['Fire modes', 'Safe / Semi / Full + programmable 3-round burst']
      ],
      features: ['Electronic trigger unit (ETU) for faster response', 'Programmable 3-round burst', 'Low-voltage battery protection', 'Very compact, ideal for CQB', 'Larger battery compartment']
    },
    {
      test: /ARCTURUS AR03/, title: ['ARCTURUS', 'AR03'],
      rows: [
        ['Type', 'AEG (electric)'], ['Caliber', '6 mm'], ['Gearbox', 'Quick-change spring gearbox'],
        ['Electronics', 'No MOSFET (use a 7.4 V battery)'], ['Sights', 'Flip-up back-up iron sights'],
        ['Grip', 'Changeable backstrap plates'], ['FPS', 'approx. 360–365']
      ],
      features: ['Compact PDW layout', 'M-LOK handguard', 'Quick-change spring', 'Back-up flip-up sights']
    }
  ];

  const POWER = {
    'AEG Rifles': ['AEG (electric)', 'Rechargeable battery'], 'Budget Units': ['AEG / spring', 'Varies by model'],
    'Inventory Sale': ['AEG (electric)', 'Rechargeable battery'], 'New Arrivals': ['Varies by model', 'Varies by model'],
    'GBB Pistols': ['Gas blowback pistol', 'Green gas / propane (some CO2)'], 'GBB Rifles': ['Gas blowback rifle', 'Green gas'],
    'Sniper Rifles': ['Sniper / bolt-action', 'Spring (some AEG / gas)'], 'CO2 Guns': ['CO2-powered', '12 g CO2 cartridge'],
    'Spring Pistols': ['Spring pistol', 'Manual (cock per shot)']
  };

  window.getSpecs = function (p) {
    const v = VERIFIED.find(s => s.test.test(p.n));
    if (v) return { verified: true, title: v.title, rows: v.rows, features: v.features };
    const d = window.describeProduct ? window.describeProduct(p) : { points: [], tag: '' };
    const pw = POWER[p.c];
    const rows = [];
    if (pw) {
      rows.push(['Type', pw[0]], ['Caliber', /\.177/.test(p.n) ? '4.5 mm (.177)' : '6 mm'], ['Power source', pw[1]]);
    } else {
      rows.push(['Type', p.c]);
    }
    if (p.b) rows.push(['Brand', p.b]);
    rows.push(['Category', p.c], ['Platform', d.tag || '—']);
    const name = p.n.replace(/\s*\(SALE\)/i, '');
    const parts = name.split(' ');
    const title = parts.length > 1 ? [parts.slice(0, -1).join(' '), parts.slice(-1)[0]] : ['', name];
    return { verified: false, title, rows, features: (d.points && d.points.length) ? d.points : [] };
  };

  // Spec sheet HTML (used in the Specifications tab and as a slide in the expanded view)
  window.specSheetHTML = function (p, opts) {
    const s = window.getSpecs(p), esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const brand = opts && opts.brand ? `<div class="ss-brand">${esc(opts.brand)}</div>` : '';
    return `<div class="specsheet">
      <h2 class="ss-title">${esc(s.title[0])} <span>${esc(s.title[1])}</span></h2>
      <div class="ss-cols">
        <div class="ss-specs"><h3>Specifications</h3>
          <table>${s.rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        </div>
        <div class="ss-feat"><h3>Features</h3>
          ${s.features.length ? `<ul>${s.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : '<p class="ss-pending">Full feature list coming soon. Ask the shop for detailed specs.</p>'}
        </div>
      </div>
      <div class="ss-foot">${brand}<span>${s.verified ? 'Specs based on manufacturer / retailer listings. Values may vary by version or upgrade.' : 'Basic spec sheet. Exact specs, FPS and version vary per unit, so confirm with the shop.'}</span></div>
    </div>`;
  };
})();
