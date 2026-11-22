// PROTOTYPE - NOT FOR PRODUCTION
// Tests of the forge's levels: the Trempe (what a +N is worth) and the Fer rouge card.
// Run: node tools/test-forge.js (exit code 1 on a failure).
'use strict';
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const T = require('./i18n.js');

const ROOT = path.join(__dirname, '..');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/** The game's data, config, Hero and Cards in a sandbox, over a village of `buildings` and a hero sheet `hero`. */
function load(buildings, hero) {
  const ctx = { console, heroName: () => 'Hero', tr: k => k };
  ctx.window = ctx; vm.createContext(ctx);
  const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  run('config.js');
  ctx.tune = {};
  for (const k in ctx.CONFIG) if (ctx.CONFIG[k] && typeof ctx.CONFIG[k] === 'object') ctx.tune[k] = ctx.CONFIG[k].value;
  for (const f of T.I18N.files) run('data/' + f + '.js');
  ctx.state = { buildings, hero: Object.assign({ lvl: 1, plus: {}, equip: {}, inv: [], bench: {} }, hero) };
  run('js/hero.js'); run('js/cards.js');
  const get = n => vm.runInContext(n, ctx);
  return { Hero: get('Hero'), Cards: get('Cards'), DATA: ctx.DATA, tune: ctx.tune, state: ctx.state };
}
const forge = (lvl, extra) => Object.assign({ uid: 1, kind: 'forge', x: 0, y: 0, lvl, prog: 0 }, extra);

test('plusBonus: 0.15 without a forge and at level 4, 0.20 at level 5', () => {
  assert.strictEqual(load([]).Hero.plusBonus(), 0.15);
  assert.strictEqual(load([forge(4)]).Hero.plusBonus(), 0.15);
  assert.strictEqual(load([forge(5)]).Hero.plusBonus(), 0.2);
});

test('plusBonus counts a forge a raid has damaged', () => {
  assert.strictEqual(load([forge(5, { damaged: true })]).Hero.plusBonus(), 0.2);
});

test('itemStats of sword_1 at +2: atk 6.5 at forge level 4, 7 at level 5', () => {
  const at = lvl => load([forge(lvl)], { plus: { sword_1: 2 } }).Hero.itemStats('sword_1').atk;
  assert.strictEqual(at(4), 6.5);
  assert.strictEqual(at(5), 7);
});

test('brand (Fer rouge) is defined as the spec says', () => {
  const { DATA } = load([]), c = DATA.cards.brand;
  assert.ok(c, 'DATA.cards.brand');
  assert.deepStrictEqual(
    { from: c.from, at: c.at, max: c.max, copies: c.copies, cost: c.cost, target: c.target, dmg: c.dmg, pierce: c.pierce, weak: c.weak, exhaust: c.exhaust },
    { from: 'forge', at: 5, max: 1, copies: 1, cost: 1, target: 'one', dmg: 0.9, pierce: true, weak: 2, exhaust: true });
  assert.ok(DATA.cardOrder.includes('brand'));
});

const ids = L => L.pool().map(e => e.id);

test('pool: brand is out at forge level 4, in at level 5 with one copy and pow 1.4', () => {
  assert.ok(!ids(load([forge(4)]).Cards).includes('brand'));
  const e = load([forge(5)]).Cards.pool().find(x => x.id === 'brand');
  assert.ok(e, 'brand in the pool at level 5');
  assert.strictEqual(e.copies, 1);
  assert.ok(Math.abs(e.pow - 1.4) < 1e-9, 'pow ' + e.pow);
});

test('pool: a damaged or missing forge sends neither thrust nor brand', () => {
  for (const v of [[], [forge(5, { damaged: true })]]) {
    const got = ids(load(v).Cards);
    assert.ok(!got.includes('thrust') && !got.includes('brand'), got.join());
  }
});

test('pool: thrust, which names no level, is there from level 1', () => {
  assert.ok(ids(load([forge(1)]).Cards).includes('thrust'));
});

let bad = 0;
for (const t of tests) {
  try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
}
console.log(`${tests.length - bad}/${tests.length} passed`);
process.exit(bad ? 1 : 0);
