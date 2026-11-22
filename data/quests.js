// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The main story by chapters, the side quests, the idle missions and the endless contracts.
// To add a chapter: add an object to DATA.chapters. Nothing else changes: the game goes on after
// the last quest of the last chapter.
//
// A quest:
//   type       objective (done by itself when `goal` is met) | battle (fight `encounter`) | deliver (hand over `goal.res`)
//   goal       conditions, all needed (js/quests.js): totals {res: n} | built {id: n} | equip slot |
//              pop n | raidsWon n | heroLvl n | quest id | weaponTier n | res {res: n}
//   requires   conditions to be allowed to start it
//   encounter  enemy ids (data/enemies.js), left to right, three at most
//   reward     { xp, gold, res: {...} }
//   startRaids true: finishing it starts the raid countdown
//   hint       one line under the title while it is the current quest
window.DATA = window.DATA || {};

DATA.chapters = [
  {
    id: 'ch0', title: 'Prologue : la clairière',
    quests: [
      { id: 'p1', title: 'Du bois !', type: 'objective', goal: { totals: { wood: 5 } },
        hint: 'Cliquez sur un arbre pour couper du bois.',
        text: "Aubeval n'est qu'une clairière et un hôtel de ville. Tout commence par du bois.", reward: { xp: 2 } },
      { id: 'p2', title: 'Un bûcheron', type: 'objective', goal: { built: { lumber_hut: 1 } },
        hint: 'Cliquez la carte « Bûcheron » en bas, puis une case libre au bord d’un chemin pavé : un bâtiment loin des chemins ne travaille pas.',
        text: 'Une cabane, et le bois arrivera sans vous.', reward: { xp: 2 } },
      { id: 'p3', title: 'Des planches', type: 'objective', goal: { built: { sawmill: 1 } },
        hint: 'Posez une Scierie : elle transforme le bois en planches.',
        text: 'Le bois brut ne suffit pas : il faut des planches.', reward: { xp: 2 } },
      { id: 'p4', title: 'Le feu de la forge', type: 'objective', goal: { built: { forge: 1 } },
        hint: 'Posez la Forge (8 planches).',
        text: 'Avec des planches, on bâtit une forge. Avec une forge, on arme {g:un héros|une héroïne}.', reward: { xp: 2 } },
      { id: 'p5', get title() { return 'Une lame pour ' + heroName(); }, type: 'objective', goal: { equip: 'weapon' },
        hint: "Cliquez la Forge, forgez la Lame d'apprenti, puis équipez-la (H).",
        get text() { return heroName() + ' attend devant la porte, les mains vides.'; }, reward: { xp: 2 } },
    ],
  },
  {
    id: 'ch1', title: 'Chapitre 1 : les Ronces Noires',
    quests: [
      { id: 'm1', title: 'Les chapardeurs', type: 'battle', encounter: ['gobelin', 'gobelin'],
        requires: { equip: 'weapon' }, startRaids: true,
        hint: 'Ouvrez les quêtes (J) et partez au combat.',
        text: 'Deux gobelins rôdent autour des réserves. La lame neuve va servir.',
        reward: { xp: 20, gold: 20 } },
      { id: 'm2', title: 'Tenir le village', type: 'objective', goal: { raidsWon: 1 },
        hint: 'Repoussez un raid : tours de guet et remparts sur la route du camp gobelin, {g:héros|héroïne} au village.',
        text: 'Les gobelins reviendront en bande, toujours de leur camp dans les Ronces. Une corne sonnera avant leur arrivée : défendez la route qui en vient.',
        reward: { xp: 25, gold: 40 } },
      { id: 'm3', title: 'La piste des brutes', type: 'battle', encounter: ['brute', 'gobelin'],
        requires: { pop: 8 },
        hint: 'Il faut 8 habitants pour monter l’expédition. Quand la brute lève sa massue, gardez vos cartes de Garde pour le tour suivant, ou parez pile à l’impact.',
        text: 'Les pillards ont un camp dans les Ronces. Une brute cuirassée en garde l’entrée.',
        reward: { xp: 30, gold: 50, res: { shard: 1 } } },
      { id: 'm4', title: 'Le chaman des Ronces', type: 'battle', encounter: ['gobelin', 'chaman', 'gobelin'],
        requires: { pop: 12 },
        hint: 'Il faut 12 habitants. Le chaman soigne les siens : abattez-le d’abord.',
        text: 'Au cœur du camp, un chaman bénit les lames des pillards.',
        reward: { xp: 40, gold: 70, res: { shard: 1 } } },
      { id: 'm5', title: 'Grakk le Fendeur', type: 'battle', encounter: ['grakk'], boss: true,
        requires: { quest: 'm4' },
        hint: 'Conseillé : une arme du deuxième palier, une armure, une Boulangerie (Ration) et des bûcherons (le Coup de cognée fend son armure).',
        text: 'Le chef de guerre des Ronces sort enfin de sa tanière, son fendoir sur l’épaule.',
        reward: { xp: 80, gold: 200, res: { shard: 3 } } },
    ],
  },
];

DATA.sideQuests = [
  { id: 's1', title: 'Du pain pour les bûcherons', type: 'deliver', goal: { res: { bread: 20 } },
    requires: { pop: 8 },
    text: 'Les bûcherons réclament du vrai pain. Livrez 20 pains à la cantine.',
    reward: { xp: 30, gold: 60 } },
  { id: 's2', title: 'Les pilleurs du vieux pont', type: 'battle', encounter: ['gobelin', 'gobelin', 'gobelin'],
    requires: { quest: 'm2' },
    text: 'Trois gobelins rançonnent les colporteurs au vieux pont.',
    reward: { xp: 25, gold: 50, res: { planks: 30 } } },
];

// Idle missions: the hero leaves for `time` seconds (he is not at the village for a raid, and takes
// no quest), then comes back with the reward. drops: [{ res, n, chance }].
DATA.missions = [
  { id: 'patrol', title: 'Patrouille des lisières', time: 30, cost: {}, requires: { quest: 'm1' },
    reward: { xp: 12, gold: 8 }, drops: [{ res: 'wood', n: 10, chance: 1 }],
    text: 'Un tour des lisières. Sans risque, sans gloire.' },
  { id: 'ruins', title: 'Fouille des ruines englouties', time: 90, cost: { bread: 10 }, requires: { quest: 'm2' },
    reward: { xp: 35, gold: 25 }, drops: [{ res: 'shard', n: 1, chance: 0.6 }],
    text: 'Les vieilles pierres gardent parfois des éclats runiques.' },
  { id: 'caravan', title: 'Escorte de caravane', time: 240, cost: { bread: 25 }, requires: { quest: 'm3' },
    reward: { xp: 90, gold: 120 }, drops: [{ res: 'stone', n: 40, chance: 1 }, { res: 'shard', n: 1, chance: 0.3 }],
    text: "Quatre minutes de route jusqu'au gué, et autant de pierre en paiement." },
];

// Contracts: battles that can be fought again and again. Each win raises the contract's tier:
// enemies and pay grow by config.js contract_scale. This is the endless climb.
DATA.contracts = [
  { id: 'c1', title: 'Prime : meute gobeline', encounter: ['gobelin', 'gobelin', 'gobelin'],
    requires: { quest: 'm2' }, reward: { xp: 18, gold: 25 },
    text: 'Il y a toujours une meute de plus dans les Ronces.' },
  { id: 'c2', title: 'Prime : escouade de guerre', encounter: ['brute', 'chaman', 'gobelin'],
    requires: { quest: 'm4' }, reward: { xp: 45, gold: 70, res: { shard: 1 } },
    text: 'Une brute, son chaman et leur éclaireur.' },
  { id: 'c3', title: 'Prime : le retour de Grakk', encounter: ['grakk'], boss: true,
    requires: { quest: 'm5' }, reward: { xp: 120, gold: 250, res: { shard: 2 } },
    text: 'On le dit mort. Il revient, plus fort.' },
];
