# Endgame : du rythme et de la menace — design court

## Pourquoi
Entre Cité et Capitale, on s'ennuie. Ce sont des compteurs qui freinent la montée (45 commandes en
plus, avec 3 emplacements et 90 s d'attente entre deux commandes ; 10 raids en plus), pas des défis.
Et la menace reste presque la même (+12 % de vie par raid), alors que l'économie se multiplie : le
village écrase tout.

## 1. Le rythme des commandes (data/city.js, js/city.js)
- **Emplacements selon le rang** : `DATA.city.slots` = 3, 3, 4, 5 (Hameau, Bourg, Ville, Cité et
  au-delà). Un emplacement ouvert par un rang reçoit sa commande tout de suite, et l'onglet Rang
  l'annonce (« 5 commandes à la fois »).
- **Attente plus courte** : `order_wait` perd `order_wait_rank` (15 %) par rang, sans descendre
  sous `order_wait_floor` (40 %). Cela donne environ 50 s à la Cité.
- **Le convoi royal** : une grande commande, dès la Cité. Livraison ×3 (`scale`), elle compte pour
  3 (`worth`) dans le compteur des rangs. Elle porte un badge doré « ×3 commandes ».
- **Capitale** : 75 commandes au lieu de 90, puis +30 par rang au lieu de +40.

## 2. Les raids d'élite (data/enemies.js DATA.elites, js/raid.js)
À partir du rang `elite_rank` (la Cité), chaque raid, siège compris, arrive avec un fléau. Il y en a
un de plus tous les `elite_more_every` rangs, `elite_max` au plus. Le fléau est tiré au son de la
corne : il reste le temps d'adapter la défense.

| Fléau | Effet | Ce qui répond |
|---|---|---|
| Incendiaires | chaque pillard incendie le premier atelier qu'il longe (`elite_burn_max` par raid) | remparts et soldats en avant, ateliers à l'abri |
| Blindés | armure +2 | tours de mage, pièges, soldats |
| Coureurs | vitesse ×1,35, sortie en rangs serrés | pièges, ralentissement |
| Horde | ×1,5 pillards | tours de mage (dégâts de zone) |
| Deux fronts | la moitié de la colonne sort d'un autre côté | une défense sur plusieurs côtés |

- Chaque fléau ajoute `elite_bounty` (40 %) à la prime.
- La vie des pillards gagne `raid_rank_hp` (20 %) par rang au-delà de la Ville : la menace suit
  la croissance de la ville.
- Pas de nouvelle image : les pillards prennent la teinte de leur fléau (le dessin est mis en cache).
  Une plaque « Raid d'élite » s'affiche sous celle du raid, ou du siège. Une bannière explique les
  raids d'élite la première fois.
- `?demo=1&crank=3&elite=fire,flank` force des fléaux, pour les captures d'écran.

## 3. Le Siège royal (DATA.royal, js/raid.js, js/city.js)
La Capitale demande une épreuve finale (`royal: true` dans ses conditions), et ses raids passent
de 24 à 16.
- Le bouton « Affronter le Siège royal » apparaît dans l'onglet Rang, sous les conditions. Il
  s'active quand toutes les autres sont remplies, sans raid en cours ni corne sonnée.
- **3 vagues** à la suite, avec `royal_gap` (45 s) entre deux. Les deux premières sont
  `royal_size` (×1,4) plus nombreuses. Chaque vague a un fléau de plus (1, 2, 3), au moins autant
  que le rang en donne.
- La **dernière vague** est un siège mené par **Grakk le Fendeur** (niveau des sièges vus +
  `royal_lord_lvl`), avec 2 brutes et 1 chaman en plus, et des pillards 20 % plus solides. Le duel
  est proposé comme pour tout siège.
- **Victoire** : la condition est remplie, popularité +`royal_pop`, bannière, et on proclame
  ensuite la Capitale soi-même. **Défaite** (une vague qui passe) : bannière, puis `royal_retry`
  (10 min) avant de pouvoir retenter.
- Le Siège royal continue même pendant le répit d'un camp rasé. Un camp qui se relève ne repousse
  pas la vague suivante. Une nouvelle carte l'annule.
- `?demo=1&crank=3&royal=3` montre une vague en marche, pour les captures d'écran.

## Laissé pour plus tard
- Les décrets à choisir à chaque rang sans fin.
- Les crises.
