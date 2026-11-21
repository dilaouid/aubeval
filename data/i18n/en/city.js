// PROTOTYPE - NOT FOR PRODUCTION
// EN layer of data/city.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract en; translations already here are kept.
I18N.add('en', {
  'city.ranks[0].name': 'Hamlet', // Hameau
  'city.ranks[0].text': 'A few roofs around a Town Hall.', // Quelques toits autour d’un hôtel de ville.
  'city.ranks[1].name': 'Borough', // Bourg
  'city.ranks[1].text': 'Folk come to Aubeval’s market from the farms all around.', // On vient au marché d’Aubeval depuis les fermes alentour.
  'city.ranks[1].opens': 'richer orders', // des commandes plus riches
  'city.ranks[2].name': 'Town', // Ville
  'city.ranks[2].text': 'Ramparts, a bell, burghers: Aubeval is on the map.', // Des remparts, une cloche, des bourgeois : Aubeval compte sur les cartes.
  'city.ranks[2].opens': 'luxury orders', // les commandes de luxe
  'city.ranks[3].name': 'City', // Cité
  'city.ranks[3].text': 'Merchants keep their counting houses here, and the cathedral rises from the ground.', // Les négociants y tiennent comptoir, et la cathédrale sort de terre.
  'city.ranks[4].name': 'Capital', // Capitale
  'city.ranks[4].text': 'The kingdom is now governed from Aubeval.', // Le royaume se gouverne désormais depuis Aubeval.
  'city.ranks[4].opens': 'endless ranks: Capital II, III…', // les rangs sans fin : Capitale II, III…
  'city.endless.name': 'Capital', // Capitale
  'city.endless.text': 'Aubeval grows still, and the whole kingdom knows it.', // Aubeval grandit encore, et tout le royaume le sait.
  'city.endless.opens': 'one rank more, always', // un rang de plus, toujours
  'city.orders[feast].title': 'The Banquet', // Le banquet
  'city.orders[feast].from': 'Mélisande', // Mélisande
  'city.orders[feast].text': 'A banquet is being laid on the square: it needs {n} {res}.', // Un banquet se prépare sur la place : il y faut {n} {res}.
  'city.orders[yard].title': 'Next Door’s Works', // Le chantier voisin
  'city.orders[yard].from': 'The master carpenter', // Le maître charpentier
  'city.orders[yard].text': 'The next village is rebuilding its hall: {n} {res}, and it pays well.', // Le village d’à côté rebâtit sa halle : {n} {res}, et il paie bien.
  'city.orders[luxury].title': 'The Dowry', // La dot
  'city.orders[luxury].from': 'Lady Ysolde', // Dame Ysolde
  'city.orders[luxury].text': 'A great family is marrying off its daughter: {n} {res} for the dowry.', // Une grande famille marie sa fille : {n} {res} pour la dot.
  'city.orders[build].title': 'Short of Room', // On manque de place
  'city.orders[build].from': 'Master Odon', // Maître Odon
  'city.orders[build].text': 'The council asks for: {name} ({n} more).', // Le conseil réclame : {name} ({n} de plus).
  'city.orders[adorn].title': 'A Town Worth Seeing', // Une ville qui se montre
  'city.orders[adorn].from': 'The inhabitants', // Les habitants
  'city.orders[adorn].text': 'The inhabitants want something to be proud of: {name} ({n} more).', // Les habitants veulent de quoi être fiers : {name} ({n} de plus).
  'city.orders[raise].title': 'A Family on the Rise', // Une famille qui monte
  'city.orders[raise].from': 'Master Odon', // Maître Odon
  'city.orders[raise].text': 'Raise {n} house(s) to the next class.', // Élevez {n} maison(s) à la classe du dessus.
  'city.orders[beauty].title': 'The Finest Street', // La plus belle rue
  'city.orders[beauty].from': 'The inhabitants', // Les habitants
  'city.orders[beauty].text': 'Give at least one house a street of beauty {n}.', // Qu’une maison au moins ait une rue de beauté {n}.
  'city.orders[raid].title': 'Hold the Gate', // Tenir la porte
  'city.orders[raid].from': 'Captain Hilde', // Capitaine Hilde
  'city.orders[raid].text': 'Repel {n} raid(s): the guard wants to show its worth.', // Repoussez {n} raid(s) : la garde veut montrer ce qu’elle vaut.
  'city.orders[battle].title': 'The Roads Are Unsafe', // Les routes sont peu sûres
  'city.orders[battle].from': 'The pedlars', // Les colporteurs
  'city.orders[battle].text': 'Win {n} battle(s): a quest or a contract (J).', // Gagnez {n} combat(s) : une quête ou un contrat (J).
  'city.orders[camp].title': 'An End to the Camp', // En finir avec le camp
  'city.orders[camp].from': 'Captain Hilde', // Capitaine Hilde
  'city.orders[camp].text': 'Raze the goblin camp: send your soldiers there.', // Rasez le camp gobelin : envoyez-y vos soldats.
  'city.orders[game].title': 'They’re Waiting for You', // On vous attend
  'city.orders[game].from': 'Gaspard', // Gaspard
  'city.orders[game].text': 'Go and play a game: {name}, a {score} medal at least.', // Allez jouer une partie : {name}, médaille de {score} au moins.
  'city.orders[site].title': 'What Was Found Out There', // Ce qu’on a trouvé là-bas
  'city.orders[site].from': 'The scouts', // Les éclaireurs
  'city.orders[site].text': 'Complete a site discovered while exploring (E).', // Menez à bien un lieu découvert en explorant (E).
  'city.orders[convoy].title': 'The Royal Convoy', // Le convoi royal
  'city.orders[convoy].from': 'The king’s steward', // L’intendant du roi
  'city.orders[convoy].text': 'The court is raising a convoy: {n} {res}. A great order: it counts triple.', // La cour lève un convoi : {n} {res}. Une grande commande, elle compte triple.
  'city.stages[0]': 'Foundations', // Fondations
  'city.stages[1]': 'Walls', // Murs
  'city.stages[2]': 'Roof', // Toiture
  'city.stages[3]': 'Completion', // Achèvement
  'city.bonuses.sat.label': 'Satisfaction gained at each meal: +{v}%', // Satisfaction gagnée à chaque repas : +{v} %
  'city.bonuses.floor.label': 'Popularity: never below {v}', // Popularité : jamais sous {v}
  'city.bonuses.guard.label': 'Raid plunder: −{v}%', // Pillage des raids : −{v} %
  'city.bonuses.soldier.label': 'Soldiers: +{v}% health and damage', // Soldats : +{v} % de vie et de dégâts
  'city.bonuses.market.label': 'Market: {v}% better, buying and selling alike', // Marché : {v} % de mieux, à l’achat comme à la vente
  'city.bonuses.sight.label': 'Sight in the mist: +{v} tiles', // Vue dans le brouillard : +{v} cases
  'city.bonuses.trip.label': 'Expeditions: −{v}% time', // Expéditions : −{v} % de temps
  'city.bonuses.out.label': 'Production: +{v}%', // Production : +{v} %
  'city.bonuses.tax.label': 'Taxes: +{v}%', // Impôts : +{v} %
  'city.bonuses.xp.label': 'Hero’s experience: +{v}%', // Expérience du héros : +{v} %
  'city.bonuses.bounty.label': 'Raid bounties: +{v}%', // Primes de raid : +{v} %
  'city.bonuses.orders.label': 'Order pay: +{v}%', // Paie des commandes : +{v} %
  'city.bonuses.stock.label': 'Starting stores', // Réserves de départ
  'legacyBranches.prosperity': 'Prosperity', // Prospérité
  'legacyBranches.arms': 'Arms', // Armes
  'legacyBranches.horizons': 'Horizons', // Horizons
  'legacy[out].name': 'Skilled Hands', // Mains habiles
  'legacy[out].desc': 'Every building produces more.', // Chaque bâtiment produit davantage.
  'legacy[tax].name': 'Royal Treasury', // Trésor royal
  'legacy[tax].desc': 'Every house pays more.', // Chaque maison paie davantage.
  'legacy[floor].name': 'Beloved Line', // Lignée aimée
  'legacy[floor].desc': 'The hero’s popularity never falls as low.', // La popularité du héros ne tombe jamais plus bas.
  'legacy[stock].name': 'Full Granaries', // Greniers pleins
  'legacy[stock].desc': 'A New Start begins with stores.', // Un nouveau départ commence avec des réserves.
  'legacy[orders].name': 'Good Contacts', // Carnet d’adresses
  'legacy[orders].desc': 'Orders pay better.', // Les commandes paient mieux.
  'legacy[xp].name': '{de_hero} Chronicles', // Chroniques {de_hero}
  'legacy[xp].desc': 'The hero learns faster.', // Le héros apprend plus vite.
  'legacy[bounty].name': 'War Bounties', // Primes de guerre
  'legacy[bounty].desc': 'A repelled raid brings in more.', // Un raid repoussé rapporte plus.
  'legacy[guard].name': 'Old Ramparts', // Vieux remparts
  'legacy[guard].desc': 'Raiders carry off less.', // Les pillards emportent moins.
  'legacy[trip].name': 'Old Maps', // Cartes anciennes
  'legacy[trip].desc': 'Expeditions go faster.', // Les expéditions vont plus vite.
  'legacy[sight].name': 'Spyglass', // Longue-vue
  'legacy[sight].desc': 'The town sees farther into the mist.', // La ville voit plus loin dans le brouillard.
});
