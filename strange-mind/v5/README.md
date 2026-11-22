# Strange Mind v5 : la chasse aux relations (prototype)

On ne dit plus « fais ceci ». Le jeu **montre une relation** (deux dauphins qui font un quart de tour,
deux lapins qui s'annulent, un dauphin et son reflet…) et le joueur doit **la retrouver partout** sur le
plateau. C'est une recherche ouverte : plusieurs bonnes réponses, dans l'ordre qu'on veut.

- Le **modèle tourne** toutes les 2 secondes : la relation est la même dans toutes les positions.
  C'est exactement l'idée à construire (un quart de tour reste un quart de tour, où qu'on soit).
- On **glisse** d'une case à sa voisine (paire), sur 3 cases en ligne (trio), ou en diagonale
  (carré 2×2). Quand une flèche est dessinée sous le modèle, **le sens compte**.
- Les points sous chaque modèle montrent **combien il en reste**.
- Les relations plus complexes **rapportent plus** (10 → 80 points), et les trouvailles rapides
  font des **combos** 🔥.

## La progression (11 chapitres, 3 plateaux chacun)

| # | Chapitre | Relations à chasser (points) | Ce qui se construit |
|---|---|---|---|
| 1 | Les jumeaux | pareil (10) | voir une orientation |
| 2 | Le quart de tour | pareil (10), quart de tour ↺ (20) | rotation = relation entre deux positions |
| 3 | Le demi-tour | + demi-tour (20) | −1 = deux quarts de tour |
| 4 | Les deux sens | ↺ (20) et ↻ (20) | la même paire lue dans l'autre sens = l'inverse (i et −i) |
| 5 | La suite | ↺ (20), suite ↺↺ (50) | composer deux rotations |
| 6 | La machine | pareil (10), A × B = C (80) | multiplier = additionner les angles |
| 7 | Fois lui-même | pareil (10), A × A = B (60), huitièmes de tour | racines |
| 8 | Les lapins | s'annulent (20), trois qui font zéro (50) | +1, −1, 0, opposés |
| 9 | Les miroirs | pareil (10), dauphin · miroir · reflet (60) | réflexion (le reflet a le ventre en l'air) |
| 10 | Le tourbillon | tête en bas (20), tourbillon ↺ (40), tourbillon ↻ (40) | bivecteur : la même paire donne ↺ dans un sens et ↻ dans l'autre (ab = −ba) |
| 11 | Les jardins | carré qui fait tourner (80), carré miroir (80) | matrices 2×2 : rotations et réflexions, signe du déterminant |

Étoiles par plateau : 0-1 erreur ★★★, 2-3 ★★, sinon ★. Une étoile au chapitre débloque le suivant.
Une erreur « dans l'autre sens » n'est pas comptée : le jeu dit « essaie dans l'autre sens ↔ ».

**Chasse libre 90 s** : plateaux tirés parmi les chapitres débloqués, +1 s par trouvaille, +15 s par plateau fini, record.

## Code

```
js/relations.js  les relations (test, exemple, pose), les chapitres, la fabrication des plateaux
js/hunt.js       un plateau : rendu, glissement, vérification, combos, indice
js/main.js       accueil, chapitres, cartes-modèles animées, chasse libre, sons, voix, sauvegarde
js/draw.js, js/glyphs.js   dessins
tools/check.mjs  node v5/tools/check.mjs : vérifie que chaque relation apparaît 2 à 5 fois par plateau
```

Ajouter une relation : un objet dans `RELATIONS` (`kind`, `ordered`, `test`, `plant`, `example`, `pts`),
puis l'ajouter à un chapitre. Accès direct : `#5` (chapitre 5), `#libre`.

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l’écran d’accueil, ou `?lang=en` dans l’adresse.
English version: **EN** button on the home screen, or add `?lang=en` to the address.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (citer l’auteur · pas d’usage commercial · partage dans les mêmes conditions). Voir [LICENSE](../../LICENSE).
