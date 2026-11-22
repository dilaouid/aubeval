// PROTOTYPE - NOT FOR PRODUCTION
// EN layer of data/people.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract en; translations already here are kept.
I18N.add('en', {
  'classes[peasant].name': 'Peasants', // Paysans
  'classes[peasant].one': 'Peasant', // Paysan
  'classes[peasant].desc': 'They want bread. Well fed, they pay full tax and can rise.', // Ils demandent du pain. Bien nourris, ils paient plein impôt et peuvent s’élever.
  'classes[artisan].name': 'Artisans', // Artisans
  'classes[artisan].one': 'Artisan', // Artisan
  'classes[artisan].desc': 'Bread and coffee, and a Café down the street. They open the Chapel and the Market, and train archers.', // Pain et café, et un Café au bout de la rue. Ils ouvrent la Chapelle et le Marché, et forment les archers.
  'classes[burgher].name': 'Burghers', // Bourgeois
  'classes[burgher].one': 'Burgher', // Bourgeois
  'classes[burgher].desc': 'Bread, coffee and spices from the Market, a Café and a Chapel within reach. They need a Borough. They open wool and weaving, and arm the knights.', // Pain, café et épices du Marché, un Café et une Chapelle à portée. Il leur faut un Bourg. Ils ouvrent la laine et le tissage, et arment les chevaliers.
  'classes[merchant].name': 'Merchants', // Négociants
  'classes[merchant].one': 'Merchant', // Négociant
  'classes[merchant].desc': 'They add cloth, want the Market within reach and a pleasant street (beauty 4). They need a Town. They open the Goldsmith.', // Ajoutent les étoffes, veulent le Marché à portée et une rue plaisante (beauté 4). Il leur faut une Ville. Ils ouvrent l’Orfèvre.
  'classes[noble].name': 'Nobles', // Nobles
  'classes[noble].one': 'Noble', // Noble
  'classes[noble].desc': 'Jewels too, and a splendid street (beauty 10): fountains, statues, trees and flowers. They need a City, and a hero beloved of {g:his|her} town.', // Bijoux en plus, et une rue superbe (beauté 10) : fontaines, statues, arbres et fleurs. Il leur faut une Cité, et {g:un héros aimé|une héroïne aimée} de sa ville.
  'units.woodcutter.name': 'Woodcutter', // Bûcheron
  'units.woodcutter.plural': 'Woodcutters', // Bûcherons
  'units.woodcutter.desc': 'Cuts wood from the nearest tree and brings it back. A woodcutter’s hut near the forest shortens his trips.', // Coupe du bois à l’arbre le plus proche et le rapporte. Une cabane de bûcheron près de la forêt raccourcit ses trajets.
  'units.miner.name': 'Miner', // Mineur
  'units.miner.plural': 'Miners', // Mineurs
  'units.miner.desc': 'Hews the nearest rock and brings back the stone. A quarry serves as his store.', // Taille le rocher le plus proche et rapporte la pierre. Une carrière sert de dépôt.
  'units.farmhand.name': 'Harvester', // Moissonneur
  'units.farmhand.plural': 'Harvesters', // Moissonneurs
  'units.farmhand.desc': 'Reaps a farm’s fields and carries the wheat to the village.', // Fauche aux champs d’une ferme et porte le blé au village.
  'units.militia.name': 'Militiaman', // Milicien
  'units.militia.plural': 'Militia', // Miliciens
  'units.militia.desc': 'Spear and shield: he bars the road, and raiders must stop to fight him.', // Lance et bouclier : il barre la route, les pillards doivent s’arrêter pour le combattre.
  'units.archer.name': 'Archer', // Archer
  'units.archer.plural': 'Archers', // Archers
  'units.archer.desc': 'Shoots from afar, over the ramparts. Fragile: keep him behind your militia.', // Tire de loin, par-dessus les remparts. Fragile : gardez-le derrière vos miliciens.
  'units.knight.name': 'Knight', // Chevalier
  'units.knight.plural': 'Knights', // Chevaliers
  'units.knight.desc': 'Steel plate: he holds a breach alone and cleaves brutes.', // Harnois d’acier : il tient seul une brèche et fend les brutes.
  'traps.spikes.name': 'Stakes', // Pieux
  'traps.spikes.card': 'Stakes', // Pieux
  'traps.spikes.desc': 'Wounds every raider who steps on them. Holds for six passes.', // Blesse chaque pillard qui marche dessus. Tient six passages.
  'traps.tar.name': 'Pitch Pool', // Mare de poix
  'traps.tar.card': 'Pitch', // Poix
  'traps.tar.desc': 'Mires raiders: they crawl for three seconds under your towers’ fire.', // Englue les pillards : ils rampent trois secondes sous le tir de vos tours.
  'traps.powder.name': 'Powder Keg', // Baril de poudre
  'traps.powder.card': 'Powder', // Poudre
  'traps.powder.desc': 'Blows at the first raider and blasts the whole group, armour and all.', // Explose au premier pillard et souffle tout le groupe, armures comprises.
  'keepers.steward.name': 'Master Odon', // Maître Odon
  'keepers.steward.title': 'Steward', // Intendant
  'keepers.steward.lines[0]': 'The ledgers are up to date, my lord. Almost.', // Les registres sont à jour, messire. Presque.
  'keepers.steward.lines[1]': 'A village is counted in mouths to feed.', // Un village se compte en bouches à nourrir.
  'keepers.steward.lines[2]': 'Well-fed peasants make fine artisans.', // Des paysans repus font de bons artisans.
  'keepers.steward.raid': 'Take cover! I’ll guard the ledgers, you guard the rest.', // Aux abris ! Je garde les registres, gardez le reste.
  'keepers.smith.name': 'Bram', // Bram
  'keepers.smith.title': 'Blacksmith', // Forgeron
  'keepers.smith.lines[0]': 'Good wood, good iron, and I’ll make you a legend.', // Du bon bois, du bon fer, et je vous fais une légende.
  'keepers.smith.lines[1]': 'A blade wants respect. And reinforcing.', // Une lame, ça se respecte. Et ça se renforce.
  'keepers.smith.lines[2]': 'The hero breaks, I mend.', // {g:Le héros|L’héroïne} casse, moi je répare.
  'keepers.smith.busy': 'Stand back, she’s hot! She’ll be ready soon.', // Reculez, ça chauffe ! Elle sera prête bientôt.
  'keepers.baker.name': 'Mélisande', // Mélisande
  'keepers.baker.title': 'Baker', // Boulangère
  'keepers.baker.lines[0]': 'A warm loaf and the world looks brighter.', // Une miche chaude et le monde va mieux.
  'keepers.baker.lines[1]': 'Your peasants eat for four. All the better!', // Vos paysans mangent comme quatre. Tant mieux !
  'keepers.baker.lines[2]': 'Take some for the hero, {g:he|she} looks peaky.', // Emportez-en pour {g:le héros|l’héroïne}, {g:il|elle} a mauvaise mine.
  'keepers.baker.sad': 'Not a grain of wheat left… I can’t knead thin air.', // Plus un grain de blé… je ne peux pas pétrir du vent.
  'keepers.innkeeper.name': 'Gaspard', // Gaspard
  'keepers.innkeeper.title': 'Café Keeper', // Cafetier
  'keepers.innkeeper.lines[0]': 'A cup, black and strong, and the day begins.', // Une tasse noire et serrée, et la journée commence.
  'keepers.innkeeper.lines[1]': 'An artisan without coffee is just a yawning peasant.', // Un artisan sans café, c’est un paysan qui bâille.
  'keepers.innkeeper.lines[2]': 'Here we put the world to rights. And the village, sometimes.', // Ici, on refait le monde. Et le village, parfois.
  'keepers.innkeeper.lines[3]': 'Houses within reach of my counter rise faster.', // Les maisons à portée de mon comptoir s’élèvent plus vite.
  'keepers.innkeeper.sad': 'Not a coffee bean left… I’m serving hot water now.', // Plus un grain de café… je sers de l’eau chaude, maintenant.
  'keepers.merchant.name': 'Lady Ysolde', // Dame Ysolde
  'keepers.merchant.title': 'Merchant', // Marchande
  'keepers.merchant.lines[0]': 'Everything can be bought, my friend. Above all, what’s lacking.', // Tout s’achète, mon ami. Surtout ce qui manque.
  'keepers.merchant.lines[1]': 'My spices come from beyond the edge of your maps.', // Mes épices viennent de plus loin que vos cartes.
  'keepers.merchant.lines[2]': 'I sell dear and buy cheap: that’s the trade.', // Je vends cher, j’achète bas : c’est un métier.
  'keepers.merchant.raid': 'I’m shutting up shop until this calms down!', // Je ferme boutique le temps que ça se calme !
  'keepers.captain.name': 'Captain Hilde', // Capitaine Hilde
  'keepers.captain.title': 'Captain of the Guard', // Capitaine de la garde
  'keepers.captain.lines[0]': 'Give me ten militiamen and I’ll hold the gate.', // Donnez-moi dix miliciens et je tiens la porte.
  'keepers.captain.lines[1]': 'One archer behind a wall is worth three spears.', // Un archer derrière un mur vaut trois lances.
  'keepers.captain.lines[2]': 'Select my soldiers, point, and off they go.', // Sélectionnez mes soldats, pointez, et ils y vont.
  'keepers.captain.busy': 'Hup, two! Hup, two! The recruit will be ready shortly.', // Un-deux, un-deux ! La recrue sera prête sous peu.
  'keepers.captain.raid': 'To your posts! Right-click where you want them!', // À vos postes ! Clic droit là où vous les voulez !
});
