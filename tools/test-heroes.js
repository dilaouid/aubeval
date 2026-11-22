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
});

test('a pick counts on the naming screen only', () => {
  const L = load({ look: 'isaure' });
  L.ctx.ui.heroPick = 'maelle';
  L.ctx.scene = 'naming';
  assert.strictEqual(L.heroLook().id, 'maelle');
  for (const sc of ['play', 'title', 'battle']) { L.ctx.scene = sc; assert.notStrictEqual(L.heroLook().id, 'maelle', sc); }
  L.ctx.scene = 'play';
  assert.strictEqual(L.heroLook().id, 'isaure');
});

test('on the title screen heroLook is the saved hero, else Aldric', () => {
  const L = load({ look: 'isaure' });
  L.ctx.scene = 'title';
  for (const [saved, want] of [[{ look: 'maelle' }, 'maelle'], [null, 'aldric'], [{ look: 'nobody' }, 'aldric']]) {
    L.ctx.Save = { hero: () => saved };
    assert.strictEqual(L.heroLook().id, want, JSON.stringify(saved));
  }
});

test('every hero has its three sprites, listed in the manifest and on disk', () => {
  const { DATA, ctx } = load();
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/manifest.js'), 'utf8'), ctx, { filename: 'assets/manifest.js' });
  const A = ctx.ASSETS;
  for (const h of DATA.heroes) for (const id of ['portrait.hero.' + h.id, 'hero.battle.' + h.id, 'iso.unit.hero.' + h.id]) {
    const e = A[id];
    assert.ok(e, id + ' is not in assets/manifest.js');
    const file = typeof e === 'string' ? e : e.file || e.sheet || (e.frames && e.frames[0]);
    assert.ok(file && fs.existsSync(path.join(ROOT, 'assets', file)), id + ': ' + file + ' is not under assets/');
  }
});

test('every hero has a battle image per weapon tier, all 44x50: the first sword\'s twice, then the second\'s and the third\'s', () => {
  const { DATA, ctx } = load();
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/manifest.js'), 'utf8'), ctx, { filename: 'assets/manifest.js' });
  for (const h of DATA.heroes) {
    const e = ctx.ASSETS['hero.battle.' + h.id], t1 = `sprites/hero_battle_${h.id}.png`;
    assert.deepStrictEqual([...(e.frames || [])], [t1, t1, `sprites/hero_battle_${h.id}_t2.png`, `sprites/hero_battle_${h.id}_t3.png`], h.id);
    assert.deepStrictEqual([e.w, e.h], [44, 50], h.id);
    for (const f of new Set(e.frames)) {
      const p = path.join(ROOT, 'assets', f);
      assert.ok(fs.existsSync(p), f + ' is not under assets/');
      const png = fs.readFileSync(p); // a PNG's width and height: two big-endian integers at bytes 16 and 20
      assert.deepStrictEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [44, 50], f);
    }
  }
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
  assert.strictEqual(Hero.nameFor('Bea', 'nobody'), 'Bea');
  assert.strictEqual(Hero.nameFor('', 'nobody'), 'Aldric');
});

let bad = 0;
for (const t of tests) {
  try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
}
console.log(`${tests.length - bad}/${tests.length} passed`);
process.exit(bad ? 1 : 0);
