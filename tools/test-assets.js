// PROTOTYPE - NOT FOR PRODUCTION
// A guard on assets/manifest.js: every image it names exists under assets/. A file that is missing
// (a typo, an image never made) is skipped without a sound by the game, which then shows the drawn
// stand-in: this test is where it gets noticed.
// Run: node tools/test-assets.js (exit code 1 on a failure).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');

/** assets/manifest.js as the page reads it: its ASSETS, loaded in a sandbox. */
function loadManifest() {
  const ctx = { console };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/manifest.js'), 'utf8'), ctx, { filename: 'manifest.js' });
  return ctx.ASSETS;
}
/** Every file an entry names: a plain path, { file }, { sheet } or { frames: [path | { file } | null] }. */
function filesOf(entry) {
  if (!entry) return [];
  if (typeof entry === 'string') return [entry];
  const out = [];
  if (entry.file) out.push(entry.file);
  if (entry.sheet) out.push(entry.sheet);
  for (const f of entry.frames || []) if (f) out.push(typeof f === 'string' ? f : f.file);
  return out.filter(Boolean);
}
/** [{ id, file }] for every named file that is not on disk. */
function missing(assets) {
  const out = [];
  for (const id in assets) for (const file of filesOf(assets[id])) {
    if (!fs.existsSync(path.join(ROOT, 'assets', file))) out.push({ id, file });
  }
  return out;
}

module.exports = { loadManifest, filesOf, missing };

if (require.main === module) {
  const assets = loadManifest(), gone = missing(assets);
  const n = Object.keys(assets).reduce((k, id) => k + filesOf(assets[id]).length, 0);
  for (const g of gone) console.log(`MISSING ${g.id}: assets/${g.file}`);
  console.log(`${Object.keys(assets).length} sprites · ${n} files named · ${gone.length} missing`);
  process.exit(gone.length ? 1 : 0);
}
