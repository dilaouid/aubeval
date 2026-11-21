# Forge : un premier palier de pouvoir (niveau 5)

Date : 2026-11-21 · Taille : petit changement (court design)

## Pourquoi

Aujourd'hui, monter la forge ne fait que raccourcir le temps de forge (−25 % par niveau, `js/village.js`) et gonfler un peu la carte Estoc (+10 % par niveau, `card_level_step`). Les recettes durent 5 à 45 s : le gain est quasi invisible, donc monter la forge « est inutile ».

Le joueur veut que la forge profite **au stuff ou aux cartes**, **sans que ce soit cheat**.

## Approches envisagées

- **A. Stuff seul** : plafond de +N par niveau, rabais, paliers de gear à niveau de forge. Sûr, mais les cartes n'y gagnent rien et le plafond change un comportement existant.
- **B. Cartes seules** : nouvelles cartes de forge à des paliers. Plus jouable, mais le stuff ne bouge pas.
- **C. Hybride par paliers (choisie)** : aux niveaux 5, 10, 15 (les paliers déjà visibles dans le jeu : look du bâtiment, production ×2 ailleurs), un avantage de stuff **et** une carte. Choisie par le joueur, « en commençant par le palier 5 ».

## Périmètre : palier 5 seulement

Quand la forge atteint le niveau 5 (`tune.milestone_levels`) :

1. **Trempe (stuff)** : chaque +N d'une pièce vaut 20 % de ses stats au lieu de 15 % (`plus_bonus` 0,15 + `forge_temper_bonus` 0,05). S'applique à tous les +N déjà acquis. Dans `Hero.itemStats`.
2. **Fer rouge (carte)** : nouvelle carte de la forge, 1 exemplaire, coût 1, cible unique, `dmg 0.9`, `pierce`, `weak 2`, `exhaust` (une fois par combat). Elle croît avec le niveau de la forge comme les autres cartes (`pow`). Texte : « Le fer sorti du feu marque la cible : elle frappe deux fois moins fort pendant deux tours. »

Le reste de la forge ne change pas : vitesse de forge, Estoc, recettes, quêtes.

## Garde-fous (« pas cheat »)

- Gain borné : +5 points sur le bonus d'un +N, une seule carte, à usage unique, 1 exemplaire.
- Coût réel : le niveau 5 se paie au prix exponentiel existant (`upgrade_cost_growth`).
- Les +N restent chers (×1,5 par +1) : la Trempe améliore le rendement, elle ne rend rien gratuit.
- Le deck reste borné par `deck_min` et la rareté de la carte (exhaust, 1 copie).

## Ce qu'il faut construire

- `data/cards.js` : carte `brand` (Fer rouge), `from: 'forge'`, avec un **nouveau champ `at`** (niveau minimum du bâtiment source), à ajouter à la liste `cardOrder`. Documenter `at` dans l'en-tête du fichier.
- `js/cards.js` `pool()` : ignorer une carte dont `s.lvl < c.at`. Idéalement, la montrer verrouillée dans la liste de cartes du héros (comme `deck_locked` / `deck_build` dans `js/screens.js`), pour que le joueur voie ce qu'il gagne.
- `js/hero.js` `itemStats` : bonus de Trempe selon le niveau de la forge. Aucun nouvel état de sauvegarde (tout se déduit du niveau du bâtiment).
- `config.js` : `forge_temper_bonus` (0,05).
- Panneau de la forge (`js/screens.js`, `drawForge` et l'aperçu du niveau suivant) : afficher « Niv. 5 : Trempe et Fer rouge » et marquer le palier atteint.
- Textes : FR dans `data/`, EN et ES dans `data/i18n/{en,es}/` (cartes, strings), selon le glossaire `2026-11-21-multilangue-glossary.md`.

## Mes appels (à corriger si besoin)

- La Trempe compte même si la forge est endommagée : les stats du héros ne bougent pas pendant un raid. La carte Fer rouge, elle, suit la règle des cartes (bâtiment intact).
- Chiffres de la carte (0,9 / weak 2) : points de départ, à régler en jeu.
- Pas de plafond de +N, pas de condition de forge sur les paliers de gear : hors périmètre (sauvegardes existantes, et la Trempe suffit pour le palier 5).

## Hors périmètre

Paliers 10 et 15, plafond de +N, rabais de coût, nouveaux looks de forge.
