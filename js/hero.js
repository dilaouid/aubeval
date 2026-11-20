// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The hero: his sheet, his gear (forged by the village), his levels and his idle missions.
'use strict';

const Hero = (() => {
  const I = DATA.items;

  /** What a forged piece adds, with its +N reinforcements. */
  function itemStats(id) {
    const it = I[id], m = 1 + (state.hero.plus[id] || 0) * tune.plus_bonus;
    return { atk: (it.atk || 0) * m, def: (it.def || 0) * m, hp: (it.hp || 0) * m };
  }
  /** The hero's numbers right now: base, levels, gear. */
  function stats() {
    const h = state.hero, L = h.lvl - 1, base = DATA.hero;
    let hp = base.hp + L * tune.hero_hp_per_level, atk = base.atk + L * tune.hero_atk_per_level, def = base.def + L * tune.hero_def_per_level;
    for (const slot in h.equip) { const id = h.equip[slot]; if (id) { const s = itemStats(id); hp += s.hp; atk += s.atk; def += s.def; } }
    return { hp: Math.round(hp), atk: atk * (1 + Venue.buff('atk')), def, spd: base.spd }; // the forge's gift after its mini-game (js/venue.js)
  }
  const xpNeed = lvl => Math.round(tune.xp_base * Math.pow(tune.xp_growth, lvl - 1));
  /** Adds experience. Returns how many levels were gained. */
  function addXp(n) {
    const h = state.hero; let ups = 0;
    h.xp += n;
    while (h.xp >= xpNeed(h.lvl)) { h.xp -= xpNeed(h.lvl); h.lvl++; ups++; }
    return ups;
  }
  const has = id => state.hero.inv.includes(id);
  const weaponTier = () => { const id = state.hero.equip.weapon; return id ? I[id].tier : 0; };
  function equip(id) { state.hero.equip[I[id].slot] = id; sfx('forge'); }

  // ---- The forge ----
  /** The price of forging a piece, or of its next +1 once it is owned. */
  function craftCost(id) {
    const c = I[id].recipe.cost, o = {};
    const k = has(id) ? 0.5 * Math.pow(tune.plus_cost_growth, state.hero.plus[id] || 0) : 1;
    for (const r in c) o[r] = Math.max(1, Math.ceil(c[r] * k));
    return o;
  }
  function startCraft(forge, id) {
    if (forge.craft || forge.damaged) return false;
    if (!Village.pay(craftCost(id))) { toast(tr('no_funds'), UI.C.bad); return false; }
    const time = I[id].recipe.time * (has(id) ? 0.6 : 1);
    forge.craft = { item: id, left: time, total: time };
    sfx('forge'); return true;
  }
  function finishCraft(c) {
    const h = state.hero, it = I[c.item];
    if (has(c.item)) { h.plus[c.item] = (h.plus[c.item] || 0) + 1; toast(it.name + ' +' + h.plus[c.item], UI.C.gold); }
    else {
      h.inv.push(c.item);
      toast(tr('forged', { name: it.name }), UI.C.gold);
    }
    sfx('level');
  }

  // ---- Idle missions: he leaves, time passes (even with the game closed), he comes back loaded ----
  const away = () => !!state.mission || Explore.onTrip(); // on a mission, or on an expedition to a place found in the wild (js/explore.js)
  function startMission(m) {
    if (away() || !Quests.met(m.requires)) return false;
    if (!Village.pay(m.cost)) { toast(tr('no_funds'), UI.C.bad); return false; }
    state.mission = { id: m.id, left: m.time, total: m.time };
    sfx('click'); return true;
  }
  function tick(dt) {
    const ms = state.mission; if (!ms) return;
    ms.left -= dt;
    if (ms.left > 0) return;
    const m = DATA.missions.find(x => x.id === ms.id);
    state.mission = null;
    if (!m) return;
    const got = { xp: m.reward.xp || 0, gold: m.reward.gold || 0, res: {} };
    for (const d of m.drops || []) if (rng() < d.chance) got.res[d.res] = (got.res[d.res] || 0) + d.n;
    const lines = Quests.grant(got);
    toast(tr('mission_back', { title: m.title }) + ' ' + lines.join(', '), UI.C.good); sfx('coin');
  }

  return { itemStats, stats, xpNeed, addXp, has, weaponTier, equip, craftCost, startCraft, finishCraft, away, startMission, tick };
})();
