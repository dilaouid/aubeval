'use strict';
// The published copy of the game: node tools/build.js  ->  dist/
//
// The source stays what it is (plain HTML and JavaScript, no build to play it). This makes the copy
// that is put online:
//   - the data files, the language layers and config.js are minified where they are (their names stay,
//     other files read them: DATA, I18N, ASSETS);
//   - everything the game runs, js/*.js and the inline scripts of index.html, is joined in order into
//     ONE function and minified with its names shortened. Nothing of it is left on `window`: the state,
//     the saves and the rules cannot be reached from the console by name, and window.game (the hook the
//     checks use, between @dev-begin and @dev-end in index.html) is left out.
//   - DATA and CONFIG are taken into that function and removed from `window`.
//
// Minifying costs no speed: the game runs the same code, shorter. This is not a lock: whoever wants to
// change their own save or read the code still can. node tools/build.js --keep-hook keeps window.game
// and the globals, to run the same checks on the built game as on the source.
//
// Needs esbuild (npm ci).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const KEEP_HOOK = process.argv.includes('--keep-hook');

// What is not published: the tools, the README's images, the project's own files.
const SKIP = new Set(['dist', 'node_modules', 'tools', 'docs', 'README.md', 'package.json', 'package-lock.json', '.gitignore', '.gitattributes']);
const skip = file => { const rel = path.relative(ROOT, file).split(path.sep); return rel[0].startsWith('.') || SKIP.has(rel[0]) || file.endsWith('.py'); };

const read = f => fs.readFileSync(f, 'utf8');
const hash = text => crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
const min = code => esbuild.transformSync(code, { minify: true, legalComments: 'none', charset: 'utf8' }).code;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out); else out.push(f);
  }
  return out;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const e of fs.readdirSync(ROOT)) { // entry by entry: dist is inside the folder it copies
  const src = path.join(ROOT, e);
  if (!skip(src)) fs.cpSync(src, path.join(OUT, e), { recursive: true, filter: f => !skip(f) });
}

// ---- The scripts of index.html, in order -------------------------------------------------------------
const htmlFile = path.join(OUT, 'index.html');
let html = read(htmlFile);
const tags = [...html.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g)]
  .map(m => ({ at: m.index, end: m.index + m[0].length, src: m[1], body: m[2] }))
  .filter(t => t.src || /^\s*(?:'use strict'|[A-Za-z])/.test(t.body)); // not the JSON-LD block
const manifest = tags.findIndex(t => t.src === 'assets/manifest.js');
if (manifest < 0) throw new Error('index.html: assets/manifest.js not found, the build does not know where the game starts');
const game = tags.slice(manifest + 1); // after the data and the manifest: the game itself

// ---- The game: one function, names shortened ---------------------------------------------------------
let code = game.map(t => t.src ? read(path.join(ROOT, t.src)) : t.body).join('\n;\n');
if (!KEEP_HOOK) {
  const hook = /^\/\/ @dev-begin[^\n]*\n[\s\S]*?^\/\/ @dev-end[^\n]*$/m;
  if (!hook.test(code)) throw new Error('index.html: the @dev-begin / @dev-end markers are gone');
  code = code.replace(hook, '');
}
const open = KEEP_HOOK ? '' : 'const CONFIG = window.CONFIG, DATA = window.DATA; delete window.CONFIG; delete window.DATA;\n';
const bundle = min(`(function () {\n'use strict';\n${open}${code}\n})();`);
const gameName = 'game.' + hash(bundle) + '.js';
fs.writeFileSync(path.join(OUT, gameName), bundle);
for (const t of game) if (t.src) fs.rmSync(path.join(OUT, t.src)); // now inside the bundle

// ---- The rest, minified in place ---------------------------------------------------------------------
let before = 0, after = 0;
for (const f of walk(OUT).filter(f => f.endsWith('.js') && path.basename(f) !== gameName)) {
  const src = read(f), out = min(src);
  before += src.length; after += out.length;
  fs.writeFileSync(f, out);
}

// ---- index.html: one tag for the game, a version on every file so a new build is not served from the cache
const version = file => hash(read(path.join(OUT, file)));
let result = html.slice(0, game[0].at) + `<script src="${gameName}"></script>` + html.slice(game[game.length - 1].end);
result = result.replace(/<script src="((?!game\.)[^"?]+\.js)"><\/script>/g, (all, file) => `<script src="${file}?v=${version(file)}"></script>`);
fs.writeFileSync(htmlFile, result);

const kb = n => (n / 1024).toFixed(0) + ' KB';
const gameSrc = game.reduce((n, t) => n + (t.src ? read(path.join(ROOT, t.src)).length : t.body.length), 0);
console.log(`game: ${kb(gameSrc)} -> ${kb(bundle.length)} (${gameName}); data and config: ${kb(before)} -> ${kb(after)}${KEEP_HOOK ? '; window.game kept' : ''}`);
