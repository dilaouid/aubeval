# « Le quartier d'Aveline » remplace « La bonne pierre » — conception

Remplace le jeu de la section « 3. La Loge des bâtisseurs » de `2026-11-22-lieux-et-mini-jeux-design.md`.
Le bâtiment, son cadeau « Plans d'Aveline » et ses effets permanents (`2026-11-22-loge-utile-design.md`)
ne changent pas.

## Pourquoi
Le joueur n'aime pas « La bonne pierre » : choisir parmi quatre pierres celle qui entre dans le trou est
**beaucoup trop simple et pas amusant**. Il veut un jeu qui ressemble au métier d'Aveline : elle a bâti
un joli quartier, il faut le rebâtir, et la ressemblance et la vitesse font les points.

## Objectifs, non-objectifs, anti-objectifs
- **Objectif** : un jeu où l'on réfléchit et où l'on se souvient, où l'on hésite à revoir le plan, et où
  le quartier rebâti est joli à regarder (les vrais bâtiments du village).
- **Non-objectifs** : toucher au cadeau, aux effets de la Loge, à la musique, au décor ou au personnage du lieu.
- **Anti-objectifs** (raté même si ça marche) : un jeu de simple recopie (le modèle toujours visible) ;
  un jeu de réflexe abstrait comme l'ancien ; un jeu illisible où l'on ne sait pas ce qui était juste.

## Approches considérées
1. **Copie à vue** : le modèle reste affiché, on recopie. Écartée : c'est de la recopie, le même défaut
   que l'ancien jeu.
2. **De mémoire** (**choix du joueur**) : le modèle est montré quelques secondes puis caché ; on le
   rebâtit de tête, on peut le revoir contre des points.
3. **Le quartier qui plaît** : pas de modèle, des règles de voisinage à respecter. Écartée : s'éloigne de
   l'idée (rebâtir le quartier d'Aveline) et lente à lire en temps limité.

## Le jeu (validé avec le joueur)
Nom : **« Le quartier d'Aveline »**. Une partie dure **60 s** (`lodge_time` passe de 36 à 60). On rebâtit
autant de quartiers que possible.

**Un quartier, en trois temps :**
1. **Le plan.** Aveline montre son quartier sur une grille vue en 3D isométrique, comme le village, avec
   les vrais dessins des bâtiments. Il reste affiché un temps qui raccourcit avec la série (5 s au départ).
   « J'ai vu ! » (bouton, ou Entrée) le cache tout de suite. Le chrono de la partie tourne.
2. **La construction.** Le plan est caché ; une grille vide de même taille l'attend.
   - Souris : un clic sur un bâtiment de la barre du bas le choisit, un clic sur une case l'y pose
     (remplace ce qui y était) ; clic droit sur une case : l'efface.
   - Clavier : les flèches déplacent un curseur sur la grille, 1 à 6 pose le bâtiment de ce numéro sous
     le curseur, Suppr (ou Retour arrière, ou 0) l'efface.
   - **« Revoir le plan »** (bouton, ou Espace) : le plan réapparaît 1,5 s à la place de la grille (on ne
     pose rien pendant ce temps) et **coûte 2 points** au score de la partie.
3. **La comparaison.** « Valider » (bouton, ou Entrée) : les deux quartiers côte à côte, un ✓ ou un ✗ sur
   chaque case qui compte, le pourcentage de ressemblance et les points gagnés, environ 1,5 s. Le chrono
   est **arrêté** pendant la comparaison *(mon choix : ne pas punir le temps de lecture)*. Puis le
   quartier suivant.

**Les points d'un quartier :**
- +1 par bâtiment juste (bonne sorte, bonne case), −1 par bâtiment faux (mauvaise sorte, ou posé là où
  le plan n'a rien), 0 pour une case oubliée. Ce total ne descend pas sous 0.
- +3 si le quartier est **parfait** (100 %).
- Bonus de vitesse +1 à +3, compté depuis le moment où le plan est caché, **seulement si la ressemblance
  atteint 50 %** (valider une grille vide en vitesse ne rapporte rien). Les seuils sont proportionnels au
  nombre de bâtiments du plan *(mon choix, réglables : ≤ 1,0 s par bâtiment → +3, ≤ 1,6 s → +2,
  ≤ 2,2 s → +1)*.
- « Revoir le plan » coûte toujours : le score de la partie **peut passer sous 0** pendant la partie
  (affiché en rouge). Seul le score final est ramené à 0 pour les médailles. *(Mon choix : sinon, à 0
  point, on pourrait revoir le plan sans fin et le recopier.)*
- **Le temps s'arrête avant la validation** : le quartier en cours ne rapporte rien et ne compte pas
  comme raté. *(Mon choix : une fin de chrono ne doit pas faire perdre la partie.)*

**La ressemblance** : parmi les cases occupées dans le plan **ou** dans la grille du joueur, la part où les
deux ont le même bâtiment. Les cases vides des deux côtés ne comptent pas.

**La défaite** : après **3 quartiers sous 50 %**, Aveline arrête la leçon (jeu perdu, comme le mur qui
s'écroulait). Réglage `lodge_misses`.

**La série (difficulté au fil des victoires)** — valeurs de départ, dans `ramp` de `data/venues.js` :
- grille 3 × 3 au départ, un côté de plus toutes les 3 victoires, 5 × 5 au plus ;
- 4 bâtiments dans le plan au départ, un de plus par victoire, mais jamais plus de 60 % des cases
  (arrondi en dessous) ni plus de 9 : 4, 5, 5 sur 3 × 3, puis 7, 8, 9 sur 4 × 4, 9 sur 5 × 5. Il reste
  toujours du vide à retenir *(mon choix : le plafond l'emporte sur la croissance)* ;
- 4 sortes de bâtiments au départ, une de plus toutes les 2 victoires, 6 au plus ;
- le plan s'affiche 5 s, 0,4 s de moins par victoire, jamais moins de 2,5 s ;
- **dès la 3e victoire, le plan est montré tourné** d'un, deux ou trois quarts de tour. Un **drapeau**
  d'Aveline plante le même coin sur le plan et sur la grille du joueur : on rebâtit en suivant le
  drapeau. *(Mon choix : un drapeau plutôt qu'une boussole, plus lisible.)* Les dessins des bâtiments,
  eux, ne tournent pas : seules leurs places tournent.

## Ce qui est laissé au constructeur
- Les sortes de bâtiments : six bâtiments 2 × 2 du village aux silhouettes bien distinctes une fois
  réduits *(mon choix de départ : maison, boulangerie, forge, chapelle, café, et un sixième 2 × 2 au
  choix du constructeur — la tour de guet est 1 × 1 ; à remplacer si deux se confondent à l'écran)*. Dessinés avec `Art.get(DATA.buildings[k].sprite)`, sur
  des tuiles d'herbe (`iso.tile.grass`), à une échelle entière qui fait tenir 5 × 5 dans la zone de jeu
  (au-dessus du panneau du bas, `Minigames.kit.PANEL`).
- Comment le tirage fait un « joli » quartier : pas plus de deux bâtiments de la même sorte au départ,
  au moins trois sortes, pas de plan identique deux fois de suite. Le reste est libre.
- Le sens des flèches sur une grille en losange : chaque flèche va à la case voisine qui est visuellement
  dans cette direction (ou le plus près). À choisir et à dire dans la carte d'aide.
- La mise en page exacte, les animations (un bâtiment qui tombe en place, le drapeau qui flotte).

## Dans le code
- **`js/blueprint.js`** (nouveau, pur, sans dessin) remplace **`js/stones.js`** (supprimé) : tirer un plan
  (taille, nombre de bâtiments, sortes, d'après le niveau et `ramp`), tourner un plan d'un quart de tour,
  comparer une grille à un plan (justes, faux, oubliés, ressemblance). Tout est testé à part.
- **`js/minigame-lodge.js`** est réécrit : la partie, son joueur automatique, son dessin et ses cartes
  d'aide. Même contrat qu'aujourd'hui : `{ update, draw, auto, score, done, lost, why }`, enregistré par
  `Minigames.add('lodge', …)`. Les règles ne dessinent pas, seul `draw()` dessine.
- **Joueur automatique** (`auto(dt, bot)`) : il connaît le plan, appuie sur « J'ai vu ! » au bout de
  `bot.pace`, pose un bâtiment tous les `bot.pace`, se trompe de sorte avec la probabilité `bot.err`, ne
  revoit jamais le plan, valide quand il a tout posé.
- **`config.js`** : `lodge_time` 60 ; `lodge_strikes`, `lodge_chain`, `lodge_chain_gap` disparaissent ;
  nouveaux `lodge_misses` (3), `lodge_peek_cost` (2), `lodge_peek_time` (1,5), `lodge_perfect` (3),
  `lodge_reveal_time` (1,5), et les seuils de vitesse.
- **`data/venues.js`**, entrée `lodge` : `title`, `unit` (« quartiers rebâtis » ou « bâtiments justes »,
  au choix du constructeur, cohérent avec le score), `how`, `say`, `steps`, `news` (`turn`), `legend`,
  `medals` (à régler, voir plus bas), `ramp`, et toutes les répliques d'Aveline qui parlent de pierres et de
  murs (`greet`, `ready`, `wait`, `chat`, `glad`, `cross`, `chain` — dite sur un quartier parfait —,
  `after`). Les textes `lg_*` du même fichier sont remplacés.
- **Tutoriel** (`data/tutorial.js`, leçon `lodge`) : `about` et la réplique de l'étape `stone` décrivent le
  nouveau jeu. `js/tuto-check.js` ne signale rien de neuf.
- **`index.html`** : la balise et la ligne du plan des fichiers de `stones.js` deviennent celles de
  `blueprint.js`.
- **Trois langues** : tout texte nouveau ou changé en anglais et en espagnol (`data/i18n/{en,es}/…`,
  `tools/i18n.js`). Ne réutiliser que des noms de champs déjà dans `FIELDS`, ou les y ajouter.
- **`tools/test-venues.js`** : les tests des pierres et de « La bonne pierre » sont remplacés par ceux du
  plan (tirage conforme à `ramp`, rotation, comparaison, ressemblance) et du jeu (fin seule à 60 s, un quartier non validé ne rapporte rien,
  rien fait = pas de médaille, 3 quartiers ratés = perdu, revoir coûte même à 0 point, score final ramené à 0,
  un plan parfait vaut le bonus, une main qui se trompe marque moins).

## Ce qui doit être vrai à la fin
1. Le joueur automatique sans erreur, à un rythme humain rapide *(mon choix : `pace` 0,35 s)*, obtient
   l'or au niveau 0 et au moins le bronze au niveau 10 ; les médailles sont réglées pour cela, puis
   vérifiées à la main pour qu'un humain attentif décroche l'argent au niveau 0.
2. Le jeu se joue entièrement au clavier et entièrement à la souris, se met en pause (Échap),
   s'abandonne, et se termine seul.
3. Les cartes d'aide montrent : le plan, la reconstruction (touches), « Revoir le plan » et son prix ;
   la carte « Nouveau ! » du plan tourné et du drapeau dès la 3e victoire.
4. Une sauvegarde existante garde la série, le record et l'attente de la Loge (rien de sauvegardé ne change).
5. Tous les tests du projet passent, en trois langues sans texte français oublié.

## Mes choix (à corriger si besoin)
- Chrono arrêté pendant la comparaison ; drapeau plutôt que boussole ; seuils de vitesse par bâtiment ;
  score qui peut passer sous 0 ; quartier inachevé à la fin = 0, sans raté ; plafond de 60 % des cases ;
  sortes de bâtiments de départ ; rythme du joueur automatique pour régler les médailles.
