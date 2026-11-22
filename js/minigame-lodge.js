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
  const { head, scoreBox, stepPops, drawPops } = Minigames.kit;
  // the keys, by what they do: digits build the palette's buildings, these clear, the arrows move the cursor
  const DIGITS = [1, 2, 3, 4, 5, 6].map(n => ['Digit' + n, 'Numpad' + n]);
  const CLEAR = ['Digit0', 'Numpad0', 'Delete', 'Backspace'], ENTER = ['Enter', 'NumpadEnter'], PEEK = ['Space'];
  const ARROWS = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]];

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
    function seen() { if (g.done || g.phase !== 'show') return; g.phase = 'build'; g.built = 0; sfx('click'); }
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
    /** « Valider »: the grid against the plan, the quarter's points; under half alike is a miss, and enough end the lesson. */
    function validate() {
      if (g.done || g.phase !== 'build') return;
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
    function update(dt) {
      if (g.done) return;
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

    function draw() {
      head(d, total - g.t, total); scoreBox(d, tr('lg_score'), Math.round(g.score));
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto, seen, select, put, move, peek, validate });
  }

  /** The intro's cards: look at the quarter, rebuild it from memory, a second look costs; the turned plan when it comes. */
  function howto(o) {
    const d = o.d, R = d.ramp, C = UI.C, { fill, news, KEY } = Minigames.kit, sp = Blueprint.spec(o.level, R);
    const cards = [
      { text: d.steps[0], keys: [], draw() {} },
      { text: d.steps[1], keys: ['1–' + sp.kinds, '←↑↓→', KEY.click()], draw() {} },
      { text: fill(d.steps[2], { n: tune.lodge_peek_cost }), keys: [KEY.space()], draw() {} },
    ];
    if (o.level >= R.turnedFrom) cards.push({ fresh: true, text: news(d, 'turn'), keys: [], draw() {} });
    return { cards, legend: [
      { text: fill(d.legend[0], { n: 1 }) },
      { text: fill(d.legend[1], { n: 1 }), color: C.bad },
      { text: fill(d.legend[2], { n: tune.lodge_perfect }), color: C.gold },
    ] };
  }

  Minigames.add('lodge', lodge, howto);
})();
