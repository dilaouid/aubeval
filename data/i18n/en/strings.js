// PROTOTYPE - NOT FOR PRODUCTION
// EN layer of data/strings.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract en; translations already here are kept.
I18N.add('en', {
  'strings.btn_city': 'City (G)', // Cité (G)
  'strings.btn_explore': 'Exploration (E)', // Exploration (E)
  'strings.tb_taxes': 'Taxes', // Impôts
  'strings.tb_works': 'Works', // Chantier
  'strings.venue_enter': 'Enter · {name} awaits you', // Entrer · {name} vous attend
  'strings.venue_enter_tip': 'Enter the building\nIts keeper has a game for you.', // Entrer dans le bâtiment\nSon tenancier vous y propose un jeu.
  'strings.loading': 'Loading images… {n} / {total}', // Chargement des images… {n} / {total}
  'strings.loading_missing': '{n} image(s) not found: the game will draw them itself', // {n} image(s) introuvable(s) : le jeu les dessinera lui-même
  'strings.subtitle': 'A village to build, a hero to arm', // Un village à bâtir, un héros à armer
  'strings.start_new': 'Enter or click: begin', // Entrée ou clic : commencer
  'strings.start_continue': 'Enter or click: return to your village', // Entrée ou clic : reprendre votre village
  'strings.start_wipe': 'N: new game (erases the save)', // N : nouvelle partie (efface la sauvegarde)
  'strings.start_wipe_confirm': 'N once more to confirm', // N encore une fois pour confirmer
  'strings.name_title': 'Your hero', // {g:Votre héros|Votre héroïne}
  'strings.name_ask': 'What is your hero’s name?', // Quel est le nom de {g:votre héros|votre héroïne} ?
  'strings.name_rule': '{min} to {max} characters: letters, spaces, hyphens, apostrophes.', // De {min} à {max} caractères : lettres, espaces, traits d’union, apostrophes.
  'strings.name_ok': 'Begin', // Commencer
  'strings.name_back': 'Back', // Retour
  'strings.name_keys': 'Enter: begin · ↑ ↓: change hero · Esc: back', // Entrée : commencer · ↑ ↓ : changer de héros · Échap : retour
  'strings.name_ok_edit': 'Confirm', // Valider
  'strings.name_keys_edit': 'Enter: confirm · ↑ ↓: change hero · Esc: back', // Entrée : valider · ↑ ↓ : changer de héros · Échap : retour
  'strings.name_empty': 'Your hero needs a name.', // {g:Votre héros|Votre héroïne} a besoin d’un nom.
  'strings.name_short': 'A little short: at least {min} characters.', // Un peu court : au moins {min} caractères.
  'strings.name_long': 'Too long: {max} characters at most.', // Trop long : {max} caractères au plus.
  'strings.name_chars': 'Only letters, spaces, hyphens and apostrophes.', // Seulement des lettres, des espaces, des traits d’union et des apostrophes.
  'strings.name_marks': 'A space, hyphen or apostrophe goes between two letters.', // Un espace, un trait d’union ou une apostrophe se place entre deux lettres.
  'strings.controls_title[0][0][0]': 'Click', // Clic
  'strings.controls_title[0][1]': 'place, choose', // poser, choisir
  'strings.controls_title[1][0][0]': 'Drag', // Glisser
  'strings.controls_title[1][1]': 'move the view', // déplacer la vue
  'strings.controls_title[2][0][0]': 'Wheel', // Molette
  'strings.controls_title[2][1]': 'zoom', // zoom
  'strings.controls_title[3][0][0]': 'Right-click', // Clic droit
  'strings.controls_title[3][1]': 'cancel', // annuler
  'strings.controls_more[0][0]': 'P', // P
  'strings.controls_more[1]': 'in game: pause and all controls', // en jeu : pause et toutes les commandes
  'strings.controls_more[2][0]': 'M', // M
  'strings.controls_more[3]': 'sound', // son
  'strings.controls[0].title': 'Build', // Bâtir
  'strings.controls[0].rows[0][0][0]': 'Click', // Clic
  'strings.controls[0].rows[0][1]': 'place, upgrade, choose', // poser, améliorer, choisir
  'strings.controls[0].rows[1][0][0]': 'Click', // Clic
  'strings.controls[0].rows[1][1]': 'a tree, a rock: wood, stone', // un arbre, un rocher : bois, pierre
  'strings.controls[0].rows[2][0][0]': 'Drag', // Glisser
  'strings.controls[0].rows[2][1]': 'ramparts, paths, trees', // remparts, chemins, arbres
  'strings.controls[0].rows[3][0][0]': 'Right-click', // Clic droit
  'strings.controls[0].rows[3][0][1]': 'Esc', // Échap
  'strings.controls[0].rows[3][1]': 'cancel', // annuler
  'strings.controls[1].title': 'View', // Vue
  'strings.controls[1].rows[0][0][0]': 'Drag', // Glisser
  'strings.controls[1].rows[0][0][1]': 'Arrows', // Flèches
  'strings.controls[1].rows[0][1]': 'move the view', // déplacer la vue
  'strings.controls[1].rows[1][0][0]': 'Wheel', // Molette
  'strings.controls[1].rows[1][0][1]': '+', // +
  'strings.controls[1].rows[1][0][2]': '−', // −
  'strings.controls[1].rows[1][1]': 'zoom', // zoom
  'strings.controls[1].rows[2][0][0]': 'C', // C
  'strings.controls[1].rows[2][1]': 'back to the village', // revenir au village
  'strings.controls[2].title': 'Soldiers', // Soldats
  'strings.controls[2].rows[0][0][0]': 'Click', // Clic
  'strings.controls[2].rows[0][0][1]': 'Shift + drag', // Maj + glisser
  'strings.controls[2].rows[0][1]': 'select them', // les choisir
  'strings.controls[2].rows[1][0][0]': 'Right-click', // Clic droit
  'strings.controls[2].rows[1][1]': 'send them', // les envoyer
  'strings.controls[2].rows[2][0][0]': 'T', // T
  'strings.controls[2].rows[2][1]': 'select them all', // les choisir tous
  'strings.controls[3].title': 'Battle', // Combat
  'strings.controls[3].rows[0][0][0]': '1', // 1
  'strings.controls[3].rows[0][1]': 'Attack', // Attaque
  'strings.controls[3].rows[0][2][0]': '2', // 2
  'strings.controls[3].rows[0][3]': 'Skill', // Compétence
  'strings.controls[3].rows[1][0][0]': '3', // 3
  'strings.controls[3].rows[1][1]': 'Ration', // Ration
  'strings.controls[3].rows[1][2][0]': '4', // 4
  'strings.controls[3].rows[1][3]': 'Guard', // Garde
  'strings.controls[4].title': 'Menus', // Menus
  'strings.controls[4].rows[0][0][0]': 'K', // K
  'strings.controls[4].rows[0][1]': 'People', // Peuple
  'strings.controls[4].rows[0][2][0]': 'H', // H
  'strings.controls[4].rows[0][3]': 'Hero', // {g:Héros|Héroïne}
  'strings.controls[4].rows[0][4][0]': 'J', // J
  'strings.controls[4].rows[0][5]': 'Quests', // Quêtes
  'strings.controls[4].rows[1][0][0]': 'V', // V
  'strings.controls[4].rows[1][1]': 'Village and save', // Village et sauvegarde
  'strings.controls[4].rows[1][2][0]': 'P', // P
  'strings.controls[4].rows[1][3]': 'Pause', // Pause
  'strings.controls[4].rows[1][4][0]': 'M', // M
  'strings.controls[4].rows[1][5]': 'Sound', // Son
  'strings.controls_tip': 'Every working building must touch a path linked to the Town Hall', // Chaque bâtiment qui travaille doit toucher un chemin relié à l’hôtel de ville
  'strings.paused': 'Pause', // Pause
  'strings.pause_hint': 'P or Esc to resume', // P ou Échap pour reprendre
  'strings.btn_people': 'People (K)', // Peuple (K)
  'strings.btn_hero': 'Hero (H)', // {g:Héros|Héroïne} (H)
  'strings.btn_quests': 'Quests (J)', // Quêtes (J)
  'strings.btn_menu': 'Village (V)', // Village (V)
  'strings.pop_free': 'free: {n}', // libres : {n}
  'strings.pop_free_tip': 'Free inhabitants: {n}. Each worker or soldier takes one. Click to open People (K).', // Habitants libres : {n}. Chaque ouvrier ou soldat en occupe un. Cliquez pour ouvrir le Peuple (K).
  'strings.pop_next_tip': 'At {n} inhabitants: {name}.', // À {n} habitants : {name}.
  'strings.pop': 'Inhabitants', // Habitants
  'strings.pop_next': 'at {n}: {name}', // à {n} : {name}
  'strings.pop_all': 'all unlocked', // tout est débloqué
  'strings.quest': 'Quest', // Quête
  'strings.quest_done': 'Quest complete: {title}', // Quête accomplie : {title}
  'strings.all_done': 'Chapter complete. The village keeps growing.', // Chapitre terminé. Le village continue de grandir.
  'strings.tab_main': 'Main', // Principale
  'strings.tab_side': 'Side', // Annexes
  'strings.tab_missions': 'Missions', // Missions
  'strings.tab_contracts': 'Contracts', // Contrats
  'strings.go_fight': 'Go to battle', // Partir au combat
  'strings.deliver': 'Deliver', // Livrer
  'strings.reward': 'Reward', // Récompense
  'strings.unlocks': 'Unlocks', // Débloque
  'strings.need': 'Needs', // Il faut
  'strings.locked_quest': 'Locked', // Verrouillée
  'strings.tier': 'Rank {n}', // Rang {n}
  'strings.done': 'Complete', // Accomplie
  'strings.hero_away': 'The hero is on a mission', // {g:Le héros|L’héroïne} est en mission
  'strings.raid_on': 'A raid is under way', // Un raid est en cours
  'strings.start_mission': 'Send the hero', // Envoyer {g:le héros|l’héroïne}
  'strings.mission_back': '{title}: the hero is back.', // {title} : {g:le héros|l’héroïne} est {g:rentré|rentrée}.
  'strings.mission_run': 'On a mission: {title}', // En mission : {title}
  'strings.next_chapter': 'More to come: one more chapter in data/quests.js, and the story goes on.', // La suite arrive : un chapitre de plus dans data/quests.js, et l’histoire reprend.
  'strings.chapter_done': 'Chapter complete!', // Chapitre terminé !
  'strings.chapter_done_text': 'Grakk has fallen. Aubeval breathes again, and the village goes on: endless contracts, new tiers at the forge, ever bigger raids, and a New Start whenever you wish.', // Grakk est tombé. Aubeval respire, et le village continue : contrats sans fin, nouveaux paliers à la forge, raids toujours plus gros, et un nouveau départ quand vous le voudrez.
  'strings.continue': 'Continue', // Continuer
  'strings.new_building': 'New building: {name}', // Nouveau bâtiment : {name}
  'strings.built': 'Built', // Bâti
  'strings.level': 'Lv. {n}', // Niv. {n}
  'strings.upgrade': 'Upgrade', // Améliorer
  'strings.move': 'Move', // Déplacer
  'strings.demolish': 'Demolish', // Démolir
  'strings.repair': 'Repair', // Réparer
  'strings.style': 'Style (free)', // Style (gratuit)
  'strings.no_funds': 'Not enough resources', // Pas assez de ressources
  'strings.bad_spot': 'Can’t build here', // Impossible ici
  'strings.tool_hint': 'Click a tile, or drag to draw. Right-click or Esc to put away.', // Cliquez une case, ou glissez pour tracer. Clic droit ou Échap pour ranger.
  'strings.wall_hint': 'Drag and release: a line of rampart. Shift + drag: an enclosure. Right-click: cancel.', // Glissez puis relâchez : une ligne de rempart. Maj + glisser : une enceinte. Clic droit : annuler.
  'strings.wall_count': '{n} sections', // {n} tronçons
  'strings.turn': 'Rotate (R)', // Tourner (R)
  'strings.turn_hint': 'R: rotate.', // R : tourner.
  'strings.turn_tip': 'Rotate the building before placing it (key R):\nthe entrance moves to the other side.', // Tourner le bâtiment avant de le poser (touche R) :\nl’entrée passe de l’autre côté.
  'strings.plant_tip': 'Plants this tree on a free tile. Drag to plant several.', // Plante cet arbre sur une case libre. Se plante en glissant.
  'strings.decor_note': 'Decoration: a treat for the eyes.', // Décoration : pour le plaisir des yeux.
  'strings.zoom_in': 'Zoom in (wheel, +)', // Zoom avant (molette, +)
  'strings.zoom_out': 'Zoom out (wheel, −)', // Zoom arrière (molette, −)
  'strings.recenter': 'Village', // Village
  'strings.recenter_tip': 'Back to the Town Hall (C)', // Revenir à l’hôtel de ville (C)
  'strings.raid_where': 'The raid comes from here. Click to go there.', // Le raid sort d’ici. Cliquez pour y aller.
  'strings.dirs[0]': 'the east', // l’est
  'strings.dirs[1]': 'the south-east', // le sud-est
  'strings.dirs[2]': 'the south', // le sud
  'strings.dirs[3]': 'the south-west', // le sud-ouest
  'strings.dirs[4]': 'the west', // l’ouest
  'strings.dirs[5]': 'the north-west', // le nord-ouest
  'strings.dirs[6]': 'the north', // le nord
  'strings.dirs[7]': 'the north-east', // le nord-est
  'strings.damaged': 'Damaged: it no longer produces. Repair it.', // Endommagé : il ne produit plus. Réparez-le.
  'strings.starved': 'Waiting for: {res}', // En attente de : {res}
  'strings.produces': 'Produces', // Produit
  'strings.consumes': 'Consumes', // Consomme
  'strings.every': 'every {n} s', // toutes les {n} s
  'strings.milestone': 'Milestone at level {n}: production ×2', // Palier au niveau {n} : production ×2
  'strings.next_look': 'New look at level {n}', // Nouvelle apparence au niveau {n}
  'strings.hall_guard': 'Each raider at its door steals {pct}% of every store (less with each level).', // Chaque pillard à sa porte vole {pct} % de chaque réserve (moins à chaque niveau).
  'strings.tower_stats': 'Damage {dmg} · range {range} tiles · one shot every {rate} s', // Dégâts {dmg} · portée {range} cases · un tir toutes les {rate} s
  'strings.wall_hp': 'Strength {hp} / {max}', // Solidité {hp} / {max}
  'strings.houses': 'Houses {n} inhabitants', // Loge {n} habitants
  'strings.refund': 'returns', // rend
  'strings.place_hint': 'Click a free tile. Right-click or Esc to cancel.', // Cliquez une case libre. Clic droit ou Échap pour annuler.
  'strings.move_hint': 'Click the building’s new spot.', // Cliquez la nouvelle place du bâtiment.
  'strings.forge_title': 'At the forge', // À la forge
  'strings.forging': 'In progress: {name}', // En cours : {name}
  'strings.forge_do': 'Forge', // Forger
  'strings.forge_plus': 'Reinforce +{n}', // Renforcer +{n}
  'strings.forged': '{name} is ready. Equip it in the hero’s sheet (H).', // {name} est prête. Équipez-la dans la fiche {g:du héros|de l’héroïne} (H).
  'strings.owned': 'Forged', // Forgée
  'strings.people_title': 'The people of Aubeval', // Le peuple d’Aubeval
  'strings.classes': 'Classes', // Classes
  'strings.houses_n': '{n} houses', // {n} maisons
  'strings.house_n': '{n} house', // {n} maison
  'strings.houses_lack': 'Some houses are lacking something: their tax drops.', // Des maisons manquent de quelque chose : leur impôt baisse.
  'strings.house_lack': 'A house is lacking something: its tax drops.', // Une maison manque de quelque chose : son impôt baisse.
  'strings.tax': 'Tax: {n} gold every {t} s', // Impôt : {n} or toutes les {t} s
  'strings.needs': 'Needs', // Besoins
  'strings.satisfaction': 'Satisfaction', // Satisfaction
  'strings.lacking': 'They lack: {res}', // Il leur manque : {res}
  'strings.raise_to': 'Raise: {name}', // Élever : {name}
  'strings.raise_tip': 'The house lodges {pop} inhabitants and pays far more tax.', // La maison loge {pop} habitants et paie bien plus d’impôt.
  'strings.raise_need': 'It needs full satisfaction.', // Il faut une satisfaction pleine.
  'strings.class_top': 'Aubeval’s highest class.', // La plus haute classe d’Aubeval.
  'strings.class_up': 'A house rises: {name}!', // Une maison s’élève : {name} !
  'strings.milestone_tax': 'Milestone at level {n}: tax ×2', // Palier au niveau {n} : impôt ×2
  'strings.workers': 'Workers', // Ouvriers
  'strings.workers_idle': 'Some workers find nothing to gather near a depot ({n}).', // Des ouvriers ne trouvent rien à récolter près d’un dépôt ({n}).
  'strings.train': 'Train', // Former
  'strings.dismiss_tip': 'Send one of these home: they become a free inhabitant again.', // Renvoyer un de ceux-ci chez lui : il redevient un habitant libre.
  'strings.no_citizen': 'No free inhabitants: build or raise houses.', // Aucun habitant libre : bâtissez ou élevez des maisons.
  'strings.need_barracks': 'You need Barracks.', // Il faut une Caserne.
  'strings.queue_full': 'The Barracks’ line is full.', // La file de la Caserne est pleine.
  'strings.train_title': 'Recruits', // Recrues
  'strings.training': 'In training: {name}', // À l’exercice : {name}
  'strings.train_idle': 'Nobody in training.', // Personne à l’exercice.
  'strings.unit_ready': '{name} ready, in front of the Barracks.', // {name} prêt, devant la Caserne.
  'strings.unit_ready_rally': '{name} ready: off to the rally point.', // {name} prêt : il rejoint le point de ralliement.
  'strings.unit_dead': 'Fallen!', // Tombé !
  'strings.train_many_tip': 'Shift + click: order 5 in a row.', // Maj + clic : en commander 5 à la file.
  'strings.train_cancel_tip': 'Click: cancel this recruit and get their price back.', // Clic : annuler cette recrue et récupérer son prix.
  'strings.rally_help': 'Right-click on the map with this panel open: recruits will go there as they come out.', // Clic droit sur la carte, ce panneau ouvert : les recrues s’y rendront en sortant.
  'strings.rally_set': 'Rally point set: recruits will go there.', // Point de ralliement posé : les recrues s’y rendront.
  'strings.rally_on': 'Rally point set.', // Point de ralliement posé.
  'strings.rally_clear': 'Remove the rally point', // Enlever le ralliement
  'strings.soldiers': 'Soldiers', // Soldats
  'strings.soldiers_none': 'Build Barracks (Defence tab) to train soldiers.', // Bâtissez une Caserne (onglet Défense) pour former des soldats.
  'strings.soldiers_help': 'Click a soldier or Shift + drag to select, right-click to send. They hold the spot and charge any raider who comes near.', // Clic sur un soldat ou Maj + glisser pour choisir, clic droit pour envoyer. Ils gardent l’endroit et chargent les pillards qui s’en approchent.
  'strings.select_all': 'All soldiers', // Tous les soldats
  'strings.recall': 'Recall', // Rappel
  'strings.recall_tip': 'All soldiers return to the Barracks.', // Tous les soldats reviennent devant la Caserne.
  'strings.no_soldiers': 'No soldiers.', // Aucun soldat.
  'strings.sel_hint': 'Soldiers selected: {n} · right-click: send them · Esc: release', // Soldats choisis : {n} · clic droit : les envoyer · Échap : lâcher
  'strings.trade_title': 'Trade (lots of {n})', // Commerce (par {n})
  'strings.buy': 'Buy {p} gold', // Acheter {p} or
  'strings.sell': 'Sell {p} gold', // Vendre {p} or
  'strings.buy_tip': 'Buy {n} {res} for {p} gold.', // Acheter {n} {res} pour {p} or.
  'strings.sell_tip': 'Sell {n} {res} for {p} gold.', // Vendre {n} {res} contre {p} or.
  'strings.import_on': 'Import: running', // Import : en cours
  'strings.import_off': 'Import: paused', // Import : en pause
  'strings.import_tip': 'Caravans trade your gold for spices. Pause to keep your gold.', // Les caravanes échangent votre or contre des épices. Mettez en pause pour garder votre or.
  'strings.trap_tip': 'Placed on a free tile, where raiders will pass. Removed when the raid ends.', // Se pose sur une case libre, là où les pillards vont passer. Retiré à la fin du raid.
  'strings.trap_wait': 'Traps can be laid once the horn sounds, until the raid ends.', // Les pièges se posent quand la corne sonne, jusqu’à la fin du raid.
  'strings.trap_full': 'No more than {n} traps at once.', // Pas plus de {n} pièges à la fois.
  'strings.trap_locked': 'Traps come with the first raid.', // Les pièges arrivent avec le premier raid.
  'strings.trap_hint': 'Click or drag along the raiders’ path. Right-click or Esc to put away.', // Cliquez ou glissez sur le chemin des pillards. Clic droit ou Échap pour ranger.
  'strings.safe_zone': 'Safe zone: {n} tiles around it (+{step} per level). No raider appears there.', // Zone sûre : {n} cases autour de lui (+{step} par niveau). Aucun pillard n’y apparaît.
  'strings.hero_look': 'Change look', // Changer d’apparence
  'strings.hero_look_raid': 'Not during a raid.', // Pas pendant un raid.
  'strings.hero_title': 'The hero', // {g:Le héros|L’héroïne}
  'strings.equip': 'Equip', // Équiper
  'strings.equipped': 'Equipped', // Équipé
  'strings.nothing': 'nothing', // rien
  'strings.weapon': 'Weapon', // Arme
  'strings.armor': 'Armour', // Armure
  'strings.inventory': 'Forged gear', // Équipement forgé
  'strings.inventory_empty': 'Nothing yet: forge a weapon at the Forge.', // Rien encore : forgez une arme à la Forge.
  'strings.at_village': 'In the village: guarding the Town Hall.', // Au village : {g:il|elle} garde l’hôtel de ville.
  'strings.level_up': 'Level {n}!', // Niveau {n} !
  'strings.raid_in': 'Raid #{n} in {time}', // Raid n°{n} dans {time}
  'strings.raid_call': 'Call', // Appeler
  'strings.raid_now': 'RAID #{n}: {left} raiders, {leaks}/{max} through', // RAID n°{n} : {left} pillards, {leaks}/{max} passés
  'strings.raid_first': 'A horn in the distance: the goblins have pitched their camp. First raid in {time}. They will always come from there: defend that side!', // Une corne au loin : les gobelins ont dressé leur camp. Premier raid dans {time}. Ils viendront toujours de là : défendez ce côté !
  'strings.raid_warn': 'The horn sounds: a raid leaves the goblin camp, from {dir}! Lay your traps (Defence tab).', // La corne sonne : un raid quitte le camp gobelin, par {dir} ! Posez vos pièges (onglet Défense).
  'strings.raid_start': 'The raiders are coming!', // Les pillards arrivent !
  'strings.raid_won': 'Raid repelled! Bounty: {gold} gold', // Raid repoussé ! Prime : {gold} or
  'strings.raid_losses': 'Soldiers fallen: {n}.', // Soldats tombés : {n}.
  'strings.raid_lost': 'Raid lost: stores plundered. Repair, then strengthen your ramparts.', // Raid perdu : réserves pillées. Réparez, puis renforcez vos remparts.
  'strings.pillage': 'Plundered!', // Pillé !
  'strings.victory': 'Victory!', // Victoire !
  'strings.defeat': 'Defeat', // Défaite
  'strings.defeat_text': '{hero} falls back to the village. Nothing is lost.', // {hero} se replie au village. Rien n’est perdu.
  'strings.defeat_tip': 'New buildings and their levels give better cards; the Forge, a better blade. The deck is set in the Hero sheet.', // De nouveaux bâtiments et leurs niveaux donnent de meilleures cartes ; la Forge, une meilleure lame. Le paquet se règle dans la fiche {g:du Héros|de l’Héroïne}.
  'strings.retry': 'Try again', // Réessayer
  'strings.to_village': 'Back to the village', // Retour au village
  'strings.back': 'Back', // Retour
  'strings.souffle': 'Breath', // Souffle
  'strings.garde': 'Guard', // Garde
  'strings.end_turn': 'End turn (Enter)', // Fin du tour (Entrée)
  'strings.end_turn_tip': 'End turn\nRemaining cards are discarded, then each enemy does what it announced.', // Fin du tour\nLes cartes restantes sont défaussées, puis chaque ennemi fait ce qu’il annonce.
  'strings.battle_turn': 'Turn {n}', // Tour {n}
  'strings.battle_hint_play': 'Play your cards (click or keys 1 to 9) on the marked enemy, then End turn.', // Jouez vos cartes (clic ou touches 1 à 9) sur l’ennemi marqué, puis Fin du tour.
  'strings.pile_draw': 'Draw: {n}', // Pioche : {n}
  'strings.pile_discard': 'Discard: {n}', // Défausse : {n}
  'strings.pile_gone': 'Out of play: {n}', // Hors combat : {n}
  'strings.piles_tip': 'The deck\nWhen the draw pile is empty, the discard pile is shuffled to make a new one. “Once per battle” cards don’t go back.', // Le paquet\nQuand la pioche est vide, la défausse est mélangée et redevient la pioche. Les cartes « une fois par combat » n’y reviennent pas.
  'strings.stats_tip': 'Attack, defence and Guard\nDefence reduces every blow taken. Guard absorbs damage, then drops to zero at the start of your turn.', // Attaque, défense et Garde\nLa défense réduit chaque coup reçu. La Garde absorbe les dégâts, puis retombe à zéro au début de votre tour.
  'strings.stock_tip': 'Village stores\nSome cards draw on them: bread, coffee, gold.', // Réserves du village\nCertaines cartes y puisent : le pain, le café, l’or.
  'strings.card_from': 'Card from: {from}', // Carte de : {from}
  'strings.no_energy': 'Not enough Breath', // Pas assez de souffle
  'strings.no_stock': 'Not enough {res} in the village', // Pas assez de {res} au village
  'strings.full_health': '{hero} is not wounded', // {hero} n’est pas {g:blessé|blessée}
  'strings.coming': 'Incoming: {n}', // Arrive : {n}
  'strings.coming_left': ' · after Guard: {n}', //  · après la Garde : {n}
  'strings.it_hit': 'Attack {n}', // Attaque {n}
  'strings.it_double': 'Attack {n} ×2', // Attaque {n} ×2
  'strings.it_windup': 'Raises its weapon…', // Lève son arme…
  'strings.it_heavy': 'TERRIBLE BLOW {n}', // COUP TERRIBLE {n}
  'strings.it_hex': 'Hex {n}', // Maléfice {n}
  'strings.it_heal': 'Will heal', // Va soigner
  'strings.it_summon': 'Will call a goblin', // Va appeler un gobelin
  'strings.it_enrage': 'Will enrage', // Va enrager
  'strings.it_stunned': 'Stunned', // Étourdi
  'strings.it_hit_tip': 'one blow, to parry on impact.', // un coup, à parer à l’impact.
  'strings.it_double_tip': 'two quick blows: two parries.', // deux coups rapprochés : deux parades.
  'strings.it_windup_tip': 'nothing this turn. Next turn, a terrible blow: build up Guard, or make it lose its turn.', // rien ce tour. Au suivant, un coup terrible : préparez de la Garde, ou faites-lui perdre son tour.
  'strings.it_heavy_tip': 'a huge blow, slow to land. Guard, parry… or perfect parry.', // un coup énorme, lent à venir. Garde, parade… ou parade parfaite.
  'strings.it_hex_tip': 'it goes through Guard and armour. Only a parry stops it.', // il traverse la Garde et l’armure. Seule la parade l’arrête.
  'strings.it_heal_tip': 'restores 30% of life to the most wounded ally.', // rend 30 % de sa vie à l’allié le plus blessé.
  'strings.it_summon_tip': 'one more goblin in the fray.', // un gobelin de plus dans la mêlée.
  'strings.it_enrage_tip': 'its blows will deal 30% more damage.', // ses coups feront 30 % de dégâts en plus.
  'strings.it_stunned_tip': 'it loses this turn.', // il perd ce tour.
  'strings.armor_tip': 'Armour {n}: your blows deal {pct}% less damage to it. Axe Blow splits it, Thrust ignores it.', // Armure {n} : vos coups lui font {pct} % de dégâts en moins. Le Coup de cognée la fend, l’Estoc l’ignore.
  'strings.parry_title': 'SPACE (or click): parry', // ESPACE (ou clic) : parer
  'strings.parry_how': 'Press the moment the ring touches the golden circle. Right on it: a perfect parry, and a riposte.', // Pressez à l’instant où l’anneau touche le cercle doré. En plein dessus : parade parfaite, et riposte.
  'strings.parry_now': 'Space!', // Espace !
  'strings.parry_perfect': 'PERFECT!', // PARFAIT !
  'strings.parry_good': 'Parried', // Paré
  'strings.parry_early': 'Too soon', // Trop tôt
  'strings.blocked': 'Blocked', // Bloqué
  'strings.pop_block': 'Guard +{n}', // Garde +{n}
  'strings.pop_shred': 'Armour −{n}', // Armure −{n}
  'strings.pop_weak': 'Weakened', // Affaibli
  'strings.pop_energy': '+{n} Breath', // +{n} souffle
  'strings.pop_ally': 'Militiaman!', // Milicien !
  'strings.st_bless': 'Blessed', // Béni
  'strings.st_thorns': 'Thorns {n}', // Épines {n}
  'strings.st_wide': 'Easy parry', // Parade facile
  'strings.st_ally': 'Militiaman ({n})', // Milicien ({n})
  'strings.st_echo': 'Gem: ×2', // Joyau : ×2
  'strings.msg_stunned': '{name} is stunned: its turn is lost.', // {name} est étourdi : son tour est perdu.
  'strings.msg_riposte': 'Perfect parry: {name} ripostes!', // Parade parfaite : {name} riposte !
  'strings.msg_ally': 'The militiaman strikes.', // Le milicien frappe.
  'strings.tally_perfect': 'Perfect parries: {n}', // Parades parfaites : {n}
  'strings.tally_cards': 'New cards in the deck: {n}', // Nouvelles cartes dans le paquet : {n}
  'strings.help_tip': 'Battle rules (H)', // Les règles du combat (H)
  'strings.help_title': 'Battle: the village’s hand', // Le combat : la main du village
  'strings.battle_help': 'Your deck is your village: each kind of standing building adds its card, stronger as the building levels up. {hero} adds some too.\n\nOn your turn, you draw 5 cards and have 3 points of Breath. A card’s blue number is its cost. Click an enemy to mark it: your blows will land on it. Unplayed cards are discarded.\n\nEach enemy shows above its head what it will do. Guard absorbs damage until your next turn. “Incoming” adds up what awaits you.\n\nOn the enemies’ turn, each blow closes a ring around {hero}: Space (or a click) the moment it touches the golden circle, and half the blow is parried. Right on it, the parry is perfect: no damage, and {hero} ripostes. Too soon, and it’s missed.\n\nThe deck is set in the Hero sheet: a card left in the village will no longer be drawn.', // Votre paquet, c’est votre village : chaque sorte de bâtiment debout y met sa carte, plus forte quand le bâtiment monte de niveau. {hero} y ajoute les siennes.\n\nÀ votre tour, vous piochez 5 cartes et avez 3 points de souffle. Le chiffre bleu d’une carte est son prix. Cliquez un ennemi pour le marquer : vos coups iront sur lui. Les cartes non jouées sont défaussées.\n\nChaque ennemi annonce au-dessus de sa tête ce qu’il fera. La Garde absorbe les dégâts jusqu’à votre prochain tour. « Arrive » additionne ce qui vous attend.\n\nAu tour des ennemis, chaque coup referme un anneau sur {hero} : Espace (ou un clic) à l’instant où il touche le cercle doré, et le coup est paré à moitié. En plein dessus, la parade est parfaite : aucun dégât, et {hero} riposte. Trop tôt, c’est raté.\n\nLe paquet se règle dans la fiche {g:du Héros|de l’Héroïne} : une carte laissée au village ne sera plus piochée.
  'strings.deck': 'Battle deck', // Paquet de combat
  'strings.deck_count': '{n} cards', // {n} cartes
  'strings.deck_help': 'Each standing building sends its card; its level makes it stronger. Untick a card to leave it in the village (a deck of at least {min} cards).', // Chaque bâtiment debout envoie sa carte ; son niveau la renforce. Décochez une carte pour la laisser au village (paquet de {min} cartes au moins).
  'strings.deck_min': 'You must keep at least {min} cards.', // Il faut garder au moins {min} cartes.
  'strings.deck_more': 'Cards to earn', // Cartes à gagner
  'strings.deck_locked': '{hero} learns it at level {n}', // {hero} l’apprend au niveau {n}
  'strings.deck_build': 'Build: {name}', // Bâtissez : {name}
  'strings.menu_title': 'The village', // Le village
  'strings.save_now': 'Save', // Sauvegarder
  'strings.saved': 'Game saved', // Partie sauvegardée
  'strings.export': 'Export the save', // Exporter la sauvegarde
  'strings.import': 'Import a save', // Importer une sauvegarde
  'strings.map_no': 'Map #{n}', // Carte n° {n}
  'strings.map_copy': 'Copy the link', // Copier le lien
  'strings.map_copied': 'Link copied', // Lien copié
  'strings.map_link': 'Map link: {url}', // Lien de la carte : {url}
  'strings.map_other': 'Another map', // Autre carte
  'strings.map_shared': 'Shared map #{n}: a new game will play it.', // Carte partagée n° {n} : une nouvelle partie la jouera.
  'strings.imported': 'Save imported', // Sauvegarde importée
  'strings.import_bad': 'This file is not an Aubeval save', // Ce fichier n’est pas une sauvegarde d’Aubeval
  'strings.save_note': 'Saved automatically in this browser. Export the file to keep it elsewhere.', // Sauvegarde automatique dans ce navigateur. Exportez le fichier pour le garder ailleurs.
  'strings.save_off': 'Saving is off for this session (check mode).', // Sauvegarde coupée pour cette session (mode vérification).
  'strings.sound_on': 'Sound: on', // Son : oui
  'strings.sound_off': 'Sound: off', // Son : non
  'strings.wipe': 'Start over', // Tout recommencer
  'strings.wipe_confirm': 'Click again to erase everything', // Cliquez encore pour tout effacer
  'strings.prestige_title': 'New Start', // Nouveau départ
  'strings.prestige_text': 'Trades the village (buildings, stores, raids) for Renown, kept forever. The hero, the hero’s gear and quests remain.', // Échange le village (bâtiments, réserves, raids) contre de la Renommée, gardée pour toujours. {g:Le héros|L’héroïne}, son équipement et ses quêtes restent.
  'strings.prestige_gain': 'Now: +{n} Renown (production and taxes +{pct}%)', // Maintenant : +{n} Renommée (production et impôts +{pct} %)
  'strings.prestige_have': 'Renown: {n} (production +{pct}%)', // Renommée : {n} (production +{pct} %)
  'strings.prestige_do': 'Make a New Start', // Prendre un nouveau départ
  'strings.prestige_none': 'Earn more gold with this village to gain Renown.', // Gagnez plus d’or avec ce village pour obtenir de la Renommée.
  'strings.prestige_done': 'New Start: +{n} Renown', // Nouveau départ : +{n} Renommée
  'strings.trees': 'Trees', // Arbres
  'strings.roads_laid': 'Paths laid for you: {n} tiles. Every working building must now touch a path linked to the Town Hall.', // Chemins posés pour vous : {n} cases. Chaque bâtiment qui travaille doit maintenant toucher un chemin relié à l’hôtel de ville.
  'strings.tb_info': 'Info', // Infos
  'strings.tb_people': 'Inhabitants', // Habitants
  'strings.tb_street': 'Street', // Rue
  'strings.tb_look': 'Appearance', // Apparence
  'strings.tb_village': 'Village', // Village
  'strings.tb_forge': 'Forge', // Forge
  'strings.tb_trade': 'Trade', // Commerce
  'strings.tb_army': 'Soldiers', // Soldats
  'strings.st_damaged': 'Damaged: it does nothing now', // Endommagé : il ne fait plus rien
  'strings.st_no_road': 'No path to the Town Hall: it waits', // Aucun chemin vers l’hôtel de ville : il attend
  'strings.st_lack': 'They lack: {res}', // Il leur manque : {res}
  'strings.st_lack_svc': 'No {name} in reach', // Pas de {name} à portée
  'strings.st_can_raise': 'Ready to rise: {name}', // Prête à s’élever : {name}
  'strings.st_happy': 'Content', // Satisfaits
  'strings.st_paused': 'Paused', // En pause
  'strings.st_starved': 'Waiting for: {res}', // En attente de : {res}
  'strings.st_serves': 'Serves {n} houses', // Sert {n} maisons
  'strings.st_working': 'At work', // Au travail
  'strings.house_head': '{n} inhabitants · {gold} gold every {t} s', // {n} habitants · {gold} or toutes les {t} s
  'strings.upgrade_to': 'Level {n}', // Niveau {n}
  'strings.next_level': 'Next level', // Niveau suivant
  'strings.rampart_repair_all': 'Repair all ({n})', // Tout réparer ({n})
  'strings.rampart_repair_tip': 'Repair all\nThe {n} broken palisades of this rampart are raised in one go.', // Tout réparer\nLes {n} palissades brisées de ce rempart sont relevées d’un coup.
  'strings.rampart_demolish_all': 'Demolish all ({n})', // Tout démolir ({n})
  'strings.rampart_demolish_tip': 'Demolish the whole rampart\nThe {n} linked palisades, of every level, disappear.', // Démolir tout le rempart\nLes {n} palissades reliées, de tout niveau, disparaissent.
  'strings.rampart_demolish_sure': 'Click again ({n})', // Cliquez encore ({n})
  'strings.rampart_all': 'Whole rampart ({n})', // Tout le rempart ({n})
  'strings.rampart_tip': 'Whole rampart\nThe {n} palisades linked to this one at level {lvl} go up to level {next}.\nA sturdier rampart', // Tout le rempart\nLes {n} palissades reliées à celle-ci et au niveau {lvl} passent au niveau {next}.\nRempart plus solide
  'strings.up_house': '+2 inhabitants, higher tax', // +2 habitants, impôt plus fort
  'strings.up_prod': '+{pct}% production', // +{pct} % de production
  'strings.up_tower': '+{pct}% damage', // +{pct} % de dégâts
  'strings.up_wall': 'Sturdier rampart', // Rempart plus solide
  'strings.up_army': 'Soldiers +{pct}%', // Soldats +{pct} %
  'strings.up_service': '+{n} tile of reach', // +{n} case de portée
  'strings.up_hall': 'Less plunder, wider safe zone', // Moins de pillage, zone sûre plus large
  'strings.up_double': 'Milestone: production ×2!', // Palier : production ×2 !
  'strings.up_look': 'New look', // Nouvelle apparence
  'strings.up_lodge': 'Aveline’s Plans: +{n} s', // Plans d’Aveline : +{n} s
  'strings.up_lodge_perks': 'Lodge: {plans} % discount, repairs −{repair} %, refund {refund} %', // Loge : rabais {plans} %, réparations −{repair} %, remboursement {refund} %
  'strings.sec_work': 'Work', // Travail
  'strings.sec_defense': 'Defence', // Défense
  'strings.sec_level': 'Level', // Niveau
  'strings.sec_lodge': 'The Lodge’s plans', // Les plans de la Loge
  'strings.lodge_perks_now': 'A standing {plans} % discount on buildings and upgrades (with Aveline’s gift, {cap} % at most). Repairs cost {repair} % less. Demolition gives back {refund} % of the price.', // Rabais permanent de {plans} % sur les constructions et les améliorations (avec le cadeau d’Aveline, {cap} % au plus). Réparations {repair} % moins chères. Démolition : {refund} % du prix rendus.
  'strings.sec_town': 'The neighbourhood', // Le quartier
  'strings.sec_road': 'Path', // Chemin
  'strings.serves': 'Serves houses within {r} tiles: {n} right now.', // Sert les maisons à {r} cases autour : {n} en ce moment.
  'strings.wanted_by': 'Wanted by: {who}.', // Demandé par : {who}.
  'strings.beauty_plus': 'Adorns houses within {r} tiles: +{n} beauty.', // Embellit les maisons à {r} cases autour : +{n} beauté.
  'strings.beauty_minus': 'Noise and smoke: −{n} beauty for houses within {r} tiles.', // Bruit et fumée : −{n} beauté pour les maisons à {r} cases autour.
  'strings.decor_beauty': '+{n} beauty within {r} tiles', // +{n} beauté à {r} cases autour
  'strings.road_ok': 'Linked to the Town Hall', // Relié à l’hôtel de ville
  'strings.road_missing': 'Not linked: lay a paved path (Housing or Land tab) from a tile beside it to the Town Hall’s network.', // Pas relié : posez un chemin pavé (onglet Habitat ou Terrain) depuis une case à côté de lui jusqu’au réseau de l’hôtel de ville.
  'strings.no_road_short': 'A path to the Town Hall', // Un chemin jusqu’à l’hôtel de ville
  'strings.raise_title': 'Towards {name}', // Vers les {name}
  'strings.raise_sat': 'Satisfaction at {pct}%', // Satisfaction à {pct} %
  'strings.in_reach': '{name} in reach', // {name} à portée
  'strings.beauty_need': 'Beauty {n} in the street (here: {have})', // Beauté {n} dans la rue (ici : {have})
  'strings.beauty_title': 'Beauty: {n}', // Beauté : {n}
  'strings.beauty_help': 'Whatever lies within {r} tiles: decorations, trees, fine buildings; noisy workshops take some away. Each point adds to the tax, and Merchants and Nobles demand it.', // Ce qui se trouve à {r} cases : décorations, arbres, beaux bâtiments ; les ateliers bruyants en retirent. Chaque point ajoute à l’impôt, et les Négociants et les Nobles en exigent.
  'strings.beauty_none': 'Nothing around: plant trees, lay flowers, a fountain…', // Rien autour : plantez des arbres, posez des fleurs, une fontaine…
  'strings.services': 'Services', // Services
  'strings.wanted_from': 'wanted from {name} on', // voulu dès les {name}
  'strings.tax_title': 'The tax', // L’impôt
  'strings.tax_class': 'Class ({name})', // Classe ({name})
  'strings.tax_sat': 'Satisfaction', // Satisfaction
  'strings.tax_beauty': 'Beauty', // Beauté
  'strings.tax_level': 'Level and renown', // Niveau et renommée
  'strings.looks_title': 'It grows with its inhabitants', // Elle grandit avec ses habitants
  'strings.looks_help': 'With each class, the house changes its look: cottage, house, townhouse, trading house, mansion.', // À chaque classe, la maison change d’aspect : chaumière, maison, immeuble, maison de négoce, hôtel particulier.
  'strings.hall_pillage': 'Raiders who reach its door steal a share of every store and damage a building.', // Les pillards qui atteignent sa porte volent une part de chaque réserve et abîment un bâtiment.
  'strings.hall_cut': '{n} buildings without a path to the Town Hall', // {n} bâtiments sans chemin vers l’hôtel de ville
  'strings.camp_info': 'The goblin camp is {n} tiles away, towards {dir}. Every raid sets out from it.', // Le camp gobelin est à {n} cases, vers {dir}. Tous les raids en partent.
  'strings.camp_show': 'See the goblin camp', // Voir le camp gobelin
  'strings.camp_force': 'Garrison: {n} / {all} guards · palisade {hp} / {max} · camps destroyed: {fell}', // Garnison : {n} / {all} gardes · palissade {hp} / {max} · camps détruits : {fell}
  'strings.camp_how': 'Send your soldiers: the button below, or select them and right-click the camp. They cut down the garrison, then the palisade; the hero joins them if in the village. Left alone, the camp recovers.', // Envoyez vos soldats : bouton ci-dessous, ou sélectionnez-les et clic droit sur le camp. Ils abattent la garnison puis la palissade ; {g:le héros|l’héroïne} les rejoint {g:s’il|si elle} est au village. Laissé seul, le camp se relève.
  'strings.camp_attack': 'Attack the camp', // Attaquer le camp
  'strings.camp_no_soldiers': 'No soldiers on their feet: train some at the barracks.', // Aucun soldat sur pied : formez-en à la caserne.
  'strings.camp_sent': '{n} soldiers march on the goblin camp.', // {n} soldats marchent sur le camp gobelin.
  'strings.camp_fall': 'The goblin camp is in ashes! +{gold} gold and its loot. No raids until a new camp rises, in {time}.', // Le camp gobelin est en cendres ! +{gold} or et son butin. Aucun raid avant qu’un nouveau camp se dresse, dans {time}.
  'strings.camp_fall_credit': ' It counts as {k} raids repelled.', //  Il compte pour {k} raids repoussés.
  'strings.camp_down': 'The goblin camp lies in ruins. No raids until then: a new camp, farther off and stronger, will rise in {time}.', // Le camp gobelin est en ruine. Aucun raid d’ici là : un nouveau camp, plus loin et plus fort, se dressera dans {time}.
  'strings.camp_ruin_show': 'See the camp ruins', // Voir les ruines du camp
  'strings.camp_ruin_hud': 'Camp in ruins · new camp in', // Camp en ruine · nouveau camp dans
  'strings.camp_ruin_hud_short': 'New camp in', // Nouveau camp dans
  'strings.camp_provoke': 'Provoke', // Provoquer
  'strings.camp_provoke_tip': 'Provoke the next camp\nIt rises now, farther off and stronger, and its raid sets out at once.\nBounty +{pct}% if you repel it.', // Provoquer le prochain camp\nIl se dresse maintenant, plus loin et plus fort, et son raid part aussitôt.\nPrime +{pct} % si vous le repoussez.
  'strings.camp_new': 'The goblins have pitched a new camp, towards {dir}. Its garrison is stronger.', // Les gobelins ont dressé un nouveau camp, vers {dir}. Sa garnison est plus forte.
  'strings.gh_road_ok': 'Touches a linked path', // Touche un chemin relié
  'strings.gh_road_no': 'No path: it won’t work', // Aucun chemin : il ne travaillera pas
  'strings.gh_serves': '{name} for {n} houses', // {name} pour {n} maisons
  'strings.gh_beauty_plus': '+{n} beauty for {h} houses', // +{n} beauté pour {h} maisons
  'strings.gh_beauty_minus': '−{n} beauty for {h} houses', // −{n} beauté pour {h} maisons
  'strings.gh_services': '{list}', // {list}
  'strings.gh_beauty': 'Beauty here: {n}', // Beauté ici : {n}
  'strings.tuto_step': 'step {n} / {all}', // étape {n} / {all}
  'strings.tuto_next': 'Click or Space ▸', // Clic ou Espace ▸
  'strings.tuto_bravo': 'Well done!', // Bravo !
  'strings.tuto_skip': 'Skip the tutorial', // Passer le tutoriel
  'strings.tuto_skip_short': 'Skip', // Passer
  'strings.tuto_skip_sure': 'Sure?', // Sûr ?
  'strings.tuto_skip_tip': 'Skip the tutorial\nClick twice. The whole game opens at once; the quests keep guiding you, and Aveline will come back to show each new thing.', // Passer le tutoriel\nCliquez deux fois. Tout le jeu s’ouvre aussitôt ; les quêtes continuent de vous guider, et Aveline reviendra montrer chaque nouveauté.
  'strings.tuto_gift': 'A gift from {name}: {list}', // Cadeau d’{name} : {list}
  'strings.tuto_done': 'Tutorial complete! Aubeval is yours.', // Tutoriel terminé ! Aubeval est à vous.
  'strings.tuto_skipped': 'Tutorial skipped. The quests, top left, will guide you.', // Tutoriel passé. Les quêtes, en haut à gauche, vous guident.
  'strings.tuto_need_wood': 'Wood: {have} / {n} · click trees', // Bois : {have} / {n} · cliquez des arbres
  'strings.tuto_need': '{res}: {have} / {n} · on its way…', // {res} : {have} / {n} · ça arrive…
  'strings.tuto_forging': 'The forge is at work…', // La forge travaille…
  'strings.tuto_go': 'Go and see', // Aller voir
  'strings.tuto_path_first': 'First, a stretch of path to the shining spot: {n} tile(s)', // D’abord, un bout de chemin jusqu’à la place qui brille : {n} case(s)
  'strings.tuto_lesson_step': 'Lesson · {title} · step {n} / {all}', // Leçon · {title} · étape {n} / {all}
  'strings.tuto_offer': 'New lesson', // Nouvelle leçon
  'strings.tuto_follow': 'Follow', // Suivre
  'strings.tuto_later': 'Later', // Plus tard
  'strings.tuto_later_tip': 'Later\nShe will offer it again in a few minutes. The Book of Lessons (Village) keeps it.', // Plus tard\nElle vous la reproposera dans quelques minutes. Le Livre des leçons (Village) la garde.
  'strings.tuto_lend': '{name} lends you: {list}', // {name} vous avance : {list}
  'strings.tuto_lesson_done': 'Lesson complete: {title}', // Leçon terminée : {title}
  'strings.tuto_skip_lesson': 'Skip the lesson', // Passer la leçon
  'strings.tuto_skip_lesson_tip': 'Skip the lesson\nClick twice. The Book of Lessons (Village) keeps it.', // Passer la leçon\nCliquez deux fois. Le Livre des leçons (Village) la garde.
  'strings.tuto_lesson_skipped': 'Lesson skipped. The Book of Lessons, in the Village, keeps it.', // Leçon passée. Le Livre des leçons, dans le Village, la garde.
  'strings.tuto_lesson_raid': 'A raid! The lesson will wait until it’s over.', // Un raid ! La leçon attendra qu’il soit fini.
  'strings.book_btn': 'Book of Lessons', // Livre des leçons
  'strings.book_title': 'Book of Lessons', // Livre des leçons
  'strings.book_help': 'All of {name}’s lessons, in the order of the game. She offers each one as it opens; here, you can follow or revisit them whenever you like.', // Toutes les leçons d’{name}, dans l’ordre du jeu. Elle propose chacune au moment où elle s’ouvre ; ici, on les suit ou on les revoit quand on veut.
  'strings.book_on': '{name} offers her lessons: yes', // {name} propose ses leçons : oui
  'strings.book_off': '{name} offers her lessons: no', // {name} propose ses leçons : non
  'strings.book_toggle_tip': 'When it’s no, she offers nothing more; the book stays open.', // Quand c’est non, elle ne propose plus rien ; le livre reste ouvert.
  'strings.book_start': 'The guided start of the first game: the view, wood, paths, the chain up to the forge, the first battle.', // Le début guidé de la première partie : la vue, le bois, les chemins, la chaîne jusqu’à la forge, le premier combat.
  'strings.book_seen': 'Seen', // Vue
  'strings.book_new': 'New', // Nouvelle
  'strings.book_now': 'In progress', // En cours
  'strings.book_locked': 'Later in the game', // Plus tard dans la partie
  'strings.book_replay': 'Replay', // Revoir
  'strings.away_title': 'Welcome back!', // De retour !
  'strings.away_text': 'Away {time}. Meanwhile, Aubeval produced:', // Absent {time}. Pendant ce temps, Aubeval a produit :
  'strings.away_nothing': 'Nothing new: the stores ran short.', // Rien de neuf : les réserves manquaient.
  'strings.siege_in': 'Siege #{n} in {time}', // Siège n°{n} dans {time}
  'strings.siege_now': 'SIEGE #{n}: {left} raiders, {leaks}/{max} through', // SIÈGE n°{n} : {left} pillards, {leaks}/{max} passés
  'strings.siege_warn': 'Three blasts of the horn: a SIEGE, from {dir}! {name} leads it.', // Trois coups de corne : un SIÈGE, par {dir} ! {name} le mène.
  'strings.siege_start': 'The siege begins: {name} marches with the column!', // Le siège commence : {name} marche avec sa colonne !
  'strings.siege_start_routed': 'The siege begins without its chief: the column wavers.', // Le siège commence sans son chef : la colonne hésite.
  'strings.siege_banner_title': 'A siege!', // Un siège !
  'strings.siege_banner_sub': '{name}, level {lvl}', // {name}, niveau {lvl}
  'strings.siege_banner_text': 'A larger, tougher column, led by a warlord. {trait}\n“Challenge”, under the countdown: {hero} meets the warlord in a duel, once only. Beaten, the warlord’s column loses heart; if not, the warlord marches with it and counts double at your gate.\nSiege repelled: a real bounty. Lost: a real sacking.', // Une colonne plus nombreuse et plus dure, menée par un chef de guerre. {trait}\n« Défier », sous le compte à rebours : {hero} l’affronte en duel, une seule fois. Vaincu, sa colonne perd courage ; sinon il marche avec elle et compte double à votre porte.\nSiège repoussé : une vraie prime. Perdu : un vrai saccage.
  'strings.siege_hud': 'Siege · {name}', // Siège · {name}
  'strings.siege_lvl': 'lv. {n}', // niv. {n}
  'strings.elite_hud': 'Elite raid', // Raid d’élite
  'strings.elite_warn': 'Elite raid: {list}!', // Raid d’élite : {list} !
  'strings.elite_flank': 'A second column comes out from {dir}!', // Une seconde colonne sort par {dir} !
  'strings.elite_tip': 'Elite raid\n{list}\nRepelled, it pays +{pct}% bounty.', // Raid d’élite\n{list}\nRepoussé, il paie +{pct} % de prime.
  'strings.elite_burn': 'Burnt!', // Incendié !
  'strings.royal_in': 'Royal Siege · wave {wave}/{of} in {time}', // Siège royal · vague {wave}/{of} dans {time}
  'strings.royal_now': 'ROYAL SIEGE · wave {wave}/{of}: {left} raiders, {leaks}/{max} through', // SIÈGE ROYAL · vague {wave}/{of} : {left} pillards, {leaks}/{max} passés
  'strings.royal_go': 'The Royal Siege has begun: three waves, the horn is about to sound!', // Le Siège royal est lancé : trois vagues, la corne va sonner !
  'strings.royal_next': 'Wave repelled! Wave {wave}/{of} is on the march.', // Vague repoussée ! La vague {wave}/{of} se met en marche.
  'strings.royal_lost_title': 'The Royal Siege has failed', // Le Siège royal a échoué
  'strings.royal_lost_sub': 'Grakk regroups his troops', // Grakk regroupe ses troupes
  'strings.royal_lost_text': 'A wave got past your defences. Strengthen ramparts, towers and traps: the Royal Siege can be tried again in {time}.', // Une vague a passé vos défenses. Renforcez remparts, tours et pièges : le Siège royal pourra être retenté dans {time}.
  'strings.elite_banner_title': 'Elite raids', // Des raids d’élite
  'strings.elite_banner_sub': 'The city draws craftier raiders', // La cité attire des pillards plus rusés
  'strings.elite_banner_text': 'From now on, every raid comes with a scourge, heralded by the horn: {name}. {trait}\nThe higher the city climbs, the more they stack. Each adds {pct}% to the bounty.', // À partir de maintenant, chaque raid vient avec un fléau, annoncé au son de la corne : {name}. {trait}\nPlus la cité monte, plus ils en cumulent. Chacun ajoute {pct} % à la prime.
  'strings.duel_btn': 'Challenge {name}', // Défier {name}
  'strings.duel_tip': 'Challenge {name} to a duel\n{hero} faces the warlord alone, with cards, once per siege.\nVictory: the chief is out of the fight, the raiders lose heart and some flee.\nOtherwise: the chief marches with the column and counts double at your gate.', // Défier {name} en duel\n{hero} l’affronte {g:seul|seule}, aux cartes, une seule fois par siège.\nVainqueur : le chef est hors de combat, ses pillards perdent courage et certains fuient.\nSinon : il marche avec sa colonne et compte double à votre porte.
  'strings.duel_away': '{hero} is on a mission: no one to issue the challenge.', // {hero} est en mission : personne pour le défier.
  'strings.duel_title': 'Duel · {name}', // Duel · {name}
  'strings.duel_hint': 'A duel can be tried only once per siege. The next warlord will come with the next siege: better cards and a better blade by then.', // Un duel ne se tente qu’une fois par siège. Le prochain chef de guerre viendra avec le prochain siège : de meilleures cartes et une meilleure lame d’ici là.
  'strings.duel_won': '{name} is defeated! The column loses heart: {n} raiders flee.', // {name} est vaincu ! Sa colonne perd courage : {n} pillards fuient.
  'strings.duel_won_before': '{name} is defeated! The column will come without its chief, smaller and disheartened.', // {name} est vaincu ! Sa colonne viendra sans lui, moins nombreuse et sans courage.
  'strings.duel_lost': '{name} won the duel and will march with the column.', // {name} a gagné le duel : il marchera avec sa colonne.
  'strings.duel_won_hud': 'Beaten in a duel: the column has lost heart.', // Vaincu en duel : sa colonne a perdu courage.
  'strings.duel_lost_hud': 'Duel lost: the chief marches with the column.', // Duel perdu : il marche avec sa colonne.
  'strings.duel_lost_text': '{hero} falls back behind the ramparts. The warlord will march with the column: cut the chief down on the road, before your gate.', // {hero} se replie derrière les remparts. Le chef de guerre marchera avec sa colonne : abattez-le sur la route, avant votre porte.
  'strings.lord_marching': 'On the march: {hp} / {max}', // En marche : {hp} / {max}
  'strings.lord_fallen': 'Cut down on the road.', // Abattu sur la route.
  'strings.lord_down': '{name} has fallen! +{gold} gold', // {name} est tombé ! +{gold} or
  'strings.lord_flee': 'Flees!', // Fuit !
  'strings.lord_tip': '{name}, level {lvl} warlord\n{trait}\nOn the road: nearby raiders take {pct}% less damage, and the warlord counts as {n} at your gate.', // {name}, chef de guerre de niveau {lvl}\n{trait}\nSur la route : ses pillards encaissent {pct} % de dégâts en moins près de lui, et il compte pour {n} à votre porte.
  'strings.siege_won': 'Siege repelled! Bounty: {gold} gold', // Siège repoussé ! Prime : {gold} or
  'strings.siege_lost': 'Siege lost: Aubeval is sacked. Repair, then rebuild your ramparts.', // Siège perdu : Aubeval est mise à sac. Réparez, puis relevez vos remparts.
  'strings.sacked': 'Sacked!', // Mis à sac !
  'strings.pop_duel': 'a warlord beaten in a duel', // un chef de guerre vaincu en duel
  'strings.pop_camp': 'a goblin camp razed', // un camp gobelin rasé
  'strings.camp_chief': 'Its chief: {name} ({hp} / {max}). The chief’s head is worth {gold} more gold when the camp falls.', // Son chef : {name} ({hp} / {max}). Sa tête vaut {gold} or de plus à la chute du camp.
  'strings.camp_chief_down': 'Its chief, {name}, is down: the palisade, quick!', // Son chef, {name}, est à terre : la palissade, vite !
  'strings.camp_new_chief': 'New goblin camp, towards {dir}. {name} commands it: stronger, richer.', // Nouveau camp gobelin, vers {dir}. {name} y commande : plus fort, plus riche.
  'strings.it_sunder': 'Guard-breaker {n}', // Brise-garde {n}
  'strings.it_sunder_tip': 'it smashes your Guard first, then strikes. Only a parry stops it.', // il fracasse d’abord votre Garde, puis frappe. Seule la parade l’arrête.
  'strings.it_flurry': 'Attack {n} ×3', // Attaque {n} ×3
  'strings.it_flurry_tip': 'three quick blows: three parries.', // trois coups rapprochés : trois parades.
  'strings.it_mend': 'Will heal itself', // Va se soigner
  'strings.it_mend_tip': 'restores {pct}% of its own life.', // se rend {pct} % de sa vie.
  'strings.it_call': 'Will call: {name}', // Va appeler : {name}
  'strings.it_call_tip': 'one more reinforcement in the fray.', // un renfort de plus dans la mêlée.
  'strings.msg_sunder': '{name} smashes the Guard!', // {name} fracasse la Garde !
  'strings.msg_flurry': '{name} strikes three times.', // {name} frappe trois fois.
  'strings.msg_mend': '{name} binds its wounds.', // {name} panse ses plaies.
  'strings.msg_call': '{name} whistles: {ally} comes running!', // {name} siffle : {ally} accourt !
  'strings.pop_sunder': 'Guard broken', // Garde brisée
  'strings.num_dec': '.', // ,
  'strings.num_units[0]': 'k', // k
  'strings.num_units[1]': 'M', // M
  'strings.num_units[2]': 'B', // Md
  'strings.num_units[3]': 'T', // Bn
  'strings.num_units[4]': 'Qa', // Tn
  'strings.hero_of': '{name}’s', // de {name}
  'strings.hero_of_vowel': '{name}’s', // d’{name}
  'strings.colon': ': ', //  : 
  'strings.pct': '{n}%', // {n} %
  'strings.x2': '×2!', // ×2 !
  'strings.gold_n': '{n} gold', // {n} or
  'strings.close_tip': 'Close (Esc)', // Fermer (Échap)
  'strings.key_tip': 'Key {k}', // Touche {k}
  'strings.quote': '“{s}”', // « {s} »
  'strings.save_file': 'aubeval-save.json', // aubeval-sauvegarde.json
  'strings.msg_hit': '{name} attacks.', // {name} attaque.
  'strings.msg_double': '{name} strikes twice.', // {name} frappe deux fois.
  'strings.msg_windup': '{name} raises its weapon: a terrible blow comes next turn!', // {name} lève son arme : un coup terrible arrive au prochain tour !
  'strings.msg_heavy': '{name} brings its weapon down!', // {name} abat son arme !
  'strings.msg_hex': '{name} casts a hex: it goes through Guard.', // {name} lance un maléfice : il traverse la Garde.
  'strings.msg_heal': '{name} heals {ally}.', // {name} soigne {ally}.
  'strings.msg_whistle': '{name} whistles: a goblin comes running!', // {name} siffle : un gobelin accourt !
  'strings.msg_enrage': '{name} flies into a rage: its blows hurt more!', // {name} enrage : ses coups font plus mal !
  'strings.pop_rage': 'RAGE', // RAGE
  'strings.st_rage': 'Rage', // Rage
  'strings.st_buff': 'ATK ×{x} ({n})', // ATQ ×{x} ({n})
  'strings.stats_up': 'HP +{hp} · ATK +{atk} · DEF +{def}', // PV +{hp} · ATQ +{atk} · DÉF +{def}
  'strings.stat_atk': 'ATK +{n}', // ATQ +{n}
  'strings.stat_def': 'DEF +{n}', // DÉF +{n}
  'strings.stat_hp': 'HP +{n}', // PV +{n}
  'strings.unit_stats': 'HP {hp} · ATK {atk}', // PV {hp} · ATQ {atk}
  'strings.card_cost': '{n} Breath', // {n} souffle
  'strings.card_origin_lvl': '{card} · lv. {n}', // {card} · niv. {n}
  'strings.card_dmg': '{d} damage', // {d} dégâts
  'strings.card_dmg_all': '{d} damage to all', // {d} dégâts à tous
  'strings.card_arrows': '{n} arrows of {d}, at random', // {n} flèches de {d}, au hasard
  'strings.card_pierce': 'Ignores armour', // Ignore l’armure
  'strings.card_shred': 'Armour −{n}', // Armure −{n}
  'strings.card_stun': 'Target loses its turn', // La cible perd son tour
  'strings.card_weak': 'Weakens for {n} turns', // Affaiblit {n} tours
  'strings.card_block': 'Guard {n}', // Garde {n}
  'strings.card_thorns': 'Thorns {n}', // Épines {n}
  'strings.card_heal': 'Restores {n} HP', // Rend {n} PV
  'strings.card_draw': 'Draw {n}', // Pioche {n}
  'strings.card_energy': '+{n} Breath', // +{n} souffle
  'strings.card_buff': 'ATK +{pct}%, {n} turns', // ATQ +{pct} %, {n} tours
  'strings.card_bless': 'Next blow parried', // Prochain coup paré
  'strings.card_wide': 'Easy parry', // Parade facile
  'strings.card_ally': 'Militiaman: {dmg} per turn, {n} turns', // Milicien : {dmg} par tour, {n} tours
  'strings.card_echo': 'Next card ×2', // Carte suivante ×2
  'strings.card_once': 'Once per battle', // Une fois par combat
  'strings.card_note_block': 'Guard: absorbs damage until your next turn.', // Garde : absorbe les dégâts jusqu’à votre prochain tour.
  'strings.card_note_thorns': 'Thorns: every enemy that strikes you this turn takes them.', // Épines : chaque ennemi qui vous frappe ce tour les subit.
  'strings.card_note_stun': 'A chief doesn’t lose the turn, but strikes at half strength.', // Un chef ne perd pas son tour : il frappe à moitié force.
  'strings.card_note_bless': 'The next blow is parried perfectly, without pressing a thing, riposte included.', // Le prochain coup est paré parfaitement, sans rien presser, riposte comprise.
  'strings.card_note_wide': 'Until your next turn, the parry window is twice as wide.', // Jusqu’à votre prochain tour, le moment de la parade est deux fois plus large.
  'strings.card_note_echo': 'The next card played this turn takes effect twice.', // La prochaine carte jouée ce tour fait son effet deux fois.
  'strings.card_note_pay': 'Costs {list} from the village stores.', // Coûte {list} des réserves du village.
  'strings.need_pop': '{n} inhabitants ({have})', // {n} habitants ({have})
  'strings.need_pop_short': '{n} inhabitants', // {n} habitants
  'strings.need_after': 'after {name}', // après {name}
  'strings.need_cls': '{name} class house ({n}/{all})', // Maison de classe {name} ({n}/{all})
  'strings.need_quest': 'Quest “{title}”', // Quête « {title} »
  'strings.need_quest_short': 'Quest', // Quête
  'strings.need_raids': 'Raids repelled ({n}/{all})', // Raids repoussés ({n}/{all})
  'strings.need_raids_short': 'Raid', // Raid
  'strings.need_hero': 'Hero level {n}', // {g:Héros|Héroïne} niveau {n}
  'strings.need_hero_short': 'Level {n}', // Niveau {n}
  'strings.need_weapon': 'A weapon equipped', // Une arme équipée
  'strings.need_armor': 'Armour equipped', // Une armure équipée
  'strings.need_equip_short': 'Gear', // Équipement
  'strings.need_tier': 'Tier {n} weapon', // Arme de palier {n}
  'strings.need_tier_short': 'Tier {n}', // Palier {n}
  'strings.need_totals': '{name} gathered ({n}/{all})', // {name} récolté ({n}/{all})
  'strings.need_res': '{name} in store ({n}/{all})', // {name} en réserve ({n}/{all})
  'strings.city_need_pop_short': 'Popularity {n}', // Popularité {n}
  'strings.res_rate_tip': '{rate} right now', // {rate} en ce moment
  'strings.res_none_tip': 'Nothing produces it yet', // Rien ne le produit pour l’instant
  'strings.pop_tip': 'Houses lodge inhabitants. Their number unlocks new buildings.', // Les maisons logent les habitants. Leur nombre débloque de nouveaux bâtiments.
  'strings.raid_call_tip': 'Call the raid now\nBounty +{pct}% if you repel it.', // Appeler le raid maintenant\nPrime +{pct} % si vous le repoussez.
  'strings.forge_plus_tip': 'Each +1 adds {pct}% of its bonuses.', // Chaque +1 ajoute {pct} % de ses bonus.
  'strings.forge_perk_on': 'Tempering: each +N is worth {pct}% of its bonuses.', // Trempe : chaque +N vaut {pct} % de ses bonus.
  'strings.forge_perk_off': 'Level {n}: Tempering (stronger +N) and the Red-hot Iron card.', // Niveau {n} : Trempe (+N plus forts) et carte Fer rouge.
  'strings.up_forge_perk': 'Milestone: Tempering and the Red-hot Iron card!', // Palier : Trempe et carte Fer rouge !
  'strings.contracts_none': 'Contracts come with the quest “Hold the Village”. Each victory raises their rank: enemies and bounties grow without limit.', // Les contrats arrivent avec la quête « Tenir le village ». Chaque victoire en élève le rang : ennemis et primes grandissent sans limite.
  'strings.fg_bellows_keys': 'B · ↑ · right-click', // B · ↑ · clic droit
  'strings.span_min': '{m} minute', // {m} minute
  'strings.span_mins': '{m} minutes', // {m} minutes
  'strings.span_secs': '{s} seconds', // {s} secondes
  'strings.page_title': 'Aubeval – A pixel-art village builder, free in your browser', // Aubeval – Jeu de gestion en pixel art, gratuit dans le navigateur
  'strings.city_title': 'The City · {name}', // La cité · {name}
  'strings.city_t_rank': 'Rank', // Rang
  'strings.city_t_orders': 'Orders', // Commandes
  'strings.city_t_taxes': 'Taxes', // Impôts
  'strings.city_t_works': 'Great Works', // Chantiers
  'strings.city_t_legacy': 'Legacy', // Héritage
  'strings.city_hud_tip': '{name} · hero’s popularity {n} / 100\nClick to open the City (G).', // {name} · popularité {g:du héros|de l’héroïne} {n} / 100\nCliquez pour ouvrir la Cité (G).
  'strings.city_hud_tip_order': 'An order can be honoured.', // Une commande peut être honorée.
  'strings.city_hud_tip_rank': 'The next rank can be proclaimed.', // Le rang suivant peut être proclamé.
  'strings.city_need_rank': 'City rank: {name} (here: {have})', // Rang de cité : {name} (ici : {have})
  'strings.city_need_pop': 'Hero’s popularity {n} (here: {have})', // Popularité {g:du héros|de l’héroïne} {n} (ici : {have})
  'strings.city_need_orders': 'Orders honoured ({have}/{n})', // Commandes honorées ({have}/{n})
  'strings.city_need_raids': 'Raids repelled by this village ({have}/{n})', // Raids repoussés par ce village ({have}/{n})
  'strings.city_need_raids_camp': ' · a razed camp counts as {k}', //  · un camp rasé en vaut {k}
  'strings.city_need_works': 'Great work stages ({have}/{n})', // Étapes de grands chantiers ({have}/{n})
  'strings.city_need_camps': 'Goblin camps razed ({have}/{n})', // Camps gobelins rasés ({have}/{n})
  'strings.city_need_royal': 'Royal Siege repelled: three waves, Grakk in the last', // Siège royal repoussé : trois vagues, Grakk à la dernière
  'strings.city_need_royal_on': 'Royal Siege under way: wave {wave}/{of}', // Siège royal en cours : vague {wave}/{of}
  'strings.city_need_royal_short': 'Royal Siege', // Siège royal
  'strings.city_royal_btn': 'Face the Royal Siege', // Affronter le Siège royal
  'strings.city_royal_others': 'First meet the rank’s other conditions.', // Remplissez d’abord les autres conditions du rang.
  'strings.city_royal_tip': 'Face the Royal Siege\n{n} waves in a row, each larger and with one more scourge. Grakk the Cleaver leads the last: he can be challenged to a duel.\nIf a single wave gets through, it must be tried again later.', // Affronter le Siège royal\n{n} vagues de suite, chacune plus nombreuse et avec un fléau de plus. Grakk le Fendeur mène la dernière : il peut être défié en duel.\nUne seule vague qui passe, et c’est à retenter plus tard.
  'strings.city_royal_busy': 'Not during a raid, nor once the horn has sounded.', // Pas pendant un raid, ni quand la corne a sonné.
  'strings.city_royal_early': 'The raids haven’t begun yet.', // Les raids n’ont pas encore commencé.
  'strings.city_royal_cd': 'Grakk regroups his troops: {time} more.', // Grakk regroupe ses troupes : encore {time}.
  'strings.city_royal_won': 'The Royal Siege is repelled!', // Le Siège royal est repoussé !
  'strings.city_royal_won_text': 'Grakk and his three waves have broken against your walls. The kingdom awaits only your proclamation: the City (G), Rank tab.', // Grakk et ses trois vagues ont reflué devant vos murs. Le royaume n’attend plus que votre proclamation : la Cité (G), onglet Rang.
  'strings.city_why_royal': 'Royal Siege repelled', // Siège royal repoussé
  'strings.city_rank_n': 'Rank {n}', // Rang {n}
  'strings.city_rank_gives': 'production and taxes +{pct}%', // production et impôts +{pct} %
  'strings.city_pop_title': 'Hero’s popularity: {n} / 100', // Popularité {g:du héros|de l’héroïne} : {n} / 100
  'strings.city_pop_gives': 'It gives: taxes +{tax}%, Market {mk}% cheaper to buy and {mk}% dearer to sell, +{house} inhabitant(s) per house.', // Elle donne : impôts +{tax} %, Marché {mk} % moins cher à l’achat et {mk} % plus cher à la vente, +{house} habitant(s) par maison.
  'strings.city_pop_next': 'One more inhabitant per house at {n}.', // Un habitant de plus par maison à {n}.
  'strings.city_pop_decay': 'It wears away by {n} a minute, never below {floor}. The higher it is, the slower it rises.', // Elle s’effrite de {n} par minute, jamais sous {floor}. Plus elle est haute, plus elle monte lentement.
  'strings.city_pop_squeeze': 'High taxes: {n} less a minute.', // Impôts élevés : {n} de moins par minute.
  'strings.city_pop_log': 'Where it comes from', // D’où elle vient
  'strings.city_pop_nolog': 'Nothing yet: honour an order, repel a raid, win a battle.', // Rien encore : honorez une commande, repoussez un raid, gagnez un combat.
  'strings.city_next': 'Towards: {name}', // Vers : {name}
  'strings.city_reward_pop': 'popularity +{n}', // popularité +{n}
  'strings.city_opens': 'Opens: {list}', // Ouvre : {list}
  'strings.city_rank_out': '+{pct}% production and taxes', // +{pct} % de production et d’impôts
  'strings.city_proclaim': 'Proclaim: {name}', // Proclamer : {name}
  'strings.city_proclaim_tip': 'Proclaim\nThe town takes its new rank: a reward, and all it opens.', // Proclamer\nLa ville prend son nouveau rang : une récompense, et ce qu’il ouvre.
  'strings.city_proclaim_no': 'Proclaim\nSome conditions are still missing.', // Proclamer\nIl manque encore des conditions.
  'strings.city_banner': '{name}!', // {name} !
  'strings.city_banner_sub': 'Aubeval is proclaimed · rank {n}', // Aubeval est proclamée · rang {n}
  'strings.city_why_raid': 'Raid repelled', // Raid repoussé
  'strings.city_why_siege': 'Siege broken', // Siège brisé
  'strings.city_why_raidlost': 'Raid lost', // Raid perdu
  'strings.city_why_camp': 'Goblin camp razed', // Camp gobelin rasé
  'strings.city_why_quest': 'Quest complete', // Quête accomplie
  'strings.city_why_battle': 'Battle won', // Combat gagné
  'strings.city_why_boss': 'Chief defeated', // Chef vaincu
  'strings.city_why_class': 'A house rises', // Une maison s’élève
  'strings.city_why_site': 'Site explored', // Lieu exploré
  'strings.city_why_game': 'Game won', // Jeu réussi
  'strings.city_why_order': 'Order honoured', // Commande honorée
  'strings.city_why_work': 'Great work: {name}', // Chantier : {name}
  'strings.city_why_rank': 'Proclamation: {name}', // Proclamation : {name}
  'strings.city_orders_done': 'Orders honoured: {n}', // Commandes honorées : {n}
  'strings.city_refuse_in': 'Can refuse in {time}', // Refus possible dans {time}
  'strings.city_orders_closed': 'The townsfolk’s orders come with the first house.', // Les commandes des habitants arrivent avec la première maison.
  'strings.city_order_wait': 'A new order arrives in {time}', // Une nouvelle commande arrive dans {time}
  'strings.city_order_worth': '×{n} orders', // ×{n} commandes
  'strings.city_opens_slot': '{n} orders at once', // {n} commandes à la fois
  'strings.city_deliver': 'Deliver', // Livrer
  'strings.city_honour': 'Honour', // Honorer
  'strings.city_refuse': 'Refuse', // Refuser
  'strings.city_refuse_tip': 'Refuse\nThe order leaves, another arrives in {wait}. Only one refusal every {cd}.', // Refuser\nLa commande part, une autre arrive dans {wait}. Un seul refus toutes les {cd}.
  'strings.city_order_no': 'Not filled yet.', // Pas encore remplie.
  'strings.city_order_done': 'Order honoured: {title}', // Commande honorée : {title}
  'strings.city_medals[0]': '', // 
  'strings.city_medals[1]': 'bronze', // bronze
  'strings.city_medals[2]': 'silver', // argent
  'strings.city_medals[3]': 'gold', // or
  'strings.city_tax_help': 'One level per class. Each button shows what the class would pay per minute at that level.', // Un niveau par classe. Chaque bouton affiche ce que la classe paierait par minute à ce niveau.
  'strings.city_tax_total': 'Taxes right now: {n} gold per minute', // Impôts en ce moment : {n} or par minute
  'strings.city_tax_class': '{name} · {houses}', // {name} · {houses}
  'strings.city_tax_none': '{name} · no houses', // {name} · aucune maison
  'strings.city_tax_low': 'Low', // Bas
  'strings.city_tax_normal': 'Normal', // Normal
  'strings.city_tax_high': 'High', // Élevé
  'strings.city_tax_min': '{n}/min', // {n}/min
  'strings.city_tax_fx_low': 'Low: satisfaction rises {k} times faster.', // Bas : la satisfaction monte {k} fois plus vite.
  'strings.city_tax_fx_normal': 'Normal: no more, no less.', // Normal : ni plus, ni moins.
  'strings.city_tax_fx_high': 'High: satisfaction capped at {cap}%, these houses no longer rise · popularity −{n}/min.', // Élevé : satisfaction plafonnée à {cap} %, ces maisons ne s’élèvent plus · popularité −{n}/min.
  'strings.city_tax_tip_low': 'Low\nTax ×{m}. Satisfaction rises {k} times faster: houses rise sooner.', // Bas\nImpôt ×{m}. La satisfaction monte {k} fois plus vite : les maisons s’élèvent plus tôt.
  'strings.city_tax_tip_normal': 'Normal\nThe usual tax.', // Normal\nL’impôt habituel.
  'strings.city_tax_tip_high': 'High\nTax ×{m}. Satisfaction caps at {cap}%: these houses can no longer rise, and the hero loses {n} popularity per minute.', // Élevé\nImpôt ×{m}. La satisfaction plafonne à {cap} % : ces maisons ne peuvent plus s’élever, et {g:le héros|l’héroïne} perd {n} de popularité par minute.
  'strings.city_tax_tip_now': 'Now: {now} gold/min · at this level: {then} gold/min', // Maintenant : {now} or/min · à ce niveau : {then} or/min
  'strings.city_works_help': 'Three monuments, opened by the ranks. This is where surpluses go: each stage costs thousands of resources and gives a lasting bonus to the whole town.', // Trois monuments, ouverts par les rangs. C’est là que partent les surplus : chaque étape coûte des milliers de ressources et donne un bonus permanent à toute la ville.
  'strings.city_work_gives': 'What it gives', // Ce qu’il donne
  'strings.city_work_next': 'Next stage: {name}', // Étape suivante : {name}
  'strings.city_work_embel': 'Embellishment #{n}', // Embellissement n° {n}
  'strings.city_work_build': 'Build: {name}', // Bâtir : {name}
  'strings.city_work_embel_do': 'Embellish', // Embellir
  'strings.city_embel_n': 'Embellishments: {n}', // Embellissements : {n}
  'strings.city_work_damaged': 'Damaged: it gives nothing now. Repair it.', // Endommagé : il ne donne plus rien. Réparez-le.
  'strings.city_work_place': 'Lay the foundations', // Poser les fondations
  'strings.city_work_see': 'See the great work', // Voir le chantier
  'strings.city_work_place_help': 'It is placed like a building (Great Works tab in the bottom bar): that pours its foundations.', // Il se pose comme un bâtiment (onglet Chantiers de la barre du bas) : cela coule ses fondations.
  'strings.city_work_done': '{name}: {stage}!', // {name} : {stage} !
  'strings.city_work_more': '{name}: embellishment #{n}.', // {name} : embellissement n° {n}.
  'strings.city_work_banner': 'Great work complete!', // Chantier achevé !
  'strings.city_work_banner_text': '{name} towers over Aubeval. Yet the work goes on: each embellishment adds a little more to what it gives, without end.', // {name} domine Aubeval. Le chantier ne s’arrête pas pour autant : chaque embellissement ajoute encore un peu à ce qu’il donne, sans fin.
  'strings.city_renown': 'Renown: {n}', // Renommée : {n}
  'strings.city_renown_free': 'To spend: {n} · production +{pct}% forever', // À dépenser : {n} · production +{pct} % pour toujours
  'strings.city_legacy_help': 'Renown is earned with each New Start and never lost. Spent here, it gives bonuses for this village and every one after it.', // La Renommée se gagne à chaque nouveau départ et ne se perd jamais. Dépensée ici, elle donne des bonus qui valent pour ce village et tous les suivants.
  'strings.city_ns_title': 'A New Start', // Un nouveau départ
  'strings.city_ns_gain': 'Now: +{n} Renown ({gold} for gold earned, {rank} for rank).', // Maintenant : +{n} Renommée ({gold} pour l’or gagné, {rank} pour le rang).
  'strings.city_ns_none': 'No Renown to gain yet: grow this village.', // Pas encore de Renommée à gagner : faites grandir ce village.
  'strings.city_ns_keep': 'Kept: the hero, the quests, the legacy, sites discovered. Back to zero: buildings, stores, rank, orders, taxes and great works.', // Restent : {g:le héros|l’héroïne}, ses quêtes, l’héritage, les lieux découverts. Repartent de zéro : bâtiments, réserves, rang, commandes, impôts et chantiers.
  'strings.city_ns_stock': 'You will start again with: {list}.', // Vous repartirez avec : {list}.
  'strings.city_ns_do': 'Make a New Start', // Prendre un nouveau départ
  'strings.city_ns_sure': 'Click again to confirm', // Cliquez encore pour confirmer
  'strings.city_ns_raid': 'Not during a raid.', // Pas pendant un raid.
  'strings.city_node_lvl': '{n} / {max}', // {n} / {max}
  'strings.city_node_need': 'Requires: {list}', // Demande : {list}
  'strings.city_node_max': 'Maxed out', // Au maximum
  'strings.city_node_none': 'Not learnt yet', // Pas encore appris
  'strings.city_node_tip': '{name}\n{desc}\nNext level: {cost} Renown.', // {name}\n{desc}\nNiveau suivant : {cost} Renommée.
  'strings.city_node_req': '{name} lv. {n}', // {name} niv. {n}
  'strings.vn_pop': 'Popularity', // Popularité
  'strings.vn_pop_tip': 'The hero’s popularity\nIt rises with games, quests and raids repelled, and sinks back over time. It weighs on tax, market prices and how many folk your houses lodge.', // La popularité {g:du héros|de l’héroïne}\nElle monte avec les jeux, les quêtes et les raids repoussés, et retombe avec le temps. Elle pèse sur l’impôt, les prix du marché et le monde que logent vos maisons.
  'strings.vn_play': 'Play: {title}', // Jouer : {title}
  'strings.vn_play_wait': 'Ready in {t}', // Prêt dans {t}
  'strings.vn_play_tip': '{title}\n{how}', // {title}\n{how}
  'strings.vn_wait_tip': '{title}\n{name} is catching their breath: the game will be ready in {t}.', // {title}\n{name} reprend son souffle : le jeu sera prêt dans {t}.
  'strings.vn_talk': 'Chat', // Discuter
  'strings.vn_talk_tip': 'Chat\nA word from {name}, and the talk of the town.', // Discuter\nUn mot de {name}, et ce qui se dit en ville.
  'strings.vn_leave': 'Leave (Esc)', // Sortir (Échap)
  'strings.vn_leave_tip': 'Leave\nBack to the village.', // Sortir\nRetour au village.
  'strings.vn_next': 'Space ▸', // Espace ▸
  'strings.vn_keys': '↑ ↓ and Enter, or 1 · 2 · 3', // ↑ ↓ et Entrée, ou 1 · 2 · 3
  'strings.vn_gifts': 'Current gifts', // Cadeaux en cours
  'strings.vn_no_gift': 'No gift running: play!', // Aucun cadeau en cours : jouez !
  'strings.vn_gifts_more': '+ {n} more', // + {n} autres
  'strings.vn_card_wins': 'To win', // À gagner
  'strings.vn_card_best': 'Best: {n}', // Record : {n}
  'strings.vn_card_none': 'Never played', // Jamais joué
  'strings.vn_card_streak': 'Streak: {n} · difficulty {lvl}', // Série : {n} · difficulté {lvl}
  'strings.vn_card_ready': 'Ready!', // Prêt !
  'strings.vn_medal_0': 'Lost', // Perdu
  'strings.vn_medal_1': 'Bronze', // Bronze
  'strings.vn_medal_2': 'Silver', // Argent
  'strings.vn_medal_3': 'Gold', // Or
  'strings.vn_pop_gain': '+{n} popularity', // +{n} popularité
  'strings.vn_intro_go': 'Let’s go! (Enter)', // C’est parti ! (Entrée)
  'strings.vn_intro_back': 'Not now', // Pas maintenant
  'strings.vn_intro_goal': 'Bronze {a} · Silver {b} · Gold {c} {unit}', // Bronze {a} · Argent {b} · Or {c} {unit}
  'strings.vn_intro_level': 'Streak of {n}: the game gets harder.', // Série de {n} : le jeu se corse.
  'strings.ht_new': 'New!', // Nouveau !
  'strings.ht_key_space': 'Space', // Espace
  'strings.ht_key_enter': 'Enter', // Entrée
  'strings.ht_key_click': 'click', // clic
  'strings.ht_key_rclick': 'right click', // clic droit
  'strings.vn_go': 'Go!', // Partez !
  'strings.vn_time': 'Time', // Temps
  'strings.vn_pause': 'Pause', // Pause
  'strings.vn_pause_text': 'Giving up counts as a lost game.', // Abandonner compte comme une partie perdue.
  'strings.vn_resume': 'Resume (Esc)', // Reprendre (Échap)
  'strings.vn_quit': 'Give up', // Abandonner
  'strings.vn_res_0': 'Lost…', // Perdu…
  'strings.vn_res_1': 'Bronze medal', // Médaille de bronze
  'strings.vn_res_2': 'Silver medal', // Médaille d’argent
  'strings.vn_res_3': 'Gold medal!', // Médaille d’or !
  'strings.vn_res_score': '{n} {unit}', // {n} {unit}
  'strings.vn_res_best': 'New best!', // Nouveau record !
  'strings.vn_res_best_old': 'Best: {n}', // Record : {n}
  'strings.vn_res_pop': 'Hero’s popularity +{n}', // Popularité {g:du héros|de l’héroïne} +{n}
  'strings.vn_res_nopop': 'No popularity this time.', // Pas de popularité cette fois.
  'strings.vn_res_gift': '{text} for {t}', // {text} pendant {t}
  'strings.vn_res_kept': '{text}: the current gift is better, so it is kept', // {text} : le cadeau en cours, meilleur, est gardé
  'strings.vn_res_streak_up': 'Streak: {n}. The next game will be harder, and pay better.', // Série : {n}. La prochaine partie sera plus dure, et paiera mieux.
  'strings.vn_res_streak_same': 'Streak: {n}.', // Série : {n}.
  'strings.vn_res_streak_down': 'Streak back to {n}: the game turns gentler.', // Série retombée à {n} : le jeu redevient plus doux.
  'strings.vn_res_wait': 'Next game here in {t}.', // Prochaine partie ici dans {t}.
  'strings.vn_res_ok': 'Continue (Enter)', // Continuer (Entrée)
  'strings.vn_why': '{title} ({medal})', // {title} ({medal})
  'strings.vn_tip_lack': '{intro} {n} house(s) are short of {res}.', // {intro} {n} maison(s) manquent de {res}.
  'strings.vn_tip_svc': '{intro} {n} house(s) want a building within reach: {name}.', // {intro} {n} maison(s) réclament un bâtiment à leur portée : {name}.
  'strings.vn_tip_road': '{intro} a building is linked to no path ({name}): nothing goes in, nothing comes out.', // {intro} un bâtiment n’est relié à aucun chemin ({name}) : rien n’y entre, rien n’en sort.
  'strings.vn_tip_damaged': '{intro} {n} building(s) still await repairs.', // {intro} {n} bâtiment(s) attendent encore des réparations.
  'strings.vn_tip_starved': '{intro} a workshop has stopped ({name}): it is short of {res}.', // {intro} un atelier ne tourne plus ({name}) : il manque de {res}.
  'strings.vn_tip_raid': '{intro} the goblins are gathering. Keep your soldiers near the gates.', // {intro} les gobelins se rassemblent. Gardez vos soldats près des portes.
  'strings.vn_tip_pop_low': '{intro} folk speak little of the hero these days. A game or two, and tongues will loosen.', // {intro} l’on parle peu {g:du héros|de l’héroïne} en ce moment. Un jeu ou deux, et les langues se délient.
  'strings.vn_tip_pop_high': '{intro} the hero’s name is on everyone’s lips. Taxes come in better when the hero is loved.', // {intro} tout le monde n’a que le nom {g:du héros|de l’héroïne} à la bouche. L’impôt rentre mieux quand on l’aime.
  'strings.vn_tip_game': '{intro} {name} has a game all ready for you ({place}).', // {intro} {name} a un jeu tout prêt pour vous ({place}).
  'strings.vn_tip_fine': '{intro} the town runs smoothly. A good time to think bigger.', // {intro} la ville tourne rond. Profitez-en pour voir plus grand.
  'strings.cf_served': 'Tips', // Pourboires
  'strings.cf_queue': 'The queue', // La file
  'strings.cf_lost': 'Gone', // Partis
  'strings.cf_order': 'Order', // Commande
  'strings.cf_again': 'Once more:', // Je répète :
  'strings.cf_hidden': 'Your turn!', // À vous !
  'strings.cf_flawless': 'Flawless!', // Sans faute !
  'strings.cf_keys': 'Keys 1 to {n}, or click a cup', // Touches 1 à {n}, ou clic sur une tasse
  'strings.cf_end_strikes': 'Too many customers have left!', // Trop de clients sont partis !
  'strings.mk_lot': 'The deal', // L’affaire
  'strings.mk_asked': 'Asking price', // Prix demandé
  'strings.mk_yours': 'Your price', // Votre prix
  'strings.mk_patience': 'Lady Ysolde’s patience', // Patience de Dame Ysolde
  'strings.mk_round': 'Round {n}', // Manche {n}
  'strings.mk_stop': 'Space or click: stop the needle', // Espace ou clic : arrêter l’aiguille
  'strings.mk_push': 'Push on (↑)', // Pousser encore (↑)
  'strings.mk_push_tip': 'Push on\nOne more round: the zone shrinks, the needle speeds up, and her patience wears thin.', // Pousser encore\nUne manche de plus : la zone rétrécit, l’aiguille file, et sa patience s’use.
  'strings.mk_deal': 'Deal! (Enter)', // Topez là ! (Entrée)
  'strings.mk_deal_tip': 'Deal\nThe bargain is struck at the price you won.', // Topez là\nL’affaire est conclue au prix obtenu.
  'strings.mk_perfect': 'Perfect! −{n}%', // Parfait ! −{n} %
  'strings.mk_good': 'Good! −{n}%', // Bien ! −{n} %
  'strings.mk_miss': 'Missed…', // Raté…
  'strings.mk_closed': 'The market closes: deal struck.', // Le marché ferme : affaire conclue.
  'strings.mk_gone': 'She’s leaving!', // Elle s’en va !
  'strings.mk_dear': 'dear', // cher
  'strings.mk_cheap': 'a steal', // donné
  'strings.fg_quality': 'Blade quality', // Qualité de la lame
  'strings.fg_chain': 'Chain ×{n}', // Chaîne ×{n}
  'strings.fg_heat': 'Heat', // Chaleur
  'strings.fg_bellows': 'Bellows', // Soufflet
  'strings.fg_bellows_tip': 'Bellows\nB, ↑ or right-click: stokes the fire.', // Soufflet\nB, ↑ ou clic droit : ranime le feu.
  'strings.fg_strike': 'Space or click: strike', // Espace ou clic : frapper
  'strings.fg_pump': 'B, ↑ or right-click: bellows', // B, ↑ ou clic droit : soufflet
  'strings.fg_ok': 'Good heat', // Bonne chauffe
  'strings.fg_perfect': 'Perfect!', // Parfait !
  'strings.fg_good': 'Good', // Bien
  'strings.fg_miss': 'Missed', // Raté
  'strings.fg_cold': 'Too cold!', // Trop froid !
  'strings.fg_hot': 'Too hot!', // Ça brûle !
  'strings.fg_early': 'Thin air', // Dans le vide
  'strings.bk_score': 'Golden loaves', // Pains dorés
  'strings.bk_burnt_n': 'Burnt', // Brûlés
  'strings.bk_keys': 'Keys 1 to {n}, or click an oven', // Touches 1 à {n}, ou clic sur un four
  'strings.bk_perfect': 'Perfect! +{n}', // Parfait ! +{n}
  'strings.bk_golden': 'Golden +{n}', // Doré +{n}
  'strings.bk_dark': 'Dark +{n}', // Foncé +{n}
  'strings.bk_pale': 'Too pale…', // Trop pâle…
  'strings.bk_burnt': 'Burnt!', // Brûlé !
  'strings.bk_reload': 'In it goes…', // On enfourne…
  'strings.bk_end_strikes': 'The batch burnt!', // La fournée a brûlé !
  'strings.bq_score': 'Parries', // Parades
  'strings.bq_hits_n': 'Hits taken', // Coups reçus
  'strings.bq_keys': 'Arrow keys, or click a side', // Flèches du clavier, ou clic sur un côté
  'strings.bq_quick': 'Quick! +{n}', // Vif ! +{n}
  'strings.bq_good': 'Parried +{n}', // Paré +{n}
  'strings.bq_wrong': 'Wrong side!', // Mauvais côté !
  'strings.bq_late': 'Hit!', // Touché !
  'strings.bq_feinted': 'Feint!', // Feinte !
  'strings.bq_end_hits': 'Too many hits taken!', // Trop de coups reçus !
  'strings.lg_score': 'Stones set', // Pierres posées
  'strings.lg_faults_n': 'Faults', // Fautes
  'strings.lg_keys': 'Keys 1 to 4, or click a stone', // Touches 1 à 4, ou clic sur une pierre
  'strings.lg_chain': 'Chain ×{n}', // Chaîne ×{n}
  'strings.lg_set': 'Set +{n}', // Posée +{n}
  'strings.lg_chained': 'In a chain! +{n}', // En chaîne ! +{n}
  'strings.lg_wrong': 'It doesn’t fit!', // Elle n’entre pas !
  'strings.lg_end_strikes': 'The wall came down!', // Le mur s’est écroulé !
  'strings.ex_title': 'Exploration', // Exploration
  'strings.ex_known': 'Known lands: {pct}%', // Terres connues : {pct} %
  'strings.ex_help': 'Beyond the village, the mist hides the land. Your buildings, your soldiers, the hero and the scouts lift it, and find what it hides.', // Hors du village, la brume cache les terres. Vos bâtiments, vos soldats, {g:le héros|l’héroïne} et les éclaireurs la lèvent, et trouvent ce qu’elle cache.
  'strings.ex_lvl': 'lv. {n}', // niv. {n}
  'strings.ex_far': '{n} tiles towards {dir}', // {n} cases vers {dir}
  'strings.ex_far_short': '{n} tiles · {dir}', // {n} cases · {dir}
  'strings.ex_trip': 'The hero’s expedition', // {g:Le héros|L’héroïne} en expédition
  'strings.ex_trip_out': 'On the way to {name}', // En route vers {name}
  'strings.ex_trip_there': 'On site: {name}', // Sur place : {name}
  'strings.ex_trip_back': 'On the way back', // Sur le chemin du retour
  'strings.ex_trip_none': 'The hero is in the village. Choose a site and send the hero there.', // {g:Le héros|L’héroïne} est au village. Choisissez un lieu et envoyez-{g:le|la}.
  'strings.ex_trip_mission': 'The hero is on a mission and will set out on returning.', // {g:Le héros|L’héroïne} est en mission : {g:il|elle} partira à son retour.
  'strings.ex_open': 'Open the site', // Ouvrir le lieu
  'strings.ex_see_hero': 'Bring the view to the hero', // Amener la vue sur {g:le héros|l’héroïne}
  'strings.ex_recall': 'Return', // Rentrer
  'strings.ex_recall_tip': 'Call the hero back to the village\nOn arrival, the hero stands guard at the Town Hall again.', // Rappeler {g:le héros|l’héroïne} au village\n{g:Il|Elle} reprend sa garde devant l’hôtel de ville en arrivant.
  'strings.ex_arrived': '{hero} has arrived: {name}. Open Exploration (E).', // {hero} est {g:arrivé|arrivée} : {name}. Ouvrez l’Exploration (E).
  'strings.ex_home': '{hero} is back in the village.', // {hero} est de retour au village.
  'strings.ex_lost': 'The site can no longer be reached: {hero} turns home.', // Le lieu n’est plus accessible : {hero} rentre.
  'strings.ex_scouts': 'Scouts ({n}/{max} out)', // Éclaireurs ({n}/{max} dehors)
  'strings.ex_scout_help': 'Choose a direction: they set out from the Town Hall, lift the mist along the way, then return. Each sending goes farther.', // Choisissez une direction : ils partent de l’hôtel de ville, lèvent la brume sur leur chemin, puis rentrent. Chaque envoi va plus loin.
  'strings.ex_scout_dir': 'Towards {dir}', // Vers {dir}
  'strings.ex_scout_dist': 'up to {n} tiles', // jusqu’à {n} cases
  'strings.ex_scout_cheap': 'Cheapest:', // Le moins cher :
  'strings.ex_scout_tip': 'Scouts towards {dir}\nThey walk {n} tiles, then return ({time}).', // Éclaireurs vers {dir}\nIls marchent {n} cases, puis rentrent ({time}).
  'strings.ex_scout_busy': 'Scouts have already gone that way.', // Des éclaireurs sont déjà partis par là.
  'strings.ex_scout_full': 'All your scouts are out ({max}).', // Tous vos éclaireurs sont dehors ({max}).
  'strings.ex_scout_end': 'That way, all is known up to the sea.', // Par là, tout est connu jusqu’à la mer.
  'strings.ex_scout_all': 'All is known, in every direction.', // Tout est connu, dans toutes les directions.
  'strings.ex_scout_out': 'Towards {dir} · back in {time}', // Vers {dir} · retour dans {time}
  'strings.ex_scout_sent': 'The scouts set out towards {dir}.', // Les éclaireurs partent vers {dir}.
  'strings.ex_scout_back': 'The scouts sent towards {dir} are back: {found}.', // Les éclaireurs partis vers {dir} sont rentrés : {found}.
  'strings.ex_scout_found1': 'one site found', // un lieu trouvé
  'strings.ex_scout_found': '{n} sites found', // {n} lieux trouvés
  'strings.ex_scout_found0': 'nothing new, but the map grows', // rien de neuf, mais la carte s’agrandit
  'strings.ex_dirs_short[0]': 'E', // E
  'strings.ex_dirs_short[1]': 'SE', // SE
  'strings.ex_dirs_short[2]': 'S', // S
  'strings.ex_dirs_short[3]': 'SW', // SO
  'strings.ex_dirs_short[4]': 'W', // O
  'strings.ex_dirs_short[5]': 'NW', // NO
  'strings.ex_dirs_short[6]': 'N', // N
  'strings.ex_dirs_short[7]': 'NE', // NE
  'strings.ex_places': 'Sites found ({n})', // Lieux trouvés ({n})
  'strings.ex_none': 'No sites found yet. Send scouts: the first sites lie some forty tiles from the Town Hall.', // Aucun lieu trouvé pour l’instant. Envoyez des éclaireurs : les premiers lieux sont à une quarantaine de cases de l’hôtel de ville.
  'strings.ex_found': 'Site discovered towards {dir}: {name} ({lvl})', // Lieu découvert vers {dir} : {name} ({lvl})
  'strings.ex_see': 'View', // Voir
  'strings.ex_see_tip': 'Bring the view to this site', // Amener la vue sur ce lieu
  'strings.ex_open_tip': 'Open this site’s page', // Ouvrir la page de ce lieu
  'strings.ex_back': '‹ All sites', // ‹ Tous les lieux
  'strings.ex_go': 'Go there', // Y aller
  'strings.ex_go_tip': 'Send the hero\nJourney: {time}. Meanwhile, the village is left unguarded.', // Envoyer {g:le héros|l’héroïne}\nTrajet : {time}. Pendant ce temps, {g:il|elle} ne garde plus le village.
  'strings.ex_coming': 'On the way', // En route
  'strings.ex_fight': 'Fight', // Combattre
  'strings.ex_gift': 'Offer', // Offrir
  'strings.ex_claim': 'Claim', // Revendiquer
  'strings.ex_deliver': 'Deliver', // Livrer
  'strings.ex_deepen': 'Dig deeper', // Creuser
  'strings.ex_done_btn': 'Explored', // Explorée
  'strings.ex_need_hero': 'The hero must go there.', // {g:Le héros|L’héroïne} doit s’y rendre.
  'strings.ex_go_time': 'Journey: {time}.', // Trajet : {time}.
  'strings.ex_foe_scale': 'strength +{pct}%', // force +{pct} %
  'strings.ex_lair_back': '{name} is teeming again ({lvl}).', // {name} est repeuplée ({lvl}).
  'strings.ex_asks': 'What it takes', // Ce qu’il faut
  'strings.ex_gives': 'What you gain', // Ce qu’on y gagne
  'strings.ex_foes': 'Who lurks there', // Qui s’y trouve
  'strings.ex_st_ruin': 'Raiders camp here', // Des pillards y campent
  'strings.ex_st_done': 'Explored', // Explorée
  'strings.ex_st_here': 'The hero is here', // {g:Le héros|L’héroïne} est sur place
  'strings.ex_st_coming': 'The hero is on the way', // {g:Le héros|L’héroïne} est en route
  'strings.ex_st_lair': 'Monsters nest here', // Des monstres y nichent
  'strings.ex_st_lair_again': 'Teeming again (cleared {n} times)', // Repeuplée ({n} fois vidée)
  'strings.ex_st_lair_wait': 'Empty · teeming again in {time}', // Vide · repeuplée dans {time}
  'strings.ex_st_hamlet': 'Awaits a first gift', // Attend un premier présent
  'strings.ex_st_route': 'Friendship {n} · {gold} gold/min', // Amitié {n} · {gold} or/min
  'strings.ex_st_deposit': 'To claim', // À revendiquer
  'strings.ex_st_mine': 'Depth {n} · {what}/min', // Profondeur {n} · {what}/min
  'strings.ex_blocked': 'Covered over: nothing to do here for now', // Recouvert : rien à y faire pour l’instant
  'strings.ex_reward': 'Loot: {what}', // Butin : {what}
  'strings.ex_relic': 'About one time in {n}, a relic as well: {what}.', // Une fois sur {n} environ, une relique en plus : {what}.
  'strings.ex_relic_found': 'A relic in the ruins! {what}', // Une relique dans les ruines ! {what}
  'strings.ex_lair_rule': 'Once cleared, it fills again in {time}, one level stronger. A rune shard every {n} victories.', // Vidée, elle se repeuple en {time}, un niveau plus forte. Un éclat runique toutes les {n} victoires.
  'strings.ex_lair_count': 'Already cleared {n} times.', // Déjà vidée {n} fois.
  'strings.ex_gift_rule': 'The first gift opens the route: {gold} gold per minute.', // Le premier présent ouvre la route : {gold} or par minute.
  'strings.ex_route_now': 'Route open: {gold} gold per minute (friendship {n}).', // Route ouverte : {gold} or par minute (amitié {n}).
  'strings.ex_route_next': 'Next delivery: friendship {n}, {gold} gold per minute.', // Prochaine livraison : amitié {n}, {gold} or par minute.
  'strings.ex_route_open': 'Trade route opened with {name}: +{gold} gold per minute.', // Route de commerce ouverte avec {name} : +{gold} or par minute.
  'strings.ex_route_up': '{name}: friendship {n}, the route brings {gold} gold per minute.', // {name} : amitié {n}, la route rapporte {gold} or par minute.
  'strings.ex_vein': 'What lies there: {name}', // Ce qui s’y trouve : {name}
  'strings.ex_claim_rule': 'Once claimed, it sends {what} per minute.', // Revendiqué, il envoie {what} par minute.
  'strings.ex_mine_now': 'It sends {what} per minute (depth {n}).', // Il envoie {what} par minute (profondeur {n}).
  'strings.ex_mine_next': 'Dug deeper: depth {n}, {what} per minute.', // Creusé encore : profondeur {n}, {what} par minute.
  'strings.ex_claimed': '{name} belongs to the village: +{what} per minute.', // {name} est au village : +{what} par minute.
  'strings.ex_deepened': '{name}: depth {n}, {what} per minute.', // {name} : profondeur {n}, {what} par minute.
  'strings.ex_idle_note': 'Routes and deposits pay out even while the game is closed.', // Les routes et les gisements rapportent aussi quand le jeu est fermé.
  'strings.ex_pop_ruin': 'a ruin explored', // une ruine explorée
  'strings.ex_pop_lair': 'a lair cleared', // une tanière vidée
  'strings.ex_pop_relic': 'a relic brought back', // une relique rapportée
  'strings.ex_won_lair': '{name} is cleared. It will fill again in {time}.', // {name} est vidée. Elle se repeuplera dans {time}.
  'strings.ex_won_ruin': '{name} is explored.', // {name} est explorée.
});
