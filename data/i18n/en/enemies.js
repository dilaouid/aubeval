// PROTOTYPE - NOT FOR PRODUCTION
// EN layer of data/enemies.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract en; translations already here are kept.
I18N.add('en', {
  'enemies.gobelin.name': 'Thieving Goblin', // Gobelin chapardeur
  'enemies.gobelin.how': 'Quick: two small blows a turn, so two parries.', // Rapide : deux petits coups par tour, donc deux parades.
  'enemies.brute.name': 'Armoured Brute', // Brute cuirassée
  'enemies.brute.how': 'Slow and heavily armoured. Raises its club, then strikes terribly the next turn: Guard, parry, or make it lose its turn.', // Lente et blindée. Lève sa massue, puis frappe terriblement au tour suivant : Garde, parade, ou faites-lui perdre son tour.
  'enemies.chaman.name': 'Bramble Shaman', // Chaman des Ronces
  'enemies.chaman.how': 'Heals its allies; its hex goes through armour and Guard: only a parry stops it. Bring it down first.', // Soigne ses alliés ; son maléfice traverse l’armure et la Garde : seule la parade l’arrête. À abattre en premier.
  'enemies.grakk.name': 'Grakk the Cleaver', // Grakk le Fendeur
  'enemies.grakk.how': 'Warlord. His cleaver falls a turn after it is raised; wounded, he calls a goblin, then flies into a rage.', // Chef de guerre. Son fendoir tombe un tour après avoir été levé ; blessé, il appelle un gobelin, puis enrage.
  'enemies.warlord.name': 'Warlord', // Chef de guerre
  'enemies.morgash.name': 'Morgash the Wallbreaker', // Morgash le Briseur de murs
  'enemies.morgash.how': 'His hammer shatters Guard before it strikes: only a parry stops that blow. Then he raises it for a terrible strike.', // Son marteau fracasse la Garde avant de frapper : seule la parade arrête ce coup-là. Puis il le lève pour un coup terrible.
  'enemies.zhara.name': 'Zhara the Bramble-Mother', // Zhara la Ronce-mère
  'enemies.zhara.how': 'Her hexes go through Guard and armour. Wounded, she heals herself and calls a shaman: strike hard, and keep striking.', // Ses maléfices traversent la Garde et l’armure. Blessée, elle se soigne et appelle un chaman : frappez fort, sans relâche.
  'enemies.urgak.name': 'Urgak the Brute-Herder', // Urgak le Meneur de brutes
  'enemies.urgak.how': 'Raises his cleaver, then brings it down. Wounded, he whistles up a brute, then flies into a rage.', // Lève son fendoir, puis l’abat. Blessé, il siffle une brute, puis enrage.
  'enemies.skrit.name': 'Skrit the Quickblade', // Skrit la Lame vive
  'enemies.skrit.how': 'Two blows, then three, without respite: as many parries. Little armour: every riposte counts.', // Deux coups, puis trois, sans répit : autant de parades. Peu d’armure : chaque riposte compte.
  'warlords[morgash].name': 'Morgash', // Morgash
  'warlords[morgash].title': 'the Wallbreaker', // le Briseur de murs
  'warlords[morgash].trait': 'His raiders tear down ramparts and buildings twice as fast.', // Ses pillards abattent remparts et bâtiments deux fois plus vite.
  'warlords[morgash].how': 'His hammer shatters Guard before it strikes: only a parry stops that blow. Then he raises it for a terrible strike.', // Son marteau fracasse la Garde avant de frapper : seule la parade arrête ce coup-là. Puis il le lève pour un coup terrible.
  'warlords[morgash].short': 'His raiders break walls 2× faster.', // Ses pillards brisent les murs 2× plus vite.
  'warlords[zhara].name': 'Zhara', // Zhara
  'warlords[zhara].title': 'the Bramble-Mother', // la Ronce-mère
  'warlords[zhara].trait': 'Two more shamans in her column, and their healing is doubled.', // Deux chamans de plus dans sa colonne, et leurs soins sont doublés.
  'warlords[zhara].how': 'Her hexes go through Guard and armour. Wounded, she heals herself and calls a shaman: strike hard, and keep striking.', // Ses maléfices traversent la Garde et l’armure. Blessée, elle se soigne et appelle un chaman : frappez fort, sans relâche.
  'warlords[zhara].short': 'Two more shamans, with double healing.', // Deux chamans de plus, aux soins doublés.
  'warlords[urgak].name': 'Urgak', // Urgak
  'warlords[urgak].title': 'the Brute-Herder', // le Meneur de brutes
  'warlords[urgak].trait': 'Three more armoured brutes march ahead of him.', // Trois brutes cuirassées de plus marchent devant lui.
  'warlords[urgak].how': 'Raises his cleaver, then brings it down. Wounded, he whistles up a brute, then flies into a rage.', // Lève son fendoir, puis l’abat. Blessé, il siffle une brute, puis enrage.
  'warlords[urgak].short': 'Three more brutes at the head of the column.', // Trois brutes de plus en tête de colonne.
  'warlords[skrit].name': 'Skrit', // Skrit
  'warlords[skrit].title': 'the Quickblade', // la Lame vive
  'warlords[skrit].trait': 'Her column runs: all her raiders move a quarter faster.', // Sa colonne court : tous ses pillards vont un quart plus vite.
  'warlords[skrit].how': 'Two blows, then three, without respite: as many parries. Little armour: every riposte counts.', // Deux coups, puis trois, sans répit : autant de parades. Peu d’armure : chaque riposte compte.
  'warlords[skrit].short': 'Her whole column moves a quarter faster.', // Toute sa colonne va un quart plus vite.
  'elites[fire].name': 'Firebrands', // Incendiaires
  'elites[fire].short': 'They burn the workshops they brush past.', // Ils brûlent les ateliers qu’ils frôlent.
  'elites[fire].trait': 'Each raider sets fire to the first production building it passes. Keep them away from the workshops: ramparts, towers, soldiers out in front.', // Chaque pillard met le feu au premier bâtiment de production qu’il longe. Tenez-les loin des ateliers : remparts, tours, soldats en avant.
  'elites[armor].name': 'Ironclads', // Blindés
  'elites[armor].short': 'Armour +2: you must pierce it.', // Armure +2 : il faut percer.
  'elites[armor].trait': 'Each raider wears 2 more points of armour: watchtower arrows glance off. Mage towers, traps and soldiers make the difference.', // Chaque pillard porte 2 points d’armure de plus : les flèches des tours de guet glissent. Tours de mage, pièges et soldats font la différence.
  'elites[swift].name': 'Runners', // Coureurs
  'elites[swift].short': 'Faster, in close ranks.', // Plus rapides, en rangs serrés.
  'elites[swift].trait': 'The column runs a third faster and leaves the camp in close ranks: the towers have less time to shoot.', // La colonne court un tiers plus vite et sort du camp en rangs serrés : les tours ont moins de temps pour tirer.
  'elites[horde].name': 'Horde', // Horde
  'elites[horde].short': 'Half as many again.', // Moitié plus nombreux.
  'elites[horde].trait': 'A column half as large again as usual.', // Une colonne moitié plus nombreuse que d’habitude.
  'elites[flank].name': 'Two Fronts', // Deux fronts
  'elites[flank].short': 'Two columns, two sides.', // Deux colonnes, deux côtés.
  'elites[flank].trait': 'Half the raiders take another road and arrive from another side of the village.', // La moitié des pillards prend un autre chemin et arrive par un autre côté du village.
  'royal.lord.name': 'Grakk', // Grakk
  'royal.lord.title': 'the Cleaver', // le Fendeur
  'royal.lord.trait': 'He leads the last wave of the Royal Siege: two more brutes and a shaman march with him, and his whole column is a fifth tougher.', // Il mène la dernière vague du Siège royal : deux brutes et un chaman de plus marchent avec lui, et toute sa colonne est un cinquième plus solide.
  'royal.lord.short': 'Two more brutes, a shaman, all tougher.', // Deux brutes, un chaman de plus, plus solides.
  'camp.chiefs[0]': 'Brok One-Eye', // Brok le Borgne
  'camp.chiefs[1]': 'Varka Irontooth', // Varka Dent-de-fer
  'camp.chiefs[2]': 'Ghuz the Fat', // Ghuz le Gras
  'camp.chiefs[3]': 'Nazra the Ashen', // Nazra la Cendrée
  'camp.chiefs[4]': 'Oth the Deaf', // Oth le Sourd
  'camp.chiefs[5]': 'Rikka No-Ear', // Rikka Sans-oreille
});
