# Strange Mind · Les tiroirs magiques (prototype)

**6 mini-jeux sur une idée : pourquoi, en algèbre géométrique, les quatre équations de Maxwell n'en font qu'une.**

C'est la suite du [vent invisible](../maxwell/). Le vent invisible fait sentir *ce que disent* les lois
(fontaines, tourbillons, aimants qui bougent). Les tiroirs magiques montrent *comment une seule équation peut les
contenir toutes*. L'enchaînement suit celui d'une démonstration classique (par exemple une vidéo de vulgarisation
sur l'algèbre géométrique) :

1. on **additionne** des choses de natures différentes : ∂ₜ/c + ∇, cρ − **j**, **E** + i c**B** ;
2. le **produit** de deux choses tombe dans un tiroir précis (nombre, vecteur, bivecteur, trivecteur) ;
3. **B est un bivecteur** : le pseudoscalaire i change une flèche en tapis perpendiculaire ;
4. on développe ∇F et on **identifie tiroir par tiroir** avec J : scalaire → Gauss, vecteur → Ampère,
   bivecteur → Faraday, trivecteur → ∇·B = 0 (les tiroirs 2 et 3 de J sont vides) ;
5. la charge est **un courant qui avance dans le temps** (cρ est la composante « temps » du courant) ;
6. en 2D et sans source dans une région, la solution est la **formule intégrale de Cauchy** : le bord dit tout.

## Les 6 mini-jeux (accès direct : `tiroirs/#1` à `#6`)

Les quatre sortes de choses, comme dans les défis éclair : **lapin** (nombre, debout +1, tête en bas −1),
**flèche** (x rouge, y verte, z bleue ; y s'enfonce dans l'écran), **tapis** (bivecteur, sa flèche courbe dit dans
quel sens il tourne), **cube** (trivecteur i, son couvercle tourne ↺ s'il est à l'endroit).

| # | Mini-jeu | Faire | Prévoir | Notion |
|---|---|---|---|---|
| 1 | Le panier mélangé 🧺 | A + ? = ces tiroirs | on vide A et B dans la commode : que contient chaque tiroir ? | multivecteurs : on ajoute des choses différentes, chacune reste dans son tiroir ; les opposés s'annulent (pièges : tout compter comme des lapins, oublier les annulations) |
| 2 | Dans quel tiroir ? 🗄️ | dans quel tiroir tombe A × B ? | que donne A × B (avec son sens) ? | produit géométrique : flèche × même flèche = lapin, flèches différentes = tapis, flèche × tapis = flèche ou cube, tapis × tapis = lapin tête en bas… |
| 3 | Le cube qui change les flèches 🎲 | i × ? = ce tapis | i × flèche = quel tapis ? | dualité : i transforme une flèche en tapis qui tourne autour d'elle (règle du tire-bouchon) ; c'est pourquoi B devient un tapis dans F = E + icB |
| 4 | La balance des tiroirs ⚖️ | qu'ajouter à droite pour que ce soit juste ? | les deux paniers sont-ils égaux ? | égalité de multivecteurs = égalité dans **chaque** tiroir ; on ne peut pas échanger une flèche contre un lapin. La révélation range chaque panier et colore les tiroirs qui ne vont pas |
| 5 | Le temps, une flèche de plus ⏳ | trouver tous les dessins où la coccinelle ne bouge jamais / revient / va toujours à droite | regarde le film : quel dessin d'espace-temps lui correspond ? | lignes d'univers ; une coccinelle immobile trace quand même un trait : elle avance dans le temps (cρ) |
| 6 | La clôture 🚧 | trouver tous les jardins où quelque chose se cache | qu'y a-t-il derrière la clôture ? (niv. 4 : rien n'est caché, quel vent souffle dedans ?) | Gauss et Stokes lus sur le bord ; Cauchy : sans source, le bord suffit à connaître tout l'intérieur |

## Code

```
js/ga.js      algèbre géométrique de l'espace : lames {m, s}, produit, paniers (multivecteurs) ;
              dessins en perspective cavalière (flèches, tapis orientés, cube), tiroirs, paniers en vrac
js/games.js   les 6 mini-jeux
js/wind.js    vents, flèches et dessins (copie de maxwell/js/draw.js)
js/main.js    moteur repris du vent invisible (séries, niveaux, Rush, défi du jour, voix)
```

Accès direct : `#3`, `#rush`, `#daily`. Outil de test : `strangeMind.show('cube', 4, 'prevoir')`.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr). Voir [LICENSE](../../LICENSE).
