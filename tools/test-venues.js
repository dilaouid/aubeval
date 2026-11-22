// PROTOTYPE - NOT FOR PRODUCTION
// Tests of the places entered full screen (js/venue.js) and their mini-games (js/minigames.js and
// js/minigame-*.js): every place is whole, an old save gets the new places, a place without a track
// borrows one, a gift's duration. Its load() and play() are exported for the tests of later places.
// Run: node tools/test-venues.js (exit code 1 on a failure).
'use strict';
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const T = require('./i18n.js');

const ROOT = path.join(__dirname, '..');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/** Any colour asked of a palette stub is the same plain white: the tests never draw. */
const colours = () => new Proxy({}, { get: (o, k) => typeof k === 'string' ? '#ffffff' : undefined });

/**
 * The game's config, data, the real Venue, Minigames and Stones (and every js/minigame-*.js) in a sandbox.
 * Stubbed: UI (its colours only), PAL, text, tr (gives back the key), sfx, pressed (never),
 * rng (a fixed seed), Music's switches (CHEAP, params). There is no document: nothing is drawn.
 * `games` lists the js/minigame-*.js files that were loaded.
 */
function load() {
  let seed = 12345;
  const noop = () => {};
  const ctx = {
    console, Proxy, URLSearchParams,
    UI: { C: colours() }, PAL: colours(), ROOFS: new Proxy({}, { get: () => colours() }),
    text: noop, tr: k => k, sfx: noop, pressed: () => false,
    rng: () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296,
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    CHEAP: true, params: new URLSearchParams(''),
    scene: 'play', ui: {}, state: { buildings: [], raid: {} },
  };
  ctx.window = ctx; vm.createContext(ctx);
  const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  run('config.js');
  ctx.tune = {};
  for (const k in ctx.CONFIG) if (ctx.CONFIG[k] && typeof ctx.CONFIG[k] === 'object') ctx.tune[k] = ctx.CONFIG[k].value;
  for (const f of T.I18N.files) run('data/' + f + '.js');
  run('js/venue.js'); run('js/minigames.js'); run('js/stones.js');
  const games = fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^minigame-.+\.js$/.test(f)).sort();
  for (const f of games) run('js/' + f);
  run('js/music.js');
  const get = n => vm.runInContext(n, ctx);
  return { ctx, DATA: ctx.DATA, tune: ctx.tune, Venue: get('Venue'), Minigames: get('Minigames'), Music: get('Music'), Stones: get('Stones'), games };
}

/**
 * A whole game of a place, played by the game's own hand (its auto) at 1/60 s a step, as
 * Venue.preview does: { level, bot ({ pace, err }), secs (at most), L (a sandbox from load() to
 * play in; a new one otherwise) }. Its medal is reckoned as
 * Venue's finish() does. Gives back { score, done, lost, medal }.
 */
function play(id, opts) {
  const o = Object.assign({ level: 0, bot: { pace: 0.5, err: 0 }, secs: 600 }, opts), L = o.L || load();
  const d = L.DATA.venues[id], step = 1 / 60, noop = () => {};
  const g = L.Minigames.make(id, { level: o.level, d, react: noop, away: noop });
  for (let i = 0; i < 60 * o.secs && !g.done; i++) { g.auto(step, o.bot); g.update(step, { act: false, alt: false }); }
  const score = Math.max(0, Math.round(g.score));
  let medal = 0;
  if (!g.lost) d.medals.forEach((m, i) => { if (score >= m) medal = i + 1; });
  return { score, done: g.done, lost: g.lost, medal };
}

test('every place of venueOrder has its building, its keeper, its game, and well-formed numbers', () => {
  const { DATA, Minigames } = load();
  assert.ok(DATA.venueOrder.length > 0, 'venueOrder is empty');
  for (const id of DATA.venueOrder) {
    const v = DATA.venues[id];
    assert.ok(v, id + ': no DATA.venues entry');
    assert.ok(DATA.buildings[id], id + ': no building');
    assert.ok(DATA.keepers[v.keeper], id + ': no keeper ' + v.keeper);
    assert.ok(Minigames.has(id), id + ': no game');
    assert.strictEqual(v.medals.length, 3, id + ': medals');
    assert.ok(v.medals[0] < v.medals[1] && v.medals[1] < v.medals[2], id + ': medals not strictly rising');
    assert.strictEqual(v.pop.length, 4, id + ': pop');
    for (const key in v.buffs) {
      assert.strictEqual(v.buffs[key].length, 4, id + ': buffs.' + key);
      assert.strictEqual(v.buffs[key][0], 0, id + ': buffs.' + key + ' does not start at 0');
      assert.ok(DATA.venueBuffs[key], id + ': no DATA.venueBuffs.' + key);
    }
  }
});

// « Jouer » shows the game's cards (js/venue.js drawHowto): a card's words hold on two short lines even
// four cards across, the keeper's line on one or two, the play button's tip stays a sentence
const CARD_MAX = 42, SAY_MAX = 90, HOW_MAX = 110;
test('a place\'s cards, line and tip stay short, in the three languages', () => {
  const { DATA } = load(), long = [];
  const fr = id => { const v = DATA.venues[id]; return { how: v.how, say: v.say, cards: v.steps.concat(v.news.map(n => n.text)) }; };
  const langs = { fr };
  for (const lang of ['en', 'es']) {
    const layer = Object.assign({}, ...Object.values(T.readLayers(lang))), at = (id, k) => layer['venues.' + id + '.' + k];
    langs[lang] = id => { const v = DATA.venues[id]; return { how: at(id, 'how'), say: at(id, 'say'),
      cards: v.steps.map((_, i) => at(id, 'steps[' + i + ']')).concat(v.news.map(n => at(id, 'news[' + n.id + '].text'))) }; };
  }
  for (const id of DATA.venueOrder) for (const lang in langs) {
    const t = langs[lang](id), where = id + ' (' + lang + ')';
    assert.ok(t.how && t.say && t.cards.every(Boolean), where + ': a text is missing');
    if (t.how.length > HOW_MAX) long.push(where + ' how ' + t.how.length);
    if (t.say.length > SAY_MAX) long.push(where + ' say ' + t.say.length);
    for (const c of t.cards) if (c.length > CARD_MAX) long.push(where + ' « ' + c + ' » ' + c.length);
  }
  assert.deepStrictEqual(long, [], 'too long: ' + long.join(', '));
});

test('an unknown place has no game', () => {
  const { Minigames } = load();
  assert.strictEqual(Minigames.has('nowhere'), false);
  assert.throws(() => Minigames.make('nowhere', {}), /no game for nowhere/);
});

test('a save from before a place existed gets it, and keeps the others', () => {
  const { DATA, Venue } = load();
  const data = { venue: { v: 1, streak: { cafe: 3 }, wait: { cafe: 12 }, best: { cafe: 40 }, played: { cafe: 5 }, met: { cafe: 1 }, chat: { cafe: 2 }, buffs: {} } };
  Venue.adopt(data);
  const s = data.venue;
  for (const id of DATA.venueOrder) for (const k of ['streak', 'wait', 'best', 'played', 'met', 'chat']) assert.strictEqual(typeof s[k][id], 'number', k + '.' + id);
  assert.strictEqual(s.streak.cafe, 3);
  assert.strictEqual(s.best.cafe, 40);
  assert.strictEqual(s.wait.cafe, 12);
});

test('a place with no track of its own borrows one', () => {
  const { DATA, Music } = load();
  assert.strictEqual(Music.trackOf('cafe'), 'cafe');
  DATA.venues.x = { music: 'forge' };
  assert.strictEqual(Music.trackOf('x'), 'forge');
  DATA.venues.x = {};
  assert.strictEqual(Music.trackOf('x'), 'world');
});

test('a gift lasts venue_buff_time', () => {
  const { Venue, tune } = load();
  assert.strictEqual(Venue.giftTime('cafe', 'pop'), tune.venue_buff_time);
});

// ---- La Loge des bâtisseurs (the building, kept by Aveline) ----
test('the lodge is a building one can place once, from the rank Ville', () => {
  const { DATA } = load(), b = DATA.buildings.lodge;
  assert.ok(b, 'no DATA.buildings.lodge');
  for (const k of ['name', 'card', 'sprite', 'desc']) assert.ok(typeof b[k] === 'string' && b[k].length > 0, 'lodge.' + k);
  assert.strictEqual(b.w, 2); assert.strictEqual(b.h, 2);
  assert.deepStrictEqual(Object.assign({}, b.cost), { planks: 60, stone: 60, gold: 150 });
  assert.strictEqual(b.unique, true, 'not unique');
  assert.strictEqual(b.unlock && b.unlock.rank, 2, 'not opened at the rank Ville');
  assert.strictEqual(b.keeper, 'guide');
  assert.ok(DATA.buildOrder.includes('lodge'), 'not in DATA.buildOrder');
  const city = DATA.buildTabs.find(t => t.id === 'city').items;
  assert.strictEqual(city.indexOf('lodge'), city.indexOf('market') + 1, 'not right after the market in the city tab');
});

test('Aveline keeps it', () => {
  const { DATA } = load();
  assert.strictEqual(DATA.keepers.guide && DATA.keepers.guide.name, 'Aveline');
});

test('each level of the lodge adds lodge_level_time to its gift, and to no other', () => {
  const L = load(), { Venue, DATA } = L;
  DATA.venues.lodge = { perLevel: 'lodge_level_time' };
  L.ctx.state.buildings = [{ kind: 'lodge', lvl: 1 }];
  assert.strictEqual(Venue.giftTime('lodge', 'build'), 300, 'level 1');
  L.ctx.state.buildings = [{ kind: 'lodge', lvl: 15 }];
  assert.strictEqual(Venue.giftTime('lodge', 'build'), 580, 'level 15');
  assert.strictEqual(Venue.giftTime('cafe', 'pop'), 300, 'another place');
});

test('a gift won with no lodge standing lasts the plain time', () => {
  const L = load(), { Venue, DATA } = L;
  DATA.venues.lodge = { perLevel: 'lodge_level_time' };
  L.ctx.state.buildings = [];
  assert.strictEqual(Venue.giftTime('lodge', 'build'), 300);
});

// ---- Les avantages de la Loge (Venue.lodgePerks: what a standing lodge does, whatever the gift) ----
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, (msg || '') + ': ' + a + ' is not ' + b);
const perks = (L, lvl, extra) => { L.ctx.state.buildings = lvl == null ? [] : [Object.assign({ kind: 'lodge', lvl }, extra)]; return plain(L.Venue.lodgePerks()); };

test('lodge perks: none without a lodge', () => {
  const L = load();
  assert.deepStrictEqual(perks(L, null), { plans: 0, repair: 0, refund: 0 });
  L.ctx.state.buildings = undefined;
  assert.deepStrictEqual(plain(L.Venue.lodgePerks()), { plans: 0, repair: 0, refund: 0 }, 'no buildings at all');
  assert.deepStrictEqual(plain(L.Venue.lodgePerks(0)), { plans: 0, repair: 0, refund: 0 }, 'level 0');
});

test('lodge perks: level 1 and level 15', () => {
  const L = load(), p1 = perks(L, 1), p15 = perks(L, 15);
  near(p1.plans, 0.02, 'plans 1'); near(p1.repair, 0.5 / 15, 'repair 1'); near(p1.refund, 0.04 / 15, 'refund 1');
  near(p15.plans, 0.09, 'plans 15'); near(p15.repair, 0.5, 'repair 15'); near(p15.refund, 0.04, 'refund 15');
  const q = L.Venue.lodgePerks(15);
  near(q.plans, 0.09, 'plans given a level'); near(q.repair, 0.5, 'repair given a level'); near(q.refund, 0.04, 'refund given a level');
});

test('lodge perks: no more past level 15, and a damaged lodge keeps them', () => {
  const L = load(), p15 = perks(L, 15);
  assert.deepStrictEqual(perks(L, 40), p15, 'level 40');
  assert.deepStrictEqual(perks(L, 15, { damaged: true }), p15, 'damaged');
});

// ---- La fournée (bakery) ----
/** A new game of a place at `level`, in the sandbox L, its keeper's words thrown away. */
const start = (L, id, level) => L.Minigames.make(id, { level, d: L.DATA.venues[id], react: () => {}, away: () => {} });

test('la fournée: a flawless baker gets gold, and bronze at least deep in a streak', () => {
  const bot = { pace: 0.05, err: 0 };
  const r0 = play('bakery', { level: 0, bot }), r10 = play('bakery', { level: 10, bot });
  assert.strictEqual(r0.medal, 3, 'level 0: ' + JSON.stringify(r0));
  assert.ok(r10.medal >= 1, 'level 10: ' + JSON.stringify(r10));
});

test('la fournée: doing nothing loses the batch', () => {
  const L = load(), g = start(L, 'bakery', 0);
  for (let i = 0; i < 60 * 36 && !g.done; i++) g.update(1 / 60, { act: false, alt: false });
  assert.strictEqual(g.lost, true, 'not lost');
  assert.strictEqual(g.done, true, 'not done');
  assert.ok(typeof g.why === 'string' && g.why.length > 0, 'no why');
});

test('la fournée: ends on its own', () => {
  const L = load(), r = play('bakery', { L, bot: { pace: 0.05, err: 0 }, secs: L.tune.bakery_time + 1 });
  assert.strictEqual(r.done, true, 'not done by ' + (L.tune.bakery_time + 1) + ' s');
  assert.strictEqual(r.lost, false, 'lost');
});

test('la fournée: one press, one loaf', () => {
  const L = load(), g = start(L, 'bakery', 0);
  g.ovens[0].state = 'baking'; g.ovens[0].t = 0.6;
  L.ctx.pressed = k => k === 'Digit1';
  const before = g.score;
  for (let i = 0; i < 30; i++) g.update(1 / 60, { act: false, alt: false });
  L.ctx.pressed = () => false;
  assert.ok(g.score - before === 2 || g.score - before === 3, 'score went up by ' + (g.score - before));
});

test('la fournée: a pale loaf is worth nothing, a golden one 2, the heart of the window 3, a dark one 1', () => {
  const L = load(), g = start(L, 'bakery', 0), T = L.tune, c = (T.bakery_gold_from + T.bakery_gold_to) / 2;
  const worth = t => { g.ovens[0].state = 'baking'; g.ovens[0].t = t; const s = g.score; g.take(0); return g.score - s; };
  assert.strictEqual(worth(0.3), 0, 'pale');
  assert.strictEqual(worth(T.bakery_gold_from + 0.01), 2, 'edge of the window');
  assert.strictEqual(worth(c), 3, 'heart of the window');
  assert.strictEqual(worth(0.9), 1, 'dark');
  assert.strictEqual(g.ovens[0].state, 'empty', 'a loaf taken leaves its oven empty');
});

// ---- Pain chaud (the bakery's gift) ----
/** The real js/city.js in the sandbox L, over a village of one house of the first class at normal tax. */
function loadCity(L) {
  const cls = L.DATA.classes[0];
  L.ctx.Village = { classOf: () => cls };
  L.ctx.state.city = { tax: { [cls.id]: 1 }, pop: 0 };
  L.ctx.state.prestige = { tree: {} };
  L.ctx.state.venue = L.Venue.fresh();
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/city.js'), 'utf8'), L.ctx, { filename: 'js/city.js' });
  return vm.runInContext('City', L.ctx);
}

test('pain chaud: a fed house\'s satisfaction climbs 60 % more a meal with the gold gift, and no faster without', () => {
  const L = load(), City = loadCity(L), b = { kind: 'house', cls: 0 };
  const fed = City.mealSat(b, true), hungry = City.mealSat(b, false);
  assert.ok(fed > 0, 'a meal gives nothing');
  L.ctx.state.venue.buffs.rise = { v: 0.6, left: 100, total: 300, from: 'bakery' };
  assert.strictEqual(L.Venue.buff('rise'), 0.6);
  assert.ok(Math.abs(City.mealSat(b, true) - 1.6 * fed) < 1e-12, 'with the gift: ' + City.mealSat(b, true) + ', without: ' + fed);
  assert.strictEqual(City.mealSat(b, false), hungry, 'a missed meal changed');
});

// ---- Parade ! (barracks) ----
const STEP = 1 / 60, NO_INPUT = { act: false, alt: false };

test('parade: a flawless guard gets gold, and bronze at least deep in a streak', () => {
  const bot = { pace: 0.05, err: 0 };
  const r0 = play('barracks', { level: 0, bot }), r10 = play('barracks', { level: 10, bot });
  assert.strictEqual(r0.medal, 3, 'level 0: ' + JSON.stringify(r0));
  assert.ok(r10.medal >= 1, 'level 10: ' + JSON.stringify(r10));
  // deep in a streak there are feints: the flawless hand waits each one out and is never hit
  const L = load(), g = start(L, 'barracks', 10);
  for (let i = 0; i < 60 * 40 && !g.done; i++) { g.auto(STEP, bot); g.update(STEP, NO_INPUT); }
  assert.ok(g.feints > 0, 'no feint at level 10');
  assert.strictEqual(g.hits, 0, 'the flawless hand was hit ' + g.hits + ' times');
});

test('parade: standing still loses the drill', () => {
  const L = load(), g = start(L, 'barracks', 0);
  for (let i = 0; i < 60 * 36 && !g.done; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.lost, true, 'not lost');
  assert.strictEqual(g.done, true, 'not done');
  assert.ok(typeof g.why === 'string' && g.why.length > 0, 'no why');
});

test('parade: ends on its own', () => {
  const L = load(), r = play('barracks', { L, bot: { pace: 0.05, err: 0 }, secs: L.tune.barracks_time + 1 });
  assert.strictEqual(r.done, true, 'not done by ' + (L.tune.barracks_time + 1) + ' s');
  assert.strictEqual(r.lost, false, 'lost');
});

test('parade: one press, one parry', () => {
  const L = load(), g = start(L, 'barracks', 0);
  g.blow = { side: 'up', t: 0.5 };
  L.ctx.pressed = k => k === 'ArrowUp'; // held down: the stub says so at every step
  // held 90 steps: the drill keeps its beat, so the next blow is called only when this one would have landed, plus the gap
  for (let i = 0; i < 90; i++) g.update(STEP, NO_INPUT);
  L.ctx.pressed = () => false;
  assert.ok(g.blow, 'no blow came after the parry: the test proves nothing');
  assert.strictEqual(g.parries, 1, 'parries');
  assert.strictEqual(g.hits, 0, 'the held key counted against the next blow');
  assert.strictEqual(g.score, 2, 'score');
});

test('parade: the right side in time is worth 2, in the first third 3; the wrong side or too late is a hit', () => {
  const L = load(), g = start(L, 'barracks', 0);
  const worth = (blow, side) => { g.blow = blow; const s = g.score; g.parry(side); return g.score - s; };
  assert.strictEqual(worth({ side: 'right', t: 0.1 }, 'right'), 3, 'quick');
  assert.strictEqual(g.blow, null, 'a parried blow is over');
  assert.strictEqual(worth({ side: 'right', t: 0.6 }, 'right'), 2, 'in time');
  assert.strictEqual(g.hits, 0);
  assert.strictEqual(worth({ side: 'right', t: 0.6 }, 'left'), 0, 'wrong side');
  assert.strictEqual(g.hits, 1, 'the wrong side is a hit');
  g.blow = { side: 'down', t: 0.99 };
  for (let i = 0; i < 5; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.hits, 2, 'a blow not parried is a hit');
  const s = g.score; g.parry('down');
  assert.strictEqual(g.score, s, 'a parry after the blow landed is worth nothing');
  assert.strictEqual(g.hits, 2, 'a parry with no blow coming is no hit');
});

test('parade: who parries the first side of a feint is hit; who waits parries', () => {
  const L = load(), g = start(L, 'barracks', 2);
  g.blow = { side: 'up', t: 0.1, feint: { at: 0.5, to: 'left' } };
  g.parry('up');
  assert.strictEqual(g.hits, 1, 'parrying the side first called');
  g.blow = { side: 'up', t: 0.1, feint: { at: 0.5, to: 'left' } };
  for (let i = 0; i < 120 && g.blow && g.blow.side !== 'left'; i++) g.update(STEP, NO_INPUT);
  assert.ok(g.blow && g.blow.side === 'left', 'the feint never turned');
  const s = g.score; g.parry('left');
  assert.strictEqual(g.score - s, 2, 'waiting it out');
  assert.strictEqual(g.hits, 1);
});

// ---- Bien drillés (the barracks' gift) ----
/** The real js/units.js in the sandbox L, with no barracks and no city bonus. */
function loadUnits(L) {
  L.ctx.City = { bonus: () => 0 };
  L.ctx.state.units = [];
  L.ctx.state.venue = L.Venue.fresh();
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/units.js'), 'utf8'), L.ctx, { filename: 'js/units.js' });
  return vm.runInContext('Units', L.ctx);
}

test('bien drillés: a soldier deals 30 % more with the gold gift, has the same health, and deals the same without', () => {
  const L = load(), Units = loadUnits(L), u = { kind: 'militia' };
  const atk = Units.atkOf('militia'), hp = Units.maxHp(u);
  assert.strictEqual(atk, L.DATA.units.militia.atk * Units.drill(), 'without the gift');
  L.ctx.state.venue.buffs.soldier = { v: 0.3, left: 100, total: 300, from: 'barracks' };
  assert.strictEqual(L.Venue.buff('soldier'), 0.3);
  assert.ok(Math.abs(Units.atkOf('militia') - 1.3 * atk) < 1e-12, 'with the gift: ' + Units.atkOf('militia') + ', without: ' + atk);
  assert.strictEqual(Units.maxHp(u), hp, 'health changed');
});

// ---- The stones of the lodge (js/stones.js) ----
/** A seeded draw in 0..1 of its own, so that each seed gives the same stones every run. */
function seeded(s) {
  let a = (s * 2654435761 + 1) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Whether the cells touch one another through their sides, all of them. */
function connected(cells) {
  const key = c => c[0] + ',' + c[1], all = new Set(cells.map(key)), seen = new Set([key(cells[0])]), todo = [cells[0]];
  while (todo.length) {
    const [x, y] = todo.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (all.has(k) && !seen.has(k)) { seen.add(k); todo.push([x + dx, y + dy]); } }
  }
  return seen.size === all.size;
}
const LODGE_RAMP = L => L.DATA.venues.lodge.ramp;

test('stones: a shape of n cells is connected and has n cells', () => {
  const { Stones } = load();
  for (let n = 4; n <= 7; n++) for (let s = 0; s < 500; s++) {
    const c = Stones.shape(n, seeded(s));
    assert.strictEqual(c.length, n, 'n=' + n + ' seed ' + s + ': ' + JSON.stringify(c));
    assert.strictEqual(new Set(c.map(p => p.join(','))).size, n, 'a cell twice: ' + JSON.stringify(c));
    assert.ok(connected(c), 'not connected: ' + JSON.stringify(c));
  }
});

test('stones: four turns bring a stone back, a turned stone fits, a mirrored one does not unless it is its own mirror', () => {
  const { Stones } = load();
  let chiral = 0;
  for (let s = 0; s < 300; s++) {
    const c = Stones.shape(4 + s % 4, seeded(s));
    let t = c;
    for (let i = 0; i < 4; i++) { t = Stones.turn(t); if (i < 3) assert.ok(Stones.fits(c, t), 'a turned stone does not fit'); }
    assert.ok(Stones.same(t, c), 'four turns do not bring it back: ' + JSON.stringify(c));
    const m = Stones.mirror(c), own = [0, 1, 2, 3].some(k => { let u = m; for (let i = 0; i < k; i++) u = Stones.turn(u); return Stones.same(u, c); });
    assert.strictEqual(Stones.fits(c, m), own, 'mirror of ' + JSON.stringify(c));
    if (!own) chiral++;
  }
  assert.ok(chiral > 50, 'too few shapes that are not their own mirror: ' + chiral);
  // the S and the Z of four cells: each the mirror of the other, neither fits the other; the O is its own mirror
  const S = [[1, 0], [2, 0], [0, 1], [1, 1]], Z = [[0, 0], [1, 0], [1, 1], [2, 1]], O = [[0, 0], [1, 0], [0, 1], [1, 1]];
  assert.ok(Stones.same(Stones.mirror(S), Z));
  assert.strictEqual(Stones.fits(S, Z), false);
  assert.ok(Stones.fits(O, Stones.mirror(O)));
  assert.ok(Stones.same([[5, 5], [6, 5]], [[0, 0], [1, 0]]), 'same up to a move');
  assert.strictEqual(Stones.same([[0, 0], [1, 0]], [[0, 0], [0, 1]]), false, 'a turn is not the same');
});

test('stones: in every round exactly one of the four stones fits', () => {
  const L = load(), { Stones } = L, ramp = LODGE_RAMP(L);
  for (let lvl = 0; lvl <= 10; lvl++) for (let s = 0; s < 500; s++) {
    const r = Stones.round(lvl, ramp, seeded(s * 31 + lvl)), at = 'level ' + lvl + ' seed ' + s;
    assert.strictEqual(r.stones.length, 4, at);
    const n = Math.min(ramp.cellsMax, ramp.cells + Math.floor(lvl / ramp.cellsEvery));
    assert.strictEqual(r.hole.length, n, at + ': hole of ' + r.hole.length);
    const fit = r.stones.map((st, i) => Stones.fits(r.hole, st) ? i : -1).filter(i => i >= 0);
    assert.deepStrictEqual(Array.from(fit), [r.right], at + ': fit ' + JSON.stringify(fit) + ', right ' + r.right);
    for (const st of r.stones) assert.ok(connected(st), at + ': a stone in pieces');
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(!Stones.fits(r.stones[i], r.stones[j]), at + ': two stones are the same piece turned');
  }
});

test('stones: a round ends, with one stone that fits, even on a draw that always says the same', () => {
  const L = load(), { Stones } = L, ramp = LODGE_RAMP(L);
  for (const v of [0, 0.5, 0.999999]) for (let lvl = 0; lvl <= 10; lvl++) {
    const r = Stones.round(lvl, ramp, () => v), at = 'draw ' + v + ' level ' + lvl;
    assert.deepStrictEqual(Array.from(r.stones.map((st, i) => Stones.fits(r.hole, st) ? i : -1).filter(i => i >= 0)), [r.right], at);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(!Stones.fits(r.stones[i], r.stones[j]), at + ': two stones are the same piece');
  }
});

test('stones: from the first win the stones are shown turned, from the third one of the wrong ones is the mirror of the right one', () => {
  const L = load(), { Stones } = L, ramp = LODGE_RAMP(L);
  const mirrored = r => r.stones.some((st, i) => i !== r.right && Stones.fits(Stones.mirror(r.hole), st));
  const own = r => Stones.fits(r.hole, Stones.mirror(r.hole));
  let turned = 0, checked = 0, mirrorEarly = 0, rounds = 0;
  for (let s = 0; s < 500; s++) {
    const r0 = Stones.round(0, ramp, seeded(s));
    assert.ok(Stones.same(r0.hole, r0.stones[r0.right]), 'seed ' + s + ': the right stone is turned before the first win');
    if (!own(r0) && mirrored(r0)) mirrorEarly++;
    rounds++;
    const r1 = Stones.round(ramp.turnFrom, ramp, seeded(s));
    if (!Stones.same(r1.hole, r1.stones[r1.right])) turned++;
    const r3 = Stones.round(ramp.mirrorFrom, ramp, seeded(s));
    if (own(r3)) continue;
    checked++;
    assert.ok(mirrored(r3), 'seed ' + s + ': no mirror of ' + JSON.stringify(r3.hole) + ' in ' + JSON.stringify(r3.stones));
  }
  assert.ok(turned > 300, 'the right stone is shown turned in only ' + turned + ' rounds of 500');
  assert.ok(checked > 200, 'too few shapes that are not their own mirror: ' + checked);
  assert.ok(mirrorEarly < rounds, 'a mirror in every round already before the third win');
});

// ---- La bonne pierre (lodge) ----
test('la bonne pierre: a sharp eye gets gold, and bronze at least deep in a streak', () => {
  const bot = { pace: 0.05, err: 0 };
  const r0 = play('lodge', { level: 0, bot }), r5 = play('lodge', { level: 5, bot }), r10 = play('lodge', { level: 10, bot });
  assert.strictEqual(r0.medal, 3, 'level 0: ' + JSON.stringify(r0));
  assert.ok(r5.medal >= 1, 'level 5: ' + JSON.stringify(r5));
  assert.ok(r10.medal >= 1, 'level 10: ' + JSON.stringify(r10));
});

test('la bonne pierre: choosing nothing ends with no medal', () => {
  const L = load(), g = start(L, 'lodge', 0);
  for (let i = 0; i < 60 * 40 && !g.done; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.done, true, 'not done');
  assert.ok(g.score < L.DATA.venues.lodge.medals[0], 'a medal for nothing: ' + g.score);
});

test('la bonne pierre: ends on its own', () => {
  const L = load(), r = play('lodge', { L, bot: { pace: 0.05, err: 0 }, secs: L.tune.lodge_time + 1 });
  assert.strictEqual(L.tune.lodge_time, 36);
  assert.strictEqual(r.done, true, 'not done by ' + (L.tune.lodge_time + 1) + ' s');
  assert.strictEqual(r.lost, false, 'lost');
});

test('la bonne pierre: one press, one stone', () => {
  const L = load(), g = start(L, 'lodge', 0);
  for (let i = 0; i < 60 && !g.round; i++) g.update(STEP, NO_INPUT);
  assert.ok(g.round, 'no hole to fill');
  const key = 'Digit' + (g.round.right + 1);
  L.ctx.pressed = k => k === key; // held down: the stub says so at every step
  for (let i = 0; i < 120; i++) g.update(STEP, NO_INPUT);
  L.ctx.pressed = () => false;
  assert.strictEqual(g.set, 1, 'stones set');
  assert.strictEqual(g.strikes, 0, 'the held key counted against the next hole');
  assert.strictEqual(g.score, 1, 'score');
  // by the mouse: choose() is what each of the four buttons calls
  for (let i = 0; i < 60 && !g.round; i++) g.update(STEP, NO_INPUT);
  g.choose(g.round.right);
  assert.strictEqual(g.set, 2, 'a click sets a stone');
  g.choose(0); g.choose(1); // while the stone goes in, nothing else counts
  assert.strictEqual(g.set, 2); assert.strictEqual(g.strikes, 0);
});

test('la bonne pierre: four wrong stones bring the wall down', () => {
  const L = load(), g = start(L, 'lodge', 0);
  let tries = 0;
  while (!g.done && tries++ < 200) {
    for (let i = 0; i < 60 && !g.round; i++) g.update(STEP, NO_INPUT);
    const r = g.round, wrong = [0, 1, 2, 3].find(i => i !== r.right && !(r.tried && r.tried[i]));
    if (wrong === undefined) { g.choose(r.right); continue; }
    g.choose(wrong); g.update(STEP, NO_INPUT);
  }
  assert.strictEqual(g.strikes, L.tune.lodge_strikes, 'strikes');
  assert.strictEqual(g.lost, true, 'not lost');
  assert.strictEqual(g.done, true, 'not done');
  assert.ok(typeof g.why === 'string' && g.why.length > 0, 'no why');
});

test('la bonne pierre: a stone tried once is no second fault, and the chain falls on a fault or a slow stone', () => {
  const L = load(), T = L.tune, g = start(L, 'lodge', 0);
  const next = () => { for (let i = 0; i < 60 && !g.round; i++) g.update(STEP, NO_INPUT); return g.round; };
  const wrong = next().right === 0 ? 1 : 0;
  g.choose(wrong); g.choose(wrong);
  assert.strictEqual(g.strikes, 1, 'the same wrong stone twice');
  // quick right stones: the chain grows, and from lodge_chain on each is worth 2
  let s = g.score;
  for (let k = 1; k <= T.lodge_chain + 1; k++) { g.choose(next().right); assert.strictEqual(g.chain, k, 'chain'); }
  assert.strictEqual(g.score - s, T.lodge_chain - 1 + 2 * 2, 'worth');
  g.choose(next().right === 0 ? 1 : 0);
  assert.strictEqual(g.chain, 0, 'a fault breaks the chain');
  g.choose(g.round.right); next(); g.choose(g.round.right);
  assert.strictEqual(g.chain, 2);
  next();
  for (let i = 0; i < 60 * (T.lodge_chain_gap + 0.5); i++) g.update(STEP, NO_INPUT);
  s = g.score; g.choose(g.round.right);
  assert.strictEqual(g.chain, 1, 'a slow stone starts the chain over');
  assert.strictEqual(g.score - s, 1);
});

test('la bonne pierre: a hand that errs sometimes scores less than a sharp eye', () => {
  const sharp = play('lodge', { level: 5, bot: { pace: 0.8, err: 0 } }), errs = play('lodge', { level: 5, bot: { pace: 0.8, err: 0.15 } });
  assert.ok(errs.score < sharp.score, 'sharp ' + JSON.stringify(sharp) + ', errs ' + JSON.stringify(errs));
});

// ---- Plans d'Aveline (the lodge's gift) ----
/** The real js/city.js and js/village.js in the sandbox L, over a village with nothing built yet. */
function loadVillage(L) {
  const City = loadCity(L);
  L.ctx.MapGen = { pickSeed: s => s, SEED_MAX: 1e6 };
  L.ctx.state.buildings = [];
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/village.js'), 'utf8'), L.ctx, { filename: 'js/village.js' });
  return { City, Village: vm.runInContext('Village', L.ctx) };
}
const gift = (L, v) => { L.ctx.state.venue.buffs.build = { v, left: 100, total: 300, from: 'lodge' }; };
const plain = o => JSON.parse(JSON.stringify(o));

test('plans d\'Aveline: a building and an upgrade cost 15 % less with the gold gift, and the same without', () => {
  const L = load(), { Village } = loadVillage(L), up = { kind: 'house', lvl: 3 };
  assert.strictEqual(L.Venue.buff('build'), 0);
  const c0 = plain(Village.cost('house')), u0 = plain(Village.upgradeCost(up));
  const T = L.tune, B = L.DATA.buildings.house;
  const full = k => { const o = {}; for (const r in B.cost) o[r] = Math.max(1, Math.ceil(B.cost[r] * k)); return o; };
  assert.deepStrictEqual(c0, full(T.cost_scale), 'without the gift, a house is not what it was');
  assert.deepStrictEqual(u0, full(T.upgrade_cost_base * Math.pow(T.upgrade_cost_growth, 2) * T.cost_scale), 'without the gift, an upgrade is not what it was');
  gift(L, 0.15);
  assert.strictEqual(L.Venue.buff('build'), 0.15);
  const less = k => { const o = {}; for (const r in B.cost) o[r] = Math.max(1, Math.ceil(B.cost[r] * k * 0.85)); return o; };
  assert.deepStrictEqual(plain(Village.cost('house')), less(T.cost_scale), 'a house with the gift');
  assert.deepStrictEqual(plain(Village.upgradeCost(up)), less(T.upgrade_cost_base * Math.pow(T.upgrade_cost_growth, 2) * T.cost_scale), 'an upgrade with the gift');
  assert.ok(Village.cost('house').wood < c0.wood, 'the wood of a house did not go down'); // 6 planks round back up to 6
  // the gift runs out: the price is back to what it was
  L.ctx.state.venue.buffs.build.left = 0;
  assert.deepStrictEqual(plain(Village.cost('house')), c0, 'after the gift');
  // a price of 1 stays 1
  assert.deepStrictEqual(plain(Village.scaleCost({ gold: 1 }, 0.85)), { gold: 1 });
});

test('plans d\'Aveline: a great work\'s foundations and stages cost the same', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings;
  const works = Object.keys(B).filter(k => B[k].monument);
  assert.ok(works.includes('cathedral'), 'no cathedral');
  const before = works.map(k => [plain(Village.cost(k)), plain(Village.upgradeCost({ kind: k, lvl: 1 })), plain(Village.upgradeCost({ kind: k, lvl: 3 }))]);
  gift(L, 0.15);
  works.forEach((k, i) => assert.deepStrictEqual([plain(Village.cost(k)), plain(Village.upgradeCost({ kind: k, lvl: 1 })), plain(Village.upgradeCost({ kind: k, lvl: 3 }))], before[i], k));
});

test('plans d\'Aveline: nothing is refunded for more than it was paid', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings;
  gift(L, 0.15);
  const before = {};
  for (const k of L.DATA.buildOrder) {
    if (!B[k]) continue;
    const paid = Village.cost(k), back = Village.refund({ kind: k });
    for (const r in back) assert.ok(back[r] <= paid[r], k + ': ' + r + ' refunded ' + back[r] + ', paid ' + paid[r]);
    before[k] = plain(back);
  }
  L.ctx.state.venue.buffs.build.left = 0;
  for (const k in before) assert.deepStrictEqual(plain(Village.refund({ kind: k })), before[k], k + ': the refund changed with the gift');
});

// ---- The lodge's standing effects, in the prices (js/village.js) ----
const withLodge = (L, lvl, extra) => { L.ctx.state.buildings = lvl ? [Object.assign({ uid: 1, kind: 'lodge', lvl, x: 0, y: 0 }, extra)] : []; };

test('lodge: a standing lodge makes buildings and upgrades cheaper, up to a cap with the gift', () => {
  const L = load(), { Village } = loadVillage(L), T = L.tune, B = L.DATA.buildings.chapel, up = { kind: 'chapel', lvl: 3 }; // a dear building: the lodge's one-unit minimum never binds on it
  const cost = k => plain(Village.scaleCost(B.cost, k * T.cost_scale));
  const upCost = k => plain(Village.scaleCost(B.cost, k * T.upgrade_cost_base * Math.pow(T.upgrade_cost_growth, 2) * T.cost_scale));
  const check = (what, k) => {
    assert.deepStrictEqual(plain(Village.cost('chapel')), cost(k), what + ': a chapel');
    assert.deepStrictEqual(plain(Village.upgradeCost(up)), upCost(k), what + ': an upgrade');
  };
  withLodge(L, 0); check('no lodge', 1);
  withLodge(L, 1); check('level 1', 0.98);
  withLodge(L, 15); check('level 15', 0.91);
  gift(L, 0.15); check('level 15 with the gift', 0.76);
  gift(L, 0.5); check('level 15 with a strong gift', 0.75);
  withLodge(L, 15, { damaged: true }); check('a damaged lodge', 0.75);
  withLodge(L, 40); check('level 40', 0.75);
});

test('lodge: a standing lodge takes at least one unit off each resource, never down to the refund', () => {
  const L = load(), { Village } = loadVillage(L);
  withLodge(L, 0);
  assert.deepStrictEqual(plain(Village.cost('house')), { wood: 20, planks: 6 }, 'no lodge: the plain price the cases below start from');
  withLodge(L, 1); // 2 %: 19.6 and 5.9 would round back up to 20 and 6
  assert.deepStrictEqual(plain(Village.cost('house')), { wood: 19, planks: 5 }, 'level 1');
  gift(L, 0.15);
  assert.deepStrictEqual(plain(Village.cost('house')), { wood: 17, planks: 5 }, 'level 1 with the gift: a bigger cut still counts');
  L.ctx.state.venue.buffs.build.left = 0;
  // a price of 1 stays 1, and a lodge never makes a demolition pay: a cap set far too high is held at the refund
  L.tune.lodge_plans_cap = 0.9; L.tune.lodge_plans_base = 0.8; withLodge(L, 15);
  const B = L.DATA.buildings;
  for (const k of L.DATA.buildOrder) {
    if (!B[k] || B[k].monument) continue;
    const paid = Village.cost(k), back = Village.refund({ kind: k });
    for (const r in paid) assert.ok(paid[r] >= 1 && paid[r] >= back[r], k + ': ' + r + ' paid ' + paid[r] + ', back ' + back[r]);
  }
  withLodge(L, 0); L.tune.lodge_plans_base = 0.02;
});

test('lodge: repairs lose at least one unit of each resource too', () => {
  const L = load(), { Village } = loadVillage(L);
  withLodge(L, 0);
  assert.deepStrictEqual(plain(Village.repairCost({ kind: 'forge' })), plain(Village.scaleCost(L.DATA.buildings.forge.cost, 0.3)), 'no lodge');
  withLodge(L, 1);
  const plainCost = plain(Village.scaleCost(L.DATA.buildings.forge.cost, 0.3)), got = plain(Village.repairCost({ kind: 'forge' }));
  for (const r in plainCost) assert.strictEqual(got[r], Math.max(1, plainCost[r] - 1), 'forge ' + r);
  assert.deepStrictEqual(plain(Village.scaleCost({ gold: 1 }, 0.3)), { gold: 1 });
});

test('lodge: a great work costs the same with the lodge standing', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings;
  const works = Object.keys(B).filter(k => B[k].monument), seen = () => works.map(k => [plain(Village.cost(k)), plain(Village.upgradeCost({ kind: k, lvl: 1 })), plain(Village.upgradeCost({ kind: k, lvl: 3 }))]);
  withLodge(L, 0); const before = seen();
  withLodge(L, 15); gift(L, 0.15);
  assert.deepStrictEqual(seen(), before);
});

test('lodge: repairs cost less, up to half', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings.house;
  const at = lvl => { withLodge(L, lvl); return plain(Village.repairCost({ kind: 'house' })); };
  assert.deepStrictEqual(at(0), plain(Village.scaleCost(B.cost, 0.3)), 'no lodge');
  assert.deepStrictEqual(at(15), plain(Village.scaleCost(B.cost, 0.15)), 'level 15');
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(sum(at(15)) < sum(at(1)) && sum(at(1)) <= sum(at(0)), 'not going down');
});

test('lodge: demolition gives back up to 74 %', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings.house;
  const at = lvl => { withLodge(L, lvl); return plain(Village.refund({ kind: 'house' })); };
  assert.deepStrictEqual(at(0), plain(Village.scaleCost(B.cost, 0.7)), 'no lodge');
  assert.deepStrictEqual(at(15), plain(Village.scaleCost(B.cost, 0.74)), 'level 15');
  const one = at(1);
  for (const r in one) assert.ok(one[r] >= at(0)[r] && one[r] <= at(15)[r], 'level 1, ' + r);
});

test('lodge: buying then demolishing never pays', () => {
  const L = load(), { Village } = loadVillage(L), B = L.DATA.buildings;
  withLodge(L, 15); gift(L, 0.5);
  for (const k of L.DATA.buildOrder) {
    if (!B[k]) continue;
    const paid = Village.cost(k), back = Village.refund({ kind: k });
    for (const r in back) assert.ok(back[r] <= paid[r], k + ': ' + r + ' refunded ' + back[r] + ', paid ' + paid[r]);
  }
  L.tune.lodge_plans_cap = 0.5; // a cap set lower than the share given back: the share is held to 1 minus the cap, but never below refund_pct
  assert.deepStrictEqual(plain(Village.refund({ kind: 'house' })), plain(Village.scaleCost(B.house.cost, 0.7)));
});

test('lodge: a rampart\'s repairs and refunds follow the lodge', () => {
  const L = load(), { Village } = loadVillage(L), wall = [{ kind: 'palisade', damaged: true }];
  withLodge(L, 0); const r0 = plain(Village.rampartRepairCost(wall)), f0 = plain(Village.rampartRefund(wall));
  withLodge(L, 15);
  assert.deepStrictEqual(plain(Village.rampartRepairCost(wall)), plain(Village.repairCost(wall[0])));
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(sum(Village.rampartRepairCost(wall)) <= sum(r0) && sum(Village.rampartRefund(wall)) >= sum(f0));
  assert.notDeepStrictEqual(plain(Village.rampartRepairCost(wall)), r0, 'no cheaper');
});

test('plans d\'Aveline: the real lodge\'s gift lasts 300 s at level 1 and 580 s at level 15', () => {
  const L = load();
  assert.strictEqual(L.DATA.venues.lodge.perLevel, 'lodge_level_time');
  L.ctx.state.buildings = [{ kind: 'lodge', lvl: 15 }];
  assert.strictEqual(L.Venue.giftTime('lodge', 'build'), 580);
  L.ctx.state.buildings = [{ kind: 'lodge', lvl: 1 }];
  assert.strictEqual(L.Venue.giftTime('lodge', 'build'), 300);
  L.ctx.state.buildings = undefined;
  assert.strictEqual(L.Venue.giftTime('lodge', 'build'), L.tune.venue_buff_time, 'with no buildings at all');
  assert.ok(L.DATA.venueBuffs.build && L.DATA.venueBuffs.build.name, 'no DATA.venueBuffs.build');
  assert.deepStrictEqual(Array.from(L.DATA.venues.lodge.buffs.build), [0, 0.05, 0.1, 0.15]);
});

test('the tutorial covers the six places, their games and the lodge', () => {
  const L = load();
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/tuto-check.js'), 'utf8'), L.ctx, { filename: 'js/tuto-check.js' });
  const r = vm.runInContext('TutoCheck', L.ctx).run(L.DATA), missing = r.missing.map(f => f.id);
  assert.deepStrictEqual(Array.from(L.DATA.venueOrder), ['cafe', 'market', 'forge', 'bakery', 'barracks', 'lodge']);
  const want = L.DATA.venueOrder.flatMap(k => ['venue:' + k, 'game:' + k]).concat('b:lodge');
  const bare = Array.from(want.filter(id => missing.includes(id))); // a plain array of this realm, not the sandbox's
  assert.deepStrictEqual(bare, [], 'no lesson covers ' + bare.join(', '));
});

test('every place explains its game in pictures: three cards, a keeper\'s line, a legend', () => {
  const { DATA, Minigames } = load();
  for (const id of DATA.venueOrder) {
    const d = DATA.venues[id], h = Minigames.howto(id, { level: 0, d });
    assert.ok(h, id + ': no howto');
    assert.ok(typeof d.say === 'string' && d.say, id + ': no short line for the keeper');
    assert.strictEqual(h.cards.length, 3, id + ': cards at level 0');
    for (const c of h.cards) {
      assert.ok(typeof c.text === 'string' && c.text.length > 0, id + ': a card without words');
      assert.ok(c.text.split(' ').length <= 8, id + ': a card says too much: ' + c.text);
      assert.strictEqual(typeof c.draw, 'function', id + ': a card without a picture');
      assert.ok(Array.isArray(c.keys), id + ': keys');
      assert.ok(!c.fresh, id + ': a new twist at level 0');
    }
    assert.ok(h.cards.some(c => c.keys.length), id + ': no card shows a key');
    assert.ok(Array.isArray(h.legend) && h.legend.every(l => typeof l.text === 'string' && l.text), id + ': legend');
    assert.strictEqual(d.keys, undefined, id + ': the old wall of keys is still there');
  }
});

test('a new twist gets its « Nouveau ! » card when it comes up, four cards at most', () => {
  const { DATA, Minigames, tune } = load();
  const fresh = (id, level) => Minigames.howto(id, { level, d: DATA.venues[id] }).cards.filter(c => c.fresh).length;
  const V = DATA.venues;
  assert.ok(fresh('bakery', V.bakery.breads.find(b => b.id === 'brioche').from) >= 1, 'bakery: the brioche');
  assert.ok(fresh('barracks', V.barracks.ramp.feintFrom) >= 1, 'barracks: the feints');
  assert.ok(fresh('barracks', V.barracks.ramp.doubleFrom) >= 1, 'barracks: the double blows');
  assert.ok(fresh('lodge', V.lodge.ramp.turnFrom) >= 1, 'lodge: the turned stones');
  assert.ok(fresh('lodge', V.lodge.ramp.mirrorFrom) >= 1, 'lodge: the mirror stone');
  for (const id of DATA.venueOrder) for (let L = 0; L <= tune.venue_streak_max; L++) {
    const n = Minigames.howto(id, { level: L, d: V[id] }).cards.length;
    assert.ok(n >= 3 && n <= 4, `${id} at ${L}: ${n} cards`);
  }
});

if (require.main === module) {
  let bad = 0;
  for (const t of tests) {
    try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
  }
  console.log(`${tests.length - bad}/${tests.length} passed`);
  process.exit(bad ? 1 : 0);
}

module.exports = { load, play };
