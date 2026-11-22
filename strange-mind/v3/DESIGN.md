# Strange Mind v2 : le jeu de tourbillons (modèle match-3)

> v1 (version guidée) : `v1/`. Idées mises de côté : `idees/`.
> Objectif v2 : un jeu **casual** à la Candy Crush. Des parties courtes qui s'enchaînent, qu'on
> rejoue sans fin, où le même geste sert des centaines de fois et rapporte des dizaines de petits
> succès par minute.

## 1. Pourquoi le match-3 marche (et ce qu'on lui emprunte)

- **Un seul geste**, appris en 5 secondes, répété des milliers de fois.
- **Un succès toutes les 2 secondes** : ça éclate, ça tombe, ça enchaîne (cascades).
- **De la chance dans la réussite** : les cascades surprises donnent l'impression d'être doué.
- **Des niveaux presque identiques** : la même mécanique avec un nouvel objectif ou un nouvel obstacle.
- **« J'y étais presque »** : un nombre de coups limité, et on échoue de peu, donc on relance.
- **Une carte avec des centaines de niveaux** et 3 étoiles par niveau : progression visible.

## 2. La touche Strange Mind : ici, on ne permute pas, on TOURNE

Le plateau est une grille de **petites tuiles-cubes** portant des animaux **orientés**
(🐬 dauphin, 🐰 lapin, 🐟 poisson, 🦊 renard, 🐸 grenouille…), chacun regardant vers ←, →, ↑ ou ↓.

**Le geste unique** : on pose deux doigts (ou on touche) au centre d'un **carré de 4 tuiles** et on
le **fait tourner d'un quart de tour**.
- Les 4 tuiles changent de place **et** chaque animal tourne avec elles : le dauphin qui regardait
  → regarde maintenant ↑.
- Tourner deux fois = demi-tour. Tourner dans l'autre sens = défaire. Le joueur l'apprend en
  jouant, des centaines de fois, sans qu'on lui dise.

**Former une ligne de 3 animaux identiques** les fait éclater, puis les tuiles du dessus tombent,
ce qui peut créer des cascades.

Le petit plus qui change tout : **la direction des animaux compte.**

| Combinaison | Effet |
|---|---|
| 3 identiques alignés | éclatent (base, facile) |
| 3 identiques **regardant tous dans le même sens** | « **parade** » : double points + une étincelle |
| 4 en parade | **fusée** : traverse le plateau **dans la direction où regardent les animaux** |
| 5 en parade | **tourbillon** 🌀 : fait tourner **tout le plateau** d'un quart de tour, et la gravité change de côté ! |
| forme en L ou en T | **miroir** 🪞 : retourne une zone (gauche ↔ droite) |
| deux animaux identiques **face à face** (→ ←) | « **bisou** » 💥 : ils s'annulent et font éclater leur colonne |

C'est simple au départ (aligner 3), puis on découvre qu'**orienter** les animaux rapporte gros.
L'enfant finit par anticiper : « si je tourne deux fois, ils regarderont tous à gauche ».

**Combos de bonus** (le cœur du plaisir dans Candy Crush) :
- fusée + fusée → croix ;
- fusée + tourbillon → le plateau tourne et la fusée repart dans le nouveau sens ;
- miroir + tourbillon → le plateau entier est retourné ;
- tourbillon + tourbillon → demi-tour du monde, tout retombe vers le haut.

## 3. Les objectifs de niveau (variés, mais toujours le même geste)

Chaque niveau = un plateau (forme, trous) + un nombre de coups + **un** objectif :

1. **Collecter** : 20 🐬 et 15 🐰.
2. **Libérer** : des animaux pris dans des bulles de glace (éclater à côté pour casser).
3. **Faire descendre** : amener les œufs dorés 🥚 jusqu'en bas (avec la gravité qui peut tourner !).
4. **Parades** : réussir 5 parades (le niveau pousse à orienter).
5. **Orienter** : à la fin, tous les poissons restants doivent regarder la mer 🌊 (bord droit).
6. **Score** : atteindre X points.

**Obstacles** introduits un par un, tous les 10 à 15 niveaux : glace, cases bloquées, **tuiles
verrouillées** (qui ne tournent pas), **flèches fixes** (une tuile qui force la direction),
**nuages** (on ne voit pas l'animal tant qu'il n'a pas été tourné), **miroirs fixes**.

## 4. Ce qui fait rejouer

- **3 étoiles par niveau** selon le score : on revient chercher la 3e.
- **Coups restants transformés en fusées** à la fin du niveau : feu d'artifice gratuit, grand
  plaisir et gros score (emprunt direct, très efficace).
- **Mode Rush (60 secondes)** : pas de limite de coups, le chrono, des parades qui ajoutent des
  secondes, une vitesse de chute qui augmente. C'est exactement « la même chose qui recommence,
  de plus en plus vite ». Record personnel affiché.
- **Défi du jour** : même plateau pour tout le monde, généré à partir de la date.
- **Série de victoires** : 3 niveaux gagnés d'affilée et le niveau suivant commence avec un bonus déjà posé.
- **Coffre** tous les 10 niveaux : nouvel animal ou nouveau décor de tuiles (collection).
- **Pas de vies ni de paiement** : on peut toujours rejouer tout de suite. C'est un choix
  volontaire pour des enfants, l'envie vient du jeu lui-même.

## 5. Les « mondes » (des centaines de niveaux, pas à la main)

Les niveaux sont **générés** à partir de quelques paramètres : taille et forme du plateau, nombre
d'espèces (moins d'espèces = plus facile), objectif, obstacles, coups. On en écrit quelques-uns à
la main pour les moments clés, le reste est produit et vérifié automatiquement : une IA joue
chaque niveau des centaines de fois pour vérifier qu'il est gagnable et régler sa difficulté.

| Monde | Nouveauté | Plateaux |
|---|---|---|
| 1. Le Bassin | aligner 3, tourner | carrés, 4 espèces |
| 2. La Parade | direction, parades, fusées | |
| 3. Le Grand Tourbillon | plateau qui tourne, gravité qui change | |
| 4. Les Glaces | glace, bulles | |
| 5. Le Palais des miroirs | miroirs, bisous | |
| 6. Les Triangles | tuiles **triangulaires** : on tourne par tiers de tour, alignements en 3 directions | |
| 7. Les Octogones | rosaces de 8 : on tourne par huitièmes | |

Les mondes 6 et 7 réutilisent l'idée de la v1 (triangle, octogone) sous une forme de jeu.

## 6. Les mathématiques, invisibles

Elles ne sont plus dites, mais **pratiquées des milliers de fois** : quart de tour (×i), demi-tour
(−1), sens inverse (−i), annulation de deux opposés (le « bisou » : +1 et −1), symétrie (miroir),
rotation de tout le repère (tourbillon), pas de 120° et de 45° (mondes 6 et 7).
Une fiche pour les enseignants pourra le documenter à part.

## 7. Plan de construction

1. **Prototype jouable « trouver le fun »** : grille 7×7, tourner 2×2, chute, cascades, parades,
   fusée, tourbillon, 10 niveaux + mode Rush. Tester avec des enfants : est-ce qu'ils disent
   « encore une » ?
2. **Moteur de niveaux** : générateur, joueur automatique, carte des niveaux, étoiles, sauvegarde.
3. **Obstacles et mondes** 4 à 7, défi du jour, coffres.
4. **Jus** : sons qui montent pendant les cascades, petites animations des animaux, vibrations
   sur mobile.

Technique : on garde HTML + JavaScript sans dépendance. Le rendu 3D de la v1 sert à l'animation de
rotation des tuiles et aux bascules. La grille, la chute et les cascades sont de la 2D classique.
