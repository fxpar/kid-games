# Strange Mind

Des formes plates qui sont en fait des volumes, des animaux qui sont des nombres.
Un univers de jeu pour initier les enfants dès 5 ans aux rotations, aux nombres complexes,
aux matrices, aux déterminants et à l'algèbre géométrique de Hestenes, sans jamais écrire une formule.

- **Aucune dépendance** : HTML + JavaScript (modules ES) + Canvas 2D. Fonctionne hors-ligne.
- Ouvrir via UwAmp : `http://localhost/kid-games/strange-mind/`
  ou sans UwAmp : `node tools/serve.mjs` puis `http://localhost:8765/`
  (les modules ES ne marchent pas en `file://`).
- Accès direct à un niveau : `index.html#5`, bac à sable : `index.html#sandbox`.

## Les gestes

| | Basculer la forme (voir une autre face) | Tourner la face (le dessin tourne) |
|---|---|---|
| Écran tactile | glisser 2 doigts (ou 1, réglable) | tourner 2 doigts, ou ↺ ↻ |
| Pavé tactile | défiler à 2 doigts sur la forme | pincer, Maj + défiler, ou ↺ ↻ |
| Souris | cliquer-glisser | clic droit glissé, Maj + glisser, ou ↺ ↻ |
| Clavier | flèches | Q (↺) / E (↻) |

Sous Windows/Chrome, un pavé tactile n'envoie pas de geste de rotation à deux doigts :
d'où les boutons ↺ ↻ sous chaque forme.

## Le dictionnaire secret (pour les adultes)

| Dans le jeu | En mathématiques |
|---|---|
| carré / triangle / octogone | face d'un cube / tétraèdre / prisme octogonal |
| dauphin vers la droite, le haut, la gauche, le bas | 1, i, −1, −i |
| un petit tour ↺ | multiplier par i (ou e^{iπ/4} sur l'octogone) |
| lapin debout / nuage / lapin tête en bas | +1 / 0 / −1 (−1 = le même lapin tourné de 180°) |
| la machine × | produit de complexes = addition des angles |
| grille de 4 cubes + jardin | matrice 2×2 agissant sur le plan |
| taille du jardin (🪞 si retourné) | déterminant (signe = orientation) |
| miroir | réflexion = vecteur unitaire en algèbre géométrique |
| deux miroirs | rotor = produit de deux vecteurs, rotation d'angle double |
| flèche × flèche = lapin ou tourbillon | produit géométrique ab = a·b + a∧b ; tourbillon = bivecteur e₁e₂, (e₁e₂)² = −1 |

Le bouton 🎓 de chaque niveau donne l'explication détaillée.

## Les niveaux

1. **Le carré magique** : un carré est un cube.
2. **Triangle et octogone** : pyramide, prisme.
3. **Le dauphin a faim** : 4 directions = 1, i, −1, −i.
4. **Deux petits tours** : i² = −1, i⁴ = 1.
5. **Le tour à l'envers** : i³ = −i, l'inverse.
6. **Lapins debout, lapins tête en bas** : +1, 0, −1, opposés qui s'annulent.
7. **La machine à tourner** : multiplier = additionner les angles.
8. **La racine magique** : √i, et x² = −1 a deux solutions.
9. **La grille qui transforme** : matrices identité, miroir, quart de tour, demi-tour.
10. **Le jardin qui disparaît** : déterminant 0, 2, −2.
11. **Deux miroirs font un tour** : réflexions → rotations (Hestenes).
12. **Le tourbillon secret** : bivecteur, ab = −ba.

## Organisation du code

```
index.html          écrans (menu, jeu, fenêtre modale)
css/style.css
js/math3d.js        vecteurs, quaternions
js/shapes.js        polyèdres (ajouter une forme ici)
js/glyphs.js        dessins des faces (ajouter un animal ici)
js/engine.js        rendu 3D + gestes (World, Shape)
js/panels.js        dessins des panneaux (boussole, droite des nombres, jardin…)
js/levels.js        LES NIVEAUX (format documenté en tête de fichier)
js/main.js          menu, étapes, voix, sons, progression
tools/serve.mjs     petit serveur de développement
```

## Créer un niveau

Ajouter un objet dans `LEVELS` (`js/levels.js`) :

```js
{
  id: 'mon-niveau', icon: '🐙', title: 'Mon niveau',
  concept: '<p>Explication pour les adultes…</p>',
  shapes: [
    { id: 'A', type: 'cube', pos: [-1.9, 0], tumble: 'none',
      faces: [{ g: 'dolphin', bg: '#cde7ff' }, '💧', '💧', '💧', '💧', '💧'] },
    { id: 'B', type: 'octagon', pos: [1.9, 0], twistDirs: [1] },
  ],
  labels: [{ pos: [0, 0], text: '×' }],
  panels: [{ ratio: 2, draw(ctx, w, h, S, step) { /* dessiner avec panels.js */ } }],
  steps: [
    { say: 'Consigne lue à voix haute', hint: 'Indice',
      setup: (S) => S.set('A', 0, 90),                 // face 0, tournée de 90°
      goal: (S) => S.dir('A') === 0 && S.glyph('B') === 'dolphin',
      fail: (S) => S.shape('A').twists > 3,            // facultatif : recommencer
      bravo: 'Bravo !' },
  ],
}
```

Options d'une forme : `tumble` (`'both'`, `'h'`, `'v'`, `'none'`), `twist` (bool),
`twistDirs` (`[1]` = seulement ↺), `twistStep` (en degrés, ex. 180 pour les cubes-nombres),
`start: { front, dir }`, `hidden`, `size`.

État lisible dans `S` : `S.dir(id)` (angle 0…359 de la face visible, sens anti-horaire),
`S.glyph(id)`, `S.val(id)` (complexe `[re, im]`), `S.real(id)`,
`S.shape(id).twists / turnSum / history / startDir`, `S.mem` (mémoire libre du niveau).

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l’écran d’accueil, ou `?lang=en` dans l’adresse.
English version: **EN** button on the home screen, or add `?lang=en` to the address.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (citer l’auteur · pas d’usage commercial · partage dans les mêmes conditions). Voir [LICENSE](../../LICENSE).
