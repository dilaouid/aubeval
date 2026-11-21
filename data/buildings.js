// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Every building and decoration, the land tools, and the build bar's tabs. To add a building or a
// decoration: add an entry here, add its id to a tab in DATA.buildTabs, and give it a sprite (a
// painter in js/art.js, or an image listed in assets/manifest.js).
//
//   name, card     full name, and the short one shown on the build bar
//   sprite         sprite id; its variants are the building's looks: 4 upgrade tiers (levels
//                  1, 5, 10, 15 with config.js milestone_levels = 5) for each style, in order
//   w, h           footprint in tiles
//   cost           base price; it grows by `growth` (or config.js cost_growth) per one already built
//   unlock         when its card opens: { built: {id: n} } | { pop: n } | { quest: id } | { rank: n } (see
//                  js/quests.js; rank: the city rank proclaimed, data/city.js)
//   pop            people it houses
//   produces, consumes, cycle    what one cycle makes and eats, and its length in seconds
//   tower          { range (tiles), dmg, rate (s), splash (px), pierce (ignores armour) }
//   wall           { hp }: raiders must break it or walk around it; drawn by sliding the pointer
//   decor          true: a decoration. One look, no level, no effect on the game; it stands in the
//                  middle of its tiles (no ground of its own in its image)
//   craft          true: the hero's gear is forged here (data/items.js)
//   unique         only one may stand
//   glow, smoke    the lit-window glow on the ground; [x, y] of the chimney top in the sprite, one per tier
//   styles         names of the looks the player picks from, for free (one set of 4 tiers each)
//   worker         'tree' | 'hall': where its villager walks to
//   keeper         the shopkeeper whose portrait stands by its panel (data/people.js DATA.keepers)
//   trade          true: resources are bought and sold here (data/people.js DATA.trade)
//   train          true: soldiers are trained here (data/people.js DATA.units, role 'soldier')
//   pausable       true: its production can be stopped from its panel (the market's imports cost gold)
//   service        { radius (tiles) }: the houses within reach of it have it (data/people.js classes `services`)
//   beauty         what it adds to the beauty of the houses around it (config.js beauty_radius): a
//                  decoration a lot, a workshop's noise and smoke takes some away (negative)
//   road           false: works without a path to the town hall. Left out, every building that
//                  works (produces, houses, serves, trades, forges, trains) needs one: a paved tile
//                  beside it, joined by paths to a paved tile beside the hall (js/village.js Roads)
//   looks          'class': a house's look follows its citizens' class, not its level (one look per class, per style);
//                  'one': a single look at every level (its tier looks are still to make);
//                  'stage': a great work's look follows the stage of its works (4 looks: foundations,
//                  walls, roof, finished)
//   monument       true: a great work (js/city.js). Placed like any building, which lays its
//                  foundations; its level is then the stage of the works, paid from its « Chantier »
//                  tab at the prices of data/city.js DATA.city.works, and every level after the
//                  fourth is an embellishment. What it gives the whole town is there too. It needs
//                  no path; demolished and built again, it comes back at the stage it had reached.
// A house (pop) also has a class: what it holds, pays and eats is in data/people.js DATA.classes.
window.DATA = window.DATA || {};

DATA.buildings = {
  hall: {
    name: 'Hôtel de ville', card: 'Hôtel de ville', sprite: 'iso.hall', w: 4, h: 3, fixed: true, glow: true, styles: ['Colombages', 'Pierre', 'Bois'], keeper: 'steward',
    cost: { wood: 30, planks: 15, gold: 10 }, // never built: its upgrades are priced from this (each level guards the stocks, config.js hall_guard_step)
    desc: "Le cœur d'Aubeval. Les pillards visent ses réserves.",
  },
  lumber_hut: {
    name: 'Cabane de bûcheron', card: 'Bûcheron', sprite: 'iso.lumber_hut', w: 2, h: 2,
    cost: { wood: 5 }, growth: 1.6, produces: { wood: 1 }, cycle: 1, worker: 'tree', glow: true, beauty: -1,
    desc: 'Un bûcheron coupe du bois sans vous.',
  },
  sawmill: {
    name: 'Scierie', card: 'Scierie', sprite: 'iso.sawmill', w: 3, h: 2,
    cost: { wood: 12 }, growth: 1.8, consumes: { wood: 2 }, produces: { planks: 1 }, cycle: 1.5,
    unlock: { built: { lumber_hut: 1 } }, worker: 'hall', glow: true, beauty: -2,
    desc: 'Scie le bois en planches.',
  },
  forge: {
    name: 'Forge', card: 'Forge', sprite: 'iso.forge', w: 2, h: 2,
    cost: { planks: 8 }, unique: true, craft: true, unlock: { built: { sawmill: 1 } }, glow: true, beauty: -1, smoke: [[26, 2], [26, 2], [26, 2], [27, 4]], keeper: 'smith',
    desc: 'Forge les armes et les armures du héros avec ce que le village produit.',
  },
  house: {
    name: 'Maison', card: 'Maison', sprite: 'iso.house', w: 2, h: 2, looks: 'class',
    cost: { wood: 20, planks: 6 }, growth: 1.09, pop: 4, produces: { gold: 1 }, cycle: 4,
    unlock: { quest: 'm1' }, glow: true, smoke: [[27, 2], [27, 2]], // one chimney per look; the townhouses' own are not marked
    styles: ['Colombages', 'Pierre', 'Bois'],
    desc: 'Loge des habitants qui paient un impôt en or. Nourris, servis et entourés de beauté, ils s’élèvent : Paysans, Artisans, Bourgeois, Négociants, Nobles, et la maison grandit avec eux.',
  },
  farm: {
    name: 'Ferme', card: 'Ferme', sprite: 'iso.farm', w: 3, h: 3,
    cost: { wood: 30, planks: 10 }, growth: 1.35, produces: { wheat: 1 }, cycle: 2,
    unlock: { pop: 4 }, glow: true, beauty: 0.5,
    desc: 'Cultive le blé.',
  },
  bakery: {
    name: 'Boulangerie', card: 'Boulangerie', sprite: 'iso.bakery', w: 2, h: 2,
    cost: { wood: 20, planks: 25 }, growth: 1.4, consumes: { wheat: 2 }, produces: { bread: 1 }, cycle: 3,
    unlock: { pop: 8 }, glow: true, smoke: [[52, 2], [52, 2], [55, 2], [50, 2]], keeper: 'baker',
    desc: 'Cuit le blé en pain : le besoin de toutes vos maisons, et les rations du héros.',
  },
  quarry: {
    name: 'Carrière', card: 'Carrière', sprite: 'iso.quarry', w: 3, h: 2,
    cost: { planks: 40, gold: 20 }, growth: 1.5, produces: { stone: 1 }, cycle: 2.5,
    unlock: { pop: 12 }, worker: 'hall', beauty: -3,
    desc: 'Taille la pierre, pour les armes du deuxième palier, les chapelles et les tours de mage. Bruyante : tenez-la loin des maisons.',
  },
  coffee_farm: {
    looks: 'one', name: 'Plantation de caféiers', card: 'Caféiers', sprite: 'iso.coffee_farm', w: 3, h: 3,
    cost: { wood: 60, planks: 30, gold: 60 }, growth: 1.4, produces: { beans: 1 }, cycle: 3,
    unlock: { pop: 24 }, beauty: 1,
    desc: 'Des rangées de caféiers aux cerises rouges : les grains que la brûlerie torréfie.',
  },
  roastery: {
    looks: 'one', name: 'Brûlerie', card: 'Brûlerie', sprite: 'iso.roastery', w: 2, h: 2,
    cost: { planks: 50, stone: 20, gold: 60 }, growth: 1.5, consumes: { beans: 2 }, produces: { coffee: 1 }, cycle: 4,
    unlock: { pop: 24 }, glow: true, beauty: -1,
    desc: 'Torréfie les grains en café : ce qu’il faut à vos paysans pour devenir artisans.',
  },
  cafe: {
    looks: 'one', name: 'Café', card: 'Café', sprite: 'iso.cafe', w: 2, h: 2,
    cost: { planks: 40, stone: 15, gold: 80 }, growth: 1.3, service: { radius: 10 },
    unlock: { pop: 24 }, glow: true, keeper: 'innkeeper', beauty: 1,
    desc: 'On s’y retrouve autour d’une tasse. Les maisons à sa portée ont leur café du coin : il le faut aux Artisans et au-dessus.',
  },
  chapel: {
    looks: 'one', name: 'Chapelle', card: 'Chapelle', sprite: 'iso.chapel', w: 2, h: 2,
    cost: { stone: 120, planks: 60, gold: 250 }, growth: 1.4, service: { radius: 14 },
    unlock: { cls: { artisan: 4 } }, glow: true, beauty: 3,
    desc: 'Une cloche et un vitrail. Les Bourgeois et au-dessus la veulent à portée de leur maison.',
  },
  market: {
    name: 'Marché', card: 'Marché', sprite: 'iso.market', w: 3, h: 3,
    cost: { planks: 60, stone: 30, gold: 80 }, growth: 1.8, trade: true, pausable: true, consumes: { gold: 5 }, produces: { spice: 1 }, cycle: 6,
    service: { radius: 14 }, unlock: { cls: { artisan: 4 } }, glow: true, keeper: 'merchant', beauty: 1,
    desc: 'Achetez et vendez vos réserves. Ses caravanes importent les épices des Bourgeois, et les Négociants le veulent à portée.',
  },
  sheep_farm: {
    looks: 'one', name: 'Bergerie', card: 'Bergerie', sprite: 'iso.sheep_farm', w: 3, h: 3,
    cost: { wood: 80, planks: 40, gold: 120 }, growth: 1.4, produces: { wool: 1 }, cycle: 4,
    unlock: { cls: { burgher: 4 } },
    desc: 'Des moutons et leur laine, pour l’atelier de tissage.',
  },
  weaver: {
    looks: 'one', name: 'Atelier de tissage', card: 'Tissage', sprite: 'iso.weaver', w: 2, h: 2,
    cost: { planks: 100, stone: 50, gold: 200 }, growth: 1.5, consumes: { wool: 2 }, produces: { cloth: 1 }, cycle: 6,
    unlock: { cls: { burgher: 4 } }, glow: true, beauty: -1,
    desc: 'Tisse la laine en étoffes, que réclament les Négociants.',
  },
  goldsmith: {
    looks: 'one', name: 'Orfèvre', card: 'Orfèvre', sprite: 'iso.goldsmith', w: 2, h: 2,
    cost: { stone: 200, planks: 100, gold: 800 }, growth: 1.6, consumes: { gold: 30, stone: 5 }, produces: { jewel: 1 }, cycle: 10,
    unlock: { cls: { merchant: 4 } }, glow: true,
    desc: 'Change l’or et la pierre fine en bijoux, le luxe des Nobles.',
  },
  barracks: {
    name: 'Caserne', card: 'Caserne', sprite: 'iso.barracks', w: 3, h: 2,
    cost: { wood: 40, planks: 25, gold: 20 }, unique: true, train: true, unlock: { quest: 'm1' }, keeper: 'captain', beauty: -1,
    desc: 'Forme vos habitants en soldats, à la file. Chaque niveau les rend plus forts. Un soldat tombé est perdu : il faut en former un autre.',
  },
  watchtower: {
    name: 'Tour de guet', card: 'Tour de guet', sprite: 'iso.watchtower', w: 1, h: 1,
    cost: { planks: 15, gold: 10 }, growth: 1.3, tower: { range: 5, dmg: 4, rate: 0.9 },
    unlock: { quest: 'm1' },
    desc: 'Un archer tire sur les pillards à portée. Les raids partent toujours du camp gobelin : postez vos tours sur leur route.',
  },
  palisade: {
    name: 'Palissade', card: 'Palissade', sprite: 'iso.palisade', w: 1, h: 1,
    cost: { wood: 6 }, growth: 1, wall: { hp: 60 },   // a rampart is many of them: the price never climbs
    unlock: { quest: 'm1' },
    desc: 'Un rempart se trace en glissant, autour de ce que vous voulez protéger. Les pillards doivent le briser ou le contourner : vos tours en profitent.',
  },
  mage_tower: {
    name: 'Tour de mage', card: 'Tour de mage', sprite: 'iso.mage_tower', w: 2, h: 2,
    cost: { stone: 60, planks: 60, gold: 150, shard: 1 }, growth: 1.5,
    tower: { range: 6, dmg: 10, rate: 1.6, splash: 28, pierce: true },
    unlock: { pop: 24 },
    desc: "Un éclair qui perce les armures et touche tout un groupe.",
  },

  // ---- Great works: one of each, opened by a city rank. `cost` lays the foundations; the stages
  // after them, the embellishments and what each gives are in data/city.js (DATA.city.works) ----
  cathedral: {
    name: 'Cathédrale', card: 'Cathédrale', sprite: 'iso.cathedral', w: 4, h: 4, monument: true, unique: true, looks: 'stage',
    cost: { stone: 600, planks: 400, gold: 1500 }, unlock: { rank: 2 }, beauty: 6,
    desc: 'Un chantier de plusieurs heures : fondations, murs, toiture, puis les flèches. Chaque étape rend les repas plus heureux et empêche la popularité du héros de tomber trop bas.',
  },
  castle: {
    name: 'Château', card: 'Château', sprite: 'iso.castle', w: 5, h: 5, monument: true, unique: true, looks: 'stage',
    cost: { stone: 2000, planks: 1200, gold: 5000 }, unlock: { rank: 3 }, beauty: 3,
    desc: 'Courtines, tours et donjon. Chaque étape met les réserves à l’abri des pillards et endurcit vos soldats.',
  },
  lighthouse: {
    name: 'Grand phare', card: 'Phare', sprite: 'iso.lighthouse', w: 3, h: 3, monument: true, unique: true, looks: 'stage',
    cost: { stone: 3000, planks: 2000, gold: 12000 }, unlock: { rank: 4 }, beauty: 4,
    desc: 'Sa lanterne guide les caravanes et les éclaireurs : meilleurs prix au Marché, vue plus loin dans le brouillard, expéditions plus courtes.',
  },

  // ---- Decorations: for the look only ----
  fountain: { beauty: 5, name: 'Fontaine', card: 'Fontaine', sprite: 'iso.decor.fountain', w: 2, h: 2, decor: true, growth: 1, cost: { stone: 30, gold: 40 }, desc: "Une fontaine de pierre où l'eau chante." },
  well: { beauty: 2, name: 'Puits', card: 'Puits', sprite: 'iso.decor.well', w: 1, h: 1, decor: true, growth: 1, cost: { stone: 12, wood: 8 }, desc: 'Un puits et son petit toit.' },
  statue: { beauty: 5, name: 'Statue', card: 'Statue', sprite: 'iso.decor.statue', w: 1, h: 1, decor: true, growth: 1, cost: { stone: 40, gold: 60 }, desc: "Un chevalier de pierre veille sur la place." },
  stall: { beauty: 1, name: 'Étal de marché', card: 'Étal', sprite: 'iso.decor.stall', w: 2, h: 2, decor: true, growth: 1, cost: { planks: 20, gold: 15 }, desc: 'Un étal rayé et ses cageots.' },
  lamp: { beauty: 1, name: 'Lampadaire', card: 'Lampadaire', sprite: 'iso.decor.lamp', w: 1, h: 1, decor: true, growth: 1, glow: true, cost: { planks: 4, gold: 6 }, desc: 'Une lanterne qui éclaire le chemin.' },
  banner: { beauty: 1, name: 'Bannière', card: 'Bannière', sprite: 'iso.decor.banner', w: 1, h: 1, decor: true, growth: 1, cost: { planks: 6, gold: 10 }, desc: "Les couleurs d'Aubeval, bleu et or." },
  bench: { beauty: 1, name: 'Banc', card: 'Banc', sprite: 'iso.decor.bench', w: 1, h: 1, decor: true, growth: 1, cost: { planks: 4 }, desc: 'Un banc de bois.' },
  flowers: { beauty: 1, name: 'Massif de fleurs', card: 'Fleurs', sprite: 'iso.decor.flowers', w: 1, h: 1, decor: true, growth: 1, cost: { gold: 4 }, desc: 'Des fleurs rouges, jaunes et blanches.' },
  barrels: { beauty: 0.5, name: 'Tonneaux', card: 'Tonneaux', sprite: 'iso.decor.barrels', w: 1, h: 1, decor: true, growth: 1, cost: { planks: 6 }, desc: 'Des tonneaux et une caisse.' },
  hedge: { beauty: 1, name: 'Haie', card: 'Haie', sprite: 'iso.decor.hedge', w: 1, h: 1, decor: true, growth: 1, cost: { wood: 4 }, desc: 'Une haie taillée au carré.' },
};

// The land tools of the Terrain tab. cost: for each tile. Planting a tree is a tool too, one per
// kind of tree that has a `plant` price in data/world.js (DATA.flora).
DATA.tools = {
  path: { name: 'Chemin pavé', card: 'Chemin', sprite: 'iso.tile.path', cost: { wood: 1 }, desc: 'Pave la case. Se trace en glissant. Chaque bâtiment qui travaille doit toucher un chemin relié à l’hôtel de ville. Rien ne se bâtit sur un chemin.' },
  clear: { name: 'Défricher', card: 'Défricher', sprite: 'tool.axe', desc: "Abat un arbre ou brise un rocher pour de bon : la case se libère et rend du bois ou de la pierre. Retire aussi un chemin." },
};

// The build bar: its tabs, and the cards of each, left to right. A card is a building's id,
// 'tool:<id>' (DATA.tools), 'plant:<flora id>' or 'trap:<id>' (data/people.js DATA.traps).
// A trap's card is only named here: it is looked up when the bar is drawn.
DATA.buildTabs = [
  { id: 'build', name: 'Production', items: ['lumber_hut', 'sawmill', 'forge', 'farm', 'bakery', 'quarry', 'coffee_farm', 'roastery', 'sheep_farm', 'weaver', 'goldsmith'] },
  { id: 'city', name: 'Habitat', items: ['house', 'cafe', 'chapel', 'market', 'tool:path'] },
  { id: 'defense', name: 'Défense', items: ['watchtower', 'palisade', 'mage_tower', 'barracks', 'trap:spikes', 'trap:tar', 'trap:powder'] },
  { id: 'works', name: 'Chantiers', items: ['cathedral', 'castle', 'lighthouse'] },
  { id: 'decor', name: 'Décor', items: ['fountain', 'well', 'statue', 'stall', 'lamp', 'banner', 'bench', 'flowers', 'barrels', 'hedge'] },
  { id: 'land', name: 'Terrain', items: ['tool:path', 'tool:clear'].concat(Object.keys(DATA.flora).filter(k => DATA.flora[k].plant).map(k => 'plant:' + k)) },
];

// Every building that can be built, in the tabs' order: what the unlocks are checked for.
DATA.buildOrder = DATA.buildTabs.flatMap(t => t.items.filter(k => DATA.buildings[k]));
