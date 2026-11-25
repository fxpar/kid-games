# Strange Mind v4 : défis éclair (prototype)

Les situations de la [v1](https://fxpar.github.io/kid-games/strange-mind/v1/) (dauphin, lapins, machine, jardin, miroirs, tourbillon) jouées au rythme d'un
jeu casual : des défis de quelques secondes, à l'infini, avec séries, niveaux et médailles.
Chaque bonne réponse **est** la notion : on ne peut pas réussir sans s'en servir.

## Les 9 mini-jeux

| # | Mini-jeu (niveau v1) | Faire | Prévoir | Notion |
|---|---|---|---|---|
| 1 | Le dauphin a faim | tourner le dauphin vers le poisson | où regardera-t-il après ↺↺ ? | quart de tour = ×i |
| 2 | Le tour à l'envers | un seul bouton ↺ : le bon nombre de tours | « ↺↺↺ fait pareil que… ? » | i³ = −i, inverse |
| 3 | Lapins debout, tête en bas | retourner les lapins pour amener la coccinelle au drapeau | où va la coccinelle ? | +1, 0, −1, opposés |
| 4 | La machine à tourner | A × ? = cible | A × B = ? | multiplier = additionner les angles |
| 5 | La racine magique | ? × ? = cible (puis trouver les DEUX) | A × A = ? | √i, deux solutions |
| 6 | La grille qui transforme | régler la grille pour refaire le jardin | quel jardin sort de la grille ? | matrice = transformation |
| 7 | Le jardin qui disparaît | — | normal 🙂, miroir 🪞 ou écrasé 💨 ? | signe du déterminant |
| 8 | Deux miroirs font un tour | tourner 1 puis 2 miroirs | que voit-on dans le(s) miroir(s) ? | réflexions, 2 miroirs = rotation |
| 9 | Le tourbillon secret | tourner la flèche verte pour obtenir le résultat | flèche × flèche = ? | produit géométrique, bivecteur, ab = −ba |

Chaque mini-jeu a **4 niveaux** de difficulté (par exemple pour le dauphin : 1 quart de tour,
puis 2, puis des tours mélangés, puis l'octogone par huitièmes).

## Ce qui encourage

- **Prévoir puis voir** : après la réponse, l'animation montre ce qui se passe vraiment.
- **Erreur douce** : on montre la bonne réponse, seule la série est perdue.
- **Séries** 🔥 avec sons qui montent, confettis à 3, 5, 10…
- **Difficulté qui s'adapte** : 4 réussites d'affilée → niveau supérieur ; 2 erreurs → on redescend.
- **Étoiles** par partie de 10 défis (6, 8, 10 bonnes réponses) ; une ★ débloque le mini-jeu suivant.
- **Médailles** 🥉🥈🥇💎 : le plus haut niveau maîtrisé (4 réussites d'affilée à ce niveau).
- **Rush 60 s** (tous les mini-jeux débloqués, de plus en plus vite, +2 s toutes les 3 bonnes réponses d'affilée) et **défi du jour** (le même pour tout le monde).
- Consignes lues à voix haute (🗣️ pour couper), aucun texte nécessaire pour jouer.

## Code

```
js/games.js   les 9 mini-jeux : chacun fabrique des défis à l'infini (gen(niveau, hasard, mode))
js/draw.js    dessins partagés (mer, droite des nombres, tuiles-nombres, jardin, grille)
js/main.js    accueil, séances, séries, niveaux, Rush, défi du jour, sons, voix, sauvegarde
js/glyphs.js  dessins des animaux
```

Accès direct : `#3` (mini-jeu 3), `#rush`, `#daily`.
Pour ajouter un mini-jeu : un objet `{ id, name, icon, gen(lvl, R, mode) }` dans `GAMES`
(le format d'un défi est décrit en tête de `js/games.js`).

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l’écran d’accueil, ou `?lang=en` dans l’adresse.
English version: **EN** button on the home screen, or add `?lang=en` to the address.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (citer l’auteur · pas d’usage commercial · partage dans les mêmes conditions). Voir [LICENSE](../LICENSE).
