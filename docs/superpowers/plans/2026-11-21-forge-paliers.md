# Forge : palier du niveau 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** À la forge niveau 5, les renforcements +N valent 20 % (au lieu de 15 %) et la carte « Fer rouge » entre dans le deck du héros.

**Architecture:** Tout se déduit du niveau du bâtiment, sans nouvel état de sauvegarde. `Hero` expose le niveau de la forge et le bonus d'un +N. Une carte peut maintenant exiger un niveau minimum de son bâtiment (champ `at`). Le panneau de la forge, l'aperçu du niveau suivant et la liste des cartes à gagner l'annoncent.

**Tech Stack:** JavaScript sans build (scripts globaux dans `index.html`), tests Node (`node tools/…`) avec `vm`, couches de langue FR/EN/ES (`tools/i18n.js`).

**Spec:** `docs/superpowers/specs/2026-11-21-forge-paliers-design.md`

## Global Constraints

- Palier = `tune.milestone_levels` (5). Pas de nouveau réglage de niveau.
- Trempe : `plus_bonus` 0,15 + `forge_temper_bonus` 0,05 = 20 % par +N, rétroactif sur les +N déjà acquis.
- Fer rouge : `from: 'forge'`, `at: 5`, `max: 1`, `copies: 1`, `cost: 1`, `target: 'one'`, `dmg: 0.9`, `pierce: true`, `weak: 2`, `exhaust: true`.
- La Trempe compte même si la forge est endommagée. La carte suit la règle des cartes (bâtiment intact).
- Aucun nouvel état de sauvegarde. Aucune limite de +N. Pas de palier 10 ni 15.
- Textes : FR dans `data/`, EN et ES dans `data/i18n/{en,es}/`, selon `docs/superpowers/specs/2026-11-21-multilangue-glossary.md`. `node tools/i18n.js check` doit passer.
- **Ne commitez pas.** L'arbre de travail contient des modifications non commitées sans rapport avec ce plan, dans `config.js`, `data/strings.js`, `js/screens.js` et `data/i18n/*`. Un `git add` de ces fichiers les embarquerait. Le commit est laissé à l'utilisateur.

## Review Focus

- Forge endommagée par un raid avec ses +N : les stats du héros ne bougent pas, la carte disparaît du deck.
- Forge niveau 4 avec de gros +N (vieille sauvegarde) : rien ne change, toujours 15 %.
- Aucune forge construite : la liste des cartes affiche Fer rouge verrouillée sans erreur.
- Les cartes sans `at` (Estoc, etc.) restent disponibles dès le niveau 1.
- Forge démolie puis reconstruite (niveau 1) : la Trempe disparaît.

## File Structure

- Create: `tools/test-forge.js` : test Node des règles de Trempe et de la carte (charge `data/*.js`, `config.js`, `js/hero.js`, `js/cards.js` dans un `vm`).
- Modify: `config.js` (réglage), `js/hero.js` (`forgeLevel`, `plusBonus`, `itemStats`), `data/cards.js` (carte `brand`, champ `at`), `js/cards.js` (`pool`), `js/screens.js` (panneau forge, aperçu de niveau, liste de cartes), `data/strings.js` (3 textes), `data/i18n/{en,es}/{cards,strings}.js`.

---

### Task 1: La Trempe (bonus des +N)

**Files:**
- Create: `tools/test-forge.js`
- Modify: `config.js:30`, `js/hero.js:11-14` et la ligne de `return` (`js/hero.js:101`)

**Interfaces:**
- Produces: `Hero.forgeLevel(): number` (plus haut niveau d'un bâtiment `kind === 'forge'`, endommagé ou non, 0 si aucun) et `Hero.plusBonus(): number` (`tune.plus_bonus`, plus `tune.forge_temper_bonus` quand `forgeLevel() >= tune.milestone_levels`). `Hero.itemStats(id)` utilise `plusBonus()`.
- Produces (pour la Task 2) : le harnais `tools/test-forge.js` avec `load(buildings, hero)` qui renvoie `{ Hero, Cards, DATA, tune }` pour un état donné.

- [ ] **Step 1: Écrire le harnais et les tests de la Trempe** dans `tools/test-forge.js`. Modèle : `tools/test-i18n.js` (liste `tests`, `assert`, sortie 1 en cas d'échec). Le harnais crée un contexte `vm` avec `window = ctx`, exécute `config.js` puis les `data/*.js` de `require('./i18n.js').I18N.files`, construit `tune` (`tune[k] = CONFIG[k].value`), définit `state = { buildings, hero }`, `tr = (k, p) => k`, `heroName = () => 'Hero'`, puis exécute `js/hero.js` et `js/cards.js` (les `const Hero`/`const Cards` restent visibles d'un script à l'autre dans le même contexte). Tests :
  - `plusBonus: 0.15 sans forge, au niveau 4, et 0.20 au niveau 5`
  - `plusBonus compte une forge endommagée de niveau 5` (`damaged: true` → 0,20)
  - `itemStats('sword_1') avec plus 2 : atk 6.5 au niveau 4, 7 au niveau 5` (`state.hero.plus = { sword_1: 2 }`)

- [ ] **Step 2: Lancer** `node tools/test-forge.js`. Attendu : FAIL (`Hero.plusBonus is not a function`).

- [ ] **Step 3: Implémenter** : dans `config.js`, après `plus_bonus`, ajouter `forge_temper_bonus: { value: 0.05, min: 0, max: 0.3, step: 0.01 }` (commentaire : bonus d'un +N en plus, une fois la forge au palier `milestone_levels`). Dans `js/hero.js`, ajouter `forgeLevel()` et `plusBonus()` (signatures ci-dessus), faire que `itemStats` utilise `plusBonus()` au lieu de `tune.plus_bonus`, et les exporter dans le `return`.

- [ ] **Step 4: Lancer** `node tools/test-forge.js`. Attendu : tous les tests passent.

---

### Task 2: La carte Fer rouge et le champ `at`

**Files:**
- Modify: `data/cards.js` (en-tête, carte `brand`, `DATA.cardOrder`), `js/cards.js:22-32` (`pool`), `data/i18n/en/cards.js`, `data/i18n/es/cards.js`
- Test: `tools/test-forge.js`

**Interfaces:**
- Consumes: le harnais `load(buildings, hero)` de la Task 1.
- Produces: `DATA.cards.brand` et le champ de carte `at` (niveau minimum du bâtiment `from`). `Cards.pool()` ignore une carte dont `s.lvl < c.at`. La Task 3 lit `DATA.cards[id].at`.

- [ ] **Step 1: Écrire les tests** dans `tools/test-forge.js` :
  - `brand est définie comme dans la spec` : assert sur `from 'forge'`, `at 5`, `max 1`, `copies 1`, `cost 1`, `target 'one'`, `dmg 0.9`, `pierce true`, `weak 2`, `exhaust true`, et `DATA.cardOrder.includes('brand')`.
  - `pool : brand absente au niveau 4, présente au niveau 5 avec pow 1.4 et 1 exemplaire` (`1 + (5-1) × card_level_step 0.1`).
  - `pool : forge endommagée ou absente, ni brand ni thrust`.
  - `pool : thrust présente dès le niveau 1` (une carte sans `at` n'est pas filtrée).

- [ ] **Step 2: Lancer** `node tools/test-forge.js`. Attendu : FAIL (`brand` indéfinie).

- [ ] **Step 3: Implémenter** : dans `data/cards.js`, documenter `at` dans l'en-tête (« a building card: the level its building must have reached »), ajouter la carte `brand` (nom « Fer rouge », flavor « Le fer sorti du feu marque la cible : elle frappe deux fois moins fort. ») juste après `thrust`, et placer `'brand'` après `'thrust'` dans `DATA.cardOrder`. Dans `js/cards.js` `pool()`, ajouter `if (c.at && s.lvl < c.at) continue;` après le test `!s.n`. Ajouter `cards.brand.name` et `cards.brand.flavor` dans `data/i18n/en/cards.js` (« Red-hot Iron », « Iron fresh from the fire brands the target: it strikes half as hard. ») et `es/cards.js` (« Hierro candente », « El hierro recién sacado del fuego marca al objetivo: golpea con la mitad de fuerza. »), avec le FR en commentaire comme les autres lignes.

- [ ] **Step 4: Lancer** `node tools/test-forge.js` puis `node tools/i18n.js check`. Attendu : tests OK et « check » sans erreur.

---

### Task 3: L'annonce du palier dans l'interface

**Files:**
- Modify: `js/screens.js` (`drawForge` ~440-460, `upgradeTip` ~616-628, liste des cartes ~918-922), `data/strings.js` (près de `forge_plus_tip`), `data/i18n/en/strings.js`, `data/i18n/es/strings.js`

**Interfaces:**
- Consumes: `Hero.plusBonus()` (Task 1) et `DATA.cards[id].at` (Task 2).
- Produces: trois textes `forge_perk_on` (`{pct}`), `forge_perk_off` (`{n}`), `up_forge_perk`.

- [ ] **Step 1: Ajouter les textes FR** dans `data/strings.js`. `forge_perk_on` : « Trempe : chaque +N vaut {pct} % de ses bonus. ». `forge_perk_off` : « Niveau {n} : Trempe (+N plus forts) et carte Fer rouge. ». `up_forge_perk` : « Palier : Trempe et carte Fer rouge ! ». Lancer `node tools/i18n.js extract en`, puis `extract es`, et remplacer les `null` créés par les traductions (EN : « Tempering: each +N is worth {pct}% of its bonuses. », « Level {n}: Tempering (stronger +N) and the Red-hot Iron card. », « Milestone: Tempering and the Red-hot Iron card! » ; ES à écrire dans le même registre, selon le glossaire).

- [ ] **Step 2: Panneau de la forge** (`drawForge`, `js/screens.js`) : juste sous le titre, une ligne de 14 px. Quand `b.lvl >= tune.milestone_levels` : `tr('forge_perk_on', { pct: Math.round(Hero.plusBonus() * 100) })` en `C.good` ; sinon `tr('forge_perk_off', { n: tune.milestone_levels })` en `C.dim`. Dans l'infobulle du bouton de renforcement, remplacer `tune.plus_bonus` par `Hero.plusBonus()`.

- [ ] **Step 3: Aperçu du niveau suivant** (`upgradeTip`) : si `b.kind === 'forge' && n === ms`, ajouter `tr('up_forge_perk')`.

- [ ] **Step 4: Liste « Cartes à gagner »** (ligne ~921) : pour une carte qui a `at`, afficher `tr('card_origin_lvl', { card: B[c.from].card, n: c.at })` (« Forge · niv. 5 ») à la place de `deck_build`.

- [ ] **Step 5: Vérifier** : `node tools/i18n.js check`, `node tools/test-i18n.js` et `node tools/test-forge.js` passent. Puis, dans le navigateur (le jeu se sert en statique, par exemple `python -m http.server` dans le dossier du dépôt), avec `?panel=forge`, vérifier que :
  - le panneau affiche la ligne grisée au niveau 1 ;
  - après `state.buildings.find(b => b.kind === 'forge').lvl = 5` dans la console puis la réouverture du panneau, la ligne passe en vert avec « 20 % » ;
  - la fiche du héros liste Fer rouge dans le deck au niveau 5, et verrouillée (« Forge · niv. 5 ») en dessous ;
  - la console du navigateur ne montre aucune erreur.
