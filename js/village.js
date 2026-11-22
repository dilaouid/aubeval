// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The village: the land, placing and upgrading buildings, the production chains, the classes its
// houses rise through (data/people.js DATA.classes), the safe zone and the market's trade.
// Everything saved lives in `state` (plain data, see fresh()). The land itself is drawn again from
// its seed at start (js/mapgen.js) and never saved: only what the player changed on it is, in
// state.land (trees felled, trees planted, paths paved).
'use strict';

const Village = (() => {
  const M = DATA.map, T = M.tile, B = DATA.buildings, N = M.w * M.h, CL = DATA.classes;
  const GROUND = Object.keys(DATA.ground), FLORA = Object.keys(DATA.flora);
  const G_PATH = GROUND.indexOf('path');
  /** The first playable seed from `s` on (js/mapgen.js pickSeed): the one kept and shown. */
  const playableFrom = s => MapGen.pickSeed(s, M, DATA.ground, DATA.biomes, DATA.flora);
  // ?seed=N in the address: the land a shared link asks for, already moved on to a playable one
  // (0 when there is none, or not a number from 1 to SEED_MAX)
  const sharedSeed = (n => n >= 1 && n <= MapGen.SEED_MAX ? playableFrom(n) : 0)(Math.floor(Number(params.get('seed'))));
  // A screenshot or a check (index.html and js/screens.js read these): the same land every time,
  // CONFIG.seed's, so that two runs can be compared, unless ?seed= asks for another
  const CHECKS = ['demo', 'tuto', 'lesson', 'scene', 'manual', 'render', 'keys', 'venue', 'camp', 'look'];
  const pinnedSeed = sharedSeed || (CHECKS.some(k => params.has(k)) ? CONFIG.seed : 0);
  /**
   * A new game's land: the one the address pins (a shared link, or a check) when there is one and
   * `useShared`, else one drawn at random (the only Math.random of the game: every gameplay draw
   * reads rng(), seeded from this land) and moved on to the first playable seed from there.
   */
  function drawSeed(useShared = true) {
    return useShared && pinnedSeed ? pinnedSeed : playableFrom(1 + Math.floor(Math.random() * MapGen.SEED_MAX));
  }
  let land = null, landSeed = null;            // the land as its seed draws it, untouched
  const flora = new Uint8Array(N);             // what grows on each tile now: 0 nothing, else 1 + its place in FLORA
  const paved = new Uint8Array(N);             // 1 where the player paved a path
  const occ = new Int32Array(N);               // what stands on each tile: 0 free, -1 blocked, -2 paved, >0 a building's uid
  const walls = new Uint8Array(N);             // 1 where a standing (unbroken) wall is: the walls join their neighbours (js/world.js)
  const camp = new Uint8Array(N);              // 1 on the goblin camp and the bare ground around it: nothing is built there
  const net = new Uint8Array(N);               // 1 on every paved tile joined by paths to the town hall (Roads, below)
  const shakes = new Map();                    // tile index -> seconds left of a tree's shake: drawn only
  const idx = (x, y) => y * M.w + x;
  const inMap = (x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h;
  const groundOf = i => DATA.ground[GROUND[land.ground[i]]];
  /**
   * A footprint in tiles, turned or not. A turned building (rot 1) is its image in a mirror: its
   * width and depth on the map swap. Walls are never turned: they join their neighbours instead.
   */
  const size = (kind, rot) => { const d = B[kind]; return rot && canTurn(kind) ? { w: d.h, h: d.w } : { w: d.w, h: d.h }; };
  const canTurn = kind => !B[kind].fixed && !B[kind].wall;
  /** A standing building's footprint. */
  const dims = b => size(b.kind, b.rot);
  /** What a tile is with no building on it. */
  const tileBase = i => camp[i] ? -3 : !groundOf(i).build || flora[i] ? -1 : paved[i] ? -2 : 0;

  /**
   * Makes the land in memory match the save: draws it from state.mapSeed when that is not the one
   * already drawn, then lays the player's changes on it. Call after `state` is replaced.
   */
  function sync() {
    if (landSeed !== state.mapSeed) { land = MapGen.generate(state.mapSeed, M, DATA.ground, DATA.biomes, DATA.flora); landSeed = state.mapSeed; }
    flora.set(land.flora); paved.fill(0); shakes.clear();
    const L = state.land;
    for (const i in L.cut) flora[i] = 0;
    for (const i in L.planted) { const f = FLORA.indexOf(L.planted[i]); if (f >= 0) flora[i] = f + 1; else delete L.planted[i]; } // a kind removed since: dropped, not a crash
    for (const i in L.paved) paved[i] = 1;
    placeCamp();
    rebuildOcc(); touchTown(); World.reset(); Raid.reset(); Units.reset(); City.sync(); Explore.sync();
  }

  // ---- The goblin camp: every raid leaves from it. It stays put until the player's soldiers burn
  // it down (js/camp.js); then, after a respite, a new one rises farther out, on another side ----
  const CAMP = 4; // its side, in tiles
  const STEP4 = [1, 0, -1, 0, 1]; // (STEP4[k], STEP4[k + 1]) for k = 0..3: the four tiles beside one
  /**
   * Finds the camp's place when there is none (a spot of open ground `raid_camp_dist` tiles from the
   * hall, on a side the land's seed picks, so the same land always has its camp in the same place;
   * the camp number `lvl` that rises after `lvl` have fallen goes `camp_dist_step` tiles farther per
   * fallen camp, turned by a golden angle each time, never on a building or a paved path, and
   * always where its raiders can walk to the hall inside the map of their raid)
   * and keeps it in state.raid.camp. Then clears its ground: no tree grows there, nothing is built.
   */
  function placeCamp(lvl = 0) {
    camp.fill(0);
    const r = state.raid;
    if (!r.camp) {
      const h = hallMid(), cx = h.x / T, cy = h.y / T, hx = Math.floor(cx), hy = Math.floor(cy);
      // need[i]: the smallest square around the hall (half its side, in tiles) inside which a walk side
      // by side over walkable ground leads from the hall to tile i. One pass, the smallest squares first.
      const need = new Uint16Array(N).fill(0xffff), byNeed = [[idx(hx, hy)]];
      need[byNeed[0][0]] = 0;
      for (let v = 0; v < byNeed.length; v++) for (const i of byNeed[v] || []) {
        if (need[i] !== v) continue; // reached since by a smaller square
        const tx = i % M.w, ty = (i / M.w) | 0;
        for (let k = 0; k < 4; k++) {
          const X = tx + STEP4[k], Y = ty + STEP4[k + 1];
          if (!walkable(X, Y)) continue;
          const j = idx(X, Y), n = Math.max(v, Math.abs(X - hx), Math.abs(Y - hy));
          if (n < need[j]) { need[j] = n; (byNeed[n] = byNeed[n] || []).push(j); }
        }
      }
      // Whether raiders from a camp whose middle is (x, y) have a way to the hall inside the map of their raid (js/raid.js fieldRadius).
      const reached = (x, y) => inMap(x, y) && need[idx(x, y)] <= Raid.fieldRadius(Math.hypot(x - cx, y - cy));
      const a0 = ((state.mapSeed * 0.6180339) % 1) * 6.2832 + lvl * 2.39996;
      const d0 = tune.raid_camp_dist + Math.min(lvl * tune.camp_dist_step, tune.camp_dist_max);
      const free = i => !lvl || occ[i] === 0 || occ[i] === -1; // a later camp: only on open ground or wild flora (occ is current by then)
      const ok = (tx, ty) => { if (!reached(tx + 2, ty + 2)) return false; for (let y = -1; y <= CAMP; y++) for (let x = -1; x <= CAMP; x++) { if (!inMap(tx + x, ty + y)) return false; const i = idx(tx + x, ty + y); if (!groundOf(i).walk || !groundOf(i).build || !free(i)) return false; } return true; };
      for (let d = d0; d < d0 + 30 && !r.camp; d += 2) for (let k = 0; k < 32; k++) {
        const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 6.2832 / 32, tx = Math.round(cx + Math.cos(a) * d) - 2, ty = Math.round(cy + Math.sin(a) * d) - 2;
        if (ok(tx, ty)) { r.camp = { x: tx, y: ty, lvl }; break; }
      }
      if (!r.camp) r.camp = { x: clamp(Math.round(cx + d0), 1, M.w - CAMP - 1), y: Math.round(cy) - 2, lvl }; // a land with no room anywhere: it stands where it can
    }
    const c = r.camp, k = tune.raid_camp_clear;
    for (let y = -k; y < CAMP + k; y++) for (let x = -k; x < CAMP + k; x++) if (inMap(c.x + x, c.y + y)) { const i = idx(c.x + x, c.y + y); camp[i] = 1; flora[i] = 0; }
  }
  /** The camp's middle, in map pixels. */
  const campMid = () => ({ x: (state.raid.camp.x + CAMP / 2) * T, y: (state.raid.camp.y + CAMP / 2) * T });
  /** A new camp after one fell: placed `lvl` camps out, its ground cleared, the land's ways worked out again. */
  function raiseCamp(lvl) {
    state.raid.camp = null;
    placeCamp(lvl);
    rebuildOcc(); touchTown(); Raid.touch(); World.reset();
  }

  // ---- Roads: every building that works needs a paved tile beside it, joined to the town hall ----
  /** Whether a building of this kind must be joined to the hall by a path to work. */
  function needsRoad(kind) { const d = B[kind]; return d.road !== false && !d.fixed && !d.decor && !d.wall && !d.tower && !!(d.produces || d.pop || d.service || d.trade || d.craft || d.train); }
  let townStale = true;
  const linked = new Map();   // uid -> true when the building touches the road network
  const reach = new Map();    // house uid -> Set of the service kinds within its reach
  const beautyOf = new Map(); // house uid -> { total, parts: [{ name, n }] }
  /** Something was paved, built, moved, felled or planted: roads, services and beauty are worked out again. */
  function touchTown() { townStale = true; }
  /** The tiles around a footprint, beside its four sides (never its corners). */
  function around(tx, ty, w, h, f) {
    for (let x = 0; x < w; x++) { f(tx + x, ty - 1); f(tx + x, ty + h); }
    for (let y = 0; y < h; y++) { f(tx - 1, ty + y); f(tx + w, ty + y); }
  }
  /** Marks every paved tile joined, side by side, to a paved tile beside the hall. */
  function buildNet() {
    net.fill(0);
    const hall = state.buildings.find(b => b.kind === 'hall'), q = [];
    if (!hall) return;
    around(hall.x, hall.y, B.hall.w, B.hall.h, (x, y) => { if (inMap(x, y) && paved[idx(x, y)] && !net[idx(x, y)]) { net[idx(x, y)] = 1; q.push(idx(x, y)); } });
    while (q.length) {
      const i = q.pop(), x = i % M.w, y = (i / M.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy; if (!inMap(X, Y)) continue;
        const j = idx(X, Y); if (paved[j] && !net[j]) { net[j] = 1; q.push(j); }
      }
    }
  }
  /** Whether a footprint at (tx, ty) would touch the road network. */
  function roadAt(kind, tx, ty, rot) { const d = size(kind, rot); let ok = false; around(tx, ty, d.w, d.h, (x, y) => { if (inMap(x, y) && net[idx(x, y)]) ok = true; }); return ok; }
  const mid = b => { const d = dims(b); return { x: b.x + d.w / 2, y: b.y + d.h / 2 }; };
  /** The beauty at a map point (tiles): decorations and pretty buildings near it, minus the noisy ones, plus a little for each tree. `skip`: a building that does not count (the house itself). */
  function beautyAt(px, py, skip) {
    const R = tune.beauty_radius, parts = []; let total = 0;
    for (const o of state.buildings) {
      const d = B[o.kind]; if (o === skip || !d.beauty || o.damaged) continue;
      const m = mid(o), reachR = R + Math.max(d.w, d.h) / 2;
      if (Math.hypot(m.x - px, m.y - py) > reachR) continue;
      total += d.beauty; const p = parts.find(q => q.name === d.name); if (p) p.n += d.beauty; else parts.push({ name: d.name, n: d.beauty });
    }
    let trees = 0;
    for (let y = Math.floor(py - R); y <= Math.ceil(py + R); y++) for (let x = Math.floor(px - R); x <= Math.ceil(px + R); x++) {
      if (!inMap(x, y) || !flora[idx(x, y)] || Math.hypot(x + 0.5 - px, y + 0.5 - py) > R) continue;
      if (DATA.flora[FLORA[flora[idx(x, y)] - 1]].gives === 'wood') trees++;
    }
    const tb = Math.min(tune.tree_beauty_max, trees * tune.tree_beauty);
    if (tb > 0) { total += tb; parts.push({ name: tr('trees'), n: tb }); }
    return { total: Math.round(total * 10) / 10, parts };
  }
  /** How far a service building reaches, in tiles: wider at each level. */
  const serviceRadius = o => B[o.kind].service.radius + (o.lvl - 1) * tune.service_radius_step;
  /** The services (their building kinds) within reach of a map point, from the buildings that work. */
  function servicesAt(px, py) {
    const out = new Set();
    for (const o of state.buildings) {
      const d = B[o.kind]; if (!d.service || o.damaged || !linked.get(o.uid)) continue;
      const m = mid(o); if (Math.hypot(m.x - px, m.y - py) <= serviceRadius(o)) out.add(o.kind);
    }
    return out;
  }
  /** Works out, once after any change, which buildings are on the roads, and each house's services and beauty. */
  function refreshTown() {
    if (!townStale) return;
    townStale = false;
    buildNet(); linked.clear(); reach.clear(); beautyOf.clear();
    for (const b of state.buildings) linked.set(b.uid, !needsRoad(b.kind) || roadAt(b.kind, b.x, b.y, b.rot));
    for (const b of state.buildings) if (B[b.kind].pop) { const m = mid(b); reach.set(b.uid, servicesAt(m.x, m.y)); beautyOf.set(b.uid, beautyAt(m.x, m.y, b)); }
  }
  /** Whether a building is joined to the town hall by a path (always true for those that need none). */
  const onRoad = b => { refreshTown(); return linked.get(b.uid) !== false; };
  const servicesOf = b => { refreshTown(); return reach.get(b.uid) || new Set(); };
  const beauty = b => { refreshTown(); return beautyOf.get(b.uid) || { total: 0, parts: [] }; };
  /** The services a class wants that this house has not in reach. */
  const missingServices = (b, c) => (c || classOf(b)).services.filter(k => !servicesOf(b).has(k));
  /** What beauty does to a house's tax. */
  const beautyMult = b => Math.max(0.5, 1 + tune.beauty_tax_step * Math.min(tune.beauty_tax_max, beauty(b).total));
  /**
   * Lays the paths an older village needs now that every working building wants one: around the
   * hall, then from each building that has none to the nearest road, over free ground. Free of cost.
   */
  function autoRoads() {
    const hall = state.buildings.find(b => b.kind === 'hall'); if (!hall) return 0;
    let laid = 0;
    const lay = i => { if (occ[i] !== 0) return; paved[i] = 1; state.land.paved[i] = 1; occ[i] = -2; laid++; };
    around(hall.x, hall.y, B.hall.w, B.hall.h, (x, y) => { if (inMap(x, y)) lay(idx(x, y)); });
    touchTown(); refreshTown();
    const R = 70, h = hallMid(), cx = Math.floor(h.x / T), cy = Math.floor(h.y / T);
    for (const b of state.buildings) {
      if (linked.get(b.uid)) continue;
      // a search from the tiles beside the building, over free ground, to the first tile of the network or beside it
      const d = dims(b), prev = new Map(), q = [];
      around(b.x, b.y, d.w, d.h, (x, y) => { if (inMap(x, y) && (occ[idx(x, y)] === 0 || occ[idx(x, y)] === -2)) { prev.set(idx(x, y), -1); q.push(idx(x, y)); } });
      let end = -1;
      for (let qi = 0; qi < q.length && end < 0; qi++) {
        const i = q[qi], x = i % M.w, y = (i / M.w) | 0;
        if (net[i]) { end = i; break; }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy; if (!inMap(X, Y) || Math.abs(X - cx) > R || Math.abs(Y - cy) > R) continue;
          const j = idx(X, Y); if (prev.has(j) || (occ[j] !== 0 && occ[j] !== -2)) continue;
          prev.set(j, i); q.push(j);
        }
      }
      if (end < 0) continue; // walled in: the player lays it
      for (let i = end; i >= 0; i = prev.get(i)) lay(i);
      touchTown(); refreshTown();
    }
    World.reset();
    return laid;
  }
  /** Writes a building's footprint on the tiles: its uid, or with no value what the bare tiles are. */
  function stamp(b, v) {
    const d = dims(b), wall = v != null && !!B[b.kind].wall && !b.damaged ? 1 : 0;
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) if (inMap(b.x + x, b.y + y)) { const i = idx(b.x + x, b.y + y); occ[i] = v == null ? tileBase(i) : v; walls[i] = wall; }
  }
  /** Whether an unbroken wall stands on a tile. */
  const wallAt = (x, y) => inMap(x, y) && walls[idx(x, y)] === 1;
  /**
   * Which sides a wall on this tile joins: a bit for each neighbour that is a wall too (1 north,
   * i.e. y - 1; 2 east, x + 1; 4 south, y + 1; 8 west, x - 1). `also`, when given, says whether a
   * tile counts as a wall as well: the rampart still being drawn.
   */
  function wallMask(x, y, also) {
    const w = (a, b) => wallAt(a, b) || (also ? also(a, b) : false);
    return (w(x, y - 1) ? 1 : 0) | (w(x + 1, y) ? 2 : 0) | (w(x, y + 1) ? 4 : 0) | (w(x - 1, y) ? 8 : 0);
  }
  function rebuildOcc() {
    walls.fill(0);
    for (let i = 0; i < N; i++) occ[i] = tileBase(i);
    for (const b of state.buildings) stamp(b, b.uid);
  }
  /** The ground kind drawn on a tile (its place in DATA.ground). */
  const groundAt = (x, y) => paved[idx(x, y)] ? G_PATH : land.ground[idx(x, y)];
  /** The id (data/world.js DATA.flora) of what grows on a tile, or null. */
  const floraAt = (x, y) => inMap(x, y) && flora[idx(x, y)] ? FLORA[flora[idx(x, y)] - 1] : null;
  /** Whether raiders may cross a tile's ground. */
  const walkable = (x, y) => inMap(x, y) && groundOf(idx(x, y)).walk;
  const biomeAt = (x, y) => DATA.biomes[land.biomeIds[land.biome[idx(x, y)]]];
  /** The hall's middle, in map pixels. */
  const hallMid = () => ({ x: (M.hall.x + B.hall.w / 2) * T, y: (M.hall.y + B.hall.h / 2) * T });

  /**
   * A new game's state. Everything the save file holds is here. `mapSeed`: its land (drawSeed); left
   * out, the land of every save from before lands were drawn, so an older save filled from here keeps its own.
   */
  function fresh(mapSeed = CONFIG.seed) {
    const s = {
      v: 4, t: 0, score: 0, gained: '', seed: 0, savedAt: 0, // v: the save's version (js/save.js VERSION): a new game is never taken for an older save when it is loaded
      mapSeed,                                   // the land is drawn from this
      land: { cut: {}, planted: {}, paved: {} }, // what the player changed on it, by tile index: felled, planted (flora id), paved
      res: {}, totals: {},                       // stock, and all that was ever gained in this village
      buildings: [], nextUid: 1, unlocked: {},
      hero: { name: DATA.hero.name, look: 'aldric', lvl: 1, xp: 0, equip: { weapon: null, armor: null }, inv: [], plus: {}, bench: {} }, // bench: the battle cards left at home (js/cards.js)
      quests: { done: {}, tiers: {} },
      counters: { raidsWon: 0, raidsLost: 0, battlesWon: 0, chops: 0, campsDown: 0, cleared: 0, planted: 0, traps: 0, soldiersLost: 0 }, // cleared, planted, traps: what the tutorial's lessons watch grow
      raid: { n: 0, timer: null, warned: false, active: null, from: null, traps: [], camp: null }, // from: where the next raid comes out, in map pixels; traps: [{ kind, x, y, uses }] laid for this raid; camp: the goblin camp's top-left tile, found once
      units: [], nextUnit: 1,                    // the citizens trained as workers and soldiers (js/units.js)
      mission: null,
      prestige: { renown: 0, count: 0, spent: 0, tree: {} }, // renown: earned for ever; spent, tree: what of it went into the legacy tree, node id -> level (js/city.js)
      stats: { goldEarned: 0 },
      cam: { x: 0, y: 0, k: 0 },                 // k: the zoom the player chose (0: the window's own)
      flags: {},
      city: City.fresh(),       // the rank, the orders, the popularity, the taxes, the great works (js/city.js)
      explore: Explore.fresh(), // the fog lifted and the places found (js/explore.js)
      venue: Venue.fresh(),     // the places entered full screen and their mini-games (js/venue.js)
      tuto: { step: 0, done: params.has('notuto'), lesson: null, lstep: 0, replay: false, seen: {}, later: {}, off: params.has('notuto') }, // Aveline's teaching (js/tutorial.js): the start's step, the lesson open and its step, the lessons seen and put off; off: no lesson offered. ?notuto plays without any
    };
    for (const r of DATA.resourceOrder) { s.res[r] = 0; s.totals[r] = 0; }
    const put = (kind, x, y) => { const b = { uid: s.nextUid++, kind, x, y, lvl: 1, prog: 0 }; if (B[kind].wall) b.hp = B[kind].wall.hp; s.buildings.push(b); };
    put('hall', M.hall.x, M.hall.y);
    for (const [kind, dx, dy] of M.start) if (B[kind]) put(kind, M.hall.x + dx, M.hall.y + dy); // the first defences
    for (const [dx, dy] of M.roads) s.land.paved[idx(M.hall.x + dx, M.hall.y + dy)] = 1;    // and the first street
    Object.assign(s.cam, World.camOn((M.hall.x + 2) * T, (M.hall.y + 2) * T)); // the hall in the middle; World.clampCam() keeps it on the map
    return s;
  }

  // ---- The land the player shapes ----
  /** A click on a tree or a rock: a little wood or stone by hand. It matters early; the huts take over. */
  function chop(tx, ty) {
    const id = floraAt(tx, ty); if (!id) return false;
    const f = DATA.flora[id], n = f.gives === 'stone' ? tune.click_stone : tune.click_wood;
    gain(f.gives, n); state.counters.chops++; shakes.set(idx(tx, ty), 0.25);
    floatText(tx * T + 8, ty * T + 8, '+' + n + ' ' + DATA.resources[f.gives].name.toLowerCase(), UI.C.text, 17, 26);
    sfx('chop');
    return true;
  }
  /** The Défricher tool: removes for good what grows on a tile (and gives its wood or stone), or a paved path. */
  function clearTile(tx, ty) {
    if (!inMap(tx, ty) || !Explore.lifted(tx, ty)) return false; // nothing is felled under the fog
    const i = idx(tx, ty), L = state.land;
    if (flora[i]) {
      const f = DATA.flora[FLORA[flora[i] - 1]];
      delete L.planted[i];
      if (land.flora[i]) L.cut[i] = 1; // a wild tree: it never grows back by itself
      flora[i] = 0; shakes.delete(i); occ[i] = tileBase(i);
      gain(f.gives, tune.clear_yield); state.counters.cleared++;
      floatText(tx * T + 8, ty * T + 8, '+' + tune.clear_yield + ' ' + DATA.resources[f.gives].name.toLowerCase(), UI.C.text, 17, 20);
      World.dustAt(tx, ty); sfx('chop'); Raid.touch(); touchTown(); Units.touch();
      return true;
    }
    if (paved[i] && occ[i] === -2) { delete L.paved[i]; paved[i] = 0; occ[i] = tileBase(i); World.dirty(tx, ty); sfx('chop'); touchTown(); return true; }
    return false;
  }
  /** A tool's or a tree's price, with the global price knob. */
  const toolCost = c => scaleCost(c, tune.cost_scale);
  /** Plants a tree of this kind on a free tile, for its price. `quiet`: no word when it cannot (a stroke of the pointer). */
  function plant(id, tx, ty, quiet) {
    const f = DATA.flora[id];
    if (!f || !f.plant || !inMap(tx, ty) || occ[idx(tx, ty)] !== 0 || !Explore.seen(tx, ty)) { if (!quiet) toast(tr('bad_spot'), UI.C.bad); return false; }
    if (!pay(toolCost(f.plant))) { if (!quiet) toast(tr('no_funds'), UI.C.bad); return false; }
    const i = idx(tx, ty);
    state.land.planted[i] = id; flora[i] = FLORA.indexOf(id) + 1; occ[i] = -1; state.counters.planted++;
    World.dustAt(tx, ty); sfx('place'); Raid.touch(); touchTown();
    return true;
  }
  /** Paves one tile of path, for its price. Not under the fog, nor on a place found in the wild. */
  function pave(tx, ty, quiet) {
    if (!inMap(tx, ty) || occ[idx(tx, ty)] !== 0 || !Explore.seen(tx, ty)) { if (!quiet) toast(tr('bad_spot'), UI.C.bad); return false; }
    if (!pay(toolCost(DATA.tools.path.cost))) { if (!quiet) toast(tr('no_funds'), UI.C.bad); return false; }
    const i = idx(tx, ty);
    state.land.paved[i] = 1; paved[i] = 1; occ[i] = -2; World.dirty(tx, ty); sfx('click'); touchTown();
    return true;
  }
  /**
   * Makes a building stand where it is, or as near as the land allows: for a village that comes
   * from an older save. Whatever grows under it is felled.
   */
  function settle(b) {
    const d = dims(b);
    const fits = (tx, ty) => {
      for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
        if (!inMap(tx + x, ty + y)) return false;
        const i = idx(tx + x, ty + y);
        if (!groundOf(i).build || occ[i] > 0) return false;
      }
      return true;
    };
    let spot = null;
    for (let r = 0; r < 60 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (fits(b.x + dx, b.y + dy)) { spot = { x: b.x + dx, y: b.y + dy }; break; }
    }
    if (!spot) return false;
    b.x = spot.x; b.y = spot.y;
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
      const i = idx(b.x + x, b.y + y);
      if (flora[i]) { flora[i] = 0; state.land.cut[i] = 1; }
      if (paved[i]) { paved[i] = 0; delete state.land.paved[i]; }
    }
    stamp(b, b.uid);
    return true;
  }
  /**
   * A save from the small first map (v1), brought onto the big one: the village keeps its shape
   * around the hall, which now stands in the middle of the land. Call with `state` set to it.
   */
  function migrateV1() {
    const dx = M.hall.x - 12, dy = M.hall.y - 11; // the old hall stood at tile (12, 11)
    state.mapSeed = CONFIG.seed; state.land = { cut: {}, planted: {}, paved: {} };
    for (const b of state.buildings) { b.x += dx; b.y += dy; }
    const kept = state.buildings.slice().sort((p, q) => (q.kind === 'hall') - (p.kind === 'hall')); // the hall takes its place first
    state.buildings = [];
    sync();
    for (const b of kept) if (settle(b)) state.buildings.push(b);
    const r = state.raid; // the old road is gone: a raid on it is called off, the next one comes on time
    if (r.active) { r.active = null; r.timer = tune.raid_interval; }
    r.warned = false; r.from = null; r.royal = null;
    state.cam = Object.assign({ k: 0 }, World.camOn((M.hall.x + 2) * T, (M.hall.y + 2) * T));
    state.v = 2;
    World.reset(); Raid.reset();
  }

  // ---- Counting and prices ----
  const count = kind => state.buildings.reduce((n, b) => n + (b.kind === kind ? 1 : 0), 0);
  const byUid = uid => state.buildings.find(b => b.uid === uid);
  /** Everyone housed: a house holds what its class says, and two more for each of its levels. */
  function pop() { let n = 0; for (const b of state.buildings) if (B[b.kind].pop) n += housed(b); return n; }
  const housed = b => classOf(b).pop + (b.lvl - 1) * 2 + City.housedBonus(b);
  /** Citizens with no trade yet: each worker and soldier takes one. Never under 0: when the hero's popularity drops, the houses hold fewer and nobody is sent home. */
  const freeCitizens = () => Math.max(0, pop() - state.units.length);

  // ---- Classes: a house eats its class's needs, pays more the happier it is, and rises when it is full ----
  const classOf = b => CL[Math.min(CL.length - 1, b.cls || 0)];
  const nextClass = b => CL[(b.cls || 0) + 1] || null;
  /** A house's satisfaction, 0 to 1. One built before classes existed starts in the middle. */
  const satOf = b => b.sat == null ? 0.5 : b.sat;
  /** What multiplies a house's tax: its class, how well it is fed and served, and the beauty of its street. */
  const taxMult = b => classOf(b).tax * (tune.unhappy_tax + (1 - tune.unhappy_tax) * satOf(b)) * beautyMult(b) * City.taxMult(b);
  /** How many houses are of this class (its place in DATA.classes) or a higher one. */
  const classCount = i => state.buildings.reduce((n, b) => n + (B[b.kind].pop && (b.cls || 0) >= i ? 1 : 0), 0);
  const raiseCost = b => { const n = nextClass(b); return n ? scaleCost(n.raise, tune.cost_scale) : null; };
  /**
   * Everything a house needs to rise into the next class, each with whether it holds: full
   * satisfaction, the village far enough along, the services and the beauty of the next class.
   */
  function raiseSteps(b) {
    const n = nextClass(b); if (!n) return [];
    const out = [{ ok: satOf(b) >= tune.raise_sat - 1e-6, text: tr('raise_sat', { pct: Math.round(tune.raise_sat * 100) }) }];
    for (const p of Quests.describe(n.opens)) out.push({ ok: p.ok, text: p.text });
    for (const p of City.raiseSteps(b, n)) out.push(p);
    for (const k of n.services) out.push({ ok: servicesOf(b).has(k), text: tr('in_reach', { name: B[k].name }), svc: k });
    if (n.beauty) out.push({ ok: beauty(b).total >= n.beauty, text: tr('beauty_need', { n: n.beauty, have: fmtNum(beauty(b).total) }) });
    if (!onRoad(b)) out.push({ ok: false, text: tr('no_road_short') });
    return out;
  }
  const canRaise = b => !!nextClass(b) && !b.damaged && raiseSteps(b).every(p => p.ok);
  /** Raises a house to the next class: everything in raiseSteps holds, and the price is paid. Its new needs start half met. */
  function raise(b) {
    const n = nextClass(b);
    if (!n || !canRaise(b)) return false;
    if (!pay(raiseCost(b))) { toast(tr('no_funds'), UI.C.bad); return false; }
    b.cls = (b.cls || 0) + 1; b.sat = 0.5; b.lack = null;
    World.dust(b); sfx('fanfare'); toast(tr('class_up', { name: n.name }), UI.C.gold);
    events.push({ type: 'class', cls: n.id }); City.event('class', { cls: n.id }); refreshUnlocks();
    return true;
  }
  /**
   * One house, one step: its meals (all of a meal or none of it), then its tax. A service its
   * class wants and does not have in reach counts as a missing need. A house cut off from the
   * roads neither eats nor pays: it waits.
   */
  function houseTick(b, d, dt) {
    if (!onRoad(b)) { b.lack = null; return; }
    const c = classOf(b), miss = missingServices(b, c);
    b.meal = (b.meal || 0) + dt / tune.need_cycle;
    for (let k = 0; b.meal >= 1 && k < 400; k++) {
      b.meal -= 1;
      let lack = null;
      for (const r in c.needs) if (state.res[r] < c.needs[r]) { lack = r; break; }
      if (!lack) for (const r in c.needs) state.res[r] -= c.needs[r];
      b.lack = lack; b.lackSvc = miss[0] || null;
      b.sat = clamp(satOf(b) + City.mealSat(b, !(lack || miss.length)), 0, City.satMax(b));
    }
    if (b.meal >= 1) b.meal = 0; // a very long absence: the rest is let go
    b.prog += dt / d.cycle;
    if (b.prog >= 1) { const n = Math.floor(b.prog); b.prog -= n; for (const r in d.produces) gain(r, d.produces[r] * taxMult(b) * outMult(b) * n); }
  }

  // ---- The safe zone: no raider ever comes out within this many tiles of the town hall ----
  /** Its radius in tiles: wider at each hall level, but never reaching the goblin camp. */
  function safeRadius() { const h = state.buildings.find(b => b.kind === 'hall'); return Math.min(tune.raid_camp_dist - 8, tune.safe_radius + ((h ? h.lvl : 1) - 1) * tune.safe_radius_step); }
  /** Whether a map point lies in the safe zone. */
  function inSafe(mx, my) { const h = hallMid(); return Math.hypot(mx - h.x, my - h.y) <= safeRadius() * T; }

  // ---- The market: gold against goods, a lot at a time (data/people.js DATA.trade) ----
  const market = () => state.buildings.find(b => b.kind === 'market' && !b.damaged && onRoad(b)) || null;
  /** Gold for one lot bought: each market level cuts it a little. */
  function buyPrice(res) { const m = market(), cut = Math.min(tune.trade_max_cut, ((m ? m.lvl : 1) - 1) * tune.trade_level_step); return Math.max(1, Math.ceil(DATA.trade[res].buy * tune.trade_lot * (1 - cut) * City.buyMult())); }
  /** Gold for one lot sold. */
  const sellPrice = res => Math.max(1, Math.floor(DATA.trade[res].sell * tune.trade_lot * City.sellMult()));
  function buy(res) {
    const p = buyPrice(res);
    if (!market() || state.res.gold < p) { toast(tr('no_funds'), UI.C.bad); return false; }
    state.res.gold -= p; gain(res, tune.trade_lot); sfx('coin'); return true;
  }
  function sell(res) {
    if (!market() || state.res[res] < tune.trade_lot) { toast(tr('no_funds'), UI.C.bad); return false; }
    state.res[res] -= tune.trade_lot; gain('gold', sellPrice(res)); sfx('coin'); return true;
  }
  function scaleCost(c, k) { const o = {}; for (const r in c) o[r] = Math.max(1, Math.ceil(c[r] * k)); return o; }
  /**
   * What the lodge leaves of a price: its standing discount (Venue.lodgePerks) and Aveline's gift (Venue.buff('build'))
   * together, at most config lodge_plans_cap off. All of it for a great work, and when neither runs.
   */
  const plans = kind => B[kind].monument ? 1 : 1 - Math.min(tune.lodge_plans_cap, Venue.buff('build') + Venue.lodgePerks().plans);
  /** What a demolition gives back, as a share of the base price: refund_pct, the lodge adding a little (`gain`, the standing lodge's when left out), never past 1 minus the discount cap. */
  const refundShare = (gain = Venue.lodgePerks().refund) => Math.max(tune.refund_pct, Math.min(tune.refund_pct + gain, 1 - tune.lodge_plans_cap));
  /**
   * `c` at the share `k` of its base price, times `m` (what the plans leave). With a lodge standing and `cut` set, the lodge always
   * takes at least one unit off each resource (rounding would hide a small cut), but never down to what a demolition gives back
   * (so buying then demolishing never pays) nor to under 1.
   */
  function priced(c, k, m, cut) {
    const out = scaleCost(c, k * m);
    if (!cut || !(Venue.lodgePerks().plans > 0)) return out;
    const full = scaleCost(c, k), back = scaleCost(c, refundShare());
    for (const r in out) out[r] = Math.min(full[r], Math.max(back[r], Math.min(out[r], full[r] - 1)));
    return out;
  }
  /** The price of one more of this kind: each one already built raises it. */
  function cost(kind) { const d = B[kind]; return priced(d.cost, Math.pow(d.growth || tune.cost_growth, count(kind)) * tune.cost_scale, plans(kind), !d.monument); }
  function upgradeCost(b) { if (B[b.kind].monument) return City.stageCost(b); return priced(B[b.kind].cost, tune.upgrade_cost_base * Math.pow(tune.upgrade_cost_growth, b.lvl - 1) * tune.cost_scale, plans(b.kind), true); }
  function refund(b) { return scaleCost(B[b.kind].cost, refundShare()); }
  /** A repair: repair_pct of the base price, the lodge taking up to half off, and at least one unit of each resource when it stands. */
  function repairCost(b) {
    const c = B[b.kind].cost, perks = Venue.lodgePerks(), out = scaleCost(c, tune.repair_pct * (1 - perks.repair));
    if (!(perks.plans > 0)) return out;
    const full = scaleCost(c, tune.repair_pct);
    for (const r in out) out[r] = Math.max(1, Math.min(out[r], full[r] - 1));
    return out;
  }
  function canAfford(c) { for (const r in c) if (state.res[r] < c[r]) return false; return true; }
  function pay(c) { if (!canAfford(c)) return false; for (const r in c) state.res[r] -= c[r]; return true; }
  /** Adds to the stock (and to the lifetime totals the quests and the new start read). */
  function gain(res, n) {
    state.res[res] += n; state.totals[res] += n;
    if (res === 'gold') { state.stats.goldEarned += n; state.score = Math.floor(state.stats.goldEarned); }
  }

  // ---- Output ----
  /** What a level adds, and the doubling every few levels. */
  function levelMult(b) { return 1 + (b.lvl - 1) * tune.upgrade_output_step; }
  function milestoneMult(b) { return Math.pow(2, Math.floor(b.lvl / tune.milestone_levels)); }
  function renownMult() { return 1 + state.prestige.renown * tune.renown_bonus; }
  function outMult(b) { return levelMult(b) * milestoneMult(b) * renownMult() * tune.prod_scale * City.outMult(b); }
  function wallMax(b) { return B[b.kind].wall.hp * b.lvl; }
  /** The share of each stock one raider steals at the hall: less for every town hall level. */
  function pillagePct() {
    const h = state.buildings.find(b => b.kind === 'hall');
    return tune.raid_pillage_pct * Math.pow(1 - tune.hall_guard_step, (h ? h.lvl : 1) - 1);
  }

  /** One step of every chain: a building's cycle fills, eats its inputs and adds its output. */
  function tick(dt) {
    refreshTown();
    for (const b of state.buildings) {
      const d = B[b.kind];
      if (b.damaged) continue;
      if (d.pop) { houseTick(b, d, dt); continue; }
      if (!onRoad(b)) { b.starved = null; continue; } // no path to the hall: it waits
      if (b.paused) b.starved = null; // stopped by the player: it waits for nothing
      if (d.produces && !b.paused) {
        b.prog += dt / d.cycle;
        if (b.prog >= 1) {
          const lm = levelMult(b);
          let n = Math.floor(b.prog), short = null;
          if (d.consumes) for (const r in d.consumes) { const can = Math.floor(state.res[r] / (d.consumes[r] * lm) + 1e-9); if (can < n) { n = can; short = r; } }
          if (n > 0) {
            if (d.consumes) for (const r in d.consumes) state.res[r] = Math.max(0, state.res[r] - d.consumes[r] * lm * n);
            const om = outMult(b);
            for (const r in d.produces) gain(r, d.produces[r] * om * n);
            b.prog -= n; b.starved = null;
          } else { b.prog = 1; b.starved = short; }
        }
      }
      if (b.craft) {
        b.craft.left -= dt * (1 + (b.lvl - 1) * 0.25) / (1 - Venue.buff('forge')); // the forge's gift after its mini-game: that share off the time (js/venue.js)
        if (b.craft.left <= 0) { const c = b.craft; b.craft = null; Hero.finishCraft(c); }
      }
    }
    refreshUnlocks();
  }
  /** Net gain per second of each resource, for the top bar. */
  function rates() {
    const out = {};
    for (const b of state.buildings) {
      const d = B[b.kind];
      if (!d.produces || b.damaged || b.starved || b.paused || !onRoad(b)) continue;
      if (d.pop) { // a house: its tax, and what it eats when it is fed
        const c = classOf(b);
        for (const r in d.produces) out[r] = (out[r] || 0) + d.produces[r] * taxMult(b) * outMult(b) / d.cycle;
        if (!b.lack) for (const r in c.needs) out[r] = (out[r] || 0) - c.needs[r] / tune.need_cycle;
        continue;
      }
      for (const r in d.produces) out[r] = (out[r] || 0) + d.produces[r] * outMult(b) / d.cycle;
      if (d.consumes) for (const r in d.consumes) out[r] = (out[r] || 0) - d.consumes[r] * levelMult(b) / d.cycle;
    }
    const u = Units.rates(); // what the workers bring in, on average
    for (const r in u) out[r] = (out[r] || 0) + u[r];
    const ex = Explore.rates(); for (const r in ex) out[r] = (out[r] || 0) + ex[r]; // EXPLORE hook: the trade routes and the claimed deposits
    return out;
  }

  // ---- Unlocks ----
  const isUnlocked = kind => !B[kind].unlock || !!state.unlocked[kind];
  function refreshUnlocks(quiet) {
    for (const k of DATA.buildOrder) {
      if (B[k].unlock && !state.unlocked[k] && Quests.met(B[k].unlock)) {
        state.unlocked[k] = true;
        if (!quiet) { toast(tr('new_building', { name: B[k].name }), UI.C.gold); sfx('unlock'); }
      }
    }
  }
  /** The next population milestone and what it opens, or null. */
  function nextPopUnlock() {
    let best = null;
    for (const k of DATA.buildOrder) { const u = B[k].unlock; if (u && u.pop && !state.unlocked[k] && (!best || u.pop < best.pop)) best = { pop: u.pop, name: B[k].name }; }
    return best;
  }

  // ---- Placing ----
  /** Whether a building of this kind fits with its top-left tile at (tx, ty). */
  function canPlace(kind, tx, ty, ignoreUid, rot) {
    const d = size(kind, rot);
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
      if (!inMap(tx + x, ty + y)) return false;
      const o = occ[idx(tx + x, ty + y)];
      if (o !== 0 && o !== ignoreUid) return false;
      if (!Explore.seen(tx + x, ty + y)) return false; // under the fog: nothing is built there yet
    }
    return true;
  }
  /** Builds one. `free`: nothing is paid. `quiet`: no word when it cannot (a stroke of the pointer drawing a wall). `rot`: 1 turned. */
  function place(kind, tx, ty, free, quiet, rot) {
    const d = B[kind];
    if (d.unique && count(kind) > 0) return false;
    if (!canPlace(kind, tx, ty, undefined, rot)) { if (!quiet) toast(tr('bad_spot'), UI.C.bad); return false; }
    if (!free && !pay(cost(kind))) { if (!quiet) toast(tr('no_funds'), UI.C.bad); return false; }
    const b = { uid: state.nextUid++, kind, x: tx, y: ty, lvl: 1, prog: 0 };
    if (rot && canTurn(kind)) b.rot = 1;
    if (d.wall) b.hp = d.wall.hp;
    state.buildings.push(b); stamp(b, b.uid); Raid.touch(); touchTown(); Units.touch();
    World.dust(b); sfx('place'); events.push({ type: 'build', kind }); City.event('build', { kind });
    return b;
  }
  /** Moves a building, turned as `rot` says (its own way when left out). */
  function move(b, tx, ty, rot) {
    if (rot == null) rot = b.rot || 0;
    if (!canPlace(b.kind, tx, ty, b.uid, rot)) { toast(tr('bad_spot'), UI.C.bad); return false; }
    stamp(b); b.x = tx; b.y = ty; if (rot && canTurn(b.kind)) b.rot = 1; else delete b.rot; stamp(b, b.uid); Raid.touch(); touchTown(); World.dust(b); sfx('place'); return true;
  }
  function demolish(b) {
    if (B[b.kind].fixed) return;
    if (B[b.kind].train) Units.refund(b); // the recruits in its line are paid back
    const r = refund(b); for (const k in r) state.res[k] += r[k];
    state.buildings.splice(state.buildings.indexOf(b), 1); stamp(b); Raid.touch(); touchTown(); Units.touch(); sfx('chop');
  }
  function upgrade(b) {
    if (B[b.kind].decor) return false;
    if (B[b.kind].monument) return City.advance(b); // a great work: its next stage, at the price of data/city.js
    if (!pay(upgradeCost(b))) { toast(tr('no_funds'), UI.C.bad); return false; }
    b.lvl++; if (B[b.kind].wall) b.hp = wallMax(b);
    World.dust(b); sfx('unlock'); Raid.touch(); touchTown();
    if (b.lvl % tune.milestone_levels === 0 && B[b.kind].produces) { sfx('fanfare'); floatText((b.x + dims(b).w / 2) * T, (b.y + dims(b).h / 2) * T, tr('x2'), UI.C.gold, 24, World.bRect(b).h); }
    return true;
  }
  /**
   * The rampart a wall belongs to, for « Tout le rempart »: every standing wall of its kind joined to
   * it side to side (a traced rampart always is), through walls of any level; of those, the ones at
   * its own level, itself first. A broken one is a gap: it splits the rampart.
   */
  function rampart(b) {
    if (!B[b.kind].wall || b.damaged) return [b];
    return joined(b, true).filter(o => o.lvl === b.lvl);
  }
  /** Every wall of b's kind joined to it side to side, itself first; `standing`: the broken ones are gaps and do not join. */
  function joined(b, standing) {
    const at = new Map(), key = (x, y) => x + ',' + y;
    for (const o of state.buildings) if (o.kind === b.kind && !(standing && o.damaged)) at.set(key(o.x, o.y), o);
    const seen = new Set([b]), todo = [b];
    while (todo.length) {
      const o = todo.pop();
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const n = at.get(key(o.x + dx, o.y + dy)); if (n && !seen.has(n)) { seen.add(n); todo.push(n); } }
    }
    return [...seen];
  }
  /** The whole rampart this wall belongs to: standing and broken pieces, of any level. Just itself when it is no wall. */
  function rampartAll(b) { return B[b.kind].wall ? joined(b, false) : [b]; }
  const sumCosts = (list, f) => { const c = {}; for (const o of list) { const u = f(o); for (const r in u) c[r] = (c[r] || 0) + u[r]; } return c; };
  /** What repairing every broken piece of the rampart costs, and what pulling the whole of it down gives back. */
  const rampartRepairCost = list => sumCosts(list.filter(o => o.damaged), repairCost);
  const rampartRefund = list => sumCosts(list, refund);
  /** Repairs every broken piece of this wall's rampart, all or none. */
  function repairRampart(b) {
    const list = rampartAll(b).filter(o => o.damaged);
    if (!list.length) return false;
    if (!pay(rampartRepairCost(list))) { toast(tr('no_funds'), UI.C.bad); return false; }
    for (const o of list) { o.damaged = false; o.siege = 0; o.hp = wallMax(o); stamp(o, o.uid); }
    sfx('place'); Raid.touch(); touchTown();
    return true;
  }
  /** Pulls the whole rampart of this wall down, and gives back the refund of each piece. */
  function demolishRampart(b) {
    const list = rampartAll(b), r = rampartRefund(list);
    for (const k in r) state.res[k] += r[k];
    for (const o of list) { state.buildings.splice(state.buildings.indexOf(o), 1); stamp(o); }
    Raid.touch(); touchTown(); Units.touch(); sfx('chop');
  }
  /** What raising all of them one level costs: the sum of their upgrades. */
  function rampartCost(list) {
    const c = {};
    for (const o of list) { const u = upgradeCost(o); for (const r in u) c[r] = (c[r] || 0) + u[r]; }
    return c;
  }
  /** Raises the whole rampart of this wall (`rampart`) one level, all or none. */
  function upgradeRampart(b) {
    const list = rampart(b);
    if (!pay(rampartCost(list))) { toast(tr('no_funds'), UI.C.bad); return false; }
    for (const o of list) { o.lvl++; o.hp = wallMax(o); World.dust(o); }
    sfx('unlock'); Raid.touch(); touchTown();
    return true;
  }
  /** Changes a building's look to one of its styles (data/buildings.js `styles`). Free, at any time. */
  function setStyle(b, i) {
    const st = B[b.kind].styles;
    if (!st || i < 0 || i >= st.length || (b.style || 0) === i) return false;
    b.style = i; World.dust(b); sfx('place');
    return true;
  }
  function repair(b) {
    if (!pay(repairCost(b))) { toast(tr('no_funds'), UI.C.bad); return false; }
    b.damaged = false; b.siege = 0; if (B[b.kind].wall) { b.hp = wallMax(b); stamp(b, b.uid); }
    sfx('place'); Raid.touch(); touchTown(); return true;
  }

  /** The renown a new start would give now: for the gold this village earned, and for the rank it reached once it has earned some. */
  function renownGain() { const n = Math.floor(Math.sqrt(state.stats.goldEarned / tune.renown_gold_divisor)); return n < 1 ? 0 : n + City.renownBonus(); }
  /**
   * The new start: trades the village for renown. The hero, his quests, the legacy tree, the places
   * found while exploring, the venues and the land's seed stay; the buildings, the stocks, the city's
   * rank, its orders, its taxes and its great works start again (state.city is a fresh one).
   */
  function newStart() {
    const n = renownGain(); if (n < 1) return false;
    const keep = { hero: state.hero, quests: state.quests, counters: state.counters, prestige: state.prestige, flags: state.flags, tuto: state.tuto, unlocked: state.unlocked, t: state.t, mission: state.mission, mapSeed: state.mapSeed, explore: state.explore, venue: state.venue };
    const hadRaids = state.raid.timer != null || state.raid.active;
    state = Object.assign(fresh(), keep);
    state.prestige.renown += n; state.prestige.count++;
    for (const k in state.unlocked) if (B[k] && B[k].unlock && B[k].unlock.rank) delete state.unlocked[k]; // what a city rank opened closes again with the rank
    const stock = City.startStocks(); for (const r in stock) state.res[r] += stock[r]; // the legacy's starting stocks: given, not earned
    if (hadRaids) state.raid.timer = tune.raid_first_delay;
    sync(); state.gained = tr('prestige_done', { n });
    toast(state.gained, UI.C.gold); sfx('fanfare');
    return true;
  }

  return {
    sync, fresh, drawSeed, sharedSeed, rebuildOcc, migrateV1, tick, rates, count, byUid, pop, housed, freeCitizens, classOf, nextClass, satOf, taxMult, classCount, raiseCost, canRaise, raise,
    safeRadius, inSafe, market, buyPrice, sellPrice, buy, sell, scaleCost, cost, upgradeCost, refund, refundShare, repairCost, canAfford, pay, gain,
    levelMult, milestoneMult, renownMult, outMult, wallMax, pillagePct, isUnlocked, refreshUnlocks, nextPopUnlock,
    size, dims, canTurn, wallAt, wallMask, stamp, canPlace, place, move, demolish, upgrade, rampart, rampartAll, rampartCost, rampartRepairCost, rampartRefund, upgradeRampart, repairRampart, demolishRampart, setStyle, repair, chop, clearTile, plant, pave, toolCost, renownGain, newStart,
    needsRoad, onRoad, roadAt, serviceRadius, refreshTown, touchTown, autoRoads, servicesOf, servicesAt, missingServices, beauty, beautyAt, beautyMult, raiseSteps, campMid, raiseCamp, CAMP,
    idx, inMap, groundAt, floraAt, walkable, biomeAt, hallMid, flora, occ, shakes, net,
    GROUND, FLORA,
  };
})();
