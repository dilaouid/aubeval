// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Images that replace the sprites drawn in code. Empty: the game draws everything itself.
//
// To replace one sprite: put the image in assets/sprites/, add a line here with the sprite's id,
// and add its entry to assets/provenance.yaml. Reload the page. Remove the line to go back to
// the drawn sprite. The ids, their sizes and a prompt for each are in assets/ASSET-GUIDE.md;
// index.html?scene=figures shows every figure and building at once, index.html?scene=variants
// every variant, numbered, and index.html?demo=1 a full village.
//
//   'building.forge': 'sprites/building_forge.png',                    // one image for every variant, at the sprite's own size
//   'enemy.brute': { file: 'sprites/enemy_brute.png', w: 56, h: 60 },  // or at a size you choose, in art pixels
//   'hero.battle': { frames: [                                         // one image per variant, in variant order;
//     'sprites/hero_battle_t0.png', 'sprites/hero_battle.png',         //   null keeps that variant's drawn look
//     'sprites/hero_battle_t2.png', null ] },
//   'iso.unit.hero': { sheet: 'sprites/iso/unit_hero.png', cols: 7, rows: 8 },  // or one image cut into equal cells, read row by row
// The isometric village (PixelLab, imagegen/pixellab/): one image per look of each building, in
// the order js/world.js reads them, 4 upgrade tiers per style; the 32x32 ground tiles of each
// biome; the trees, rocks and decorations; and the walking figures, one sheet each (a row per way
// it faces, the first column standing, the others its walk). Images are used at their own size
// (no drawn sprite has these ids). imagegen/pixellab/install_iso.py makes all of them.
const isoLooks = (kind, styles) => ({
  frames: (styles || [null]).flatMap(st => [1, 5, 10, 15].map(l => `sprites/iso/${kind}${st ? '_' + st : ''}_l${l}.png`)),
});
// A building with one look for all four tiers (the new chains of iteration 6: the tier looks are still to make).
const oneLook = kind => ({ frames: [1, 1, 1, 1].map(() => `sprites/iso/${kind}_l1.png`) });
// A house's looks follow its citizens' class (data/people.js): cottage, two-storey house, then the
// townhouse, the merchant's house and the mansion made for iteration 6. Five per style, in class order.
const classLooks = styles => ({ frames: styles.flatMap(st => ['l1', 'l10', 'c2', 'c3', 'c4'].map(l => `sprites/iso/house_${st}_${l}.png`)) });
const variants = (name, n) => ({ frames: Array.from({ length: n }, (_, i) => `sprites/iso/${name}_${i}.png`) });
window.ASSETS = {
  'iso.hall': isoLooks('hall', ['timber', 'stone', 'wood']),
  'iso.house': classLooks(['timber', 'stone', 'wood']),
  'iso.lumber_hut': isoLooks('lumber_hut'),
  'iso.sawmill': isoLooks('sawmill'),
  'iso.forge': isoLooks('forge'),
  'iso.farm': isoLooks('farm'),
  'iso.bakery': isoLooks('bakery'),
  'iso.quarry': isoLooks('quarry'),
  'iso.watchtower': isoLooks('watchtower'),
  // a rampart is built of pieces that join their neighbours (js/world.js, Walls); its card on the
  // build bar is a straight length of it. imagegen/pixellab/walls/install_walls.py makes them all.
  'iso.palisade': isoLooks('wall_card'),
  'iso.wall.hub': isoLooks('wall_hub'), 'iso.wall.n': isoLooks('wall_n'), 'iso.wall.e': isoLooks('wall_e'),
  'iso.wall.s': isoLooks('wall_s'), 'iso.wall.w': isoLooks('wall_w'),
  'iso.mage_tower': isoLooks('mage_tower'),
  'iso.coffee_farm': oneLook('coffee_farm'), 'iso.roastery': oneLook('roastery'), 'iso.cafe': oneLook('cafe'), 'iso.chapel': oneLook('chapel'),
  'iso.sheep_farm': oneLook('sheep_farm'), 'iso.weaver': oneLook('weaver'), 'iso.goldsmith': oneLook('goldsmith'),
  'iso.goblin_camp': 'sprites/iso/goblin_camp_l1.png', // the raids' camp, out in the wild (js/world.js)
  'iso.goblin_camp_ruin': 'sprites/iso/goblin_camp_ruin.png', // the same camp burnt down by the soldiers, until the next one rises (js/camp.js)
  'iso.market': isoLooks('market'),
  // the great works (data/buildings.js, monument: true): four images, one per stage of the works (js/world.js frameOf, looks: 'stage').
  // They have a drawn stand-in in js/art.js, so each gives its own size. imagegen/pixellab/monuments/install_monuments_v2.py makes them.
  'iso.cathedral': { w: 136, h: 170, frames: [1, 2, 3, 4].map(s => `sprites/iso/cathedral_s${s}.png`) },
  'iso.castle': { w: 152, h: 163, frames: [1, 2, 3, 4].map(s => `sprites/iso/castle_s${s}.png`) },
  'iso.lighthouse': { w: 96, h: 191, frames: [1, 2, 3, 4].map(s => `sprites/iso/lighthouse_s${s}.png`) },
  // the places found under the fog (data/explore.js): imagegen/pixellab/sites/install_sites.py
  'iso.site.ruin': { file: 'sprites/iso/site_ruin.png', w: 65, h: 85 },
  'iso.site.hamlet': { file: 'sprites/iso/site_hamlet.png', w: 62, h: 46 },
  'iso.site.deposit': { file: 'sprites/iso/site_deposit.png', w: 64, h: 49 },
  'iso.site.lair': { file: 'sprites/iso/site_lair.png', w: 70, h: 66 },
  'iso.barracks': isoLooks('barracks'),
  // ground, one entry per kind in data/world.js DATA.ground; several images are picked tile by tile
  'iso.tile.grass': variants('tile_grass', 3),
  'iso.tile.autumn': { frames: ['sprites/iso/tile_autumn_0.png', 'sprites/iso/tile_autumn_1.png', 'sprites/iso/tile_forest.png'] },
  'iso.tile.snow': variants('tile_snow', 2),
  'iso.tile.marsh': variants('tile_marsh', 2),
  'iso.tile.sand': variants('tile_sand', 2),
  'iso.tile.rock': variants('tile_rock', 2),
  'iso.tile.water': 'sprites/iso/tile_water.png',
  'iso.tile.bank': 'sprites/iso/tile_bank.png',
  'iso.tile.path': { frames: ['sprites/iso/tile_path.png', 'sprites/iso/tile_path_1.png'] },
  // trees and rocks, one entry per kind in data/world.js DATA.flora
  'iso.tree.red': variants('tree_red', 2),
  'iso.tree.gold': variants('tree_gold', 2),
  'iso.tree.green': variants('tree_green', 2),
  'iso.tree.pine': variants('tree_pine', 2),
  'iso.tree.snowpine': variants('tree_snowpine', 2),
  'iso.tree.willow': 'sprites/iso/tree_willow_0.png',
  'iso.tree.dead': 'sprites/iso/tree_dead_0.png',
  'iso.tree.palm': 'sprites/iso/tree_palm_0.png',
  'iso.cactus': 'sprites/iso/cactus_0.png',
  'iso.bush': 'sprites/iso/bush_0.png',
  'iso.reeds': 'sprites/iso/reeds_0.png',
  'iso.rock': variants('rock', 2),
  'iso.rock.snow': 'sprites/iso/rock_snow_0.png',
  'iso.rock.sand': 'sprites/iso/rock_sand_0.png',
  // decorations (data/buildings.js, decor: true)
  'iso.decor.fountain': 'sprites/iso/decor_fountain.png',
  'iso.decor.well': 'sprites/iso/decor_well.png',
  'iso.decor.statue': 'sprites/iso/decor_statue.png',
  'iso.decor.stall': 'sprites/iso/decor_stall.png',
  'iso.decor.lamp': 'sprites/iso/decor_lamp.png',
  'iso.decor.banner': 'sprites/iso/decor_banner.png',
  'iso.decor.bench': 'sprites/iso/decor_bench.png',
  'iso.decor.flowers': 'sprites/iso/decor_flowers.png',
  'iso.decor.barrels': 'sprites/iso/decor_barrels.png',
  'iso.decor.hedge': 'sprites/iso/decor_hedge.png',
  // the figures that walk on the map: 8 rows (south, south-east, east, north-east, north, north-west,
  // west, south-west), the first column standing, then the walk. Without its line here a figure
  // falls back on its two drawn frames (unit.<kind>, below).
  'iso.unit.hero': { sheet: 'sprites/iso/unit_hero.png', cols: 7, rows: 8 },
  'iso.unit.hero.aldric': { sheet: 'sprites/iso/unit_hero.png', cols: 7, rows: 8 }, // the other heroes' lines come with their images
  'iso.unit.villager': { sheet: 'sprites/iso/unit_villager.png', cols: 7, rows: 8 },
  'iso.unit.gobelin': { sheet: 'sprites/iso/unit_gobelin.png', cols: 7, rows: 8 },
  'iso.unit.brute': { sheet: 'sprites/iso/unit_brute.png', cols: 7, rows: 8 },
  'iso.unit.chaman': { sheet: 'sprites/iso/unit_chaman.png', cols: 7, rows: 8 },
  // the citizens put to work and the soldiers (data/people.js DATA.units, `sprite`); the harvester wears the villager's sheet
  'iso.unit.woodcutter': { sheet: 'sprites/iso/unit_woodcutter.png', cols: 7, rows: 8 },
  'iso.unit.miner': { sheet: 'sprites/iso/unit_miner.png', cols: 7, rows: 8 },
  'iso.unit.militia': { sheet: 'sprites/iso/unit_militia.png', cols: 7, rows: 8 },
  'iso.unit.archer': { sheet: 'sprites/iso/unit_archer.png', cols: 7, rows: 8 },
  'iso.unit.knight': { sheet: 'sprites/iso/unit_knight.png', cols: 7, rows: 8 },
  'iso.unit.warlord': { sheet: 'sprites/iso/unit_warlord.png', cols: 7, rows: 8 }, // the chief who leads a siege (data/enemies.js DATA.warlords): cells of 51x52, bigger than a brute's
  // the raid traps (data/people.js DATA.traps): they have a drawn stand-in in js/art.js, so each gives its own size here
  'iso.trap.spikes': { file: 'sprites/iso/trap_spikes.png', w: 26, h: 26 },
  'iso.trap.tar': { file: 'sprites/iso/trap_tar.png', w: 25, h: 20 },
  'iso.trap.powder': { file: 'sprites/iso/trap_powder.png', w: 16, h: 26 },
  // the shopkeepers' half-body portraits (data/people.js DATA.keepers) and the tutorial's guide (data/tutorial.js): a strip of 64x64 frames, played in a loop
  // beside their building's panel (config.js portrait_fps). imagegen/pixellab/portraits/install_portraits.py makes them.
  ...Object.fromEntries(['merchant', 'smith', 'baker', 'innkeeper', 'captain', 'steward', 'guide'].map(k => ['portrait.' + k, { sheet: `sprites/portraits/${k}.png`, cols: 7, rows: 1 }])),
  // the heroes' portraits (data/world.js DATA.heroes), the same strips of seven 64x64 frames: on the naming screen and in the hero's panel
  // (js/hero.js Hero.art). tools/make_heroes.py makes them from tools/heroes/raw/.
  ...Object.fromEntries(['aldric', 'tancrede', 'isaure', 'maelle'].map(k => ['portrait.hero.' + k, { sheet: `sprites/portraits/hero_${k}.png`, cols: 7, rows: 1 }])),

  // the places entered full screen (data/venues.js): the inside of each, 640x360, and its keeper from the waist up, a strip of
  // eight 160x160 frames played in a loop. imagegen/pixellab/venue/install_venue.py makes them.
  ...Object.fromEntries(['cafe', 'market', 'forge'].map(k => ['venue.bg.' + k, { file: `sprites/venue/bg_${k}.png`, w: 640, h: 360 }])),
  ...Object.fromEntries(['innkeeper', 'merchant', 'smith'].map(k => ['venue.char.' + k, { sheet: `sprites/venue/char_${k}.png`, cols: 8, rows: 1 }])),

  'bg.battle': 'sprites/bg_battle.png',
  'enemy.brute': 'sprites/enemy_brute.png',
  'enemy.chaman': 'sprites/enemy_chaman.png',
  'enemy.gobelin': 'sprites/enemy_gobelin.png',
  'enemy.grakk': 'sprites/enemy_grakk.png',
  'enemy.warlord': { file: 'sprites/enemy_warlord.png', w: 96, h: 89 }, // the warlord in his duel: pixel for pixel, larger than Grakk
  // un seul dessin pour les quatre armes, en attendant hero_battle_t0 / _t2 / _t3 (voir imagegen/PROMPTS.md, section 11)
  'hero.battle': 'sprites/hero_battle.png',
  'hero.battle.aldric': { file: 'sprites/hero_battle.png', w: 44, h: 50 }, // w and h: with no drawn sprite to size it, the file's own size comes out four times too big
  // the other heroes in battle (tools/make_heroes.py): drawn at 44x50, in Aldric's pose
  ...Object.fromEntries(['tancrede', 'isaure', 'maelle'].map(k => ['hero.battle.' + k, { file: `sprites/hero_battle_${k}.png`, w: 44, h: 50 }])),
  'unit.brute': 'sprites/unit_brute.png',
  'unit.chaman': 'sprites/unit_chaman.png',
  'unit.gobelin': 'sprites/unit_gobelin.png',
  'unit.grakk': 'sprites/unit_grakk.png',
  'unit.hero': 'sprites/unit_hero.png',
  'unit.villager': 'sprites/unit_villager.png',
  ...uiKit(),
};
// The HUD (PixelLab, imagegen/pixellab/ui/install_ui.py): the wood-and-brass frames js/ui.js draws
// as 9-slices ('ui.<look>', insets in UI.SKIN), the 16x16 icons and the title logo. The icons
// replace the drawn ones of the same id (icon.wood...) and add the HUD's own (icon.hero...).
function uiKit() {
  const looks = ['panel', 'plate', 'button', 'button_hover', 'button_pressed', 'button_disabled', 'button_on',
    'button_primary', 'button_primary_hover', 'tab', 'tab_hover', 'tab_on', 'card', 'card_hover', 'card_on',
    'card_locked', 'topbar', 'bottombar', 'logo'];
  const icons = ['wood', 'planks', 'stone', 'wheat', 'bread', 'gold', 'shard', 'pop', 'hp', 'atk', 'def', 'xp', 'time',
    'raid', 'lock', 'check', 'warn', 'hero', 'quest', 'village', 'zoom_in', 'zoom_out', 'recenter', 'build', 'defense',
    'decor', 'terrain', 'upgrade', 'move', 'demolish', 'sound', 'gear', 'spice', 'trap', 'trade', 'army',
    'coffee', 'beans', 'wool', 'cloth', 'jewel', 'beauty', 'road', 'service',
    'popularity', 'city', 'tax', 'explore', 'order', 'monument', 'siege']; // the last seven: imagegen/pixellab/icons12/install_icons12.py
  const out = {};
  for (const k of looks) out['ui.' + k] = `sprites/ui/${k}.png`;
  for (const k of icons) out['icon.' + k] = { file: `sprites/ui/icon_${k}.png`, w: 16, h: 16 };
  for (const k of ['check', 'lock', 'warn']) out['fx.' + k] = out['icon.' + k];
  return out;
}
