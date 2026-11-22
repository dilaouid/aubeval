// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The people of the village: the classes its houses rise through, the workers and soldiers its
// citizens become, the traps laid during a raid, the market's prices and the shopkeepers whose
// portraits greet the player. Content only: the rules are in js/village.js (classes), js/units.js
// (workers, soldiers), js/raid.js (traps) and js/screens.js (the panels). The global knobs are in
// config.js (Citizens, Units, Trade, Raids).
window.DATA = window.DATA || {};

// The classes of citizens, lowest first. Every house starts in the first one and rises one class
// at a time, when its satisfaction is full, its street has what the next class asks for, and the
// player pays `raise` (the price to rise INTO this class). Its look follows its class: a cottage
// grows into a townhouse, then a merchant's house, then a mansion (data/buildings.js house.looks).
//   name, one    the class, and one of its members
//   pop          people a house of this class holds (+2 per house level)
//   tax          multiplies the house's gold (data/buildings.js house.produces)
//   needs        what one house eats every meal (config.js need_cycle seconds)
//   services     buildings (data/buildings.js `service`) that must stand within reach of the house,
//                joined to the town hall by a path: a house of this class missing one is unhappy
//   beauty       the least beauty its street must have (config.js beauty_radius) to rise into it
//   opens        what the village needs before any house may rise into this class (js/quests.js conditions)
//   flag         the colour of the pennant on its roof (a js/art.js PAL name); none for the first
//   rank         the city rank (data/city.js DATA.city.ranks, from 0) the town must have proclaimed
//                before any house may rise into this class: Hameau for the Artisans, Bourg for the
//                Bourgeois, Ville for the Négociants, Cité for the Nobles (js/city.js raiseSteps)
// The climb is paced by three things: the thresholds (`opens.cls`), the prices (`raise`) and the
// ranks. The Artisans stay where they were (the first half hour teaches them); each class after
// them asks for more houses of the class before, a higher price and a rank, so that the first
// Nobles come after five to six hours of play (the timeline aimed for is in data/city.js).
DATA.classes = [
  { id: 'peasant', name: 'Paysans', one: 'Paysan', pop: 4, tax: 1, needs: { bread: 1 }, services: [], rank: 0,
    desc: 'Ils demandent du pain. Bien nourris, ils paient plein impôt et peuvent s’élever.' },
  { id: 'artisan', name: 'Artisans', one: 'Artisan', pop: 6, tax: 2, needs: { bread: 1, coffee: 1 }, services: ['cafe'], flag: 'waterS',
    raise: { planks: 40, stone: 15, gold: 60 }, opens: { cls: { peasant: 8 } }, rank: 0,
    desc: 'Pain et café, et un Café au bout de la rue. Ils ouvrent la Chapelle et le Marché, et forment les archers.' },
  { id: 'burgher', name: 'Bourgeois', one: 'Bourgeois', pop: 8, tax: 4, needs: { bread: 2, coffee: 1, spice: 1 }, services: ['cafe', 'chapel'], flag: 'gold',
    raise: { planks: 150, stone: 120, gold: 450 }, opens: { cls: { artisan: 10 } }, rank: 1,
    desc: 'Pain, café et épices du Marché, un Café et une Chapelle à portée. Il leur faut un Bourg. Ils ouvrent la laine et le tissage, et arment les chevaliers.' },
  { id: 'merchant', name: 'Négociants', one: 'Négociant', pop: 10, tax: 7, needs: { bread: 2, coffee: 2, spice: 1, cloth: 1 }, services: ['cafe', 'chapel', 'market'], beauty: 4, flag: 'red',
    raise: { planks: 500, stone: 500, gold: 3000, cloth: 30 }, opens: { cls: { burgher: 12 } }, rank: 2,
    desc: 'Ajoutent les étoffes, veulent le Marché à portée et une rue plaisante (beauté 4). Il leur faut une Ville. Ils ouvrent l’Orfèvre.' },
  { id: 'noble', name: 'Nobles', one: 'Noble', pop: 12, tax: 12, needs: { bread: 2, coffee: 2, spice: 2, cloth: 1, jewel: 1 }, services: ['cafe', 'chapel', 'market'], beauty: 10, flag: 'violet',
    raise: { stone: 2500, planks: 1500, gold: 30000, jewel: 60 }, opens: { cls: { merchant: 14 }, popularity: 50 }, rank: 3,
    desc: 'Bijoux en plus, et une rue superbe (beauté 10) : fontaines, statues, arbres et fleurs. Il leur faut une Cité, et {g:un héros aimé|une héroïne aimée} de sa ville.' },
];

// What a citizen can become. One unit takes one citizen (a free inhabitant).
//   role       worker: works alone at his trade once trained · soldier: selected and ordered by the player
//   sprite     the walking sheet 'iso.unit.<sprite>' (assets/manifest.js); without one, the villager's
//   cost       paid when he is trained (workers: at once, from the People panel; soldiers: at the barracks, in `time` seconds)
//   unlock     when he can be trained (same conditions as a building's unlock, plus cls: { <class id>: houses })
// A worker:  gathers (the resource) · from ('flora': the nearest tree or rock that gives it, or a
//            building's id: the nearest one standing) · carry (per trip) · work (seconds at the spot)
//            drop (buildings, beside the hall, where he may unload: build one near the forest)
// A soldier: hp, atk, rate (seconds between blows), range (pixels: under 20 he fights hand to hand
//            and raiders stop to fight him; above, he shoots and they walk past), armor (taken off each blow)
DATA.units = {
  woodcutter: {
    name: 'Bûcheron', plural: 'Bûcherons', role: 'worker', sprite: 'woodcutter', speed: 30,
    gathers: 'wood', from: 'flora', carry: 6, work: 3, drop: ['lumber_hut'], cost: { gold: 8 },
    desc: 'Coupe du bois à l’arbre le plus proche et le rapporte. Une cabane de bûcheron près de la forêt raccourcit ses trajets.',
  },
  miner: {
    name: 'Mineur', plural: 'Mineurs', role: 'worker', sprite: 'miner', speed: 28,
    gathers: 'stone', from: 'flora', carry: 4, work: 4, drop: ['quarry'], cost: { gold: 15, bread: 2 }, unlock: { pop: 8 },
    desc: 'Taille le rocher le plus proche et rapporte la pierre. Une carrière sert de dépôt.',
  },
  farmhand: {
    name: 'Moissonneur', plural: 'Moissonneurs', role: 'worker', sprite: 'villager', speed: 30,
    gathers: 'wheat', from: 'farm', carry: 5, work: 4, drop: ['bakery'], cost: { gold: 12 }, unlock: { built: { farm: 1 } },
    desc: 'Fauche aux champs d’une ferme et porte le blé au village.',
  },
  militia: {
    name: 'Milicien', plural: 'Miliciens', role: 'soldier', sprite: 'militia', speed: 34,
    hp: 42, atk: 5, rate: 1, range: 14, armor: 1, cost: { wood: 15, gold: 15, bread: 3 }, time: 8,
    desc: 'Lance et bouclier : il barre la route, les pillards doivent s’arrêter pour le combattre.',
  },
  archer: {
    name: 'Archer', plural: 'Archers', role: 'soldier', sprite: 'archer', speed: 32,
    hp: 24, atk: 4, rate: 1.2, range: 72, armor: 0, cost: { planks: 15, gold: 25, bread: 3 }, time: 10, unlock: { cls: { artisan: 1 } },
    desc: 'Tire de loin, par-dessus les remparts. Fragile : gardez-le derrière vos miliciens.',
  },
  knight: {
    name: 'Chevalier', plural: 'Chevaliers', role: 'soldier', sprite: 'knight', speed: 30,
    hp: 120, atk: 13, rate: 1.1, range: 16, armor: 4, cost: { planks: 30, gold: 120, bread: 8, coffee: 4 }, time: 20, unlock: { cls: { burgher: 1 } },
    desc: 'Harnois d’acier : il tient seul une brèche et fend les brutes.',
  },
};
DATA.unitOrder = ['woodcutter', 'miner', 'farmhand', 'militia', 'archer', 'knight'];

// Traps: laid on a free tile once the horn has sounded, where the raiders will walk; all that is
// left of them is cleared away when the raid ends.
//   uses     raiders it catches before it is spent
//   dmg      damage to the raider who steps on it (pierce: armour does not count)
//   splash   pixels around it that take the damage too
//   slow, time   the share of his speed a caught raider keeps, and for how many seconds
DATA.traps = {
  spikes: { name: 'Pieux', card: 'Pieux', sprite: 'iso.trap.spikes', cost: { wood: 8 }, dmg: 10, uses: 6,
    desc: 'Blesse chaque pillard qui marche dessus. Tient six passages.' },
  tar: { name: 'Mare de poix', card: 'Poix', sprite: 'iso.trap.tar', cost: { wood: 4, planks: 3 }, slow: 0.35, time: 3, uses: 14,
    desc: 'Englue les pillards : ils rampent trois secondes sous le tir de vos tours.' },
  powder: { name: 'Baril de poudre', card: 'Poudre', sprite: 'iso.trap.powder', cost: { planks: 6, gold: 15 }, dmg: 30, splash: 30, pierce: true, uses: 1,
    desc: 'Explose au premier pillard et souffle tout le groupe, armures comprises.' },
};
DATA.trapOrder = ['spikes', 'tar', 'powder'];

// The market: gold for one unit of each good, bought and sold (config.js trade_lot at a time).
DATA.trade = {
  wood: { buy: 2, sell: 0.5 },
  planks: { buy: 5, sell: 1.5 },
  stone: { buy: 6, sell: 2 },
  wheat: { buy: 3, sell: 1 },
  bread: { buy: 8, sell: 2.5 },
  beans: { buy: 5, sell: 1.5 },
  coffee: { buy: 12, sell: 3.5 },
  spice: { buy: 16, sell: 5 },
  wool: { buy: 8, sell: 2.5 },
  cloth: { buy: 30, sell: 9 },
  jewel: { buy: 120, sell: 35 },
};

// The shopkeepers: a half-body portrait ('portrait.<id>' in assets/manifest.js, a strip of frames)
// shown beside the panel of the building they keep (data/buildings.js `keeper`), with a word for
// the player. `lines` are said in turn; `busy`, `sad` and `raid`, when given, take over while the
// building works on an order, waits for an input, or a raid is on.
DATA.keepers = {
  steward: { name: 'Maître Odon', title: 'Intendant',
    lines: ['Les registres sont à jour, messire. Presque.', 'Un village se compte en bouches à nourrir.', 'Des paysans repus font de bons artisans.'],
    raid: 'Aux abris ! Je garde les registres, gardez le reste.' },
  smith: { name: 'Bram', title: 'Forgeron',
    lines: ['Du bon bois, du bon fer, et je vous fais une légende.', 'Une lame, ça se respecte. Et ça se renforce.', '{g:Le héros|L’héroïne} casse, moi je répare.'],
    busy: 'Reculez, ça chauffe ! Elle sera prête bientôt.' },
  baker: { name: 'Mélisande', title: 'Boulangère',
    lines: ['Une miche chaude et le monde va mieux.', 'Vos paysans mangent comme quatre. Tant mieux !', 'Emportez-en pour {g:le héros|l’héroïne}, {g:il|elle} a mauvaise mine.'],
    sad: 'Plus un grain de blé… je ne peux pas pétrir du vent.' },
  innkeeper: { name: 'Gaspard', title: 'Cafetier',
    lines: ['Une tasse noire et serrée, et la journée commence.', 'Un artisan sans café, c’est un paysan qui bâille.', 'Ici, on refait le monde. Et le village, parfois.', 'Les maisons à portée de mon comptoir s’élèvent plus vite.'],
    sad: 'Plus un grain de café… je sers de l’eau chaude, maintenant.' },
  merchant: { name: 'Dame Ysolde', title: 'Marchande',
    lines: ['Tout s’achète, mon ami. Surtout ce qui manque.', 'Mes épices viennent de plus loin que vos cartes.', 'Je vends cher, j’achète bas : c’est un métier.'],
    raid: 'Je ferme boutique le temps que ça se calme !' },
  captain: { name: 'Capitaine Hilde', title: 'Capitaine de la garde',
    lines: ['Donnez-moi dix miliciens et je tiens la porte.', 'Un archer derrière un mur vaut trois lances.', 'Sélectionnez mes soldats, pointez, et ils y vont.'],
    busy: 'Un-deux, un-deux ! La recrue sera prête sous peu.',
    raid: 'À vos postes ! Clic droit là où vous les voulez !' },
  guide: { name: 'Aveline', title: 'Maîtresse bâtisseuse',
    lines: ['Un mur droit, bourgmestre, c’est un mur qui tient cent ans. Regardez-moi ces joints !', 'Avant de poser une pierre, on la regarde. Puis on la regarde encore.', 'Mes plans sont prêts, bourgmestre : à vous de bâtir, à moi de vous apprendre.'] },
};
