// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// The places entered full screen (js/venue.js) and the mini-game each keeper offers
// (js/minigames.js). Content only: what a place is called, what its keeper says, what its game is
// made of, what a medal is worth. The global knobs (how long a game lasts, how wide the input
// windows are, the wait between two games) are in config.js, under « Places entered full screen ».
window.DATA = window.DATA || {};

Object.assign(DATA.strings, {
  // the place
  vn_pop: 'Popularité', vn_pop_tip: 'La popularité {g:du héros|de l’héroïne}\nElle monte avec les jeux, les quêtes et les raids repoussés, et retombe avec le temps. Elle pèse sur l’impôt, les prix du marché et le monde que logent vos maisons.',
  vn_play: 'Jouer : {title}', vn_play_wait: 'Prêt dans {t}', vn_play_tip: '{title}\n{how}', vn_wait_tip: '{title}\n{name} reprend son souffle : le jeu sera prêt dans {t}.',
  vn_talk: 'Discuter', vn_talk_tip: 'Discuter\nUn mot de {name}, et ce qui se dit en ville.',
  vn_leave: 'Sortir (Échap)', vn_leave_tip: 'Sortir\nRetour au village.',
  vn_next: 'Espace ▸', vn_keys: '↑ ↓ et Entrée, ou 1 · 2 · 3',
  vn_gifts: 'Cadeaux en cours', vn_no_gift: 'Aucun cadeau en cours : jouez !', vn_gifts_more: '+ {n} autres',
  vn_card_wins: 'À gagner', vn_card_best: 'Record : {n}', vn_card_none: 'Jamais joué', vn_card_streak: 'Série : {n} · difficulté {lvl}',
  vn_card_ready: 'Prêt !', vn_medal_0: 'Perdu', vn_medal_1: 'Bronze', vn_medal_2: 'Argent', vn_medal_3: 'Or',
  vn_pop_gain: '+{n} popularité',
  // before, during and after a game
  vn_intro_go: 'C’est parti ! (Entrée)', vn_intro_back: 'Pas maintenant', vn_intro_goal: 'Bronze {a} · Argent {b} · Or {c} {unit}',
  vn_intro_level: 'Série de {n} : le jeu se corse.',
  ht_new: 'Nouveau !', ht_key_space: 'Espace', ht_key_enter: 'Entrée', ht_key_click: 'clic', ht_key_rclick: 'clic droit',
  vn_go: 'Partez !', vn_time: 'Temps',
  vn_pause: 'Pause', vn_pause_text: 'Abandonner compte comme une partie perdue.', vn_resume: 'Reprendre (Échap)', vn_quit: 'Abandonner',
  vn_res_0: 'Perdu…', vn_res_1: 'Médaille de bronze', vn_res_2: 'Médaille d’argent', vn_res_3: 'Médaille d’or !',
  vn_res_score: '{n} {unit}', vn_res_best: 'Nouveau record !', vn_res_best_old: 'Record : {n}',
  vn_res_pop: 'Popularité {g:du héros|de l’héroïne} +{n}', vn_res_nopop: 'Pas de popularité cette fois.',
  vn_res_gift: '{text} pendant {t}', vn_res_kept: '{text} : le cadeau en cours, meilleur, est gardé',
  vn_res_streak_up: 'Série : {n}. La prochaine partie sera plus dure, et paiera mieux.', vn_res_streak_same: 'Série : {n}.', vn_res_streak_down: 'Série retombée à {n} : le jeu redevient plus doux.',
  vn_res_wait: 'Prochaine partie ici dans {t}.', vn_res_ok: 'Continuer (Entrée)',
  vn_why: '{title} ({medal})',
  // what a keeper says of the city as it is now (« Discuter »); {intro} is his or her own way in
  vn_tip_lack: '{intro} {n} maison(s) manquent de {res}.',
  vn_tip_svc: '{intro} {n} maison(s) réclament un bâtiment à leur portée : {name}.',
  vn_tip_road: '{intro} un bâtiment n’est relié à aucun chemin ({name}) : rien n’y entre, rien n’en sort.',
  vn_tip_damaged: '{intro} {n} bâtiment(s) attendent encore des réparations.',
  vn_tip_starved: '{intro} un atelier ne tourne plus ({name}) : il manque de {res}.',
  vn_tip_raid: '{intro} les gobelins se rassemblent. Gardez vos soldats près des portes.',
  vn_tip_pop_low: '{intro} l’on parle peu {g:du héros|de l’héroïne} en ce moment. Un jeu ou deux, et les langues se délient.',
  vn_tip_pop_high: '{intro} tout le monde n’a que le nom {g:du héros|de l’héroïne} à la bouche. L’impôt rentre mieux quand on l’aime.',
  vn_tip_game: '{intro} {name} a un jeu tout prêt pour vous ({place}).',
  vn_tip_fine: '{intro} la ville tourne rond. Profitez-en pour voir plus grand.',
  // Le coup de feu
  cf_served: 'Pourboires', cf_queue: 'La file', cf_lost: 'Partis', cf_order: 'Commande', cf_again: 'Je répète :', cf_hidden: 'À vous !',
  cf_flawless: 'Sans faute !', cf_keys: 'Touches 1 à {n}, ou clic sur une tasse',
  cf_end_strikes: 'Trop de clients sont partis !',
  // Marchandage
  mk_lot: 'L’affaire', mk_asked: 'Prix demandé', mk_yours: 'Votre prix', mk_patience: 'Patience de Dame Ysolde', mk_round: 'Manche {n}',
  mk_stop: 'Espace ou clic : arrêter l’aiguille', mk_push: 'Pousser encore (↑)', mk_push_tip: 'Pousser encore\nUne manche de plus : la zone rétrécit, l’aiguille file, et sa patience s’use.',
  mk_deal: 'Topez là ! (Entrée)', mk_deal_tip: 'Topez là\nL’affaire est conclue au prix obtenu.',
  mk_perfect: 'Parfait ! −{n} %', mk_good: 'Bien ! −{n} %', mk_miss: 'Raté…', mk_closed: 'Le marché ferme : affaire conclue.', mk_gone: 'Elle s’en va !',
  mk_dear: 'cher', mk_cheap: 'donné',
  // Battre le fer
  fg_quality: 'Qualité de la lame', fg_chain: 'Chaîne ×{n}', fg_heat: 'Chaleur', fg_bellows: 'Soufflet', fg_bellows_tip: 'Soufflet\nB, ↑ ou clic droit : ranime le feu.',
  fg_strike: 'Espace ou clic : frapper', fg_pump: 'B, ↑ ou clic droit : soufflet',
  fg_ok: 'Bonne chauffe', fg_perfect: 'Parfait !', fg_good: 'Bien', fg_miss: 'Raté', fg_cold: 'Trop froid !', fg_hot: 'Ça brûle !', fg_early: 'Dans le vide',
  // La fournée
  bk_score: 'Pains dorés', bk_burnt_n: 'Brûlés', bk_keys: 'Touches 1 à {n}, ou clic sur un four',
  bk_perfect: 'Parfait ! +{n}', bk_golden: 'Doré +{n}', bk_dark: 'Foncé +{n}', bk_pale: 'Trop pâle…', bk_burnt: 'Brûlé !',
  bk_reload: 'On enfourne…', bk_end_strikes: 'La fournée a brûlé !',
  // Parade !
  bq_score: 'Parades', bq_hits_n: 'Coups reçus', bq_keys: 'Flèches du clavier, ou clic sur un côté',
  bq_quick: 'Vif ! +{n}', bq_good: 'Paré +{n}', bq_wrong: 'Mauvais côté !', bq_late: 'Touché !', bq_feinted: 'Feinte !',
  bq_end_hits: 'Trop de coups reçus !',
  // Le quartier d'Aveline
  lg_score: 'Score', lg_misses_n: 'Ratés', lg_plan: 'Plan d’Aveline', lg_yours: 'Votre quartier', lg_seen: 'J’ai vu !', lg_peek: 'Revoir le plan', lg_peek_cost: '−{n}', lg_check: 'Valider',
  lg_likeness: 'Ressemblance : {n} %', lg_quarter: '+{n}', lg_perfect: 'Parfait ! +{n}', lg_miss: 'Raté !',
  lg_end_misses: 'Aveline arrête la leçon !', lg_keys: 'Flèches, 1 à {n}, Suppr · Espace : revoir · Entrée : valider',
});

// What a place's gift is called and how it reads (`{n}` is the share, in percent). The key is what
// the rest of the game asks for through Venue.buff(key); `icon` falls back to `alt` until it exists.
DATA.venueBuffs = {
  pop: { name: 'La tournée de Gaspard', text: 'Popularité des jeux +{n} %', short: 'jeux +{n} %', icon: 'icon.popularity', alt: 'icon.hero' },
  buy: { name: 'Prix d’amie', text: 'Achats au marché −{n} %', short: 'achats −{n} %', icon: 'icon.trade', alt: 'icon.gold' },
  sell: { name: 'Prix d’amie', text: 'Ventes au marché +{n} %', short: 'ventes +{n} %', icon: 'icon.trade', alt: 'icon.gold' },
  atk: { name: 'Lame bien battue', text: 'Attaque {g:du héros|de l’héroïne} +{n} %', short: 'attaque +{n} %', icon: 'icon.atk', alt: 'icon.atk' },
  forge: { name: 'Feu vif', text: 'Forge {n} % plus rapide', short: 'forge +{n} %', icon: 'icon.time', alt: 'icon.time' },
  rise: { name: 'Pain chaud', text: 'Satisfaction des maisons {n} % plus rapide', short: 'satisfaction +{n} %', icon: 'icon.bread', alt: 'icon.bread' },
  soldier: { name: 'Bien drillés', text: 'Les soldats frappent {n} % plus fort', short: 'soldats +{n} %', icon: 'icon.atk', alt: 'icon.atk' },
  build: { name: 'Plans d’Aveline', text: 'Constructions et améliorations {n} % moins chères', short: 'bâtir −{n} %', icon: 'icon.build', alt: 'icon.stone' },
};

// The places, by the kind of building they are (data/buildings.js).
//   keeper     who stands in the middle (data/people.js DATA.keepers)
//   name       the place, on its plate
//   music      for a place without a track of its own (js/music.js): the place whose track it plays
//   perLevel   a config.js knob: seconds each level of the place's building above the first adds to its gift (Venue.giftTime)
//   line       where a keeper's image stands on a backdrop image, as a share of the screen's height
//              (the drawn interiors know their own counter); tall: how high he or she is, same share
//   faces      frames of the keeper's big strip ('venue.char.<keeper>') held for a moment: glad (a good
//              move), cross (a bad one); faces64: the same in the 64x64 portrait strip, used until the big one loads
//   title, how, keys, unit    the game: its name, its rule in one line, its controls, what its score counts
//   medals     the score for bronze, silver and gold
//   pop        popularity by result: lost, bronze, silver, gold (config.js venue_pop_scale)
//   buffs      the place's gift by result, per key of DATA.venueBuffs (config.js venue_buff_time)
//   ramp       what each win in a row changes in the game (js/minigames.js reads it)
//   greet / ready / wait   his or her line on entering: first visit, game ready, game not ready
//   chat       banter, said in turn under « Discuter »; tips: how he or she starts a word on the city
//   glad, cross, after     words during the game, and the line after it by result (lost .. gold)
//                          (other lists of words a game says: lost, okay, pushed, chain, feinted)
DATA.venues = {
  cafe: {
    keeper: 'innkeeper', name: 'Le Café d’Aubeval', line: 0.78, tall: 0.72, faces: { glad: 0, cross: 2 }, faces64: { glad: 3, cross: 6 },
    title: 'Le coup de feu', unit: 'sous de pourboire',
    how: 'Servez les bonnes tasses, dans l’ordre, avant que la patience ne s’use.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Un coup de main ? Regardez, c’est tout simple :',
    steps: ['Retenez la commande', 'Puis la bulle se referme', 'Servez-les dans l’ordre !'],
    news: [],
    legend: ['Mauvaise tasse : sa patience baisse', '{n} clients partis : c’est fini'],
    medals: [20, 34, 48], pop: [0, 4, 7, 10], buffs: { pop: [0, 0.1, 0.2, 0.3] },
    // drinks: `first` of them at the start, one more every `drinksEvery` wins; cups in an order: `cups`,
    // one more every `cupsEvery` wins and one more in the second half of the rush, `cupsMax` at most;
    // each win takes `patience` (a share) off the customers' patience and `show` seconds off the bubble
    // queue: how many customers stand in the café at once, the one at the counter included
    ramp: { first: 4, drinksEvery: 4, cups: 3, cupsEvery: 4, cupsMax: 6, patience: 0.035, show: 0.18, queue: 4 },
    //   liquid, foam, dot   the colours in the cup; shape: 'cup', 'mug' or 'glass'
    drinks: [
      { id: 'noir', name: 'Noir', shape: 'cup', liquid: '#2e1a10' },
      { id: 'creme', name: 'Crème', shape: 'cup', liquid: '#c98f55', foam: '#fff6e0' },
      { id: 'noisette', name: 'Noisette', shape: 'cup', liquid: '#6e3f20', dot: '#fff6e0' },
      { id: 'chocolat', name: 'Chocolat', shape: 'mug', liquid: '#5a2e1c', foam: '#fff6e0', dot: '#8f4c26' },
      { id: 'tisane', name: 'Tisane', shape: 'glass', liquid: '#8fcf5a', dot: '#2b7735' },
      { id: 'lait', name: 'Lait chaud', shape: 'glass', liquid: '#fdfaf0' },
    ],
    guests: ['baker', 'captain', 'steward', 'smith', 'merchant', 'guide'], // who comes for a cup: the town's own faces (portrait.<id>)
    thanks: ['Merci !', 'Parfait.', 'Ah, enfin !', 'Fameux.'], leaves: ['Trop long !', 'Je m’en vais !', 'Tant pis.'],
    greet: 'Entrez, entrez ! Ici on sert chaud et on parle fort. Quand la salle se remplit, un coup de main derrière le comptoir ne se refuse pas.',
    ready: ['La salle se remplit, {g:héros|héroïne}. Vous passez derrière le comptoir ?', 'Ça va être le coup de feu. Un tablier vous attend.', 'Les tasses sont chaudes, les clients arrivent. On y va ?'],
    wait: ['Laissez-moi essuyer mes tasses, on remet ça tout à l’heure.', 'La salle souffle un peu. Revenez dans un moment.'],
    chat: ['Une tasse noire et serrée, et la journée commence.', 'Un artisan sans café, c’est un paysan qui bâille.', 'Ici, on refait le monde. Et le village, parfois.',
      'Quand {g:le héros|l’héroïne} sert au comptoir, toute la rue vient voir. C’est bon pour vous, c’est bon pour moi.', 'Maître Odon prend toujours un crème. Il dit que c’est pour les registres.'],
    tips: ['On dit au comptoir que', 'Entre deux tasses, j’ai entendu que', 'Tendez l’oreille :'],
    glad: ['Et un de servi !', 'Bien joué !', 'Ça tourne !', 'Voilà !'], cross: ['Pas celle-là !', 'Aïe, la commande !', 'Non, non !'], lost: ['Encore un de parti…', 'Il reviendra. Peut-être.'],
    after: ['La salle s’est vidée, et pas en bien… On réessaiera.', 'Pas mal pour {g:un héros|une héroïne} ! Les clients ont souri.', 'Beau service ! On va parler de vous dans toute la rue.', 'Un service de roi ! Tournée générale, et tout Aubeval saura qui l’a servie.'],
  },
  market: {
    keeper: 'merchant', name: 'La Halle du Marché', line: 0.78, tall: 0.72, faces: { glad: 2, cross: 4 }, faces64: { glad: 1, cross: 0 },
    title: 'Marchandage', unit: '% de rabais',
    how: 'Arrêtez l’aiguille dans le vert, puis poussez encore ou topez.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Voici comment on marchande chez moi :',
    steps: ['Arrêtez l’aiguille dans le vert', 'Et le prix baisse', 'Poussez encore… ou topez !'],
    news: [],
    legend: ['Vert : −{n} %', 'Doré : −{n} %', 'Trop poussée, elle s’en va'],
    medals: [12, 22, 32], pop: [0, 2, 4, 6], buffs: { buy: [0, 0.05, 0.1, 0.15], sell: [0, 0.05, 0.1, 0.15] },
    // a stop in the zone takes `good` percent off the price, a perfect one `perfect` and gives her
    // back `relief` of her patience; `cap`: the most she will ever give. Each win in a row takes
    // `zone` (a share) off the zone and adds `speed` (a share) to the needle and `push` to what a push costs.
    good: 4, perfect: 7, relief: 0.07, cap: 45,
    ramp: { zone: 0.04, speed: 0.05, push: 0.05 },
    lots: [ // what is on the table: `res` gives the picture (data/world.js), `price` her first word
      { res: 'spice', name: 'Un lot d’épices du Levant', price: 480 },
      { res: 'cloth', name: 'Dix rouleaux d’étoffe fine', price: 900 },
      { res: 'coffee', name: 'Trois sacs de café des îles', price: 360 },
      { res: 'jewel', name: 'Un coffret de bijoux', price: 2400 },
      { res: 'wool', name: 'Vingt toisons de laine', price: 320 },
    ],
    greet: 'Approchez, bourgmestre. Tout s’achète ici, et tout se discute. Mais sachez-le : je ne perds jamais deux fois contre le même client.',
    ready: ['J’ai une belle affaire sur la table. Vous osez marchander ?', 'Un lot vient d’arriver. Faites-moi votre prix, qu’on rie un peu.', 'Voyons si vous comptez aussi bien que vous bâtissez.'],
    wait: ['Pas d’affaire pour l’instant, mon ami. La prochaine caravane arrive bientôt.', 'Laissez-moi refaire mes comptes. Revenez tout à l’heure.'],
    chat: ['Tout s’achète, mon ami. Surtout ce qui manque.', 'Mes épices viennent de plus loin que vos cartes.', 'Je vends cher, j’achète bas : c’est un métier.',
      '{g:Un héros|Une héroïne} qu’on aime paie moins cher. Les marchands aussi lisent les visages.', 'Gaspard me doit trois sacs de café. Ne lui dites pas que je compte.'],
    tips: ['Entre nous,', 'Mes clients bavardent :', 'Une marchande entend tout :'],
    glad: ['Hmpf. Joli coup.', 'Vous m’étranglez !', 'D’où sortez-vous ce talent ?'], cross: ['Ha ! Non.', 'Vous rêvez.', 'À ce prix-là ? Jamais.'],
    okay: ['Soit…', 'Bon, bon.', 'Vous êtes dur.'], pushed: ['Encore ?!', 'Vous abusez…', 'Ma patience a un prix.'],
    gone: 'Assez ! Gardez votre or, je garde ma marchandise.',
    after: ['Vous avez voulu trop. Revenez quand vous saurez vous arrêter.', 'Une petite affaire. Honnête. Trop honnête pour moi.', 'Bien négocié. Mes prix vous souriront un moment.', 'Vous m’avez dépouillée ! Tout le marché en parle déjà… Prix d’amie, pour un temps.'],
  },
  forge: {
    keeper: 'smith', name: 'La Forge de Bram', line: 0.78, tall: 0.72, faces: { glad: 3, cross: 0 }, faces64: { glad: 3, cross: 1 },
    title: 'Battre le fer', unit: '% de qualité',
    how: 'Frappez en rythme sur l’enclume, et gardez le fer chaud avec le soufflet.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Écoutez bien, c’est une affaire de rythme :',
    steps: ['Frappez quand la marque arrive', 'Gardez la chaleur dans le vert', 'Enchaînez : des étincelles !'],
    news: [],
    legend: ['Zone dorée : coup parfait', 'Fer froid ou brûlant : coup gâché'],
    medals: [45, 65, 82], pop: [0, 2, 4, 6], buffs: { atk: [0, 0.06, 0.12, 0.2], forge: [0, 0.15, 0.25, 0.4] },
    // a blow is worth `perfect` or `good`; each win in a row adds `bpm` beats a minute, takes `band`
    // off the half-width of the good heat and adds `cool` (a share) to how fast the blade cools.
    perfect: 1, good: 0.6,
    ramp: { band: 0.007, cool: 0.04 },
    // the rhythms, in bars of eight half-beats ('x' a blow, '.' a rest); `tier`: the wins in a row from which it comes up
    bars: [
      { tier: 0, bar: 'x.x.x.x.' }, { tier: 0, bar: 'x.x.x...' }, { tier: 0, bar: 'x...x.x.' },
      { tier: 1, bar: 'x.x.xxx.' }, { tier: 2, bar: 'xxx.x.x.' }, { tier: 3, bar: 'x.xxx.x.' },
      { tier: 5, bar: 'xxx.xxx.' }, { tier: 7, bar: 'x.xxxxx.' }, { tier: 9, bar: 'xxxxx.xx' },
    ],
    greet: 'Ah, {g:le héros|l’héroïne} ! Posez cette épée, prenez ce marteau. Une lame, ça se bat à deux : moi je tiens, vous frappez.',
    ready: ['Le fer est au rouge. Vous frappez, je tiens ?', 'J’ai une lame qui attend son marteau. Le vôtre ?', 'Le feu est bon. Montrez-moi ce bras.'],
    wait: ['Le fer refroidit, laissez-le reposer. On reforgera tout à l’heure.', 'Mes bras aussi ont besoin d’une pause. Revenez plus tard.'],
    chat: ['Du bon bois, du bon fer, et je vous fais une légende.', 'Une lame, ça se respecte. Et ça se renforce.', '{g:Le héros|L’héroïne} casse, moi je répare.',
      '{g:Un héros|Une héroïne} qui bat son propre fer, les gens aiment ça. Ils viennent regarder par la fenêtre.', 'Dame Ysolde dit que mon fer est trop cher. Elle n’a jamais vu le sien.'],
    tips: ['Entre deux coups de marteau, j’entends que', 'Les gardes me l’ont dit :', 'Ça se sait à la forge :'],
    glad: ['Voilà !', 'Bien frappé !', 'Ça chante !'], cross: ['Raté !', 'Le rythme !', 'Écoutez le fer !'],
    chain: ['Ça, c’est forger !', 'Elle chante !'], cold: 'Trop froid ! Le soufflet !', hot: 'Ça brûle ! Doucement !',
    after: ['Cette lame-là ira aux clous. On recommencera.', 'Elle coupe. C’est déjà ça.', 'Belle lame ! Votre bras s’en souviendra au combat.', 'Une lame de légende ! Frappez comme ça au combat et rien ne tiendra.'],
  },
  bakery: {
    keeper: 'baker', name: 'La Boulangerie', music: 'cafe', line: 0.78, tall: 0.72, faces: { glad: 1, cross: 4 }, faces64: { glad: 3, cross: 1 },
    title: 'La fournée', unit: 'pains dorés',
    how: 'Sortez chaque pain du four quand il est doré, avant qu’il ne brûle.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Regardez, {g:mon grand|ma grande}, c’est tout simple :',
    steps: ['Le pain cuit, puis brûle', 'Sortez-le quand il est doré', '{n} pains brûlés : perdu'],
    news: [{ id: 'brioche', text: 'Nouveau : la brioche, plus lente' }],
    legend: ['Pâle : 0', 'Doré : {golden}', 'Au cœur : {perfect}', 'Foncé : {dark}'],
    medals: [24, 38, 52], pop: [0, 2, 4, 6], buffs: { rise: [0, 0.2, 0.4, 0.6] },
    // a loaf taken golden is worth `golden`, in the heart of the window `perfect`, dark `dark`; pale, nothing.
    // ovens: `ovens` at the start, one more every `ovensEvery` wins, `ovensMax` at most; each win takes
    // `bake` (a share) off every baking time and `window` (a share) off the golden window
    points: { perfect: 3, golden: 2, dark: 1 },
    ramp: { ovens: 3, ovensEvery: 3, ovensMax: 5, bake: 0.03, window: 0.04 },
    // the loaves: `bake` multiplies config.js bakery_bake (the miche's time to burn); `from`: the wins in a row from which it comes up
    breads: [
      { id: 'baguette', name: 'Baguette', bake: 0.7 },
      { id: 'miche', name: 'Miche', bake: 1 },
      { id: 'brioche', name: 'Brioche', bake: 1.4, from: 2 },
    ],
    greet: 'Entrez donc, {g:mon grand|ma grande}, il fait bon près des fours ! Ici on se lève avant le coq pour que tout Aubeval ait son pain. Et quand les fournées cuisent toutes à la fois, deux mains de plus ne sont jamais de trop.',
    ready: ['Les fours sont chauds et la pâte a levé. Vous retroussez vos manches ?', 'Mes fours chauffent tous à la fois, et je n’ai que deux mains. Vous me prêtez les vôtres ?', 'La fournée n’attend que vous. Et gare : un pain, ça n’attend personne.'],
    wait: ['La pâte lève, et ça ne se presse pas. Revenez tout à l’heure, je vous garde une place près du four.', 'Je pétris la prochaine fournée. Repassez dans un moment… et prenez donc un croûton en sortant.'],
    chat: ['Une miche chaude et le monde va mieux.', 'Farine, eau, sel, et une nuit de patience : le bon pain ne demande rien d’autre.', 'Vos paysans mangent comme quatre. Tant mieux : un village qui mange bien est un village qui chante.',
      '{g:Un héros|Une héroïne} qui part se battre le ventre creux ? Pas tant que je tiens ce fournil. Tenez, une brioche, et pas de manières.', 'Gaspard trempe mes croissants dans son café. Je fais semblant de ne pas voir… et je lui en garde deux de plus.'],
    tips: ['Au fournil, on ne parle que de ça :', 'Mes clients du matin me l’ont glissé avec la monnaie :', 'Ça se dit entre deux fournées :'],
    glad: ['Doré à point !', 'Ah, ça, c’est du pain !', 'Sentez-moi cette croûte !'], cross: ['Trop tôt, il est tout pâle !', 'Encore pâle…', 'Patience, voyons !'], lost: ['Ça sent le brûlé !', 'Le four ! Le four !', 'Oh, mon pauvre pain…'],
    after: ['Tout a brûlé… On ouvre les fenêtres, on chasse la fumée, et on recommence. Ce n’est que du pain.', 'Quelques bons pains, et des voisins qui ne se coucheront pas le ventre vide. C’est un début.', 'Belle fournée ! Toute la rue sent le pain chaud, et les maisons ont le sourire.', 'Une fournée de roi ! Tout Aubeval aura du pain chaud ce soir… et chacun saura quelles mains l’ont sorti du four.'],
  },
  barracks: {
    keeper: 'captain', name: 'La Caserne', music: 'forge', line: 0.78, tall: 0.72, faces: { glad: 5, cross: 3 }, faces64: { glad: 2, cross: 4 },
    title: 'Parade !', unit: 'parades',
    how: 'Levez le bouclier du côté annoncé avant que le coup ne tombe.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Écoutez-moi bien, {g:héros|héroïne} :',
    steps: ['J’annonce un côté', 'Bouclier de ce côté, vite !', '{n} coups reçus : perdu'],
    news: [{ id: 'feint', text: 'Feinte : l’ordre change en route' }, { id: 'double', text: 'Coups doubles : deux côtés de suite' }],
    legend: ['Anneau doré : {n}', 'À temps : {n}'],
    medals: [22, 34, 46], pop: [0, 2, 4, 6], buffs: { soldier: [0, 0.1, 0.2, 0.3] },
    // the right side parried is worth `good`, in the first part of the wait (config.js barracks_quick) `quick`.
    // each win takes `lead` (a share) off the wait; feints come from `feintFrom` wins, double blows from `doubleFrom`
    points: { quick: 3, good: 2 },
    ramp: { lead: 0.04, feintFrom: 2, doubleFrom: 4 },
    // the four sides a blow comes from: `arrow` is its key, `shout` what the captain calls
    sides: [
      { id: 'up', name: 'Haut', arrow: '↑', shout: 'En haut !' },
      { id: 'right', name: 'Droite', arrow: '→', shout: 'À droite !' },
      { id: 'down', name: 'Bas', arrow: '↓', shout: 'En bas !' },
      { id: 'left', name: 'Gauche', arrow: '←', shout: 'À gauche !' },
    ],
    greet: 'Garde à vous ! Ah, c’est {g:le héros|l’héroïne}. Ici, on n’entre pas pour regarder : on prend un bouclier. Mes recrues frappent, vous parez, et toute la troupe apprend en vous voyant faire.',
    ready: ['Une recrue attend son tour, l’épée de bois au poing. Bouclier au bras, et en position !', 'La corne a sonné ? Alors pas de temps à perdre : un exercice avant que les gobelins n’arrivent, et mes soldats frapperont plus fort.', 'Mes recrues ont besoin de voir comment on pare. Montrez-leur, {g:héros|héroïne}. J’annonce, vous parez.'],
    wait: ['La troupe souffle. Repos, mais pas trop longtemps : on reprend l’exercice tout à l’heure.', 'Je fais l’appel et je compte les bosses. Repassez dans un moment, le bouclier vous attend.'],
    chat: ['Une parade vaut mieux que deux bandages.', 'Le milicien tient la porte, l’archer tient le mur, et moi je les tiens tous les deux.', 'Mes recrues arrivent paysans et repartent soldats. Entre les deux, il y a moi.',
      '{g:Un héros|Une héroïne} qui prend le bouclier avec la troupe, ça vaut tous mes discours. Même les plus jeunes se tiennent plus droit.', 'Bram forge les lames, Mélisande nourrit la troupe. Moi, j’apprends à tout ce monde à rester en vie.'],
    tips: ['Rapport de la garde :', 'Mes sentinelles me l’ont signalé :', 'Au rassemblement du matin, ça se disait dans les rangs :'],
    glad: ['Bien vu !', 'Belle parade !', 'Voilà un bouclier !', 'Pas mal. Pas mal du tout.'], cross: ['L’autre côté !', 'Écoutez l’ordre !', 'Pas par là !'], lost: ['Trop lent !', 'Le bouclier, voyons !', 'On dort ?'],
    feinted: ['Feinte ! L’ordre a changé.', 'Vous avez mordu !', 'Écoutez jusqu’au bout !'],
    after: ['Ce n’était pas un exercice, c’était une bagarre. Pansez-vous, et on reprend plus tard.', 'Ça pare. Pas encore une garde, mais mes recrues ont vu comment on tient un bouclier.', 'Belle garde ! La troupe a regardé, et elle frappera plus fort. Je ne le dirai pas deux fois.', 'Une garde de légende ! Toute la caserne ne parle que de vous, et mes soldats frappent comme jamais. Je suis fière d’eux… et de vous.'],
  },
  lodge: {
    keeper: 'guide', name: 'La Loge des bâtisseurs', music: 'market', perLevel: 'lodge_level_time', line: 0.78, tall: 0.72, faces: { glad: 1, cross: 2 }, faces64: { glad: 0, cross: 4 },
    title: 'Le quartier d’Aveline', unit: 'points',
    how: 'Retenez le quartier d’Aveline, puis rebâtissez-le de mémoire.',
    // the intro's cards (js/minigames.js howto): the keeper's short line, a few words a card, the new twists, what each result is worth
    say: 'Une leçon de bâtisseuse : regardez bien, puis rebâtissez.',
    steps: ['Retenez le quartier', 'Rebâtissez-le de mémoire', 'Revoir le plan : −{n} points'],
    news: [{ id: 'turn', text: 'Plan tourné : suivez le drapeau' }],
    legend: ['Bâtiment juste : +{n}', 'Bâtiment faux : −{n}', 'Quartier parfait : +{n}'],
    medals: [30, 55, 75], pop: [0, 2, 4, 6], buffs: { build: [0, 0.05, 0.1, 0.15] },
    // Aveline's quarter (js/blueprint.js): a `side` × `side` grid, one side more every `sideEvery` wins up to `sideMax`;
    // `count` buildings, one more a win, at most `countMax` and `fill` of the cells; `kinds` kinds in the palette, one
    // more every `kindsEvery` wins up to `kindsMax`; the plan shown `show` s, `showStep` less a win, `showMin` at least;
    // shown turned from `turnedFrom` wins (config.js lodge_*: the clock, the misses, the price of a second look, the points)
    ramp: { side: 3, sideEvery: 3, sideMax: 5, count: 4, countMax: 9, fill: 0.6, kinds: 4, kindsEvery: 2, kindsMax: 6,
      show: 5, showStep: 0.4, showMin: 2.5, turnedFrom: 3 },
    // the buildings of Aveline's quarters, in the order of their keys: all 2 × 2 in the village, each with its own roof and walls
    // (the bakery, the café, the weaver and the roastery wear the house's red roof: left out); the first four the most unlike
    kinds: ['house', 'forge', 'chapel', 'mage_tower', 'goldsmith', 'lumber_hut'],
    greet: 'Bienvenue à la Loge, bourgmestre ! C’est ici que je dresse les plans d’Aubeval, et que mes compagnons apprennent le métier. Un bon bâtisseur retient un quartier d’un coup d’œil : venez me montrer le vôtre, et mes plans vous feront bâtir à moindres frais.',
    ready: ['Mon quartier est sur la table, bourgmestre. Regardez-le bien : tout à l’heure, c’est vous qui le bâtirez !', 'Une maison ici, une chapelle là… Je vous le montre une fois, et vous me le rebâtissez de mémoire. On s’y met ?', 'Une leçon de bâtisseuse, ça vous dit ? Un bon plan se retient d’un regard, et se rebâtit sans hésiter.'],
    wait: ['Je redessine mes quartiers. Repassez tout à l’heure : mes plans, eux, ne bougeront pas.', 'Je reprends mes plans un moment. Et agrandissez donc la Loge, bourgmestre : à chaque niveau, mes plans vous servent plus longtemps.'],
    chat: ['Un quartier, ça se regarde comme un visage : on retient d’abord ce qui dépasse, la flèche d’une chapelle, la tour d’un mage. Le reste suit.', 'Regardez-moi ce plan, bourgmestre : chaque maison à sa place, chaque rue droite. Un quartier bien tracé, c’est un quartier qui tient cent ans.', 'Mon drapeau, je le plante toujours au même coin. Tournez le plan comme vous voulez : suivez le drapeau, et vous ne vous perdrez jamais.',
      '{g:Un héros|Une héroïne} qui rebâtit un quartier de mémoire, on n’en voit pas souvent. Mes compagnons en parlent encore, et revoient leurs plans le soir.', 'Bram me forge mes ciseaux, Dame Ysolde me vend ma pierre trop cher. Chacun son métier, et le mien, c’est que tout tienne debout.'],
    tips: ['Sur mes plans, je vois ceci :', 'Mes compagnons me l’ont signalé du haut de l’échafaudage :', 'Un conseil de bâtisseuse, bourgmestre :'],
    glad: ['Bien vu !', 'Presque tout y est !', 'Voilà un quartier qui se tient !', 'Bonne mémoire !'], cross: ['Regardez mieux !', 'Ce n’est pas mon quartier, ça !', 'Le plan d’abord, les maisons ensuite !'],
    chain: ['Parfait, au pavé près !', 'Mon quartier, trait pour trait !', 'Voilà le métier qui rentre !'],
    after: ['On s’arrête là pour aujourd’hui… Ce n’est que du papier, bourgmestre : on le roule, et on recommence. Tous les maîtres ont mélangé leurs premiers plans.', 'Quelques quartiers rebâtis, et pas de travers. Mes plans vous feront gagner un peu sur vos chantiers.', 'Beau travail ! Chaque maison à sa place, chaque rue où je l’avais tracée. Mes plans sont à vous un moment : vos chantiers coûteront moins cher.', 'Un travail de maître ! On croirait que vous aviez mon plan sous les yeux. Mes meilleurs plans sont à vous : vos chantiers coûteront bien moins cher, et chacun saura quelle mémoire a rebâti ce quartier.'],
  },
};
DATA.venueOrder = ['cafe', 'market', 'forge', 'bakery', 'barracks', 'lodge'];
