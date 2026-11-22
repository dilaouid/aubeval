# Un héros au choix : quatre visages, et des textes qui s'accordent — design

## Pourquoi
Aujourd'hui tout le monde joue Aldric : un seul sprite de combat, une seule figurine sur la carte,
aucun portrait. Dans le menu du héros, on voit son sprite de combat, petit et immobile, que le
joueur trouve moche. Les crédits PixelLab sont revenus : on veut choisir son héros parmi quatre
(deux hommes, deux femmes) en créant une partie, et le voir partout avec son portrait animé.

C'est le premier de quatre chantiers. Les trois autres ne sont pas ici : les sprites manquants
(paliers de bâtiments, chefs de guerre, décor de boss), de nouveaux lieux avec leurs mini-jeux, et
tout ce qui vient après la Capitale (factions, ruines, unités, civilisation gobeline).

## Buts / non-buts
- But : à la création d'une partie, choisir un héros parmi quatre ; le choix change son portrait,
  sa figurine sur la carte et son sprite de combat.
- But : le menu du héros montre le portrait animé du héros choisi, à la place du sprite de combat.
- But : une partie déjà commencée peut changer d'apparence sans être effacée.
- But : quand le héros est une femme, tous les textes qui parlent de lui s'accordent, en français,
  en anglais et en espagnol.
- Non-but : des héros qui se jouent différemment. Mêmes chiffres, mêmes cartes, mêmes armes.
- Non-but : un sprite de combat par palier d'arme. Chaque héros a une seule image de combat,
  comme Aldric aujourd'hui (les paliers relèvent du chantier « sprites manquants »).
- Non-but : refaire les images d'Aldric qui existent (combat, carte). Seul son portrait est neuf.
- Non-but : mettre à jour le README, ses captures, ou le dossier du prototype d'origine.
- Anti-but : une sauvegarde existante qui change de héros toute seule ou perd quoi que ce soit.
- Anti-but : un nom tapé par le joueur écrasé parce qu'il a changé de héros.
- Anti-but : une héroïne appelée « il » ou « he » quelque part, ou un texte accordé dans une langue
  et pas dans une autre.

## Contraintes
- Pas de build, pas de dépendance : du HTML et du JavaScript chargés tels quels.
- L'écran fait 1280 × 720 unités logiques ; le nom se tape dans un vrai champ posé sur le canevas
  (`js/screens.js`, `NAME_BOX`), qui garde les touches du clavier pour lui.
- Les sauvegardes (version 4) doivent continuer de se charger. `Save.adopt()` complète déjà tout
  champ manquant de `state.hero` à partir de `Village.fresh()` : pas de changement de version.
- `node tools/i18n.js check` et `node tools/test-i18n.js` doivent passer à la fin.
- Prérequis : deux chantiers finis attendent, non commités, dans la copie de travail de
  `feat/soldats-rts` : les soldats et les paliers de la forge (avec `tools/test-forge.js`, leurs
  specs et leurs plans). Ils touchent les mêmes fichiers que celui-ci (textes, couches de langue,
  `js/screens.js`). Proposition du concepteur, à confirmer par le joueur : le constructeur les
  commite d'abord sur `feat/soldats-rts`, en deux commits (forge, puis soldats), après avoir fait
  passer `node tools/test-forge.js`, `node tools/test-i18n.js` et `node tools/i18n.js check` ;
  `feat/heros-au-choix` part de là. Les trois scripts `tools/make_backdrop.py`,
  `make_favicon.py` et `make_social.py`, non suivis eux aussi, ne sont pas touchés.

## Approches envisagées
**Dessiner les héros**
1. **Le portrait d'abord** (retenue) : une planche de portraits candidats, le joueur choisit, puis
   le sprite de combat et la figurine sont faits d'après le portrait choisi. Le portrait porte le
   plus de détail : l'identité reste la même partout.
2. Partir de la figurine de carte (écartée : 32 pixels, trop peu pour en tirer un visage).

**Brancher l'apparence**
1. **Chaque héros a ses propres images** (retenue), et le jeu demande « l'image du héros choisi ».
   L'écran de création doit de toute façon en montrer quatre à la fois.
2. Remplacer l'image d'Aldric au chargement par celle du héros choisi (écartée : moins de lignes,
   mais impossible d'en montrer quatre côte à côte, et un état caché de plus).

**Accorder les textes**
1. **Les deux formes dans la même ligne** (retenue) : `{hero} est {g:arrivé|arrivée}`. Une ligne
   par texte dans les trois langues ; l'outil de vérification continue de marcher.
2. Une deuxième ligne par texte pour le féminin (écartée : deux fois plus de textes, qui divergent).
3. Tout reformuler au neutre (écartée : impossible pour « le héros », et pour « he » en anglais).

Le joueur a laissé le choix du « comment » : ces trois choix sont ceux du concepteur.

## Design

### Les quatre héros
`DATA.heroes` (dans `data/world.js`, à côté de `DATA.hero`) : `id`, `name` (le nom proposé),
`g` (`'m'` ou `'f'`). Tous portent l'épée, pour rester cohérents avec la forge.

| id | Nom proposé | Genre | Apparence |
|---|---|---|---|
| `aldric` | Aldric | m | jeune chevalier, cheveux bruns courts, harnois d'acier, cape rouge, bouclier bleu marine à ombon doré (l'actuel) |
| `tancrede` | Tancrède | m | peau bronzée, cheveux brun foncé mi-longs, barbe pleine, harnois d'acier à liserés de bronze, cape bleue, bouclier doré (redessiné le 2026-11-22 à la demande du joueur : il était d'abord à la peau foncée) |
| `isaure` | Isaure | f | rousse, longue tresse, harnois d'acier, cape blanche, bouclier vert |
| `maelle` | Maëlle | f | cheveux noirs courts, armure d'acier noirci, cape or, bouclier noir |

Les capes sont rouge, bleue, blanche et or exprès : sur la carte, à 32 pixels, c'est la cape qui
distingue le héros, et le vert et le violet sont déjà les couleurs des gobelins, des brutes et des
chamans. (Choix du concepteur ; le joueur avait vu « cape verte » et « cape violette ».)

Le choix est gardé dans `state.hero.look` (un `id`), `'aldric'` par défaut : une sauvegarde
existante garde donc Aldric. Comme le reste du héros, il survit à un nouveau départ.

### Les images
Trois par héros, sous des identifiants propres :

| Identifiant | Fichier | Forme |
|---|---|---|
| `portrait.hero.<id>` | `assets/sprites/portraits/hero_<id>.png` | bande de 7 cases de 64 × 64, comme les commerçants |
| `iso.unit.hero.<id>` | `assets/sprites/iso/unit_hero_<id>.png` | planche de 7 colonnes × 8 rangs, comme `unit_hero.png` |
| `hero.battle.<id>` | `assets/sprites/hero_battle_<id>.png` | une image de 44 × 50 pixels d'art, livrée telle quelle ou agrandie 4 fois (176 × 200) comme `hero_battle.png` |

Aldric garde ses deux fichiers actuels (`unit_hero.png`, `hero_battle.png`), déclarés sous ses
nouveaux identifiants. Une image qui n'a pas fini de charger, ou qui manque, laisse voir celle
d'Aldric, et à défaut le dessin fait en code.

Le héros choisi s'affiche partout où Aldric s'affiche aujourd'hui :
- la carte : garde devant l'hôtel de ville, raids, assaut du camp, expéditions (`World.unitSprite`) ;
- le combat, et la vignette des cartes qui viennent du héros (`js/battle.js`, `js/cards.js`) ;
- l'écran titre : le héros de la sauvegarde s'il y en a une, sinon Aldric ;
- l'écran de création et le menu du héros (ci-dessous) ;
- la galerie `?scene=figures`, qui montre les quatre.

`?hero=<id>` dans l'adresse impose un héros en mode démo (`?demo=1`), pour les captures et les
vérifications, comme `crank` ou `elite` le font déjà.

### La fabrication des images (PixelLab)
Dans cet ordre, parce que chaque étape sert de modèle à la suivante :

1. **Portraits.** Des bustes de 64 × 64, de trois quarts, jusqu'à la taille, dans le style des
   portraits existants (donnés en référence de style : capitaine, boulangère, marchande, guide).
   Une planche de candidats par héros, Aldric compris ; le sien doit ressembler à son sprite de
   combat. **Le joueur choisit un buste par héros** avant d'aller plus loin. Chaque buste choisi
   est animé en boucle de 7 images : un clignement et une respiration, plus visibles que chez les
   commerçants (dont les portraits bougent à peine), sans que la silhouette se déplace.
2. **Sprites de combat**, pour Tancrède, Isaure et Maëlle : même pose qu'Aldric (tourné vers la
   droite, épée droite dans la main avant, bouclier au bras arrière), mêmes proportions, même
   contour sombre. `hero_battle.png` sert de référence pour la pose et le trait, le portrait
   choisi pour le visage et la tenue. Attention : ce fichier ne vient pas de PixelLab (un autre
   générateur, puis une mise à l'échelle) ; c'est un sprite de 44 × 50 agrandi 4 fois, à ramener
   à sa taille d'origine avant de le donner en référence. Le joueur valide les trois sprites,
   posés à côté de celui d'Aldric. S'il les refuse après trois essais par héros parce qu'ils ne
   vont pas avec Aldric, on refait les quatre ensemble dans PixelLab, Aldric compris : le non-but
   « ne pas refaire Aldric » tombe pour cette seule image. Quatre héros du même trait passent
   avant la ressemblance avec les gobelins, puisqu'on les voit côte à côte à la création.
3. **Figurines de carte**, pour les trois mêmes : un personnage PixelLab de 32 pixels, vue
   « low top-down », 8 directions, décrit sur le modèle d'Aldric (« small map unit seen from far
   away, bold readable shape, strong colours, simple »), l'épée au côté et non en main (les
   animations de marche perdent ce qui est tenu). Marche : l'animation `walking`, 6 images par
   direction. Rangs dans l'ordre sud, sud-est, est, nord-est, nord, nord-ouest, ouest, sud-ouest ;
   première colonne debout, puis la marche ; toutes les cases recadrées sur la même boîte, pour
   que les pieds ne bougent pas d'une image à l'autre (la règle de `install_iso.py` du prototype).

Un outil, `tools/make_heroes.py` (PIL), assemble bandes et planches dans `assets/sprites/` à
partir des images brutes rangées dans `tools/heroes/raw/`. `tools/heroes/ids.tsv` note pour
chaque image son identifiant PixelLab et la description utilisée, pour pouvoir la refaire.
Budget : environ 150 générations, reprises comprises, sur les 5000 disponibles.

### L'écran de création
L'écran du nom gagne une rangée de quatre portraits animés, au-dessus du champ. Un clic en choisit
un ; le choisi est encadré d'or. À gauche du champ, là où se tient le sprite de combat
aujourd'hui, on voit celui du héros choisi et sa figurine qui marche sur place : le joueur choisit
un visage et un sprite, il voit les deux.

```
┌───────────────────── Votre héros ─────────────────────┐
│  [portrait]   [portrait]   [portrait]   [portrait]     │
│    Aldric      Tancrède     ▸Isaure◂      Maëlle       │
│                                                        │
│  [sprite de     Comment s'appelle votre héroïne ?      │
│   combat +      [          Isaure          ]  6 / 14   │
│   figurine]     Carte n° 123456        [Autre carte]   │
│  [Retour]                              [Commencer]     │
└────────────────────────────────────────────────────────┘
```

- Le champ propose le nom du héros choisi. Changer de héros remplace le contenu du champ
  seulement s'il est vide ou s'il vaut encore l'un des quatre noms proposés ; un nom tapé par le
  joueur reste.
- Les textes de l'écran s'accordent tout de suite avec le héros choisi (« votre héroïne »).
- On peut aussi changer de héros au clavier, sans prendre au champ les touches dont il a besoin
  (les flèches gauche et droite déplacent le curseur dans le nom).
- « Autre carte » garde le héros choisi et le nom tapé.

### Le menu du héros
Le portrait animé du héros choisi remplace le sprite de combat, en grand (64 pixels d'art doublés,
sur une plaque, comme un commerçant à côté de son panneau). Dessous, un bouton « Changer
d'apparence » rouvre l'écran de création lui-même, en mode retouche : les quatre portraits et le
champ du nom, remplis avec le héros et le nom actuels. On peut donc changer de visage, de nom, ou
des deux ; sans cela, une partie existante qui passe à Isaure garderait « Aldric » pour toujours,
le jeu n'ayant aucun autre moyen de renommer le héros. (Choix du concepteur.)

- En mode retouche, « Autre carte » et le numéro de carte disparaissent, « Commencer » devient
  « Valider », et « Retour » ramène à la partie sans rien changer.
- La règle du nom proposé est la même qu'à la création : le champ ne suit le héros choisi que
  s'il vaut encore l'un des quatre noms proposés.
- Valider applique le choix, le sauvegarde et ramène au menu du héros ; les textes suivent le
  nouveau genre. C'est gratuit et sans limite.
- Le bouton est inactif pendant un raid, comme le nouveau départ : le jeu ne tourne pas pendant
  qu'on est sur cet écran.

### Les textes qui s'accordent
Un trou de plus dans les textes : `{g:masculin|féminin}`. Le jeu garde la première forme si le
héros choisi est un homme, la seconde si c'est une femme. Avant qu'une partie existe, c'est le
héros en cours de choix (écran de création) ou celui de la sauvegarde (écran titre) qui compte.

- Il vaut pour **tout texte affiché**, pas seulement ceux lus par `tr()` : beaucoup sont lus
  directement dans `DATA` (descriptions de bâtiments, répliques des commerçants, du tutoriel et
  des lieux). Il doit donc être résolu là où le texte est dessiné ou mesuré, et avant qu'un
  dialogue écrit lettre à lettre compte ses lettres.
- Toute ligne qui parle du héros avec un mot genré est reprise, dans les trois langues :
  - français : « le héros » et ses contractions (« du héros », « au héros » → « de l'héroïne »,
    « à l'héroïne »), les pronoms, les participes et adjectifs accordés, « messire » ;
  - anglais : « he / him / his / himself », « my lord » ; le mot « hero » reste, pour les deux ;
  - espagnol : « el héroe / la heroína », les pronoms et les accords.
  Ordre de grandeur : une centaine de lignes en français et en espagnol, une soixantaine en anglais.
- `node tools/i18n.js check` ne compte pas `{g:…}` parmi les trous à comparer d'une langue à
  l'autre (l'anglais en a là où le français n'en a pas), mais refuse un `{g:…}` mal formé (il faut
  exactement deux formes). `js/tuto-check.js` l'accepte de même.
- Le glossaire (`docs/superpowers/specs/2026-11-21-multilangue-glossary.md`) gagne la règle, pour
  les textes à venir.

### Vérification
Dans le navigateur, avec le serveur du projet : une nouvelle partie avec chacun des quatre héros ;
le menu du héros et le changement d'apparence ; un combat ; la carte pendant un raid et une
expédition ; une ancienne sauvegarde, qui retrouve Aldric ; un nouveau départ, qui garde le héros.
Avec une héroïne, le tutoriel du début et l'arrivée sur un lieu exploré, en français, en anglais
et en espagnol.

## Laissé au constructeur
- La mise en page exacte de l'écran de création et du menu du héros, et la taille des portraits.
- La touche qui change de héros au clavier.
- Les mots exacts dans les trois langues, et le recensement ligne à ligne des textes à accorder.
- L'endroit précis où `{g:…}` est résolu, tant qu'aucun texte affiché n'y échappe.
- Comment l'écran titre lit le héros de la sauvegarde sans la charger.
- Les descriptions exactes données à PixelLab, et le nombre de reprises.
