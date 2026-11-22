// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Whether Aveline's teaching (data/tutorial.js) still covers the whole game. It reads only DATA (and
// config.js for the numbers a line quotes), so it runs in the game (index.html warns in the console
// at start) and in Node (`node tools/check-tutorial.js`). It reports observations, never a verdict:
//   missing   what the game has that no lesson covers. Read from the data, so a thing added to the
//             game is asked for here without anyone listing it: every building, build bar tab, land
//             tool, tree to plant, trap, unit, class, resource, top bar panel, building panel tab and
//             quest book tab; every tab of the Cité panel, city rank, kind of order, tax level and
//             branch of the legacy tree (data/city.js); every place entered and its game
//             (data/venues.js); every kind of place found in the wild (data/explore.js); every
//             warlord (data/enemies.js); and every mechanic listed in DATA.tutorial.mechanics
//   unknown   a `covers` id the game no longer has
//   broken    a step, a page or a condition that names something the game no longer has: a place an
//             arrow points at, a card, a tab, a lesson, a word left open ({lord}, {hero}, {t:<config key>})
'use strict';

const TutoCheck = (() => {
  /** Everything a player can meet, as { id, what }. */
  function features(D) {
    const out = [], add = (id, what) => out.push({ id, what }), S = D.strings;
    for (const k in D.buildings) add('b:' + k, D.buildings[k].name);
    for (const t of D.buildTabs) add('tab:' + t.id, 'onglet ' + t.name);
    for (const k in D.tools) add('tool:' + k, D.tools[k].name);
    if (Object.keys(D.flora).some(k => D.flora[k].plant)) add('plant', 'planter un arbre');
    for (const k in D.traps) add('trap:' + k, D.traps[k].name);
    for (const k in D.units) add('unit:' + k, D.units[k].name);
    for (const c of D.classes) add('class:' + c.id, c.name);
    for (const r in D.resources) add('res:' + r, D.resources[r].name);
    const kinds = { btn: 'panel', tb: 'btab', tab: 'qtab' };
    for (const k in S) {
      let m = /^(btn|tb|tab)_([a-z]+)$/.exec(k); if (m) add(kinds[m[1]] + ':' + m[2], S[k]);
      m = /^city_t_([a-z]+)$/.exec(k); if (m) add('ctab:' + m[1], 'Cité, onglet ' + S[k]);                 // the Cité panel's tabs
      m = /^city_tax_fx_([a-z]+)$/.exec(k); if (m) add('tax:' + m[1], 'impôt ' + S['city_tax_' + m[1]]);   // a tax level: it has a line that says what it does
    }
    const C = D.city || {};
    (C.ranks || []).forEach((r, i) => { if (i) add('rank:' + i, 'rang ' + r.name); });                       // the first rank is where a village starts
    for (const kind of new Set((C.orders || []).map(o => o.kind))) add('order:' + kind, 'commande « ' + C.orders.find(o => o.kind === kind).title + ' »');
    for (const br of new Set((D.legacy || []).map(n => n.branch))) add('legacy:' + br, 'héritage, branche ' + D.legacyBranches[br]);
    for (const k in D.venues || {}) { add('venue:' + k, D.venues[k].name); add('game:' + k, 'jeu « ' + D.venues[k].title + ' »'); }
    for (const k in (D.explore || {}).kinds || {}) add('site:' + k, 'lieu : ' + D.explore.kinds[k].name);
    for (const w of D.warlords || []) add('lord:' + w.id, 'chef de guerre ' + w.name + ' ' + w.title);
    for (const k in D.tutorial.mechanics) add('do:' + k, D.tutorial.mechanics[k]);
    return out;
  }
  /** The start and the lessons, as courses. */
  const courses = D => [{ id: 'start', covers: D.tutorial.covers, steps: D.tutorial.steps }].concat(D.tutorial.lessons);

  function run(D) {
    const feats = features(D), known = new Set(feats.map(f => f.id)), cs = courses(D);
    const covered = new Set(cs.flatMap(c => c.covers || []));
    const missing = feats.filter(f => !covered.has(f.id));
    const unknown = [...covered].filter(id => !known.has(id));
    const broken = [];
    const S = D.strings, quests = D.chapters.flatMap(c => c.quests).concat(D.sideQuests, D.contracts);
    const CFG = typeof CONFIG !== 'undefined' ? CONFIG : null; // config.js, when it is loaded: the numbers a line quotes
    const isCard = c => D.buildTabs.some(t => t.items.includes(c));
    // Places named where they are drawn, that no data id stands behind (js/screens.js, js/city.js, js/explore.js, js/raid.js, js/venue.js).
    const PLAIN = ['view', 'hud:quest', 'hud:raid', 'hud:city', 'raise', 'style', 'camp:attack', 'camp:chief', 'import', 'trade', 'deck',
      'menu:export', 'menu:prestige', 'menu:lessons', 'act:upgrade', 'act:rampart', 'act:move', 'act:demolish',
      'city:pop', 'city:proclaim', 'city:order', 'city:refuse', 'city:tax', 'city:work', 'city:found', 'city:newstart', 'city:legacy',
      'venue:enter', 'venue:play', 'venue:talk', 'venue:leave', 'venue:go', 'venue:back', 'venue:continue',
      'explore:known', 'explore:rose', 'explore:row', 'explore:see', 'explore:go', 'explore:act', 'explore:back', 'explore:trip', 'explore:recall',
      'siege:lord', 'siege:duel'];
    const GAINS = ['cleared', 'planted', 'traps', 'orders', 'rank', 'scouts', 'legacy']; // the counts a `gain` goal may watch, beside b:, lvl:, u:, drill:
    const STUCK = ['order', 'proclaim', 'legacy', 'scout', 'go'];                        // what `unless: { stuck }` knows, beside work:<monument>
    /** Whether a place an arrow points at still exists. */
    function place(p) {
      if (PLAIN.includes(p)) return true;
      if (p.startsWith('city:tax:')) return !!S['city_tax_fx_' + p.slice(9)];
      if (p.startsWith('explore:scout:')) return /^\d+$/.test(p.slice(14)) && Number(p.slice(14)) < (S.dirs || []).length;
      const i = p.indexOf(':'), k = p.slice(0, i), a = p.slice(i + 1);
      if (k === 'res') return !!D.resources[a];
      if (k === 'btn') return !!S['btn_' + a];
      if (k === 'bar') return D.buildTabs.some(t => t.id === a);
      if (k === 'card') return isCard(a);
      if (k === 'forge' || k === 'equip') return !!D.items[a];
      if (k === 'fight') return quests.some(q => q.id === a);
      if (k === 'btab') return !!S['tb_' + a];
      if (k === 'qtab') return !!S['tab_' + a];
      if (k === 'ctab') return !!S['city_t_' + a];
      if (k === 'train') return !!D.units[a];
      if (k === 'mission') return D.missions.some(m => m.id === a);
      return false;
    }
    function point(e) {
      const i = e.indexOf(':'), k = i < 0 ? e : e.slice(0, i), a = i < 0 ? '' : e.slice(i + 1);
      if (['drag', 'chop', 'free', 'pave'].includes(k)) return true;
      if (k === 'venue') return Object.keys(D.venues || {}).length > 0;
      if (k === 'key') return /^(Key[A-Z]|Digit\d|Space|Enter|Escape)$/.test(a);
      if (k === 'build') return !!D.buildings[a] && isCard(a);
      if (k === 'pick') return isCard(a);
      if (k === 'building') return !!D.buildings[a];
      if (k === 'btab') return !!S['tb_' + a];
      if (k === 'craft') return !!D.items[a];
      if (k === 'panel') return !!S['btn_' + a];
      if (k === 'qtab') return !!S['tab_' + a];
      if (k === 'ctab') return !!S['city_t_' + a];
      if (k === 'mark') return place(a);
      return false;
    }
    /** The words a line leaves open ({venue}, {game:cafe}, {t:venue_wait}...): each must still mean something. */
    function words(str, where) {
      String(str).replace(/\{g:[^|{}]*\|[^|{}]*\}/g, '').replace(/\{(\w+)(?::(\w+))?\}/g, (m, k, a) => {
        const ok = ['venue', 'keeper', 'lord', 'trait', 'chief', 'hero', 'de_hero'].includes(k) ? !a
          : k === 'game' ? !!(D.venues || {})[a]
          : k === 'n' || k === 't' ? !CFG || (!!CFG[a] && typeof CFG[a].value === 'number')
          : false;
        if (!ok) broken.push(`${where}: mot ${m}`);
        return m;
      });
    }
    /** The names a condition or a goal uses. */
    function cond(c, where) {
      if (!c) return;
      const bad = what => broken.push(`${where}: ${what}`);
      for (const k of ['built']) for (const b in c[k] || {}) if (!D.buildings[b]) bad(`${k} ${b}`);
      for (const k in c.cls || {}) if (!D.classes.some(x => x.id === k)) bad('cls ' + k);
      for (const r in Object.assign({}, c.totals, c.res)) if (!D.resources[r]) bad('ressource ' + r);
      if (c.quest && !quests.some(q => q.id === c.quest)) bad('quest ' + c.quest);
      if (c.unlocked && !D.buildings[c.unlocked]) bad('unlocked ' + c.unlocked);
      for (const id of [].concat(c.after || [])) if (!cs.some(x => x.id === id)) bad('after ' + id);
      if (c.has && !D.items[c.has]) bad('has ' + c.has);
      if (c.btab && !S['tb_' + c.btab]) bad('btab ' + c.btab);
      if (c.qtab && !S['tab_' + c.qtab]) bad('qtab ' + c.qtab);
      if (c.ctab && !S['city_t_' + c.ctab]) bad('ctab ' + c.ctab);
      if (c.panel && !S['btn_' + c.panel]) bad('panel ' + c.panel);
      if (c.clicked && !place(c.clicked)) bad('clicked ' + c.clicked);
      if (c.rank != null && !(Number.isInteger(c.rank) && c.rank >= 0 && D.city)) bad('rank ' + c.rank);
      if (c.stuck) { const i = c.stuck.indexOf(':'), k = i < 0 ? c.stuck : c.stuck.slice(0, i), a = c.stuck.slice(i + 1); if (!(k === 'work' ? !!(D.city && D.city.works[a]) : STUCK.includes(c.stuck))) bad('stuck ' + c.stuck); }
      for (const o of c.any || []) cond(o, where);
      for (const g in c.gain || {}) {
        const i = g.indexOf(':'), k = i < 0 ? g : g.slice(0, i), a = g.slice(i + 1);
        const ok = ['b', 'lvl'].includes(k) ? !!D.buildings[a] : ['u', 'drill'].includes(k) ? !!D.units[a] : GAINS.includes(g);
        if (!ok) bad('gain ' + g);
      }
    }
    for (const id of D.tutorial.venueFirst || []) if (!(D.venues || {})[id] || !D.buildings[id]) broken.push(`venueFirst: ${id}`);
    for (const c of cs) {
      if (c.id !== 'start') cond(c.when, `${c.id} (when)`);
      for (const s of c.steps) {
        const where = `${c.id} / ${s.id}`;
        for (const e of s.point || []) if (!point(e)) broken.push(`${where}: point ${e}`);
        for (const p of s.say || []) { if (p && p.show && !place(p.show)) broken.push(`${where}: show ${p.show}`); words(typeof p === 'string' ? p : p.text, where); }
        if (s.task) words(s.task, where);
        for (const r in s.gift || {}) if (!D.resources[r]) broken.push(`${where}: gift ${r}`);
        cond(s.goal, where); cond(s.unless, where + ' (unless)'); cond(s.already, where + ' (already)');
      }
    }
    return { features: feats.length, missing, unknown, broken };
  }
  /** The report, a line per observation; empty when there is nothing to say. */
  function lines(r) {
    const out = [];
    for (const f of r.missing) out.push(`tutoriel : rien ne couvre ${f.id} (${f.what})`);
    for (const id of r.unknown) out.push(`tutoriel : « ${id} » est couvert mais n’existe plus dans le jeu`);
    for (const b of r.broken) out.push(`tutoriel : ${b} n’existe plus dans le jeu`);
    return out;
  }
  return { run, lines, features };
})();
if (typeof module !== 'undefined') module.exports = TutoCheck;
