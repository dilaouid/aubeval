// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Draws the land from a seed: four layers of smooth noise (height, heat, wetness, woods) decide
// each tile's biome, then what grows on it. The same seed always gives the same land, so the map
// is never saved. Nothing here reads the game's state or its rng: only the seed and data/world.js.
'use strict';

const MapGen = (() => {
  /** A number from 0 to 1 for a tile and a layer: the same every time. */
  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  /** Smooth noise: values on a grid, blended between its points. */
  function smooth(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  /** Three sizes of smooth noise on top of each other, stretched to fill 0..1. `size`: tiles across one shape. */
  function layer(x, y, s, size) {
    const n = smooth(x / size, y / size, s) * 0.57 + smooth(x * 2 / size, y * 2 / size, s + 101) * 0.29 + smooth(x * 4 / size, y * 4 / size, s + 202) * 0.14;
    return Math.max(0, Math.min(1, 0.5 + (n - 0.5) * 1.7));
  }
  const mix = (a, b, k) => a + (b - a) * k;
  const step = (lo, hi, v) => { const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return t * t * (3 - 2 * t); };

  /**
   * The land for a seed.
   * @returns {{ground: Uint8Array, flora: Uint8Array, biome: Uint8Array, groundIds: string[], floraIds: string[], biomeIds: string[]}}
   *   per tile: the ground kind, what grows there (0: nothing, else 1 + its place in floraIds), the biome.
   */
  function generate(seed, M, GROUND, BIOMES, FLORA) {
    const groundIds = Object.keys(GROUND), biomeIds = Object.keys(BIOMES), floraIds = Object.keys(FLORA);
    const n = M.w * M.h, ground = new Uint8Array(n), flora = new Uint8Array(n), biome = new Uint8Array(n);
    const L = M.level, S = M.scale, C = M.clearing;
    const hx = M.hall.x + 2, hy = M.hall.y + 1.5; // the hall's middle
    // each biome's flora as a list of [upper bound of its share, flora index]
    const picks = {};
    for (const id of biomeIds) {
      const f = BIOMES[id].flora || {}; let total = 0, acc = 0;
      for (const k in f) total += f[k];
      picks[id] = Object.keys(f).map(k => { acc += f[k] / total; return [acc, floraIds.indexOf(k) + 1]; });
    }
    function biomeAt(x, y) {
      const r = Math.hypot(x - hx, y - hy), home = 1 - step(C.inner, C.outer, r); // 1 around the hall, 0 in the wild
      const border = Math.min(x, y, M.w - 1 - x, M.h - 1 - y);
      const j = (hash(x, y, seed + 7) - 0.5) * 0.035;                           // ragged edges between biomes
      let height = layer(x, y, seed + 11, S.height), heat = layer(x, y, seed + 23, S.heat);
      let wet = layer(x, y, seed + 37, S.wet), wood = layer(x, y, seed + 53, S.wood);
      heat = mix(heat, (x + y) / (M.w + M.h), M.heatSlope);
      height = mix(height, 0.5, home) - (1 - step(0, M.edge, border)) * 0.6;
      heat = mix(heat, 0.5, home); wet = mix(wet, 0.45, home);
      wood += step(C.bare, C.inner, r) * (1 - step(C.inner, C.outer, r)) * 0.16; // woods close to the first houses
      if (height + j < L.water) return 'water';
      if (height + j < L.shore) return 'shore';
      if (height + j > L.rock) return 'rock';
      if (heat + j < L.cold) return 'snow';
      if (heat + j > L.hot && wet < L.dry) return 'sand';
      if (wet + j > L.wet) return 'marsh';
      return wood + j > L.wood && r > C.bare ? 'autumn' : 'meadow';
    }
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
      const i = y * M.w + x, id = biomeAt(x, y), b = BIOMES[id];
      biome[i] = biomeIds.indexOf(id); ground[i] = groundIds.indexOf(b.ground);
      if (!b.cover || Math.hypot(x - hx, y - hy) < C.bare || hash(x, y, seed + 71) >= b.cover) continue;
      const p = hash(x, y, seed + 89), list = picks[id];
      for (const [upTo, f] of list) if (p < upTo) { flora[i] = f; break; }
      if (!flora[i] && list.length) flora[i] = list[list.length - 1][1];
    }
    return { ground, flora, biome, groundIds, floraIds, biomeIds };
  }

  return { generate, hash };
})();
if (typeof module !== 'undefined') module.exports = MapGen; // read by a script outside the game, to look at a map
