// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Every enemy kind, and the raids. To add an enemy: add an entry, a battle sprite and a small
// map sprite. A new way of fighting (pattern) is added in js/battle.js: planIntent, intentOf, intentInfo and foeAct.
//
//   sprite, icon   the battle sprite and the small one (map, turn strip)
//   battle         { hp, atk, def, xp, gold, pattern }; each enemy acts once a turn, after the hero's cards (spd is no longer read)
//                    pattern: double  (two quick hits a turn)
//                             charge  (hit, raise the weapon, then an announced heavy blow)
//                             support (heals the weakest ally, or a hex that ignores defence)
//                             boss    (charge, plus one summon and one rage)
//                             breaker, hexer, swift: the warlords' own (DATA.warlords, below)
//                    call: who a chief whistles for when he is hurt (boss and warlords; a goblin when left out)
//   raid           on the road: { hp, speed (px/s), armor (removed from each arrow), wallDps, gold,
//                    unitDps (damage a second to a soldier who bars his way),
//                    heal (hp/s to raiders within `aura` px) }; left out, it never raids
//   figure         the map figure it wears until its own sheet (iso.unit.<id>) exists (js/raid.js drawFigure)
//   alt            the battle sprite it wears until its own (`sprite`) exists (js/battle.js)
window.DATA = window.DATA || {};

DATA.enemies = {
  gobelin: {
    name: 'Gobelin chapardeur', sprite: 'enemy.gobelin', icon: 'unit.gobelin',
    how: 'Rapide : deux petits coups par tour, donc deux parades.',
    battle: { hp: 24, atk: 4.5, def: 0, xp: 8, gold: 5, pattern: 'double' },
    raid: { hp: 14, speed: 26, armor: 0, wallDps: 6, unitDps: 3, gold: 2 },
  },
  brute: {
    name: 'Brute cuirassée', sprite: 'enemy.brute', icon: 'unit.brute',
    how: 'Lente et blindée. Lève sa massue, puis frappe terriblement au tour suivant : Garde, parade, ou faites-lui perdre son tour.',
    battle: { hp: 90, atk: 12, def: 4, xp: 25, gold: 15, pattern: 'charge' },
    raid: { hp: 70, speed: 13, armor: 2, wallDps: 20, unitDps: 9, gold: 8 },
  },
  chaman: {
    name: 'Chaman des Ronces', sprite: 'enemy.chaman', icon: 'unit.chaman',
    how: 'Soigne ses alliés ; son maléfice traverse l’armure et la Garde : seule la parade l’arrête. À abattre en premier.',
    battle: { hp: 48, atk: 8, def: 1, xp: 20, gold: 12, pattern: 'support' },
    raid: { hp: 30, speed: 18, armor: 0, wallDps: 3, unitDps: 2, gold: 6, heal: 3, aura: 36 },
  },
  grakk: {
    name: 'Grakk le Fendeur', sprite: 'enemy.grakk', icon: 'unit.grakk', boss: true,
    how: 'Chef de guerre. Son fendoir tombe un tour après avoir été levé ; blessé, il appelle un gobelin, puis enrage.',
    battle: { hp: 340, atk: 20, def: 8, xp: 120, gold: 150, pattern: 'boss' },
  },
  // A warlord on the map: the chief who marches with a siege's column when the hero did not beat him
  // in a duel, and the chief of every camp that rises after one fell. One figure for all of them;
  // who he is (name, trait) is in DATA.warlords and DATA.camp.chiefs. Health and blows grow with his
  // level (config.js warlord_growth); `scale`: how much bigger he is drawn while he wears a stand-in.
  warlord: {
    name: 'Chef de guerre', icon: 'unit.grakk', figure: 'grakk', scale: 2,
    raid: { hp: 420, speed: 12, armor: 1, wallDps: 30, unitDps: 10, gold: 30 },
  },
};

// The warlords who lead the sieges (js/raid.js), in the order they come; after the last one the
// first comes back, stronger: his level is the number of sieges already seen (config.js
// warlord_duel_growth for the duel, warlord_growth on the map).
//   name, title    who he is: "Morgash", "le Briseur de murs"
//   trait          one line for the player: what he changes in the siege; `short`: the same in a few words, for the HUD
//   prize          what the hero brings back from the duel, on top of the warlord's own gold and experience
//   how            how he fights the hero in the duel (the note over his head, as for every enemy)
//   siege          what his column gets, all optional:
//                    wall  x how fast raiders break walls and buildings
//                    heal  x what shamans heal            speed  x how fast raiders walk
//                    hp    x raiders' health              add    { kind: n } more raiders of that kind
//   battle         his numbers in the duel, as for every enemy; pattern:
//                    breaker (a blow that shatters the Garde, then the charge)
//                    hexer   (hexes, and mends herself)
//                    boss    (the charge; `call` names who he whistles for)
//                    swift   (two and three quick blows a turn)
DATA.warlords = [
  { id: 'morgash', name: 'Morgash', title: 'le Briseur de murs',
    trait: 'Ses pillards abattent remparts et bâtiments deux fois plus vite.',
    how: 'Son marteau fracasse la Garde avant de frapper : seule la parade arrête ce coup-là. Puis il le lève pour un coup terrible.',
    short: 'Ses pillards brisent les murs 2× plus vite.', prize: { shard: 1 },
    siege: { wall: 2 },
    battle: { hp: 210, atk: 13, def: 5, xp: 60, gold: 90, pattern: 'breaker' } },
  { id: 'zhara', name: 'Zhara', title: 'la Ronce-mère',
    trait: 'Deux chamans de plus dans sa colonne, et leurs soins sont doublés.',
    how: 'Ses maléfices traversent la Garde et l’armure. Blessée, elle se soigne et appelle un chaman : frappez fort, sans relâche.',
    short: 'Deux chamans de plus, aux soins doublés.', prize: { shard: 1 },
    siege: { heal: 2, add: { chaman: 2 } },
    battle: { hp: 170, atk: 11, def: 2, xp: 60, gold: 90, pattern: 'hexer', call: 'chaman' } },
  { id: 'urgak', name: 'Urgak', title: 'le Meneur de brutes',
    trait: 'Trois brutes cuirassées de plus marchent devant lui.',
    how: 'Lève son fendoir, puis l’abat. Blessé, il siffle une brute, puis enrage.',
    short: 'Trois brutes de plus en tête de colonne.', prize: { shard: 1 },
    siege: { add: { brute: 3 } },
    battle: { hp: 240, atk: 14, def: 6, xp: 60, gold: 90, pattern: 'boss', call: 'brute' } },
  { id: 'skrit', name: 'Skrit', title: 'la Lame vive',
    trait: 'Sa colonne court : tous ses pillards vont un quart plus vite.',
    how: 'Deux coups, puis trois, sans répit : autant de parades. Peu d’armure : chaque riposte compte.',
    short: 'Toute sa colonne va un quart plus vite.', prize: { shard: 1 },
    siege: { speed: 1.25 },
    battle: { hp: 180, atk: 12, def: 1, xp: 60, gold: 90, pattern: 'swift' } },
];
// Each warlord is also an enemy of the card battle, under his own id (?scene=battle&foes=morgash&boss).
for (const w of DATA.warlords) {
  DATA.enemies[w.id] = { name: `${w.name} ${w.title}`, sprite: 'enemy.warlord', alt: 'enemy.grakk', icon: 'unit.grakk', boss: true, warlord: true, how: w.how, battle: w.battle };
}

// The elite raids (js/raid.js): from the city rank config.js elite_rank, every raid (a siege too) comes
// with one of these scourges, more as the city keeps rising (elite_more_every, elite_max). Drawn at
// the horn, so the defence can be changed before the column leaves.
//   name, short, trait   what it is called, in a few words for the HUD, in a sentence for its tip
//   tint         the colour laid over its raiders on the map (none: drawn as usual)
//   burn         each raider sets fire to the first production building he passes by (config.js elite_burn_max a raid)
//   armor        + this to every raider's armor        speed, gap   x their speed, x the time between two leaving the camp
//   size         x how many come                       split  half the column comes out somewhere else, on another side
DATA.elites = [
  { id: 'fire', name: 'Incendiaires', tint: '#ff5a1f', burn: true,
    short: 'Ils brûlent les ateliers qu’ils frôlent.',
    trait: 'Chaque pillard met le feu au premier bâtiment de production qu’il longe. Tenez-les loin des ateliers : remparts, tours, soldats en avant.' },
  { id: 'armor', name: 'Blindés', tint: '#7fa8d6', armor: 2,
    short: 'Armure +2 : il faut percer.',
    trait: 'Chaque pillard porte 2 points d’armure de plus : les flèches des tours de guet glissent. Tours de mage, pièges et soldats font la différence.' },
  { id: 'swift', name: 'Coureurs', tint: '#d4e83a', speed: 1.35, gap: 0.5,
    short: 'Plus rapides, en rangs serrés.',
    trait: 'La colonne court un tiers plus vite et sort du camp en rangs serrés : les tours ont moins de temps pour tirer.' },
  { id: 'horde', name: 'Horde', size: 1.5,
    short: 'Moitié plus nombreux.',
    trait: 'Une colonne moitié plus nombreuse que d’habitude.' },
  { id: 'flank', name: 'Deux fronts', split: true,
    short: 'Deux colonnes, deux côtés.',
    trait: 'La moitié des pillards prend un autre chemin et arrive par un autre côté du village.' },
];

// Raids: who comes, raid by raid. After the last line, each further raid adds `each` (fractions add up).
DATA.raids = {
  waves: [
    { gobelin: 6 },
    { gobelin: 8 },
    { gobelin: 7, brute: 1 },
    { gobelin: 9, brute: 1, chaman: 1 },
    { gobelin: 9, brute: 2, chaman: 1 },
  ],
  each: { gobelin: 2, brute: 0.5, chaman: 0.34 },
};

// The goblin camp's garrison (js/camp.js): who guards the first camp, who joins the garrison of each
// new camp that rises after one has fallen, and what the fallen camp leaves (times the camps already
// fallen + 1; its gold is config.js camp_loot_gold). Every camp after the first has a chief of its
// own (the `warlord` figure above, config.js camp_chief_*): `chiefs` are their names, one per camp,
// the list starting again after the last.
DATA.camp = {
  guards: ['brute', 'gobelin', 'gobelin', 'gobelin'],
  each: ['gobelin', 'brute', 'chaman'],
  loot: { wood: 60, stone: 40, shard: 1 },
  chiefs: ['Brok le Borgne', 'Varka Dent-de-fer', 'Ghuz le Gras', 'Nazra la Cendrée', 'Oth le Sourd', 'Rikka Sans-oreille'],
};
