# Nouveaux lieux et mini-jeux Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trois nouveaux lieux où entrer et jouer — la Boulangerie, la Caserne et un bâtiment neuf, la Loge des bâtisseurs — chacun avec son jeu d'une demi-minute et un cadeau qui touche un autre pan du jeu.

**Architecture:** On garde le moule des trois lieux existants (`data/venues.js`, l'hôte `js/venue.js`, les jeux `js/minigames.js`). L'hôte apprend d'abord à recevoir un lieu de plus (inscription d'un jeu, pièce peinte commune, piste de musique d'emprunt, boîte des cadeaux qui ne déborde pas). Puis chaque lieu est fait en deux tâches : son jeu et son cadeau avec des dessins peints en code, puis ses images, ses répliques et ses traductions. Chaque nouveau jeu vit dans son fichier, sa logique tourne sans écran pour être testée par le joueur automatique.

**Tech Stack:** HTML + JavaScript sans build (scripts à globales partagées) ; tests node (`vm`, sans navigateur) ; serveur MCP PixelLab ; Python + PIL pour ranger les images ; navigateur via la configuration `aubeval-alt` (port 8767).

**Spec:** `docs/superpowers/specs/2026-11-22-lieux-et-mini-jeux-design.md`

## Global Constraints

- Branche `feat/lieux-et-mini-jeux`. Un commit par tâche au moins, sans ligne Co-Authored-By, jamais de push.
- **On enchaîne sans s'arrêter** (choix du joueur) : dès qu'un jeu est jouable, lui donner son adresse d'essai et continuer ; aucune tâche n'attend sa réponse. Les planches d'images lui sont envoyées en même temps que leur commit.
- Les règles, les chiffres et les textes des trois jeux existants ne changent pas. La clé de sauvegarde et sa version non plus.
- L'identifiant d'un lieu est le type de son bâtiment : `bakery`, `barracks`, `lodge`. Les cadeaux : `rise`, `soldier`, `build`.
- Sans cadeau en cours, chaque chiffre du jeu est exactement celui d'avant (`Venue.buff` rend 0).
- Chaque jeu dure 36 secondes, se joue entièrement au clavier et entièrement à la souris, et sa logique (`update`, `auto`) ne touche ni `document` ni le canevas : seul `draw` dessine.
- Aucun texte montré au joueur dans `js/` (le test `frenchInCode` de `tools/test-i18n.js` le refuse) : tout passe par `tr()` et `data/`. Les répliques qui parlent du héros s'accordent par `{g:masculin|féminin}`. Les commentaires de code sont en anglais.
- Tout texte nouveau existe en français, anglais et espagnol : `node tools/i18n.js check` sort à 0 à la fin de chaque tâche qui ajoute du texte.
- Un champ de `data/venues.js` qui porte du texte et dont le nom n'est pas dans `FIELDS` (`tools/i18n.js`) y est ajouté dans la même tâche.
- Les URL de test n'écrivent jamais la sauvegarde (`?demo=1`, `?nosave`, `?scene=…`). Ne jamais toucher `localStorage['aubeval.save.v1']` sans l'avoir copié dans une autre clé dans le même appel.
- PixelLab : dix tâches au plus à la fois ; chaque image gardée est notée dans un `ids.tsv` (identifiant, candidat, ce qui a été demandé). Les objets des jeux (pains, fours, bouclier, pierres) sont peints en code.
- Les valeurs chiffrées des jeux données ici sont des valeurs de départ : les régler pour tenir les critères du joueur automatique, et noter le réglage final dans le registre.

## Review Focus

- Une sauvegarde d'avant le chantier, avec une boulangerie et une caserne : au chargement `state.venue` reçoit les trois nouveaux lieux sans `NaN`, et le café, la halle et la forge gardent série, record et attente. Test : Task 1 step 1 (`adopt`).
- Un lieu dont le décor ou le personnage n'est pas chargé, ou a échoué : la pièce peinte commune et le portrait 64 × 64 s'affichent, sans erreur. Test : Task 1 step 1 (pièce commune) et step 6 (navigateur, image retirée).
- Une touche tenue enfoncée, ou deux fours visés dans la même image : une pression vaut une action, jamais une rafale. Test : Task 2 step 1, Task 4 step 1, Task 7 step 1 (« one press, one action »).
- Acheter au rabais d'Aveline puis démolir : jamais de gain ; fondations et étapes des grands chantiers au prix plein. Test : Task 7 step 1.
- La Loge démolie ou jamais bâtie alors que son cadeau court, ou gagné par l'aperçu sans bâtiment : la durée retombe sur `venue_buff_time`, sans erreur. Test : Task 6 step 1.

---

### Task 1: L'hôte reçoit un lieu de plus

**Files:**
- Create: `tools/test-venues.js`
- Modify: `js/minigames.js` (inscription et aides communes), `js/venue.js` (pièce commune, boîte des cadeaux, `giftTime`), `js/music.js` (piste d'emprunt), `data/venues.js` (une chaîne), `data/i18n/en/strings.js`, `data/i18n/es/strings.js`

**Interfaces:**
- Produces:
  - `Minigames.add(id: string, factory: (o) => game)` : inscrit un jeu ; `Minigames.make(id, o)` lève `Error('no game for ' + id)` pour un lieu sans jeu ; `Minigames.has(id): boolean`.
  - `Minigames.kit = { PANEL, BLUE, sprite, head, scoreBox, stepPops, drawPops, moodColor }` : les aides que les trois jeux existants utilisent déjà, exposées telles quelles.
  - `Venue.giftTime(id: string, key: string): number` : les secondes que dure le cadeau `key` gagné au lieu `id` ; ici toujours `tune.venue_buff_time` (Task 6 l'étend). `finish()` l'emploie pour `left` et `total`.
  - Une pièce peinte commune pour tout lieu sans entrée dans `PAINT` / `AMBIENT` (`PAINT.plain` : mur, sol, comptoir à `e.yC` ; pas d'ambiance).
  - `Music.trackOf(id: string): string` : la piste d'un lieu — la sienne si `FILES` l'a, sinon celle du lieu nommé par `DATA.venues[id].music`, sinon `'world'`. `want()` l'emploie pour la scène `venue`.
  - La boîte des cadeaux (`drawFame`) montre au plus cinq lignes, les cadeaux les plus près de leur fin d'abord ; au-delà, la cinquième ligne est `tr('vn_gifts_more', { n })` (« + {n} autres »).
  - `tools/test-venues.js` exporte `load(): { ctx, DATA, tune, Venue?, Minigames, games }` : `config.js`, les fichiers de `data/`, `js/minigames.js` et les fichiers `js/minigame-*.js` dans un bac à sable `vm`, avec des bouchons pour `UI`, `PAL`, `Venue` (ou le vrai s'il se charge), `text`, `tr` (rend la clé), `sfx`, `pressed`, `rng` (graine fixe), `document` absent. `play(id, { level, bot, secs })` joue une partie entière par `auto` + `update` à pas de 1/60 s et rend `{ score, done, lost, medal }`.

- [ ] **Step 1: Écrire les tests** dans `tools/test-venues.js` (même forme que `tools/test-heroes.js` : liste de tests, `ok` / `FAIL`, code de sortie 1) :
  - `every place of venueOrder has its building, its keeper, its game, and well-formed numbers` : pour chaque `id` de `DATA.venueOrder` — `DATA.buildings[id]`, `DATA.keepers[DATA.venues[id].keeper]`, `Minigames.has(id)`, `medals` de 3 valeurs strictement croissantes, `pop` de 4 valeurs, chaque `buffs[key]` de 4 valeurs commençant par 0 et `DATA.venueBuffs[key]` défini.
  - `an unknown place has no game` : `Minigames.has('nowhere') === false` ; `Minigames.make('nowhere', {})` lève.
  - `a save from before a place existed gets it, and keeps the others` : `Venue.adopt({ venue: { v: 1, streak: { cafe: 3 }, wait: { cafe: 12 }, best: { cafe: 40 }, played: { cafe: 5 }, met: { cafe: 1 }, chat: { cafe: 2 }, buffs: {} } })` → pour chaque `id` de `venueOrder` les six compteurs sont des nombres ; `streak.cafe === 3`, `best.cafe === 40`, `wait.cafe === 12`.
  - `a place with no track of its own borrows one` : `Music.trackOf('cafe') === 'cafe'` ; avec `DATA.venues.x = { music: 'forge' }`, `Music.trackOf('x') === 'forge'` ; sans `music`, `'world'`.
  - `a gift lasts venue_buff_time` : `Venue.giftTime('cafe', 'pop') === tune.venue_buff_time`.
  Si `js/venue.js` ou `js/music.js` ne se chargent pas dans `vm` avec des bouchons raisonnables, en extraire la fonction testée dans une forme qui se charge (sans changer son comportement) plutôt que d'abandonner le test.
- [ ] **Step 2:** `node tools/test-venues.js` — Attendu : FAIL (`Minigames.has` n'existe pas, `Music.trackOf` n'existe pas, `Venue.giftTime` n'existe pas).
- [ ] **Step 3: Implémenter** les interfaces ci-dessus. `MAKE` devient la table que `add` remplit ; les trois jeux existants s'y inscrivent par `add` dans `js/minigames.js` même, sans autre changement.
- [ ] **Step 4:** `node tools/test-venues.js` — Attendu : tous `ok`. `node tools/test-i18n.js && node tools/i18n.js extract en && node tools/i18n.js extract es`, traduire `strings.vn_gifts_more`, `node tools/i18n.js check` — Attendu : sortie 0.
- [ ] **Step 5: Navigateur, rien n'a bougé.** `?nosave&scene=venue&venue=cafe&game=1`, puis `market`, puis `forge` : le jeu tourne, le résultat s'affiche, console propre.
- [ ] **Step 6: Navigateur, la pièce commune.** Depuis la console d'une page `?nosave&demo=1` : `DATA.venues.bakery = Object.assign({}, DATA.venues.cafe, { keeper: 'baker', music: 'cafe' }); DATA.venueOrder.push('bakery'); Minigames.add('bakery', o => Minigames.make('cafe', o)); Venue.preview('bakery')` : la pièce peinte commune et le portrait de Mélisande s'affichent, sans erreur ; aucune requête vers `assets/music/undefined` (`read_network_requests`). Avec six cadeaux posés à la main dans `state.venue.buffs`, la boîte montre quatre cadeaux et « + 2 autres » sans déborder.
- [ ] **Step 7: Commit** `feat(venues): the host takes one more place`.

---

### Task 2: La Boulangerie — le jeu « La fournée » et le cadeau « Pain chaud »

**Files:**
- Create: `js/minigame-bakery.js`
- Modify: `index.html` (balise `<script>` après `js/minigames.js`, et la ligne du commentaire qui liste les fichiers), `data/venues.js` (`DATA.venues.bakery`, `DATA.venueBuffs.rise`, `DATA.venueOrder`, chaînes `bk_*`), `config.js` (réglages `bakery_*`), `js/city.js` (`mealSat`), `tools/test-venues.js`

**Interfaces:**
- Consumes: `Minigames.add`, `Minigames.kit`, `load()` et `play()` de Task 1.
- Produces: `DATA.venues.bakery` avec au moins `keeper: 'baker'`, `music: 'cafe'`, `title: 'La fournée'`, `unit: 'pains dorés'`, `medals: [24, 38, 52]`, `pop: [0, 2, 4, 6]`, `buffs: { rise: [0, 0.2, 0.4, 0.6] }`, `points: { perfect: 3, golden: 2, dark: 1 }`, `ramp: { ovens: 3, ovensEvery: 3, ovensMax: 5, bake: 0.03, window: 0.04 }`, `breads: [{ id: 'baguette', bake: 0.7 }, { id: 'miche', bake: 1 }, { id: 'brioche', bake: 1.4, from: 2 }]` (chacun avec son `name`), et des répliques provisoires mais complètes (`greet`, `ready`, `wait`, `chat`, `tips`, `glad`, `cross`, `lost`, `after` de 4 lignes, `how`, `keys`) pour que l'hôte ne lise jamais `undefined`.
  Réglages de départ : `bakery_time` 36, `bakery_bake` 5 (secondes pour qu'une miche brûle, série 0), `bakery_bake_min` 2.5, `bakery_gold_from` 0.55 et `bakery_gold_to` 0.8 (la fenêtre dorée, en part de la cuisson), `bakery_window_min` 0.1, `bakery_perfect` 0.25 (part centrale de la fenêtre qui vaut « Parfait »), `bakery_reload` 0.5, `bakery_strikes` 4.
  L'objet du jeu expose, en plus du contrat commun, `ovens: [{ bread, t (0..1), state: 'baking' | 'empty' }]` et `take(i: number)` (sortir le pain du four `i`), que `update` appelle sur `Digit1`…`Digit5` et que `draw` branche sur un `UI.button` par four.

- [ ] **Step 1: Tests** ajoutés à `tools/test-venues.js` :
  - `la fournée: a flawless baker gets gold, and bronze at least deep in a streak` : `play('bakery', { level: 0, bot: { pace: 0.05, err: 0 } }).medal === 3` ; au niveau 10, `medal >= 1`.
  - `la fournée: doing nothing loses the batch` : sans `auto`, 36 s de `update` → `lost === true`, `done === true`, et `why` non vide.
  - `la fournée: ends on its own` : `done === true` au plus tard à `bakery_time + 1` secondes.
  - `la fournée: one press, one loaf` : `pressed('Digit1')` vrai pendant 30 images de suite sur un pain doré → un seul pain compté (le score monte d'une seule prise).
  - `la fournée: a pale loaf is worth nothing, a golden one 2, the heart of the window 3, a dark one 1` : poser `ovens[0].t` à 0.3, au bord de la fenêtre, à son centre, à 0.9, appeler `take(0)`, lire la variation du score.
  - `pain chaud: a fed house's satisfaction climbs 60 % more a meal with the gold gift, and no faster without` : `City.mealSat(b, true)` avec `Venue.buff('rise')` à 0.6 vaut 1.6 fois sa valeur à 0 ; `City.mealSat(b, false)` ne change pas. (Si `js/city.js` ne se charge pas dans `vm`, extraire la part testée ; à défaut, ruling et mesure dans le navigateur, sorties notées au registre.)
- [ ] **Step 2:** `node tools/test-venues.js` — Attendu : FAIL sur les six (pas de jeu `bakery`, `mealSat` sans cadeau).
- [ ] **Step 3: Écrire `js/minigame-bakery.js`** : la fabrique `bakery(o)` inscrite par `Minigames.add('bakery', bakery)`. Règles de la spec, section « La Boulangerie ». `auto(dt, bot)` sort chaque pain au centre de sa fenêtre, décalé de `bot.err` (part de la fenêtre), au plus une prise toutes les `bot.pace` secondes. `draw` : les fours en rangée dans la zone de jeu, la jauge de chaque pain avec sa fenêtre dorée visible, le numéro de touche sur chaque four, les fautes restantes, l'en-tête et le score par `kit.head` et `kit.scoreBox` ; pains et fours peints par `kit.sprite`.
- [ ] **Step 4: Brancher le cadeau** : dans `City.mealSat` (`js/city.js`), la branche positive est multipliée par `(1 + Venue.buff('rise'))`.
- [ ] **Step 5:** `node tools/test-venues.js` — Attendu : tous `ok`. Régler médailles et vitesses si le critère du joueur automatique l'exige, et relancer.
- [ ] **Step 6: Traductions** : `node tools/i18n.js extract en && node tools/i18n.js extract es`, traduire, `node tools/i18n.js check && node tools/test-i18n.js` — Attendu : sortie 0, 24/24 au moins.
- [ ] **Step 7: Navigateur.** `?nosave&demo=1` : le panneau d'une boulangerie a son bouton « Entrer » ; on entre, on joue une partie à la souris, une au clavier ; pause par Échap, reprise, abandon ; le résultat donne la médaille et « Pain chaud ». `?nosave&scene=venue&venue=bakery&game=1&secs=40` : la partie du joueur automatique finit et affiche son résultat. Console propre.
- [ ] **Step 8: Commit** `feat(venues): the bakery's game, La fournée, and its gift`. Donner au joueur l'adresse d'essai `?nosave&scene=venue&venue=bakery` et continuer.

---

### Task 3: La Boulangerie — images, répliques, traductions

**Files:**
- Create: `tools/make_venues.py`, `tools/venues/ids.tsv`, `tools/venues/raw/bg_bakery.png`, `tools/venues/raw/char_baker/frame_001.png`…`frame_008.png`, `assets/sprites/venue/bg_bakery.png`, `assets/sprites/venue/char_baker.png`
- Modify: `assets/manifest.js` (listes `venue.bg.*` et `venue.char.*`), `data/venues.js` (répliques finales de Mélisande, `line`, `tall`, `faces`, `faces64`), `data/i18n/en/venues.js`, `data/i18n/es/venues.js`

**Interfaces:**
- Produces: `python tools/make_venues.py` copie `tools/venues/raw/bg_<lieu>.png` (640 × 360 exactement, sinon refus) vers `assets/sprites/venue/bg_<lieu>.png`, et assemble `tools/venues/raw/char_<tenancier>/frame_001..008.png` (160 × 160 chacune, sinon refus) en une bande 1280 × 160 `assets/sprites/venue/char_<tenancier>.png` ; `--check` contrôle les tailles de ce qui est bâti (sortie 1 si une est fausse ou si un brut attend sans avoir été bâti). Il ne touche pas aux six images existantes, qui n'ont pas de brut dans le dépôt.

- [ ] **Step 1: Générer le décor** du fournil, 640 × 360, avec `assets/sprites/venue/bg_cafe.png` en image de style : un fournil médiéval vu de face, fours de brique au fond, étals de pains, sacs de farine, lumière chaude, le milieu du bas dégagé pour la tenancière et le bas de l'image calme (le panneau du jeu le couvre).
- [ ] **Step 2: Générer Mélisande en grand**, 160 × 160, avec la première image de `assets/sprites/portraits/baker.png` en référence de visage et une image de `char_innkeeper.png` en style ; garder le candidat au visage le plus proche ; l'animer en 8 images (`animate_image`, première et dernière image identiques, « standing still, smiling, breathing gently »). Vérifier que les yeux ne restent pas fermés plus d'une image.
- [ ] **Step 3: Écrire `tools/make_venues.py` et bâtir** : `python tools/make_venues.py --check` — Attendu avant : sortie 1 (« not built ») ; après `python tools/make_venues.py` : sortie 0. Noter les deux images dans `tools/venues/ids.tsv`.
- [ ] **Step 4: Manifeste** : `venue.bg.bakery` et `venue.char.baker` ajoutés aux deux listes. `node tools/test-assets.js` — Attendu : 0 missing.
- [ ] **Step 5: Répliques finales** de Mélisande dans `data/venues.js`, dans le ton de ses répliques de panneau (`data/people.js`) : accueil, trois « prêt », deux « attente », cinq bavardages dont un sur le héros accordé par `{g:…}`, trois amorces de conseil, mots pendant le jeu, quatre lignes d'après-jeu. Régler `line`, `tall`, `faces` (images de la bande 160 px : contente, contrariée) et `faces64` sur ce qu'on voit.
- [ ] **Step 6: Traductions** : extraire, traduire en anglais et en espagnol, `node tools/i18n.js check`, `node tools/i18n.js gender fr`, `gender en`, `gender es` — Attendu : sortie 0, rien à reprendre.
- [ ] **Step 7: Navigateur.** `?nosave&scene=venue&venue=bakery` : décor, Mélisande posée sur le sol du décor, sa bulle lisible ; « Discuter » trois fois ; une partie ; les visages content et contrarié pendant le jeu. `?lang=en` et `?lang=es` : aucun français. Envoyer au joueur une planche du lieu (capture).
- [ ] **Step 8: Commit** `feat(venues): the bakery's room, Mélisande in full, her lines in three languages`.

---

### Task 4: La Caserne — le jeu « Parade ! » et le cadeau « Bien drillés »

**Files:**
- Create: `js/minigame-barracks.js`
- Modify: `index.html`, `data/venues.js` (`DATA.venues.barracks`, `DATA.venueBuffs.soldier`, `DATA.venueOrder`, chaînes `bq_*`), `config.js` (`barracks_*`), `js/units.js`, `js/screens.js` (attaque montrée dans le panneau de la caserne), `tools/test-venues.js`

**Interfaces:**
- Consumes: `Minigames.add`, `Minigames.kit`, `load()`, `play()`.
- Produces:
  - `Units.atkOf(kind: string): number` : l'attaque d'un soldat de ce type maintenant, `DATA.units[kind].atk * Units.drill() * (1 + Venue.buff('soldier'))`. Les deux appels de dégâts de `js/units.js` (`Raid.hurt`, `Camp.hit`) et l'affichage du panneau (`js/screens.js`) l'emploient ; `drill()` et `maxHp` ne changent pas.
  - `DATA.venues.barracks` : `keeper: 'captain'`, `music: 'forge'`, `title: 'Parade !'`, `unit: 'parades'`, `medals: [22, 34, 46]`, `pop: [0, 2, 4, 6]`, `buffs: { soldier: [0, 0.1, 0.2, 0.3] }`, `points: { quick: 3, good: 2 }`, `ramp: { lead: 0.04, feintFrom: 2, doubleFrom: 4 }`, `sides: ['up', 'right', 'down', 'left']` avec leur nom affiché, et les répliques provisoires complètes.
  Réglages de départ : `barracks_time` 36, `barracks_lead` 1.3 (secondes entre l'annonce et l'impact), `barracks_lead_min` 0.55, `barracks_gap` 0.45, `barracks_quick` 0.33 (part du délai qui vaut « Vif ! »), `barracks_feint` 0.3 et `barracks_double` 0.25 (parts des coups, une fois venus), `barracks_hits` 5.
  L'objet du jeu expose `blow: { side, t (0..1), feint?: { at, to } } | null` et `parry(side: string)`, que `update` appelle sur les quatre flèches du clavier et que `draw` branche sur quatre `UI.button`.

- [ ] **Step 1: Tests** ajoutés à `tools/test-venues.js` :
  - `parade: a flawless guard gets gold, and bronze at least deep in a streak` (niveau 0 → 3 ; niveau 10 → ≥ 1 ; le joueur automatique sans erreur attend la fin d'une feinte avant de parer).
  - `parade: standing still loses the drill` (`lost`, `why` non vide) ; `parade: ends on its own`.
  - `parade: one press, one parry` : une flèche tenue 30 images ne pare qu'un coup, et ne compte pas comme mauvais côté au coup suivant.
  - `parade: the right side in time is worth 2, in the first third 3; the wrong side or too late is a hit`.
  - `parade: who parries the first side of a feint is hit; who waits parries` (niveau ≥ 2, coup forcé en feinte).
  - `bien drillés: a soldier deals 30 % more with the gold gift, has the same health, and deals the same without` : `Units.atkOf('militia')` à `buff('soldier')` 0.3 vaut 1.3 fois sa valeur à 0 ; `Units.maxHp` inchangé.
- [ ] **Step 2:** `node tools/test-venues.js` — Attendu : FAIL sur les sept.
- [ ] **Step 3: Écrire `js/minigame-barracks.js`** selon la spec, section « La Caserne ». `draw` : le héros au centre avec son bouclier (peint), les quatre côtés, l'anneau qui se referme du côté annoncé, le mot de Hilde (`o.react`), les coups reçus restants.
- [ ] **Step 4: Brancher le cadeau** : `Units.atkOf` et ses trois lecteurs.
- [ ] **Step 5:** `node tools/test-venues.js` — Attendu : tous `ok` ; régler si besoin.
- [ ] **Step 6: Traductions**, comme Task 2 step 6.
- [ ] **Step 7: Navigateur.** `?nosave&demo=1` : le panneau de la caserne montre « Entrer » **sans recouvrir** la liste d'entraînement des soldats ni ses boutons ; on entre, une partie à la souris, une au clavier, pause, abandon. Après une médaille, le panneau de la caserne montre l'attaque augmentée. Pendant un raid (`state.raid.active`), le bouton « Entrer » n'est pas offert. `?nosave&scene=venue&venue=barracks&game=1&secs=40`. Console propre.
- [ ] **Step 8: Commit** `feat(venues): the barracks' game, Parade !, and its gift`. Donner l'adresse d'essai au joueur et continuer.

---

### Task 5: La Caserne — images, répliques, traductions

**Files:**
- Create: `tools/venues/raw/bg_barracks.png`, `tools/venues/raw/char_captain/frame_001..008.png`, `assets/sprites/venue/bg_barracks.png`, `assets/sprites/venue/char_captain.png`
- Modify: `tools/venues/ids.tsv`, `assets/manifest.js`, `data/venues.js`, `data/i18n/en/venues.js`, `data/i18n/es/venues.js`

**Interfaces:**
- Consumes: `tools/make_venues.py` de Task 3.

- [ ] **Step 1: Générer** le décor (la cour d'exercice : mannequins de paille, râteliers d'armes, cibles, palissade, bannières, milieu du bas dégagé) et Hilde en grand (référence : `portraits/captain.png` ; 8 images), par les recettes de Task 3 steps 1 et 2.
- [ ] **Step 2:** `python tools/make_venues.py && python tools/make_venues.py --check && node tools/test-assets.js` après ajout au manifeste — Attendu : sortie 0, 0 missing. `ids.tsv` complété.
- [ ] **Step 3: Répliques finales** de Hilde (ton : ses répliques de `data/people.js`, ordres brefs). Une des lignes « prêt » ou de bavardage dit que l'exercice se fait au son du cor, avant que les gobelins n'arrivent.
- [ ] **Step 4: Traductions et contrôles**, comme Task 3 step 6.
- [ ] **Step 5: Navigateur**, comme Task 3 step 7 pour `venue=barracks` ; planche envoyée au joueur.
- [ ] **Step 6: Commit** `feat(venues): the drill yard, Hilde in full, her lines in three languages`.

---

### Task 6: La Loge des bâtisseurs — le bâtiment

**Files:**
- Create: `tools/buildings/raw/lodge_l1.png`, `lodge_l5.png`, `lodge_l10.png`, `lodge_l15.png`, `assets/sprites/iso/lodge_l1.png`…`lodge_l15.png`
- Modify: `data/buildings.js` (`lodge`, onglet `city`), `data/people.js` (`DATA.keepers.guide`), `data/strings.js` (`up_lodge`), `config.js` (`lodge_level_time`), `js/venue.js` (`giftTime`), `js/screens.js` (`upgradeTip`), `assets/manifest.js` (`iso.lodge`), `tools/make_buildings.py` (un `_l1` brut), `tools/buildings/ids.tsv`, `tools/test-venues.js`, couches i18n

**Interfaces:**
- Consumes: `Venue.giftTime` de Task 1.
- Produces:
  - `DATA.buildings.lodge` : `name: 'Loge des bâtisseurs'`, `card: 'Loge'`, `sprite: 'iso.lodge'`, `w: 2, h: 2`, `cost: { planks: 60, stone: 60, gold: 150 }`, `unique: true`, `unlock: { rank: 2 }`, `keeper: 'guide'`, `beauty: 1`, `glow` ; dans `DATA.buildTabs` à l'onglet `city`, après `market`.
  - `DATA.keepers.guide` : `name: 'Aveline'`, `title: 'Maîtresse bâtisseuse'`, trois `lines` de panneau.
  - `lodge_level_time` : 20 (secondes par niveau de la Loge au-dessus du premier).
  - `Venue.giftTime(id, key)` : `tune.venue_buff_time`, plus, quand `DATA.venues[id].perLevel` nomme un réglage, `tune[perLevel] * (niveau du plus haut bâtiment de type id − 1)` ; 0 de plus sans bâtiment. Task 7 pose `perLevel: 'lodge_level_time'` sur la Loge.
  - `upgradeTip` annonce pour la Loge, à chaque niveau, `tr('up_lodge', { n: tune.lodge_level_time })` (« Plans d’Aveline : +{n} s »).
  - `tools/make_buildings.py` installe aussi un `tools/buildings/raw/<kind>_l1.png` quand il existe (recadré à ses pixels opaques), et c'est alors lui qui donne la largeur de référence.

- [ ] **Step 1: Tests** ajoutés à `tools/test-venues.js` :
  - `the lodge is a building one can place once, from the rank Ville` : entrée complète, `unique`, `unlock.rank === 2`, présente dans `DATA.buildOrder`.
  - `Aveline keeps it` : `DATA.keepers.guide.name === 'Aveline'`.
  - `each level of the lodge adds lodge_level_time to its gift, and to no other` : avec `DATA.venues.lodge = { perLevel: 'lodge_level_time' }` et un bâtiment `lodge` de niveau 1 → `giftTime('lodge', 'build') === 300` ; de niveau 15 → `580` ; `giftTime('cafe', 'pop') === 300`.
  - `a gift won with no lodge standing lasts the plain time` : `state.buildings = []` → `giftTime('lodge', 'build') === 300`, sans erreur.
- [ ] **Step 2:** `node tools/test-venues.js` — Attendu : FAIL sur les quatre.
- [ ] **Step 3: Implémenter** données, `giftTime`, `upgradeTip`, chaîne `up_lodge`. Tout ce qui affiche la durée d'un cadeau à gagner ou gagné (la carte du jeu, la ligne du résultat) lit `giftTime` ou le `total` du cadeau, jamais `venue_buff_time` en direct.
- [ ] **Step 4:** `node tools/test-venues.js` — Attendu : tous `ok`.
- [ ] **Step 5: Générer la Loge** vue du village : niveau 1 (`create_map_object`, la vue et le socle carré des bâtiments 2 × 2 existants, avec `assets/sprites/iso/cafe_l1.png` en référence de style : une loge de maîtres bâtisseurs à colombages, un établi et des plans dehors, un petit échafaudage, une équerre et un compas en enseigne), puis ses états l5, l10, l15 enchaînés (`create_object_state`, « keep the same view, size and square ground base » : pierre de taille au rez-de-chaussée ; un étage et une grue de chantier en bois ; enseigne dorée, fanions bleu et or, lanternes). Recettes et formulations : `tools/buildings/ids.tsv`.
- [ ] **Step 6:** `python tools/make_buildings.py && python tools/make_buildings.py --check` — Attendu : les quatre `lodge_*` bâtis, mêmes largeurs, sortie 0. Manifeste : `'iso.lodge': isoLooks('lodge')`. `node tools/test-assets.js` — Attendu : 0 missing.
- [ ] **Step 7: Traductions et contrôles** (`check`, `test-i18n`).
- [ ] **Step 8: Navigateur.** `?nosave&demo=1` : au rang Ville la carte « Loge » est dans l'onglet de la ville ; on la pose ; une deuxième est refusée ; son panneau montre Aveline et sa réplique ; l'info-bulle d'amélioration annonce « Plans d’Aveline : +20 s » à chaque niveau ; ses quatre aspects aux niveaux 1, 5, 10, 15 (`b.lvl` posé à la main) tiennent sur leur terrain. Pas encore de bouton « Entrer » (le lieu vient à Task 7). Planche des quatre aspects envoyée au joueur.
- [ ] **Step 9: Commit** `feat(venues): the builders' lodge, a new building kept by Aveline`.

---

### Task 7: La Loge — les pierres, le jeu « La bonne pierre » et le cadeau « Plans d'Aveline »

**Files:**
- Create: `js/stones.js`, `js/minigame-lodge.js`
- Modify: `index.html` (deux balises, `stones.js` avant `minigame-lodge.js`), `data/venues.js` (`DATA.venues.lodge`, `DATA.venueBuffs.build`, `DATA.venueOrder`, chaînes `lg_*`), `config.js` (`lodge_*`), `js/village.js` (`cost`, `upgradeCost`), `tools/test-venues.js`

**Interfaces:**
- Consumes: `Minigames.add`, `Minigames.kit`, `load()`, `play()`, `giftTime` et `perLevel` de Task 6.
- Produces:
  - `Stones` (pur, sans dessin ; une pierre est une liste de cases `[x, y]`) :
    `shape(n: number, rnd: () => number): cells` — une forme connexe de `n` cases ;
    `turn(cells): cells` — un quart de tour ; `mirror(cells): cells` — son miroir ;
    `same(a, b): boolean` — égales à une translation près ;
    `fits(hole, stone): boolean` — égales à une translation et des quarts de tour près, jamais par retournement ;
    `round(level: number, ramp, rnd): { hole: cells, stones: cells[4], right: number }` — un trou et quatre pierres dont exactement une, `stones[right]`, entre.
  - `DATA.venues.lodge` : `keeper: 'guide'`, `music: 'market'`, `perLevel: 'lodge_level_time'`, `title: 'La bonne pierre'`, `unit: 'pierres posées'`, `medals: [14, 22, 30]`, `pop: [0, 2, 4, 6]`, `buffs: { build: [0, 0.05, 0.1, 0.15] }`, `ramp: { cells: 4, cellsEvery: 3, cellsMax: 7, turnFrom: 1, mirrorFrom: 3 }`, répliques provisoires complètes.
  Réglages de départ : `lodge_time` 36, `lodge_strikes` 4, `lodge_chain` 3 (bonnes pierres de suite à partir desquelles chacune vaut 2), `lodge_chain_gap` 2.5 (secondes au-delà desquelles la chaîne retombe).
  L'objet du jeu expose `round` (le tirage en cours) et `choose(i: number)`, appelé sur `Digit1`…`Digit4` et par quatre `UI.button`.
  - `Village.cost(kind)` et `Village.upgradeCost(b)` : multipliés par `(1 - Venue.buff('build'))` quand `DATA.buildings[kind].monument` est faux ; inchangés pour un grand chantier.

- [ ] **Step 1: Tests** ajoutés à `tools/test-venues.js` :
  - `stones: a shape of n cells is connected and has n cells` (n de 4 à 7, 500 graines).
  - `stones: four turns bring a stone back, a turned stone fits, a mirrored one does not unless it is its own mirror`.
  - `stones: in every round exactly one of the four stones fits` : niveaux 0 à 10, 500 graines chacun ; `stones.filter(s => Stones.fits(hole, s)).length === 1` et c'est `stones[right]`.
  - `stones: from the first win the stones are shown turned, from the third one of the wrong ones is the mirror of the right one` (sur les graines où la forme n'est pas son propre miroir).
  - `la bonne pierre: a sharp eye gets gold, and bronze at least deep in a streak` ; `choosing nothing ends with no medal` ; `ends on its own` ; `one press, one stone` ; `four wrong stones bring the wall down` (`lost`, `why` non vide).
  - `plans d'Aveline: a building and an upgrade cost 15 % less with the gold gift, and the same without` : `Village.cost('house')` et `Village.upgradeCost({ kind: 'house', lvl: 3 })`, chaque ressource `Math.max(1, Math.ceil(...))` du prix plein × 0.85.
  - `plans d'Aveline: a great work's foundations and stages cost the same` : `Village.cost('cathedral')` et `Village.upgradeCost` d'un bâtiment `monument` identiques avec et sans cadeau.
  - `plans d'Aveline: nothing is refunded for more than it was paid` : pour chaque type de `DATA.buildOrder` non décor, avec le cadeau à 0.15, `Village.refund({ kind })` ≤ `Village.cost(kind)` (compte du type à 0) ressource par ressource.
- [ ] **Step 2:** `node tools/test-venues.js` — Attendu : FAIL sur tous les nouveaux.
- [ ] **Step 3: Écrire `js/stones.js`.** Pour `round` : tirer la forme (`ramp.cells`, une case de plus toutes les `cellsEvery` victoires, `cellsMax` au plus) ; les fausses pierres déplacent une case de la bonne en gardant la forme connexe, et sont rejetées tant qu'elles entrent dans le trou ou qu'elles sont égales entre elles ; à partir de `mirrorFrom`, l'une est `mirror(bonne)` quand celui-ci n'entre pas ; à partir de `turnFrom`, chaque pierre est montrée tournée d'un nombre de quarts de tour tiré au sort ; l'ordre des quatre est tiré au sort.
- [ ] **Step 4: Écrire `js/minigame-lodge.js`** selon la spec, section « La Loge ». `auto(dt, bot)` choisit `round.right`, ou une autre pierre avec la probabilité `bot.err`, au plus une fois toutes les `bot.pace` secondes. `draw` : le mur qui monte rang par rang, le trou sombre, les quatre pierres numérotées dans le panneau du bas, les fautes restantes, la chaîne.
- [ ] **Step 5: Brancher le cadeau** dans `cost` et `upgradeCost` (`js/village.js`).
- [ ] **Step 6:** `node tools/test-venues.js` — Attendu : tous `ok` ; régler si besoin.
- [ ] **Step 7: Traductions et contrôles.**
- [ ] **Step 8: Navigateur.** `?nosave&demo=1` avec une Loge posée : « Entrer », une partie à la souris, une au clavier, pause, abandon. Après une médaille d'or : le prix d'une maison sur la barre de construction, dans l'info-bulle et réellement débité baisse de 15 % ; le prix d'amélioration d'un bâtiment aussi ; le prix des fondations de la cathédrale ne bouge pas ; la boîte des cadeaux montre la durée allongée quand la Loge est de niveau 5. `?nosave&scene=venue&venue=lodge&game=1&secs=40`. Console propre.
- [ ] **Step 9: Commit** `feat(venues): the lodge's game, La bonne pierre, and its gift`. Donner l'adresse d'essai au joueur et continuer.

---

### Task 8: La Loge — images, répliques, traductions

**Files:**
- Create: `tools/venues/raw/bg_lodge.png`, `tools/venues/raw/char_guide/frame_001..008.png`, `assets/sprites/venue/bg_lodge.png`, `assets/sprites/venue/char_guide.png`
- Modify: `tools/venues/ids.tsv`, `assets/manifest.js`, `data/venues.js`, couches i18n

- [ ] **Step 1: Générer** le décor (l'atelier de la Loge : grande table à plans, maquettes de bâtiments, équerres et compas au mur, pierres taillées, une fenêtre sur un échafaudage, milieu du bas dégagé) et Aveline en grand (référence : `portraits/guide.png` ; 8 images), par les recettes de Task 3.
- [ ] **Step 2:** `python tools/make_venues.py && python tools/make_venues.py --check && node tools/test-assets.js` — Attendu : sortie 0, 0 missing.
- [ ] **Step 3: Répliques finales** d'Aveline, dans la voix qu'elle a dans `data/tutorial.js` (elle dit « bourgmestre », elle enseigne, elle est fière de ses murs).
- [ ] **Step 4: Traductions et contrôles**, comme Task 3 step 6.
- [ ] **Step 5: Navigateur**, comme Task 3 step 7 pour `venue=lodge` ; planche envoyée au joueur.
- [ ] **Step 6: Commit** `feat(venues): the lodge's workshop, Aveline in full, her lines in three languages`.

---

### Task 9: Le tutoriel et la démonstration connaissent les six lieux

**Files:**
- Modify: `data/tutorial.js` (leçon `venue` ; leçon de la Loge), `data/i18n/en/tutorial.js`, `data/i18n/es/tutorial.js`, `js/screens.js` (village de démonstration), `index.html` (commentaires qui nomment trois lieux)

- [ ] **Step 1: Relever** dans le navigateur (`?nosave&demo=1`, console) ce que `js/tuto-check.js` signale aujourd'hui : la liste des « rien ne couvre ». Attendu : `venue:bakery`, `game:bakery`, `venue:barracks`, `game:barracks`, `venue:lodge`, `game:lodge`, `b:lodge` y sont.
- [ ] **Step 2: Leçon `venue`** : son `about` et ses deux premières répliques ne comptent plus « trois bâtiments » et ne nomment plus trois jeux ; elles disent que les lieux marqués d'un tenancier se visitent, et en citent quelques-uns. `covers` reçoit les `venue:` et `game:` de la boulangerie et de la caserne.
- [ ] **Step 3: Leçon de la Loge** : une leçon courte où Aveline présente sa Loge (`when` : la Loge bâtie, ou débloquée), `covers: ['b:lodge', 'venue:lodge', 'game:lodge']`, dans la forme des leçons de bâtiment voisines.
- [ ] **Step 4: Démonstration** : le village de `?demo=1` a une Loge, reliée à un chemin.
- [ ] **Step 5: Traductions et contrôles** : `node tools/i18n.js check && node tools/test-i18n.js`.
- [ ] **Step 6: Navigateur.** Le vérificateur ne signale plus aucun des sept ; `?nosave&demo=1` montre la Loge ; la leçon des lieux se lit en trois langues. Console propre.
- [ ] **Step 7: Commit** `feat(venues): the tutorial and the demo village know the six places`.

---

### Task 10: La vérification d'ensemble

- [ ] **Step 1:** `node tools/test-venues.js && node tools/test-assets.js && node tools/test-heroes.js && node tools/test-forge.js && node tools/test-i18n.js && node tools/i18n.js check && python tools/make_venues.py --check && python tools/make_buildings.py --check && python tools/make_heroes.py --check && python tools/test_make_heroes.py && python tools/test_make_boss_backdrop.py`. Attendu : tout vert.
- [ ] **Step 2: Une sauvegarde d'avant.** Sur une page `?nosave`, fabriquer un état de partie avec une boulangerie et une caserne mais un `venue` à trois lieux (série du café à 3), le passer par le chargement du jeu sans écrire la vraie sauvegarde (clé de secours copiée d'abord si on doit toucher `localStorage`), et vérifier : les deux bâtiments offrent « Entrer », le café garde sa série, `state.venue` ne contient aucun `NaN`.
- [ ] **Step 3: Les six lieux d'affilée** dans `?nosave&demo=1`, en français puis `?lang=en` et `?lang=es` : entrer, discuter, jouer, sortir. Sept cadeaux posés à la main dans `state.venue.buffs` : la boîte ne déborde pas. Une commande de cité « jouer à un jeu » forcée sur `bakery`, `barracks` puis `lodge` s'écrit avec le nom du lieu et se valide après une partie. `Art.progress.failed === 0`, console propre, aucune requête vers `assets/music/undefined`.
- [ ] **Step 4:** Remettre au joueur les trois adresses d'essai, les planches, les réglages finaux des trois jeux, et ce qui n'a pas pu être vérifié.
