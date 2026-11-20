// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The hero's gear, forged at the Forge from the village's stock. To add a piece: add an entry.
//
//   slot       weapon | armor
//   tier       1, 2, 3...: the weapon's tier picks the sword the hero holds in battle (hero sprite frame)
//   atk, def, hp   what it adds
//   recipe     { cost, time (seconds at the forge) }
//   requires   when the recipe opens (same conditions as a building's unlock)
// Once forged, a piece can be reinforced (+1, +2...) at the forge without limit (config.js plus_*).
window.DATA = window.DATA || {};

DATA.items = {
  sword_1: {
    name: "Lame d'apprenti", slot: 'weapon', tier: 1, atk: 5,
    recipe: { cost: { planks: 6 }, time: 5 },
    desc: 'Une lame simple sur un manche de frêne. Elle double la force du héros.',
  },
  armor_1: {
    name: 'Pavois de chêne', slot: 'armor', tier: 1, def: 2, hp: 8,
    recipe: { cost: { planks: 14, wood: 20 }, time: 8 },
    desc: 'Un bouclier de planches cerclé de fer.',
  },
  sword_2: {
    name: "Épée d'acier d'Aubeval", slot: 'weapon', tier: 2, atk: 12,
    recipe: { cost: { planks: 40, stone: 30, shard: 2, gold: 30 }, time: 20 }, requires: { quest: 'm2' },
    desc: 'Trempée aux éclats runiques. Il la faut pour entamer Grakk.',
  },
  armor_2: {
    name: 'Cotte cloutée', slot: 'armor', tier: 2, def: 5, hp: 20,
    recipe: { cost: { planks: 30, stone: 40, gold: 40 }, time: 20 }, requires: { quest: 'm2' },
    desc: 'Cuir épais et clous de pierre : elle encaisse les coups terribles.',
  },
  sword_3: {
    name: 'Fendeuse runique', slot: 'weapon', tier: 3, atk: 24,
    recipe: { cost: { planks: 150, stone: 150, shard: 6, gold: 300 }, time: 45 }, requires: { quest: 'm5' },
    desc: 'Forgée dans le fer de Grakk. Ses runes brillent avant chaque coup.',
  },
  armor_3: {
    name: "Harnois de l'Aube", slot: 'armor', tier: 3, def: 11, hp: 50,
    recipe: { cost: { planks: 120, stone: 200, shard: 4, gold: 300 }, time: 45 }, requires: { quest: 'm5' },
    desc: "L'armure des gardiens d'Aubeval.",
  },
};
