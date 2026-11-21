// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Aveline's teaching: the guided start of a first game (`steps`), then a lesson for each thing the
// game opens later (`lessons`). Content only: the rules (what is clickable, the arrow, the dimmed
// screen, when a lesson is offered) are in js/tutorial.js.
//
// ===== THE RULE: the tutorial covers the whole game =====
// Whenever the game changes, this file changes with it. A new building, tab, panel, tool, trap,
// unit, class, resource or mechanic gets a lesson (or a step in one) and its id in that lesson's
// `covers`; a removed or renamed one is taken out. `node tools/check-tutorial.js` lists what no
// lesson covers and every step that names something the game no longer has; the game itself warns
// in the console at start (and the checks count a console warning as an error).
//
// The guide:
//   name, title   shown above what she says
//   portrait      a strip of frames in assets/manifest.js ('portrait.<id>'), as the shopkeepers'
//
// The start (`steps`) plays at the first game, before anything else. A lesson:
//   id, title     a name for the code and the address option ?lesson=<id>; the title she gives it
//   about         one line for the Livre des leçons (the Village panel)
//   when          when it is offered: any condition of the quests (js/quests.js: built, pop, cls,
//                 quest, raidsWon, res, totals, and the city's: rank, popularity, orders (honoured),
//                 raids, works, camps) and: after: '<lesson id>' (that one seen),
//                 unlocked: '<building id>' (its card open), free: n (free inhabitants), horn: true
//                 (a raid is announced or on), order: true (an order is on offer), proclaim: true
//                 (the next rank can be proclaimed), venue: true (a place can be entered), site: true
//                 (a place was found), siege: true (one is announced or on), chief: true (the camp
//                 that stands has one), spend: true (a legacy node can be bought), renown: n (a new
//                 start would give that much), any: [conditions] (one of them holds).
//                 Offered one at a time, in this list's order.
//   raid          true: it may run while a raid is on (the others wait for the raid to end)
//   covers        what it teaches: the ids `node tools/check-tutorial.js` checks (see `mechanics`)
//   steps         as the start's, below
//
// A step, played in this order: she speaks (`say`), then the player does one thing (`task`).
//   id      a name, for the address option ?tuto=<id> (the start) and for reading the code
//   say     what she says before the task, a page at a time (a click or Space turns the page).
//           A page is a string, or { text, show, todo } where `show` is something an arrow points at
//           while she speaks: a place on the screen (see "Places" below), and `todo: true` keeps the
//           page for when the task is to be done (not said when `already` holds).
//   task    one line: what to do now. Stays on screen until `goal` holds.
//   point   where to click, as a list read left to right: the arrow goes to the first entry that
//           is still to do, and ONLY that can be clicked (the rest of the screen is dimmed):
//             'build:<building id>'   its tab in the build bar, its card, then a free place beside a path.
//                                     The place she lights is the best one for the village as it stands
//                                     (js/siting.js); when it is off the streets, the bit of path to it is
//                                     marked to pave first
//             'pick:<card id>'        its tab in the build bar and its card (a building, 'tool:<id>',
//                                     'plant:<flora id>', 'trap:<id>'); then the map is open: put it where you
//                                     like. She lights where she would put it (a trap: on the raiders' way)
//             'pave'                  the Terrain tab, the Chemin card, then the marked tiles (see `pave`)
//             'chop'                  the trees
//             'drag'                  nothing to click: the map is slid with the pointer held down
//             'free'                  the map is open (bars dimmed): click, slide, right button
//             'key:<key code>'        that key, and nothing else (the task says which)
//             'building:<id>'         that building on the map, the last one built (its panel opens)
//             'venue'                 the building of a place that can be entered now (a café first: `venueFirst`)
//             'btab:<id>'             a tab of the open building's panel: info, people, street, look, village, forge, trade, army, taxes, works
//             'ctab:<id>'             a tab of the Cité panel: rank, orders, taxes, works, legacy
//             'craft:<item id>'       the Forge's button for that piece, then the wait while it is forged
//             'panel:<name>'          the top bar's button that opens a panel: hero, quests, people, city, explore, menu
//             'qtab:<id>'             a tab of the quest book: main, side, missions, contracts
//             'mark:<place>'          a place on the screen (see "Places" below)
//   goal    when the step is done. The quests' own conditions (js/quests.js: totals, built, equip,
//           quest, pop...) and: moved: n (the view slid by n pixels), paved: true (the marked tiles
//           are all paved), has: '<item id>' (the hero owns that piece), gain: { <count>: n } (it
//           grew by n since the step began; counts: 'b:<building>' standing, 'lvl:<building>' their
//           levels, 'u:<unit>' ready, 'drill:<unit>' ready or training, 'cleared', 'planted',
//           'traps', 'orders' honoured, 'rank' proclaimed, 'scouts' sent, 'legacy' levels bought),
//           changed: 'style' | 'deck' | 'orders', panel: '<name>' (open), btab, qtab, ctab,
//           sel: n (soldiers chosen), trained: true (the barracks has nobody in training),
//           clicked: '<place>' (a button of the place she shows was pressed), trip: true | false (the
//           hero is on an expedition), exsite: true | false (the Exploration shows a place's page, or its list)
//   unless  a condition (as `when`): the step is skipped when it holds (a unique building already built).
//           And: stuck: 'order' | 'proclaim' | 'work:<monument>' | 'legacy' | 'scout' | 'go': the task
//           cannot be done now (js/tutorial.js stuck). What such a step teaches is said in the step
//           before it, so nothing is lost when it is passed over.
//   already a condition (as `when`): the player did the task before the lesson came (its building
//           stands). She still says the step's lines, but not its `todo` pages, and the task is
//           passed over: nothing lent, no second one to build.
//   count   for a 'pick' step: how many she lends the price of
//   near    for a 'build' step of the start: where the place she lights is drawn to, in tiles from
//           the hall's corner [right, down] (config.js siting_near). Left out, the place is chosen by
//           the village alone. The player may build on any other free place beside a path.
//   pave    how many tiles of path this step marks, in a row from the end of a street
//   gift    resources she hands over when the step is done, so the next one never waits
//   A step with no task is only spoken. The first time a lesson plays, she lends what its task's
//   price lacks (never on a replay): a building's or a card's price, an upgrade or a rampart (of the
//   building opened), a unit's training, a delivery's goods, the scouts' pay; and she tops it up
//   while the task waits, when it was spent meanwhile. She never lends a great work's stage: those are the game's long haul.
//
// Words a line may leave open, filled from the game as it is (js/tutorial.js WORDS): {venue} and
// {keeper} (the place her arrow points at, who keeps it), {game:<place id>} (its game), {lord} and
// {trait} (the siege's warlord, what he changes), {chief} (the camp's chief), {n:<config key>} and
// {t:<config key>} (a number, a time of config.js: a line never repeats a tuning value by hand).
//
// Places an arrow can point at: 'res:<resource id>' (its plate in the top bar), 'btn:<panel>',
// 'bar:<tab id>', 'card:<card id>', 'view' (the zoom buttons), 'hud:quest', 'hud:raid', 'hud:city'
// (while she speaks only: her task box takes its place), 'ctab:<id>', 'city:pop', 'city:proclaim',
// 'city:order', 'city:refuse', 'city:tax', 'city:tax:<low|normal|high>', 'city:work', 'city:found',
// 'city:newstart', 'city:legacy', 'venue:enter', 'explore:known', 'explore:rose', 'explore:scout:<0..7>',
// 'explore:row', 'explore:see', 'explore:go', 'explore:act', 'explore:back', 'explore:trip',
// 'explore:recall', 'siege:lord', 'siege:duel', 'camp:chief',
// 'forge:<item id>', 'equip:<item id>', 'fight:<quest id>', 'btab:<id>', 'act:upgrade',
// 'act:rampart', 'act:move', 'act:demolish', 'train:<unit id>', 'raise', 'style', 'camp:attack', 'import',
// 'trade', 'mission:<id>', 'deck', 'menu:export', 'menu:prestige', 'menu:lessons'. They are named
// where they are drawn (Tuto.mark in js/screens.js, js/city.js, js/explore.js, js/raid.js).
window.DATA = window.DATA || {};

DATA.tutorial = {
  guide: { name: 'Aveline', title: 'Maîtresse bâtisseuse', portrait: 'guide' },
  title: 'Premiers pas',

  // What the game lets a player do that no data id names. Add a line here when the game gains a
  // mechanic, and cover it ('do:<id>') in a lesson. The other ids are read from the data:
  // b:<building>, tab:<build bar tab>, tool:<tool>, plant, trap:<trap>, unit:<unit>, class:<class>,
  // res:<resource>, panel:<top bar panel>, btab:<building panel tab>, qtab:<quest book tab>,
  // ctab:<Cité panel tab>, rank:<n>, order:<kind of order>, tax:<level>, legacy:<branch id>,
  // venue:<place> and game:<place>, site:<kind of place>, lord:<warlord> (js/tuto-check.js).
  mechanics: {
    drag: 'faire glisser la vue', zoom: 'zoomer, revenir au village (C)', chop: 'couper un arbre à la main',
    road: 'un bâtiment qui travaille touche un chemin relié à l’hôtel de ville', chain: 'chaînes de production',
    craft: 'forger', equip: 'équiper le héros', battle: 'le combat de cartes, le souffle', parry: 'la parade au timing',
    intent: 'les intentions annoncées des ennemis, les touches du combat', deck: 'régler le paquet',
    upgrade: 'améliorer un bâtiment', move: 'déplacer', demolish: 'démolir avec remboursement', rotate: 'tourner (R)',
    repair: 'réparer après un raid', style: 'changer le style', need: 'besoins des maisons et plaques rouges',
    raise: 'élever une maison de classe', service: 'services à portée', beauty: 'la beauté du quartier',
    wall: 'tracer un rempart', rampart: 'améliorer tout un rempart d’un coup', enclosure: 'une enceinte (Maj)', safe: 'la zone sûre', call: 'appeler le raid plus tôt',
    horn: 'la corne qui annonce un raid', pillage: 'le pillage d’un raid perdu', workers: 'les ouvriers qui travaillent seuls',
    select: 'choisir des soldats', order: 'envoyer des soldats (clic droit)', recall: 'rappeler les soldats',
    camp: 'raser le camp gobelin', trade: 'acheter et vendre', import: 'l’import d’épices',
    mission: 'missions du héros', contract: 'les contrats', save: 'la sauvegarde', export: 'exporter / importer',
    offline: 'les gains hors-ligne', prestige: 'le nouveau départ', lessons: 'le Livre des leçons',
    orders: 'honorer une commande des habitants', refuse: 'refuser une commande',
    popularity: 'la popularité du héros : ce qu’elle donne, d’où elle vient, son érosion',
    proclaim: 'proclamer le rang suivant', endless: 'les rangs sans fin (Capitale II, III…)',
    tax: 'régler l’impôt d’une classe', works: 'les étapes d’un grand chantier', embellish: 'les embellissements sans fin',
    legacy: 'l’arbre d’héritage', renown: 'la Renommée gagnée et gardée',
    venue: 'entrer chez un tenancier', game: 'les jeux des tenanciers', medal: 'médailles, cadeaux, et l’attente entre deux parties',
    fog: 'la brume', scout: 'les éclaireurs', trip: 'envoyer le héros vers un lieu', home: 'rappeler le héros (« Rentrer »)',
    siege: 'le siège et son chef de guerre', duel: 'défier le chef de guerre', chief: 'le chef d’un camp gobelin',
  },
  // The places a lesson sends the player into, in the order she prefers when several can be entered.
  venueFirst: ['cafe', 'forge'],
  // Her own interface words (js/tutorial.js adds them to DATA.strings).
  strings: {
    tuto_lesson_step_short: '{title} · étape {n} / {all}',
    tuto_order_gift: '{name} a rempli cette commande pour vous, cette fois.',
  },

  covers: ['do:drag', 'do:zoom', 'do:chop', 'res:wood', 'tab:build', 'b:lumber_hut', 'do:road', 'tab:land', 'tool:path',
    'b:sawmill', 'res:planks', 'do:chain', 'b:forge', 'btab:forge', 'do:craft', 'panel:hero', 'do:equip',
    'panel:quests', 'qtab:main', 'do:battle', 'do:parry'],
  steps: [
    { id: 'hello',
      say: [
        'Bienvenue à Aubeval, bourgmestre ! Je suis Aveline, votre maîtresse bâtisseuse. Un hôtel de ville, une clairière… et tout le reste à bâtir.',
        'Je vous montre l’essentiel, pas à pas. Suivez la flèche dorée : elle indique toujours où cliquer.',
      ] },
    { id: 'view',
      say: ['D’abord, regardez autour de vous : maintenez le clic sur la carte et faites-la glisser.'],
      task: 'Maintenez le clic et faites glisser la carte.',
      point: ['drag'], goal: { moved: 90 } },
    { id: 'wood',
      say: [
        { text: 'Parfait ! La molette zoome, et ces boutons aussi. La touche C ramène toujours la vue au village.', show: 'view' },
        'Tout commence par du bois. Cliquez sur les arbres : chaque coup de hache rapporte une bûche.',
      ],
      task: 'Cliquez sur des arbres pour récolter 5 bois.',
      point: ['chop'], goal: { totals: { wood: 5 } } },
    { id: 'hut',
      say: [
        { text: 'Vos réserves s’affichent là-haut. Mais couper à la main, c’est long : bâtissons une cabane de bûcheron.', show: 'res:wood' },
        'La règle d’or : un bâtiment ne travaille que s’il touche un chemin pavé relié à l’hôtel de ville. Posez-la sur la place qui brille.',
      ],
      task: 'Prenez la carte « Bûcheron », puis posez-la au bord du chemin.',
      point: ['build:lumber_hut'], near: [4, 5], goal: { built: { lumber_hut: 1 } }, gift: { wood: 6 } },
    { id: 'path',
      say: [
        { text: 'Vous voyez le « +1,0/s » sous le bois ? Le village travaille seul, maintenant. Et voici quelques bûches de ma réserve.', show: 'res:wood' },
        'Pour bâtir plus loin, on prolonge la rue. Prenez l’outil Chemin, puis glissez sur les cases marquées : 1 bois par case.',
      ],
      task: 'Onglet Terrain, carte « Chemin » : tracez les cases marquées.',
      point: ['pave'], pave: 4, goal: { paved: true }, gift: { wood: 14 } },
    { id: 'sawmill',
      say: [
        'Belle rue ! Tout ce qui la borde pourra travailler.',
        'Passons aux chaînes de production : la Scierie change le bois en planches. Posez-la le long d’un chemin.',
      ],
      task: 'Prenez la carte « Scierie », puis posez-la au bord d’un chemin.',
      point: ['build:sawmill'], near: [-4.5, 5], goal: { built: { sawmill: 1 } }, gift: { wood: 20, planks: 5 } },
    { id: 'forge',
      say: [
        { text: 'Du bois, puis des planches : voilà une chaîne. Chaque bâtiment nourrit le suivant.', show: 'res:planks' },
        'Avec 8 planches, on bâtit la Forge. C’est là que le village arme son héros, {hero}.',
      ],
      task: 'Prenez la carte « Forge » (8 planches), puis posez-la au bord d’un chemin.',
      point: ['build:forge'], near: [-1, 5], goal: { built: { forge: 1 } }, gift: { planks: 6 } },
    { id: 'sword',
      say: ['Un clic sur un bâtiment ouvre son panneau : on l’y améliore, on le déplace… et à la Forge, on y forge.'],
      task: 'Cliquez la Forge, puis forgez la Lame d’apprenti.',
      point: ['building:forge', 'craft:sword_1'], goal: { has: 'sword_1' } },
    { id: 'equip',
      say: ['La lame est prête ! Il reste à la mettre dans les mains {de_hero}.'],
      task: 'Ouvrez la fiche du Héros, puis équipez la lame.',
      point: ['panel:hero', 'mark:equip:sword_1'], goal: { equip: 'weapon' } },
    { id: 'fight',
      say: [
        '{hero} est armé par votre village. Deux gobelins rôdent autour des réserves : envoyons-le.',
        'En combat, votre village devient un paquet de cartes : chaque bâtiment envoie la sienne. Trois points de souffle par tour pour en jouer.',
        'Et quand un gobelin frappe, pressez Espace à l’instant où l’anneau touche le cercle doré : c’est une parade !',
      ],
      task: 'Ouvrez les Quêtes, puis « Partir au combat ».',
      point: ['panel:quests', 'qtab:main', 'mark:fight:m1'], goal: { quest: 'm1' } },
    { id: 'bye',
      say: [
        { text: 'Victoire ! Mais écoutez cette corne : les gobelins ont dressé leur camp. Le compte à rebours du premier raid est ici.', show: 'hud:raid' },
        { text: 'Les quêtes, ici, vous diront toujours quoi faire ensuite. Et je reviendrai vous montrer chaque nouveauté au moment où elle s’ouvre : les maisons, la défense, les métiers…', show: 'hud:quest' },
        'Aubeval est à vous, bourgmestre. Voici de quoi bien démarrer !',
      ],
      gift: { wood: 30, planks: 15, gold: 20 } },
  ],

  // In the order they are offered when several are ready at once.
  lessons: [
    { id: 'horn', title: 'La corne', about: 'Les pièges, et ce qui se passe pendant un raid.', when: { horn: true }, raid: true,
      covers: ['do:horn', 'trap:spikes', 'trap:tar', 'trap:powder', 'do:pillage', 'do:repair'],
      steps: [
        { id: 'traps',
          say: [
            { text: 'La corne ! Des gobelins sortent bientôt de leur camp : le compte à rebours a rougi.', show: 'hud:raid' },
            { text: 'De la corne à la fin du raid, on pose des pièges sur leur route : des pieux, une mare de poix qui les ralentit, un baril de poudre qui explose.', show: 'bar:defense' },
          ],
          task: 'Onglet Défense : prenez les « Pieux » et posez-les sur la case qui brille, sur la route du camp.',
          point: ['pick:trap:spikes'], goal: { gain: { traps: 1 } } },
        { id: 'after',
          say: [
            'Les pièges s’en vont à la fin du raid. Si la route est hors de vue, le repère rouge au bord de l’écran y mène.',
            'Un pillard qui atteint l’hôtel de ville vole une part de vos réserves, et un raid perdu abîme des bâtiments : ils se réparent depuis leur panneau. Courage, bourgmestre !',
          ] },
      ] },

    { id: 'siege', title: 'Le siège', about: 'Le chef de guerre d’un siège, ce qu’il change, et le duel qui le défie.', when: { siege: true }, raid: true,
      covers: ['do:siege', 'do:duel', 'lord:morgash', 'lord:zhara', 'lord:urgak', 'lord:skrit'],
      steps: [
        { id: 'lord',
          say: [
            { text: 'Trois coups de corne : cette fois, c’est un siège. Une colonne plus nombreuse et plus dure, menée par un chef de guerre.', show: 'hud:raid' },
            { text: 'Sa plaque, sous le compte à rebours, le nomme et dit ce qu’il change. Celui-ci, c’est {lord}. {trait}', show: 'siege:lord' },
            'Ils viennent à tour de rôle, plus forts à chaque siège : Morgash brise les murs, Zhara double les soins de ses chamans, Urgak amène ses brutes, Skrit fait courir sa colonne.',
          ] },
        { id: 'duel',
          say: [
            { text: '« Défier {lord} » : {hero} l’affronte seul, aux cartes. Une seule fois par siège, de la corne jusqu’à la fin.', show: 'siege:duel' },
            'Vainqueur, le chef est hors de combat et sa colonne perd courage : moins de vie, moins vite, et des fuyards. Perdu ou pas tenté, il marche avec elle et compte pour {n:warlord_leaks} à votre porte.',
            'Un siège pille plus qu’un raid, et casse davantage : pièges, soldats et remparts comptent double. Repoussé, il paie une vraie prime. À vous de voir si {hero} est prêt pour le duel !',
          ] },
      ] },

    { id: 'houses', title: 'Des habitants', about: 'Les maisons, leurs habitants, leur classe et leur style.', when: { quest: 'm1' },
      covers: ['tab:city', 'b:house', 'res:gold', 'btab:people', 'class:peasant', 'btab:look', 'do:style'],
      steps: [
        { id: 'house',
          say: [
            'Une maison loge des habitants. Ils paient l’impôt en or, et leur nombre ouvre de nouveaux bâtiments.',
            { text: 'Les maisons sont dans l’onglet Habitat. Comme les ateliers, elles doivent toucher un chemin.', show: 'bar:city' },
            'Je vous montre toujours la place que je choisirais : loin du bruit des ateliers, près des autres maisons, avec de l’espace autour. Libre à vous d’en prendre une autre.',
          ],
          task: 'Prenez la carte « Maison », puis posez-la sur la place qui brille.',
          point: ['build:house'], goal: { gain: { 'b:house': 1 } } },
        { id: 'tenants',
          say: ['Ouvrons-la pour voir qui y vit.'],
          task: 'Cliquez la maison, puis l’onglet « Habitants ».',
          point: ['building:house', 'btab:people'], goal: { btab: 'people' } },
        { id: 'look',
          say: [
            'Ce sont des Paysans. Ils mangent du pain : bien nourris, ils sont satisfaits et paient tout leur impôt.',
            'Plus tard, avec du café et un Café au bout de la rue, ils s’élèveront en Artisans, puis Bourgeois, Négociants et Nobles. La maison grandit avec eux.',
          ],
          task: 'Ouvrez l’onglet « Apparence ».',
          point: ['btab:look'], goal: { btab: 'look' } },
        { id: 'style',
          say: [{ text: 'Ici, son style se change à tout moment, gratuitement : colombages, pierre ou bois. L’hôtel de ville aussi. En dessous, la maison à chaque classe.', show: 'style' }] },
      ] },

    { id: 'defense', title: 'Tours et remparts', about: 'Tours de guet, remparts (et les améliorer d’un coup), zone sûre et compte à rebours du raid.', when: { quest: 'm1', after: 'houses' },
      covers: ['tab:defense', 'b:watchtower', 'b:palisade', 'do:wall', 'do:enclosure', 'do:rampart', 'do:safe', 'do:call'],
      steps: [
        { id: 'tower',
          say: [
            { text: 'Les gobelins viendront. Ce compte à rebours dit quand ; « Appeler » les fait venir tout de suite, contre une prime.', show: 'hud:raid' },
            'Ils sortent toujours de leur camp et marchent vers l’hôtel de ville. Une tour de guet tire sur ceux qui passent à sa portée.',
          ],
          task: 'Onglet Défense : posez une « Tour de guet » sur la place qui brille (ou ailleurs).',
          point: ['pick:watchtower'], goal: { gain: { 'b:watchtower': 1 } } },
        { id: 'wall',
          say: [
            'Le cercle autour de la tour, quand on la tient, montre sa portée. Maintenant, un rempart.',
            'Prenez la Palissade, maintenez le clic et glissez : tout le tracé se bâtit au relâchement. Maj + glisser trace une enceinte, et le clic droit annule.',
          ],
          task: 'Tracez un rempart d’au moins 3 tronçons, en glissant sur les cases qui brillent.',
          point: ['pick:palisade'], count: 3, goal: { gain: { 'b:palisade': 3 } } },
        { id: 'safe',
          say: [
            'Les pillards doivent le briser ou le contourner, pendant que vos tours tirent.',
            'Et quand vous tenez un bâtiment, le cercle clair autour de l’hôtel de ville est la zone sûre : aucun pillard n’y apparaît. Chaque niveau de l’hôtel de ville l’élargit.',
          ] },
        { id: 'rampart',
          say: ['Un rempart s’améliore d’un seul coup, pas palissade par palissade. Ouvrez l’une des siennes.'],
          task: 'Cliquez une palissade de votre rempart, puis « Tout le rempart ».',
          point: ['building:palisade', 'mark:act:rampart'], goal: { gain: { 'lvl:palisade': 2 } } },
        { id: 'rampart_done',
          say: [{ text: 'Toutes les palissades reliées qui étaient à ce niveau y sont passées, et sont plus solides. « Améliorer » n’en monte qu’une.', show: 'act:rampart' }] },
      ] },

    { id: 'farm', title: 'Le blé', about: 'La Ferme, premier maillon du pain.', when: { after: 'houses', unlocked: 'farm' },
      covers: ['b:farm', 'res:wheat'],
      steps: [
        { id: 'farm',
          say: ['Vos Paysans auront faim de pain. Le pain commence au champ : la Ferme cultive le blé.'],
          task: 'Onglet Production : posez une « Ferme » sur la place qui brille.',
          point: ['build:farm'], already: { built: { farm: 1 } }, goal: { gain: { 'b:farm': 1 } } },
        { id: 'next',
          say: ['À 8 habitants, la Boulangerie changera ce blé en pain. Je reviendrai vous la montrer.'] },
      ] },

    { id: 'workers', title: 'Les métiers', about: 'Former des ouvriers qui récoltent seuls : bûcheron, mineur, moissonneur.', when: { after: 'houses', free: 1 },
      covers: ['panel:people', 'do:workers', 'unit:woodcutter', 'unit:miner', 'unit:farmhand'],
      steps: [
        { id: 'people',
          say: [
            'Vos habitants libres peuvent apprendre un métier. Un ouvrier travaille seul : vous n’avez jamais à le guider.',
            { text: 'Le Peuple s’ouvre ici, ou avec la touche K.', show: 'btn:people' },
          ],
          task: 'Ouvrez le Peuple.',
          point: ['panel:people'], goal: { panel: 'people' } },
        { id: 'train',
          say: [{ text: 'Le Bûcheron va à l’arbre le plus proche et rapporte le bois à une cabane de bûcheron.', show: 'train:woodcutter' }],
          task: 'Formez un « Bûcheron ».',
          point: ['mark:train:woodcutter'], goal: { gain: { 'u:woodcutter': 1 } } },
        { id: 'trades',
          say: [
            'Le voilà en route ! Le Mineur fera de même avec les rochers et rapportera la pierre à une carrière ; le Moissonneur fauchera aux fermes et portera le blé à la boulangerie.',
            'Le « − » renvoie un ouvrier chez lui : il redevient un habitant libre. Et s’il voit un pillard, il court se mettre à l’abri à l’hôtel de ville.',
          ] },
      ] },

    { id: 'orders', title: 'Les commandes', about: 'Les commandes des habitants : les lire, les honorer, les refuser.', when: { after: 'houses', order: true },
      covers: ['panel:city', 'ctab:orders', 'do:orders', 'do:refuse', 'order:deliver', 'order:build', 'order:raise', 'order:beauty', 'order:raid', 'order:battle', 'order:camp', 'order:game', 'order:site'],
      steps: [
        { id: 'open',
          say: [
            'Vos habitants ont une demande ! Ils passent commande à la ville : trois à la fois (davantage quand la cité grandit), et il en viendra toujours.',
            { text: 'Tout cela se tient dans la Cité : ce bouton, ou la touche G.', show: 'btn:city' },
          ],
          task: 'Ouvrez la Cité, puis l’onglet « Commandes ».',
          point: ['panel:city', 'ctab:orders'], goal: { ctab: 'orders' } },
        { id: 'read',
          say: [
            { text: 'Une commande dit qui demande, quoi, et où vous en êtes. En bas, sa paie : de l’or, et de la popularité pour {hero}.', show: 'city:order' },
            'Livrer des marchandises, bâtir, embellir une rue, élever une maison ; repousser un raid, gagner un combat, raser le camp ; jouer chez un tenancier, explorer un lieu : il y en a pour tous les goûts.',
            { text: '« Refuser » renvoie une commande qui ne vous dit rien : une autre arrive {t:order_wait} plus tard. Un seul refus toutes les {t:order_refuse_cd}.', show: 'city:refuse' },
          ] },
        { id: 'honour',
          say: ['Quand la jauge d’une commande est pleine, son bouton s’allume. Celle-ci est prête : encaissons-la !'],
          task: 'Cliquez « Livrer » (ou « Honorer »).',
          point: ['panel:city', 'ctab:orders', 'mark:city:order'], unless: { stuck: 'order' }, goal: { gain: { orders: 1 } } },
        { id: 'after',
          say: ['Une commande honorée laisse sa place à la suivante, un peu plus tard. Chaque rang de la ville en demande un certain nombre : gardez-les à l’œil.'] },
      ] },

    { id: 'bakery', title: 'Le pain', about: 'La Boulangerie, et les plaques rouges qui disent ce qui manque.', when: { after: 'farm', unlocked: 'bakery' },
      covers: ['b:bakery', 'res:bread', 'do:need'],
      steps: [
        { id: 'bakery',
          say: ['Huit habitants : la Boulangerie s’ouvre. Elle cuit le blé de vos fermes en pain, le besoin de toutes vos maisons.'],
          task: 'Onglet Production : posez une « Boulangerie » sur la place qui brille.',
          point: ['build:bakery'], already: { built: { bakery: 1 } }, goal: { gain: { 'b:bakery': 1 } } },
        { id: 'plates',
          say: [
            'Une maison qui manque de pain porte une plaque rouge au-dessus de son toit. Ces plaques disent toujours ce qui manque : un chemin, une ressource, un service.',
            'Le pain sert aussi {hero} : la Boulangerie lui envoie une carte de Ration en combat.',
          ] },
      ] },

    { id: 'popularity', title: 'La popularité du héros', about: 'La jauge de popularité : ce qu’elle donne, d’où elle vient, pourquoi elle s’effrite.', when: { after: 'orders', orders: 1 },
      covers: ['ctab:rank', 'do:popularity'],
      steps: [
        { id: 'gauge',
          say: [{ text: 'Une commande honorée, et {hero} est un peu plus populaire. Sa jauge est là, sous la quête, à côté du rang de la ville.', show: 'hud:city' }],
          task: 'Ouvrez la Cité, onglet « Rang ».',
          point: ['panel:city', 'ctab:rank'], goal: { ctab: 'rank' } },
        { id: 'gives',
          say: [
            { text: 'De 0 à 100. Plus {hero} est aimé, mieux l’impôt rentre, meilleurs sont les prix du Marché, et chaque maison loge un habitant de plus tous les {n:pop_house_step} points.', show: 'city:pop' },
            { text: 'Elle monte avec les commandes, les raids repoussés, les quêtes, les combats, les jeux des tenanciers, les lieux explorés et les grands chantiers. Un raid perdu la fait chuter.', show: 'city:pop' },
            { text: 'Et elle s’effrite toute seule, minute après minute ; plus elle est haute, plus elle monte lentement. « D’où elle vient », juste en dessous, garde ses derniers gains.', show: 'city:pop' },
          ] },
      ] },

    { id: 'decor', title: 'Embellir la ville', about: 'Les décorations et la beauté des rues.', when: { after: 'workers' },
      covers: ['tab:decor', 'b:fountain', 'b:well', 'b:statue', 'b:stall', 'b:lamp', 'b:banner', 'b:bench', 'b:flowers', 'b:barrels', 'b:hedge', 'do:beauty', 'btab:street'],
      steps: [
        { id: 'flowers',
          say: [
            'Une belle rue rend ses habitants plus généreux : la beauté ajoute à l’impôt, et les hautes classes l’exigent.',
            { text: 'L’onglet Décor : fontaine, puits, statue, étal, lampadaire, bannière, banc, fleurs, tonneaux, haie. Ils ne produisent rien : ils embellissent.', show: 'bar:decor' },
          ],
          task: 'Prenez les « Fleurs » et posez-les sur la case qui brille, près des maisons.',
          point: ['pick:flowers'], goal: { gain: { 'b:flowers': 1 } } },
        { id: 'street',
          say: ['Voyons ce qu’en pense la maison.'],
          task: 'Cliquez une maison, puis l’onglet « Rue ».',
          point: ['building:house', 'btab:street'], goal: { btab: 'street' } },
        { id: 'beauty',
          say: [
            { text: 'Ici, tout ce qui l’embellit ou l’enlaidit, puis le calcul de son impôt. Les arbres embellissent ; les ateliers bruyants, comme la carrière, enlaidissent.', show: 'btab:street' },
            'Pendant que vous tenez un bâtiment, une bulle dit déjà combien de maisons il embellira, ou servira.',
          ] },
      ] },

    { id: 'panel', title: 'Améliorer, déplacer, tourner', about: 'Le panneau d’un bâtiment : améliorer, déplacer, démolir, tourner.', when: { after: 'decor' },
      covers: ['do:upgrade', 'do:move', 'do:demolish', 'do:rotate', 'btab:info'],
      steps: [
        { id: 'upgrade',
          say: ['Chaque bâtiment se perfectionne. Ouvrons votre cabane de bûcheron.'],
          task: 'Cliquez la Cabane de bûcheron, puis « Améliorer ».',
          point: ['building:lumber_hut', 'mark:act:upgrade'], goal: { gain: { 'lvl:lumber_hut': 1 } } },
        { id: 'actions',
          say: [
            { text: 'Niveau 2 ! Chaque niveau produit plus ; tous les 5 niveaux, la production double et le bâtiment change d’apparence. L’onglet Infos le détaille.', show: 'act:upgrade' },
            { text: '« Déplacer » le reprend sur le pointeur, sans rien perdre.', show: 'act:move' },
            { text: '« Démolir » le rase et vous rend une partie de son prix.', show: 'act:demolish' },
            'Enfin, avant de poser un bâtiment ou pendant un déplacement, la touche R (ou le bouton « Tourner ») le tourne : son entrée passe de l’autre côté.',
          ] },
      ] },

    { id: 'land', title: 'Le terrain', about: 'Défricher et planter des arbres.', when: { after: 'panel' },
      covers: ['tool:clear', 'plant'],
      steps: [
        { id: 'clear',
          say: [
            { text: 'L’onglet Terrain façonne la carte : chemins, défrichage et plantations.', show: 'bar:land' },
            'Défricher abat un arbre ou brise un rocher pour de bon, et libère la case. Cela rend aussi du bois ou de la pierre.',
          ],
          task: 'Prenez « Défricher », puis cliquez un arbre ou un rocher.',
          point: ['pick:tool:clear'], goal: { gain: { cleared: 1 } } },
        { id: 'plant',
          say: ['À l’inverse, un arbre se plante contre un peu d’or : chêne, érable, bouleau, sapin, saule, palmier ou buisson. Les arbres embellissent les maisons voisines.'],
          task: 'Prenez le « Chêne » et plantez-le sur la case qui brille.',
          point: ['pick:plant:tree.green'], goal: { gain: { planted: 1 } } },
        { id: 'strokes',
          say: ['Chemins, défrichage et plantations se tracent aussi en glissant, case après case. Et Défricher retire un chemin posé par erreur.'] },
      ] },

    { id: 'quests', title: 'Le livre des quêtes', about: 'Quêtes secondaires, missions du héros et contrats.', when: { after: 'defense' },
      covers: ['qtab:side', 'qtab:missions', 'qtab:contracts', 'do:mission', 'do:contract'],
      steps: [
        { id: 'book',
          say: ['Les quêtes vous mènent de chapitre en chapitre. Mais il n’y a pas que la quête principale.'],
          task: 'Ouvrez les Quêtes.',
          point: ['panel:quests'], goal: { panel: 'quests' } },
        { id: 'side',
          say: [{ text: 'Les quêtes secondaires : des livraisons et des combats en plus, pour de l’or et de l’XP.', show: 'qtab:side' }],
          task: 'Ouvrez l’onglet « Missions ».',
          point: ['qtab:missions'], goal: { qtab: 'missions' } },
        { id: 'mission',
          say: ['Une mission envoie {hero} seul un moment : il revient avec de l’XP et du butin, même jeu fermé. Pendant ce temps, il ne défend pas le village.'],
          task: 'Lancez la mission « Patrouille des lisières ».',
          point: ['mark:mission:patrol'], unless: { away: true }, goal: { away: true } },
        { id: 'contracts',
          say: [{ text: 'Les contrats arrivent avec la quête « Tenir le village » : chaque victoire en élève le rang, sans limite.', show: 'qtab:contracts' }] },
      ] },

    { id: 'hero', get title() { return 'Le paquet ' + heroName(true); }, about: 'Les cartes du héros, ses touches de combat, la forge.', when: { after: 'quests' },
      covers: ['do:deck', 'do:intent'],
      steps: [
        { id: 'sheet',
          say: ['En combat, {hero} joue les cartes que lui envoient vos bâtiments. Plus le village grandit, plus son paquet est riche.'],
          task: 'Ouvrez la fiche du Héros.',
          point: ['panel:hero'], goal: { panel: 'hero' } },
        { id: 'deck',
          say: [
            { text: 'Son paquet : une carte par bâtiment debout, plus forte avec son niveau. Décochez une carte pour la laisser au village ; plus bas, celles à gagner, et ce qui les donne.', show: 'deck' },
            'En combat, chaque ennemi annonce au-dessus de sa tête ce qu’il fera. Les touches 1 à 9 jouent une carte, ← et → choisissent l’ennemi, Entrée finit le tour, Espace pare, H ouvre les règles.',
            'La Forge fabrique aussi des armures, et de meilleures armes au fil des quêtes. « Renforcer » leur ajoute des +1.',
          ] },
      ] },

    { id: 'venue', title: 'Entrer chez un tenancier', about: 'Le Café, le Marché et la Forge se visitent : un tenancier, un jeu, des médailles.', when: { after: 'popularity', venue: true },
      covers: ['do:venue', 'do:game', 'do:medal', 'venue:cafe', 'venue:market', 'venue:forge', 'game:cafe', 'game:market', 'game:forge'],
      steps: [
        { id: 'door',
          say: [
            'Trois bâtiments se visitent : le Café, le Marché et la Forge. À l’intérieur, leur tenancier vous attend… avec un jeu.',
            'Au Café, « {game:cafe} » : servir les bonnes tasses. Au Marché, « {game:market} » : arrêter l’aiguille au bon moment. À la Forge, « {game:forge} » : frapper en rythme.',
            'Une médaille de bronze, d’argent ou d’or rend {hero} plus populaire, et laisse un cadeau pendant {t:venue_buff_time} : de meilleurs prix, une forge plus vive, une lame mieux battue…',
            'Chaque jeu se repose {t:venue_wait} après une partie, et se corse à chaque victoire. On n’entre pas pendant un raid. Une fois dedans, je me tais : {keeper} explique son jeu lui-même.',
          ],
          task: 'Cliquez « {venue} », puis « Entrer ».',
          point: ['venue', 'mark:venue:enter'], goal: { clicked: 'venue:enter' } },
      ] },

    { id: 'fog', title: 'La brume et les éclaireurs', about: 'La brume qui cache les terres, et les éclaireurs qui la lèvent.', when: { after: 'bakery' },
      covers: ['panel:explore', 'do:fog', 'do:scout'],
      steps: [
        { id: 'open',
          say: [
            'Regardez au loin : une brume couvre les terres. Dessous, rien ne se bâtit, ne se plante ni ne se récolte.',
            'Vos bâtiments la repoussent autour d’eux ; vos soldats et {hero} la lèvent en marchant. Et pour aller loin, il y a les éclaireurs.',
            { text: 'L’Exploration s’ouvre ici, ou avec la touche E.', show: 'btn:explore' },
          ],
          task: 'Ouvrez l’Exploration.',
          point: ['panel:explore'], goal: { panel: 'explore' } },
        { id: 'rose',
          say: [
            { text: 'Ici, la part des terres déjà connues.', show: 'explore:known' },
            { text: 'La rose des éclaireurs : huit directions. Payés en pain et en or, ils partent de l’hôtel de ville, lèvent la brume sur leur chemin, puis rentrent. Chaque envoi va plus loin, et coûte plus cher.', show: 'explore:rose' },
            'La brume cache des lieux : ruines, tanières, hameaux, gisements. Aucun à moins de {n:site_min_dist} cases de l’hôtel de ville : seuls les éclaireurs vont si loin.',
          ] },
        { id: 'send',
          say: ['Choisissez un cap, n’importe lequel.'],
          task: 'Cliquez une direction de la rose pour envoyer des éclaireurs.',
          point: ['panel:explore', 'mark:explore:rose'], unless: { stuck: 'scout' }, goal: { gain: { scouts: 1 } } },
        { id: 'gone',
          say: ['Les voilà en route : suivez leur fanion sur la carte. Dès qu’un lieu sort de la brume, je reviens vous montrer quoi en faire.'] },
      ] },

    { id: 'barracks', title: 'La garde', about: 'La Caserne et les soldats : former, choisir, envoyer.', when: { after: 'bakery', quest: 'm1' },
      covers: ['b:barracks', 'btab:army', 'unit:militia', 'unit:archer', 'unit:knight', 'do:select', 'do:order', 'do:recall'],
      steps: [
        { id: 'build',
          say: ['Les tours ne suffiront pas toujours. La Caserne forme vos habitants libres en soldats.'],
          task: 'Onglet Défense : posez la « Caserne » sur la place qui brille.',
          point: ['build:barracks'], already: { built: { barracks: 1 } }, goal: { gain: { 'b:barracks': 1 } } },
        { id: 'train',
          say: [{ text: 'Un clic sur la Caserne ouvre ses Soldats. Le Milicien barre la route : les pillards doivent s’arrêter pour le combattre. L’Archer et le Chevalier viendront avec les classes plus hautes.' }],
          task: 'Cliquez la Caserne, puis formez un « Milicien ».',
          point: ['building:barracks', 'mark:train:militia'], goal: { gain: { 'drill:militia': 1 } } },
        { id: 'wait',
          say: ['Il s’entraîne quelques secondes, puis sort devant la Caserne.'],
          task: 'Attendez que le milicien soit prêt.',
          point: ['free'], goal: { trained: true } },
        { id: 'select',
          say: ['Le voilà ! Pour donner un ordre, on choisit d’abord ses soldats.'],
          task: 'Pressez T pour choisir tous vos soldats.',
          point: ['key:KeyT'], goal: { sel: 1 } },
        { id: 'order',
          say: ['Choisis, ils sont cerclés de vert. On peut aussi cliquer un soldat, ou Maj + glisser un cadre autour de plusieurs.'],
          task: 'Faites un clic droit sur la carte pour les y envoyer.',
          point: ['free'], goal: { changed: 'orders' } },
        { id: 'hold',
          say: ['Ils gardent l’endroit et chargent les pillards qui approchent. Échap les lâche ; « Rappel » les ramène devant la Caserne. Un soldat tombé est perdu : il faut en former un autre.'] },
      ] },

    { id: 'camp', title: 'Le camp gobelin', about: 'Raser le camp gobelin avec ses soldats ; l’hôtel de ville.', when: { after: 'barracks' },
      covers: ['b:hall', 'btab:village', 'do:camp'],
      steps: [
        { id: 'hall',
          say: ['Le camp gobelin peut tomber. Son état et la façon de l’attaquer sont à l’hôtel de ville.'],
          task: 'Cliquez l’hôtel de ville, onglet « Village ».',
          point: ['building:hall', 'btab:village'], goal: { btab: 'village' } },
        { id: 'attack',
          say: [
            { text: '« Attaquer le camp » y envoie tous vos soldats ; un clic droit sur le camp, soldats choisis, fait de même. Sa garnison sort les combattre, puis ils abattent sa palissade.', show: 'camp:attack' },
            '{hero} les rejoint s’il est au village. Rasé, le camp laisse du butin et aucun raid ne vient pendant {t:camp_respite}… puis un autre se dresse plus loin, plus fort, un chef à sa tête.',
            { text: 'L’hôtel de ville s’améliore aussi : chaque niveau protège mieux vos réserves et élargit la zone sûre.', show: 'act:upgrade' },
          ] },
      ] },

    { id: 'proclaim', title: 'Proclamer', about: 'Les rangs de la ville : Bourg, Ville, Cité, Capitale… et ce que chacun ouvre.', when: { proclaim: true },
      covers: ['do:proclaim', 'do:endless', 'rank:1', 'rank:2', 'rank:3', 'rank:4'],
      steps: [
        { id: 'open',
          say: ['Aubeval a tout ce qu’il faut pour changer de rang. Cela se proclame !'],
          task: 'Ouvrez la Cité, onglet « Rang ».',
          point: ['panel:city', 'ctab:rank'], goal: { ctab: 'rank' } },
        { id: 'ranks',
          say: [
            { text: 'Au-dessus du bouton, ce que le rang suivant demande : des habitants, des maisons d’une classe, des commandes honorées, des raids repoussés… puis sa récompense, et ce qu’il ouvre.', show: 'city:proclaim' },
            'Hameau, Bourg, Ville, Cité, Capitale. Chaque classe attend son rang : les Bourgeois le Bourg, les Négociants la Ville, les Nobles la Cité. Les grands chantiers aussi.',
            'Chaque rang ajoute à toute la production et aux impôts. Et après Capitale, ils continuent sans fin : Capitale II, III…',
          ] },
        { id: 'proclaim',
          say: ['Tout est coché : à vous l’honneur.'],
          task: 'Cliquez « Proclamer ».',
          point: ['panel:city', 'ctab:rank', 'mark:city:proclaim'], unless: { stuck: 'proclaim' }, goal: { gain: { rank: 1 } } },
        { id: 'after',
          say: ['Rien ne presse jamais : un rang se proclame quand vous le voulez, et se garde… jusqu’à un nouveau départ.'] },
      ] },

    { id: 'site', title: 'Un lieu trouvé', about: 'Ruines, tanières, hameaux et gisements : y envoyer le héros, et le rappeler.', when: { after: 'fog', site: true },
      covers: ['site:ruin', 'site:lair', 'site:hamlet', 'site:deposit', 'do:trip', 'do:home'],
      steps: [
        { id: 'open',
          say: ['La brume a rendu un lieu ! Il est sur la carte, et dans l’Exploration.'],
          task: 'Ouvrez l’Exploration (touche E).',
          point: ['panel:explore'], goal: { panel: 'explore' } },
        { id: 'see',
          say: [{ text: 'Chaque lieu trouvé a sa ligne : son nom, son niveau, sa distance, et ce qui s’y passe. « Voir » amène la vue dessus.', show: 'explore:see' }],
          task: 'Cliquez « Voir ».',
          point: ['panel:explore', 'mark:explore:see'], goal: { clicked: 'explore:see' } },
        { id: 'page',
          say: ['Le voilà. Un clic sur le lieu, sur la carte ou sur sa ligne, ouvre sa page.'],
          task: 'Cliquez la ligne du lieu.',
          point: ['panel:explore', 'mark:explore:row'], goal: { exsite: true } },
        { id: 'kinds',
          say: [
            'Quatre sortes de lieux. Une ruine : un seul combat, et elle est explorée pour de bon. Une tanière : vidée, elle se repeuple, plus forte à chaque fois.',
            'Un hameau : un premier présent ouvre une route de commerce, et chaque livraison grossit sa paie. Un gisement : revendiqué, il envoie sa récolte chaque minute, et se creuse.',
            { text: '{hero} doit d’abord s’y rendre : pendant le trajet, il ne garde plus le village. Sur place, rien ne part tout seul : un combat ne commence que sur « Combattre ». Et « Rentrer » le rappelle à tout moment.', show: 'explore:act' },
          ] },
        { id: 'go',
          say: ['Envoyons-le voir.'],
          task: 'Cliquez « Y aller ».',
          point: ['panel:explore', 'mark:explore:act'], unless: { stuck: 'go' }, goal: { trip: true } },
        { id: 'back',
          say: ['À son arrivée, un message vous prévient : rouvrez alors la page du lieu. En attendant, revenons à la liste.'],
          task: 'Cliquez « ‹ Tous les lieux ».',
          point: ['panel:explore', 'mark:explore:back'], unless: { exsite: false }, goal: { exsite: false } },
        { id: 'trip', unless: { trip: false },
          say: [
            { text: 'Son expédition se suit ici : où il en est, et le temps qu’il reste.', show: 'explore:trip' },
            { text: '« Rentrer » : il fait demi-tour, et reprend sa garde devant l’hôtel de ville en arrivant.', show: 'explore:recall' },
            'Les routes et les gisements rapportent chaque minute, même jeu fermé. Bonne route, {hero} !',
          ] },
      ] },

    { id: 'chief', title: 'Le chef du camp', about: 'Les camps qui se relèvent ont un chef : plus coriace, et sa tête a un prix.', when: { after: 'camp', chief: true },
      covers: ['do:chief'],
      steps: [
        { id: 'hall',
          say: ['Un nouveau camp s’est dressé, plus loin, plus fort. Et cette fois un chef y commande : {chief}.'],
          task: 'Cliquez l’hôtel de ville, onglet « Village ».',
          point: ['building:hall', 'btab:village'], goal: { btab: 'village' } },
        { id: 'chief',
          say: [
            { text: 'Le voici : son nom, sa vie, et ce que sa tête ajoute au butin. Il se tient devant la porte du camp, plus coriace que ses gardes, et frappe plus fort à chaque camp.', show: 'camp:chief' },
            { text: 'La palissade ne tombe qu’une fois la garnison à terre, chef compris. Envoyez assez de soldats ; {hero} les rejoint s’il est au village.', show: 'camp:attack' },
          ] },
      ] },

    { id: 'quarry', title: 'La pierre', about: 'La Carrière, bruyante, et les rochers.', when: { unlocked: 'quarry', after: 'houses' },
      covers: ['b:quarry', 'res:stone'],
      steps: [
        { id: 'quarry',
          say: [
            'Douze habitants : la Carrière s’ouvre. Elle taille la pierre des chapelles, des tours de mage et des armes du deuxième palier.',
            'Elle est bruyante : elle enlaidit les maisons autour.',
            { text: 'Je vous ai trouvé une place à l’écart, avec les autres ateliers ; s’il le faut, on y mène un bout de chemin.', todo: true },
          ],
          task: 'Onglet Production : posez une « Carrière » sur la place qui brille, à l’écart des maisons.',
          point: ['build:quarry'], already: { built: { quarry: 1 } }, goal: { gain: { 'b:quarry': 1 } } },
        { id: 'rocks',
          say: ['Les Mineurs, formés depuis le Peuple, rapportent aussi la pierre des rochers ; un clic sur un rocher en donne un peu à la main.'] },
      ] },

    { id: 'coffee', title: 'Le café et les Artisans', about: 'La chaîne du café, les services à portée, élever une maison.', when: { unlocked: 'cafe', after: 'houses' },
      covers: ['b:coffee_farm', 'res:beans', 'b:roastery', 'res:coffee', 'b:cafe', 'do:service', 'class:artisan', 'do:raise', 'b:mage_tower', 'res:shard'],
      steps: [
        { id: 'cafe',
          say: [
            'Vingt-quatre habitants : le café arrive. La Plantation de caféiers donne les grains, la Brûlerie les torréfie en café.',
            'Vos Paysans, nourris de pain et de café, avec un Café au bout de la rue, pourront s’élever en Artisans.',
            { text: 'Le Café est un service : il sert les maisons dans son rayon. En le tenant, vous verrez ce rayon et les maisons servies encadrées.', show: 'card:cafe' },
          ],
          task: 'Onglet Habitat : posez un « Café » sur la place qui brille, parmi vos maisons.',
          point: ['build:cafe'], already: { built: { cafe: 1 } }, goal: { gain: { 'b:cafe': 1 } } },
        { id: 'house',
          say: ['Quand une maison a tout ce qu’il lui faut, sa satisfaction se remplit.'],
          task: 'Cliquez une maison, onglet « Habitants ».',
          point: ['building:house', 'btab:people'], goal: { btab: 'people' } },
        { id: 'raise',
          say: [
            { text: 'Ici, ce qu’il lui faut pour s’élever. Tout coché, « Élever » la fait passer à la classe suivante : plus d’habitants, plus d’impôt, une maison plus grande.', show: 'raise' },
            { text: 'La Tour de mage s’ouvre aussi : un éclair qui perce les armures, contre un Éclat rapporté des quêtes.', show: 'card:mage_tower' },
          ] },
      ] },

    { id: 'taxes', title: 'Les impôts', about: 'Un niveau d’impôt par classe : bas, normal ou élevé, et ce que chacun coûte.', when: { cls: { artisan: 3 } },
      covers: ['btab:taxes', 'ctab:taxes', 'do:tax', 'tax:low', 'tax:normal', 'tax:high'],
      steps: [
        { id: 'hall',
          say: ['Vos Artisans paient bien. Mais l’impôt se règle, classe par classe : cela se décide à l’hôtel de ville.'],
          task: 'Cliquez l’hôtel de ville, onglet « Impôts ».',
          point: ['building:hall', 'btab:taxes'], goal: { btab: 'taxes' } },
        { id: 'levels',
          say: [
            { text: 'Une ligne par classe, trois niveaux. Chaque bouton affiche ce que la classe paierait par minute à ce niveau.', show: 'city:tax' },
            { text: 'Élevé : plus d’or tout de suite. Mais la satisfaction plafonne, ces maisons ne s’élèvent plus, et {hero} y perd de la popularité, minute après minute.', show: 'city:tax:high' },
            { text: 'Bas : moins d’or, mais la satisfaction monte {n:tax_low_sat} fois plus vite, et la classe s’élève plus tôt. Parfait avant de faire monter des maisons.', show: 'city:tax:low' },
          ],
          task: 'Choisissez un niveau pour cette classe : Bas, Normal ou Élevé.',
          point: ['building:hall', 'btab:taxes', 'mark:city:tax'], goal: { clicked: 'city:tax' } },
        { id: 'after',
          say: ['Cela se change à tout moment, sans frais. La Cité (G) a le même réglage, dans son onglet « Impôts ».'] },
      ] },

    { id: 'market', title: 'Le Marché et la Chapelle', about: 'Acheter, vendre, importer des épices ; la Chapelle.', when: { unlocked: 'market', after: 'coffee' },
      covers: ['b:market', 'btab:trade', 'do:trade', 'do:import', 'res:spice', 'b:chapel', 'class:burgher'],
      steps: [
        { id: 'market',
          say: [
            'Quatre maisons d’Artisans : le Marché et la Chapelle s’ouvrent.',
            'Le Marché achète et vend vos réserves contre de l’or, et ses caravanes importent les épices des Bourgeois.',
          ],
          task: 'Onglet Habitat : posez un « Marché » sur la place qui brille.',
          point: ['build:market'], already: { built: { market: 1 } }, goal: { gain: { 'b:market': 1 } } },
        { id: 'stalls',
          say: ['Voyons ses étals.'],
          task: 'Cliquez le Marché, onglet « Commerce ».',
          point: ['building:market', 'btab:trade'], goal: { btab: 'trade' } },
        { id: 'trade',
          say: [
            { text: 'Les épices coûtent de l’or : ce bouton met l’import en pause.', show: 'import' },
            { text: 'Chaque ligne achète ou vend un lot d’une ressource.', show: 'trade' },
            { text: 'Le Marché se visite aussi : « Entrer », et sa marchande vous défie au marchandage. Une médaille, et ses prix vous sourient un moment.', show: 'venue:enter' },
            { text: 'La Chapelle est un service à grand rayon : les Bourgeois la veulent à portée, avec le Café, des épices à table… et une ville au rang de Bourg.', show: 'card:chapel' },
          ] },
      ] },

    { id: 'cloth', title: 'Laine et étoffes', about: 'Bergerie, tissage, et les Négociants.', when: { unlocked: 'sheep_farm', after: 'market' },
      covers: ['b:sheep_farm', 'res:wool', 'b:weaver', 'res:cloth', 'class:merchant'],
      steps: [
        { id: 'sheep',
          say: [
            'Quatre maisons de Bourgeois : la laine arrive. La Bergerie élève les moutons, l’Atelier de tissage tisse la laine en étoffes.',
            'Les étoffes font des Négociants, qui veulent aussi le Marché à portée, une rue plaisante, et une ville au rang de Ville.',
          ],
          task: 'Onglet Production : posez une « Bergerie » sur la place qui brille.',
          point: ['build:sheep_farm'], already: { built: { sheep_farm: 1 } }, goal: { gain: { 'b:sheep_farm': 1 } } },
        { id: 'weaver',
          say: [{ text: 'Puis l’Atelier de tissage, à côté : il mange deux laines pour une étoffe.', show: 'card:weaver' }] },
      ] },

    { id: 'jewels', title: 'Les bijoux des Nobles', about: 'L’Orfèvre et la plus haute classe.', when: { unlocked: 'goldsmith', after: 'cloth' },
      covers: ['b:goldsmith', 'res:jewel', 'class:noble'],
      steps: [
        { id: 'goldsmith',
          say: [
            { text: 'Quatre maisons de Négociants : l’Orfèvre change l’or et la pierre en bijoux.', show: 'card:goldsmith' },
            'Les bijoux, avec une rue superbe — fontaines, statues, arbres et fleurs —, font des Nobles, la plus haute classe d’Aubeval. Il leur faut le rang de Cité, et un héros populaire.',
          ] },
      ] },

    { id: 'works', title: 'Les grands chantiers', about: 'Cathédrale, Château, Grand phare : des étapes, un bonus permanent, des embellissements sans fin.', when: { unlocked: 'cathedral' },
      covers: ['tab:works', 'b:cathedral', 'b:castle', 'b:lighthouse', 'btab:works', 'ctab:works', 'do:works', 'do:embellish'],
      steps: [
        { id: 'found',
          say: [
            'Aubeval est une Ville : elle peut voir grand. Un grand chantier avale vos surplus pendant des heures, et donne en échange un bonus permanent à toute la ville.',
            { text: 'Ils ont leur onglet : la Cathédrale d’abord, le Château au rang de Cité, le Grand phare à celui de Capitale. Un seul de chaque.', show: 'bar:works' },
            { text: 'La poser, c’est couler ses fondations. Je vous montre une place digne d’elle : large, près des maisons qu’elle embellira.', todo: true },
          ],
          task: 'Onglet Chantiers : posez la « Cathédrale » sur la place qui brille (ou ailleurs).',
          point: ['pick:cathedral'], already: { built: { cathedral: 1 } }, goal: { gain: { 'b:cathedral': 1 } } },
        { id: 'open',
          say: ['Les fondations sont coulées. Voyons le chantier.'],
          task: 'Cliquez la Cathédrale, onglet « Chantier ».',
          point: ['building:cathedral', 'btab:works'], goal: { btab: 'works' } },
        { id: 'stages',
          say: [
            { text: 'Quatre étapes : Fondations, Murs, Toiture, Achèvement. Chacune coûte des milliers de ressources, change le monument sur la carte, et ajoute à ce qu’il donne. Ce bouton paie la suivante.', show: 'city:work' },
            'La Cathédrale rend les repas plus heureux et retient la popularité {de_hero} ; le Château met vos réserves à l’abri et endurcit vos soldats ; le Phare améliore les prix du Marché, la vue dans la brume et les expéditions.',
            'Achevé, le chantier continue : des embellissements, sans fin, chacun un peu plus cher, chacun un peu de bonus en plus. La Cité (G), onglet « Chantiers », réunit les trois monuments.',
          ] },
        { id: 'build',
          say: ['Vous avez de quoi payer l’étape suivante : lancez-la !'],
          task: 'Cliquez le bouton du chantier.',
          point: ['building:cathedral', 'btab:works', 'mark:city:work'], unless: { stuck: 'work:cathedral' }, goal: { gain: { 'lvl:cathedral': 1 } } },
      ] },

    { id: 'register', title: 'Le registre du village', about: 'Sauvegarde, gains hors-ligne, nouveau départ, ce livre.', when: { after: 'hero' },
      covers: ['panel:menu', 'do:save', 'do:export', 'do:offline', 'do:prestige', 'do:lessons'],
      steps: [
        { id: 'menu',
          say: ['Un dernier secret : le registre du village.'],
          task: 'Ouvrez le Village (touche V).',
          point: ['panel:menu'], goal: { panel: 'menu' } },
        { id: 'save',
          say: [
            { text: 'Aubeval se sauvegarde seul dans ce navigateur. Exportez le fichier pour le garder ailleurs ; importez-le pour reprendre.', show: 'menu:export' },
            'Jeu fermé, le village continue de produire : à votre retour, je vous dirai ce qu’il a gagné.',
            { text: 'Quand la croissance ralentit, un Nouveau départ échange le village contre de la Renommée, gardée pour toujours. La Cité (G), onglet « Héritage », dit ce qui reste et où la dépenser : je vous y montrerai tout.', show: 'menu:prestige' },
            { text: 'Et voici le Livre des leçons : toutes mes leçons, à revoir quand vous voulez.', show: 'menu:lessons' },
          ] },
      ] },

    { id: 'legacy', title: 'L’héritage et le nouveau départ', about: 'La Renommée d’un nouveau départ, et l’arbre de bonus qu’elle achète pour toujours.', when: { after: 'register', any: [{ spend: true }, { rank: 1, renown: 1 }] },
      covers: ['ctab:legacy', 'do:legacy', 'do:renown', 'legacy:prosperity', 'legacy:arms', 'legacy:horizons'],
      steps: [
        { id: 'open',
          say: ['Un village peut tout recommencer… et en sortir plus fort. C’est l’héritage.'],
          task: 'Ouvrez la Cité, onglet « Héritage ».',
          point: ['panel:city', 'ctab:legacy'], goal: { ctab: 'legacy' } },
        { id: 'start',
          say: [
            { text: 'Un nouveau départ échange ce village contre de la Renommée : tant pour l’or gagné, tant pour le rang atteint. C’est le même bouton que celui du registre du Village (V).', show: 'city:newstart' },
            'Restent : {hero}, ses quêtes, l’héritage, les lieux découverts. Repartent de zéro : bâtiments, réserves, rang, commandes, impôts et chantiers. Rien ne presse : il demande deux clics, et je ne vous le fais pas presser.',
            { text: 'La Renommée ne se perd jamais, et chaque point ajoute à toute la production. Dépensée ici, elle achète en plus des bonus qui valent pour ce village et tous les suivants.', show: 'city:legacy' },
            'Trois branches : Prospérité, Armes, Horizons. Un nœud s’ouvre quand celui d’avant a le niveau demandé, et chaque niveau coûte un peu plus.',
          ] },
        { id: 'learn',
          say: ['Vous avez de la Renommée à dépenser : apprenons un premier niveau.'],
          task: 'Cliquez « +1 » sur le nœud que la flèche montre.',
          point: ['panel:city', 'ctab:legacy', 'mark:city:legacy'], unless: { stuck: 'legacy' }, goal: { gain: { legacy: 1 } } },
      ] },
  ],
};
