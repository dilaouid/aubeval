// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The city's content: its ranks, what makes the hero popular, the citizens' orders, the great
// works and the legacy tree, with the words of their screens. Content only: the rules are in
// js/city.js, the global knobs in config.js (The city). Loaded after data/strings.js.
window.DATA = window.DATA || {};

// The interface's words for the city (js/city.js). Every key starts with city_.
Object.assign(DATA.strings, {
  city_title: 'La cité · {name}',
  city_t_rank: 'Rang', city_t_orders: 'Commandes', city_t_taxes: 'Impôts', city_t_works: 'Chantiers', city_t_legacy: 'Héritage',
  city_hud_tip: '{name} · popularité du héros {n} / 100\nCliquez pour ouvrir la Cité (G).', city_hud_tip_order: 'Une commande peut être honorée.', city_hud_tip_rank: 'Le rang suivant peut être proclamé.',
  // conditions (js/quests.js describe reads them through City.describe)
  city_need_rank: 'Rang de cité : {name} (ici : {have})', city_need_pop: 'Popularité du héros {n} (ici : {have})',
  city_need_orders: 'Commandes honorées ({have}/{n})', city_need_raids: 'Raids repoussés par ce village ({have}/{n})', city_need_raids_camp: ' · un camp rasé en vaut {k}',
  city_need_works: 'Étapes de grands chantiers ({have}/{n})', city_need_camps: 'Camps gobelins rasés ({have}/{n})',
  city_need_royal: 'Siège royal repoussé : trois vagues, Grakk à la dernière', city_need_royal_on: 'Siège royal en cours : vague {wave}/{of}', city_need_royal_short: 'Siège royal',
  city_royal_btn: 'Affronter le Siège royal', city_royal_others: 'Remplissez d’abord les autres conditions du rang.',
  city_royal_tip: 'Affronter le Siège royal\n{n} vagues de suite, chacune plus nombreuse et avec un fléau de plus. Grakk le Fendeur mène la dernière : il peut être défié en duel.\nUne seule vague qui passe, et c’est à retenter plus tard.',
  city_royal_busy: 'Pas pendant un raid, ni quand la corne a sonné.', city_royal_early: 'Les raids n’ont pas encore commencé.', city_royal_cd: 'Grakk regroupe ses troupes : encore {time}.',
  city_royal_won: 'Le Siège royal est repoussé !', city_royal_won_text: 'Grakk et ses trois vagues ont reflué devant vos murs. Le royaume n’attend plus que votre proclamation : la Cité (G), onglet Rang.',
  city_why_royal: 'Siège royal repoussé',
  // the Rang tab
  city_rank_n: 'Rang {n}', city_rank_gives: 'production et impôts +{pct} %',
  city_pop_title: 'Popularité du héros : {n} / 100',
  city_pop_gives: 'Elle donne : impôts +{tax} %, Marché {mk} % moins cher à l’achat et {mk} % plus cher à la vente, +{house} habitant(s) par maison.',
  city_pop_next: 'Un habitant de plus par maison à {n}.',
  city_pop_decay: 'Elle s’effrite de {n} par minute, jamais sous {floor}. Plus elle est haute, plus elle monte lentement.',
  city_pop_squeeze: 'Impôts élevés : {n} de moins par minute.',
  city_pop_log: 'D’où elle vient', city_pop_nolog: 'Rien encore : honorez une commande, repoussez un raid, gagnez un combat.',
  city_next: 'Vers : {name}', city_reward_pop: 'popularité +{n}', city_opens: 'Ouvre : {list}', city_rank_out: '+{pct} % de production et d’impôts',
  city_proclaim: 'Proclamer : {name}', city_proclaim_tip: 'Proclamer\nLa ville prend son nouveau rang : une récompense, et ce qu’il ouvre.', city_proclaim_no: 'Proclamer\nIl manque encore des conditions.',
  city_banner: '{name} !', city_banner_sub: 'Aubeval est proclamée · rang {n}',
  // where the popularity came from
  city_why_raid: 'Raid repoussé', city_why_siege: 'Siège brisé', city_why_raidlost: 'Raid perdu', city_why_camp: 'Camp gobelin rasé',
  city_why_quest: 'Quête accomplie', city_why_battle: 'Combat gagné', city_why_boss: 'Chef vaincu', city_why_class: 'Une maison s’élève',
  city_why_site: 'Lieu exploré', city_why_game: 'Jeu réussi', city_why_order: 'Commande honorée', city_why_work: 'Chantier : {name}',
  city_why_rank: 'Proclamation : {name}',
  // the Commandes tab
  city_orders_done: 'Commandes honorées : {n}', city_refuse_in: 'Refus possible dans {time}',
  city_orders_closed: 'Les commandes des habitants arrivent avec la première maison.',
  city_order_wait: 'Une nouvelle commande arrive dans {time}', city_order_worth: '×{n} commandes', city_opens_slot: '{n} commandes à la fois', city_deliver: 'Livrer', city_honour: 'Honorer', city_refuse: 'Refuser',
  city_refuse_tip: 'Refuser\nLa commande part, une autre arrive dans {wait}. Un seul refus toutes les {cd}.',
  city_order_no: 'Pas encore remplie.', city_order_done: 'Commande honorée : {title}', city_medals: ['', 'bronze', 'argent', 'or'],
  // the Impôts tab
  city_tax_help: 'Un niveau par classe. Chaque bouton affiche ce que la classe paierait par minute à ce niveau.',
  city_tax_total: 'Impôts en ce moment : {n} or par minute', city_tax_class: '{name} · {houses}', city_tax_none: '{name} · aucune maison',
  city_tax_low: 'Bas', city_tax_normal: 'Normal', city_tax_high: 'Élevé', city_tax_min: '{n}/min',
  city_tax_fx_low: 'Bas : la satisfaction monte {k} fois plus vite.', city_tax_fx_normal: 'Normal : ni plus, ni moins.',
  city_tax_fx_high: 'Élevé : satisfaction plafonnée à {cap} %, ces maisons ne s’élèvent plus · popularité −{n}/min.',
  city_tax_tip_low: 'Bas\nImpôt ×{m}. La satisfaction monte {k} fois plus vite : les maisons s’élèvent plus tôt.',
  city_tax_tip_normal: 'Normal\nL’impôt habituel.',
  city_tax_tip_high: 'Élevé\nImpôt ×{m}. La satisfaction plafonne à {cap} % : ces maisons ne peuvent plus s’élever, et le héros perd {n} de popularité par minute.',
  city_tax_tip_now: 'Maintenant : {now} or/min · à ce niveau : {then} or/min',
  // the great works
  city_works_help: 'Trois monuments, ouverts par les rangs. C’est là que partent les surplus : chaque étape coûte des milliers de ressources et donne un bonus permanent à toute la ville.',
  city_work_gives: 'Ce qu’il donne', city_work_next: 'Étape suivante : {name}', city_work_embel: 'Embellissement n° {n}',
  city_work_build: 'Bâtir : {name}', city_work_embel_do: 'Embellir', city_embel_n: 'Embellissements : {n}',
  city_work_damaged: 'Endommagé : il ne donne plus rien. Réparez-le.', city_work_place: 'Poser les fondations', city_work_see: 'Voir le chantier',
  city_work_place_help: 'Il se pose comme un bâtiment (onglet Chantiers de la barre du bas) : cela coule ses fondations.',
  city_work_done: '{name} : {stage} !', city_work_more: '{name} : embellissement n° {n}.', city_work_banner: 'Chantier achevé !',
  city_work_banner_text: '{name} domine Aubeval. Le chantier ne s’arrête pas pour autant : chaque embellissement ajoute encore un peu à ce qu’il donne, sans fin.',
  // the legacy tree and the new start
  city_renown: 'Renommée : {n}', city_renown_free: 'À dépenser : {n} · production +{pct} % pour toujours',
  city_legacy_help: 'La Renommée se gagne à chaque nouveau départ et ne se perd jamais. Dépensée ici, elle donne des bonus qui valent pour ce village et tous les suivants.',
  city_ns_title: 'Un nouveau départ', city_ns_gain: 'Maintenant : +{n} Renommée ({gold} pour l’or gagné, {rank} pour le rang).',
  city_ns_none: 'Pas encore de Renommée à gagner : faites grandir ce village.',
  city_ns_keep: 'Restent : le héros, ses quêtes, l’héritage, les lieux découverts. Repartent de zéro : bâtiments, réserves, rang, commandes, impôts et chantiers.',
  city_ns_stock: 'Vous repartirez avec : {list}.', city_ns_do: 'Prendre un nouveau départ', city_ns_sure: 'Cliquez encore pour confirmer', city_ns_raid: 'Pas pendant un raid.',
  city_node_lvl: '{n} / {max}', city_node_need: 'Demande : {list}', city_node_max: 'Au maximum', city_node_none: 'Pas encore appris',
  city_node_tip: '{name}\n{desc}\nNiveau suivant : {cost} Renommée.', city_node_req: '{name} niv. {n}',
});

// ---- The timeline aimed for (a player who plays well; estimated from the numbers below, not measured) ----
//   0:25   first Artisans       unchanged: 8 houses, a café, 60 gold. No rank asked (Hameau).
//   0:40   Bourg                40 inhabitants, 4 Artisan houses, 2 orders, 1 raid
//   1:10   first Bourgeois      10 Artisan houses, a chapel, 450 gold
//   2:00   Ville                120 inhabitants, 6 Bourgeois houses, popularity 30, 15 orders, 5 raids
//   2:30   first Négociants     12 Bourgeois houses, 3 000 gold and 30 cloth; the cathedral opens
//   4:15   Cité                 260 inhabitants, 8 Négociant houses, popularity 45, 45 orders, 14 raids,
//                               the cathedral's walls (2 stages of great works)
//   5:15   first Nobles         14 Négociant houses, popularity 50, beauty 10, 30 000 gold and 60 jewels
//   7:00+  Capitale             6 Noble houses, popularity 60, 75 orders, 16 raids, 6 stages, a camp razed,
//                               and the royal siege repelled (three waves in a row, launched by the player)
//   then   Capitale II, III...  DATA.city.endless, for ever
// What holds the pace are counts that grow at a bounded rate: orders (three at a time, more from the
// Ville: DATA.city.slots; config.js order_wait between two, shorter with every rank; a great order counts for several), raids (config.js raid_interval), the popularity (it decays) and the great
// works (thousands of several goods). config.js city_pace multiplies the orders and raids asked.

DATA.city = {
  // The ranks, lowest first. A village starts at the first. Rising is proclaimed by the player once
  // `needs` holds: the usual conditions of js/quests.js (pop, cls) and the city's own, counted for
  // this village only: popularity, orders (honoured), raids (repelled), works (stages of great works,
  // all monuments together), camps (razed), royal (the royal siege repelled for this rank: js/raid.js). reward: gold, goods, popularity. opens: one line said
  // beside what the game finds by itself (the classes and buildings that ask for this rank).
  ranks: [
    { name: 'Hameau', text: 'Quelques toits autour d’un hôtel de ville.' },
    { name: 'Bourg', needs: { pop: 40, cls: { artisan: 4 }, orders: 2, raids: 1 },
      reward: { gold: 300, res: { planks: 100, shard: 1 }, pop: 5 },
      text: 'On vient au marché d’Aubeval depuis les fermes alentour.', opens: 'des commandes plus riches' },
    { name: 'Ville', needs: { pop: 120, cls: { burgher: 6 }, popularity: 30, orders: 15, raids: 5 },
      reward: { gold: 2000, res: { stone: 400, shard: 2 }, pop: 6 },
      text: 'Des remparts, une cloche, des bourgeois : Aubeval compte sur les cartes.', opens: 'les commandes de luxe' },
    { name: 'Cité', needs: { pop: 260, cls: { merchant: 8 }, popularity: 45, orders: 45, raids: 14, works: 2 },
      reward: { gold: 12000, res: { cloth: 100, shard: 3 }, pop: 8 },
      text: 'Les négociants y tiennent comptoir, et la cathédrale sort de terre.' },
    { name: 'Capitale', needs: { pop: 500, cls: { noble: 6 }, popularity: 60, orders: 75, raids: 16, works: 6, camps: 1, royal: true },
      reward: { gold: 60000, res: { jewel: 60, shard: 5 }, pop: 10 },
      text: 'Le royaume se gouverne désormais depuis Aubeval.', opens: 'les rangs sans fin : Capitale II, III…' },
  ],
  // After the last named rank, for ever: « Capitale II » is k = 1. Each pair is [at the last named
  // rank, more per rank after it]; popularity has a ceiling; the gold reward is [base, x per rank].
  endless: {
    name: 'Capitale', text: 'Aubeval grandit encore, et tout le royaume le sait.', opens: 'un rang de plus, toujours',
    pop: [500, 100], cls: { noble: [6, 3] }, popularity: [60, 5, 85], orders: [75, 30], raids: [24, 8], works: [6, 3], camps: [1, 1],
    reward: { gold: [60000, 1.5], res: { jewel: [60, 20], shard: [5, 1] }, pop: 10 },
  },

  // What the hero's popularity gains (or loses) for each thing the game tells the city (js/city.js
  // event). game: by the mini-game's score, 0 lost to 3 gold. stage, embel: a great work's step.
  fame: { raid: 3, siege: 6, raidLost: -4, camp: 0, quest: 2, battle: 1, boss: 4, cls: 1, site: 0, game: [0, 0, 0, 0], stage: 4, embel: 1 }, // camp, site, game: 0 here: js/camp.js, js/explore.js and js/venue.js give their own (config.js camp_pop, data/explore.js, data/venues.js)
  logLines: 5,                       // lines of « D'où elle vient » kept and shown

  // The orders. Three are on offer at once (more as the city rises: slots), drawn by weight `w` among those the village can do now.
  //   kind     deliver (res: the goods it may ask for, only those a standing building makes; min: the
  //            least, before the rank scales it) | build (of: buildings, only unlocked ones; n) |
  //            raise (n houses) | beauty (step: points above the prettiest street) | raid | battle |
  //            camp (soldiers: how many it takes to be asked) | game (score: 1 bronze to 3 gold) | site
  //   rank     the least city rank that offers it
  //   n, per, max   how many it asks: n, one more every `per` ranks, `max` at most
  //   gold, mins    its pay: gold (grown by config.js order_rank_step per rank) plus `mins` minutes of
  //            the town's taxes. A delivery pays its goods above the market's price instead
  //            (config.js order_gold_mult), `gold` at least.
  //   pop      popularity gained · bonus, chance: a rare resource, and how often it comes with it
  //   worth    how many honoured orders it counts for, for the ranks (1 when not said) · scale: x its amount
  //   text     holes: {n} how many, {res} the goods, {name} the building or the venue, {score} the medal
  orders: [
    { id: 'feast', kind: 'deliver', w: 4, res: ['bread', 'wheat', 'coffee', 'spice', 'beans'], min: 20, gold: 30, pop: 2,
      title: 'Le banquet', from: 'Mélisande', text: 'Un banquet se prépare sur la place : il y faut {n} {res}.' },
    { id: 'yard', kind: 'deliver', w: 4, res: ['wood', 'planks', 'stone'], min: 40, gold: 30, pop: 2,
      title: 'Le chantier voisin', from: 'Le maître charpentier', text: 'Le village d’à côté rebâtit sa halle : {n} {res}, et il paie bien.' },
    { id: 'luxury', kind: 'deliver', w: 3, rank: 2, res: ['cloth', 'jewel', 'wool'], min: 10, gold: 200, pop: 3, bonus: { shard: 1 }, chance: 0.4,
      title: 'La dot', from: 'Dame Ysolde', text: 'Une grande famille marie sa fille : {n} {res} pour la dot.' },
    { id: 'build', kind: 'build', w: 2, of: ['house', 'farm', 'lumber_hut', 'sawmill', 'bakery', 'watchtower'], n: 1, per: 2, max: 3, gold: 50, mins: 1, pop: 2,
      title: 'On manque de place', from: 'Maître Odon', text: 'Le conseil réclame : {name} ({n} de plus).' },
    { id: 'adorn', kind: 'build', w: 2, of: ['fountain', 'statue', 'well', 'lamp', 'bench', 'flowers', 'banner', 'hedge'], n: 2, per: 2, max: 5, gold: 40, mins: 0.75, pop: 2,
      title: 'Une ville qui se montre', from: 'Les habitants', text: 'Les habitants veulent de quoi être fiers : {name} ({n} de plus).' },
    { id: 'raise', kind: 'raise', w: 3, n: 1, per: 3, max: 3, gold: 80, mins: 1.5, pop: 3,
      title: 'Une famille qui monte', from: 'Maître Odon', text: 'Élevez {n} maison(s) à la classe du dessus.' },
    { id: 'beauty', kind: 'beauty', w: 2, step: 3, gold: 60, mins: 1, pop: 2,
      title: 'La plus belle rue', from: 'Les habitants', text: 'Qu’une maison au moins ait une rue de beauté {n}.' },
    { id: 'raid', kind: 'raid', w: 3, n: 1, per: 3, max: 3, gold: 80, mins: 1.5, pop: 3,
      title: 'Tenir la porte', from: 'Capitaine Hilde', text: 'Repoussez {n} raid(s) : la garde veut montrer ce qu’elle vaut.' },
    { id: 'battle', kind: 'battle', w: 3, n: 1, per: 2, max: 3, gold: 60, mins: 1, pop: 2,
      title: 'Les routes sont peu sûres', from: 'Les colporteurs', text: 'Gagnez {n} combat(s) : une quête ou un contrat (J).' },
    { id: 'camp', kind: 'camp', w: 1, rank: 1, soldiers: 3, gold: 300, mins: 4, pop: 6, bonus: { shard: 2 }, chance: 1,
      title: 'En finir avec le camp', from: 'Capitaine Hilde', text: 'Rasez le camp gobelin : envoyez-y vos soldats.' },
    { id: 'game', kind: 'game', w: 3, score: 1, per: 3, gold: 40, mins: 0.75, pop: 2,
      title: 'On vous attend', from: 'Gaspard', text: 'Allez jouer une partie : {name}, médaille de {score} au moins.' },
    { id: 'site', kind: 'site', w: 3, gold: 150, mins: 2, pop: 4, bonus: { shard: 1 }, chance: 0.5,
      title: 'Ce qu’on a trouvé là-bas', from: 'Les éclaireurs', text: 'Menez à bien un lieu découvert en explorant (E).' },
    // the great orders: from the Cité, a big delivery that counts for three
    { id: 'convoy', kind: 'deliver', w: 3, rank: 3, res: ['planks', 'stone', 'bread', 'coffee', 'cloth', 'spice', 'wool', 'jewel'], min: 60, scale: 3, worth: 3, gold: 400, pop: 6, bonus: { shard: 1 }, chance: 0.6,
      title: 'Le convoi royal', from: 'L’intendant du roi', text: 'La cour lève un convoi : {n} {res}. Une grande commande, elle compte triple.' },
  ],
  slots: [3, 3, 4, 5],               // orders on offer at once, by city rank (Hameau, Bourg, Ville, Cité…); the last holds for every rank above
  firstWaits: [5, 45, 90],           // seconds before each of the first three slots gets its first order (a slot the rank opens gets its first at once)
  retry: 15,                         // seconds an empty slot waits again when nothing can be asked yet
  beautyCap: 40,                     // no order asks for a street prettier than this

  // The great works (data/buildings.js, monument: true). A monument's level is the stage of its
  // works: 1 once its foundations are laid (the building's own price), then `costs` for stages 2, 3
  // and 4, then `embel.cost` x `embel.growth` for each embellishment, for ever. Four goods at most
  // in a price (the building panel's footer shows it on one line).
  //   gives    what each stage adds, by bonus key (DATA.city.bonuses) · more: what each embellishment adds
  stages: ['Fondations', 'Murs', 'Toiture', 'Achèvement'],
  works: {
    cathedral: {
      costs: [{ stone: 2500, planks: 1500, gold: 6000, cloth: 60 }, { stone: 5000, planks: 4000, gold: 20000, cloth: 200 }, { stone: 9000, planks: 6000, gold: 60000, jewel: 150 }],
      embel: { cost: { stone: 4000, planks: 3000, gold: 40000, jewel: 60 }, growth: 1.35 },
      gives: { sat: 0.15, floor: 5 }, more: { sat: 0.02, floor: 1 },
    },
    castle: {
      costs: [{ stone: 6000, planks: 3000, gold: 20000, bread: 2000 }, { stone: 12000, planks: 6000, gold: 60000, coffee: 1500 }, { stone: 20000, planks: 10000, gold: 150000, jewel: 200 }],
      embel: { cost: { stone: 8000, planks: 4000, gold: 80000, cloth: 300 }, growth: 1.35 },
      gives: { guard: 0.08, soldier: 0.1 }, more: { guard: 0.01, soldier: 0.02 },
    },
    lighthouse: {
      costs: [{ stone: 8000, planks: 5000, gold: 50000, spice: 1500 }, { stone: 15000, planks: 9000, gold: 120000, cloth: 500 }, { stone: 25000, planks: 15000, gold: 300000, jewel: 300 }],
      embel: { cost: { stone: 10000, planks: 6000, gold: 150000, spice: 2000 }, growth: 1.35 },
      gives: { market: 0.03, sight: 4, trip: 0.06 }, more: { market: 0.003, sight: 1, trip: 0.01 },
    },
  },

  // Every permanent bonus the great works and the legacy tree can give, by key: how it is said
  // ({v}: its value, a percentage when pct), and the most it can ever reach (cap).
  // City.bonus(key) gives 'sight', 'guard', 'soldier', 'bounty', 'xp' and 'trip' to the other modules.
  bonuses: {
    sat: { label: 'Satisfaction gagnée à chaque repas : +{v} %', pct: true },
    floor: { label: 'Popularité : jamais sous {v}', cap: 60 },
    guard: { label: 'Pillage des raids : −{v} %', pct: true, cap: 0.8 },
    soldier: { label: 'Soldats : +{v} % de vie et de dégâts', pct: true },
    market: { label: 'Marché : {v} % de mieux, à l’achat comme à la vente', pct: true, cap: 0.2 },
    sight: { label: 'Vue dans le brouillard : +{v} cases', cap: 40 },
    trip: { label: 'Expéditions : −{v} % de temps', pct: true, cap: 0.6 },
    out: { label: 'Production : +{v} %', pct: true },
    tax: { label: 'Impôts : +{v} %', pct: true },
    xp: { label: 'Expérience du héros : +{v} %', pct: true },
    bounty: { label: 'Primes de raid : +{v} %', pct: true },
    orders: { label: 'Paie des commandes : +{v} %', pct: true },
    stock: { label: 'Réserves de départ' },
  },
};

// The legacy tree: permanent bonuses bought with Renown (state.prestige), kept through every new
// start. Three branches; a node opens once the nodes in `after` have the levels given.
//   key, per   the bonus it feeds (DATA.city.bonuses) and what each level adds
//   max        its levels · cost, step: the first level's price in Renown, and how much more each next one costs
//   stock      (key 'stock') what a new start begins with, for each level
//   branch     an id of DATA.legacyBranches, whose text is the name shown (the tutorial covers 'legacy:<id>')
DATA.legacyBranches = { prosperity: 'Prospérité', arms: 'Armes', horizons: 'Horizons' };
DATA.legacy = [
  { id: 'out', branch: 'prosperity', name: 'Mains habiles', key: 'out', per: 0.05, max: 10, cost: 1, step: 1,
    desc: 'Chaque bâtiment produit davantage.' },
  { id: 'tax', branch: 'prosperity', name: 'Trésor royal', key: 'tax', per: 0.05, max: 10, cost: 1, step: 1, after: { out: 2 },
    desc: 'Chaque maison paie davantage.' },
  { id: 'floor', branch: 'prosperity', name: 'Lignée aimée', key: 'floor', per: 4, max: 5, cost: 2, step: 2, after: { tax: 2 },
    desc: 'La popularité du héros ne tombe jamais plus bas.' },
  { id: 'stock', branch: 'prosperity', name: 'Greniers pleins', key: 'stock', per: 1, max: 8, cost: 2, step: 1,
    stock: { wood: 150, planks: 80, stone: 40, bread: 30, gold: 100 }, desc: 'Un nouveau départ commence avec des réserves.' },
  { id: 'orders', branch: 'prosperity', name: 'Carnet d’adresses', key: 'orders', per: 0.1, max: 5, cost: 2, step: 2, after: { stock: 1 },
    desc: 'Les commandes paient mieux.' },
  { id: 'xp', branch: 'arms', get name() { return 'Chroniques ' + heroName(true); }, key: 'xp', per: 0.1, max: 5, cost: 2, step: 2,
    desc: 'Le héros apprend plus vite.' },
  { id: 'bounty', branch: 'arms', name: 'Primes de guerre', key: 'bounty', per: 0.15, max: 6, cost: 2, step: 1, after: { xp: 1 },
    desc: 'Un raid repoussé rapporte plus.' },
  { id: 'guard', branch: 'arms', name: 'Vieux remparts', key: 'guard', per: 0.04, max: 5, cost: 3, step: 2, after: { bounty: 2 },
    desc: 'Les pillards emportent moins.' },
  { id: 'trip', branch: 'horizons', name: 'Cartes anciennes', key: 'trip', per: 0.05, max: 6, cost: 2, step: 1,
    desc: 'Les expéditions vont plus vite.' },
  { id: 'sight', branch: 'horizons', name: 'Longue-vue', key: 'sight', per: 1, max: 4, cost: 3, step: 2, after: { trip: 2 },
    desc: 'La ville voit plus loin dans le brouillard.' },
];
