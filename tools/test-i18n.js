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

test('every real layer lays all its texts on the game', () => {
  for (const lang of ['en', 'es']) {
    const D = T.loadData(), layer = Object.assign({}, ...Object.values(T.readLayers(lang)));
    const want = Object.values(layer).filter(t => t != null).length, warn = console.warn;
    T.I18N.add(lang, layer); T.I18N.lang = lang; console.warn = () => {};
    let n;
    try { n = T.I18N.apply(D, { documentElement: {} }); } finally { T.I18N.lang = 'fr'; console.warn = warn; }
    assert.strictEqual(n, want, lang + ': ' + (want - n) + ' text(s) lead nowhere');
  }
});

test('the popularity log keeps keys, not words (a save stays the same in every language)', () => {
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '../js');
  const hits = [];
  for (const f of fs.readdirSync(dir)) fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => { if (/gainPop\([^;]*\btr\(/.test(l)) hits.push(f + ':' + (i + 1)); });
  assert.deepStrictEqual(hits, []);
});

let bad = 0;
test('gender picks the first form for m, the second for f', () => {
  const s = '{hero} est {g:arrivé|arrivée} : {g:il|elle} rentre.';
  assert.strictEqual(T.I18N.gender(s, 'm'), '{hero} est arrivé : il rentre.');
  assert.strictEqual(T.I18N.gender(s, 'f'), '{hero} est arrivée : elle rentre.');
});
test('gender leaves other holes, plain text and empty forms alone', () => {
  assert.strictEqual(T.I18N.gender('{n} {res} pour {hero}', 'f'), '{n} {res} pour {hero}');
  assert.strictEqual(T.I18N.gender('prêt{g:|e}', 'm'), 'prêt');
  assert.strictEqual(T.I18N.gender('prêt{g:|e}', 'f'), 'prête');
  assert.strictEqual(T.I18N.gender('{g:le héros|l’héroïne}', 'f'), 'l’héroïne');
});
test('a malformed gender hole is kept as written, and reported', () => {
  for (const bad of ['{g:seul}', '{g:a|b|c}', '{g:a|{hero}}']) {
    assert.strictEqual(T.I18N.gender(bad, 'f'), bad);
    assert.strictEqual(T.I18N.genderBad(bad), true);
  }
  assert.strictEqual(T.I18N.genderBad('{g:il|elle} et {hero}'), false);
});
test('check reports a malformed gender hole as kind gender', () => {
  const errs = T.check(new Map([['strings.x', 'seul'], ['strings.y', '{g:a|b}']]), { 'strings.x': '{g:seul}', 'strings.y': 'c' });
  assert.ok(errs.some(e => e.kind === 'gender' && e.path === 'strings.x'));
  assert.ok(!errs.some(e => e.path === 'strings.y')); // a gender hole on one side only is no difference of holes
});
test('no bare « héros » in the French texts', () => {
  const found = [...T.paths(T.loadData())].filter(([p, t]) => T.GENDER.fr.bare.test(T.unholed(t)) && !T.genderOk('fr', p));
  assert.strictEqual(found.length, 0, found.length + ' found:\n' + found.slice(0, 40).map(([p, t]) => p + '  ' + t).join('\n'));
});
test('French gender suspects are all accounted for', () => {
  const left = T.genderSuspects('fr').filter(x => !T.genderOk('fr', x.path));
  assert.strictEqual(left.length, 0, left.length + ' left:\n' + left.slice(0, 40).map(x => x.path + '  ' + x.text).join('\n'));
});

for (const t of tests) {
  try { t.fn(); console.log('ok   ' + t.name); } catch (e) { bad++; console.log('FAIL ' + t.name + '\n     ' + (e.message || e).split('\n')[0]); }
}
console.log(`${tests.length - bad}/${tests.length} passed`);
process.exit(bad ? 1 : 0);
