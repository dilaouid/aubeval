# La Loge utile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La Loge des bâtisseurs donne, dès qu'elle est posée, un rabais permanent sur les constructions et les améliorations, des réparations moins chères et de meilleurs remboursements, le tout selon son niveau.

**Architecture:** Un seul calcul, `Venue.lodgePerks(lvl)` dans `js/venue.js`, qui range le niveau de la Loge en trois parts (rabais, réparations, remboursement). `js/village.js` les lit dans `plans`, `repairCost` et `refund` ; rien n'entre dans la sauvegarde. L'interface (description, panneau d'infos, info-bulle d'amélioration, tutoriel) dit ces effets, en trois langues.

**Tech Stack:** JavaScript sans bundler, tests Node (`node tools/test-venues.js`, `node tools/i18n.js check`, `node tools/test-i18n.js`).

**Spec:** `docs/superpowers/specs/2026-11-22-loge-utile-design.md` (amende la section 3 de `2026-11-22-lieux-et-mini-jeux-design.md`).

## Global Constraints

- Niveau de la Loge pris en compte : le plus haut des Loges debout (une seule possible), **borné à `lodge_max_level` = 15** ; 0 s'il n'y en a pas. Une Loge abîmée garde ses effets.
- Rabais permanent : `lodge_plans_base` 0.02 au niveau 1 + `lodge_plans_step` 0.005 par niveau au-dessus (0.09 au niveau 15). Total avec le cadeau d'Aveline plafonné à `lodge_plans_cap` 0.25. Exclusions inchangées : grands chantiers, montée de classe, chemins, réparations.
- Réparations : `repair_pct` × (1 − `lodge_repair_cut` × niveau / 15), `lodge_repair_cut` 0.5.
- Remboursement : `refund_pct` + `lodge_refund_gain` × niveau / 15, `lodge_refund_gain` 0.04, **borné à `1 − lodge_plans_cap`** (jamais en dessous de `refund_pct`). Acheter puis démolir ne rapporte jamais.
- Tous les réglages sont dans `config.js` avec le préfixe `lodge_`, sur le modèle de `lodge_level_time` (ligne 169).
- Textes : le français est la source (`data/*.js`) ; anglais et espagnol dans `data/i18n/{en,es}/`, avec les mêmes `{trous}`. Suivre `docs/superpowers/specs/2026-11-21-multilangue-glossary.md`.
- Commits : le message seul, **sans** ligne `Co-Authored-By`.
- Base de départ : 40/40 tests de `tools/test-venues.js`, 24/24 de `tools/test-i18n.js`, `node tools/i18n.js check` sans manque.

## Review Focus

- Aucune Loge (bâtiments vides ou `state.buildings` indéfini) : tous les prix comme avant, sans erreur.
- Loge de niveau 40 : les effets ne dépassent pas ceux du niveau 15.
- Loge abîmée (`damaged: true`) : ses effets restent.
- Cadeau d'Aveline fort (0,5 forcé) plus Loge 15 : le rabais total reste à 25 %.
- Plafond de rabais réglé à 0,5 : le remboursement n'est jamais plus fort que `max(refund_pct, 1 − plafond)`.
- Rempart (réparer/démolir tout) : passe par `repairCost` et `refund`, donc profite aussi de la Loge.
- Une phrase de plus au tutoriel : le vérificateur de leçons ne signale aucun « rien ne couvre ».

---

### Task 1: `Venue.lodgePerks` et ses réglages

**Files:**
- Modify: `config.js` (après la ligne 169, `lodge_level_time`)
- Modify: `js/venue.js` (`giftTime` l.62, export l.745)
- Test: `tools/test-venues.js` (après le test « a gift won with no lodge standing », l.171)

**Interfaces:**
- Produces: `Venue.lodgePerks(lvl?: number) -> { plans: number, repair: number, refund: number }`, des parts entre 0 et 1. `lvl` omis : niveau de la Loge debout. Niveau 0 : trois zéros. Utilisée par la tâche 2 (prix) et la tâche 3 (textes).
- Produces: six réglages `tune.lodge_plans_base`, `lodge_plans_step`, `lodge_plans_cap`, `lodge_repair_cut`, `lodge_refund_gain`, `lodge_max_level`.

- [ ] **Step 1: Write the failing tests** in `tools/test-venues.js`, dans un bloc `// ---- Les avantages de la Loge ----`. Un petit `near(a, b)` (écart < 1e-9). Tests :
  - `lodge perks: none without a lodge` : `state.buildings = []` puis `undefined` → `lodgePerks()` vaut `{ plans: 0, repair: 0, refund: 0 }` et ne lève rien.
  - `lodge perks: level 1 and level 15` : niveau 1 → plans 0.02, repair 0.5/15, refund 0.04/15 ; niveau 15 → plans 0.09, repair 0.5, refund 0.04 (par `lodgePerks()` avec `state.buildings = [{ kind: 'lodge', lvl }]`, et `lodgePerks(15)` avec argument).
  - `lodge perks: no more past level 15, and a damaged lodge keeps them` : `lvl: 40` donne les mêmes parts que 15 ; `{ kind: 'lodge', lvl: 15, damaged: true }` aussi.

- [ ] **Step 2: Run** `node tools/test-venues.js` : les trois tests échouent (`lodgePerks is not a function`).

- [ ] **Step 3: Implement.** Ajouter les six réglages à `config.js` (valeurs de Global Constraints, `min`/`max`/`step` raisonnables, un commentaire d'une ligne chacun). Dans `js/venue.js`, sortir de `giftTime` le calcul du plus haut niveau en `topLevel(kind: string): number` (0 si aucun, gère `state.buildings` indéfini), faire utiliser `topLevel(id)` à `giftTime`, puis écrire `lodgePerks(lvl = topLevel('lodge'))` : `lvl = min(lvl, tune.lodge_max_level)`, 0 donne des zéros, sinon les formules de Global Constraints. L'ajouter à l'objet retourné (ligne 745).

- [ ] **Step 4: Run** `node tools/test-venues.js` : tout passe (43/43).

- [ ] **Step 5: Commit** `feat(lodge): the lodge's level turns into a standing discount, cheaper repairs and a better refund`

---

### Task 2: Les prix lisent la Loge

**Files:**
- Modify: `js/village.js` (`plans` l.484, `refund` l.488, `repairCost` l.489)
- Test: `tools/test-venues.js` (après les tests « plans d'Aveline », avant l.565)

**Interfaces:**
- Consumes: `Venue.lodgePerks(lvl?)` (tâche 1).
- Produces: `Village.cost`, `upgradeCost`, `repairCost`, `refund` changent seuls ; aucune nouvelle sortie.

- [ ] **Step 1: Write the failing tests** (réutiliser `loadVillage`, `gift`, `plain` ; mettre la Loge par `L.ctx.state.buildings = [{ kind: 'lodge', lvl, uid: 1, x: 0, y: 0 }]` et comparer avec `Village.scaleCost(B.cost, facteur)`) :
  - `lodge: a standing lodge makes buildings and upgrades cheaper` : maison, Loge 15 sans cadeau → facteur 0.91 ; Loge 15 avec cadeau 0.15 → 0.76 ; Loge 15 avec cadeau 0.5 (forcé) → 0.75 (plafond) ; Loge 1 sans cadeau → 0.98 ; pas de Loge → inchangé. Même chose pour `upgradeCost({ kind: 'house', lvl: 3 })` (avec le facteur d'amélioration du test existant).
  - `lodge: a great work costs the same with the lodge standing` : comme le test existant des monuments, avec une Loge 15 et le cadeau.
  - `lodge: repairs cost less, up to half` : `repairCost({ kind: 'house' })` = `scaleCost(cost, 0.3)` sans Loge, `scaleCost(cost, 0.15)` avec Loge 15.
  - `lodge: demolition gives back up to 74 %` : `refund` = `scaleCost(cost, 0.7)` sans Loge, `0.74` avec Loge 15, et un niveau 1 entre les deux.
  - `lodge: buying then demolishing never pays` : Loge 15 + cadeau 0.5, pour chaque bâtiment de `DATA.buildOrder` qui existe : chaque ressource de `refund` ≤ celle de `cost(k)` ; puis `tune.lodge_plans_cap = 0.5` : le remboursement ne dépasse pas `scaleCost(cost, 0.7)`.
  - `lodge: a rampart's repairs and refunds follow the lodge` : `Village.rampartRepairCost([{kind:'palisade', damaged:true}])` égal à `repairCost` de la même palissade avec Loge 15 (adapter à la forme réelle de `rampartRepairCost`).

- [ ] **Step 2: Run** `node tools/test-venues.js` : les nouveaux tests échouent.

- [ ] **Step 3: Implement** dans `js/village.js` :
  - `plans(kind)` : `1` pour un monument, sinon `1 - Math.min(tune.lodge_plans_cap, Venue.buff('build') + Venue.lodgePerks().plans)` ; mettre à jour le commentaire au-dessus.
  - `repairCost(b)` : `tune.repair_pct * (1 - Venue.lodgePerks().repair)`.
  - `refund(b)` : part = `Math.max(tune.refund_pct, Math.min(tune.refund_pct + Venue.lodgePerks().refund, 1 - tune.lodge_plans_cap))`.

- [ ] **Step 4: Run** `node tools/test-venues.js` : tout passe, les tests « plans d'Aveline » d'avant comprises.

- [ ] **Step 5: Commit** `feat(lodge): prices, repairs and refunds read the lodge`

---

### Task 3: Dire ce que fait la Loge, en trois langues

**Files:**
- Modify: `data/buildings.js` (`lodge.desc` l.127), `data/strings.js` (près de `up_lodge` l.194 ; `sec_*` l.195), `data/tutorial.js` (leçon `lodge`, étape `stone`, l.756-758)
- Modify: `js/screens.js` (`upgradeTip` l.629, `infoTab` avant le bloc `d.service || d.beauty` l.653)
- Modify: `data/i18n/en/{buildings,strings,tutorial}.js`, `data/i18n/es/{buildings,strings,tutorial}.js`
- Modify: `docs/superpowers/specs/2026-11-22-lieux-et-mini-jeux-design.md` (section 3 : une ligne renvoyant à la nouvelle conception)

**Interfaces:**
- Consumes: `Venue.lodgePerks(lvl?)`.
- Produces: clés `strings.up_lodge_perks` (`{plans}`, `{repair}`, `{refund}`), `strings.sec_lodge`, `strings.lodge_perks_now` (`{plans}`, `{cap}`, `{repair}`, `{refund}`) ; nombres en pourcentage passés par `fmtNum(x * 100)`.

- [ ] **Step 1: Textes français** (copie exacte) :
  - `buildings.lodge.desc` : « La maison des maîtres bâtisseurs, où Aveline dresse les plans d’Aubeval. Posée, elle fait bâtir et améliorer moins cher, réparer à bon compte et rend davantage à la démolition. Chaque niveau renforce ces avantages et allonge les plans d’Aveline, son cadeau de jeu. »
  - `up_lodge_perks` : « Loge : rabais {plans} %, réparations −{repair} %, remboursement {refund} % »
  - `sec_lodge` : « Les plans de la Loge »
  - `lodge_perks_now` : « Rabais permanent de {plans} % sur les constructions et les améliorations (avec le cadeau d’Aveline, {cap} % au plus). Réparations {repair} % moins chères. Démolition : {refund} % du prix rendus. »
  - tutoriel, étape `stone`, nouvelle réplique `say[2]` : « Et la Loge elle-même, dès qu’elle est posée, vous fait bâtir un peu moins cher, réparer à meilleur compte et récupérer davantage en démolissant. Plus elle monte, plus c’est net. »

- [ ] **Step 2: Interface** dans `js/screens.js` :
  - `upgradeTip` : pour `b.kind === 'lodge'`, en plus de la ligne `up_lodge` existante, une ligne `up_lodge_perks` aux valeurs du **niveau suivant** (`Venue.lodgePerks(b.lvl + 1)`).
  - `infoTab` : pour `b.kind === 'lodge'`, une section `sec_lodge` puis un `UI.wrap` du texte `lodge_perks_now` aux valeurs actuelles, en `C.good`.
  - Les pourcentages passent par `fmtNum(x * 100)` (une décimale au plus) ; `{cap}` vient de `tune.lodge_plans_cap`.

- [ ] **Step 3: Traductions** : `node tools/i18n.js extract en` puis `extract es` ajoute les lignes `null` des trois nouveaux textes et de la réplique ; traduire ces lignes, et mettre à jour la ligne de `buildings.lodge.desc` (et son commentaire français) dans les deux langues. Les `{trous}` identiques au français.

- [ ] **Step 4: Run** `node tools/i18n.js check` (0 missing, 0 unknown, 0 other holes, pour `en` et `es`), `node tools/test-i18n.js` (24/24), `node tools/test-venues.js` (le test « the tutorial covers the six places » inclus).

- [ ] **Step 5: Note dans l'ancienne conception** : sous le puce « Le bâtiment » de la section 3, une ligne « Amendé par `2026-11-22-loge-utile-design.md` : la Loge a maintenant des effets permanents. »

- [ ] **Step 6: Commit** `feat(lodge): the lodge says what it does, in three languages`

---

### Task 4: Vérifier dans le jeu

**Files:** aucun (vérification) ; la sauvegarde du joueur n'est jamais touchée.

- [ ] **Step 1: Démarrer** `preview_start` avec la configuration `aubeval-alt` (port 8767), dans **un onglet à soi** (`tabs_create`, `resize_window` 1280×720) : ne pas naviguer dans l'onglet du joueur.

- [ ] **Step 2: Ouvrir** `http://localhost:8767/?demo=1&nosave` (un village grandi, jamais sauvegardé). Poser la Loge, ouvrir son panneau : l'onglet Infos montre la description, la section « Les plans de la Loge » et ses trois pourcentages ; l'info-bulle du bouton Améliorer montre la ligne « Loge : rabais … » aux valeurs du niveau suivant. Contrôler à la capture : le texte ne déborde pas du panneau.

- [ ] **Step 3: Contrôler les prix** par la console de la page : `Village.cost('house')` avant et après avoir posé la Loge (−2 %), puis après l'avoir améliorée ; aucune erreur dans `read_console_messages`.

- [ ] **Step 4: Relancer** les trois commandes de tests ; tout au vert. Donner au joueur les captures et dire ce qui n'a pas été vérifié (l'espagnol à l'œil, les niveaux élevés en jeu).
