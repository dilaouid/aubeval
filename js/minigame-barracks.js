// PROTOTYPE - NOT FOR PRODUCTION
// The barracks' mini-game, « Parade ! » (js/venue.js hosts it, js/minigames.js registers it).
// The captain calls a side (up, right, down, left) and a recruit's practice blow comes from there
// once a ring has closed. An arrow key or a click on that side's button raises the shield: the right
// side before the blow lands is worth 2, in the first part of the wait (« Vif ! ») 3. The wrong side,
// or too late, is a hit; at config barracks_hits the drill is lost. Each win in a row shortens the
// wait; from a few wins some blows are feints (the side called changes halfway, and whoever already
// parried is hit), then some are double (a second side straight after the first).
// The rules (update, parry, auto) never draw: only draw() does.
// Content in data/venues.js (venues.barracks), knobs in config.js (barracks_*). Nothing here is saved.
'use strict';

(() => {
  const { PANEL, sprite, head, scoreBox, stepPops, drawPops } = Minigames.kit;
  const KEYS = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };
  const DIR = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const FEINT_AT = 0.5; // a feint turns halfway through the wait (the design's « mi-délai »)
  const SHOWN = 0.35;   // seconds the shield stays up, and a parry's or a hit's flash shows
  const CX = 300, CY = 318; // the middle of the drill ground: the hero; the keeper stands in the screen's middle

  /** The hero from the front, 16x22: helmet, mail, tabard. */
  const hero = () => sprite('bq:hero', 16, 22, R => {
    R(4, 0, 8, 3, '#8a94a8'); R(3, 3, 10, 2, '#6a7488'); R(5, 5, 6, 5, '#e8b890'); R(6, 7, 1, 1, '#2a1a10'); R(9, 7, 1, 1, '#2a1a10');
    R(3, 10, 10, 8, '#8a94a8'); R(5, 10, 6, 8, '#2f5fa8'); R(7, 11, 2, 6, '#e8c050');
    R(1, 11, 2, 6, '#6a7488'); R(13, 11, 2, 6, '#6a7488'); R(4, 18, 3, 4, '#4a3a30'); R(9, 18, 3, 4, '#4a3a30');
  });
  /** The shield, 12x14: blue with a gold rim and boss. */
  const shield = () => sprite('bq:shield', 12, 14, R => {
    R(0, 0, 12, 9, '#e8c050'); R(1, 9, 10, 2, '#e8c050'); R(3, 11, 6, 2, '#e8c050'); R(5, 13, 2, 1, '#e8c050');
    R(1, 1, 10, 8, '#2f5fa8'); R(2, 9, 8, 2, '#2f5fa8'); R(4, 11, 4, 1, '#2f5fa8'); R(1, 1, 10, 1, '#5a8ad8');
    R(5, 4, 2, 3, '#e8c050');
  });
  /** A recruit in a leather jerkin with a wooden practice sword, 14x20. */
  const recruit = () => sprite('bq:recruit', 14, 20, R => {
    R(3, 0, 7, 3, '#6a4a2a'); R(3, 3, 7, 5, '#e8b890'); R(4, 5, 1, 1, '#2a1a10'); R(8, 5, 1, 1, '#2a1a10');
    R(2, 8, 9, 7, '#8a5a30'); R(2, 14, 9, 1, '#5a3a1a'); R(3, 15, 3, 5, '#4a3a30'); R(7, 15, 3, 5, '#4a3a30');
    R(11, 1, 2, 11, '#c89a5a'); R(10, 10, 4, 1, '#7a5a30'); R(11, 12, 2, 3, '#5a3a1a');
  });

  function barracks(o) {
    const d = o.d, L = o.level, R = d.ramp, P = d.points, total = tune.barracks_time;
    const SIDES = d.sides.map(s => s.id), sideOf = id => d.sides.find(s => s.id === id);
    /** Seconds between a side called and its blow landing: shorter with each win, never under its floor. */
    const lead = Math.max(tune.barracks_lead_min, tune.barracks_lead * (1 - R.lead * L));
    const feints = L >= R.feintFrom, doubles = L >= R.doubleFrom;
    // wait: seconds before the next side is called (the first, a breath after « Partez ! »); then: a double blow's second side, still to come
    const g = { score: 0, done: false, lost: false, why: '', t: 0, hits: 0, parries: 0, blows: 0, feints: 0, blow: null, then: null,
      wait: tune.barracks_gap + 0.6, lead, pops: [], guard: null, flash: null, keys: {}, bot: 0 };
    /** Any side but `side`: a feint's second side, a double blow's second blow. */
    const other = side => SIDES[(SIDES.indexOf(side) + 1 + Math.floor(rng() * (SIDES.length - 1))) % SIDES.length];
    const at = (side, r) => ({ x: CX + DIR[side][0] * r, y: CY + DIR[side][1] * r });
    const pop = (side, str, color) => { const p = at(side, 110); g.pops.push({ x: p.x, y: p.y, str, color, size: 22, t: 0 }); };
    /** The captain calls the side out loud. */
    const call = side => o.react('okay', sideOf(side).shout);

    /** The next blow: a double blow's second side, or a new side, which may be a feint or a double. */
    function strike() {
      if (g.then) { g.blow = { side: g.then, t: 0 }; g.then = null; call(g.blow.side); return; }
      const b = { side: SIDES[Math.floor(rng() * SIDES.length)], t: 0 };
      if (doubles && rng() < tune.barracks_double) b.then = other(b.side);
      else if (feints && rng() < tune.barracks_feint) { b.feint = { at: FEINT_AT, to: other(b.side) }; g.feints++; }
      g.blow = b; g.blows++; call(b.side);
    }
    /**
     * A blow is over. The drill keeps its beat however soon it was parried: the next side is called
     * when this blow would have landed, plus the gap (none before the second side of a double blow).
     */
    function over(b) {
      const left = Math.max(0, 1 - b.t) * lead;
      g.blow = null;
      if (b.then) { g.then = b.then; g.wait = left; } else g.wait = left + tune.barracks_gap;
    }
    /** The blow lands on the hero: `how` is 'late', 'wrong' or 'feinted'. */
    function hit(b, how) {
      g.hits++; g.flash = { side: b.side, ok: false, t: SHOWN };
      pop(b.side, tr('bq_' + how), UI.C.bad); sfx('hurt');
      o.react(how === 'late' ? 'lost' : how === 'wrong' ? 'cross' : 'feinted');
      over(b);
    }
    /** The shield goes up on `side`. Against no blow it costs nothing; against the blow it parries or is beaten. */
    function parry(side) {
      if (g.done || !DIR[side]) return;
      g.guard = { side, t: SHOWN };
      const b = g.blow;
      if (!b) return;
      if (b.feint && b.side !== b.feint.to) { hit(b, 'feinted'); return; } // the side first called: the feint has bitten
      if (side !== b.side) { hit(b, 'wrong'); return; }
      const quick = b.t <= tune.barracks_quick;
      g.parries++; g.score += quick ? P.quick : P.good; g.flash = { side, ok: true, t: SHOWN };
      if (quick) { pop(side, tr('bq_quick', { n: P.quick }), UI.C.gold); sfx('crit'); o.react('glad'); }
      else { pop(side, tr('bq_good', { n: P.good }), UI.C.good); sfx('hit'); }
      over(b);
    }
    function update(dt) {
      g.t += dt;
      // an arrow counts when it goes down: one held down parries once, and not the blow after
      for (const side of SIDES) { const down = !!pressed(KEYS[side]); if (down && !g.keys[side]) parry(side); g.keys[side] = down; }
      if (g.blow) {
        const b = g.blow;
        b.t += dt / lead;
        if (b.feint && b.side !== b.feint.to && b.t >= b.feint.at) { b.side = b.feint.to; call(b.side); }
        if (b.t >= 1) hit(b, 'late');
      } else if (!g.done) {
        g.wait -= dt;
        if (g.wait <= 0 && g.t + lead <= total) strike(); // no blow called that could not land before the end
      }
      if (g.guard && (g.guard.t -= dt) <= 0) g.guard = null;
      if (g.flash && (g.flash.t -= dt) <= 0) g.flash = null;
      stepPops(g.pops, dt);
      if (g.hits >= tune.barracks_hits) { g.done = true; g.lost = true; g.why = tr('bq_end_hits'); }
      if (g.t >= total) g.done = true;
    }
    /** A number in 0..1 that stays the same for the n-th blow: whether the game's own hand slips on it. */
    const roll = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    /**
     * The game's own hand: it waits a feint out, then parries in the middle of the quick part of the
     * wait (at once after a feint); on `err` of the blows it raises the shield on the opposite side;
     * a parry every `pace` seconds at most.
     */
    function auto(dt, bot) {
      g.bot -= dt;
      const b = g.blow;
      if (g.bot > 0 || !b || g.done) return;
      if (b.feint && b.side !== b.feint.to) return;
      if (!b.feint && b.t < tune.barracks_quick / 2) return;
      const i = SIDES.indexOf(b.side), slip = roll(g.parries + g.hits) < (bot.err || 0); // blows over so far: one number per blow
      parry(slip ? SIDES[(i + 2) % SIDES.length] : b.side);
      g.bot = bot.pace;
    }

    function draw() {
      const C = UI.C, b = g.blow;
      head(d, total - g.t, total); scoreBox(d, tr('bq_score'), g.score);
      UI.plate(1118, 78, 150, 34); UI.label(`${tr('bq_hits_n')}${tr('colon')}${g.hits} / ${tune.barracks_hits}`, 1193, 96, 14, g.hits ? C.bad : C.dim);
      // the drill ground: a ring of trodden earth, the four sides named round it
      ctx.fillStyle = 'rgba(40,28,18,0.55)'; ctx.beginPath(); ctx.arc(CX, CY, 196, 0, Math.PI * 2); ctx.fill();
      for (const s of d.sides) { const p = at(s.id, 222); text(s.name, p.x, p.y + 5, 15, b && b.side === s.id ? C.gold : C.dim, 'center', true); }
      if (b) { // the recruit comes in from the side called, and the ring closes where his blow lands
        const r = recruit(), near = at(b.side, 100 + 70 * (1 - b.t)), mark = at(b.side, 64);
        Venue.pix(r, near.x - r.width * 3 / 2, near.y - r.height * 3 / 2, 3);
        ctx.lineWidth = 4; ctx.strokeStyle = b.t <= tune.barracks_quick ? C.gold : '#ffffff';
        ctx.beginPath(); ctx.arc(mark.x, mark.y, 14 + 58 * (1 - b.t), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.bad; ctx.beginPath(); ctx.arc(mark.x, mark.y, 8, 0, Math.PI * 2); ctx.fill();
      }
      const h = hero(), sh = shield();
      if (g.flash && !g.flash.ok) { ctx.fillStyle = 'rgba(220,40,40,' + (0.5 * g.flash.t / SHOWN) + ')'; ctx.fillRect(CX - 44, CY - 56, 88, 112); }
      Venue.pix(h, CX - h.width * 2, CY - h.height * 2, 4);
      const gp = g.guard ? at(g.guard.side, 50) : { x: CX + 10, y: CY + 14 }; // raised on a side, or held low in front
      Venue.pix(sh, gp.x - sh.width * 2, gp.y - sh.height * 2, 4);
      if (g.flash && g.flash.ok) { const p = at(g.flash.side, 64), k = 1 - g.flash.t / SHOWN; ctx.fillStyle = '#fff6c0'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(p.x + Math.cos(a) * (12 + 26 * k) - 3, p.y + Math.sin(a) * (12 + 26 * k) - 3, 6, 6); } }
      text(tr('bq_keys'), 640, 546, 13, C.text, 'center', true);
      UI.panel(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      // the four sides as the arrow keys lie on a keyboard: up above, left, down and right below
      const bw = 156, bh = 62, x0 = 640 - bw / 2, place = { up: [x0, 566], left: [x0 - bw - 8, 636], down: [x0, 636], right: [x0 + bw + 8, 636] };
      for (const s of d.sides) { const [x, y] = place[s.id]; UI.button(x, y, bw, bh, s.arrow + ' ' + s.name, () => parry(s.id), { size: 17, on: !!b && b.side === s.id }); }
      drawPops(g.pops);
    }
    return Object.assign(g, { update, draw, auto, parry });
  }

  Minigames.add('barracks', barracks);
})();
