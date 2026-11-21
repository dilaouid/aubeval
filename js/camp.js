// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The goblin camp under attack. The player sends soldiers to it (a right click on it, or the hall's
// "Attaquer le camp"); its garrison comes out at any soldier within `camp_alert` tiles, and once the
// garrison is down the soldiers break its palisade. The hero, when he is at the village, joins any
// assault his soldiers have started. Left alone for `camp_regroup` seconds, the camp is whole again.
// When the palisade falls: its loot, a respite with no raid (`camp_respite` seconds, its ruin on the
// map), then a new camp rises farther out (Village.raiseCamp) with a bigger, tougher garrison. The
// game never ends: there is always a next camp. Every camp after the first has a chief of its own
// (data/enemies.js `warlord`, his name in DATA.camp.chiefs): a guard of kind 'warlord' at its gate,
// tougher with the camp's level, whose head makes the fallen camp pay more. Razing a camp is told to
// the city (City.event('camp')) and adds to the hero's popularity.
//
// Everything saved is in state.raid.camp (plain data):
//   x, y    its top-left tile          lvl     how many camps fell before it
//   hp, max its palisade               guards  [{ id, kind, hp, max, x, y, px, py }] (px, py: his post)
//   down    seconds left before the next camp rises, once it has fallen; absent while it stands
//   quiet   seconds since a soldier was last near it
'use strict';

const Camp = (() => {
  const E = DATA.enemies, M = DATA.map, T = M.tile;
  const REACH = 14; // pixels within which a guard strikes a soldier

  const camp = () => state.raid.camp;
  /** Whether a camp stands (raids come from it); false while its ruin waits for the next one. */
  const standing = () => { const c = camp(); return !!c && !(c.down > 0); };
  const growth = c => 1 + tune.camp_growth * (c.lvl || 0);
  /** The name of the chief of a camp of this level, or null: the first camp has none. */
  const chiefName = lvl => lvl > 0 ? DATA.camp.chiefs[(lvl - 1) % DATA.camp.chiefs.length] : null;
  /** The gold more a camp of this level leaves for its chief's head. */
  const chiefGold = lvl => lvl > 0 ? Math.round(tune.camp_chief_gold * lvl) : 0;
  /** Who guards a camp of this level: the first garrison, plus DATA.camp.each for every camp fallen before it, and its chief last. */
  function roster(lvl) { let out = DATA.camp.guards.slice(); for (let i = 0; i < lvl; i++) out = out.concat(DATA.camp.each); if (lvl > 0) out.push('warlord'); return out; }
  /** The garrison at full strength, each at his post in a ring around the camp. */
  function muster(c) {
    const mid = Village.campMid(), hall = Village.hallMid(), list = roster(c.lvl || 0), R = (Village.CAMP / 2 + 0.8) * T;
    c.guards = list.map((kind, i) => {
      const chief = kind === 'warlord'; // he stands before the gate, on the hall's side
      const a = chief ? Math.atan2(hall.y - mid.y, hall.x - mid.x) : i / list.length * 6.2832 + 0.4, r = chief ? R + T : R;
      const hp = Math.round(E[kind].raid.hp * growth(c) * (chief ? tune.camp_chief_hp : 1.5));
      const px = mid.x + Math.cos(a) * r, py = mid.y + Math.sin(a) * r;
      return { id: i, kind, hp, max: hp, x: px, y: py, px, py, dx: 0, dy: 1 };
    });
    c.max = Math.round(tune.camp_hp * growth(c)); c.hp = c.max; c.quiet = 0;
  }
  /** Fills a camp that has no garrison yet: a new game, or a save from before camps could fall. */
  function ensure() {
    const c = camp();
    if (!c) return;
    if (c.lvl == null) c.lvl = 0;
    if (!(c.down > 0) && (c.hp == null || !Array.isArray(c.guards))) muster(c);
  }

  /** The soldiers on their feet within the camp's alert zone. */
  function attackers() {
    if (!standing()) return [];
    ensure();
    const mid = Village.campMid(), R = tune.camp_alert * T;
    return Units.soldiers().filter(u => !(u.down > 0) && Math.hypot(u.x - mid.x, u.y - mid.y) <= R);
  }
  /** Whether soldiers are at the camp now: the hero joins them. */
  const assaulted = () => attackers().length > 0;

  /** The camp's nearest point to (x, y), in map pixels: where a blow at its palisade lands. */
  function edge(x, y) {
    const c = camp(), x0 = c.x * T, y0 = c.y * T, n = Village.CAMP * T;
    return { x: clamp(x, x0, x0 + n), y: clamp(y, y0, y0 + n) };
  }
  /**
   * What a fighter at (x, y), guarding (gx, gy), goes for at the camp, or null: the nearest guard
   * near his post or within his reach, else the palisade itself once its garrison is down and his
   * post is within the alert zone. Returns { x, y, d, guard } or { x, y, d, camp: true }.
   */
  function targetFor(x, y, gx, gy, range) {
    if (!standing()) return null;
    ensure(); // a save from before camps could fall: its garrison, before any soldier looks for it
    const c = camp(), mid = Village.campMid(), R = tune.camp_alert * T;
    if (Math.hypot(gx - mid.x, gy - mid.y) > R + tune.soldier_aggro * T) return null;
    let best = null, bd = Infinity;
    for (const g of c.guards) {
      const d = Math.hypot(g.x - x, g.y - y);
      if ((Math.hypot(g.x - gx, g.y - gy) <= tune.soldier_aggro * T || d <= range) && d < bd) { bd = d; best = g; }
    }
    if (best) return { x: best.x, y: best.y, d: bd, guard: best };
    if (c.guards.length || Math.hypot(gx - mid.x, gy - mid.y) > R) return null;
    const p = edge(x, y);
    return { x: p.x, y: p.y, d: Math.hypot(p.x - x, p.y - y), camp: true };
  }
  /** A blow at the camp: at a guard, or at its palisade. */
  function hit(t, dmg) {
    const c = camp();
    if (!standing()) return;
    c.quiet = 0;
    if (t.guard) {
      const g = t.guard; if (g.hp <= 0) return;
      const s = E[g.kind].raid;
      g.hp -= Math.max(1, Math.round(dmg - s.armor)); g.flash = 0.12;
      if (g.hp <= 0) {
        c.guards = c.guards.filter(o => o !== g);
        Village.gain('gold', s.gold); floatText(g.x, g.y, '+' + s.gold, UI.C.gold, 16, 14); sfx('coin');
      }
      return;
    }
    c.hp -= dmg;
    if (Math.floor(c.hp / 40) !== Math.floor((c.hp + dmg) / 40)) { const p = edge(t.x, t.y); World.dustAt(Math.floor(p.x / T), Math.floor(p.y / T)); sfx('chop'); }
    if (c.hp <= 0) fall();
  }
  /** The palisade is down: the loot, the ruin, the respite. */
  function fall() {
    const c = camp(), k = (c.lvl || 0) + 1, mid = Village.campMid(), r = state.raid;
    c.hp = 0; c.guards = []; c.down = tune.camp_respite;
    const gold = Math.round(tune.camp_loot_gold * k) + chiefGold(c.lvl || 0); // its loot, and its chief's head
    Village.gain('gold', gold);
    for (const res in DATA.camp.loot) Village.gain(res, DATA.camp.loot[res] * k);
    state.counters.campsDown = (state.counters.campsDown || 0) + 1;
    if (r.warned && !r.active) { r.warned = false; r.from = null; r.siege = null; } // the horn had sounded: that raid (or siege) will never leave
    World.blast(mid.x, mid.y, Village.CAMP * T); floatText(mid.x, mid.y, '+' + gold, UI.C.gold, 22, 30);
    state.gained = tr('camp_fall', { gold, time: fmtTime(tune.camp_respite) }) + (tune.camp_raid_credit > 0 ? tr('camp_fall_credit', { k: tune.camp_raid_credit }) : ''); toast(state.gained, UI.C.good); sfx('fanfare');
    City.event('camp'); City.gainPop(tune.camp_pop, tr('pop_camp')); // the city's orders and the hero's popularity
    Raid.touch(); Save.persist();
  }
  /** The respite is over: a new camp, farther out and stronger, and the raids' clock starts again. */
  function rise() {
    const lvl = (camp().lvl || 0) + 1, r = state.raid;
    Village.raiseCamp(lvl);
    muster(camp());
    if (r.timer != null) r.timer = Math.max(r.timer, tune.raid_interval);
    const chief = chiefName(lvl);
    toast(chief ? tr('camp_new_chief', { dir: Raid.compass(Village.campMid()), name: chief }) : tr('camp_new', { dir: Raid.compass(Village.campMid()) }), UI.C.bad); sfx('horn');
    Save.persist();
  }

  /**
   * The player cuts the respite short: the next camp rises now and its first raid leaves at once,
   * as a raid called early (its bonus). Not before the raids have begun, nor during one. Returns
   * whether it happened.
   */
  function provoke() {
    const c = camp(), r = state.raid;
    if (!c || !(c.down > 0) || r.active || r.timer == null) return false;
    c.down = 0; rise(); Raid.start(true);
    return true;
  }

  function tick(dt) {
    const c = camp();
    if (!c) return;
    if (c.down > 0) { c.down -= dt; if (c.down <= 0) rise(); return; }
    ensure();
    const foes = attackers();
    c.quiet = foes.length ? 0 : (c.quiet || 0) + dt;
    if (c.quiet >= tune.camp_regroup && (c.hp < c.max || c.guards.length < roster(c.lvl).length)) muster(c); // left alone: whole again
    const R = tune.camp_alert * T;
    for (const g of c.guards) {
      const s = E[g.kind].raid;
      if (g.flash > 0) g.flash -= dt;
      g.hitting = false;
      let foe = null, bd = Infinity;
      for (const u of foes) { const d = Math.hypot(u.x - g.x, u.y - g.y); if (d < bd) { bd = d; foe = u; } }
      const gx = foe ? foe.x : g.px, gy = foe ? foe.y : g.py, dx = gx - g.x, dy = gy - g.y, d = Math.hypot(dx, dy);
      if (foe && d <= REACH) { g.hitting = true; g.dx = dx; g.dy = dy; Units.hurt(foe, (s.unitDps || 1) * (g.kind === 'warlord' ? growth(c) : 1) * dt); } // the chief's blows grow with his camp
      else if (d > 0.6) {
        const v = Math.min(d - (foe ? REACH * 0.8 : 0), s.speed * dt);
        if (v > 0) { g.x += dx / d * v; g.y += dy / d * v; g.dx = dx; g.dy = dy; }
        if (Math.hypot(g.x - g.px, g.y - g.py) > R * 1.5) { g.x = g.px; g.y = g.py; } // never lured off far from the camp
      } else { g.dx = 0; g.dy = 1; }
      if (!foe) g.hp = Math.min(g.max, g.hp + g.max * 0.05 * dt);
      if (s.heal) for (const o of c.guards) if (o !== g && Math.hypot(o.x - g.x, o.y - g.y) < s.aura) o.hp = Math.min(o.max, o.hp + s.heal * dt);
    }
  }
  /** ?demo=1&camp=N (js/raid.js demo), for screenshots: the camp that stands is the one risen after `lvl` others fell. */
  function demo(lvl) { Village.raiseCamp(lvl); muster(camp()); }
  /** Time away: the respite runs on, but no camp falls or rises a garrison while nobody plays. */
  function away(secs) { const c = camp(); if (c && c.down > 0) c.down = Math.max(1, c.down - secs); }
  /** Where to send soldiers to attack it: before its gate, on the hall's side. */
  function gate() {
    const mid = Village.campMid(), h = Village.hallMid(), d = Math.hypot(h.x - mid.x, h.y - mid.y) || 1, r = (Village.CAMP / 2 + 1.5) * T;
    return { x: mid.x + (h.x - mid.x) / d * r, y: mid.y + (h.y - mid.y) / d * r };
  }
  /** Sends every soldier on his feet to attack it. Returns how many went. */
  function attack() {
    if (!standing()) return 0;
    const ids = Units.soldiers().filter(u => !(u.down > 0)).map(u => u.id), p = gate();
    if (!ids.length || !Units.order(ids, p.x, p.y)) return 0;
    toast(tr('camp_sent', { n: ids.length }), UI.C.accent);
    return ids.length;
  }
  /** The hall tab's line about the chief of the camp that stands: who he is and what his head adds, or that he is down; null when this camp has none. */
  function chiefLine() {
    const c = camp(), lvl = c ? c.lvl || 0 : 0, name = c && standing() ? chiefName(lvl) : null;
    if (!name) return null;
    const g = (c.guards || []).find(o => o.kind === 'warlord');
    return g ? tr('camp_chief', { name, hp: fmtNum(Math.max(0, g.hp)), max: fmtNum(g.max), gold: fmt(chiefGold(lvl)) }) : tr('camp_chief_down', { name });
  }
  /** Whether a map point lies on the camp (its tiles and a tile around). */
  function covers(wx, wy) {
    const c = camp(); if (!c) return false;
    const tx = wx / T, ty = wy / T;
    return tx >= c.x - 1 && ty >= c.y - 1 && tx <= c.x + Village.CAMP + 1 && ty <= c.y + Village.CAMP + 1;
  }

  return { tick, ensure, standing, assaulted, attackers, targetFor, hit, away, attack, gate, covers, roster, chiefName, chiefLine, demo, provoke };
})();
