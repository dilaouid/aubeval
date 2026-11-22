# « Le quartier d'Aveline » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the lodge's mini-game « La bonne pierre » with « Le quartier d'Aveline »: memorise a small isometric quarter, rebuild it, score on likeness and speed.

**Architecture:** A new pure module `js/blueprint.js` (draw a plan, turn it, compare a grid to it, score a quarter) replaces `js/stones.js`. `js/minigame-lodge.js` is rewritten on top of it, with the same game contract (`{ update, draw, auto, score, done, lost, why }`, `Minigames.add('lodge', game, howto)`). Content in `data/venues.js` (`venues.lodge`), knobs in `config.js` (`lodge_*`).

**Tech Stack:** Vanilla JS on a 1280×720 canvas, no build step; tests are plain Node scripts (`node tools/test-venues.js`, `node tools/test-i18n.js`, `node tools/i18n.js check`).

**Spec:** `docs/superpowers/specs/2026-11-22-quartier-aveline-design.md`

## Global Constraints

- Work on a new branch `feat/quartier-aveline` from `main`; the spec is the branch's first commit.
- Commit messages: the message only, **never** a `Co-Authored-By` trailer (the user's standing rule).
- Every source file keeps the project's header (`// PROTOTYPE - NOT FOR PRODUCTION`) and its comment style: English comments, short doc comments on each function.
- `js/` shows the player no French of its own: every visible word goes through `tr()` / `DATA` (`tools/test-i18n.js` enforces it).
- Rules never draw; only `draw()` and the howto cards' `draw` callbacks touch `ctx`.
- The game plays fully by keyboard and fully by mouse; Escape (pause) and quitting are the host's (`js/venue.js`) and must keep working.
- Every new or changed text exists in French, English and Spanish; a card's words ≤ 42 chars, `say` ≤ 90, `how` ≤ 110 (test in `tools/test-venues.js`).
- Nothing new is saved; a save's lodge streak, record and wait stay as they are.

## Review Focus

1. **Keys held across phases** — Enter pressed to end the plan display and still held must not validate the empty grid next frame; Space held must peek once. (Test in Task 2.)
2. **Space is also `inp.act`** — the host sends `act: true` for Space *and* for a left click on nothing; Space must peek and never place a building at the mouse. (Test in Task 3.)
3. **A digit with no building behind it** — key 6 when only 4 kinds are in play does nothing. (Test in Task 2.)
4. **Actions in the wrong phase** — peek / validate / put during `show`, `peek` or `reveal` do nothing (except Enter in `show`, which is « J'ai vu ! »). (Test in Task 2.)
5. **The clock runs out mid-quarter or mid-peek** — the game ends, the quarter scores nothing and is not a miss, `lost` stays false. (Test in Task 2.)

---

### Task 1: The plan module (`js/blueprint.js`)

**Files:**
- Create: `js/blueprint.js`
- Modify: `data/venues.js` (`venues.lodge`: add `kinds`, add the new `ramp` keys next to the old ones — the old keys go in Task 2)
- Modify: `index.html` (script tag after `js/stones.js`, and a line in the file map near line 158)
- Modify: `tools/test-venues.js` (`load()` runs `js/blueprint.js` and returns `Blueprint`; new tests)

**Interfaces:**
- Produces (global `Blueprint`, pure, no `ctx`, no `DATA` read inside):
  - `Blueprint.spec(level: number, ramp) -> { side, count, kinds, show, turned }`
    - `side = min(ramp.sideMax, ramp.side + floor(level / ramp.sideEvery))`
    - `count = min(ramp.countMax, floor(side² × ramp.fill), ramp.count + level)`
    - `kinds = min(ramp.kindsMax, ramp.kinds + floor(level / ramp.kindsEvery))`
    - `show = max(ramp.showMin, ramp.show − ramp.showStep × level)`
    - `turned = level >= ramp.turnedFrom`
  - `Blueprint.draw(level, ramp, kinds: string[], rnd: () => number, last?: plan) -> plan` where `plan = { side, cells: (string|null)[side*side] (index y*side+x), turn: 0..3, kinds: string[] }`; `plan.kinds` = the first `spec.kinds` ids of `kinds` (the palette, in order); exactly `count` cells filled; at least `min(3, spec.kinds)` distinct kinds; no kind more than 2 times; `cells` never equal to `last.cells`; `turn = turned ? 1 + floor(rnd()·3) : 0`. Must terminate even with a constant `rnd`.
  - `Blueprint.turn(cells, side, q) -> cells` — q quarter turns clockwise; one turn sends (x, y) to (side−1−y, x).
  - `Blueprint.compare(planCells, gridCells) -> { right, wrong, missed, likeness }` — over cells occupied in either: `right` same kind, `wrong` grid has a building that differs from the plan (including on a plan-empty cell), `missed` plan has one and grid is empty; `likeness = right / (right + wrong + missed)`, 0 when that is 0.
  - `Blueprint.points(cmp, secs: number, count: number, T) -> { base, perfect, quick, total }` — `base = max(0, right − wrong)`; `perfect = likeness === 1 ? T.lodge_perfect : 0`; `quick` = 3 / 2 / 1 / 0 when `likeness >= 0.5` and `secs <= count × T.lodge_quick_3 / _2 / _1`, else 0; `total` the sum.
- Data: `venues.lodge.kinds = ['house', 'bakery', 'forge', 'chapel', 'cafe', 'mage_tower']` (all 2×2; swap one in Task 3 if two read alike on screen). New ramp keys: `{ side: 3, sideEvery: 3, sideMax: 5, count: 4, countMax: 9, fill: 0.6, kinds: 4, kindsEvery: 2, kindsMax: 6, show: 5, showStep: 0.4, showMin: 2.5, turnedFrom: 3 }` (`turnedFrom`, not `turnFrom`: the stones still read `turnFrom` until Task 2 deletes it).
- Config used by `points` (add in this task, `config.js`, next to the other `lodge_*` game knobs): `lodge_perfect` 3, `lodge_quick_3` 1.0, `lodge_quick_2` 1.6, `lodge_quick_1` 2.2 (seconds per building of the plan). Give each `min/max/step` and a one-line comment like its neighbours.

- [ ] **Step 1: Create the branch and commit the spec**

```bash
git switch -c feat/quartier-aveline
git add docs/superpowers/specs/2026-11-22-quartier-aveline-design.md docs/superpowers/plans/2026-11-22-quartier-aveline.md
git commit -m "docs(lodge): design and plan of « Le quartier d'Aveline »"
```

- [ ] **Step 2: Write the failing tests** in `tools/test-venues.js`, after the stones tests, with the existing `seeded()`:

```js
// ---- The plans of Aveline's quarter (js/blueprint.js) ----
const LR = L => L.DATA.venues.lodge;
test('blueprint: the ramp grows as the spec says', () => {
  const L = load(), { Blueprint } = L, R = LR(L).ramp, s = l => plain(Blueprint.spec(l, R));
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6, 10].map(l => s(l).side), [3, 3, 3, 4, 4, 4, 5, 5]);
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6, 10].map(l => s(l).count), [4, 5, 5, 7, 8, 9, 9, 9]);
  assert.deepStrictEqual([0, 1, 2, 3, 4, 10].map(l => s(l).kinds), [4, 4, 5, 5, 6, 6]);
  assert.strictEqual(s(0).show, 5); assert.strictEqual(s(10).show, 2.5);
  assert.strictEqual(s(2).turned, false); assert.strictEqual(s(3).turned, true);
});
test('blueprint: every plan has its count, its kinds, two of a kind at most, and differs from the last', () => {
  const L = load(), { Blueprint } = L, d = LR(L);
  for (let lvl = 0; lvl <= 10; lvl++) { let last;
    for (let s = 0; s < 300; s++) {
      const p = Blueprint.draw(lvl, d.ramp, d.kinds, seeded(s * 7 + lvl), last), sp = Blueprint.spec(lvl, d.ramp), at = lvl + '/' + s;
      assert.strictEqual(p.side, sp.side, at); assert.strictEqual(p.cells.length, sp.side * sp.side, at);
      const built = p.cells.filter(Boolean); assert.strictEqual(built.length, sp.count, at);
      assert.deepStrictEqual(Array.from(p.kinds), d.kinds.slice(0, sp.kinds), at);
      const n = {}; for (const k of built) { assert.ok(p.kinds.includes(k), at); n[k] = (n[k] || 0) + 1; }
      assert.ok(Object.values(n).every(v => v <= 2), at + ' too many of a kind');
      assert.ok(Object.keys(n).length >= Math.min(3, sp.kinds), at + ' too few kinds');
      assert.ok(sp.turned ? p.turn >= 1 && p.turn <= 3 : p.turn === 0, at + ' turn');
      if (last) assert.notDeepStrictEqual(Array.from(p.cells), Array.from(last.cells), at + ' same plan twice');
      last = p;
    } }
});
test('blueprint: a draw that always says the same still ends', () => {
  const L = load(), d = LR(L);
  for (const v of [0, 0.5, 0.999999]) for (let lvl = 0; lvl <= 10; lvl++) { const a = L.Blueprint.draw(lvl, d.ramp, d.kinds, () => v); L.Blueprint.draw(lvl, d.ramp, d.kinds, () => v, a); }
});
test('blueprint: a quarter turn, and four of them', () => {
  const { Blueprint } = load(), c = ['a', null, null, null, null, null, null, null, 'b']; // a at (0,0), b at (2,2)
  const t = Blueprint.turn(c, 3, 1);
  assert.strictEqual(t[0 * 3 + 2], 'a'); assert.strictEqual(t[2 * 3 + 0], 'b');
  assert.deepStrictEqual(Array.from(Blueprint.turn(c, 3, 4)), c);
});
test('blueprint: compare and points', () => {
  const L = load(), { Blueprint } = L, T = L.tune;
  const plan = ['h', 'b', null, null], grid = ['h', 'f', 'h', null];
  assert.deepStrictEqual(plain(Blueprint.compare(plan, grid)), { right: 1, wrong: 2, missed: 0, likeness: 1 / 3 });
  assert.deepStrictEqual(plain(Blueprint.compare(plan, [null, null, null, null])), { right: 0, wrong: 0, missed: 2, likeness: 0 });
  const perfect = Blueprint.compare(plan, plan.slice());
  assert.deepStrictEqual(plain(Blueprint.points(perfect, 2 * T.lodge_quick_3, 2, T)), { base: 2, perfect: T.lodge_perfect, quick: 3, total: 2 + T.lodge_perfect + 3 });
  assert.strictEqual(Blueprint.points(perfect, 2 * T.lodge_quick_1 + 0.01, 2, T).quick, 0);
  assert.strictEqual(Blueprint.points(Blueprint.compare(plan, grid), 0, 2, T).quick, 0, 'no speed under 50 %');
  assert.strictEqual(Blueprint.points(Blueprint.compare(plan, grid), 0, 2, T).base, 0, 'never below 0');
});
```

(`plain` already exists in the file: it turns sandbox objects into plain ones.)

- [ ] **Step 3: Run them to see them fail**

Run: `node tools/test-venues.js`
Expected: the five `blueprint:` tests FAIL (`Blueprint` undefined); every other test still ok.

- [ ] **Step 4: Write `js/blueprint.js`**, add `kinds`, the ramp keys and the four knobs, the script tag (`<script src="js/blueprint.js"></script>` right after `js/stones.js`) and the file-map line in `index.html`, and `run('js/blueprint.js')` + `Blueprint: get('Blueprint')` in `load()`.

`draw` approach: shuffle the cell indices with `rnd`, take the first `count`; fill them from a bag holding each palette kind twice, shuffled with `rnd`, and ensure ≥ 3 distinct kinds by construction (the bag's first `min(3, kinds)` entries are distinct). If the cells equal `last.cells`, rotate the filled cells' kinds by one (deterministic fallback, so a constant `rnd` terminates). Shuffle with a Fisher–Yates that clamps `floor(rnd() × n)` to `n − 1`.

- [ ] **Step 5: Run the tests**

Run: `node tools/test-venues.js`
Expected: all pass, `N/N passed`.

- [ ] **Step 6: Commit**

```bash
git add js/blueprint.js data/venues.js config.js index.html tools/test-venues.js
git commit -m "feat(lodge): the plans of Aveline's quarter: draw, turn, compare, score"
```

---

### Task 2: The rules of « Le quartier d'Aveline » (stones out)

**Files:**
- Rewrite: `js/minigame-lodge.js` (rules + `auto`; `draw()` and `howto` minimal here, finished in Task 3)
- Delete: `js/stones.js`; its script tag and file-map line in `index.html`; `run('js/stones.js')`, `Stones` and every `stones:` / `la bonne pierre:` test in `tools/test-venues.js`; the `mirrorFrom` line of the « Nouveau ! » cards test
- Modify: `config.js` — `lodge_time` 36 → 60 (comment: « Le quartier d'Aveline »); delete `lodge_strikes`, `lodge_chain`, `lodge_chain_gap`; add `lodge_misses` 3, `lodge_peek_cost` 2, `lodge_peek_time` 1.5, `lodge_reveal_time` 1.5
- Modify: `data/venues.js` — `venues.lodge`: drop the stones' ramp keys (`cells`, `cellsEvery`, `cellsMax`, `turnFrom`, `mirrorFrom`); French `title: 'Le quartier d’Aveline'`, `unit: 'points'`, `how`, `say`, `steps` (3), `news: [{ id: 'turn', … }]`, `legend` (3), `medals` (set in Step 7); replace the `lg_*` strings (line ~67) with the game's own
- Test: `tools/test-venues.js`

**Interfaces:**
- Consumes: `Blueprint.spec / draw / turn / compare / points` (Task 1); `Minigames.kit` (`head`, `scoreBox`, `stepPops`, `drawPops`, `PANEL`, `KEY`, `fill`, `news`, `mark`, `keyBox`); globals `pressed(code)` (true while held), `rng`, `tr`, `sfx`, `tune`.
- Produces — the game object `g` (tests and Task 3 rely on these names):
  - state: `score` (may go below 0), `done`, `lost`, `why`, `t` (clock, not advancing in `reveal`), `phase` (`'show' | 'build' | 'peek' | 'reveal'`), `plan` (from `Blueprint.draw`), `grid` (`(string|null)[]`, canonical orientation, same indexing as `plan.cells`), `cursor {x, y}`, `pick` (palette index), `misses`, `quarters` (validated), `last` (`{ cmp, pts }` of the last validated quarter), `built` (seconds since the plan was hidden), `left` (seconds left in the current timed phase), `pops`.
  - actions (each a no-op outside its phase or when `done`): `seen()` (show → build), `select(k)` (palette index), `put(x, y, k)` (build; `k` palette index, or `-1` to clear; `k >= plan.kinds.length` ignored), `move(dx, dy)` (build; clamped to the grid), `peek()` (build → peek; `score −= lodge_peek_cost`), `validate()` (build → reveal; adds `pts.total`, a quarter with `likeness < 0.5` is a miss; at `lodge_misses` misses: `done`, `lost`, `why = tr('lg_end_misses')`).
  - `update(dt, inp)`: keyboard with edge detection (a key acts on the step it goes down): `Enter`/`NumpadEnter` = `seen()` in show, `validate()` in build; `Space` = `peek()`; `Digit1..6`/`Numpad1..6` = `put(cursor, k)`; `Digit0`/`Numpad0`/`Delete`/`Backspace` = clear at cursor; arrows = `move`: `→` x+1, `←` x−1, `↓` y+1, `↑` y−1. Timed phases count `left` down: show → build, peek → build, reveal → next plan in `show`. `t >= lodge_time` → `done` (no points, no miss for an unvalidated quarter).
  - `auto(dt, bot)`: in show, after `plan count × bot.pace` seconds, `seen()`; in build, every `bot.pace` puts the next plan cell (canonical) — with probability `bot.err` (stable per placement, like the old `roll`) the next palette kind instead — then `validate()` when all `count` are placed. Never peeks.
  - Reactions: `o.react('glad')` on a quarter ≥ 50 %, `o.react('chain')` on a perfect one, `o.react('cross')` on a miss.

- [ ] **Step 1: Write the failing tests** (replacing the removed `la bonne pierre:` tests). Helper: `const toBuild = g => { for (let i = 0; i < 600 && g.phase !== 'build'; i++) g.update(STEP, NO_INPUT); };` and `const copy = g => g.plan.cells.forEach((k, i) => g.put(i % g.plan.side, Math.floor(i / g.plan.side), k ? g.plan.kinds.indexOf(k) : -1));`

```js
test('quartier: a quick, sure hand gets gold, and bronze at least deep in a streak', () => {
  const bot = { pace: 0.8, err: 0 };
  const r0 = play('lodge', { level: 0, bot }), r10 = play('lodge', { level: 10, bot });
  assert.strictEqual(r0.medal, 3, JSON.stringify(r0)); assert.ok(r10.medal >= 1, JSON.stringify(r10));
});
test('quartier: doing nothing ends at lodge_time with no medal and no loss', () => {
  const L = load(), g = start(L, 'lodge', 0);
  assert.strictEqual(L.tune.lodge_time, 60);
  for (let i = 0; i < 60 * 61 && !g.done; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.done, true); assert.strictEqual(g.lost, false); assert.ok(g.score < L.DATA.venues.lodge.medals[0]);
});
test('quartier: the plan hides on its own, or at « J’ai vu ! »; Enter held does not validate next', () => {
  const L = load(), g = start(L, 'lodge', 0);
  assert.strictEqual(g.phase, 'show');
  L.ctx.pressed = k => k === 'Enter';
  for (let i = 0; i < 30; i++) g.update(STEP, NO_INPUT);
  L.ctx.pressed = () => false;
  assert.strictEqual(g.phase, 'build'); assert.strictEqual(g.quarters, 0, 'the held Enter validated');
});
test('quartier: a copied plan is perfect and worth right + perfect + speed', () => {
  const L = load(), T = L.tune, g = start(L, 'lodge', 0); toBuild(g);
  copy(g); const s = g.score; g.validate();
  assert.strictEqual(g.phase, 'reveal'); assert.strictEqual(g.last.cmp.likeness, 1);
  assert.strictEqual(g.score - s, g.last.pts.total); assert.strictEqual(g.last.pts.perfect, T.lodge_perfect);
});
test('quartier: the clock stops while the quarters are compared', () => {
  const L = load(), g = start(L, 'lodge', 0); toBuild(g); copy(g); g.validate();
  const t = g.t; g.update(0.5, NO_INPUT); assert.strictEqual(g.t, t);
});
test('quartier: three quarters under half bring the lesson to an end', () => {
  const L = load(), g = start(L, 'lodge', 0);
  for (let q = 0; q < 3; q++) { toBuild(g); g.validate(); }
  assert.strictEqual(g.misses, L.tune.lodge_misses); assert.strictEqual(g.lost, true); assert.strictEqual(g.done, true);
  assert.ok(typeof g.why === 'string' && g.why.length > 0);
});
test('quartier: a peek costs even at 0, once per press, and only while building', () => {
  const L = load(), T = L.tune, g = start(L, 'lodge', 0);
  g.peek(); assert.strictEqual(g.score, 0, 'a peek during the show');
  toBuild(g);
  L.ctx.pressed = k => k === 'Space'; for (let i = 0; i < 20; i++) g.update(STEP, NO_INPUT); L.ctx.pressed = () => false;
  assert.strictEqual(g.score, -T.lodge_peek_cost); assert.strictEqual(g.phase, 'peek');
  g.put(0, 0, 0); assert.strictEqual(g.grid[0], null, 'built during a peek');
  g.validate(); assert.strictEqual(g.phase, 'peek', 'validated during a peek');
  for (let i = 0; i < 60 * T.lodge_peek_time + 5; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.phase, 'build');
});
test('quartier: a key with no building behind it does nothing; arrows stay on the grid', () => {
  const L = load(), g = start(L, 'lodge', 0); toBuild(g);
  g.put(0, 0, g.plan.kinds.length); assert.strictEqual(g.grid[0], null);
  for (let i = 0; i < 10; i++) g.move(-1, -1); assert.deepStrictEqual(plain(g.cursor), { x: 0, y: 0 });
  L.ctx.pressed = k => k === 'Digit6'; g.update(STEP, NO_INPUT); L.ctx.pressed = () => false;
  assert.ok(g.grid.every(c => c === null), 'key 6 with four kinds');
});
test('quartier: time running out mid-quarter scores nothing and is no miss', () => {
  const L = load(), g = start(L, 'lodge', 0); toBuild(g); copy(g);
  for (let i = 0; i < 60 * 61 && !g.done; i++) g.update(STEP, NO_INPUT);
  assert.strictEqual(g.done, true); assert.strictEqual(g.lost, false); assert.strictEqual(g.misses, 0); assert.strictEqual(g.score, 0);
});
test('quartier: a hand that errs scores less than a sure one', () => {
  const sure = play('lodge', { level: 5, bot: { pace: 0.8, err: 0 } }), errs = play('lodge', { level: 5, bot: { pace: 0.8, err: 0.2 } });
  assert.ok(errs.score < sure.score, JSON.stringify({ sure, errs }));
});
```

Also in the « Nouveau ! » cards test: the lodge line becomes `fresh('lodge', V.lodge.ramp.turnedFrom) >= 1` (« the turned plan ») and the `mirrorFrom` line goes.

- [ ] **Step 2: Run them to see them fail**

Run: `node tools/test-venues.js`
Expected: the `quartier:` tests FAIL; the rest pass (the stones tests are gone).

- [ ] **Step 3: Rewrite `js/minigame-lodge.js`** with the rules and `auto` above. `draw()` for now: `head(d, total − g.t, total)` and `scoreBox(d, tr('lg_score'), g.score)` only. `howto(o)` returns 3 base cards (`d.steps`, keys: `[]`, `['1–' + spec.kinds, '←↑↓→', KEY.click()]`, `[KEY.space()]`, text of the third through `fill(d.steps[2], { n: tune.lodge_peek_cost })`) and, from `ramp.turnedFrom`, a `fresh` card `news(d, 'turn')`, each with an empty `draw` (Task 3 draws them); legend: `fill(d.legend[0], { n: 1 })`, `fill(d.legend[1], { n: 1 })` in `C.bad`, `fill(d.legend[2], { n: tune.lodge_perfect })` in `C.gold`. The new `lg_*` keys (French, in `data/venues.js`): `lg_score` « Score », `lg_misses_n` « Ratés », `lg_seen` « J’ai vu ! », `lg_peek` « Revoir le plan », `lg_peek_cost` « −{n} », `lg_check` « Valider », `lg_likeness` « Ressemblance : {n} % », `lg_quarter` « +{n} », `lg_perfect` « Parfait ! +{n} », `lg_miss` « Raté ! », `lg_end_misses` « Aveline arrête la leçon ! », `lg_keys` « Flèches, 1 à {n}, Suppr · Espace : revoir · Entrée : valider ». French card texts (≤ 42 chars): steps `['Retenez le quartier', 'Rebâtissez-le de mémoire', 'Revoir le plan : −{n} points']`, news turn `'Plan tourné : suivez le drapeau'`, legend `['Bâtiment juste : +{n}', 'Bâtiment faux : −{n}', 'Quartier parfait : +{n}']`, `how` « Retenez le quartier d’Aveline, puis rebâtissez-le de mémoire. », `say` « Une leçon de bâtisseuse : regardez bien, puis rebâtissez. ».

- [ ] **Step 4: Delete the stones** — `git rm js/stones.js`, its two lines in `index.html`, its load and tests; config and data changes above.

- [ ] **Step 5: Run the tests**

Run: `node tools/test-venues.js`
Expected: everything passes except possibly the gold/bronze test (medals not set yet).

- [ ] **Step 6: Measure the bot**

Run: `node -e "const {play}=require('./tools/test-venues.js');for(const l of [0,3,5,10])console.log(l,JSON.stringify(play('lodge',{level:l,bot:{pace:0.8,err:0}})))"`
Expected: a score per level; note them.

- [ ] **Step 7: Set `medals`** in `venues.lodge` to whole numbers ≈ 35 % / 60 % / 85 % of the level-0 score, strictly rising, then check the level-10 score ≥ bronze (lower the three together if not). Update the spec's « pace 0,35 s » line to « 0,8 s » (a 0,35 s bot is far faster than a person, and the medals are set from it).

- [ ] **Step 8: Run all the tests**

Run: `node tools/test-venues.js && node tools/test-i18n.js && node tools/test-assets.js`
Expected: all pass (the en/es layers still hold the old lodge texts; `test-i18n`'s « every real layer lays all its texts » may report the new keys as missing — if so, run `node tools/i18n.js extract en` and `… es` now to add them as `null` and leave the translating to Task 4, as long as the test runner passes; if it fails on `null`s, fill them in with a quick English/Spanish now and polish in Task 4).

- [ ] **Step 9: Commit**

```bash
git add -A js/minigame-lodge.js js/stones.js index.html config.js data/ tools/test-venues.js docs/superpowers/specs/2026-11-22-quartier-aveline-design.md
git commit -m "feat(lodge): « Le quartier d'Aveline » replaces « La bonne pierre »: memorise, rebuild, score"
```

---

### Task 3: Drawing the quarters, the mouse, and the cards

**Files:**
- Modify: `js/minigame-lodge.js` (`draw()`, the layout, mouse handling in `update`, `howto` cards' `draw`)
- Test: `tools/test-venues.js` (the Space/click test)

**Interfaces:**
- Consumes: `g` from Task 2; `Art.get(DATA.buildings[kind].sprite)` (bottom-centre anchored iso sprite, as `js/world.js:186` draws it), `Art.get('iso.tile.grass', n)`; `UI.button`, `UI.plate`, `UI.panel`, `UI.label`, `text`; global `mouse {x, y}` (canvas pixels).
- Produces, inside the file: `layout(side, cx, top, k) -> { at(x, y) -> {x, y} (the diamond's top corner on screen), cellAt(px, py) -> {x, y} | null, w, h }` — a pure function: diamond 64·k wide, 32·k tall, x axis going down-right, y down-left (as `isoX = mx − my`, `isoY = (mx + my)/2` in `js/world.js`).

Screen (1280 × 720; the bottom panel is `PANEL` = y 560..710):
- `show` / `peek`: the plan, drawn turned by `plan.turn` (`Blueprint.turn(cells, side, plan.turn)`), centred at x 640, scale 2 for side ≤ 4 and 1 for side 5 (or whatever integer fits above y 550). A countdown bar for `left`. In `show`: « J’ai vu ! » button. The flag: a small pennant (painted with `Minigames.kit.sprite`) on the screen corner where canonical (0, 0) lands after the turn.
- `build`: the player's grid at the same place and scale, canonical, the flag on (0, 0)'s corner; the cursor diamond outlined in gold; hovering the mouse highlights the cell under it. Right column: « Revoir le plan (−2) » and « Valider » buttons.
- `reveal`: side by side at scale 1 (x 340 and x 940): the plan **canonical** (left) and the grid (right), ✓ (`mark(true, …)`) / ✗ on each counted cell, then `lg_likeness` and the points (`lg_quarter` / `lg_perfect` / `lg_miss`) under them.
- Always: `head`, `scoreBox` (score in red below 0), misses `x / lodge_misses` plate like the old faults plate, and in `PANEL` the palette: one `UI.button` per `plan.kinds` entry with the building's sprite, its digit (`keyBox`) and its `card` name; the picked one `on: true`; clicking selects. `lg_keys` above the panel.
- Mouse in `update`: a left click on nothing arrives as `inp.act`; it is a click only when `!pressed('Space')` — then `put(cell under mouse, pick)`. `inp.alt` (right click) clears the cell under the mouse. Clicking a cell also moves the cursor there.
- Cards: 1 a small plan (scale 1), 2 an empty grid with two buildings dropped in and the palette keys, 3 the « Revoir le plan » button look with `−{n}`, fresh card: the same small plan turned with its flag next to the canonical one with its flag.
- Building kinds: if two of `venues.lodge.kinds` read alike at scale 1, replace one with another 2×2 building (`lumber_hut`, `weaver`, `goldsmith`, `roastery`) and say which in the commit.

- [ ] **Step 1: Write the failing test** (the Space/click overlap):

```js
test('quartier: Space peeks and never builds at the mouse; a click builds there', () => {
  const L = load(), g = start(L, 'lodge', 0); toBuild(g);
  L.ctx.mouse = { x: 640, y: 300 }; // over the grid
  L.ctx.pressed = k => k === 'Space'; g.update(STEP, { act: true, alt: false }); L.ctx.pressed = () => false;
  assert.strictEqual(g.phase, 'peek'); assert.ok(g.grid.every(c => c === null), 'Space built at the mouse');
  for (let i = 0; i < 60 * L.tune.lodge_peek_time + 5; i++) g.update(STEP, NO_INPUT);
  g.update(STEP, { act: true, alt: false });
  assert.strictEqual(g.grid.filter(Boolean).length, 1, 'a click on a cell builds');
  g.update(STEP, { act: false, alt: true });
  assert.ok(g.grid.every(c => c === null), 'a right click clears');
});
```

(Pick `mouse` coordinates that `layout` maps to a cell for side 3 — adjust the `{ x: 640, y: 300 }` above to the layout you chose; the test asserts what the cell holds, not which cell.)

- [ ] **Step 2: Run it to see it fail**

Run: `node tools/test-venues.js`
Expected: this test FAILS (no mouse handling yet).

- [ ] **Step 3: Write `layout`, the mouse handling, `draw()` and the cards' `draw`.**

- [ ] **Step 4: Run the tests**

Run: `node tools/test-venues.js`
Expected: all pass.

- [ ] **Step 5: Check it in the browser.** Start the game's preview (`.claude/launch.json`; the PixelLab memory note says how to test without overwriting the player's save or getting in their way in the browser pane), open the lodge's game at streak 0, 3 and 10 (the venue preview address with the bot, as `js/venue.js:802` does, and by hand). Check: the plan and grid fit above the panel at side 5; the flag sits on the same corner on both; the six kinds read apart; keyboard-only and mouse-only rounds work; Escape pauses; the cards render (3 cards, 4 from streak 3). Screenshot a `build` and a `reveal`.

- [ ] **Step 6: Commit**

```bash
git add js/minigame-lodge.js tools/test-venues.js data/venues.js
git commit -m "feat(lodge): Aveline's quarter drawn in iso with the village's buildings, the mouse, and its cards"
```

---

### Task 4: Aveline's words, the tutorial, and the translations

**Files:**
- Modify: `data/venues.js` — `venues.lodge`: `greet`, `ready` (3), `wait` (2), `chat` (5), `tips` (keep), `glad` (4), `cross` (3), `chain` (3, said on a perfect quarter), `after` (4: lost / bronze / silver / gold); no stone or wall left in them. Keep Aveline's voice (« bourgmestre », builder's trade, warm and proud), and the same counts as today.
- Modify: `data/tutorial.js` — lesson `lodge`: `about` (« son jeu du quartier à rebâtir ») and the step `stone`'s first `say` line (Entrer, « {game:lodge} », what the game asks); its id `stone` may stay.
- Modify: `data/i18n/en/*.js`, `data/i18n/es/*.js` — every lodge text changed in Tasks 2–4, and the `lg_*` strings (`strings.js` layers).

- [ ] **Step 1: Write the French lines** in `data/venues.js` and `data/tutorial.js`.

- [ ] **Step 2: Bring the layers up to date**

Run: `node tools/i18n.js extract en` then `node tools/i18n.js extract es`
Then: translate every `null` line, and rewrite every lodge line whose French comment no longer matches the French text (search the layers for `venues.lodge.`, `strings.lg_`, `tutorial.lessons[lodge]`); delete lines `check` reports as leading nowhere (the old `lg_faults_n`, `lg_chain`, `news[mirror]`, …).

- [ ] **Step 3: Check the layers and the gender holes**

Run: `node tools/i18n.js check && node tools/i18n.js gender en && node tools/i18n.js gender es`
Expected: exit 0, no report.

- [ ] **Step 4: Run every test**

Run: `node tools/test-venues.js && node tools/test-i18n.js && node tools/test-assets.js && node tools/test-forge.js && node tools/test-heroes.js`
Expected: all pass (the card-length test covers en/es steps and news).

- [ ] **Step 5: Check the tutorial checker** — load the game in the preview, open the console: no new « rien ne couvre » / missing line for the lodge (`js/tuto-check.js` runs at start).

- [ ] **Step 6: Commit**

```bash
git add data/
git commit -m "feat(lodge): Aveline speaks of her quarter, in three languages"
```
