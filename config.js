// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
//
// These are the GLOBAL balance knobs: one slider moves the whole game. The per-content numbers
// (what one building costs, one enemy's health, one quest's reward) live with their content in
// data/*.js, so adding a building, an enemy or a chapter never touches this file.
window.CONFIG = {
  seed: 1, // the land of every save from before lands were drawn; a new game draws its own (js/village.js drawSeed, or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  music: { value: 0.55, min: 0, max: 1, step: 0.05 }, // the music's share of the volume (js/music.js)

  // ---- The first minute ----
  click_wood: { value: 1, min: 1, max: 5, step: 1 },                 // wood per click on a tree
  click_stone: { value: 1, min: 1, max: 5, step: 1 },                // stone per click on a rock
  clear_yield: { value: 4, min: 0, max: 20, step: 1 },               // wood or stone from felling a tree or breaking a rock for good

  // ---- Economy ----
  prod_scale: { value: 1, min: 0.25, max: 4, step: 0.05 },           // multiplies every building's output
  cost_scale: { value: 1, min: 0.25, max: 4, step: 0.05 },           // multiplies every building price
  cost_growth: { value: 1.3, min: 1, max: 2, step: 0.01 },           // price x this for each one already built (a building may set its own)
  upgrade_cost_base: { value: 1.5, min: 0.5, max: 4, step: 0.1 },    // first upgrade costs this x the base price
  upgrade_cost_growth: { value: 1.7, min: 1.1, max: 3, step: 0.05 }, // each further level costs x this
  upgrade_output_step: { value: 0.6, min: 0.1, max: 2, step: 0.05 }, // each level adds this share of the base output
  milestone_levels: { value: 5, min: 2, max: 10, step: 1 },          // every N levels, output doubles
  refund_pct: { value: 0.7, min: 0, max: 1, step: 0.05 },            // share of the base price given back on demolish
  repair_pct: { value: 0.3, min: 0, max: 1, step: 0.05 },            // share of the base price to repair a damaged building
  plus_bonus: { value: 0.15, min: 0.05, max: 0.5, step: 0.01 },      // each +1 on a piece of gear adds this share of its stats
  forge_temper_bonus: { value: 0.05, min: 0, max: 0.3, step: 0.01 }, // the forge's Trempe: added to plus_bonus once it reaches milestone_levels
  plus_cost_growth: { value: 1.5, min: 1.1, max: 3, step: 0.05 },    // each +1 costs x this

  // ---- Citizens: classes and needs (data/people.js) ----
  need_cycle: { value: 20, min: 5, max: 120, step: 1 },              // seconds between two meals of a house: it eats its class's needs each time
  sat_step: { value: 0.1, min: 0.01, max: 0.5, step: 0.01 },         // satisfaction a house gains for a meal fully covered, and loses for one that is not
  unhappy_tax: { value: 0.6, min: 0, max: 1, step: 0.05 },           // share of its tax a house with no satisfaction still pays
  raise_sat: { value: 1, min: 0.2, max: 1, step: 0.05 },             // satisfaction a house needs before it can rise to the next class

  // ---- The town: roads, beauty (data/buildings.js road, beauty, service) ----
  service_radius_step: { value: 1, min: 0, max: 5, step: 0.5 },     // each level of a café, chapel or market widens its reach by this many tiles
  beauty_radius: { value: 5, min: 1, max: 15, step: 1 },             // tiles around a house whose decorations, trees and workshops count in its beauty
  tree_beauty: { value: 0.25, min: 0, max: 2, step: 0.05 },          // beauty each tree in reach adds ...
  tree_beauty_max: { value: 3, min: 0, max: 20, step: 0.5 },         // ... up to this much in all
  beauty_tax_step: { value: 0.03, min: 0, max: 0.2, step: 0.005 },   // each point of beauty adds this share to a house's tax (taken away below 0)
  beauty_tax_max: { value: 25, min: 0, max: 100, step: 1 },          // beauty past this adds no more tax

  // ---- Units: workers and soldiers (data/people.js) ----
  worker_search: { value: 40, min: 8, max: 120, step: 1 },           // tiles around his drop-off where a worker looks for a tree, a rock or a farm
  worker_fear: { value: 7, min: 0, max: 30, step: 1 },               // tiles: a raider this close sends a worker running to the town hall
  soldier_aggro: { value: 6, min: 1, max: 20, step: 0.5 },           // tiles around the point he guards within which a soldier goes for a raider
  barracks_queue: { value: 8, min: 0, max: 30, step: 1 },            // recruits the barracks keeps waiting in its line, besides the one at drill
  soldier_level_step: { value: 0.05, min: 0, max: 1, step: 0.01 },   // each barracks level adds this share to every soldier's health and damage

  // ---- Trade (data/people.js) ----
  trade_lot: { value: 10, min: 1, max: 100, step: 1 },               // units bought or sold by one click at the market
  trade_level_step: { value: 0.04, min: 0, max: 0.2, step: 0.01 },   // each market level above 1 cuts buying prices by this share
  trade_max_cut: { value: 0.4, min: 0, max: 0.8, step: 0.05 },       // ... down to this share off, at most

  // ---- Idle ----
  offline_cap_hours: { value: 8, min: 1, max: 48, step: 1 },         // longest absence that still earns
  offline_rate: { value: 1, min: 0.1, max: 1, step: 0.05 },          // share of normal output earned while away
  autosave_seconds: { value: 10, min: 2, max: 60, step: 1 },

  // ---- Raids ----
  raid_first_delay: { value: 240, min: 30, max: 900, step: 5 },      // seconds from the first quest to the first raid
  raid_interval: { value: 480, min: 60, max: 1800, step: 10 },       // seconds between raids
  raid_warning: { value: 60, min: 5, max: 180, step: 5 },            // seconds before arrival when the horn sounds
  raid_camp_dist: { value: 46, min: 24, max: 100, step: 1 },         // tiles from the town hall to the first goblin camp every raid leaves from (a camp that falls rises again farther: camp_dist_step)
  raid_camp_clear: { value: 3, min: 0, max: 8, step: 1 },            // tiles of bare ground kept around the camp, where nothing can be built

  // ---- The camp's assault (js/camp.js, garrison in data/enemies.js DATA.camp) ----
  camp_hp: { value: 600, min: 50, max: 5000, step: 50 },             // blows the first camp's palisade takes, once its garrison is down
  camp_growth: { value: 0.5, min: 0, max: 3, step: 0.05 },           // each camp that rises after one fell: palisade and guards' health +this share
  camp_alert: { value: 7, min: 2, max: 20, step: 0.5 },              // tiles around the camp's middle within which its guards come out at soldiers
  camp_regroup: { value: 40, min: 5, max: 300, step: 5 },            // seconds with no soldier near before the camp's garrison and palisade are whole again
  camp_respite: { value: 600, min: 60, max: 3600, step: 30 },        // seconds from a camp's fall until a new one rises (no raid meanwhile; counts while away)
  camp_dist_step: { value: 6, min: 0, max: 30, step: 1 },            // tiles farther from the hall each new camp rises
  camp_dist_max: { value: 40, min: 0, max: 120, step: 2 },           // ... up to this many tiles beyond raid_camp_dist
  camp_loot_gold: { value: 150, min: 0, max: 2000, step: 10 },       // gold a fallen camp leaves, times the camps already fallen + 1
  raid_size_scale: { value: 1, min: 0.25, max: 4, step: 0.05 },      // multiplies how many raiders come
  raid_hp_growth: { value: 0.12, min: 0, max: 1, step: 0.01 },       // raider health +this per raid already fought
  raid_spawn_gap: { value: 0.9, min: 0.2, max: 3, step: 0.1 },       // seconds between two raiders entering
  safe_radius: { value: 20, min: 8, max: 60, step: 1 },              // tiles around the town hall where no raider can ever come out: the safe zone
  safe_radius_step: { value: 2, min: 0, max: 10, step: 0.5 },        // each town hall level above 1 widens the safe zone by this many tiles (never past the camp: config raid_camp_dist)
  raid_spawn_margin: { value: 2, min: 0, max: 30, step: 1 },         // tiles beyond the safe zone's edge where a raid comes out
  raid_engage_range: { value: 14, min: 6, max: 40, step: 1 },        // pixels within which a raider stops to fight a foot soldier in his way
  trap_max: { value: 12, min: 1, max: 60, step: 1 },                 // traps that can lie on the ground at once during one raid
  raid_wall_cost: { value: 14, min: 1, max: 60, step: 1 },           // tiles of detour a raider accepts before breaking through a new wall instead
  raid_building_cost: { value: 45, min: 5, max: 200, step: 5 },      // the same, before breaking through a building: a last resort
  raid_building_hp: { value: 120, min: 20, max: 600, step: 10 },     // how much breaking it takes before a building in their way is damaged and lets them pass
  raid_forest_cost: { value: 2, min: 1, max: 6, step: 0.5 },         // how many open tiles one tile of trees or rocks is worth to them
  raid_forest_slow: { value: 0.6, min: 0.2, max: 1, step: 0.05 },    // share of their speed they keep among trees and rocks
  raid_leaks_to_lose: { value: 3, min: 1, max: 10, step: 1 },        // raiders reaching the hall that make the raid a loss
  raid_pillage_pct: { value: 0.08, min: 0, max: 0.5, step: 0.01 },   // share of each stock one raider steals
  hall_guard_step: { value: 0.06, min: 0, max: 0.2, step: 0.01 },    // each town hall level above 1 cuts that share by this fraction (compounded)
  raid_bounty: { value: 15, min: 0, max: 200, step: 5 },             // gold for a repelled raid, x the raid's number
  raid_call_bonus: { value: 0.25, min: 0, max: 1, step: 0.05 },      // extra bounty for calling the raid early
  hero_guard_range: { value: 40, min: 16, max: 120, step: 2 },       // pixels from the hero within which he strikes a raider
  hero_patrol_range: { value: 9, min: 2, max: 30, step: 1 },         // tiles from the hall within which he runs at a raider
  hero_speed: { value: 46, min: 10, max: 160, step: 2 },             // pixels per second when he runs at one
  hero_guard_rate: { value: 1.1, min: 0.2, max: 3, step: 0.05 },     // seconds between two of his strikes
  tower_level_step: { value: 0.5, min: 0.1, max: 2, step: 0.05 },    // each tower level adds this share of its damage

  // ---- Battles: the village's cards (data/cards.js, js/cards.js, js/battle.js) ----
  battle_energy: { value: 3, min: 1, max: 6, step: 1 },              // souffle the hero has each turn to play cards
  battle_hand: { value: 5, min: 3, max: 8, step: 1 },                // cards drawn at the start of each turn
  battle_hand_max: { value: 9, min: 5, max: 12, step: 1 },           // cards the hand can hold: a draw beyond it is lost
  deck_min: { value: 8, min: 4, max: 20, step: 1 },                  // the smallest deck the player can cut his cards down to
  card_level_step: { value: 0.1, min: 0, max: 0.5, step: 0.01 },     // each level of its building adds this share to a card's numbers
  parry_lead: { value: 0.8, min: 0.3, max: 2, step: 0.05 },          // seconds the ring takes to close on the hero (a terrible blow x1.5, a second quick hit x0.55)
  parry_good: { value: 0.17, min: 0.04, max: 0.5, step: 0.01 },      // seconds either side of the impact where a press parries
  parry_perfect: { value: 0.065, min: 0.02, max: 0.3, step: 0.005 }, // ... and where the parry is perfect: no damage, and a riposte
  parry_good_block: { value: 0.5, min: 0, max: 1, step: 0.05 },      // share of the blow a parry that is not perfect removes
  riposte_mult: { value: 0.7, min: 0, max: 3, step: 0.05 },          // the riposte after a perfect parry, as a share of the hero's ATQ
  enemy_hp_scale: { value: 1, min: 0.25, max: 4, step: 0.05 },
  enemy_atk_scale: { value: 1, min: 0.25, max: 4, step: 0.05 },
  armor_factor: { value: 10, min: 2, max: 40, step: 1 },             // damage x factor / (factor + defence)
  damage_spread: { value: 0.1, min: 0, max: 0.5, step: 0.01 },       // random +/- share on every hit
  crit_chance: { value: 0.1, min: 0, max: 1, step: 0.01 },           // the hero's own blows and ripostes
  crit_mult: { value: 1.6, min: 1, max: 4, step: 0.1 },
  heavy_mult: { value: 2.5, min: 1.2, max: 5, step: 0.1 },           // an announced terrible blow
  boss_heavy_mult: { value: 2.8, min: 1.2, max: 6, step: 0.1 },
  battle_action_time: { value: 0.45, min: 0.1, max: 1.5, step: 0.05 }, // seconds a lunge takes on screen

  // ---- Hero ----
  xp_base: { value: 30, min: 5, max: 200, step: 1 },                 // experience for level 2
  xp_growth: { value: 1.45, min: 1.05, max: 3, step: 0.01 },         // each level needs x this
  hero_hp_per_level: { value: 12, min: 1, max: 50, step: 1 },
  hero_atk_per_level: { value: 1.5, min: 0, max: 10, step: 0.1 },
  hero_def_per_level: { value: 0.5, min: 0, max: 5, step: 0.1 },
  contract_scale: { value: 0.25, min: 0.05, max: 1, step: 0.05 },    // a contract's enemies and pay grow by this each win

  // ---- New start (prestige) ----
  renown_gold_divisor: { value: 400, min: 50, max: 5000, step: 50 }, // renown gained = sqrt(gold earned this village / this)
  renown_bonus: { value: 0.1, min: 0.01, max: 1, step: 0.01 },       // each renown point adds this share to all output

  // ---- The city: rank, orders, popularity, taxes, great works, legacy (js/city.js, data/city.js) ----
  city_pace: { value: 1, min: 0.25, max: 4, step: 0.05 },            // multiplies the orders and the raids every rank asks for: the one lever on how long the climb to the Nobles takes
  rank_output_step: { value: 0.03, min: 0, max: 0.2, step: 0.005 },  // each city rank adds this share to every building's output and every tax
  pop_start: { value: 10, min: 0, max: 100, step: 1 },               // the hero's popularity in a new village
  pop_decay: { value: 0.25, min: 0, max: 5, step: 0.05 },            // popularity lost per minute, down to its floor
  pop_soften: { value: 0.8, min: 0, max: 1, step: 0.05 },            // share of a gain that is lost at popularity 100 (in proportion below): the higher, the harder it is to stay loved
  pop_tax_max: { value: 0.3, min: 0, max: 2, step: 0.05 },           // share added to every tax at popularity 100 (in proportion below)
  pop_market_max: { value: 0.12, min: 0, max: 0.5, step: 0.01 },     // share off the market's buying prices, and added to its selling prices, at popularity 100
  pop_house_step: { value: 25, min: 5, max: 100, step: 5 },          // every this many points of popularity, each house holds one more person
  market_buy_floor: { value: 0.75, min: 0.3, max: 1, step: 0.05 },   // popularity, lighthouse and venue buffs together never bring buying prices under this share ...
  market_sell_cap: { value: 1.3, min: 1, max: 3, step: 0.05 },       // ... nor selling prices above this one (so buying to sell again never pays)
  tax_low_mult: { value: 0.7, min: 0.1, max: 1, step: 0.05 },        // a class on low tax pays this share of its tax ...
  tax_low_sat: { value: 2, min: 1, max: 5, step: 0.25 },             // ... and gains satisfaction this many times faster
  tax_high_mult: { value: 1.4, min: 1, max: 3, step: 0.05 },         // a class on high tax pays this many times its tax ...
  tax_high_sat_cap: { value: 0.8, min: 0.1, max: 1, step: 0.05 },    // ... its satisfaction stops here (under raise_sat: it cannot rise) ...
  tax_high_pop_drain: { value: 0.15, min: 0, max: 2, step: 0.05 },   // ... and the hero loses this much popularity per minute, for each class squeezed
  order_wait: { value: 90, min: 5, max: 900, step: 5 },              // seconds before a new order replaces one honoured or refused
  order_wait_rank: { value: 0.15, min: 0, max: 0.5, step: 0.01 },   // each city rank takes this share off order_wait ...
  order_wait_floor: { value: 0.4, min: 0.1, max: 1, step: 0.05 },   // ... never under this share of it
  order_refuse_cd: { value: 240, min: 0, max: 1800, step: 10 },      // seconds after a refusal before another order can be refused
  order_minutes: { value: 2, min: 0.25, max: 15, step: 0.25 },       // a delivery asks for about this many minutes of what the village makes of that good
  order_gold_mult: { value: 1.6, min: 1, max: 3, step: 0.05 },       // a delivery pays its goods this many times the market's selling price (under its buying price: never worth buying for)
  order_rank_step: { value: 0.25, min: 0, max: 2, step: 0.05 },      // each city rank adds this share to an order's least amount and to its fixed pay
  order_reward_scale: { value: 1, min: 0.1, max: 5, step: 0.05 },    // multiplies the gold of every order
  work_cost_scale: { value: 1, min: 0.1, max: 10, step: 0.05 },      // multiplies the price of every stage and embellishment of the great works
  renown_per_rank: { value: 2, min: 0, max: 20, step: 1 },           // renown a new start adds for each city rank the village had reached

  // ---- Places entered full screen and their mini-games (js/venue.js, data/venues.js) ----
  venue_type_cps: { value: 55, min: 10, max: 400, step: 5 },         // letters per second as a keeper's line is written out
  venue_wait: { value: 240, min: 0, max: 1800, step: 10 },           // seconds before a place's game can be played again (the first game is free)
  venue_buff_time: { value: 300, min: 30, max: 1800, step: 10 },     // seconds a place's gift lasts after its game (what it is, per medal: data/venues.js)
  venue_pop_scale: { value: 1, min: 0, max: 5, step: 0.05 },         // multiplies the popularity every mini-game gives (per medal: data/venues.js)
  venue_streak_max: { value: 10, min: 0, max: 30, step: 1 },         // wins in a row at one place past which its game gets no harder
  venue_streak_pop: { value: 0.05, min: 0, max: 0.5, step: 0.01 },   // each win of that streak adds this share to the popularity the game gives
  venue_count: { value: 0.75, min: 0.2, max: 2, step: 0.05 },        // seconds each of « 3, 2, 1 » stays on screen before a game starts
  cafe_time: { value: 40, min: 15, max: 90, step: 1 },               // café, « Le coup de feu »: seconds the rush lasts
  cafe_patience: { value: 11, min: 3, max: 30, step: 0.5 },          // seconds the first customers wait at the counter (30 % less by the end of the rush)
  cafe_patience_min: { value: 5, min: 2, max: 20, step: 0.5 },       // ... and the least any customer waits, deep in a streak
  cafe_wait_rate: { value: 0.3, min: 0, max: 1, step: 0.05 },        // share of that pace at which those still in the queue lose patience
  cafe_show: { value: 3.2, min: 0.5, max: 10, step: 0.1 },           // seconds an order stays readable in its bubble before it must be remembered
  cafe_show_min: { value: 1.2, min: 0.3, max: 5, step: 0.1 },        // ... and the least, deep in a streak
  cafe_wrong: { value: 1.5, min: 0, max: 6, step: 0.1 },             // seconds of patience a wrong cup costs
  cafe_again: { value: 1.4, min: 0, max: 5, step: 0.1 },             // seconds the customer shows his order again after a wrong cup
  cafe_gap: { value: 4.5, min: 1, max: 15, step: 0.5 },              // seconds between two customers joining the queue at the start (half that by the end)
  cafe_strikes: { value: 3, min: 1, max: 10, step: 1 },              // customers who may leave unserved before the rush is called off
  market_time: { value: 40, min: 15, max: 90, step: 1 },             // market, « Marchandage »: seconds before the market closes and the deal is struck as it stands
  market_speed: { value: 0.55, min: 0.1, max: 3, step: 0.05 },       // crossings of the dial per second the needle makes in the first round
  market_speed_step: { value: 0.07, min: 0, max: 0.5, step: 0.01 },  // ... added each round
  market_zone: { value: 0.24, min: 0.05, max: 0.6, step: 0.01 },     // share of the dial the good zone covers in the first round
  market_shrink: { value: 0.85, min: 0.5, max: 1, step: 0.01 },      // the zone x this after each push
  market_zone_min: { value: 0.07, min: 0.02, max: 0.3, step: 0.01 }, // the narrowest the zone ever gets
  market_perfect: { value: 0.3, min: 0.05, max: 1, step: 0.05 },     // share of the zone, in its middle, where the stop is perfect
  market_grace: { value: 0.012, min: 0, max: 0.1, step: 0.002 },     // share of the dial either side of the zone that still counts as in it
  market_push: { value: 0.11, min: 0, max: 0.5, step: 0.01 },        // share of her patience the first push costs (each round a third more; up to half more again, by chance)
  market_miss: { value: 0.3, min: 0, max: 1, step: 0.02 },           // share of her patience a stop outside the zone costs
  forge_time: { value: 36, min: 15, max: 90, step: 1 },              // forge, « Battre le fer »: seconds a blade takes
  forge_bpm: { value: 80, min: 40, max: 160, step: 1 },              // beats a minute of the hammer
  forge_bpm_step: { value: 3, min: 0, max: 12, step: 0.5 },          // ... added for each win of the streak
  forge_lead: { value: 1.7, min: 0.6, max: 4, step: 0.1 },           // seconds a mark takes from the edge of the rail to the anvil
  forge_good: { value: 0.13, min: 0.04, max: 0.4, step: 0.01 },      // seconds either side of the mark where a blow counts
  forge_perfect: { value: 0.055, min: 0.02, max: 0.2, step: 0.005 }, // ... and where it is perfect
  forge_cool: { value: 0.075, min: 0, max: 0.4, step: 0.005 },       // share of the heat gauge the blade loses each second
  forge_pump: { value: 0.12, min: 0.02, max: 0.5, step: 0.01 },      // share of the gauge one stroke of the bellows gives
  forge_band: { value: 0.17, min: 0.05, max: 0.4, step: 0.01 },      // half-width of the band of good heat, as a share of the gauge
  forge_cold_mult: { value: 0.4, min: 0, max: 1, step: 0.05 },       // share of a blow's worth kept when the heat is out of its band
  forge_chain: { value: 5, min: 2, max: 20, step: 1 },               // good blows in a row that set the sparks flying (each then counts a tenth more)

  // ---- Exploration: the fog, the places found, the expeditions (js/explore.js, data/explore.js) ----
  fog_cell: { value: 4, min: 2, max: 16, step: 1 },                  // tiles on one side of a cell of fog: a cell is seen or not, whole
  fog_alpha: { value: 0.9, min: 0.3, max: 1, step: 0.02 },           // how dark the veil over the land not seen yet is
  fog_sight_margin: { value: 6, min: 0, max: 30, step: 1 },          // tiles beyond the safe zone the town sees around its hall (the city's 'sight' bonus adds to it)
  fog_sight_building: { value: 7, min: 2, max: 20, step: 1 },        // tiles each building sees around itself
  fog_sight_soldier: { value: 6, min: 2, max: 20, step: 1 },         // tiles a soldier sees as he walks: sending the guard somewhere explores it
  fog_sight_hero: { value: 8, min: 2, max: 20, step: 1 },            // tiles the hero sees along his expeditions
  fog_sight_scout: { value: 8, min: 2, max: 20, step: 1 },           // tiles scouts see around them near the village ...
  scout_fan: { value: 0.15, min: 0, max: 0.5, step: 0.01 },          // ... plus this many for each tile they are from the hall: they roam wider far from home
  fog_sight_camp: { value: 9, min: 2, max: 20, step: 1 },            // tiles always seen around the goblin camp (half as many along the way to it)
  site_spacing: { value: 16, min: 8, max: 48, step: 1 },             // the land hides one place at most per square of this many tiles
  site_density: { value: 0.6, min: 0.05, max: 1, step: 0.05 },       // share of those squares that hold a place (water and the hall's surroundings take some away)
  site_min_dist: { value: 40, min: 20, max: 100, step: 1 },          // tiles from the hall within which no place lies: beyond the safe zone at its widest (raid_camp_dist - 8)
  site_level_step: { value: 12, min: 3, max: 60, step: 1 },          // tiles farther from the hall for one more level of a place
  site_foe_step: { value: 0.3, min: 0, max: 1, step: 0.05 },         // each level of a ruin or a lair adds this share to its enemies' health and blows
  site_reward_step: { value: 0.5, min: 0, max: 2, step: 0.05 },      // each level of a place adds this share to its rewards, its pays and its prices
  site_pay_cycle: { value: 60, min: 5, max: 600, step: 5 },          // seconds between two pays of the trade routes and the deposits (their numbers are per minute)
  trip_speed: { value: 20, min: 5, max: 120, step: 1 },              // pixels per second the hero travels on an expedition (16 to a tile)
  trip_min: { value: 8, min: 1, max: 120, step: 1 },                 // seconds the shortest expedition's walk takes
  scout_speed: { value: 26, min: 5, max: 120, step: 1 },             // pixels per second scouts walk
  scout_first: { value: 44, min: 20, max: 120, step: 1 },            // tiles the first scouts sent one way walk out before turning back
  scout_step: { value: 14, min: 2, max: 60, step: 1 },               // tiles farther each further trip that way
  scout_max: { value: 3, min: 1, max: 8, step: 1 },                  // parties of scouts out at once
  scout_cost_growth: { value: 1.35, min: 1, max: 3, step: 0.05 },    // each further trip one way costs x this

  // ---- Sieges and warlords (js/raid.js, js/camp.js, data/enemies.js) ----
  siege_after: { value: 5, min: 0, max: 30, step: 1 },               // ordinary raids before the first siege (the first ones stay as the tutorial shows them)
  siege_every: { value: 4, min: 1, max: 20, step: 1 },               // from then on, one raid in this many is a siege led by a warlord
  siege_size: { value: 1.3, min: 1, max: 4, step: 0.05 },            // a siege's column: x this many raiders
  siege_hp: { value: 1.15, min: 1, max: 4, step: 0.05 },             // ... each with x this much health
  siege_bounty: { value: 150, min: 0, max: 2000, step: 10 },         // gold for a siege repelled, times the sieges already seen + 1, on top of the raid's own bounty
  siege_pillage: { value: 1.5, min: 1, max: 5, step: 0.1 },          // during a siege, each raider at the hall steals x this much
  siege_breaks: { value: 2, min: 1, max: 6, step: 1 },               // ... and damages this many buildings (a raid: one)
  warlord_growth: { value: 0.3, min: 0, max: 2, step: 0.05 },        // the warlord on the map: health and blows +this share per siege already seen
  warlord_duel_growth: { value: 0.25, min: 0, max: 2, step: 0.05 },  // the warlord in the duel: strength +this share per siege already seen
  warlord_leaks: { value: 2, min: 1, max: 5, step: 1 },              // the warlord at the hall counts as this many raiders, and pillages as many times
  warlord_aura: { value: 56, min: 16, max: 200, step: 4 },           // pixels around the marching warlord where his raiders are tougher
  warlord_aura_guard: { value: 0.3, min: 0, max: 0.9, step: 0.05 },  // share taken off every blow a raider in that aura receives
  duel_rout_hp: { value: 0.3, min: 0, max: 0.9, step: 0.05 },        // the duel won: share of its health every raider of the column loses
  duel_rout_speed: { value: 0.2, min: 0, max: 0.8, step: 0.05 },     // ... share of its speed
  duel_rout_flee: { value: 0.25, min: 0, max: 0.9, step: 0.05 },     // ... and share of the raiders that flee at once
  elite_rank: { value: 3, min: 0, max: 12, step: 1 },                // the city rank from which every raid comes with a scourge (data/enemies.js DATA.elites; 3: the Cité)
  elite_more_every: { value: 2, min: 1, max: 10, step: 1 },          // one more scourge every this many ranks above it ...
  elite_max: { value: 3, min: 1, max: 5, step: 1 },                  // ... this many at most
  elite_bounty: { value: 0.4, min: 0, max: 3, step: 0.05 },          // a raid repelled pays +this share of its bounty for each scourge it had
  elite_burn_max: { value: 6, min: 0, max: 30, step: 1 },            // buildings the Incendiaires may set fire to in one raid
  royal_size: { value: 1.4, min: 1, max: 4, step: 0.05 },            // the royal siege: its first waves x this many raiders (Grakk's has a siege's size)
  royal_gap: { value: 45, min: 5, max: 600, step: 5 },               // ... seconds between a wave repelled and the next one leaving the camp
  royal_retry: { value: 600, min: 0, max: 3600, step: 30 },          // ... seconds before it can be tried again once lost
  royal_lord_lvl: { value: 1, min: 0, max: 10, step: 1 },            // ... Grakk's level above the sieges already seen
  royal_pop: { value: 12, min: 0, max: 50, step: 1 },                // ... popularity for it repelled
  raid_rank_hp: { value: 0.2, min: 0, max: 1, step: 0.01 },          // raiders' health +this share for every city rank above the Ville: the threat keeps up with the town
  duel_pop: { value: 6, min: 0, max: 50, step: 1 },                  // popularity the hero gains for a warlord beaten in a duel
  camp_chief_hp: { value: 0.6, min: 0.1, max: 5, step: 0.05 },       // a camp's chief: x the warlord's health (data/enemies.js), then the camp's growth
  camp_chief_gold: { value: 100, min: 0, max: 2000, step: 10 },      // gold more a fallen camp leaves for its chief, times the camps fallen before it
  camp_pop: { value: 5, min: 0, max: 50, step: 1 },                  // popularity the hero gains for a camp razed
  camp_raid_credit: { value: 2, min: 0, max: 6, step: 1 },           // raids repelled a camp razed counts for, toward the city's ranks (not the orders): the raids its respite holds back
  sunder_mult: { value: 0.9, min: 0.2, max: 3, step: 0.05 },         // the duel: a blow that shatters the Garde, as a share of the warlord's attack
  flurry_mult: { value: 0.45, min: 0.1, max: 2, step: 0.05 },        // ... each of three quick blows
  mend_share: { value: 0.15, min: 0, max: 0.6, step: 0.01 },         // ... share of her health a warlord who mends herself gets back

  // ---- View ----
  cam_speed: { value: 260, min: 60, max: 800, step: 10 },            // art pixels per second with the arrow keys, at the window's own zoom
  wall_snap: { value: 0.25, min: 0, max: 0.5, step: 0.05 },            // a drawn rampart stays straight while it strays at most this share of its length off one axis
  walk_fps: { value: 9, min: 2, max: 24, step: 1 },                  // frames per second of a walking figure
  portrait_fps: { value: 6, min: 1, max: 24, step: 1 },              // frames per second of a shopkeeper's portrait

  // ---- The tutorial (data/tutorial.js) ----
  tuto_type_cps: { value: 70, min: 10, max: 400, step: 5 },          // letters per second as the guide's line is written out
  tuto_dim: { value: 0.55, min: 0, max: 0.9, step: 0.05 },           // how dark the part of the screen that cannot be clicked gets
  tuto_gap: { value: 3, min: 0, max: 120, step: 1 },               // seconds between a lesson (or the start) ending and the next lesson offered
  tuto_later: { value: 240, min: 30, max: 1800, step: 30 },          // seconds a lesson put off (« Plus tard ») waits before it is offered again

  // ---- Where she suggests building (js/siting.js): what a place costs, lower is better ----
  siting_reach: { value: 30, min: 10, max: 60, step: 1 },            // tiles from the hall the places are looked for in, at most
  siting_path_max: { value: 6, min: 0, max: 16, step: 1 },           // tiles of new path she may ask for to reach a better place
  siting_path: { value: 1.5, min: 0, max: 10, step: 0.1 },           // each tile of new path it needs
  siting_far: { value: 0.3, min: 0, max: 3, step: 0.05 },            // each tile from the hall (big farms: half)
  siting_near: { value: 1.2, min: 0, max: 5, step: 0.1 },            // each tile from where a step of the start says (`near`)
  siting_noise: { value: 4, min: 0, max: 20, step: 0.5 },            // each point of noise (negative beauty) on each house in reach
  siting_charm: { value: 1.5, min: 0, max: 10, step: 0.1 },          // each point of beauty on each house in reach (rewarded)
  siting_serve: { value: 2, min: 0, max: 10, step: 0.1 },            // each house a service reaches (rewarded, more for a house it did not reach)
  siting_kin: { value: 1.5, min: 0, max: 10, step: 0.1 },            // a workshop by its own kind or its chain, a house by houses (rewarded)
  siting_cramp: { value: 0.6, min: 0, max: 5, step: 0.1 },           // each tile of another building against it
  siting_pocket: { value: 3, min: 0, max: 20, step: 0.5 },           // each free tile walled in for good (a sliver between two buildings: 40 %)
  siting_block: { value: 4, min: 0, max: 20, step: 0.5 },            // the tile straight on from a street's dead end (the next two: half)
  siting_front: { value: 1, min: 0, max: 10, step: 0.1 },            // each tile of a decoration or a tower beside a street
  siting_face: { value: 0.4, min: 0, max: 3, step: 0.1 },            // each tile of a workshop's side along its street (rewarded)
  siting_tower: { value: 1, min: 0, max: 5, step: 0.1 },             // each tile a tower stands from the front facing the camp
};
