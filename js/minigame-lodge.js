// PROTOTYPE - NOT FOR PRODUCTION
// The builders' lodge's mini-game, « La bonne pierre » (js/venue.js hosts it, js/minigames.js registers it).
// A wall is going up, with a hole left in its top course. Four cut stones lie below; exactly one fits
// the hole (js/stones.js: turned is allowed, flipped over never). Its key (1 to 4) or a click on it sets
// it: 1 point, the wall rises a course and a new hole is left. Right stones set quickly one after the
// other (config lodge_chain_gap) make a chain, and from the lodge_chain-th on each is worth 2. A wrong
// stone is a fault and breaks the chain; at config lodge_strikes the wall comes down. Each win in a row
// grows the shapes, then shows the stones turned, then slips the right one's mirror among the wrong ones.
// The rules (update, choose, auto) never draw: only draw() does.
// Content in data/venues.js (venues.lodge), knobs in config.js (lodge_*). Nothing here is saved.
'use strict';

(() => {
  const { PANEL, head, scoreBox, stepPops, drawPops } = Minigames.kit;
  const SET = 0.35;    // seconds a right stone takes to go in, before the next hole is left
  const SHOWN = 0.35;  // seconds a wrong stone's flash shows
  const CELL = 26, COLS = 11, ROWS = 14, HOLE_ROW = 6; // the wall, in cells: the hole's top is on HOLE_ROW
  const WX = 300 - COLS * CELL / 2, WY = 520 - ROWS * CELL; // the wall's top left; the keeper stands in the screen's middle
  const STONE = '#c8b48c', STONE_HI = '#e8d8b0', STONE_LO = '#8a7650', WALL = '#8a8274', WALL_HI = '#a8a090', WALL_LO = '#5a5448', DARK = '#1a1410';

  /** One cell of masonry at (x, y), `s` pixels wide: its face, a light top and left, a dark bottom and right. */
  function block(x, y, s, face, hi, lo) {
    ctx.fillStyle = lo; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = face; ctx.fillRect(x + 1, y + 1, s - 3, s - 3);
    ctx.fillStyle = hi; ctx.fillRect(x + 1, y + 1, s - 3, 2); ctx.fillRect(x + 1, y + 1, 2, s - 3);
  }
  /** The size of a list of cells: { w, h } in cells. */
  function size(cells) { let w = 0, h = 0; for (const [x, y] of cells) { w = Math.max(w, x + 1); h = Math.max(h, y + 1); } return { w, h }; }

  function lodge(o) {
    const d = o.d, L = o.level, total = tune.lodge_time;
    // round: the hole and its four stones ({ hole, stones, right, tried }); setting: a right stone going in;
    // last: when the last right stone was set (the chain); keys: the digits held down at the last step
    const g = { score: 0, done: false, lost: false, why: '', t: 0, set: 0, strikes: 0, chain: 0, last: -Infinity,
      round: null, setting: null, pops: [], flash: null, keys: {}, bot: 0 };
    /** A new hole and its stones, at the difficulty of the streak. */
    function next() { const r = Stones.round(L, d.ramp, rng); r.tried = [false, false, false, false]; return r; }
    g.round = next();
    /** The wall's column of the hole's left edge: the hole is cut in the middle of the course. */
    const holeCol = cells => Math.floor((COLS - size(cells).w) / 2);
    const pop = (x, y, str, color) => g.pops.push({ x, y, str, color, size: 22, t: 0 });

    /** Stone `i` of the four is laid in the hole: it fits, or it is a fault. A stone tried once and refused counts no more. */
    function choose(i) {
      const r = g.round;
      if (g.done || !r || !(i >= 0 && i < 4) || r.tried[i]) return;
      if (i !== r.right) {
        r.tried[i] = true; g.strikes++; g.chain = 0; g.flash = { i, t: SHOWN };
        pop(300, WY + HOLE_ROW * CELL - 20, tr('lg_wrong'), UI.C.bad); sfx('error'); o.react('cross');
        if (g.strikes >= tune.lodge_strikes) { g.done = true; g.lost = true; g.why = tr('lg_end_strikes'); sfx('hurt'); }
        return;
      }
      g.chain = g.t - g.last <= tune.lodge_chain_gap ? g.chain + 1 : 1;
      g.last = g.t;
      const worth = g.chain >= tune.lodge_chain ? 2 : 1;
      g.score += worth; g.set++;
      if (worth > 1) { pop(300, WY + HOLE_ROW * CELL - 20, tr('lg_chained', { n: worth }), UI.C.gold); sfx('crit'); }
      else { pop(300, WY + HOLE_ROW * CELL - 20, tr('lg_set', { n: worth }), UI.C.good); sfx('place'); }
      o.react(g.chain === tune.lodge_chain ? 'chain' : 'glad');
      g.setting = { hole: r.hole, t: SET }; g.round = null;
    }
    function update(dt) {
      g.t += dt;
      // a digit counts when it goes down: one held down sets one stone, and not the next hole's
      for (let i = 0; i < 4; i++) { const down = !!(pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))); if (down && !g.keys[i]) choose(i); g.keys[i] = down; }
      if (g.setting && (g.setting.t -= dt) <= 0) { g.setting = null; if (!g.done) g.round = next(); }
      if (g.flash && (g.flash.t -= dt) <= 0) g.flash = null;
      stepPops(g.pops, dt);
      if (g.t >= total) g.done = true;
    }
    /** A number in 0..1 that stays the same for the n-th stone laid: whether the game's own hand slips on it. */
    const roll = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    /** The game's own hand: the right stone, or on `err` of the stones a wrong one; a stone every `pace` seconds at most. */
    function auto(dt, bot) {
      g.bot -= dt;
      const r = g.round;
      if (g.bot > 0 || !r || g.done) return;
      let i = r.right;
      if (roll(g.set + g.strikes) < (bot.err || 0)) for (let k = 1; k < 4; k++) { const j = (r.right + k) % 4; if (!r.tried[j]) { i = j; break; } }
      choose(i);
      g.bot = bot.pace;
    }

    function draw() {
      const C = UI.C, r = g.round, hole = r ? r.hole : g.setting ? g.setting.hole : null;
      head(d, total - g.t, total); scoreBox(d, tr('lg_score'), g.score);
      UI.plate(1118, 78, 150, 34); UI.label(`${tr('lg_faults_n')}${tr('colon')}${g.strikes} / ${tune.lodge_strikes}`, 1193, 96, 14, g.strikes ? C.bad : C.dim);
      // the wall: its courses from the hole's top down, the hole dark in them; the darker stones climb a course with each one set
      const hc = hole ? holeCol(hole) : 0, cut = new Set(hole ? hole.map(([x, y]) => (hc + x) + ',' + (HOLE_ROW + y)) : []);
      const going = g.setting && !r ? g.setting.t / SET : 0; // a right stone dropping in: 1 when just chosen, 0 once set
      for (let row = HOLE_ROW; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
        const x = WX + col * CELL, y = WY + row * CELL;
        if (cut.has(col + ',' + row)) {
          if (g.setting && !r) block(x, y - going * 40, CELL, STONE, STONE_HI, STONE_LO); else { ctx.fillStyle = DARK; ctx.fillRect(x, y, CELL, CELL); }
          continue;
        }
        const shade = (row + g.set + col * 3) % 4 === 0;
        block(x, y, CELL, shade ? WALL_LO : WALL, WALL_HI, WALL_LO);
      }
      ctx.fillStyle = C.ink; ctx.fillRect(WX - 6, WY + ROWS * CELL, COLS * CELL + 12, 6);
      text(tr('vn_res_score', { n: g.set, unit: d.unit }), 300, WY + ROWS * CELL + 26, 14, C.dim, 'center', true);
      if (g.chain >= 2) text(tr('lg_chain', { n: g.chain }), 300, WY + HOLE_ROW * CELL - 50, 18, g.chain >= tune.lodge_chain ? C.gold : C.text, 'center', true);
      text(tr('lg_keys'), 640, 546, 13, C.text, 'center', true);
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      // the four stones, numbered: a click, or its digit
      const bw = 290, gap = 14, x0 = 640 - (4 * bw + 3 * gap) / 2, y = 574, bh = 122;
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (bw + gap), st = r ? r.stones[i] : null, tried = !!(r && r.tried[i]);
        UI.button(x, y, bw, bh, '', () => choose(i), { disabled: tried }); // while a stone goes in, choose() lets a click pass
        if (g.flash && g.flash.i === i) { ctx.fillStyle = 'rgba(220,40,40,' + (0.5 * g.flash.t / SHOWN) + ')'; ctx.fillRect(x + 6, y + 6, bw - 12, bh - 12); }
        if (st) {
          const sz = size(st), s = Math.min(20, Math.floor(96 / Math.max(sz.w, sz.h))), sx = x + bw / 2 - sz.w * s / 2 + 12, sy = y + bh / 2 - sz.h * s / 2;
          ctx.globalAlpha = tried ? 0.35 : 1;
          for (const [cx, cy] of st) block(sx + cx * s, sy + cy * s, s, STONE, STONE_HI, STONE_LO);
          ctx.globalAlpha = 1;
          if (tried) { ctx.strokeStyle = C.bad; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + bw / 2 - 30, y + 30); ctx.lineTo(x + bw / 2 + 30, y + bh - 30); ctx.moveTo(x + bw / 2 + 30, y + 30); ctx.lineTo(x + bw / 2 - 30, y + bh - 30); ctx.stroke(); }
        }
        UI.box(x + 10, y + 10, 26, 26, C.ink, C.lineL); UI.label(String(i + 1), x + 23, y + 24, 15, C.gold);
      }
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto, choose });
  }

  Minigames.add('lodge', lodge);
})();
