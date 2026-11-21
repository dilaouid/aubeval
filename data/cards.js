// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The battle cards. The hero's deck is his village: each kind of building that stands sends its
// card, and the hero brings a few of his own. To add a card: add an entry here. Nothing else
// changes: js/cards.js builds the deck and writes the card's text from these fields, js/battle.js
// plays them.
//
//   name, flavor   the card's name; one line shown under its rules in the tooltip
//   from           'hero' (his own card) or a building id (data/buildings.js): the card is in the
//                  deck while at least one such building stands undamaged, and its picture is that
//                  building as it looks in the village
//   art            optional: a sprite id for its own picture, 62x29 art pixels (assets/manifest.js);
//                  left out or not loaded, the building or the hero is shown
//   lvl            a hero card: the hero level that teaches it
//   copies         a hero card: how many are in the deck
//   max            a building card: one copy per building of that kind, up to this many (1 if left out)
//   at             a building card: the level its building must have reached (1 if left out)
//   cost           souffle (energy) it takes to play
//   pay            { resource: n } taken from the village's stock when it is played
//   target         one (the marked enemy) | all | random | self
//   exhaust        true: played once a battle, then gone until the next one
//
// What it does (all optional, read in this order). A building card's numbers grow with the
// highest level of its buildings (config.js card_level_step); a hero card grows with his ATQ.
//   dmg            damage, as a share of the hero's ATQ          hits   how many blows (2 = twice)
//   flat           damage that does not depend on his ATQ        pierce true: armour is ignored
//   shred          armour (DÉF) the target loses for the rest of the battle
//   stun           true: the target loses its next action (a chief is only weakened for one)
//   weak           turns the target strikes at half strength
//   block          Garde gained (absorbs damage until the hero's next turn)
//   blockDef       Garde gained per point of the hero's DÉF
//   thorns         damage each enemy that strikes him takes, until his next turn
//   heal           share of his max health restored
//   draw           cards drawn                                   energy  souffle gained
//   buff           { atk: multiplier, turns }
//   bless          true: the next blow he takes is parried perfectly by itself
//   wide           true: the parry timing is twice as forgiving until his next turn
//   ally           { dmg, turns }: a militiaman strikes the marked enemy at the end of each turn
//   echo           true: the next card played this turn is played twice
window.DATA = window.DATA || {};

DATA.cards = {
  // ---- The hero's own ----
  strike: { name: 'Taille', from: 'hero', lvl: 1, copies: 4, cost: 1, target: 'one', dmg: 0.6,
    flavor: 'Le coup de base : il vaut ce que vaut la lame.' },
  guard: { name: 'En garde', from: 'hero', lvl: 1, copies: 3, cost: 1, target: 'self', block: 4, blockDef: 1,
    flavor: 'Le pavois levé. Meilleure armure, meilleure Garde.' },
  heavy: { name: 'Frappe lourde', from: 'hero', lvl: 1, copies: 1, cost: 2, target: 'one', dmg: 1.6,
    flavor: 'Un coup à deux mains.' },
  whirl: { name: 'Tourbillon', from: 'hero', lvl: 3, copies: 1, cost: 2, target: 'all', dmg: 0.7,
    flavor: 'La lame fait le tour.' },
  rally: { name: "Cri de l'Aube", from: 'hero', lvl: 5, copies: 1, cost: 1, target: 'self', buff: { atk: 1.5, turns: 3 }, exhaust: true,
    flavor: 'Le cri de guerre des gardiens d’Aubeval.' },

  // ---- The village's ----
  order: { name: 'Ordre du bourgmestre', from: 'hall', cost: 0, target: 'self', draw: 2,
    flavor: 'L’hôtel de ville sonne : tout le village répond.' },
  axe: { name: 'Coup de cognée', from: 'lumber_hut', max: 2, cost: 1, target: 'one', dmg: 0.5, shred: 2,
    flavor: 'Les bûcherons savent fendre : l’armure de la cible s’ouvre pour tout le combat.' },
  barricade: { name: 'Barricade', from: 'sawmill', max: 2, cost: 1, target: 'self', block: 8,
    flavor: 'Des planches de la scierie, clouées à la hâte.' },
  thrust: { name: 'Estoc', from: 'forge', max: 1, copies: 2, cost: 2, target: 'one', dmg: 1.3, pierce: true,
    flavor: 'La pointe trempée à la forge passe entre les plaques.' },
  brand: { name: 'Fer rouge', from: 'forge', at: 5, max: 1, copies: 1, cost: 1, target: 'one', dmg: 0.9, pierce: true, weak: 2, exhaust: true,
    flavor: 'Le fer sorti du feu marque la cible : elle frappe deux fois moins fort.' },
  cheer: { name: 'Acclamations', from: 'house', max: 2, cost: 0, target: 'self', block: 3, draw: 1,
    flavor: 'Les habitants crient son nom depuis les fenêtres.' },
  scythe: { name: 'Grande faux', from: 'farm', max: 2, cost: 1, target: 'all', dmg: 0.4,
    flavor: 'La faux des moissons couche toute la rangée.' },
  ration: { name: 'Ration', from: 'bakery', max: 2, cost: 1, target: 'self', heal: 0.3, pay: { bread: 5 }, exhaust: true,
    flavor: 'Le pain de la boulangerie, encore chaud.' },
  boulder: { name: 'Bloc de carrière', from: 'quarry', cost: 2, target: 'one', dmg: 0.9, stun: true, exhaust: true,
    flavor: 'Un bloc de taille en pleine tête : la cible perd son prochain coup, même terrible.' },
  volley: { name: 'Volée de flèches', from: 'watchtower', max: 2, cost: 1, target: 'random', flat: 4, hits: 3,
    flavor: 'Les archers des tours de guet tirent par-dessus son épaule.' },
  spikes: { name: 'Pieux', from: 'palisade', cost: 1, target: 'self', block: 4, thorns: 3,
    flavor: 'Qui {g:le|la} frappe s’empale sur la palissade.' },
  bolt: { name: 'Éclair', from: 'mage_tower', cost: 2, target: 'all', flat: 8, pierce: true,
    flavor: 'La tour de mage foudroie toute la bande.' },
  militia: { name: 'Renfort de la milice', from: 'barracks', cost: 1, target: 'self', ally: { dmg: 5, turns: 3 }, exhaust: true,
    flavor: 'Un milicien de la caserne se range à ses côtés.' },
  coffee: { name: 'Tasse de café', from: 'cafe', cost: 0, target: 'self', energy: 2, pay: { coffee: 2 }, exhaust: true,
    flavor: 'Serré, brûlant, du Café du coin.' },
  bless: { name: 'Bénédiction', from: 'chapel', cost: 1, target: 'self', bless: true, block: 3,
    flavor: 'La cloche de la chapelle sonne au moment juste.' },
  bribe: { name: 'Pot-de-vin', from: 'market', cost: 1, target: 'one', stun: true, pay: { gold: 15 },
    flavor: 'Une bourse du marché change de main : la cible regarde ailleurs.' },
  cloak: { name: "Cape d'étoffe", from: 'weaver', cost: 1, target: 'self', block: 5, wide: true,
    flavor: 'Une cape de l’atelier de tissage : elle trompe l’œil de qui frappe.' },
  gem: { name: 'Joyau runique', from: 'goldsmith', cost: 0, target: 'self', echo: true, exhaust: true,
    flavor: 'Le joyau de l’orfèvre répète le geste qui le suit.' },
};
// The order cards are listed in (the hero's sheet): his own first, then the village's as it grows.
DATA.cardOrder = ['strike', 'guard', 'heavy', 'whirl', 'rally', 'order', 'axe', 'barricade', 'thrust', 'brand', 'cheer', 'scythe', 'ration',
  'boulder', 'volley', 'spikes', 'bolt', 'militia', 'coffee', 'bless', 'bribe', 'cloak', 'gem'];
