// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The hero's deck, read from the village: which cards he can bring (data/cards.js), how many of
// each, how strong, which ones the player left at home, and each card's text and picture.
'use strict';

const Cards = (() => {
  const D = DATA.cards, B = DATA.buildings;
  const whole = v => Math.max(1, Math.round(v));

  /** The undamaged buildings of a kind: how many, the highest level among them, and that building. */
  function source(kind) {
    let n = 0, lvl = 0, best = null;
    for (const b of state.buildings) if (b.kind === kind && !b.damaged) { n++; if ((b.lvl || 1) > lvl) { lvl = b.lvl || 1; best = b; } }
    return { n, lvl, best };
  }
  /**
   * Every card the hero could bring right now, in DATA.cardOrder:
   * { id, c (its data), copies, lvl (of its building; 0 for his own), pow (its numbers' multiplier), benched }.
   */
  function pool() {
    const out = [], bench = state.hero.bench || {};
    for (const id of DATA.cardOrder) {
      const c = D[id];
      if (c.from === 'hero') { if (state.hero.lvl >= c.lvl) out.push({ id, c, copies: c.copies || 1, lvl: 0, pow: 1, benched: !!bench[id] }); continue; }
      const s = source(c.from);
      if (!s.n) continue;
      out.push({ id, c, copies: Math.min(c.max || 1, s.n) * (c.copies || 1), lvl: s.lvl, pow: 1 + (s.lvl - 1) * tune.card_level_step, benched: !!bench[id] });
    }
    return out;
  }
  const size = () => pool().reduce((n, e) => n + (e.benched ? 0 : e.copies), 0);
  /** The deck for a battle: one object per copy, in the list's order (the battle shuffles it). */
  function deck() {
    const out = [];
    for (const e of pool()) if (!e.benched) for (let i = 0; i < e.copies; i++) out.push({ id: e.id, c: e.c, pow: e.pow, lvl: e.lvl });
    return out;
  }
  /** Leaves a card at home, or takes it back. Refused (false) when the deck would fall under config.js deck_min. */
  function toggle(id) {
    const h = state.hero, e = pool().find(x => x.id === id);
    if (!e) return false;
    h.bench = h.bench || {};
    if (h.bench[id]) { delete h.bench[id]; return true; }
    if (size() - e.copies < tune.deck_min) return false;
    h.bench[id] = true; return true;
  }
  /** Where a card comes from, in words: "Forge · niv. 2", or the hero's name. */
  function origin(e) { return e.c.from === 'hero' ? heroName() : (e.lvl > 1 ? tr('card_origin_lvl', { card: B[e.c.from].card, n: e.lvl }) : B[e.c.from].card); }

  /**
   * What a card does, one short line per effect, with its numbers as they are now.
   * st: { atk, def, max } of the hero (in battle: with his buffs).
   */
  function lines(e, st) {
    const c = e.c, p = e.pow, out = [];
    if (c.dmg) { const d = whole(st.atk * c.dmg * p); out.push(tr(c.target === 'all' ? 'card_dmg_all' : 'card_dmg', { d: c.hits > 1 ? `${c.hits} × ${d}` : d })); }
    if (c.flat) { const d = whole(c.flat * p); out.push(c.target === 'random' ? tr('card_arrows', { n: c.hits || 1, d }) : tr(c.target === 'all' ? 'card_dmg_all' : 'card_dmg', { d })); }
    if (c.pierce) out.push(tr('card_pierce'));
    if (c.shred) out.push(tr('card_shred', { n: whole(c.shred * p) }));
    if (c.stun) out.push(tr('card_stun'));
    if (c.weak) out.push(tr('card_weak', { n: c.weak }));
    if (c.block || c.blockDef) out.push(tr('card_block', { n: whole((c.block || 0) * p + (c.blockDef || 0) * st.def) }));
    if (c.thorns) out.push(tr('card_thorns', { n: whole(c.thorns * p) }));
    if (c.heal) out.push(tr('card_heal', { n: whole(st.max * c.heal * p) }));
    if (c.draw) out.push(tr('card_draw', { n: c.draw }));
    if (c.energy) out.push(tr('card_energy', { n: c.energy }));
    if (c.buff) out.push(tr('card_buff', { pct: Math.round((c.buff.atk - 1) * 100), n: c.buff.turns }));
    if (c.bless) out.push(tr('card_bless'));
    if (c.wide) out.push(tr('card_wide'));
    if (c.ally) out.push(tr('card_ally', { dmg: whole(c.ally.dmg * p), n: c.ally.turns }));
    if (c.echo) out.push(tr('card_echo'));
    if (c.exhaust) out.push(tr('card_once'));
    return out;
  }
  /** The longer words behind a card's short lines: what its keywords mean, its flavour, where it comes from. */
  function tip(e, st) {
    const c = e.c, notes = [];
    if (c.block || c.blockDef) notes.push(tr('card_note_block'));
    if (c.thorns) notes.push(tr('card_note_thorns'));
    if (c.stun) notes.push(tr('card_note_stun'));
    if (c.bless) notes.push(tr('card_note_bless'));
    if (c.wide) notes.push(tr('card_note_wide'));
    if (c.echo) notes.push(tr('card_note_echo'));
    if (c.pay) notes.push(tr('card_note_pay', { list: Object.keys(c.pay).map(r => `${c.pay[r]} ${DATA.resources[r].name.toLowerCase()}`).join(', ') }));
    return `${c.name} · ${tr('card_cost', { n: c.cost })}\n${notes.join('\n')}${notes.length ? '\n' : ''}${c.flavor}\n${tr('card_from', { from: origin(e) })}`;
  }
  /**
   * The picture on a card: { sprite, frame, k (drawing scale: 1 = the world's pixel size), top }.
   * Its own illustration when the card names one that is loaded (`art`, a 62x29 sprite), else the
   * building as it stands in the village, or the hero with the sword he holds.
   */
  function picture(e) {
    if (e.c.art && Art.loaded(e.c.art)) return { sprite: e.c.art, frame: 0, k: 1, top: true };
    if (e.c.from === 'hero') return { sprite: 'hero.battle', frame: Hero.weaponTier(), k: 1, top: true };
    const s = source(e.c.from);
    return { sprite: B[e.c.from].sprite, frame: s.best ? World.frameOf(s.best) : 0, k: 0.5, top: false };
  }

  return { source, pool, size, deck, toggle, origin, lines, tip, picture };
})();
