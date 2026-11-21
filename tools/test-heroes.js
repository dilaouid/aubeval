// PROTOTYPE - NOT FOR PRODUCTION
// Tests of the hero's choice: the four heroes, which one is chosen, his or her sprite, the proposed name.
// Run: node tools/test-heroes.js (exit code 1 on a failure).
'use strict';
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const T = require('./i18n.js');

const ROOT = path.join(__dirname, '..');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/** The game's data, config, i18n, ui helpers and Hero in a sandbox; `loadedArt` is the set of sprite ids Art.loaded knows. */
function load(hero, loadedArt) {
  const ctx = { console };
  ctx.window = ctx; vm.createContext(ctx);
  const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  run('config.js');
  ctx.tune = {};
  for (const k in ctx.CONFIG) if (ctx.CONFIG[k] && typeof ctx.CONFIG[k] === 'object') ctx.tune[k] = ctx.CONFIG[k].value;
  run('js/i18n.js');
  for (const f of T.I18N.files) run('data/' + f + '.js');
  const art = loadedArt || new Set();
  ctx.Art = { loaded: id => art.has(id) };
  ctx.ui = {}; ctx.scene = 'play';
  ctx.state = { buildings: [], hero: Object.assign({ name: 'Bea', lvl: 1, plus: {}, equip: {}, inv: [], bench: {} }, hero) };
  run('js/ui.js'); run('js/hero.js');
  const get = n => vm.runInContext(n, ctx);
  return { Hero: get('Hero'), DATA: ctx.DATA, ctx, heroLook: get('heroLook'), withHero: get('withHero'), art };
}

test('heroes are the four of the spec', () => {
  const { DATA } = load();
  assert.deepStrictEqual([...DATA.heroes.map(h => h.id)], ['aldric', 'tancrede', 'isaure', 'maelle']);
  assert.deepStrictEqual([...DATA.heroes.map(h => h.g)], ['m', 'm', 'f', 'f']);
});

test('heroLook falls back to Aldric', () => {
  const L = load();
  assert.strictEqual(L.heroLook().id, 'aldric');
  L.ctx.state.hero.look = 'nobody';
  assert.strictEqual(L.heroLook().id, 'aldric');
  L.ctx.state.hero.look = 'isaure';
  assert.strictEqual(L.heroLook().id, 'isaure');
  L.ctx.ui.heroPick = 'maelle';
  assert.strictEqual(L.heroLook().id, 'maelle');
});

test('withHero fills the name, then the gender', () => {
  const L = load({ name: 'Bea', look: 'isaure' });
  assert.strictEqual(L.withHero('{hero} est {g:prêt|prête}'), 'Bea est prête');
  L.ctx.state.hero.look = 'tancrede';
  assert.strictEqual(L.withHero('{hero} est {g:prêt|prête}'), 'Bea est prêt');
});

test('Hero.art falls back when an image is missing', () => {
  for (const [kind, old, pre] of [['battle', 'hero.battle', 'hero.battle.'], ['unit', 'iso.unit.hero', 'iso.unit.hero.']]) {
    const { Hero, art } = load();
    assert.strictEqual(Hero.art(kind, 'isaure'), old);
    art.add(pre + 'aldric');
    assert.strictEqual(Hero.art(kind, 'isaure'), pre + 'aldric');
    art.add(pre + 'isaure');
    assert.strictEqual(Hero.art(kind, 'isaure'), pre + 'isaure');
  }
  const { Hero, art } = load();
  assert.strictEqual(Hero.art('portrait', 'isaure'), null);
  art.add('portrait.hero.aldric');
  assert.strictEqual(Hero.art('portrait', 'isaure'), 'portrait.hero.aldric');
});

test('Hero.nameFor keeps a typed name', () => {
  const { Hero } = load();
  assert.strictEqual(Hero.nameFor('Aldric', 'isaure'), 'Isaure');
  assert.strictEqual(Hero.nameFor('  ', 'maelle'), 'Maëlle');
  assert.strictEqual(Hero.nameFor('Tancrède', 'aldric'), 'Aldric');
  assert.strictEqual(Hero.nameFor('Bea', 'isaure'), 'Bea');
  assert.strictEqual(Hero.nameFor('aldric', 'isaure'), 'aldric');
});

let bad = 0;
for (const t of tests) {
  try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
}
console.log(`${tests.length - bad}/${tests.length} passed`);
process.exit(bad ? 1 : 0);
