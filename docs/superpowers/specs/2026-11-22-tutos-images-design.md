# Tutos imagés des mini-jeux — design court

**Pourquoi.** Avant chaque mini-jeu, le tenancier récite `how` + `keys` dans sa bulle : un pavé de cinq lignes qui mêle règle, touches et barème. Le joueur les trouve « incompréhensibles » et veut des tutos imagés.

**Approches envisagées.**
- *Démo animée* (le vrai jeu se joue seul en petit, en boucle) : la plus parlante pour le timing, mais le joueur a choisi les cases.
- *Cases illustrées par PixelLab* : jolies, mais 18 images payantes, jamais fidèles à l'interface, et à refaire à chaque changement de règle. Écartée.
- **Cases dessinées avec les sprites du jeu** (retenue, choix du joueur) : trois vignettes fixes par jeu, dessinées sur le canevas avec les sprites et pinceaux que chaque jeu a déjà. Exactes, gratuites, traduisibles.

**Ce qui est construit.**
- Écran « intro » d'un lieu (`js/venue.js`, mode `intro`) : un grand panneau au-dessus de la bulle, titre du jeu, **trois vignettes côte à côte** numérotées, chacune une image + une phrase de 4 à 6 mots + la ou les touches dessinées en pastilles ([1], [Espace], [→]). Sous les vignettes, **une ligne de légende** pour le barème (pictos + nombres). Seule la pastille clignote ; l'image est fixe.
- La bulle du tenancier ne dit plus qu'une courte réplique (« Regardez, c'est tout simple ! »), à sa manière. Les boutons « C'est parti » / « Pas maintenant » ne changent pas.
- **Difficultés au bon moment** : les vignettes décrivent le jeu à la série actuelle. Quand une nouveauté de la rampe est active (feintes, coups doubles, brioche, pierres tournées, miroir), une vignette « Nouveau ! » s'ajoute (quatre vignettes au plus).
- Chaque jeu fournit ses vignettes avec son enregistrement : `Minigames.add(id, factory, howto)`, où `howto(o)` rend `{ cards: [{ draw(x, y, w, h, t), text, keys }], legend: [...] }`. Les jeux restent maîtres de leurs dessins.
- Textes dans `data/venues.js` (FR) et `data/i18n/{en,es}/venues.js`. `how` reste, raccourci à une phrase, pour l'infobulle du bouton « Jouer » ; `keys` disparaît du dialogue.

**Contenu des vignettes.**
- Café : retiens la commande / la bulle se ferme / sers dans l'ordre [1-6]. Légende : tasse fausse = patience perdue ; 3 clients partis = fin.
- Marché : arrête l'aiguille dans le vert [Espace] / le prix baisse (or = plus) / pousse [↑] ou tope [Entrée].
- Forge : frappe quand la marque touche l'enclume [Espace] / garde la chaleur dans le vert [B] / enchaîne pour les étincelles.
- Boulangerie : le pain cuit (pâle → doré → foncé → brûlé) / sors-le doré [1-5] / 4 brûlés : perdu. Légende : pâle 0 · doré 2 · au cœur 3 · foncé 1. Nouveau : la brioche.
- Caserne : écoute le côté annoncé / bouclier avant que l'anneau se ferme [←↑→↓] / 5 coups reçus : perdu. Nouveau : feintes, coups doubles.
- Loge : le trou dans le mur / une seule pierre entre [1-4] / tourner oui, retourner non. Légende : vite et sans faute = 2. Nouveau : pierres tournées, la pierre miroir.

**Non-buts.** Pas de démo animée, pas d'images PixelLab, pas de changement aux règles ni au flux (l'intro reste avant chaque partie ; Entrée lance).

**Laissé au constructeur.** Taille exacte du panneau et des vignettes, formulation finale des phrases (courtes, dans la voix du jeu), choix des pictos de légende, et le rendu en anglais et en espagnol.
