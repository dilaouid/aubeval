# Aubeval

Un village à bâtir, un héros à armer. Jeu de gestion et de combat en pixel art isométrique, qui se joue dans le navigateur.

## Jouer

Le jeu est statique (HTML + JavaScript, sans dépendance ni étape de build). Servez le dossier avec n'importe quel serveur HTTP local :

```sh
python -m http.server 8000
```

puis ouvrez <http://localhost:8000>.

## Commandes

| Action | Commande |
|---|---|
| Poser, choisir | Clic |
| Déplacer la vue | Glisser |
| Zoom | Molette |
| Annuler | Clic droit |
| Commencer | Entrée ou clic |

La pause liste toutes les commandes. La partie est sauvegardée dans le navigateur (`localStorage`).

## Licence

MIT, voir [LICENSE](LICENSE).
