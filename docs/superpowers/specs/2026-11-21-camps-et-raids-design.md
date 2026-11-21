# Camps et raids : raser sans perdre le fil — design court

## Pourquoi
Les rangs de la cité demandent de plus en plus de raids repoussés (1, 5, 14, 24, +8 par rang).
Raser un camp gobelin ouvre un répit de 10 min (`camp_respite`) sans aucun raid : environ un raid
et quart de perdu à chaque camp (un raid toutes les 8 min, `raid_interval`). Le joueur qui aime
raser les camps prend du retard sur les rangs. On veut que raser des camps et enchaîner les raids
aillent ensemble.

## Buts / non-buts
- But : pouvoir enchaîner camp rasé → nouveau camp → raid, sans attendre le répit.
- But : un camp rasé fait avancer le compteur de raids des rangs.
- Non-but : toucher à la force des camps, à leur butin ou au rythme normal des raids.
- Anti-but : que le répit disparaisse pour qui veut souffler. Il reste là par défaut.

## Approches envisagées
1. **Provoquer le prochain camp** pendant le répit (retenue).
2. **Un camp rasé compte comme des raids** pour les rangs (retenue, en plus de 1).
3. Petits raids des rescapés pendant le répit (écartée : longue à faire et à équilibrer).
Le joueur a choisi 1 + 2 : la 1 laisse enchaîner, la 2 récompense aussi celui qui prend son temps.

## Design
**Piste 1 — Provoquer.** Pendant le répit, la plaque du raid en haut de l'écran (« Camp en ruine ·
nouveau camp dans … ») gagne un bouton **Provoquer**, à la place de « Appeler ». Un clic :
le répit s'arrête, le nouveau camp se dresse tout de suite (`Camp.rise`, plus loin et plus fort,
comme d'habitude), puis son premier raid part aussitôt, comme un raid appelé (`Raid.start(true)`,
prime +25 % s'il est repoussé). Bulle d'aide : ce que fait le bouton et la prime.
Rien ne se passe si un raid est en cours ou si les raids n'ont pas encore commencé (`timer == null`).

**Piste 2 — Un camp vaut des raids.** Nouveau réglage `camp_raid_credit` (config.js, défaut 2,
de 0 à 6) : un camp rasé ajoute ce nombre au compteur de raids repoussés de la cité (celui des
rangs). Les commandes « Tenir la porte » ne comptent que les vrais raids. Le message de chute du
camp et la ligne de condition du rang (« Raids repoussés par ce village ») le disent.

## Laissé au constructeur
Les mots exacts des textes, la place précise du bouton sur la plaque, la sauvegarde (rien de neuf
à sauver : le compteur existe déjà).
