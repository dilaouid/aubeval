// PROTOTYPE - NOT FOR PRODUCTION
// The builders' lodge's mini-game, « Le quartier d'Aveline » (js/venue.js hosts it, js/minigames.js registers it).
// Aveline shows a small quarter she built (js/blueprint.js draws it) for a few seconds, then hides it:
// rebuild it from memory on an empty grid. Each building right is a point, each wrong one costs one, a
// perfect quarter and a quick hand earn more. « Revoir le plan » shows it again for a moment, at a price.
// Three quarters under half alike end the lesson. The streak grows the grid, the buildings and the
// kinds, shortens the look, and from config'd wins shows the plan turned (a flag marks the same corner).
// Phases: show (the plan) → build (the grid; peek shows the plan again) → reveal (both side by side,
// the clock stopped) → show again. The rules (update, the actions, auto) never draw: only draw() does.
// Content in data/venues.js (venues.lodge), knobs in config.js (lodge_*). Nothing here is saved.
'use strict';

(() => {
  const { PANEL, head, scoreBox, stepPops, drawPops } = Minigames.kit;
  // the keys, by what they do: digits build the palette's buildings, these clear, the arrows move the cursor
  const DIGITS = [1, 2, 3, 4, 5, 6].map(n => ['Digit' + n, 'Numpad' + n]);
  const CLEAR = ['Digit0', 'Numpad0', 'Delete', 'Backspace'], ENTER = ['Enter', 'NumpadEnter'], PEEK = ['Space'];
  const ARROWS = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]];

  // ---- The two quarters on the screen: Aveline stands in its middle, her plan on her left, the player's grid on her right ----
  const PLAN_X = 240, GRID_X = 1040, TOP = 250, SPAN = 400, CELL = 100; // each quarter's middle, its top corner's row, how wide it may be, and a cell at most
  const PARCH = ['#dcc89c', '#d2bd8f', '#a08a5c'], GRASS = ['#6b9a43', '#62903c', '#3f6228'], DIM = ['#5a5a4a', '#52524a', '#34342c'];
  /**
   * Where a side × side quarter lies: `cw` a cell's width (a diamond half as tall, `cell` at most), `k` the buildings'
   * scale (their own size: a 2 × 2 building is 64 wide, a cell holds it with room round it); at(x, y) the middle of a cell on the screen, cellAt(px, py) the cell under a point ({ x, y } or null), and
   * the four corners of the whole quarter (top, right, bottom, left), each { x, y }.
   */
  function layout(side, cx, top, span = SPAN, cell = CELL) {
    const cw = Math.min(cell, Math.floor(span / side / 2) * 2), h = cw / 2, k = 1;
    const at = (x, y) => ({ x: cx + (x - y) * cw / 2, y: top + (x + y) * h / 2 + h / 2 });
    function cellAt(px, py) {
      const u = (px - cx) / (cw / 2), v = (py - top) / (h / 2), x = Math.floor((u + v) / 2), y = Math.floor((v - u) / 2);
      return x >= 0 && x < side && y >= 0 && y < side ? { x, y } : null;
    }
    const corners = { top: { x: cx, y: top }, right: { x: cx + side * cw / 2, y: top + side * h / 2 }, bottom: { x: cx, y: top + side * h }, left: { x: cx - side * cw / 2, y: top + side * h / 2 } };
    return { side, cw, h, k, at, cellAt, corners };
  }
  /** One cell's diamond round its middle (x, y), filled `fill`, edged `edge`. */
  function diamond(x, y, cw, h, fill, edge, lw = 1) {
    ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + cw / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x - cw / 2, y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke(); }
  }
  /** A village building standing in the middle (x, y) of a cell, `s` times its size (its foot where a 2 × 2 one's would be). */
  function building(kind, x, y, s) {
    const img = Art.get(DATA.buildings[kind].sprite), foot = 16 * s + Math.max(0, Math.round((img.width - 64) / 4)) * s;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - img.width * s / 2), Math.round(y + foot - img.height * s), Math.round(img.width * s), Math.round(img.height * s));
  }
  /** A building's picture standing on (cx, bottom), no taller than `maxH` (the palette's buttons). */
  function icon(kind, cx, bottom, maxH) {
    const img = Art.get(DATA.buildings[kind].sprite), s = Math.min(1, maxH / img.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - img.width * s / 2), Math.round(bottom - img.height * s), Math.round(img.width * s), Math.round(img.height * s));
  }
  /** Aveline's flag: a pole and a pennant, its foot on (x, y), `s` times its size. */
  function flag(x, y, s) {
    const img = Minigames.kit.sprite('lg:flag', 14, 26, R => { R(1, 0, 2, 26, '#5a3a1c'); R(3, 1, 10, 7, '#d83a3a'); R(3, 1, 10, 2, '#f06a5a'); R(3, 8, 6, 2, '#a82828'); });
    ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(x - 2 * s), Math.round(y - 26 * s), 14 * s, 26 * s);
  }
  /**
   * A quarter drawn: the ground of its cells (`tone`: three colours, light, dark, edge), its buildings back row
   * first, the flag on the corner where cell (0, 0) lies once turned `turn` quarter turns. `s` scales the buildings
   * (the layout's own scale unless a card asks for a smaller one).
   */
  function quarter(lay, cells, tone, turn, s = lay.k, under = null) {
    const n = lay.side, shown = Blueprint.turn(cells, n, turn);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = lay.at(x, y); diamond(c.x, c.y, lay.cw, lay.h, tone[(x + y) % 2], tone[2]); }
    if (under) under(lay); // what lies on the ground under the buildings: the cursor
    for (let r = 0; r < 2 * n - 1; r++) for (let x = 0; x < n; x++) {
      const y = r - x; if (y < 0 || y >= n || !shown[y * n + x]) continue;
      const c = lay.at(x, y); building(shown[y * n + x], c.x, c.y, s);
    }
    const q = ((turn % 4) + 4) % 4, f = lay.corners[['top', 'right', 'bottom', 'left'][q]];
    flag(f.x + [0, 8, 0, -8][q], f.y + [-2, 0, 8, 0][q], lay.cw >= 60 ? 2 : 1);
  }

  function lodge(o) {
    const d = o.d, L = o.level, total = tune.lodge_time, sp = Blueprint.spec(L, d.ramp);
    // plan: Aveline's (canonical; shown turned by plan.turn); grid: the player's, canonical; left: seconds left in
    // the timed phase; built: seconds since the plan hid; keys: what was down at the last step; bot/botI: the auto's
    const g = { score: 0, done: false, lost: false, why: '', t: 0, phase: 'show', plan: null, grid: null, cursor: { x: 0, y: 0 },
      pick: 0, misses: 0, quarters: 0, last: null, built: 0, left: 0, pops: [], keys: {}, bot: 0, botI: 0 };
    const pop = (str, color, size) => g.pops.push({ x: 640, y: 120, str, color, size: size || 24, t: 0 });

    /** A new plan, shown; the grid emptied, the cursor in its middle. */
    function next() {
      g.plan = Blueprint.draw(L, d.ramp, d.kinds, rng, g.plan);
      g.grid = new Array(g.plan.side * g.plan.side).fill(null);
      g.phase = 'show'; g.left = sp.show; g.built = 0; g.bot = 0; g.botI = 0;
      const mid = Math.floor(g.plan.side / 2); g.cursor = { x: mid, y: mid };
      if (g.pick >= g.plan.kinds.length) g.pick = 0;
    }
    next();

    /** « J'ai vu ! »: the plan hides and the grid waits. */
    function seen() { if (g.done || g.phase !== 'show' || !g.started) return; g.phase = 'build'; g.built = 0; sfx('click'); }
    /** The palette's building `k` is the one a click builds. */
    function select(k) { if (!g.done && k >= 0 && k < g.plan.kinds.length) g.pick = k; }
    /** Builds the palette's building `k` on the cell (x, y), or clears it with k = −1. */
    function put(x, y, k) {
      const n = g.plan.side;
      if (g.done || g.phase !== 'build' || !(x >= 0 && x < n && y >= 0 && y < n)) return;
      if (k === -1) { if (g.grid[y * n + x]) { g.grid[y * n + x] = null; sfx('click'); } return; }
      if (!(k >= 0 && k < g.plan.kinds.length)) return;
      g.grid[y * n + x] = g.plan.kinds[k]; sfx('place');
    }
    /** The cursor one cell over, never off the grid. */
    function move(dx, dy) {
      if (g.done || g.phase !== 'build') return;
      const n = g.plan.side;
      g.cursor = { x: clamp(g.cursor.x + dx, 0, n - 1), y: clamp(g.cursor.y + dy, 0, n - 1) };
    }
    /** « Revoir le plan »: it shows again for a moment, and costs points even at none. */
    function peek() {
      if (g.done || g.phase !== 'build') return;
      g.score -= tune.lodge_peek_cost; g.phase = 'peek'; g.left = tune.lodge_peek_time; sfx('click');
    }
    /** « Valider »: the grid against the plan, the quarter's points; under half alike is a miss, and enough end the lesson. An empty grid is not checked. */
    function validate() {
      if (g.done || g.phase !== 'build' || !g.grid.some(Boolean)) return; // nothing built yet: nothing to check (an Enter meant for the plan that just hid)
      const cmp = Blueprint.compare(g.plan.cells, g.grid), pts = Blueprint.points(cmp, g.built, g.plan.cells.filter(Boolean).length, tune);
      g.score += pts.total; g.quarters++;
      g.last = { cmp, pts }; g.phase = 'reveal'; g.left = tune.lodge_reveal_time;
      if (cmp.likeness < 0.5) {
        g.misses++; pop(tr('lg_miss'), UI.C.bad); sfx('error'); o.react('cross');
        if (g.misses >= tune.lodge_misses) { g.done = true; g.lost = true; g.why = tr('lg_end_misses'); sfx('hurt'); }
      } else if (cmp.likeness === 1) { pop(tr('lg_perfect', { n: pts.total }), UI.C.gold, 28); sfx('crit'); o.react('chain'); }
      else { pop(tr('lg_quarter', { n: pts.total }), UI.C.good); sfx('place'); o.react('glad'); }
    }

    /** Whether one of the keys went down at this step (held down, it counts once). */
    function hit(name, codes) {
      const down = codes.some(c => pressed(c)), was = g.keys[name];
      g.keys[name] = down;
      return down && !was;
    }
    function update(dt, inp) {
      if (g.done) return;
      g.started = true; // the host's countdown draws the game without stepping it: the plan stays hidden until now
      // the keys, read at every step so that one held down counts once, whatever the phase
      const enter = hit('enter', ENTER), space = hit('peek', PEEK), clear = hit('clear', CLEAR);
      const digit = DIGITS.findIndex((codes, k) => hit('d' + k, codes)), arrow = ARROWS.find(([c]) => hit(c, [c]));
      if (g.phase === 'show' && enter) seen();
      else if (g.phase === 'build') {
        if (enter) validate();
        else if (space) peek();
        else {
          if (arrow) move(arrow[1], arrow[2]);
          if (digit >= 0) { select(digit); put(g.cursor.x, g.cursor.y, digit); }
          if (clear) put(g.cursor.x, g.cursor.y, -1);
        }
      }
      // the mouse on the grid: a click builds the picked building where it points, a right click clears there (a click
      // on a button is the button's; Space comes in as a click too, and is only a second look)
      if (g.phase === 'build' && inp && typeof mouse !== 'undefined' && mouse && ((inp.act && !pressed('Space')) || inp.alt)) {
        const c = layout(g.plan.side, GRID_X, TOP).cellAt(mouse.x, mouse.y);
        if (c) { g.cursor = c; put(c.x, c.y, inp.alt ? -1 : g.pick); }
      }
      // the clock, stopped while the quarters are compared
      if (g.phase !== 'reveal') g.t += dt;
      if (g.phase === 'build' || g.phase === 'peek') g.built += dt;
      if (g.phase !== 'build' && (g.left -= dt) <= 0) {
        if (g.phase === 'show' || g.phase === 'peek') g.phase = 'build';
        else if (g.phase === 'reveal' && !g.done) next();
      }
      stepPops(g.pops, dt);
      if (g.t >= total) g.done = true; // a quarter not yet checked scores nothing, and is no miss
    }

    /** A number in 0..1 that stays the same for the n-th building laid: whether the game's own hand slips on it. */
    const roll = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    /**
     * The game's own hand: looks at the plan `pace` seconds a building, then builds it cell by cell, one
     * every `pace` seconds, the next kind of the palette instead on `err` of them, and checks; never peeks.
     */
    function auto(dt, bot) {
      if (g.done) return;
      g.bot += dt;
      const cells = g.plan.cells, n = g.plan.side, todo = cells.map((k, i) => k ? i : -1).filter(i => i >= 0);
      if (g.phase === 'show') { if (g.bot >= todo.length * bot.pace) { g.bot = 0; seen(); } return; }
      if (g.phase !== 'build' || g.bot < bot.pace) return;
      g.bot = 0;
      if (g.botI >= todo.length) { validate(); return; }
      const at = todo[g.botI], k = g.plan.kinds.indexOf(cells[at]), slip = roll(g.quarters * 16 + g.botI) < (bot.err || 0);
      put(at % n, Math.floor(at / n), slip ? (k + 1) % g.plan.kinds.length : k);
      g.botI++;
      if (g.botI >= todo.length) validate();
    }

    /**
     * What each side shows: Aveline's plan `shown` (turned), `hidden` or `square` to the grid (once compared); the
     * player's grid `empty` or `built`. Never both the plan and the player's buildings: a second look is not a check.
     */
    function view() {
      const ph = g.phase;
      return {
        plan: (ph === 'show' && g.started) || ph === 'peek' ? 'shown' : ph === 'reveal' ? 'square' : 'hidden',
        grid: ph === 'show' || ph === 'peek' ? 'empty' : 'built',
      };
    }

    function draw() {
      const C = UI.C, n = g.plan.side, ph = g.phase, vw = view(), pl = layout(n, PLAN_X, TOP), gl = layout(n, GRID_X, TOP), none = new Array(n * n).fill(null);
      head(d, total - g.t, total); scoreBox(d, tr('lg_score'), Math.round(g.score), g.score < 0 ? C.bad : C.gold);
      UI.plate(1118, 78, 150, 34); UI.label(`${tr('lg_misses_n')}${tr('colon')}${g.misses} / ${tune.lodge_misses}`, 1193, 96, 14, g.misses ? C.bad : C.dim);
      // on Aveline's left, her plan: shown (turned), hidden while one builds, square to the grid once compared
      if (vw.plan === 'shown') quarter(pl, g.plan.cells, PARCH, g.plan.turn);
      else if (vw.plan === 'square') quarter(pl, g.plan.cells, PARCH, 0);
      else { quarter(pl, none, DIM, g.plan.turn); text('?', PLAN_X, TOP + pl.h * n / 2 + 14, 54, C.dim, 'center', true); }
      // on her right, the player's grid (put away while the plan shows): the cursor and the cell under the mouse while building, ticks and crosses once compared
      const hover = ph === 'build' && typeof mouse !== 'undefined' ? gl.cellAt(mouse.x, mouse.y) : null;
      quarter(gl, vw.grid === 'empty' ? none : g.grid, vw.grid === 'empty' ? DIM : GRASS, 0, gl.k, lay => {
        if (hover) { const c = lay.at(hover.x, hover.y); diamond(c.x, c.y, lay.cw, lay.h, 'rgba(255,240,180,0.25)', C.text, 2); }
        if (ph === 'build') { const c = lay.at(g.cursor.x, g.cursor.y); diamond(c.x, c.y, lay.cw - 4, lay.h - 2, null, C.gold, 3); }
      });
      if (ph === 'reveal') for (let i = 0; i < n * n; i++) {
        const p = g.plan.cells[i], m = g.grid[i]; if (!p && !m) continue;
        const c = gl.at(i % n, Math.floor(i / n)); Minigames.kit.mark(p === m, c.x, c.y - 4);
      }
      // under each: its name, the clock of a look, and the buttons
      const under = TOP + n * pl.h + 12;
      for (const [s, x] of [[tr('lg_plan'), PLAN_X], [tr('lg_yours'), GRID_X]]) { const w = UI.width(s, 15, true) + 28; UI.plate(x - w / 2, under + 10, w, 26); UI.label(s, x, under + 23, 15, C.gold); }
      if (ph === 'show' || ph === 'peek') UI.bar(PLAN_X - 120, under, 240, 10, g.left / (ph === 'show' ? sp.show : tune.lodge_peek_time), C.accent);
      const by = under + 34;
      if (ph === 'show' && g.started) UI.button(PLAN_X - 110, by, 220, 40, tr('lg_seen'), seen, { primary: true });
      if (ph === 'build') {
        UI.button(PLAN_X - 130, by, 260, 40, tr('lg_peek') + '  ' + tr('lg_peek_cost', { n: tune.lodge_peek_cost }), peek);
        UI.button(GRID_X - 110, by, 220, 40, tr('lg_check'), validate, { primary: true, disabled: !g.grid.some(Boolean) });
      }
      if (ph === 'reveal' && g.last) text(tr('lg_likeness', { n: Math.round(g.last.cmp.likeness * 100) }), GRID_X, by + 20, 18, g.last.cmp.likeness >= 0.5 ? C.good : C.bad, 'center', true);
      // the palette: the plan's buildings, numbered; the picked one is what a click builds
      text(tr('lg_keys', { n: g.plan.kinds.length }), 640, 546, 13, C.text, 'center', true);
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      const K = g.plan.kinds, bw = 180, gap = 14, x0 = 640 - (K.length * bw + (K.length - 1) * gap) / 2, y = 574, bh = 122;
      K.forEach((kind, i) => {
        const x = x0 + i * (bw + gap), on = i === g.pick;
        UI.button(x, y, bw, bh, '', () => select(i), { on });
        icon(kind, x + bw / 2, y + bh - 30, 78);
        UI.label(DATA.buildings[kind].card, x + bw / 2, y + bh - 16, 13, on ? C.gold : C.text);
        Minigames.kit.keyBox(x + 8, y + 8, i + 1);
      });
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto, view, seen, select, put, move, peek, validate });
  }

  /** The intro's cards: look at the quarter, rebuild it from memory, a second look costs; the turned plan when it comes. */
  function howto(o) {
    const d = o.d, R = d.ramp, C = UI.C, { fill, news, KEY, fakeButton, arrow } = Minigames.kit, sp = Blueprint.spec(o.level, R);
    // the same small plan on every visit: four buildings spread round the quarter's middle (a drawn one could
    // crowd into a corner and leave the card lopsided), not symmetrical, so that turning it still shows
    const n = Blueprint.spec(0, R).side;
    const spr = k => Art.get(DATA.buildings[k].sprite);
    const foot = (k, s) => 16 * s + Math.max(0, Math.round((spr(k).width - 64) / 4)) * s; // as in building(): how far under its cell's middle a building stands
    /** The plan: the tallest building in front (a tall one at the back would climb out of its card). */
    const planCells = () => {
      const cells = new Array(n * n).fill(null), kinds = d.kinds.slice(0, 4).sort((a, b) => spr(a).height - spr(b).height);
      [[0, 0], [0, 1], [2, 0], [1, 2]].forEach(([x, y], i) => { cells[y * n + x] = kinds[i % kinds.length]; });
      return cells;
    };
    /** How far above its top corner and below its bottom one the quarter(s) `views` ({ cells, turn }) reach at a cell `cw` wide: buildings and flag. */
    const reach = (cw, views) => {
      const h = cw / 2, s = cw / 72, fs = cw >= 60 ? 2 : 1;
      let top = 0, bottom = n * h;
      for (const v of views) {
        Blueprint.turn(v.cells, n, v.turn).forEach((k, i) => {
          if (!k) return;
          const cy = ((i % n) + Math.floor(i / n)) * h / 2 + h / 2;
          top = Math.min(top, cy + foot(k, s) - spr(k).height * s); bottom = Math.max(bottom, cy + foot(k, s));
        });
        const q = ((v.turn % 4) + 4) % 4, fy = [0, n * h / 2, n * h, n * h / 2][q] + [-2, 0, 8, 0][q];
        top = Math.min(top, fy - 26 * fs); bottom = Math.max(bottom, fy);
      }
      return { top, bottom };
    };
    /** The biggest cell (`room` wide for a whole quarter, `h` high for what stands on it) that fits, and where the top corner goes to centre the picture in (y, h). */
    const fit = (y, h, room, views) => {
      let cw = 16;
      for (let c = CELL; c > 16; c -= 2) if (n * c <= room && (r => r.bottom - r.top <= h - 8)(reach(c, views))) { cw = c; break; }
      const r = reach(cw, views);
      return { cw, top: y + (h - (r.bottom - r.top)) / 2 - r.top };
    };
    /** A quarter in a card: its middle at x, its top corner at `top`, cells `cw` wide; the buildings scaled to fit. */
    const small = (x, top, cw, cells, tone, turn, under) => { const lay = layout(n, x, top, n * cw, cw); quarter(lay, cells, tone, turn, cw / 72, under); return lay; };
    const cards = [
      { text: d.steps[0], keys: [], draw(x, y, w, h) {
        const cells = planCells(), f = fit(y, h, w - 24, [{ cells, turn: 0 }]);
        small(x + w / 2, f.top, f.cw, cells, PARCH, 0);
      } },
      { text: d.steps[1], keys: ['1–' + sp.kinds, '←↑↓→', KEY.click()], draw(x, y, w, h) {
        const cells = planCells(), some = cells.map((k, i) => i < 5 ? k : null), at = cells.findIndex((k, i) => k && i >= 5);
        const f = fit(y, h, w - 24, [{ cells, turn: 0 }]); // as big as the full plan, so that both cards match
        small(x + w / 2, f.top, f.cw, some, GRASS, 0, lay => { if (at < 0) return; const c = lay.at(at % n, Math.floor(at / n)); diamond(c.x, c.y, lay.cw - 2, lay.h - 1, null, C.gold, 3); });
      } },
      { text: fill(d.steps[2], { n: tune.lodge_peek_cost }), keys: [KEY.space()], draw(x, y, w, h) {
        const bw = Math.min(w - 30, 200);
        fakeButton(x + w / 2 - bw / 2, y + h / 2 - 34, bw, 36, tr('lg_peek'), false, 13);
        UI.label(tr('lg_peek_cost', { n: tune.lodge_peek_cost }), x + w / 2, y + h / 2 + 24, 26, C.bad);
      } },
    ];
    if (o.level >= R.turnedFrom) cards.push({ fresh: true, text: news(d, 'turn'), keys: [], draw(x, y, w, h) {
      const cells = planCells(), f = fit(y, h, (w - 60) / 2, [{ cells, turn: 1 }, { cells, turn: 0 }]);
      small(x + w / 4 + 6, f.top, f.cw, cells, PARCH, 1);
      arrow(x + w / 2 - 14, y + h / 2, 28);
      small(x + 3 * w / 4 - 6, f.top, f.cw, cells, GRASS, 0);
    } });
    return { cards, legend: [
      { text: fill(d.legend[0], { n: 1 }) },
      { text: fill(d.legend[1], { n: 1 }), color: C.bad },
      { text: fill(d.legend[2], { n: tune.lodge_perfect }), color: C.gold },
    ] };
  }

  Minigames.add('lodge', lodge, howto);
})();
