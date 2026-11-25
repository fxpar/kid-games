# Strange Mind · Le vent invisible (prototype)

**9 mini-jeux pour préparer, dès 6 ans, à la compréhension des équations de Maxwell écrites dans l'algèbre
géométrique de Hestenes, sans jamais écrire une formule.**

Le pari : dans l'algèbre de Hestenes, les quatre équations de Maxwell n'en font qu'une,

> **∇F = J** dans l'algèbre de l'espace-temps, ou **(∂ₜ + ∇) F = ρ − j** dans celle de l'espace,
> avec F = E + I B (champ électromagnétique), ρ les charges et j les courants (unités où c = 1)

et cette équation dit une seule chose : **la « loupe » ∇ appliquée au champ révèle ce qui le fabrique.**
Comme le produit de deux flèches (`ab = a·b + a∧b`, jeu 9 des défis éclair : « flèche × flèche = lapin + tourbillon »),
le produit de ∇ par un champ se coupe en deux morceaux :

- **ce qui SORT** d'un endroit (∇·, un nombre : fontaine +, trou −) ;
- **ce qui TOURNE** sur place (∇∧, un bivecteur : tourbillon ↺ ou ↻).

Un enfant qui a *joué* avec « ce qui sort » et « ce qui tourne », avec des vents qui naissent des fontaines, tournent
autour des fils et apparaissent quand un aimant bouge, a déjà toutes les images dont il aura besoin. Le « champ »
s'appelle ici **le vent** : on le voit par des flèches et par des graines qu'il emporte.

## Les 9 mini-jeux (accès direct : `maxwell/#1` à `#9`)

| # | Mini-jeu | Faire | Prévoir | Idée de Maxwell / Hestenes |
|---|---|---|---|---|
| 1 | Flèche puis flèche 🟪 | tourner la flèche 2 pour que le tapis tourne comme le modèle (niv. 4 : le plus GRAND) | la coccinelle suit 1 puis 2 : le tapis tourne ↺, ↻ ou est tout plat ? | produit extérieur a∧b, bivecteur orienté, a∧b = −b∧a, aire maximale à angle droit |
| 2 | La feuille dans le vent 🍃 | lâcher la feuille pour qu'elle arrive au panier (beaucoup de bonnes réponses) | dans quel panier tombera-t-elle ? | un champ = une flèche en chaque point ; lignes de champ |
| 3 | La fontaine cachée ⛲ | trouver TOUTES les fontaines (ou tous les trous) sous les nuages | que cache ce nuage : fontaine, trou ou rien ? | divergence, charges : ∇·E = ρ (Gauss) |
| 4 | Le petit moulinet 🎡 | toucher TOUS les moulinets qui vont tourner (comme le modèle) | le moulinet tourne ↺, ↻ ou pas ? | rotationnel ∇∧ ; une rivière plus rapide au milieu fait tourner ; **autour** d'un tourbillon, le vent fait le tour… mais le moulinet ne tourne pas |
| 5 | Le tour du lac ⛵ | toucher TOUS les lacs où le vent fait faire le tour au bateau | le bateau fait-il le tour ? dans quel sens ? | circulation = somme des tourbillons à l'intérieur (Stokes) ; un vent uniforme pousse d'un côté et freine de l'autre |
| 6 | Le fil et les boussoles 🧭 | toucher les fils (courant vers toi • / vers le sol × / éteint) pour que les boussoles imitent les fantômes | où pointeront les boussoles ? | un courant fait tourner le champ magnétique autour de lui (Ampère, Œrsted) ; les vents s'additionnent |
| 7 | Le vent qui ne sort de nulle part 🧲 | trouver TOUS les vents d'aimant parmi 4 cartes | vent de fontaine ⛲ ou vent d'aimant 🧲 ? | ∇·B = 0 : le champ magnétique n'a pas de fontaine (pièges : vent uniforme, paire de tourbillons qui ressemble à un dipôle) |
| 8 | L'aimant et l'anneau 💡 | approcher, éloigner ou retourner l'aimant pour que le courant tourne comme le modèle | la lampe s'allume-t-elle ? dans quel sens tourne le courant ? | Faraday ∇×E = −∂ₜB : c'est le **changement** qui fait tourner, pas l'aimant ; loi de Lenz ; seul le mouvement relatif compte (niv. 4 : c'est l'anneau qui bouge) |
| 9 | La loupe magique 🔍 | régler ⛲ et 🌀 pour fabriquer le même vent que le vent violet | que voit la loupe : [lapin/nuage] + [tourbillon/nuage] ? | **∇F = J** : la loupe lit d'un coup « ce qui sort + ce qui tourne », comme flèche × flèche = nombre + bivecteur |

Chaque mini-jeu a **4 niveaux** (par exemple pour le moulinet : tourbillon ou vent uniforme ; puis fontaines ;
puis rivières ; puis le moulinet *à côté* d'un tourbillon, qui ne tourne pas).

## Le chemin vers ∇F = J

```
 1 flèche ∧ flèche = tapis orienté ─┐
 2 un vent = une flèche partout ────┼─► 3 ce qui SORT (∇·)  ──► 7 l'aimant n'a pas de fontaine (∇·B = 0)
                                    │
                                    └─► 4 ce qui TOURNE (∇∧) ─► 5 le tour du lac (Stokes)
                                                             ─► 6 le courant fait tourner (Ampère : ∇×B = j)
                                                             ─► 8 le changement fait tourner (Faraday : ∇×E = −∂ₜB)
                                         3 + 4 ──────────────► 9 la loupe : sort + tourne = ce qui fabrique (∇F = J)
```

Choix de conception, dans l'esprit des autres versions :

- **chercher, pas obéir** : la moitié « faire » est souvent une recherche ouverte avec plusieurs bonnes réponses
  (toutes les fontaines, tous les moulinets, tous les lacs, n'importe quel point de départ de la feuille) ;
- **la bonne réponse EST la notion** : on ne peut pas trouver le moulinet qui tourne sans regarder si le vent
  change d'un côté à l'autre, ni le lac sans sentir que seul compte ce qui est à l'intérieur ;
- **les pièges sont les vrais contresens** du sujet : « le vent fait le tour, donc le moulinet tourne » (faux hors
  du fil), « un vent uniforme fait avancer le bateau » (pas sur un tour complet), « l'aimant allume la lampe » (seulement s'il bouge) ;
- **mêmes images que les défis éclair** : lapin debout / tête en bas / nuage pour +1, −1, 0 ; ↺ rose et ↻ bleu pour les deux sens de rotation ;
- **prévoir puis voir** : après la réponse, l'animation montre (le moulinet tourne, le lac se colore là où le vent
  pousse ↺ en rose et ↻ en bleu, les choses cachées apparaissent).

Volontairement laissés pour une suite : la 3D (B comme bivecteur de l'espace, le pseudoscalaire I), le temps comme
4ᵉ direction (algèbre de l'espace-temps, ∇ = γ^μ ∂_μ) et les ondes (un vent qui se fabrique lui-même : E qui change
fait tourner B, B qui change fait tourner E).

Suite : [les tiroirs magiques](../tiroirs/) montrent pourquoi une seule équation contient les quatre lois.

## Code

```
js/games.js   les 9 mini-jeux : chacun fabrique des défis à l'infini (gen(niveau, hasard, mode))
js/draw.js    les vents (fontaines, tourbillons, uniformes, rivières), divergence, rotationnel, circulation,
              graines emportées par le vent, moulinets, boussoles, fils, lacs, aimant et anneau, loupe
js/main.js    accueil, séances, séries, niveaux, Rush, défi du jour, sons, voix, sauvegarde (repris de la v4)
js/glyphs.js  dessins des animaux (repris de la v4)
```

Accès direct : `#3` (mini-jeu 3), `#rush`, `#daily`. Outil de test dans la console :
`strangeMind.show('moulinet', 4, 'prevoir')`.

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l'écran d'accueil, ou `?lang=en` dans l'adresse.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr). Voir [LICENSE](../../LICENSE).
