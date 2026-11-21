// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The city: what keeps the game going after the Nobles. Its rank (proclaimed by the player, without
// a ceiling), the citizens' orders (three on offer, more as the city rises), the hero's popularity (0 to 100: it
// weighs on taxes, market prices and how many people a house holds), the taxes of each class, the
// great works (three monuments whose stages swallow the surplus) and the legacy tree (permanent
// bonuses bought with Renown, kept through every new start). Content: data/city.js. Knobs:
// config.js (The city). Saved: state.city (see fresh()) and state.prestige.spent / .tree.
// The rest of the game talks to it through the names returned at the bottom; none may be renamed.
'use strict';

const City = (() => {
  const D = DATA.city, CL = DATA.classes, B = DATA.buildings, RES = DATA.resources, LEG = DATA.legacy, C = UI.C;
  const WORKS = Object.keys(D.works), STAGES = D.stages.length;
  const TABS = [['rank', 'city_t_rank'], ['orders', 'city_t_orders'], ['taxes', 'city_t_taxes'], ['works', 'city_t_works'], ['legacy', 'city_t_legacy']];
  const TAXES = ['low', 'normal', 'high'];
  const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
  const pct = x => fmtNum(x * 100);
  /** A small rate, to two decimals: 0,25 par minute. */
  const num2 = x => (Math.round(x * 100) / 100).toString().replace('.', ',');
  /** An icon made for the city when its image is there, else one the game already has. */
  const ic = (id, alt) => UI.ready('icon.' + id) ? 'icon.' + id : alt;
  const put = (s, v) => { for (const k in v) s = s.split('{' + k + '}').join(v[k]); return s; };
  /** A round number near n: orders ask for 120 planks, not 117. */
  const nice = n => n < 20 ? Math.max(1, Math.round(n)) : n < 100 ? Math.round(n / 5) * 5 : n < 1000 ? Math.round(n / 10) * 10 : n < 10000 ? Math.round(n / 100) * 100 : Math.round(n / 1000) * 1000;
  // Never saved: what is worked out again from the state. cache: the bonuses' sums; beat: the second
  // that paces the slow checks; flash: the last change of popularity, shown a moment on the HUD;
  // squeezed: classes on high tax; isOpen: orders are on offer; first: the address's ?ctab not read yet.
  let cache = null, beat = 1, flash = null, squeezed = 0, isOpen = false, first = true;

  /** A new village's city. Everything of it that is saved is here. */
  function fresh() {
    const tax = {};
    for (const c of CL) tax[c.id] = 1; // 0 low, 1 normal, 2 high
    return {
      rank: 0,                                         // its place in the ranks (data/city.js), from 0, without a ceiling
      pop: tune.pop_start, log: [],                    // the hero's popularity, 0 to 100, and where it came from lately: [{ n, why }]
      tax,                                             // the tax level of each class, by class id
      orders: D.firstWaits.map(w => ({ wait: w })),    // the slots (three, more with the rank: slotsAt): an order ({ id, tpl, kind, n, have, gold, pop, bonus, ... }) or { wait: seconds until the next }
      seq: 0, done: 0, refuse: 0,                      // orders drawn, orders honoured, seconds until one may be refused again
      raids: 0, camps: 0,                              // raids repelled and camps razed by this village (the ranks count them)
      royal: 0,                                        // the highest rank whose royal siege was repelled (js/raid.js)
      works: {},                                       // monument kind -> the highest level its works reached (kept if it is demolished)
    };
  }
  const tplOf = o => D.orders.find(t => t.id === o.tpl);
  /** What the tree's levels cost in all: the Renown spent. */
  const spentOn = tree => LEG.reduce((s, n) => { for (let l = 0; l < (tree[n.id] || 0); l++) s += n.cost + n.step * l; return s; }, 0);
  /** Fills what a loaded save lacks (it is `data`, not yet `state`). A village from before the city takes the rank its highest class asks for. */
  function adopt(data) {
    const base = fresh(), c = data.city && typeof data.city === 'object' ? data.city : {};
    for (const k in base) if (c[k] === undefined) c[k] = base[k];
    for (const cl of CL) if (c.tax[cl.id] == null) c.tax[cl.id] = 1;
    const old = c.orders || [];
    c.orders = (old.length > base.orders.length ? old : base.orders).map((s, i) => { const o = old[i]; return o && (o.kind ? !!tplOf(o) : o.wait != null) ? o : base.orders[i] || { wait: 1 }; }); // an order whose template is gone: a new one comes
    data.city = c;
    const p = data.prestige;
    if (!p.tree) p.tree = {};
    for (const id in p.tree) if (!LEG.some(n => n.id === id)) delete p.tree[id];
    p.spent = spentOn(p.tree);
    for (const b of data.buildings) {
      const d = B[b.kind]; if (!d) continue;
      if (d.pop) c.rank = Math.max(c.rank, CL[Math.min(CL.length - 1, b.cls || 0)].rank || 0); // no house stands above its town
      if (d.monument) { b.stage = Math.min(STAGES, b.lvl); c.works[b.kind] = Math.max(c.works[b.kind] || 0, b.lvl); }
    }
  }
  /** `state` was replaced: everything worked out from it is forgotten. */
  function sync() { cache = null; beat = 1; flash = null; if (!state.city || state.city.rank == null) state.city = fresh(); }

  // ---- Permanent bonuses: the great works that stand and the legacy tree ----
  const monument = kind => state.buildings.find(b => b.kind === kind);
  /** What a great work at this level gives for one key. */
  function workGives(kind, key, lvl) { const w = D.works[kind]; return (w.gives[key] || 0) * Math.min(STAGES, lvl) + ((w.more || {})[key] || 0) * Math.max(0, lvl - STAGES); }
  function sums() {
    if (cache) return cache;
    const out = {}, tree = state.prestige.tree || {};
    for (const k of WORKS) { const b = monument(k); if (b && !b.damaged) for (const key in D.works[k].gives) out[key] = (out[key] || 0) + workGives(k, key, b.lvl); }
    for (const n of LEG) if (tree[n.id]) out[n.key] = (out[n.key] || 0) + n.per * tree[n.id];
    for (const key in out) { const cap = (D.bonuses[key] || {}).cap; if (cap != null) out[key] = Math.min(cap, out[key]); }
    return cache = out;
  }
  /** A permanent bonus, 0 when nothing gives it: 'sight', 'guard', 'soldier', 'bounty', 'xp', 'trip' (and the city's own: data/city.js bonuses). */
  const bonus = key => sums()[key] || 0;
  /** How a bonus is said, for a value. */
  const bonusText = (key, v) => { const d = D.bonuses[key]; return put(d.label, { v: d.pct ? pct(v) : fmtNum(v) }); };

  // ---- The hero's popularity ----
  const popularity = () => state.city.pop;
  const floor = () => bonus('floor');
  /** Adds to the hero's popularity (n may be negative), with a short reason for the log. The higher it is, the less a gain adds. Returns what it really moved by. */
  function gainPop(n, why) {
    const c = state.city;
    if (!n) return 0;
    const before = c.pop;
    c.pop = clamp(c.pop + (n > 0 ? n * (1 - tune.pop_soften * c.pop / 100) : n), Math.min(floor(), 100), 100);
    const d = c.pop - before;
    if (Math.abs(d) < 0.05) return 0;
    c.log.unshift({ n: Math.round(d * 10) / 10, why: why || '' }); c.log.length = Math.min(c.log.length, D.logLines);
    flash = { n: d, until: state.t + 3 };
    return d;
  }
  const taxLevel = cls => { const v = state.city.tax[cls.id]; return v == null ? 1 : v; };
  const taxMults = () => [tune.tax_low_mult, 1, tune.tax_high_mult];
  const popTax = () => 1 + tune.pop_tax_max * popularity() / 100;
  const popMarket = () => tune.pop_market_max * popularity() / 100;
  /** What the tax level of a house's class, the popularity and the legacy do to its tax. */
  const taxMult = b => taxMults()[taxLevel(Village.classOf(b))] * popTax() * (1 + bonus('tax'));
  /** What one meal does to a house's satisfaction: faster under a low tax and near a cathedral. */
  const mealSat = (b, ok) => ok ? tune.sat_step * (taxLevel(Village.classOf(b)) === 0 ? tune.tax_low_sat : 1) * (1 + bonus('sat')) : -tune.sat_step;
  /** The most satisfaction a house can reach: a class on high tax never has what it takes to rise. */
  const satMax = b => taxLevel(Village.classOf(b)) === 2 ? tune.tax_high_sat_cap : 1;
  /** People the popularity brings to every house. */
  const housedBonus = () => Math.floor(popularity() / tune.pop_house_step);
  /** What multiplies the market's buying prices: popularity, the lighthouse, a venue's buff. Never under market_buy_floor, so buying to sell again never pays. */
  const buyMult = () => Math.max(tune.market_buy_floor, (1 - popMarket()) * (1 - bonus('market')) * (1 - Venue.buff('buy')));
  /** The same for its selling prices, never above market_sell_cap. */
  const sellMult = () => Math.min(tune.market_sell_cap, (1 + popMarket()) * (1 + bonus('market')) * (1 + Venue.buff('sell')));
  /** What multiplies every building's output (and so every tax): the rank and the legacy. */
  const outMult = () => (1 + state.city.rank * tune.rank_output_step) * (1 + bonus('out'));

  // ---- The ranks ----
  const roman = n => { let s = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
  /** A rank: one of the named ones, or the one the formula makes after them (« Capitale II » and on, for ever). */
  function rankDef(n) {
    if (n < D.ranks.length) return D.ranks[n];
    const e = D.endless, k = n - D.ranks.length + 1, at = a => a[0] + a[1] * k;
    const needs = { pop: at(e.pop), cls: {}, popularity: Math.min(e.popularity[2], at(e.popularity)), orders: at(e.orders), raids: at(e.raids), works: at(e.works), camps: at(e.camps) };
    for (const c in e.cls) needs.cls[c] = at(e.cls[c]);
    const res = {};
    for (const r in e.reward.res) res[r] = at(e.reward.res[r]);
    return { name: e.name + ' ' + roman(k + 1), text: e.text, opens: e.opens, needs, reward: { gold: nice(e.reward.gold[0] * Math.pow(e.reward.gold[1], k)), res, pop: e.reward.pop } };
  }
  /** What a rank asks for, with the pace knob on the counts that take time. */
  function needsOf(n) {
    const out = Object.assign({}, rankDef(n).needs);
    for (const k of ['orders', 'raids']) if (out[k] != null) out[k] = Math.max(1, Math.ceil(out[k] * tune.city_pace));
    if (out.royal) out.royal = n; // the royal siege of this rank
    return out;
  }
  const rank = () => state.city.rank;
  const rankName = n => rankDef(n == null ? state.city.rank : n).name;
  const worksTotal = () => WORKS.reduce((s, k) => { const b = monument(k); return s + (b ? b.lvl : 0); }, 0);
  /** The parts of a condition that are the city's, each with whether it holds and how to say it (js/quests.js describe adds them to its own). */
  function describe(c) {
    const out = [], s = state.city;
    if (!c) return out;
    const count = (key, have, str) => { if (c[key] != null) out.push({ ok: have >= c[key], text: tr(str, { n: c[key], have: Math.min(have, c[key]) }), short: tr(str, { n: c[key], have: Math.min(have, c[key]) }) }); };
    if (c.rank != null) out.push({ ok: s.rank >= c.rank, text: tr('city_need_rank', { name: rankName(c.rank), have: rankName() }), short: rankName(c.rank) });
    if (c.popularity != null) out.push({ ok: s.pop >= c.popularity, text: tr('city_need_pop', { n: c.popularity, have: Math.floor(s.pop) }), short: tr('city_need_pop_short', { n: c.popularity }) });
    count('orders', s.done, 'city_need_orders'); count('raids', s.raids, 'city_need_raids');
    if (c.raids != null && tune.camp_raid_credit > 0) { const o = out[out.length - 1]; o.text += tr('city_need_raids_camp', { k: tune.camp_raid_credit }); } // a camp razed counts too: say so on the long line
    count('works', worksTotal(), 'city_need_works'); count('camps', s.camps, 'city_need_camps');
    if (c.royal != null) { const on = Raid.royalOn(), of = DATA.royal.waves; out.push({ ok: (s.royal || 0) >= c.royal, royal: true, text: on ? tr('city_need_royal_on', { wave: on.wave + 1, of }) : tr('city_need_royal'), short: tr('city_need_royal_short') }); }
    return out;
  }
  /** One more step before a house may rise into `next`: the rank that class asks for. */
  const raiseSteps = (b, next) => next && next.rank ? describe({ rank: next.rank }).map(p => ({ ok: p.ok, text: p.text })) : [];
  const canProclaim = () => Quests.met(needsOf(rank() + 1));
  /** What a rank opens: the classes and the buildings that ask for it, then its own line. */
  function opensOf(n) {
    const d = rankDef(n), list = CL.filter(c => c.rank === n && n > 0).map(c => c.name).concat(DATA.buildOrder.filter(k => (B[k].unlock || {}).rank === n).map(k => B[k].name));
    if (n > 0 && slotsAt(n) > slotsAt(n - 1)) list.push(tr('city_opens_slot', { n: slotsAt(n) }));
    if (d.opens) list.push(d.opens);
    list.push(tr('city_rank_out', { pct: pct(tune.rank_output_step) }));
    return list;
  }
  const rewardParts = r => (r.gold ? [`+${fmt(r.gold)} or`] : []).concat(Object.keys(r.res || {}).map(k => `+${fmt(r.res[k])} ${lower(RES[k].name)}`), r.pop ? [tr('city_reward_pop', { n: r.pop })] : []);
  /** Proclaims the next rank when everything it asks for holds: its reward, what it opens, a fanfare and a banner. */
  function proclaim() {
    const n = rank() + 1, d = rankDef(n);
    if (!canProclaim()) { sfx('error'); return false; }
    state.city.rank = n;
    Quests.grant({ gold: d.reward.gold, res: d.reward.res });
    gainPop(d.reward.pop, tr('city_why_rank', { name: d.name }));
    Village.refreshUnlocks();
    ui.banner = { title: tr('city_banner', { name: d.name }), sub: tr('city_banner_sub', { n: n + 1 }), text: d.text + '\n' + tr('reward') + ' : ' + rewardParts(d.reward).join(', ') + '\n' + tr('city_opens', { list: opensOf(n).join(', ') }) };
    sfx('fanfare'); events.push({ type: 'rank', rank: n }); Save.persist();
    return true;
  }

  /** The royal siege of rank n was repelled (js/raid.js): the rank can be proclaimed. */
  function royalWon(n) {
    const c = state.city;
    c.royal = Math.max(c.royal || 0, n);
    gainPop(tune.royal_pop, tr('city_why_royal'));
    ui.banner = { title: tr('city_royal_won'), sub: rankDef(n).name, text: tr('city_royal_won_text') };
    sfx('fanfare'); Save.persist();
  }
  /** Under the next rank's conditions, while its royal siege is still to be repelled: the button that launches it, or how it goes. Returns the y under it. */
  function royalBlock(x, y, w, needs) {
    const on = Raid.royalOn();
    if (on) return y;
    const others = Quests.describe(needs).filter(p => !p.royal).every(p => p.ok), why = Raid.royalBlocked();
    const can = others && !why;
    UI.button(x, y, w, 36, tr('city_royal_btn'), () => Raid.royalStart(needs.royal), { primary: can, disabled: !can, size: 14, icon: 'icon.raid',
      tip: !others ? tr('city_royal_others') : why || tr('city_royal_tip', { n: DATA.royal.waves }) });
    return y + 42;
  }

  // ---- The orders ----
  /** How many orders are on offer at once at rank n (data/city.js slots, the last for every rank above). */
  const slotsAt = n => D.slots[Math.min(n, D.slots.length - 1)];
  /** The wait before an order replaces one honoured or refused: shorter with every rank. */
  const waitNow = () => tune.order_wait * Math.max(tune.order_wait_floor, 1 - rank() * tune.order_wait_rank);
  /** How many honoured orders an order counts for (a great one: several). */
  const worthOf = o => (tplOf(o) || {}).worth || 1;
  const houses = () => state.buildings.filter(b => B[b.kind].pop);
  /** What the village makes of each resource, per second, before anything eats it: an order never asks for goods nothing makes. */
  function makes() {
    const out = {};
    for (const b of state.buildings) { const d = B[b.kind]; if (!d.produces || d.pop || b.damaged || b.paused) continue; for (const r in d.produces) out[r] = (out[r] || 0) + d.produces[r] * Village.outMult(b) / d.cycle; }
    const u = Units.rates();
    for (const r in u) if (u[r] > 0) out[r] = (out[r] || 0) + u[r];
    delete out.gold;
    return out;
  }
  /** The gold every house pays, per second. */
  function taxRate() { let n = 0; for (const b of houses()) if (!b.damaged && Village.onRoad(b)) n += B[b.kind].produces.gold * Village.taxMult(b) * Village.outMult(b) / B[b.kind].cycle; return n; }
  const bestBeauty = () => houses().reduce((m, b) => Math.max(m, Village.beauty(b).total), 0);
  const raidsOn = () => { const r = state.raid; return (r.timer != null || !!r.active) && !(r.camp && r.camp.down > 0); };
  const venues = () => [...new Set(state.buildings.filter(b => Venue.has(b)).map(b => b.kind))];
  /**
   * Places found while exploring where something can still be done: js/explore.js lists the places
   * found (Explore.shown) and says of each whether an action is open (Explore.status(s).can). When it
   * has neither, no order asks for a place.
   */
  function sitesOpen() {
    if (typeof Explore.shown !== 'function' || typeof Explore.status !== 'function') return 0;
    return Explore.shown().filter(s => { const st = Explore.status(s); return !!st && st.can; }).length;
  }
  /** How many an order asks for at this rank. */
  const amount = t => Math.min(t.max || 99, (t.n || 1) + (t.per ? Math.floor(rank() / t.per) : 0));
  /** What each kind of order can ask for now, or null when the village cannot do it yet. `pick` chooses among the possible. */
  const OFFER = {
    deliver(t, pick, live) {
      const m = makes(), rs = t.res.filter(r => m[r] > 0 && !live.some(o => o.res === r));
      if (!rs.length) return null;
      const res = pick(rs), n = nice(Math.max(t.min * (1 + rank() * tune.order_rank_step), m[res] * 60 * tune.order_minutes) * (t.scale || 1) * (0.75 + 0.5 * rng()));
      return { res, n };
    },
    build(t, pick) { const ks = t.of.filter(k => B[k] && Village.isUnlocked(k) && !B[k].unique); return ks.length ? { of: pick(ks), n: amount(t) } : null; },
    raise(t) { return houses().some(b => { const n = Village.nextClass(b); return n && !b.damaged && rank() >= (n.rank || 0) && Quests.met(n.opens); }) ? { n: amount(t) } : null; },
    beauty(t) { const n = Math.floor(bestBeauty()) + t.step; return houses().length && n <= D.beautyCap ? { n } : null; },
    raid(t) { return raidsOn() ? { n: amount(t) } : null; },
    battle(t) { return state.hero.equip.weapon && DATA.contracts.some(q => Quests.met(q.requires)) ? { n: amount(t) } : null; },
    camp(t) { return raidsOn() && Camp.standing() && Units.soldiers().length >= t.soldiers ? { n: 1 } : null; },
    game(t, pick) { const vs = venues(); return vs.length ? { venue: pick(vs), score: Math.min(3, t.score + (t.per ? Math.floor(rank() / t.per) : 0)), n: 1 } : null; },
    site() { return sitesOpen() > 0 ? { n: 1 } : null; },
  };
  /** A new order for a slot, drawn by weight among the templates the village can do now; null when there is none. */
  function draw() {
    const c = state.city, live = c.orders.filter(o => o.kind), pick = a => a[Math.floor(rng() * a.length)];
    let pool = D.orders.filter(t => (t.rank || 0) <= c.rank && OFFER[t.kind](t, a => a[0], live));
    const other = pool.filter(t => !live.some(o => o.tpl === t.id));
    if (other.length) pool = other; // three different orders when the village allows it
    if (!pool.length) return null;
    let r = rng() * pool.reduce((s, t) => s + t.w, 0), t = pool[pool.length - 1];
    for (const q of pool) { r -= q.w; if (r < 0) { t = q; break; } }
    const p = OFFER[t.kind](t, pick, live);
    if (!p) return null;
    const k = 1 + c.rank * tune.order_rank_step, more = (1 + bonus('orders')) * tune.order_reward_scale;
    const gold = t.kind === 'deliver' ? Math.max(t.gold * k, p.n * DATA.trade[p.res].sell * tune.order_gold_mult) : t.gold * k + taxRate() * (t.mins || 0) * 60;
    return Object.assign({ id: ++c.seq, tpl: t.id, kind: t.kind, have: 0, gold: nice(gold * more), pop: t.pop, bonus: t.bonus && rng() < (t.chance == null ? 1 : t.chance) ? Object.assign({}, t.bonus) : null }, p);
  }
  /** What an order says, its holes filled. */
  function orderText(o) {
    const name = o.of ? B[o.of].name : o.venue && B[o.venue] ? B[o.venue].name : '';
    return put(tplOf(o).text, { n: fmt(o.n), res: o.res ? lower(RES[o.res].name) : '', name, score: tr('city_medals')[o.score || 0] });
  }
  /** How far an order is, up to what it asks. A delivery reads the stock. */
  const haveOf = o => Math.min(o.n, Math.floor(o.kind === 'deliver' ? state.res[o.res] : o.have));
  const ready = o => !!o.kind && haveOf(o) >= o.n;
  /** Hands in the order of a slot: the goods go, the pay and the popularity come, and the slot waits for the next one. */
  function honour(i) {
    const c = state.city, o = c.orders[i];
    if (!o || !ready(o)) { sfx('error'); return false; }
    if (o.kind === 'deliver') state.res[o.res] -= o.n;
    const lines = Quests.grant({ gold: o.gold, res: o.bonus || {} });
    gainPop(o.pop, tr('city_why_order'));
    const worth = worthOf(o);
    c.done += worth; c.orders[i] = { wait: waitNow() };
    toast(tr('city_order_done', { title: tplOf(o).title }) + (worth > 1 ? ' (×' + worth + ')' : '') + ' · ' + lines.join(', '), C.gold); sfx('coin');
    events.push({ type: 'order', kind: o.kind });
    return true;
  }
  /** Sends an order away: another comes after the usual wait, and none can be refused for a while. */
  function refuse(i) {
    const c = state.city;
    if (c.refuse > 0 || !c.orders[i].kind) { sfx('error'); return false; }
    c.orders[i] = { wait: waitNow() }; c.refuse = tune.order_refuse_cd;
    return true;
  }

  // ---- What the game tells the city ----
  /**
   * Something happened: 'raid' { won, siege } · 'camp' · 'quest' { id } · 'battle' { boss } ·
   * 'class' { cls } · 'build' { kind } · 'site' { kind } · 'game' { venue, score 0..3 }.
   * The orders count it and the hero's popularity moves.
   */
  function event(type, data) {
    const c = state.city, F = D.fame, e = data || {};
    const bump = (kind, test) => { for (const o of c.orders) if (o.kind === kind && o.have < o.n && (!test || test(o))) o.have++; };
    if (type === 'raid') {
      if (e.won) { c.raids++; gainPop(e.siege ? F.siege : F.raid, tr(e.siege ? 'city_why_siege' : 'city_why_raid')); bump('raid'); }
      else gainPop(F.raidLost, tr('city_why_raidlost'));
    } else if (type === 'camp') { c.camps++; c.raids += tune.camp_raid_credit; gainPop(F.camp, tr('city_why_camp')); bump('camp'); }
    else if (type === 'quest') gainPop(F.quest, tr('city_why_quest'));
    else if (type === 'battle') { gainPop(e.boss ? F.boss : F.battle, tr(e.boss ? 'city_why_boss' : 'city_why_battle')); bump('battle'); }
    else if (type === 'class') { gainPop(F.cls, tr('city_why_class')); bump('raise'); }
    else if (type === 'build') { bump('build', o => o.of === e.kind); if (B[e.kind] && B[e.kind].monument) founded(e.kind); }
    else if (type === 'site') { gainPop(F.site, tr('city_why_site')); bump('site'); }
    else if (type === 'game') {
      const s = clamp(e.score | 0, 0, 3);
      gainPop(F.game[s], tr('city_why_game'));
      bump('game', o => s >= o.score && (!o.venue || o.venue === e.venue || !B[e.venue])); // a venue named otherwise than its building: any game counts
    }
    cache = null;
  }

  // ---- The great works ----
  /** A monument was just placed: its foundations are laid, or it comes back at the stage its works had reached. */
  function founded(kind) {
    const c = state.city, b = monument(kind);
    if (!b) return;
    if (!c.works[kind]) gainPop(D.fame.stage, tr('city_why_work', { name: B[kind].name }));
    b.lvl = Math.max(1, c.works[kind] || 1); b.stage = Math.min(STAGES, b.lvl); c.works[kind] = b.lvl;
  }
  /** The price of a monument's next step: a stage, then embellishments that grow without end. */
  function stageCost(b) {
    const w = D.works[b.kind], k = tune.work_cost_scale * tune.cost_scale;
    return b.lvl - 1 < w.costs.length ? Village.scaleCost(w.costs[b.lvl - 1], k) : Village.scaleCost(w.embel.cost, k * Math.pow(w.embel.growth, b.lvl - STAGES));
  }
  /** Pays a monument's next step (js/village.js upgrade calls it too: a monument's level is the stage of its works). */
  function advance(b) {
    if (b.damaged) return false;
    if (!Village.pay(stageCost(b))) { toast(tr('no_funds'), C.bad); return false; }
    b.lvl++; b.stage = Math.min(STAGES, b.lvl); state.city.works[b.kind] = b.lvl; cache = null;
    const name = B[b.kind].name, done = b.lvl === STAGES;
    gainPop(b.lvl <= STAGES ? D.fame.stage : D.fame.embel, tr('city_why_work', { name }));
    World.dust(b); sfx('fanfare');
    if (done) ui.banner = { title: tr('city_work_banner'), sub: name, text: tr('city_work_banner_text', { name }) };
    else toast(b.lvl < STAGES ? tr('city_work_done', { name, stage: D.stages[b.lvl - 1] }) : tr('city_work_more', { name, n: b.lvl - STAGES }), C.gold);
    events.push({ type: 'work', kind: b.kind, lvl: b.lvl }); Save.persist();
    return true;
  }

  // ---- The legacy tree and the new start ----
  const points = () => state.prestige.renown - (state.prestige.spent || 0);
  const nodeLevel = n => (state.prestige.tree || {})[n.id] || 0;
  const nodeCost = n => n.cost + n.step * nodeLevel(n);
  const nodeOpen = n => !n.after || Object.keys(n.after).every(k => ((state.prestige.tree || {})[k] || 0) >= n.after[k]);
  /** Buys one level of a legacy node with Renown. It holds from now on, through every new start. */
  function learn(n) {
    const p = state.prestige, cost = nodeCost(n);
    if (nodeLevel(n) >= n.max || !nodeOpen(n) || points() < cost) { sfx('error'); return false; }
    if (!p.tree) p.tree = {};
    p.tree[n.id] = nodeLevel(n) + 1; p.spent = spentOn(p.tree); cache = null;
    sfx('level'); Save.persist();
    return true;
  }
  /** The stocks a new start begins with (the legacy's « Greniers pleins »). */
  function startStocks() {
    const out = {};
    for (const n of LEG) if (n.stock) for (const r in n.stock) { const v = n.stock[r] * nodeLevel(n); if (v) out[r] = (out[r] || 0) + v; }
    return out;
  }
  /** Renown a new start adds for the rank this village reached, beside what its gold gives. */
  const renownBonus = () => state.city.rank * tune.renown_per_rank;

  // ---- The step ----
  /** Once a second: what is cheap to keep but dear to work out at every step. */
  function watch() {
    const c = state.city, hs = houses();
    isOpen = c.done > 0 || c.rank > 0 || hs.length > 0;
    squeezed = CL.filter((cl, i) => taxLevel(cl) === 2 && hs.some(b => Math.min(CL.length - 1, b.cls || 0) === i)).length;
    const best = bestBeauty();
    for (const o of c.orders) if (o.kind === 'beauty') o.have = Math.min(o.n, best);
  }
  /** One step: the popularity erodes toward its floor, the empty slots count down to their next order. Runs in every scene. */
  function tick(dt) {
    const c = state.city;
    beat += dt;
    if (beat >= 1) { beat = 0; cache = null; watch(); }
    const fl = Math.min(100, floor());
    c.pop = c.pop > fl ? Math.max(fl, c.pop - (tune.pop_decay + squeezed * tune.tax_high_pop_drain) * dt / 60) : fl;
    if (c.refuse > 0) c.refuse = Math.max(0, c.refuse - dt);
    if (!isOpen) return;
    while (c.orders.length < slotsAt(c.rank)) c.orders.push({ wait: 1 }); // a rank that opens a slot: its first order comes at once
    for (let i = 0; i < c.orders.length; i++) {
      const o = c.orders[i];
      if (o.kind) continue;
      o.wait -= dt;
      if (o.wait <= 0) c.orders[i] = draw() || { wait: D.retry };
    }
  }

  // ---- Drawing: small parts ----
  /** A section title with a brass rule after it. Returns the y under it. */
  function section(title, x, y, w) {
    const tw = UI.width(title, 15, true);
    text(title, x, y + 10, 15, C.gold, 'left', true);
    ctx.fillStyle = 'rgba(143,95,28,0.6)'; ctx.fillRect(x + tw + 10, y + 10, Math.max(0, w - tw - 10), 1);
    return y + 24;
  }
  /** A line that holds or not: a tick or a padlock, then the words. Returns the y under it. */
  function check(ok, str, x, y, w) { UI.icon(ok ? 'icon.check' : 'icon.lock', x + 8, y + 9, 16); return UI.wrap(str, x + 22, y, w - 22, 13, ok ? C.good : C.bad, 18); }
  /** How many lines UI.wrap would take. */
  function linesOf(str, maxW, size) {
    ctx.font = `${size}px ${FONT}`; let n = 0;
    for (const para of String(str).split('\n')) {
      let line = ''; n++;
      for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { n++; line = word; } else line = t; }
    }
    return n;
  }
  /** A price over as many rows as it takes inside w, red where the stock is short. Returns the y under it. */
  function costRows(c, x, y, w) {
    let cx = x;
    for (const r in c) {
      const s = fmt(c[r]), iw = 22 + UI.width(s, 13, true) + 10;
      if (cx + iw > x + w && cx > x) { cx = x; y += 20; }
      UI.icon(RES[r].icon, cx + 8, y + 9, 16);
      text(s, cx + 20, y + 10, 13, state.res[r] >= c[r] ? C.text : C.bad, 'left', true);
      cx += iw;
    }
    return y + 22;
  }
  /** A small gold mark that beats, on a tab or the HUD plate: something waits for a click there. */
  function pip(x, y) {
    const k = Math.round(Math.sin(state.t * 5)) > 0 ? 1 : 0;
    ctx.fillStyle = C.ink; ctx.fillRect(x - 4 - k, y - 4 - k, 8 + 2 * k, 8 + 2 * k);
    ctx.fillStyle = C.gold; ctx.fillRect(x - 3 - k, y - 3 - k, 6 + 2 * k, 6 + 2 * k);
  }
  const popColor = p => p < 25 ? C.bad : p < 60 ? C.accent : C.gold;
  /** Opens the city's panel, on a tab when one is given. */
  function openPanel(tab) {
    Object.assign(ui, { panel: 'city', sel: null, placing: null, moving: null, tool: null });
    if (tab) { ui.ctab = tab; UI.scrollTop('city'); }
  }

  // ---- The HUD plate, under the quest box ----
  /** Rank name, popularity gauge, and a mark when an order can be handed in or the rank can rise. A click opens the panel there. Hidden while a lesson's task box stands in its place. */
  function drawHud(x, y, w) {
    const c = state.city;
    if (!isOpen || Tuto.hidesQuest()) return;
    const h = 40, can = canProclaim(), rdy = c.orders.some(ready);
    UI.region(x, y, w, h, () => { sfx('click'); if (ui.panel === 'city' && !can && !rdy) { ui.panel = null; return; } openPanel(can ? 'rank' : rdy ? 'orders' : null); },
      tr('city_hud_tip', { name: rankName(), n: Math.floor(c.pop) }) + (rdy ? '\n' + tr('city_hud_tip_order') : '') + (can ? '\n' + tr('city_hud_tip_rank') : ''));
    UI.plate(x, y, w, h); Tuto.mark('hud:city', x, y, w, h);
    UI.icon(ic('city', 'icon.village'), x + 26, y + 20, 32);
    UI.label(rankName(), x + 50, y + 21, 15, C.gold, 'left');
    const bx = x + 204;
    UI.icon(ic('popularity', 'icon.hero'), bx - 14, y + 20, 16);
    UI.bar(bx, y + 13, 96, 14, c.pop / 100, popColor(c.pop));
    text(String(Math.floor(c.pop)), bx + 102, y + 21, 13, C.text, 'left', true);
    if (flash && state.t < flash.until) text((flash.n > 0 ? '+' : '−') + fmtNum(Math.abs(flash.n)), bx + 128, y + 21, 12, flash.n > 0 ? C.good : C.bad, 'left', true);
    if (rdy) { UI.icon(ic('order', 'icon.quest'), x + w - 62, y + 20, 16); pip(x + w - 50, y + 12); }
    if (can) { UI.icon('icon.upgrade', x + w - 28, y + 20, 16); pip(x + w - 16, y + 12); }
  }

  // ---- The panel ----
  /** The side panel « Cité » (key G): the rank, the orders, the taxes, the great works and the legacy, each on its tab. */
  function drawPanel(P) {
    const x = P.x + 24, w = P.w - 48;
    if (first) { first = false; const q = params.get('ctab'); if (TABS.some(t => t[0] === q)) ui.ctab = q; } // ?ctab=orders: the panel opened on that tab
    if (!TABS.some(t => t[0] === ui.ctab)) ui.ctab = 'rank';
    UI.panel(P.x, P.y, P.w, P.h, tr('city_title', { name: rankName() }), () => { ui.panel = null; ui.sel = null; });
    const widths = TABS.map(t => UI.width(tr(t[1]), 12, true)), pad = Math.floor((w - (TABS.length - 1) * 3 - widths.reduce((a, b) => a + b, 0)) / TABS.length);
    let tx = x;
    TABS.forEach(([id, key], i) => {
      const tw = Math.floor(widths[i]) + pad;
      UI.tab(tx, P.y + 58, tw, 30, tr(key), () => { ui.ctab = id; UI.scrollTop('city'); }, ui.ctab === id, { size: 12 });
      Tuto.mark('ctab:' + id, tx, P.y + 58, tw, 30);
      if ((id === 'rank' && canProclaim()) || (id === 'orders' && state.city.orders.some(ready))) pip(tx + tw - 5, P.y + 62);
      tx += tw + 3;
    });
    UI.scrollBox('city', x, P.y + 98, w, P.h - 114, y => {
      const t = ui.ctab;
      return t === 'orders' ? ordersBody(x, y, w) : t === 'taxes' ? taxTab(null, x, y, w) : t === 'works' ? worksBody(x, y, w) : t === 'legacy' ? legacyBody(x, y, w) : rankBody(x, y, w);
    });
  }
  /** The Rang tab: the rank, the popularity (what it gives, where it came from), and the way to the next rank. */
  function rankBody(x, y, w) {
    const c = state.city, n = c.rank, d = rankDef(n), nx = rankDef(n + 1), fl = Math.min(100, floor());
    UI.plate(x, y, w, 56); UI.icon(ic('city', 'icon.village'), x + 30, y + 28, 32);
    UI.label(d.name, x + 56, y + 20, 20, C.gold, 'left');
    text(tr('city_rank_n', { n: n + 1 }) + (n ? ' · ' + tr('city_rank_gives', { pct: pct(n * tune.rank_output_step) }) : ''), x + 56, y + 41, 12, C.dim, 'left', true);
    const popTop = y + 64; // the top of the popularity block, for the tutorial's arrow
    y = section(tr('city_pop_title', { n: Math.floor(c.pop) }), x, y + 64, w);
    UI.bar(x, y, w, 16, c.pop / 100, popColor(c.pop));
    if (fl > 0) { ctx.fillStyle = C.text; ctx.fillRect(Math.round(x + 3 + (w - 6) * fl / 100), y + 2, 2, 12); } // its floor
    y += 22;
    y = UI.wrap(tr('city_pop_gives', { tax: pct(popTax() - 1), mk: pct(popMarket()), house: housedBonus() }), x, y, w, 13, C.text, 17);
    const step = (housedBonus() + 1) * tune.pop_house_step;
    y = UI.wrap((step <= 100 ? tr('city_pop_next', { n: step }) + ' ' : '') + tr('city_pop_decay', { n: num2(tune.pop_decay), floor: fmtNum(fl) })
      + (squeezed ? ' ' + tr('city_pop_squeeze', { n: num2(squeezed * tune.tax_high_pop_drain) }) : ''), x, y + 2, w, 12, C.dim, 16) + 4;
    Tuto.mark('city:pop', x, popTop, w, y - popTop);
    text(tr('city_pop_log'), x, y + 8, 13, C.gold, 'left', true); y += 20;
    if (!c.log.length) y = UI.wrap(tr('city_pop_nolog'), x, y, w, 12, C.dim, 16);
    for (const l of c.log) { text((l.n > 0 ? '+' : '−') + fmtNum(Math.abs(l.n)), x + 34, y + 8, 13, l.n > 0 ? C.good : C.bad, 'right', true); text(l.why, x + 44, y + 8, 13, C.text, 'left'); y += 18; }
    y = section(tr('city_next', { name: nx.name }), x, y + 8, w);
    const needs = needsOf(n + 1);
    for (const p of Quests.describe(needs)) y = check(p.ok, p.text, x, y, w);
    if (needs.royal != null && (c.royal || 0) < needs.royal) y = royalBlock(x, y + 4, w, needs);
    y = UI.wrap(tr('reward') + ' : ' + rewardParts(nx.reward).join(', '), x, y + 4, w, 13, C.dim, 17);
    y = UI.wrap(tr('city_opens', { list: opensOf(n + 1).join(', ') }), x, y, w, 13, C.accent, 17) + 6;
    const can = canProclaim();
    UI.button(x, y, w, 38, tr('city_proclaim', { name: nx.name }), proclaim, { primary: can, disabled: !can, size: 15, icon: 'icon.upgrade', tip: tr(can ? 'city_proclaim_tip' : 'city_proclaim_no') });
    Tuto.mark('city:proclaim', x, y, w, 38);
    return y + 46;
  }
  /** The Commandes tab: the slots, each an order with its progress, its pay and its two buttons, or the wait for the next one. */
  function ordersBody(x, y, w) {
    const c = state.city;
    text(tr('city_orders_done', { n: c.done }), x, y + 9, 14, C.text, 'left', true);
    if (c.refuse > 0) text(tr('city_refuse_in', { time: fmtTime(c.refuse) }), x + w, y + 9, 12, C.dim, 'right');
    y += 24;
    if (!isOpen) return UI.wrap(tr('city_orders_closed'), x, y, w, 13, C.dim);
    let marked = false;
    c.orders.forEach((o, i) => {
      if (!o.kind) {
        UI.plate(x, y, w, 40); UI.icon('icon.time', x + 22, y + 20, 16);
        text(tr('city_order_wait', { time: fmtTime(o.wait) }), x + 36, y + 21, 13, C.dim, 'left');
        y += 46; return;
      }
      const t = tplOf(o), body = orderText(o), h = 86 + linesOf(body, w - 24, 13) * 17, rdy = ready(o), have = haveOf(o);
      UI.plate(x, y, w, h);
      UI.label(t.title, x + 12, y + 16, 14, C.gold, 'left'); text(worthOf(o) > 1 ? tr('city_order_worth', { n: worthOf(o) }) : t.from, x + w - 12, y + 16, 12, worthOf(o) > 1 ? C.gold : C.dim, 'right');
      let cy = UI.wrap(body, x + 12, y + 27, w - 24, 13, C.text, 17) + 3;
      UI.bar(x + 12, cy, w - 24 - 96, 14, have / o.n, rdy ? C.gold : C.accent);
      text(`${fmt(have)} / ${fmt(o.n)}`, x + w - 12, cy + 8, 12, rdy ? C.gold : C.text, 'right', true);
      cy += 20;
      let rx = x + 12; // its pay: gold, popularity, and the rare resource when there is one
      const pay = (icon, s) => { UI.icon(icon, rx + 8, cy + 15, 16); text(s, rx + 20, cy + 16, 13, C.text, 'left', true); rx += 26 + UI.width(s, 13, true); };
      pay('icon.gold', fmt(o.gold)); pay(ic('popularity', 'icon.hero'), '+' + o.pop);
      for (const r in o.bonus || {}) pay(RES[r].icon, '+' + o.bonus[r]);
      const bx = x + w - 12 - 180;
      UI.button(bx, cy, 98, 30, tr(o.kind === 'deliver' ? 'city_deliver' : 'city_honour'), () => honour(i), { primary: rdy, disabled: !rdy, size: 13, tip: rdy ? null : tr('city_order_no') });
      UI.button(bx + 102, cy, 78, 30, tr('city_refuse'), () => refuse(i), { size: 12, disabled: c.refuse > 0, tip: tr('city_refuse_tip', { wait: fmtTime(waitNow()), cd: fmtTime(tune.order_refuse_cd) }) });
      if (!marked) { marked = true; Tuto.mark('city:order', bx, cy, 98, 30); Tuto.mark('city:refuse', bx + 102, cy, 78, 30); }
      y += h + 6;
    });
    return y;
  }
  /** The gold per minute the houses of a class would pay at a tax level, once their satisfaction has settled under it. */
  function classGold(i, lvl) {
    const M = taxMults(), cur = taxLevel(CL[i]), f = s => tune.unhappy_tax + (1 - tune.unhappy_tax) * s;
    let n = 0;
    for (const b of houses()) {
      if (Math.min(CL.length - 1, b.cls || 0) !== i || b.damaged || !Village.onRoad(b)) continue;
      const d = B[b.kind], sat = Village.satOf(b), cap = lvl === 2 ? tune.tax_high_sat_cap : 1;
      n += d.produces.gold * Village.taxMult(b) * Village.outMult(b) / d.cycle * (M[lvl] / M[cur]) * (f(Math.min(sat, cap)) / f(sat));
    }
    return n * 60;
  }
  /**
   * The taxes: a row per class, with a button per level that says what the class would pay per
   * minute at that level, and under them what the chosen level does. The body of the hall's
   * « Impôts » tab and of the panel's (`b` is not used). Returns the y under it.
   */
  function taxTab(b, x, y, w) {
    const hs = houses(), M = taxMults(), bw = Math.floor((w - 8) / 3);
    y = UI.wrap(tr('city_tax_help'), x, y, w, 12, C.dim, 16) + 2;
    UI.icon(ic('tax', 'icon.gold'), x + 8, y + 10, 16);
    text(tr('city_tax_total', { n: fmt(taxRate() * 60) }), x + 22, y + 11, 14, C.gold, 'left', true); y += 28;
    let marked = false;
    CL.forEach((cl, i) => {
      const n = hs.filter(h => Math.min(CL.length - 1, h.cls || 0) === i).length, cur = taxLevel(cl);
      if (!n) { text(tr('city_tax_none', { name: cl.name }), x, y + 9, 13, C.dim, 'left'); y += 22; return; }
      text(tr('city_tax_class', { name: cl.name, houses: tr(n > 1 ? 'houses_n' : 'house_n', { n }) }), x, y + 9, 14, C.text, 'left', true); y += 22;
      const now = classGold(i, cur);
      TAXES.forEach((id, lvl) => {
        const bx = x + lvl * (bw + 4), then = classGold(i, lvl), on = cur === lvl;
        const tip = tr('city_tax_tip_' + id, { m: fmtNum(M[lvl]), k: fmtNum(tune.tax_low_sat), cap: pct(tune.tax_high_sat_cap), n: num2(tune.tax_high_pop_drain) }) + '\n' + tr('city_tax_tip_now', { now: fmt(now), then: fmt(then) });
        UI.button(bx, y, bw, 42, '', () => { state.city.tax[cl.id] = lvl; beat = 1; }, { on, tip });
        UI.label(tr('city_tax_' + id), bx + bw / 2, y + 14, 13, on ? C.gold : C.text);
        text(tr('city_tax_min', { n: fmt(then) }), bx + bw / 2, y + 30, 12, on ? C.text : then > now ? C.good : then < now ? C.bad : C.dim, 'center', true);
        if (!marked) Tuto.mark('city:tax:' + id, bx, y, bw, 42);
      });
      if (!marked) { marked = true; Tuto.mark('city:tax', x, y, w, 42); }
      y += 46;
      y = UI.wrap(tr('city_tax_fx_' + TAXES[cur], { k: fmtNum(tune.tax_low_sat), cap: pct(tune.tax_high_sat_cap), n: num2(tune.tax_high_pop_drain) }), x, y, w, 12, cur === 2 ? C.bad : cur === 0 ? C.good : C.dim, 16) + 8;
    });
    return y;
  }
  /** A monument's works: its four stages, what it gives now, the next step, its price and the button that pays it. */
  function workBody(b, x, y, w) {
    const wk = D.works[b.kind], st = Math.min(STAGES, b.lvl), em = Math.max(0, b.lvl - STAGES), sw = Math.floor((w - (STAGES - 1) * 4) / STAGES);
    D.stages.forEach((name, i) => {
      const sx = x + i * (sw + 4), on = i < st;
      if (on) UI.plate(sx, y, sw, 26); else UI.box(sx, y, sw, 26, 'rgba(20,13,8,0.55)', C.line);
      text(name, sx + sw / 2, y + 14, 11, on ? C.gold : C.dim, 'center', true);
    });
    y += 32;
    if (em) { text(tr('city_embel_n', { n: em }), x, y + 8, 13, C.gold, 'left', true); y += 20; }
    if (b.damaged) y = UI.wrap(tr('city_work_damaged'), x, y, w, 13, C.bad, 17, true) + 2;
    y = section(tr('city_work_gives'), x, y, w);
    for (const key in wk.gives) { text(bonusText(key, workGives(b.kind, key, b.lvl)), x + 8, y + 8, 13, b.damaged ? C.dim : C.good, 'left', true); y += 18; }
    const nextName = b.lvl < STAGES ? D.stages[b.lvl] : tr('city_work_embel', { n: em + 1 });
    y = section(b.lvl < STAGES ? tr('city_work_next', { name: nextName }) : nextName, x, y + 6, w);
    for (const key in wk.gives) {
      const add = workGives(b.kind, key, b.lvl + 1) - workGives(b.kind, key, b.lvl);
      if (add) { text('+ ' + bonusText(key, workGives(b.kind, key, b.lvl + 1)), x + 8, y + 8, 12, C.dim, 'left'); y += 17; }
    }
    const c = stageCost(b), can = Village.canAfford(c) && !b.damaged;
    y = costRows(c, x, y + 4, w);
    UI.button(x, y, w, 36, b.lvl < STAGES ? tr('city_work_build', { name: nextName }) : tr('city_work_embel_do'), () => advance(b), { primary: can, disabled: !can, size: 14, icon: 'icon.build' });
    Tuto.mark('city:work', x, y, w, 36);
    return y + 44;
  }
  /** The body of a monument's « Chantier » tab in its building panel. Returns the y under it. */
  function worksTab(b, x, y, w) {
    y = UI.wrap(B[b.kind].desc, x, y, w, 13, C.dim, 17) + 6;
    return workBody(b, x, y, w);
  }
  /** The panel's Chantiers tab: the three monuments, closed, to found, or under way. */
  function worksBody(x, y, w) {
    y = UI.wrap(tr('city_works_help'), x, y, w, 12, C.dim, 16) + 4;
    for (const k of WORKS) {
      const d = B[k], b = monument(k);
      y = section(d.name, x, y + 4, w);
      if (b) {
        UI.button(x + w - 130, y, 130, 26, tr('city_work_see'), () => { const r = World.bRect(b); Object.assign(state.cam, World.camOn(r.mcx, r.mcy)); ui.sel = b.uid; ui.panel = 'building'; }, { size: 12 });
        text(b.lvl <= STAGES ? D.stages[b.lvl - 1] : tr('city_embel_n', { n: b.lvl - STAGES }), x, y + 13, 13, C.text, 'left', true);
        y = workBody(b, x, y + 32, w);
      } else if (!Village.isUnlocked(k)) {
        for (const p of Quests.describe(d.unlock)) y = check(p.ok, p.text, x, y, w);
        y = UI.wrap(d.desc, x, y, w, 12, C.dim, 16) + 2;
      } else {
        const c = Village.cost(k);
        y = UI.wrap(tr('city_work_place_help'), x, y, w, 12, C.dim, 16);
        y = costRows(c, x, y + 2, w);
        UI.button(x, y, w, 34, tr('city_work_place'), () => { Object.assign(ui, { bar: 'works', placing: k, tool: null, moving: null, panel: null, sel: null }); }, { primary: Village.canAfford(c), size: 14, icon: 'icon.build' });
        Tuto.mark('city:found', x, y, w, 34);
        y += 42;
      }
    }
    return y;
  }
  /** The Héritage tab: the Renown, what a new start would give now, and the tree of permanent bonuses. */
  function legacyBody(x, y, w) {
    const p = state.prestige, free = points(), gain = Village.renownGain(), extra = Math.min(gain, renownBonus());
    UI.plate(x, y, w, 48);
    UI.label(tr('city_renown', { n: p.renown }), x + 14, y + 17, 16, C.gold, 'left');
    text(tr('city_renown_free', { n: free, pct: Math.round(p.renown * tune.renown_bonus * 100) }), x + 14, y + 35, 12, free > 0 ? C.good : C.dim, 'left', true);
    y = section(tr('city_ns_title'), x, y + 56, w);
    y = UI.wrap(gain > 0 ? tr('city_ns_gain', { n: gain, gold: gain - extra, rank: extra }) : tr('city_ns_none'), x, y, w, 13, gain > 0 ? C.good : C.dim, 17);
    y = UI.wrap(tr('city_ns_keep'), x, y + 2, w, 12, C.dim, 16);
    const st = startStocks(), keys = Object.keys(st);
    if (keys.length) y = UI.wrap(tr('city_ns_stock', { list: keys.map(r => fmt(st[r]) + ' ' + lower(RES[r].name)).join(', ') }), x, y, w, 12, C.text, 16);
    const armed = ui.cityArm > state.t, raid = !!state.raid.active;
    UI.button(x, y + 6, w, 36, tr(armed ? 'city_ns_sure' : 'city_ns_do'), () => { if (!armed) { ui.cityArm = state.t + 4; return; } ui.cityArm = 0; if (Village.newStart()) ui.panel = null; },
      { size: 14, primary: armed, disabled: gain < 1 || raid, tip: raid ? tr('city_ns_raid') : null });
    Tuto.mark('city:newstart', x, y + 6, w, 36);
    y = UI.wrap(tr('city_legacy_help'), x, y + 50, w, 12, C.dim, 16);
    let branch = null, marked = false;
    const depth = n => { let d = 0, a = n.after; while (a && d < 6) { d++; const up = LEG.find(q => q.id === Object.keys(a)[0]); a = up && up.after; } return d; };
    for (const n of LEG) {
      if (n.branch !== branch) { branch = n.branch; y = section(DATA.legacyBranches[branch], x, y + 6, w); }
      const lvl = nodeLevel(n), open = nodeOpen(n), max = lvl >= n.max, cost = nodeCost(n), dx = depth(n) * 14, nx = x + dx, nw = w - dx - 74;
      if (dx) { ctx.fillStyle = C.lineL; ctx.fillRect(nx - 9, y - 2, 1, 12); ctx.fillRect(nx - 9, y + 9, 6, 1); } // the branch it grows from
      text(n.name, nx, y + 9, 13, open ? C.text : C.dim, 'left', true);
      text(tr('city_node_lvl', { n: lvl, max: n.max }), nx + UI.width(n.name, 13, true) + 8, y + 10, 12, max ? C.gold : C.dim, 'left', true);
      const says = v => n.stock ? Object.keys(n.stock).map(r => fmt(n.stock[r] * v) + ' ' + lower(RES[r].name)).join(', ') : bonusText(n.key, n.per * v);
      const line = !open ? tr('city_node_need', { list: Object.keys(n.after).map(k => tr('city_node_req', { name: LEG.find(q => q.id === k).name, n: n.after[k] })).join(', ') })
        : lvl ? says(lvl) : tr('city_node_none') + ' · ' + says(1);
      const by = y;
      y = Math.max(UI.wrap(line, nx, y + 18, nw, 12, !open ? C.bad : lvl ? C.good : C.dim, 15), by + 36) + 4;
      if (max) text(tr('city_node_max'), x + w, by + 18, 12, C.gold, 'right', true);
      else {
        UI.button(x + w - 66, by + 2, 66, 30, '+1 · ' + cost, () => learn(n), { size: 13, primary: open && free >= cost, disabled: !open || free < cost, tip: tr('city_node_tip', { name: n.name, desc: n.desc + ' ' + says(lvl + 1) + '.', cost }) });
        if (!marked && open) { marked = true; Tuto.mark('city:legacy', x + w - 66, by + 2, 66, 30); }
      }
    }
    return y;
  }

  /** ?demo=1: a believable mid-game city for the demo village: a Ville, two orders running and one on its way, a cathedral with its walls, some Renown spent. ?crank=3 sets another rank, ?ctab=taxes the panel's tab. */
  function demo() {
    const c = state.city, h = DATA.map.hall, q = params.get('crank');
    Object.assign(c, { rank: q != null ? Math.max(0, Number(q) | 0) : 2, pop: 46, done: 17, raids: 6, camps: 0 });
    c.log = [{ n: 2.3, why: tr('city_why_order') }, { n: 2.4, why: tr('city_why_raid') }, { n: 1.6, why: tr('city_why_game') }, { n: -4, why: tr('city_why_raidlost') }, { n: 0.8, why: tr('city_why_battle') }];
    c.tax.artisan = 0; c.tax.merchant = 2;
    const tx = h.x + 15, ty = h.y + 1; // the cathedral, outside the east rampart
    for (let y = 0; y < B.cathedral.h; y++) for (let x = 0; x < B.cathedral.w; x++) Village.clearTile(tx + x, ty + y);
    let b = Village.place('cathedral', tx, ty, true, true);
    if (!b && !monument('cathedral')) { b = { uid: state.nextUid++, kind: 'cathedral', x: tx, y: ty, lvl: 1, prog: 0 }; state.buildings.push(b); Village.stamp(b, b.uid); Village.touchTown(); } // under the fog: it stands all the same
    if (b) { b.lvl = 2; b.stage = 2; c.works.cathedral = 2; Explore.reveal((tx + 2) * 16, (ty + 2) * 16, 8); }
    const ws = Number(params.get('works')); // ?works=3: the three monuments side by side at that level, and the view on them
    if (ws > 0) {
      for (const [k, dx, dy] of [['castle', 20, 0], ['lighthouse', 15, 6]]) {
        for (let y = 0; y < B[k].h; y++) for (let x = 0; x < B[k].w; x++) Village.clearTile(h.x + dx + x, h.y + dy + y);
        Village.place(k, h.x + dx, h.y + dy, true, true);
      }
      for (const k of WORKS) { const m = monument(k); if (m) { m.lvl = ws; m.stage = Math.min(STAGES, ws); c.works[k] = ws; } }
      Object.assign(state.cam, World.camOn((h.x + 19) * 16, (h.y + 4) * 16));
    }
    Object.assign(state.prestige, { renown: Math.max(state.prestige.renown, 14), tree: { out: 2, stock: 1, xp: 1 } });
    state.prestige.spent = spentOn(state.prestige.tree);
    state.stats.goldEarned = Math.max(state.stats.goldEarned, 64000);
    cache = null; watch();
    c.orders = [draw() || { wait: 20 }, { wait: 0 }, { wait: 48 }];
    c.orders[1] = draw() || { wait: 20 };
    const o = c.orders[0];
    if (o.kind && o.kind !== 'deliver') o.have = o.n; else if (o.kind) state.res[o.res] = Math.max(state.res[o.res], o.n + 20);
    if (TABS.some(t => t[0] === params.get('ctab'))) ui.ctab = params.get('ctab');
    watch();
  }

  return {
    fresh, adopt, sync, tick, demo, event, gainPop, popularity, rank, rankName, bonus,
    taxMult, mealSat, satMax, housedBonus, buyMult, sellMult, outMult, raiseSteps, describe,
    drawHud, drawPanel, worksTab, taxTab,
    stageCost, advance, proclaim, canProclaim, honour, refuse, learn, startStocks, renownBonus, points, openPanel, royalWon,
  };
})();
