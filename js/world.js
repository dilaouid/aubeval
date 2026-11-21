// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Draws the village in 2:1 isometric view on its own pixel-art canvas, then copies it to the
// screen at the zoom the player chose. Nothing here changes the game.
//
// Two spaces:
//   map space   the game's own: a grid of 16-pixel tiles seen from above (data/world.js). Positions,
//               ranges, the raiders' ways and the save all live here.
//   iso space   what is drawn: each tile is a 32x16 diamond. iso(mx, my) turns a map point into an
//               iso point; toWorld() turns a screen point back into a map point.
// The camera (state.cam) is the iso point in the middle of the view, in art pixels; state.cam.k is
// the zoom, in screen pixels per art pixel.
//
// The map is far too big to paint whole: the ground is painted in pieces of DATA.map.chunk tiles a
// side, each one the first time it is seen, and kept. What stands on it (trees, buildings, people)
// is drawn every frame, for the tiles in view only.
'use strict';

const World = (() => {
  const M = DATA.map, T = M.tile, B = DATA.buildings, CH = M.chunk;
  const OX = M.h * T;                               // iso x of the map's left corner (0, M.h)
  const IW = (M.w + M.h) * T, IH = (M.w + M.h) * T / 2 + 16; // the whole map in iso space (+ tile thickness)
  const TILE_TOP = 11;                              // row of a ground tile's top corner in its 32x32 image (imagegen/pixellab/install_iso.py)
  const GROUND = Village.GROUND.map(id => DATA.ground[id]), FLORA = Village.FLORA.map(id => DATA.flora[id]);
  const WATER = Village.GROUND.indexOf('water'), PATH = Village.GROUND.indexOf('path');
  const CW = CH * 2 * T, CHH = CH * T + 32, NCX = Math.ceil(M.w / CH), NCY = Math.ceil(M.h / CH); // one piece of ground, and how many there are
  const KEEP = 110;                                 // pieces of ground kept painted at once
  const SEA = '#1d4a78';                            // beyond the map's edge
  const hash = MapGen.hash;
  /** Map point -> iso point, in art pixels. */
  const isoX = (mx, my) => mx - my + OX, isoY = (mx, my) => (mx + my) / 2;
  const iso = (mx, my) => ({ x: isoX(mx, my), y: isoY(mx, my) });
  const wc = document.createElement('canvas'); wc.width = AW; wc.height = AH;
  const wg = wc.getContext('2d'); wg.imageSmoothingEnabled = false;
  const chunks = new Map();                         // piece number -> { cv, used }
  let frameN = 0;
  let inView = 0;                                   // pieces of ground on screen this frame: the caches never keep fewer, or a big screen zoomed out would paint them again every frame
  const puffs = []; // dust where something was just built or broken
  const pings = [];  // where soldiers were just sent: a ring closing on the spot
  const blasts = []; // a powder keg going off
  const CARRY = { wood: PAL.timberL, stone: PAL.stoneL, wheat: PAL.gold }; // the load on a worker's back, by resource
  const alphas = new WeakMap(); // sprite canvas -> its alpha channel, for clicks on the drawn pixels only

  // ---- The view ----
  /** Screen pixels per art pixel: the zoom the player chose, or the window's own. */
  const zoom = () => (state && state.cam.k) || ART;
  /** Logical units per art pixel of the world. */
  const wpx = () => zoom() / SCALE;
  /** The part of the map on screen, in art pixels, and how much of it the top bar and the build bar hide. */
  function view() { const k = zoom(); return { w: Math.ceil(canvas.width / k), h: Math.ceil(canvas.height / k), top: Math.ceil(46 * SCALE / k), bottom: Math.ceil(134 * SCALE / k) }; }
  /** The iso point at the screen's top-left corner. The camera is the middle of what the bars leave visible. */
  function origin() { const v = view(), c = state.cam; return { x: Math.round(c.x - v.w / 2), y: Math.round(c.y - (v.top + (v.h - v.top - v.bottom) / 2)) }; }
  function clampCam() { const c = state.cam; c.x = clamp(c.x, 0, IW); c.y = clamp(c.y, 0, IH); }
  /** Logical screen point -> map point. */
  function toWorld(lx, ly) {
    const o = origin(), X = lx / wpx() + o.x, Y = ly / wpx() + o.y, dx = (X - OX) / 2;
    return { x: Y + dx, y: Y - dx };
  }
  /** Map point (raised `lift` art pixels off the ground) -> logical screen point. */
  const toScreen = (wx, wy, lift = 0) => toScreenIso(isoX(wx, wy), isoY(wx, wy) - lift);
  /** Iso point -> logical screen point. */
  function toScreenIso(X, Y) { const o = origin(), k = wpx(); return { x: (X - o.x) * k, y: (Y - o.y) * k }; }
  /** Where the camera must be for this map point to sit in the middle of the view. */
  const camOn = (mx, my) => ({ x: isoX(mx, my), y: isoY(mx, my) });
  /** The zoom steps this window allows, smallest first. */
  const zoomSteps = () => M.zooms.filter(z => z >= ART / 4 && z <= ART * 3);
  /** One step closer (dir 1) or farther (-1), keeping the map point under a logical screen point where it is. */
  function zoomBy(dir, lx, ly) {
    const steps = zoomSteps(), k0 = zoom();
    let i = 0; for (let j = 0; j < steps.length; j++) if (Math.abs(steps[j] - k0) < Math.abs(steps[i] - k0)) i = j;
    const k1 = steps[clamp(i + dir, 0, steps.length - 1)];
    if (k1 === k0) return false;
    const o0 = origin(), X = lx * SCALE / k0 + o0.x, Y = ly * SCALE / k0 + o0.y; // the iso point under the pointer
    state.cam.k = k1;
    const v = view();
    state.cam.x = X - lx * SCALE / k1 + v.w / 2;
    state.cam.y = Y - ly * SCALE / k1 + v.top + (v.h - v.top - v.bottom) / 2;
    clampCam();
    return true;
  }
  /** Which of 8 ways a step on the map points on screen: 0 east, then clockwise (1 south-east, 2 south, ...). */
  function octant(dx, dy) { return ((Math.round(Math.atan2((dx + dy) / 2, dx - dy) / (Math.PI / 4)) % 8) + 8) % 8; }

  // ---- The ground, piece by piece ----
  /** Forgets every painted piece: the land changed, or a ground image just loaded. */
  function reset() { chunks.clear(); forgetFlora(); puffs.length = 0; pings.length = 0; blasts.length = 0; }
  /** Forgets the piece a tile is in: its ground changed. */
  function dirty(tx, ty) { chunks.delete(Math.floor(ty / CH) * NCX + Math.floor(tx / CH)); }
  /** The iso point of a piece's top-left corner. */
  const chunkAt = (cx, cy) => ({ x: (cx * CH - cy * CH - CH) * T + OX, y: (cx * CH + cy * CH) * T / 2 - TILE_TOP });
  function chunk(cx, cy) {
    const key = cy * NCX + cx;
    let c = chunks.get(key);
    if (c) { c.used = frameN; return c.cv; }
    if (chunks.size >= Math.max(KEEP, inView + 16)) { let old = null, ok = 0; for (const [k, v] of chunks) if (!old || v.used < old.used) { old = v; ok = k; } chunks.delete(ok); }
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CHH;
    const g = cv.getContext('2d'), o = chunkAt(cx, cy), x0 = cx * CH, y0 = cy * CH;
    for (let s = 0; s < CH * 2 - 1; s++) for (let x = Math.max(0, s - CH + 1); x <= Math.min(CH - 1, s); x++) { // back row first
      const X = x0 + x, Y = y0 + s - x;
      if (!Village.inMap(X, Y)) continue;
      const id = GROUND[Village.groundAt(X, Y)].sprite, img = Art.get(id, Math.floor(hash(X, Y, 5) * Art.frameCount(id)));
      g.drawImage(img, isoX(X * T, Y * T) - T - o.x, isoY(X * T, Y * T) - TILE_TOP - o.y);
    }
    chunks.set(key, { cv, used: frameN });
    return cv;
  }

  // ---- The fog, piece by piece ----
  // Over the land nobody has seen yet (js/explore.js) lies a dark veil, painted like the ground in
  // pieces of CH tiles and kept until the fog lifts near them. A piece is cut in small diamonds
  // (FOG_SUB to a tile's side) that fit edge to edge, so two never darken the same pixel; each takes
  // the veil's thickness at its middle, a little ragged, in three steps. A piece wholly under the fog
  // is one shared picture, a piece wholly seen is none: only the fog's edge costs pictures of its own.
  const FOG = '#120e1c', FOG_SUB = 2, FOG_STEPS = [0, 0.34, 0.66, 1], FOG_KEEP = 90, FH = CH * T;
  const fogs = new Map();                           // piece number -> { cv (null: no fog there), used, own }
  let fogFull = null, fogStamp = null, fogOwn = 0, fogA = -1;
  /** Forgets every piece of fog: the save changed, or the veil's darkness did. */
  function fogReset() { fogs.clear(); fogFull = null; fogOwn = 0; }
  /** Forgets the pieces of fog over a rectangle of tiles: the fog lifted there. */
  function fogDirty(tx0, ty0, tx1, ty1) {
    for (let y = Math.max(0, Math.floor(ty0 / CH)); y <= Math.min(NCY - 1, Math.floor((ty1 - 1) / CH)); y++) {
      for (let x = Math.max(0, Math.floor(tx0 / CH)); x <= Math.min(NCX - 1, Math.floor((tx1 - 1) / CH)); x++) {
        const key = y * NCX + x, c = fogs.get(key);
        if (c) { if (c.own) fogOwn--; fogs.delete(key); }
      }
    }
  }
  /** The iso point of a piece of fog's top-left corner (the ground's own, without the tile's thickness). */
  const fogAt = (cx, cy) => ({ x: (cx * CH - cy * CH - CH) * T + OX, y: (cx * CH + cy * CH) * T / 2 });
  /** Paints a piece of fog; with no piece given, the one that is fog all over. */
  function fogPaint(cx, cy) {
    const sub = T / FOG_SUB, n = CH * FOG_SUB, whole = cx == null;
    if (!fogStamp) { // one small diamond: rows of 2, 6, 10... pixels, so that neighbours meet without overlapping
      fogStamp = document.createElement('canvas'); fogStamp.width = sub * 2; fogStamp.height = sub;
      const sg = fogStamp.getContext('2d'); sg.fillStyle = FOG;
      for (let r = 0; r < sub; r++) { const hw = (r < sub / 2 ? r : sub - 1 - r) * 2 + 1; sg.fillRect(sub - hw, r, hw * 2, 1); }
    }
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = FH;
    const g = cv.getContext('2d'), a = tune.fog_alpha;
    for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) {
      let step = 3;
      if (!whole) {
        const X = cx * n + sx, Y = cy * n + sy;
        const v = Explore.veil((X + 0.5) / FOG_SUB, (Y + 0.5) / FOG_SUB) + (hash(X, Y, 61) - 0.5) * 0.2 + (hash(X >> 2, Y >> 2, 67) - 0.5) * 0.24;
        step = v < 0.34 ? 0 : v < 0.5 ? 1 : v < 0.66 ? 2 : 3;
        if (!step) continue;
      }
      g.globalAlpha = a * FOG_STEPS[step];
      g.drawImage(fogStamp, (sx - sy) * sub + CW / 2 - sub, (sx + sy) * sub / 2);
    }
    return cv;
  }
  /** The picture of the fog over a piece of ground, or null when there is none there. */
  function fogChunk(cx, cy) {
    const key = cy * NCX + cx;
    let c = fogs.get(key);
    if (c) { c.used = frameN; return c.cv; }
    const kind = Explore.veilKind(cx * CH, cy * CH, CH);
    c = { cv: null, used: frameN, own: kind === 2 };
    if (kind === 1) c.cv = fogFull || (fogFull = fogPaint());
    else if (kind === 2) {
      if (fogOwn >= Math.max(FOG_KEEP, inView + 16)) { let ok = -1, old = null; for (const [k, v] of fogs) if (v.own && (!old || v.used < old.used)) { old = v; ok = k; } fogs.delete(ok); fogOwn--; }
      c.cv = fogPaint(cx, cy); fogOwn++;
    }
    fogs.set(key, c);
    return c.cv;
  }

  // ---- What stands on the map ----
  /** A building's look: its upgrade tier (a new one every `milestone_levels` levels, 4 in all) and its chosen style. */
  const tier = lvl => Math.min(3, Math.floor(lvl / tune.milestone_levels));
  const LOOKS_BY_CLASS = 5; // a house has one look per citizen class (data/people.js), per style
  const frameOf = b => B[b.kind].decor ? 0 : B[b.kind].looks === 'stage' ? Math.max(0, (b.stage || 1) - 1) : B[b.kind].looks === 'class' ? (b.style || 0) * LOOKS_BY_CLASS + Math.min(LOOKS_BY_CLASS - 1, b.cls || 0) : (b.style || 0) * 4 + tier(b.lvl);
  /** Which look (0 for the first) a building shows now: its tier, or its class for a house. */
  const lookOf = b => B[b.kind].looks === 'class' ? Math.min(LOOKS_BY_CLASS - 1, b.cls || 0) : tier(b.lvl);
  /**
   * Where a building's sprite sits: centred on its footprint's diamond, its bottom on the
   * diamond's bottom corner. A sprite wider than the diamond (its own grass base is) reaches as
   * far below that corner as its base is wider, so the base stays centred. A decoration has no
   * base of its own: it stands in the middle of its diamond. Turned (rot 1), its image is drawn
   * in a mirror on the swapped footprint.
   */
  function footRect(kind, tx, ty, frame, rot, mask) {
    if (B[kind].wall) return wallRect(tx, ty, frame, mask || 0);
    const d0 = B[kind], d = Object.assign({ decor: d0.decor }, Village.size(kind, rot)), s0 = Art.get(d0.sprite, frame), s = rot && Village.canTurn(kind) ? Art.flip(s0) : s0;
    const mcx = (tx + d.w / 2) * T, mcy = (ty + d.h / 2) * T;
    const cx = Math.round(isoX(mcx, mcy));
    let base = isoY((tx + d.w) * T, (ty + d.h) * T), bottom = base + Math.max(0, Math.round((s.width - (d.w + d.h) * T) / 4));
    if (d.decor) { bottom = Math.round(isoY(mcx, mcy) + Math.min((d.w + d.h) * T / 4, s.width / 4)); base = bottom; }
    return { x: cx - (s.width >> 1), y: bottom - s.height, w: s.width, h: s.height, base, cx, mcx, mcy, s, frame, flip: s !== s0 };
  }
  const bRect = b => footRect(b.kind, b.x, b.y, frameOf(b), b.rot, B[b.kind].wall && !b.damaged ? Village.wallMask(b.x, b.y) : 0);

  // ---- Walls: pieces that join their neighbours ----
  // A wall is not one image but a post in the middle of its tile and, toward each side where
  // another wall stands, a half-length of wall reaching that side (a PixelLab building kit:
  // imagegen/pixellab/walls/). Laid together, a line of walls is one long wall, and its corners,
  // ends and crossings come out right on their own. Each piece is 52x42 art pixels, with the tile's
  // top corner at (WALL_X, WALL_Y). The joined pictures are made once per look and kept.
  const WALL_X = 26, WALL_Y = 21;
  const WALL_PARTS = [[1, 'n'], [8, 'w'], [0, 'hub'], [2, 'e'], [4, 's']]; // back pieces first: north and west lie behind the post
  const wallCache = new WeakMap(); // the post's image (one per look) -> mask -> joined picture
  function wallPicture(frame, mask) {
    const hub = Art.get('iso.wall.hub', frame);
    let byMask = wallCache.get(hub);
    if (!byMask) { byMask = new Map(); wallCache.set(hub, byMask); }
    let cv = byMask.get(mask);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = hub.width; cv.height = hub.height;
      const g = cv.getContext('2d'), miss = Art.get('fx.missing');
      let whole = hub !== miss;
      for (const [bit, part] of WALL_PARTS) if (!bit || mask & bit) { const s = Art.get('iso.wall.' + part, frame); if (s === miss) whole = false; else g.drawImage(s, 0, 0); }
      if (whole) byMask.set(mask, cv); // a piece still loading: drawn without it this time, composed again next time
    }
    return cv;
  }
  /** Where a wall's joined picture sits on its tile; the same fields as footRect's. */
  function wallRect(tx, ty, frame, mask) {
    const s = wallPicture(frame, mask), X = Math.round(isoX(tx * T, ty * T)), Y = Math.round(isoY(tx * T, ty * T));
    const mcx = (tx + 0.5) * T, mcy = (ty + 0.5) * T;
    return { x: X - WALL_X, y: Y - WALL_Y, w: s.width, h: s.height, base: isoY((tx + 1) * T, (ty + 1) * T), cx: X, mcx, mcy, s, frame, flip: false };
  }
  /** Where the tree or rock on a tile is drawn: its sprite, and the iso point of its foot. */
  function floraRect(tx, ty, f) {
    const d = FLORA[f - 1], n = Art.frameCount(d.sprite), s = Art.get(d.sprite, Math.floor(hash(tx, ty, 23) * n));
    const X = Math.round(isoX(tx * T + 8, ty * T + 8) + (hash(tx, ty, 19) - 0.5) * 8), Y = Math.round(isoY(tx * T + 8, ty * T + 8) + (hash(tx, ty, 29) - 0.5) * 3) + (d.foot == null ? 4 : d.foot);
    return { s, X, Y, x: X - (s.width >> 1), y: Y - s.height };
  }
  // The tree or rock on each tile, placed once and kept, so a frame zoomed out neither hashes nor
  // allocates for each of the thousands in view: tile index -> { y: its foot (the sort key), s, x,
  // top, k: the kind it was placed for, i }. A tile whose kind changed since is placed again; a
  // sprite image that loads, or a new land, forgets them all.
  let floraAt = [];
  function forgetFlora() { floraAt = []; }
  function floraItem(tx, ty, i, f) {
    if (floraAt.length !== Village.flora.length) floraAt = new Array(Village.flora.length).fill(null);
    let it = floraAt[i];
    if (!it || it.k !== f) { const r = floraRect(tx, ty, f); it = floraAt[i] = { y: r.Y, s: r.s, x: r.x, top: r.y, k: f, i }; }
    return it;
  }
  function opaque(s, x, y) {
    if (x < 0 || y < 0 || x >= s.width || y >= s.height) return false;
    let a = alphas.get(s);
    if (a === undefined) {
      // Opened from a double-click (file://), the browser lets no page read an image's pixels:
      // the click then falls back on the middle box of the sprite.
      try { a = s.getContext('2d').getImageData(0, 0, s.width, s.height).data; } catch (e) { a = null; }
      alphas.set(s, a);
    }
    if (!a) return x >= s.width * 0.15 && x < s.width * 0.85 && y >= s.height * 0.12;
    return a[(y * s.width + x) * 4 + 3] > 0;
  }
  /** The building under a map point: the nearest one whose drawn pixels are there. */
  function pickBuilding(wx, wy) {
    const X = Math.floor(isoX(wx, wy)), Y = Math.floor(isoY(wx, wy));
    let best = null;
    for (const b of state.buildings) { const r = bRect(b); if (opaque(r.s, X - r.x, Y - r.y) && (!best || r.base > best.r.base)) best = { b, r }; }
    return best && best.b;
  }
  /** The tile of the tree or rock whose drawn pixels are under a map point (the nearest one), or null. */
  function pickFlora(wx, wy) {
    const X = Math.floor(isoX(wx, wy)), Y = Math.floor(isoY(wx, wy)), tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    let best = null;
    for (let dy = -2; dy <= 7; dy++) for (let dx = -2; dx <= 7; dx++) { // a tall tree is clicked well above the tile it stands on
      const x = tx + dx, y = ty + dy;
      if (!Village.inMap(x, y) || !Explore.seen(x, y)) continue; // under the fog, or under a place found: nothing to click
      const f = Village.flora[Village.idx(x, y)]; if (!f) continue;
      const r = floraRect(x, y, f);
      if (opaque(r.s, X - r.x, Y - r.y) && (!best || r.Y > best.Y)) best = { tx: x, ty: y, Y: r.Y };
    }
    return best;
  }
  const inkTops = new WeakMap(); // sprite canvas -> its first row that holds a drawn pixel
  /** How far down a sprite its drawing starts (an image may keep empty rows above it). A fifth of its height when its pixels cannot be read (opaque()). */
  function inkTop(s) {
    let v = inkTops.get(s);
    if (v !== undefined) return v;
    opaque(s, 0, 0);
    const a = alphas.get(s);
    v = Math.round(s.height * 0.2);
    if (a) for (let i = 3; i < a.length; i += 4) if (a[i] > 0) { v = Math.floor(i / 4 / s.width); break; }
    inkTops.set(s, v);
    return v;
  }
  /** Where a place found in the wild is drawn (js/explore.js): centred on its footprint's diamond, as a building is. `top`: the iso y where its drawing starts. */
  function siteRect(st) {
    const s = Explore.sprite(st), n = DATA.explore.size, cx = Math.round(isoX(st.x, st.y)), base = isoY((st.tx + n) * T, (st.ty + n) * T);
    const bottom = base + Math.max(0, Math.round((s.width - 2 * n * T) / 4));
    return { x: cx - (s.width >> 1), y: bottom - s.height, w: s.width, h: s.height, base, cx, s, top: bottom - s.height + inkTop(s) };
  }
  /** The place found under a map point: the nearest one whose drawn pixels are there, or null. */
  function pickSite(wx, wy) {
    const X = Math.floor(isoX(wx, wy)), Y = Math.floor(isoY(wx, wy));
    let best = null;
    for (const st of Explore.shown()) { const r = siteRect(st); if (opaque(r.s, X - r.x, Y - r.y) && (!best || r.base > best.r.base)) best = { st, r }; }
    return best && best.st;
  }
  /** The top-left tile for a building of this kind (turned or not) with the pointer at its middle. */
  function ghostTile(kind, wx, wy, rot) { const d = Village.size(kind, rot); return { tx: Math.floor(wx / T - (d.w - 1) / 2), ty: Math.floor(wy / T - (d.h - 1) / 2) }; }
  function dust(b) { const r = bRect(b); for (let i = 0; i < 6; i++) puffs.push({ x: r.cx + (i - 2.5) * r.w / 7, y: r.base - 2, t: 0, k: i }); }
  function dustAt(tx, ty) { const X = isoX(tx * T + 8, ty * T + 8), Y = isoY(tx * T + 8, ty * T + 8); for (let i = 0; i < 4; i++) puffs.push({ x: X + (i - 1.5) * 4, y: Y + 2, t: 0, k: i + 1 }); }
  /** How high above the ground a tower's archer stands, for its arrows. */
  function towerTop(b) { const r = bRect(b); return Math.max(8, r.base - r.y - 14); }
  /**
   * A walking figure's sprite. With a sheet in assets/manifest.js (`iso.unit.<kind>`: one row per
   * way it faces, the first column standing, the others its walk) it turns with its step;
   * without one, the two drawn frames (js/art.js `unit.<kind>`).
   */
  const ROW = [2, 1, 0, 7, 6, 5, 4, 3]; // octant() -> the sheet's row: south, south-east, east, north-east, north, north-west, west, south-west
  function unitSprite(kind, dx, dy, moving, clock) {
    const id = 'iso.unit.' + kind, sh = Art.sheet(id);
    if (!sh && !Art.defs['unit.' + kind] && kind !== 'villager') return unitSprite('villager', dx, dy, moving, clock); // no art of its own yet: the villager's
    if (!sh) return Art.get('unit.' + kind, moving ? Math.floor(clock * 6) % 2 : 0);
    const col = moving && sh.cols > 1 ? 1 + Math.floor(clock * tune.walk_fps) % (sh.cols - 1) : 0;
    return Art.get(id, ROW[octant(dx, dy)] * sh.cols + col);
  }

  function ellipse(cx, cy, rx, ry, g = wg) { // filled, in whole pixels
    for (let dy = -ry; dy <= ry; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + 0.3)))); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
  }
  // The warm light around a building at work is three faint ellipses, a line of pixels at a time:
  // hundreds of small fills per building, every frame. Each size is painted once and kept (the
  // light breathes between a few sizes), its middle at (R0, round(R0 / 2)).
  const glows = new Map();
  function glowPicture(R0) {
    let cv = glows.get(R0);
    if (!cv) {
      const ry = Math.round(R0 * 0.5);
      cv = document.createElement('canvas'); cv.width = R0 * 2 + 1; cv.height = ry * 2 + 1;
      const g = cv.getContext('2d'); g.fillStyle = PAL.glow; g.globalAlpha = 0.11;
      for (let j = 0; j < 3; j++) ellipse(R0, ry, R0 - j * 7, Math.round((R0 - j * 7) * 0.5), g);
      glows.set(R0, cv);
    }
    return cv;
  }
  // The safe zone's dashed edge: a thousand dots and more, so painted once and kept until the zone,
  // the zoom or the alert changes. { key, cv, x, y }: x, y the iso point of the picture's top-left.
  let safe = null;
  function safePicture(hx, hy, r, dot, alert, bright) {
    const key = [hx, hy, r, dot, alert, bright].join();
    if (safe && safe.key === key) return safe;
    const n = Math.max(32, Math.floor(r * 6.283 / dot)), run = 4, pts = []; // dashes of `run` dots, as long as the gaps
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      if (Math.floor(i / run) % 2) continue;
      const a = i / n * 6.283, x = hx + Math.cos(a) * r, y = hy + Math.sin(a) * r, X = Math.round(isoX(x, y)), Y = Math.round(isoY(x, y));
      pts.push(X, Y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
    }
    const cv = document.createElement('canvas'); cv.width = x1 - x0 + dot; cv.height = y1 - y0 + dot * 2;
    const g = cv.getContext('2d');
    for (let i = 0; i < pts.length; i += 2) {
      const X = pts[i] - x0, Y = pts[i + 1] - y0;
      g.globalAlpha = bright ? 0.8 : 0.45; g.fillStyle = PAL.ink; g.fillRect(X, Y + dot, dot, dot);
      g.globalAlpha = bright ? 1 : 0.7; g.fillStyle = alert ? PAL.amberL : PAL.white; g.fillRect(X, Y, dot, dot);
    }
    return (safe = { key, cv, x: x0, y: y0 });
  }
  function ring(mx, my, r, color, o, dot = 1) { // a dotted circle on the ground, around a map point: a tower's reach, the safe zone
    wg.fillStyle = color;
    const n = Math.max(16, Math.floor(r * 6.28 / (3 * dot)));
    for (let i = 0; i < n; i += 2) { const a = i / n * 6.283, x = mx + Math.cos(a) * r, y = my + Math.sin(a) * r; wg.fillRect(Math.round(isoX(x, y)) - o.x, Math.round(isoY(x, y)) - o.y, dot, dot); }
  }
  function oval(cx, cy, rx, ry, color) { // the outline of an ellipse, in whole pixels: under a chosen soldier's feet
    wg.fillStyle = color;
    const n = Math.max(12, Math.round((rx + ry) * 2.2));
    for (let i = 0; i < n; i++) { const a = i / n * 6.283; wg.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); }
  }
  /** A footprint's diamond on the ground: filled at `alpha`, then its edge. */
  function diamond(tx, ty, w, h, color, alpha, o) {
    const pts = [[tx, ty], [tx + w, ty], [tx + w, ty + h], [tx, ty + h]].map(([x, y]) => [isoX(x * T, y * T) - o.x, isoY(x * T, y * T) - o.y]);
    const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
    wg.fillStyle = color;
    for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) {
      let a = Infinity, b = -Infinity;
      for (let i = 0; i < 4; i++) {
        const p = pts[i], q = pts[(i + 1) % 4];
        if ((y < p[1] && y < q[1]) || (y > p[1] && y > q[1]) || p[1] === q[1]) continue;
        const x = p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]);
        a = Math.min(a, x); b = Math.max(b, x);
      }
      if (b < a) continue;
      wg.globalAlpha = alpha; wg.fillRect(Math.round(a), y, Math.round(b) - Math.round(a) + 1, 1);
      wg.globalAlpha = 1; wg.fillRect(Math.round(a), y, 1, 1); wg.fillRect(Math.round(b), y, 1, 1);
    }
  }
  function frameRect(x, y, w, h, color) { // corner brackets around the chosen building
    wg.fillStyle = color;
    for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]]) {
      wg.fillRect(Math.min(px, px + sx * 5), py, 6, 1); wg.fillRect(px, Math.min(py, py + sy * 5), 1, 6);
    }
  }

  /**
   * Draws the village. `look`, from the screen: { sel, dim,
   *   ghost: { kind, tx, ty, ok, uid, rot }        a building being placed or moved, turned or not
   *   wall: { kind, tiles: [{ tx, ty, ok }] }      a rampart being drawn, not built yet
   *   tool: { tx, ty, ok, flora, trap }            the tile a land tool is over; flora: the tree it would plant; trap: the trap it would lay
   *   units: Set of ids                            the soldiers the player has selected
   *   zone: true                                   show the safe zone's edge brightly (something is being placed)
   *   roads: true                                  mark in red the paved tiles not joined to the hall (the path tool is in hand)
   *   touched: Set of uids, touchedColor           the houses the thing being placed would serve or embellish }
   */
  const d0wall = gh => !!B[gh.kind].wall;
  function draw(look) {
    clampCam(); frameN++;
    const k = zoom(), v = view(), VW = v.w, VH = v.h, o = origin(), cx = o.x, cy = o.y, t = state.t, list = [];
    if (wc.width !== VW || wc.height !== VH) { wc.width = VW; wc.height = VH; wg.imageSmoothingEnabled = false; }
    wg.fillStyle = SEA; wg.fillRect(0, 0, VW, VH);
    inView = 0;
    for (let s = 0; s < NCX + NCY - 1; s++) for (let x = Math.max(0, s - NCY + 1); x <= Math.min(NCX - 1, s); x++) {
      const p = chunkAt(x, s - x);
      if (!(p.x + CW <= cx || p.x >= cx + VW || p.y + CHH <= cy || p.y >= cy + VH)) inView++;
    }
    for (let s = 0; s < NCX + NCY - 1; s++) for (let x = Math.max(0, s - NCY + 1); x <= Math.min(NCX - 1, s); x++) { // the ground in view, back pieces first
      const p = chunkAt(x, s - x);
      if (p.x + CW <= cx || p.x >= cx + VW || p.y + CHH <= cy || p.y >= cy + VH) continue;
      wg.drawImage(chunk(x, s - x), p.x - cx, p.y - cy);
    }
    if (fogA !== tune.fog_alpha) { fogReset(); fogA = tune.fog_alpha; } // the veil's darkness was changed live
    for (let s = 0; s < NCX + NCY - 1; s++) for (let x = Math.max(0, s - NCY + 1); x <= Math.min(NCX - 1, s); x++) { // the fog over the land not seen yet, on the ground and under all that stands
      const p = fogAt(x, s - x);
      if (p.x + CW <= cx || p.x >= cx + VW || p.y + FH <= cy || p.y >= cy + VH) continue;
      const f = fogChunk(x, s - x);
      if (f) wg.drawImage(f, p.x - cx, p.y - cy);
    }

    // the signature: warm light spilling on the ground around every building at work
    for (const b of state.buildings) {
      const d = B[b.kind];
      if (!d.glow || b.damaged || b.starved) continue;
      const r = bRect(b);
      if (r.x > cx + VW + 40 || r.x + r.w < cx - 40 || r.y > cy + VH + 40 || r.y + r.h < cy - 40) continue;
      const R0 = (d.w + d.h) * 9 + 4 + Math.round(Math.sin(t * 5 + b.uid * 1.7));
      wg.drawImage(glowPicture(R0), r.cx - R0 - cx, Math.round(isoY(r.mcx, r.mcy)) - Math.round(R0 * 0.5) - cy);
    }

    // everything that stands, sorted by its feet so nearer things cover farther ones.
    // The tiles in view: u = x - y runs across the screen, v = x + y down it.
    const u0 = Math.floor((cx - OX) / T) - 3, u1 = Math.ceil((cx + VW - OX) / T) + 3, v0 = Math.floor(cy * 2 / T) - 2, v1 = Math.ceil((cy + VH) * 2 / T) + 10;
    wg.fillStyle = PAL.waterS;
    for (let vv = v0; vv <= v1; vv++) for (let u = u0 + ((u0 + vv) & 1); u <= u1; u += 2) {
      const x = (u + vv) / 2, y = (vv - u) / 2;
      if (!Village.inMap(x, y) || !Explore.seen(x, y)) continue; // under the fog (or under a place found) nothing that stands is drawn
      const i = Village.idx(x, y), f = Village.flora[i];
      if (look.roads && Village.groundAt(x, y) === PATH && !Village.net[i]) list.push({ y: -1e9, f: () => diamond(x, y, 1, 1, PAL.red, 0.35, o) }); // a paved tile cut off from the hall
      if (f) list.push(floraItem(x, y, i, f)); // placed once and kept: thousands stand in view zoomed out
      else if (Village.groundAt(x, y) === WATER) { // light on the water
        const h = hash(x, y, 31);
        if (h < 0.16 && (t * 1.5 + h * 40) % 3 < 1) wg.fillRect(Math.round(isoX(x * T + 8, y * T + 8)) - 1 - cx, Math.round(isoY(x * T + 8, y * T + 8)) - cy, 3, 1);
      }
    }
    if (state.raid.camp) { // the goblin camp: every raid leaves from it; its ruin, once the soldiers burnt it (js/camp.js)
      const c = state.raid.camp, n = Village.CAMP, ruin = c.down > 0, s = Art.get(ruin ? 'iso.goblin_camp_ruin' : 'iso.goblin_camp'), X = Math.round(isoX((c.x + n / 2) * T, (c.y + n / 2) * T)), base = Math.round(isoY((c.x + n) * T, (c.y + n) * T));
      const x = X - (s.width >> 1), y = base + Math.max(0, Math.round((s.width - 2 * n * T) / 4)) - s.height;
      if (!(x > cx + VW || x + s.width < cx || y > cy + VH || y + s.height < cy)) list.push({ y: base, f: () => {
        wg.drawImage(s, x - cx, y - cy);
        if (ruin) { // embers' smoke over the ruin
          for (let j = 0; j < 4; j++) { const ph = (t * 0.3 + j / 4) % 1; wg.globalAlpha = 0.5 * (1 - ph); wg.fillStyle = PAL.stoneL; wg.fillRect(X - 12 + j * 8 + Math.round(Math.sin(ph * 5 + j) * 2) - cx, base - 22 - Math.round(ph * 20) - cy, 3, 2); }
          wg.globalAlpha = 1;
          return;
        }
        if (state.raid.warned || state.raid.active) { const bob = Math.round(Math.sin(t * 6)); wg.drawImage(Art.get('fx.banner'), X - 14 - cx, y - 24 + bob - cy); }
        if (c.hp < c.max) { const bw = 48; wg.fillStyle = PAL.ink; wg.fillRect(X - bw / 2 - cx, y - 6 - cy, bw, 4); wg.fillStyle = PAL.red; wg.fillRect(X - bw / 2 + 1 - cx, y - 5 - cy, Math.round((bw - 2) * clamp(c.hp / c.max, 0, 1)), 2); }
      } });
      if (!ruin && c.guards) for (const g of c.guards) { // its garrison, at their posts or out at the soldiers
        const GX = Math.round(isoX(g.x, g.y)), GY = Math.round(isoY(g.x, g.y));
        if (GX < cx - 40 || GX > cx + VW + 40 || GY < cy - 40 || GY > cy + VH + 60) continue;
        list.push({ y: GY + 2, f: () => {
          if (Raid.drawFigure && Raid.drawFigure(wg, g, GX - cx, GY + 2 - cy, t)) return; // THREAT hook: a camp's chief draws himself (js/raid.js)
          const gs = unitSprite(g.kind, g.dx || 0, g.dy == null ? 1 : g.dy, g.hitting || Math.abs(g.x - g.px) + Math.abs(g.y - g.py) > 2, t * (g.hitting ? 1.6 : 1) + g.id * 0.31);
          const gx = GX - (gs.width >> 1) - cx, gy = GY + 2 - gs.height - cy;
          if (!(g.flash > 0)) wg.drawImage(gs, gx, gy);
          if (g.hp < g.max) { wg.fillStyle = PAL.ink; wg.fillRect(gx, gy - 3, gs.width, 3); wg.fillStyle = PAL.red; wg.fillRect(gx + 1, gy - 2, Math.round((gs.width - 2) * clamp(g.hp / g.max, 0, 1)), 1); }
        } });
      }
    }
    for (const b of state.buildings) {
      const d = B[b.kind], r = bRect(b);
      if (look.ghost && look.ghost.uid === b.uid) continue; // being moved: only its ghost shows
      if (r.x > cx + VW + 60 || r.x + r.w < cx - 60 || r.y > cy + VH + 60 || r.y + r.h < cy - 60) continue;
      list.push({ y: r.base, f: () => {
        wg.drawImage(r.s, r.x - cx, r.y - cy);
        if (b.damaged) wg.drawImage(Art.get('fx.damage'), r.cx - 8 - cx, r.base - 24 - cy);
        if (d.wall && !b.damaged && b.hp < Village.wallMax(b)) { wg.fillStyle = PAL.ink; wg.fillRect(r.x - cx, r.y - 3 - cy, r.w, 3); wg.fillStyle = PAL.greenL; wg.fillRect(r.x + 1 - cx, r.y - 2 - cy, Math.round((r.w - 2) * b.hp / Village.wallMax(b)), 1); }
        if (!d.wall && !b.damaged && b.siege > 0) { wg.fillStyle = PAL.ink; wg.fillRect(r.x - cx, r.y - 3 - cy, r.w, 3); wg.fillStyle = PAL.red; wg.fillRect(r.x + 1 - cx, r.y - 2 - cy, Math.round((r.w - 2) * clamp(1 - b.siege / tune.raid_building_hp, 0, 1)), 1); }
        if (b.craft) { wg.fillStyle = PAL.ink; wg.fillRect(r.x - cx, r.y - 4 - cy, r.w, 3); wg.fillStyle = PAL.fireL; wg.fillRect(r.x + 1 - cx, r.y - 3 - cy, Math.round((r.w - 2) * (1 - b.craft.left / b.craft.total)), 1); }
        if (b.train) { wg.fillStyle = PAL.ink; wg.fillRect(r.x - cx, r.y - 4 - cy, r.w, 3); wg.fillStyle = PAL.waterS; wg.fillRect(r.x + 1 - cx, r.y - 3 - cy, Math.round((r.w - 2) * (1 - b.train.left / b.train.total)), 1); }
        if (d.pop && b.cls > 0) { // the pennant of a house risen above the first class
          const fl = PAL[Village.classOf(b).flag] || PAL.white, wave = Math.round(Math.sin(t * 5 + b.uid));
          wg.fillStyle = PAL.ink; wg.fillRect(r.cx - 1 - cx, r.y - 9 - cy, 1, 11);
          wg.fillStyle = fl; wg.fillRect(r.cx - cx, r.y - 9 - cy, 4, 4); wg.fillRect(r.cx + 4 - cx, r.y - 9 + wave - cy, 3, 4);
        }
        if (look.sel === b.uid) frameRect(r.x - 2 - cx, r.y - 2 - cy, r.w + 4, r.h + 4, PAL.greenL);
        if (look.touched && look.touched.has(b.uid)) frameRect(r.x - 1 - cx, r.y - 1 - cy, r.w + 2, r.h + 2, look.touchedColor || PAL.amberL); // a house the thing being placed would serve or embellish
      } });
      if (d.worker && !b.damaged && !b.starved) { // its villager, walking to work and back, from its front corner
        const fx = (b.x + Village.dims(b).w) * T + 3, fy = (b.y + Village.dims(b).h) * T + 3;
        const goal = d.worker === 'hall' ? { x: (M.hall.x + 2) * T, y: (M.hall.y + 3) * T + 6 } : { x: fx + 24 + (b.uid % 3) * 8, y: fy + 6 + (b.uid % 2) * 12 };
        const ph = (t * 0.25 + b.uid * 0.37) % 2, kk = ph < 1 ? ph : 2 - ph, way = ph < 1 ? 1 : -1;
        const mx = fx + (goal.x - fx) * kk, my = fy + (goal.y - fy) * kk, X = Math.round(isoX(mx, my)), Y = Math.round(isoY(mx, my));
        list.push({ y: Y, f: () => {
          const s = unitSprite('villager', (goal.x - fx) * way, (goal.y - fy) * way, true, t + b.uid);
          wg.drawImage(s, X - (s.width >> 1) - cx, Y + 2 - s.height - cy);
          if (ph >= 1) { wg.fillStyle = PAL.plank; wg.fillRect(X - 2 - cx, Y - 9 - cy, 4, 3); }
        } });
      }
    }
    for (const st of Explore.shown()) { // the places found in the wild (js/explore.js): a ruin, a lair, a hamlet, a deposit
      const r = siteRect(st);
      if (r.x > cx + VW + 20 || r.x + r.w < cx - 20 || r.y > cy + VH + 20 || r.y + r.h < cy - 20) continue;
      list.push({ y: r.base, f: () => {
        wg.drawImage(r.s, r.x - cx, r.y - cy);
        if (Explore.flagged(st)) { // the village's pennant: a claimed deposit, a hamlet whose route is open
          const wave = Math.round(Math.sin(t * 5 + st.tx));
          wg.fillStyle = PAL.ink; wg.fillRect(r.cx - 1 - cx, r.top - 9 - cy, 1, 12);
          wg.fillStyle = PAL.red; wg.fillRect(r.cx - cx, r.top - 9 - cy, 4, 4); wg.fillRect(r.cx + 4 - cx, r.top - 9 + wave - cy, 3, 4);
        }
      } });
    }
    for (const f of Explore.figures()) { // the hero on his expedition and the scouts, walking the wild
      const X = Math.round(isoX(f.x, f.y)), Y = Math.round(isoY(f.x, f.y));
      if (X < cx - 40 || X > cx + VW + 40 || Y < cy - 40 || Y > cy + VH + 60) continue;
      list.push({ y: Y + 1, f: () => {
        const s = unitSprite(f.kind, f.dx, f.dy, f.moving, t + f.id * 0.37), x = X - (s.width >> 1) - cx, y = Y + 2 - s.height - cy;
        wg.drawImage(s, x, y);
        if (f.flag) { wg.fillStyle = PAL.ink; wg.fillRect(X + 4 - cx, y - 7, 1, 9); wg.fillStyle = PAL.amberL; wg.fillRect(X + 5 - cx, y - 7, 5, 3); } // scouts carry a small flag
      } });
    }
    if (!Hero.away()) { // the hero: at his post by the hall, or running at a raider
      const p = Raid.hero, sw = p.swing > 0, X = Math.round(isoX(p.x, p.y)), Y = Math.round(isoY(p.x, p.y));
      list.push({ y: Y, f: () => {
        const s = unitSprite('hero', p.dx, p.dy, p.moving || sw, t);
        wg.drawImage(s, X - (s.width >> 1) - cx, Y + 2 - s.height - cy);
        if (sw) { wg.fillStyle = PAL.white; wg.fillRect(X + 9 - cx, Y - 14 - cy, 6, 1); wg.fillRect(X + 11 - cx, Y - 11 - cy, 6, 1); }
      } });
    }
    const act = state.raid.active;
    if (act) for (const e of act.raiders) {
      if (e.wait > 0) continue;
      const p = Raid.pos(e), X = Math.round(isoX(p.x, p.y)), Y = Math.round(isoY(p.x, p.y));
      if (X < cx - 40 || X > cx + VW + 40 || Y < cy - 40 || Y > cy + VH + 60) continue;
      list.push({ y: Y + 2, f: () => {
        if (Raid.drawFigure && Raid.drawFigure(wg, e, X - cx, Y + 2 - cy, t)) return; // THREAT hook: a siege's warlord draws himself (js/raid.js)
        const s = unitSprite(e.kind, e.dx || 0, e.dy == null ? 1 : e.dy, true, t * (e.hitting ? 1.6 : 1) + e.id * 0.31);
        const x = X - (s.width >> 1) - cx, y = Y + 2 - s.height - cy;
        if (!(e.flash > 0)) wg.drawImage(Raid.tint ? Raid.tint(s) : s, x, y); // an elite raid's colour (js/raid.js)
        if (e.hp < e.max) { wg.fillStyle = PAL.ink; wg.fillRect(x, y - 3, s.width, 3); wg.fillStyle = PAL.red; wg.fillRect(x + 1, y - 2, Math.round((s.width - 2) * clamp(e.hp / e.max, 0, 1)), 1); }
      } });
    }
    for (const tp of state.raid.traps) { // the traps laid for this raid, flat on their tiles
      const s = Art.get(DATA.traps[tp.kind].sprite), X = Math.round(isoX(tp.x * T + 8, tp.y * T + 8)), Y = Math.round(isoY(tp.x * T + 8, tp.y * T + 8));
      if (X < cx - 40 || X > cx + VW + 40 || Y < cy - 40 || Y > cy + VH + 40) continue;
      list.push({ y: Y - 3, f: () => wg.drawImage(s, X - (s.width >> 1) - cx, Y + 6 - s.height - cy) });
    }
    for (const u of state.units) { // the villagers at work and the soldiers
      const X = Math.round(isoX(u.x, u.y)), Y = Math.round(isoY(u.x, u.y));
      if (X < cx - 40 || X > cx + VW + 40 || Y < cy - 40 || Y > cy + VH + 60) continue;
      const d = DATA.units[u.kind], sold = d.role === 'soldier', sel = !!look.units && look.units.has(u.id);
      if (sel) { // where he was sent, and the line to it
        const GX = Math.round(isoX(u.gx, u.gy)), GY = Math.round(isoY(u.gx, u.gy));
        if (Math.hypot(GX - X, GY - Y) > 6) { wg.fillStyle = PAL.greenL; wg.fillRect(GX - 1 - cx, GY - cy, 3, 1); wg.fillRect(GX - cx, GY - 1 - cy, 1, 3); }
      }
      list.push({ y: Y + 1, f: () => {
        if (sel) oval(X - cx, Y - cy, 9, 4, PAL.greenL);
        const s = unitSprite(d.sprite, u.dx || 0, u.dy == null ? 1 : u.dy, u.moving || u.swing > 0 || u.st === 'work', t + u.id * 0.37);
        const x = X - (s.width >> 1) - cx, y = Y + 2 - s.height - cy;
        if (!(u.flash > 0)) wg.drawImage(s, x, y);
        if (u.load > 0) { wg.fillStyle = PAL.ink; wg.fillRect(X - 3 - cx, y - 5, 6, 5); wg.fillStyle = CARRY[d.gathers] || PAL.plank; wg.fillRect(X - 2 - cx, y - 4, 4, 3); }
        if (sold && u.hp < Units.maxHp(u)) { wg.fillStyle = PAL.ink; wg.fillRect(x, y - 3, s.width, 3); wg.fillStyle = PAL.greenL; wg.fillRect(x + 1, y - 2, Math.round((s.width - 2) * clamp(u.hp / Units.maxHp(u), 0, 1)), 1); }
        if (sold && u.swing > 0 && Units.melee(u)) { wg.fillStyle = PAL.white; const sx = (u.dx || 0) - (u.dy || 0) >= 0 ? 1 : -1; wg.fillRect(X + sx * 9 - 3 - cx, Y - 13 - cy, 6, 1); wg.fillRect(X + sx * 11 - 3 - cx, Y - 10 - cy, 6, 1); }
      } });
    }
    const bk = look.sel != null && Units.barracks(); // the chosen barracks' rally point: a banner where its recruits go
    if (bk && bk.uid === look.sel && bk.rally) {
      const s = Art.get('iso.decor.banner'), X = Math.round(isoX(bk.rally.x, bk.rally.y)), Y = Math.round(isoY(bk.rally.x, bk.rally.y));
      list.push({ y: Y + 1, f: () => { oval(X - cx, Y - cy, 9, 4, PAL.greenL); wg.drawImage(s, X - (s.width >> 1) - cx, Y + 3 - s.height - cy); } });
    }
    list.sort((p, q) => p.y - q.y);
    const shakes = Village.shakes;
    for (const it of list) {
      if (it.f) { it.f(); continue; }
      const sh = shakes.size ? shakes.get(it.i) : 0, dx = sh > 0 ? Math.round(Math.sin(sh * 50) * 2) : 0; // a tree or rock (floraItem), shaking when just struck
      wg.drawImage(it.s, it.x + dx - cx, it.top - cy);
    }

    // chimney smoke, from the chimney of the building's current look
    for (const b of state.buildings) {
      const d = B[b.kind];
      if (!d.smoke || b.damaged) continue;
      const sm0 = d.smoke[lookOf(b)]; if (!sm0) continue; // a look with no chimney marked
      const r = bRect(b), sm = r.flip ? [r.w - 2 - sm0[0], sm0[1]] : sm0; // a turned chimney is on the mirrored side
      for (let j = 0; j < 3; j++) {
        const ph = (t * 0.4 + j / 3 + b.uid * 0.13) % 1;
        wg.globalAlpha = 0.55 * (1 - ph); wg.fillStyle = PAL.stoneL;
        wg.fillRect(r.x + sm[0] + Math.round(Math.sin(ph * 5 + b.uid) * 2) - cx, r.y + sm[1] - 2 - Math.round(ph * 14) - cy, 2 + (ph > 0.5 ? 1 : 0), 2);
      }
      wg.globalAlpha = 1;
    }
    for (const s of Raid.shots) { // arrows and bolts, from the tower's top to the raider
      const kk = clamp(s.t / 0.16, 0, 1);
      const X0 = isoX(s.x0, s.y0), Y0 = isoY(s.x0, s.y0) - s.z0, X1 = isoX(s.x1, s.y1), Y1 = isoY(s.x1, s.y1) - s.z1;
      const x = X0 + (X1 - X0) * kk, y = Y0 + (Y1 - Y0) * kk, dx = X1 - X0, dy = Y1 - Y0, n = Math.hypot(dx, dy) || 1;
      wg.fillStyle = s.magic ? PAL.cyan : PAL.white;
      for (let i = 0; i < (s.magic ? 8 : 4); i++) wg.fillRect(Math.round(x - dx / n * i) - cx, Math.round(y - dy / n * i) - cy, s.magic ? 2 : 1, s.magic ? 2 : 1);
    }
    for (const p of puffs) { wg.globalAlpha = 0.7 * (1 - p.t / 0.5); wg.fillStyle = PAL.wall; wg.fillRect(Math.round(p.x + (p.k - 2.5) * p.t * 10) - cx, Math.round(p.y - p.t * 16) - cy, 3, 3); }
    wg.globalAlpha = 1;
    for (const b of blasts) { // a keg going off: a flash that widens and fades
      const kk = b.t / 0.35, X = Math.round(isoX(b.x, b.y)) - cx, Y = Math.round(isoY(b.x, b.y)) - cy, R1 = Math.round(b.r * (0.4 + 0.6 * kk));
      wg.globalAlpha = 0.7 * (1 - kk); wg.fillStyle = PAL.fire; ellipse(X, Y - 4, R1, Math.round(R1 * 0.6));
      wg.fillStyle = PAL.fireL; ellipse(X, Y - 5, Math.round(R1 * 0.55), Math.round(R1 * 0.35));
      wg.globalAlpha = 1;
    }
    for (const p of pings) { const kk = p.t / 0.5; oval(Math.round(isoX(p.x, p.y)) - cx, Math.round(isoY(p.x, p.y)) - cy, Math.round(14 - 9 * kk), Math.round(7 - 4.5 * kk), PAL.greenL); }
    for (const p of Explore.pings) { // a place was just found: rings widening around it, thick enough to read from afar
      const X = Math.round(isoX(p.x, p.y)) - cx, Y = Math.round(isoY(p.x, p.y)) - cy, th = Math.max(1, Math.round(2 / k));
      for (let j = 0; j < 2; j++) {
        const kk = (p.t * 0.8 + j * 0.5) % 1;
        wg.globalAlpha = 1 - kk;
        for (let i = 0; i < th; i++) oval(X, Y, Math.round(12 + 44 * kk) + i, Math.round(6 + 22 * kk) + i, PAL.amberL);
      }
      wg.globalAlpha = 1;
    }

    // the safe zone's edge, over everything so the forest never hides it: no raider comes out
    // inside it. Pale dashes, gold and solid once the horn has sounded or something is being placed.
    {
      const h = Village.hallMid(), alert = state.raid.active || state.raid.warned, r = Village.safeRadius() * T, dot = Math.max(1, Math.round(3 / k)); // about three screen pixels thick at any zoom
      const z = safePicture(h.x, h.y, r, dot, !!alert, !!(alert || look.zone));
      wg.drawImage(z.cv, z.x - cx, z.y - cy);
    }
    // the raid's banner where the raiders come out of the wild, once the horn has sounded
    const from = state.raid.from;
    if (from && (state.raid.active || state.raid.warned)) {
      const bob = Math.round(Math.sin(t * 6));
      wg.drawImage(Art.get('fx.banner'), Math.round(isoX(from.x, from.y)) - 14 - cx, Math.round(isoY(from.x, from.y)) - 28 + bob - cy);
    }
    // a tower's reach, for the chosen one and for the one being placed
    const selB = look.sel && Village.byUid(look.sel);
    if (selB && B[selB.kind].service && !look.ghost) ring((selB.x + Village.dims(selB).w / 2) * T, (selB.y + Village.dims(selB).h / 2) * T, Village.serviceRadius(selB) * T, PAL.amberL, o, 2); // a chosen café's reach
    if (selB && B[selB.kind].tower && !look.ghost) ring((selB.x + Village.dims(selB).w / 2) * T, (selB.y + Village.dims(selB).h / 2) * T, B[selB.kind].tower.range * T, PAL.white, o);
    if (look.ghost) {
      const gh = look.ghost, d = Object.assign({ tower: B[gh.kind].tower }, Village.size(gh.kind, gh.rot)), moving = gh.uid && Village.byUid(gh.uid);
      const r = footRect(gh.kind, gh.tx, gh.ty, moving ? frameOf(moving) : 0, gh.rot, d0wall(gh) ? Village.wallMask(gh.tx, gh.ty) : 0);
      wg.globalAlpha = 0.8; wg.drawImage(r.s, r.x - cx, r.y - cy); wg.globalAlpha = 1;
      diamond(gh.tx, gh.ty, d.w, d.h, gh.ok ? PAL.greenL : PAL.red, 0.35, o); // over the sprite: its own grass base would hide it
      if (d.tower) ring((gh.tx + d.w / 2) * T, (gh.ty + d.h / 2) * T, d.tower.range * T, gh.ok ? PAL.white : PAL.red, o);
      const dd = B[gh.kind], gx = (gh.tx + d.w / 2) * T, gy = (gh.ty + d.h / 2) * T;
      if (dd.service) ring(gx, gy, dd.service.radius * T, PAL.amberL, o, 2);                                          // the houses it will serve
      if (dd.beauty) ring(gx, gy, (tune.beauty_radius + Math.max(d.w, d.h) / 2) * T, dd.beauty > 0 ? PAL.greenL : PAL.red, o); // the houses it embellishes, or spoils
      if (dd.pop) for (const sb of state.buildings) { const sd = B[sb.kind]; if (sd.service && !sb.damaged && Village.onRoad(sb)) ring((sb.x + Village.dims(sb).w / 2) * T, (sb.y + Village.dims(sb).h / 2) * T, Village.serviceRadius(sb) * T, PAL.amberL, o); }
    }
    if (look.wall) { // the rampart being drawn: joined to itself and to the walls already standing
      const tiles = look.wall.tiles, on = new Set(tiles.filter(t => t.ok).map(t => t.tx + ',' + t.ty)), also = (x, y) => on.has(x + ',' + y);
      for (const tl of tiles) diamond(tl.tx, tl.ty, 1, 1, tl.ok ? PAL.greenL : PAL.red, 0.3, o);
      wg.globalAlpha = 0.75;
      for (const tl of tiles.filter(t => t.ok).sort((p, q) => (p.tx + p.ty) - (q.tx + q.ty))) {
        const r = wallRect(tl.tx, tl.ty, 0, Village.wallMask(tl.tx, tl.ty, also));
        wg.drawImage(r.s, r.x - cx, r.y - cy);
      }
      wg.globalAlpha = 1;
    }
    if (look.tool) { // the tile a land tool is over, and the tree it would plant
      const tl = look.tool;
      diamond(tl.tx, tl.ty, 1, 1, tl.ok ? PAL.greenL : PAL.red, 0.35, o);
      if (tl.flora && tl.ok) { const r = floraRect(tl.tx, tl.ty, Village.FLORA.indexOf(tl.flora) + 1); wg.globalAlpha = 0.7; wg.drawImage(r.s, r.x - cx, r.y - cy); wg.globalAlpha = 1; }
      if (tl.trap && tl.ok) { const s = Art.get(DATA.traps[tl.trap].sprite), X = Math.round(isoX(tl.tx * T + 8, tl.ty * T + 8)), Y = Math.round(isoY(tl.tx * T + 8, tl.ty * T + 8)); wg.globalAlpha = 0.75; wg.drawImage(s, X - (s.width >> 1) - cx, Y + 6 - s.height - cy); wg.globalAlpha = 1; }
    }
    if (look.dim) { wg.globalAlpha = look.dim; wg.fillStyle = '#120e1c'; wg.fillRect(0, 0, VW, VH); wg.globalAlpha = 1; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); // straight to screen pixels: `zoom` of them per art pixel
    ctx.drawImage(wc, 0, 0, VW * k, VH * k);
    ctx.restore();
    if (!look.dim) Explore.drawOver(); // the marks over the places found, in the interface's own pixels (never on the title's backdrop)
  }
  /** A ring closing on a map point: where soldiers were just sent. */
  function ping(mx, my) { pings.push({ x: mx, y: my, t: 0 }); }
  /** A keg going off at a map point, `r` pixels wide. */
  function blast(mx, my, r) { blasts.push({ x: mx, y: my, r, t: 0 }); dustAt(Math.floor(mx / T), Math.floor(my / T)); }
  /** Moves the little things that are only drawn: dust, shaking trees, pings and blasts. */
  function tick(dt) {
    for (let i = pings.length - 1; i >= 0; i--) { pings[i].t += dt; if (pings[i].t > 0.5) pings.splice(i, 1); }
    for (let i = blasts.length - 1; i >= 0; i--) { blasts[i].t += dt; if (blasts[i].t > 0.35) blasts.splice(i, 1); }
    for (let i = puffs.length - 1; i >= 0; i--) { puffs[i].t += dt; if (puffs[i].t > 0.5) puffs.splice(i, 1); }
    for (const [i, s] of Village.shakes) { if (s - dt <= 0) Village.shakes.delete(i); else Village.shakes.set(i, s - dt); }
  }

  return {
    reset, dirty, forgetFlora, fogReset, fogDirty, siteRect, pickSite, draw, tick, iso, camOn, toWorld, toScreen, toScreenIso, bRect, frameOf, lookOf, tier, towerTop, pickBuilding, pickFlora, ghostTile,
    dust, dustAt, ping, blast, clampCam, view, zoom, zoomBy, zoomSteps, wpx, octant, unitSprite,
  };
})();
