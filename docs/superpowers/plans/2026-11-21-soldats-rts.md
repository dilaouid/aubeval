# Soldats façon RTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les soldats meurent pour de bon, sont un peu moins forts, se commandent en file à la caserne et rejoignent seuls un point de ralliement.

**Architecture:** Tout se joue dans `js/units.js` : `hurt` retire le soldat de `state.units` au lieu de le coucher ; la caserne garde `b.train` (la recrue à l'exercice, inchangée, lue par le tutoriel et la carte) et gagne `b.queue` (les sortes en attente) et `b.rally` (un point de la carte). `js/screens.js` dessine la file et pose le ralliement au clic droit ; `js/world.js` dessine le drapeau. Rien de neuf à sauver à la main : ce sont des champs simples de la caserne.

**Tech Stack:** HTML + JavaScript sans build ; navigateur via `.claude/launch.json` (`aubeval`, port 8765), vérifications par `javascript_tool` (les modules `Units`, `Village`, `Raid`, `state`, `tune` sont des globales de la page) ; `node tools/i18n.js check` pour les textes.

**Spec:** `docs/superpowers/specs/2026-11-21-soldats-rts-design.md`

## Global Constraints

- `soldier_level_step` : valeur `0.05` (était `0.1`). `soldier_recover` est supprimé de config.js.
- `barracks_queue` : `{ value: 8, min: 0, max: 30, step: 1 }`, dans config.js, section « Units » : recrues en attente, en plus de celle à l'exercice.
- Maj + clic sur « Former » : 5 recrues, ou autant que la place, les habitants et les stocks le permettent.
- Une recrue est payée à la commande (`Units.cost(kind)`) et rendue en entier à l'annulation.
- L'habitant d'un soldat mort redevient libre ; aucune population n'est perdue.
- Pas de nouveau sprite, pas de nouveau bâtiment. Les raids et les camps ne changent pas.
- Tout texte nouveau ou changé existe en français (data/*.js) et dans les couches `data/i18n/en` et `data/i18n/es` ; `node tools/i18n.js check` passe.
- Commits seulement si le joueur le demande, sans ligne Co-Authored-By.

## Review Focus

- Une sauvegarde d'avant avec des soldats `down > 0`, ou une caserne sans `queue` ni `rally` : le jeu charge, les soldats sont debout. Test : Task 1 step 3.
- Un soldat frappé deux fois dans le même pas (pillard puis garde du camp) alors qu'il vient de mourir : une seule mort comptée, pas d'erreur. Test : Task 1 step 3.
- La caserne rasée ou déplacée avec une file en cours : les recrues en attente et celle à l'exercice sont remboursées (rasée) ou gardées (déplacée). Test : Task 2 step 4.
- Plus d'habitant libre ou plus de stock au milieu d'un Maj + clic : ce qui a pu être commandé l'est, un seul message d'erreur, rien de payé en trop. Test : Task 2 step 4.
- Clic droit sur la carte, caserne ouverte, alors que des soldats sont choisis : c'est un ordre aux soldats, le ralliement ne bouge pas ; sur le panneau lui-même : rien ne se pose. Test : Task 3 step 3.

---

### Task 1: Les soldats meurent, et sont moins forts

**Files:**
- Modify: `js/units.js` (en-tête, `hurt`, `soldierTick`, `afterRaid`, exports)
- Modify: `js/raid.js:596-611` (`finish` : le bilan)
- Modify: `js/camp.js:61,185`, `js/explore.js:134`, `js/world.js:557`, `js/screens.js:64,162,745,837-838,1436` (les tests `u.down` n'ont plus lieu d'être)
- Modify: `config.js:51-52`, `js/village.js:277` (compteur)
- Modify: `data/strings.js:112-113`, `data/buildings.js:146`, `data/tutorial.js:554` et leurs lignes dans `data/i18n/en/*.js`, `data/i18n/es/*.js`

**Interfaces:**
- Produces: `Units.hurt(u, dmg)` retire le soldat à 0 PV ; `u.dead === true` sur l'objet retiré (une copie de liste prise avant le sait). `state.counters.soldiersLost` (entier). `state.raid.active.lost` (entier, absent tant que personne n'est tombé).

- [ ] **Step 1: Implémenter la mort**
  - `hurt` : rien si `u.dead`. À 0 PV : `u.dead = true`, retiré de `state.units` et de `ui.selU`, `floatText(u.x, u.y, tr('unit_dead'), UI.C.bad, 15, 18)`, `sfx('hurt')`, `state.counters.soldiersLost` + 1, et `state.raid.active.lost` + 1 pendant un raid.
  - `soldierTick` : plus de branche `down` ; un vieux `u.down` est effacé et le soldat remis à `maxHp(u)`.
  - `afterRaid` : soigne seulement (`u.hp = maxHp(u)`).
  - Retirer tous les tests `u.down` des fichiers listés (le `c.down` du camp reste : c'est le répit du camp). Le panneau Peuple ne montre plus « à terre ».
  - `finish` (raid.js) : quand `a.lost > 0`, le message de fin gagne `tr('raid_losses', { n: a.lost })`.
- [ ] **Step 2: Réglages et textes**
  - config.js : `soldier_level_step` à `0.05`, ligne `soldier_recover` supprimée.
  - Clés : `unit_down` devient `unit_dead` (« Tombé ! » / « Fallen! » / « ¡Caído! ») ; `soldiers_down` supprimée ; `raid_losses` nouvelle (« · soldats tombés : {n} »).
  - `buildings.barracks.desc`, la phrase du tutoriel (`data/tutorial.js:554`) et l'en-tête de `js/units.js` ne disent plus qu'un soldat se relève : il est perdu, il faut en former un autre.
- [ ] **Step 3: Vérifier dans le navigateur** (`?scene=play` d'une partie avancée, ou la sauvegarde en cours)
  - `Units.train` puis attendre un milicien `m` ; `const n = state.units.length, f = Units.free(); Units.hurt(m, 1e6); Units.hurt(m, 1e6)` → `state.units.length === n - 1`, `Units.free() === f + 1`, `state.counters.soldiersLost` a pris 1 (pas 2).
  - `state.units.push({ id: state.nextUnit++, kind: 'militia', x: m.x, y: m.y, gx: m.x, gy: m.y, hp: 0, down: 20 })`, un pas de jeu → ce soldat a `down` absent et `hp === Units.maxHp(u)`.
  - `Units.drill()` avec une caserne niveau 5 et sans bonus de cité → `1.2`.
  - Console sans erreur ; `node tools/i18n.js check` → code 0.

### Task 2: La file de formation

**Files:**
- Modify: `js/units.js` (`free`, `blocked`, `train`, `tick`, exports)
- Modify: `js/village.js:608` (`demolish` : rembourser la file d'une caserne rasée)
- Modify: `js/screens.js:782-802` (`unitRow`, `drawBarracks`), `js/tutorial.js:210` (`tally('drill')`)
- Modify: `config.js` (`barracks_queue`), `data/strings.js:111-112` + couches en/es

**Interfaces:**
- Consumes: rien de Task 1.
- Produces:
  - `Units.line(b = barracks())` → `[{ kind, frac }]`, la recrue à l'exercice d'abord (`frac` de 0 à 1), puis celles en attente (`frac: 0`) ; `[]` sans caserne.
  - `Units.train(kind, n = 1)` → nombre de recrues commandées (0 : refus, avec le message de `blocked`). Un ouvrier reste formé sur-le-champ, un seul à la fois.
  - `Units.cancel(i)` → `true` si la case `i` de `line()` existait : elle sort de la file, son prix est rendu (`Village.gain`), la suivante passe à l'exercice si c'était la première.
  - `Units.refund(b)` : annule toute la file de `b` (pour `demolish`).
  - `b.queue` : tableau de sortes (`'militia'`…), absent ou vide = personne en attente.

- [ ] **Step 1: La file dans units.js**
  - `free()` retire `line().length` (et non plus 1).
  - `blocked(kind)` : `train_busy` devient `queue_full` quand `line().length >= 1 + tune.barracks_queue`.
  - `train` : la première recrue va dans `b.train` si la place est libre, les autres dans `b.queue` ; chacune payée une à une, on s'arrête au premier refus.
  - `tick` : quand la recrue sort, ou que `b.train` est vide, la tête de `b.queue` passe à l'exercice (`{ kind, left: d.time, total: d.time }`). Une caserne endommagée ne fait rien avancer.
- [ ] **Step 2: Le panneau**
  - `unitRow` : le bouton « Former » appelle `Units.train(k, shift() ? 5 : 1)` ; sa bulle dit « Maj + clic : 5 » (`train_many_tip`).
  - `drawBarracks` : sous le titre, les cases de `Units.line()` sur une ou deux lignes (le soldat dessiné avec `World.unitSprite`, la barre sur la première), le compte `n / max` à droite ; un clic sur une case appelle `Units.cancel(i)`, bulle `train_cancel_tip`. Sans file : la ligne vide, comme aujourd'hui sans recrue.
  - `tally('drill')` (tutorial.js) : `Units.count(a)` + le nombre de cases de `Units.line()` de cette sorte.
  - `demolish` : `Units.refund(b)` avant de retirer une caserne.
- [ ] **Step 3: Textes** : `train_busy` supprimée ; `queue_full` (« La file de la Caserne est pleine. »), `train_many_tip`, `train_cancel_tip` (« Clic : annuler et récupérer son prix. »), en fr/en/es.
- [ ] **Step 4: Vérifier dans le navigateur**
  - Stocks pleins, 6 habitants libres : `Units.train('militia', 5)` → `5`, `Units.line().length === 5`, `Units.free()` a baissé de 5, l'or a baissé de 5 fois le prix.
  - `Units.cancel(4)` puis `Units.cancel(0)` → la file a 3 cases, l'or est revenu de 2 prix, `Units.line()[0].frac === 0` (la suivante recommence son exercice).
  - 2 habitants libres seulement : `Units.train('militia', 5)` → `2`, un seul toast.
  - `tune.barracks_queue = 2` : la 4ᵉ commande est refusée avec `queue_full`.
  - Laisser tourner : les recrues sortent une à une, `Units.count('militia')` monte, la file se vide.
  - `Village.demolish(Units.barracks())` avec 3 cases : l'or revient de 3 prix.
  - Le tutoriel : `node` ou la page sans erreur de `tuto-check` (console) ; l'étape « formez un Milicien » (`?lesson=` de la leçon des soldats) avance dès la commande.
  - Capture d'écran du panneau avec une file de 5.

### Task 3: Le point de ralliement

**Files:**
- Modify: `js/units.js` (`add`, exports), `js/screens.js:146` (clic droit) et `drawBarracks`, `js/world.js` (le drapeau, près du dessin des soldats)
- Modify: `data/strings.js` + couches en/es

**Interfaces:**
- Consumes: `Units.barracks()`.
- Produces: `b.rally` : `{ x, y }` en pixels de carte, absent = devant la caserne. `Units.setRally(x, y)`, `Units.clearRally()`.

- [ ] **Step 1: Implémenter**
  - `add` : un soldat reçoit pour poste `b.rally` décalé en rangs (la même grille que `rally(i)`, autour du point) quand il existe, sinon `rally(i)` comme aujourd'hui. `recall` ne change pas.
  - screens.js, clic droit : après `orderAt`, essayer `rallyAt(x, y)` : vrai quand le panneau ouvert est celui de la caserne, qu'aucun soldat n'est choisi, que rien n'est en main et que le point n'est pas sur l'interface ; il appelle `Units.setRally`, `World.ping`, `sfx('click')`. Sinon `cancel()` comme avant.
  - `drawBarracks` : une ligne `rally_help` (« Clic droit sur la carte : point de ralliement des recrues. ») et, quand `b.rally` existe, un bouton `rally_clear` (« Enlever le ralliement »).
  - world.js : le sprite `iso.decor_banner` au point de ralliement tant que la caserne est le bâtiment choisi (`ui.sel`).
- [ ] **Step 2: Textes** : `rally_help`, `rally_clear`, `rally_set` (toast « Point de ralliement posé. »), fr/en/es.
- [ ] **Step 3: Vérifier dans le navigateur**
  - Panneau de la caserne ouvert, clic droit sur la carte → `Units.barracks().rally` est le point cliqué ; le drapeau se voit (capture d'écran).
  - Former 2 miliciens → à leur sortie, leurs `gx, gy` sont à moins de 20 px du ralliement et ils y marchent.
  - Soldats choisis (T), clic droit ailleurs → eux bougent, `b.rally` n'a pas changé. Clic droit sur le panneau → `b.rally` n'a pas changé.
  - « Enlever le ralliement » → `b.rally` absent, la recrue suivante reste devant la caserne.
  - Recharger la page : la file et le ralliement sont toujours là.
  - `node tools/i18n.js check` → code 0 ; `node tools/test-i18n.js` → code 0.
