# Soldats façon RTS : mort, file de formation, ralliement — design court

## Pourquoi
Les soldats sont trop forts, face aux raids comme face au camp gobelin : un soldat « à terre » se
relève tout seul 25 s plus tard, et toute la garde est remise sur pied à la fin d'un raid. Rien ne
se perd jamais. Et les former est pénible : la caserne n'a qu'une place, il faut cliquer, attendre
la recrue, recliquer. On veut une armée qui se perd et se reforme, comme dans un jeu de stratégie
en temps réel.

Ce chantier est le premier de trois. Les deux autres ne sont pas ici : des raids qui montent en
puissance puis deviennent « à la demande », et un quartier militaire complet (autre branche, quand
il y aura de quoi dessiner ses bâtiments).

## Buts / non-buts
- But : un soldat à 0 PV est perdu pour de bon ; le reformer coûte son prix et son temps.
- But : commander plusieurs soldats d'un coup, sans revenir à la caserne entre deux.
- But : les recrues vont seules là où le joueur veut son armée.
- Non-but : toucher aux raids (leur force, leur rythme) ou aux camps. C'est le chantier suivant.
- Non-but : nouveaux bâtiments, nouveaux sprites.
- Anti-but : une mort qui punit le village lui-même. L'habitant du soldat mort redevient libre :
  on perd l'or, le pain et le temps, pas la population. Le jeu reste sans game over.

## Approches envisagées
1. **File de formation** (retenue) : plusieurs recrues commandées à la suite, payées à la commande,
   remboursées à l'annulation.
2. Effectif cible (« 8 miliciens ») que la caserne complète seule (écartée par le joueur : les
   stocks partent sans qu'il le décide, un raid perdu peut affamer le village).
3. Garder le « à terre » avec un repos plus long (écartée : ne retire aucun clic, et ne coûte rien).

## Design
**Mort.** À 0 PV le soldat disparaît (`state.units`), avec un mot au-dessus de lui (« Tombé ! »).
Son habitant est de nouveau libre, comme avec le bouton « − ». Plus de repos à la caserne, plus de
remise sur pied en fin de raid : les survivants sont seulement soignés. Le réglage
`soldier_recover` disparaît. Une sauvegarde qui a des soldats « à terre » les retrouve debout.
Le bilan d'un raid dit combien de soldats sont tombés.

**Moins forts.** `soldier_level_step` passe de 0,10 à 0,05 : chaque niveau de caserne donne +5 %
de vie et de dégâts au lieu de +10 %. À régler en jouant ; les textes lisent déjà ce réglage.

**File de formation.** La caserne garde sa recrue à l'exercice (`b.train`, inchangé) et gagne une
file d'attente (`b.queue`, les sortes commandées). « Former » ajoute à la file ; Maj + clic en
ajoute 5 (ou autant que possible). Chaque recrue est payée à la commande et retient un habitant
libre. La file tient `barracks_queue` recrues (réglage, défaut 8) en plus de celle à l'exercice.
Le panneau montre la file en cases : la première avec sa barre, les suivantes en attente ; un clic
sur une case l'annule et rend son prix. Une caserne endommagée garde sa file, à l'arrêt.

```
Recrues                                   libres : 4
[Milicien ▓▓▓░] [Milicien] [Archer] [Archer]     4 / 9
```

**Point de ralliement.** Panneau de la caserne ouvert et aucun soldat choisi : un clic droit sur
la carte y plante le point de ralliement (`b.rally`). Les recrues s'y rendent en sortant, en rangs.
Un drapeau le montre tant que la caserne est choisie ; un bouton du panneau l'enlève (les recrues
restent alors devant la caserne, comme aujourd'hui). « Rappel » ramène toujours devant la caserne.

## Laissé au constructeur
Les mots exacts (FR, EN, ES), la forme des cases et du drapeau (avec les sprites déjà là), les
phrases du tutoriel et des descriptions qui parlent de soldats « à terre », le détail du compteur
de pertes d'un raid.
