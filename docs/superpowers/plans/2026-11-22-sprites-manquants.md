# Les sprites manquants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sept bâtiments gagnent leurs paliers d'aspect, les quatre chefs de guerre leur sprite de duel et leur icône, les boss leur décor, et les héros tiennent en combat l'arme qu'ils ont forgée.

**Architecture:** Presque rien ne change dans le code : le jeu sait déjà lire quatre aspects par bâtiment (`World.tier`, `isoLooks` du manifeste), une image de secours par ennemi (`alt`), une deuxième image de décor (`boss ? 1 : 0`) et une image par palier d'arme (`Hero.weaponTier()`). Le travail est de fabriquer les images en les dérivant de celles qui existent, de les ranger, et de les déclarer dans `assets/manifest.js`. Un garde-fou vérifie que chaque fichier du manifeste existe.

**Tech Stack:** HTML + JavaScript sans build ; serveur MCP PixelLab ; Python + PIL pour recadrer et assembler ; tests node ; navigateur via la configuration `aubeval-alt` (port 8767).

**Spec:** `docs/superpowers/specs/2026-11-22-sprites-manquants-design.md`

## Global Constraints

- Branche `feat/sprites-manquants`, ouverte depuis `feat/heros-au-choix`. Un commit par tâche, sans ligne Co-Authored-By, jamais de push.
- Aucun chiffre, aucune règle, aucun texte de jeu ne change.
- Un palier garde la largeur de terrain du niveau 1 de son bâtiment ; sa hauteur peut grandir. Rien n'est rééchantillonné.
- Les paliers 0 et 1 d'arme gardent le sprite de combat actuel de chaque héros ; les sprites neufs sont ceux des paliers 2 et 3, en 44 × 50, pieds sur la dernière ligne.
- Les sprites de duel font 96 × 89 ; `enemy.warlord` reste l'image de secours.
- Le joueur valide chaque famille sur une planche avant qu'elle soit commitée ; les armes passent en dernier.
- Les URL de test n'écrivent jamais la sauvegarde (`?demo=1`, `?nosave`, `?scene=…`).
- Toutes les tâches demandent PixelLab et un avis du joueur : elles se font dans la session principale.

## Review Focus

- Un fichier nommé dans `assets/manifest.js` qui n'existe pas (faute de frappe, image oubliée) : le jeu retombe sans bruit sur le dessin de secours. Test : Task 1 step 1.
- Un palier plus large ou décalé par rapport au niveau 1 : le bâtiment saute de côté en montant de niveau. Test : Task 1 step 5 (`--check` compare les largeurs).
- Un bâtiment de niveau 5, 10 ou 15 dans une sauvegarde existante : il prend son nouvel aspect au chargement, sans rien perdre. Test : Task 1 step 6.
- Un chef de guerre dont l'image n'a pas fini de charger : l'image commune s'affiche à sa place, à la même taille. Test : Task 2 step 4.
- Un héros sans arme équipée (début de partie, menu, écran titre) : le sprite du palier 1, jamais une case vide. Test : Task 4 step 4.

---

### Task 1: Les paliers des sept bâtiments

**Files:**
- Create: `tools/test-assets.js`, `tools/make_buildings.py`, `tools/buildings/ids.tsv`, `tools/buildings/raw/<kind>_l5.png`, `_l10.png`, `_l15.png`
- Create: `assets/sprites/iso/<kind>_l5.png`, `_l10.png`, `_l15.png` pour `coffee_farm`, `roastery`, `cafe`, `chapel`, `sheep_farm`, `weaver`, `goldsmith`
- Modify: `assets/manifest.js:27,48-49` (`oneLook` → `isoLooks`), `data/buildings.js` (retirer `looks: 'one'` des sept), l'en-tête de `data/buildings.js` (le mot sur `'one'`)

**Interfaces:**
- Produces: `node tools/test-assets.js` charge `assets/manifest.js` dans un bac et vérifie que chaque fichier nommé (`file`, `sheet`, chaque élément de `frames`) existe sous `assets/` ; code 1 sinon, avec la liste.
- Produces: `python tools/make_buildings.py` recadre chaque `tools/buildings/raw/<kind>_l<N>.png` sur ses pixels opaques et l'écrit dans `assets/sprites/iso/` ; `--check` vérifie que chaque palier a la largeur du `_l1` de son bâtiment et sort en code 1 sinon.
- Objets PixelLab d'origine (niveau 1) : `coffee_farm` 86d44a04-45cf-4855-8e1e-53a5fd79fb6a · `roastery` 7c2bf872-cc1b-419f-8fcd-cc5d1a0700f9 · `cafe` ce69bbb5-b45c-4988-a17e-f3e3b61927ff · `chapel` 6526f164-fdd9-4389-990d-34cee49ffe38 · `sheep_farm` 0092b24f-cade-4b87-ba33-cb348b2d882c · `weaver` 85ca7efc-7e05-4b8e-8ec4-30454b407a7a · `goldsmith` a5c8943c-2967-456a-8aa5-254e55b3d3d2.

- [ ] **Step 1: Écrire `tools/test-assets.js`** et le lancer : PASS sur le manifeste actuel. Ajouter au manifeste une ligne vers un fichier qui n'existe pas, relancer : FAIL en la nommant ; retirer la ligne.
- [ ] **Step 2: Regarder comment les paliers existants évoluent** (`forge_l1…l15`, `bakery_l1…l15`, `market_l1…l15`, côte à côte) pour donner aux nouveaux la même progression : niveau 5 soigné (pierre aux soubassements, toit refait, une lanterne), niveau 10 agrandi (un étage ou une annexe, des bannières), niveau 15 riche (ardoise, dorures, vitraux), toujours sur le même terrain.
- [ ] **Step 3: Générer**, bâtiment par bâtiment : `create_object_state` sur l'objet du niveau 1 pour le niveau 5, puis sur le niveau 5 pour le 10, puis sur le 10 pour le 15 (10 générations l'état). La description dit ce qui change et demande de garder la même base de terrain, la même vue et la même taille. Noter chaque identifiant et sa description dans `tools/buildings/ids.tsv`.
- [ ] **Step 4: Montrer au joueur** une planche par bâtiment, les quatre niveaux côte à côte agrandis sans lissage, et reprendre ce qu'il refuse.
- [ ] **Step 5: Écrire `tools/make_buildings.py`**, ranger, puis `python tools/make_buildings.py && python tools/make_buildings.py --check`. Attendu : 21 lignes, code 0. Un palier trop large est refait ou recadré sur la largeur du niveau 1 si rien d'utile ne dépasse.
- [ ] **Step 6: Brancher et vérifier.** Manifeste : les sept passent à `isoLooks(kind)` et `oneLook` disparaît ; données : `looks: 'one'` retiré. `node tools/test-assets.js && node tools/test-heroes.js && node tools/i18n.js check` : PASS. Navigateur : `?scene=variants` montre quatre aspects pour chacun des sept ; `?demo=1`, puis depuis la console passer un café au niveau 5, 10, 15 (`b.lvl`) : l'image change à chaque palier sans que le bâtiment bouge de sa case ; le panneau du bâtiment annonce le prochain aspect.
- [ ] **Step 7: Commit** `feat(art): tier looks for the seven single-look buildings`.

---

### Task 2: Les quatre chefs de guerre

**Files:**
- Create: `assets/sprites/enemy_morgash.png`, `enemy_zhara.png`, `enemy_urgak.png`, `enemy_skrit.png`, `assets/sprites/unit_warlord.png`, leurs bruts sous `tools/enemies/raw/`, `tools/enemies/ids.tsv`
- Modify: `assets/manifest.js` (quatre `enemy.<id>` en `{ file, w: 96, h: 89 }`, `unit.warlord`), `data/enemies.js:51,100` (`sprite: 'enemy.' + w.id`, `alt: 'enemy.warlord'`, `icon: 'unit.warlord'`)

**Interfaces:**
- Consumes: l'image de duel actuelle `assets/sprites/enemy_warlord.png` (96 × 89, tâche PixelLab ec7e9e1f-8469-4f33-b506-23543bc2a358), référence de taille, de pose et de trait.
- Produces: `DATA.enemies[<id>].sprite === 'enemy.<id>'`, `alt === 'enemy.warlord'` pour les quatre chefs ; `icon === 'unit.warlord'` pour eux et pour l'ennemi `warlord` de la carte.

- [ ] **Step 1: Générer** quatre sprites de 96 × 89 (`create_image_pro`, l'image actuelle en référence et en style) : Morgash, le Briseur de murs, gobelin massif, lourd marteau de guerre ; Zhara, la Ronce-mère, chamane aux ronces, bâton tordu, coiffe d'épines ; Urgak, le Meneur de brutes, large, cuirassé, fendoir ; Skrit, la Lame vive, fine, deux lames courtes. Tous tournés vers la gauche comme l'image actuelle, pieds en bas.
- [ ] **Step 2: Générer l'icône** `unit_warlord.png` à la taille de `unit_grakk.png`, une tête de chef gobelin casqué.
- [ ] **Step 3: Montrer au joueur** les quatre chefs à côté de l'image actuelle et de Grakk, et reprendre ce qu'il refuse.
- [ ] **Step 4: Brancher et vérifier.** `node tools/test-assets.js` : PASS. Navigateur : `?nosave&scene=battle&foes=morgash&boss`, puis `zhara`, `urgak`, `skrit` : chacun a son image, à la place et à la taille de l'ancienne, sa barre de vie et sa note au-dessus de la tête ; l'icône de la file des tours est la nouvelle. Retirer une ligne du manifeste le temps d'un rechargement : l'image commune revient pour ce chef, sans erreur.
- [ ] **Step 5: Commit** `feat(art): a duel sprite for each warlord, and their own icon`.

---

### Task 3: Le décor des boss

**Files:**
- Create: `tools/make_boss_backdrop.py`, `assets/sprites/bg_battle_boss.png`
- Modify: `assets/manifest.js` (`'bg.battle': { frames: ['sprites/bg_battle.png', 'sprites/bg_battle_boss.png'] }`)

- [ ] **Step 1: Écrire `tools/make_boss_backdrop.py`** : il lit `assets/sprites/bg_battle.png` et écrit `bg_battle_boss.png` à la même taille, repassé au crépuscule (ciel du violet à l'orange comme le dessin de secours de `js/art.js`, `bg.battle` image 1 ; sol et arbres assombris et tirés vers le pourpre ; nuages rosés). Rien n'est généré.
- [ ] **Step 2: Montrer au joueur** les deux décors l'un sous l'autre ; régler les teintes selon son avis.
- [ ] **Step 3: Brancher et vérifier.** `node tools/test-assets.js` : PASS. Navigateur : `?nosave&scene=battle&foes=grakk&boss` montre le crépuscule, `?nosave&scene=battle` le jour ; les noms et les barres de vie restent lisibles sur le nouveau ciel.
- [ ] **Step 4: Commit** `feat(art): a dusk backdrop for boss battles`.

---

### Task 4: Les armes des héros

**Files:**
- Modify: `tools/make_heroes.py` (deux images de combat de plus par héros), `tools/heroes/ids.tsv`, `tools/test-heroes.js`
- Create: `tools/heroes/raw/<id>/battle_t2.png`, `battle_t3.png`, `assets/sprites/hero_battle_<id>_t2.png`, `_t3.png` pour les quatre héros
- Modify: `assets/manifest.js` (`hero.battle.<id>` : `{ w: 44, h: 50, frames: [t1, t1, t2, t3] }`, où `t1` est `sprites/hero_battle_<id>.png`)

**Interfaces:**
- Consumes: `Hero.weaponTier()` (0 sans arme, puis 1, 2, 3), déjà passé à `Art.get(Hero.art('battle'), …)` par le combat, les cartes et le menu.
- Produces: `make_heroes.py` copie aussi `raw/<id>/battle_t2.png` et `battle_t3.png` (44 × 50, pieds sur la dernière ligne) vers `assets/sprites/hero_battle_<id>_t2.png` et `_t3.png`, et `--check` les contrôle.

- [ ] **Step 1: Générer**, pour chaque héros et chaque palier : `create_image_pro` 44 × 50, le sprite actuel du héros comme sprite à redessiner et comme style, « le même sprite, même pose, même visage, même tenue, seule l'épée change ». Palier 2 : épée d'acier plus large, garde dorée, pommeau rond. Palier 3 : grande lame runique, runes et tranchant qui luisent en bleu clair.
- [ ] **Step 2: Choisir** pour chaque sprite le candidat dont le visage et la tenue sont restés les mêmes (comparer au sprite du palier 1, pixel pour pixel hors de l'arme), et **montrer au joueur** les quatre héros avec leurs trois armes, en trois rangées.
- [ ] **Step 3: Étendre `make_heroes.py` et le test.** `tools/test-heroes.js` : chaque héros a quatre images de combat dans le manifeste et leurs fichiers existent. `python tools/make_heroes.py && python tools/make_heroes.py --check && node tools/test-heroes.js && node tools/test-assets.js` : PASS.
- [ ] **Step 4: Vérifier dans le navigateur**, `?nosave&scene=battle&hero=<id>` pour les quatre : depuis la console, équiper tour à tour `sword_1`, `sword_2`, `sword_3` (`state.hero.inv`, `Hero.equip`) : l'épée change en combat et sur les cartes, le héros ne bouge pas d'un pixel. Sans arme (`state.hero.equip.weapon = null`) : le sprite du palier 1. Le menu du héros et l'écran de création affichent un sprite, jamais une case vide.
- [ ] **Step 5: Commit** `feat(art): the hero holds the sword he forged, for the four heroes`.

---

### Task 5: La vérification d'ensemble

- [ ] **Step 1:** `node tools/test-assets.js && node tools/test-heroes.js && node tools/test-forge.js && node tools/test-i18n.js && node tools/i18n.js check && python tools/make_heroes.py --check && python tools/make_buildings.py --check`. Attendu : tout vert.
- [ ] **Step 2:** Navigateur, `?demo=1` : le village de démonstration avec ses bâtiments à divers niveaux, sans erreur ni image introuvable en console (`Art.progress.failed === 0`).
- [ ] **Step 3:** Une relecture du diff de code (manifeste, données, outils, tests) par un relecteur neuf, puis remettre au joueur les planches et ce qui n'a pas pu être vérifié.
