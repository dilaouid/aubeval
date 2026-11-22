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

if (require.main === module) {
  let bad = 0;
  for (const t of tests) {
    try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
  }
  console.log(`${tests.length - bad}/${tests.length} passed`);
  process.exit(bad ? 1 : 0);
}

module.exports = { load, play };
