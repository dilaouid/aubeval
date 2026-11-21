# Aubeval en trois langues (FR, EN, ES)

## Intention
Le jeu se joue en français, en anglais ou en espagnol. La langue ne change que les mots :
mêmes règles, même équilibrage, mêmes sauvegardes. Une partie commencée dans une langue se
reprend dans une autre sans rien perdre.

## Objectifs
- Tout le texte vu par le joueur existe en FR, EN et ES : interface, contenu (bâtiments, cartes,
  ennemis, quêtes, personnages, lieux, exploration, cité), tutoriel, messages.
- Langue devinée depuis le navigateur ; choix FR / EN / ES à l'écran titre et dans le panneau
  Village (V) ; `?lang=en` dans l'adresse l'impose.
- Un contrôle (`node tools/check-i18n.js`) liste toute traduction manquante, en trop, ou dont les
  trous `{n}` ne correspondent pas au français.

## Non-objectifs
- Le README, les pages statiques et les messages de développeur (console, outils) restent en français.
- Les noms propres (Aubeval, Aveline, Grakk, les chefs gobelins, les hameaux) ne se traduisent pas.

## Anti-objectifs (échec même si « ça marche »)
- Une sauvegarde qui dépend de la langue, ou qui casse en changeant de langue.
- Une règle du jeu qui lit un texte traduit au lieu d'un identifiant.
- Un texte EN/ES qui déborde de son bouton au point de devenir illisible.

## Approches envisagées
1. **Calques par langue (choisie).** Le français reste dans `data/*.js`, inchangé. Chaque langue a
   ses fichiers `data/i18n/<lang>/<fichier>.js`, qui donnent pour chaque chemin
   (`buildings.hall.name`) le texte traduit, le français en commentaire. Appliqués une fois au
   démarrage, avant que le jeu ne lise les données. Le contenu garde une seule source.
2. Trois langues dans chaque entrée (`name: {fr, en, es}`) : touche tout le code qui lit un nom,
   rend les fichiers de contenu illisibles. Écartée.
3. Tout passer par des clés `tr()` : réécrire tous les fichiers de contenu en clés. Énorme, et le
   contenu perd sa lisibilité. Écartée.

## Conception
- **Chemins.** Un segment de tableau est `[id]` quand l'élément a un `id`, sinon `[index]` :
  `chapters[ch0].quests[p1].title`, `venues.cafe.chat[2]`. Ajouter une quête ne décale rien.
- **`js/i18n.js`**, chargé après `config.js` et avant `data/` : choisit la langue (`?lang=`, puis
  `localStorage['aubeval.lang']`, puis `navigator.languages`, sinon `fr`), écrit les balises
  `<script>` des calques de cette langue (`document.write`, chargement synchrone), puis
  `I18N.apply()` (appelé juste après le dernier fichier `data/`) pose chaque texte sur son chemin.
  Une propriété en getter (titre qui contient le nom du héros) devient un getter qui passe le
  texte par `withHero` (`{hero}`).
- **Champs traduits** : une liste blanche de noms de champs texte (name, desc, title, text, say,
  task, hint, …) appliquée par l'outil d'extraction ; les identifiants (sprite, kind, from: 'hero',
  covers…) ne sont jamais traduits.
- **Branches d'héritage** : `branch` devient un identifiant stable (`prosperity`…), le nom affiché
  vient de `DATA.legacyBranches`. Les `covers` du tutoriel utilisent l'identifiant.
- **Texte en dur dans `js/`** : passe en clés `DATA.strings` (dégâts des cartes, conditions de
  quête, ATQ/DÉF/PV, « niv. », etc.). Écrans de développement (galerie de sprites) exclus.
- **Nombres** : séparateur décimal et suffixes (`k`, `M`, `Md`…) viennent de `DATA.strings`.
- **`{de_hero}`** (élision française) : en EN/ES, les calques écrivent `{hero}` dans la phrase.
- **Changer de langue** : sauvegarde, écrit `aubeval.lang`, recharge la page.
- **Page** : `<html lang>`, `document.title` suivent la langue.
- **Outils** : `tools/i18n.js extract <lang>` écrit ou complète les calques (chemins manquants
  ajoutés avec le français à traduire, marqués `TODO`) ; `tools/check-i18n.js` vérifie.
- **Traduction** : ton du français gardé (village médiéval chaleureux, vouvoiement → « you » /
  « usted »), touches clavier inchangées.

## Laissé au constructeur
Le dessin exact du sélecteur de langue, la répartition des calques par fichier.
