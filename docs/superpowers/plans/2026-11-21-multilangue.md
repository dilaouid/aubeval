# Aubeval multilangue — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aubeval jouable en FR, EN et ES, sans que la langue touche aux règles ni aux sauvegardes.

**Architecture:** Le français reste la source dans `data/*.js`. Des calques `data/i18n/<lang>/<fichier>.js` donnent un texte par chemin ; `js/i18n.js` choisit la langue, charge ses calques et les applique avant que le jeu ne lise les données.

**Tech Stack:** JavaScript navigateur sans build, Node 24 pour les outils (`vm` pour charger `data/`).

**Spec:** `docs/superpowers/specs/2026-11-21-multilangue-design.md`

## Global Constraints
- Langues : `fr` (source), `en`, `es`. Clé de stockage : `aubeval.lang`. Option d'adresse : `?lang=`.
- Aucun identifiant ne se traduit ; la sauvegarde (`aubeval.save.v1`, VERSION 4) ne change pas.
- Pas de dépendance, pas de build.
- En-tête `// PROTOTYPE - NOT FOR PRODUCTION` des fichiers du projet repris dans les nouveaux fichiers.
- Commits sans ligne Co-Authored-By (préférence de l'utilisateur).

## Review Focus
- Sauvegarde FR rechargée en EN puis ES : même village, mêmes ressources, aucune erreur console.
- Texte EN/ES plus long que le FR : boutons de la barre du haut, onglets, cartes de combat lisibles.
- Titres en getter (`{hero}`) : le nom du héros apparaît bien en EN/ES.
- `?lang=xx` inconnu ou `localStorage` bloqué : le jeu démarre en français (ou langue du navigateur).
- Le contrôle du tutoriel (`js/tuto-check.js`) ne signale rien de plus en EN/ES qu'en FR.

---

### Task 1: Moteur i18n et outils

**Files:**
- Create: `js/i18n.js`, `tools/i18n.js`, `tools/test-i18n.js`
- Modify: `index.html` (balise `js/i18n.js` après `config.js` ; `<script>I18N.apply()</script>` après `data/explore.js`)

**Interfaces:**
- Produces (navigateur) : `I18N.lang` (`'fr'|'en'|'es'`), `I18N.langs = ['fr','en','es']`, `I18N.add(lang, map)`, `I18N.apply()`, `I18N.set(lang)` (persiste la sauvegarde, écrit `aubeval.lang`, recharge).
- Produces (Node, `tools/i18n.js`) : `paths(DATA) -> Map<path, frText>` (champs de la liste blanche), `get(DATA, path)`, `put(DATA, path, text)`, `loadData() -> DATA` ; CLI `node tools/i18n.js extract <lang>` et `node tools/i18n.js check`.
- Format d'un calque : `I18N.add('en', { 'buildings.hall.name': 'Town Hall', // Hôtel de ville` … `})`.

- [ ] Tests (`tools/test-i18n.js`, `node:assert`) : `put` sur `chapters[ch0].quests[p1].title` change la bonne quête ; `put` sur un getter (`chapters[ch1]…[p5].title`) donne un getter qui remplace `{hero}` ; `paths` ne renvoie aucun champ `sprite`, `kind`, `covers`, `id` ; segment `[3]` pour un tableau sans `id`.
- [ ] Lancer : échoue (fichier absent).
- [ ] Implémenter `tools/i18n.js` et `js/i18n.js` (même code de chemin, partagé par copie courte ou chargé dans `vm`). Liste blanche : name, card, desc, title, text, hint, say, task, about, styles, flavor, how, keys, label, short, trait, one, plural, opens, unit, busy, sad, raid (texte), greet, gone, cold, hot, from (texte seulement), stages, names, chiefs, chat, lines, glad, cross, leaves, lost, thanks, tips, wait, ready, after (tableau de texte), chain, okay, pushed, et tout `strings.*` (y compris `tutorial.strings.*`). Exclus : `tutorial.mechanics`.
- [ ] `check` : chemins manquants, chemins inconnus, trous `{x}` différents du français ; code de sortie 1 si erreur.
- [ ] Tests verts ; le jeu en `?lang=fr` identique à avant (aucune erreur console).
- [ ] Commit `feat(i18n): language layers applied at load`.

### Task 2: Branches d'héritage à identifiant stable

**Files:** `data/city.js` (legacy, `DATA.legacyBranches`), `js/city.js:660`, `data/tutorial.js` (covers `legacy:*`), `js/tuto-check.js:40`

- [ ] `branch` devient `prosperity`… ; `DATA.legacyBranches = { prosperity: 'Prospérité', … }` ; `js/city.js` affiche le nom ; covers en identifiants.
- [ ] Vérifier : console sans nouvel avertissement du tutoriel ; une sauvegarde avec nœuds d'héritage achetés les garde (achats indexés par `id` de nœud).
- [ ] Commit.

### Task 3: Texte en dur de `js/` vers `DATA.strings`

**Files:** `js/cards.js`, `js/quests.js`, `js/battle.js`, `js/screens.js` (hors galerie de développement), `js/ui.js` (`fmt`, `fmtRate`, `fmtNum`, « Fermer »), `js/save.js` (nom du fichier exporté), et tout autre littéral français affiché trouvé par balayage, `data/strings.js`.

- [ ] Balayage : `grep` des littéraux français dans `js/` hors `tr(`.
- [ ] Clés ajoutées dans `data/strings.js` (`num_dec: ','`, `num_units: ['k','M','Md','Bn','Tn']`, `card_dmg`, …) ; code passé en `tr()`.
- [ ] Vérifier en FR : textes identiques à avant (cartes, conditions de quête, statistiques d'objet).
- [ ] Commit.

### Task 4: Sélecteur de langue et page

**Files:** `js/screens.js` (écran titre, panneau Village), `js/i18n.js`, `data/strings.js` (`lang_label`), `index.html`

- [ ] Trois boutons FR / EN / ES sur l'écran titre et dans le panneau Village ; clic → `I18N.set`.
- [ ] `document.documentElement.lang` et `document.title` suivent la langue.
- [ ] Vérifier : changement en pleine partie → même village après rechargement.
- [ ] Commit.

### Task 5: Traductions EN et ES

**Files:** `data/i18n/en/*.js`, `data/i18n/es/*.js` (un calque par fichier de `data/`)

- [ ] `node tools/i18n.js extract en` puis `es` : squelettes avec le français.
- [ ] Traduire (en parallèle par fichier) : ton chaleureux et médiéval, vouvoiement → « you » / « usted », noms propres et touches gardés, trous `{x}` gardés, `{de_hero}` → `{hero}` dans la phrase.
- [ ] `node tools/i18n.js check` : 0 erreur.
- [ ] Commit.

### Task 6: Vérification en jeu

- [ ] Pour FR, EN, ES : écran titre, nommage, tutoriel (premières étapes), barre de construction, panneau d'un bâtiment, Peuple, Héros, Quêtes, Cité, un combat (`?demo=1` si utile), un lieu (Café). Console sans erreur, pas de texte qui déborde de façon illisible ; captures.
- [ ] Une sauvegarde FR reprise en EN puis ES.
