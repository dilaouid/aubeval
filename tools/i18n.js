// PROTOTYPE - NOT FOR PRODUCTION
// The language layers' tool (js/i18n.js says what a layer is).
//   node tools/i18n.js extract en   writes or completes data/i18n/en/*.js: every text of DATA has a
//                                   line, with the French beside it; a new one comes as null (to translate)
//   node tools/i18n.js check        every layer has every text, no path that leads nowhere, and the
//                                   same {holes} as the French ({de_hero} counts as {hero}); exit 1 if not
// The texts are the fields named in FIELDS, everything under ALL, never what SKIP names: ids,
// sprites, kinds and conditions are not words and never change with the language.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
require(path.join(ROOT, 'js/i18n.js')); // sets globalThis.I18N
const I18N = globalThis.I18N;

const FIELDS = new Set(('name card desc title text hint say task about styles flavor how keys label short trait one plural ' +
  'opens unit busy sad raid greet gone cold hot stages names chiefs chat lines glad cross leaves lost thanks tips wait ' +
  'ready chain okay pushed').split(' '));
const ALL = ['strings', 'tutorial.strings', 'legacyBranches']; // every text under these
const SKIP = ['tutorial.mechanics']; // the tutorial check's own notes, never shown
const ONLY = { from: /^city\.orders\b/, after: /\]$/ }; // a field that is text only there: an order's sender, a venue's lines (not a lesson's `after`)
const NOT = new Set(['icon']);

/** Loads data/*.js in a sandbox; a getter's hero becomes {hero} / {de_hero}, so it reads as its template. */
function loadData() {
  const ctx = { console, heroName: of => (of ? '{de_hero}' : '{hero}') };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of I18N.files) vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  return ctx.DATA;
}
/** The data file each top-level key of DATA comes from. */
function filesOf() {
  const ctx = { console, heroName: () => '' }; ctx.window = ctx; vm.createContext(ctx);
  const out = {};
  for (const f of I18N.files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
    for (const k in ctx.DATA) if (!out[k]) out[k] = f;
  }
  return out;
}
const under = (p, list) => list.some(x => p === x || p.startsWith(x + '.') || p.startsWith(x + '['));
/** The step of an array element: its id when it has a unique one, else its index. */
function step(arr, i) {
  const e = arr[i], id = e && typeof e === 'object' && typeof e.id === 'string' ? e.id : null;
  return id && arr.filter(x => x && x.id === id).length === 1 ? '[' + id + ']' : '[' + i + ']';
}
/** Walks DATA: visit(path, value, field) for every string, field being the nearest named key. */
function walk(D, visit) {
  (function go(o, p, field) {
    if (typeof o === 'string') return visit(p, o, field);
    if (Array.isArray(o)) return o.forEach((v, i) => go(v, p + step(o, i), field));
    if (o && typeof o === 'object') for (const k of Object.keys(o)) go(o[k], p ? p + '.' + k : k, k);
  })(D, '', '');
}
/** Every text of DATA: path -> French, in the order of the files. */
function paths(D) {
  const out = new Map();
  walk(D, (p, s, field) => {
    if (under(p, SKIP) || NOT.has(field)) return;
    if (under(p, ALL) || (FIELDS.has(field)) || (ONLY[field] && ONLY[field].test(p))) out.set(p, s);
  });
  return out;
}
/** The path of `field` on the first object of D for which pred holds. */
function pathOf(D, pred, field) {
  let found = null;
  (function go(o, p) {
    if (found || !o || typeof o !== 'object') return;
    if (!Array.isArray(o) && pred(o)) { found = p + '.' + field; return; }
    if (Array.isArray(o)) o.forEach((v, i) => go(v, p + step(o, i)));
    else for (const k of Object.keys(o)) go(o[k], p ? p + '.' + k : k);
  })(D, '');
  return found;
}
const holes = s => (String(s).match(/\{[a-z_]+\}/g) || []).map(h => (h === '{de_hero}' ? '{hero}' : h)).sort().join(' ');
/** What is wrong with a layer, against the French: [{ kind: missing | unknown | holes, path }]. */
function check(src, layer) {
  const out = [];
  for (const [p, fr] of src) {
    const t = layer[p];
    if (t == null) out.push({ kind: 'missing', path: p });
    else if (holes(t) !== holes(fr)) out.push({ kind: 'holes', path: p, fr: holes(fr), got: holes(t) });
  }
  for (const p in layer) if (!src.has(p)) out.push({ kind: 'unknown', path: p });
  return out;
}
/** A language's layers as they are on disk: { file: {path: text} }. */
function readLayers(lang) {
  const out = {};
  for (const f of I18N.files) {
    const file = path.join(ROOT, 'data/i18n', lang, f + '.js');
    out[f] = {};
    if (!fs.existsSync(file)) continue;
    const ctx = { I18N: { add: (l, map) => Object.assign(out[f], map) } };
    vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return out;
}
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

function extract(lang) {
  const D = loadData(), src = paths(D), files = filesOf(), have = readLayers(lang);
  const by = {};
  for (const [p, fr] of src) (by[files[I18N.parse(p)[0]]] = by[files[I18N.parse(p)[0]]] || []).push([p, fr]);
  let todo = 0;
  fs.mkdirSync(path.join(ROOT, 'data/i18n', lang), { recursive: true });
  for (const f of I18N.files) {
    const rows = (by[f] || []).map(([p, fr]) => {
      const t = have[f][p];
      if (t == null) todo++;
      return `  ${q(p)}: ${t == null ? 'null' : q(t)}, // ${String(fr).replace(/\n/g, '\\n')}`;
    });
    const head = `// PROTOTYPE - NOT FOR PRODUCTION\n// ${lang.toUpperCase()} layer of data/${f}.js (js/i18n.js). One text per path, the French beside it.\n` +
      `// null: still to translate. Written by node tools/i18n.js extract ${lang}; translations already here are kept.\n`;
    fs.writeFileSync(path.join(ROOT, 'data/i18n', lang, f + '.js'), head + `I18N.add('${lang}', {\n${rows.join('\n')}\n});\n`);
  }
  console.log(`${lang}: ${src.size} texts, ${todo} to translate`);
}
function checkAll(langs) {
  const src = paths(loadData());
  let bad = 0;
  for (const lang of langs) {
    const layer = Object.assign({}, ...Object.values(readLayers(lang)));
    const errs = check(src, layer);
    bad += errs.length;
    const n = k => errs.filter(e => e.kind === k).length;
    console.log(`${lang}: ${src.size} texts · ${n('missing')} missing · ${n('unknown')} unknown · ${n('holes')} with other holes`);
    for (const e of errs.slice(0, 15)) console.log(`  ${e.kind.padEnd(8)} ${e.path}${e.kind === 'holes' ? `  fr: ${e.fr} | ${lang}: ${e.got}` : ''}`);
  }
  return bad;
}

module.exports = { I18N, loadData, filesOf, paths, pathOf, check, readLayers };

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  const langs = args.length ? args : I18N.langs.filter(l => l !== 'fr');
  if (cmd === 'extract') langs.forEach(extract);
  else if (cmd === 'check') process.exit(checkAll(langs) ? 1 : 0);
  else { console.log('node tools/i18n.js extract <lang> | check [lang...]'); process.exit(2); }
}
