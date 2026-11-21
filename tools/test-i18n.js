// PROTOTYPE - NOT FOR PRODUCTION
// Tests of the language layers: the path code of js/i18n.js and the extraction and check of
// tools/i18n.js. Run: node tools/test-i18n.js (exit code 1 on a failure).
'use strict';
const assert = require('node:assert');
const T = require('./i18n.js');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('put by id changes the right quest', () => {
  const D = T.loadData();
  T.I18N.put(D, 'chapters[ch0].quests[p1].title', 'Wood!');
  assert.strictEqual(D.chapters[0].quests.find(q => q.id === 'p1').title, 'Wood!');
  assert.notStrictEqual(D.chapters[0].quests.find(q => q.id === 'p2').title, 'Wood!');
});

test('put on a getter keeps it live, with the hero name in it', () => {
  const D = T.loadData();
  const path = T.pathOf(D, q => q.id === 'p5', 'title');
  T.I18N.put(D, path, 'A blade for {hero}');
  globalThis.withHero = s => s.split('{hero}').join('Aldric'); // js/ui.js's, in the game
  const q = D.chapters.flatMap(c => c.quests).find(x => x.id === 'p5');
  assert.strictEqual(q.title, 'A blade for Aldric');
  globalThis.withHero = s => s.split('{hero}').join('Bea');
  assert.strictEqual(q.title, 'A blade for Bea');
});

test('a getter is extracted as its template', () => {
  const D = T.loadData(), p = T.paths(D);
  const path = T.pathOf(D, q => q.id === 'p5', 'title');
  assert.ok(p.get(path).includes('{hero}'), p.get(path));
});

test('paths hold text, never ids', () => {
  const p = T.paths(T.loadData());
  assert.strictEqual(p.get('buildings.hall.name'), 'Hôtel de ville');
  for (const k of p.keys()) assert.ok(!/\.(sprite|kind|id|icon|covers|keeper|target|role)(\[|$)/.test(k), k);
  assert.ok(!p.has('buildings.lumber_hut.worker'));
  assert.ok(![...p.keys()].some(k => k.startsWith('tutorial.mechanics')));
  assert.ok(![...p.keys()].some(k => /^units\.[a-z_]+\.from$/.test(k)));
  assert.ok(![...p.keys()].some(k => /when\.after$/.test(k)));
});

test('an array without ids is walked by index', () => {
  const D = T.loadData(), p = T.paths(D);
  assert.strictEqual(p.get('venues.cafe.chat[2]'), D.venues.cafe.chat[2]);
  T.I18N.put(D, 'venues.cafe.chat[2]', 'Hello');
  assert.strictEqual(D.venues.cafe.chat[2], 'Hello');
});

test('check finds a missing text, an unknown path and a wrong hole', () => {
  const src = new Map([['a.b', 'Niv. {n}'], ['a.c', 'Bois'], ['a.d', '{de_hero} lame']]);
  const errs = T.check(src, { 'a.b': 'Lv. {k}', 'a.c': null, 'a.d': '{hero}’s blade', 'a.z': 'x' });
  assert.deepStrictEqual(errs.map(e => e.kind).sort(), ['holes', 'missing', 'unknown']);
});

test('the language falls back when the address or the storage is no good', () => {
  assert.strictEqual(T.I18N.pick({ search: '?lang=xx', stored: () => { throw new Error('blocked'); }, nav: ['de-DE'] }), 'fr');
  assert.strictEqual(T.I18N.pick({ search: '?lang=es', stored: () => 'en', nav: [] }), 'es');
  assert.strictEqual(T.I18N.pick({ search: '', stored: () => 'en', nav: ['es'] }), 'en');
  assert.strictEqual(T.I18N.pick({ search: '', stored: () => null, nav: ['es-MX', 'en'] }), 'es');
});

test('a legacy branch is an id; its name is a text', () => {
  const D = T.loadData(), p = T.paths(D);
  for (const n of D.legacy) assert.ok(/^[a-z]+$/.test(n.branch) && typeof D.legacyBranches[n.branch] === 'string', n.id + ': ' + n.branch);
  assert.strictEqual(p.get('legacyBranches.prosperity'), 'Prospérité');
  const covers = D.tutorial.lessons.flatMap(l => l.covers || []).filter(c => c.startsWith('legacy:'));
  assert.deepStrictEqual([...covers].sort(), Object.keys(D.legacyBranches).map(b => 'legacy:' + b).sort());
});

test('js/ shows the player no French of its own', () => {
  const found = T.frenchInCode();
  assert.strictEqual(found.length, 0, found.length + ' found:\n' + found.slice(0, 40).join('\n'));
});

test('applying a language names the page in it', () => {
  const D = T.loadData(), doc = { title: 'old', documentElement: {} };
  T.I18N.add('xx', { 'strings.page_title': 'Aubeval – test' });
  T.I18N.langs.push('xx'); T.I18N.lang = 'xx';
  try { T.I18N.apply(D, doc); } finally { T.I18N.lang = 'fr'; T.I18N.langs.pop(); }
  assert.strictEqual(doc.title, 'Aubeval – test');
  assert.strictEqual(doc.documentElement.lang, 'xx');
  assert.ok(T.paths(D).has('strings.page_title'));
});

test('js/ writes no French decimal comma of its own', () => {
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '../js');
  const hits = fs.readdirSync(dir).filter(f => /replace\(['"]\.['"], *['"],['"]\)/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  assert.deepStrictEqual(hits, []);
});

let bad = 0;
for (const t of tests) {
  try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
}
console.log(`${tests.length - bad}/${tests.length} passed`);
process.exit(bad ? 1 : 0);
