# Carte aléatoire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque nouvelle partie se joue sur une carte tirée au hasard, toujours jouable, dont la graine se voit et se partage.

**Architecture:** La génération (`js/mapgen.js`) ne change pas. On y ajoute un test pur « cette graine est-elle jouable ? » et un « première graine jouable à partir de N ». Village tire la graine d'une nouvelle partie (aléatoire, ou `?seed=`), la graine des aléas (`rng()`) part d'elle. Le camp n'est plus placé que sur une case reliée à pied à l'hôtel de ville. Trois écrans montrent la graine : menu pause (copier le lien), nom du héros (autre carte), titre (lien partagé).

**Tech Stack:** HTML + JavaScript sans build ni dépendance ; Node pour les scripts de vérification (`tools/`), navigateur via `.claude/launch.json` (`aubeval`, port 8765).

**Spec:** `docs/superpowers/specs/2026-11-21-carte-aleatoire-design.md`

## Global Constraints

- Graines tirées entre 1 et 999 999.
- Une graine jouable a un rocher qui donne de la pierre à 20 cases au plus du milieu de l'hôtel de ville (`DATA.map.playable.rockWithin = 20`).
- La graine enregistrée et affichée est celle retenue après le garde-fou : la partager redonne la même carte.
- Les sauvegardes existantes gardent leur `mapSeed` ; une sauvegarde v1 migrée garde `CONFIG.seed` (1).
- La nouvelle fondation (`Village.newStart`) garde la carte.
- Pas de `Math.random` dans le jeu, sauf pour tirer la graine d'une nouvelle partie.
- Textes en français, dans `data/strings.js`, au style des panneaux existants.
- En-tête « PROTOTYPE - NOT FOR PRODUCTION » sur tout nouveau fichier JS, comme les autres.
- Commits sans ligne Co-Authored-By.

## Review Focus

- Une sauvegarde d'avant ce changement se charge sur sa carte d'origine (graine 1), sans retirage. Test : Task 2 step 4.
- `?seed=N` avec une sauvegarde existante : « Continuer » reprend la partie, seule une nouvelle partie utilise N. Test : Task 4 step 6.
- `?seed=abc`, `?seed=0`, `?seed=-5` : traités comme « pas de graine », tirage aléatoire. Test : Task 2 step 4.
- Un camp qui se relève (niveaux 1 à 6) est toujours relié à pied à l'hôtel de ville. Test : Task 3 step 3.
- « Copier le lien » quand le presse-papiers est refusé (page non sécurisée) : le lien s'affiche en toast au lieu d'échouer en silence. Test : Task 4 step 5.

---

### Task 1: Garde-fou pur dans MapGen

**Files:**
- Modify: `js/mapgen.js` (ajouts à côté de `generate`, export)
- Modify: `data/world.js` (`DATA.map.playable`)
- Create: `tools/check-maps.js`

**Interfaces:**
- Produces: `MapGen.playable(land, M, FLORA): boolean` (FLORA = `DATA.flora`) ; `MapGen.pickSeed(start: number, M, GROUND, BIOMES, FLORA): number` : la première graine jouable parmi `start, start+1, …` (repasse à 1 après 999 999 ; au plus 200 essais, sinon renvoie `start`). Les deux sont exportés comme `generate`.

- [ ] **Step 1: Écrire `tools/check-maps.js`**

Charge `data/strings.js`, `data/world.js` (avec `global.window = global`) puis `js/mapgen.js` par `require`. Vérifie, avec `assert` de Node :
- `MapGen.playable(generate(1))` vaut `true` (la carte d'aujourd'hui reste valable) ;
- pour chaque graine 1 à 300 : `s = pickSeed(g)` est jouable, `pickSeed(s) === s`, et `s - g` (modulo le retour à 1) est au plus 20 ;
- `pickSeed(999999)` donne une graine entre 1 et 999 999 ;
- deux `generate` de la même graine donnent des `ground` et `flora` identiques.
Affiche la part de graines rejetées et le plus long saut, puis `OK`.

- [ ] **Step 2: Lancer, voir l'échec**

Run: `node tools/check-maps.js`
Expected: FAIL, `MapGen.playable is not a function`.

- [ ] **Step 3: Implémenter**

`DATA.map.playable = { rockWithin: 20 }` avec un commentaire (cases du milieu de l'hôtel de ville au premier rocher qui donne de la pierre ; une graine qui ne l'a pas est passée). Milieu de l'hôtel de ville comme dans `generate` (`M.hall.x + 2, M.hall.y + 1.5`). `playable` ne parcourt que le carré de côté `2 * rockWithin` autour.

- [ ] **Step 4: Relancer**

Run: `node tools/check-maps.js`
Expected: `OK`, environ 28 % de graines rejetées.

- [ ] **Step 5: Commit**

```bash
git add js/mapgen.js data/world.js tools/check-maps.js
git commit -m "feat(map): seed check, the first playable seed from a number"
```

### Task 2: Une graine tirée à chaque nouvelle partie

**Files:**
- Modify: `js/village.js:15` (`baseSeed` supprimé), `fresh()` vers la ligne 230, `migrateV1` ligne 343, retour du module
- Modify: `index.html:361-365` (`reset`)
- Modify: `config.js:11` (commentaire de `seed`)

**Interfaces:**
- Consumes: `MapGen.pickSeed` (Task 1).
- Produces: `Village.fresh(mapSeed = CONFIG.seed)` ; `Village.sharedSeed: number` (la graine de `?seed=`, entier de 1 à 999 999, sinon 0) ; `Village.drawSeed(useShared = true): number`, une graine jouable, celle de `?seed=` quand il y en a une et que `useShared` est vrai, sinon aléatoire ; `reset(mapSeed = Village.drawSeed())` dans index.html, qui pose aussi `seed = mapSeed` (la graine de `rng()`).

- [ ] **Step 1: Implémenter**

`fresh` prend la graine en paramètre, sa valeur par défaut reste `CONFIG.seed`, pour que `Save.adopt` (qui complète une vieille sauvegarde depuis `fresh()`) ne tire jamais. `migrateV1` utilise `CONFIG.seed`. Tirage aléatoire : `1 + Math.floor(Math.random() * 999999)`, puis `pickSeed`. `?seed=` est lu par `Math.floor(Number(...))`, gardé seulement s'il tombe entre 1 et 999 999. Le commentaire de `CONFIG.seed` devient : la carte des sauvegardes d'avant les cartes tirées.

- [ ] **Step 2: Ouvrir le jeu**

`preview_start {name: "aubeval"}`, `http://localhost:8765/?nosave`.

- [ ] **Step 3: Deux nouvelles parties diffèrent**

javascript_tool : `reset(); const a = state.mapSeed; reset(); [a, state.mapSeed, seed === state.mapSeed]`
Expected : deux graines différentes, la troisième valeur est `true` juste après `reset`. Pas d'erreur dans la console.

- [ ] **Step 4: Graine imposée, graine invalide, vieille sauvegarde**

- `?nosave&seed=5` : `state.mapSeed === MapGen.pickSeed(5, …)`, et la même valeur après un second `reset()`.
- `?nosave&seed=abc`, `?nosave&seed=0` et `?nosave&seed=-5` : `Village.sharedSeed === 0`, la graine est tirée.
- Sans `?nosave`, avec dans `localStorage['aubeval.save.v1']` une sauvegarde dont `mapSeed` vaut 1, rechargée puis « Continuer » : `state.mapSeed === 1`.

- [ ] **Step 5: Commit**

```bash
git add js/village.js index.html config.js
git commit -m "feat(map): a new game draws its own land"
```

### Task 3: Un camp toujours relié à pied

**Files:**
- Modify: `js/village.js:54-78` (`placeCamp`)

**Interfaces:**
- Consumes: `walkable(x, y)` et `hallMid()` de village.js.
- Produces: rien de nouveau ; `placeCamp` n'accepte qu'un emplacement dont le milieu est relié à pied à l'hôtel de ville.

- [ ] **Step 1: Implémenter**

Au début de la recherche (quand `!r.camp`), une seule inondation sur 4 voisins des cases `walkable`, depuis la case sous le milieu de l'hôtel de ville, dans un `Uint8Array(N)`. `ok()` exige en plus que la case du milieu du camp (`tx + 2, ty + 2`) soit atteinte. Le repli « aucune place » reste tel quel.

- [ ] **Step 2: Recharger le jeu**

`http://localhost:8765/?nosave`

- [ ] **Step 3: Vérifier sur 40 graines et 7 camps**

javascript_tool : pour 40 graines tirées par `Village.drawSeed()`, `reset(s)`, puis pour `lvl` de 0 à 6 (`Village.raiseCamp(lvl)` à partir de 1), recalcule dans le script une inondation à pied depuis l'hôtel de ville et compte les camps dont le milieu n'est pas atteint.
Expected : 0. Pas d'erreur dans la console.

- [ ] **Step 4: Commit**

```bash
git add js/village.js
git commit -m "fix(camp): the goblin camp always rises within walking reach"
```

### Task 4: Voir et partager la graine

**Files:**
- Modify: `data/strings.js` (près de `menu_title`, ligne 167)
- Modify: `js/screens.js` : `drawMenu` (vers la ligne 935), `drawNaming` (vers la ligne 1135), `drawTitle` (vers la ligne 1150)

**Interfaces:**
- Consumes: `state.mapSeed`, `Village.sharedSeed`, `Village.drawSeed()`, `reset(mapSeed)` (Task 2).
- Produces: les textes `map_no: 'Carte n° {n}'`, `map_copy: 'Copier le lien'`, `map_copied: 'Lien copié'`, `map_link: 'Lien de la carte : {url}'`, `map_other: 'Autre carte'`, `map_shared: 'Carte partagée n° {n} : une nouvelle partie la jouera.'`. Aucun ne commence par `btn_`, `tb_`, `tab_` ou `city_` : tuto-check ne les compte pas comme des fonctions à enseigner.

- [ ] **Step 1: Menu pause**

Sous le bouton du Livre des leçons : `map_no` à gauche, et un bouton `map_copy` sur la même ligne. Le lien vaut `location.origin + location.pathname + '?seed=' + state.mapSeed`. `navigator.clipboard.writeText` réussit : toast `map_copied`. Il échoue ou n'existe pas : toast `map_link`. Le bloc Prestige descend d'autant. Il ne doit pas toucher le bouton « Nouvelle partie » en bas.

- [ ] **Step 2: Écran du nom du héros**

Dans le panneau, sans recouvrir le champ, la règle ni les boutons : `map_no`, et un bouton `map_other` qui fait `reset(Village.drawSeed(false))`. Le champ garde ce qui est tapé, la carte change derrière le panneau, et on reste sur l'écran du nom.

- [ ] **Step 3: Titre**

Avec une sauvegarde et `Village.sharedSeed` : la ligne `map_shared`, sous les boutons de départ.

- [ ] **Step 4: Captures**

À `http://localhost:8765/?nosave` : capture du menu pause, puis de l'écran du nom avant et après « Autre carte ». Le numéro et la carte de fond changent, le nom tapé reste.

- [ ] **Step 5: Presse-papiers refusé**

javascript_tool : `navigator.clipboard.writeText = () => Promise.reject(new Error('no'))`, puis clic sur « Copier le lien ».
Expected : toast `map_link` avec l'adresse complète.

- [ ] **Step 6: Lien partagé avec une sauvegarde**

Avec une sauvegarde (sans `?nosave`), ouvrir `/?seed=123` : le titre montre `map_shared`. « Continuer » garde `state.mapSeed` d'avant. Puis menu, « Nouvelle partie » deux fois : `state.mapSeed === MapGen.pickSeed(123, …)`. Remettre la sauvegarde d'origine ensuite.

- [ ] **Step 7: Commit**

```bash
git add data/strings.js js/screens.js
git commit -m "feat(map): show the land's number, copy its link, draw another"
```

### Task 5: Le début de partie sur des cartes tirées

**Files:**
- Modify: `README.md` (paragraphe « Le jeu » et « Explorer sans fin » : carte différente à chaque partie, graine partageable, `?seed=` dans « Jouer »)

- [ ] **Step 1: Tutoriel sur trois graines**

Pour trois graines (dont une proche du seuil de pierre, choisie avec `tools/check-maps.js`), `?nosave&seed=N`, nouvelle partie. Suivre le tutoriel de départ jusqu'au premier bâtiment posé : les flèches montrent des arbres à l'écran, l'emplacement proposé est sur la terre ferme. Capture à chaque fois. Console sans erreur ni avertissement de tuto-check.

- [ ] **Step 2: Vérifications automatiques**

Run: `node tools/check-maps.js`
Expected: `OK`.

- [ ] **Step 3: README, puis commit**

```bash
git add README.md
git commit -m "docs: a new land each game, and its number to share"
```
