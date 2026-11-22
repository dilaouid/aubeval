# Nouveaux lieux et mini-jeux — design

## Pourquoi
Troisième des quatre chantiers de contenu. Le joueur trouve le jeu répétitif une fois Capitale : il
veut plus de choses à faire dans le village, de nouveaux mini-jeux, et un bâtiment dont Aveline
serait la tenancière. Trois lieux où entrer existent (café, halle, forge) ; trois personnages ont un
portrait mais pas de lieu : Mélisande, la capitaine Hilde, Aveline.

## Ce qui a été décidé avec le joueur
- **Trois nouveaux lieux** : la Boulangerie (Mélisande), la Caserne (Hilde), et un bâtiment neuf,
  **la Loge des bâtisseurs** (Aveline).
- **Le moule des trois lieux existants**, tel quel : on entre en plein écran, le tenancier parle,
  propose un jeu d'une demi-minute, médaille bronze / argent / or, popularité du héros, un cadeau
  de quelques minutes, une série de victoires qui durcit le jeu, une attente entre deux parties.
- **Chaque cadeau touche un autre pan du jeu** que les cadeaux actuels (prix du marché, attaque du
  héros, vitesse de forge).
- **Trois gestes que les jeux actuels n'ont pas** (le café est de mémoire, la halle de sang-froid,
  la forge de rythme) : jongler, réflexe, coup d'œil. Le joueur a dit des trois jeux ci-dessous :
  « ça me va pour le moment ». Ils restent ajustables après essai.

## Buts, non-buts, anti-buts
- But : les trois lieux se jouent de bout en bout, à la souris comme au clavier, en français,
  anglais et espagnol, sur une partie neuve comme sur une sauvegarde existante.
- But : les trois cadeaux agissent là où ils le disent, et l'affichage (barre de construction,
  panneaux) montre le chiffre réellement payé ou appliqué.
- Non-but : toucher aux règles ou à l'équilibre des trois jeux existants ; un lieu pour Maître
  Odon ; de la musique nouvelle ; des jeux d'un autre format que le moule (c'est le chantier 4) ;
  les outils d'enregistrement de GIF (`tools/record-game.js`, `tools/make_gifs.py`).
- Anti-but : un jeu qui se joue comme un des trois existants sous un autre habillage ; un cadeau
  qui permet de gagner de l'or ou des ressources en boucle (acheter au rabais, démolir, recommencer) ;
  une sauvegarde existante qui casse ou se dégrade ; du français qui reste dans les versions
  anglaise et espagnole ; un lieu qui plante parce qu'une image n'est pas encore chargée.

## Approches envisagées
1. **Lieu par lieu** (retenue ; le joueur a laissé la main sur le « comment »). Chaque lieu est
   terminé avant le suivant : Boulangerie, Caserne, puis Loge (en dernier : il faut aussi créer le
   bâtiment). Dans chaque lieu, le jeu vient d'abord avec des dessins provisoires peints en code,
   puis viennent les images, les textes et les traductions.
   **Le joueur a choisi : on enchaîne sans s'arrêter.** Dès qu'un jeu est jouable, on lui donne son
   adresse d'essai (`?scene=venue&venue=<id>` et la partie normale) et le travail continue ; ses
   retours sont repris ensuite. Aucun point d'arrêt n'attend sa réponse.
2. Couche par couche (toutes les images, puis les trois jeux, puis les cadeaux, puis les textes).
   Écartée : rien n'est jouable avant la fin, et le joueur découvre les jeux en dernier.
3. Trois maquettes jetables d'abord, puis reconstruire. Écartée : l'approche 1 donne le même essai
   précoce sans rien jeter.

## Comment les lieux marchent aujourd'hui (ce sur quoi on bâtit)
- `data/venues.js` : un lieu par entrée de `DATA.venues`, dont la clé **est** le type de bâtiment
  (`Venue.has` teste `V[b.kind]`) ; `DATA.venueOrder` ; `DATA.venueBuffs` (les cadeaux).
- `js/venue.js` : l'hôte (entrée, dialogue, compte à rebours, résultat, popularité, cadeau, série,
  attente, sauvegarde `state.venue`). `Venue.buff(clé)` rend la part du cadeau en cours, 0 sinon.
- `js/minigames.js` : une fabrique par jeu dans `MAKE`. Une fabrique reçoit
  `{ level, d, react(kind, word), away() }` et rend un objet avec `score`, `done`, `lost`, `why`,
  `update(dt, input)`, `draw()`, `auto(dt, bot)`. `auto` est le joueur automatique des aperçus
  (`?scene=venue&venue=<id>&game=1`).
- Réglages globaux dans `config.js` (`venue_wait` 240 s, `venue_buff_time` 300 s, `venue_streak_max` 10).

## Les trois lieux

Les chiffres ci-dessous (médailles, parts des cadeaux, durées) sont des valeurs de départ. Le
constructeur les règle avec le joueur automatique pour tenir les critères de la section « Ce qui
doit être vrai à la fin », et les range comme pour les jeux existants : le contenu dans
`data/venues.js`, les boutons de réglage dans `config.js` (préfixes `bakery_`, `barracks_`, `lodge_`).
Chaque jeu dure 36 secondes, comme le café.

### 1. La Boulangerie — « La fournée » (jongler)
Tenancière : Mélisande (`baker`). Bâtiment existant `bakery` (non unique : l'état du lieu est
commun à toutes les boulangeries, comme pour la forge).

- Des fours côte à côte, trois au départ. Dans chacun un pain cuit : sa jauge passe de **pâle** à
  **doré** puis **foncé**, et il **brûle** au bout. Chaque pain a sa vitesse (baguette rapide, miche
  moyenne, brioche lente).
- Touche du four (1 à 5) ou clic dessus : on sort le pain. Doré : 2 points, 3 s'il est sorti au
  cœur de la fenêtre dorée (« Parfait ! »). Foncé : 1 point. Pâle : 0 point et le pain est perdu.
  Le four se regarnit seul après un court instant.
- Un pain qui brûle est une faute. À la quatrième faute, la fournée est perdue (jeu perdu).
- Série : cuisson plus rapide, fenêtre dorée plus étroite, un four de plus toutes les trois
  victoires (cinq au plus), la brioche à partir de la deuxième victoire.
- Score : « pains dorés ». Médailles de départ : 24 / 38 / 52.
- Cadeau `rise`, « Pain chaud » : *la satisfaction des maisons monte {n} % plus vite* ;
  0 / 20 / 40 / 60 % selon la médaille. Il se branche dans `City.mealSat` (`js/city.js`), sur la
  seule branche positive, à côté de `bonus('sat')`. Pas sur l'horloge des repas : les maisons
  mangeraient plus vite.

### 2. La Caserne — « Parade ! » (réflexe)
Tenancière : la capitaine Hilde (`captain`). Bâtiment existant `barracks` (unique).

- Hilde annonce un côté (haut, bas, gauche, droite) : une recrue porte un coup d'entraînement qui
  arrive de ce côté au bout d'un délai visible (un anneau qui se referme).
- Flèche du clavier, ou clic sur le côté : on lève le bouclier. Bon côté avant l'impact : 2 points,
  3 si c'est dans le premier tiers du délai (« Vif ! »). Mauvais côté, ou trop tard : touché.
- Au cinquième coup reçu, l'exercice est perdu.
- Série : délai plus court (avec un plancher). À partir de deux victoires, des **feintes** : le
  côté annoncé change à mi-délai, et qui a déjà paré l'ancien côté est touché. À partir de quatre
  victoires, des coups doubles (deux côtés à la suite).
- Score : « parades ». Médailles de départ : 30 / 45 / 60.
- Cadeau `soldier`, « Bien drillés » : *les soldats frappent {n} % plus fort* ; 0 / 10 / 20 / 30 %.
  Il multiplie les dégâts portés par les soldats (`js/units.js`, les deux appels `Raid.hurt` et
  `Camp.hit`) et le chiffre d'attaque montré dans le panneau de la caserne (`js/screens.js`). Pas
  leur vie : `maxHp` est lu en direct, une vie qui retomberait en plein combat ferait bouger les barres.
- Le cadeau dure cinq minutes comme les autres. Le cor du raid sonne 60 secondes avant l'arrivée
  (`raid_warning`) et les lieux restent ouverts pendant l'alerte : le bon moment pour l'exercice est
  donc au son du cor. Une des répliques de Hilde le dit. (Vérifié : le compte à rebours du raid ne
  tourne pas tant qu'on est dans un lieu, donc l'exercice ne mange pas l'alerte.)
  *(Mon choix. J'avais dit au joueur « au prochain raid » ; un cadeau qui attendrait le raid
  sortirait du moule et servirait sans limite contre le camp gobelin.)*

### 3. La Loge des bâtisseurs — « La bonne pierre » (coup d'œil)
Tenancière : Aveline (`guide`). **Bâtiment neuf**, type `lodge`.

- Le bâtiment : 2 × 2, unique, onglet « city » de la barre de construction, se débloque au rang
  **Ville** (`unlock: { rank: 2 }`), coût de départ `{ planks: 60, stone: 60, gold: 150 }`,
  `beauty: 1`, fenêtres éclairées (`glow`), `keeper: 'guide'`. Il ne produit rien et ne rend aucun
  service aux maisons : on y entre, c'est tout. Quatre aspects (niveaux 1, 5, 10, 15) comme les
  autres bâtiments. *(Amendé par `2026-11-22-loge-utile-design.md` : la Loge a maintenant des effets permanents.)*
- **Ses niveaux allongent son cadeau (choix du joueur).** Chaque niveau de la Loge au-dessus du
  premier ajoute 20 secondes à « Plans d'Aveline » (réglage `lodge_level_time` dans `config.js`) :
  5 minutes au niveau 1, 9 min 40 au niveau 15. La durée est fixée au moment où le cadeau est
  gagné, d'après le niveau de la Loge à cet instant. Le panneau d'amélioration de la Loge l'annonce
  à chaque niveau (pas de « Niveau suivant : » vide), et la carte du jeu dans le lieu montre la
  durée réelle. Le rabais lui-même ne dépend pas du niveau.
- Aveline entre dans `DATA.keepers` (nom, titre « Maîtresse bâtisseuse », répliques de panneau).
  `DATA.tutorial.guide` garde les siens : deux lignes de traduction pour le même nom, acceptées.
- Le jeu : un mur en cours, avec un trou d'une forme donnée (quatre cases au départ, sur une petite
  grille). Quatre pierres taillées sont proposées ; **une seule** entre dans le trou.
- Touche 1 à 4 ou clic : la bonne pierre se pose (1 point, et une chaîne de bonnes pierres posées
  vite vaut davantage), le mur monte d'un rang et un nouveau trou paraît. Une mauvaise pierre est
  une faute ; à la quatrième, le mur s'écroule (jeu perdu).
- Série : formes plus grandes (jusqu'à sept cases), pierres présentées tournées d'un quart de tour
  dès la première victoire, et dès la troisième une des fausses pierres est le **miroir** de la bonne.
- Score : « pierres posées ». Médailles de départ : 14 / 22 / 30.
- La logique des pierres est pure et vit à part du dessin : tirer une forme, fabriquer trois
  fausses pierres, dire si une pierre entre dans un trou (rotation permise, retournement interdit).
  À tout niveau, exactement une des quatre pierres entre.
- Cadeau `build`, « Plans d'Aveline » : *constructions et améliorations {n} % moins chères* ;
  0 / 5 / 10 / 15 %. Il entre dans `cost(kind)` et `upgradeCost(b)` de `js/village.js`, que la barre
  de construction, les panneaux, le tutoriel et le paiement lisent tous en direct. Il ne touche ni
  les grands chantiers — leurs étapes (`City.stageCost`) **et** leurs fondations (`cost` d'un
  bâtiment `monument`) —, ni la montée de classe des maisons, ni les chemins, ni les réparations.
  *(Mon choix : garder l'équilibre des grands chantiers.)*

## Ce que l'hôte doit apprendre
Ajouter trois entrées ne suffit pas ; l'hôte suppose aujourd'hui trois lieux à plusieurs endroits.
- **Jeux** : `MAKE` reçoit les trois nouvelles fabriques. *(Mon choix : chaque nouveau jeu dans son
  fichier, `js/minigame-<lieu>.js`, qui s'inscrit auprès de `Minigames` ; `Minigames` expose pour
  cela ses aides communes — en-tête, boîte de score, petites images, textes volants. Les trois jeux
  existants ne bougent pas.)*
- **Intérieurs** : `backdrop(id)` appelle `PAINT[id]` sans garde, et `AMBIENT[id]` quand l'image
  manque. Un lieu sans intérieur peint doit avoir une pièce peinte simple et commune (mur, sol,
  comptoir) le temps que son image charge. Les trois nouveaux lieux sont livrés avec leur image.
- **Tenancier** : l'image en grand `venue.char.<keeper>` ; à défaut la bande de portraits 64 × 64,
  qui existe pour `baker`, `captain` et `guide`.
- **Sauvegarde** : les trois identifiants entrent dans `DATA.venueOrder` ; `Venue.adopt` complète
  alors seul une sauvegarde existante. Sans cela `state.venue` se remplit de `NaN`.
- **Musique** : `js/music.js` n'a de piste que pour trois lieux et demanderait
  `assets/music/undefined`. Un lieu sans piste propre joue celle d'un autre lieu. *(Mon choix :
  boulangerie → piste du café, caserne → piste de la forge, loge → piste de la halle.)*
- **Cadeaux en cours** : la boîte de gauche du lieu liste une ligne par cadeau ; huit cadeaux
  peuvent maintenant courir ensemble. Elle ne doit jamais déborder (au constructeur de choisir :
  lignes plus serrées, ou les plus proches de leur fin d'abord et « + n »).
- **Manifeste** : les listes `venue.bg.*` et `venue.char.*` passent à six ; `iso.lodge` par `isoLooks`.
- **Tutoriel** : la leçon des lieux dit « Trois bâtiments… » et nomme les trois jeux, en trois
  langues : elle devient générale et couvre les six lieux et les six jeux. Aveline présente sa Loge
  dans une leçon à elle (`b:lodge`). Le vérificateur (`js/tuto-check.js`) ne doit signaler aucun
  nouveau « rien ne couvre ».
- **Commandes de cité** : la commande « jouer à un jeu » tire parmi les lieux où l'on peut entrer ;
  elle doit proposer les nouveaux sans autre changement (l'identifiant d'un lieu est un type de bâtiment).
- **Traductions** : tous les textes nouveaux en anglais et en espagnol. `tools/i18n.js` n'extrait que
  les champs de sa liste `FIELDS` : réutiliser les noms de champs existants (`glad`, `cross`, `lost`,
  `chain`, `after`…) ou y ajouter les nouveaux, sinon le texte reste français sans qu'aucun contrôle
  le voie.

## Les images (PixelLab, recettes déjà éprouvées)
- Trois décors intérieurs 640 × 360 : le fournil, la cour d'exercice de la caserne, l'atelier de la Loge.
- Trois personnages en grand, bande de 8 images 160 × 160 : Mélisande, Hilde, Aveline, à partir de
  leur portrait existant pour que le visage reste le même.
- La Loge vue du village : niveau 1, puis ses états 5, 10 et 15 (`tools/make_buildings.py`).
- Les objets des jeux (pains, fours, bouclier, pierres) sont peints en code, comme la tasse et
  l'enclume des jeux existants. Rien n'est généré pour eux.
- Chaque image est notée dans un `ids.tsv`, et le joueur voit une planche de chaque lieu.
- Ordre de grandeur : 200 générations, sur 4465 restantes.

## Ce qui doit être vrai à la fin
1. Sur une sauvegarde d'avant le chantier qui a une boulangerie et une caserne : on y entre dès le
   chargement, rien n'est perdu, les trois lieux anciens gardent série, record et attente.
2. Chaque jeu se joue entièrement au clavier et entièrement à la souris, se met en pause
   (Échap), s'abandonne, et se termine seul au bout de son temps.
3. Le joueur automatique sans erreur obtient l'or au niveau 0 et au moins le bronze au niveau 10
   (le jeu reste gagnable au bout de la série) ; un joueur qui ne fait rien perd.
4. Avec chaque cadeau en or : la satisfaction d'une maison nourrie monte de 60 % de plus par repas ;
   un soldat inflige 30 % de plus ; le prix affiché et payé d'un bâtiment et d'une amélioration baisse
   de 15 %. Sans cadeau, tous ces chiffres sont exactement ceux d'avant.
5. Aucun bâtiment n'est remboursé à la démolition plus cher qu'il n'a été payé avec le cadeau
   `build` en or (`refund_pct` vaut 0,7 du prix de base aujourd'hui ; vérifié : le remboursement
   ne dépend ni du niveau ni du nombre déjà bâti). Le prix des fondations et des étapes d'un grand
   chantier est le même avec et sans le cadeau.
5 bis. « Plans d'Aveline » gagné avec une Loge de niveau 1 dure 300 s ; de niveau 15, 580 s. Les
   cinq autres cadeaux durent toujours `venue_buff_time`.
6. Un lieu dont le décor ou le personnage n'est pas chargé s'affiche quand même, sans erreur.
7. `node tools/i18n.js check` est propre ; les tests existants passent ; un test nouveau couvre au
   moins : la cohérence des six lieux (bâtiment, tenancier, fabrique, quatre valeurs par cadeau et
   par popularité, médailles croissantes), la logique des pierres de la Loge sur beaucoup de tirages,
   les trois branchements de cadeaux, et une partie entière de chaque nouveau jeu jouée sans écran par
   le joueur automatique.

## Laissé au constructeur
- Le détail visuel de chaque jeu (où sont les fours, la forme du bouclier, l'allure du mur), dans
  la mise en page des jeux existants (panneau du bas, en-tête et score en haut).
- Les répliques des trois tenancières (accueil, prêt, attente, bavardage, conseils, pendant le jeu,
  après le jeu), dans le ton de leurs répliques de panneau actuelles, accordées au héros par
  `{g:masculin|féminin}` là où elles parlent de lui.
- Les réglages fins (vitesses, fenêtres, médailles, coût de la Loge) tant que les critères tiennent.
- La façon de rendre la logique des jeux testable sans écran.
- Où placer le bouton « Entrer » dans le panneau de la caserne, déjà occupé par l'entraînement.
