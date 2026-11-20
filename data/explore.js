// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Exploration: the places the fog hides (js/explore.js), what each kind asks and gives, the scouts'
// price, and the words of the exploration panel. Content only: no logic here. The global knobs
// (how far the town sees, how dense the places are, how fast a trip goes) are in config.js.
//
// A place's level grows with its distance from the hall (config.js site_level_step). What a level
// does: enemies get config.js site_foe_step stronger, rewards and pays site_reward_step bigger.
//
//   name, sprite     the kind's name and its image on the map ('iso.site.<kind>', drawn in code until it exists)
//   icon             the mark over it when something can be done there
//   weight           how often the land's seed picks this kind; `on`: x that on a ground kind (data/world.js)
//   desc             what the panel says of it
//   names            the places' own names, picked by the seed
// To add a kind: an entry here, its drawn look and its rules in js/explore.js (status, action, page).
window.DATA = window.DATA || {};

DATA.explore = {
  size: 2,                                           // tiles on one side of a place's footprint
  scout: { cost: { bread: 8, gold: 25 } },           // the first scouts of a direction; each further trip that way costs config.js scout_cost_growth more
  demo: { sight: 58 },                               // ?demo=1: tiles around the hall where the fog is lifted
  kinds: {
    // A ruin: the hero goes there and fights once. Won, it is explored for good.
    //   foes     who waits there, by level (the last line for every level beyond)
    //   reward   at level 1; its shards grow by one every `shardEvery` levels
    //   pop      popularity for the hero when it is won
    //   relic    sometimes found as well: its chance, and what it is worth at level 1
    ruin: {
      name: 'Ruine', sprite: 'iso.site.ruin', icon: 'icon.raid', weight: 3,
      desc: 'De vieilles pierres que des pillards ont faites leurs. Le héros s’y rend, les en chasse, et fouille ce qu’ils gardaient.',
      foes: [['gobelin', 'gobelin'], ['gobelin', 'gobelin', 'gobelin'], ['brute', 'gobelin'], ['gobelin', 'chaman', 'gobelin'], ['brute', 'chaman', 'gobelin'], ['brute', 'chaman', 'brute']],
      reward: { xp: 30, gold: 60, res: { shard: 1 } }, shardEvery: 2,
      pop: 3,
      relic: { chance: 0.3, gold: 120, res: { shard: 2 }, pop: 2 },
      names: ['Ruines de la Tour-Grise', 'Ruines du Fort Brisé', 'Ruines de la Vieille Vigie', 'Ruines du Donjon Muet', 'Ruines de la Chapelle Noyée',
        'Ruines de la Tour aux Corbeaux', 'Ruines du Bastion Oublié', 'Ruines du Phare Éteint', 'Ruines du Pont des Rois', 'Ruines de l’Abbaye Rouge'],
    },
    // A lair: cleared, it pays, then fills again after `refill` seconds, one level stronger each time.
    //   shardEvery   one clearing in this many also gives a shard
    lair: {
      name: 'Tanière', sprite: 'iso.site.lair', icon: 'icon.raid', weight: 3, on: { rock: 2, marsh: 1.5 },
      desc: 'Un trou où des monstres font leur nid. Vidée, elle paie ; puis d’autres y reviennent, plus forts. Une échelle de combats sans fin.',
      foes: [['gobelin'], ['gobelin', 'gobelin'], ['brute'], ['brute', 'gobelin'], ['brute', 'chaman'], ['brute', 'brute'], ['brute', 'chaman', 'gobelin'], ['brute', 'chaman', 'brute']],
      reward: { xp: 22, gold: 45 }, shardEvery: 3,
      pop: 2, refill: 420,
      names: ['Tanière du Croc-Noir', 'Antre des Ronces', 'Gouffre aux Os', 'Terrier de la Meute', 'Grotte du Vieux Grol', 'Trou des Hurleurs', 'Tanière de la Dent-Creuse', 'Antre du Borgne'],
    },
    // A hamlet: a first gift (the hero carries it) opens a trade route that pays gold every minute.
    // Each further delivery raises its friendship by one level, and the route's pay with it, without a ceiling.
    //   gift     the first gift, at level 1
    //   pay      gold a minute for each level of friendship, at level 1
    //   wants    what it may ask for (only goods the village has already made)
    //   worth    gold value of the first delivery (market selling prices, data/people.js DATA.trade); x growth for each one after
    hamlet: {
      name: 'Hameau', sprite: 'iso.site.hamlet', icon: 'icon.trade', weight: 2, on: { grass: 1.6, autumn: 1.3, rock: 0.5 },
      desc: 'Quelques toits loin de tout. Un premier présent, porté par le héros, ouvre une route de commerce qui rapporte de l’or chaque minute ; chaque livraison ensuite resserre l’amitié et grossit la route.',
      gift: { bread: 15, planks: 10 },
      pay: 8, wants: ['bread', 'planks', 'stone', 'wheat', 'coffee', 'wool', 'cloth', 'spice', 'jewel'], worth: 40, growth: 1.3,
      names: ['Hameau de Valbrume', 'Hameau des Trois-Chênes', 'Hameau de Pierrefeu', 'Hameau du Gué', 'Hameau de Hautefontaine', 'Hameau des Saules', 'Hameau de Combe-Dorée', 'Hameau du Bout-du-Monde', 'Hameau de Malval'],
    },
    // A deposit: claimed by the hero for a price, it sends its vein's yield every minute. Deepened
    // level after level (no hero needed), it sends that much more each time.
    //   claim, deepen   the prices at level 1; deepening costs x growth for each level already dug
    //   veins           what lies there: `gives` a minute at depth 1 and level 1; minLvl: only from that level on
    deposit: {
      name: 'Gisement', sprite: 'iso.site.deposit', icon: 'icon.stone', weight: 2, on: { rock: 3, sand: 1.5 },
      desc: 'Une veine à fleur de terre. Le héros la revendique pour le village : elle envoie alors sa récolte chaque minute. On peut la creuser, niveau après niveau.',
      claim: { planks: 30, gold: 60 }, deepen: { planks: 20, stone: 20, gold: 50 }, growth: 1.5,
      veins: [
        { id: 'stone', name: 'Carrière abandonnée', gives: { stone: 9 }, weight: 4 },
        { id: 'gold', name: 'Filon d’or', gives: { gold: 5 }, weight: 3 },
        { id: 'shard', name: 'Veine runique', gives: { shard: 0.2 }, weight: 1.5, minLvl: 2 },
      ],
    },
  },
};

Object.assign(DATA.strings, {
  ex_title: 'Exploration',
  ex_known: 'Terres connues : {pct} %',
  ex_help: 'Hors du village, la brume cache les terres. Vos bâtiments, vos soldats, le héros et les éclaireurs la lèvent, et trouvent ce qu’elle cache.',
  ex_lvl: 'niv. {n}',
  ex_far: '{n} cases vers {dir}', ex_far_short: '{n} cases · {dir}',
  // the hero's trip
  ex_trip: 'Le héros en expédition',
  ex_trip_out: 'En route vers {name}',
  ex_trip_there: 'Sur place : {name}',
  ex_trip_back: 'Sur le chemin du retour',
  ex_trip_none: 'Le héros est au village. Choisissez un lieu et envoyez-le.',
  ex_trip_mission: 'Le héros est en mission : il partira à son retour.',
  ex_open: 'Ouvrir le lieu', ex_see_hero: 'Amener la vue sur le héros',
  ex_recall: 'Rentrer', ex_recall_tip: 'Rappeler le héros au village\nIl reprend sa garde devant l’hôtel de ville en arrivant.',
  ex_arrived: '{hero} est arrivé : {name}. Ouvrez l’Exploration (E).',
  ex_home: '{hero} est de retour au village.',
  ex_lost: 'Le lieu n’est plus accessible : {hero} rentre.',
  // scouts
  ex_scouts: 'Éclaireurs ({n}/{max} dehors)',
  ex_scout_help: 'Choisissez une direction : ils partent de l’hôtel de ville, lèvent la brume sur leur chemin, puis rentrent. Chaque envoi va plus loin.',
  ex_scout_dir: 'Vers {dir}', ex_scout_dist: 'jusqu’à {n} cases',
  ex_scout_cheap: 'Le moins cher :',
  ex_scout_tip: 'Éclaireurs vers {dir}\nIls marchent {n} cases, puis rentrent ({time}).',
  ex_scout_busy: 'Des éclaireurs sont déjà partis par là.',
  ex_scout_full: 'Tous vos éclaireurs sont dehors ({max}).',
  ex_scout_end: 'Par là, tout est connu jusqu’à la mer.',
  ex_scout_all: 'Tout est connu, dans toutes les directions.',
  ex_scout_out: 'Vers {dir} · retour dans {time}',
  ex_scout_sent: 'Les éclaireurs partent vers {dir}.',
  ex_scout_back: 'Les éclaireurs partis vers {dir} sont rentrés : {found}.',
  ex_scout_found1: 'un lieu trouvé', ex_scout_found: '{n} lieux trouvés', ex_scout_found0: 'rien de neuf, mais la carte s’agrandit',
  ex_dirs_short: ['E', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'],
  // the places
  ex_places: 'Lieux trouvés ({n})',
  ex_none: 'Aucun lieu trouvé pour l’instant. Envoyez des éclaireurs : les premiers lieux sont à une quarantaine de cases de l’hôtel de ville.',
  ex_found: 'Lieu découvert vers {dir} : {name} ({lvl})',
  ex_see: 'Voir', ex_see_tip: 'Amener la vue sur ce lieu',
  ex_open_tip: 'Ouvrir la page de ce lieu',
  ex_back: '‹ Tous les lieux',
  ex_go: 'Y aller', ex_go_tip: 'Envoyer le héros\nTrajet : {time}. Pendant ce temps, il ne garde plus le village.',
  ex_coming: 'En route',
  ex_fight: 'Combattre', ex_gift: 'Offrir', ex_claim: 'Revendiquer', ex_deliver: 'Livrer', ex_deepen: 'Creuser',
  ex_done_btn: 'Explorée',
  ex_need_hero: 'Le héros doit s’y rendre.', ex_go_time: 'Trajet : {time}.',
  ex_foe_scale: 'force +{pct} %',
  ex_lair_back: '{name} est repeuplée ({lvl}).',
  ex_asks: 'Ce qu’il faut', ex_gives: 'Ce qu’on y gagne', ex_foes: 'Qui s’y trouve',
  ex_st_ruin: 'Des pillards y campent', ex_st_done: 'Explorée', ex_st_here: 'Le héros est sur place', ex_st_coming: 'Le héros est en route',
  ex_st_lair: 'Des monstres y nichent', ex_st_lair_again: 'Repeuplée ({n} fois vidée)', ex_st_lair_wait: 'Vide · repeuplée dans {time}',
  ex_st_hamlet: 'Attend un premier présent', ex_st_route: 'Amitié {n} · {gold} or/min',
  ex_st_deposit: 'À revendiquer', ex_st_mine: 'Profondeur {n} · {what}/min',
  ex_blocked: 'Recouvert : rien à y faire pour l’instant',
  ex_reward: 'Butin : {what}',
  ex_relic: 'Une fois sur {n} environ, une relique en plus : {what}.',
  ex_relic_found: 'Une relique dans les ruines ! {what}',
  ex_lair_rule: 'Vidée, elle se repeuple en {time}, un niveau plus forte. Un éclat runique toutes les {n} victoires.',
  ex_lair_count: 'Déjà vidée {n} fois.',
  ex_gift_rule: 'Le premier présent ouvre la route : {gold} or par minute.',
  ex_route_now: 'Route ouverte : {gold} or par minute (amitié {n}).',
  ex_route_next: 'Prochaine livraison : amitié {n}, {gold} or par minute.',
  ex_route_open: 'Route de commerce ouverte avec {name} : +{gold} or par minute.',
  ex_route_up: '{name} : amitié {n}, la route rapporte {gold} or par minute.',
  ex_vein: 'Ce qui s’y trouve : {name}',
  ex_claim_rule: 'Revendiqué, il envoie {what} par minute.',
  ex_mine_now: 'Il envoie {what} par minute (profondeur {n}).',
  ex_mine_next: 'Creusé encore : profondeur {n}, {what} par minute.',
  ex_claimed: '{name} est au village : +{what} par minute.',
  ex_deepened: '{name} : profondeur {n}, {what} par minute.',
  ex_idle_note: 'Les routes et les gisements rapportent aussi quand le jeu est fermé.',
  ex_pop_ruin: 'une ruine explorée', ex_pop_lair: 'une tanière vidée', ex_pop_relic: 'une relique rapportée',
  ex_won_lair: '{name} est vidée. Elle se repeuplera dans {time}.',
  ex_won_ruin: '{name} est explorée.',
});
