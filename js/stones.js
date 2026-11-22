// PROTOTYPE - NOT FOR PRODUCTION
// The stones of the builders' lodge (its game, « La bonne pierre », is js/minigame-lodge.js).
// A stone is a list of cells [x, y] that touch through their sides. A stone fits a hole when it is
// the hole's very shape once moved and turned by quarter turns: never once flipped over, since a
// cut stone cannot be laid face down. A round is a hole and four stones of which exactly one fits.
// Pure: no drawing, no global but Stones, every draw read from the `rnd` it is given.
'use strict';

const Stones = (() => {
  const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const MOVES = 60; // tries at a wrong stone made by moving one cell of the right one, before taking one from the whole list

  /** The same cells moved to touch x = 0 and y = 0, in reading order: two equal stones read alike. */
  function norm(cells) {
    let mx = Infinity, my = Infinity;
    for (const [x, y] of cells) { if (x < mx) mx = x; if (y < my) my = y; }
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }
  const key = cells => norm(cells).map(c => c.join(',')).join(' ');
  /** A quarter turn, clockwise on the screen (y goes down). */
  const turn = cells => norm(cells.map(([x, y]) => [-y, x]));
  /** The stone flipped over, left to right. */
  const mirror = cells => norm(cells.map(([x, y]) => [-x, y]));
  /** Equal once moved. */
  const same = (a, b) => a.length === b.length && key(a) === key(b);
  /** The stone fits the hole: equal once moved and turned, never flipped. */
  function fits(hole, stone) {
    if (hole.length !== stone.length) return false;
    let t = stone;
    for (let i = 0; i < 4; i++, t = turn(t)) if (same(hole, t)) return true;
    return false;
  }
  /** The free cells next to these. */
  function around(cells) {
    const taken = new Set(cells.map(c => c.join(','))), out = [], seen = new Set();
    for (const [x, y] of cells) for (const [dx, dy] of SIDES) {
      const k = (x + dx) + ',' + (y + dy);
      if (!taken.has(k) && !seen.has(k)) { seen.add(k); out.push([x + dx, y + dy]); }
    }
    return out;
  }
  function connected(cells) {
    if (!cells.length) return false;
    const all = new Set(cells.map(c => c.join(','))), seen = new Set([cells[0].join(',')]), todo = [cells[0]];
    while (todo.length) {
      const [x, y] = todo.pop();
      for (const [dx, dy] of SIDES) { const k = (x + dx) + ',' + (y + dy); if (all.has(k) && !seen.has(k)) { seen.add(k); todo.push([x + dx, y + dy]); } }
    }
    return seen.size === all.size;
  }
  const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];

  /** A shape of `n` cells grown from one, a free neighbour at a time: always in one piece. */
  function shape(n, rnd) {
    const cells = [[0, 0]];
    while (cells.length < n) cells.push(pick(around(cells), rnd));
    return norm(cells);
  }
  /** Turned `k` quarter turns. */
  function turned(cells, k) { let t = norm(cells); for (let i = 0; i < k; i++) t = turn(t); return t; }

  // Every stone of n cells, one per piece up to a quarter turn (not up to a flip), worked out once:
  // the last resort for a wrong stone, so that a round always ends. There are 7 of 4 cells, 18 of 5,
  // 60 of 6 and 196 of 7.
  const pieces = {};
  function piecesOf(n) {
    if (pieces[n]) return pieces[n];
    let level = new Map([[key([[0, 0]]), [[0, 0]]]]);
    for (let m = 1; m < n; m++) {
      const next = new Map();
      for (const cells of level.values()) for (const c of around(cells)) { const s = norm(cells.concat([c])); next.set(key(s), s); }
      level = next;
    }
    const out = [];
    for (const s of level.values()) if (!out.some(o => fits(o, s))) out.push(s);
    return (pieces[n] = out);
  }

  /** A wrong stone near the right one: one of its cells moved elsewhere along its edge, still in one piece. Null when that breaks it. */
  function moved(right, rnd) {
    const i = Math.floor(rnd() * right.length), rest = right.filter((c, j) => j !== i);
    if (!connected(rest)) return null;
    const free = around(rest).filter(([x, y]) => x !== right[i][0] || y !== right[i][1]);
    return free.length ? norm(rest.concat([pick(free, rnd)])) : null;
  }

  /**
   * A hole and four stones, exactly one of which, stones[right], fits. The shape has `ramp.cells`
   * cells and one more every `ramp.cellsEvery` wins (`level`), `ramp.cellsMax` at most. The wrong
   * stones are the right one with a cell moved, none of them fitting the hole nor the same piece as
   * another; from `ramp.mirrorFrom` wins one is the right one flipped, when that does not fit. After
   * MOVES tries at moving a cell, the rest are taken from the list of every piece of that size (in
   * which at least six others are always left), so the round always ends. From `ramp.turnFrom` wins
   * each stone is shown turned at random; the four come in a random order.
   */
  function round(level, ramp, rnd) {
    const n = Math.min(ramp.cellsMax, ramp.cells + Math.floor(level / ramp.cellsEvery));
    const hole = shape(n, rnd), wrong = [];
    const fresh = s => !fits(hole, s) && !wrong.some(w => fits(w, s));
    if (level >= ramp.mirrorFrom && fresh(mirror(hole))) wrong.push(mirror(hole));
    for (let i = 0; i < MOVES && wrong.length < 3; i++) { const s = moved(hole, rnd); if (s && fresh(s)) wrong.push(s); }
    if (wrong.length < 3) {
      const all = piecesOf(n), from = Math.floor(rnd() * all.length);
      for (let i = 0; i < all.length && wrong.length < 3; i++) { const s = all[(from + i) % all.length]; if (fresh(s)) wrong.push(s); }
    }
    const stones = [hole].concat(wrong).map(s => level >= ramp.turnFrom ? turned(s, Math.floor(rnd() * 4)) : norm(s));
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { hole, stones: order.map(i => stones[i]), right: order.indexOf(0) };
  }

  return { shape, turn, mirror, same, fits, round };
})();
