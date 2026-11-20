// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Exploration: the fog over the land, the places it hides and the expeditions that find them.
//
//   The fog     The map is cut in square cells of `fog_cell` tiles. A cell is seen or not, for good.
//               The town sees around its hall (the safe zone and a margin), around each building,
//               around each soldier and the hero as they walk, around the goblin camp and along the
//               way to it. Under the fog nothing is drawn (js/world.js), built or gathered.
//   The places  Drawn from the land's seed, so the same land always hides the same places: ruins,
//               lairs, hamlets and deposits (data/explore.js), none within `site_min_dist` tiles
//               of the hall, their level growing with their distance. A place is found when the
//               fog lifts on it.
//   The trips   The hero walks to a place (he is away from the village meanwhile, like on a mission)
//               and acts there: a fight, a gift, a claim. Scouts, paid in bread and gold, walk out
//               in one of eight directions, farther each time, and come home.
//
// Everything saved is in state.explore (plain data):
//   cell, fog   the cells' size when the fog was written, and the seen cells, six to a letter
//   sites       id -> what the player did with a place found: { f: found, done (ruin),
//               n, wait (lair: times cleared, seconds until it fills again),
//               open, fr, ask (hamlet: route open, friendship, the next delivery),
//               own, dp (deposit: claimed, depth) }
//   trip        the hero's expedition: { site, phase: 'out' | 'there' | 'back', x0, y0, x1, y1, t, total }
//   scouts      [{ dir, dist (tiles), t, total, n (places found on the way) }]
//   reach       how many times scouts went each of the eight ways
//   payT        seconds since the routes and deposits last paid; done: actions completed, by kind
// The places themselves, the grid of cells and the lists below are worked out again from the seed
// and from state.explore by sync(): they are never saved.
'use strict';

const Explore = (() => {
  const M = DATA.map, T = M.tile, X = DATA.explore, K = X.kinds, SIZE = X.size, RES = DATA.resources;
  const hash = MapGen.hash;
  // The eight ways, as steps on the map, in the order World.octant() and DATA.strings.dirs name
  // them on screen: east, south-east, south, south-west, west, north-west, north, north-east.
  const DIRS = [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; // six cells to a letter
  const EMPTY = Object.freeze({}); // what is known of a place nobody found

  let cell = 0, gw = 0, gh = 0, grid = new Uint8Array(0), known = 0; // the cells: 1 seen
  let sites = [], found = [], shownList = [];   // every place of this land; those found, nearest first; those drawn
  const byId = new Map(), byCell = new Map(), onTile = new Map(); // a place by its id, by the cell of its middle, by each tile of it and of its yard
  const reachMax = [0, 0, 0, 0, 0, 0, 0, 0];     // tiles from the hall to the sea, each way
  let quiet = false, finder = null;             // quiet: places are found without a word (a load, the demo); finder: the scouts lifting the fog now
  let slowT = 0, fastT = 0, listStale = true;   // the looks around are spread out: nothing here needs every step
  const pings = [];                             // where a place was just found: rings on the map, drawn only

  /** A new game's part of the save. */
  const fresh = () => ({ cell: 0, fog: '', sites: {}, trip: null, scouts: [], reach: [0, 0, 0, 0, 0, 0, 0, 0], payT: 0, done: { ruin: 0, lair: 0, hamlet: 0, deposit: 0 } });
  /** Fills what an older save lacks (js/save.js). The fog itself is lifted around what stands by sync(). */
  function adopt(data) {
    const b = fresh();
    if (!data.explore || typeof data.explore !== 'object') data.explore = b;
    const e = data.explore;
    for (const k in b) if (e[k] == null && b[k] != null) e[k] = b[k];
    if (!Array.isArray(e.reach) || e.reach.length !== 8) e.reach = b.reach;
    if (!Array.isArray(e.scouts)) e.scouts = [];
    for (const k in b.done) if (e.done[k] == null) e.done[k] = 0;
  }

  // ---- The fog ----
  function pack() {
    let s = '';
    for (let i = 0; i < grid.length; i += 6) { let v = 0; for (let j = 0; j < 6; j++) if (grid[i + j]) v |= 1 << j; s += A64[v]; }
    return s;
  }
  function unpack(s, n) {
    const g = new Uint8Array(n);
    for (let i = 0; i < s.length; i++) { const v = A64.indexOf(s[i]); for (let j = 0; j < 6; j++) if ((v >> j) & 1 && i * 6 + j < n) g[i * 6 + j] = 1; }
    return g;
  }
  /** Whether the fog is lifted on a tile. */
  const lifted = (tx, ty) => tx >= 0 && ty >= 0 && tx < M.w && ty < M.h && grid[((ty / cell) | 0) * gw + ((tx / cell) | 0)] === 1;
  /**
   * Whether a tile is known and free of any place: the fog is lifted on it and no ruin, lair, hamlet
   * or deposit stands there. Nothing is built (js/village.js canPlace), gathered (js/units.js) or
   * drawn (js/world.js) where this is false.
   */
  const seen = (tx, ty) => lifted(tx, ty) && !onTile.has(ty * M.w + tx);
  /** How thick the veil is at a point given in tiles: 0 on seen land, 1 deep in the fog, in between across a cell's edge. */
  function veil(fx, fy) {
    const gx = fx / cell - 0.5, gy = fy / cell - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), u = gx - x0, v = gy - y0;
    const x1 = clamp(x0 + 1, 0, gw - 1), y1 = clamp(y0 + 1, 0, gh - 1), xa = clamp(x0, 0, gw - 1), ya = clamp(y0, 0, gh - 1);
    const a = 1 - grid[ya * gw + xa], b = 1 - grid[ya * gw + x1], c = 1 - grid[y1 * gw + xa], d = 1 - grid[y1 * gw + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  /** What a square of `n` tiles from (tx, ty) holds, with the cells around it: 0 no fog at all, 1 nothing but fog, 2 both. */
  function veilKind(tx, ty, n) {
    const x0 = Math.max(0, Math.floor(tx / cell) - 1), x1 = Math.min(gw - 1, Math.floor((tx + n - 1) / cell) + 1);
    const y0 = Math.max(0, Math.floor(ty / cell) - 1), y1 = Math.min(gh - 1, Math.floor((ty + n - 1) / cell) + 1);
    let some = false, all = true;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (grid[y * gw + x]) some = true; else all = false; }
    return all ? 0 : some ? 2 : 1;
  }
  /**
   * Lifts the fog for good around a map point (pixels), `r` tiles around. The places standing on
   * the land it uncovers are found. Returns true when it uncovered anything.
   */
  function reveal(mx, my, r) {
    if (!gw) return false;
    const cx = mx / T / cell, cy = my / T / cell, R = r / cell + 0.5;
    let changed = false;
    for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(gh - 1, Math.floor(cy + R)); y++) {
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(gw - 1, Math.floor(cx + R)); x++) {
        const i = y * gw + x;
        if (grid[i] || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > R) continue;
        grid[i] = 1; known++; changed = true;
        World.fogDirty((x - 1) * cell, (y - 1) * cell, (x + 2) * cell, (y + 2) * cell); // the veil is soft: its neighbours change too
        const here = byCell.get(i);
        if (here) for (const s of here) find(s);
      }
    }
    if (changed) { state.explore.fog = pack(); Units.touch(); } // the save is always true; a worker may find a nearer tree
    return changed;
  }
  /** What the town sees without moving: around the hall, each building, the goblin camp and the way to it. */
  function lookAround() {
    const h = Village.hallMid();
    reveal(h.x, h.y, Village.safeRadius() + tune.fog_sight_margin + City.bonus('sight'));
    for (const b of state.buildings) { const d = Village.dims(b); reveal((b.x + d.w / 2) * T, (b.y + d.h / 2) * T, tune.fog_sight_building); }
    if (state.raid.camp) { // always in sight, with the way to it: raids come from there, and the guard is sent there
      const m = Village.campMid(), n = Math.max(1, Math.ceil(Math.hypot(m.x - h.x, m.y - h.y) / (cell * T)));
      reveal(m.x, m.y, tune.fog_sight_camp);
      for (let i = 1; i < n; i++) reveal(h.x + (m.x - h.x) * i / n, h.y + (m.y - h.y) * i / n, tune.fog_sight_camp / 2);
    }
  }
  /** What those who walk see: each soldier on his feet, the hero at his post or on his way, the scouts. */
  function lookMoving() {
    for (const u of state.units) if (Units.isSoldier(u) && !(u.down > 0)) reveal(u.x, u.y, tune.fog_sight_soldier);
    const p = heroAt(), rh = Raid.hero;
    if (p) reveal(p.x, p.y, tune.fog_sight_hero);
    else if (!state.mission && (rh.x || rh.y)) reveal(rh.x, rh.y, tune.fog_sight_soldier);
    for (const sc of state.explore.scouts) { const q = scoutAt(sc); finder = sc; reveal(q.x, q.y, tune.fog_sight_scout + q.d * tune.scout_fan); finder = null; }
  }

  // ---- The places ----
  /** What the player did with a place (read only for one nobody found). */
  const rec = s => state.explore.sites[s.id] || EMPTY;
  /** A place's level now: its own, plus one for each time a lair was cleared. */
  const levelOf = s => s.lvl + (s.kind === 'lair' ? rec(s).n || 0 : 0);
  /** What a level does to rewards, prices and pays. */
  const gainMult = lvl => 1 + (lvl - 1) * tune.site_reward_step;
  /** Whether a place may stand with its top-left tile at (tx, ty): on the map, on ground one can build on, with its yard (a tile behind it, two before it). */
  function fits(tx, ty) {
    for (let y = -1; y <= SIZE + 1; y++) for (let x = -1; x <= SIZE + 1; x++) {
      if (!Village.inMap(tx + x, ty + y) || !DATA.ground[Village.biomeAt(tx + x, ty + y).ground].build) return false;
    }
    return true;
  }
  /** One of a weighted list, by a number from 0 to 1. */
  function pick(list, weights, p) {
    let total = 0; for (const w of weights) total += w;
    p *= total;
    for (let i = 0; i < list.length; i++) { p -= weights[i]; if (p < 0) return list[i]; }
    return list[list.length - 1];
  }
  /**
   * Every place of this land, from its seed alone: one at most per square of `site_spacing` tiles,
   * in `site_density` of the squares, nowhere within `site_min_dist` tiles of the hall or on water.
   * A place's id is its square, so the save finds it again.
   */
  function buildSites() {
    sites = []; byId.clear(); byCell.clear(); onTile.clear();
    const S = Math.max(SIZE + 4, Math.round(tune.site_spacing)), seed = state.mapSeed | 0, h = Village.hallMid(), hx = h.x / T, hy = h.y / T, kinds = Object.keys(K);
    for (let gy = 0; gy * S < M.h; gy++) for (let gx = 0; gx * S < M.w; gx++) {
      if (hash(gx, gy, seed + 301) >= tune.site_density) continue;
      const tx = gx * S + 1 + Math.floor(hash(gx, gy, seed + 307) * (S - SIZE - 2)), ty = gy * S + 1 + Math.floor(hash(gx, gy, seed + 311) * (S - SIZE - 2));
      const d = Math.hypot(tx + SIZE / 2 - hx, ty + SIZE / 2 - hy);
      if (d < tune.site_min_dist || !fits(tx, ty)) continue;
      const lvl = 1 + Math.floor((d - tune.site_min_dist) / tune.site_level_step), ground = Village.biomeAt(tx, ty).ground;
      const kind = pick(kinds, kinds.map(k => (K[k].weight || 1) * ((K[k].on || {})[ground] || 1)), hash(gx, gy, seed + 313));
      const k = K[kind], n = hash(gx, gy, seed + 317);
      const veins = k.veins ? k.veins.filter(v => (v.minLvl || 1) <= lvl) : null, vein = veins ? pick(veins, veins.map(v => v.weight || 1), hash(gx, gy, seed + 331)) : null;
      const s = { id: gx + '_' + gy, kind, tx, ty, lvl, d, x: (tx + SIZE / 2) * T, y: (ty + SIZE / 2) * T, vein, name: vein ? vein.name : k.names[Math.floor(n * k.names.length)] };
      sites.push(s); byId.set(s.id, s);
      for (let y = -1; y <= SIZE + 1; y++) for (let x = -1; x <= SIZE + 1; x++) onTile.set((ty + y) * M.w + tx + x, s); // its yard too: no tree is drawn there, so none hides it
    }
  }
  /** Files each place under the cell its middle is in: when that cell is seen, it is found. */
  function fileSites() {
    byCell.clear();
    for (const s of sites) { const i = Math.floor((s.ty + SIZE / 2) / cell) * gw + Math.floor((s.tx + SIZE / 2) / cell); if (!byCell.has(i)) byCell.set(i, []); byCell.get(i).push(s); }
  }
  /** The fog just lifted on a place: it is known from now on, with a word and rings on the map. */
  function find(s) {
    const all = state.explore.sites;
    if (all[s.id] && all[s.id].f) return;
    all[s.id] = Object.assign(all[s.id] || {}, { f: 1 });
    found.push(s); listStale = true;
    if (finder) finder.n = (finder.n || 0) + 1;
    if (quiet) return;
    toast(tr('ex_found', { dir: Raid.compass(s), name: s.name, lvl: tr('ex_lvl', { n: s.lvl }) }), UI.C.gold); sfx('unlock');
    pings.push({ x: s.x, y: s.y, t: 0 });
  }
  /** Whether a place found can be seen and used: no goblin camp rose over it, no building stands on it. */
  function usable(s) {
    if (state.raid.camp && Camp.covers(s.x, s.y)) return false;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (Village.occ[Village.idx(s.tx + x, s.ty + y)] > 0) return false;
    return true;
  }
  function refreshLists() {
    listStale = false;
    found.sort((p, q) => p.d - q.d);
    shownList = found.filter(usable);
  }
  /** The places found that stand on the map now, for js/world.js: [{ id, kind, tx, ty, x, y, lvl, name }]. */
  const shown = () => { if (listStale) refreshLists(); return shownList; };

  /**
   * Makes the caches match the save: the places of this land, the grid of cells read from
   * state.explore.fog (cut again when `fog_cell` changed), then the fog lifted, without a word,
   * around everything the village has. Call after `state` is replaced (Village.sync does).
   */
  function sync() {
    adopt(state);
    const e = state.explore, c = clamp(Math.round(tune.fog_cell), 1, 32), w = Math.ceil(M.w / c), h = Math.ceil(M.h / c);
    if (e.fog && e.cell === c) grid = unpack(e.fog, w * h);
    else if (e.fog && e.cell > 0) { // the cells' size changed: each new cell is seen when the old one under its middle was
      const ow = Math.ceil(M.w / e.cell), old = unpack(e.fog, ow * Math.ceil(M.h / e.cell));
      grid = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const tx = Math.min(M.w - 1, Math.floor((x + 0.5) * c)), ty = Math.min(M.h - 1, Math.floor((y + 0.5) * c));
        grid[y * w + x] = old[Math.floor(ty / e.cell) * ow + Math.floor(tx / e.cell)];
      }
    } else grid = new Uint8Array(w * h);
    cell = c; gw = w; gh = h; e.cell = c;
    known = 0; for (let i = 0; i < grid.length; i++) known += grid[i];
    buildSites(); fileSites();
    const hall = Village.hallMid(), far = (x, y) => x >= 4 && y >= 4 && x < M.w - 4 && y < M.h - 4;
    for (let o = 0; o < 8; o++) { // how far scouts can walk each way before the sea
      const n = Math.hypot(DIRS[o][0], DIRS[o][1]), ux = DIRS[o][0] / n, uy = DIRS[o][1] / n;
      let d = 0; while (far(hall.x / T + ux * (d + 1), hall.y / T + uy * (d + 1))) d++;
      reachMax[o] = d;
    }
    for (const id in e.sites) if (!byId.has(id)) delete e.sites[id]; // a place this land no longer has
    found = sites.filter(s => rec(s).f); listStale = true; pings.length = 0;
    if (e.trip && !byId.has(e.trip.site)) e.trip = null;
    e.scouts = e.scouts.filter(sc => sc.dir >= 0 && sc.dir < 8 && sc.total > 0);
    World.fogReset();
    quiet = true;
    for (const s of sites) if (!rec(s).f && lifted(s.tx, s.ty)) find(s);
    lookAround(); lookMoving();
    quiet = false;
    e.fog = pack();
    slowT = 0; fastT = 0;
  }

  // ---- What each place asks and gives ----
  const scaled = (c, k) => Village.scaleCost(c, k);
  const giftCost = s => scaled(K.hamlet.gift, gainMult(s.lvl));
  const claimCost = s => scaled(K.deposit.claim, gainMult(s.lvl));
  const deepenCost = s => scaled(K.deposit.deepen, gainMult(s.lvl) * Math.pow(K.deposit.growth, (rec(s).dp || 1) - 1));
  /** The goods a hamlet asks for its next delivery: one of what the village has already made, worth more each time. */
  function makeAsk(s, fr) {
    const k = K.hamlet, opts = k.wants.filter(r => DATA.trade[r] && state.totals[r] > 0), res = opts.length ? opts[Math.floor(hash(s.tx, s.ty, 400 + fr) * opts.length)] : 'wood';
    let n = Math.max(1, Math.ceil(k.worth * Math.pow(k.growth, fr - 1) * gainMult(s.lvl) / DATA.trade[res].sell));
    if (n >= 20) n = Math.round(n / 5) * 5;
    return { [res]: n };
  }
  const askOf = s => { const r = rec(s); if (!r.ask) r.ask = makeAsk(s, r.fr || 1); return r.ask; };
  /** Gold a minute a hamlet's route pays at a friendship level. */
  const routePay = (s, fr) => K.hamlet.pay * fr * gainMult(s.lvl);
  /** What a deposit sends each minute at a depth. */
  function mineYield(s, dp) { const out = {}; for (const r in s.vein.gives) out[r] = s.vein.gives[r] * dp * gainMult(s.lvl); return out; }
  /** What a place sends the village each minute, by resource: an open route, a claimed deposit. */
  function income(s) {
    const r = rec(s);
    if (s.kind === 'hamlet' && r.open) return { gold: routePay(s, r.fr) };
    if (s.kind === 'deposit' && r.own) return mineYield(s, r.dp);
    return EMPTY;
  }
  /** What the routes and deposits bring in each second, by resource, for the top bar (js/village.js rates). */
  function rates() {
    const out = {};
    for (const s of shown()) { const inc = income(s); for (const r in inc) out[r] = (out[r] || 0) + inc[r] / 60; }
    return out;
  }
  const words = c => Object.keys(c).map(r => fmtNum(c[r]) + ' ' + RES[r].name.toLowerCase()).join(', ');
  /** Who waits in a ruin or a lair at its level now, and how strong. */
  function foesOf(s) {
    const k = K[s.kind], lvl = levelOf(s);
    return { ids: k.foes[Math.min(k.foes.length, lvl) - 1].filter(id => DATA.enemies[id]), scale: 1 + (lvl - 1) * tune.site_foe_step };
  }
  /** What winning there gives now, as a battle reward { xp, gold, res }. */
  function rewardOf(s) {
    const k = K[s.kind], lvl = levelOf(s), m = gainMult(lvl), r = k.reward, out = { xp: Math.round(r.xp * m), gold: Math.round(r.gold * m), res: {} };
    if (s.kind === 'ruin') for (const x in r.res || {}) out.res[x] = r.res[x] + Math.floor((lvl - 1) / k.shardEvery);
    if (s.kind === 'lair' && ((rec(s).n || 0) + 1) % k.shardEvery === 0) out.res.shard = 1;
    return out;
  }
  const rewardWords = r => [r.xp ? `+${r.xp} XP` : '', r.gold ? `+${r.gold} or` : ''].concat(Object.keys(r.res || {}).map(x => `+${r.res[x]} ${RES[x].name.toLowerCase()}`)).filter(Boolean).join(', ');

  // ---- The hero's expedition ----
  /** Where the hero stands when he is at the village: his post, off the hall's front corner (as js/raid.js). */
  const home = () => ({ x: (M.hall.x + DATA.buildings.hall.w + 0.5) * T, y: (M.hall.y + DATA.buildings.hall.h + 0.5) * T });
  /** Where he stands at a place: just before it. */
  const stand = s => ({ x: (s.tx + SIZE + 0.5) * T, y: (s.ty + SIZE + 0.5) * T });
  /** Whether the hero is out on an expedition: away from the village, as on a mission (js/hero.js). */
  const onTrip = () => !!(state.explore && state.explore.trip);
  /** Where the hero is on his expedition, in map pixels, and which way he faces; null when he is on none. */
  function heroAt() {
    const tp = state.explore.trip; if (!tp) return null;
    if (tp.phase === 'there') return { x: tp.x1, y: tp.y1, dx: -1, dy: -1, moving: false };
    const k = clamp(tp.t / tp.total, 0, 1);
    return { x: tp.x0 + (tp.x1 - tp.x0) * k, y: tp.y0 + (tp.y1 - tp.y0) * k, dx: tp.x1 - tp.x0, dy: tp.y1 - tp.y0, moving: true };
  }
  /** Seconds a walk takes: by its length, shortened by what the city gives (City.bonus('trip')). */
  const tripTime = (x0, y0, x1, y1) => Math.max(tune.trip_min, Math.hypot(x1 - x0, y1 - y0) / tune.trip_speed * Math.max(0.1, 1 - City.bonus('trip')));
  function setTrip(site, phase, to) {
    const p = heroAt() || home();
    state.explore.trip = { site, phase, x0: p.x, y0: p.y, x1: to.x, y1: to.y, t: 0, total: tripTime(p.x, p.y, to.x, to.y) };
  }
  /** Why the hero cannot leave now, in the player's words, or null. */
  const goBlocked = () => state.mission ? tr('hero_away') : state.raid.active ? tr('raid_on') : null;
  /** Sends the hero to a place found, from wherever he is. */
  function go(s) {
    if (goBlocked() || !rec(s).f || !usable(s)) { sfx('error'); return false; }
    setTrip(s.id, 'out', stand(s)); return true;
  }
  /** Calls the hero back to the village. */
  function recall() {
    const tp = state.explore.trip;
    if (!tp || tp.phase === 'back') return false;
    setTrip(tp.site, 'back', home()); return true;
  }
  /** The hero reaches the place: its action opens (a fight never starts by itself). */
  function arrive(tp) {
    const s = byId.get(tp.site);
    if (!s || !usable(s)) { toast(tr('ex_lost', { hero: DATA.hero.name }), UI.C.bad); setTrip(tp.site, 'back', home()); return; }
    tp.phase = 'there'; tp.t = tp.total;
    toast(tr('ex_arrived', { hero: DATA.hero.name, name: s.name }), UI.C.gold); sfx('level');
    // its page opens when the player's hands are free: never over a placement, another panel or a lesson
    if (scene === 'play' && !ui.placing && !ui.moving && !ui.tool && (!ui.panel || ui.panel === 'explore') && !Tuto.active()) openSite(s.id);
  }
  /** Whether the hero stands at this place, ready to act. */
  const heroHere = s => { const tp = state.explore.trip; return !!tp && tp.site === s.id && tp.phase === 'there'; };
  /** An action is completed at a place: the rest of the game is told, and the hero heads home when he was there. */
  function completed(s) {
    const e = state.explore;
    e.done[s.kind] = (e.done[s.kind] || 0) + 1;
    City.event('site', { kind: s.kind });
    if (heroHere(s)) setTrip(s.id, 'back', home());
    Save.persist();
  }
  /** The fight of a ruin or a lair: only ever from the player's own click on « Combattre ». */
  function fight(s) {
    if (!heroHere(s) || state.raid.active) { sfx('error'); return false; }
    const f = foesOf(s);
    Battle.start(f.ids, { title: s.name + ' · ' + tr('ex_lvl', { n: levelOf(s) }), scale: f.scale, reward: rewardOf(s), onWin: () => won(s) });
    return true;
  }
  /** The fight is won: the ruin is explored for good (with a relic, sometimes), the lair empties for a while and will be stronger. */
  function won(s) {
    const k = K[s.kind], r = rec(s);
    if (s.kind === 'ruin') {
      r.done = 1;
      City.gainPop(k.pop, tr('ex_pop_ruin'));
      if (rng() < k.relic.chance) {
        const m = gainMult(s.lvl), extra = { gold: Math.round(k.relic.gold * m), res: Object.assign({}, k.relic.res) };
        toast(tr('ex_relic_found', { what: Quests.grant(extra).join(', ') }), UI.C.gold);
        City.gainPop(k.relic.pop, tr('ex_pop_relic'));
      } else toast(tr('ex_won_ruin', { name: s.name }), UI.C.good);
    } else {
      r.n = (r.n || 0) + 1; r.wait = k.refill;
      City.gainPop(k.pop, tr('ex_pop_lair'));
      toast(tr('ex_won_lair', { name: s.name, time: fmtTime(k.refill) }), UI.C.good);
    }
    completed(s);
  }
  /** The first gift to a hamlet, carried by the hero: its trade route opens. */
  function gift(s) {
    if (!heroHere(s) || rec(s).open || !Village.pay(giftCost(s))) { toast(tr('no_funds'), UI.C.bad); return false; }
    const r = rec(s);
    r.open = 1; r.fr = 1; r.ask = makeAsk(s, 1);
    toast(tr('ex_route_open', { name: s.name, gold: fmtNum(routePay(s, 1)) }), UI.C.gold); sfx('fanfare');
    completed(s); return true;
  }
  /** A delivery to a hamlet whose route is open: its friendship rises one level, and the route's pay with it. */
  function deliver(s) {
    const r = rec(s);
    if (!r.open || !Village.pay(askOf(s))) { toast(tr('no_funds'), UI.C.bad); return false; }
    r.fr++; r.ask = makeAsk(s, r.fr);
    toast(tr('ex_route_up', { name: s.name, n: r.fr, gold: fmtNum(routePay(s, r.fr)) }), UI.C.good); sfx('coin');
    completed(s); return true;
  }
  /** The hero claims a deposit for the village, for its price. */
  function claim(s) {
    if (!heroHere(s) || rec(s).own || !Village.pay(claimCost(s))) { toast(tr('no_funds'), UI.C.bad); return false; }
    const r = rec(s);
    r.own = 1; r.dp = 1;
    toast(tr('ex_claimed', { name: s.name, what: words(mineYield(s, 1)) }), UI.C.gold); sfx('fanfare');
    completed(s); return true;
  }
  /** A claimed deposit is dug one level deeper: it sends that much more. */
  function deepen(s) {
    const r = rec(s);
    if (!r.own || !Village.pay(deepenCost(s))) { toast(tr('no_funds'), UI.C.bad); return false; }
    r.dp++;
    toast(tr('ex_deepened', { name: s.name, n: r.dp, what: words(mineYield(s, r.dp)) }), UI.C.good); sfx('unlock');
    completed(s); return true;
  }

  // ---- Scouts ----
  /** The next trip scouts would make a given way: { dist (tiles), cost, time (seconds) }, or null when all is known that way. */
  function scoutPlan(o) {
    const n = state.explore.reach[o] || 0, max = reachMax[o];
    if (n && tune.scout_first + (n - 1) * tune.scout_step >= max) return null;
    const dist = Math.min(max, Math.round(tune.scout_first + n * tune.scout_step));
    return { dist, cost: scaled(X.scout.cost, Math.pow(tune.scout_cost_growth, n)), time: 2 * dist * T / tune.scout_speed };
  }
  /** Why scouts cannot leave that way now, or null. */
  function scoutBlocked(o) {
    const e = state.explore, plan = scoutPlan(o);
    if (!plan) return tr('ex_scout_end');
    if (e.scouts.some(sc => sc.dir === o)) return tr('ex_scout_busy');
    if (e.scouts.length >= tune.scout_max) return tr('ex_scout_full', { max: tune.scout_max });
    return Village.canAfford(plan.cost) ? null : tr('no_funds');
  }
  /** Pays and sends scouts one of the eight ways (0 east on screen, then clockwise). */
  function send(o) {
    const why = scoutBlocked(o), plan = scoutPlan(o), e = state.explore;
    if (why || !Village.pay(plan.cost)) { toast(why || tr('no_funds'), UI.C.bad); sfx('error'); return false; }
    e.scouts.push({ dir: o, dist: plan.dist, t: 0, total: plan.time, n: 0 });
    e.reach[o] = (e.reach[o] || 0) + 1;
    toast(tr('ex_scout_sent', { dir: DATA.strings.dirs[o] }), UI.C.accent);
    return true;
  }
  /** Where scouts are, in map pixels: out for the first half of their time, back for the second. d: tiles from the hall. */
  function scoutAt(sc) {
    const h = Village.hallMid(), k = clamp(sc.t / sc.total, 0, 1), out = k < 0.5, d = sc.dist * T * (out ? k * 2 : (1 - k) * 2);
    const n = Math.hypot(DIRS[sc.dir][0], DIRS[sc.dir][1]), ux = DIRS[sc.dir][0] / n, uy = DIRS[sc.dir][1] / n;
    return { x: h.x + ux * d, y: h.y + uy * d, dx: out ? ux : -ux, dy: out ? uy : -uy, d: d / T };
  }
  /** Those who walk the wild now, for js/world.js: the hero on his expedition and the scouts. */
  function figures() {
    const out = [], p = heroAt();
    if (p) out.push({ kind: 'hero', id: 0, x: p.x, y: p.y, dx: p.dx, dy: p.dy, moving: p.moving });
    for (const sc of state.explore.scouts) { const q = scoutAt(sc); out.push({ kind: 'scout', id: 1 + sc.dir, x: q.x, y: q.y, dx: q.dx, dy: q.dy, moving: true, flag: true }); }
    return out;
  }

  // ---- Time ----
  /** Moves the hero and the scouts along their ways. */
  function walk(dt) {
    const e = state.explore, tp = e.trip;
    if (tp && tp.phase !== 'there') {
      tp.t += dt;
      if (tp.t >= tp.total) { if (tp.phase === 'back') { e.trip = null; toast(tr('ex_home', { hero: DATA.hero.name }), UI.C.text); } else arrive(tp); }
    }
    for (let i = e.scouts.length - 1; i >= 0; i--) {
      const sc = e.scouts[i]; sc.t += dt;
      if (sc.t < sc.total) continue;
      e.scouts.splice(i, 1);
      toast(tr('ex_scout_back', { dir: DATA.strings.dirs[sc.dir], found: sc.n > 1 ? tr('ex_scout_found', { n: sc.n }) : tr(sc.n ? 'ex_scout_found1' : 'ex_scout_found0') }), sc.n ? UI.C.good : UI.C.text);
    }
  }
  /** One step: the walks, the looks around, the lairs filling again, the routes' and deposits' pay. */
  function tick(dt) {
    const e = state.explore;
    if (!gw || cell !== clamp(Math.round(tune.fog_cell), 1, 32)) sync(); // the cells' size was changed live (the tweak panel)
    walk(dt);
    fastT -= dt; if (fastT <= 0) { fastT = 0.25; lookMoving(); }
    slowT -= dt; if (slowT <= 0) { slowT = 2; lookAround(); listStale = true; }
    for (const s of found) {
      const r = rec(s);
      if (r.wait > 0) { r.wait -= dt; if (r.wait <= 0) { r.wait = 0; toast(tr('ex_lair_back', { name: s.name, lvl: tr('ex_lvl', { n: levelOf(s) }) }), UI.C.accent); } }
    }
    e.payT += dt;
    const cycle = Math.max(1, tune.site_pay_cycle);
    while (e.payT >= cycle) {
      e.payT -= cycle;
      for (const s of shown()) {
        const inc = income(s);
        for (const r in inc) { const n = inc[r] * cycle / 60; Village.gain(r, n); floatText(s.x, s.y, '+' + fmtNum(n) + ' ' + RES[r].name.toLowerCase(), UI.C.gold, 14, 34); }
      }
    }
    for (let i = pings.length - 1; i >= 0; i--) { pings[i].t += dt; if (pings[i].t > 3) pings.splice(i, 1); }
  }
  /**
   * The time the game was closed (js/save.js catchUp). `secs`: the seconds that earn (the absence
   * times `offline_rate`): what the routes and deposits paid. `real`: the true absence, for the
   * walks under way (the fog lifts along them) and the lairs filling again; left out, the same.
   */
  function away(secs, real) {
    if (real == null) real = secs;
    const e = state.explore;
    for (const s of shown()) { const inc = income(s); for (const r in inc) Village.gain(r, inc[r] * secs / 60); }
    for (const s of found) { const r = rec(s); if (r.wait > 0) r.wait = Math.max(0, r.wait - real); }
    let left = real;
    for (let i = 0; i < 4000 && left > 0 && (e.scouts.length || (e.trip && e.trip.phase !== 'there')); i++) { const d = Math.min(2, left); walk(d); lookMoving(); left -= d; }
  }

  // ---- A place's look, drawn in code until its image exists (assets/manifest.js 'iso.site.<kind>') ----
  // Each is 64 pixels wide, its two-tile diamond at the bottom (its middle at 32, 48), lit from the right.
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function dia(g, cx, cy, a, c) { // a flat diamond, `a` pixels to each side of its middle
    g.fillStyle = c;
    for (let r = -a / 2; r < a / 2; r++) { const hw = Math.round(a * (1 - Math.abs(r + 0.5) / (a / 2))); g.fillRect(cx - hw, cy + r, hw * 2, 1); }
  }
  function ell(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + 0.3)))); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
  }
  /** A block standing on a diamond `a` wide each side, `hf` pixels high (a number, or a height for each column): its left side, right side and top. */
  function block(g, cx, cy, a, hf, cl, cr, ct) {
    for (let dx = -a; dx < a; dx++) {
      const ad = dx < 0 ? -dx : dx + 1, h = typeof hf === 'function' ? hf(dx) : hf;
      const yb = Math.round(cy + (a - ad) / 2), yt = Math.round(cy - (a - ad) / 2) - h;
      if (ct) px(g, cx + dx, yt, 1, yb - h - yt, ct);
      px(g, cx + dx, yb - h, 1, h, dx < 0 ? cl : cr);
    }
  }
  /** A small house: walls, a pointed roof that overhangs them, a door and a window. */
  function hut(g, cx, cy, a, h, rh, roof) {
    block(g, cx, cy, a, h, PAL.wallD, PAL.wall, null);
    const A = a + 1;
    for (let dx = -A; dx < A; dx++) {
      const ad = dx < 0 ? -dx : dx + 1, yb = Math.round(cy + (A - ad) / 2) - h, yt = Math.round(cy - h - rh * (A - ad) / A);
      px(g, cx + dx, yt, 1, Math.max(1, yb - yt), dx < 0 ? roof.dark : roof.base);
      if (dx >= 0) px(g, cx + dx, yt, 1, 1, roof.light);
    }
    px(g, cx + 2, Math.round(cy + (a - 3) / 2) - 4, 2, 4, PAL.door);
    px(g, cx - 5, Math.round(cy + (a - 5) / 2) - h + 2, 2, 2, PAL.window);
  }
  const ORE = { stone: [PAL.stoneD, PAL.stone, PAL.stoneL], gold: [PAL.goldD, PAL.gold, PAL.amberL], shard: ['#2a9fc4', PAL.cyan, PAL.white] };
  const GROUND = { // the ground each kind stands on, under its outline
    ruin(g) { dia(g, 32, 48, 27, '#877c6c'); dia(g, 31, 49, 19, '#9a8f7c'); },
    hamlet(g) { dia(g, 32, 48, 28, '#b08a5a'); dia(g, 32, 50, 17, '#c8a070'); },
    deposit(g) { dia(g, 32, 48, 28, PAL.stoneD); dia(g, 32, 48, 22, '#8c93a8'); },
    lair(g) { dia(g, 32, 49, 28, '#5d6278'); },
  };
  const BODY = {
    ruin(g) { // a tower broken off on a slant, a doorway, a stub of wall, fallen blocks, ivy
      const gone = [9, 7, 4, 6, 2, 0, 3, 7, 11, 13, 10, 12, 15, 17, 14, 18, 20, 19, 22, 21, 24, 23, 25, 26];
      block(g, 46, 45, 5, 7, PAL.stoneD, PAL.stone, PAL.stoneL);
      block(g, 28, 46, 12, dx => 31 - gone[dx + 12], PAL.stoneD, PAL.stone, PAL.stoneL);
      px(g, 20, 29, 2, 4, PAL.dark); px(g, 31, 41, 4, 8, PAL.dark); px(g, 32, 40, 2, 1, PAL.dark);
      for (const [x, y] of [[18, 37], [23, 42], [21, 24], [30, 36], [36, 43], [33, 32]]) px(g, x, y, 2, 1, x < 28 ? '#5a6078' : PAL.stoneD);
      px(g, 17, 33, 1, 7, PAL.green); px(g, 18, 36, 2, 1, PAL.greenD); px(g, 16, 39, 1, 3, PAL.greenD); px(g, 25, 44, 1, 5, PAL.green);
      block(g, 48, 54, 3, 3, PAL.stoneD, PAL.stone, PAL.stoneL); block(g, 13, 51, 3, 2, PAL.stoneD, PAL.stone, PAL.stoneL); block(g, 54, 49, 2, 2, PAL.stoneD, PAL.stone, PAL.stoneL);
    },
    hamlet(g) { // three roofs around a yard, a well, a bit of fence
      hut(g, 33, 39, 9, 7, 9, ROOFS.orange);
      hut(g, 17, 47, 8, 6, 8, ROOFS.thatch);
      hut(g, 47, 49, 8, 6, 8, ROOFS.slate);
      px(g, 30, 53, 4, 3, PAL.stone); px(g, 30, 53, 4, 1, PAL.stoneL); px(g, 31, 50, 1, 3, PAL.timber); px(g, 30, 49, 4, 1, PAL.timberL);
      for (const [x, y] of [[23, 58], [27, 60], [31, 61], [35, 60], [39, 58]]) px(g, x, y - 2, 1, 3, PAL.timber);
      px(g, 23, 57, 17, 1, PAL.timberL);
    },
    deposit(g, frame, vein) { // a pit, its hoist and bucket, a heap of what comes out, a pickaxe
      const ore = ORE[vein] || ORE.stone;
      ell(g, 30, 49, 14, 6, PAL.dark); ell(g, 30, 50, 11, 4, '#120e1c');
      for (let dx = -12; dx <= 12; dx++) px(g, 30 + dx, Math.round(48 - 6 * Math.sqrt(1 - dx * dx / 196)), 1, 1, PAL.stoneL);
      for (const [x, y] of [[23, 49], [28, 51], [34, 48], [37, 51], [31, 53]]) px(g, x, y, 1, 1, ore[2]);
      px(g, 18, 28, 2, 19, PAL.timber); px(g, 41, 29, 2, 19, PAL.timberD); px(g, 17, 26, 27, 2, PAL.timberL); px(g, 30, 28, 1, 12, PAL.ivoryD);
      px(g, 28, 40, 5, 4, PAL.plank); px(g, 28, 43, 5, 1, PAL.plankD);
      block(g, 51, 51, 4, 4, ore[0], ore[1], ore[2]); block(g, 46, 55, 3, 2, ore[0], ore[1], ore[2]); block(g, 55, 55, 2, 2, ore[0], ore[1], ore[2]);
      for (let i = 0; i < 10; i++) px(g, 6 + i, 56 - i, 1, 2, PAL.timberL);
      px(g, 12, 44, 7, 1, PAL.steel); px(g, 11, 45, 1, 2, PAL.steelD); px(g, 19, 45, 1, 2, PAL.steelD);
    },
    lair(g, frame) { // a mound of rock, a cave mouth with two eyes in the dark (frame 0: something lives there), bones before it
      for (let dx = -24; dx <= 24; dx++) {
        const k = Math.sqrt(1 - dx * dx / 600.25), top = Math.round(50 - 30 * k) + [0, 1, 2, 1, 0, 0, 1][(dx + 24) % 7], bot = Math.round(52 + 8 * k);
        px(g, 32 + dx, top, 1, bot - top, dx < -5 ? PAL.stoneD : PAL.stone);
        if (dx > 0 && dx < 20) px(g, 32 + dx, top, 1, 2, PAL.stoneL);
      }
      for (const [x, y, n] of [[16, 40, 5], [22, 30, 4], [44, 34, 6], [50, 44, 4], [38, 26, 3]]) px(g, x, y, 1, n, '#5a6078');
      px(g, 24, 23, 6, 1, PAL.green); px(g, 26, 22, 3, 1, PAL.greenL); px(g, 40, 24, 4, 1, PAL.greenD);
      for (let ax = -8; ax <= 8; ax++) { const hh = Math.round(14 * Math.sqrt(1 - ax * ax / 72.25)); px(g, 34 + ax, 57 - hh, 1, hh, '#0f0b16'); }
      if (!frame) { px(g, 30, 49, 2, 1, PAL.amberL); px(g, 36, 49, 2, 1, PAL.amberL); }
      px(g, 19, 57, 3, 3, PAL.ivory); px(g, 20, 58, 1, 1, PAL.dark); px(g, 45, 59, 5, 1, PAL.ivory); px(g, 44, 58, 1, 3, PAL.ivoryD); px(g, 50, 58, 1, 3, PAL.ivoryD);
      for (const x of [24, 26, 28]) px(g, x, 59, 1, 2, PAL.ivory);
    },
  };
  /** A one-pixel dark line around what is painted, as every drawn sprite of the game has (js/art.js). */
  function outline(cv) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height, d = g.getImageData(0, 0, w, h).data, add = [];
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push(x, y);
    g.fillStyle = PAL.ink;
    for (let i = 0; i < add.length; i += 2) g.fillRect(add[i], add[i + 1], 1, 1);
  }
  const looks = new Map(); // 'kind#frame#vein' -> canvas
  function drawn(kind, frame, vein) {
    const key = kind + '#' + frame + '#' + vein;
    let cv = looks.get(key);
    if (cv) return cv;
    const body = document.createElement('canvas'); body.width = 64; body.height = 64;
    BODY[kind](body.getContext('2d'), frame, vein); outline(body);
    cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    const g = cv.getContext('2d');
    GROUND[kind](g); g.drawImage(body, 0, 0);
    looks.set(key, cv);
    return cv;
  }
  /** The picture of a place as it is now: its image when the manifest has one, else the drawn one. A lair that waits to fill again shows frame 1. */
  function sprite(s) {
    const id = K[s.kind].sprite, frame = s.kind === 'lair' && rec(s).wait > 0 ? 1 : 0;
    return Art.loaded(id) ? Art.get(id, frame) : drawn(s.kind, frame, s.vein ? s.vein.id : '');
  }
  /** Whether a place flies the village's pennant on the map: a claimed deposit, a hamlet whose route is open. */
  const flagged = s => !!(rec(s).own || rec(s).open);

  // ---- What can be done at a place ----
  /** A place's state in a few words: { text, color, can: something can be done there now }. */
  function status(s) {
    const C = UI.C, r = rec(s), tp = state.explore.trip, here = heroHere(s), coming = !!tp && tp.site === s.id && tp.phase === 'out';
    if (!usable(s)) return { text: tr('ex_blocked'), color: C.dim, can: false };
    if (s.kind === 'ruin' && r.done) return { text: tr('ex_st_done'), color: C.dim, can: false };
    if (s.kind === 'lair' && r.wait > 0) return { text: tr('ex_st_lair_wait', { time: fmtTime(r.wait) }), color: C.dim, can: false };
    if (s.kind === 'hamlet' && r.open) return { text: tr('ex_st_route', { n: r.fr, gold: fmtNum(routePay(s, r.fr)) }), color: C.good, can: Village.canAfford(askOf(s)) };
    if (s.kind === 'deposit' && r.own) return { text: tr('ex_st_mine', { n: r.dp, what: words(mineYield(s, r.dp)) }), color: C.good, can: Village.canAfford(deepenCost(s)) };
    if (here) return { text: tr('ex_st_here'), color: C.gold, can: true };
    if (coming) return { text: tr('ex_st_coming'), color: C.accent, can: true };
    const key = s.kind === 'ruin' ? 'ex_st_ruin' : s.kind === 'lair' ? (r.n ? 'ex_st_lair_again' : 'ex_st_lair') : s.kind === 'hamlet' ? 'ex_st_hamlet' : 'ex_st_deposit';
    return { text: tr(key, { n: r.n || 0 }), color: C.accent, can: true };
  }
  /**
   * The one thing to do at a place now: { label, run, off (it cannot be done), tip, cost, primary,
   * far (the hero must walk there first), time (how long that walk is) }.
   * A ruin, a full lair, a hamlet with no route and an unclaimed deposit need the hero on the spot:
   * he is sent first (« Y aller »), then acts. A route and a claimed deposit are served from the panel.
   */
  function action(s) {
    const r = rec(s), tp = state.explore.trip;
    if (!usable(s)) return { label: '—', off: true, tip: tr('ex_blocked') };
    if (s.kind === 'ruin' && r.done) return { label: tr('ex_done_btn'), off: true };
    if (s.kind === 'lair' && r.wait > 0) return { label: fmtTime(r.wait), off: true, tip: tr('ex_st_lair_wait', { time: fmtTime(r.wait) }) };
    if (s.kind === 'hamlet' && r.open) { const c = askOf(s); return { label: tr('ex_deliver'), run: () => deliver(s), cost: c, off: !Village.canAfford(c), tip: tr('ex_deliver') + ' : ' + words(c) + '\n' + tr('ex_route_next', { n: r.fr + 1, gold: fmtNum(routePay(s, r.fr + 1)) }) }; }
    if (s.kind === 'deposit' && r.own) { const c = deepenCost(s); return { label: tr('ex_deepen'), run: () => deepen(s), cost: c, off: !Village.canAfford(c), tip: tr('ex_deepen') + ' : ' + words(c) + '\n' + tr('ex_mine_next', { n: r.dp + 1, what: words(mineYield(s, r.dp + 1)) }) }; }
    if (heroHere(s)) {
      if (s.kind === 'ruin' || s.kind === 'lair') return { label: tr('ex_fight'), run: () => fight(s), off: !!state.raid.active, tip: state.raid.active ? tr('raid_on') : null, primary: true };
      const c = s.kind === 'hamlet' ? giftCost(s) : claimCost(s);
      return { label: tr(s.kind === 'hamlet' ? 'ex_gift' : 'ex_claim'), run: () => (s.kind === 'hamlet' ? gift(s) : claim(s)), cost: c, off: !Village.canAfford(c), tip: tr(s.kind === 'hamlet' ? 'ex_gift' : 'ex_claim') + ' : ' + words(c), primary: true };
    }
    if (tp && tp.site === s.id && tp.phase === 'out') return { label: tr('ex_coming'), off: true, tip: tr('ex_st_coming') + ' · ' + fmtTime(tp.total - tp.t) };
    const why = goBlocked(), p = heroAt() || home(), to = stand(s);
    const time = fmtTime(tripTime(p.x, p.y, to.x, to.y));
    return { label: tr('ex_go'), run: () => go(s), off: !!why, tip: why || tr('ex_go_tip', { time }), primary: true, far: true, time };
  }

  // ---- The map: a click, the marks over the places ----
  function openSite(id) { ui.exSite = id; ui.panel = 'explore'; ui.sel = null; UI.scrollTop('exsite'); }
  const lookAt = p => { Object.assign(state.cam, World.camOn(p.x, p.y)); };
  /** A click on the map (map pixels): true when a place found was under it; its page opens. */
  function click(wx, wy) {
    const s = World.pickSite(wx, wy);
    if (!s) return false;
    openSite(s.id);
    return true;
  }
  const markIcon = s => s.kind === 'deposit' ? RES[Object.keys(s.vein.gives)[0]].icon : K[s.kind].icon;
  const bare = dir => dir.replace(/^(le |la |l’)/, ''); // 'le nord-est' -> 'nord-est', for a short line
  /**
   * Drawn by js/world.js over the map once it is on screen, in the interface's own pixels: a small
   * plate over each place where something can be done, and the name of the one under the pointer.
   */
  function drawOver() {
    const C = UI.C;
    for (const s of shown()) {
      if (!status(s).can) continue;
      const r = World.siteRect(s), p = World.toScreenIso(r.cx, r.top - (flagged(s) ? 10 : 0));
      if (p.x < -30 || p.x > W + 30 || p.y < 40 || p.y > 640) continue;
      const bob = Math.round(Math.sin(state.t * 4 + s.tx)) * 2;
      UI.plate(p.x - 15, p.y - 38 + bob, 30, 30); UI.icon(markIcon(s), p.x, p.y - 23 + bob, 16);
    }
    if (scene !== 'play' || ui.placing || ui.moving || ui.tool || mouse.down || mouse.y < 52 || mouse.y > 586 || (ui.panel && mouse.x >= 868)) return;
    const wp = World.toWorld(mouse.x, mouse.y), s = World.pickSite(wp.x, wp.y);
    if (!s) return;
    const st = status(s), name = s.name + ' · ' + tr('ex_lvl', { n: levelOf(s) }), w = Math.max(UI.width(name, 14, true), UI.width(st.text, 13, true)) + 28;
    const x = clamp(mouse.x + 18, 4, W - w - 4), y = clamp(mouse.y - 58, 56, 530);
    UI.plate(x, y, w, 50); UI.label(name, x + 14, y + 16, 14, C.gold, 'left'); text(st.text, x + 14, y + 36, 13, st.color, 'left', true);
  }

  // ---- The panel ----
  /** A section title with a brass rule after it (as js/screens.js). Returns the y under it. */
  function section(title, x, y, w) {
    const tw = UI.width(title, 15, true);
    text(title, x, y + 10, 15, UI.C.gold, 'left', true);
    ctx.fillStyle = 'rgba(143,95,28,0.6)'; ctx.fillRect(x + tw + 10, y + 10, Math.max(0, w - tw - 10), 1);
    return y + 24;
  }
  /** One line of text, shrunk until it fits `maxW`. */
  function fit(str, x, y, maxW, size, color, bold) {
    while (size > 10 && UI.width(str, size, bold) > maxW) size--;
    text(str, x, y, size, color, 'left', bold);
  }
  /** A place's picture, fitted in a plate. */
  function thumb(s, x, y, side) {
    const cv = sprite(s), k = Math.min((side - 8) / (cv.width * PX), (side - 8) / (cv.height * PX));
    UI.plate(x, y, side, side);
    blit(cv, x + side / 2 - cv.width * PX * k / 2, y + side - 5 - cv.height * PX * k, k);
  }
  const farLine = s => tr('ex_far', { n: Math.round(s.d), dir: Raid.compass(s) });
  /** The hero's expedition: where he is, how long is left, and the way back. */
  function tripBlock(x, y, w) {
    const C = UI.C, tp = state.explore.trip;
    y = section(tr('ex_trip'), x, y, w);
    if (!tp) return UI.wrap(tr(state.mission ? 'ex_trip_mission' : 'ex_trip_none'), x, y, w, 13, C.dim, 17) + 6;
    const s = byId.get(tp.site), y0 = y;
    y = UI.wrap(tr('ex_trip_' + tp.phase, { name: s ? s.name : '' }), x, y, w, 14, tp.phase === 'there' ? C.gold : C.accent, 18, true) + 2;
    if (tp.phase !== 'there') { UI.bar(x, y, w, 16, tp.t / tp.total, C.accent); text(fmtTime(tp.total - tp.t), x + w / 2, y + 9, 12, C.text, 'center', true); y += 22; }
    const bw = (w - 8) / 2;
    if (tp.phase === 'there' && s) UI.button(x, y, bw, 30, tr('ex_open'), () => openSite(s.id), { size: 13, primary: true });
    else UI.button(x, y, bw, 30, tr('ex_see'), () => lookAt(heroAt() || home()), { size: 13, icon: 'icon.recenter', tip: tr('ex_see_hero') });
    if (tp.phase !== 'back') { UI.button(x + bw + 8, y, bw, 30, tr('ex_recall'), recall, { size: 13, tip: tr('ex_recall_tip') }); Tuto.mark('explore:recall', x + bw + 8, y, bw, 30); }
    Tuto.mark('explore:trip', x, y0, w, y + 30 - y0);
    return y + 38;
  }
  /** The scouts: a compass rose of eight buttons, what the next trip costs, and who is out. */
  function scoutBlock(x, y, w) {
    const C = UI.C, e = state.explore, dirs = DATA.strings.dirs, short = DATA.strings.ex_dirs_short;
    y = section(tr('ex_scouts', { n: e.scouts.length, max: tune.scout_max }), x, y + 4, w);
    y = UI.wrap(tr('ex_scout_help'), x, y, w, 13, C.dim, 17) + 6;
    const bw = 46, bh = 32, gap = 4, POS = [[2, 1], [2, 2], [1, 2], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0]]; // each way's place in the rose, as on screen
    let focus = -1, cheap = -1, cheapD = Infinity;
    for (let o = 0; o < 8; o++) {
      const bx = x + POS[o][0] * (bw + gap), by = y + POS[o][1] * (bh + gap), plan = scoutPlan(o), why = scoutBlocked(o), out = e.scouts.find(sc => sc.dir === o);
      const tip = plan ? tr('ex_scout_tip', { dir: dirs[o], n: plan.dist, time: fmtTime(plan.time) }) + '\n' + words(plan.cost) + (why ? '\n' + why : '') : tr('ex_scout_end');
      const hov = UI.button(bx, by, bw, bh, short[o], () => send(o), { size: 14, disabled: !!why, tip });
      if (out) { ctx.fillStyle = C.accent; ctx.fillRect(bx + 6, by + bh - 7, Math.round((bw - 12) * clamp(out.t / out.total, 0, 1)), 3); } // how far along they are
      Tuto.mark('explore:scout:' + o, bx, by, bw, bh);
      if (hov && plan) focus = o;
      if (plan && !out && plan.dist < cheapD) { cheap = o; cheapD = plan.dist; }
    }
    UI.plate(x + bw + gap, y + bh + gap, bw, bh); UI.icon(UI.ready('icon.explore') ? 'icon.explore' : 'icon.recenter', x + bw + gap + bw / 2, y + bh + gap + bh / 2, 16);
    Tuto.mark('explore:rose', x, y, 3 * bw + 2 * gap, 3 * bh + 2 * gap);
    const rx = x + 3 * (bw + gap) + 10, rw = w - (rx - x), o = focus >= 0 ? focus : cheap;
    let ry = y + 2;
    if (o >= 0) {
      const plan = scoutPlan(o), dir = tr('ex_scout_dir', { dir: dirs[o] });
      if (focus < 0) { text(tr('ex_scout_cheap'), rx, ry + 8, 12, C.dim, 'left'); ry += 18; }
      fit(dir, rx, ry + 9, rw, 15, C.gold, true); ry += 22;
      fit(tr('ex_scout_dist', { n: plan.dist }) + ' · ' + fmtTime(plan.time), rx, ry + 8, rw, 13, C.text, false); ry += 22;
      UI.cost(plan.cost, rx, ry + 9, { size: 14 }); ry += 24;
      const why = scoutBlocked(o);
      if (why) UI.wrap(why, rx, ry, rw, 12, C.bad, 15);
    } else UI.wrap(tr('ex_scout_all'), rx, ry, rw, 13, C.dim, 17);
    y += 3 * bh + 2 * gap + 8;
    for (const sc of e.scouts) {
      text(tr('ex_scout_out', { dir: dirs[sc.dir], time: fmtTime(sc.total - sc.t) }), x, y + 8, 13, C.accent, 'left', true);
      UI.bar(x + w - 96, y + 2, 96, 12, sc.t / sc.total, C.accent); y += 20;
    }
    return y;
  }
  /** One place found, on a line: its picture, name, level, distance and state, « Voir » and its action. */
  function siteRow(s, x, y, w, first) {
    const C = UI.C, st = status(s), act = action(s), bx = x + w - 92, tw = w - 58 - 98;
    const hov = UI.region(x, y, w - 96, 52, () => { sfx('click'); openSite(s.id); }, tr('ex_open_tip'));
    thumb(s, x, y, 50);
    fit(s.name, x + 58, y + 9, tw, 14, hov ? C.text : C.gold, true);
    fit(tr('ex_lvl', { n: levelOf(s) }) + ' · ' + tr('ex_far_short', { n: Math.round(s.d), dir: bare(Raid.compass(s)) }), x + 58, y + 26, tw, 12, C.dim, false);
    fit(st.text, x + 58, y + 42, tw, 12, st.color, true);
    UI.button(bx, y, 92, 24, tr('ex_see'), () => lookAt(s), { size: 12, tip: tr('ex_see_tip') });
    UI.button(bx, y + 27, 92, 24, act.label, act.run || (() => {}), { size: 12, primary: !!act.primary && !act.off, disabled: !!act.off, tip: act.tip });
    if (first) { Tuto.mark('explore:row', x, y, w - 96, 52); Tuto.mark('explore:see', bx, y, 92, 24); Tuto.mark('explore:go', bx, y + 27, 92, 24); }
    return y + 60;
  }
  /** The panel's first page: the land known, the hero's expedition, the scouts, the places found. */
  function mainPage(x, y, w) {
    const C = UI.C, pct = gw ? known / (gw * gh) : 0;
    text(tr('ex_known', { pct: Math.floor(pct * 100) }), x, y + 10, 15, C.text, 'left', true);
    UI.bar(x + 190, y + 2, w - 190, 16, pct, C.accent); Tuto.mark('explore:known', x, y, w, 20); y += 26;
    y = UI.wrap(tr('ex_help'), x, y, w, 13, C.dim, 17) + 6;
    y = tripBlock(x, y, w);
    y = scoutBlock(x, y, w);
    y = section(tr('ex_places', { n: shown().length }), x, y + 6, w);
    if (!shownList.length) return UI.wrap(tr('ex_none'), x, y, w, 14, C.dim) + 4;
    shownList.forEach((s, i) => { y = siteRow(s, x, y, w, i === 0); });
    return UI.wrap(tr('ex_idle_note'), x, y + 2, w, 12, C.dim, 16);
  }
  /** A place's own page: what it is, what it asks, what it gives, and its action. */
  function sitePage(s, x, y, w) {
    const C = UI.C, k = K[s.kind], r = rec(s), st = status(s), act = action(s), lvl = levelOf(s);
    UI.button(x, y, 160, 28, tr('ex_back'), () => { ui.exSite = null; }, { size: 13 }); Tuto.mark('explore:back', x, y, 160, 28);
    UI.button(x + w - 96, y, 96, 28, tr('ex_see'), () => lookAt(s), { size: 13, tip: tr('ex_see_tip') }); y += 36;
    thumb(s, x, y, 76);
    const tx = x + 88, tw = w - 88;
    text(k.name + ' · ' + tr('ex_lvl', { n: lvl }), tx, y + 10, 15, C.gold, 'left', true);
    fit(farLine(s), tx, y + 29, tw, 13, C.dim, false);
    UI.wrap(st.text, tx, y + 40, tw, 13, st.color, 16, true);
    y += 84;
    y = UI.wrap(k.desc, x, y, w, 13, C.dim, 17) + 6;
    const fights = s.kind === 'ruin' || s.kind === 'lair';
    if (fights && !(s.kind === 'ruin' && r.done)) {
      const f = foesOf(s), names = {};
      for (const id of f.ids) names[id] = (names[id] || 0) + 1;
      y = section(tr('ex_foes'), x, y, w);
      y = UI.wrap(Object.keys(names).map(id => DATA.enemies[id].name + (names[id] > 1 ? ' ×' + names[id] : '')).join(', ') + (f.scale > 1 ? ' · ' + tr('ex_foe_scale', { pct: Math.round((f.scale - 1) * 100) }) : ''), x, y, w, 14, C.bad) + 4;
      y = section(tr('ex_gives'), x, y, w);
      y = UI.wrap(tr('ex_reward', { what: rewardWords(rewardOf(s)) }), x, y, w, 14, C.text) + 2;
      if (s.kind === 'ruin') y = UI.wrap(tr('ex_relic', { n: Math.round(1 / k.relic.chance), what: words(Object.assign({ gold: Math.round(k.relic.gold * gainMult(s.lvl)) }, k.relic.res)) }), x, y, w, 13, C.dim, 17) + 2;
      else { y = UI.wrap(tr('ex_lair_rule', { time: fmtTime(k.refill), n: k.shardEvery }), x, y, w, 13, C.dim, 17) + 2; if (r.n) y = UI.wrap(tr('ex_lair_count', { n: r.n }), x, y, w, 13, C.dim, 17) + 2; }
    } else if (s.kind === 'hamlet') {
      y = section(tr('ex_gives'), x, y, w);
      y = UI.wrap(r.open ? tr('ex_route_now', { gold: fmtNum(routePay(s, r.fr)), n: r.fr }) : tr('ex_gift_rule', { gold: fmtNum(routePay(s, 1)) }), x, y, w, 14, r.open ? C.good : C.text) + 2;
      if (r.open) y = UI.wrap(tr('ex_route_next', { n: r.fr + 1, gold: fmtNum(routePay(s, r.fr + 1)) }), x, y, w, 13, C.dim, 17) + 2;
      y = section(tr('ex_asks'), x, y + 4, w);
      UI.cost(r.open ? askOf(s) : giftCost(s), x, y + 10, { size: 14 }); y += 26;
    } else if (s.kind === 'deposit') {
      y = section(tr('ex_gives'), x, y, w);
      y = UI.wrap(r.own ? tr('ex_mine_now', { what: words(mineYield(s, r.dp)), n: r.dp }) : tr('ex_claim_rule', { what: words(mineYield(s, 1)) }), x, y, w, 14, r.own ? C.good : C.text) + 2;
      if (r.own) y = UI.wrap(tr('ex_mine_next', { n: r.dp + 1, what: words(mineYield(s, r.dp + 1)) }), x, y, w, 13, C.dim, 17) + 2;
      y = section(tr('ex_asks'), x, y + 4, w);
      UI.cost(r.own ? deepenCost(s) : claimCost(s), x, y + 10, { size: 14 }); y += 26;
    }
    y += 6;
    UI.button(x, y, w, 38, act.label, act.run || (() => {}), { primary: !act.off, disabled: !!act.off, size: 15, tip: act.tip });
    Tuto.mark('explore:act', x, y, w, 38); y += 44;
    if (act.far) y = UI.wrap(tr('ex_need_hero') + ' ' + (act.off ? act.tip : tr('ex_go_time', { time: act.time })), x, y, w, 13, act.off ? C.bad : C.dim, 17) + 4;
    const tp = state.explore.trip;
    if (tp && tp.site === s.id && tp.phase !== 'back') { UI.button(x, y, w, 30, tr('ex_recall'), recall, { size: 13, tip: tr('ex_recall_tip') }); y += 38; }
    return y;
  }
  /** The side panel 'explore' (key E): its first page, or the page of the place that was clicked. */
  function drawPanel(P) {
    const x = P.x + 24, w = P.w - 48, s = ui.exSite ? byId.get(ui.exSite) : null, page = s && rec(s).f ? s : null;
    if (!page) ui.exSite = null;
    UI.panel(P.x, P.y, P.w, P.h, tr('ex_title'), () => { ui.panel = null; ui.sel = null; });
    if (page) { ctx.save(); ctx.beginPath(); ctx.rect(P.x + 150, P.y + 14, P.w - 210, 30); ctx.clip(); fit(page.name, P.x + 152, P.y + 31, P.w - 214, 15, UI.C.text, true); ctx.restore(); }
    UI.scrollBox(page ? 'exsite' : 'explore', x, P.y + 56, w, P.h - 72, y => page ? sitePage(page, x, y, w) : mainPage(x, y, w));
  }

  /**
   * ?demo=1: what a grown village knows of the land. The fog lifted wide around the hall, a place of
   * each kind found (a hamlet's route open, a deposit claimed and dug, a lair cleared once), the hero
   * half-way to a ruin and scouts out. Address options, for screenshots:
   *   &look=fog (&fogdir=0..7)   the view on the fog's edge, that way from the hall (0 east, clockwise)
   *   &look=ruin|lair|hamlet|deposit   the view on the nearest place found of that kind
   *   &look=trip                 the view on the hero on his way
   *   &panel=explore             the panel; with &site=ruin|lair|hamlet|deposit, that place's page;
   *                              &exscroll=300 scrolls it down that far
   */
  function demo() {
    const e = state.explore, h = Village.hallMid();
    quiet = true;
    reveal(h.x, h.y, X.demo.sight);
    for (const kind in K) { // a place of each kind, wherever the nearest one is
      if (found.some(s => s.kind === kind)) continue;
      const s = sites.filter(q => q.kind === kind).sort((p, q) => p.d - q.d)[0];
      if (s) for (let i = 0; i <= 20; i++) reveal(h.x + (s.x - h.x) * i / 20, h.y + (s.y - h.y) * i / 20, 9);
    }
    refreshLists();
    const first = (kind, n = 0) => found.filter(s => s.kind === kind)[n];
    const dep = first('deposit'), ham = first('hamlet'), lair = first('lair', 1) || first('lair'), ruin = first('ruin');
    if (dep) Object.assign(rec(dep), { own: 1, dp: 2 });
    if (ham) Object.assign(rec(ham), { open: 1, fr: 3 });
    if (lair) Object.assign(rec(lair), { n: 1, wait: 300 });
    if (ruin) { setTrip(ruin.id, 'out', stand(ruin)); e.trip.t = e.trip.total * 0.55; }
    const plan = scoutPlan(5);
    if (plan) { e.scouts.push({ dir: 5, dist: plan.dist, t: plan.time * 0.3, total: plan.time, n: 0 }); e.reach[5] = 1; }
    lookMoving();
    quiet = false; e.fog = pack(); listStale = true;
    const look = params.get('look'), o = clamp(Number(params.get('fogdir')) || 0, 0, 7), n = Math.hypot(DIRS[o][0], DIRS[o][1]);
    if (look === 'fog') lookAt({ x: h.x + DIRS[o][0] / n * X.demo.sight * T, y: h.y + DIRS[o][1] / n * X.demo.sight * T });
    else if (look === 'trip' && heroAt()) lookAt(heroAt());
    else if (K[look] && first(look)) lookAt(first(look));
    const pg = params.get('site');
    if (K[pg] && first(pg)) ui.exSite = first(pg).id;
    if (params.get('exscroll')) UI.scrollTo(ui.exSite ? 'exsite' : 'explore', Number(params.get('exscroll')));
  }

  return {
    fresh, adopt, sync, tick, away, demo, seen, lifted, reveal, veil, veilKind, click, drawPanel, drawOver,
    shown, figures, sprite, flagged, pings, rates, onTrip, status, action, send, recall, levelOf, scoutPlan,
  };
})();
