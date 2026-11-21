# Camps et raids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raser un camp ne fait plus prendre de retard sur les raids : un camp rasé compte pour des raids aux rangs, et le joueur peut provoquer le camp suivant (et son raid) sans attendre le répit.

**Architecture:** Piste 2 dans `City.event('camp')` (js/city.js) avec un réglage `camp_raid_credit`. Piste 1 : une fonction `Camp.provoke()` (js/camp.js) qui finit le répit, dresse le camp (`rise`) et lance le raid comme un raid appelé (`Raid.start(true)`) ; un bouton sur la plaque du raid pendant le répit (js/screens.js).

**Tech Stack:** HTML + JavaScript sans build ; navigateur via `.claude/launch.json` (`aubeval`, port 8765), vérifications par `javascript_tool`.

**Spec:** `docs/superpowers/specs/2026-11-21-camps-et-raids-design.md`

## Global Constraints

- `camp_raid_credit` : `{ value: 2, min: 0, max: 6, step: 1 }`, dans config.js, section « The camp's assault ».
- Le crédit s'ajoute à `state.city.raids` (le compteur des rangs) seulement ; les commandes `raid` (« Tenir la porte ») ne bougent pas.
- Le répit reste par défaut ; « Provoquer » est un choix.
- Le raid provoqué a `early: true` (prime `raid_call_bonus`).
- Textes en français dans data/strings.js, au style existant.
- Commits sans ligne Co-Authored-By.

## Review Focus

- Provoquer alors que `state.raid.timer == null` (raids pas encore commencés, tutoriel) : rien ne se passe, pas de bouton. Test : Task 2 step 3.
- Provoquer pendant un raid actif : impossible (la plaque montre le raid, pas le répit). Test : Task 2 step 3.
- `camp_raid_credit = 0` : comportement d'avant, et la mention du crédit disparaît des textes. Test : Task 1 step 2.
- Un camp rasé pendant que le cor a sonné : le raid annoncé est annulé (déjà le cas) et le crédit s'applique quand même. Test : Task 1 step 2.
- Le raid provoqué part bien depuis le nouveau camp (pas l'ancien point de départ). Test : Task 2 step 3.

---

### Task 1: Un camp rasé compte comme des raids

**Files:**
- Modify: `config.js` (après `camp_pop` ou dans « The camp's assault »)
- Modify: `js/city.js:275` (`event`, branche `'camp'`) et `js/city.js:148` (`describe`, ligne des raids)
- Modify: `js/camp.js:120` (message `camp_fall`)
- Modify: `data/strings.js:208`, `data/city.js:16`

**Interfaces:**
- Produces: `tune.camp_raid_credit` (entier ≥ 0).

- [ ] **Step 1: Implémenter**
  - `event('camp')` : `c.raids += tune.camp_raid_credit` en plus de `c.camps++`.
  - `describe` : quand `tune.camp_raid_credit > 0`, la ligne des raids ajoute « · un camp rasé en vaut {k} » (nouvelle clé `city_need_raids_camp`).
  - `camp_fall` : ajoute « Il compte pour {k} raids repoussés. » quand le crédit > 0 (clé à part, `camp_fall_credit`, concaténée).

- [ ] **Step 2: Vérifier dans le navigateur** (`preview_start aubeval`, `?demo=1`)
  javascript_tool : `const a = state.city.raids, o = state.city.orders.filter(x=>x.kind==='raid').map(x=>x.have); state.raid.camp.guards=[]; Camp.hit({camp:true,x:0,y:0}, 1e9); [state.city.raids - a, state.city.orders.filter(x=>x.kind==='raid').map(x=>x.have), o, state.gained]`
  Expected : `2`, les deux listes de `have` identiques, le message parle des 2 raids. Puis `tune.camp_raid_credit = 0` et `City.describe({raids: 5})[0].text` : pas de mention de camp. Avec `state.raid.warned = true` avant la chute : crédit appliqué, `warned` remis à `false`. Console sans erreur.

- [ ] **Step 3: Commit** — `feat(city): a razed camp counts as raids toward the ranks`

### Task 2: Provoquer le prochain camp

**Files:**
- Modify: `js/camp.js` (nouvelle `provoke`, exportée)
- Modify: `js/screens.js:353-356` (branche du répit de la plaque du raid)
- Modify: `data/strings.js:210` (clés `camp_provoke`, `camp_provoke_tip`)

**Interfaces:**
- Consumes: `rise()` (camp.js), `Raid.start(early: boolean)`.
- Produces: `Camp.provoke(): boolean` — vrai si le camp s'est dressé et le raid est parti.

- [ ] **Step 1: Implémenter `Camp.provoke()`**
  Garde : camp présent, `c.down > 0`, `!state.raid.active`, `state.raid.timer != null` ; sinon `false`. Puis `c.down = 0; rise(); Raid.start(true); return true`.

- [ ] **Step 2: Bouton sur la plaque**
  Dans la branche `r.camp.down > 0`, si `r.timer != null`, un bouton au même endroit et de même taille que « Appeler » (`rx + 216, ry + 8, 94, 36`), libellé `camp_provoke` (« Provoquer »), action `Camp.provoke`, bulle `camp_provoke_tip` : le nouveau camp se dresse maintenant et son raid part aussitôt ; prime +{pct} % s'il est repoussé. Le texte de la plaque ne doit pas passer sous le bouton (raccourcir `camp_ruin_hud` au besoin, p. ex. « Camp en ruine · le suivant dans »).

- [ ] **Step 3: Vérifier dans le navigateur** (`?demo=1`)
  javascript_tool : `state.raid.camp.guards=[]; Camp.hit({camp:true,x:0,y:0},1e9); const lvl=state.raid.camp.lvl, old=Village.campMid(); [Camp.provoke(), state.raid.camp.lvl===lvl+1, !(state.raid.camp.down>0), state.raid.active && state.raid.active.early, Math.hypot(state.raid.from.x-old.x, state.raid.from.y-old.y) > 0]`
  Expected : `[true, true, true, true, true]`. Puis `Camp.provoke()` à nouveau : `false` (camp debout, raid actif). Avec `state.raid.timer = null` pendant un répit : `false`, et aucun bouton (capture d'écran de la plaque). Capture d'écran de la plaque pendant le répit avec le bouton. Console sans erreur.

- [ ] **Step 4: Commit** — `feat(camp): provoke the next camp and its raid without waiting`
