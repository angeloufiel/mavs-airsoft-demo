/* Product descriptions for the MVS Airsoft demo.
 * Built from three layers, in this order:
 *   1) SPECIFIC  — model-specific write-ups checked against manufacturer/retailer listings
 *   2) MODEL     — what the platform/model type is good for (from the product name)
 *   3) BRAND + CATEGORY — what the brand is known for and who the category suits
 * Rule: no made-up specs. Exact FPS/specs vary per batch/upgrade → "confirm with MVS".
 */
(function () {
  'use strict';

  // 1) Model-specific (researched) ------------------------------------------------
  const SPECIFIC = [
    {
      test: /TRIDENT MKII SPR M\b/,
      tag: 'Scout / DMR-style rifle with premium stock internals',
      text: 'The SPR-M is Krytac\'s "scout rifle": a 16-inch barrel with a free-floating 13-inch licensed KRISS/Defiance M-LOK handguard, built for medium- to long-range play.',
      points: [
        'Reinforced 8mm ball-bearing gearbox with built-in MOSFET (protects the trigger contacts)',
        'Easy-change spring system, so FPS can be tuned for field limits',
        'Rotary hop-up with 15 numbered settings and an ambidextrous fire selector',
        'Adjustable battery stock that fits nunchuck, small brick or stick batteries',
        'Full M-LOK handguard with a long top rail for scopes and magnifiers'
      ]
    },
    {
      test: /TRIDENT MKII SPR\b/,
      tag: 'Long-barrel Krytac for medium–long range',
      text: 'The Trident MKII SPR is a full-metal, long-barrel AR-type rifle from Krytac. It is a good choice if you want range and accuracy without upgrading anything first.',
      points: ['8mm bearing gearbox with integrated MOSFET', 'Quick-change spring system', 'Rotary adjustable hop-up', 'Ambidextrous fire selector']
    },
    {
      test: /TRIDENT MKII (CRB|PDW)/,
      tag: 'Krytac quality in a handier size',
      text: 'A shorter version of Krytac\'s Trident MKII. It has the same tough internals as the SPR but is lighter and quicker to move with, which suits fields with mixed indoor and outdoor play.',
      points: ['8mm bearing gearbox + integrated MOSFET', 'Quick-change spring', 'Rotary hop-up', 'Compact and easy to handle']
    },
    {
      test: /^BREC7/,
      tag: 'Krytac\'s newer AR platform',
      text: 'A newer Krytac AR-style AEG with full metal construction. It is aimed at players who want a strong rifle straight out of the box.',
      points: ['Full metal build', 'Krytac performance internals', 'Ready for standard M4 accessories']
    },
    {
      test: /^(KIZUNA )?MKW|KIZUNA MKW/,
      tag: 'Full-size PL-15 style GBB pistol',
      text: 'A gas blowback replica of the modern Lebedev PL-15 pistol. It has a CNC aluminum slide and a fiber-reinforced polymer frame.',
      points: ['Aluminum slide, reinforced polymer grip', 'Adjustable hop-up', 'Integrated accessory rail', 'Uses a 26-round gas magazine']
    },
    {
      test: /KIZUNA 15K|KW-?15K/,
      tag: 'Compact PL-15K style sidearm',
      text: 'A compact gas blowback pistol based on the Lebedev PL-15K. It is a nice change from the usual Glock-style sidearms.',
      points: ['Aluminum blowback slide', 'Ambidextrous magazine release and safety', 'Threaded barrel for tracers and suppressors']
    },
    {
      test: /BSK43/,
      tag: 'Hi-Capa/1911 hybrid GBB',
      text: 'A gas blowback pistol that is compatible with Hi-Capa and 1911 internal parts, so it is easy to upgrade and fix.',
      points: ['Works with Hi-Capa and 1911 internals', 'Snappy recoil', 'Adjustable hop-up']
    },
    {
      test: /^AC AT2000R/,
      tag: 'Chronograph for checking FPS',
      text: 'A compact chronograph that measures BB speed (FPS). It helps you make sure a gun is within your field\'s limits before a game.',
      points: ['Checks FPS before games', 'Useful after upgrades or spring changes']
    }
  ];

  // 2) Model / platform hints from the product name -----------------------------
  const MODEL = [
    [/VSR|SSG10|MOD24|TSR|CSR|SSR 2|L96|AS02|MSR|703|708|SXR/, 'Sniper / bolt-action: quiet, precise shots. The VSR-style platform has one of the biggest upgrade-parts ecosystems.'],
    [/MK18|DDM4|M4|AR0|ARP556|CQB|CAR\b|SBR|CARBINE|CRB|MLR|CAOS|STRIKER|AVALON|GLADIUS|MCX|MGCR|416|NOVESKE|LEVAR|ISO556|HK33|G3A3|SABER|MK16|DD4|DD MFR|ARMOUR|SABERTOOTH|BREATH|PHOENIX|C0\d|C1\d|FALCON|DIAMONDBACK|603|620|70\d|203|204|301|302|M4S1|DEVGRU|COBRA|MK12|G28|AR03|AR09|NY04/, 'AR/M4-style platform: the most popular rifle layout in airsoft. Most parts, mags and accessories fit, so it is easy to upgrade and to find parts for.'],
    [/AK|LCKM|74|SAIGA/, 'AK platform: tough, simple and reliable. AKs are known for taking a beating, and parts are easy to find.'],
    [/MP5|MPX|P90|SCORPION|MP7|MP9|ARP9|FMG9|PCC|9MM|SSR90|PDW/, 'Compact SMG/PCC: light and fast to swing around. Great for CQB, indoor fields and players who move a lot.'],
    [/M249|MK46|MINIGUN/, 'Support weapon: high-capacity, suppressive-fire role. Very fun on big fields, and draws a lot of attention.'],
    [/KAR98|M1903|M14|G980/, 'Classic/vintage rifle: great for history-themed games and collectors who like wood-and-steel looks.'],
    [/HI-?CAPA|5\.1|4\.3|3\.8|CAPTAIN|GOLDMATCH|1911|STACCATO|2011|EB1911|BRONTO|VELO|ALLOSAURUS|LIMCAT/, 'Hi-Capa/1911 family: the most upgradeable pistol platform in airsoft. It is the standard for IPSC and speed shooting.'],
    [/G1[7-9]|G4[25]|GLOCK|R17|P10C|TP9|SFX|P320|USP|HK45|M92|D\.?EAGLE|DESERT EAGLE|SSP|TTI|VIPER|ORION|MASTER|AAP01|CARNOTAURUS|ICP|STP45|CZ|PIT|BABAYAGA|CURVE/, 'Modern sidearm: a reliable backup to your primary. Most of these share magazines and holsters with other models in their family.'],
    [/\.177/, 'CO2 .177 (4.5mm) model: shoots 4.5mm BBs/pellets, not 6mm airsoft BBs. Ask MVS whether it suits your use.'],
    [/REVOLVER|RHINO|APR00|CLPD/, 'CO2 revolver: realistic shell-loading and strong gas efficiency. A crowd favorite for its looks.']
  ];

  // Accessories / parts / consumables by keyword
  const PART = [
    [/TRACER.*BB|BB.*TRACER|FARSAN 0\.2\d TRACER/, 'Tracer BBs: glow-in-the-dark BBs that light up with a tracer unit, so you can see every shot.'],
    [/TRACER|BRIGHTER|BIFROST/, 'Tracer unit: makes glow BBs light up so you can see where your shots land. Very useful at night or indoors.'],
    [/0\.2[58]/, '0.25–0.28g BBs: the all-round choice for most AEGs. They fly straighter and handle wind better.'],
    [/0\.2[03]/, 'Lighter BBs (0.20–0.23g): good for stock guns and pistols, with fast flight and easy hop-up.'],
    [/0\.3\d|0\.4\d/, 'Heavy BBs (0.30g+): for upgraded rifles and snipers. They give the best accuracy at range.'],
    [/GAS|14KG|12KG|134A/, 'GBB gas: higher-pressure gas gives stronger kick. Lower pressure is gentler on parts. Check what your gun needs.'],
    [/SILICON|GREASE/, 'Maintenance: regular lubrication keeps seals and gears running smoothly and makes them last longer.'],
    [/BRUSHLESS|PINNACLE|GT3\dK|WH BASE|PERUN|LIGHTNING|AB\+\+|30K|35K|37K|45K|20K/, 'Motor / electronics upgrade: faster trigger response and higher rate of fire. Best installed by a tech.'],
    [/GEARSET|12:1|13:1|16:1/, 'Gear set: the gear ratio sets the balance between speed and torque. Match it with your motor and spring.'],
    [/IB\[|INNER|6\.01/, 'Tight-bore inner barrel: can improve consistency and range when paired with a good hop-up.'],
    [/HOP|CHAMBER/, 'Hop-up chamber: controls BB backspin. A better hop gives more range and consistency.'],
    [/GBOX|SHELL|CYLINDER|SPRING|TRIGGER|MAGCATCH|NOZZLE|DTU|POWER UP|FIX|LOADING/, 'Upgrade/replacement part for builds and repairs. Ask MVS to confirm it fits your model.'],
    [/MAG|DRUM|900R|1200R|450R|30R|40R|42R/, 'Spare magazine: more ammo on the field means fewer trips back to reload.'],
    [/X3500|X310|XCORTECH|AT2000|CHRONO/, 'FPS/tracer electronics: depending on the model, it checks your FPS or lights up glow BBs. Ask MVS which one fits your needs.'],
    [/SCOPE|VTR|3-9|3-12/, 'Rifle scope: magnified aiming for longer shots. Ideal on DMR and sniper builds.'],
    [/SIGHT|RISER|MOUNT|HYDRA|CARRY HANDLE|SIDEMOUNT/, 'Sight/mount: puts your optic at the right height for faster, more comfortable aiming.'],
    [/PLATE|CARRIER|PC\[|CHEST|D3CR/, 'Load-bearing gear: carry mags and essentials where you can reach them fast.'],
    [/AIRFRAME|HELMET/, 'Helmet: head protection that also mounts lights, cameras and NVG-style accessories.'],
    [/ACM|SILENCER|BARREL|OUTER/, 'Mock suppressor/barrel: changes the look and length of your gun. Some fit tracer units.'],
    [/PL1020|L52160|G1103|LIGHT|LASER|ANPEQ/, 'Light/laser: for low light and indoor games, and it looks tactical.'],
    [/GRIP|AFG|AEROKNOX|SKEL/, 'Grip upgrade: better control and comfort, especially in fast CQB.'],
    [/STOCK|CRANE|CTR/, 'Buttstock: better cheek weld and length adjustment. Some stocks hold batteries.'],
    [/RAIL|RIII|MK18 7/, 'Handguard/rail: room for lights, grips and lasers, plus a new look for your rifle.'],
    [/RECEIVER/, 'Receiver set: the base for a custom AR build or a full visual makeover.'],
    [/LAUNCHER/, 'Grenade launcher: fires gas shells. A fun specialty item for scenario games.'],
    [/TARGET/, 'Practice target: zero your hop-up and practice at home or at the range.'],
    [/BATTERY|LION|LIPO|GRAPHENE|BLITZ|MAH|CR123/, 'Battery: higher discharge (C) gives snappier trigger response. Make sure your gun and charger support it.'],
    [/MASK|BALACLAVA|SCOTT|VECTRA|EYEPRO/, 'Face/eye protection: required at every field. Your eyes come first.'],
    [/POUCH|MAGPOUCH/, 'Pouch: keeps magazines and gear organized and quick to grab.'],
    [/HOLSTER|DROPLEG|SERPA/, 'Holster: keeps your sidearm secure and quick to draw.'],
    [/BELT|RONIN|IPSC/, 'Belt: the foundation for holsters and pouches. Popular for IPSC and speed shooting.'],
    [/SLING|BUNGEE|MS[23]/, 'Sling: carry your rifle hands-free and switch to your sidearm quickly.'],
    [/BDU|G2/, 'Combat uniform: comfortable, durable field wear in popular camo patterns.'],
    [/CASE|BAG|GLARY|9\.11/, 'Gun case/bag: protects your gun on the way to the field. A must if you commute.'],
    [/HPA|REG|TANK|NEXXUS|ENGINE|009|CI /, 'HPA system: runs on compressed air for very consistent shots and adjustable power. Needs a tank and regulator.'],
    [/KIT|RONI|D EAGLE KIT/, 'Conversion kit: turns your pistol into a carbine-style setup with a stock and rails.']
  ];

  // 3) Brand blurbs (general reputation — kept modest and non-spec) --------------
  const BRAND = {
    'KRYTAC': 'Krytac is a US-designed brand known for strong stock internals (bearing gearboxes, MOSFETs) and licensed KRISS/Defiance parts.',
    'TOKYO MARUI': 'Tokyo Marui is the Japanese company that invented the AEG. It is still the benchmark for consistency, and its designs are what most aftermarket parts are made to fit.',
    'G&G': 'G&G is a long-running Taiwanese maker known for its electronic triggers and the popular ARP line.',
    'VFC': 'VFC is known for realistic, often officially licensed (Umarex/HK) replicas with excellent build quality.',
    'ICS': 'ICS is known for its split-gearbox design, which makes maintenance and spring changes easier.',
    'ARCTURUS': 'Arcturus makes value-packed rifles that often come with a MOSFET and solid internals as standard.',
    'E&C': 'E&C makes full-metal rifles with lots of variants at a friendly price.',
    'CYMA': 'CYMA is a budget-friendly and durable brand, famous for its AKs, with lots of parts available.',
    'JG': 'JG is an entry-level brand that is easy on the wallet and fine for starting out.',
    'DOUBLE BELL': 'Double Bell offers affordable units with a wide range of models, a common choice for new players.',
    'SPECNA ARMS': 'Specna Arms is a value brand with good finish and beginner-friendly packages.',
    'LANCER TACTICAL': 'Lancer Tactical is a value brand that is easy to start with and widely supported.',
    'NOVRITSCH': 'Novritsch is a player-founded brand made for the field, especially popular for its sniper rifles.',
    'LCT': 'LCT is known for heavy-duty steel AK replicas that are very sturdy and realistic.',
    'S&T': 'S&T makes affordable versions of unusual and classic models, from SAWs to vintage rifles.',
    'SRC': 'SRC is a long-running brand with a mix of AEGs and gas guns.',
    'CLASSIC ARMY': 'Classic Army is a veteran airsoft brand with distinctive, eye-catching models.',
    'POSEIDON': 'Poseidon is a performance-focused brand, also known for its HPA systems.',
    'RAVEN': 'Raven is a full-metal, performance-oriented line aimed at advanced players.',
    'SLONG': 'Slong is better known for magazines and upgrade parts, and also makes value rifles.',
    'BOLT': 'BOLT rifles are famous for their recoil system, which gives a real kick you can feel when you shoot.',
    'KING ARMS': 'King Arms offers unique models such as P90s, bullpups and PCC carbines.',
    'GHK': 'GHK is one of the most respected gas-blowback rifle makers, with realistic and durable GBBRs.',
    'WE': 'WE is a popular GBB maker whose parts are easy to find and fit many models.',
    'KWA': 'KWA is known for its durable gas systems and reliable GBB SMGs and rifles.',
    'ACTION ARMY': 'Action Army is known for the AAP-01 and for strong aftermarket support.',
    'ARMY ARMAMENT': 'Army Armament makes budget-friendly GBB pistols, a common first sidearm.',
    'AW CUSTOM': 'AW Custom makes Hi-Capa, 1911 and Desert Eagle-style GBBs with custom looks.',
    'EMG': 'EMG offers officially licensed replicas (e.g., Staccato, TTI) with real-steel branding.',
    'KJW': 'KJW makes durable gas pistols, including CZ-style models, with gas and CO2 options.',
    'ASG': 'ASG carries officially licensed CZ replicas such as the P-10C and Scorpion EVO.',
    'KIZUNA WORKS': 'Kizuna Works makes upgrade parts and unique GBB pistols, including modern Russian-style models.',
    'HFC': 'HFC makes affordable gas guns, a simple way to get started.',
    'ARES': 'ARES is known for electronic-trigger AEGs and distinctive designs.',
    'SIG AIR': 'SIG AIR is SIG Sauer\'s official airsoft line, so these are licensed replicas of SIG designs.',
    'ACETECH PRODUCTS': 'Acetech is a go-to brand for tracer units and chronographs.',
    'ACETECH': 'Acetech is a go-to brand for tracer units and chronographs.',
    'MODIFY': 'Modify is known for precision sniper parts and the MOD24 bolt-action rifle.',
    'UMAREX': 'Umarex holds the official HK/Glock licenses and works with VFC.',
    'PARABELLUM': 'Parabellum makes P320-style competition GBB pistols.',
    'ZEVII': 'ZEVII makes PTS-licensed pistols with modern competition styling.'
  };

  // Category intros + who it's for -------------------------------------------------
  const CATEGORY = {
    'AEG Rifles': ['Electric airsoft rifle (AEG)', 'Battery-powered, so there is no gas to buy. It works the same in any weather and costs little to run, which is why it is the best all-round primary for most players.'],
    'GBB Pistols': ['Gas blowback pistol', 'The slide moves back with every shot for realistic recoil. It is the most fun sidearm to shoot and is used for IPSC/speed shooting.'],
    'GBB Rifles': ['Gas blowback rifle (GBBR)', 'Realistic recoil and bolt-lock on empty, the closest airsoft gets to real-steel handling. It needs more care and gas than an AEG.'],
    'Sniper Rifles': ['Sniper / precision rifle', 'Built for long, accurate, quiet shots. Patience and positioning win games.'],
    'CO2 Guns': ['CO2-powered gun', 'CO2 cartridges give strong power that holds up in any weather.'],
    'Budget Units': ['Budget-friendly unit', 'An affordable way to start playing, which you can upgrade later.'],
    'Spring Pistols': ['Spring pistol ("teka-teka")', 'No battery or gas needed: just cock and shoot. Cheap, simple and great for practice.'],
    'Inventory Sale': ['Sale unit', 'Discounted stock while supplies last.'],
    'New Arrivals': ['New arrival', 'Freshly arrived stock.']
  };

  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const norm = s => ` ${String(s).toUpperCase()} `;
  const first = (rules, name) => { for (const [re, txt] of rules) if (re.test(name)) return txt; return ''; };

  window.describeProduct = function (p) {
    const N = norm(p.n);
    const spec = SPECIFIC.find(s => s.test.test(p.n));
    const brand = BRAND[p.b] || '';
    const isGun = ['AEG Rifles', 'GBB Pistols', 'GBB Rifles', 'Sniper Rifles', 'CO2 Guns', 'Budget Units', 'Spring Pistols', 'Inventory Sale', 'New Arrivals'].includes(p.c);

    if (spec) {
      return { tag: spec.tag, text: spec.text, points: spec.points, brand, specific: true };
    }
    if (isGun) {
      const cat = CATEGORY[p.c] || ['', ''];
      const model = first(MODEL, N);
      const tag = model ? model.split(':')[0] : cat[0];
      const text = [cat[1], cap(model.split(': ').slice(1).join(': '))].filter(Boolean).join(' ');
      return { tag, text, points: [], brand, specific: false };
    }
    const part = first(PART, N);
    return {
      tag: part ? part.split(':')[0] : p.c,
      text: part ? cap(part.split(': ').slice(1).join(': ')) : `${p.c} item. Ask MVS about compatibility with your setup.`,
      points: [], brand, specific: false
    };
  };
})();
