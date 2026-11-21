# Une carte différente à chaque partie

## Pourquoi

En recommençant une partie, tout est agencé pareil : la carte est déjà générée par
`js/mapgen.js`, mais toujours depuis la même graine (`CONFIG.seed = 1`). On veut de la
rejouabilité entre parties et, en bonus, pouvoir partager une graine. La carte elle-même plaît
telle quelle : on ne touche ni à son allure ni à la clairière de départ.

## Objectifs

- Chaque nouvelle partie tire une graine au hasard ; la carte, le camp, les lieux à explorer et les
  aléas du jeu en découlent.
- Aucune graine ne donne une partie cassée (pierre introuvable au début, camp inatteignable…).
- La graine se voit et se partage ; un lien ouvre une partie sur la même carte.

## Hors sujet

- Changer la génération (biomes, clairière, palissade et tour de départ restent comme aujourd'hui).
- Placer l'hôtel de ville ailleurs qu'au milieu, changer la forme de la carte.
- Un climat de départ qui varie (approche B, écartée).

## À ne pas faire (échec même si « ça marche »)

- Changer la carte d'une partie en cours ou d'une vieille sauvegarde : elles gardent leur graine.
- Une graine partagée qui ne redonne pas exactement la même carte.
- Un tutoriel qui pointe vers rien sur une carte tirée.

## Approches envisagées

- **A. Graine aléatoire et garde-fous** (retenue) : on tire une graine, on vérifie que la carte est
  jouable, sinon on passe à la suivante ; graine affichée et partageable. Garde l'allure actuelle.
- **B. A plus un climat de départ tiré** : plus de différence dès la première seconde, mais touche à
  l'ambiance appréciée et multiplie les cas à vérifier pour le tutoriel. Écartée.
- **C. Hôtel de ville placé au hasard, autres formes de carte** : bien plus lourd, touche tout le jeu,
  pour une carte dont on est content. Écartée.

## Conception

**Tirage.** Une nouvelle partie (titre sans sauvegarde, « Nouvelle partie » du menu) tire une graine
entre 1 et 999 999 (assez court pour se dicter). `?seed=N` dans l'adresse impose N. La graine des
aléas du jeu (`rng()` dans index.html) part de la même graine, pour qu'un lien partagé redonne aussi
les mêmes tirages de début de partie.

**Garde-fous.** Une fonction pure (à côté de `MapGen`, sans état du jeu) dit si une graine est
jouable. Si elle ne l'est pas, on essaie N+1, N+2… La graine retenue est celle qu'on enregistre et
qu'on affiche, donc la partager redonne exactement la même carte. Critère : un rocher (qui donne
de la pierre) à 20 cases au plus de l'hôtel de ville (de 9 à 34 selon la graine ; 28 % des graines
écartées).

Mesuré sur 400 graines, et donc sans garde-fou dédié : il y a toujours au moins 8 lieux à explorer
à moins de 80 cases, tous atteignables à pied, et le premier camp est toujours atteignable. Les
camps suivants, plus loin, sont protégés par la règle du placement ci-dessous.

**Camp.** Le placement du camp (`placeCamp` dans js/village.js) n'accepte plus qu'un emplacement relié
à pied à l'hôtel de ville, pour le premier camp comme pour ceux qui se relèvent ensuite. Le repli
actuel « le camp est sur une île » ne devrait plus servir.

**Exploration.** Rien ne change dans `buildSites` : les lieux viennent déjà de la graine. Seul le
garde-fou ci-dessus garantit qu'il y en a assez.

**Tutoriel.** Il lit déjà le terrain (arbre le plus proche, meilleur emplacement via `Siting`). Le
garde-fou sur la pierre couvre la leçon de la carrière. On vérifie le parcours de départ sur
quelques graines tirées.

**Partage.**
- Menu pause : une ligne « Carte n° 123456 » et un bouton « Copier le lien » (adresse du jeu avec
  `?seed=123456`).
- Écran du nom du héros : la carte s'y voit déjà en fond ; on y affiche « Carte n° … » et un bouton
  « Autre carte » qui retire une graine (la carte change derrière le panneau).
- Lien ouvert sans sauvegarde : nouvelle partie sur cette carte. Avec une sauvegarde : le titre le
  signale, et « Nouvelle partie » utilisera cette graine ; « Continuer » reprend la partie en cours.

**Sauvegardes.** `state.mapSeed` existe déjà et est sauvé ; les anciennes parties gardent la graine 1.
La « nouvelle fondation » (prestige) garde la carte, comme aujourd'hui.

**Vérification.** Un script Node passe des centaines de graines dans le garde-fou et donne la part
rejetée et les mesures ; puis on joue le début sur deux ou trois graines dans le navigateur.

## Laissé au builder

- Les seuils exacts des critères (à partir des mesures sur quelques centaines de graines).
- La mise en page exacte des nouvelles lignes et boutons, dans le style des panneaux existants.
- Les textes, dans data/strings.js.
