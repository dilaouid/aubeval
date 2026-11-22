# Tutos imagés des mini-jeux — plan

> Exécution : en natif dans la session (le joueur a dit « vas-y » au design et au plan annoncé).

**But :** remplacer le pavé `how + keys` de l'écran d'intro des six lieux par trois vignettes dessinées et une ligne de légende.

**Architecture :** chaque jeu enregistre, à côté de sa fabrique, une fonction `howto(o)` qui décrit ses vignettes (texte, touches, fonction de dessin) avec ses propres sprites. `js/venue.js` dessine le cadre commun (panneau, vignettes numérotées, pastilles de touches, badge « Nouveau ! », légende) en mode `intro`. Textes dans `data/venues.js` et ses couches `data/i18n/{en,es}/venues.js`.

**Spec :** `docs/superpowers/specs/2026-11-22-tutos-images-design.md`

## Contraintes globales
- Canevas logique 1280×720 ; le panneau doit tenir entre y 196 et y 534 (la plaque du nom du tenancier commence à y 540) et laisser libre la carte du jeu en haut à droite (x ≥ 924, y ≤ 190).
- Phrases de vignette : 4 à 6 mots. Image fixe ; seule la pastille clignote.
- Trois vignettes de base ; une vignette « Nouveau ! » par nouveauté active, quatre vignettes au plus.
- `node tools/i18n.js check` doit passer (FR, EN, ES).

## Points d'attention
- Série élevée : la Caserne à `doubleFrom` a deux nouveautés (feintes + coups doubles) → 3 + 2 = 5 > 4 : ne garder que la plus récente.
- Infobulle « Jouer » (`vn_play_tip`) et carte du jeu lisent encore `how` : `how` reste, en une phrase.
- Un jeu sans `howto` (lieu futur) : l'intro retombe sur l'ancien texte `how`.
- Texte de légende long en espagnol : la légende doit se réduire plutôt que déborder.

---

### Tâche 1 : le contrat `howto` et le cadre commun

**Fichiers :** `js/minigames.js` (`add`, `howto`), `js/venue.js` (`offer`, `draw`, nouveau `drawHowto`), `data/venues.js` (chaînes `ht_*`), `tools/i18n.js` (FIELDS + `steps legend news`), `tools/test-venues.js`.

**Interfaces produites :**
- `Minigames.add(id, factory, howto?)` ; `Minigames.howto(id, { level, d }) → { cards: [{ text, keys: string[], draw(x, y, w, h, t), fresh?: true }], legend: [{ text, img?: HTMLCanvasElement }] } | null`.
- Données par lieu : `say` (réplique courte), `steps: [3 phrases]`, `news: { <nouveauté>: phrase }`, `legend: [phrases]`.
- Chaînes : `ht_title`, `ht_new`, `ht_key_space`, `ht_key_enter`, `ht_key_click`, `ht_key_rclick`.

- [ ] Test (`tools/test-venues.js`) « every place explains its game in pictures » : pour chaque lieu, `howto(id, {level:0})` donne 3 vignettes, aucune `fresh`, chaque `text` non vide, `draw` une fonction, au moins une vignette avec `keys` non vide ; `legend` est un tableau.
- [ ] Test « new twists get a card, four at most » : boulangerie au niveau `breads.brioche.from`, caserne aux niveaux `feintFrom` et `doubleFrom`, loge au niveau `mirrorFrom` ont une vignette `fresh` ; jamais plus de 4 vignettes, à tout niveau de 0 à `venue_streak_max`.
- [ ] Code : `add/howto` ; `offer()` dit `d.say` quand le jeu a un `howto` ; `drawHowto()` en mode `intro`.

### Tâche 2 : les vignettes des six jeux
Dans `js/minigames.js` (café, marché, forge) et `js/minigame-{bakery,barracks,lodge}.js`, une fonction `howto(o)` par jeu, sur le contenu du spec. La loge tire son trou et ses pierres de `Stones.round` avec une graine fixe, pour une image stable.

### Tâche 3 : textes
`data/venues.js` : `say`, `steps`, `news`, `legend` des six lieux ; `how` raccourci à une phrase ; `keys` retiré. `node tools/i18n.js extract en` puis `es`, traduire les `null`, retirer les chemins `keys`, `node tools/i18n.js check`.

### Tâche 4 : vérification
`node tools/test-venues.js`, `node tools/test-i18n.js`, puis chaque lieu dans le navigateur (`?nosave&scene=venue&venue=<id>&game=intro`, et `&streak=6` pour les nouveautés), en FR et dans une autre langue.
