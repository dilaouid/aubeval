// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The hero: his sheet, his gear (forged by the village), his levels and his idle missions.
// Which hero the player chose, among DATA.heroes: Hero.art(kind, id) picks his or her sprite (the old one while an image
// is missing), Hero.nameFor(current, id) the name the naming field shows after a change of hero.
'use strict';

const Hero = (() => {
  const I = DATA.items;

  /** The forge's level (0 with none). A raid's damage does not lower it: the Trempe is in the gear already forged. */
  function forgeLevel() { return state.buildings.reduce((n, b) => (b.kind === 'forge' ? Math.max(n, b.lvl || 1) : n), 0); }
  /** What one +N is worth, as a share of a piece's stats: the Trempe adds to it once the forge reaches its first milestone. */
  function plusBonus() { return tune.plus_bonus + (forgeLevel() >= tune.milestone_levels ? tune.forge_temper_bonus : 0); }
  /** What a forged piece adds, with its +N reinforcements. */
  function itemStats(id) {
    const it = I[id], m = 1 + (state.hero.plus[id] || 0) * plusBonus();
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

  /**
   * A name as typed, made ready to keep: spaces trimmed and single, the straight apostrophe made
   * typographic, the case as the player typed it (« d’Artagnan » stays so). Returns { name } when it can be kept, else { name, why }
   * (a key of data/strings.js). A name is letters (accents welcome), with single spaces, hyphens or
   * apostrophes between them, from DATA.hero.nameMin to nameMax characters.
   */
  function cleanName(raw) {
    let name = String(raw || '').replace(/\s+/g, ' ').trim().replace(/'/g, '’');
    const len = [...name].length;
    if (len < DATA.hero.nameMin) return { name, why: len ? 'name_short' : 'name_empty' };
    if (len > DATA.hero.nameMax) return { name, why: 'name_long' };
    if (!/^[\p{L}\p{M}]+(?:[ ’-][\p{L}\p{M}]+)*$/u.test(name)) return { name, why: /[^\p{L}\p{M} ’-]/u.test(name) ? 'name_chars' : 'name_marks' };
    return { name };
  }
  /**
   * A name as it is typed: only what a name may hold (letters, spaces, hyphens, apostrophes), no
   * space at the start or twice in a row, and no more than DATA.hero.nameMax characters, so the
   * limit counts what will be kept, not stray spaces.
   */
  const nameChars = raw => [...String(raw || '').replace(/[^\p{L}\p{M}\s'’-]/gu, '').replace(/\s+/g, ' ').replace(/^ /, '')].slice(0, DATA.hero.nameMax).join('');

  // ---- Which hero ----
  const ART = { portrait: ['portrait.hero.', null], battle: ['hero.battle.', 'hero.battle'], unit: ['iso.unit.hero.', 'iso.unit.hero'] };
  /** The sprite id to draw for hero `id` (the chosen one by default): his or hers if the image is there, else Aldric's, else the old one (null for a portrait). */
  function art(kind, id) {
    const [pre, old] = ART[kind];
    for (const k of [id || heroLook().id, 'aldric']) if (Art.loaded(pre + k)) return pre + k;
    return old;
  }
  /** The name the field shows once it goes to hero `id`: his or hers if the field is empty or holds a hero's proposed name, else what the player typed. */
  function nameFor(current, id) {
    const c = String(current || '').trim();
    if (c && !DATA.heroes.some(h => h.name === c)) return current;
    return (DATA.heroes.find(h => h.id === id) || DATA.heroes[0]).name; // an id nobody knows is the first hero, as in heroLook
  }

  return { art, nameFor, forgeLevel, plusBonus, itemStats, stats, xpNeed, addXp, has, weaponTier, equip, craftCost, startCraft, finishCraft, away, startMission, tick, cleanName, nameChars };
})();
