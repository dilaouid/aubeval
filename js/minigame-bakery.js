// PROTOTYPE - NOT FOR PRODUCTION
// The bakery's mini-game, « La fournée » (js/venue.js hosts it, js/minigames.js registers it).
// A row of ovens, a loaf baking in each: its gauge goes from pale to golden to dark, and it burns at
// the end. Its oven's key (1 to 5) or a click on it takes the loaf out: golden is worth 2, in the heart
// of the golden window 3, dark 1, pale nothing (the loaf is lost). The oven fills again on its own.
// A burnt loaf is a strike; at config bakery_strikes the batch is lost. Each win in a row bakes
// faster, narrows the window, adds an oven every few wins and brings the brioche.
// Content in data/venues.js (venues.bakery), knobs in config.js (bakery_*). Nothing here is saved.
'use strict';

(() => {
  const { PANEL, sprite, head, scoreBox, stepPops, drawPops } = Minigames.kit;
  const TONES = ['#f2dfa4', '#e0a040', '#9a5424', '#2e1a10']; // pale, golden, dark, burnt: the crust as it bakes

  /** An oven of bricks with its dark mouth, 30x24. */
  const oven = () => sprite('bk:oven', 30, 24, R => {
    R(1, 4, 28, 20, '#b0563a'); R(0, 22, 30, 2, '#6a2e1e');
    for (let y = 6; y < 22; y += 4) { R(1, y, 28, 1, '#7a3624'); for (let x = 1 + (y % 8 ? 4 : 0); x < 29; x += 8) R(x, y - 3, 1, 3, '#7a3624'); }
    R(4, 0, 22, 5, '#c8694a'); R(4, 0, 22, 1, '#e0896a'); R(12, 0, 6, 2, '#4a3a36');
    R(5, 9, 20, 12, '#1c100c'); R(7, 7, 16, 2, '#1c100c'); R(6, 19, 18, 2, '#5a2412');
  });
  /** A loaf, 18x10, its crust in the tone of the moment (0 pale .. 3 burnt). */
  function loaf(bread, tone) {
    const c = TONES[tone], hi = tone === 3 ? '#4a2a1a' : '#fff2c4', sh = tone === 3 ? '#140a06' : '#6a3a18';
    return sprite('bk:' + bread.id + ':' + tone, 18, 10, R => {
      if (bread.id === 'baguette') { R(0, 4, 18, 4, c); R(1, 3, 16, 1, c); R(1, 8, 16, 1, sh); for (let x = 3; x < 16; x += 4) R(x, 4, 2, 1, hi); }
      else if (bread.id === 'brioche') { R(3, 4, 12, 6, c); R(4, 2, 10, 2, c); R(7, 0, 4, 2, c); R(3, 9, 12, 1, sh); R(8, 0, 2, 1, hi); R(5, 3, 3, 1, hi); }
      else { R(2, 3, 14, 7, c); R(4, 1, 10, 2, c); R(2, 9, 14, 1, sh); R(5, 3, 3, 1, hi); R(10, 4, 3, 1, hi); }
    });
  }

  function bakery(o) {
    const d = o.d, L = o.level, R = d.ramp, P = d.points, total = tune.bakery_time;
    const n = Math.min(R.ovensMax, R.ovens + Math.floor(L / R.ovensEvery)), breads = d.breads.filter(b => (b.from || 0) <= L);
    // the golden window, as a share of the baking: centred where config sets it, narrower with the streak
    const w = Math.max(tune.bakery_window_min, (tune.bakery_gold_to - tune.bakery_gold_from) * (1 - R.window * L));
    const mid = (tune.bakery_gold_from + tune.bakery_gold_to) / 2, from = mid - w / 2, to = mid + w / 2;
    /** Seconds a loaf takes from the oven's mouth to burnt. */
    const bakeSecs = b => Math.max(tune.bakery_bake_min, tune.bakery_bake * b.bake * (1 - R.bake * L));
    const next = () => breads[Math.floor(rng() * breads.length)];
    const g = { score: 0, done: false, lost: false, why: '', t: 0, burnt: 0, loaves: 0, pops: [], lit: -1, litT: 0, bot: 0, ovens: [] };
    // the ovens start empty, filled one after the other so their loaves never come out all at once
    for (let i = 0; i < n; i++) g.ovens.push({ bread: next(), t: 0, state: 'empty', wait: tune.bakery_reload + i * 0.8, n: 0 });
    const xOf = i => { const bw = 200, gap = 12; return 640 - (n * bw + (n - 1) * gap) / 2 + i * (bw + gap); };
    const pop = (i, str, color) => g.pops.push({ x: xOf(i) + 100, y: 560, str, color, size: 22, t: 0 });
    /** Where a loaf stands: 0 pale, 1 golden, 2 dark (3 burnt is never taken). */
    const toneOf = t => t < from ? 0 : t <= to ? 1 : t < 1 ? 2 : 3;
    function empty(ov) { ov.state = 'empty'; ov.wait = tune.bakery_reload; }

    /** The loaf of oven `i` comes out: what it is worth depends on how far it baked. */
    function take(i) {
      const ov = g.ovens[i];
      if (g.done || !ov || ov.state !== 'baking') return;
      g.lit = i; g.litT = 0.25;
      const tone = toneOf(ov.t);
      if (tone === 0) { pop(i, tr('bk_pale'), UI.C.bad); sfx('error'); o.react('cross'); }
      else if (tone === 1 && Math.abs(ov.t - mid) <= w * tune.bakery_perfect / 2) { g.score += P.perfect; pop(i, tr('bk_perfect', { n: P.perfect }), UI.C.gold); sfx('crit'); o.react('glad'); }
      else if (tone === 1) { g.score += P.golden; pop(i, tr('bk_golden', { n: P.golden }), UI.C.good); sfx('coin'); }
      else { g.score += P.dark; pop(i, tr('bk_dark', { n: P.dark }), UI.C.text); sfx('place'); }
      g.loaves++; empty(ov);
    }
    function update(dt) {
      g.t += dt;
      if (g.litT > 0) g.litT -= dt;
      for (let i = 0; i < n; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) take(i);
      for (let i = 0; i < n; i++) {
        const ov = g.ovens[i];
        if (ov.state === 'empty') {
          ov.wait -= dt;
          if (ov.wait <= 0) { ov.state = 'baking'; ov.t = 0; ov.bread = next(); ov.n++; }
          continue;
        }
        ov.t += dt / bakeSecs(ov.bread);
        if (ov.t < 1) continue;
        g.burnt++; empty(ov); // burnt: a strike, and the oven is cleared
        pop(i, tr('bk_burnt'), UI.C.bad); sfx('hurt'); o.react('lost');
      }
      stepPops(g.pops, dt);
      if (g.burnt >= tune.bakery_strikes) { g.done = true; g.lost = true; g.why = tr('bk_end_strikes'); }
      if (g.t >= total) g.done = true;
    }
    /** The game's own hand: each loaf out in the middle of its window, `err` of the window off, a loaf every `pace` seconds at most. */
    function auto(dt, bot) {
      g.bot -= dt;
      if (g.bot > 0) return;
      for (let i = 0; i < n; i++) {
        const ov = g.ovens[i];
        if (ov.state !== 'baking') continue;
        const aim = mid + bot.err * w * Math.sin((ov.n + i * 7) * 12.9898);
        if (ov.t >= aim - dt / bakeSecs(ov.bread) / 2) { take(i); g.bot = bot.pace; return; }
      }
    }

    function draw() {
      const C = UI.C;
      head(d, total - g.t, total); scoreBox(d, tr('bk_score'), g.score);
      UI.plate(1118, 78, 150, 34); UI.label(`${tr('bk_burnt_n')}${tr('colon')}${g.burnt} / ${tune.bakery_strikes}`, 1193, 96, 14, g.burnt ? C.bad : C.dim);
      text(tr('bk_keys', { n }), 640, 546, 13, C.text, 'center', true);
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      for (let i = 0; i < n; i++) { // the ovens: a click, or its number
        const ov = g.ovens[i], x = xOf(i), y = 574, bw = 200, baking = ov.state === 'baking';
        UI.button(x, y, bw, 122, '', () => take(i));
        if (g.lit === i && g.litT > 0) { ctx.fillStyle = 'rgba(255,215,94,0.3)'; ctx.fillRect(x + 6, y + 6, bw - 12, 110); }
        Venue.pix(oven(), x + 10, y + 12, 3);
        if (baking) {
          const tone = toneOf(ov.t);
          if (tone > 0) { ctx.fillStyle = 'rgba(255,140,40,' + (0.15 + 0.15 * Math.sin(g.t * 6 + i)) + ')'; ctx.fillRect(x + 25, y + 39, 60, 36); } // the oven's glow
          Venue.pix(loaf(ov.bread, tone), x + 28, y + 46, 3);
          UI.label(ov.bread.name, x + 148, y + 30, 15, C.text);
        } else UI.label(tr('bk_reload'), x + 148, y + 30, 12, C.dim);
        // the gauge: pale, the golden window with its heart, dark; the needle is the loaf
        const gx = x + 108, gy = y + 54, gw = 80, gh = 16;
        ctx.fillStyle = C.ink; ctx.fillRect(gx - 2, gy - 2, gw + 4, gh + 4);
        ctx.fillStyle = TONES[0]; ctx.fillRect(gx, gy, gw * from, gh);
        ctx.fillStyle = '#58b83a'; ctx.fillRect(gx + gw * from, gy, gw * w, gh);
        ctx.fillStyle = C.gold; ctx.fillRect(gx + gw * (mid - w * tune.bakery_perfect / 2), gy, Math.max(2, gw * w * tune.bakery_perfect), gh);
        ctx.fillStyle = TONES[2]; ctx.fillRect(gx + gw * to, gy, gw * (1 - to), gh);
        if (baking) { const nx = gx + gw * clamp(ov.t, 0, 1); ctx.fillStyle = C.ink; ctx.fillRect(nx - 3, gy - 6, 6, gh + 12); ctx.fillStyle = '#ffffff'; ctx.fillRect(nx - 1, gy - 4, 2, gh + 8); }
        UI.box(x + 10, y + 10, 26, 26, C.ink, C.lineL); UI.label(String(i + 1), x + 23, y + 24, 15, C.gold);
      }
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto, take });
  }

  /** The intro's cards: the loaf bakes, out when golden, the burnt ones end it; the brioche when it comes. */
  function howto(o) {
    const d = o.d, P = d.points, C = UI.C, { fill, arrow, mark, keyBox, KEY } = Minigames.kit, miche = d.breads.find(b => b.id === 'miche') || d.breads[0];
    const n = Math.min(d.ramp.ovensMax, d.ramp.ovens + Math.floor(o.level / d.ramp.ovensEvery));
    const brioche = d.breads.find(b => b.id === 'brioche');
    /** The baking gauge, pale to dark, its golden window and heart, the needle at `t`. */
    function gauge(gx, gy, gw, t) {
      const from = tune.bakery_gold_from, to = tune.bakery_gold_to, mid = (from + to) / 2, w = to - from;
      ctx.fillStyle = C.ink; ctx.fillRect(gx - 2, gy - 2, gw + 4, 18);
      ctx.fillStyle = TONES[0]; ctx.fillRect(gx, gy, gw * from, 14);
      ctx.fillStyle = '#58b83a'; ctx.fillRect(gx + gw * from, gy, gw * w, 14);
      ctx.fillStyle = C.gold; ctx.fillRect(gx + gw * (mid - w * tune.bakery_perfect / 2), gy, Math.max(2, gw * w * tune.bakery_perfect), 14);
      ctx.fillStyle = TONES[2]; ctx.fillRect(gx + gw * to, gy, gw * (1 - to), 14);
      const nx = gx + gw * t; ctx.fillStyle = C.ink; ctx.fillRect(nx - 3, gy - 6, 6, 26); ctx.fillStyle = '#ffffff'; ctx.fillRect(nx - 1, gy - 4, 2, 22);
    }
    const cards = [
      { text: d.steps[0], keys: [], draw(x, y, w, h) { // the same loaf four times: pale, golden, dark, burnt
        const step = Math.min(64, (w - 16) / 4), x0 = x + w / 2 - 2 * step;
        for (let t = 0; t < 4; t++) { Venue.pix(loaf(miche, t), x0 + t * step + (step - 54) / 2, y + h / 2 - 22, 3); if (t < 3) arrow(x0 + t * step + step - 12, y + h / 2 + 26, 24, C.dim); }
        UI.label(tr('bk_golden', { n: P.golden }), x0 + step * 1.5, y + h / 2 - 40, 13, C.good);
      } },
      { text: d.steps[1], keys: [n > 1 ? `1–${n}` : '1', KEY.click()], draw(x, y, w, h) {
        const ox = x + w / 2 - 110, oy = y + h / 2 - 44;
        Venue.pix(oven(), ox, oy, 3);
        ctx.fillStyle = 'rgba(255,140,40,0.3)'; ctx.fillRect(ox + 15, oy + 27, 60, 36);
        Venue.pix(loaf(miche, 1), ox + 18, oy + 34, 3);
        keyBox(ox - 4, oy - 4, 1);
        gauge(ox + 104, oy + 30, 116, (tune.bakery_gold_from + tune.bakery_gold_to) / 2);
        mark(true, ox + 162, oy + 78);
      } },
      { text: fill(d.steps[2], { n: tune.bakery_strikes }), keys: [], draw(x, y, w, h) {
        const k = tune.bakery_strikes, step = Math.min(58, (w - 20) / k), x0 = x + w / 2 - k * step / 2;
        for (let i = 0; i < k; i++) Venue.pix(loaf(miche, 3), x0 + i * step + (step - 54) / 2, y + h / 2 - 30, 3);
        mark(false, x + w / 2, y + h / 2 + 34);
      } },
    ];
    if (brioche && o.level >= (brioche.from || 0) && brioche.from) cards.push({ fresh: true, text: Minigames.kit.news(d, 'brioche'), keys: [], draw(x, y, w, h) {
      Venue.pix(loaf(brioche, 1), x + w / 2 - 36, y + h / 2 - 30, 4);
    } });
    const tone = (t, img) => ({ text: fill(d.legend[t], P), pic: img });
    return { cards, legend: [tone(0, () => loaf(miche, 0)), tone(1, () => loaf(miche, 1)), { text: fill(d.legend[2], P), color: C.gold }, tone(3, () => loaf(miche, 2))] };
  }

  Minigames.add('bakery', bakery, howto);
})();
