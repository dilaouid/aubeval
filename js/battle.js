// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The turn-based battle, played with the village's cards ("La main du village").
//   The hero's turn: he draws a hand from his deck (js/cards.js: one card per kind of building
//   that stands, plus his own), and plays what his souffle pays for, on the marked enemy.
//   The enemies' turn: each does what it announced over its head. Each blow closes a ring on the
//   hero: Space (or a click) as it touches the gold circle parries it; dead on, the parry is
//   perfect and he strikes back.
// Garde absorbs damage until his next turn. A lost battle can be retried at once (a duel with a
// siege's warlord cannot: opts.once). The village keeps producing while the hero fights.
'use strict';

const Battle = (() => {
  const E = DATA.enemies;
  let b = null; // the battle in progress; never saved: closing the game mid-fight returns to the village
  const BG_UP = 56; // the backdrop is drawn this much higher, so its road shows above the hand
  const HERO_AT = { x: 300, y: 462 };
  const SPOTS = { 1: [{ x: 940, y: 466 }], 2: [{ x: 840, y: 446 }, { x: 1050, y: 470 }], 3: [{ x: 770, y: 440 }, { x: 940, y: 472 }, { x: 1100, y: 438 }] };
  const CALLED = [{ x: 730, y: 474 }, { x: 1140, y: 456 }]; // where a summoned goblin stands
  const HAND = { x0: 252, x1: 1028, y: 514, w: 148, h: 196 };
  const RING = 34, RING_FAR = 110; // the parry ring: its radius at the impact, and how much wider it starts
  const BLUE = '#8fd0ff', HEX = '#c58cff';
  const alive = () => b.foes.filter(f => f.alive);
  const whole = v => Math.max(1, Math.round(v));
  const armor = def => tune.armor_factor / (tune.armor_factor + Math.max(0, def));
  /** The hero's numbers as they are this instant, for the cards' text and their blows. */
  const heroNow = () => ({ atk: b.hero.atk * (b.hero.buff ? b.hero.buff.atk : 1), def: b.hero.def, max: b.hero.max });

  function mkFoe(id, pos, scale) {
    const d = E[id], s = d.battle, hp = Math.round(s.hp * scale * tune.enemy_hp_scale);
    const lead = s.pattern === 'boss' || !!d.warlord; // a chief: hurt, he whistles for help once, then enrages
    return { id, name: d.name, sprite: d.sprite, alt: d.alt, icon: d.icon, pos, hp, max: hp, ghost: hp, atk: s.atk * scale * tune.enemy_atk_scale, def: s.def,
      pattern: s.pattern, lead, call: lead ? s.call || 'gobelin' : null, n: 0, intent: 'hit', alive: true, shred: 0, stun: 0, weak: 0, flash: 0, lunge: 0, reach: 0, dying: 0,
      xp: Math.round(s.xp * scale), gold: Math.round(s.gold * scale) };
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /**
   * Starts a battle against enemy ids (data/enemies.js), three at most.
   * opts: { title, boss, scale (enemy strength), reward {xp, gold, res}, hint, onWin(),
   *         once (lost, it cannot be tried again: a duel), onLose(), loseText (said instead of the usual words) }
   */
  function start(enemies, opts) {
    const st = Hero.stats(), scale = opts.scale || 1, spots = SPOTS[Math.min(3, enemies.length)], deck = Cards.deck();
    b = {
      opts, enemies: enemies.slice(0, 3), phase: 'intro', timer: 0.7, t: 0, round: 0, shake: 0, help: false,
      hero: { isHero: true, name: heroName(), pos: HERO_AT, hp: st.hp, max: st.hp, ghost: st.hp, atk: st.atk, def: st.def, // st.atk already carries the forge's gift (Hero.stats, Venue.buff('atk'))
        block: 0, thorns: 0, buff: null, bless: false, wide: false, ally: null, echo: false, flash: 0, lunge: 0, reach: 0 },
      foes: enemies.slice(0, 3).map((id, i) => mkFoe(id, spots[i], scale)),
      draw: shuffle(deck.slice()), hand: [], discard: [], gone: [], energy: 0, target: 0,
      pays: [...new Set(deck.flatMap(k => Object.keys(k.c.pay || {})))], // the village stocks this deck can spend
      queue: [], blows: [], blow: null, pops: [], msg: opts.title || '', tally: null, perfect: 0,
    };
    b.foes.forEach(planIntent);
    scene = 'battle';
  }

  // ---- How each enemy kind fights ----
  /** The enemy's next step in its own routine. What it will really do is read from it when asked (intentOf). */
  function planIntent(f) {
    const seq = { double: ['double'], charge: ['hit', 'windup', 'heavy'], support: ['support'], boss: ['hit', 'windup', 'heavy', 'hit'],
      breaker: ['hit', 'sunder', 'windup', 'heavy'], hexer: ['hex', 'hit', 'hex', 'mend'], swift: ['double', 'flurry', 'hit'] }[f.pattern] || ['hit'];
    f.intent = seq[f.n % seq.length];
  }
  /** What the enemy does if it acts now: shown over its head all through the hero's turn, so it never lies. */
  function intentOf(f) {
    if (f.stun > 0) return 'stunned';
    if (f.lead && f.intent === 'hit') {
      if (!f.summoned && f.hp < f.max * 0.6 && alive().length < 3) return 'summon';
      if (!f.enraged && f.hp < f.max * 0.35) return 'enrage';
    }
    if (f.intent === 'mend' && f.hp >= f.max) return 'hit'; // nothing to mend: she strikes
    if (f.intent === 'support') return alive().some(x => x.hp < x.max * 0.6) ? 'heal' : 'hex';
    return f.intent;
  }
  const heavyMult = f => f.lead ? tune.boss_heavy_mult : tune.heavy_mult;
  /** One blow's damage on the hero before Garde and parry, without the random spread. */
  const foeDmg = (f, mult, pure) => whole(f.atk * mult * (f.weak > 0 ? 0.5 : 1) * (pure ? 1 : armor(b.hero.def)));
  /** The words over an enemy's head: { text, color, warn, sum (damage coming this turn), tip }. */
  function intentInfo(f) {
    const C = UI.C, it = intentOf(f);
    if (it === 'stunned') return { text: tr('it_stunned'), color: C.dim, sum: 0, tip: tr('it_stunned_tip') };
    if (it === 'hit') { const d = foeDmg(f, 1); return { text: tr('it_hit', { n: d }), color: C.text, sum: d, tip: tr('it_hit_tip') }; }
    if (it === 'double') { const d = foeDmg(f, 0.6); return { text: tr('it_double', { n: d }), color: C.text, sum: d * 2, tip: tr('it_double_tip') }; }
    if (it === 'windup') return { text: tr('it_windup'), color: C.accent, sum: 0, tip: tr('it_windup_tip') };
    if (it === 'heavy') { const d = foeDmg(f, heavyMult(f)); return { text: tr('it_heavy', { n: d }), color: C.bad, warn: true, sum: d, tip: tr('it_heavy_tip') }; }
    if (it === 'hex') { const d = foeDmg(f, 1, true); return { text: tr('it_hex', { n: d }), color: HEX, sum: d, tip: tr('it_hex_tip') }; }
    if (it === 'heal') return { text: tr('it_heal'), color: C.good, sum: 0, tip: tr('it_heal_tip') };
    if (it === 'sunder') { const d = foeDmg(f, tune.sunder_mult); return { text: tr('it_sunder', { n: d }), color: BLUE, sum: d, tip: tr('it_sunder_tip') }; }
    if (it === 'flurry') { const d = foeDmg(f, tune.flurry_mult); return { text: tr('it_flurry', { n: d }), color: C.text, sum: d * 3, tip: tr('it_flurry_tip') }; }
    if (it === 'mend') return { text: tr('it_mend'), color: C.good, sum: 0, tip: tr('it_mend_tip', { pct: Math.round(tune.mend_share * 100) }) };
    if (it === 'summon' && f.call !== 'gobelin') return { text: tr('it_call', { name: E[f.call].name }), color: C.accent, sum: 0, tip: tr('it_call_tip') };
    if (it === 'summon') return { text: tr('it_summon'), color: C.accent, sum: 0, tip: tr('it_summon_tip') };
    return { text: tr('it_enrage'), color: C.bad, sum: 0, tip: tr('it_enrage_tip') };
  }
  /** The enemy's turn: its blows are queued, each one a ring to parry; anything else happens at once. */
  function foeAct(f) {
    const it = intentOf(f);
    const blow = (mult, o) => b.blows.push(Object.assign({ f, mult, k: f.weak > 0 ? 0.5 : 1, lead: tune.parry_lead, t: 0, res: null }, o));
    b.timer = 0.75;
    if (it === 'stunned') { f.stun--; b.msg = tr('msg_stunned', { name: f.name }); pop(f, tr('it_stunned'), UI.C.dim); }
    else if (it === 'hit') { b.msg = tr('msg_hit', { name: f.name }); blow(1); }
    else if (it === 'double') { b.msg = tr('msg_double', { name: f.name }); blow(0.6); blow(0.6, { lead: tune.parry_lead * 0.55 }); }
    else if (it === 'windup') { b.msg = tr('msg_windup', { name: f.name }); sfx('warn'); pop(f, '!', UI.C.bad, true); }
    else if (it === 'heavy') { b.msg = tr('msg_heavy', { name: f.name }); blow(heavyMult(f), { big: true, lead: tune.parry_lead * 1.5 }); }
    else if (it === 'hex') { b.msg = tr('msg_hex', { name: f.name }); blow(1, { pure: true, lead: tune.parry_lead * 1.2 }); }
    else if (it === 'heal') {
      const weak = alive().filter(x => x.hp < x.max * 0.6).sort((p, q) => p.hp / p.max - q.hp / q.max)[0], n = Math.round(weak.max * 0.3);
      weak.hp = Math.min(weak.max, weak.hp + n);
      b.msg = tr('msg_heal', { name: f.name, ally: weak.name }); pop(weak, '+' + n, UI.C.good); sfx('heal');
    } else if (it === 'sunder') { b.msg = tr('msg_sunder', { name: f.name }); blow(tune.sunder_mult, { breaks: true, lead: tune.parry_lead * 1.2 }); }
    else if (it === 'flurry') { b.msg = tr('msg_flurry', { name: f.name }); blow(tune.flurry_mult); blow(tune.flurry_mult, { lead: tune.parry_lead * 0.55 }); blow(tune.flurry_mult, { lead: tune.parry_lead * 0.55 }); }
    else if (it === 'mend') {
      const n = Math.round(f.max * tune.mend_share);
      f.hp = Math.min(f.max, f.hp + n); b.msg = tr('msg_mend', { name: f.name }); pop(f, '+' + n, UI.C.good); sfx('heal');
    } else if (it === 'summon') {
      f.summoned = true;
      const pos = CALLED.find(p => !alive().some(x => x.pos === p)) || CALLED[0];
      const g = mkFoe(f.call, pos, b.opts.scale || 1); planIntent(g); b.foes.push(g);
      b.msg = f.call === 'gobelin' ? tr('msg_whistle', { name: f.name }) : tr('msg_call', { name: f.name, ally: E[f.call].name }); sfx('horn');
    } else if (it === 'enrage') { f.enraged = true; f.atk *= 1.3; b.msg = tr('msg_enrage', { name: f.name }); sfx('warn'); pop(f, tr('pop_rage'), UI.C.bad, true); }
    if (it !== 'summon' && it !== 'enrage') f.n++; // a stunned enemy loses the step it was on: a terrible blow is gone
    if (f.weak > 0) f.weak--;
    if (b.blows.length) b.timer = 0.3;
    planIntent(f);
  }

  // ---- Blows ----
  function pop(u, str, color, big, wait) {
    const top = u.box ? u.box.y : u.pos.y - 100;
    b.pops.push({ x: u.pos.x, y: top + 24, vx: ((b.pops.length % 3) - 1) * 55, vy: -250, str, color, size: big ? 40 : 25, t: 0, wait: wait || 0 });
  }
  /** Damage on an enemy. o: pierce (armour ignored), crit (may be a critical), big, wait (the number's delay). */
  function hitFoe(f, raw, o = {}) {
    let dmg = raw * (1 + (rng() * 2 - 1) * tune.damage_spread);
    if (!o.pierce) dmg *= armor(f.def - f.shred);
    let crit = false;
    if (o.crit && rng() < tune.crit_chance) { crit = true; dmg *= tune.crit_mult; }
    dmg = whole(dmg);
    f.hp = Math.max(0, f.hp - dmg); f.flash = 0.3;
    pop(f, String(dmg), crit ? UI.C.gold : UI.C.text, crit || o.big, o.wait);
    sfx(crit ? 'crit' : 'hit');
    if (f.hp <= 0) { f.alive = false; f.dying = 0.4; }
  }
  /** An enemy's blow reaches the hero: the parry, then Garde, then his health; thorns and the riposte answer. */
  function land(w) {
    const h = b.hero, f = w.f, C = UI.C, perfect = w.res === 'perfect', good = w.res === 'good';
    let dmg = f.atk * w.mult * w.k * (1 + (rng() * 2 - 1) * tune.damage_spread);
    if (!w.pure) dmg *= armor(h.def);
    dmg = whole(dmg);
    if (perfect) dmg = 0; else if (good) dmg = Math.round(dmg * (1 - tune.parry_good_block));
    let kept = 0;
    if (w.breaks && !perfect && h.block > 0) { h.block = 0; pop(h, tr('pop_sunder'), BLUE); } // the Garde is shattered before the blow lands
    if (!w.pure && dmg > 0 && h.block > 0) { kept = Math.min(h.block, dmg); h.block -= kept; dmg -= kept; }
    if (perfect) { pop(h, tr('parry_perfect'), C.gold, true); sfx('crit'); b.perfect++; }
    else if (good) { pop(h, tr('parry_good'), C.accent); sfx('guard'); }
    if (dmg > 0) { h.hp = Math.max(0, h.hp - dmg); h.flash = 0.3; pop(h, String(dmg), C.bad, w.big, 0.05); sfx('hurt'); if (w.big) b.shake = 0.3; }
    else if (kept > 0) { pop(h, tr('blocked'), BLUE, false, 0.05); sfx('guard'); }
    if (h.thorns > 0 && f.alive) hitFoe(f, h.thorns, { pierce: true, wait: 0.1 });
    if (perfect && f.alive) { h.lunge = 1; hitFoe(f, heroNow().atk * tune.riposte_mult, { crit: true, big: true, wait: 0.15 }); b.msg = tr('msg_riposte', { name: h.name }); }
    if (!f.alive) b.blows = b.blows.filter(x => x.f !== f);
    b.blow = null;
    b.timer = b.blows.length && b.blows[0].f === f ? 0.1 : 0.5;
  }
  /** The blow in the air: the ring closes, the parry is read, and it lands. */
  function flyBlow(dt, parry) {
    const w = b.blow, h = b.hero, wide = h.wide ? 2 : 1, good = tune.parry_good * wide, perf = tune.parry_perfect * wide;
    w.t += dt;
    if (w.auto && !w.res && w.t >= 0) w.res = 'perfect';
    if (parry && !w.res) {
      if (w.t < -good) { w.res = 'early'; pop(h, tr('parry_early'), UI.C.dim); sfx('error'); }
      else w.res = Math.abs(w.t) <= perf ? 'perfect' : 'good';
    }
    // the enemy leans back while the ring closes, then throws itself forward for the last tenth of a second
    w.f.reach = w.t < -0.1 ? -0.3 * clamp((w.t + w.lead) / 0.25, 0, 1) : -0.3 + 1.3 * clamp(1 + w.t / 0.1, 0, 1);
    if ((w.t >= 0 && w.res) || w.t >= good) land(w);
  }

  // ---- The hero's turn: the deck, the hand, the cards ----
  function drawCards(n) {
    for (let i = 0; i < n && b.hand.length < tune.battle_hand_max; i++) {
      if (!b.draw.length) { if (!b.discard.length) return; b.draw = shuffle(b.discard); b.discard = []; }
      const k = b.draw.pop(); k.fresh = 0.25 + i * 0.05; b.hand.push(k);
    }
  }
  function fixTarget() { if (!b.foes[b.target] || !b.foes[b.target].alive) b.target = b.foes.findIndex(f => f.alive); }
  function cycle(dir) {
    const a = alive(); if (!a.length) return;
    const i = a.indexOf(b.foes[b.target]);
    b.target = b.foes.indexOf(a[(i + dir + a.length) % a.length]); sfx('click');
  }
  function beginTurn() {
    const h = b.hero;
    b.round++; h.block = 0; h.thorns = 0; h.wide = false;
    if (h.buff && --h.buff.turns <= 0) h.buff = null;
    b.energy = tune.battle_energy; drawCards(tune.battle_hand); fixTarget();
    b.phase = 'play'; b.msg = b.round === 1 ? tr('battle_hint_play') : tr('battle_turn', { n: b.round });
  }
  /** Why a card cannot be played now, or null. */
  function blocked(k) {
    const c = k.c;
    if (c.cost > b.energy) return tr('no_energy');
    for (const r in c.pay || {}) if (state.res[r] < c.pay[r]) return tr('no_stock', { res: DATA.resources[r].name.toLowerCase() });
    if (c.heal && b.hero.hp >= b.hero.max) return tr('full_health');
    return null;
  }
  /** One card's effect, on the marked enemy when it needs one (data/cards.js names every field). */
  function apply(k) {
    const c = k.c, p = k.pow, h = b.hero, st = heroNow(), tgt = b.foes[b.target], C = UI.C;
    if (c.dmg || c.flat) {
      const raw = c.dmg ? st.atk * c.dmg * p : c.flat * p, o = { pierce: c.pierce, crit: !!c.dmg, big: (c.dmg || 0) >= 1.3 };
      h.lunge = 1;
      if (c.target === 'all') for (const f of alive()) hitFoe(f, raw, o);
      else if (c.target === 'random') for (let i = 0; i < (c.hits || 1); i++) { const a = alive(); if (!a.length) break; hitFoe(a[Math.floor(rng() * a.length)], raw, Object.assign({ wait: i * 0.12 }, o)); }
      else for (let i = 0; i < (c.hits || 1); i++) if (tgt && tgt.alive) hitFoe(tgt, raw, Object.assign({ wait: i * 0.15 }, o));
    }
    if (c.target === 'one' && tgt && tgt.alive) {
      if (c.shred) { const n = whole(c.shred * p); tgt.shred += n; pop(tgt, tr('pop_shred', { n }), C.accent, false, 0.2); }
      if (c.stun) {
        if (E[tgt.id].boss) { tgt.weak = Math.max(tgt.weak, 1); pop(tgt, tr('pop_weak'), C.accent, false, 0.2); }
        else { tgt.stun = 1; pop(tgt, tr('it_stunned'), C.accent, false, 0.2); }
      }
      if (c.weak) { tgt.weak = Math.max(tgt.weak, c.weak); pop(tgt, tr('pop_weak'), C.accent, false, 0.2); }
    }
    if (c.block || c.blockDef) { const n = whole((c.block || 0) * p + (c.blockDef || 0) * st.def); h.block += n; pop(h, tr('pop_block', { n }), BLUE); sfx('guard'); }
    if (c.thorns) h.thorns += whole(c.thorns * p);
    if (c.heal) { const n = whole(h.max * c.heal * p); h.hp = Math.min(h.max, h.hp + n); pop(h, '+' + n, C.good); sfx('heal'); }
    if (c.draw) drawCards(c.draw);
    if (c.energy) { b.energy += c.energy; pop(h, tr('pop_energy', { n: c.energy }), C.gold); sfx('level'); }
    if (c.buff) { h.buff = { atk: c.buff.atk, turns: c.buff.turns }; pop(h, c.name, C.gold); sfx('level'); }
    if (c.bless) { h.bless = true; sfx('heal'); }
    if (c.wide) h.wide = true;
    if (c.ally) { h.ally = { dmg: whole(c.ally.dmg * p), turns: c.ally.turns }; pop(h, tr('pop_ally'), C.good); sfx('unlock'); }
    if (c.echo) { h.echo = true; sfx('unlock'); }
  }
  function play(i) {
    if (b.phase !== 'play') return;
    const k = b.hand[i]; if (!k) return;
    const why = blocked(k);
    if (why) { sfx('error'); b.msg = why; k.nope = 0.3; return; }
    fixTarget();
    b.energy -= k.c.cost;
    for (const r in k.c.pay || {}) state.res[r] -= k.c.pay[r];
    b.hand.splice(i, 1); (k.c.exhaust ? b.gone : b.discard).push(k);
    const twice = b.hero.echo && !k.c.echo;
    if (twice) b.hero.echo = false;
    b.msg = k.c.name + (twice ? ' ×2' : '') + (k.c.target === 'one' && b.foes[b.target] ? tr('colon') + b.foes[b.target].name : '');
    apply(k); if (twice) apply(k);
    if (!k.c.dmg && !k.c.flat) sfx('click');
    if (!alive().length) { b.phase = 'over'; b.timer = 0.7; }
  }
  function endTurn() {
    if (b.phase !== 'play') return;
    const h = b.hero;
    if (h.ally && alive().length) { // the militiaman at his side strikes the marked enemy
      fixTarget(); hitFoe(b.foes[b.target], h.ally.dmg, { wait: 0.05 }); b.msg = tr('msg_ally');
      if (--h.ally.turns <= 0) h.ally = null;
    }
    b.discard.push(...b.hand); b.hand = []; h.echo = false;
    if (!alive().length) { b.phase = 'over'; b.timer = 0.7; return; }
    b.phase = 'foes'; b.queue = alive(); b.blows = []; b.blow = null; b.timer = 0.45;
  }
  function keys() {
    for (let i = 0; i < 9; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) { play(i); return; }
    if (pressed('Enter') || pressed('NumpadEnter') || pressed('KeyE')) endTurn();
    else if (pressed('ArrowRight') || pressed('ArrowDown') || pressed('Tab')) cycle(1);
    else if (pressed('ArrowLeft') || pressed('ArrowUp')) cycle(-1);
  }

  // ---- Endings ----
  function win() {
    const r = b.opts.reward || {}, total = { xp: r.xp || 0, gold: r.gold || 0, res: Object.assign({}, r.res || {}) };
    for (const f of b.foes) { total.xp += f.xp; total.gold += f.gold; }
    const lvl0 = state.hero.lvl, s0 = Hero.stats(), cards0 = Cards.pool().length;
    Quests.grant(total);
    state.counters.battlesWon++;
    if (b.opts.onWin) b.opts.onWin();
    City.event('battle', { boss: !!b.opts.boss }); // once per battle won: the city's orders and the hero's popularity read it
    const s1 = Hero.stats();
    b.tally = { t: 0, xp: total.xp, gold: total.gold, res: total.res, ups: state.hero.lvl - lvl0, hp: s1.hp - s0.hp, atk: s1.atk - s0.atk, def: s1.def - s0.def, cards: Cards.pool().length - cards0 };
    b.phase = 'win'; b.msg = ''; sfx('fanfare'); Save.persist();
  }
  function lose() { b.phase = 'lose'; b.msg = ''; sfx('lose'); if (b.opts.onLose) b.opts.onLose(); }
  function leave() { b = null; scene = 'play'; }
  function retry() { start(b.enemies, b.opts); }

  function update(dt) {
    if (!b) { scene = 'play'; return; }
    const ok = pressed('Enter') || pressed('Space') || pressed('NumpadEnter');
    let parry = pressed('Space');
    for (const c of clicks) if (c.button === 0) { // a click on a button is that button's; anywhere else, while a blow is in the air, it is a parry
      const r = UI.hitAt(c.x, c.y);
      if (r && r.onClick) { r.onClick(); if (!b) return; } else if (b.phase === 'foes') parry = true;
    }
    if (pressed('KeyH')) b.help = !b.help;
    if (b.help) { if (pressed('Escape') || ok) b.help = false; return; } // the rules are open: the battle waits
    b.t += dt;
    if (b.shake > 0) b.shake -= dt;
    for (const u of [b.hero, ...b.foes]) {
      if (u.flash > 0) u.flash -= dt;
      if (u.lunge > 0) u.lunge = Math.max(0, u.lunge - dt / tune.battle_action_time);
      if (u.dying > 0) u.dying -= dt;
      if (u.reach && !(b.blow && b.blow.f === u)) u.reach = u.reach > 0 ? Math.max(0, u.reach - dt * 5) : Math.min(0, u.reach + dt * 5);
      u.ghost = u.ghost > u.hp ? Math.max(u.hp, u.ghost - u.max * dt * 0.5) : u.hp; // the health bar's trailing ghost
    }
    for (const k of b.hand) { if (k.fresh > 0) k.fresh -= dt; if (k.nope > 0) k.nope -= dt; }
    for (let i = b.pops.length - 1; i >= 0; i--) {
      const p = b.pops[i];
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 560 * dt;
      if (p.t > 0.9) b.pops.splice(i, 1);
    }
    if (b.phase === 'intro') { b.timer -= dt; if (b.timer <= 0) beginTurn(); }
    else if (b.phase === 'play') keys();
    else if (b.phase === 'over') { b.timer -= dt; if (b.timer <= 0) win(); }
    else if (b.phase === 'foes') {
      if (b.blow) { flyBlow(dt, parry); return; }
      b.timer -= dt; if (b.timer > 0) return;
      if (b.hero.hp <= 0) { lose(); return; }
      if (!alive().length) { win(); return; }
      if (b.blows.length) { // the next blow leaves: a blessing parries it by itself
        const w = b.blow = b.blows.shift(); w.t = -w.lead;
        if (b.hero.bless) { w.auto = true; b.hero.bless = false; }
        return;
      }
      const f = b.queue.shift();
      if (!f) { beginTurn(); return; }
      if (f.alive) foeAct(f); else b.timer = 0;
    }
    else if (b.phase === 'win') { b.tally.t += dt; if (b.tally.t > 0.5 && ok) leave(); }
    else if (b.phase === 'lose') { if (ok && !b.opts.once) retry(); else if (ok || pressed('Escape')) leave(); }
  }

  // ---- Drawing ----
  function drawUnit(u) {
    const s = Art.get(u.isHero ? Hero.art('battle') : u.alt && !Art.loaded(u.sprite) ? u.alt : u.sprite, u.isHero ? Hero.weaponTier() : 0); // alt: the stand-in while its own image is missing
    const w = s.width * PX, hgt = s.height * PX, side = u.isHero ? 1 : -1;
    const lunge = (Math.sin(u.lunge * Math.PI) * 48 + u.reach * 70) * side;
    const bob = Math.round(Math.sin(b.t * 3 + u.pos.x)) * PX;
    const x = snap(u.pos.x - w / 2 + lunge), y = snap(u.pos.y - hgt + bob);
    ctx.fillStyle = 'rgba(20,14,32,0.35)';
    ctx.fillRect(u.pos.x - w * 0.32, u.pos.y - 4, w * 0.64, 6); ctx.fillRect(u.pos.x - w * 0.24, u.pos.y - 6, w * 0.48, 10);
    if (u.dying > 0) ctx.globalAlpha = clamp(u.dying / 0.4, 0, 1);
    if (!(u.flash > 0 && Math.floor(b.t * 30) % 2)) ctx.drawImage(s, x, y, w, hgt);
    ctx.globalAlpha = 1;
    u.box = { x: u.pos.x - w / 2, y: u.pos.y - hgt, w, h: hgt };
  }
  function shadowText(s, x, y, size, c, align) { text(s, x + 2, y + 2, size, '#120e1c', align, true); text(s, x, y, size, c, align, true); }
  function ring(cx, cy, r, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2); ctx.stroke(); }
  /** A row of small words under each other's side: the states a fighter is in. */
  function chips(list, cx, y) {
    let wsum = -8; for (const c of list) wsum += UI.width(c.text, 13, true) + 8;
    let x = cx - wsum / 2;
    for (const c of list) { const w = UI.width(c.text, 13, true); shadowText(c.text, x, y, 13, c.color, 'left'); x += w + 8; }
  }

  /** The parry ring around the hero while a blow is in the air. */
  function drawRing() {
    const w = b.blow, h = b.hero, cx = h.pos.x, cy = h.box.y + h.box.h / 2, C = UI.C;
    const wide = h.wide ? 2 : 1, band = tune.parry_good * wide / w.lead * RING_FAR;
    ctx.globalAlpha = 0.28; ring(cx, cy, RING + band / 2, C.gold, band); ctx.globalAlpha = 1; // the outer half of the moment that parries
    ring(cx, cy, RING, C.gold, 4);
    const r = RING + (-w.t / w.lead) * RING_FAR, col = w.res === 'early' ? '#8a8078' : w.pure ? HEX : w.big ? C.bad : '#ffffff';
    if (r > 4) { ring(cx, cy, r, '#120e1c', w.big ? 10 : 8); ring(cx, cy, r, col, w.big ? 6 : 4); }
    if (!w.res) shadowText(tr('parry_now'), cx, h.box.y + h.box.h + 26, 16, C.gold, 'center');
  }

  /** One card, its top-left at (x, y). o: off (cannot be played now: why), hot (under the pointer), key (its number). */
  function drawCard(k, x, y, o = {}) {
    const C = UI.C, c = k.c, w = HAND.w, hgt = HAND.h, st = heroNow();
    if (!UI.nine(o.hot ? 'card_on' : 'card', x, y, w, hgt)) UI.box(x, y, w, hgt, C.bg2, o.hot ? C.gold : C.lineL);
    // the picture: the building as it stands in the village (or the hero), cut to a window
    const ax = x + 12, ay = y + 44, aw = w - 24, ah = 58, pic = Cards.picture(k), img = Art.get(pic.sprite, pic.frame), kk = pic.k;
    ctx.fillStyle = C.ink; ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
    ctx.fillStyle = c.from === 'hero' ? '#5a3a6a' : '#3f7a4a'; ctx.fillRect(ax, ay, aw, ah);
    ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
    const iw = img.width * PX * kk, ih = img.height * PX * kk;
    blit(img, ax + aw / 2 - iw / 2, pic.top ? ay + (ih > ah ? 2 : (ah - ih) / 2) : ay + ah / 2 - ih / 2, kk);
    ctx.restore();
    // its name, on one line or two
    const nx = x + w / 2 + 14, nw = w - 58;
    if (UI.width(c.name, 13, true) <= nw) UI.label(c.name, nx, y + 23, 13, C.gold);
    else {
      const words = gendered(c.name).split(' '); let cut = 1, best = 1e9;
      for (let i = 1; i < words.length; i++) { const d = Math.abs(UI.width(words.slice(0, i).join(' '), 12, true) - UI.width(words.slice(i).join(' '), 12, true)); if (d < best) { best = d; cut = i; } }
      UI.label(words.slice(0, cut).join(' '), nx, y + 16, 12, C.gold); UI.label(words.slice(cut).join(' '), nx, y + 30, 12, C.gold);
    }
    // its price in souffle, and what it takes from the village's stock
    const short = c.cost > b.energy && b.phase === 'play';
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + 23, y + 23, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = short ? '#7a3a34' : '#2f74c0'; ctx.beginPath(); ctx.arc(x + 23, y + 23, 12, 0, Math.PI * 2); ctx.fill();
    UI.label(String(c.cost), x + 23, y + 24, 17, short ? C.bad : '#ffffff');
    let py = ay + 12;
    for (const r in c.pay || {}) {
      const lack = state.res[r] < c.pay[r];
      ctx.fillStyle = 'rgba(20,13,8,0.85)'; ctx.fillRect(ax + aw - 50, py - 11, 50, 22);
      UI.icon(DATA.resources[r].icon, ax + aw - 38, py, 16); UI.label(String(c.pay[r]), ax + aw - 26, py + 1, 14, lack ? C.bad : C.text, 'left');
      py += 24;
    }
    // what it does
    ctx.font = `12px ${FONT}`;
    const rows = [];
    for (const line of Cards.lines(k, st).map(gendered)) { // the holes resolved before the line is cut into words
      let cur = '';
      for (const word of line.split(' ')) { const t = cur ? cur + ' ' + word : word; if (ctx.measureText(t).width > w - 24 && cur) { rows.push([cur, line]); cur = word; } else cur = t; }
      rows.push([cur, line]);
    }
    const lh = rows.length > 4 ? 13 : 15; let ty = y + 106 + Math.max(0, (5 - rows.length) * lh / 2) + lh / 2;
    for (const [s, line] of rows) { text(s, x + w / 2, ty, 12, line === tr('card_once') ? C.dim : C.text, 'center', line !== tr('card_once')); ty += lh; }
    // where it comes from, and its key
    text(Cards.origin(k), x + w / 2 + (o.key ? 6 : 0), y + hgt - 15, 11, C.dim, 'center');
    if (o.key) text(String(o.key), x + 16, y + hgt - 15, 12, C.accent, 'center', true);
    if (o.off) { ctx.fillStyle = 'rgba(20,13,8,0.5)'; ctx.fillRect(x + 4, y + 4, w - 8, hgt - 8); }
  }

  /** A note in a plate, centred over a point and ending just above it: what the card under the pointer does. */
  function drawNote(o) {
    const C = UI.C, lines = [];
    ctx.font = `bold 14px ${FONT}`;
    for (const para of gendered(o.str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > 340 && line) { lines.push(line); line = word; } else line = t; }
      lines.push(line);
    }
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 32, hgt = lines.length * 20 + 22, x = clamp(o.cx - w / 2, 4, W - w - 4), y = o.bottom - hgt;
    UI.plate(x, y, w, hgt);
    lines.forEach((l, i) => text(l, x + 16, y + 21 + i * 20, 14, i === 0 ? C.gold : o.bad && i === lines.length - 1 ? C.bad : C.text, 'left', i === 0));
  }

  function drawHand() {
    const st = heroNow(), n = b.hand.length, w = HAND.w;
    if (!n) return;
    const step = n > 1 ? Math.min(w + 8, (HAND.x1 - HAND.x0 - w) / (n - 1)) : 0, x0 = (HAND.x0 + HAND.x1) / 2 - (w + step * (n - 1)) / 2;
    let hot = -1;
    for (let i = n - 1; i >= 0 && hot < 0; i--) if (UI.over(x0 + i * step, HAND.y - 26, w, HAND.h + 30)) hot = i;
    const one = i => {
      const k = b.hand[i], isHot = i === hot, why = blocked(k);
      const x = x0 + i * step + (k.nope > 0 ? Math.round(Math.sin(k.nope * 60) * 5) : 0), y = HAND.y - (isHot ? 24 : 0) + Math.max(0, k.fresh || 0) * 400;
      UI.region(x0 + i * step, HAND.y - 26, w, HAND.h + 30, () => play(i));
      if (isHot) b.note = { str: Cards.tip(k, st) + (why ? '\n' + why : ''), cx: x + w / 2, bottom: y - 6, bad: !!why };
      drawCard(k, x, y, { hot: isHot && !why, off: !!why, key: i + 1 });
    };
    for (let i = 0; i < n; i++) if (i !== hot) one(i);
    if (hot >= 0) one(hot); // the card under the pointer lies over its neighbours
  }

  function draw() {
    if (!b) return;
    const C = UI.C, h = b.hero, playing = b.phase === 'play';
    clear('#1c120b');
    ctx.save();
    if (b.shake > 0) ctx.translate(Math.round(Math.sin(b.t * 90) * 7 * b.shake / 0.3), 0);
    ctx.drawImage(Art.get('bg.battle', b.opts.boss ? 1 : 0), 0, -BG_UP, W, H);
    const tgt = b.foes[b.target];
    if (playing && tgt && tgt.alive) { // the marked enemy: a gold ring on the ground under it
      const pulse = 1 + Math.sin(b.t * 6) * 0.06, rw = (tgt.box ? tgt.box.w : 80) * 0.6 * pulse;
      ctx.strokeStyle = '#120e1c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(tgt.pos.x, tgt.pos.y, rw, 13 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(tgt.pos.x, tgt.pos.y, rw, 13 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const u of [h, ...b.foes.filter(f => f.alive || f.dying > 0)].sort((p, q) => p.pos.y - q.pos.y)) drawUnit(u);
    ctx.restore();

    // enemies: what each will do, its name, health and armour
    let coming = 0;
    for (const f of alive()) {
      const top = f.box.y - 26, info = intentInfo(f), def = Math.max(0, f.def - f.shred);
      coming += info.sum;
      UI.bar(f.pos.x - 70, top, 140, 16, f.hp / f.max, C.bad, f.ghost / f.max);
      text(`${f.hp} / ${f.max}`, f.pos.x, top + 9, 12, C.text, 'center', true);
      shadowText(f.name, f.pos.x, top - 12, 15, C.text, 'center');
      if (def > 0 || f.shred > 0) { UI.icon('icon.def', f.pos.x + 84, top + 8, 16); shadowText(String(def), f.pos.x + 96, top + 9, 14, f.shred > 0 ? C.accent : C.text, 'left'); }
      const st = [];
      if (f.weak > 0) st.push({ text: tr('pop_weak'), color: C.accent });
      if (f.enraged) st.push({ text: tr('st_rage'), color: C.bad });
      if (st.length) chips(st, f.pos.x, top + 28);
      const iw = UI.width(info.text, 15, true) + (info.warn ? 46 : 24), iy = top - 56 + (info.warn ? Math.round(Math.sin(b.t * 8)) * 2 : 0);
      UI.plate(f.pos.x - iw / 2, iy, iw, 30, info.warn ? 'bad' : null);
      if (info.warn) UI.icon('icon.warn', f.pos.x - iw / 2 + 20, iy + 15, 16);
      UI.label(info.text, f.pos.x + (info.warn ? 10 : 0), iy + 16, 15, info.warn ? '#ffffff' : info.color);
      UI.region(f.box.x - 10, iy, f.box.w + 20, f.pos.y - iy + 10, playing ? () => { b.target = b.foes.indexOf(f); sfx('click'); } : null,
        `${f.name}\n${E[f.id].how}\n${info.text}${tr('colon')}${info.tip}` + (def > 0 ? '\n' + tr('armor_tip', { n: def, pct: Math.round((1 - armor(def)) * 100) }) : ''));
    }

    // the hero: name, health, Garde, the states he is in, and what is coming at him
    const top = h.box.y - 26;
    UI.bar(h.pos.x - 80, top, 160, 16, h.hp / h.max, C.good, h.ghost / h.max);
    text(`${h.hp} / ${h.max}`, h.pos.x, top + 9, 12, C.text, 'center', true);
    shadowText(`${h.name} · ${tr('level', { n: state.hero.lvl })}`, h.pos.x, top - 12, 15, C.text, 'center');
    if (h.block > 0) { UI.icon('icon.def', h.pos.x - 100, top + 8, 32); shadowText(String(h.block), h.pos.x - 100, top + 9, 15, BLUE, 'center'); }
    const hs = [];
    if (h.buff) hs.push({ text: tr('st_buff', { x: fmtNum(h.buff.atk), n: h.buff.turns }), color: C.gold });
    if (h.bless) hs.push({ text: tr('st_bless'), color: C.gold });
    if (h.thorns > 0) hs.push({ text: tr('st_thorns', { n: h.thorns }), color: C.accent });
    if (h.wide) hs.push({ text: tr('st_wide'), color: BLUE });
    if (h.ally) hs.push({ text: tr('st_ally', { n: h.ally.turns }), color: C.good });
    if (h.echo) hs.push({ text: tr('st_echo'), color: HEX });
    if (hs.length) chips(hs, h.pos.x, top - 32);
    if (playing && coming > 0) {
      const left = Math.max(0, coming - h.block), s = tr('coming', { n: coming }) + (h.block > 0 ? tr('coming_left', { n: left }) : '');
      const cw = UI.width(s, 14, true) + 24;
      UI.plate(h.pos.x - cw / 2, h.pos.y + 8, cw, 28); UI.label(s, h.pos.x, h.pos.y + 23, 14, left > 0 ? C.bad : C.good);
    }
    if (b.blow) drawRing();

    // the line that says what just happened
    if (b.msg) { const mw = Math.max(360, UI.width(b.msg, 16, false) + 48); UI.plate(640 - mw / 2, 10, mw, 38); UI.label(b.msg, 640, 30, 16, C.text, 'center', false); }

    // the table: souffle and deck on the left, the hand in the middle, the end of the turn on the right
    ctx.fillStyle = 'rgba(20,13,8,0.6)'; ctx.fillRect(0, 652, W, 68);
    ctx.fillStyle = C.lineL; ctx.fillRect(0, 650, W, 2);
    UI.panel(14, 508, 226, 204);
    UI.label(tr('souffle'), 34, 534, 15, C.dim, 'left');
    const gems = Math.max(tune.battle_energy, b.energy);
    for (let i = 0; i < gems; i++) {
      const gx = 110 + i * 26, gy = 534, on = i < b.energy;
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx, gy - 12); ctx.lineTo(gx + 11, gy); ctx.lineTo(gx, gy + 12); ctx.lineTo(gx - 11, gy); ctx.fill();
      ctx.fillStyle = on ? '#4aa3ff' : '#3a2f28'; ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 7, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 7, gy); ctx.fill();
      if (on) { ctx.fillStyle = '#cfe8ff'; ctx.fillRect(gx - 2, gy - 4, 2, 2); }
    }
    UI.bar(32, 556, 190, 22, h.hp / h.max, C.good, h.ghost / h.max);
    text(`${h.hp} / ${h.max}`, 127, 568, 14, C.text, 'center', true);
    UI.icon('icon.atk', 46, 600, 32); text(fmtNum(heroNow().atk), 64, 601, 16, h.buff ? C.gold : C.text, 'left', true);
    UI.icon('icon.def', 136, 600, 32); text(fmtNum(h.def), 154, 601, 16, C.text, 'left', true);
    ctx.fillStyle = C.lineL; ctx.fillRect(32, 620, 190, 2);
    text(tr('garde'), 34, 642, 15, h.block > 0 ? BLUE : C.dim, 'left', true); text(String(h.block), 222, 642, 18, h.block > 0 ? BLUE : C.dim, 'right', true);
    UI.region(32, 584, 190, 72, null, tr('stats_tip'));
    text(tr('pile_draw', { n: b.draw.length }), 34, 668, 14, C.text, 'left'); text(tr('pile_discard', { n: b.discard.length }), 222, 668, 14, C.text, 'right');
    if (b.gone.length) text(tr('pile_gone', { n: b.gone.length }), 34, 688, 13, C.dim, 'left');
    UI.region(32, 658, 190, 40, null, tr('piles_tip'));

    UI.panel(1040, 508, 226, 204);
    UI.label(tr('battle_turn', { n: Math.max(1, b.round) }), 1060, 534, 15, C.dim, 'left');
    UI.button(1196, 518, 56, 32, '?', () => { b.help = true; }, { size: 18, tip: tr('help_tip') });
    const idle = playing && !b.hand.some(k => !blocked(k));
    UI.button(1056, 560, 194, 54, tr('end_turn'), endTurn, { disabled: !playing, primary: idle, size: 17, tip: tr('end_turn_tip') });
    b.pays.forEach((r, i) => { UI.icon(DATA.resources[r].icon, 1070 + i * 66, 640, 32); text(fmt(state.res[r]), 1088 + i * 66, 641, 15, C.text, 'left', true); });
    if (b.pays.length) UI.region(1056, 624, 194, 32, null, tr('stock_tip'));
    if (b.opts.title) UI.wrap(b.opts.title, 1058, 664, 194, 13, C.dim, 16);

    b.note = null;
    if (playing || b.phase === 'intro' || b.phase === 'over') drawHand();
    else if (b.phase === 'foes') {
      UI.plate(330, 550, 620, 100);
      UI.label(tr('parry_title'), 640, 580, 20, C.gold);
      UI.wrap(tr('parry_how'), 640, 599, 540, 15, C.text, 19, false, 'center');
    }

    if (b.note && !b.help) drawNote(b.note);

    // damage numbers, each on its own arc
    for (const p of b.pops) { if (p.wait > 0) continue; ctx.globalAlpha = clamp((0.9 - p.t) * 4, 0, 1); shadowText(p.str, p.x, p.y, p.size, p.color, 'center'); ctx.globalAlpha = 1; }

    if (b.phase === 'win') {
      const t = b.tally, k = clamp(t.t / 0.9, 0, 1);
      UI.panel(390, 110, 500, 390);
      text(tr('victory'), 640, 156, 40, C.gold, 'center', true, TITLE_FONT);
      let y = 210;
      UI.icon('icon.xp', 482, y, 32); text(`+${Math.round(t.xp * k)} XP`, 506, y + 1, 20, C.text, 'left', true); y += 34;
      UI.icon('icon.gold', 482, y, 32); text(('+' + tr('gold_n', { n: Math.round(t.gold * k) })), 506, y + 1, 20, C.text, 'left', true); y += 34;
      for (const r in t.res) { UI.icon(DATA.resources[r].icon, 482, y, 32); text(`+${t.res[r]} ${DATA.resources[r].name.toLowerCase()}`, 506, y + 1, 20, C.text, 'left', true); y += 34; }
      if (b.perfect) { text(tr('tally_perfect', { n: b.perfect }), 470, y + 2, 17, C.accent, 'left', true); y += 28; }
      if (t.ups) {
        text(tr('level_up', { n: state.hero.lvl }), 470, y + 4, 22, C.gold, 'left', true); y += 30;
        text(tr('stats_up', { hp: t.hp, atk: fmtNum(t.atk), def: fmtNum(t.def) }), 470, y + 2, 17, C.good, 'left'); y += 28;
      }
      if (t.cards > 0) text(tr('tally_cards', { n: t.cards }), 470, y + 2, 17, C.good, 'left', true);
      UI.button(520, 440, 240, 46, tr('continue'), leave, { primary: true, size: 18 });
    } else if (b.phase === 'lose') {
      UI.panel(370, 130, 540, 340);
      text(tr('defeat'), 640, 176, 40, C.bad, 'center', true, TITLE_FONT);
      let y = UI.wrap(b.opts.loseText || tr('defeat_text'), 400, 216, 480, 17, C.text);
      y = UI.wrap(tr('defeat_tip'), 400, y + 8, 480, 15, C.dim);
      if (b.opts.hint) UI.wrap(b.opts.hint, 400, y + 8, 480, 15, C.accent);
      if (b.opts.once) UI.button(520, 404, 240, 48, tr('to_village'), leave, { primary: true, size: 17 }); // a duel is tried once
      else {
        UI.button(400, 404, 230, 48, tr('retry'), retry, { primary: true, size: 18 });
        UI.button(650, 404, 230, 48, tr('to_village'), leave, { size: 17 });
      }
    }
    if (b.help) {
      ctx.fillStyle = 'rgba(13,10,20,0.6)'; ctx.fillRect(0, 0, W, H);
      UI.region(0, 0, W, H, null); // nothing under the rules can be clicked
      UI.panel(250, 90, 780, 540, tr('help_title'), () => { b.help = false; });
      UI.wrap(tr('battle_help'), 282, 156, 716, 16, C.text, 23);
      UI.button(540, 566, 200, 44, tr('continue'), () => { b.help = false; }, { primary: true, size: 17 });
    }
  }

  return { start, update, draw, get active() { return !!b; }, get peek() { return b; } };
})();
