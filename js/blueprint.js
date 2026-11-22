// PROTOTYPE - NOT FOR PRODUCTION
// The plans of Aveline's quarter, for the builders' lodge's game « Le quartier d'Aveline »
// (js/minigame-lodge.js). Pure: no drawing, no DATA, no clock; the draw is the caller's.
// A plan is { side, cells, turn, kinds }: `cells` holds side × side building kinds (or null), cell
// (x, y) at index y * side + x; `turn` is how many quarter turns it is shown turned by (0 to 3);
// `kinds` is the palette, the building kinds this plan may use, in the order of their keys.
// The ramp (data/venues.js venues.lodge.ramp) says how the plans grow with the winning streak.
'use strict';

const Blueprint = (() => {
  /** What a plan is at the streak `level`: { side, count (buildings), kinds (in the palette), show (seconds), turned }. */
  function spec(level, R) {
    const side = Math.min(R.sideMax, R.side + Math.floor(level / R.sideEvery));
    return {
      side,
      count: Math.min(R.countMax, Math.floor(side * side * R.fill), R.count + level),
      kinds: Math.min(R.kindsMax, R.kinds + Math.floor(level / R.kindsEvery)),
      show: Math.max(R.showMin, R.show - R.showStep * level),
      turned: level >= R.turnedFrom,
    };
  }
  /** The list shuffled in place with the draw `rnd` (a draw of 1 or more still picks a member). */
  function shuffle(list, rnd) {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(rnd() * (i + 1))); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  }
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  /**
   * A new plan at the streak `level`, its buildings taken from `kinds` (the lodge's list, in order),
   * drawn with `rnd`: two of a kind at most, three kinds at least (as many as the palette holds),
   * never the same as `last`.
   */
  function draw(level, R, kinds, rnd, last) {
    const sp = spec(level, R), palette = kinds.slice(0, sp.kinds), n = sp.side * sp.side;
    const spots = shuffle(Array.from({ length: n }, (_, i) => i), rnd).slice(0, sp.count);
    // the bag: each kind twice; its first ones all differ, so a plan holds several kinds whatever the draw
    const firsts = shuffle(palette.slice(), rnd), rest = shuffle(palette.slice(), rnd), bag = firsts.concat(rest);
    const cells = new Array(n).fill(null);
    spots.forEach((at, i) => { cells[at] = bag[i]; });
    if (last && same(cells, last.cells)) { // the same plan twice: move each building's kind on to the next in the palette
      const was = cells.slice();
      for (const at of spots) cells[at] = palette[(palette.indexOf(was[at]) + 1) % palette.length];
    }
    return { side: sp.side, cells, turn: sp.turned ? 1 + Math.min(2, Math.floor(rnd() * 3)) : 0, kinds: palette };
  }
  /** The cells turned `q` quarter turns clockwise: one turn sends (x, y) to (side − 1 − y, x). */
  function turn(cells, side, q) {
    let out = cells.slice();
    for (let k = 0; k < ((q % 4) + 4) % 4; k++) {
      const next = new Array(out.length).fill(null);
      for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) next[x * side + (side - 1 - y)] = out[y * side + x];
      out = next;
    }
    return out;
  }
  /**
   * A grid against its plan, over the cells built on either side: `right` the same building, `wrong`
   * a building the plan does not have there, `missed` one the grid left out; `likeness` the share right.
   */
  function compare(plan, grid) {
    let right = 0, wrong = 0, missed = 0;
    for (let i = 0; i < plan.length; i++) {
      const p = plan[i] || null, g = grid[i] || null;
      if (!p && !g) continue;
      if (p === g) right++; else if (g) wrong++; else missed++;
    }
    const all = right + wrong + missed;
    return { right, wrong, missed, likeness: all ? right / all : 0 };
  }
  /**
   * A quarter's points (`cmp` from compare, `secs` it took to build once the plan hid, `count` the
   * plan's buildings, `T` the knobs): the right less the wrong (never below 0), the perfect quarter's
   * bonus, and a quick hand's (only from half alike up).
   */
  function points(cmp, secs, count, T) {
    const base = Math.max(0, cmp.right - cmp.wrong), perfect = cmp.likeness === 1 ? T.lodge_perfect : 0;
    let quick = 0;
    if (cmp.likeness >= 0.5) quick = secs <= count * T.lodge_quick_3 ? 3 : secs <= count * T.lodge_quick_2 ? 2 : secs <= count * T.lodge_quick_1 ? 1 : 0;
    return { base, perfect, quick, total: base + perfect + quick };
  }
  return { spec, draw, turn, compare, points };
})();
