// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The three mini-games the keepers offer (js/venue.js hosts them: the place, the countdown, the
// result and the rewards). Each is half a minute long, played with the mouse or the keyboard, and
// gets harder with the player's winning streak at that place (`level`).
//   café    « Le coup de feu »: customers order, their bubble closes, serve the right cups in order
//   market  « Marchandage »: stop the needle in the zone, then push for more or shake hands
//   forge   « Battre le fer »: strike as the marks reach the anvil, keep the heat in its band
// A game is { update(dt, input), draw(), auto(dt, bot), score, done, lost, why }. `input` is
// { act, alt }: Space or a click on nothing, and a right click; the keys are read with pressed().
// Its content is in data/venues.js, its knobs in config.js. Nothing here is saved.
'use strict';

const Minigames = (() => {
  const C = UI.C, PANEL = { x: 12, y: 560, w: 1256, h: 150 }, BLUE = '#8fd0ff';
  const sprites = {};
  /** A small picture painted once: fn(R) draws it with R(x, y, w, h, colour); it gets the dark outline. */
  function sprite(key, w, h, fn) {
    if (!sprites[key]) {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      fn((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); });
      Venue.outline(cv); sprites[key] = cv;
    }
    return sprites[key];
  }

  // ---- What every game shows: its name and clock top left, its score and the next medal top right ----
  function head(d, left, total) {
    UI.plate(12, 12, 330, 60);
    UI.label(d.title, 30, 33, 18, C.gold, 'left');
    text(Math.max(0, Math.ceil(left)) + ' s', 324, 33, 15, left < 8 ? C.bad : C.text, 'right', true);
    UI.bar(28, 48, 298, 12, left / total, left < 8 ? C.bad : C.accent);
  }
  function scoreBox(d, label, score) {
    const x = 938, w = 330;
    let m = 0;
    d.medals.forEach((t, i) => { if (score >= t) m = i + 1; });
    const from = m ? d.medals[m - 1] : 0, to = d.medals[Math.min(2, m)];
    UI.plate(x, 12, w, 60);
    UI.label(label, x + 18, 33, 15, C.dim, 'left'); UI.label(String(score), x + w - 58, 32, 22, C.gold, 'right');
    Venue.pix(Venue.medalImg(m), x + w - 48, 18, 2);
    UI.bar(x + 16, 48, w - 148, 12, m >= 3 ? 1 : (score - from) / (to - from), ['#c9762e', '#cfd6e6', C.gold, C.gold][m]);
    if (m < 3) text(tr('vn_medal_' + (m + 1)) + ' ' + to, x + w - 58, 54, 11, C.text, 'right', true);
  }
  /** Words that rise and fade: { x, y, str, color, size, t }. */
  function stepPops(list, dt) { for (let i = list.length - 1; i >= 0; i--) { list[i].t += dt; if (list[i].t > 1) list.splice(i, 1); } }
  function drawPops(list) {
    for (const p of list) {
      ctx.globalAlpha = clamp((1 - p.t) * 3, 0, 1);
      text(p.str, p.x + 2, p.y - p.t * 46 + 2, p.size || 22, '#120e1c', 'center', true); text(p.str, p.x, p.y - p.t * 46, p.size || 22, p.color, 'center', true);
      ctx.globalAlpha = 1;
    }
  }
  const moodColor = f => f > 0.5 ? C.good : f > 0.25 ? C.accent : C.bad;

  // =====================================================================================
  // Le coup de feu (café)
  // =====================================================================================
  /** A drink in its cup, 16x16; `null`: a cup whose order must be remembered. */
  function cup(dr) {
    if (!dr) return sprite('cup:?', 16, 16, R => { R(3, 5, 10, 7, '#6a5240'); R(4, 12, 8, 1, '#4a3828'); R(13, 8, 2, 1, '#6a5240'); R(14, 9, 1, 2, '#6a5240'); R(13, 11, 2, 1, '#6a5240'); R(1, 13, 14, 1, '#6a5240'); R(3, 14, 10, 1, '#4a3828'); });
    return sprite('cup:' + dr.id, 16, 16, R => {
      const iv = '#f3ecd2', ivD = '#c9bf9c';
      if (dr.shape === 'glass') {
        R(4, 2, 8, 12, '#d8f0ff'); R(5, 5, 6, 8, dr.liquid); R(4, 2, 8, 1, '#ffffff'); R(5, 3, 1, 10, '#ffffff'); R(4, 14, 8, 1, '#9fc0d8');
        if (dr.dot) { R(7, 8, 3, 1, dr.dot); R(9, 7, 1, 1, dr.dot); R(7, 9, 1, 1, dr.dot); }
      } else if (dr.shape === 'mug') {
        R(3, 5, 10, 9, iv); R(3, 9, 10, 2, '#ea3b4a'); R(4, 14, 8, 1, ivD); R(13, 6, 2, 1, iv); R(14, 7, 1, 4, iv); R(13, 11, 2, 1, iv);
        R(4, 2, 8, 1, '#ffffff'); R(3, 3, 10, 2, dr.liquid);
        if (dr.foam) { R(5, 1, 6, 3, dr.foam); R(7, 0, 2, 1, dr.foam); }
        if (dr.dot) { R(6, 2, 1, 1, dr.dot); R(9, 1, 1, 1, dr.dot); }
      } else {
        R(3, 7, 10, 5, iv); R(4, 12, 8, 1, ivD); R(13, 8, 2, 1, iv); R(14, 9, 1, 2, iv); R(13, 11, 2, 1, iv); R(1, 13, 14, 1, iv); R(3, 14, 10, 1, ivD);
        R(4, 4, 8, 1, '#ffffff'); R(3, 5, 10, 2, dr.liquid);
        if (dr.foam) { R(5, 5, 6, 1, dr.foam); R(6, 6, 3, 1, dr.foam); }
        if (dr.dot) R(7, 5, 2, 2, dr.dot);
      }
    });
  }
  function cafe(o) {
    const d = o.d, L = o.level, R = d.ramp, total = tune.cafe_time, n = Math.min(d.drinks.length, R.first + Math.floor(L / R.drinksEvery));
    const g = { score: 0, done: false, lost: false, why: '', t: 0, queue: [], out: [], gone: 0, served: 0, arrive: 0, pops: [], lit: -1, litT: 0, litBad: false, bot: 0.6, botN: 0 };
    const prog = () => clamp(g.t / total, 0, 1);
    const cupsNow = () => Math.min(R.cupsMax, R.cups + Math.floor(L / R.cupsEvery) + (g.t > total / 2 ? 1 : 0));
    const patience = () => Math.max(tune.cafe_patience_min, tune.cafe_patience * (1 - R.patience * L) * (1 - 0.3 * prog()));
    const showFor = c => Math.max(tune.cafe_show_min, tune.cafe_show - R.show * L) + 0.3 * Math.max(0, c.order.length - 3);
    const pop = (x, y, str, color, size) => g.pops.push({ x, y, str, color, size, t: 0 });
    /** Someone joins the queue, with an order and the patience of the moment. */
    function guest() {
      const free = d.guests.filter(f => !g.queue.some(c => c.face === f)), face = free[Math.floor(rng() * free.length)], order = [];
      for (let i = cupsNow(); i > 0; i--) order.push(Math.floor(rng() * n));
      const p = patience();
      g.queue.push({ face, order, done: 0, p, max: p, seen: 0, again: 0, clean: true, slide: 1 });
    }
    /** A cup is put on the counter for the customer in front: the next of his order, or a wrong one. */
    function serve(i) {
      const c = g.queue[0];
      if (g.done || !c || c.slide > 0) return;
      g.lit = i; g.litT = 0.25;
      if (c.order[c.done] !== i) { // wrong: he loses patience and says it all again
        g.litBad = true; c.p -= tune.cafe_wrong; c.clean = false; c.again = tune.cafe_again; sfx('error'); o.react('cross');
        return;
      }
      g.litBad = false; c.done++; sfx('place');
      if (c.done < c.order.length) return;
      const tip = c.order.length + (c.clean ? 1 : 0) + (c.p > c.max / 2 ? 1 : 0); // a sou a cup, one for no mistake, one for speed
      g.score += tip; g.queue.shift();
      g.out.push({ t: 0, word: d.thanks[g.served % d.thanks.length], good: true }); g.served++;
      if (g.queue[0]) g.queue[0].slide = 1;
      pop(1160, 110, '+' + tip, C.gold, 26); if (c.clean) pop(140, 180, tr('cf_flawless'), C.good, 18);
      sfx('coin'); o.react('glad');
    }
    function update(dt) {
      g.t += dt;
      if (g.litT > 0) g.litT -= dt;
      for (let i = 0; i < n; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) serve(i);
      g.arrive -= dt;
      if (g.queue.length < R.queue && (g.arrive <= 0 || !g.queue.length)) { guest(); g.arrive = tune.cafe_gap * (1 - 0.5 * prog()); } // the queue speeds up; the counter is never empty
      for (let i = g.queue.length - 1; i >= 0; i--) {
        const c = g.queue[i];
        if (i > 0) c.p -= dt * tune.cafe_wait_rate;
        else if (c.slide > 0) c.slide = Math.max(0, c.slide - dt * 4);
        else { c.seen += dt; c.p -= dt; if (c.again > 0) c.again -= dt; }
        if (c.p > 0) continue;
        g.queue.splice(i, 1); g.gone++; // out of patience: he leaves
        g.out.push({ t: 0, word: d.leaves[g.gone % d.leaves.length], good: false });
        if (i === 0 && g.queue[0]) g.queue[0].slide = 1;
        sfx('hurt'); o.react('lost');
      }
      for (let i = g.out.length - 1; i >= 0; i--) { g.out[i].t += dt; if (g.out[i].t > 1.1) g.out.splice(i, 1); }
      stepPops(g.pops, dt);
      if (g.gone >= tune.cafe_strikes) { g.done = true; g.why = tr('cf_end_strikes'); }
      if (g.t >= total) g.done = true;
    }
    /** The game's own hand, for screenshots and checks: a cup every `pace` seconds, a wrong one `err` of the time. */
    function auto(dt, bot) {
      const c = g.queue[0];
      g.bot -= dt;
      if (g.bot > 0 || !c || c.slide > 0) return;
      const x = Math.sin(g.botN++ * 78.233) * 43758.5453, right = c.order[c.done];
      serve(x - Math.floor(x) < bot.err ? (right + 1) % n : right); g.bot = bot.pace;
    }
    function bubble(c) {
      const k = c.order.length, bw = 24 + k * 66, bx = 36, by = 192, open = c.seen < showFor(c) || c.again > 0;
      UI.plate(bx, by, bw, 132);
      ctx.fillStyle = C.lineL; ctx.fillRect(bx + 70, by + 130, 18, 4); ctx.fillRect(bx + 74, by + 134, 10, 4); ctx.fillRect(bx + 77, by + 138, 4, 4);
      UI.label(tr(c.again > 0 ? 'cf_again' : open ? 'cf_order' : 'cf_hidden'), bx + 16, by + 20, 13, open ? C.dim : C.gold, 'left');
      if (open && c.again <= 0) UI.bar(bx + bw - 92, by + 14, 76, 10, 1 - c.seen / showFor(c), C.accent); // how long it stays readable
      for (let i = 0; i < k; i++) {
        const x = bx + 12 + i * 66, dr = d.drinks[c.order[i]], done = i < c.done;
        if (i === c.done) { ctx.fillStyle = 'rgba(255,215,94,0.16)'; ctx.fillRect(x + 2, by + 34, 62, 88); }
        if (done || open) {
          Venue.pix(cup(dr), x + 9, by + 40, 3); text(dr.name, x + 33, by + 106, 12, done ? C.good : C.text, 'center', true);
          if (done) UI.icon('icon.check', x + 54, by + 44, 16);
        } else { Venue.pix(cup(null), x + 9, by + 40, 3); UI.label('?', x + 32, by + 70, 20, C.gold); }
      }
    }
    function draw() {
      head(d, total - g.t, total); scoreBox(d, tr('cf_served'), g.score);
      UI.plate(1118, 78, 150, 34); UI.label(`${tr('cf_lost')} : ${g.gone} / ${tune.cafe_strikes}`, 1193, 96, 14, g.gone ? C.bad : C.dim);
      const c = g.queue[0];
      if (c) { // the customer at the counter, his patience under him, his order over him
        const sx = -280 * c.slide;
        UI.plate(36 + sx, 336, 208, 218);
        Venue.pix(Venue.face(c.face, Math.floor(g.t * tune.portrait_fps)), 44 + sx, 342, 3);
        UI.bar(48 + sx, 534, 184, 14, c.p / c.max, moodColor(c.p / c.max));
        if (c.slide <= 0) bubble(c);
      }
      for (const q of g.out) { ctx.globalAlpha = clamp((1.1 - q.t) * 3, 0, 1); UI.label(q.word, 140, 168 - q.t * 24, 18, q.good ? C.good : C.bad); ctx.globalAlpha = 1; }
      if (g.queue.length > 1) UI.label(tr('cf_queue'), 1000, 330, 14, C.text, 'left');
      for (let i = 1; i < g.queue.length; i++) { // those who wait, right
        const q = g.queue[i], x = 996 + (i - 1) * 90;
        UI.plate(x, 344, 84, 108); Venue.pix(Venue.face(q.face, 0), x + 10, 350, 1); UI.bar(x + 8, 426, 68, 12, q.p / q.max, moodColor(q.p / q.max));
      }
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      const bw = 172, gap = 12, x0 = 640 - (n * bw + (n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) { // the cups to serve: a click, or its number
        const x = x0 + i * (bw + gap), y = 574, dr = d.drinks[i];
        UI.button(x, y, bw, 122, '', () => serve(i));
        if (g.lit === i && g.litT > 0) { ctx.fillStyle = g.litBad ? 'rgba(234,59,74,0.4)' : 'rgba(255,215,94,0.3)'; ctx.fillRect(x + 6, y + 6, bw - 12, 110); }
        Venue.pix(cup(dr), x + bw / 2 - 32, y + 12, 4);
        UI.label(dr.name, x + bw / 2, y + 98, 16, C.text);
        UI.box(x + 10, y + 10, 26, 26, C.ink, C.lineL); UI.label(String(i + 1), x + 23, y + 24, 15, C.gold);
      }
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto });
  }

  // =====================================================================================
  // Marchandage (market)
  // =====================================================================================
  function market(o) {
    const d = o.d, L = o.level, R = d.ramp, total = tune.market_time;
    const g = { score: 0, done: false, lost: false, why: '', t: 0, round: 1, gain: 0, pat: 1, pos: 0, dir: 1, phase: 'swing', hold: 0, zone: null, last: null, lot: d.lots[Math.floor(rng() * d.lots.length)], pops: [], bot: 0 };
    const width = () => Math.max(tune.market_zone_min, tune.market_zone * (1 - R.zone * L) * Math.pow(tune.market_shrink, g.round - 1));
    const speed = () => (tune.market_speed + tune.market_speed_step * (g.round - 1)) * (1 + R.speed * L);
    const pop = (str, color) => g.pops.push({ x: 640, y: 548, str, color, size: 26, t: 0 });
    function newZone() { const w = width(); g.zone = { w, c: w / 2 + 0.05 + rng() * (1 - w - 0.1) }; g.pos = rng() < 0.5 ? 0 : 1; g.dir = g.pos ? -1 : 1; }
    newZone();
    /** The needle is stopped where it is: in the middle of the zone, in the zone, or outside. */
    function stop() {
      if (g.phase !== 'swing') return;
      const off = Math.abs(g.pos - g.zone.c), z = g.zone;
      if (off <= z.w * tune.market_perfect / 2) { g.gain += d.perfect; g.pat = Math.min(1, g.pat + d.relief); g.last = 'perfect'; pop(tr('mk_perfect', { n: d.perfect }), C.gold); sfx('crit'); o.react('glad'); }
      else if (off <= z.w / 2 + tune.market_grace) { g.gain += d.good; g.last = 'good'; pop(tr('mk_good', { n: d.good }), C.good); sfx('coin'); o.react('okay'); }
      else { g.pat -= tune.market_miss; g.last = 'miss'; pop(tr('mk_miss'), C.bad); sfx('error'); o.react('cross'); }
      g.gain = Math.min(d.cap, g.gain); g.score = g.gain;
      g.phase = 'shown'; g.hold = 0.7;
    }
    /** One more round: a smaller zone, a faster needle, and her patience pays for it. */
    function push() {
      if (g.phase !== 'choice') return;
      g.pat -= tune.market_push * (1 + (g.round - 1) / 3) * (1 + R.push * L) * (1 + rng() * 0.5);
      if (g.pat <= 0) { walk(); return; }
      g.round++; newZone(); g.phase = 'swing'; sfx('click'); o.react('pushed');
    }
    function deal(why) {
      if (g.phase === 'deal' || g.phase === 'gone') return;
      g.phase = 'deal'; g.hold = 0.9; g.score = g.gain; g.why = why || ''; sfx('coin');
    }
    /** Pushed once too many: she leaves, and the deal with her. */
    function walk() { g.pat = 0; g.phase = 'gone'; g.hold = 1.7; g.lost = true; g.score = 0; g.why = tr('mk_gone'); sfx('lose'); o.react('cross', d.gone); o.away(); }
    function update(dt, inp) {
      g.t += dt; stepPops(g.pops, dt);
      if (g.phase === 'deal' || g.phase === 'gone') { g.hold -= dt; if (g.hold <= 0) g.done = true; return; }
      if (g.t >= total) { deal(tr('mk_closed')); return; } // the market closes: the deal as it stands
      if (g.phase === 'swing') {
        g.pos += g.dir * speed() * dt;
        if (g.pos >= 1) { g.pos = 2 - g.pos; g.dir = -1; } else if (g.pos <= 0) { g.pos = -g.pos; g.dir = 1; }
        if (inp.act) stop();
      } else if (g.phase === 'shown') {
        g.hold -= dt;
        if (g.hold <= 0) { if (g.pat <= 0) walk(); else g.phase = 'choice'; }
      } else if (g.phase === 'choice') {
        if (pressed('ArrowUp') || pressed('KeyP')) push();
        else if (pressed('Enter') || pressed('NumpadEnter') || pressed('KeyT')) deal();
      }
    }
    /** The game's own hand: stops `err` of the dial off the zone's middle, pushes while she is patient. */
    function auto(dt, bot) {
      if (g.phase === 'swing') { if (Math.abs(g.pos - (g.zone.c + bot.err * Math.sin(g.round * 7.7))) <= speed() * dt) stop(); }
      else if (g.phase === 'choice') { g.bot += dt; if (g.bot > 0.6) { g.bot = 0; if (g.pat > 0.5 && g.gain < 34) push(); else deal(); } }
    }
    function draw() {
      const z = g.zone, choosing = g.phase === 'choice', price = Math.round(g.lot.price * (1 - g.gain / 100));
      head(d, total - g.t, total); scoreBox(d, tr('mk_yours'), g.gain);
      // what is on the table, and her patience
      UI.plate(24, 150, 310, 206);
      UI.label(tr('mk_lot') + ' · ' + tr('mk_round', { n: g.round }), 44, 174, 13, C.dim, 'left');
      UI.icon(DATA.resources[g.lot.res].icon, 62, 214, 32);
      UI.wrap(g.lot.name, 88, 194, 230, 16, C.gold, 20, true);
      ctx.fillStyle = C.lineL; ctx.fillRect(42, 246, 274, 1);
      text(tr('mk_asked'), 44, 270, 14, C.dim, 'left'); text(g.lot.price + ' or', 314, 270, 15, g.gain ? C.dim : C.text, 'right', true);
      if (g.gain) { ctx.fillStyle = C.bad; ctx.fillRect(314 - UI.width(g.lot.price + ' or', 15, true) - 3, 270, UI.width(g.lot.price + ' or', 15, true) + 6, 2); }
      text(tr('mk_yours'), 44, 306, 15, C.text, 'left', true); UI.label(price + ' or', 314, 306, 24, C.gold, 'right');
      text('−' + g.gain + ' %', 314, 334, 14, g.gain ? C.good : C.dim, 'right', true);
      UI.plate(24, 364, 310, 62);
      UI.label(tr('mk_patience'), 42, 384, 13, moodColor(g.pat), 'left'); UI.bar(40, 398, 278, 14, g.pat, moodColor(g.pat));
      // the dial, and the two ways on
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      const cx = 640, cy = 702, r = 112, PI = Math.PI;
      const arc = (a0, a1, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, PI + a0 * PI, PI + a1 * PI); ctx.stroke(); };
      arc(0, 1, C.ink, 36); arc(0.004, 0.996, '#5a3a22', 30);
      arc(clamp(z.c - z.w / 2, 0, 1), clamp(z.c + z.w / 2, 0, 1), '#58b83a', 30);
      arc(z.c - z.w * tune.market_perfect / 2, z.c + z.w * tune.market_perfect / 2, C.gold, 30);
      for (let i = 1; i < 10; i++) { const a = PI + i / 10 * PI; ctx.fillStyle = 'rgba(20,13,8,0.5)'; ctx.fillRect(cx + Math.cos(a) * (r + 12) - 1, cy + Math.sin(a) * (r + 12) - 1, 3, 3); }
      const a = PI + g.pos * PI, nx = cx + Math.cos(a) * (r + 20), ny = cy + Math.sin(a) * (r + 20);
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.strokeStyle = g.phase === 'swing' ? '#f6eedb' : g.last === 'miss' ? C.bad : C.gold; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = C.ink; ctx.fillRect(cx - 12, cy - 12, 24, 14); ctx.fillStyle = '#8f5f1c'; ctx.fillRect(cx - 9, cy - 9, 18, 11);
      text(tr('mk_dear'), cx - r - 34, cy - 10, 13, C.bad, 'right', true); text(tr('mk_cheap'), cx + r + 34, cy - 10, 13, C.good, 'left', true);
      if (g.phase === 'swing') { UI.label(tr('mk_stop'), 250, 620, 17, Math.sin(g.t * 8) > -0.4 ? C.gold : C.text); text(tr('mk_round', { n: g.round }), 250, 652, 13, C.dim, 'center'); }
      else if (g.phase === 'gone') UI.label(tr('mk_gone'), 250, 634, 24, C.bad);
      else if (g.phase === 'deal') UI.label(g.why || tr('mk_deal').split(' (')[0], 250, 634, g.why ? 17 : 24, C.gold);
      else if (g.last) UI.label(tr('mk_' + g.last, { n: d[g.last] }), 250, 634, 22, g.last === 'miss' ? C.bad : g.last === 'perfect' ? C.gold : C.good);
      UI.button(830, 596, 204, 72, tr('mk_push'), push, { disabled: !choosing, size: 16, tip: tr('mk_push_tip') });
      UI.button(1044, 596, 204, 72, tr('mk_deal'), () => deal(), { disabled: !choosing, primary: choosing, size: 16, tip: tr('mk_deal_tip') });
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto });
  }

  // =====================================================================================
  // Battre le fer (forge)
  // =====================================================================================
  const anvil = () => sprite('anvil', 40, 26, R => {
    R(9, 3, 28, 6, PAL.steelD); R(9, 3, 28, 1, PAL.steelL); R(3, 4, 6, 3, PAL.steelD); R(1, 5, 2, 1, PAL.steelD); R(17, 9, 12, 5, '#5a6480'); R(12, 14, 22, 5, PAL.steelD); R(12, 14, 22, 1, PAL.steel);
    R(8, 19, 30, 6, PAL.trunk); R(8, 19, 30, 1, PAL.timberL); R(14, 20, 1, 5, PAL.trunkD); R(27, 20, 1, 5, PAL.trunkD);
  });
  const hammer = () => sprite('hammer', 18, 18, R => { R(8, 6, 2, 11, PAL.plankD); R(8, 6, 1, 11, PAL.plank); R(3, 1, 12, 6, PAL.steelD); R(3, 1, 12, 1, PAL.steelL); R(3, 6, 12, 1, '#5a6480'); });
  const bellows = () => sprite('bellows', 26, 18, R => {
    R(2, 3, 16, 2, PAL.plank); R(2, 13, 16, 2, PAL.plank); R(3, 5, 14, 8, '#8f5229'); R(6, 5, 1, 8, '#5c341c'); R(10, 5, 1, 8, '#5c341c'); R(14, 5, 1, 8, '#5c341c');
    R(18, 7, 6, 4, PAL.steelD); R(18, 7, 6, 1, PAL.steel); R(0, 1, 4, 2, PAL.plankD); R(0, 15, 4, 2, PAL.plankD);
  });
  const heatColor = h => h < 0.3 ? '#7a2a1a' : h < 0.48 ? '#d9461a' : h < 0.72 ? '#ff8a1a' : h < 0.88 ? '#ffd23f' : '#fff6c4';
  function forge(o) {
    const d = o.d, L = o.level, R = d.ramp, total = tune.forge_time, MID = 0.6, TX = 220, TY = 630, X1 = 1236;
    const half = 30 / (tune.forge_bpm + tune.forge_bpm_step * L), bars = d.bars.filter(b => b.tier <= L), beats = [];
    for (let t = 1.6; t < total - 1;) { // the rhythm, drawn bar by bar
      const bar = bars[Math.floor(rng() * bars.length)].bar;
      for (const ch of bar) { if (ch === 'x' && t < total - 0.6) beats.push({ t, res: null }); t += half; }
    }
    const g = { score: 0, done: false, lost: false, why: '', t: 0, beats, pts: 0, heat: MID, chain: 0, sparks: [], pops: [], swing: 0, puff: 0, flash: 0 };
    const band = () => Math.max(0.08, tune.forge_band - R.band * L);
    const word = (str, color) => { g.pops.length = 0; g.pops.push({ x: TX, y: TY - 96, str, color, size: 24, t: 0 }); };
    function burst(k) { for (let i = 0; i < k; i++) { const a = -Math.PI * (0.15 + rng() * 0.7), sp = 180 + rng() * 320; g.sparks.push({ x: TX, y: TY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, c: i % 3 ? PAL.fireL : '#ffffff' }); } }
    function miss() { g.chain = 0; word(tr('fg_miss'), C.bad); sfx('error'); o.react('cross'); }
    /** The hammer comes down: on the mark nearest the anvil, when one is close enough. */
    function strike() {
      if (g.done) return;
      g.swing = 0.12; g.heat = Math.max(0, g.heat - 0.012);
      let best = null, bd = 1e9;
      for (const b of beats) if (!b.res) { const dd = Math.abs(b.t - g.t); if (dd < bd) { bd = dd; best = b; } if (b.t > g.t + 1) break; }
      if (!best || bd > tune.forge_good * 2) { g.chain = 0; word(tr('fg_early'), C.dim); sfx('arrow'); return; } // a blow in the air: no mark is spent
      if (bd > tune.forge_good) { best.res = 'miss'; miss(); return; }
      const kind = bd <= tune.forge_perfect ? 'perfect' : 'good', off = g.heat - MID, ok = Math.abs(off) <= band();
      best.res = kind;
      g.pts += d[kind] * (ok ? 1 : tune.forge_cold_mult) * (ok && g.chain >= tune.forge_chain ? 1.1 : 1);
      if (!ok) { g.chain = 0; word(tr(off < 0 ? 'fg_cold' : 'fg_hot'), off < 0 ? BLUE : C.bad); sfx('hit'); o.react('cross', off < 0 ? d.cold : d.hot); return; }
      g.chain++; g.flash = 0.12;
      word(tr('fg_' + kind), kind === 'perfect' ? C.gold : C.text); sfx(kind === 'perfect' ? 'forge' : 'hit');
      if (kind === 'perfect' || g.chain >= tune.forge_chain) burst(kind === 'perfect' ? 6 + Math.min(26, g.chain * 2) : 5);
      if (g.chain === tune.forge_chain || (g.chain > tune.forge_chain && g.chain % 8 === 0)) o.react('chain');
      else if (kind === 'perfect' && g.chain % 3 === 0) o.react('glad');
    }
    function pump() { if (g.done) return; g.heat = Math.min(1, g.heat + tune.forge_pump); g.puff = 0.2; sfx('guard'); }
    function update(dt, inp) {
      g.t += dt;
      g.heat = Math.max(0, g.heat - tune.forge_cool * (1 + R.cool * L) * dt);
      if (inp.alt || pressed('KeyB') || pressed('ArrowUp')) pump();
      if (inp.act || pressed('ArrowDown') || pressed('KeyJ')) strike();
      for (const b of beats) { if (b.t > g.t) break; if (!b.res && g.t - b.t > tune.forge_good) { b.res = 'miss'; miss(); } }
      for (const k of ['swing', 'puff', 'flash']) if (g[k] > 0) g[k] -= dt;
      for (let i = g.sparks.length - 1; i >= 0; i--) { const s = g.sparks[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 900 * dt; if (s.t > 0.7) g.sparks.splice(i, 1); }
      stepPops(g.pops, dt);
      g.score = Math.min(100, Math.round(100 * g.pts / beats.length));
      if (g.t >= total) g.done = true;
    }
    /** The game's own hand: each blow `err` seconds off at most, the bellows when the blade cools. */
    function auto(dt, bot) {
      const i = beats.findIndex(b => !b.res);
      if (i >= 0 && g.t >= beats[i].t + bot.err * Math.sin(i * 12.9898) - dt / 2) strike();
      if (g.heat < MID - band() * 0.4) pump();
    }
    function draw() {
      const lead = tune.forge_lead, len = X1 - TX, bd = band(), off = g.heat - MID;
      head(d, total - g.t, total); scoreBox(d, tr('fg_quality'), g.score);
      // the heat and the bellows, right
      UI.plate(1040, 236, 228, 314);
      UI.label(tr('fg_heat'), 1058, 260, 16, C.gold, 'left');
      const gx = 1212, gy = 282, gw = 34, gh = 250, yOf = h => gy + gh - h * gh;
      ctx.fillStyle = C.ink; ctx.fillRect(gx - 3, gy - 3, gw + 6, gh + 6); ctx.fillStyle = '#2a1a10'; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = 'rgba(155,232,95,0.3)'; ctx.fillRect(gx, yOf(MID + bd), gw, bd * 2 * gh);
      for (let y = 0; y < g.heat * gh; y += 5) { ctx.fillStyle = heatColor(y / gh); ctx.fillRect(gx + 4, gy + gh - y - 5, gw - 8, 5); }
      ctx.fillStyle = C.good; ctx.fillRect(gx - 8, yOf(MID + bd) - 2, gw + 16, 3); ctx.fillRect(gx - 8, yOf(MID - bd), gw + 16, 3); ctx.fillRect(gx - 8, yOf(MID + bd), 3, bd * 2 * gh);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(gx - 12, yOf(g.heat) - 2, gw + 24, 4); ctx.fillStyle = C.ink; ctx.fillRect(gx - 12, yOf(g.heat) + 2, gw + 24, 1);
      const cold = off < -bd, hot = off > bd;
      UI.wrap(tr(cold ? 'fg_cold' : hot ? 'fg_hot' : 'fg_ok'), 1058, 284, 136, 16, cold ? BLUE : hot ? C.bad : C.good, 20, true);
      UI.button(1056, 408, 140, 124, '', pump, { tip: tr('fg_bellows_tip'), primary: cold });
      Venue.pix(bellows(), 1056 + 70 - 39 - (g.puff > 0 ? 3 : 0), 424, 3);
      UI.label(tr('fg_bellows'), 1126, 496, 15, C.text); text('B · ↑ · clic droit', 1126, 516, 11, C.dim, 'center');
      // the rail the marks come down, the anvil and the blade
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.fillStyle = C.ink; ctx.fillRect(TX - 60, TY - 5, len + 60, 10); ctx.fillStyle = '#5a3a22'; ctx.fillRect(TX - 58, TY - 3, len + 56, 6);
      const gw2 = tune.forge_good / lead * len, pw = tune.forge_perfect / lead * len;
      ctx.fillStyle = 'rgba(255,215,94,0.2)'; ctx.fillRect(TX - gw2, TY - 26, gw2 * 2, 52); ctx.fillStyle = 'rgba(255,215,94,0.4)'; ctx.fillRect(TX - pw, TY - 26, pw * 2, 52);
      Venue.pix(anvil(), TX - 46, TY + 10, 2);
      ctx.fillStyle = C.ink; ctx.fillRect(TX - 52, TY + 4, 96, 12); ctx.fillStyle = heatColor(g.heat); ctx.fillRect(TX - 50, TY + 6, 92, 8); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(TX - 50, TY + 6, 92, 2);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(TX, TY, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = g.flash > 0 ? '#ffffff' : C.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(TX, TY, 22, 0, Math.PI * 2); ctx.stroke();
      let first = true;
      for (const b of beats) {
        const x = TX + (b.t - g.t) / lead * len;
        if (x > X1) break;
        if (x < TX - 56 || (b.res && b.res !== 'miss')) continue;
        ctx.save(); ctx.translate(x, TY); ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = b.res ? 0.4 : 1;
        ctx.fillStyle = C.ink; ctx.fillRect(-11, -11, 22, 22); ctx.fillStyle = b.res ? '#8a8078' : first ? C.gold : '#f6eedb'; ctx.fillRect(-8, -8, 16, 16);
        ctx.restore(); ctx.globalAlpha = 1;
        if (!b.res) first = false;
      }
      Venue.pix(hammer(), TX - 6, g.swing > 0 ? TY - 54 : TY - 78, 3);
      const hot2 = g.chain >= tune.forge_chain;
      UI.label(tr('fg_chain', { n: g.chain }), 96, 596, hot2 ? 20 : 15, hot2 ? C.gold : C.dim);
      text(tr('fg_strike'), 30, 676, 12, C.text, 'left'); text(tr('fg_pump'), 30, 694, 12, C.text, 'left');
      for (const s of g.sparks) { ctx.globalAlpha = clamp(1 - s.t / 0.7, 0, 1); ctx.fillStyle = s.c; ctx.fillRect(snap(s.x - 2), snap(s.y - 2), 5, 5); }
      ctx.globalAlpha = 1;
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto });
  }

  const MAKE = { cafe, market, forge };
  /** A new game of a place: o = { level, d (its entry in data/venues.js), react(kind, word), away() } from js/venue.js. */
  function make(id, o) { return MAKE[id](o); }
  return { make };
})();
