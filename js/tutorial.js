// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Aveline's teaching. Its steps and every line are data (data/tutorial.js); this file is the
// rules. A course is the guided start of a first game, or one lesson: the guide speaks, then ONE
// thing can be clicked, shown by a golden arrow, while the rest of the screen is dimmed and takes
// no click. The view can always be slid and zoomed. After the start, each lesson is offered when
// what it teaches opens (a card, bottom left: Suivre / Plus tard), and the Livre des leçons (the
// Village panel) plays any of them again. What she has taught is saved (state.tuto).
// A lesson never waits: the first time it plays she lends what its task lacks, and a step whose
// task cannot be done now (`unless: { stuck }`) is passed over, its lines having been said before.
// A step whose task the player already did (`already`: a farm built before its lesson) keeps its
// lines, but not its task: she says them (not the pages marked `todo`) and goes on.
//
// The screens name the places an arrow can point at while they draw (Tuto.mark), and ask before
// they act on a click, a key or a tile of a stroke (Tuto.click, Tuto.keyOk, Tuto.tileOk).
'use strict';

const Tuto = (() => {
  const D = DATA.tutorial, T = DATA.map.tile, RES = DATA.resources, C = UI.C;
  const TOP = 52, BOTTOM = 586, SIDE = { x: 868, y: 60, w: 404, h: 520 }; // the HUD's bars and the side panel (js/screens.js)
  const KEYS = { hero: 'KeyH', quests: 'KeyJ', people: 'KeyK', menu: 'KeyV', city: 'KeyG', explore: 'KeyE' };
  Object.assign(DATA.strings, D.strings); // her own interface words (data/tutorial.js loads before data/strings.js)
  const START = { id: 'start', title: D.title, steps: D.steps, covers: D.covers };
  const LESSONS = D.lessons;
  let marks = {};   // the places this frame's draw named: id -> { x, y, w, h }
  let own = [];     // her own buttons, which always take a click
  let cur = null;   // what the running step keeps while it runs: never saved
  let nudge = 0;    // seconds the task box flashes after a click that was refused
  let armed = 0;    // seconds left to confirm "skip"
  let cheer = null; // { t }: "Bravo !" rising from the task box
  let offer = null; // the lesson she offers now (its card, bottom left), or null
  let calm = 0;     // seconds before she offers the next lesson
  let forced = null; // the lesson the address option ?lesson=<id>&offer has her offer
  let want = null;  // the place the arrow wants this frame: a scrolling box is scrolled to show it
  const bits = [];  // confetti, in screen space

  // ---- Which course, which step ----
  const byId = id => id === 'start' ? START : LESSONS.find(l => l.id === id) || null;
  /** The saved part, filled in for a save that predates the lessons. */
  function fix() {
    const t = state.tuto;
    if (!t.seen) t.seen = {};
    if (!t.later) t.later = {};
    if (t.lstep == null) t.lstep = 0;
    if (t.lesson === undefined) t.lesson = null;
  }
  /** The course running now: the start until it is done, then a lesson while one is open. */
  function course() {
    if (!state || !state.tuto) return null;
    if (!state.tuto.done) return START;
    return state.tuto.lesson ? byId(state.tuto.lesson) : null;
  }
  const running = () => !!course();
  /** True while the tutorial decides what a click does: in the village, with no other window open. */
  const active = () => running() && scene === 'play' && !ui.away && !ui.banner;
  const isStart = () => course() === START;
  const at = () => isStart() ? state.tuto.step : state.tuto.lstep;
  function setAt(n) { if (isStart()) state.tuto.step = n; else state.tuto.lstep = n; }
  const step = () => course().steps[at()];
  const tasks = () => course().steps.filter(s => s.task);
  const keyOf = () => course().id + ':' + at();
  /** Her lines for the step as it runs: a task already done drops the pages about doing it (`todo`). */
  const says = s => !s.say ? [] : cur && cur.skip ? s.say.filter(p => !p.todo) : s.say;
  const pageOf = s => { const p = says(s)[cur.page]; return typeof p === 'string' ? { text: gendered(fill(p)) } : { text: gendered(fill(p.text)), show: p.show }; };
  const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const grow = (r, n) => ({ x: r.x - n, y: r.y - n, w: r.w + 2 * n, h: r.h + 2 * n });
  const tileOf = (x, y) => { const p = World.toWorld(x, y); return { tx: Math.floor(p.x / T), ty: Math.floor(p.y / T) }; };
  const isPaved = t => !!state.land.paved[Village.idx(t.tx, t.ty)];
  const split = e => { const i = e.indexOf(':'); return i < 0 ? [e, ''] : [e.slice(0, i), e.slice(i + 1)]; };
  /** The last one built of a kind: the one a lesson just asked for. */
  const lastOf = kind => state.buildings.reduce((o, b) => b.kind === kind && (!o || b.uid > o.uid) ? b : o, null);
  /** The building of that kind whose panel is open, or null. */
  const opened = kind => { const b = ui.panel === 'building' ? Village.byUid(ui.sel) : null; return b && b.kind === kind ? b : null; };
  /** What a marked button costs, for the building `b` it acts on: « Améliorer », « Tout le rempart », a unit to train. Null when free. */
  function priceOf(mark, b) {
    if (mark === 'act:upgrade') return b ? Village.upgradeCost(b) : null;
    if (mark === 'act:rampart') return b ? Village.rampartCost(Village.rampart(b)) : null;
    if (mark.startsWith('train:')) return Units.cost(mark.slice(6));
    return null;
  }
  /** The one of a kind her arrow points at: the last built whose roof is not behind another building, else the last built. */
  function inSight(kind) {
    const all = state.buildings.filter(b => b.kind === kind).sort((a, b) => b.uid - a.uid);
    for (const b of all) { const r = World.bRect(b), p = World.toScreenIso(r.cx, r.y + r.h * 0.25), w = World.toWorld(p.x, p.y), hit = World.pickBuilding(w.x, w.y); if (hit && hit.uid === b.uid) return b; }
    return all[0] || null;
  }
  const tabOf = card => (DATA.buildTabs.find(t => t.items.includes(card)) || DATA.buildTabs[0]).id;
  /** What a card of the build bar puts in hand: a land tool's id, or null for a building. */
  const toolOf = card => card.startsWith('tool:') ? card.slice(5) : card.startsWith('plant:') || card.startsWith('trap:') ? card : null;
  /** The price of `n` of what a card lays. */
  function cardCost(card, n) {
    const one = card.startsWith('tool:') ? Village.toolCost(DATA.tools[card.slice(5)].cost || {})
      : card.startsWith('plant:') ? Village.toolCost(DATA.flora[card.slice(6)].plant)
      : card.startsWith('trap:') ? Village.toolCost(DATA.traps[card.slice(5)].cost) : Village.cost(card);
    const out = {}; for (const r in one) out[r] = one[r] * (n || 1);
    return out;
  }

  // ---- What the city, the places and the wild are now, for her lines and her conditions ----
  /** The building of a place that can be entered now (js/venue.js) her arrow points at: a café first (DATA.tutorial.venueFirst), or null. */
  function venueNow() {
    for (const kind of D.venueFirst.concat(DATA.venueOrder)) { const b = inSight(kind); if (b && Venue.has(b)) return b; }
    return state.buildings.find(b => Venue.has(b)) || null;
  }
  /** The order the Commandes tab marks (the first slot that holds one), and whether it can be handed in. */
  const firstOrder = () => state.city.orders.find(o => o.kind) || null;
  const orderReady = o => !!o && (o.kind === 'deliver' ? state.res[o.res] >= o.n : o.have >= o.n);
  /** The legacy node the Héritage tab marks (the first open one that is not full), with its price in Renown; null when none. */
  function legacyNode() {
    const tree = state.prestige.tree || {};
    const n = DATA.legacy.find(q => (tree[q.id] || 0) < q.max && (!q.after || Object.keys(q.after).every(k => (tree[k] || 0) >= q.after[k])));
    return n ? { id: n.id, cost: n.cost + n.step * (tree[n.id] || 0) } : null;
  }
  /** The trips scouts can still be sent on now, one per way that is open (js/explore.js scoutPlan). */
  function scoutWays() {
    const e = state.explore, out = [];
    for (let o = 0; o < 8; o++) { const plan = Explore.scoutPlan(o); if (plan && !e.scouts.some(sc => sc.dir === o)) out.push(plan); }
    return out;
  }
  /** The place found whose page is open, else the first of the list (the one the panel marks). */
  const siteNow = () => { const all = Explore.shown(); return all.find(s => s.id === ui.exSite) || all[0] || null; };
  /**
   * Whether a step's task cannot be done now (`unless: { stuck: '<what>' }`: the step is passed over).
   *   order      no order is on offer, or (a lesson played again) the one marked is not filled yet
   *   proclaim   the next rank cannot be proclaimed
   *   work:<monument>   it does not stand, or its next step cannot be paid (she never lends a great work's stage)
   *   legacy     no Renown for the node marked
   *   scout      every party is out, nowhere is left to go, or (played again) none can be paid
   *   go         the hero cannot be sent to the place: away, on his way, or nothing asks for him there
   */
  function stuck(what) {
    const [k, a] = split(what), replay = !!state.tuto.replay;
    if (k === 'order') { const o = firstOrder(); return !o || (replay && !orderReady(o)); }
    if (k === 'proclaim') return !City.canProclaim();
    if (k === 'work') { const b = lastOf(a); return !b || !!b.damaged || !Village.canAfford(City.stageCost(b)); }
    if (k === 'legacy') { const n = legacyNode(); return !n || City.points() < n.cost; }
    if (k === 'scout') { const ways = scoutWays(); return !ways.length || state.explore.scouts.length >= tune.scout_max || (replay && !ways.some(p => Village.canAfford(p.cost))); }
    if (k === 'go') { const s = siteNow(), act = s && Explore.action(s); return !act || !act.far || !!act.off; }
    return false;
  }
  /** A time of config.js in her words: 240 -> « 4 minutes », 90 -> « 1 minute 30 ». */
  function span(secs) {
    const m = Math.floor(secs / 60), r = Math.round(secs % 60);
    return m ? tr(m > 1 ? 'span_mins' : 'span_min', { m }) + (r ? ' ' + r : '') : tr('span_secs', { s: r });
  }
  /**
   * The words a line of data/tutorial.js leaves open, filled from the game as it is now:
   *   {venue} {keeper}   the place her arrow points at and who keeps it · {game:<place>} a place's game
   *   {hero} {de_hero}  the hero's name, as the player chose it, alone or with « de » (« d’Aldric »)
   *   {lord} {trait}     the warlord of the siege announced, and what he changes · {chief} the camp's chief
   *   {n:<key>} {t:<key>}   a number, or a time, of config.js
   */
  const WORDS = {
    venue: () => { const b = venueNow(); return DATA.buildings[b ? b.kind : D.venueFirst[0]].name; },
    keeper: () => { const b = venueNow(); return DATA.keepers[DATA.venues[b ? b.kind : D.venueFirst[0]].keeper].name; },
    game: a => DATA.venues[a].title,
    lord: () => { const sg = Raid.siege(); return (DATA.warlords.find(w => sg && w.id === sg.lord) || DATA.warlords[0]).name; },
    trait: () => { const sg = Raid.siege(); return (DATA.warlords.find(w => sg && w.id === sg.lord) || DATA.warlords[0]).trait; },
    hero: () => heroName(),
    de_hero: () => heroName(true),
    chief: () => Camp.chiefName((state.raid.camp && state.raid.camp.lvl) || 0) || DATA.camp.chiefs[0],
    n: a => fmtNum(tune[a]),
    t: a => span(tune[a]),
  };
  function fill(str) { return str.indexOf('{') < 0 ? str : str.replace(/\{(\w+)(?::(\w+))?\}/g, (m, k, a) => WORDS[k] ? WORDS[k](a) : m); }

  // ---- Conditions: when a lesson is offered, when a step is skipped ----
  /**
   * The quests' conditions (the city's among them: rank, popularity, orders honoured...), and the
   * tutorial's own: after, unlocked, free, horn, away, order (one is on offer), proclaim (the next
   * rank can be), venue (a place can be entered), site (a place is found), siege (one is announced
   * or on), chief (the camp has one), spend (a legacy node can be bought), renown: n (a new start
   * would give that much), trip and exsite: true | false (the hero is on an expedition, a place's
   * page is open), stuck (see above), any: [conditions] (one of them).
   */
  function holds(c) {
    if (!c) return true;
    if (c.after && ![].concat(c.after).every(id => state.tuto.seen[id])) return false;
    if (c.unlocked && !(Village.isUnlocked(c.unlocked) && (!DATA.buildings[c.unlocked].unlock || state.unlocked[c.unlocked]))) return false;
    if (c.free != null && Units.free() < c.free) return false;
    if (c.horn && !Raid.trapsOpen()) return false;
    if (c.away && !Hero.away()) return false; // on a mission, or on an expedition
    if (c.order && !firstOrder()) return false;
    if (c.proclaim && !City.canProclaim()) return false;
    if (c.venue && !state.buildings.some(b => Venue.has(b))) return false;
    if (c.site && !Explore.shown().length) return false;
    if (c.siege && !Raid.siege()) return false;
    if (c.chief && !(Camp.standing() && Camp.chiefName(state.raid.camp.lvl || 0))) return false;
    if (c.spend && stuck('legacy')) return false;
    if (c.renown != null && Village.renownGain() < c.renown) return false;
    if (c.trip != null && !!state.explore.trip !== c.trip) return false;
    if (c.exsite != null && !!ui.exSite !== c.exsite) return false;
    if (c.stuck && !stuck(c.stuck)) return false;
    if (c.any && !c.any.some(holds)) return false;
    return Quests.met(c);
  }
  /** The lesson to offer now: the first one not yet seen, not put off, whose time has come. */
  function next() {
    if (state.tuto.off) return null;
    return LESSONS.find(l => !state.tuto.seen[l.id] && (state.tuto.later[l.id] || 0) <= state.t && (l.raid || !state.raid.active) && holds(l.when)) || null;
  }

  // ---- Counts a step watches grow ----
  function tally(key) {
    const [k, a] = split(key);
    if (k === 'b') return Village.count(a);
    if (k === 'lvl') return state.buildings.reduce((n, b) => n + (b.kind === a ? b.lvl : 0), 0);
    if (k === 'u') return Units.count(a);
    if (k === 'drill') return Units.count(a) + Units.line().filter(r => r.kind === a).length; // on his feet, at drill or waiting in the line
    if (k === 'orders') return state.city.done;
    if (k === 'rank') return state.city.rank;
    if (k === 'scouts') return state.explore.reach.reduce((n, r) => n + r, 0);
    if (k === 'legacy') { const tree = state.prestige.tree || {}; return Object.keys(tree).reduce((n, id) => n + tree[id], 0); }
    return state.counters[k] || 0; // cleared, planted, traps
  }
  /** What a `changed` goal compares: the soldiers' posts, the buildings' styles, the deck. */
  function sig(what) {
    if (what === 'orders') return Units.soldiers().map(u => `${u.id}:${Math.round(u.gx)},${Math.round(u.gy)}`).join(' ');
    if (what === 'style') return state.buildings.map(b => b.style || 0).join('');
    if (what === 'deck') return JSON.stringify(state.hero.bench);
    return '';
  }

  // ---- A step begins and ends ----
  function enter() {
    while (course() && step() && step().unless && holds(step().unless)) setAt(at() + 1); // a step with nothing left to do: a unique building already there
    if (!course()) return;
    if (at() >= course().steps.length) { complete(); return; }
    const s = step(), c = state.cam, g = s.goal || {};
    cur = { key: keyOf(), page: 0, shown: 0, t: 0, moved: 0, cam: { x: c.x, y: c.y }, skip: !!(s.task && s.already && holds(s.already)), tiles: null, trees: null, spot: null, glide: null, base: {}, sig: g.changed ? sig(g.changed) : null };
    cur.talk = says(s).length > 0;
    if (cur.skip) return; // the task is done already: nothing to lend, no place to show
    for (const k in g.gain || {}) cur.base[k] = tally(k);
    if (s.pave) cur.tiles = paveRun(s.pave);
    const [first, arg] = split(s.point ? s.point[0] : ''), h = Village.hallMid();
    if (first === 'chop') { const t = trees()[0]; if (t) cur.glide = World.camOn((h.x + t.tx * T) / 2, (h.y + t.ty * T) / 2); } // the hall and the nearest tree both in view
    else if (first === 'build') { const f = focus(spot(arg)); cur.glide = f ? World.camOn(f.x, f.y) : World.camOn(h.x, h.y + 2 * T); } // the view on the place she found
    else if (first === 'pick') { const f = hintOf(arg).at; if (f) cur.glide = World.camOn(f.x, f.y); }
    else if (first === 'pave') cur.glide = World.camOn(h.x, h.y + 2 * T);
    else if (first === 'building' || first === 'venue') { const b = first === 'venue' ? venueNow() : inSight(arg); if (b) { const d = Village.dims(b); cur.glide = World.camOn((b.x + d.w / 2) * T, (b.y + d.h / 2) * T); } }
    if (g.panel === 'explore') ui.exSite = null; // the Exploration opens on its first page, not on the place last looked at
    if (!isStart() && ['build', 'pick', 'free', 'chop', 'pave', 'key'].includes(first)) Object.assign(ui, { panel: null, sel: null }); // the map is needed: the panel goes
    if (!isStart() && !state.tuto.replay) lend(s);
  }
  /** The first time a lesson plays, she lends what its task's price lacks: a lesson never waits. */
  function lend(s) {
    const need = {}, add = c => { for (const r in c) need[r] = (need[r] || 0) + c[r]; };
    let target = null;
    for (const e of s.point || []) {
      const [k, a] = split(e);
      if (k === 'build') { add(Village.cost(a)); const sp = spot(a); if (sp.path.length) add(cardCost('tool:path', sp.path.length)); } // and the bit of path to the place she found
      if (k === 'pick') add(cardCost(a, s.count));
      if (k === 'building') target = opened(a) || lastOf(a); // the one the player opened, when it is open: another rampart may cost more
      if (k === 'mark') { const c = priceOf(a, target); if (c) add(c); }
      if (k === 'mark' && a === 'explore:rose') { const ways = scoutWays().sort((p, q) => p.dist - q.dist); if (ways.length) add(ways[0].cost); } // the nearest trip scouts can make
      if (k === 'mark' && a === 'city:order') { // the order she shows: its goods lent, or (anything else it asks) filled by her, this once
        const o = firstOrder();
        if (o && o.kind === 'deliver') add({ [o.res]: o.n });
        else if (o && !orderReady(o)) { cur.order = o.id; o.have = o.n; toast(tr('tuto_order_gift', { name: D.guide.name }), C.gold); }
      }
    }
    const give = {};
    for (const r in need) { const m = Math.ceil(need[r] - state.res[r]); if (m > 0) give[r] = m; }
    if (!Object.keys(give).length) return;
    for (const r in give) Village.gain(r, give[r]);
    toast(tr('tuto_lend', { name: D.guide.name, list: Object.keys(give).map(r => `+${give[r]} ${RES[r].name.toLowerCase()}`).join(', ') }), C.gold);
  }
  /** The step is done: her gift, a cheer, whatever was in hand put away, and the next step. */
  function finish() {
    const s = step();
    if (s.gift) {
      for (const r in s.gift) Village.gain(r, s.gift[r]);
      toast(tr('tuto_gift', { name: D.guide.name, list: Object.keys(s.gift).map(r => `+${s.gift[r]} ${RES[r].name.toLowerCase()}`).join(', ') }), C.gold);
    }
    if (s.task && !cur.skip) { cheer = { t: 0 }; burst(230, TOP + 60); sfx('unlock'); }
    Object.assign(ui, { placing: null, tool: null, moving: null }); // in a lesson the open panel stays: the next step often goes on in it
    if (isStart()) Object.assign(ui, { panel: null, sel: null });
    events.push({ type: 'tuto', course: course().id, step: s.id });
    setAt(at() + 1);
    if (at() >= course().steps.length) { complete(); return; }
    Save.persist();
    enter();
  }
  /** The course is over: the start ends the first game's guidance; a lesson is marked seen. */
  function complete() {
    const c = course();
    if (c === START) { end('tuto_done'); sfx('fanfare'); burst(W / 2, 300); return; }
    state.tuto.seen[c.id] = true;
    close();
    toast(tr('tuto_lesson_done', { title: c.title }), C.gold); sfx('fanfare'); burst(W / 2, 300);
    Save.persist();
  }
  function close() { state.tuto.lesson = null; state.tuto.lstep = 0; state.tuto.replay = false; cur = null; calm = tune.tuto_gap; }
  function end(key) { state.tuto.done = true; cur = null; calm = tune.tuto_gap; toast(tr(key, { name: D.guide.name }), C.gold); Save.persist(); }
  function skipClick() {
    if (armed <= 0) { armed = 3; return; }
    armed = 0;
    if (isStart()) { end('tuto_skipped'); return; }
    state.tuto.seen[course().id] = true; close(); toast(tr('tuto_lesson_skipped'), C.gold); Save.persist();
  }
  /** Opens a lesson: `replay` when the player asks for one already seen (she lends nothing then). */
  function open(id, replay) {
    fix();
    if (!byId(id) || id === 'start' || !state.tuto.done) return false;
    Object.assign(state.tuto, { lesson: id, lstep: 0, replay: !!replay });
    Object.assign(ui, { panel: null, sel: null, placing: null, tool: null, moving: null });
    offer = null; forced = null; cur = null; sfx('click');
    return true;
  }
  /** "Plus tard": she offers it again in a while (the book always has it). */
  function later(id) { state.tuto.later[id] = state.t + tune.tuto_later; offer = null; forced = null; calm = tune.tuto_gap; sfx('click'); }
  /** A page is turned: the rest of the line first when it is still being written. */
  function turn() {
    const s = step(), full = pageOf(s).text.length;
    if (cur.shown < full) { cur.shown = full; return; }
    sfx('click'); cur.page++; cur.shown = 0;
    if (cur.page < says(s).length) return;
    cur.talk = false; cur.t = 0;
    if (!s.task || cur.skip) finish();
  }

  // ---- When a step is done ----
  function met(g) {
    if (!g) return false;
    if (g.moved != null && cur.moved < g.moved) return false;
    if (g.paved && cur.tiles && !cur.tiles.every(isPaved)) return false;
    if (g.has && !Hero.has(g.has)) return false;
    for (const k in g.gain || {}) if (tally(k) - cur.base[k] < g.gain[k]) return false;
    if (g.changed && sig(g.changed) === cur.sig) return false;
    if (g.panel && ui.panel !== g.panel) return false;
    if (g.btab && !(ui.panel === 'building' && ui.btab === g.btab)) return false;
    if (g.qtab && !(ui.panel === 'quests' && ui.tab === g.qtab)) return false;
    if (g.sel && ui.selU.length < g.sel) return false;
    if (g.trained) { const b = Units.barracks(); if (b && b.train) return false; }
    if (g.away && !state.mission) return false;
    if (g.ctab && !(ui.panel === 'city' && ui.ctab === g.ctab)) return false;
    if (g.clicked && cur.clicked !== g.clicked) return false;
    if (g.trip != null && !!state.explore.trip !== g.trip) return false;
    if (g.exsite != null && !(ui.panel === 'explore' && !!ui.exSite === g.exsite)) return false;
    return Quests.met(g); // the quests' own conditions; it does not read the ones above
  }
  /** How far the task is, when it can be counted: { frac, text }. */
  function progress(s) {
    const g = s.goal || {};
    if (g.totals) { const r = Object.keys(g.totals)[0], n = Math.min(g.totals[r], Math.floor(state.totals[r])); return { frac: n / g.totals[r], text: `${n} / ${g.totals[r]}` }; }
    if (g.moved) return { frac: cur.moved / g.moved, text: '' };
    if (g.paved && cur.tiles && cur.tiles.length) { const n = cur.tiles.filter(isPaved).length; return { frac: n / cur.tiles.length, text: `${n} / ${cur.tiles.length}` }; }
    const gk = Object.keys(g.gain || {})[0];
    if (gk && g.gain[gk] > 1) { const n = Math.min(g.gain[gk], tally(gk) - cur.base[gk]); return { frac: n / g.gain[gk], text: `${n} / ${g.gain[gk]}` }; }
    if (g.trained) { const b = Units.barracks(); if (b && b.train) return { frac: 1 - b.train.left / b.train.total, text: '' }; }
    return null;
  }

  // ---- What the land offers: trees to click, a place by a path, tiles to pave ----
  /** The wood nearest the hall on screen (a tree straight below is farther than one to the side). */
  function trees() {
    if (cur.trees && cur.trees.every(t => Village.floraAt(t.tx, t.ty))) return cur.trees;
    const h = DATA.map.hall, cx = h.x + 2, cy = h.y + 1, out = [];
    for (let dy = -26; dy <= 26; dy++) for (let dx = -26; dx <= 26; dx++) {
      const id = Village.floraAt(cx + dx, cy + dy);
      if (id && DATA.flora[id].gives === 'wood') out.push({ tx: cx + dx, ty: cy + dy, d: Math.max(Math.abs(dx - dy) / 2, Math.abs(dx + dy)) });
    }
    out.sort((a, b) => a.d - b.d);
    const first = out[0]; // the nearest, then its two neighbours: three arrows in one look
    if (first) out.sort((a, b) => Math.hypot(a.tx - first.tx, a.ty - first.ty) - Math.hypot(b.tx - first.tx, b.ty - first.ty));
    return (cur.trees = out.slice(0, 3));
  }
  /** Whether a building's picture covers the middle of a tile: marked there, it would be lost behind it. */
  const hidden = (tx, ty) => !!World.pickBuilding(tx * T, ty * T);
  /** The village as js/siting.js reads it, in tiles. */
  function siteEnv() {
    Village.refreshTown();
    const hall = state.buildings.find(b => b.kind === 'hall'), hd = Village.dims(hall), cp = state.raid.camp, at = (x, y) => Village.inMap(x, y) ? Village.occ[Village.idx(x, y)] : -1;
    return {
      B: DATA.buildings, hall: { x: hall.x, y: hall.y, w: hd.w, h: hd.h },
      buildings: state.buildings.map(b => { const d = Village.dims(b); return { uid: b.uid, kind: b.kind, x: b.x, y: b.y, w: d.w, h: d.h, lvl: b.lvl }; }),
      size: Village.size, canTurn: Village.canTurn, needsRoad: Village.needsRoad,
      free: (x, y) => at(x, y) === 0 && Explore.seen(x, y), built: (x, y) => at(x, y) > 0, // nothing is built under the fog
      road: (x, y) => Village.inMap(x, y) && !!Village.net[Village.idx(x, y)],
      camp: cp ? { x: cp.x + Village.CAMP / 2, y: cp.y + Village.CAMP / 2 } : null,
      R: tune.beauty_radius, serviceR: o => Village.serviceRadius(o),
      hidden: (tx, ty, w, h) => hidden(tx + w / 2, ty + h / 2) || hidden(tx + 0.5, ty + h - 0.5) || hidden(tx + w - 0.5, ty + 0.5), // its middle or a side corner behind a building
      w: Siting.weights(tune),
    };
  }
  /**
   * Where she suggests this building: the best free place for it in the village as it stands
   * (js/siting.js: quiet workshops away from the houses, houses together, services among them...),
   * with the bit of path to lay first when the best place is off the streets. Kept for the step
   * while it can still be built on; the player may build on any other free place beside a path.
   */
  function spot(kind) {
    const sp = cur.spot, free = t => isPaved(t) || Village.occ[Village.idx(t.tx, t.ty)] === 0;
    if (sp && sp.kind === kind && (sp.none || (Village.canPlace(kind, sp.tx, sp.ty, undefined, sp.rot) && sp.path.every(free)))) return sp;
    const h = DATA.map.hall, n = step().near, b = Siting.best(kind, siteEnv(), { near: n && { x: h.x + n[0], y: h.y + n[1] } });
    return (cur.spot = b ? Object.assign(b, { kind }) : { kind, none: true, path: [] });
  }
  /** Where the view goes for a place she suggests: between the footprint and the start of its path. In map pixels. */
  function focus(sp) {
    if (!sp || sp.none) return null;
    const m = { x: (sp.tx + sp.w / 2) * T, y: (sp.ty + sp.h / 2) * T };
    return sp.path.length ? { x: (m.x + (sp.path[0].tx + 0.5) * T) / 2, y: (m.y + (sp.path[0].ty + 0.5) * T) / 2 } : m;
  }
  /**
   * What she suggests for a card laid where the player likes ('pick'): a building's or a
   * decoration's place, a tree's tile, a rampart's run across the camp's way, a trap's tile on the
   * raiders' way. { foot: { tx, ty, w, h } | tiles: [{ tx, ty }], at: the view's point }, or {}.
   */
  function hintOf(card) {
    if (cur.hint && cur.hint.card === card) return cur.hint;
    const env = siteEnv(), Bd = DATA.buildings[card];
    let out = {};
    if (card.startsWith('trap:')) { const t = Siting.trap(Raid.route(), env, Raid.canTrap); if (t) out = { tiles: [t] }; }
    else if (card.startsWith('plant:')) { const b = Siting.best(card, env, { as: { w: 1, h: 1, beauty: 1, decor: true } }); if (b) out = { tiles: [{ tx: b.tx, ty: b.ty }] }; }
    else if (Bd && Bd.wall) { const t = Siting.wall(step().count || 3, env); if (t) out = { tiles: t }; }
    else if (Bd) { const b = Siting.best(card, env, { rot: 0 }); if (b) out = { foot: b }; }
    const f = out.foot ? focus(Object.assign({ path: [] }, out.foot)) : out.tiles ? { x: (out.tiles[Math.floor(out.tiles.length / 2)].tx + 0.5) * T, y: (out.tiles[Math.floor(out.tiles.length / 2)].ty + 0.5) * T } : null;
    return (cur.hint = Object.assign(out, { card, at: f }));
  }
  /** `n` free tiles in a row from the end of a street: the path this step asks for. */
  function paveRun(n) {
    Village.refreshTown();
    const h = DATA.map.hall, free = (x, y) => Village.inMap(x, y) && Village.occ[Village.idx(x, y)] === 0;
    const run = (x, y, dx, dy) => { const out = []; for (let i = 0; i < n; i++) { if (!free(x + dx * i, y + dy * i)) return null; out.push({ tx: x + dx * i, ty: y + dy * i }); } return out; };
    const seen = r => r.every(t => !hidden(t.tx + 0.5, t.ty + 0.5));
    let fallback = null;
    for (const [x, y, dx, dy] of [[-3, 3, -1, 0], [6, 3, 1, 0], [2, 8, 0, 1]]) { // the first street's ends: west, east, then south through the gate
      const r = run(h.x + x, h.y + y, dx, dy);
      if (r && seen(r)) return r;
      fallback = fallback || r;
    }
    for (let y = h.y - 14; y <= h.y + 14; y++) for (let x = h.x - 14; x <= h.x + 14; x++) { // else: from any paved tile joined to the hall
      if (!Village.net[Village.idx(x, y)]) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) { const r = run(x + dx, y + dy, dx, dy); if (r && seen(r)) return r; fallback = fallback || r; }
    }
    return fallback || []; // none in plain sight: one behind a building, or nothing to pave
  }

  // ---- Where to click now ----
  /**
   * The one thing the player may click, from the step's `point` list: { mark: id } a place on
   * the screen, { world: true, ... } something on the map, { key } a key, { wait: true } nothing
   * but patience. `note` and `frac` say what is being waited for.
   */
  function resolve() {
    const s = step();
    if (!cur || cur.talk || !s.point) return null;
    for (const e of s.point) { const t = entry(e); if (t) return t; }
    return { wait: true };
  }
  /** A price that cannot be paid yet: the trees are offered meanwhile (wood feeds every chain of the first minutes). */
  function short(c) {
    const r = Object.keys(c).find(k => state.res[k] < c[k]);
    return { world: true, chop: true, note: tr(r === 'wood' ? 'tuto_need_wood' : 'tuto_need', { n: c[r], have: Math.floor(state.res[r]), res: RES[r].name }), frac: state.res[r] / c[r] };
  }
  function entry(e) {
    const [k, a] = split(e);
    if (k === 'drag') return { world: true, drag: true };
    if (k === 'chop') return { world: true, chop: true };
    if (k === 'free') return { world: true, free: true };
    if (k === 'key') return { key: a };
    if (k === 'build') {
      const sp = spot(a), left = sp.path.filter(t => !isPaved(t));
      if (left.length) { // the best place is off the streets: first the bit of path to it, its tiles marked
        const c = Village.toolCost(DATA.tools.path.cost); if (!Village.canAfford(c)) return short(c);
        const hint = tr('tuto_path_first', { n: left.length });
        if (ui.tool === 'path') return { world: true, tiles: left, spot: sp, hint };
        return { mark: ui.bar !== 'land' ? 'bar:land' : 'card:tool:path', hint };
      }
      if (ui.placing === a) return { world: true, place: a, spot: sp };
      const c = Village.cost(a); if (!Village.canAfford(c)) return short(c);
      return { mark: ui.bar !== tabOf(a) ? 'bar:' + tabOf(a) : 'card:' + a };
    }
    if (k === 'pick') {
      const tool = toolOf(a);
      if (tool ? ui.tool === tool : ui.placing === a) return { world: true, free: true, sug: hintOf(a) };
      const c = cardCost(a, 1); if (!Village.canAfford(c)) return short(c);
      return { mark: ui.bar !== tabOf(a) ? 'bar:' + tabOf(a) : 'card:' + a };
    }
    if (k === 'pave') {
      const left = cur.tiles.filter(t => !isPaved(t));
      if (!left.length) return null;
      const c = Village.toolCost(DATA.tools.path.cost);
      if (!Village.canAfford(c)) return short(c);
      if (ui.tool === 'path') return { world: true, tiles: left };
      return { mark: ui.bar !== 'land' ? 'bar:land' : 'card:tool:path' };
    }
    if (k === 'building') {
      const b = inSight(a);
      if (!b) return { wait: true };
      const open = ui.panel === 'building' && Village.byUid(ui.sel) && Village.byUid(ui.sel).kind === a;
      return open ? null : { world: true, building: b, kind: a };
    }
    if (k === 'venue') { // a place that can be entered: its building, until its panel is open
      const sel = ui.panel === 'building' ? Village.byUid(ui.sel) : null, b = venueNow();
      if (sel && Venue.has(sel)) return null;
      return b ? { world: true, building: b, kind: b.kind, enter: true } : { wait: true };
    }
    if (k === 'btab') return ui.panel === 'building' && ui.btab === a ? null : { mark: 'btab:' + a };
    if (k === 'ctab') return ui.panel === 'city' && ui.ctab === a ? null : { mark: 'ctab:' + a };
    if (k === 'craft') {
      if (Hero.has(a)) return null;
      const f = state.buildings.find(x => x.kind === 'forge');
      if (f && f.craft) return { wait: true, note: tr('tuto_forging'), frac: 1 - f.craft.left / f.craft.total };
      const c = Hero.craftCost(a); if (!Village.canAfford(c)) return short(c);
      return { mark: 'forge:' + a };
    }
    if (k === 'panel') return ui.panel === a ? null : { mark: 'btn:' + a, key: KEYS[a] };
    if (k === 'qtab') return ui.panel === 'quests' && ui.tab === a ? null : { mark: 'qtab:' + a };
    if (k === 'mark') { // a button that costs: short of its price (spent meanwhile, or a dearer rampart opened), she lends again
      const c = priceOf(a, ui.panel === 'building' ? Village.byUid(ui.sel) : null);
      return c && !Village.canAfford(c) ? short(c) : { mark: a };
    }
    return null;
  }
  /** Whether a click on the map at a screen point is the one the step asks for. */
  function worldOk(t, x, y) {
    const p = World.toWorld(x, y);
    if (t.free) return true;
    if (t.chop) return !World.pickBuilding(p.x, p.y) && !!World.pickFlora(p.x, p.y);
    if (t.place) { const g = World.ghostTile(t.place, p.x, p.y, ui.rot); return Village.canPlace(t.place, g.tx, g.ty, undefined, ui.rot) && (t.spot.none || !Village.needsRoad(t.place) || Village.roadAt(t.place, g.tx, g.ty, ui.rot)); }
    if (t.tiles) { const q = tileOf(x, y); return t.tiles.some(o => o.tx === q.tx && o.ty === q.ty); }
    if (t.building) { const b = World.pickBuilding(p.x, p.y); return !!b && b.kind === t.kind && (!t.enter || Venue.has(b)); } // any of that kind: the one she points at may stand behind another
    return false; // 'drag': the map is slid, never clicked
  }

  // ---- What the screens ask ----
  function begin() { marks = {}; own = []; want = running() && cur && cur.key === keyOf() ? (cur.talk ? pageOf(step()).show : (resolve() || {}).mark) || null : null; }
  /** Names a place on the screen for this frame. Inside a scrolling box, only what shows of it. */
  function mark(id, x, y, w, h) { if (id === want) UI.reveal(x, y, w, h); const r = UI.visible(x, y, w, h); if (r) marks[id] = r; }
  /** A click at a screen point: true when the game may act on it. Her own buttons always may. */
  function click(x, y) {
    if (own.some(r => inside(r, x, y))) return true;
    if (!cur) return false;
    if (cur.talk) { turn(); return false; }
    const t = resolve();
    if (t && t.mark && marks[t.mark] && inside(marks[t.mark], x, y)) { const r = UI.hitAt(x, y); if (r && r.onClick) cur.clicked = t.mark; return true; } // for a `clicked` goal: a button of what she shows was pressed
    if (t && t.world && !UI.hitAt(x, y) && worldOk(t, x, y)) return true;
    nudge = 0.5; tone(150, 0.07, 'triangle', 0.1);
    return false;
  }
  /** A panel's shortcut key, or the key a step asks for: only that one. */
  function keyOk(code) { const t = resolve(); return !!(t && t.key === code); }
  /** A tile of a stroke of a land tool: only the marked ones, or any while the map is open. */
  function tileOk(tx, ty) { const t = resolve(); return !!(t && (t.free || (t.tiles && t.tiles.some(o => o.tx === tx && o.ty === ty)))); }
  /** Whether the quest box stays out of the way (her task box takes its place). */
  function hidesQuest() {
    if (!running()) return false;
    const show = cur && cur.talk ? pageOf(step()).show : null;
    return !(show === 'hud:quest' || show === 'hud:city'); // she shows the quest box, or the city's plate under it: both are drawn
  }

  function update(dt) {
    for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 620 * dt; if (b.t > 1.2) bits.splice(i, 1); }
    if (cheer && (cheer.t += dt) > 1.3) cheer = null;
    if (!state || !state.tuto) return;
    fix();
    armed = Math.max(0, armed - dt);
    const c0 = course();
    if (c0 && c0 !== START && !c0.raid && state.raid.active) { // a raid: the lesson waits until it is over
      state.tuto.later[c0.id] = state.t; close(); toast(tr('tuto_lesson_raid'), C.bad); return;
    }
    if (!running()) { // between lessons: she offers the next one whose time has come
      calm = Math.max(0, calm - dt);
      offer = calm > 0 || scene !== 'play' || ui.away || ui.banner ? null : forced || next();
      return;
    }
    offer = null;
    if (!cur || cur.key !== keyOf()) enter();
    if (!running() || !cur) return;
    const s = step(), c = state.cam;
    cur.t += dt; nudge = Math.max(0, nudge - dt);
    if (cur.glide) { // the view slides to what she shows, until the player takes it
      const g = cur.glide, k = Math.min(1, dt * 4);
      c.x += (g.x - c.x) * k; c.y += (g.y - c.y) * k;
      if ((mouse.down && mouse.drag) || Math.hypot(g.x - c.x, g.y - c.y) < 1) cur.glide = null;
    } else cur.moved += Math.hypot(c.x - cur.cam.x, c.y - cur.cam.y);
    cur.cam = { x: c.x, y: c.y };
    if (cur.talk) {
      const show = pageOf(s).show || '';
      if (show.startsWith('card:')) ui.bar = tabOf(show.slice(5)); // a card she shows: its tab of the bar open
      cur.shown += dt * tune.tuto_type_cps;
      if (active() && (pressed('Space') || pressed('Enter') || pressed('NumpadEnter'))) turn();
      return;
    }
    if (cur.skip) { finish(); return; } // a task already done, with no line left to say
    if (cur.order != null) { const o = state.city.orders.find(q => q.id === cur.order); if (o) o.have = o.n; } // the order she filled stays full until it is handed in (a street's beauty is read again every second)
    let t = resolve();
    if (t && t.note && !isStart() && !state.tuto.replay) { lend(s); t = resolve(); } // a lesson's first play: her loan topped up when a workshop ate it meanwhile
    if (t && t.chop && t.note) { ui.tool = null; ui.placing = null; } // short of something: hands free for the trees
    if (t && t.place && !t.spot.none && !cur.turned) { ui.rot = t.spot.rot; cur.turned = true; } // taken in hand: turned as she suggests (R turns it back)
    if (met(s.goal)) finish();
  }

  // ---- Drawing ----
  function dim(a, hole) {
    ctx.fillStyle = `rgba(14,9,5,${a})`;
    if (!hole) { ctx.fillRect(0, 0, W, H); return; }
    const { x, y, w, h } = hole;
    ctx.fillRect(0, 0, W, y); ctx.fillRect(0, y + h, W, H - y - h); ctx.fillRect(0, y, x, h); ctx.fillRect(x + w, y, W - x - w, h);
  }
  /** The bars and the open panel dimmed, the map left clear: what is asked for is on the map. */
  function dimBars(a) {
    ctx.fillStyle = `rgba(14,9,5,${a})`;
    ctx.fillRect(0, 0, W, TOP); ctx.fillRect(0, BOTTOM, W, H - BOTTOM);
    if (ui.panel) ctx.fillRect(SIDE.x, SIDE.y, SIDE.w, SIDE.h);
  }
  /** A gold frame that breathes around a place on the screen. */
  function pulse(r) {
    const k = 0.5 + 0.5 * Math.sin(state.t * 6), g = grow(r, 3 + Math.round(k * 3));
    ctx.fillStyle = C.ink; ctx.fillRect(g.x - 2, g.y - 2, g.w + 4, 7); ctx.fillRect(g.x - 2, g.y + g.h - 5, g.w + 4, 7); ctx.fillRect(g.x - 2, g.y, 7, g.h); ctx.fillRect(g.x + g.w - 5, g.y, 7, g.h);
    ctx.fillStyle = C.gold; ctx.fillRect(g.x, g.y, g.w, 3); ctx.fillRect(g.x, g.y + g.h - 3, g.w, 3); ctx.fillRect(g.x, g.y, 3, g.h); ctx.fillRect(g.x + g.w - 3, g.y, 3, g.h);
  }
  /** The golden arrow, bouncing, its tip on a screen point. `up`: it points up (it sits under what it shows). */
  function arrow(x, y, up) {
    const s = up ? 1 : -1, tip = y + s * (4 + Math.round(Math.abs(Math.sin(state.t * 5)) * 12));
    const shape = (ox, oy, c) => {
      ctx.fillStyle = c;
      [6, 14, 22, 30].forEach((w, i) => ctx.fillRect(x - w / 2 + ox, (up ? tip + i * 5 : tip - (i + 1) * 5) + oy, w, 5));
      ctx.fillRect(x - 7 + ox, (up ? tip + 20 : tip - 38) + oy, 14, 18);
    };
    for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) shape(ox, oy, C.ink);
    shape(0, 0, C.gold);
    ctx.fillStyle = '#fff3b8'; ctx.fillRect(x - 5, up ? tip + 22 : tip - 36, 4, 14); // a glint down the shaft
  }
  /** The arrow on a place of the screen: above it, or under it when it is at the top. */
  function arrowAt(r) { if (r.y < 150) arrow(r.x + r.w / 2, r.y + r.h + 4, true); else arrow(r.x + r.w / 2, r.y - 4, false); }
  /** The arrow on a map point. Out of view: a round mark on the edge that brings the view there. */
  function arrowOn(mx, my, lift) {
    const p = World.toScreen(mx, my, lift);
    if (p.x > 24 && p.x < W - 24 && p.y > TOP + 44 && p.y < BOTTOM - 4) { arrow(p.x, p.y, false); return; }
    const x = clamp(p.x, 40, W - 40), y = clamp(p.y, TOP + 130, BOTTOM - 70), bob = Math.round(Math.sin(state.t * 6) * 3);
    own.push({ x: x - 26, y: y - 26, w: 52, h: 52 });
    UI.region(x - 26, y - 26, 52, 52, () => { cur.glide = World.camOn(mx, my); sfx('click'); }, tr('tuto_go'));
    UI.plate(x - 26, y - 26 + bob, 52, 52); UI.icon('icon.recenter', x, y + bob, 32);
  }
  /** A footprint on the ground, lit and breathing: where to build, where to pave. `faint`: where a path leads, lit less. */
  function lit(tx, ty, w, h, faint) {
    const a = World.toScreen(tx * T, ty * T), b = World.toScreen((tx + w) * T, ty * T), c = World.toScreen((tx + w) * T, (ty + h) * T), d = World.toScreen(tx * T, (ty + h) * T);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    ctx.fillStyle = `rgba(255,215,94,${(faint ? 0.4 : 1) * (0.42 + 0.22 * Math.sin(state.t * 6))})`; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff3b8'; ctx.stroke();
  }
  /** The map is to be slid: a pointer that goes from side to side between two arrowheads, in the middle of the view. */
  function slide() {
    const cx = W / 2, cy = (TOP + BOTTOM) / 2 + 60, k = Math.sin(state.t * 2.4), x = cx + k * 90;
    const head = (hx, dir, c, o) => { ctx.fillStyle = c; [0, 1, 2, 3].forEach(i => ctx.fillRect(hx + dir * i * 5 - (dir < 0 ? 5 : 0) - o, cy - 4 - (3 - i) * 5 - o, 5 + 2 * o, 8 + (3 - i) * 10 + 2 * o)); };
    for (const dir of [-1, 1]) { head(cx + dir * 150, dir, C.ink, 3); head(cx + dir * 150, dir, C.gold, 0); }
    ctx.fillStyle = C.ink; ctx.fillRect(x - 13, cy - 13, 26, 26); ctx.fillStyle = C.gold; ctx.fillRect(x - 10, cy - 10, 20, 20); ctx.fillStyle = '#fff3b8'; ctx.fillRect(x - 7, cy - 7, 6, 6);
  }
  /** Her face now: a frame of her strip, or null while it is not there. */
  function face() { const id = 'portrait.' + D.guide.portrait, sh = Art.sheet(id); return sh ? Art.get(id, Math.floor(state.t * tune.portrait_fps) % sh.cols) : null; }
  function wrapLines(str, maxW, size) {
    str = gendered(str); ctx.font = `${size}px ${FONT}`; const out = [];
    let line = '';
    for (const word of str.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
    out.push(line);
    return out;
  }
  function skipButton(x, y, w, h, key, size) {
    own.push({ x, y, w, h });
    const lesson = !isStart();
    UI.button(x, y, w, h, tr(armed > 0 ? 'tuto_skip_sure' : lesson && key === 'tuto_skip' ? 'tuto_skip_lesson' : key), skipClick, { size, tip: tr(lesson ? 'tuto_skip_lesson_tip' : 'tuto_skip_tip') });
  }
  function burst(x, y) {
    const cols = [C.gold, C.good, C.accent, '#fff3b8', '#7fd4ff'];
    for (let i = 0; i < 26; i++) { const a = i * 2.39996, v = 150 + (i * 53) % 190; bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, c: cols[i % cols.length], t: 0, s: 4 + (i % 3) * 2 }); }
  }

  /** She speaks: the screen dimmed, a band at the bottom with her portrait, the line written out. */
  function drawTalk(s) {
    const pg = pageOf(s), m = pg.show && marks[pg.show];
    dim(tune.tuto_dim, m ? grow(m, 5) : null);
    if (m) { pulse(m); arrowAt(m); }
    const bw = 780, tw = bw - 156 - 30, lines = wrapLines(pg.text, tw, 18);
    const bh = Math.max(132, 84 + lines.length * 25); // a third line stays clear of the page count under it
    let bx = 290, by = BOTTOM - 14 - bh;
    if (m && m.x < bx + bw + 8 && m.x + m.w > bx - 70 && m.y + m.h > by - 40 && m.y - 44 < by + bh) { // what she shows (the foot of the side panel) would lie under her band: it moves aside, or up
      if (m.x - 20 - bw >= 76) bx = m.x - 20 - bw; else by = TOP + 84;
    }
    const tx = bx + 156;
    UI.region(bx - 70, by - 40, bw + 70, bh + 40, null);
    if (!UI.nine('panel', bx, by, bw, bh)) UI.box(bx, by, bw, bh, C.bg, C.lineL);
    const f = face();
    if (f) { const k = 1.5; blit(f, bx - 62, by + bh - 10 - f.height * PX * k, k); }
    UI.label(D.guide.name, tx, by + 30, 19, C.gold, 'left'); text(isStart() ? D.guide.title : course().title, tx + UI.width(D.guide.name, 19, true) + 12, by + 31, 13, isStart() ? C.dim : C.accent, 'left');
    let left = Math.floor(cur.shown);
    lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; if (part) text(part, tx, by + 62 + i * 25, 18, C.text, 'left'); });
    const done = cur.shown >= pg.text.length;
    if (done && Math.sin(state.t * 7) > -0.3) UI.label(tr('tuto_next'), bx + bw - 26, by + bh - 22, 13, C.gold, 'right');
    text(`${cur.page + 1} / ${says(s).length}`, tx, by + bh - 22, 12, C.dim, 'left');
    skipButton(bx + bw - 158, by + 14, 136, 28, 'tuto_skip', 12);
  }
  /** The task: only what the arrow shows is lit, and her box says what to do, top left. */
  function drawTask(s, t) {
    const m = t && t.mark ? marks[t.mark] : null;
    if (m) { dim(tune.tuto_dim, grow(m, 5)); pulse(m); arrowAt(m); }
    else {
      dimBars(tune.tuto_dim);
      if (t && t.drag) slide();
      if (t && t.chop) { // the trees in view; when none is, the way to the nearest
        const seen = trees().filter(o => { const p = World.toScreen(o.tx * T + 8, o.ty * T + 8, 34); return p.x > 24 && p.x < W - 24 && p.y > TOP + 44 && p.y < BOTTOM - 4; });
        for (const o of seen.length ? seen : trees().slice(0, 1)) arrowOn(o.tx * T + 8, o.ty * T + 8, 34);
      }
      if (t && t.place && !t.spot.none) { lit(t.spot.tx, t.spot.ty, t.spot.w, t.spot.h); arrowOn((t.spot.tx + t.spot.w / 2) * T, (t.spot.ty + t.spot.h / 2) * T, 26); }
      if (t && t.tiles && t.spot) lit(t.spot.tx, t.spot.ty, t.spot.w, t.spot.h, true); // the place the path leads to, faint
      if (t && t.tiles) { for (const q of t.tiles) lit(q.tx, q.ty, 1, 1); const q = t.tiles[0]; arrowOn(q.tx * T + 8, q.ty * T + 8, 14); }
      if (t && t.sug && t.sug.foot) { const f = t.sug.foot; lit(f.tx, f.ty, f.w, f.h); arrowOn((f.tx + f.w / 2) * T, (f.ty + f.h / 2) * T, 26); } // where she suggests it: any other place will do
      if (t && t.sug && t.sug.tiles) { for (const q of t.sug.tiles) lit(q.tx, q.ty, 1, 1); const q = t.sug.tiles[Math.floor(t.sug.tiles.length / 2)]; arrowOn(q.tx * T + 8, q.ty * T + 8, 14); }
      if (t && t.building) { const r = World.bRect(t.building), p = World.toScreenIso(r.cx, r.y); arrow(clamp(p.x, 30, W - 30), clamp(p.y, TOP + 60, BOTTOM - 10), false); }
    }
    const pr = t && t.note ? { frac: t.frac, text: t.note } : t && t.hint ? { text: t.hint } : progress(s);
    const x = 10, y = TOP + 8, w = 452, tx = x + 84, tw = w - 84 - 16, lines = wrapLines(fill(s.task), tw, 15);
    const h = Math.max(84, 36 + lines.length * 20 + (pr ? 30 : 6));
    UI.region(x, y, w, h, null);
    UI.plate(x, y, w, h);
    if (nudge > 0) { ctx.fillStyle = `rgba(255,215,94,${nudge * 0.7})`; ctx.fillRect(x + 6, y + 6, w - 12, h - 12); } // a refused click: look here
    const f = face();
    if (f) { ctx.save(); ctx.beginPath(); ctx.rect(x + 10, y + 10, 66, 66); ctx.clip(); blit(f, x + 10, y + 10, 66 / (f.width * PX)); ctx.restore(); }
    const all = tasks(), n = all.indexOf(s) + 1;
    const head = isStart() ? `${D.guide.name} · ${tr('tuto_step', { n, all: all.length })}` : tr('tuto_lesson_step', { title: course().title, n, all: all.length });
    UI.label(isStart() || UI.width(head, 12, true) <= tw - 66 ? head : tr('tuto_lesson_step_short', { title: course().title, n, all: all.length }), tx, y + 20, 12, C.gold, 'left'); // a long title: without « Leçon », clear of the skip button
    lines.forEach((l, i) => UI.label(l, tx, y + 42 + i * 20, 15, C.text, 'left'));
    if (pr) {
      const py = y + 36 + lines.length * 20;
      if (pr.frac != null) UI.bar(tx, py + 4, pr.text ? 120 : tw, 12, pr.frac, C.gold);
      if (pr.text) text(pr.text, tx + (pr.frac != null ? 130 : 0), py + 11, 12, C.dim, 'left', true);
    }
    skipButton(x + w - 74, y + 8, 64, 22, 'tuto_skip_short', 11);
    if (cheer) { ctx.globalAlpha = clamp((1.3 - cheer.t) * 2, 0, 1); UI.label(tr('tuto_bravo'), x + w / 2, y + h + 26 - cheer.t * 22, 26, C.gold); ctx.globalAlpha = 1; }
  }
  /** Between lessons: her card, bottom left, offering the next one. */
  function drawOffer(l) {
    const x = 10, w = 384, h = 104, y = BOTTOM - 58 - h, bob = Math.round(Math.sin(state.t * 3) * 2);
    UI.region(x, y + bob, w, h, null);
    UI.plate(x, y + bob, w, h);
    const f = face();
    if (f) { ctx.save(); ctx.beginPath(); ctx.rect(x + 10, y + 10 + bob, 66, 66); ctx.clip(); blit(f, x + 10, y + 10 + bob, 66 / (f.width * PX)); ctx.restore(); }
    UI.label(`${D.guide.name} · ${tr('tuto_offer')}`, x + 86, y + 20 + bob, 12, C.gold, 'left');
    UI.label(l.title, x + 86, y + 42 + bob, 16, C.text, 'left');
    UI.button(x + 86, y + 62 + bob, 140, 32, tr('tuto_follow'), () => open(l.id, false), { primary: true, size: 14, tip: l.about });
    UI.button(x + 234, y + 62 + bob, 140, 32, tr('tuto_later'), () => later(l.id), { size: 13, tip: tr('tuto_later_tip') });
  }
  function draw() {
    if (running()) {
      if (!cur || cur.key !== keyOf()) enter(); // drawn before its first step: a save just loaded
      if (running() && cur) { const s = step(); if (cur.talk) drawTalk(s); else if (!cur.skip) drawTask(s, resolve()); }
    } else if (offer && scene === 'play') drawOffer(offer);
    for (const b of bits) { ctx.globalAlpha = clamp((1.2 - b.t) * 2, 0, 1); ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s); }
    ctx.globalAlpha = 1;
  }

  // ---- The Livre des leçons (the Village panel opens it) ----
  /** The book's body, from y down, in a scrolling box: a line per lesson, to follow or play again. Returns the y under it. */
  function book(x, y, w) {
    fix();
    if (params.has('bookscroll')) { UI.scrollTo('lessons', Number(params.get('bookscroll')) || 0); params.delete('bookscroll'); } // ?panel=lessons&bookscroll=900: the book scrolled down that far, for a screenshot
    const t = state.tuto, busy = running();
    y = UI.wrap(tr('book_help', { name: D.guide.name }), x, y, w, 13, C.dim, 17) + 6;
    UI.button(x, y, w, 32, tr(t.off ? 'book_off' : 'book_on', { name: D.guide.name }), () => { t.off = !t.off; calm = 0; }, { size: 13, on: !t.off, tip: tr('book_toggle_tip') }); y += 42;
    const row = (title, about, state0, btn) => {
      let size = 15; while (size > 11 && UI.width(title, size, true) > w - UI.width(tr('book_' + state0), 12, true) - 10) size--; // a long title leaves room for its state
      text(title, x, y + 10, size, state0 === 'locked' ? C.dim : C.gold, 'left', true);
      text(tr('book_' + state0), x + w, y + 10, 12, state0 === 'new' ? C.good : C.dim, 'right', true); y += 22;
      y = UI.wrap(about, x, y, w - (btn ? 112 : 0), 13, C.dim, 16);
      if (btn) UI.button(x + w - 104, y - 30, 104, 28, btn.label, btn.go, { size: 12, primary: btn.primary, disabled: btn.disabled });
      y += 10;
    };
    row(START.title, tr('book_start'), t.done ? 'seen' : 'now', null);
    for (const l of LESSONS) {
      const seen = !!t.seen[l.id], ready = holds(l.when), now = t.lesson === l.id;
      const st = now ? 'now' : seen ? 'seen' : ready ? 'new' : 'locked';
      const blocked = busy || (!l.raid && !!state.raid.active);
      const btn = st === 'locked' || now ? null : { label: tr(seen ? 'book_replay' : 'tuto_follow'), primary: !seen, disabled: blocked, go: () => open(l.id, seen) };
      row(l.title, l.about, st, btn);
    }
    return y;
  }

  /**
   * ?tuto=<step id>: a new game opened at that step of the start, the steps before it done for the
   * player (their goals reached the short way, their gifts given). For screenshots, and to test one
   * step. With &say=0 the step opens on its task; with &pick too, its building or the path tool is in hand.
   */
  function jump(id) {
    const n = D.steps.findIndex(s => s.id === id);
    if (n < 0 || !isStart()) return;
    while (state.tuto.step < n) {
      const s = step(); enter(); cur.talk = false;
      for (const e of s.point || []) {
        const [k, a] = split(e);
        if (k === 'chop') Village.gain('wood', s.goal.totals.wood);
        if (k === 'build') { const sp = spot(a); if (!sp.none) { for (const t of sp.path) { Village.gain('wood', 1); Village.pave(t.tx, t.ty, true); } Village.pay(Village.cost(a)); Village.place(a, sp.tx, sp.ty, true, true, sp.rot); } }
        if (k === 'pave') for (const t of cur.tiles) { Village.gain('wood', 1); Village.pave(t.tx, t.ty, true); }
        if (k === 'craft') state.hero.inv.push(a);
        if (k === 'mark' && a.startsWith('equip:')) state.hero.equip.weapon = a.slice(6);
        if (k === 'mark' && a.startsWith('fight:')) Quests.complete(Quests.mains.find(q => q.id === a.slice(6)), false);
      }
      for (const r in s.gift || {}) Village.gain(r, s.gift[r]);
      state.tuto.step++;
    }
    cur = null; ui.toasts.length = 0; ui.floats.length = 0;
    after();
  }
  /**
   * ?lesson=<id>: that lesson opened at once on the village the address makes (the start counted
   * done). With &say=0 its first step opens on its task, with &pick its card already in hand;
   * with &offer, not opened: her card offering it shows instead. &lstep=<step id> opens it at that
   * step (the steps before it are not played: the panel the address opened is kept, for a
   * screenshot); &replay plays it as from the book (she lends nothing).
   */
  function lessonNow(id) {
    fix(); state.tuto.done = true;
    if (byId(id) && !byId(id).raid && state.raid.active) { Object.assign(state.raid, { active: null, warned: false, from: null, siege: null, timer: tune.raid_interval }); Raid.touch(); } // the raid of a demo village would send the lesson away: it is called off
    if (params.has('offer')) { forced = byId(id); calm = 0; return; }
    const kept = { panel: ui.panel, sel: ui.sel };
    if (!open(id, params.has('replay'))) return;
    const n = byId(id).steps.findIndex(s => s.id === params.get('lstep'));
    if (n > 0) { state.tuto.lstep = n; Object.assign(ui, kept); }
    ui.toasts.length = 0;
    after();
  }
  function after() {
    if (params.get('say') === '0') { enter(); if (cur && step() && step().task && !cur.skip) cur.talk = false; } // &say=0: straight to the step's task, her lines skipped (a step with no task keeps them)
    if (params.has('pick') && cur) { // &pick: what the step builds or paves with already in hand, the pointer in the middle of the view
      const [k, a] = split((step().point || [''])[0]);
      if (k === 'build') { if (spot(a).path.some(t => !isPaved(t))) Object.assign(ui, { tool: 'path', bar: 'land' }); else ui.placing = a; } // the path tool first when her place needs a bit of path
      if (k === 'pick') { const tool = toolOf(a); if (tool) ui.tool = tool; else ui.placing = a; ui.bar = tabOf(a); }
      if (k === 'pave') { ui.tool = 'path'; ui.bar = 'land'; }
      mouse.x = 640; mouse.y = 330;
    }
  }

  /** For the checks: where the course is, what the arrow shows and the places named this frame. Players never see it. */
  function peek() {
    const c = course();
    return { course: c && c.id, step: c && step() && step().id, talk: !!(cur && cur.talk), show: c && cur && cur.talk ? pageOf(step()).show || null : null, target: c && cur ? resolve() : null, marks, offer: offer && offer.id, goal: c && step() ? step().goal : null, point: c && step() ? step().point : null };
  }

  return { running, active, begin, mark, click, keyOk, tileOk, hidesQuest, update, draw, jump, lessonNow, book, open, peek, lessons: LESSONS };
})();
