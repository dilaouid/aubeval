// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The map, its biomes, what grows on it, the resources and the hero's base sheet. Content only:
// no logic here. The land itself is drawn from these numbers and a seed by js/mapgen.js, the
// same every time for the same seed, so it is never saved: only what the player changed is.
window.DATA = window.DATA || {};

// The map is a grid of 16-pixel tiles. Sizes and positions are in tiles.
DATA.map = {
  tile: 16, w: 256, h: 256,
  hall: { x: 126, y: 126 },                          // top-left tile of the town hall: the middle of the map
  chunk: 16,                                         // tiles on one side of a piece of ground painted once and kept (js/world.js)
  zooms: [0.5, 1, 2, 3, 4, 6],                       // screen pixels per art pixel, the steps of the wheel
  // What the village starts with, beside the hall: [building, tiles right of the hall, tiles below it].
  start: [
    ['watchtower', 7, 4],
    ['palisade', -3, 7], ['palisade', -2, 7], ['palisade', -1, 7], ['palisade', 0, 7],
    ['palisade', 4, 7], ['palisade', 5, 7], ['palisade', 6, 7], ['palisade', 7, 7],   // a gap in the middle: the gate
  ],
  // The first street, paved: [tiles right of the hall, tiles below it]. Along the hall's front, and
  // down through the gate. Every building that works must touch a path joined to the hall.
  roads: [[-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [2, 5], [2, 6], [2, 7]],
  // The land around the hall is kept gentle: no tree within `bare` tiles of it, meadow and autumn
  // woods as far as `inner`, then the wild map takes over little by little until `outer`.
  clearing: { bare: 9, inner: 15, outer: 28 },
  edge: 9,                                           // tiles from the map's border where the land sinks into the sea
  // Sizes, in tiles, of the shapes each layer of noise draws: big numbers make big regions.
  scale: { height: 30, heat: 56, wet: 38, wood: 11 },
  // Where one biome ends and the next begins, on each layer (0 to 1, 0.5 is the middle).
  level: { water: 0.27, shore: 0.30, rock: 0.72, cold: 0.36, hot: 0.66, dry: 0.56, wet: 0.66, wood: 0.47 },
  heatSlope: 0.55,                                   // share of the heat that follows the map: cold at the top of the screen, hot at the bottom
};

// Ground kinds. `sprite` is a 32x32 isometric tile (its variants are picked tile by tile);
// build: a building may stand on it; walk: raiders may cross it.
DATA.ground = {
  grass: { sprite: 'iso.tile.grass', build: true, walk: true },
  autumn: { sprite: 'iso.tile.autumn', build: true, walk: true },
  snow: { sprite: 'iso.tile.snow', build: true, walk: true },
  marsh: { sprite: 'iso.tile.marsh', build: true, walk: true },
  sand: { sprite: 'iso.tile.sand', build: true, walk: true },
  rock: { sprite: 'iso.tile.rock', build: true, walk: true },
  bank: { sprite: 'iso.tile.bank', build: false, walk: true },
  water: { sprite: 'iso.tile.water', build: false, walk: false },
  path: { sprite: 'iso.tile.path', build: false, walk: true },   // a path the player paved (data/buildings.js, DATA.tools)
};

// Biomes: the ground, how much of it is covered (0 to 1) and by what, with a weight each.
// To add one: an entry here, its ground above, and a rule in js/mapgen.js biomeAt().
DATA.biomes = {
  meadow: { name: 'Pré', ground: 'grass', cover: 0.045, flora: { 'tree.green': 4, 'tree.red': 2, 'tree.gold': 2, bush: 2, rock: 1 } },
  autumn: { name: "Forêt d'automne", ground: 'autumn', cover: 0.3, flora: { 'tree.red': 5, 'tree.gold': 4, 'tree.green': 2, 'tree.pine': 1, bush: 1 } },
  snow: { name: 'Pinède enneigée', ground: 'snow', cover: 0.26, flora: { 'tree.snowpine': 8, 'rock.snow': 2 } },
  marsh: { name: 'Marais', ground: 'marsh', cover: 0.24, flora: { 'tree.willow': 4, 'tree.dead': 3, reeds: 5 } },
  sand: { name: 'Dunes', ground: 'sand', cover: 0.06, flora: { cactus: 4, 'tree.palm': 3, 'rock.sand': 3 } },
  rock: { name: 'Hautes terres', ground: 'rock', cover: 0.17, flora: { rock: 7, 'tree.pine': 3 } },
  shore: { name: 'Rivage', ground: 'bank', cover: 0 },
  water: { name: 'Lac', ground: 'water', cover: 0 },
};

// Everything that grows or lies on a tile. A click takes a little of `gives`; the Défricher tool
// removes it for good and gives more (config.js clear_yield). `plant`: its price when the player
// plants one (left out: it cannot be planted). `foot`: art pixels from the tile's middle down to
// the sprite's bottom.
DATA.flora = {
  'tree.red': { name: 'Érable rouge', sprite: 'iso.tree.red', gives: 'wood', plant: { gold: 8 } },
  'tree.gold': { name: 'Bouleau doré', sprite: 'iso.tree.gold', gives: 'wood', plant: { gold: 8 } },
  'tree.green': { name: 'Chêne', sprite: 'iso.tree.green', gives: 'wood', plant: { gold: 6 } },
  'tree.pine': { name: 'Sapin', sprite: 'iso.tree.pine', gives: 'wood', plant: { gold: 6 } },
  'tree.snowpine': { name: 'Sapin enneigé', sprite: 'iso.tree.snowpine', gives: 'wood' },
  'tree.willow': { name: 'Saule', sprite: 'iso.tree.willow', gives: 'wood', plant: { gold: 12 } },
  'tree.dead': { name: 'Arbre mort', sprite: 'iso.tree.dead', gives: 'wood' },
  'tree.palm': { name: 'Palmier', sprite: 'iso.tree.palm', gives: 'wood', plant: { gold: 15 } },
  cactus: { name: 'Cactus', sprite: 'iso.cactus', gives: 'wood' },
  bush: { name: 'Buisson', sprite: 'iso.bush', gives: 'wood', plant: { gold: 3 }, foot: 5 },
  reeds: { name: 'Roseaux', sprite: 'iso.reeds', gives: 'wood', foot: 5 },
  rock: { name: 'Rocher', sprite: 'iso.rock', gives: 'stone', foot: 6 },
  'rock.snow': { name: 'Rocher enneigé', sprite: 'iso.rock.snow', gives: 'stone', foot: 6 },
  'rock.sand': { name: 'Grès', sprite: 'iso.rock.sand', gives: 'stone', foot: 6 },
};

// Resources, in the order the top bar shows them. `icon` is a sprite id (js/art.js or assets/manifest.js).
DATA.resources = {
  wood: { name: 'Bois', icon: 'icon.wood' },
  planks: { name: 'Planches', icon: 'icon.planks' },
  stone: { name: 'Pierre', icon: 'icon.stone' },
  wheat: { name: 'Blé', icon: 'icon.wheat' },
  bread: { name: 'Pain', icon: 'icon.bread' },
  beans: { name: 'Grains de café', icon: 'icon.beans' },
  coffee: { name: 'Café', icon: 'icon.coffee' },
  spice: { name: 'Épices', icon: 'icon.spice' },
  wool: { name: 'Laine', icon: 'icon.wool' },
  cloth: { name: 'Étoffes', icon: 'icon.cloth' },
  jewel: { name: 'Bijoux', icon: 'icon.jewel' },
  gold: { name: 'Or', icon: 'icon.gold' },
  shard: { name: 'Éclats runiques', icon: 'icon.shard' },
};
DATA.resourceOrder = ['wood', 'planks', 'stone', 'wheat', 'bread', 'beans', 'coffee', 'spice', 'wool', 'cloth', 'jewel', 'gold', 'shard'];
DATA.pillaged = ['wood', 'planks', 'stone', 'wheat', 'bread', 'beans', 'coffee', 'spice', 'wool', 'cloth', 'jewel', 'gold']; // what a raider can steal

// The hero at level 1, before gear. Growth per level is in config.js.
DATA.hero = { name: 'Aldric', nameMin: 2, nameMax: 14, hp: 40, // name: the default, the one a player can keep; nameMin/nameMax: what the naming screen accepts (js/hero.js cleanName)
  atk: 5, def: 1, spd: 10 };
// His battle cards, and the ones his village sends him, are in data/cards.js.
