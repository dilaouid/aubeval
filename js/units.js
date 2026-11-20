// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The citizens put to work: workers and soldiers (data/people.js DATA.units). Each one takes one
// free inhabitant of the village.
//
//   A worker works alone once trained: he walks to the nearest tree, rock or farm that gives his
//   resource, works there a moment, carries his load to the nearest drop-off (the town hall, or a
//   building of his trade built closer) and starts again. A raider coming near sends him running
//   to the hall until the way is clear.
//   A soldier is trained at the barracks, then selected and ordered by the player: he guards the
//   point he was sent to and goes for any raider that comes near it. A foot soldier bars the way:
//   raiders stop to fight him (js/raid.js). Struck down, he is carried to the barracks and stands
//   again after a rest: nobody dies for good.
//
// Everything saved is in state.units (plain data). Units walk in straight lines: the village's own
// people pass its gates and walls as they please.
'use strict';

const Units = (() => {
  const U = DATA.units, B = DATA.buildings, M = DATA.map, T = M.tile;
  let stale = true; // something was built, felled or planted: every worker looks for his spot again

  const def = u => U[u.kind];
  const isSoldier = u => def(u).role === 'soldier';
  const isWorker = u => def(u).role === 'worker';
  /** Whether a soldier fights hand to hand: raiders stop for him. */
  const melee = u => isSoldier(u) && def(u).range < 20;
  const count = kind => state.units.reduce((n, u) => n + (u.kind === kind ? 1 : 0), 0);
  const soldiers = () => state.units.filter(isSoldier);
  const byId = id => state.units.find(u => u.id === id);
  const barracks = () => state.buildings.find(b => b.kind === 'barracks') || null;
  /** The middle of the tiles just in front of a building: where people stand, unload and gather. */
  function front(b) { const d = Village.dims(b); return { x: (b.x + d.w / 2) * T, y: (b.y + d.h + 0.6) * T }; }
  const hallDoor = () => ({ x: (M.hall.x + B.hall.w / 2 - 1) * T, y: (M.hall.y + B.hall.h + 0.8) * T });
  /** Where the i-th soldier stands when nobody ordered him anywhere: before the barracks, in rows. */
  function rally(i) {
    const b = barracks(), p = b ? front(b) : hallDoor();
    return { x: p.x + ((i % 5) - 2) * 11, y: p.y + 6 + Math.floor(i / 5) * 10 };
  }
  /** Citizens with no trade, the recruit at the barracks counted out. */
  function free() { const b = barracks(); return Village.freeCitizens() - (b && b.train ? 1 : 0); }
  /** What the barracks' level adds to every soldier. */
  function drill() { const b = barracks(); return (1 + ((b ? b.lvl : 1) - 1) * tune.soldier_level_step) * (1 + City.bonus('soldier')); } // THREAT hook: the city's bonus to soldiers (great works, legacy)
  const maxHp = u => Math.round(def(u).hp * drill());
  const reset = () => { stale = true; };
  const touch = () => { stale = true; };

  // ---- Training ----
  /** Why this kind cannot be trained now, in the player's words, or null when it can. */
  function blocked(kind) {
    const d = U[kind], miss = Quests.describe(d.unlock).filter(p => !p.ok);
    if (miss.length) return tr('need') + ' : ' + miss.map(p => p.text).join(', ');
    if (d.role === 'soldier') {
      const b = barracks();
      if (!b) return tr('need_barracks');
      if (b.damaged) return tr('damaged');
      if (b.train) return tr('train_busy');
    }
    if (free() < 1) return tr('no_citizen');
    if (!Village.canAfford(cost(kind))) return tr('no_funds');
    return null;
  }
  const cost = kind => Village.scaleCost(U[kind].cost, tune.cost_scale);
  function add(kind, x, y) {
    const u = { id: state.nextUnit++, kind, x, y, dx: 0, dy: 1 };
    if (isSoldier(u)) { u.hp = maxHp(u); const r = rally(soldiers().length); u.gx = r.x; u.gy = r.y; }
    state.units.push(u); stale = true;
    return u;
  }
  /** Trains one: a worker at once, at the hall's door; a soldier at the barracks, in his training time. */
  function train(kind) {
    const why = blocked(kind);
    if (why) { toast(why, UI.C.bad); sfx('error'); return false; }
    Village.pay(cost(kind));
    const d = U[kind];
    if (d.role === 'soldier') { barracks().train = { kind, left: d.time, total: d.time }; sfx('forge'); return true; }
    const p = hallDoor(); add(kind, p.x, p.y);
    sfx('place'); events.push({ type: 'unit', kind });
    return true;
  }
  /** Sends one of this kind back to the houses: a free citizen again. Nothing is paid back. */
  function dismiss(kind) {
    for (let i = state.units.length - 1; i >= 0; i--) if (state.units[i].kind === kind) {
      const id = state.units[i].id; state.units.splice(i, 1);
      if (ui.selU) ui.selU = ui.selU.filter(x => x !== id);
      sfx('click'); return true;
    }
    return false;
  }

  // ---- Workers ----
  const gives = (tx, ty) => { const id = Explore.seen(tx, ty) ? Village.floraAt(tx, ty) : null; return id ? DATA.flora[id].gives : null; }; // nobody gathers under the fog (js/explore.js)
  /** The trees or rocks giving `res` nearest to a tile, at most `want` of them, nearest first. */
  function nearestFlora(cx, cy, res, want) {
    const found = [], R = tune.worker_search;
    for (let r = 1; r <= R; r++) {
      for (let k = -r; k <= r; k++) for (const [x, y] of [[cx + k, cy - r], [cx + k, cy + r], [cx - r, cy + k], [cx + r, cy + k]]) {
        if (gives(x, y) === res) found.push({ tx: x, ty: y, d: Math.hypot(x - cx, y - cy) });
      }
      if (found.length >= want * 2) break;
    }
    found.sort((p, q) => p.d - q.d || p.tx - q.tx || p.ty - q.ty);
    const out = [];
    for (const f of found) if (!out.some(o => o.tx === f.tx && o.ty === f.ty)) { out.push(f); if (out.length >= want) break; }
    return out;
  }
  /** Finds a worker's spot and drop-off: the pair with the shortest walk between them. */
  function assign(u, nth) {
    const d = def(u);
    const drops = [hallDoor()].concat(state.buildings.filter(b => d.drop.includes(b.kind) && !b.damaged).map(front));
    let best = null;
    if (d.from === 'flora') {
      for (const p of drops) {
        const near = nearestFlora(Math.floor(p.x / T), Math.floor(p.y / T), d.gathers, 4);
        if (!near.length) continue;
        const f = near[nth % near.length], sx = f.tx * T + 8, sy = f.ty * T + 8, n = Math.hypot(p.x - sx, p.y - sy) || 1;
        const cand = { sx: sx + (p.x - sx) / n * 7, sy: sy + (p.y - sy) / n * 7, tx: f.tx, ty: f.ty, px: p.x, py: p.y, d: near[0].d * T };
        if (!best || cand.d < best.d) best = cand;
      }
    } else {
      for (const b of state.buildings) {
        if (b.kind !== d.from || b.damaged) continue;
        const s = front(b);
        for (const p of drops) { const dist = Math.hypot(p.x - s.x, p.y - s.y); if (!best || dist < best.d) best = { sx: s.x + ((nth % 3) - 1) * 9, sy: s.y, src: b.uid, px: p.x, py: p.y, d: dist }; }
      }
    }
    const had = u.sx;
    if (!best) { u.sx = null; u.st = 'idle'; u.rate = 0; return; }
    Object.assign(u, { sx: best.sx, sy: best.sy, tx: best.tx, ty: best.ty, src: best.src || 0, px: best.px, py: best.py });
    u.rate = d.carry / (d.work + 2 * Math.hypot(u.px - u.sx, u.py - u.sy) / d.speed);
    if (u.st == null || u.st === 'idle' || (u.st === 'work' && had !== u.sx)) u.st = 'go';
  }
  function ensure() {
    if (!stale) return;
    stale = false;
    const nth = {};
    for (const u of state.units) if (isWorker(u)) { nth[u.kind] = (nth[u.kind] || 0); assign(u, nth[u.kind]++); }
  }
  /** Whether a worker's spot still gives what he came for. */
  function spotOk(u) {
    const d = def(u);
    if (d.from === 'flora') return gives(u.tx, u.ty) === d.gathers;
    const b = Village.byUid(u.src); return !!b && !b.damaged;
  }
  /** A worker's output multiplier: the village's renown and the global knob, as for buildings. */
  const yieldMult = () => Village.renownMult() * tune.prod_scale;
  /** What the workers bring in each second, on average, by resource. */
  function rates() {
    ensure();
    const out = {};
    for (const u of state.units) if (isWorker(u) && u.sx != null && u.st !== 'flee') out[def(u).gathers] = (out[def(u).gathers] || 0) + u.rate * yieldMult();
    return out;
  }
  /** Time away: every worker's trips, at his average pace. */
  function away(secs) {
    ensure();
    for (const u of state.units) if (isWorker(u) && u.sx != null) Village.gain(def(u).gathers, u.rate * yieldMult() * secs);
  }

  // ---- Moving ----
  /** Walks toward a point; true once within `stop` pixels of it. */
  function walk(u, x, y, dt, stop) {
    const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy);
    if (d <= (stop || 0.6)) { u.moving = false; return true; }
    const v = Math.min(d - (stop || 0), def(u).speed * dt);
    u.x += dx / d * v; u.y += dy / d * v; u.dx = dx; u.dy = dy; u.moving = true;
    return false;
  }
  function raiderNear(x, y, r) {
    const a = state.raid.active; if (!a) return null;
    let best = null, bd = r;
    for (const e of a.raiders) { if (e.dead || e.wait > 0) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  function workerTick(u, dt) {
    const d = def(u), fear = tune.worker_fear * T, hd = hallDoor();
    if (u.sx == null) { walk(u, hd.x + ((u.id % 5) - 2) * 9, hd.y + 4 + (u.id % 2) * 8, dt); return; }
    if (u.st !== 'flee' && fear > 0 && raiderNear(u.x, u.y, fear)) { u.st = 'flee'; u.load = 0; }
    if (u.st === 'flee') {
      walk(u, hd.x + ((u.id % 5) - 2) * 9, hd.y + 4 + (u.id % 2) * 8, dt);
      if (!raiderNear(u.x, u.y, fear * 1.5) && !raiderNear(u.sx, u.sy, fear * 1.5)) u.st = 'go';
    } else if (u.st === 'go') {
      if (walk(u, u.sx, u.sy, dt)) { if (spotOk(u)) { u.st = 'work'; u.t = d.work; } else stale = true; }
    } else if (u.st === 'work') {
      u.t -= dt; u.moving = false;
      if (d.from === 'flora') { u.dx = u.tx * T + 8 - u.x; u.dy = u.ty * T + 8 - u.y; if (Math.floor(u.t * 2) !== Math.floor((u.t + dt) * 2)) Village.shakes.set(Village.idx(u.tx, u.ty), 0.2); }
      if (u.t <= 0) { if (spotOk(u)) { u.load = d.carry; u.st = 'back'; } else { stale = true; u.st = 'go'; } }
    } else { // back
      if (walk(u, u.px, u.py, dt)) {
        const n = (u.load || 0) * yieldMult();
        if (n > 0) { Village.gain(d.gathers, n); floatText(u.x, u.y, '+' + fmtNum(n), UI.C.text, 13, 18); }
        u.load = 0; u.st = 'go';
      }
    }
  }

  // ---- Soldiers ----
  /** Hurts a soldier. Struck down, he is carried to the barracks and rests there. */
  function hurt(u, dmg) {
    if (u.down > 0) return;
    u.hp -= dmg * tune.armor_factor / (tune.armor_factor + def(u).armor); u.flash = 0.1;
    if (u.hp > 0) return;
    u.hp = 0; u.down = tune.soldier_recover;
    floatText(u.x, u.y, tr('unit_down'), UI.C.bad, 15, 18); sfx('hurt');
    const r = rally(soldiers().indexOf(u)); u.x = r.x; u.y = r.y; u.moving = false;
    if (ui.selU) ui.selU = ui.selU.filter(x => x !== u.id);
  }
  /** The foot soldier barring a raider's way, or null: the nearest one within reach. */
  function blocker(e) {
    let best = null, bd = tune.raid_engage_range;
    for (const u of state.units) { if (!melee(u) || u.down > 0) continue; const d = Math.hypot(u.x - e.x, u.y - e.y); if (d < bd) { bd = d; best = u; } }
    return best;
  }
  function soldierTick(u, dt, i) {
    const d = def(u), a = state.raid.active;
    if (u.flash > 0) u.flash -= dt;
    if (u.down > 0) { u.down -= dt; if (u.down <= 0) { u.down = 0; u.hp = maxHp(u); const r = rally(i); u.gx = r.x; u.gy = r.y; } return; }
    u.cd = (u.cd || 0) - dt;
    // the raider nearest to him among those near the point he guards, or within his own reach
    let target = null, bd = Infinity;
    const R = tune.soldier_aggro * T;
    if (a) for (const e of a.raiders) {
      if (e.dead || e.wait > 0) continue;
      const de = Math.hypot(e.x - u.x, e.y - u.y);
      if ((Math.hypot(e.x - u.gx, e.y - u.gy) <= R || de <= d.range) && de < bd) { bd = de; target = e; }
    }
    let at = null; // else, sent to the goblin camp: its guards, then its palisade (js/camp.js)
    if (!target) { at = Camp.targetFor(u.x, u.y, u.gx, u.gy, d.range); if (at) bd = at.d; }
    if (!target && !at) {
      if (!a) u.hp = Math.min(maxHp(u), u.hp + maxHp(u) * 0.08 * dt); // no fight anywhere: wounds dressed
      walk(u, u.gx, u.gy, dt); if (!a && !u.moving) { u.dx = 0; u.dy = 1; } return;
    }
    const tx = target ? target.x : at.x, ty = target ? target.y : at.y;
    if (bd > d.range) { walk(u, tx, ty, dt, d.range * 0.85); return; }
    u.moving = false; u.dx = tx - u.x; u.dy = ty - u.y;
    if (u.cd <= 0) {
      u.cd = d.rate; u.swing = 0.18;
      if (target) Raid.hurt(target, d.atk * drill(), false); else Camp.hit(at, d.atk * drill());
      const p = target ? Raid.pos(target) : at;
      if (!melee(u)) { Raid.shots.push({ x0: u.x, y0: u.y, z0: 12, x1: p.x, y1: p.y, z1: 6, t: 0 }); sfx('arrow'); } else sfx('hit');
    }
  }

  function tick(dt) {
    ensure();
    const b = barracks();
    if (b && b.train && !b.damaged) { // the recruit at drill
      b.train.left -= dt * (1 + (b.lvl - 1) * 0.15);
      if (b.train.left <= 0) { const k = b.train.kind, p = front(b); b.train = null; add(k, p.x, p.y); toast(tr('unit_ready', { name: U[k].name }), UI.C.good); sfx('level'); events.push({ type: 'unit', kind: k }); }
    }
    let si = 0;
    for (const u of state.units) {
      if (u.swing > 0) u.swing -= dt;
      if (isSoldier(u)) soldierTick(u, dt, si++); else workerTick(u, dt);
    }
  }
  /** After a raid: everyone on his feet, wounds dressed. */
  function afterRaid() { for (const u of state.units) if (isSoldier(u)) { u.down = 0; u.hp = maxHp(u); } }

  // ---- The player's orders ----
  /** Sends these soldiers to guard a map point, in rows around it. */
  function order(ids, mx, my) {
    const list = ids.map(byId).filter(u => u && isSoldier(u) && !(u.down > 0));
    if (!list.length) return false;
    const cols = Math.ceil(Math.sqrt(list.length));
    list.forEach((u, i) => { u.gx = mx + ((i % cols) - (cols - 1) / 2) * 12; u.gy = my + (Math.floor(i / cols) - (Math.ceil(list.length / cols) - 1) / 2) * 12; });
    World.ping(mx, my); sfx('click');
    return true;
  }
  /** Everyone back before the barracks. */
  function recall() { soldiers().forEach((u, i) => { const r = rally(i); u.gx = r.x; u.gy = r.y; }); sfx('click'); }
  /** The soldier drawn under a map point (his feet within a few pixels of it), or null. */
  function pickAt(wx, wy) {
    const p = World.iso(wx, wy);
    let best = null, bd = 12;
    for (const u of state.units) {
      if (!isSoldier(u) || u.down > 0) continue;
      const q = World.iso(u.x, u.y), d = Math.hypot(q.x - p.x, (q.y - 9 - p.y) * 0.8);
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  }

  return { tick, rates, away, reset, touch, add, train, dismiss, blocked, cost, count, soldiers, byId, free, drill, maxHp, isSoldier, isWorker, melee, hurt, blocker, afterRaid, order, recall, pickAt, rally, barracks };
})();
