# La Loge des bâtisseurs sert enfin à quelque chose — conception

Modifie la section « 3. La Loge des bâtisseurs » de `2026-11-22-lieux-et-mini-jeux-design.md`, qui disait
que la Loge « ne produit rien et ne rend aucun service ». Tout le reste de cette section tient : le jeu
« La bonne pierre », le cadeau « Plans d'Aveline » et sa durée qui grandit avec le niveau.

## Pourquoi
Le joueur n'a aucune raison de poser la Loge : elle ne fait rien tant qu'on n'a pas gagné une partie,
son cadeau ne dure que quelques minutes, et sa description ne dit même pas ce que sont « les plans ».
Elle doit rendre service dès qu'elle est posée, et ses niveaux doivent compter.

## Ce que le joueur obtient (choix du joueur : rabais permanent + réparations et démolitions)
Tout est calculé en direct d'après le **niveau de la Loge** (0 s'il n'y en a pas), borné à 15, le dernier
niveau qui change d'aspect. Rien n'entre dans la sauvegarde.

1. **Rabais permanent** sur les constructions et les améliorations : 2 % au niveau 1, plus 0,5 % par niveau,
   soit 9 % au niveau 15. Il s'ajoute à celui du cadeau « Plans d'Aveline » (0 / 5 / 10 / 15 %), le total
   étant plafonné à 25 %. Mêmes exclusions que le cadeau : grands chantiers (étapes et fondations),
   montée de classe, chemins, réparations.
2. **Réparations moins chères** : le prix de réparation d'un bâtiment (30 % du prix de base) baisse jusqu'à
   moitié moins au niveau 15, proportionnellement au niveau.
3. **Démolitions mieux remboursées** : les 70 % rendus montent jusqu'à 74 % au niveau 15.

**Garde-fou :** acheter puis démolir ne doit jamais rapporter. La part rendue plus le plafond du rabais
restent sous 100 % (74 + 25 = 99). Le code borne le gain de remboursement à `1 − plafond`, et un test le
vérifie, pour qu'un réglage ne rouvre pas la faille.

**Au moins une unité (choix du joueur) :** les prix étant arrondis à l'unité au-dessus, un petit rabais ne
changerait rien sur un bâtiment bon marché. Quand une Loge est debout, elle retire donc au moins 1 de chaque
ressource d'une construction, d'une amélioration et d'une réparation, sans jamais descendre sous 1, ni, pour
une construction ou une amélioration, sous ce que la démolition rend (même garde-fou contre l'achat-démolition).
Sans Loge, le cadeau seul garde son arrondi d'avant.

## Où cela se voit
- **Description du bâtiment** : elle dit ce que font les plans, en clair (rabais permanent, réparations,
  remboursement, cadeau qui dure plus longtemps).
- **Panneau de la Loge** : une ligne par effet avec sa valeur actuelle.
- **Panneau d'amélioration** : à chaque niveau, ce qu'il apporte (le rabais, les réparations, le
  remboursement et les secondes en plus), à la place de la seule ligne « +20 s ».
- Les boutons réparer et démolir, la barre de construction et les panneaux de prix lisent déjà les prix
  en direct : ils changent seuls.
- **Aveline** (leçon du tutoriel `b:lodge`, accueil du lieu) : une phrase de plus sur le rabais permanent.
- Trois langues : français, anglais, espagnol.

## Dans le code
- `js/village.js` : `plans(kind)` ajoute le rabais permanent à `Venue.buff('build')` sous le plafond ;
  `repairCost(b)` et `refund(b)` lisent le niveau de la Loge. Un seul endroit donne ce niveau
  (à côté de `Venue.giftTime`, qui le cherche déjà).
- `config.js`, préfixe `lodge_` : `lodge_plans_base` (0,02), `lodge_plans_step` (0,005),
  `lodge_plans_cap` (0,25), `lodge_repair_cut` (0,5), `lodge_refund_gain` (0,04), `lodge_max_level` (15).
- `data/buildings.js`, `js/screens.js`, `data/strings.js`, `data/tutorial.js`, `data/i18n/{en,es}/…`.
- `tools/test-venues.js` : le rabais par niveau, le plafond, les exclusions, les réparations, le
  remboursement et le garde-fou.

## Hors sujet
Le cadeau lui-même ne change pas. Pas de bons de chantier, pas de commande du jour, pas de réduction de
la croissance des prix : écartés avec le joueur, car ils poussent trop sur l'équilibre ou sont trop chers à écrire.

## Mes choix (à corriger si besoin)
- Les chiffres sont des valeurs de départ, réglables dans `config.js`.
- Une Loge abîmée garde ses effets : sinon sa propre réparation coûterait plein pot.
- Le niveau 1 est déjà utile (2 % et un peu de réparation), pour que poser la Loge se sente tout de suite.
