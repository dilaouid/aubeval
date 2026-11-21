// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Raids: a countdown and a horn, then raiders come out of the goblin camp, always the same one,
// out in the wild beyond the safe zone (js/village.js places it once from the land's seed), and walk to the
// hall by the cheapest way: around what stands, or through a wall when going around is too long.
// Watchtowers shoot them, walls hold them, foot soldiers bar their way (js/units.js), and the hero
// runs at those that come near the hall, when he is at the village. From the horn to the end of
// the raid the player may lay traps where they will walk (data/people.js DATA.traps); what is left
// of them is cleared away with the raid. A raider that reaches the hall steals from every stock
// and damages a building. Never a game over.
//
// Sieges (iteration 12). After `siege_after` ordinary raids, one raid in `siege_every` is a siege: a
// bigger, tougher column led by a warlord (data/enemies.js DATA.warlords: each changes the column
// in his own way; they come in turn for ever, one level stronger each siege). From the horn to the
// end of the siege the hero may challenge him once in the card battle (hudExtra, duel). Beaten, the
// warlord is out and his column loses heart: less health, less speed, and some raiders flee.
// Otherwise he marches with it: a big figure with a lot of health, whose raiders take less damage
// near him, and who counts for several at the hall. A siege repelled pays a real bounty; lost, it
// pillages and breaks more than a raid.
//
// Saved in state.raid, beside what was there (an older save has none of it: every read has a default):
//   siege   the siege announced or going on: { n (the raid it is), lord (his id), lvl (sieges seen
//           before it), duel ('won' | 'lost' once tried), fallen (struck down on the road), passed
//           (he reached the hall) }; null for an ordinary raid
//   active  also gets: siege (true), wallK, healK, speedK (what the warlord and the rout do to the
//           column), fled (raiders gone with the rout). The warlord is a raider of kind 'warlord'
//           with `lord` (his id) and `lvl`.
// state.flags.siegeTold: the first siege was explained once.
//
// Elite raids. From the city rank `elite_rank`, every raid (a siege too) comes with scourges
// (data/enemies.js DATA.elites), drawn at the horn: burning, armoured, running, a horde, two fronts.
// The raiders also gain health with every rank above the Ville (raid_rank_hp).
//   elite   the scourges of raid n: { n, mods: [ids] }; from2: where a raid on two fronts' second column comes out
//   active  also gets: elite (the ids), armor (added to every raider's), burn, burnt, tint
// state.flags.eliteTold: the elite raids were explained once.
'use strict';

const Raid = (() => {
  const E = DATA.enemies, B = DATA.buildings, M = DATA.map, T = M.tile;
  const shots = []; // arrows and bolts on their way: drawn only, never saved
  const hero = { x: 0, y: 0, dx: 0, dy: 1, moving: false }; // where he stands on the map: worked out as the game runs, never saved
  // The raiders' map: for each tile around the village, how far the hall is by the cheapest way.
  // Rebuilt when something is built, broken or felled (touch()).
  let field = null, stale = true;

  // ---- Sieges: which raids they are, and who leads them ----
  /** Whether raid number n (0 is the first) is a siege. */
  const isSiege = n => n >= tune.siege_after && (n - tune.siege_after) % Math.max(1, tune.siege_every) === 0;
  /** How many sieges came before raid number n: the level of the warlord who leads it. */
  const siegeNo = n => Math.max(0, Math.floor((n - tune.siege_after) / Math.max(1, tune.siege_every)));
  /** The warlord of the siege that comes after `k` others: they come in turn, for ever. */
  const lordFor = k => DATA.warlords[k % DATA.warlords.length];
  const lordData = id => DATA.warlords.find(w => w.id === id) || DATA.warlords[0];
  /** The siege announced or going on ({ n, lord, lvl, duel, fallen, passed }), or null: an ordinary raid, or none in sight. */
  function siege() { const r = state.raid, sg = r.siege; return sg && sg.n === r.n && (r.warned || r.active) ? sg : null; }
  /** The horn or the start of raid `r.n`: its siege is written down if it is one. Returns it, or null. */
  function announce() {
    const r = state.raid;
    if (!isSiege(r.n)) { r.siege = null; return null; }
    if (!r.siege || r.siege.n !== r.n) r.siege = { n: r.n, lord: lordFor(siegeNo(r.n)).id, lvl: siegeNo(r.n), duel: null };
    return r.siege;
  }
  /** What a warlord's level does to his health and blows on the map. */
  const lordPower = lvl => 1 + tune.warlord_growth * (lvl || 0);
  /** The warlord marching with the column now, or null: beaten, struck down, or not out of the camp yet. */
  const lordOf = a => (a && a.siege && a.raiders.find(e => e.kind === 'warlord' && !e.dead && !(e.wait > 0))) || null;
  /** The first siege ever: what it is, said once in a banner. */
  function tellFirst(sg) {
    if (state.flags.siegeTold) return;
    state.flags.siegeTold = true;
    ui.banner = { title: tr('siege_banner_title'), sub: tr('siege_banner_sub', { name: E[sg.lord].name, lvl: sg.lvl + 1 }), text: tr('siege_banner_text', { trait: lordData(sg.lord).trait }) };
  }

  // ---- Elite raids: the scourges a risen city draws ----
  const eliteData = id => DATA.elites.find(x => x.id === id);
  /** How many scourges a raid comes with at the city's rank now. */
  function eliteCount() { const k = City.rank() - tune.elite_rank; return k < 0 ? 0 : Math.min(tune.elite_max, 1 + Math.floor(k / Math.max(1, tune.elite_more_every))); }
  /** The scourges of the raid announced or going on: their ids, none for an ordinary raid. */
  function elite() { const r = state.raid; return r.elite && r.elite.n === r.n && (r.warned || r.active) ? r.elite.mods : []; }
  /** At the horn or the start of raid r.n: its scourges, drawn once (?elite=fire,armor forces them, for screenshots). */
  function drawElite() {
    const r = state.raid;
    if (r.elite && r.elite.n === r.n) return r.elite.mods;
    const mods = String(params.get('elite') || '').split(',').filter(eliteData);
    if (!mods.length) { const pool = DATA.elites.map(x => x.id); for (let k = eliteCount(); k > 0 && pool.length; k--) mods.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]); }
    r.elite = { n: r.n, mods };
    return mods;
  }
  /** The first of these scourges that has `key`, or null. */
  const eliteWith = (mods, key) => mods.map(eliteData).find(x => x && x[key]) || null;
  /** The elite raids, explained once in a banner (not over another one: then the next raid tells it). */
  function tellElite(mods) {
    if (state.flags.eliteTold || ui.banner || !mods.length) return;
    state.flags.eliteTold = true;
    const d = eliteData(mods[0]);
    ui.banner = { title: tr('elite_banner_title'), sub: tr('elite_banner_sub'), text: tr('elite_banner_text', { name: d.name, trait: d.trait, pct: Math.round(tune.elite_bounty * 100) }) };
  }
  /** Where the second column of a raid on two fronts comes out: as far out as the first, on another side, with a way to the hall. Null when there is none. */
  function pickFlank(from) {
    if (stale || !field) buildField();
    const h = Village.hallMid(), a0 = Math.atan2(from.y - h.y, from.x - h.x), R = Math.hypot(from.x - h.x, from.y - h.y) / T, rMin = Village.safeRadius() + tune.raid_spawn_margin;
    for (const turn of [Math.PI, 2.6, -2.6, 2.1, -2.1, 1.6, -1.6]) for (let r = R; r >= rMin; r -= 2) {
      const tx = Math.floor(h.x / T + Math.cos(a0 + turn) * r), ty = Math.floor(h.y / T + Math.sin(a0 + turn) * r);
      if (Village.inMap(tx, ty) && Village.walkable(tx, ty) && Village.occ[Village.idx(tx, ty)] <= 0 && distAt(tx, ty) < Infinity) return { x: tx * T + 8, y: ty * T + 8 };
    }
    return null;
  }
  /** An Incendiaire walks by: the first production building beside him catches fire (it is damaged). Once per raider, elite_burn_max a raid. */
  function torch(a, e, tx, ty) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = tx + dx, Y = ty + dy;
      if (!Village.inMap(X, Y)) continue;
      const o = Village.occ[Village.idx(X, Y)], b = o > 0 ? state.buildings.find(q => q.uid === o) : null, d = b && B[b.kind];
      if (!d || b.damaged || !d.produces || d.pop || d.fixed || d.wall || d.decor || d.monument || b.kind === 'hall') continue;
      b.damaged = true; e.burned = true; a.burnt = (a.burnt || 0) + 1;
      const p = pos(e); World.dust(b); floatText(p.x, p.y, tr('elite_burn'), UI.C.bad, 14, 14); sfx('chop');
      stale = true; Village.touchTown();
      return;
    }
  }
  const tints = new WeakMap(); // sprite -> { colour: the sprite under that colour }
  /** A raider's sprite under his raid's colour (its first scourge that has one): js/world.js draws it. */
  function tint(s) {
    const a = state.raid.active, c = a && a.tint;
    if (!c || !s) return s;
    let m = tints.get(s);
    if (!m) tints.set(s, m = {});
    if (!m[c]) {
      const k = document.createElement('canvas'), g = k.getContext('2d');
      k.width = s.width; k.height = s.height; g.drawImage(s, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.5; g.fillStyle = c; g.fillRect(0, 0, k.width, k.height);
      m[c] = k;
    }
    return m[c];
  }

  /**
   * Who comes in raid number n (0 is the first): the table in data/enemies.js, then its endless tail.
   * A siege is that column made bigger (`siege_size`) plus what its warlord brings; the warlord
   * himself is not counted (he may be beaten before it leaves).
   */
  function composition(n) {
    const waves = DATA.raids.waves, base = Object.assign({}, waves[Math.min(n, waves.length - 1)]);
    const extra = Math.max(0, n - (waves.length - 1));
    for (const k in DATA.raids.each) base[k] = (base[k] || 0) + DATA.raids.each[k] * extra;
    const sg = isSiege(n), add = sg ? lordFor(siegeNo(n)).siege.add || {} : {};
    for (const k in add) base[k] = base[k] || 0;
    const out = {};
    for (const k in base) out[k] = Math.max(0, Math.round((Math.floor(base[k]) * (sg ? tune.siege_size : 1) + (add[k] || 0)) * tune.raid_size_scale));
    return out;
  }
  /** The hero's post: before the hall's door. */
  const post = () => ({ x: (M.hall.x + B.hall.w + 0.5) * T, y: (M.hall.y + B.hall.h + 0.5) * T }); // off its front corner, where the hall's own image does not hide him
  /** Where the hero stands now, in map pixels. */
  const heroPost = () => hero;
  /** Where a raider is drawn and shot at: its place, a little apart from its neighbours. */
  function pos(e) { return { x: e.x + ((e.id * 7) % 7) - 3, y: e.y + ((e.id * 5) % 5) - 2 }; }
  function touch() { stale = true; }
  function reset() { field = null; stale = true; shots.length = 0; Object.assign(hero, post(), { dx: 0, dy: 1, moving: false }); }

  // ---- The raiders' map ----
  const SPREAD = 8; // tiles of margin beyond the camp
  /**
   * Half the side, in tiles, of the square around the hall the raiders' map covers when their camp's
   * middle is `campDist` tiles away: as far as the camp, with room around it. The camp is only placed
   * where a way inside this square leads to the hall (js/village.js placeCamp).
   */
  const fieldRadius = campDist => Math.ceil(Math.max(Village.safeRadius() + tune.raid_spawn_margin, campDist)) + SPREAD + 8;
  function buildField() {
    const h = Village.hallMid(), c = Village.campMid(), R = fieldRadius(Math.hypot(c.x - h.x, c.y - h.y) / T), cx = Math.floor(h.x / T), cy = Math.floor(h.y / T);
    const x0 = Math.max(0, cx - R), y0 = Math.max(0, cy - R), w = Math.min(M.w - 1, cx + R) - x0 + 1, hh = Math.min(M.h - 1, cy + R) - y0 + 1;
    const dist = new Float32Array(w * hh).fill(Infinity), cost = new Float32Array(w * hh), solid = new Uint8Array(w * hh);
    const byUid = new Map(); for (const b of state.buildings) byUid.set(b.uid, b);
    const heap = []; // [distance, tile] pairs, smallest first
    const push = (d, k) => { let i = heap.length; heap.push([d, k]); while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= d) break; heap[i] = heap[p]; i = p; } heap[i] = [d, k]; };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        let i = 0;
        for (;;) { let c = i * 2 + 1; if (c >= heap.length) break; if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++; if (heap[c][0] >= last[0]) break; heap[i] = heap[c]; i = c; }
        heap[i] = last;
      }
      return top;
    };
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const k = y * w + x, X = x0 + x, Y = y0 + y, i = Village.idx(X, Y), o = Village.occ[i], b = o > 0 ? byUid.get(o) : null;
      if (!Village.walkable(X, Y)) { cost[k] = Infinity; solid[k] = 1; continue; }
      if (b && b.kind === 'hall') { cost[k] = 1; solid[k] = 1; dist[k] = 0; push(0, k); continue; }
      if (b && !b.damaged) { // it must be broken to pass: a wall for its strength, anything else as a last resort
        const d = B[b.kind];
        cost[k] = 1 + (d.wall ? tune.raid_wall_cost * b.hp / d.wall.hp : tune.raid_building_cost); solid[k] = 1;
      } else cost[k] = Village.flora[i] ? tune.raid_forest_cost : 1;
    }
    while (heap.length) {
      const [d, u] = pop();
      if (d > dist[u]) continue;
      const ux = u % w, uy = (u / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const vx = ux + dx, vy = uy + dy;
        if (vx < 0 || vy < 0 || vx >= w || vy >= hh) continue;
        const v = vy * w + vx;
        if (cost[v] === Infinity) continue;
        if (dx && dy && (solid[uy * w + vx] || solid[vy * w + ux])) continue; // never between two corners
        const nd = d + (dx && dy ? 1.414 : 1) * cost[u]; // the raider walks from v onto u
        if (nd < dist[v]) { dist[v] = nd; push(dist[v], v); } // queued as stored (a 32-bit float): queued as computed, a value rounded down is taken for stale when popped and never spreads
      }
    }
    field = { x0, y0, w, h: hh, dist, cost, solid, byUid };
    stale = false;
  }
  /** How far the hall is from a tile by the raiders' map; Infinity off it. */
  function distAt(tx, ty) {
    if (!field) return Infinity;
    const x = tx - field.x0, y = ty - field.y0;
    return x < 0 || y < 0 || x >= field.w || y >= field.h ? Infinity : field.dist[y * field.w + x];
  }
  /** The tile a raider on (tx, ty) steps to next, or null off the map of the raid. */
  function nextTile(tx, ty) {
    const f = field, ux = tx - f.x0, uy = ty - f.y0;
    if (ux < 0 || uy < 0 || ux >= f.w || uy >= f.h) return null;
    let best = null, bd = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const vx = ux + dx, vy = uy + dy;
      if (vx < 0 || vy < 0 || vx >= f.w || vy >= f.h) continue;
      const v = vy * f.w + vx;
      if (f.cost[v] === Infinity || f.dist[v] === Infinity) continue;
      if (dx && dy && (f.solid[uy * f.w + vx] || f.solid[vy * f.w + ux])) continue;
      const d = f.dist[v] + (dx && dy ? 1.414 : 1) * f.cost[v];
      if (d < bd) { bd = d; best = { x: tx + dx, y: ty + dy }; }
    }
    return best;
  }
  /** Where the next raid comes out: the free tile at the camp's gate (its side facing the hall), or the nearest one that has a way to the hall. */
  function pickFrom() {
    buildField();
    const h = Village.hallMid(), c = Village.campMid(), d = Math.hypot(h.x - c.x, h.y - c.y) || 1, ux = (h.x - c.x) / d, uy = (h.y - c.y) / d;
    for (let r = Village.CAMP / 2 + 1; r < Village.CAMP / 2 + 12; r++) for (let k = 0; k < 16; k++) {
      const a = Math.atan2(uy, ux) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35;
      const tx = Math.floor(c.x / T + Math.cos(a) * r), ty = Math.floor(c.y / T + Math.sin(a) * r);
      if (Village.inMap(tx, ty) && distAt(tx, ty) < Infinity && Village.occ[Village.idx(tx, ty)] <= 0 && Village.walkable(tx, ty)) return { x: tx * T + 8, y: ty * T + 8 };
    }
    return { x: h.x, y: h.y + (B.hall.h / 2 + 2) * T }; // the camp has no way in (an island): the only case they land at the door
  }
  /** The raiders' way, from where the next raid comes out to the hall: [{ tx, ty }]. Where Aveline suggests a trap (js/siting.js). */
  function route() {
    if (stale || !field) buildField();
    const from = state.raid.from || pickFrom(), out = [];
    let tx = Math.floor(from.x / T), ty = Math.floor(from.y / T);
    for (let i = 0; i < 600; i++) {
      out.push({ tx, ty });
      const n = nextTile(tx, ty);
      if (!n || distAt(n.x, n.y) <= 0) break;
      tx = n.x; ty = n.y;
    }
    return out;
  }
  /** The side a map point lies on, seen from the hall, in the player's words. */
  function compass(p) { const h = Village.hallMid(); return DATA.strings.dirs[World.octant(p.x - h.x, p.y - h.y)]; }

  /** The horn: the raid's way is fixed, traps can be laid; a siege names its warlord and offers the duel. */
  function warn() {
    const r = state.raid;
    r.warned = true; r.from = pickFrom();
    const sg = announce();
    if (sg) { toast(tr('siege_warn', { dir: compass(r.from), name: E[sg.lord].name }), UI.C.bad); tellFirst(sg); }
    else toast(tr('raid_warn', { dir: compass(r.from) }), UI.C.accent);
    const mods = drawElite();
    if (mods.length) {
      r.from2 = eliteWith(mods, 'split') ? pickFlank(r.from) : null;
      toast(tr('elite_warn', { list: mods.map(m => eliteData(m).name).join(', ') }), UI.C.bad);
      if (r.from2) toast(tr('elite_flank', { dir: compass(r.from2) }), UI.C.bad);
      tellElite(mods);
    }
    sfx('horn');
  }
  function start(early) {
    const r = state.raid, sg = announce(), mods = sg ? lordData(sg.lord).siege : {}, routed = !!sg && sg.duel === 'won';
    const el = drawElite(), size = (eliteWith(el, 'size') || {}).size || 1, split = !!eliteWith(el, 'split');
    const comp = composition(r.n), hpK = (1 + tune.raid_hp_growth * r.n) * (sg ? tune.siege_hp * (mods.hp || 1) : 1) * (1 + tune.raid_rank_hp * Math.max(0, City.rank() - 2));
    if (size !== 1) for (const k in comp) comp[k] = Math.round(comp[k] * size); // a horde
    if (!r.from) r.from = pickFrom();
    if (split && !r.from2) r.from2 = pickFlank(r.from); // two fronts, called before the horn
    const gap = tune.raid_spawn_gap * ((eliteWith(el, 'gap') || {}).gap || 1), two = split && !!r.from2;
    const gob = comp.gobelin || 0, order = [];
    for (let i = 0; i < (comp.brute || 0); i++) order.push('brute');           // the shields walk in front
    if (sg && !routed) order.push('warlord');                                  // the warlord right behind them, unless the hero beat him
    for (let i = 0; i < Math.ceil(gob / 2); i++) order.push('gobelin');
    for (let i = 0; i < (comp.chaman || 0); i++) order.push('chaman');         // the healers in the middle
    for (let i = 0; i < Math.floor(gob / 2); i++) order.push('gobelin');
    r.active = {
      raiders: order.map((kind, i) => {
        const lord = kind === 'warlord', hp = Math.round(E[kind].raid.hp * (lord ? lordPower(sg.lvl) : hpK));
        const at = two && i % 2 ? r.from2 : r.from; // two fronts: every other raider takes the second way
        const e = { id: i, kind, hp, max: hp, x: at.x, y: at.y, dx: 0, dy: 1, wait: (two ? Math.floor(i / 2) : i) * gap };
        if (lord) { e.lord = sg.lord; e.lvl = sg.lvl; }
        return e;
      }),
      leaks: 0, killed: 0, total: order.length, early: !!early,
    };
    if (sg) Object.assign(r.active, { siege: true, wallK: mods.wall || 1, healK: mods.heal || 1, speedK: mods.speed || 1, fled: 0 });
    if (el.length) { // the scourges
      const ds = el.map(eliteData), a = r.active;
      Object.assign(a, { elite: el.slice(), armor: ds.reduce((n, d) => n + (d.armor || 0), 0), burn: ds.some(d => d.burn), burnt: 0, tint: (ds.find(d => d.tint) || {}).tint || null });
      a.speedK = (a.speedK || 1) * ds.reduce((k, d) => k * (d.speed || 1), 1);
    }
    if (routed) rout(r.active); // beaten before his column left: it comes without him, and without heart
    r.timer = null; r.warned = false; stale = true;
    if (sg) { toast(tr(routed ? 'siege_start_routed' : 'siege_start', { name: lordData(sg.lord).name }), UI.C.bad); tellFirst(sg); }
    else toast(tr('raid_start'), UI.C.bad);
    sfx('horn');
    events.push({ type: 'raid', n: r.n, siege: !!sg });
  }
  function hurt(a, e, dmg, pierce) {
    const s = E[e.kind].raid, lord = e.kind === 'warlord', chief = lord ? null : lordOf(a);
    const guard = chief && Math.hypot(chief.x - e.x, chief.y - e.y) <= tune.warlord_aura ? 1 - tune.warlord_aura_guard : 1; // near his warlord, a raider is tougher
    const n = Math.max(1, Math.round((dmg - (pierce ? 0 : s.armor + (a.armor || 0))) * guard)); // the Blindés: more armour
    e.hp -= n; e.flash = 0.12;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; a.killed++;
      const p = pos(e), gold = lord ? Math.round(s.gold * lordPower(e.lvl)) : s.gold;
      Village.gain('gold', gold); floatText(p.x, p.y, '+' + gold, UI.C.gold, 16, 14); sfx('coin');
      if (lord) { // the warlord struck down on the road: no duel any more
        const sg = state.raid.siege; if (sg) sg.fallen = true;
        toast(tr('lord_down', { name: lordData(e.lord).name, gold }), UI.C.good); World.blast(p.x, p.y, 24); sfx('fanfare');
      }
    }
  }

  // ---- The duel: the hero against the siege's warlord, once ----
  /**
   * The column loses heart: every raider loses a share of his health, the column a share of its
   * speed, and some raiders flee at once (the rearguard first). The warlord, if he marches, is out.
   * Returns how many fled.
   */
  function rout(a) {
    for (const e of a.raiders) {
      if (e.dead) continue;
      if (e.kind === 'warlord') { e.dead = true; continue; }
      e.max = Math.max(1, Math.round(e.max * (1 - tune.duel_rout_hp))); e.hp = Math.max(1, Math.round(e.hp * (1 - tune.duel_rout_hp)));
    }
    a.speedK = (a.speedK || 1) * (1 - tune.duel_rout_speed);
    const left = a.raiders.filter(e => !e.dead);
    let n = Math.min(left.length - 1, Math.floor(left.length * tune.duel_rout_flee)); // one at least still comes
    for (let i = left.length - 1, k = n; i >= 0 && k > 0; i--, k--) {
      const e = left[i]; e.dead = true;
      if (!(e.wait > 0)) { const p = pos(e); floatText(p.x, p.y, tr('lord_flee'), UI.C.good, 14, 14); }
    }
    n = Math.max(0, n); a.fled = (a.fled || 0) + n;
    return n;
  }
  /** Why the warlord cannot be challenged now: '' when there is nobody to challenge, a line for the player, or null when he can. */
  function duelBlocked() {
    const sg = siege();
    if (!sg || sg.duel || sg.fallen || sg.passed) return '';
    return Hero.away() ? tr('duel_away') : null;
  }
  /** The hero beat the warlord: popularity, and the column pays for it (now if it marches, else when it leaves). */
  function duelWon(sg) {
    const a = state.raid.active, name = lordData(sg.lord).name;
    sg.duel = 'won';
    City.gainPop(tune.duel_pop, tr('pop_duel'));
    toast(a ? tr('duel_won', { name, n: rout(a) }) : tr('duel_won_before', { name }), UI.C.good);
    Save.persist();
  }
  /** Challenges the siege's warlord: the card battle, against him alone, once per siege. */
  function duel() {
    const sg = siege();
    if (!sg || duelBlocked() !== null) { sfx('error'); return false; }
    const w = lordData(sg.lord);
    sg.duel = 'lost'; // tried: only a win changes it (closing the game in the middle of the duel does not give it back)
    Save.persist();
    Battle.start([w.id], {
      title: tr('duel_title', { name: E[w.id].name }), boss: true, once: true, scale: 1 + tune.warlord_duel_growth * sg.lvl,
      reward: { res: Object.assign({}, w.prize) }, hint: tr('duel_hint'), loseText: tr('duel_lost_text'),
      onWin: () => duelWon(sg), onLose: () => toast(tr('duel_lost', { name: w.name }), UI.C.bad),
    });
    return true;
  }
  /** The key of a raid line of the HUD (data/strings.js raid_in, raid_now): its siege twin when the raid coming or going on is one. */
  function hudKey(key) {
    const r = state.raid, sg = r.active ? r.active.siege : isSiege(r.n);
    return sg ? key.replace('raid_', 'siege_') : key;
  }
  /**
   * Under the HUD's raid plate (js/screens.js drawHud), from the horn to the end of a siege: who
   * leads it, what he changes, and the button that challenges him; once the duel is over or cannot
   * be, what became of him.
   */
  function hudExtra(x, y, w) {
    const sg = siege();
    if (sg) { siegePlate(sg, x, y, w); y += 96; }
    elitePlate(x, y, w);
  }
  /** Under the raid plate (and the siege's), from the horn to the end of an elite raid: its scourges, each in a few words. */
  function elitePlate(x, y, w) {
    const mods = elite();
    if (!mods.length) return;
    const C = UI.C, ds = mods.map(eliteData), h = 30 + ds.length * 18;
    UI.region(x, y, w, h, null, tr('elite_tip', { list: ds.map(d => d.name + ' : ' + d.trait).join('\n'), pct: Math.round(tune.elite_bounty * 100 * ds.length) }));
    UI.plate(x, y, w, h, 'bad');
    UI.icon('icon.raid', x + 20, y + 15, 16);
    UI.label(tr('elite_hud'), x + 34, y + 16, 14, C.gold, 'left');
    ds.forEach((d, i) => {
      const ly = y + 34 + i * 18;
      if (d.tint) { ctx.fillStyle = d.tint; ctx.fillRect(x + 14, ly - 5, 8, 8); }
      UI.label(d.name + ' · ' + d.short, x + 28, ly, 12, C.text, 'left', false);
    });
  }
  /** The siege's plate: who leads it, what he changes, and the button that challenges him. */
  function siegePlate(sg, x, y, w) {
    const C = UI.C, d = lordData(sg.lord), a = state.raid.active, on = lordOf(a), why = duelBlocked(), h = 90;
    const tip = tr('lord_tip', { name: E[d.id].name, lvl: sg.lvl + 1, trait: d.trait, pct: Math.round(tune.warlord_aura_guard * 100), n: tune.warlord_leaks });
    UI.region(x, y, w, h, null, tip);
    UI.plate(x, y, w, h, sg.duel === 'won' || sg.fallen ? null : 'bad'); Tuto.mark('siege:lord', x, y, w, h);
    UI.icon(UI.ready('icon.siege') ? 'icon.siege' : 'icon.raid', x + 20, y + 20, 16);
    UI.label(tr('siege_hud', { name: E[d.id].name }), x + 34, y + 21, 14, C.gold, 'left');
    if (sg.lvl > 0) UI.label(tr('siege_lvl', { n: sg.lvl + 1 }), x + w - 14, y + 21, 12, C.dim, 'right', false);
    UI.label(d.short, x + 14, y + 40, 12, C.text, 'left', false);
    const bx = x + 10, by = y + 52, bw = w - 20, bh = 30;
    if (why !== '') { // he can still be challenged (or could, were the hero home)
      UI.button(bx, by, bw, bh, tr('duel_btn', { name: d.name }), duel, { primary: why === null, disabled: why !== null, size: 14, icon: 'icon.atk', tip: why || tr('duel_tip', { name: E[d.id].name }) });
      Tuto.mark('siege:duel', bx, by, bw, bh);
    } else if (sg.duel === 'won') UI.label(tr('duel_won_hud'), x + w / 2, by + 15, 13, C.good);
    else if (sg.fallen) UI.label(tr('lord_fallen'), x + w / 2, by + 15, 13, C.good);
    else if (on) { // he marches: his health
      UI.bar(bx, by + 5, bw, 20, on.hp / on.max, C.bad);
      text(tr('lord_marching', { hp: Math.max(0, Math.ceil(on.hp)), max: on.max }), x + w / 2, by + 16, 12, C.text, 'center', true);
    } else UI.label(tr('duel_lost_hud'), x + w / 2, by + 15, 13, C.accent);
  }
  /**
   * Draws a warlord on the map (js/world.js calls it for every raider and camp guard): `g` the
   * world's canvas, (X, Y) his feet on it, `t` the world's clock. Returns false for anyone else,
   * who is then drawn as usual. Until the sheet `iso.unit.warlord` exists he wears his stand-in
   * (data/enemies.js `figure`), drawn bigger; a marching warlord has the ring of his aura around him.
   */
  function drawFigure(g, e, X, Y, t) {
    if (e.kind !== 'warlord') return false;
    const d = E.warlord, own = !!Art.sheet('iso.unit.warlord'), k = own ? 1 : d.scale || 1, post = e.px != null; // post: a camp's chief
    const moving = e.hitting || (post ? Math.abs(e.x - e.px) + Math.abs(e.y - e.py) > 2 : true);
    const s = World.unitSprite(own ? 'warlord' : d.figure, e.dx || 0, e.dy == null ? 1 : e.dy, moving, t * (e.hitting ? 1.6 : 1) + e.id * 0.31);
    const w = Math.round(s.width * k), h = Math.round(s.height * k), x = X - (w >> 1), y = Y - h;
    if (!post) { // the aura's edge on the ground: raiders inside it are tougher
      const o = World.iso(e.x, e.y), R = tune.warlord_aura, n = 60, run = 3; // dashes that turn slowly, dark under red so they show on any ground
      for (let i = 0; i < n; i++) {
        if (Math.floor(i / run) % 2) continue;
        const an = i / n * 6.283 + t * 0.3, q = World.iso(e.x + Math.cos(an) * R, e.y + Math.sin(an) * R), qx = Math.round(X + q.x - o.x), qy = Math.round(Y - 2 + q.y - o.y);
        g.globalAlpha = 0.6; g.fillStyle = PAL.ink; g.fillRect(qx, qy + 1, 2, 2);
        g.globalAlpha = 0.75 + 0.25 * Math.sin(t * 4); g.fillStyle = PAL.red; g.fillRect(qx, qy, 2, 2);
      }
      g.globalAlpha = 1;
    }
    if (!(e.flash > 0)) g.drawImage(s, x, y, w, h);
    const wave = Math.round(Math.sin(t * 5)); // his pennant, so the chief is told from his brutes at a glance
    g.fillStyle = PAL.ink; g.fillRect(X - 1, y - 12, 1, 12);
    g.fillStyle = PAL.red; g.fillRect(X, y - 12, 5, 4); g.fillRect(X + 5, y - 12 + wave, 3, 4);
    const bw = Math.max(w, 26), bx = X - (bw >> 1); // his health, always shown
    g.fillStyle = PAL.ink; g.fillRect(bx, y - 4, bw, 4);
    g.fillStyle = PAL.red; g.fillRect(bx + 1, y - 3, Math.round((bw - 2) * clamp(e.hp / e.max, 0, 1)), 2);
    return true;
  }
  /**
   * ?demo=1&siege=N (js/screens.js buildDemo), for screenshots: 1 the horn has sounded and the duel
   * is offered, 2 the warlord marches with his column, 3 the first siege's banner, 4 the duel won
   * while the column marches (it is routed). &lord=K: K sieges later (the next warlords, stronger).
   * &camp=N, with or without a siege: the camp that stands rose after N others fell (its chief).
   * Returns false when the address asks for no siege: the demo then starts its usual raid.
   */
  function demo() {
    const camps = Math.max(0, Math.floor(Number(params.get('camp')) || 0));
    if (camps) Camp.demo(camps);
    const v = Number(params.get('siege'));
    if (!v) return false;
    const r = state.raid;
    r.n = tune.siege_after + Math.max(0, Math.floor(Number(params.get('lord')) || 0)) * tune.siege_every;
    if (v !== 3) state.flags.siegeTold = true;
    r.timer = tune.raid_warning * 0.75; warn();
    if (v === 2 || v === 4) start(false);
    if (v === 4) duelWon(r.siege);
    return true;
  }
  /** Hurts a raider of the raid going on: what a soldier's blow calls (js/units.js). */
  function hurtNow(e, dmg, pierce) { const a = state.raid.active; if (a && !e.dead) hurt(a, e, dmg, pierce); }

  // ---- Traps: laid from the horn to the end of the raid, then cleared away ----
  /** Whether traps can be laid now: a raid is announced or going on. */
  const trapsOpen = () => !!(state.raid.active || state.raid.warned);
  const trapAt = (tx, ty) => state.raid.traps.find(t => t.x === tx && t.y === ty) || null;
  /** Whether a trap fits on a tile: open ground or a path, with no trap on it yet. */
  function canTrap(tx, ty) {
    if (!Village.inMap(tx, ty) || !Village.walkable(tx, ty)) return false;
    const o = Village.occ[Village.idx(tx, ty)];
    return (o === 0 || o === -2) && !trapAt(tx, ty);
  }
  /** Lays one trap, for its price. `quiet`: no word when it cannot (a stroke of the pointer). */
  function layTrap(kind, tx, ty, quiet) {
    const d = DATA.traps[kind], say = key => { if (!quiet) toast(tr(key, { n: tune.trap_max }), UI.C.bad); return false; };
    if (!trapsOpen()) return say('trap_wait');
    if (state.raid.traps.length >= tune.trap_max) return say('trap_full');
    if (!canTrap(tx, ty)) return say('bad_spot');
    if (!Village.pay(Village.toolCost(d.cost))) return say('no_funds');
    state.raid.traps.push({ kind, x: tx, y: ty, uses: d.uses }); state.counters.traps = (state.counters.traps || 0) + 1;
    World.dustAt(tx, ty); sfx('place');
    return true;
  }
  /** A raider steps on a tile: the trap there, if any, goes off. */
  function spring(a, e, tx, ty) {
    const traps = state.raid.traps, i = traps.findIndex(t => t.x === tx && t.y === ty);
    if (i < 0) return;
    const t = traps[i], d = DATA.traps[t.kind], cx = tx * T + 8, cy = ty * T + 8;
    if (d.slow) { e.slowT = d.time; e.slowK = d.slow; sfx('guard'); }
    if (d.dmg) {
      hurt(a, e, d.dmg, d.pierce);
      if (d.splash) { for (const o of a.raiders) { if (o === e || o.dead || o.wait > 0) continue; if (Math.hypot(o.x - cx, o.y - cy) <= d.splash) hurt(a, o, d.dmg, d.pierce); } World.blast(cx, cy, d.splash); sfx('crit'); }
      else sfx('hit');
    }
    if (--t.uses <= 0) { traps.splice(i, 1); World.dustAt(tx, ty); }
  }

  /**
   * One raider at the hall: he steals a share of every stock and breaks something. In a siege he
   * steals and breaks more; the warlord counts for several raiders. The city's guard (great works,
   * the legacy tree: City.bonus('guard')) takes its share off what is stolen.
   */
  function leak(a, e) {
    const lord = e.kind === 'warlord', times = lord ? tune.warlord_leaks : 1;
    e.dead = true; a.leaks += times;
    if (lord && state.raid.siege) state.raid.siege.passed = true;
    const share = clamp(Village.pillagePct() * (a.siege ? tune.siege_pillage : 1) * (1 - City.bonus('guard')), 0, 1);
    for (let k = 0; k < times; k++) for (const res of DATA.pillaged) state.res[res] -= Math.floor(state.res[res] * share);
    for (let k = 0; k < times * (a.siege ? tune.siege_breaks : 1); k++) {
      const targets = state.buildings.filter(b => !B[b.kind].fixed && !B[b.kind].wall && !B[b.kind].decor && !b.damaged);
      if (!targets.length) break;
      const b = targets[Math.floor(rng() * targets.length)]; b.damaged = true; World.dust(b); stale = true; Village.touchTown();
    }
    const p = Village.hallMid();
    floatText(p.x, p.y, tr(a.siege ? 'sacked' : 'pillage'), UI.C.bad, 22, 30); sfx('hurt');
  }
  function finish() {
    const r = state.raid, a = r.active, sg = !!a.siege, won = a.leaks < tune.raid_leaks_to_lose;
    if (!won) { state.counters.raidsLost++; state.gained = tr(sg ? 'siege_lost' : 'raid_lost'); toast(state.gained, UI.C.bad); sfx('lose'); }
    else { // the raid's bounty, a siege's on top (bigger with every siege seen), more for a raid called early and for the city's bounty bonus
      const base = tune.raid_bounty * (r.n + 1) + (sg ? tune.siege_bounty * (siegeNo(r.n) + 1) : 0);
      const gold = Math.round(base * (a.early ? 1 + tune.raid_call_bonus : 1) * (1 + City.bonus('bounty')) * (1 + tune.elite_bounty * (a.elite || []).length));
      Village.gain('gold', gold); state.counters.raidsWon++;
      state.gained = tr(sg ? 'siege_won' : 'raid_won', { gold }); toast(state.gained, UI.C.good); sfx('fanfare');
    }
    r.n++; r.active = null; r.timer = tune.raid_interval; r.warned = false; r.from = null; r.from2 = null; r.siege = null; r.elite = null;
    r.traps = []; Units.afterRaid(); // the traps are cleared away, the soldiers on their feet again
    City.event('raid', { won, siege: sg }); // the city's orders and the hero's popularity read it
    Save.persist();
  }
  /**
   * The hero walks to the nearest raider that comes close to the hall, else to the goblin camp while
   * his soldiers attack it (js/camp.js), else back to his post. Returns what he is on, in reach:
   * a raider, or a camp target ({ guard } or { camp: true }).
   */
  function heroTick(dt, live) {
    if (Hero.away()) { Object.assign(hero, post(), { moving: false }); return null; }
    let goal = post(), target = null;
    if (live) {
      const h = Village.hallMid(), R = tune.hero_patrol_range * T; let bd = Infinity;
      for (const e of live) { if (e.dead) continue; const d = Math.hypot(e.x - h.x, e.y - h.y); if (d <= R && d < bd) { bd = d; target = e; } }
      if (target) goal = target;
    }
    if (!target && Camp.assaulted()) { const g = Camp.gate(); target = Camp.targetFor(hero.x, hero.y, g.x, g.y, tune.hero_guard_range); if (target) goal = target; else goal = g; }
    const dx = goal.x - hero.x, dy = goal.y - hero.y, d = Math.hypot(dx, dy), stop = target ? tune.hero_guard_range * 0.6 : 0.5;
    hero.moving = d > stop;
    if (hero.moving) { const v = Math.min(d - stop, tune.hero_speed * dt); hero.x += dx / d * v; hero.y += dy / d * v; hero.dx = dx; hero.dy = dy; }
    else if (!target) { hero.dx = 0; hero.dy = 1; } // at his post, he looks down the screen
    else { hero.dx = dx; hero.dy = dy; }
    return target && d <= tune.hero_guard_range ? target : null;
  }

  /** The hero's blow at what he is on: a raider, or the camp he went to with his soldiers. */
  function heroFight(dt, target) {
    hero.cd = (hero.cd || 0) - dt; if (hero.swing > 0) hero.swing -= dt;
    if (!target || target.dead || hero.cd > 0) return;
    if (target.guard || target.camp) Camp.hit(target, Hero.stats().atk); else hurt(state.raid.active, target, Hero.stats().atk, false);
    hero.cd = tune.hero_guard_rate; hero.swing = 0.18; sfx('hit');
  }

  function tick(dt) {
    for (let i = shots.length - 1; i >= 0; i--) { shots[i].t += dt; if (shots[i].t > 0.16) shots.splice(i, 1); }
    const r = state.raid;
    if (!r.active) {
      heroFight(dt, heroTick(dt, null));
      if (r.timer == null || !Camp.standing()) return; // no camp standing (it fell, the next one has not risen): no raid
      r.timer -= dt;
      if (!r.warned && r.timer <= tune.raid_warning) warn();
      if (r.timer <= 0) start(false);
      return;
    }
    const a = r.active;
    if (stale || !field) buildField();
    const hall = Village.hallMid();
    for (const e of a.raiders) {
      if (e.dead) continue; // struck down since the last step, by a soldier
      if (e.wait > 0) { e.wait -= dt; continue; }
      if (e.flash > 0) e.flash -= dt;
      if (e.slowT > 0) e.slowT -= dt;
      const s = E[e.kind].raid, tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
      const power = e.kind === 'warlord' ? lordPower(e.lvl) : 1, breakDps = s.wallDps * (a.wallK || 1) * power; // a warlord's blows grow with his level; his trait may speed every raider's breaking
      if (e.tile !== ty * M.w + tx) { // a new tile under his feet: its trap, and the Incendiaires' torch
        e.tile = ty * M.w + tx; spring(a, e, tx, ty); if (e.dead) continue;
        if (a.burn && !e.burned && a.burnt < tune.elite_burn_max) torch(a, e, tx, ty);
      }
      const foe = Units.blocker(e), n = foe ? null : nextTile(tx, ty);
      let gx = hall.x, gy = hall.y; // off the raiders' map: straight for the hall
      e.hitting = false;
      if (foe) { // a foot soldier bars his way: he stops and fights
        e.hitting = true; e.dx = foe.x - e.x; e.dy = foe.y - e.y;
        Units.hurt(foe, (s.unitDps || 1) * power * dt);
      }
      if (n) {
        const o = Village.occ[Village.idx(n.x, n.y)], b = o > 0 ? field.byUid.get(o) : null;
        gx = n.x * T + 8; gy = n.y * T + 8;
        if (b && b.kind === 'hall') { leak(a, e); continue; }
        if (b && !b.damaged) { // something stands in the way: he breaks it
          e.hitting = true; e.dx = gx - e.x; e.dy = gy - e.y;
          if (B[b.kind].wall) { b.hp -= breakDps * dt; if (b.hp <= 0) b.hp = 0; }
          else b.siege = (b.siege || 0) + breakDps * dt;
          if (B[b.kind].wall ? b.hp <= 0 : b.siege >= tune.raid_building_hp) { b.damaged = true; b.siege = 0; if (B[b.kind].wall) Village.stamp(b, b.uid); World.dust(b); sfx('chop'); stale = true; Village.touchTown(); }
        }
      }
      if (!e.hitting) {
        const dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy) || 1;
        const v = Math.min(d, s.speed * (a.speedK || 1) * (Village.flora[Village.idx(tx, ty)] ? tune.raid_forest_slow : 1) * (e.slowT > 0 ? e.slowK : 1) * dt);
        e.x += dx / d * v; e.y += dy / d * v; e.dx = dx; e.dy = dy;
      }
      if (s.heal) for (const o of a.raiders) if (o !== e && o.wait <= 0 && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < s.aura) o.hp = Math.min(o.max, o.hp + s.heal * (a.healK || 1) * dt);
    }
    const live = a.raiders.filter(e => e.wait <= 0 && !e.dead);
    const near = e => distAt(Math.floor(e.x / T), Math.floor(e.y / T));
    for (const b of state.buildings) { // towers: the raider closest to the hall, in range
      const d = B[b.kind];
      if (!d.tower || b.damaged) continue;
      b.cd = (b.cd || 0) - dt;
      if (b.cd > 0) continue;
      const cx = (b.x + Village.dims(b).w / 2) * T, cy = (b.y + Village.dims(b).h / 2) * T, range = d.tower.range * T;
      let best = null, bp = null, bn = Infinity;
      for (const e of live) { if (e.dead) continue; const p = pos(e); if (Math.hypot(p.x - cx, p.y - cy) > range) continue; const k = near(e); if (!best || k < bn) { best = e; bp = p; bn = k; } }
      if (!best) { b.cd = 0; continue; }
      b.cd = d.tower.rate;
      const dmg = d.tower.dmg * (1 + (b.lvl - 1) * tune.tower_level_step);
      hurt(a, best, dmg, d.tower.pierce);
      if (d.tower.splash) for (const o of live) { if (o === best || o.dead) continue; const p = pos(o); if (Math.hypot(p.x - bp.x, p.y - bp.y) <= d.tower.splash) hurt(a, o, dmg * 0.5, d.tower.pierce); }
      shots.push({ x0: cx, y0: cy, z0: World.towerTop(b), x1: bp.x, y1: bp.y, z1: 6, t: 0, magic: !!d.tower.splash }); // map points, z: art pixels above the ground
      sfx('arrow');
    }
    heroFight(dt, heroTick(dt, live)); // the hero, when he is at the village
    a.raiders = a.raiders.filter(e => !e.dead);
    if (!a.raiders.length) finish();
  }
  /** Calls the next raid now, for a bigger bounty. */
  function callNow() { if (!state.raid.active && state.raid.timer != null && Camp.standing()) start(true); }

  return { tick, start, callNow, composition, heroPost, hero, pos, shots, reset, touch, compass, hurt: hurtNow, trapsOpen, trapAt, canTrap, layTrap, route, fieldRadius,
    isSiege, siege, duel, duelBlocked, hudExtra, hudKey, drawFigure, demo, elite, tint };
})();
