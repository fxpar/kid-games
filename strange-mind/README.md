# Strange Mind

> 🇬🇧 English: every game has an English version (EN button, or add `?lang=en` to the address). See [the English summary](#english) below.

Des formes qui sont des volumes, des animaux qui tournent : des jeux pour construire chez les enfants
(dès 5 ans) des intuitions sur les rotations, les nombres complexes, les matrices et l'algèbre
géométrique, sans jamais écrire une formule.

Ici, toutes les versions. Une sélection est publiée sur edu-fpar (six leçons de la v1 et le vent invisible, sans cadenas) :
[jouer](https://edu-fpar.github.io/strange-mind/) · [dépôt](https://github.com/edu-fpar/strange-mind).

Ouvrir `index.html` (via un serveur web : `node tools/serve.mjs` puis http://localhost:8765/) pour
choisir une version :

| Version | Dossier | Idée |
|---|---|---|
| v1 · Les leçons | [`v1/`](v1/) | 12 niveaux guidés, consignes lues à voix haute : de i à l'algèbre géométrique de Hestenes |
| v2 · Les cubes qui roulent | [`v2/`](v2/) | jeu de réflexion : le dessus du cube garde la mémoire du chemin (l'ordre des rotations compte) |
| v3 · Les tourbillons | [`v3/`](v3/) | jeu rapide à la Candy Crush : on fait tourner des carrés d'animaux, Rush 60 s, défi du jour |
| v4 · Les défis éclair | [`v4/`](v4/) | les 9 situations de la v1 en défis de quelques secondes, « faire » et « prévoir », séries, médailles, Rush |
| v5 · La chasse aux relations | [`v5/`](v5/) | le jeu montre une relation, on la retrouve partout sur le plateau ; relations de plus en plus riches (rotation, inverse, composition, miroir, bivecteur, matrices) |
| Le vent invisible (Maxwell) | [`maxwell/`](maxwell/) | 9 mini-jeux vers les équations de Maxwell en algèbre de Hestenes : fontaines (divergence), moulinets (rotationnel), Stokes, Ampère, ∇·B = 0, Faraday, et la loupe ∇F = J. Version d'origine (avec cadenas) ; la version publiée, sans cadenas, est sur [edu-fpar](https://edu-fpar.github.io/strange-mind/maxwell/) |
| Les tiroirs magiques | [`tiroirs/`](tiroirs/) | 6 mini-jeux, suite du vent invisible : pourquoi les quatre équations n'en font qu'une (multivecteurs, produit géométrique, dualité, égalité tiroir par tiroir, espace-temps, Cauchy) |

Chaque dossier a son README. Aucune dépendance : HTML, JavaScript (modules ES) et Canvas 2D.
Idées mises de côté : [`idees/`](idees/).

## Langues

Chaque jeu existe en français et en anglais : bouton EN / FR sur l'écran d'accueil de chaque version,
ou `?lang=en` / `?lang=fr` dans l'adresse (le choix est retenu pour toutes les versions).

## Licence

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)
(Attribution · Pas d'utilisation commerciale · Partage dans les mêmes conditions, internationale).
Vous pouvez partager et adapter ce projet en citant l'auteur (« Strange Mind, François Parlant », avec un
lien vers ce dépôt et la licence), sans usage commercial, et en diffusant vos modifications sous la même
licence. Voir [LICENSE](../LICENSE).

## English

Strange Mind is a set of games for children (age 5+) to build intuitions about rotations, complex numbers,
matrices and Hestenes' geometric algebra, without ever writing a formula. Open `index.html` through a web
server (`node tools/serve.mjs`, then http://localhost:8765/) and pick a version:

| Version | Folder | Idea |
|---|---|---|
| v1 · The lessons | [`v1/`](v1/) | 12 guided levels with spoken instructions: from i to geometric algebra |
| v2 · Rolling cubes | [`v2/`](v2/) | puzzle game: the top face of a cube remembers its path (the order of rotations matters) |
| v3 · Whirls | [`v3/`](v3/) | fast Candy Crush-style game: rotate squares of animals, Rush 60 s, daily challenge |
| v4 · Quick challenges | [`v4/`](v4/) | the 9 situations of v1 as few-second challenges ("do" and "predict"), streaks, medals, Rush |
| v5 · The relation hunt | [`v5/`](v5/) | the game shows a relation and you find it everywhere on the board; richer relations (rotation, inverse, composition, mirror, bivector, matrices) score more |
| The invisible wind (Maxwell) | [`maxwell/`](maxwell/) | 9 mini-games towards Maxwell's equations in Hestenes' algebra: fountains (divergence), pinwheels (curl), Stokes, Ampère, ∇·B = 0, Faraday, and the magnifier ∇F = J. Original version (with locks); the published version, all open, is on [edu-fpar](https://edu-fpar.github.io/strange-mind/maxwell/) |
| The magic drawers | [`tiroirs/`](tiroirs/) | 6 mini-games following the invisible wind: why the four equations are really one (multivectors, geometric product, duality, grade-by-grade equality, spacetime, Cauchy) |

Every game has an English version: EN button on each home screen, or `?lang=en` in the address.

**License:** © 2026 François Parlant — [CC BY-NC-SA 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/).
You may share and adapt this work, crediting the author ("Strange Mind, François Parlant", with a link to this
repository and the license), for non-commercial purposes only, and you must distribute your contributions under
the same license. See [LICENSE](../LICENSE).
