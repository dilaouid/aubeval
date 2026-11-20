// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Every sprite of the game, drawn in code as pixel art: one pixel size, a one-pixel dark outline,
// two-tone shading, a vivid palette. Each sprite has an id ('building.forge', 'enemy.brute'...).
// An image listed in assets/manifest.js under the same id replaces the drawn one, at the same
// size, so art can be swapped one file at a time (assets/ASSET-GUIDE.md).
'use strict';

/** The palette, by role. */
const PAL = {
  ink: '#1b1420',
  grass: '#5cbf3f', grassD: '#43a038', grassL: '#8be052', forest: '#3d9440', forestD: '#2f7a38',
  path: '#f0c1b0', pathD: '#d39a8c', pathL: '#ffe0d2',
  water: '#1b2458', waterL: '#2c3d8f', waterS: '#7d9bff', bank: '#c05c2c', bankD: '#8f3f1f',
  soil: '#8f5229', soilD: '#6b3a1e',
  wall: '#f8e7b6', wallD: '#dcc088', timber: '#6e4023', timberD: '#472716', timberL: '#b0703c',
  door: '#8f4c26', plank: '#edbf6e', plankD: '#c48d45',
  stone: '#a6adc2', stoneD: '#6f7590', stoneL: '#d3d8e6',
  window: '#ffd84a', glow: '#fff2a8', dark: '#2a2440',
  red: '#ea3b4a', redD: '#a81f33', gold: '#ffc533', goldD: '#d18a12',
  green: '#42ab3e', greenD: '#2b7735', greenL: '#74d64c', pine: '#1f7a55', pineD: '#15573b', pineL: '#35a06f',
  autumn: '#f04e2c', autumnD: '#b32b20', autumnL: '#ff8640',
  amber: '#ffb42e', amberD: '#d9801a', amberL: '#ffe066',
  trunk: '#70452a', trunkD: '#4a2b18',
  skin: '#f6c9a0', skinD: '#d99f78', hair: '#7a3b1c',
  steel: '#bcc7df', steelD: '#7c88a8', steelL: '#f1f5ff',
  cape: '#ea3b4a', capeD: '#a81f33', navy: '#2c3f7a', navyD: '#1e2b57',
  gob: '#a4ec3c', gobD: '#62b024', violet: '#9148e6', violetD: '#5c2a9e', violetL: '#b98cff',
  acid: '#dcff4a', ivory: '#f3ecd2', ivoryD: '#c9bf9c', orc: '#84bd6c', orcD: '#55894a',
  fire: '#ff7a1a', fireL: '#ffd23f', cyan: '#5ff0e6', white: '#ffffff',
};
const ROOFS = {
  orange: { base: '#f4682b', dark: '#bf3f18', light: '#ffa154' },
  slate: { base: '#4668c4', dark: '#2c4288', light: '#7699ee' },
  thatch: { base: '#f2bc3c', dark: '#c4861c', light: '#ffe37e' },
  brown: { base: '#ad5d30', dark: '#7a3c1c', light: '#d6884d' },
  coal: { base: '#504b68', dark: '#2e2a42', light: '#77729a' },
  azure: { base: '#3aa6de', dark: '#2473a8', light: '#86d6f8' },
};

const Art = (() => {
  let g = null;             // the sprite being painted
  const defs = {};          // id -> { w, h, frames, paint, outline }
  const cache = {};         // 'id#frame' -> canvas
  const overrides = {};     // id -> { all: canvas } (one image for every variant) or { frames: [canvas, ...] } (one per variant)
  const shades = {};        // id -> dark silhouette (locked cards)

  // ---- Pixel primitives: whole pixels only, never anti-aliased ----
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function E(cx, cy, rx, ry, c) { // filled ellipse
    g.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.3))));
      g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    }
  }
  function P(pts, c) { // filled convex polygon
    g.fillStyle = c;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      let a = Infinity, b = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        if (p[1] === q[1]) { if (p[1] === y) { a = Math.min(a, p[0], q[0]); b = Math.max(b, p[0], q[0]); } continue; }
        const lo = p[1] < q[1] ? p : q, hi = p[1] < q[1] ? q : p;
        if (y < lo[1] || y > hi[1]) continue;
        const x = lo[0] + (hi[0] - lo[0]) * (y - lo[1]) / (hi[1] - lo[1]);
        a = Math.min(a, x); b = Math.max(b, x);
      }
      if (b >= a) g.fillRect(Math.round(a), y, Math.round(b) - Math.round(a) + 1, 1);
    }
  }
  function L(x0, y0, x1, y1, c) { // one-pixel line
    g.fillStyle = c;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
  }
  const lcg = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; // art-only randomness, never the game's

  function outline(cv) { // the one-pixel dark outline every figure and building gets
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    const d = c.getImageData(0, 0, w, h).data;
    const a = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3];
    c.fillStyle = PAL.ink;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) c.fillRect(x, y, 1, 1);
    }
  }

  /** Registers a sprite: paint(frame, w, h) draws it with the primitives above, one pixel in from each edge. */
  function def(id, w, h, paint, o = {}) { defs[id] = { w, h, paint, frames: o.frames || 1, outline: o.outline !== false }; }

  /** How many variants (frames) a sprite has: the drawn one's, else as many as the manifest lists. */
  /** A sprite loaded as a sheet (see loadOverrides): { frames, cols, rows }, or null. */
  function sheet(id) { const o = overrides[id]; return o && o.cols ? o : null; }
  function frameCount(id) { const d = defs[id], o = overrides[id]; return d ? d.frames : o && o.frames ? o.frames.length : 1; }
  /**
   * The canvas for a sprite id and variant. An image from assets/ for this variant wins, then one
   * image for every variant, then the drawn sprite. So a variant left out of the manifest keeps
   * its drawn look.
   */
  function get(id, frame = 0) {
    const o = overrides[id], n = frameCount(id), f0 = ((frame | 0) % n + n) % n;
    if (o) { if (o.frames && o.frames[f0]) return o.frames[f0]; if (o.all) return o.all; }
    if (!defs[id] && o) return o.frames.find(Boolean) || Art.get('fx.missing'); // a new id with this variant still to load
    const d = defs[id] || defs['fx.missing'];
    const f = ((frame | 0) % d.frames + d.frames) % d.frames, key = id + '#' + f;
    if (!cache[key]) {
      const cv = document.createElement('canvas'); cv.width = d.w; cv.height = d.h;
      g = cv.getContext('2d'); d.paint(f, d.w, d.h);
      if (d.outline) outline(cv);
      cache[key] = cv;
    }
    return cache[key];
  }
  function size(id) { const s = get(id, 0); return { w: s.width, h: s.height }; }
  const flips = new WeakMap();
  /**
   * A sprite seen in a mirror, left to right: in the iso view, the same building turned so that
   * its map width and depth swap (the door that gave on the right gives on the left). Kept.
   */
  function flip(s) {
    let f = flips.get(s);
    if (!f) {
      f = document.createElement('canvas'); f.width = s.width; f.height = s.height;
      const c = f.getContext('2d'); c.translate(s.width, 0); c.scale(-1, 1); c.drawImage(s, 0, 0);
      flips.set(s, f);
    }
    return f;
  }
  /** True when the sprite can be drawn as itself: drawn in code, or its image from the manifest has loaded. */
  function loaded(id) { const o = overrides[id]; return !!defs[id] || !!(o && (o.all || (o.frames && o.frames.some(Boolean)))); }
  function silhouette(id) {
    if (!shades[id]) {
      const s = get(id), cv = document.createElement('canvas'); cv.width = s.width; cv.height = s.height;
      const c = cv.getContext('2d'); c.drawImage(s, 0, 0);
      c.globalCompositeOperation = 'source-in'; c.fillStyle = '#15111f'; c.fillRect(0, 0, cv.width, cv.height);
      shades[id] = cv;
    }
    return shades[id];
  }
  /**
   * Loads the images listed in assets/manifest.js. An entry is one of:
   *   'sprites/x.png'                          one image for every variant of the sprite
   *   { file: 'sprites/x.png', w, h }          the same, at a size chosen in art pixels
   *   { frames: ['sprites/a.png', null, ...] }  one image per variant, in variant order; null (or a
   *                                             missing file) keeps that variant's drawn look.
   *                                             Each item may be { file, w, h }; w and h may also
   *                                             be given once beside `frames`, for all of them.
   *   { sheet: 'sprites/x.png', cols, rows }   one image cut into cols x rows equal cells, read row
   *                                             by row: variant = row * cols + column. Used at its own size.
   * An image that fails to load is skipped: the drawn sprite stays.
   * Art.progress counts the files as they arrive, for the loading screen.
   */
  const progress = { total: 0, done: 0, failed: 0 }; // files asked for, files settled (loaded or failed), of which failed
  /** Starts loading one file; `ok` runs with the image once it has arrived. */
  function fetchImage(src, ok) {
    const img = new Image();
    progress.total++;
    img.onload = () => { progress.done++; ok(img); };
    img.onerror = () => { progress.done++; progress.failed++; console.warn('image introuvable : ' + src); };
    img.src = src;
  }
  function loadOverrides(onChange) {
    const m = window.ASSETS || {};
    const load = (id, e, put) => {
      const d = defs[id];
      fetchImage('assets/' + e.file, img => { // resampled once to the sprite's size in art pixels, so the pixel size stays one
        const cv = document.createElement('canvas'); cv.width = e.w || (d ? d.w : img.width); cv.height = e.h || (d ? d.h : img.height); // a new id has no drawn sprite: its size comes from the manifest, or the image
        const c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
        c.drawImage(img, 0, 0, cv.width, cv.height);
        put(cv); delete shades[id];
        if (onChange) onChange(id);
      });
    };
    for (const id in m) {
      const e = typeof m[id] === 'string' ? { file: m[id] } : m[id];
      if (!e) continue;
      if (e.sheet) {
        fetchImage('assets/' + e.sheet, img => {
          const cw = Math.floor(img.width / e.cols), ch = Math.floor(img.height / e.rows), frames = [];
          for (let r = 0; r < e.rows; r++) for (let c = 0; c < e.cols; c++) {
            const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
            cv.getContext('2d').drawImage(img, -c * cw, -r * ch); frames.push(cv);
          }
          overrides[id] = { frames, cols: e.cols, rows: e.rows }; delete shades[id];
          if (onChange) onChange(id);
        });
      } else if (Array.isArray(e.frames)) {
        const o = overrides[id] = { frames: new Array(e.frames.length) };
        e.frames.forEach((fe, i) => {
          if (!fe) return;
          const one = typeof fe === 'string' ? { file: fe } : fe;
          if (one.file) load(id, { file: one.file, w: one.w || e.w, h: one.h || e.h }, cv => { o.frames[i] = cv; });
        });
      } else if (e.file) load(id, e, cv => { overrides[id] = { all: cv }; });
    }
  }

  // =====================================================================================
  // Ground tiles: 16x16, no outline
  // =====================================================================================
  def('tile.grass', 16, 16, f => {
    R(0, 0, 16, 16, PAL.grass);
    const r = lcg(11 + f * 97);
    for (let i = 0; i < 6; i++) R(r() * 15 | 0, r() * 14 | 0, 1, 2, i % 2 ? PAL.grassL : PAL.grassD);
    if (f === 2) { R(4, 9, 1, 1, PAL.white); R(11, 4, 1, 1, PAL.amberL); }
  }, { frames: 3, outline: false });
  def('tile.forest', 16, 16, f => {
    R(0, 0, 16, 16, PAL.forest);
    const r = lcg(31 + f * 53);
    for (let i = 0; i < 7; i++) R(r() * 15 | 0, r() * 15 | 0, 2, 1, [PAL.forestD, PAL.autumn, PAL.amber, PAL.forestD][i % 4]);
  }, { frames: 3, outline: false });
  def('tile.path', 16, 16, f => {
    R(0, 0, 16, 16, PAL.path);
    const r = lcg(71 + f * 13);
    for (let i = 0; i < 6; i++) { const x = r() * 12 | 0, y = r() * 13 | 0; R(x, y, 3, 2, i % 2 ? PAL.pathD : PAL.pathL); R(x, y + 2, 3, 1, PAL.pathD); }
  }, { frames: 3, outline: false });
  def('tile.water', 16, 16, f => {
    R(0, 0, 16, 16, PAL.water);
    const r = lcg(5 + f * 29);
    for (let i = 0; i < 3; i++) R(r() * 11 | 0, r() * 15 | 0, 4, 1, PAL.waterL);
  }, { frames: 3, outline: false });
  def('tile.bank', 16, 16, f => {
    R(0, 0, 16, 16, PAL.bank); R(0, 0, 4, 16, PAL.bankD); R(12, 0, 4, 16, PAL.grassD);
    const r = lcg(3 + f * 7);
    for (let i = 0; i < 4; i++) R(4 + (r() * 7 | 0), r() * 15 | 0, 2, 1, PAL.bankD);
  }, { frames: 3, outline: false });

  // =====================================================================================
  // Trees and props
  // =====================================================================================
  const leafy = pal => f => {
    R(10, 21, 4, 7, PAL.trunk); R(10, 21, 1, 7, PAL.trunkD); R(9, 27, 6, 1, PAL.trunkD);
    E(12, 13, 9, 9, pal.d); E(11, 11, 8, 7, pal.b); E(9, 8, 4, 3, pal.l);
    const r = lcg(5 + f * 7);
    for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = r() * 7; R(12 + Math.cos(a) * d, 13 + Math.sin(a) * d * 0.9, 2, 1, i % 3 ? pal.d : pal.l); }
  };
  def('tree.red', 24, 30, leafy({ b: PAL.autumn, d: PAL.autumnD, l: PAL.autumnL }), { frames: 2 });
  def('tree.gold', 24, 30, leafy({ b: PAL.amber, d: PAL.amberD, l: PAL.amberL }), { frames: 2 });
  def('tree.green', 24, 30, leafy({ b: PAL.green, d: PAL.greenD, l: PAL.greenL }), { frames: 2 });
  def('tree.pine', 20, 32, () => {
    R(9, 26, 3, 5, PAL.trunk); R(9, 26, 1, 5, PAL.trunkD);
    for (const [top, base, hw] of [[1, 12, 6], [6, 19, 8], [12, 27, 9]]) {
      P([[10, top], [10 - hw, base], [10 + hw, base]], PAL.pine);
      P([[10, top], [10 + hw, base], [10, base]], PAL.pineD);
      L(10 - hw + 1, base - 1, 9, top + 1, PAL.pineL);
    }
  });

  // =====================================================================================
  // Building parts
  // =====================================================================================
  function wall(x0, x1, y0, y1, kind) { // inclusive box, with a stone footing
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (kind === 'stone') {
      R(x0, y0, w, h, PAL.stone); R(x1 - 2, y0, 3, h, PAL.stoneD); R(x0, y0, 2, h, PAL.stoneL);
      for (let y = y0 + 2, k = 0; y < y1 - 2; y += 3, k++) for (let x = x0 + 2 + (k % 2) * 3; x < x1 - 4; x += 6) R(x, y, 3, 1, PAL.stoneD);
    } else if (kind === 'logs') {
      R(x0, y0, w, h, PAL.timberL);
      for (let y = y0 + 2; y <= y1; y += 3) R(x0, y, w, 1, PAL.timber);
      R(x0, y0, 1, h, PAL.timberD); R(x1, y0, 1, h, PAL.timberD);
    } else { // half-timbered
      R(x0, y0, w, h, PAL.wall); R(x0, y0, w, 2, PAL.wallD);
      R(x0, y0, 2, h, PAL.timber); R(x1 - 1, y0, 2, h, PAL.timber);
      R(x0, y0 + (h >> 1), w, 1, PAL.timber);
      for (let x = x0 + 9; x < x1 - 8; x += 9) R(x, y0, 1, h, PAL.timber);
    }
    R(x0, y1 - 2, w, 3, PAL.stoneD); R(x0, y1 - 2, w, 1, PAL.stone);
  }
  function roofSide(x0, x1, top, eave, roof, inset = 3) { // the ridge runs left to right: a big tiled slope
    P([[x0, eave], [x1, eave], [x1 - inset, top], [x0 + inset, top]], roof.base);
    const span = y => { const t = (eave - y) / (eave - top); return [Math.round(x0 + inset * t), Math.round(x1 - inset * t)]; };
    for (let y = top + 4, k = 0; y < eave; y += 3, k++) {
      const [a, b] = span(y); R(a, y, b - a + 1, 1, roof.dark);
      for (let x = a + 2 + (k % 2) * 2; x < b - 1; x += 4) R(x, y - 1, 1, 1, roof.dark);
      for (let x = a + 4 + (k % 2) * 2; x < b - 1; x += 8) R(x, y - 2, 2, 1, roof.light);
    }
    const [a, b] = span(top); R(a, top, b - a + 1, 2, roof.light);
    R(x0, eave, x1 - x0 + 1, 1, roof.dark);
  }
  function roofGable(x0, x1, top, eave, roof) { // the ridge runs towards the viewer: a timbered gable under two slopes
    const c0 = (x0 + x1) >> 1, c1 = (x0 + x1 + 1) >> 1;
    P([[x0, eave], [c0, top], [c1, top], [x1, eave]], roof.base);
    P([[c1, top], [x1, eave], [c1, eave]], roof.dark);
    P([[x0 + 5, eave], [c0, top + 6], [c1, top + 6], [x1 - 5, eave]], PAL.wall);
    P([[c1, top + 6], [x1 - 5, eave], [c1, eave]], PAL.wallD);
    L(x0, eave, c0, top, roof.light); L(x0 + 1, eave, c0, top + 1, roof.light);
    R(c0, top + 7, c1 - c0 + 1, eave - top - 7, PAL.timber);
    L(x0 + 6, eave - 1, c0 - 1, top + 8, PAL.timber); L(x1 - 6, eave - 1, c1 + 1, top + 8, PAL.timber);
  }
  function win(x, y, w = 4, h = 4, c = PAL.window) { // a lit window
    R(x - 1, y - 1, w + 2, h + 2, PAL.timberD); R(x, y, w, h, c);
    R(x, y, 1, 1, PAL.glow); R(x + (w >> 1), y, 1, h, PAL.timberD);
  }
  function door(x, y1, w, h, c = PAL.door) { // y1: the row its foot stands on
    R(x - 1, y1 - h, w + 2, h + 1, PAL.timberD); R(x, y1 - h + 1, w, h, c);
    R(x + w - 2, y1 - (h >> 1), 1, 1, PAL.gold);
  }
  function chimney(x, y, w, h) { R(x, y, w, h, PAL.stone); R(x + w - 2, y, 2, h, PAL.stoneD); R(x - 1, y, w + 2, 2, PAL.stoneD); }

  // =====================================================================================
  // Buildings (each its own outline)
  // =====================================================================================
  def('building.hall', 68, 72, () => {
    wall(3, 64, 50, 70);
    roofSide(1, 66, 20, 52, ROOFS.slate, 4);
    roofGable(14, 53, 10, 52, ROOFS.slate);
    R(33, 2, 1, 9, PAL.timberD); R(34, 2, 7, 4, PAL.red); R(34, 5, 5, 1, PAL.redD);   // banner
    win(31, 30, 5, 6);
    door(29, 70, 10, 13); R(33, 58, 1, 12, PAL.timberD); R(27, 70, 14, 1, PAL.stoneL);
    win(8, 57, 5, 5); win(17, 57, 5, 5); win(46, 57, 5, 5); win(55, 57, 5, 5);
  });
  def('building.house', 34, 40, f => {
    chimney(6, 9, 5, 12);
    wall(4, 29, 25, 38);
    roofGable(1, 32, 6, 27, f ? ROOFS.slate : ROOFS.orange);
    win(15, 16, 4, 4);
    door(14, 38, 6, 9);
    win(7, 29, 4, 4); win(23, 29, 4, 4);
  }, { frames: 2 });
  def('building.lumber_hut', 34, 32, () => {
    wall(8, 26, 19, 30, 'logs');
    roofSide(6, 28, 8, 20, ROOFS.brown, 3);
    door(15, 30, 5, 8);
    for (const [x, y] of [[3, 28], [7, 28], [5, 25]]) { E(x, y, 2, 2, PAL.plank); R(x, y, 1, 1, PAL.timberD); } // log pile
    R(28, 27, 5, 4, PAL.trunk); R(28, 26, 5, 2, PAL.plank);                                          // stump
    R(30, 20, 1, 6, PAL.timberD); R(31, 20, 2, 3, PAL.steel);                                        // axe
  });
  def('building.sawmill', 50, 40, () => {
    wall(4, 45, 24, 38);
    roofSide(1, 48, 6, 26, ROOFS.slate, 4);
    R(8, 27, 20, 11, PAL.timberD); R(9, 28, 18, 10, '#2e2030');                                    // the open shed
    R(10, 35, 16, 2, PAL.timberL);                                                                 // a log on the bench
    E(18, 31, 5, 5, PAL.steelD); E(18, 31, 4, 4, PAL.steel); E(18, 31, 1, 1, PAL.steelD);          // the saw blade
    for (let i = 0; i < 8; i++) R(18 + Math.round(Math.cos(i * 0.785) * 6), 31 + Math.round(Math.sin(i * 0.785) * 6), 1, 1, PAL.steelL);
    win(33, 29, 5, 4);
    R(38, 33, 9, 2, PAL.plank); R(37, 35, 10, 2, PAL.plankD); R(38, 37, 9, 1, PAL.plank);          // plank stack
  });
  def('building.farm', 50, 52, () => {
    wall(8, 41, 22, 34);
    roofSide(5, 44, 6, 24, ROOFS.thatch, 6);
    door(21, 34, 8, 9, PAL.red); L(21, 26, 28, 34, PAL.redD); L(28, 26, 21, 34, PAL.redD);
    win(11, 27, 4, 4); win(35, 27, 4, 4);
    R(1, 37, 48, 14, PAL.soil);                                                                    // the wheat rows
    for (let y = 38; y < 50; y += 4) {
      R(1, y + 3, 48, 1, PAL.soilD);
      for (let x = 2; x < 48; x += 3) { R(x, y, 1, 3, PAL.gold); R(x, y, 1, 1, PAL.amberL); }
    }
  });
  def('building.bakery', 34, 44, () => {
    chimney(21, 3, 7, 18);
    wall(4, 29, 28, 42);
    roofSide(1, 32, 10, 30, ROOFS.orange, 3);
    door(19, 42, 6, 10);
    R(6, 32, 10, 7, PAL.timberD); R(7, 33, 8, 5, PAL.fire); R(8, 35, 6, 3, PAL.fireL);             // the oven mouth
    R(1, 31, 5, 1, PAL.timberD); R(3, 32, 1, 2, PAL.timberD); E(3, 36, 2, 2, '#e8a84a'); R(2, 35, 2, 1, PAL.glow); // loaf sign
  });
  def('building.quarry', 50, 34, () => {
    E(26, 23, 22, 8, PAL.stoneD); E(26, 22, 19, 6, '#565b75');
    P([[6, 25], [14, 12], [23, 23]], PAL.stone); P([[6, 25], [14, 12], [12, 25]], PAL.stoneL);
    P([[30, 23], [39, 11], [47, 25]], PAL.stone); P([[30, 23], [39, 11], [36, 23]], PAL.stoneL);
    R(19, 25, 7, 5, PAL.stoneL); R(19, 29, 7, 1, PAL.stoneD); R(27, 27, 6, 4, PAL.stoneL); R(27, 30, 6, 1, PAL.stoneD);
    R(24, 3, 2, 21, PAL.timber); P([[25, 3], [41, 1], [41, 2], [25, 5]], PAL.timber);              // the crane
    R(40, 2, 1, 7, PAL.wallD); R(38, 9, 5, 4, PAL.stoneL); R(38, 12, 5, 1, PAL.stoneD);
  });
  def('building.forge', 34, 42, () => {
    chimney(7, 2, 8, 16); R(8, 2, 6, 2, PAL.fire); R(10, 1, 2, 1, PAL.fireL);
    wall(4, 29, 26, 40, 'stone');
    roofSide(1, 32, 9, 28, ROOFS.coal, 3);
    R(6, 30, 11, 9, PAL.dark); R(8, 33, 7, 6, PAL.fire); R(9, 35, 5, 4, PAL.fireL); R(10, 37, 3, 2, '#fff6c8'); // the furnace
    R(21, 34, 9, 2, PAL.steelD); R(20, 34, 2, 1, PAL.steelD); R(23, 36, 5, 2, PAL.steelD); R(22, 38, 7, 2, PAL.steelD); R(21, 34, 9, 1, PAL.steel); // the anvil
  });
  def('building.watchtower', 20, 46, () => {
    R(5, 34, 10, 10, PAL.stone); R(12, 34, 3, 10, PAL.stoneD); R(5, 34, 10, 1, PAL.stoneL);
    R(6, 21, 8, 13, PAL.timberL); R(12, 21, 2, 13, PAL.timber); L(6, 22, 13, 33, PAL.timberD); L(13, 22, 6, 33, PAL.timberD);
    R(8, 12, 4, 3, PAL.skin); R(8, 11, 4, 1, PAL.hair); R(7, 15, 6, 3, PAL.green);                 // the archer
    R(2, 17, 16, 4, PAL.plank); R(2, 20, 16, 1, PAL.plankD);
    for (const x of [2, 7, 11, 16]) R(x, 15, 2, 2, PAL.plank);
    R(3, 10, 1, 6, PAL.timberD); R(16, 10, 1, 6, PAL.timberD);
    P([[1, 10], [9, 1], [10, 1], [18, 10]], ROOFS.orange.base); P([[10, 1], [18, 10], [10, 10]], ROOFS.orange.dark);
    L(1, 10, 9, 1, ROOFS.orange.light);
  });
  def('building.palisade', 18, 20, () => {
    for (let i = 0; i < 4; i++) { const x = 2 + i * 4; R(x, 5, 3, 13, PAL.timberL); R(x + 2, 5, 1, 13, PAL.timber); R(x + 1, 3, 1, 2, PAL.timberL); R(x, 4, 3, 1, PAL.plank); }
    R(1, 10, 16, 2, PAL.timberD);
  });
  def('building.mage_tower', 30, 58, () => {
    R(8, 24, 14, 32, PAL.stone); R(18, 24, 4, 32, PAL.stoneD); R(8, 24, 2, 32, PAL.stoneL);
    for (let y = 28, k = 0; y < 52; y += 4, k++) for (let x = 10 + (k % 2) * 3; x < 17; x += 6) R(x, y, 3, 1, PAL.stoneD);
    R(7, 53, 16, 3, PAL.stoneD);
    win(13, 31, 4, 5, PAL.cyan); win(13, 42, 4, 5, PAL.cyan);
    P([[4, 26], [14, 6], [15, 6], [25, 26]], ROOFS.azure.base); P([[15, 6], [25, 26], [15, 26]], ROOFS.azure.dark);
    L(4, 26, 14, 6, ROOFS.azure.light);
    R(13, 1, 4, 5, PAL.cyan); R(14, 2, 1, 2, PAL.white);                                           // the crystal
  });

  // =====================================================================================
  // Units on the map (two walking frames each)
  // =====================================================================================
  def('unit.hero', 14, 18, f => {
    R(2, 7, 2, 8, PAL.cape); R(2, 7, 1, 8, PAL.capeD);
    R(5, 1, 4, 2, PAL.hair); R(5, 3, 4, 3, PAL.skin); R(8, 4, 1, 1, PAL.ink);
    R(4, 6, 6, 6, PAL.steel); R(8, 6, 2, 6, PAL.steelD); R(4, 10, 6, 1, PAL.timber);
    R(5, 12, 2, f ? 3 : 4, PAL.navy); R(8, 12, 2, f ? 4 : 3, PAL.navy);
    R(11, 3, 1, 8, PAL.steelL); R(10, 10, 3, 1, PAL.gold);
  }, { frames: 2 });
  def('unit.villager', 12, 15, f => {
    R(4, 1, 4, 1, PAL.amber); R(2, 2, 8, 1, PAL.amberD);
    R(4, 3, 4, 3, PAL.skin); R(7, 4, 1, 1, PAL.ink);
    R(3, 6, 6, 5, PAL.green); R(3, 9, 6, 1, PAL.timber);
    R(4, 11, 2, f ? 2 : 3, PAL.timberD); R(7, 11, 2, f ? 3 : 2, PAL.timberD);
  }, { frames: 2 });
  def('unit.gobelin', 14, 13, f => {
    R(4, 2, 6, 5, PAL.gob); R(2, 2, 2, 2, PAL.gob); R(1, 1, 1, 1, PAL.gob); R(10, 2, 2, 2, PAL.gob); R(12, 1, 1, 1, PAL.gob);
    R(5, 4, 1, 1, PAL.ink); R(8, 4, 1, 1, PAL.ink); R(5, 6, 4, 1, PAL.gobD);
    R(5, 7, 5, 3, PAL.violet); R(4, 10, 2, f ? 1 : 2, PAL.gobD); R(8, 10, 2, f ? 2 : 1, PAL.gobD);
    R(2, 7, 3, 1, PAL.gob); R(1, 5, 1, 3, PAL.steelL);
  }, { frames: 2 });
  def('unit.brute', 20, 21, f => {
    R(6, 3, 6, 4, PAL.orc); R(6, 2, 6, 2, PAL.steelD); R(5, 1, 2, 2, PAL.ivory); R(11, 1, 2, 2, PAL.ivory);
    R(7, 5, 1, 1, PAL.acid); R(10, 5, 1, 1, PAL.acid);
    R(3, 7, 12, 8, PAL.violet); R(5, 9, 8, 4, PAL.steelD); R(3, 7, 3, 3, PAL.steel); R(12, 7, 3, 3, PAL.steel);
    R(5, 15, 3, f ? 3 : 4, PAL.violetD); R(10, 15, 3, f ? 4 : 3, PAL.violetD);
    R(16, 4, 2, 9, PAL.timber); R(15, 1, 4, 4, PAL.timberD); R(16, 2, 1, 1, PAL.steelL);
  }, { frames: 2 });
  def('unit.chaman', 14, 21, f => {
    R(6, 1, 1, 3, PAL.red); R(8, 1, 1, 3, PAL.acid); R(10, 2, 1, 2, PAL.red);
    R(5, 4, 6, 5, PAL.ivory); R(6, 6, 1, 1, PAL.violetD); R(9, 6, 1, 1, PAL.violetD);
    P([[5, 9], [10, 9], [12, 18], [3, 18]], PAL.violetD); R(4, 16, 8, 1, PAL.acid);
    R(5, 18, 2, f ? 1 : 2, PAL.ink); R(8, 18, 2, f ? 2 : 1, PAL.ink);
    R(2, 4, 1, 15, PAL.timber); R(1, 1, 3, 3, PAL.ivory); R(2, 2, 1, 1, PAL.ink);
  }, { frames: 2 });
  def('unit.grakk', 24, 24, f => {
    R(10, 1, 3, 3, PAL.red); R(8, 4, 7, 5, PAL.orc); R(9, 6, 1, 1, PAL.acid); R(13, 6, 1, 1, PAL.acid);
    R(8, 8, 1, 2, PAL.ivory); R(14, 8, 1, 2, PAL.ivory);
    R(4, 9, 15, 9, PAL.violet); R(7, 11, 9, 5, PAL.steelD); R(2, 8, 5, 4, PAL.steelD); R(16, 8, 5, 4, PAL.steelD);
    R(1, 7, 1, 2, PAL.ivory); R(21, 7, 1, 2, PAL.ivory);
    R(6, 18, 4, f ? 3 : 4, PAL.violetD); R(13, 18, 4, f ? 4 : 3, PAL.violetD);
    R(20, 3, 1, 14, PAL.timber); R(18, 1, 4, 5, PAL.steelL); R(21, 2, 1, 4, PAL.steel);
  }, { frames: 2 });

  // =====================================================================================
  // Battle figures (the hero faces right, the enemies left)
  // =====================================================================================
  // The hero's frame is his weapon's tier: 0 a stick, 1 the apprentice blade, 2 steel, 3 runic.
  def('hero.battle', 44, 50, tier => {
    P([[11, 17], [5, 42], [19, 42], [19, 17]], PAL.cape); P([[11, 17], [5, 42], [9, 42]], PAL.capeD);
    R(15, 34, 5, 10, PAL.navy); R(22, 34, 5, 10, PAL.navy); R(22, 34, 2, 10, PAL.navyD);
    R(14, 43, 7, 4, PAL.timber); R(21, 43, 8, 4, PAL.timber); R(14, 46, 7, 1, PAL.timberD); R(21, 46, 8, 1, PAL.timberD);
    R(13, 18, 15, 16, PAL.steel); R(24, 18, 4, 16, PAL.steelD); R(13, 30, 15, 2, PAL.timber); R(19, 30, 3, 2, PAL.gold);
    R(15, 21, 6, 1, PAL.steelL); R(15, 24, 6, 1, PAL.steelL);
    E(14, 19, 3, 3, PAL.steelL); E(27, 19, 3, 3, PAL.steelL);
    E(21, 10, 6, 6, PAL.skin); E(21, 7, 6, 4, PAL.hair); R(15, 7, 3, 7, PAL.hair);
    R(24, 10, 2, 2, PAL.ink); R(23, 14, 3, 1, PAL.skinD);
    E(11, 27, 5, 7, PAL.navy); E(11, 27, 3, 5, ROOFS.slate.light); R(10, 26, 3, 3, PAL.gold);       // the shield
    R(28, 22, 5, 4, PAL.steel); R(31, 25, 5, 4, PAL.steelD);                                        // the sword arm
    if (tier === 0) { R(33, 8, 2, 20, PAL.timberL); R(34, 8, 1, 20, PAL.timber); }
    else {
      const blade = tier >= 3 ? PAL.cyan : PAL.steelL, len = tier === 1 ? 18 : 24, wdt = tier === 1 ? 3 : 4, top = 25 - len;
      R(33, top, wdt, len, blade); R(33 + wdt - 1, top, 1, len, tier >= 3 ? ROOFS.azure.base : PAL.steel);
      R(33 + (wdt >> 1), top - 2, 1, 2, blade);
      R(30, 25, wdt + 6, 2, tier >= 2 ? PAL.gold : PAL.steelD); R(33, 27, wdt - 1, 4, PAL.timber);
      if (tier >= 2) R(34, top + 3, 1, len - 6, PAL.white);
      if (tier >= 3) for (let y = top + 3; y < 22; y += 5) R(34, y, 2, 2, PAL.white);
    }
  }, { frames: 4 });
  def('enemy.gobelin', 34, 32, () => {
    R(13, 25, 4, 5, PAL.gobD); R(20, 25, 4, 5, PAL.gobD); R(11, 29, 6, 1, PAL.gobD); R(18, 29, 6, 1, PAL.gobD);
    E(18, 20, 7, 6, PAL.violet); R(20, 16, 6, 9, PAL.violetD); R(12, 24, 13, 1, PAL.acid);
    P([[7, 9], [1, 4], [8, 13]], PAL.gob); P([[18, 8], [26, 2], [20, 13]], PAL.gob);                // the big ears
    E(13, 11, 7, 6, PAL.gob); R(15, 6, 5, 2, PAL.gobD);
    R(8, 9, 3, 3, PAL.acid); R(14, 9, 3, 3, PAL.acid); R(8, 10, 1, 1, PAL.ink); R(14, 10, 1, 1, PAL.ink);
    R(8, 14, 8, 1, PAL.ink); R(9, 15, 1, 1, PAL.ivory); R(13, 15, 1, 1, PAL.ivory);
    R(6, 19, 7, 3, PAL.gob); P([[1, 13], [3, 12], [7, 19], [5, 20]], PAL.steelL);                   // the dagger
  });
  def('enemy.brute', 50, 54, () => {
    R(14, 41, 9, 10, PAL.violetD); R(28, 41, 9, 10, PAL.violetD); R(12, 50, 11, 2, PAL.ink); R(27, 50, 11, 2, PAL.ink);
    E(25, 30, 15, 13, PAL.violet); R(30, 20, 9, 22, PAL.violetD);
    R(14, 26, 20, 11, PAL.steelD); R(14, 26, 20, 2, PAL.steel);
    for (const [x, y] of [[16, 29], [22, 29], [28, 29], [16, 34], [22, 34], [28, 34]]) R(x, y, 2, 2, PAL.steelL);
    E(10, 21, 6, 5, PAL.steelD); P([[6, 17], [3, 9], [11, 16]], PAL.ivory);                         // spiked shoulders
    E(40, 21, 6, 5, PAL.steelD); P([[38, 16], [44, 9], [44, 18]], PAL.ivory);
    E(22, 13, 6, 6, PAL.orc); R(15, 7, 14, 5, PAL.steelD); R(15, 7, 14, 1, PAL.steel);              // helm
    P([[16, 9], [9, 2], [19, 7]], PAL.ivory); P([[28, 9], [35, 2], [25, 7]], PAL.ivory);            // horns
    R(17, 13, 3, 2, PAL.acid); R(23, 13, 3, 2, PAL.acid); R(18, 17, 8, 1, PAL.ink); R(19, 16, 1, 2, PAL.ivory); R(24, 16, 1, 2, PAL.ivory);
    R(40, 24, 5, 12, PAL.orc); R(41, 8, 4, 20, PAL.timber);                                         // the arm and the club
    E(43, 7, 5, 5, PAL.timberD); R(40, 4, 2, 2, PAL.steelL); R(45, 6, 2, 2, PAL.steelL); R(42, 10, 2, 2, PAL.steelL);
  });
  def('enemy.chaman', 36, 52, () => {
    P([[13, 19], [23, 19], [28, 49], [9, 49]], PAL.violetD); P([[20, 19], [23, 19], [28, 49], [22, 49]], '#3f1c75');
    for (let x = 10; x < 27; x += 4) { R(x, 45, 2, 2, PAL.acid); R(x + 2, 43, 2, 2, PAL.acid); }    // the hem
    R(12, 49, 5, 2, PAL.ink); R(20, 49, 5, 2, PAL.ink);
    P([[13, 9], [9, 1], [16, 7]], PAL.red); P([[17, 8], [18, 1], [20, 8]], PAL.acid); P([[21, 9], [27, 2], [20, 7]], PAL.red); // feathers
    E(18, 14, 5, 6, PAL.ivory); R(21, 10, 3, 9, PAL.ivoryD);                                        // the mask
    R(14, 12, 3, 2, PAL.acid); R(19, 12, 3, 2, PAL.acid); R(16, 17, 5, 1, PAL.violetD); R(17, 18, 1, 2, PAL.violetD); R(19, 18, 1, 2, PAL.violetD);
    R(7, 25, 8, 3, PAL.violet); R(5, 24, 3, 4, PAL.orc);                                            // the arm
    R(5, 7, 2, 43, PAL.timber); E(6, 5, 3, 3, PAL.ivory); R(5, 4, 1, 2, PAL.ink); R(7, 4, 1, 2, PAL.ink); // the skull staff
    R(3, 10, 1, 4, PAL.acid); R(8, 10, 1, 5, PAL.red);
  });
  def('enemy.grakk', 72, 70, () => {
    R(22, 54, 11, 13, PAL.violetD); R(39, 54, 11, 13, PAL.violetD); R(19, 65, 15, 3, PAL.ink); R(38, 65, 15, 3, PAL.ink);
    E(36, 40, 19, 17, PAL.violet); R(44, 26, 11, 30, PAL.violetD);
    R(23, 33, 26, 15, PAL.steelD); R(23, 33, 26, 2, PAL.steel);
    E(36, 41, 4, 4, PAL.ivory); R(34, 40, 2, 2, PAL.ink); R(37, 40, 2, 2, PAL.ink); R(35, 44, 3, 1, PAL.ink); // skull plate
    E(16, 27, 9, 7, PAL.steelD); P([[10, 22], [6, 10], [16, 20]], PAL.ivory); P([[17, 21], [18, 9], [23, 22]], PAL.ivory);
    E(56, 27, 9, 7, PAL.steelD); P([[50, 22], [54, 9], [56, 21]], PAL.ivory); P([[57, 21], [65, 10], [62, 23]], PAL.ivory);
    E(35, 18, 8, 8, PAL.orc); R(40, 12, 4, 13, PAL.orcD);
    P([[30, 11], [36, 1], [41, 11]], PAL.red); P([[36, 1], [41, 11], [37, 11]], PAL.redD);          // the crest
    R(29, 16, 4, 2, PAL.acid); R(36, 16, 4, 2, PAL.acid); R(30, 22, 10, 1, PAL.ink);
    R(29, 20, 2, 5, PAL.ivory); R(39, 20, 2, 5, PAL.ivory);                                         // tusks
    R(12, 36, 9, 6, PAL.orc);                                                                       // the arm
    P([[8, 62], [11, 63], [21, 14], [18, 13]], PAL.timber);                                         // the cleaver's haft
    P([[6, 4], [28, 8], [25, 22], [9, 18]], PAL.steelL); P([[6, 4], [9, 18], [4, 11]], PAL.steel); R(9, 8, 16, 1, PAL.white);
  });

  // =====================================================================================
  // Icons (10x10) and small effects
  // =====================================================================================
  def('icon.wood', 10, 10, () => { R(1, 3, 8, 4, PAL.timberL); R(1, 6, 8, 1, PAL.timber); R(1, 3, 2, 4, PAL.plank); R(1, 4, 1, 2, PAL.timberD); });
  def('icon.planks', 10, 10, () => { R(1, 2, 8, 6, PAL.plank); R(1, 4, 8, 1, PAL.plankD); R(1, 6, 8, 1, PAL.plankD); R(8, 2, 1, 6, PAL.plankD); });
  def('icon.stone', 10, 10, () => { P([[1, 7], [3, 2], [7, 2], [8, 7]], PAL.stone); R(3, 2, 4, 2, PAL.stoneL); R(1, 7, 8, 1, PAL.stoneD); });
  def('icon.wheat', 10, 10, () => { R(4, 4, 1, 5, PAL.goldD); for (const [x, y] of [[4, 1], [3, 2], [5, 2], [3, 4], [5, 4]]) R(x, y, 2, 2, PAL.gold); R(4, 1, 1, 1, PAL.amberL); });
  def('icon.bread', 10, 10, () => { E(5, 5, 3, 2, '#e8a84a'); R(3, 4, 5, 1, '#ffd58a'); R(4, 5, 1, 2, PAL.timber); R(6, 5, 1, 2, PAL.timber); });
  def('icon.gold', 10, 10, () => { E(5, 5, 3, 3, PAL.gold); R(4, 3, 2, 1, PAL.amberL); R(5, 4, 1, 3, PAL.goldD); });
  def('icon.shard', 10, 10, () => { P([[5, 1], [8, 5], [5, 8], [2, 5]], PAL.cyan); R(4, 3, 1, 3, PAL.white); P([[5, 5], [8, 5], [5, 8]], ROOFS.azure.base); });
  def('icon.pop', 10, 10, () => { R(3, 1, 4, 4, PAL.skin); R(3, 1, 4, 1, PAL.hair); R(2, 5, 6, 4, PAL.green); });
  def('icon.hp', 10, 10, () => { R(2, 2, 2, 2, PAL.red); R(6, 2, 2, 2, PAL.red); R(1, 3, 8, 2, PAL.red); P([[1, 5], [8, 5], [5, 8], [4, 8]], PAL.red); R(2, 3, 1, 1, PAL.white); });
  def('icon.atk', 10, 10, () => { L(2, 7, 7, 2, PAL.steelL); L(3, 7, 8, 2, PAL.steel); R(1, 6, 3, 1, PAL.gold); R(2, 5, 1, 3, PAL.gold); R(1, 8, 1, 1, PAL.timber); });
  def('icon.def', 10, 10, () => { P([[1, 1], [8, 1], [8, 5], [5, 8], [4, 8], [1, 5]], ROOFS.slate.base); R(4, 2, 2, 6, PAL.gold); R(2, 4, 6, 1, PAL.gold); });
  def('icon.xp', 10, 10, () => { P([[5, 1], [8, 8], [1, 8]], PAL.amber); R(4, 4, 2, 3, PAL.amberL); });
  def('icon.time', 10, 10, () => { R(2, 1, 6, 1, PAL.timber); R(2, 8, 6, 1, PAL.timber); P([[2, 2], [7, 2], [5, 5], [4, 5]], PAL.amberL); P([[4, 5], [5, 5], [7, 7], [2, 7]], PAL.amber); });
  def('icon.raid', 10, 10, () => { E(5, 4, 3, 3, PAL.ivory); R(3, 4, 2, 2, PAL.ink); R(6, 4, 2, 2, PAL.ink); R(4, 7, 3, 2, PAL.ivory); R(5, 8, 1, 1, PAL.ink); });
  def('fx.warn', 11, 11, () => { P([[5, 1], [9, 9], [1, 9]], PAL.red); R(5, 4, 1, 3, PAL.white); R(5, 8, 1, 1, PAL.white); });
  def('fx.damage', 16, 14, () => { L(2, 2, 13, 11, PAL.timber); L(3, 2, 14, 11, PAL.timberL); L(13, 2, 2, 11, PAL.timber); L(14, 2, 3, 11, PAL.timberL); });
  def('fx.banner', 14, 22, () => { R(2, 1, 1, 20, PAL.timberD); P([[3, 2], [12, 2], [9, 6], [12, 10], [3, 10]], PAL.violet); R(3, 2, 9, 1, PAL.violetL); E(7, 6, 2, 2, PAL.ivory); R(6, 6, 1, 1, PAL.ink); R(8, 6, 1, 1, PAL.ink); });
  def('fx.check', 10, 10, () => { L(1, 5, 4, 8, PAL.greenL); L(4, 8, 8, 2, PAL.greenL); L(1, 4, 4, 7, PAL.greenL); L(4, 7, 8, 1, PAL.greenL); });
  def('fx.lock', 10, 10, () => { R(2, 5, 6, 4, PAL.stoneD); R(3, 2, 1, 3, PAL.stone); R(6, 2, 1, 3, PAL.stone); R(3, 1, 4, 1, PAL.stone); R(4, 6, 2, 2, PAL.dark); });
  def('tool.axe', 18, 18, () => { L(4, 14, 12, 4, PAL.timber); L(5, 14, 13, 4, PAL.timberL); P([[9, 2], [14, 3], [15, 8], [11, 7]], PAL.steelL); P([[12, 3], [14, 3], [15, 8], [13, 7]], PAL.steel); });
  // Drawn stand-ins for the people update: the images listed in assets/manifest.js replace them.
  def('icon.coffee', 10, 10, () => { R(2, 4, 5, 5, PAL.white); R(3, 4, 3, 1, PAL.timber); R(7, 5, 2, 1, PAL.white); R(8, 5, 1, 3, PAL.white); R(3, 1, 1, 2, PAL.stoneL); R(5, 0, 1, 2, PAL.stoneL); R(1, 9, 7, 1, PAL.stoneL); });
  def('icon.spice', 10, 10, () => { P([[2, 8], [3, 3], [7, 3], [8, 8]], PAL.plank); R(3, 2, 4, 2, PAL.autumn); R(4, 1, 2, 1, PAL.autumnL); R(2, 8, 7, 1, PAL.plankD); R(4, 5, 2, 2, PAL.plankD); });
  def('icon.trap', 10, 10, () => { R(1, 7, 8, 2, PAL.steelD); for (const x of [1, 4, 7]) P([[x, 7], [x + 1, 2], [x + 2, 7]], PAL.steelL); });
  def('icon.trade', 10, 10, () => { R(4, 1, 2, 8, PAL.goldD); R(1, 2, 8, 1, PAL.gold); R(1, 3, 1, 2, PAL.goldD); R(8, 3, 1, 2, PAL.goldD); R(0, 5, 3, 1, PAL.gold); R(7, 5, 3, 1, PAL.gold); R(3, 8, 4, 1, PAL.goldD); });
  def('icon.army', 10, 10, () => { P([[1, 1], [8, 1], [8, 5], [5, 8], [4, 8], [1, 5]], PAL.navy); L(2, 7, 7, 2, PAL.steelL); R(1, 6, 3, 1, PAL.gold); R(4, 3, 2, 2, PAL.gold); });
  def('iso.trap.spikes', 22, 14, () => { E(11, 10, 9, 3, PAL.soilD); for (const [x, y, h] of [[4, 9, 6], [8, 11, 8], [12, 9, 7], [16, 11, 8], [10, 7, 5]]) { L(x, y, x + 1, y - h, PAL.timberL); L(x + 1, y, x + 2, y - h, PAL.timber); R(x + 1, y - h - 1, 1, 2, PAL.ivory); } });
  def('iso.trap.tar', 24, 12, () => { E(12, 7, 10, 4, PAL.ink); E(11, 6, 8, 3, PAL.dark); R(6, 5, 4, 1, PAL.stoneD); R(14, 7, 3, 1, PAL.stoneD); R(9, 8, 2, 1, PAL.violetD); R(16, 5, 1, 1, PAL.stoneL); });
  def('iso.trap.powder', 14, 17, () => { R(3, 6, 8, 9, PAL.timber); R(3, 6, 2, 9, PAL.timberL); R(9, 6, 2, 9, PAL.timberD); R(2, 8, 10, 1, PAL.steelD); R(2, 12, 10, 1, PAL.steelD); R(4, 5, 6, 1, PAL.timberD); L(7, 5, 9, 2, PAL.ivoryD); R(9, 1, 2, 2, PAL.fireL); R(10, 0, 1, 1, PAL.fire); });
  def('fx.missing', 16, 16, () => { R(1, 1, 14, 14, '#ff00ff'); R(1, 1, 7, 7, PAL.ink); R(8, 8, 7, 7, PAL.ink); });

  // =====================================================================================
  // The great works (data/buildings.js, monument: true), seen from the village's own angle:
  // stand-ins drawn here until their images are listed in assets/manifest.js. Four looks each, the
  // stages of the works: 0 foundations, 1 walls, 2 roof, 3 finished (js/world.js frameOf).
  // =====================================================================================
  /**
   * A kit to draw a building on a footprint `n` tiles a side, in a sprite n * 32 + 8 wide and `h`
   * tall whose bottom holds the footprint's diamond (where js/world.js footRect puts it). Points
   * are (u, v, z): u and v run along the map's x and y in art pixels from the footprint's back
   * corner, z is the height. Colours of a box are [top, the side facing left, the side facing right].
   * Draw what stands behind first.
   */
  function isoKit(n, h) {
    const S = n * 16, ox = S + 4, oy = h - 3 - S;
    const pt = (u, v, z = 0) => [ox + u - v, oy + (u + v) / 2 - z];
    const flat = (u, v, a, b, z, c) => P([pt(u, v, z), pt(u + a, v, z), pt(u + a, v + b, z), pt(u, v + b, z)], c);
    const box = (u, v, a, b, z, hh, c) => {
      P([pt(u, v + b, z), pt(u + a, v + b, z), pt(u + a, v + b, z + hh), pt(u, v + b, z + hh)], c[1]);
      P([pt(u + a, v + b, z), pt(u + a, v, z), pt(u + a, v, z + hh), pt(u + a, v + b, z + hh)], c[2]);
      flat(u, v, a, b, z + hh, c[0]);
    };
    /** A roof whose ridge runs along u, rh above its eaves: the slope facing the viewer, the gable end on the right. c: [slope, gable, ridge]. */
    const gable = (u, v, a, b, z, rh, c) => {
      P([pt(u, v + b, z), pt(u + a, v + b, z), pt(u + a, v + b / 2, z + rh), pt(u, v + b / 2, z + rh)], c[0]);
      P([pt(u + a, v + b, z), pt(u + a, v, z), pt(u + a, v + b / 2, z + rh)], c[1]);
      const p = pt(u, v + b / 2, z + rh), q = pt(u + a, v + b / 2, z + rh); L(p[0], p[1], q[0], q[1], c[2]);
      for (let k = 1; k < 4; k++) { const e = pt(u, v + b - b * k / 8, z + rh * k / 4), f = pt(u + a, v + b - b * k / 8, z + rh * k / 4); L(e[0], e[1], f[0], f[1], c[1]); } // the rows of tiles, or the battens
    };
    /** A pointed roof on a square of side a. c: [the side facing left, the side facing right]. */
    const spire = (u, v, a, z, hh, c) => { const t = pt(u + a / 2, v + a / 2, z + hh); P([pt(u, v + a, z), pt(u + a, v + a, z), t], c[0]); P([pt(u + a, v + a, z), pt(u + a, v, z), t], c[1]); };
    /** Battlements along the two edges of a box's top that face the viewer. */
    const crenels = (u, v, a, b, z, c) => {
      for (let i = 1; i < a - 1; i += 4) { const p = pt(u + i, v + b, z); R(p[0], p[1] - 2, 2, 2, c[1]); }
      for (let i = 1; i < b - 1; i += 4) { const p = pt(u + a, v + b - i, z); R(p[0] - 1, p[1] - 2, 2, 2, c[2]); }
    };
    /** Scaffolding along u, on the line v, hh high: poles and planks. */
    const scaffold = (u, v, a, z, hh) => {
      for (let i = 0; i <= a; i += 8) { const p = pt(u + i, v, z); R(p[0], p[1] - hh, 1, hh, PAL.timberD); }
      for (let k = 5; k < hh; k += 7) { const p = pt(u, v, z + k), q = pt(u + a, v, z + k); L(p[0], p[1], q[0], q[1], PAL.timberL); }
    };
    /** A window (or a door) on the side of a box facing left (side 0) or right (1), its foot at (u, v, z). */
    const slit = (u, v, z, w, hh, c) => { const p = pt(u, v, z); R(p[0] - (w >> 1), p[1] - hh, w, hh, c); };
    /** A crane on the building site: a post, its arm, a block of stone on the rope. */
    const crane = (u, v, hh) => { const p = pt(u, v); R(p[0], p[1] - hh, 2, hh, PAL.timber); L(p[0], p[1] - hh, p[0] + 13, p[1] - hh + 4, PAL.timber); R(p[0] + 13, p[1] - hh + 4, 1, 8, PAL.wallD); R(p[0] + 11, p[1] - hh + 12, 5, 4, PAL.stoneL); };
    return { pt, flat, box, gable, spire, crenels, scaffold, slit, crane };
  }
  const STONE = [PAL.stoneL, PAL.stone, PAL.stoneD], OPEN = [PAL.dark, PAL.stone, PAL.stoneD]; // dressed stone; a wall still open to the sky
  const BARE = [PAL.timberL, PAL.timber, PAL.timberD], SLATE = [ROOFS.slate.base, ROOFS.slate.dark, ROOFS.slate.light];
  def('iso.cathedral', 136, 150, f => { // 4x4 tiles: a nave, its front between two towers
    const k = isoKit(4, 150), c = f === 1 ? OPEN : STONE, hN = [3, 20, 30, 30][f], hT = [3, 24, 44, 50][f];
    k.flat(1, 1, 62, 62, 0, PAL.pathD); k.flat(3, 3, 58, 58, 0, PAL.path);
    k.box(6, 18, 44, 28, 0, hN, c);
    if (f >= 2) k.gable(6, 18, 44, 28, hN, 16, f === 2 ? BARE : SLATE);
    if (f >= 1) for (let i = 5; i < 42; i += 8) { k.slit(6 + i, 46, 6, 3, f === 1 ? 6 : 12, f === 3 ? [PAL.cyan, PAL.gold, PAL.red, PAL.violetL, PAL.cyan][(i / 8) | 0] : PAL.dark); }
    k.box(50, 14, 12, 12, 0, hT, c);
    k.box(50, 26, 8, 12, 0, f >= 2 ? hN + 10 : hN, c);
    if (f >= 2) { const p = k.pt(58, 32, 22); E(p[0], p[1], 3, 3, f === 3 ? PAL.cyan : PAL.dark); if (f === 3) R(p[0], p[1], 1, 1, PAL.gold); k.slit(58, 32, 0, 5, 9, PAL.door); }
    k.box(50, 38, 12, 12, 0, hT, c);
    if (f >= 2) for (const v of [20, 44]) { k.slit(62, v, hT - 14, 2, 6, f === 3 ? PAL.window : PAL.dark); k.slit(62, v, 8, 2, 6, PAL.dark); }
    if (f === 3) for (const v of [14, 38]) { k.spire(50, v, 12, hT, 22, [ROOFS.azure.base, ROOFS.azure.dark]); const p = k.pt(56, v + 6, hT + 22); R(p[0], p[1] - 5, 1, 5, PAL.gold); R(p[0] - 1, p[1] - 4, 3, 1, PAL.gold); }
    if (f < 3) { k.scaffold(8, 48, 40, 0, hN + 4); k.crane(26, 60, 30); k.box(8, 54, 8, 6, 0, 4, STONE); k.box(40, 56, 6, 5, 0, 6, STONE); }
  }, { frames: 4 });
  def('iso.castle', 168, 150, f => { // 5x5 tiles: four towers, the curtain walls between them, a keep in the yard
    const k = isoKit(5, 150), c = f === 1 ? OPEN : STONE, hW = [3, 12, 18, 18][f], hT = [3, 16, 30, 32][f], hK = [3, 3, 40, 44][f], RED = [PAL.red, PAL.redD];
    const tower = (u, v) => { k.box(u, v, 16, 16, 0, hT, c); if (f >= 2) { k.crenels(u, v, 16, 16, hT, STONE); k.slit(u + 8, v + 16, hT - 12, 2, 5, PAL.dark); } if (f === 3) k.spire(u + 2, v + 2, 12, hT, 14, RED); };
    const curtain = (u, v, a, b) => { k.box(u, v, a, b, 0, hW, c); if (f >= 2) k.crenels(u, v, a, b, hW, STONE); };
    k.flat(1, 1, 78, 78, 0, PAL.pathD); k.flat(12, 12, 56, 56, 0, PAL.path);
    tower(2, 2); curtain(18, 6, 44, 8); curtain(6, 18, 8, 44); tower(62, 2); tower(2, 62);
    k.box(26, 26, 28, 28, 0, hK, f === 2 ? OPEN : STONE);
    if (f >= 2) { k.crenels(26, 26, 28, 28, hK, STONE); for (const u of [33, 40, 47]) k.slit(u, 54, hK - 16, 2, 6, f === 3 ? PAL.window : PAL.dark); k.slit(54, 40, 0, 5, 9, PAL.door); }
    if (f === 3) { k.spire(30, 30, 20, hK, 18, [ROOFS.slate.base, ROOFS.slate.dark]); const p = k.pt(40, 40, hK + 18); R(p[0], p[1] - 9, 1, 9, PAL.timberD); R(p[0] + 1, p[1] - 9, 6, 4, PAL.gold); R(p[0] + 1, p[1] - 6, 4, 1, PAL.navy); }
    if (f === 1 || f === 2) k.scaffold(27, 56, 26, 0, hK + 6);
    curtain(18, 66, 44, 8); curtain(66, 18, 8, 44);
    if (f >= 1) { k.slit(74, 40, 0, 7, Math.min(11, hW - 2), PAL.dark); if (f === 3) { const p = k.pt(74, 40, 0); for (let i = -2; i <= 2; i += 2) R(p[0] + i, p[1] - 10, 1, 10, PAL.steelD); } } // the gate, and its portcullis
    tower(62, 62);
    if (f < 3) { k.crane(8, 40, 28); k.box(30, 70, 8, 6, 0, 4, STONE); }
    if (f === 0) for (const [u, v] of [[26, 26], [54, 26], [26, 54], [54, 54]]) { const p = k.pt(u, v); R(p[0], p[1] - 5, 1, 5, PAL.timberD); R(p[0], p[1] - 6, 2, 2, PAL.red); } // the keep, pegged out
  }, { frames: 4 });
  def('iso.lighthouse', 104, 150, f => { // 3x3 tiles: a rock, the keeper's house, the tower and its lantern
    const k = isoKit(3, 150), ROCK = [PAL.stone, PAL.stoneD, '#565b75'], WHITE = [PAL.white, PAL.ivory, PAL.ivoryD], BAND = [PAL.red, PAL.red, PAL.redD];
    k.flat(1, 1, 46, 46, 0, PAL.bankD); k.box(3, 3, 42, 42, 0, 5, ROCK);
    k.box(6, 28, 13, 13, 5, [3, 8, 9, 9][f], f === 1 ? OPEN : [PAL.wallD, PAL.wall, PAL.wallD]);
    if (f >= 2) { k.gable(6, 28, 13, 13, 14, 6, f === 2 ? BARE : [ROOFS.orange.base, ROOFS.orange.dark, ROOFS.orange.light]); k.slit(12, 41, 5, 3, 6, PAL.door); }
    // the tower: three drums, each a little narrower, painted in bands once it is finished
    const drums = f === 0 ? [[18, 12, 20, 3]] : f === 1 ? [[18, 12, 20, 24], [19, 13, 18, 12]] : [[18, 12, 20, 24], [19, 13, 18, 24], [20, 14, 16, 24]];
    let z = 5;
    drums.forEach(([u, v, a, hh], i) => {
      const last = i === drums.length - 1;
      if (f < 3) k.box(u, v, a, a, z, hh, last && f === 1 ? OPEN : STONE);
      else { k.box(u, v, a, a, z, 9, WHITE); k.box(u, v, a, a, z + 9, 6, BAND); k.box(u, v, a, a, z + 15, hh - 15, WHITE); }
      if (f >= 2) k.slit(u + a / 2, v + a, z + 10, 2, 5, f === 3 ? PAL.window : PAL.dark);
      z += hh;
    });
    if (f >= 2) { k.box(17, 11, 22, 22, z, 3, f === 3 ? [PAL.stoneL, PAL.steelD, PAL.dark] : STONE); z += 3; }   // the gallery
    if (f === 3) {
      k.box(23, 17, 10, 10, z, 11, [PAL.amber, PAL.glow, PAL.amberL]); k.slit(23, 27, z, 1, 11, PAL.dark); k.slit(28, 27, z, 1, 11, PAL.dark); k.slit(33, 27, z, 1, 11, PAL.dark);
      k.spire(21, 15, 14, z + 11, 10, [PAL.red, PAL.redD]);
      const p = k.pt(28, 22, z + 21); R(p[0], p[1] - 4, 1, 4, PAL.gold);
      const g = k.pt(23, 27, z + 6), h2 = k.pt(33, 17, z + 6); R(g[0] - 6, g[1], 4, 1, PAL.glow); R(h2[0] + 4, h2[1], 4, 1, PAL.glow); // its light
    } else { k.scaffold(18, 34, 20, 5, z); k.crane(8, 14, 24); }
  }, { frames: 4 });
  // The city's own icons (16x16, as the HUD kit's): the hero's popularity, the city, the taxes, an order, a great work.
  def('icon.popularity', 16, 16, () => { R(3, 3, 4, 2, PAL.red); R(9, 3, 4, 2, PAL.red); R(2, 4, 12, 4, PAL.red); P([[2, 8], [13, 8], [8, 13], [7, 13]], PAL.red); R(9, 5, 4, 4, PAL.redD); R(4, 4, 2, 2, PAL.white); });
  def('icon.city', 16, 16, () => { R(3, 10, 10, 3, PAL.gold); P([[3, 10], [3, 4], [6, 10]], PAL.gold); P([[6, 10], [8, 3], [9, 10]], PAL.amberL); P([[10, 10], [12, 4], [12, 10]], PAL.gold); R(3, 12, 10, 1, PAL.goldD); R(7, 10, 2, 2, PAL.red); R(4, 11, 1, 1, PAL.cyan); R(11, 11, 1, 1, PAL.cyan); });
  def('icon.tax', 16, 16, () => { for (const [y, x] of [[11, 2], [8, 3], [5, 2]]) { R(x, y, 10, 3, PAL.gold); R(x, y + 2, 10, 1, PAL.goldD); R(x + 1, y, 3, 1, PAL.amberL); } R(10, 2, 4, 3, PAL.gold); R(11, 2, 1, 1, PAL.amberL); });
  def('icon.order', 16, 16, () => { R(3, 3, 10, 10, PAL.ivory); R(2, 2, 12, 2, PAL.ivoryD); R(2, 12, 12, 2, PAL.ivoryD); R(5, 6, 6, 1, PAL.timber); R(5, 8, 6, 1, PAL.timber); R(5, 10, 3, 1, PAL.timber); E(11, 11, 2, 2, PAL.red); });
  def('icon.monument', 16, 16, () => { P([[2, 6], [7, 2], [8, 2], [13, 6]], PAL.stoneL); R(2, 6, 12, 1, PAL.stoneD); for (const x of [3, 7, 11]) { R(x, 7, 2, 6, PAL.stone); R(x + 1, 7, 1, 6, PAL.stoneD); } R(2, 13, 12, 1, PAL.stoneD); });

  // =====================================================================================
  // The battle backdrop (640x360): frame 0 the Ronces at day, frame 1 the boss's dusk
  // =====================================================================================
  def('bg.battle', 640, 360, f => {
    const sky = f ? ['#3a1d5c', '#6a2a78', '#b8405f', '#f07a3c'] : ['#3fb4f0', '#63c8f8', '#93dcff', '#d0f2ff'];
    sky.forEach((c, i) => R(0, i * 45, 640, 46, c));
    const r = lcg(41);
    for (let i = 0; i < 6; i++) { const x = r() * 600 | 0, y = 20 + (r() * 70 | 0); E(x, y, 26, 6, f ? '#8a3a80' : PAL.white); E(x + 18, y + 4, 20, 5, f ? '#8a3a80' : PAL.white); }
    E(130, 196, 220, 44, f ? '#2a1f52' : '#3f9a6a'); E(480, 200, 260, 50, f ? '#241a48' : '#358a5e');
    const leaves = f ? [['#5c2a9e', '#3f1c75'], ['#8a2a4a', '#5c1c38']] : [[PAL.autumn, PAL.autumnD], [PAL.amber, PAL.amberD], [PAL.green, PAL.greenD]];
    for (let x = -6; x < 650; x += 17) {
      const p = leaves[(r() * leaves.length) | 0], y = 178 + (r() * 12 | 0);
      R(x + 1, y + 6, 3, 14, PAL.trunkD); E(x + 2, y, 12, 13, p[1]); E(x, y - 3, 9, 8, p[0]);
    }
    R(0, 196, 640, 164, f ? '#2f6a3a' : PAL.grass);
    P([[0, 250], [640, 236], [640, 292], [0, 310]], f ? '#b98a8a' : PAL.path);
    for (let i = 0; i < 90; i++) { const x = r() * 630 | 0, y = 244 + (r() * 56 | 0); if (y > 250 - x * 0.02 + 4 && y < 300) R(x, y, 5, 2, f ? '#96686c' : PAL.pathD); }
    for (let i = 0; i < 160; i++) { const x = r() * 636 | 0, y = 198 + (r() * 160 | 0); if (y < 232 || y > 314) R(x, y, 1, 3, f ? '#3f8a48' : (i % 2 ? PAL.grassL : PAL.grassD)); }
  }, { frames: 2, outline: false });

  return { get, size, flip, loaded, frameCount, sheet, silhouette, loadOverrides, progress, defs };
})();
