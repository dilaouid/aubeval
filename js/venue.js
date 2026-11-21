// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The places entered full screen: the café, the market hall, the forge (data/venues.js). The whole
// screen is the inside of the place, its keeper stands in the middle, half-body and alive, speaks
// in a box at the bottom and offers a mini-game (js/minigames.js). A game played raises the hero's
// popularity (js/city.js) and leaves the place's gift for a few minutes, which the rest of the game
// reads through Venue.buff(key). Each place's game is ready again a few minutes after it was played.
//
// The pictures: 'venue.bg.<place>' (a backdrop) and 'venue.char.<keeper>' (a strip of frames) are
// used as soon as assets/manifest.js lists them. Until then the interior is painted here, in two
// layers (what is behind the keeper, and the counter in front of him), and the keeper is his
// 64x64 portrait strip drawn big. An optional 'venue.fg.<place>' is drawn over the keeper.
'use strict';

const Venue = (() => {
  const V = DATA.venues, ORDER = DATA.venueOrder, BUFFS = DATA.venueBuffs, C = UI.C;
  let v = null; // the visit in progress: { id, uid, mode, line, shown, game, res, k (the keeper's moves) }; never saved
  const BOX = { x: 244, y: 566, w: 722, h: 142 };   // the keeper's words
  const LEFT = { x: 12, y: 566, w: 220, h: 142 };   // the hero's popularity and the gifts that run
  const RIGHT = { x: 978, w: 290 };                 // the game's card (top) and the choices (bottom)
  const GLAD = { glad: 1, okay: 1, chain: 1 };      // the words of data/venues.js said with a smile; the others with a wince
  const ic = (id, alt) => UI.ready(id) ? id : alt;
  const lcg = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; // art-only randomness, never the game's

  // ---- What is saved (state.venue) ----
  /** A new game's part of the save: per place its streak, wait, best score, games played, talk; and the gifts that run. */
  function fresh() {
    const per = x => Object.fromEntries(ORDER.map(id => [id, x]));
    return { v: 1, streak: per(0), wait: per(0), best: per(0), played: per(0), met: per(0), chat: per(0), buffs: {} };
  }
  /** Fills what an older save lacks (called on the loaded data, before it becomes the state). */
  function adopt(data) {
    const base = fresh();
    if (!data.venue || typeof data.venue !== 'object') data.venue = base;
    const s = data.venue;
    for (const k in base) {
      if (s[k] == null || typeof s[k] !== typeof base[k]) s[k] = base[k];
      else if (typeof base[k] === 'object') for (const j in base[k]) if (typeof s[k][j] !== 'number') s[k][j] = base[k][j];
    }
    for (const k in s.buffs) if (!BUFFS[k] || !s.buffs[k] || !(s.buffs[k].left > 0)) delete s.buffs[k];
  }
  function S() { if (!state.venue || !state.venue.wait) adopt(state); return state.venue; }
  /** The clocks: each place's wait and each gift's time left. Runs in every scene (js/screens.js background). */
  function tick(dt) {
    const s = S();
    for (const id of ORDER) if (s.wait[id] > 0) s.wait[id] = Math.max(0, s.wait[id] - dt);
    for (const k in s.buffs) { s.buffs[k].left -= dt; if (s.buffs[k].left <= 0) delete s.buffs[k]; }
  }
  /** Time spent away from the game: the waits run on, the gifts do not outlive it. Nothing calls it yet (js/save.js catchUp could). */
  function away(secs) { tick(Math.max(0, secs)); }
  /** A place's gift, as a share: 'buy', 'sell' (market prices), 'atk' (the hero's attack), 'forge' (off forging time), 'pop' (popularity won at the games). 0 when none runs. */
  function buff(key) { const b = state && state.venue && state.venue.buffs ? state.venue.buffs[key] : null; return b && b.left > 0 ? Math.min(0.9, b.v) : 0; }
  /** Whether a building can be entered now: one of the places, standing whole, joined to the road, and no raid under way. */
  function has(b) { return !!b && !!V[b.kind] && !b.damaged && Village.onRoad(b) && !state.raid.active; }
  /** How hard a place's game is: its winning streak, up to config venue_streak_max. */
  function level(id) { return Math.min(S().streak[id] || 0, tune.venue_streak_max); }
  /** Seconds before a place's game can be played again; 0 when it is ready. */
  function waitOf(id) { return S().wait[id] || 0; }

  // ---- Drawing in whole pixels ----
  /** Draws a small pixel image with its top-left at a logical point, each of its pixels `k` logical units wide, rounded to whole screen pixels. Returns the size one pixel got. */
  function pix(img, x, y, k) {
    const s = Math.max(1, Math.round(k * SCALE)) / SCALE;
    ctx.drawImage(img, snap(x), snap(y), img.width * s, img.height * s);
    return s;
  }
  /** The one-pixel dark outline every painted figure gets (as js/art.js does for its own). */
  function outline(cv) {
    const c = cv.getContext('2d'), w = cv.width, h = cv.height, d = c.getImageData(0, 0, w, h).data;
    const a = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3];
    c.fillStyle = PAL.ink;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) c.fillRect(x, y, 1, 1);
  }
  function pen(cv) {
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c, a) => { if (a != null) g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); g.globalAlpha = 1; };
    const E = (cx, cy, rx, ry, c, a) => { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + 0.3)))); R(cx - hw, cy + dy, hw * 2 + 1, 1, c, a); } };
    const glow = (cx, cy, r, c, a) => { for (let i = r; i > 2; i -= 3) E(cx, cy, i, Math.round(i * 0.8), c, a); };
    const boards = (x, y, w, h, base, dark, light, step) => { R(x, y, w, h, base); for (let i = x; i < x + w; i += step) { R(i, y, 1, h, dark); R(i + 1, y, 1, h, light, 0.25); } };
    const bricks = (x, y, w, h, base, dark, light, bw, bh) => {
      R(x, y, w, h, base);
      const r = lcg(7);
      for (let j = 0, yy = y; yy < y + h; yy += bh, j++) {
        R(x, yy + bh - 1, w, 1, dark);
        for (let xx = x - (j % 2 ? bw / 2 : 0); xx < x + w; xx += bw) {
          R(xx, yy, 1, bh, dark);
          if (r() < 0.3) R(xx + 2, yy + 1, bw - 4, 1, light, 0.5);
          if (r() < 0.15) R(xx + 1, yy, bw - 1, bh - 1, dark, 0.25);
        }
      }
    };
    return { g, R, E, glow, boards, bricks };
  }

  // ---- The interiors, painted: `back` behind the keeper, `front` over him. Laid out around the
  // middle (cx, cy) of a picture about 320x180, so a wider or narrower window shows more or less
  // of the walls and never stretches a pixel. yC is the counter's top line.
  const PAINT = {
    cafe(e) {
      const { w, h, cx, cy, yC } = e, b = pen(e.back), f = pen(e.front), yF = yC + 4, r = lcg(21), ink = '#2a1a10';
      b.R(0, 0, w, h, '#f1d9a4'); // warm plaster
      for (let i = 0; i < 110; i++) b.R(r() * w, 9 + r() * (yC - 48), 2 + r() * 5, 1, i % 2 ? '#e3c58a' : '#fbeecb', 0.6);
      b.boards(0, yC - 34, w, 40, PAL.timber, PAL.timberD, PAL.timberL, 9); // the wainscot
      b.R(0, yC - 36, w, 2, PAL.timberL); b.R(0, yC - 34, w, 1, PAL.timberD);
      b.R(0, yF, w, h - yF, '#9a6234'); // the floor's boards
      for (let y = yF, j = 0; y < h; y += 6, j++) { b.R(0, y, w, 1, '#6b3f22'); for (let x = (j * 23) % 40; x < w; x += 40) b.R(x, y, 1, 6, '#6b3f22'); }
      b.R(0, yF, w, 2, '#472716', 0.6);
      // the back bar, behind the keeper: bottles and jars
      b.R(cx - 62, cy - 76, 124, yC - cy + 76, PAL.timberD); b.R(cx - 60, cy - 74, 120, yC - cy + 74, '#5a3320');
      for (const sy of [cy - 54, cy - 30, cy - 6]) {
        b.R(cx - 60, sy, 120, 2, PAL.plankD);
        for (let x = cx - 57; x < cx + 54; x += 7) {
          const c = ['#7fb069', '#d9801a', '#a81f33', '#f3ecd2', '#2c3f7a'][Math.floor(r() * 5)], hh = 6 + Math.floor(r() * 6);
          b.R(x, sy - hh, 4, hh, c); b.R(x + 1, sy - hh - 2, 2, 2, c); b.R(x, sy - hh, 1, hh, '#ffffff', 0.3);
        }
      }
      // the window, left: warm light, the roofs outside, red curtains
      const wx = cx - 142, wy = cy - 60, ww = 52, wh = 46;
      b.glow(wx + 26, wy + 23, 48, '#fff2a8', 0.07);
      b.R(wx - 3, wy - 3, ww + 6, wh + 6, PAL.timberD);
      for (let y = 0; y < wh; y++) { const t = y / wh; b.R(wx, wy + y, ww, 1, t < 0.4 ? '#fff6c4' : t < 0.75 ? '#ffe27a' : '#ffc64a'); }
      b.R(wx, wy + wh - 10, 18, 10, '#e89a3c'); b.R(wx + 4, wy + wh - 14, 10, 4, '#e89a3c'); b.R(wx + 22, wy + wh - 7, 30, 7, '#f0ac4e'); b.R(wx + 34, wy + wh - 17, 7, 10, '#e89a3c'); b.R(wx + 35, wy + wh - 20, 5, 3, '#d9801a');
      b.R(wx + 25, wy, 2, wh, PAL.timberD); b.R(wx, wy + 22, ww, 2, PAL.timberD); b.R(wx + 12, wy, 1, wh, PAL.timber); b.R(wx + 39, wy, 1, wh, PAL.timber);
      b.R(wx - 5, wy + wh + 3, ww + 10, 3, PAL.plank); b.R(wx - 5, wy + wh + 6, ww + 10, 1, PAL.plankD);
      for (let i = 0; i < 9; i++) { b.R(wx - 2, wy - 2 + i * 2, 10 - i, 2, i % 2 ? PAL.redD : PAL.red); b.R(wx + ww - 8 + i, wy - 2 + i * 2, 10 - i, 2, i % 2 ? PAL.redD : PAL.red); }
      for (let y = 0; y < yF + 24 - (wy + wh + 8); y++) b.R(wx + 4 + y * 0.7, wy + wh + 8 + y, ww - 6, 1, '#fff2a8', 0.11); // the light it throws
      // the menu on its slate, and two shelves of cups, right
      const bx = cx + 88, by = cy - 78;
      b.R(bx - 2, by - 2, 60, 28, PAL.timber); b.R(bx, by, 56, 24, '#2f3b38');
      for (let i = 0; i < 4; i++) { b.R(bx + 4, by + 4 + i * 5, 14 + r() * 16, 1, '#f3ecd2', 0.85); b.R(bx + 42, by + 4 + i * 5, 8, 1, '#ffd75e', 0.85); }
      for (const sy of [cy - 34, cy - 12]) {
        b.R(cx + 84, sy, 66, 2, PAL.plank); b.R(cx + 84, sy + 2, 66, 1, PAL.plankD); b.R(cx + 88, sy + 3, 2, 4, PAL.timberD); b.R(cx + 144, sy + 3, 2, 4, PAL.timberD);
        for (let x = cx + 87, i = 0; x < cx + 144; x += 8, i++) {
          if (i % 4 === 3) { b.R(x, sy - 9, 5, 9, ['#d9801a', '#a81f33', '#7fb069'][Math.floor(r() * 3)]); b.R(x, sy - 10, 5, 1, PAL.goldD); }
          else { b.R(x, sy - 5, 5, 5, '#f3ecd2'); b.R(x, sy - 5, 5, 1, '#ffffff'); b.R(x + 5, sy - 4, 1, 2, '#c9bf9c'); }
        }
      }
      // the beams, and a lamp either side of the keeper
      b.R(0, 0, w, 7, PAL.timberD); b.R(0, 2, w, 1, PAL.timber); b.R(0, 7, w, 2, ink);
      for (const px of [cx - 232, cx - 156, cx + 150, cx + 226]) { b.R(px, 0, 6, yF, PAL.timber); b.R(px, 0, 1, yF, PAL.timberL); b.R(px + 5, 0, 1, yF, PAL.timberD); }
      for (const lx of [cx - 76, cx + 76]) {
        b.R(lx, 9, 1, cy - 79, ink); b.glow(lx, cy - 62, 28, '#ffd84a', 0.05);
        b.R(lx - 4, cy - 70, 9, 2, PAL.goldD); b.R(lx - 5, cy - 68, 11, 3, PAL.gold); b.R(lx - 2, cy - 65, 5, 2, '#fff6c4');
      }
      // in front: the counter, the copper pot, the cups, the cake under its dome, a table in each corner
      const x0 = cx - 104;
      f.R(x0, yC + 6, 208, h, PAL.timber);
      for (let px = x0 + 6; px < x0 + 200; px += 40) { f.R(px, yC + 11, 36, h, PAL.timberD); f.R(px + 2, yC + 13, 32, h, '#5c341c'); f.R(px + 2, yC + 13, 32, 1, PAL.timberL, 0.5); }
      f.R(x0 - 3, yC, 214, 5, PAL.plank); f.R(x0 - 3, yC, 214, 1, '#ffe7a8'); f.R(x0 - 3, yC + 5, 214, 2, PAL.plankD); f.R(x0 - 3, yC + 7, 214, 1, ink, 0.5);
      const px = x0 + 12;
      f.R(px, yC - 13, 10, 13, '#c9762e'); f.R(px, yC - 13, 2, 13, '#f0a85a'); f.R(px + 8, yC - 13, 2, 13, '#8f4c1c'); f.R(px - 1, yC - 15, 12, 2, '#8f4c1c'); f.R(px + 3, yC - 18, 4, 3, '#c9762e');
      f.R(px - 4, yC - 11, 4, 2, '#c9762e'); f.R(px + 10, yC - 10, 3, 1, ink); f.R(px + 12, yC - 10, 1, 6, ink); f.R(px + 10, yC - 5, 3, 1, ink);
      for (let i = 0; i < 3; i++) { f.R(px + 20, yC - 4 - i * 4, 7, 4, '#f3ecd2'); f.R(px + 20, yC - 4 - i * 4, 7, 1, '#ffffff'); f.R(px + 27, yC - 3 - i * 4, 1, 2, '#c9bf9c'); }
      const kx = x0 + 178;
      f.R(kx - 2, yC - 2, 22, 2, '#f3ecd2'); f.R(kx + 2, yC - 9, 14, 7, '#8f4c26'); f.R(kx + 2, yC - 9, 14, 2, '#fff6e0'); f.R(kx + 8, yC - 11, 2, 2, PAL.red);
      f.R(kx, yC - 14, 18, 12, '#cfefff', 0.18); f.R(kx, yC - 15, 18, 1, '#ffffff', 0.7); f.R(kx - 1, yC - 14, 1, 12, '#ffffff', 0.6); f.R(kx + 18, yC - 14, 1, 12, '#ffffff', 0.6); f.R(kx + 8, yC - 17, 2, 2, PAL.gold);
      f.R(kx - 16, yC - 12, 9, 12, '#cfefff', 0.35); f.R(kx - 15, yC - 8, 7, 8, '#4a2a16'); f.R(kx - 16, yC - 14, 9, 2, PAL.goldD);
      const table = (tx, ty, candle) => {
        f.E(tx, ty + 2, 22, 4, PAL.plankD); f.E(tx, ty, 22, 4, PAL.plank); f.R(tx - 16, ty - 2, 26, 1, '#ffe7a8', 0.7); f.R(tx - 2, ty + 6, 4, h, PAL.timberD);
        f.R(tx - 10, ty - 6, 6, 5, '#f3ecd2'); f.R(tx - 10, ty - 6, 6, 1, '#4a2a16'); f.R(tx - 12, ty - 1, 10, 1, '#c9bf9c');
        if (candle) { f.R(tx + 6, ty - 9, 2, 8, '#f3ecd2'); f.R(tx + 6, ty - 12, 2, 3, PAL.fireL); f.glow(tx + 7, ty - 11, 10, '#ffd84a', 0.08); }
      };
      table(cx - 136, yC + 12, false); table(cx + 138, yC + 14, true);
    },
    market(e) {
      const { w, h, cx, cy, yC } = e, b = pen(e.back), f = pen(e.front), yF = yC + 2, r = lcg(33), ink = '#2a1a10';
      b.bricks(0, 0, w, yF, '#cdb88c', '#a48d68', '#e6d5aa', 16, 7); // sandstone
      b.R(0, 0, w, yF, '#5a3a20', 0.08);
      b.R(0, yF, w, h - yF, '#a5916e'); // cobbles
      for (let y = yF, j = 0; y < h; y += 5, j++) for (let x = -(j % 2) * 5; x < w; x += 10) { b.R(x, y, 9, 4, j % 2 ? '#b6a27c' : '#af9a74'); b.R(x, y, 9, 1, '#c9b68e'); }
      b.R(0, yF, w, 2, '#5a4630', 0.6);
      // the arch, left: daylight and the town's roofs
      const ax = cx - 126, ar = 27, top = cy - 62;
      const half = y => { const dy = y - (top + ar); return dy < 0 ? Math.round(ar * Math.sqrt(Math.max(0, 1 - dy * dy / (ar * ar)))) : ar; };
      for (let y = top - 3; y < yF; y++) { const hw = half(Math.max(top, y + 3)) + 3; b.R(ax - hw, y, hw * 2, 1, '#8f7a58'); }
      for (let y = top; y < yF; y++) { const t = (y - top) / (yF - top), hw = half(y); b.R(ax - hw, y, hw * 2, 1, t < 0.45 ? '#bfe6ff' : t < 0.65 ? '#dff2ff' : '#fff2c8'); }
      b.R(ax - 27, yF - 22, 24, 22, PAL.wall); b.R(ax - 27, yF - 28, 24, 6, ROOFS.orange.base); b.R(ax - 27, yF - 28, 24, 1, ROOFS.orange.light); b.R(ax - 20, yF - 16, 4, 5, PAL.dark); b.R(ax - 11, yF - 16, 4, 5, PAL.dark);
      b.R(ax - 1, yF - 32, 28, 32, PAL.wallD); b.R(ax - 1, yF - 39, 28, 7, ROOFS.slate.base); b.R(ax - 1, yF - 39, 28, 1, ROOFS.slate.light); b.R(ax + 6, yF - 26, 5, 6, PAL.dark); b.R(ax + 16, yF - 26, 5, 6, PAL.dark); b.R(ax + 10, yF - 12, 7, 12, PAL.door);
      b.R(ax - 27, yF - 3, 54, 3, PAL.path);
      for (let y = 0; y < 34; y++) b.R(ax - 27 + y * 0.8, yF + y, 54, 1, '#fff2c8', 0.17);
      // shelves of urns and baskets behind her
      for (const sy of [cy - 50, cy - 24]) {
        b.R(cx - 62, sy, 124, 3, PAL.plankD); b.R(cx - 62, sy + 3, 124, 1, ink, 0.5);
        for (let x = cx - 58; x < cx + 52; x += 12) { const u = r() < 0.5; b.R(x, sy - (u ? 11 : 7), 8, u ? 11 : 7, u ? '#c05c2c' : '#c9a878'); b.R(x, sy - (u ? 11 : 7), 8, 1, u ? '#e0844c' : '#e6cfa0'); if (u) b.R(x + 2, sy - 13, 4, 2, '#8f3f1f'); }
      }
      // the stall, right: its striped awning, sacks of spice, strings of garlic; bolts of cloth hung above
      const sx = cx + 88, sw = 72, ay = cy - 30;
      b.R(sx, ay + 9, sw, yF - ay - 9, '#3a2a1a', 0.3);
      for (let i = 0; i < sw; i += 8) {
        const col = (i / 8) % 2 ? '#f6eedb' : PAL.red;
        b.R(sx + i, ay, 8, 9, col); b.R(sx + i, ay, 8, 1, '#ffffff', 0.35); b.R(sx + i + 1, ay + 9, 6, 2, col); b.R(sx + i + 2, ay + 11, 4, 1, col);
      }
      b.R(sx, ay + 9, 2, yF - ay - 9, PAL.timberD); b.R(sx + sw - 2, ay + 9, 2, yF - ay - 9, PAL.timberD);
      for (let i = 0; i < 3; i++) { const gx = sx + 14 + i * 22; b.R(gx, ay + 11, 1, 5, ink); for (let j = 0; j < 3; j++) b.R(gx - 1, ay + 16 + j * 3, 3, 2, i === 1 ? PAL.redD : '#f3ecd2'); }
      b.R(sx + 2, yC - 16, sw - 4, 3, PAL.plank); b.boards(sx + 2, yC - 13, sw - 4, yF - yC + 13, PAL.timber, PAL.timberD, PAL.timberL, 8);
      for (let i = 0; i < 4; i++) {
        const qx = sx + 6 + i * 16, col = ['#ffc533', '#ea3b4a', '#ff8640', '#74d64c'][i];
        b.R(qx, yC - 25, 12, 9, '#c9a878'); b.R(qx, yC - 25, 12, 2, '#e6cfa0'); b.R(qx + 1, yC - 28, 10, 3, col); b.R(qx + 3, yC - 30, 6, 2, col); b.R(qx + 4, yC - 30, 2, 1, '#ffffff', 0.5);
      }
      b.R(sx + 2, 20, sw - 4, 2, PAL.timberD);
      for (let i = 0; i < 4; i++) {
        const qx = sx + 6 + i * 16, len = 24 + (i % 2) * 7, col = [PAL.violet, PAL.gold, ROOFS.azure.base, PAL.red][i], dk = [PAL.violetD, PAL.goldD, ROOFS.azure.dark, PAL.redD][i];
        b.R(qx, 22, 12, len, col); b.R(qx + 8, 22, 4, len, dk); b.R(qx, 22 + len - 5, 12, 2, '#fff6e0', 0.8); b.R(qx, 22 + len, 12, 1, dk);
      }
      // the hall's beam and posts, and a string of pennants under it
      b.R(0, 0, w, 8, PAL.timberD); b.R(0, 2, w, 1, PAL.timber); b.R(0, 8, w, 2, ink);
      for (const px of [cx - 236, cx - 160, cx - 88, cx + 80, cx + 162, cx + 236]) { b.R(px, 0, 6, yF, PAL.timber); b.R(px, 0, 1, yF, PAL.timberL); b.R(px + 5, 0, 1, yF, PAL.timberD); }
      for (let x = (cx % 10) - 10, i = 0; x < w; x += 10, i++) {
        const y0 = 11 + Math.round(3 * Math.abs(Math.sin((x - cx) * Math.PI / 164))), col = [PAL.red, PAL.gold, ROOFS.azure.base, PAL.violet, PAL.greenL][i % 5];
        b.R(x, y0 - 1, 10, 1, ink);
        for (let j = 0; j < 8; j++) b.R(x + 1 + j / 2, y0 + j, 8 - j, 1, col);
      }
      // in front: her table under its cloth, bowls of spice, the brass scales, crates and a barrel in the corners
      const x0 = cx - 106;
      f.R(x0 + 4, yC + 24, 204, h, '#4a2b18');
      f.R(x0, yC + 4, 212, 20, PAL.violetD);
      for (let x = x0 + 5; x < x0 + 210; x += 14) f.R(x, yC + 4, 2, 20, PAL.violet, 0.6);
      f.R(x0, yC + 21, 212, 2, PAL.gold); for (let x = x0; x < x0 + 212; x += 6) f.R(x, yC + 24, 3, 2, PAL.gold);
      f.R(x0 - 2, yC, 216, 4, PAL.plank); f.R(x0 - 2, yC, 216, 1, '#ffe7a8');
      for (let i = 0; i < 3; i++) { const qx = x0 + 8 + i * 15, col = [PAL.red, PAL.gold, PAL.greenL][i]; f.R(qx, yC - 4, 12, 4, '#f3ecd2'); f.R(qx + 1, yC - 1, 10, 1, '#c9bf9c'); f.R(qx + 1, yC - 7, 10, 3, col); f.R(qx + 3, yC - 9, 6, 2, col); }
      const cxs = cx + 84;
      f.R(cxs - 6, yC - 2, 12, 2, PAL.goldD); f.R(cxs - 1, yC - 22, 2, 20, PAL.gold); f.R(cxs - 2, yC - 24, 4, 2, PAL.goldD); f.R(cxs - 14, yC - 21, 28, 1, PAL.gold);
      for (const s of [-1, 1]) { f.R(cxs + s * 13, yC - 20, 1, 9, PAL.goldD); f.R(cxs + s * 13 - 5, yC - 11, 11, 2, PAL.gold); f.R(cxs + s * 13 - 4, yC - 9, 9, 1, PAL.goldD); }
      f.R(cxs - 16, yC - 13, 6, 2, PAL.red);
      const crate = (x, y, s, col) => {
        f.R(x, y, s, s, PAL.plank); f.R(x, y, s, 2, PAL.plankD); f.R(x, y + s - 2, s, 2, PAL.plankD); f.R(x, y, 2, s, PAL.plankD); f.R(x + s - 2, y, 2, s, PAL.plankD); f.R(x + 2, y + s / 2 - 1, s - 4, 1, PAL.plankD);
        for (let i = 0; i < Math.floor((s - 2) / 5); i++) { f.R(x + 2 + i * 5, y - 3, 4, 4, col); f.R(x + 3 + i * 5, y - 3, 1, 1, '#ffffff', 0.6); }
      };
      crate(cx - 162, yC - 4, 24, PAL.red); crate(cx - 136, yC + 6, 20, PAL.amber);
      const bx = cx + 134;
      f.R(bx, yC - 6, 20, h, PAL.timber); f.R(bx, yC - 6, 3, h, PAL.timberL); f.R(bx + 16, yC - 6, 4, h, PAL.timberD); f.R(bx, yC - 1, 20, 2, PAL.steelD); f.R(bx, yC + 14, 20, 2, PAL.steelD); f.E(bx + 10, yC - 6, 10, 2, PAL.timberL);
      f.R(bx - 20, yC + 6, 16, h, '#c9a878'); f.R(bx - 20, yC + 6, 16, 2, '#e6cfa0'); f.R(bx - 14, yC + 2, 4, 4, '#c9a878');
    },
    forge(e) {
      const { w, h, cx, cy, yC } = e, b = pen(e.back), f = pen(e.front), yF = yC + 2, r = lcg(45), ink = '#1b1014';
      b.bricks(0, 0, w, yF, '#6a5650', '#46383a', '#84706a', 16, 7); // dark, warm stone
      for (let y = 0; y < 44; y++) b.R(0, y, w, 1, ink, 0.4 * (1 - y / 44)); // soot under the roof
      b.R(0, yF, w, h - yF, '#544644'); // slabs
      for (let y = yF, j = 0; y < h; y += 8, j++) { b.R(0, y, w, 1, '#3a2e30'); for (let x = (j * 17) % 32; x < w; x += 32) b.R(x, y, 1, 8, '#3a2e30'); }
      // the hearth, left: its hood, its mouth, the coals
      const hx = cx - 154, hw = 64, top = cy - 30, ox = hx + 8, ow = hw - 16;
      for (let y = 9; y < top; y++) { const t = (y - 9) / (top - 9), hf = 14 + t * 20; b.R(hx + hw / 2 - hf, y, hf * 2, 1, '#4a3c3e'); b.R(hx + hw / 2 - hf, y, 2, 1, '#6a5a58'); b.R(hx + hw / 2 + hf - 2, y, 2, 1, '#2e2428'); }
      b.R(hx, top + 4, hw, yF - top - 4, '#7a6860');
      for (let y = top + 10; y < yF; y += 7) b.R(hx, y, hw, 1, '#5a4a48');
      b.R(hx - 3, top, hw + 6, 5, '#8a7668'); b.R(hx - 3, top, hw + 6, 1, '#a89484');
      b.R(ox, top + 12, ow, yF - top - 12, ink); b.R(ox + 3, top + 9, ow - 6, 3, ink); b.R(ox + 7, top + 7, ow - 14, 2, ink);
      b.glow(hx + hw / 2, yF - 10, 84, PAL.fire, 0.035);
      b.R(ox + 5, yF - 6, 18, 3, '#3a2416'); b.R(ox + 20, yF - 8, 20, 3, '#4a2b18');
      for (let i = 0; i < ow - 4; i += 2) { const hh = 2 + Math.floor(r() * 4); b.R(ox + 2 + i, yF - hh, 2, hh, [PAL.fire, PAL.fireL, '#ff4a1a', PAL.amberL][Math.floor(r() * 4)]); }
      b.R(ox + 2, yF - 1, ow - 4, 1, '#fff2a8');
      // tools on the wall, right, and finished blades under them
      b.R(cx + 82, cy - 52, 72, 3, PAL.timber); b.R(cx + 82, cy - 49, 72, 1, ink);
      let tx = cx + 90;
      b.R(tx, cy - 48, 2, 20, PAL.plankD); b.R(tx - 3, cy - 30, 8, 5, PAL.steelD); b.R(tx - 3, cy - 30, 8, 1, PAL.steel);
      tx = cx + 104; b.R(tx, cy - 48, 1, 24, PAL.steelD); b.R(tx + 3, cy - 48, 1, 24, PAL.steelD); b.R(tx, cy - 34, 4, 1, PAL.steel); b.R(tx - 1, cy - 25, 2, 3, PAL.steelD); b.R(tx + 3, cy - 25, 2, 3, PAL.steelD);
      for (const hx2 of [cx + 114, cx + 127]) { b.R(hx2, cy - 46, 2, 9, PAL.steel); b.R(hx2 + 6, cy - 46, 2, 9, PAL.steel); b.R(hx2, cy - 38, 8, 2, PAL.steel); b.R(hx2 + 3, cy - 49, 2, 3, ink); }
      tx = cx + 144; b.R(tx, cy - 48, 3, 22, PAL.steelD); b.R(tx, cy - 48, 1, 22, PAL.steel); b.R(tx - 1, cy - 27, 5, 5, PAL.timberL);
      b.R(cx + 84, cy - 14, 68, 2, PAL.timber); b.R(cx + 84, cy - 12, 68, 1, ink);
      for (let i = 0; i < 3; i++) { const sx = cx + 94 + i * 22; b.R(sx, cy - 21, 2, 7, PAL.trunk); b.R(sx - 1, cy - 23, 4, 2, PAL.gold); b.R(sx - 4, cy - 11, 10, 2, PAL.gold); b.R(sx, cy - 9, 2, 26, PAL.steel); b.R(sx, cy - 9, 1, 26, PAL.steelL); b.R(sx, cy + 17, 1, 2, PAL.steel); }
      // the roof's beams, and chains hanging either side of the smith
      b.R(0, 0, w, 7, '#2e2022'); b.R(0, 2, w, 1, '#4a3432'); b.R(0, 7, w, 2, ink);
      for (const px of [cx - 240, cx + 160, cx + 236]) { b.R(px, 0, 6, yF, '#3e2c28'); b.R(px, 0, 1, yF, '#5a4038'); }
      for (const x of [cx - 76, cx + 74]) { for (let y = 9; y < cy - 44; y += 3) b.R(x + (y % 2), y, 2, 2, PAL.steelD); b.R(x - 1, cy - 44, 4, 2, PAL.steelD); b.R(x + 2, cy - 42, 1, 4, PAL.steelD); b.R(x - 1, cy - 38, 3, 1, PAL.steelD); }
      // in front: the bench with its iron bands, ingots and a hammer on it, the quenching barrel, the anvil on its stump
      const x0 = cx - 106;
      f.boards(x0, yC + 8, 212, h, '#5c3a22', '#3a2416', '#7a4e2c', 12);
      f.R(x0, yC + 16, 212, 3, '#3a3a48'); for (let x = x0 + 5; x < x0 + 212; x += 12) f.R(x, yC + 17, 1, 1, PAL.steel);
      f.R(x0 - 2, yC, 216, 6, '#8f5229'); f.R(x0 - 2, yC, 216, 1, '#b0703c'); f.R(x0 - 2, yC + 6, 216, 2, '#472716');
      for (let i = 0; i < 3; i++) { f.R(x0 + 8 + i * 9, yC - 4, 8, 4, PAL.steelD); f.R(x0 + 8 + i * 9, yC - 4, 8, 1, PAL.steel); }
      for (let i = 0; i < 2; i++) { f.R(x0 + 12 + i * 9, yC - 8, 8, 4, PAL.steel); f.R(x0 + 12 + i * 9, yC - 8, 8, 1, PAL.steelL); }
      f.R(cx + 68, yC - 3, 24, 2, PAL.plankD); f.R(cx + 90, yC - 7, 7, 7, PAL.steelD); f.R(cx + 90, yC - 7, 7, 1, PAL.steel);
      const qx = cx - 160;
      f.R(qx, yC + 2, 28, h, PAL.timber); f.R(qx, yC + 2, 3, h, PAL.timberL); f.R(qx + 24, yC + 2, 4, h, PAL.timberD); f.R(qx, yC + 8, 28, 2, PAL.steelD); f.E(qx + 14, yC + 2, 13, 3, '#3a6ea8'); f.R(qx + 6, yC + 1, 8, 1, '#9fd0ff');
      const sx = cx + 124;
      f.R(sx, yC + 12, 32, h, PAL.trunk); f.R(sx, yC + 12, 3, h, '#8a5a3a'); f.E(sx + 16, yC + 12, 16, 3, PAL.timberL);
      f.R(sx - 2, yC - 6, 36, 6, PAL.steelD); f.R(sx - 2, yC - 6, 36, 1, PAL.steelL); f.R(sx - 10, yC - 5, 8, 3, PAL.steelD); f.R(sx - 14, yC - 4, 4, 1, PAL.steelD);
      f.R(sx + 9, yC, 14, 5, '#5a6480'); f.R(sx + 4, yC + 5, 24, 5, PAL.steelD); f.R(sx + 4, yC + 5, 24, 1, PAL.steel);
    },
  };
  /** What moves in a painted interior, drawn each frame on its pixel grid: steam, dust in the light, flames and sparks. */
  const AMBIENT = {
    cafe(B, t, a) {
      const px = B.cx - 92 + 5, y0 = B.yC - 20;
      for (let i = 0; i < 4; i++) { const p = (t * 0.35 + i / 4) % 1; a(px + Math.round(Math.sin(p * 6 + i * 2) * 2), y0 - p * 18, 1, 2, '#ffffff', 0.55 * (1 - p)); }
      a(B.cx + 138 + 6, B.yC + 14 - 13 - (Math.floor(t * 8) % 2), 2, 1, PAL.fireL, 1);
    },
    market(B, t, a) {
      for (let i = 0; i < 9; i++) { const p = (t * 0.08 + i * 0.137) % 1; a(B.cx - 150 + i * 6 + Math.sin(t * 0.7 + i) * 3, B.yC - 50 + p * 70, 1, 1, '#fff8d8', 0.6 * Math.sin(p * Math.PI)); }
    },
    forge(B, t, a) {
      const ox = B.cx - 146, yF = B.yC + 2;
      for (let i = 0; i < 8; i++) { const hh = 5 + Math.round(5 * Math.abs(Math.sin(t * 6 + i * 1.7))); a(ox + 3 + i * 5, yF - 3 - hh, 4, hh, PAL.fire, 1); a(ox + 4 + i * 5, yF - 1 - hh + 2, 2, hh - 2, PAL.fireL, 1); }
      for (let i = 0; i < 12; i++) { const p = (t * 0.45 + i * 0.283) % 1; a(ox + 24 + Math.sin(i * 12.9) * 18 + p * 16 * Math.sin(i * 3.1), yF - 12 - p * 78, 1, 1, p < 0.5 ? PAL.fireL : PAL.fire, 1 - p); }
    },
  };
  const rooms = {}; // place -> { key, back, front, w, h, cx, cy, yC }: painted once per window size
  /** The interior of a place at the window's size, and how it sits on the screen: n screen pixels per art pixel, k logical units per art pixel. */
  function backdrop(id) {
    const n = Math.max(1, Math.round(canvas.width / 320)), w = Math.ceil(canvas.width / n), h = Math.ceil(canvas.height / n), key = w + 'x' + h;
    let e = rooms[id];
    if (!e || e.key !== key) {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
      e = rooms[id] = { key, back: mk(), front: mk(), w, h, cx: Math.floor(w / 2), cy: Math.floor(h / 2) };
      e.yC = e.cy + 28;
      PAINT[id](e);
    }
    e.n = n; e.k = n / SCALE; e.real = Art.loaded('venue.bg.' + id);
    return e;
  }
  /** An image fitted over the whole screen, keeping its shape: what spills is cut evenly. */
  function cover(img) {
    const s = Math.max(W / img.width, H / img.height), dw = img.width * s, dh = img.height * s;
    ctx.imageSmoothingEnabled = s * SCALE < 1; // only a picture bigger than the screen is smoothed down
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.imageSmoothingEnabled = false;
  }

  // ---- The keeper ----
  const LOOKS = { innkeeper: ['#7a3b1c', '#e8d9b0', '#8f5229'], merchant: ['#a81f33', '#5c2a9e', '#9148e6'], smith: ['#3a2416', '#d99f78', '#5c3a22'], other: ['#70452a', '#2c3f7a', '#42ab3e'] };
  const busts = {};
  /** A plain painted bust, for a face whose portrait has not loaded: hair, cloth and apron by who it is. */
  function bust(id, frame) {
    const key = id + '#' + frame;
    if (busts[key]) return busts[key];
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    const p = pen(cv), [hair, cloth, apron] = LOOKS[id] || LOOKS.other;
    p.E(32, 66, 25, 20, cloth); p.R(22, 46, 20, 18, apron); p.R(27, 36, 10, 9, PAL.skinD); p.E(32, 26, 12, 13, PAL.skin);
    p.E(32, 16, 13, 6, hair); p.R(19, 16, 3, 10, hair); p.R(42, 16, 3, 10, hair);
    if (frame) { p.R(26, 26, 4, 1, PAL.ink); p.R(35, 26, 4, 1, PAL.ink); } else { p.R(27, 25, 2, 3, PAL.ink); p.R(36, 25, 2, 3, PAL.ink); }
    p.R(31, 28, 2, 3, PAL.skinD); p.R(29, 33, 6, 1, PAL.redD);
    outline(cv);
    return busts[key] = cv;
  }
  /** How many frames a town face has. */
  function faceCount(id) { const sh = Art.sheet('portrait.' + id); return Art.loaded('portrait.' + id) ? (sh ? sh.frames.length : 1) : 2; }
  /** A frame of a town face (data/people.js keeper ids, and the guide): its 64x64 portrait, or a painted bust until it loads. */
  function face(id, frame) { const n = faceCount(id), f = ((frame | 0) % n + n) % n; return Art.loaded('portrait.' + id) ? Art.get('portrait.' + id, f) : bust(id, f); }

  function drawKeeper(B) {
    const d = V[v.id], K = v.k, kid = d.keeper, rid = 'venue.char.' + kid, real = Art.loaded(rid), sh = real ? Art.sheet(rid) : null;
    const n = real ? (sh ? sh.frames.length : 1) : faceCount(kid);
    const fr = K.faceT > 0 ? K.face : Math.floor(v.anim);
    const img = real ? Art.get(rid, ((fr % n) + n) % n) : face(kid, fr);
    let s; // logical units per pixel of the keeper
    if (real) { s = d.tall * H / img.height; if (s * SCALE >= 1) s = Math.round(s * SCALE) / SCALE; }
    else s = 2 * B.n / SCALE; // the portrait: each of its pixels two of the interior's
    const feet = B.real ? d.line * H : (B.yC + 10) * B.k, talking = v.mode === 'talk' && v.shown < v.line.length;
    const bob = talking ? -Math.round(Math.abs(Math.sin(v.t * 10)) * 1.4) : Math.round(Math.sin(v.t * Math.PI * 2 / 3.4)); // a slow breath; a quicker nod while speaking
    const hop = K.hop > 0 ? -Math.round(Math.sin((1 - K.hop / K.hopT) * Math.PI) * 5) : 0;
    const shake = K.shake > 0 ? Math.round(Math.sin(v.t * 70) * 3 * K.shake / 0.4) : 0;
    const x = 640 - img.width * s / 2 + shake * s + K.gone * K.gone * 900, y = feet - img.height * s + (bob + hop) * s;
    ctx.imageSmoothingEnabled = s * SCALE < 1;
    ctx.drawImage(img, snap(x), snap(y), img.width * s, img.height * s);
    ctx.imageSmoothingEnabled = false;
    K.top = y; K.h = img.height * s;
  }
  /** The word the keeper throws during a game, in a small plate over his head. */
  function drawWord() {
    const K = v.k;
    if (!(K.wordT > 0) || !K.word) return;
    const w = UI.width(K.word, 17, true) + 36, x = clamp(792 + K.gone * K.gone * 600, 8, W - w - 8), y = 128 + Math.round(Math.max(0, K.wordT - 1.2) * 80);
    ctx.globalAlpha = clamp(K.wordT * 4, 0, 1);
    UI.plate(x, y, w, 40, K.wordBad ? 'bad' : null); UI.label(K.word, x + w / 2, y + 21, 17, K.wordBad ? '#ffffff' : C.gold);
    ctx.fillStyle = C.lineL; ctx.fillRect(x - 6, y + 16, 8, 8); ctx.fillRect(x - 10, y + 18, 4, 4); // it comes from his mouth
    ctx.globalAlpha = 1;
  }
  /**
   * The keeper reacts during a game (js/minigames.js calls it): `kind` names a list of words in
   * data/venues.js ('glad', 'okay', 'chain': a hop and a smile; any other: a shake and a frown).
   * `word` says this instead.
   */
  function react(kind, word) {
    if (!v) return;
    const d = V[v.id], K = v.k, glad = !!GLAD[kind], list = d[kind], F = Art.loaded('venue.char.' + d.keeper) ? d.faces : d.faces64;
    if (glad) { K.hop = K.hopT = kind === 'okay' ? 0.22 : 0.4; K.face = F.glad; } else { K.shake = 0.4; K.face = F.cross; }
    K.faceT = 0.9;
    const w = word || (Array.isArray(list) ? list[K.said++ % list.length] : list);
    if (w && (word || K.wordT < 0.75)) { K.word = w; K.wordT = 1.3; K.wordBad = !glad; }
  }

  // ---- The visit ----
  function say(line) { v.line = line; v.shown = 0; }
  const pick = list => list[Math.floor(state.t) % list.length]; // which of a keeper's lines: not a gameplay draw
  function enter(id, b) {
    const s = S(), d = V[id];
    v = { id, uid: b ? b.uid : null, mode: 'talk', line: '', shown: 0, t: 0, anim: 0, focus: 0, game: null, res: null, pause: false, count: 0, go: 0, bot: null, held: false,
      k: { hop: 0, hopT: 0.4, shake: 0, face: 0, faceT: 0, word: '', wordT: 0, wordBad: false, said: 0, away: false, gone: 0, top: 0, h: 0 } };
    say(!s.met[id] ? d.greet : s.wait[id] > 0 ? pick(d.wait) : pick(d.ready));
    s.met[id] = 1;
    scene = 'venue';
  }
  /** Enters a place: the scene becomes 'venue'. Does nothing when the building cannot be entered now (Venue.has). */
  function open(b) { if (!has(b)) return; sfx('unlock'); enter(b.kind, b); }
  /** Back to the village, the building's panel still open. */
  function leave() {
    const uid = v.uid;
    v = null; scene = 'play';
    if (uid != null && Village.byUid(uid)) { ui.sel = uid; ui.panel = 'building'; }
  }
  /** A word on the city as it is now, in the keeper's own way: what the houses lack, what stands idle, what is coming. */
  function advice(d) {
    const s = S(), B = DATA.buildings, RES = DATA.resources, low = x => x.charAt(0).toLowerCase() + x.slice(1), out = [];
    const intro = d.tips[(s.chat[v.id] >> 1) % d.tips.length], say1 = (key, vars) => out.push(tr(key, Object.assign({ intro }, vars)));
    const lack = {}, svc = {};
    for (const b of state.buildings) if (B[b.kind].pop) { if (b.lack) lack[b.lack] = (lack[b.lack] || 0) + 1; if (b.lackSvc) svc[b.lackSvc] = (svc[b.lackSvc] || 0) + 1; }
    const most = o => Object.keys(o).sort((p, q) => o[q] - o[p])[0];
    if (most(lack)) say1('vn_tip_lack', { n: lack[most(lack)], res: low(RES[most(lack)].name) });
    if (most(svc) && B[most(svc)]) say1('vn_tip_svc', { n: svc[most(svc)], name: B[most(svc)].name });
    const off = state.buildings.find(b => Village.needsRoad(b.kind) && !Village.onRoad(b));
    if (off) say1('vn_tip_road', { name: B[off.kind].name });
    const hurt = state.buildings.filter(b => b.damaged).length;
    if (hurt) say1('vn_tip_damaged', { n: hurt });
    const idle = state.buildings.find(b => b.starved && !b.paused && RES[b.starved]);
    if (idle) say1('vn_tip_starved', { name: B[idle.kind].name, res: low(RES[idle.starved].name) });
    if (state.raid.warned) say1('vn_tip_raid');
    const other = ORDER.find(o => o !== v.id && !(s.wait[o] > 0) && state.buildings.some(b => b.kind === o && has(b)));
    if (other) say1('vn_tip_game', { name: DATA.keepers[V[other].keeper].name, place: V[other].name });
    const p = City.popularity();
    if (p < 25) say1('vn_tip_pop_low'); else if (p >= 60) say1('vn_tip_pop_high');
    if (!out.length) say1('vn_tip_fine');
    return out[(s.chat[v.id] >> 1) % out.length];
  }
  /** « Discuter »: a line of banter, then a word on the city, in turn. */
  function chat() {
    const s = S(), d = V[v.id], i = s.chat[v.id];
    say(i % 2 ? advice(d) : d.chat[(i >> 1) % d.chat.length]);
    s.chat[v.id] = i + 1;
  }
  /** The keeper explains his game; the choices become « C'est parti » and « Pas maintenant ». */
  function offer() {
    const d = V[v.id], w = waitOf(v.id);
    if (w > 0) { sfx('error'); say(pick(d.wait)); return; }
    v.mode = 'intro'; v.focus = 0; say(d.how + ' ' + d.keys);
  }
  function startGame() {
    v.game = Minigames.make(v.id, { level: level(v.id), d: V[v.id], react, away: () => { v.k.away = true; } });
    v.mode = 'count'; v.count = tune.venue_count * 3; v.said = 0; v.k.wordT = 0;
  }
  /** The game is over: its medal, the popularity, the place's gift, the streak and the wait. */
  function finish() {
    const s = S(), id = v.id, d = V[id], g = v.game, score = Math.max(0, Math.round(g.score)), lvl = level(id), before = s.streak[id];
    let medal = 0;
    if (!g.lost) d.medals.forEach((m, i) => { if (score >= m) medal = i + 1; });
    const pop = Math.round(d.pop[medal] * tune.venue_pop_scale * (1 + lvl * tune.venue_streak_pop) * (1 + buff('pop')));
    const record = score > s.best[id] && medal > 0, old = s.best[id];
    if (score > s.best[id]) s.best[id] = score;
    s.played[id]++; s.wait[id] = tune.venue_wait;
    s.streak[id] = medal ? before + 1 : Math.floor(before / 2); // a loss halves the streak: the game eases off, it does not start over
    const gifts = [];
    for (const key in d.buffs) {
      const val = d.buffs[key][medal], cur = s.buffs[key];
      if (!val) continue;
      if (cur && cur.left > 0 && cur.v > val) { gifts.push({ key, v: val, kept: true }); continue; } // a better one runs: it stays
      s.buffs[key] = { v: val, left: tune.venue_buff_time, total: tune.venue_buff_time, from: id };
      gifts.push({ key, v: val });
    }
    City.event('game', { venue: id, score: medal });
    if (pop > 0) City.gainPop(pop, 'vn_why', { title: { venue: id }, medal: { medal } });
    events.push({ type: 'game', venue: id, medal, score });
    v.res = { t: 0, medal, score, record, old, pop, gifts, before, streak: s.streak[id], why: g.why || '' };
    v.mode = 'result';
    if (medal) react('glad', ' '); else react('cross', ' ');
    v.k.wordT = 0;
    sfx(medal ? 'fanfare' : 'lose'); Save.persist();
  }
  function closeResult() {
    const d = V[v.id], m = v.res.medal;
    v.game = null; v.res = null; v.mode = 'talk'; v.focus = 1; v.k.away = false; v.k.gone = 0;
    say(d.after[m]);
  }
  /** Leaving a game under way counts as a game lost. */
  function quit() { v.pause = false; v.game.lost = true; v.game.score = 0; v.game.done = true; finish(); }

  /** The choices of the moment, top to bottom: { label, tip, fn, primary, disabled, mark }. */
  function choices() {
    const d = V[v.id], kp = DATA.keepers[d.keeper], w = waitOf(v.id);
    if (v.mode === 'intro') return [
      { label: tr('vn_intro_go'), fn: startGame, primary: true, mark: 'venue:go' },
      { label: tr('vn_intro_back'), fn: () => { v.mode = 'talk'; v.focus = 0; say(pick(d.ready)); }, mark: 'venue:back' },
    ];
    return [
      { label: w > 0 ? tr('vn_play_wait', { t: fmtTime(w) }) : tr('vn_play', { title: d.title }), fn: offer, primary: !(w > 0), wait: w > 0, mark: 'venue:play',
        tip: w > 0 ? tr('vn_wait_tip', { title: d.title, name: kp.name, t: fmtTime(w) }) : tr('vn_play_tip', { title: d.title, how: d.how }) },
      { label: tr('vn_talk'), fn: chat, mark: 'venue:talk', tip: tr('vn_talk_tip', { name: kp.name }) },
      { label: tr('vn_leave'), fn: leave, mark: 'venue:leave', tip: tr('vn_leave_tip') },
    ];
  }

  // ---- The scene's step ----
  /** The 'venue' scene's step (js/screens.js): the clicks and keys of the moment, the keeper's moves, the line being written, the game under way. */
  function update(dt) {
    if (!v) { scene = 'play'; return; }
    const free = []; // the clicks that fell on no button: a line hurried along, or the game's own
    for (const c of clicks) {
      const r = c.button === 0 ? UI.hitAt(c.x, c.y) : null;
      if (r && r.onClick) { r.onClick(); if (!v) return; } else free.push(c);
    }
    const K = v.k, enterKey = pressed('Enter') || pressed('NumpadEnter');
    v.t += dt;
    v.anim += dt * tune.portrait_fps * (v.mode === 'talk' && v.shown < v.line.length ? 1.6 : 1);
    if (K.hop > 0) K.hop -= dt;
    if (K.shake > 0) K.shake -= dt;
    if (K.faceT > 0) K.faceT -= dt;
    if (K.wordT > 0) K.wordT -= dt;
    K.gone = K.away ? Math.min(1, K.gone + dt * 0.9) : 0;
    if (v.go > 0) v.go -= dt;
    if (v.pause) { if (pressed('Escape')) v.pause = false; return; }
    if (v.mode === 'talk' || v.mode === 'intro') {
      const list = choices(), full = v.shown >= v.line.length;
      if (!full) v.shown += dt * tune.venue_type_cps;
      if (pressed('Escape')) { if (v.mode === 'intro') list[1].fn(); else leave(); return; }
      if (pressed('ArrowDown')) { v.focus = (v.focus + 1) % list.length; sfx('click'); }
      if (pressed('ArrowUp')) { v.focus = (v.focus + list.length - 1) % list.length; sfx('click'); }
      v.focus = Math.min(v.focus, list.length - 1);
      for (let i = 0; i < list.length; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) { sfx('click'); list[i].fn(); return; }
      if (!full && (pressed('Space') || enterKey || free.some(c => c.button === 0))) { v.shown = v.line.length; return; } // the line at once
      if (full && enterKey) { sfx('click'); list[v.focus].fn(); }
    } else if (v.mode === 'count') {
      if (pressed('Escape')) { v.pause = true; return; }
      const n0 = Math.ceil(v.count / tune.venue_count);
      if (!v.held) v.count -= dt; // a preview from the address holds the countdown, for a screenshot
      if (Math.ceil(v.count / tune.venue_count) !== n0 && v.count > 0) sfx('click');
      if (v.count <= 0) { v.mode = 'play'; v.go = 0.6; sfx('unlock'); }
    } else if (v.mode === 'play') {
      if (pressed('Escape')) { v.pause = true; return; }
      if (v.bot) v.game.auto(dt, v.bot); // a preview from the address: the game's own hand keeps playing
      v.game.update(dt, { act: pressed('Space') || free.some(c => c.button === 0), alt: free.some(c => c.button === 2) });
      if (v.game.done) finish();
    } else if (v.mode === 'result') {
      v.res.t += dt;
      if (v.res.t > 0.6 && (enterKey || pressed('Space'))) closeResult();
    }
  }

  // ---- Drawing ----
  function wrapLines(str, maxW, size) {
    ctx.font = `${size}px ${FONT}`;
    const out = []; let line = '';
    for (const word of str.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
    out.push(line);
    return out;
  }
  const medals = [];
  /** The picture of a result, 16x16: 0 lost (a dull, cracked disc), 1 bronze, 2 silver, 3 gold. */
  function medalImg(i) {
    if (medals[i]) return medals[i];
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
    const p = pen(cv), [base, dark, light] = [['#6f6a66', '#4a4644', '#8a8480'], ['#c9762e', '#8f4c1c', '#f0a85a'], ['#cfd6e6', '#8a94ac', '#ffffff'], ['#ffc533', '#d18a12', '#fff2a8']][i];
    if (i) { p.R(4, 1, 3, 6, PAL.red); p.R(9, 1, 3, 6, PAL.redD); p.R(7, 1, 2, 5, '#f6eedb'); }
    p.E(8, 10, 4, 4, base); p.R(5, 13, 6, 1, dark); p.R(11, 8, 1, 5, dark); p.R(5, 7, 4, 1, light); p.R(4, 8, 1, 3, light);
    if (i) { p.R(7, 9, 2, 3, light); p.R(6, 10, 4, 1, light); } else { p.R(7, 7, 1, 3, dark); p.R(8, 9, 1, 3, dark); p.R(7, 11, 1, 3, dark); }
    outline(cv);
    return medals[i] = cv;
  }
  /** What a gift reads as: « Achats au marché −10 % ». */
  const giftText = (key, val) => tr(BUFFS[key].text, {}).split('{n}').join(Math.round(val * 100));
  /** What a result of a place's game gives, in a few words: « +7 · achats −10 %, ventes +10 % ». */
  function winsText(d, m, lvl) {
    const pop = Math.round(d.pop[m] * tune.venue_pop_scale * (1 + lvl * tune.venue_streak_pop));
    const parts = Object.keys(d.buffs).filter(k => d.buffs[k][m]).map(k => BUFFS[k].short.split('{n}').join(Math.round(d.buffs[k][m] * 100)));
    return { pop, gift: parts.join(', ') };
  }

  /** The hero's popularity and the gifts that run, bottom left. */
  function drawFame() {
    const s = S(), x = LEFT.x, y = LEFT.y, w = LEFT.w, p = Math.round(City.popularity());
    if (!UI.nine('panel', x, y, w, LEFT.h)) UI.box(x, y, w, LEFT.h, C.bg, C.lineL);
    UI.region(x, y, w, LEFT.h, null, tr('vn_pop_tip'));
    UI.icon(ic('icon.popularity', 'icon.hero'), x + 26, y + 26, 16);
    UI.label(tr('vn_pop'), x + 40, y + 27, 14, C.gold, 'left'); UI.label(String(p), x + w - 18, y + 27, 17, C.text, 'right');
    UI.bar(x + 16, y + 40, w - 32, 12, p / 100, C.gold);
    const keys = Object.keys(s.buffs).filter(k => BUFFS[k] && s.buffs[k].left > 0);
    text(tr('vn_gifts'), x + 16, y + 66, 11, C.dim, 'left', true);
    if (!keys.length) { UI.wrap(tr('vn_no_gift'), x + 16, y + 76, w - 32, 12, C.dim, 15); return; }
    const lh = keys.length > 4 ? 12 : 15, size = keys.length > 4 ? 10 : 11;
    keys.forEach((k, i) => {
      const yy = y + 82 + i * lh, b = s.buffs[k];
      text(giftText(k, b.v), x + 16, yy, size, C.good, 'left', true); text(fmtTime(b.left), x + w - 16, yy, size, b.left < 30 ? C.accent : C.text, 'right', true);
    });
  }
  /** The game's card, top right: its name, what each medal is worth, the record and the streak. */
  function drawCard() {
    const s = S(), d = V[v.id], w = 344, x = W - 12 - w, y = 12, lvl = level(v.id), wt = waitOf(v.id);
    if (!UI.nine('panel', x, y, w, 178)) UI.box(x, y, w, 178, C.bg, C.lineL);
    UI.region(x, y, w, 178, null, tr('vn_play_tip', { title: d.title, how: d.how }));
    UI.label(d.title, x + 20, y + 28, 18, C.gold, 'left');
    UI.label(wt > 0 ? fmtTime(wt) : tr('vn_card_ready'), x + w - 20, y + 28, 13, wt > 0 ? C.accent : C.good, 'right');
    ctx.fillStyle = C.lineL; ctx.fillRect(x + 18, y + 44, w - 36, 1);
    text(tr('vn_card_wins'), x + 20, y + 58, 11, C.dim, 'left', true);
    for (let m = 3; m >= 1; m--) {
      const yy = y + 78 + (3 - m) * 22, win = winsText(d, m, lvl);
      pix(medalImg(m), x + 18, yy - 9, 1);
      text(tr('vn_medal_' + m) + ' ' + d.medals[m - 1], x + 40, yy, 12, C.text, 'left', true);
      text('+' + win.pop, x + 128, yy, 12, C.gold, 'right', true); UI.icon(ic('icon.popularity', 'icon.hero'), x + 138, yy - 1, 16);
      text(win.gift, x + w - 18, yy, 11, C.good, 'right', true);
    }
    ctx.fillStyle = C.lineL; ctx.fillRect(x + 18, y + 142, w - 36, 1);
    text(s.played[v.id] ? tr('vn_card_best', { n: s.best[v.id] }) : tr('vn_card_none'), x + 20, y + 158, 12, C.text, 'left');
    text(tr('vn_card_streak', { n: s.streak[v.id], lvl: lvl + 1 }), x + w - 18, y + 158, 12, lvl ? C.accent : C.dim, 'right');
  }
  /** The keeper's box: the name on its plate, the line written out letter by letter. */
  function drawBox() {
    const d = V[v.id], kp = DATA.keepers[d.keeper], tw = BOX.w - 56;
    if (!UI.nine('panel', BOX.x, BOX.y, BOX.w, BOX.h)) UI.box(BOX.x, BOX.y, BOX.w, BOX.h, C.bg, C.lineL);
    UI.region(BOX.x, BOX.y, BOX.w, BOX.h, null);
    const nw = UI.width(kp.name, 18, true) + UI.width(kp.title, 13, false) + 46;
    UI.plate(BOX.x + 18, BOX.y - 26, nw, 38);
    UI.label(kp.name, BOX.x + 34, BOX.y - 6, 18, C.gold, 'left'); text(kp.title, BOX.x + 44 + UI.width(kp.name, 18, true), BOX.y - 5, 13, C.dim, 'left');
    let size = 18, lines = wrapLines(v.line, tw, 18);
    if (lines.length > 4) { size = 16; lines = wrapLines(v.line, tw, 16); }
    const lh = size === 18 ? 25 : 21;
    let left = Math.floor(v.shown);
    lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; if (part) text(part, BOX.x + 28, BOX.y + 34 + i * lh, size, C.text, 'left'); });
    if (v.shown < v.line.length) { if (Math.sin(v.t * 9) > -0.2) UI.label(tr('vn_next'), BOX.x + BOX.w - 24, BOX.y + BOX.h - 20, 12, C.gold, 'right'); }
    else text(tr('vn_keys'), BOX.x + BOX.w - 24, BOX.y + BOX.h - 18, 11, C.dim, 'right');
  }
  function drawChoices() {
    const list = choices(), bh = 44, y0 = LEFT.y + LEFT.h - list.length * (bh + 4) + 4;
    list.forEach((c, i) => {
      const y = y0 + i * (bh + 4);
      UI.button(RIGHT.x, y, RIGHT.w, bh, c.label, c.fn, { primary: c.primary, size: 16, tip: c.tip, icon: c.wait ? 'icon.time' : null });
      Tuto.mark(c.mark, RIGHT.x, y, RIGHT.w, bh);
      if (i === v.focus) { ctx.fillStyle = C.ink; ctx.fillRect(RIGHT.x + 9, y + bh / 2 - 7, 9, 14); ctx.fillStyle = C.gold; ctx.fillRect(RIGHT.x + 10, y + bh / 2 - 5, 3, 10); ctx.fillRect(RIGHT.x + 13, y + bh / 2 - 3, 2, 6); ctx.fillRect(RIGHT.x + 15, y + bh / 2 - 1, 2, 2); }
      text(String(i + 1), RIGHT.x + RIGHT.w - 16, y + bh / 2 + 1, 11, C.dim, 'center', true);
    });
  }
  function shadowText(s, x, y, size, c, font) { text(s, x + 4, y + 4, size, '#120e1c', 'center', true, font); text(s, x, y, size, c, 'center', true, font); }
  function drawResult() {
    const r = v.res, d = V[v.id], x = 56, y = 78, w = 480, h = 470;
    ctx.fillStyle = 'rgba(13,10,20,0.45)'; ctx.fillRect(0, 0, W, H);
    UI.region(0, 0, W, H, null);
    UI.panel(x, y, w, h);
    pix(medalImg(r.medal), x + 28, y + 24, 5);
    text(tr('vn_res_' + r.medal), x + 124, y + 52, 30, r.medal ? C.gold : C.bad, 'left', true, TITLE_FONT);
    text(d.title + (r.why ? ' · ' + r.why : ''), x + 126, y + 86, 14, C.dim, 'left');
    ctx.fillStyle = C.lineL; ctx.fillRect(x + 26, y + 116, w - 52, 2);
    let yy = y + 142;
    UI.label(tr('vn_res_score', { n: r.score, unit: d.unit }), x + 30, yy, 20, C.text, 'left');
    text(r.record ? tr('vn_res_best') : tr('vn_res_best_old', { n: Math.max(r.old, r.score) }), x + w - 30, yy + 1, 13, r.record ? C.gold : C.dim, 'right', r.record);
    yy += 34;
    UI.icon(ic('icon.popularity', 'icon.hero'), x + 40, yy, 16);
    text(r.pop > 0 ? tr('vn_res_pop', { n: r.pop }) : tr('vn_res_nopop'), x + 56, yy + 1, 17, r.pop > 0 ? C.gold : C.dim, 'left', true); yy += 20;
    for (const g of r.gifts) {
      const b = BUFFS[g.key];
      UI.icon(ic(b.icon, b.alt), x + 40, yy + 12, 16);
      yy = UI.wrap(tr(g.kept ? 'vn_res_kept' : 'vn_res_gift', { text: giftText(g.key, g.v), t: fmtTime(tune.venue_buff_time) }), x + 56, yy, w - 90, 15, g.kept ? C.dim : C.good, 20, !g.kept) + 2;
    }
    yy += 10;
    yy = UI.wrap(tr(r.streak > r.before ? 'vn_res_streak_up' : r.streak < r.before ? 'vn_res_streak_down' : 'vn_res_streak_same', { n: r.streak }), x + 30, yy, w - 60, 14, r.streak > r.before ? C.accent : C.dim, 19);
    UI.wrap(tr('vn_res_wait', { t: fmtTime(waitOf(v.id)) }), x + 30, yy + 4, w - 60, 14, C.dim, 19);
    UI.button(x + w / 2 - 130, y + h - 66, 260, 46, tr('vn_res_ok'), closeResult, { primary: true, size: 17 });
    Tuto.mark('venue:continue', x + w / 2 - 130, y + h - 66, 260, 46);
  }
  function drawPause() {
    ctx.fillStyle = 'rgba(13,10,20,0.6)'; ctx.fillRect(0, 0, W, H);
    UI.region(0, 0, W, H, null);
    UI.panel(430, 250, 420, 200, tr('vn_pause'));
    UI.wrap(tr('vn_pause_text'), 458, 312, 364, 15, C.dim, 20);
    UI.button(452, 380, 200, 46, tr('vn_resume'), () => { v.pause = false; }, { primary: true, size: 15 });
    UI.button(664, 380, 164, 46, tr('vn_quit'), quit, { size: 15 });
  }
  /** The 'venue' scene's picture: the place, its keeper, then the talk or the game over them. */
  function draw() {
    if (!v) return;
    const d = V[v.id], B = backdrop(v.id);
    clear('#1c120b');
    if (B.real) cover(Art.get('venue.bg.' + v.id));
    else {
      ctx.drawImage(B.back, 0, 0, B.w * B.k, B.h * B.k);
      AMBIENT[v.id](B, v.t, (x, y, w, h, c, a) => { ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = c; ctx.fillRect(Math.round(x) * B.k, Math.round(y) * B.k, w * B.k, h * B.k); ctx.globalAlpha = 1; });
    }
    drawKeeper(B);
    if (!B.real) ctx.drawImage(B.front, 0, 0, B.w * B.k, B.h * B.k);
    if (Art.loaded('venue.fg.' + v.id)) cover(Art.get('venue.fg.' + v.id));
    if (v.mode === 'talk' || v.mode === 'intro') {
      const nw = UI.width(d.name, 19, true) + 44;
      UI.plate(12, 12, nw, 44); UI.label(d.name, 12 + nw / 2, 35, 19, C.gold);
      drawCard(); drawFame(); drawBox(); drawChoices();
    } else {
      v.game.draw();
      drawWord();
      if (v.mode === 'count') { ctx.fillStyle = 'rgba(13,10,20,0.35)'; ctx.fillRect(0, 0, W, 556); shadowText(String(Math.max(1, Math.ceil(v.count / tune.venue_count))), 640, 300, 190, C.gold, TITLE_FONT); }
      else if (v.go > 0 && v.mode === 'play') { ctx.globalAlpha = clamp(v.go * 3, 0, 1); shadowText(tr('vn_go'), 640, 300, 110, C.gold, TITLE_FONT); ctx.globalAlpha = 1; }
      if (v.mode === 'result') drawResult();
    }
    if (v.pause) drawPause();
  }

  /**
   * Opens a place straight from the address, for screenshots and checks: ?scene=venue&venue=cafe
   * (or market, forge). &game=1: its game under way, a few seconds in, played by the game's own
   * hand (&secs=8: that many seconds in; &pace= and &err= make that hand slower and clumsier);
   * &game=count: on the countdown; &game=intro: the keeper explaining it; &game=end: the result.
   * &streak=6: that winning streak; &wait=90: that wait left; &talk=3: after that many « Discuter ».
   */
  function preview(id, game) {
    if (!V[id]) id = ORDER[0];
    const s = S(), num = k => Number(params.get(k)) || 0;
    if (params.has('streak')) s.streak[id] = num('streak');
    enter(id, state.buildings.find(b => b.kind === id) || null);
    if (params.has('wait')) s.wait[id] = num('wait');
    v.shown = v.line.length;
    for (let i = 0; i < num('talk'); i++) { chat(); v.shown = v.line.length; }
    if (!game) return;
    if (game === 'intro') { offer(); v.shown = v.line.length; return; }
    startGame();
    if (game === 'count') { v.count = tune.venue_count * 1.6; v.held = true; return; }
    v.mode = 'play'; v.count = 0;
    const secs = game === 'end' ? 600 : num('secs') || 7, bot = v.bot = { pace: num('pace') || 0.5, err: num('err') };
    for (let i = 0; i < 60 * secs && !v.game.done; i++) { v.t += STEP; v.anim += STEP * tune.portrait_fps; v.game.auto(STEP, bot); v.game.update(STEP, { act: false, alt: false }); for (const k of ['hop', 'shake', 'faceT']) if (v.k[k] > 0) v.k[k] -= STEP; }
    if (v.game.done) { finish(); v.res.t = 1; console.log(`venue ${id} · série ${v.res.before} · score ${v.res.score} · médaille ${v.res.medal} · popularité +${v.res.pop}`); }
  }

  return { fresh, adopt, tick, away, has, buff, open, update, draw, preview, level, wait: waitOf, react, pix, outline, face, faceCount, medalImg, get active() { return !!v; }, get id() { return v ? v.id : null; } };
})();
