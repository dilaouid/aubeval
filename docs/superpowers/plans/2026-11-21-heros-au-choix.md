# Un héros au choix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le joueur choisit son héros parmi quatre (deux hommes, deux femmes) à la création ; le portrait, la figurine de carte et le sprite de combat suivent partout, et les textes s'accordent en français, anglais et espagnol.

**Architecture:** Le choix est un identifiant, `state.hero.look`, lu par une seule fonction globale, `heroLook()`. Les images passent par `Hero.art(kind)`, qui rend l'identifiant de sprite du héros choisi et retombe sur Aldric tant qu'une image manque : le code marche donc avant que les images existent. Les textes gagnent un trou `{g:masculin|féminin}`, résolu par `I18N.gender()` (pur, testé sous node) et appelé là où un texte est dessiné, mesuré ou écrit lettre à lettre. L'écran du nom sert deux fois : à la création, et en mode retouche depuis le menu du héros.

**Tech Stack:** HTML + JavaScript sans build ; tests node (`node tools/test-heroes.js`, `node tools/test-i18n.js`, `node tools/i18n.js check`) ; navigateur via `.claude/launch.json` (`aubeval`, port 8765), vérifications par `javascript_tool` (`state`, `ui`, `scene`, `Hero`, `Save`, `Art`, `DATA` sont des globales de la page) ; Python + PIL pour assembler les images ; serveur MCP PixelLab pour les générer.

**Spec:** `docs/superpowers/specs/2026-11-21-heros-au-choix-design.md`

## Global Constraints

- Les quatre héros, dans cet ordre : `aldric` (Aldric, `m`), `tancrede` (Tancrède, `m`), `isaure` (Isaure, `f`), `maelle` (Maëlle, `f`). Capes rouge, bleue, blanche, or ; jamais de vert ni de violet.
- `state.hero.look` vaut `'aldric'` par défaut. La version de sauvegarde reste 4 ; une ancienne sauvegarde garde Aldric et ne perd rien.
- Mêmes chiffres, mêmes cartes, mêmes armes pour les quatre. Une seule image de combat par héros.
- Les fichiers d'Aldric qui existent (`assets/sprites/iso/unit_hero.png`, `assets/sprites/hero_battle.png`) ne sont ni modifiés ni régénérés, sauf le cas prévu Task 9 step 5.
- Un nom tapé par le joueur n'est jamais remplacé par un changement de héros.
- Le trou d'accord s'écrit `{g:masculin|féminin}`, exactement deux formes, sans accolade à l'intérieur.
- En anglais, « hero » reste pour les deux genres ; en français « l'héroïne », en espagnol « la heroína ».
- Tout texte nouveau ou changé existe en français (`data/*.js`) et dans `data/i18n/en` et `data/i18n/es` ; `node tools/i18n.js check` passe.
- Pas de dépendance, pas de build. Le README et le dossier du prototype d'origine ne sont pas touchés.
- Commits : un par tâche sur `feat/heros-au-choix`, sans ligne Co-Authored-By, jamais de push.
- Les Tasks 8, 9 et 10 demandent les outils PixelLab et un choix du joueur : elles se font dans la session principale, pas dans un sous-agent.

## Review Focus

- Une sauvegarde d'avant (sans `hero.look`), chargée ou importée d'un fichier : Aldric partout, aucun champ perdu. Test : Task 2 step 1.
- Un `look` inconnu dans une sauvegarde (fichier édité, héros retiré plus tard) : le jeu charge et montre Aldric, sans erreur. Test : Task 2 step 1.
- Un texte `{g:…}` mal formé (une seule forme, trois formes) : il s'affiche tel quel sans planter, et `node tools/i18n.js check` le refuse. Test : Task 1 steps 1 et 5.
- Un dialogue écrit lettre à lettre (tutoriel, lieux) qui contient un trou : jamais d'accolade à l'écran en cours de frappe. Test : Task 3 step 4.
- « Autre carte » puis changement de héros avec un nom tapé : le nom et le héros choisis restent. Test : Task 4 step 4.
- Une image de héros absente ou pas encore chargée : celle d'Aldric à la place, à la bonne taille. Test : Task 2 step 1 et Task 3 step 4.

---

### Task 0: Commiter la forge et les soldats, ouvrir la branche

**Files:** aucun fichier modifié ; deux commits sur `feat/soldats-rts`, puis la branche `feat/heros-au-choix`.

- [ ] **Step 1: Vérifier que le travail en attente est sain.** Run : `node tools/test-forge.js && node tools/test-i18n.js && node tools/i18n.js check`. Attendu : tous verts. Sinon, arrêter et le dire au joueur : ne rien commiter.
- [ ] **Step 2: Trier les changements.** Forge : `js/hero.js`, `js/cards.js`, `data/cards.js`, `tools/test-forge.js`, `docs/superpowers/specs/2026-11-21-forge-paliers-design.md`, `docs/superpowers/plans/2026-11-21-forge-paliers.md`, et dans les fichiers partagés (`config.js`, `data/strings.js`, `data/i18n/*/cards.js`, `data/i18n/*/strings.js`, `data/i18n/*/items.js`) les seuls morceaux qui parlent de la Trempe (`forge_temper_bonus`) et de la carte Fer rouge (`brand`). Tout le reste est aux soldats. `tools/make_backdrop.py`, `make_favicon.py`, `make_social.py`, `.claude/` et la spec et le plan de ce chantier ne sont dans aucun des deux commits.
- [ ] **Step 3: Commit de la forge.** Pour un fichier partagé, écrire son diff dans un fichier (`git diff -- <fichier> > <scratchpad>/x.patch`), n'y garder que les morceaux de la forge, puis `git apply --cached <scratchpad>/x.patch`. Message : `feat(forge): the Trempe and the Fer rouge card, from forge level 5`.
- [ ] **Step 4: Vérifier que ce commit tient seul.** `git worktree add <scratchpad>/forge-check HEAD`, y lancer `node tools/test-forge.js && node tools/i18n.js check`, puis `git worktree remove <scratchpad>/forge-check`. Attendu : verts. Si un morceau manque, l'ajouter par `git commit --amend` avant d'aller plus loin.
- [ ] **Step 5: Commit des soldats** avec tout le reste des fichiers suivis modifiés, plus la spec et le plan des soldats. Message : `feat(soldiers): permanent death, a training queue and a rally point`.
- [ ] **Step 6: Ouvrir la branche.** `git switch -c feat/heros-au-choix`, puis commiter la spec et le plan de ce chantier : `docs(heroes): design and plan of the hero choice`. `git status --short` ne liste plus que `.claude/` et les trois `tools/make_*.py`.

---

### Task 1: Le trou d'accord `{g:…|…}`

**Files:**
- Modify: `js/i18n.js` (deux fonctions de plus sur `I18N`)
- Modify: `tools/i18n.js` (`check` : le cas `gender`)
- Modify: `js/tuto-check.js:103-112` (`words`)
- Test: `tools/test-i18n.js`

**Interfaces:**
- Produces: `I18N.gender(s: string, g: 'm' | 'f'): string` remplace chaque `{g:a|b}` par `a` (`'m'`) ou `b` (`'f'`) ; tout autre texte est rendu tel quel, un trou mal formé aussi.
- Produces: `I18N.genderBad(s: string): boolean`, vrai s'il reste un `{g:` après résolution.

- [ ] **Step 1: Écrire les tests** dans `tools/test-i18n.js` :

```js
test('gender picks the first form for m, the second for f', () => {
  const s = '{hero} est {g:arrivé|arrivée} : {g:il|elle} rentre.';
  assert.strictEqual(T.I18N.gender(s, 'm'), '{hero} est arrivé : il rentre.');
  assert.strictEqual(T.I18N.gender(s, 'f'), '{hero} est arrivée : elle rentre.');
});
test('gender leaves other holes, plain text and empty forms alone', () => {
  assert.strictEqual(T.I18N.gender('{n} {res} pour {hero}', 'f'), '{n} {res} pour {hero}');
  assert.strictEqual(T.I18N.gender('prêt{g:|e}', 'm'), 'prêt');
  assert.strictEqual(T.I18N.gender('prêt{g:|e}', 'f'), 'prête');
  assert.strictEqual(T.I18N.gender('{g:le héros|l’héroïne}', 'f'), 'l’héroïne');
});
test('a malformed gender hole is kept as written, and reported', () => {
  for (const bad of ['{g:seul}', '{g:a|b|c}', '{g:a|{hero}}']) {
    assert.strictEqual(T.I18N.gender(bad, 'f'), bad);
    assert.strictEqual(T.I18N.genderBad(bad), true);
  }
  assert.strictEqual(T.I18N.genderBad('{g:il|elle} et {hero}'), false);
});
test('check reports a malformed gender hole as kind gender', () => {
  const errs = T.check(new Map([['strings.x', 'seul'], ['strings.y', '{g:a|b}']]), { 'strings.x': '{g:seul}', 'strings.y': 'c' });
  assert.ok(errs.some(e => e.kind === 'gender' && e.path === 'strings.x'));
  assert.ok(!errs.some(e => e.path === 'strings.y')); // a gender hole on one side only is no difference of holes
});
```

- [ ] **Step 2: Lancer** `node tools/test-i18n.js`. Attendu : FAIL (`T.I18N.gender is not a function`).
- [ ] **Step 3: Implémenter** `gender` et `genderBad` dans `js/i18n.js`. Un trou bien formé : `/\{g:([^|{}]*)\|([^|{}]*)\}/g`.
- [ ] **Step 4: Brancher les vérifications.** `tools/i18n.js` : `check(src, layer)` ajoute `{ kind: 'gender', path }` pour chaque texte de la couche qui a `genderBad` ; la commande `check` fait de même pour les textes français, compte et affiche ces erreurs comme les autres, et sort en code 1. Les `{g:…}` ne comptent pas parmi les trous comparés d'une langue à l'autre (la regex de `holes` ne les voit pas : le test ci-dessus le garde vrai). `js/tuto-check.js` `words` : un trou `{g:…}` bien formé n'est pas un mot cassé.
- [ ] **Step 5: Lancer** `node tools/test-i18n.js && node tools/i18n.js check`. Attendu : PASS, `0 missing · 0 unknown · 0 with other holes`.
- [ ] **Step 6: Commit** `feat(i18n): a gender hole, {g:masculine|feminine}`.

---

### Task 2: Les quatre héros dans les données, la sauvegarde et les images

**Files:**
- Modify: `data/world.js:106` (`DATA.heroes`), et `data/i18n/en/world.js`, `data/i18n/es/world.js` (les noms)
- Modify: `js/ui.js:8-24` (`heroLook`, `gendered`, `withHero`)
- Modify: `js/hero.js` (`art`, `nameFor`, exports)
- Modify: `js/village.js:275` (`fresh`), `js/save.js` (`hero`)
- Modify: `assets/manifest.js`
- Create: `tools/test-heroes.js`

**Interfaces:**
- Consumes: `I18N.gender(s, g)` (Task 1).
- Produces: `DATA.heroes: [{ id, name, g }]`, les quatre de Global Constraints, dans cet ordre.
- Produces: `heroLook(): { id, name, g }`, global de `js/ui.js`. Il lit, dans l'ordre : `ui.heroPick` s'il est posé (l'écran du nom en cours) ; `Save.hero().look` quand `scene === 'title'` ; `state.hero.look`. Un identifiant inconnu ou absent rend `DATA.heroes[0]`.
- Produces: `gendered(s)`, global de `js/ui.js` : `I18N.gender(s, heroLook().g)` si `s` est une chaîne qui contient `{g:`, sinon `s` tel quel. `withHero(s)` l'applique après avoir posé le nom ; `tr()` en profite donc.
- Produces: `Hero.art(kind: 'portrait' | 'battle' | 'unit', id?: string): string | null`. Rend `portrait.hero.<id>`, `hero.battle.<id>` ou `iso.unit.hero.<id>` pour le héros `id` (par défaut `heroLook().id`) si `Art.loaded` le connaît ; sinon le même pour `aldric` ; sinon l'ancien identifiant (`hero.battle`, `iso.unit.hero`) ; pour `portrait`, `null` quand rien n'est chargé.
- Produces: `Hero.nameFor(current: string, id: string): string` : le nom que le champ doit montrer après être passé au héros `id`. Si `current`, espaces retirés, est vide ou vaut le `name` d'un des `DATA.heroes`, c'est le `name` du héros `id` ; sinon `current` inchangé.
- Produces: `Save.hero(): { look, name } | null`, lu dans la sauvegarde sans la charger, gardé en mémoire après la première lecture, remis à zéro par `wipe()` et par `persist()`.
- Produces: identifiants du manifeste. Pour Aldric : `'iso.unit.hero.aldric': { sheet: 'sprites/iso/unit_hero.png', cols: 7, rows: 8 }` et `'hero.battle.aldric': { file: 'sprites/hero_battle.png', w: 44, h: 50 }` (sans `w`/`h`, une image sans dessin de secours garde sa taille de fichier et sort quatre fois trop grande). Pour chacun des quatre : `'portrait.hero.<id>': { sheet: 'sprites/portraits/hero_<id>.png', cols: 7, rows: 1 }` ; pour les trois autres : `'iso.unit.hero.<id>': { sheet: 'sprites/iso/unit_hero_<id>.png', cols: 7, rows: 8 }` et `'hero.battle.<id>': { file: 'sprites/hero_battle_<id>.png', w: 44, h: 50 }`. Les anciens `iso.unit.hero` et `hero.battle` restent.

- [ ] **Step 1: Écrire `tools/test-heroes.js`** sur le modèle de `tools/test-forge.js` (même `load`, avec en plus `js/i18n.js` et `js/ui.js` chargés en entier dans le bac avant `js/hero.js`, à la place des faux `heroName` et `tr` ; un faux `Art` dont `loaded(id)` lit un `Set` que le test remplit ; `ui = {}` et `scene = 'play'` ; et toute autre globale que `js/ui.js` lirait en se chargeant). Les tests et leurs assertions :
  - `heroes are the four of the spec` : les `id` valent `['aldric', 'tancrede', 'isaure', 'maelle']`, les `g` valent `['m', 'm', 'f', 'f']`.
  - `heroLook falls back to Aldric` : `state.hero.look` absent, puis `'nobody'` → `heroLook().id === 'aldric'` ; `'isaure'` → `'isaure'` ; `ui.heroPick = 'maelle'` l'emporte sur `state.hero.look`.
  - `withHero fills the name, then the gender` : avec `state.hero = { name: 'Bea', look: 'isaure' }`, `withHero('{hero} est {g:prêt|prête}')` vaut `'Bea est prête'` ; avec `look: 'tancrede'`, `'Bea est prêt'`.
  - `Hero.art falls back when an image is missing` : rien de chargé → `Hero.art('battle', 'isaure') === 'hero.battle'` et `Hero.art('portrait', 'isaure') === null` ; `hero.battle.aldric` chargé → `'hero.battle.aldric'` ; `hero.battle.isaure` chargé → `'hero.battle.isaure'` ; de même pour `'unit'` avec `iso.unit.hero`.
  - `Hero.nameFor keeps a typed name` : `nameFor('Aldric', 'isaure') === 'Isaure'`, `nameFor('  ', 'maelle') === 'Maëlle'`, `nameFor('Tancrède', 'aldric') === 'Aldric'`, `nameFor('Bea', 'isaure') === 'Bea'`, `nameFor('aldric', 'isaure') === 'aldric'` (la casse du joueur n'est pas un nom proposé).
- [ ] **Step 2: Lancer** `node tools/test-heroes.js`. Attendu : FAIL (`DATA.heroes` indéfini).
- [ ] **Step 3: Implémenter** données, fonctions et manifeste selon Interfaces. `tools/i18n.js extract en` puis `es` ajoutent les quatre noms aux couches : les noms restent les mêmes dans les trois langues.
- [ ] **Step 4: Lancer** `node tools/test-heroes.js && node tools/test-forge.js && node tools/test-i18n.js && node tools/i18n.js check`. Attendu : PASS.
- [ ] **Step 5: Vérifier dans le navigateur** (`preview_start` `aubeval`) : `Village.fresh().hero.look === 'aldric'` ; avec une sauvegarde d'avant, `state.hero.look === 'aldric'` après chargement ; `localStorage` trafiqué avec `hero.look = 'nobody'` puis rechargé : le jeu s'ouvre, `heroLook().id === 'aldric'`, aucune erreur en console ; `Save.hero()` rend `{ look, name }` sur l'écran titre.
- [ ] **Step 6: Commit** `feat(heroes): four heroes in the data, the save and the manifest`.

---

### Task 3: Le héros choisi partout, et les textes résolus à l'affichage

**Files:**
- Modify: `index.html:235` (`text`), `js/ui.js` (`wrap`, `width`)
- Modify: `js/tutorial.js` (`pageOf`), `js/venue.js:383` (`say`)
- Modify: `js/world.js:311-317` (`unitSprite`), `js/battle.js:336`, `js/cards.js:96`
- Modify: `js/screens.js:1241` (titre), `:1291-1335` (galerie `?scene=figures`), `index.html:426-432` (`?hero=`)

**Interfaces:**
- Consumes: `gendered(s)`, `Hero.art(kind, id?)`, `heroLook()` (Task 2).
- Produces: tout texte qui passe par `text()`, `UI.wrap()` ou `UI.width()` est résolu ; `pageOf(s).text` et la ligne posée par `say(line)` le sont avant que la frappe compte leurs lettres.
- Produces: `?hero=<id>` avec `?demo` ou `?scene` pose `state.hero.look` (ignoré si l'identifiant est inconnu, et sans ces paramètres).

- [ ] **Step 1: Résoudre les textes.** `text()`, `UI.wrap()` et `UI.width()` passent leur chaîne par `gendered` à l'entrée (une valeur qui n'est pas une chaîne passe telle quelle). `pageOf` rend un texte déjà résolu ; `say` résout sa ligne.
- [ ] **Step 2: Brancher les sprites.** `unitSprite('hero', …)` lit la planche `Hero.art('unit')` et garde ses dessins de secours ; `drawUnit` (combat) et `picture` (cartes) lisent `Hero.art('battle')` ; l'écran titre dessine `Hero.art('battle')`, donc le héros de la sauvegarde s'il y en a une ; la galerie `?scene=figures` montre les quatre héros (combat et figurine).
- [ ] **Step 3: `?hero=`** après `buildDemo()` et l'ouverture d'une scène, dans `index.html`.
- [ ] **Step 4: Vérifier dans le navigateur.**
  - `?demo=1&hero=isaure` : `heroLook().id === 'isaure'` ; aucune erreur en console ; tant que ses images n'existent pas, la figurine et le sprite de combat sont ceux d'Aldric, à leur taille habituelle (comparer `Art.get(Hero.art('battle')).width` à 44).
  - `?hero=isaure` sans `demo` ni `scene` : sans effet.
  - Trou dans un dialogue : dans la page, poser `DATA.strings.at_village = 'Au village, {g:prêt|prête}'`, ouvrir le menu du héros (H) : on lit « prête » avec `?demo=1&hero=isaure`, « prêt » sans. Puis, sur `?demo=1&hero=isaure`, ajouter depuis la console ` {g:Il est prêt|Elle est prête}.` à la fin de la première réplique de la leçon `site` dans `DATA.tutorial`, et l'ouvrir par `Tuto.lessonNow('site')` : capture d'écran à mi-frappe, aucune accolade visible, et la ligne finie dit « Elle est prête. ».
  - `?scene=figures` : quatre héros visibles.
- [ ] **Step 5: Lancer** `node tools/test-heroes.js && node tools/i18n.js check`. Attendu : PASS.
- [ ] **Step 6: Commit** `feat(heroes): the chosen hero on the map, in battle and on the title; gender holes resolved where text is drawn`.

---

### Task 4: L'écran de création

**Files:**
- Modify: `js/screens.js:1167-1234` (`titleStart`, `openNaming`, `nameConfirm`, `nameBack`, `drawNaming`, le champ)
- Modify: `data/strings.js:22-24` et leurs lignes dans `data/i18n/en/strings.js`, `data/i18n/es/strings.js`

**Interfaces:**
- Consumes: `heroLook()`, `Hero.art`, `Hero.nameFor`, `DATA.heroes` (Task 2) ; `gendered` (Task 3).
- Produces: `openNaming(opts?: { edit: boolean })`. Pendant que l'écran est ouvert, `ui.heroPick` est l'identifiant choisi et `ui.nameEdit` vaut `true` en mode retouche ; les deux sont remis à `null` / `false` en le quittant. (Le mode retouche est fini Task 5 ; ici, seul `edit` faux est joignable.)
- Produces: textes. `name_title` : « {g:Votre héros|Votre héroïne} » ; `name_ask` : « Quel est le nom de {g:votre héros|votre héroïne} ? » ; `name_keys` : « Entrée : commencer · ↑ ↓ : changer de héros · Échap : retour ».

- [ ] **Step 1: Dessiner la rangée.** Quatre portraits animés (`Hero.art('portrait', id)`, image `floor(t * tune.portrait_fps) % cols` ; à défaut de portrait, le sprite de combat de ce héros) avec leur nom proposé dessous, le choisi encadré de `C.gold`. À gauche du champ : le sprite de combat du héros choisi et sa figurine qui marche sur place (rang sud de la planche, colonnes 1 à 6 à `tune.walk_fps`). Le panneau grandit pour loger la rangée ; `NAME_BOX` descend d'autant et le champ réel le suit (`placeField`).
- [ ] **Step 2: Choisir.** Un clic sur un portrait, ou ↑ / ↓ dans le champ (héros précédent / suivant, en boucle, `preventDefault`), pose `ui.heroPick` et remplace la valeur du champ par `Hero.nameFor(champ, id)`. À l'ouverture d'une nouvelle partie : `ui.heroPick = 'aldric'`, champ sur « Aldric ».
- [ ] **Step 3: Confirmer et garder.** `nameConfirm` écrit `state.hero.look = ui.heroPick` avec le nom, puis `Save.begin()`. « Autre carte » (`reset(Village.drawSeed(false))`) rend `ui.heroPick` et la valeur du champ comme ils étaient avant le `reset`. « Retour » vide `ui.heroPick`.
- [ ] **Step 4: Vérifier dans le navigateur**, sans sauvegarde (`?nosave` ne suffit pas pour le chemin réel : vider `localStorage['aubeval.save.v1']` après en avoir gardé une copie, la remettre à la fin).
  - Clic sur Isaure : le champ passe à « Isaure », le titre du panneau à « Votre héroïne », le sprite de gauche change d'identifiant (`Hero.art('battle') ` rend celui d'Isaure une fois ses images là, celui d'Aldric avant).
  - Taper « Bea », cliquer Maëlle, puis ↑ : le champ reste « Bea », `ui.heroPick` change.
  - Avec « Bea » et Maëlle choisis, « Autre carte » : `state.mapSeed` a changé, le champ vaut toujours « Bea », `ui.heroPick === 'maelle'`.
  - Vider le champ, cliquer Tancrède : « Tancrède ». ← → déplacent toujours le curseur dans le nom.
  - « Commencer » : `state.hero.look === 'maelle'`, `state.hero.name === 'Bea'`, et après rechargement de la page la sauvegarde les rend.
  - En anglais (`?lang=en`) et en espagnol (`?lang=es`), les trois textes s'accordent.
- [ ] **Step 5: Lancer** `node tools/i18n.js check && node tools/test-i18n.js`. Attendu : PASS.
- [ ] **Step 6: Commit** `feat(heroes): choose a hero on the naming screen`.

---

### Task 5: Le menu du héros et le mode retouche

**Files:**
- Modify: `js/screens.js:873-888` (`drawHero`), `:1196-1234` (mode retouche de l'écran du nom)
- Modify: `data/strings.js` et leurs lignes en `en` et `es`

**Interfaces:**
- Consumes: `openNaming({ edit: true })`, `ui.heroPick`, `ui.nameEdit` (Task 4).
- Produces: textes. `hero_look` : « Changer d'apparence » ; `hero_look_raid` : « Pas pendant un raid. » ; `name_ok_edit` : « Valider » ; `name_keys_edit` : « Entrée : valider · ↑ ↓ : changer de héros · Échap : retour ».

- [ ] **Step 1: Le portrait dans le menu.** `drawHero` dessine le portrait animé du héros (`Hero.art('portrait')`, 64 pixels d'art doublés, sur une plaque comme celle de `drawKeeper`) à la place de `UI.sprite('hero.battle', …)` ; sans portrait chargé, le sprite de combat reste, comme aujourd'hui. Niveau, barre d'XP, chiffres et liste déroulante se décalent pour ne pas passer sous la plaque. Sous le portrait, le bouton `hero_look`, inactif pendant un raid (`state.raid.active`) avec la bulle `hero_look_raid`.
- [ ] **Step 2: Le mode retouche.** Le bouton appelle `openNaming({ edit: true })` : `ui.heroPick = state.hero.look`, champ sur `state.hero.name`. Dans ce mode, le numéro de carte et « Autre carte » ne sont pas dessinés, le bouton principal dit `name_ok_edit`, l'aide `name_keys_edit`. Valider : nom nettoyé par `Hero.cleanName` (mêmes refus qu'à la création), `state.hero.look` et `state.hero.name` écrits, `Save.persist()`, retour à `scene = 'play'` avec `ui.panel = 'hero'`. « Retour » et Échap : même retour, rien d'écrit. `Save.begin()` n'est jamais appelé en mode retouche.
- [ ] **Step 3: Vérifier dans le navigateur** sur une partie existante.
  - Menu du héros (H) : portrait animé une fois les images là ; avant, le sprite de combat, sans erreur.
  - « Changer d'apparence », Isaure, le champ passe d'« Aldric » à « Isaure », Valider : `state.hero.look === 'isaure'`, `state.hero.name === 'Isaure'`, `ui.panel === 'hero'`, le titre du panneau s'accorde ; rien d'autre de `state` n'a changé (comparer `JSON.stringify` de `state.res`, `state.buildings.length`, `state.quests`, `state.city.rank` avant et après).
  - Rouvrir, choisir Maëlle, taper « Bea », « Retour » : `look` et `name` inchangés.
  - Rouvrir, vider le champ, Valider : refusé, message `name_empty`, on reste sur l'écran.
  - Pendant un raid (`?demo=1`) : le bouton est inactif et sa bulle le dit.
  - Un nouveau départ (`Village.newStart()` sur un village `?demo=1` assez riche) garde `state.hero.look`.
- [ ] **Step 4: Lancer** `node tools/i18n.js check`. Attendu : PASS.
- [ ] **Step 5: Commit** `feat(heroes): the animated portrait in the hero panel, and a change of look`.

---

### Task 6: Accorder les textes français

**Files:**
- Modify: `data/*.js` (les douze fichiers de `I18N.files`), `data/strings.js` surtout, `data/tutorial.js`, `data/explore.js`, `data/venues.js`, `data/city.js`
- Modify: `tools/i18n.js` (commande `gender`), `tools/test-i18n.js`
- Modify: `docs/superpowers/specs/2026-11-21-multilangue-glossary.md`

**Interfaces:**
- Consumes: `{g:…|…}` (Task 1).
- Produces: `node tools/i18n.js gender [fr|en|es]` liste, pour une langue, les textes suspects : chemin, texte. Suspect en français : le mot `héros` hors d'un trou `{g:…}` ; ou une ligne qui nomme le héros (`{hero}`, `{de_hero}`, « héros », « héroïne ») et contient hors trou `il`, `lui`, `messire` ou un participe ou adjectif en `-é`, `-i`, `-u`, `seul`, `prêt` à la suite de « est » ou « soit ». Code de sortie 1 s'il reste un suspect hors de la liste `GENDER_OK` (chemins admis, chacun avec sa raison en commentaire).
- Produces: dans le glossaire, la règle : quand écrire `{g:…|…}`, les couples usuels (le héros / l'héroïne, du héros / de l'héroïne, au héros / à l'héroïne, il / elle, messire / madame), et « hero » qui ne change pas en anglais.

- [ ] **Step 1: Écrire le test** dans `tools/test-i18n.js` : `no bare « héros » in the French texts` (aucun texte de `T.loadData()` ne contient `héros` hors d'un `{g:…}`, sauf les chemins de `GENDER_OK`) et `French gender suspects are all accounted for` (la liste de la commande, moins `GENDER_OK`, est vide).
- [ ] **Step 2: Lancer** `node tools/test-i18n.js`. Attendu : FAIL, avec la liste des lignes à reprendre (une centaine).
- [ ] **Step 3: Reprendre les textes.** Lire en entier chacun des fichiers de textes : la commande aide, elle ne voit pas un « il » qui suit une ligne où le héros est nommé (les pages successives d'une leçon du tutoriel). Garder le sens et le ton ; ne toucher à aucun texte qui ne parle pas du héros (un « il » peut désigner un soldat, un pillard, un commerçant, Grakk). « Héros niveau {n} » et les autres étiquettes où le mot est un titre de colonne s'accordent aussi. Chaque ligne laissée telle quelle exprès va dans `GENDER_OK` avec sa raison.
- [ ] **Step 4: Lancer** `node tools/test-i18n.js && node tools/i18n.js check && node tools/i18n.js gender fr`. Attendu : PASS, aucun suspect.
- [ ] **Step 5: Vérifier dans le navigateur**, `?demo=1&hero=isaure` puis `&hero=tancrede` : menu du héros, panneau d'exploration avec le héros en route (`ex_arrived`, `ex_home`), panneau de l'intendant (« messire » / « madame »), première leçon du tutoriel (`?tuto=1&hero=isaure` si le paramètre l'accepte, sinon une nouvelle partie avec Isaure). Aucune accolade, aucun masculin pour Isaure, aucun féminin pour Tancrède.
- [ ] **Step 6: Commit** `feat(i18n): French texts agree with a heroine`.

---

### Task 7: Accorder l'anglais et l'espagnol

**Files:**
- Modify: `data/i18n/en/*.js`, `data/i18n/es/*.js`
- Modify: `tools/i18n.js` (les suspects de `en` et `es`), `tools/test-i18n.js`

**Interfaces:**
- Consumes: `node tools/i18n.js gender <lang>`, `GENDER_OK` (Task 6).
- Produces: suspects anglais : une ligne qui nomme le héros (`{hero}`, « hero ») et contient hors trou `he`, `him`, `his`, `himself`, `lord`, `sir`. Suspects espagnols : `héroe` hors trou ; ou une ligne qui nomme le héros et contient hors trou `él`, `lo`, `señor`, ou un participe ou adjectif en `-ado`, `-ido`, `solo`, `listo` après « está », « es » ou « esté ».

- [ ] **Step 1: Écrire les tests** : `English gender suspects are all accounted for`, `no bare « héroe » in the Spanish texts`, `Spanish gender suspects are all accounted for`, sur le modèle de Task 6.
- [ ] **Step 2: Lancer** `node tools/test-i18n.js`. Attendu : FAIL avec les deux listes.
- [ ] **Step 3: Reprendre les deux couches**, en lisant chaque fichier en entier, le français accordé en regard (le commentaire de fin de ligne de chaque entrée donne le français d'origine ; `node tools/i18n.js extract en` puis `es` le rafraîchit sans toucher aux traductions). En anglais « hero » reste, « my lord » devient `{g:my lord|my lady}`, les pronoms s'accordent. Un pronom qui désigne quelqu'un d'autre que le héros (« {hero} faces him alone » : le chef de guerre) reste, et son chemin va dans `GENDER_OK`.
- [ ] **Step 4: Lancer** `node tools/test-i18n.js && node tools/i18n.js check && node tools/i18n.js gender en && node tools/i18n.js gender es`. Attendu : PASS, aucun suspect.
- [ ] **Step 5: Vérifier dans le navigateur** les mêmes écrans qu'à Task 6 step 5, avec `&lang=en` puis `&lang=es`, pour Isaure et pour Tancrède.
- [ ] **Step 6: Commit** `feat(i18n): English and Spanish texts agree with a heroine`.

---

### Task 8: Les portraits (session principale, choix du joueur)

**Files:**
- Create: `tools/make_heroes.py`, `tools/heroes/ids.tsv`, `tools/heroes/raw/<id>/portrait/…`
- Create: `assets/sprites/portraits/hero_aldric.png`, `hero_tancrede.png`, `hero_isaure.png`, `hero_maelle.png`

**Interfaces:**
- Produces: `python tools/make_heroes.py` assemble tout ce qu'il trouve dans `tools/heroes/raw/` vers `assets/sprites/` et affiche une ligne par fichier écrit. Portrait : `raw/<id>/portrait/frame_001.png` … `frame_007.png` (64 × 64) → bande de 448 × 64, rien de rééchantillonné ; il refuse une image d'une autre taille, ou dont la figure n'atteint pas le bas de sa case. `python tools/make_heroes.py --check` vérifie les tailles des fichiers déjà assemblés (448 × 64 ; planche de 7 colonnes × 8 rangs ; combat 44 × 50) et sort en code 1 sinon.
- Produces: `tools/heroes/ids.tsv`, une ligne par image gardée : héros, sorte (`portrait`, `portrait_anim`, `battle`, `unit`, `unit_walk`), identifiant PixelLab (objet, personnage ou tâche), description donnée.

Descriptions (en anglais pour PixelLab), à faire suivre de : `half-body portrait, three-quarter face, bust to the waist`.
- Aldric : `a young knight, short brown hair, steel plate armour with a leather belt and a gold buckle, bright red cape, confident half smile`
- Tancrède : `a knight with dark brown skin, short black hair, a short trimmed beard, steel plate armour, royal blue cape, calm steady look`
- Isaure : `a young woman knight, auburn red hair in one long braid over her shoulder, steel plate armour, white cape with a green clasp, bright determined smile`
- Maëlle : `a woman knight, short black hair, sharp eyes, blackened steel armour, golden yellow cape, small wry smile`

- [ ] **Step 1: Candidats.** Pour chaque héros, une planche de bustes de 64 × 64 (`create_1_direction_object`, `size` laissé aux images de style, `view: 'sidescroller'`, `style_images` : `captain`, `baker`, `merchant` et `guide`, chacun la première case de 64 × 64 de sa bande dans `assets/sprites/portraits/`, en base64). Seize candidats par appel, 10 générations. Garder les seize sous `tools/heroes/raw/<id>/candidates/`.
- [ ] **Step 2: Montrer et faire choisir.** Assembler par héros une planche numérotée, agrandie 4 fois sans lissage, et l'envoyer au joueur. Il choisit un buste par héros ; celui d'Aldric doit ressembler à `assets/sprites/hero_battle.png`. Un héros dont aucun candidat ne convient : un nouvel appel, description ajustée selon ce que dit le joueur. Écarter les autres (`select_object_frames`).
- [ ] **Step 3: Animer.** Pour chaque buste choisi : `animate_image`, 8 images, le buste en première et en dernière image, mouvement `blinks once, breathes in and out, shoulders rise slightly, head stays in place`. Des neuf images rendues, garder les générées 1 à 7 comme `frame_001` … `frame_007` (la 0 est l'entrée, d'une teinte un peu différente ; la 8 la répète). Rejeter et refaire une boucle où la silhouette saute ou change de visage.
- [ ] **Step 4: Écrire `tools/make_heroes.py`** (partie portraits et `--check`) et assembler. Run : `python tools/make_heroes.py && python tools/make_heroes.py --check`. Attendu : quatre lignes `portrait … 448x64`, code 0.
- [ ] **Step 5: Vérifier dans le navigateur.** Écran de création : quatre portraits qui clignent, aucun scintillement à la reprise de la boucle. Menu du héros avec `?demo=1&hero=maelle` : son portrait. Capture d'écran des deux pour le joueur.
- [ ] **Step 6: Commit** `feat(heroes): the four animated portraits`.

---

### Task 9: Les sprites de combat (session principale, validation du joueur)

**Files:**
- Modify: `tools/make_heroes.py`, `tools/heroes/ids.tsv`
- Create: `tools/heroes/raw/<id>/battle.png`, `assets/sprites/hero_battle_tancrede.png`, `hero_battle_isaure.png`, `hero_battle_maelle.png`

**Interfaces:**
- Consumes: les bustes choisis (Task 8).
- Produces: `make_heroes.py` copie `raw/<id>/battle.png` (44 × 50, fond transparent, les pieds sur la dernière ligne) vers `assets/sprites/hero_battle_<id>.png` et refuse une autre taille.

- [ ] **Step 1: La référence.** `hero_battle.png` est un sprite de 44 × 50 agrandi 4 fois, fait hors de PixelLab : le ramener à 44 × 50 (un pixel sur quatre, sans lissage ; vérifier à l'œil que rien n'est perdu, sinon `unzoom_image`) et garder cette image comme référence de pose et de trait.
- [ ] **Step 2: Générer**, pour Tancrède, Isaure et Maëlle : `create_image_pro`, 44 × 50, fond transparent, `reference_images` : la référence d'Aldric (« pose, proportions, outline and shading ») et le buste choisi du héros (« face, hair, armour and cape colours »). Description : celle du héros (Task 8) suivie de `full body chibi knight facing right, simple straight steel sword held upright in the front hand, round shield on the back arm, cape behind, two-tone cel shading, 1-pixel dark plum outline, feet on the bottom edge`. Boucliers : doré (Tancrède), vert (Isaure), noir (Maëlle). Garder le meilleur candidat de chaque appel.
- [ ] **Step 3: Montrer les quatre côte à côte**, Aldric compris, agrandis 4 fois sans lissage, sur le fond de combat, et demander au joueur s'ils vont ensemble.
- [ ] **Step 4: Reprendre** un héros refusé, description ajustée, trois essais au plus par héros.
- [ ] **Step 5: Si le joueur les refuse encore** parce qu'ils ne vont pas avec Aldric : refaire les quatre ensemble dans PixelLab, Aldric compris, le premier accepté servant de référence de style aux trois autres. Le sprite d'Aldric est alors `assets/sprites/hero_battle_aldric.png`, son entrée du manifeste change, et `assets/sprites/hero_battle.png` reste en place pour le dessin de secours.
- [ ] **Step 6: Assembler et vérifier.** `python tools/make_heroes.py && python tools/make_heroes.py --check`, puis dans le navigateur `?scene=battle&hero=isaure`, `tancrede`, `maelle` : le héros se tient à la même hauteur et à la même taille qu'Aldric (`Art.get(Hero.art('battle')).height === 50`), son ombre sous ses pieds, l'anneau de parade centré sur lui. Captures pour le joueur.
- [ ] **Step 7: Commit** `feat(heroes): battle sprites of Tancrède, Isaure and Maëlle`.

---

### Task 10: Les figurines de carte (session principale)

**Files:**
- Modify: `tools/make_heroes.py`, `tools/heroes/ids.tsv`
- Create: `tools/heroes/raw/<id>/unit/rotations/<direction>.png`, `…/unit/walk/<direction>/frame_NNN.png`, `assets/sprites/iso/unit_hero_tancrede.png`, `unit_hero_isaure.png`, `unit_hero_maelle.png`

**Interfaces:**
- Produces: `make_heroes.py` assemble une planche de 7 colonnes × 8 rangs. Rangs : `south, south-east, east, north-east, north, north-west, west, south-west`. Colonne 0 : `rotations/<direction>.png` ; colonnes 1 à 6 : les six images de marche. Toutes les cases recadrées sur une seule boîte, l'union des boîtes opaques de toutes les images, pour que les pieds ne bougent pas d'une case à l'autre.

- [ ] **Step 1: Créer les personnages**, pour les trois : `create_character`, `mode: 'v3'`, `size: 32`, `view: 'low top-down'`, 8 directions. Description sur le modèle d'Aldric : `<nom>, <apparence du héros, Task 8, sans le sourire>, sword sheathed at the side, small map unit seen from far away, bold readable shape, strong colours, simple`. L'épée est au côté : les animations de marche perdent ce qui est tenu en main.
- [ ] **Step 2: Comparer à Aldric** (personnage `53719095-e735-4ef4-91c1-fbe00fbf11bd`) : même hauteur de figure à 2 pixels près, cape de la bonne couleur lisible de dos comme de face. Refaire un personnage trop grand, trop petit ou dont la cape vire au vert ou au violet.
- [ ] **Step 3: Animer la marche** : `animate_character`, `template_animation_id: 'walking'` (6 images, celle d'Aldric), les 8 directions.
- [ ] **Step 4: Télécharger, ranger, assembler.** Le ZIP de chaque personnage (`/mcp/characters/<id>/download`) va dans son propre dossier vide sous le scratchpad ; ses `rotations/` et les images de l'animation de marche sont copiées sous `tools/heroes/raw/<id>/unit/`. Run : `python tools/make_heroes.py && python tools/make_heroes.py --check`. Attendu : trois lignes `unit … cols 7 rows 8`, code 0.
- [ ] **Step 5: Vérifier dans le navigateur**, `?demo=1&hero=<id>` pour les trois : la figurine devant l'hôtel de ville, à la taille d'Aldric, les pieds sur sa case ; pendant le raid de la démo elle court vers un pillard sans glisser ni sauter d'une image à l'autre ; sur l'écran de création elle marche sur place. Capture de chacune pour le joueur.
- [ ] **Step 6: Commit** `feat(heroes): map figures of Tancrède, Isaure and Maëlle`.

---

### Task 11: La vérification d'ensemble

**Files:** aucun, sauf correction.

- [ ] **Step 1: Tous les tests.** Run : `node tools/test-heroes.js && node tools/test-forge.js && node tools/test-i18n.js && node tools/i18n.js check && node tools/i18n.js gender fr && node tools/i18n.js gender en && node tools/i18n.js gender es && python tools/make_heroes.py --check`. Attendu : tout vert.
- [ ] **Step 2: Le parcours de la spec, dans le navigateur.** Une nouvelle partie avec chacun des quatre héros, jusqu'au premier combat du tutoriel ; le menu du héros et un changement d'apparence ; la carte pendant un raid et pendant une expédition ; une sauvegarde d'avant ce chantier, qui retrouve Aldric ; un nouveau départ, qui garde le héros. Avec Isaure : le début du tutoriel et l'arrivée sur un lieu exploré, en français, en anglais et en espagnol. Console sans erreur du début à la fin.
- [ ] **Step 3: Remettre au joueur** les captures de l'écran de création, du menu du héros et d'un combat avec chacun des quatre, et dire ce qui n'a pas pu être vérifié.
