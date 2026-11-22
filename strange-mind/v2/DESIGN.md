# Idées en réserve : Strange Mind « puzzle roulant »

> Mis de côté le 20/11/2026 pour y revenir plus tard. Direction retenue pour la v2 : voir `../DESIGN-V2.md` (modèle match-3).

> La v1 (version « cours ludifié ») est figée dans `v1/` : `http://localhost/edu-fpar/strange-mind/v1/`.
> Ce document décrit la v2 : un **vrai jeu de puzzle**, sans consignes ni leçons.

## 1. Le diagnostic de la v1

La v1 dit à l'enfant **quoi faire** (« tourne le dauphin vers le poisson »), et chaque étape
se résout en 1 à 3 gestes. C'est un exercice, pas un jeu. Un jeu addictif, au contraire :

- donne un **but visible** mais laisse le **chemin** au joueur ;
- a une règle simple dont les **conséquences surprennent** (« ah, mais alors si je… ») ;
- punit peu et laisse **recommencer vite** (annuler, réessayer) ;
- récompense la **maîtrise** (faire mieux, faire plus court) et la **curiosité** (secrets) ;
- renouvelle le plaisir par **de nouvelles règles** qui se combinent aux anciennes.

## 2. L'idée centrale : les formes ROULENT

On garde ce qui est étrange et fort dans la v1 (une forme plate qui est un volume, avec un
dessin sur chaque face) mais on change le point de vue : **l'écran devient le sol, vu de dessus.**

- **Glisser** sur une forme = elle **roule d'une case** dans cette direction.
  Elle bascule réellement : la face visible change.
- **Tourner** = elle pivote sur place (sans changer de case).

La conséquence est immédiate et profonde : **l'orientation d'une forme est la mémoire de son chemin.**
Aller à droite puis en haut n'amène pas la même face qu'aller en haut puis à droite.
Arriver au bon endroit ne suffit pas, il faut y arriver *de la bonne façon*.
C'est la source de tous les puzzles, et l'enfant le sent avec ses doigts sans qu'on lui explique.

Le moteur de la v1 fait déjà presque tout cela (basculement 3D, faces, gestes). Il manque la
grille et la translation pendant la bascule.

## 3. La boucle de jeu

```
voir le plateau  →  repérer les maisons  →  rouler, essayer, se tromper, annuler
      ↑                                                   ↓
 nouveau plateau  ←  ★★★ / secret trouvé  ←  toutes les créatures sont chez elles
```

- **But unique, visible, sans texte** : chaque créature a une **maison** sur le plateau (sa
  silhouette dessinée au sol). Une maison est satisfaite quand la forme est dessus **avec la bonne
  face en l'air**, et parfois **dans le bon sens** (silhouette orientée).
- **Annuler illimité** (bouton ↶) et **recommencer** en un geste. On n'est jamais bloqué, donc on ose.
- **3 étoiles** : ★ réussi · ★★ en moins de N coups (le « par ») · ★★★ secret trouvé
  (une face cachée à faire apparaître, un poisson doré à ramasser…).
- Les plateaux sont **courts** (30 s à 3 min). C'est le rythme qui crée le « encore un ! ».

## 4. Les personnalités des formes

Chaque forme a une manière de bouger, donc une manière de penser.

| Forme | Comment elle bouge | Sensation |
|---|---|---|
| **Cube** | roule dans 4 directions sur une grille carrée | le classique, prévisible |
| **Pyramide** | culbute sur une grille de triangles, en 3 directions, la pointe s'inverse à chaque saut | déroutante, on la « dompte » |
| **Octogone** | ne roule pas : c'est un **plateau tournant**. Le tourner fait tourner tout ce qui est posé sur son anneau | un levier qui déplace plusieurs choses à la fois |

Plus tard : la **bille** (sphère, roule tant que rien ne l'arrête) et le **domino** (prisme long, roule en 2 temps).

## 5. Le sol et les pouvoirs des faces

Ce qui rend la combinatoire riche : **la face du dessus donne un pouvoir.** Gérer l'orientation,
c'est gérer ses pouvoirs.

| Face en l'air | Pouvoir |
|---|---|
| 🐬 Dauphin | peut entrer dans l'**eau** |
| 🐰 Lapin | **saute** par-dessus un trou ou une forme |
| ☁️ Nuage | **fantôme** : passe à travers les barrières, mais n'active rien |
| 🪞 Miroir | **renvoie** les rayons de lumière |
| ➡️ Flèche | **pousse** la forme voisine dans sa direction |
| 🌀 Tourbillon | **échange** sa place avec la forme visée |

| Case du sol | Effet |
|---|---|
| Eau | interdite, sauf face dauphin |
| Glace | on glisse jusqu'à l'obstacle **sans rouler** (la face ne change pas !) |
| Tapis tournant ↺ | fait pivoter d'un quart de tour la forme qui s'arrête dessus |
| Tampon | **peint** sa couleur sur la face du dessous de la forme |
| Interrupteur | ouvre ou ferme des barrières tant qu'une forme est dessus |
| Brouillard | cache les faces : il faut **se souvenir** de ce qu'il y a dessous |

Chaque élément est simple. C'est leur **combinaison** qui fait les bons puzzles : glisser sur la
glace pour *ne pas* changer de face, ou se faire pousser par une flèche pour rouler sans y toucher.

## 6. Les mondes

Une carte façon île à explorer, avec des chemins qui se séparent pour ne jamais bloquer un enfant.
Une nouvelle règle par monde, montrée par un **premier plateau sans texte** où on ne peut pas
échouer (on apprend en voyant).

1. **Le Jardin** : rouler, maisons, faces. *(cube)*
2. **Le Lagon** : eau, dauphin, glace.
3. **Les Manèges** : octogones-plateaux tournants, tapis tournants.
4. **Le Phare** : rayons de lumière, miroirs (deux miroirs = un virage complet), fleurs à éclairer.
5. **Le Désert** : pyramides sur grille triangulaire.
6. **Les Jumeaux** : deux formes liées. Quand l'une roule, sa jumelle roule **en miroir** (ou
   tournée d'un quart de tour). On pilote deux formes avec un seul geste.
7. **La Tour à l'envers** : brouillard et mémoire, plus tous les mécanismes réunis.

Environ 12 plateaux par monde, plus un **plateau-boss** plus grand qui mélange tout.

## 7. Ce qui fait revenir

- **Le carnet de créatures** : chaque secret (★★★) débloque une créature à coller dans un carnet,
  et on peut ensuite la mettre sur ses formes (déco). Collectionner plaît beaucoup à cet âge.
- **Le défi du jour** : un plateau généré automatiquement chaque jour, le même pour tout le monde.
  Idéal en classe (« qui l'a fait en moins de coups ? »).
- **L'atelier** : un éditeur de plateaux dans le jeu. Un plateau se partage par un **code court**
  ou un QR code. Les enfants (et tes collègues) créent des niveaux pour les autres. C'est le plus
  puissant moteur de motivation à long terme, et ça répond à ton objectif de départ de « créer des
  niveaux ».
- **Du jus** : petits écrasements à chaque roulade, créatures qui réagissent (le dauphin saute de
  joie dans l'eau, le lapin a peur du vide), sons qui montent quand on approche du but.

## 8. Sans texte, pour tout public

- Aucune phrase à lire : silhouettes, icônes, animations d'exemple.
- Cible : **dès 5-6 ans pour les premiers mondes**, et assez profond à la fin pour que les adultes
  bloquent aussi. C'est le signe d'un bon jeu de puzzle.
- Le bouton 🎓 disparaît du jeu. Les notions mathématiques restent cachées dans les règles
  (chemin qui compte = non-commutativité, deux miroirs = rotation, jumeaux = transformation
  linéaire, plateau tournant = opérateur…). On peut les documenter à part pour les enseignants.

## 9. Ce qu'il faut construire (technique)

1. **Plateau en grille** + roulade animée (bascule + translation). On garde le moteur de la v1.
2. **Format de niveau en texte**, très rapide à écrire :
   ```
   . . ~ ~ .
   . C ~ H .      C = cube, H = maison, ~ = eau, # = mur, * = glace
   . . . # .
   ```
3. **Annuler / recommencer** (pile d'états).
4. **Solveur automatique** (recherche en largeur, déjà testée sur la v1) : il vérifie que chaque
   plateau est faisable et calcule le « par » des ★★. Il servira aussi à **générer** le défi du jour.
5. Carte des mondes, étoiles, carnet, sauvegarde locale.
6. Éditeur et partage par code (dans un second temps).

## 10. Plan proposé

- **Étape 1 : trouver le fun (prototype jouable).** Grille, cube qui roule, maisons, eau, glace,
  annuler, étoiles, et une dizaine de plateaux du monde 1-2. On teste avec des enfants : est-ce
  qu'ils redemandent ? C'est la seule vraie question.
- **Étape 2 : les autres formes et pouvoirs** (pyramide, plateaux tournants, miroirs, jumeaux).
- **Étape 3 : ce qui fait revenir** (carnet, défi du jour, éditeur).
