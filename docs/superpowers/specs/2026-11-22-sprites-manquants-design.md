# Les sprites manquants — design court

## Pourquoi
Deuxième des quatre chantiers de contenu (après « Un héros au choix »). Plusieurs images du jeu
sont des bouche-trous connus : sept bâtiments gardent le même aspect à tous les niveaux, les quatre
chefs de guerre partagent une seule image en duel, les combats de boss n'ont pas leur décor, et
l'arme forgée ne se voit pas sur le héros. Les crédits PixelLab sont là : on comble.

## Buts / non-buts
- But : les sept bâtiments à un seul aspect (caféiers, brûlerie, café, chapelle, bergerie, tissage,
  orfèvre) changent d'allure aux niveaux 5, 10 et 15, comme la forge ou le marché.
- But : Morgash, Zhara, Urgak et Skrit ont chacun leur sprite de duel, avec leur arme.
  (Abandonné à l'exécution, le 2026-11-22 : « leur propre petite icône dans la file des tours ».
  Le combat n'affiche pas de file des tours et rien ne lit l'`icon` d'un ennemi : l'image n'aurait
  jamais été vue. À refaire le jour où une file des tours existe.)
- But : les combats de boss se jouent dans un décor crépusculaire.
- But : en combat, le héros tient l'arme qu'il a forgée (Épée d'acier, Fendeuse runique), pour les
  quatre héros.
- Non-but : une illustration par carte de combat ; reprendre les figurines dont l'arme disparaît
  en marchant (brute, chaman, milicien, mineur) ; des figurines de carte propres à chaque chef.
- Non-but : toucher aux règles. Aucun chiffre, aucun texte de jeu ne change.
- Anti-but : un palier qui ne ressemble plus au même bâtiment, ou qui déborde de son terrain ; un
  héros dont le visage change d'une arme à l'autre.

## Approches envisagées
1. **Dériver chaque image de celle qui existe** (retenue). Les bâtiments d'origine sont toujours
   dans le compte PixelLab : chaque palier est un « état » du précédent, comme l'ont été ceux de la
   forge. Les chefs partent de l'image de duel actuelle, les armes du sprite de combat de chaque
   héros (« le même sprite, seule l'arme change », la recette qui a marché pour Tancrède).
2. Tout régénérer depuis une description (écartée : les paliers ne se ressembleraient plus entre
   eux, et les héros viennent d'être validés).
Le décor de boss, lui, n'est pas généré : c'est le décor actuel repassé au crépuscule (teintes,
ciel), pour rester raccord au pixel près.

## Design
- **Bâtiments** : 21 images, `assets/sprites/iso/<bâtiment>_l5.png`, `_l10.png`, `_l15.png`. Même
  largeur de terrain que le niveau 1, la hauteur peut grandir. Les bâtiments perdent
  `looks: 'one'` et le manifeste les déclare comme les autres : le jeu annonce alors tout seul
  « nouvel aspect au niveau N » et change d'image aux paliers.
- **Chefs de guerre** : `enemy.<id>` (96 × 89, comme l'image actuelle, qui reste en secours).
  Morgash : marteau de guerre ; Zhara : chamane aux ronces, bâton ; Urgak : fendoir et carrure de
  brute ; Skrit : deux lames, silhouette fine. Icône `unit.warlord` pour la file des tours.
- **Décor de boss** : `bg.battle` gagne sa deuxième image (`bg_battle_boss.png`), que le combat lit
  déjà (`boss ? 1 : 0`).
- **Armes des héros** : `hero.battle.<id>` passe d'une image à quatre (une par palier d'arme).
  Les paliers 0 et 1 gardent le sprite actuel (on ne combat jamais sans arme) ; il y a donc deux
  sprites neufs par héros, huit en tout, et non douze. Palier 2 : épée d'acier, plus large, garde
  dorée ; palier 3 : fendeuse runique, lame qui luit en bleu.
- **Le joueur valide** : une planche par famille (les paliers côte à côte, les quatre chefs, les
  héros avec leurs trois armes) avant installation ; les armes passent en dernier.
- Budget : environ 300 générations sur 5000.

## Laissé au constructeur
Les descriptions exactes données à PixelLab, le nombre de reprises, l'outil qui recadre et range
les images, le garde-fou qui vérifie que chaque fichier du manifeste existe.
