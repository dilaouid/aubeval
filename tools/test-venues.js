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
 * The game's config, data, the real Venue and Minigames (and every js/minigame-*.js) in a sandbox.
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
  run('js/venue.js'); run('js/minigames.js');
  const games = fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^minigame-.+\.js$/.test(f)).sort();
  for (const f of games) run('js/' + f);
  run('js/music.js');
  const get = n => vm.runInContext(n, ctx);
  return { ctx, DATA: ctx.DATA, tune: ctx.tune, Venue: get('Venue'), Minigames: get('Minigames'), Music: get('Music'), games };
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

if (require.main === module) {
  let bad = 0;
  for (const t of tests) {
    try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
  }
  console.log(`${tests.length - bad}/${tests.length} passed`);
  process.exit(bad ? 1 : 0);
}

module.exports = { load, play };
