// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-21
// Whether every land a new game can draw is playable (js/mapgen.js playable, pickSeed). Run from
// the repo: `node tools/check-maps.js`. Prints the share of seeds passed over, then OK, or fails.
'use strict';
const assert = require('assert');
const path = require('path');
global.window = global;
const root = path.join(__dirname, '..');
require(path.join(root, 'data/strings.js'));
require(path.join(root, 'data/world.js'));
const MapGen = require(path.join(root, 'js/mapgen.js'));

const M = DATA.map, args = [M, DATA.ground, DATA.biomes, DATA.flora];
const gen = s => MapGen.generate(s, ...args);
const pick = s => MapGen.pickSeed(s, ...args);
const MAX = 999999;

assert.strictEqual(MapGen.playable(gen(1), M, DATA.flora), true, 'the land of seed 1 (every save so far) is playable');

let passed = 0, longest = 0;
for (let g = 1; g <= 300; g++) {
  const s = pick(g), jump = (s - g + MAX) % MAX;
  assert.strictEqual(MapGen.playable(gen(s), M, DATA.flora), true, `pickSeed(${g}) = ${s} is playable`);
  assert.strictEqual(pick(s), s, `a playable seed (${s}) is kept as it is`);
  assert.ok(jump <= 20, `pickSeed(${g}) jumps ${jump} seeds`);
  if (jump) passed++;
  longest = Math.max(longest, jump);
}
const last = pick(MAX);
assert.ok(last >= 1 && last <= MAX, `pickSeed(${MAX}) = ${last} stays within 1..${MAX}`);

const a = gen(4242), b = gen(4242);
assert.deepStrictEqual([a.ground, a.flora], [b.ground, b.flora], 'the same seed draws the same land');

console.log(`seeds passed over: ${passed}/300 (${Math.round(passed / 3)}%), longest jump: ${longest}`);
console.log('OK');
