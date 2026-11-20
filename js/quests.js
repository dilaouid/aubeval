// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Conditions (shared by unlocks, requirements and goals), the quests and their rewards.
// The quests themselves are data: data/quests.js.
'use strict';

const Quests = (() => {
  const mains = []; // every main quest, chapter after chapter, in order
  for (const ch of DATA.chapters) for (const q of ch.quests) { q.chapter = ch; mains.push(q); }
  const all = () => mains.concat(DATA.sideQuests, DATA.contracts);
  const find = id => all().find(q => q.id === id);

  /** Each part of a condition, with whether it holds and how to say it. One vocabulary for the whole game. */
  function describe(c) {
    const out = [];
    if (!c) return out;
    if (c.pop != null) { const p = Village.pop(); out.push({ ok: p >= c.pop, text: `${c.pop} habitants (${p})`, short: `${c.pop} habitants` }); }
    if (c.built) for (const k in c.built) { const n = Village.count(k); out.push({ ok: n >= c.built[k], text: `${DATA.buildings[k].name} (${n}/${c.built[k]})`, short: 'après ' + DATA.buildings[k].card }); }
    if (c.cls) for (const k in c.cls) { const i = DATA.classes.findIndex(x => x.id === k), n = Village.classCount(i), nm = DATA.classes[i].name; out.push({ ok: n >= c.cls[k], text: `Maison de classe ${nm} (${n}/${c.cls[k]})`, short: nm }); }
    if (c.quest) { const q = find(c.quest); out.push({ ok: !!state.quests.done[c.quest], text: `Quête « ${q ? q.title : c.quest} »`, short: 'Quête' }); }
    if (c.raidsWon != null) out.push({ ok: state.counters.raidsWon >= c.raidsWon, text: `Raids repoussés (${state.counters.raidsWon}/${c.raidsWon})`, short: 'Raid' });
    if (c.heroLvl != null) out.push({ ok: state.hero.lvl >= c.heroLvl, text: `Héros niveau ${c.heroLvl}`, short: `Niveau ${c.heroLvl}` });
    if (c.equip) out.push({ ok: !!state.hero.equip[c.equip], text: c.equip === 'weapon' ? 'Une arme équipée' : 'Une armure équipée', short: 'Équipement' });
    if (c.weaponTier != null) out.push({ ok: Hero.weaponTier() >= c.weaponTier, text: `Arme de palier ${c.weaponTier}`, short: `Palier ${c.weaponTier}` });
    if (c.totals) for (const r in c.totals) { const n = Math.floor(state.totals[r]); out.push({ ok: n >= c.totals[r], text: `${DATA.resources[r].name} récolté (${Math.min(n, c.totals[r])}/${c.totals[r]})`, short: DATA.resources[r].name }); }
    for (const p of City.describe(c)) out.push(p); // { rank }, { popularity }
    if (c.res) for (const r in c.res) { const n = Math.floor(state.res[r]); out.push({ ok: n >= c.res[r], text: `${DATA.resources[r].name} en réserve (${Math.min(n, c.res[r])}/${c.res[r]})`, short: DATA.resources[r].name }); }
    return out;
  }
  const met = c => describe(c).every(p => p.ok);

  /** The main quest to do now, or null when every chapter is finished. */
  const current = () => mains.find(q => !state.quests.done[q.id]) || null;
  const tierOf = q => state.quests.tiers[q.id] || 0;
  /** A contract's pay and enemies grow with each win. */
  const scaleOf = q => 1 + tierOf(q) * tune.contract_scale;
  function rewardOf(q) {
    const r = q.reward || {}, k = DATA.contracts.includes(q) ? scaleOf(q) : 1;
    const out = { xp: Math.round((r.xp || 0) * k), gold: Math.round((r.gold || 0) * k), res: {} };
    for (const x in r.res || {}) out.res[x] = r.res[x];
    return out;
  }
  /** Gives a reward. Returns its lines, for a toast or the victory tally. The XP takes the city's share on top (City.bonus('xp'): the legacy tree). */
  function grant(r) {
    const lines = [];
    if (r.xp) { const xp = Math.round(r.xp * (1 + City.bonus('xp'))), ups = Hero.addXp(xp); lines.push(`+${xp} XP`); if (ups) { lines.push(tr('level_up', { n: state.hero.lvl })); sfx('level'); } }
    if (r.gold) { Village.gain('gold', r.gold); lines.push(`+${r.gold} or`); }
    for (const x in r.res || {}) { Village.gain(x, r.res[x]); lines.push(`+${r.res[x]} ${DATA.resources[x].name.toLowerCase()}`); }
    return lines;
  }
  /** The building cards a quest opens (they name it in their `unlock`). */
  const unlocksOf = q => DATA.buildOrder.filter(k => (DATA.buildings[k].unlock || {}).quest === q.id).map(k => DATA.buildings[k].name);

  /** Marks a quest done and applies what it starts. `silent` when the battle tally already showed the reward. */
  function complete(q, silent) {
    if (DATA.contracts.includes(q)) { state.quests.tiers[q.id] = tierOf(q) + 1; return; }
    if (state.quests.done[q.id]) return;
    state.quests.done[q.id] = true;
    const lines = silent ? [] : grant(rewardOf(q));
    const hush = Tuto.running() && q.type === 'objective'; // the tutorial's guide cheers these herself: one voice at a time
    if (!hush) toast(tr('quest_done', { title: q.title }) + (lines.length ? ' · ' + lines.join(', ') : ''), UI.C.gold);
    if (!silent && !hush) sfx('fanfare');
    if (q.startRaids && state.raid.timer == null && !state.raid.active) { // a horn far off: the first raid is on its way
      state.raid.timer = tune.raid_first_delay;
      toast(tr('raid_first', { time: fmtTime(tune.raid_first_delay) }), UI.C.accent); sfx('horn');
    }
    Village.refreshUnlocks();
    state.gained = q.title;
    const ch = q.chapter;
    if (ch && ch.quests[ch.quests.length - 1] === q && ch.id !== 'ch0') ui.banner = { title: tr('chapter_done'), sub: ch.title, text: tr('chapter_done_text') };
    events.push({ type: 'quest', id: q.id }); City.event('quest', { id: q.id });
    Save.persist();
  }
  /** Objectives finish by themselves the moment their goal holds. */
  function tick() {
    const q = current();
    if (q && q.type === 'objective' && met(q.goal)) complete(q);
  }
  /** Why a quest cannot start now, or null when it can. */
  function blocked(q) {
    if (Hero.away()) return tr('hero_away');
    if (state.raid.active) return tr('raid_on');
    const miss = describe(q.requires).filter(p => !p.ok);
    return miss.length ? tr('need') + ' : ' + miss.map(p => p.text).join(', ') : null;
  }
  function startBattle(q) {
    if (blocked(q)) return;
    Battle.start(q.encounter, { title: q.title, boss: !!q.boss, scale: DATA.contracts.includes(q) ? scaleOf(q) : 1, reward: rewardOf(q), hint: q.hint, onWin: () => complete(q, true) });
  }
  function deliver(q) {
    if (!met(q.goal) || !Village.pay(q.goal.res)) { toast(tr('no_funds'), UI.C.bad); return; }
    complete(q);
  }

  return { mains, describe, met, current, tierOf, scaleOf, rewardOf, grant, unlocksOf, complete, tick, blocked, startBattle, deliver };
})();
