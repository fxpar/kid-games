// Version anglaise de Strange Mind v1.
//  - export par défaut : dictionnaire { 'phrase française': 'English' } pour t() et translateDom()
//  - EN_LEVELS : textes des niveaux par identifiant (titre, notion pour les grands, étapes dans l'ordre)

export default {
  // ---- menu ----
  'Les formes cachent des secrets… et les animaux sont des nombres !': 'Shapes hide secrets… and animals are numbers!',
  '🧪 Bac à sable': '🧪 Sandbox',
  '🖐️ Comment jouer': '🖐️ How to play',
  '⚙️ Réglages (pour les grands)': '⚙️ Settings (for grown-ups)',
  '🔊 Lire les consignes à voix haute': '🔊 Read the instructions aloud',
  '🎵 Petits sons': '🎵 Little sounds',
  '☝️ Un seul doigt suffit pour basculer (écran tactile)': '☝️ One finger is enough to flip (touch screen)',
  '↕️ Inverser le sens du pavé tactile': '↕️ Reverse touchpad direction',

  // ---- barre du jeu (infobulles) ----
  'Menu': 'Menu',
  'Réécouter': 'Listen again',
  'Un indice': 'A hint',
  "Recommencer l'étape": 'Restart this step',
  'Pour les grands : la notion mathématique': 'For grown-ups: the maths idea',
  'Fermer': 'Close',
  'Tourner (sens inverse des aiguilles)': 'Turn (anticlockwise)',
  'Tourner (sens des aiguilles)': 'Turn (clockwise)',

  // ---- aide ----
  'Basculer la forme<br><small>(voir une autre face)</small>': 'Flip the shape<br><small>(see another side)</small>',
  'Tourner la face<br><small>(le dessin tourne)</small>': 'Turn the side<br><small>(the picture turns)</small>',
  '📱 Écran tactile': '📱 Touch screen',
  'glisser avec 2 doigts (ou 1)': 'swipe with 2 fingers (or 1)',
  'tourner 2 doigts comme une clé, ou ↺ ↻': 'twist 2 fingers like a key, or ↺ ↻',
  '💻 Pavé tactile': '💻 Touchpad',
  'défiler avec 2 doigts sur la forme': 'scroll with 2 fingers on the shape',
  'pincer, Maj + défiler, ou ↺ ↻': 'pinch, Shift + scroll, or ↺ ↻',
  '🖱️ Souris': '🖱️ Mouse',
  'cliquer-glisser': 'click and drag',
  'clic droit glissé, Maj + glisser, ou ↺ ↻': 'right-click drag, Shift + drag, or ↺ ↻',
  '⌨️ Clavier': '⌨️ Keyboard',
  'flèches': 'arrow keys',
  'Q (↺) et E (↻)': 'Q (↺) and E (↻)',
  'Les boutons 🎓 dans chaque niveau expliquent aux adultes la notion mathématique cachée.':
    'The 🎓 button in each level explains the hidden maths idea to grown-ups.',

  // ---- messages du jeu ----
  'Oups ! On recommence.': 'Oops! Let’s try again.',
  'Bravo !': 'Well done!',
  'Super !': 'Super!',
  'Génial !': 'Brilliant!',
  'Bien joué !': 'Nice one!',
  'Essaie de glisser ou de tourner les formes !': 'Try swiping or turning the shapes!',
  'Niveau réussi !': 'Level complete!',
  'Niveau suivant ▶': 'Next level ▶',
  '🏠 Menu': '🏠 Menu',
  '🎓 Pour les grands : {title}': '🎓 For grown-ups: {title}',
};

export const EN_LEVELS = {
  // ---------------------------------------------------------------- 1
  cube: {
    title: 'The magic square',
    concept: `<p><b>Idea:</b> a flat shape can be the shadow of a 3D object. The square is one face of a <b>cube</b> (6 faces).</p>
      <p>We discover the two basic gestures: <b>flipping</b> (swiping) and, later, <b>turning</b>. Each flip is a quarter-turn rotation about a horizontal or vertical axis.</p>
      <p><i>To say to the child:</i> “What we see is only one side of the thing.”</p>`,
    steps: [
      { say: 'This square hides a secret! Swipe on it with two fingers to make it turn. Find the frog 🐸', hint: 'Swipe twice the same way.', bravo: 'Well done! The square was a cube!' },
      { say: 'Now find the panda 🐼', hint: 'Swipe right or left.' },
      { say: 'And the bear 🐻? He’s hiding on top…', hint: 'Swipe down to see the top of the cube.' },
    ],
  },

  // ---------------------------------------------------------------- 2
  solids: {
    title: 'Triangle and octagon',
    concept: `<p>The triangle is a face of a <b>pyramid</b> (tetrahedron: 4 triangular faces). The octagon is a face of a <b>prism</b> (2 octagons + 8 squares = 10 faces).</p>
      <p>Each polygon has its own rotation “steps”: 120° for the triangle, 90° for the square, 45° for the octagon. These are the <b>roots of unity</b> we will meet again from level 8 onwards.</p>`,
    steps: [
      { say: 'The triangle is magic too! Find the octopus 🐙', hint: 'Swipe on the triangle.', bravo: 'The triangle was a pyramid!' },
      { say: 'And the octagon? Find the sun ☀️ hiding behind the moon.', hint: 'Swipe twice the same way.' },
      { say: 'Show the ladybird 🐞 and the strawberry 🍓 at the same time', hint: 'The strawberry is on one side of the octagon. Swipe gently.' },
    ],
  },

  // ---------------------------------------------------------------- 3
  turn: {
    title: 'The hungry dolphin',
    concept: `<p>Now we turn <b>in the plane</b> (↺ ↻ buttons or a two-finger twist). The dolphin can face 4 directions.</p>
      <p>If “right” is <b>1</b>, then “up” is <b>i</b>, “left” is <b>−1</b> and “down” is <b>−i</b>. A quarter turn ↺ is <b>multiplying by i</b>.</p>
      <p>The child doesn’t need the word: they build the mental picture “a number can be a direction”.</p>`,
    steps: [
      { say: 'The dolphin is hungry! Turn it towards the fish 🐟 (button ↺ or ↻, or twist with two fingers)', hint: 'Try the ↻ arrow.' },
      { say: 'Oh, the fish swam down!' },
      { say: 'Now it’s on the left!' },
      { say: 'And the last fish is at the top!', bravo: 'Yum! The dolphin knows all 4 directions.' },
    ],
  },

  // ---------------------------------------------------------------- 4
  isquare: {
    title: 'Two little turns',
    concept: `<p>A quarter turn = ×<b>i</b>. Two quarter turns the same way = a half turn = ×<b>(−1)</b>. So <b>i × i = −1</b>: the famous “impossible” number becomes an everyday gesture.</p>
      <p>Four quarter turns bring you back to the start: <b>i⁴ = 1</b>. The panel shows the history of positions (i, i², i³, i⁴).</p>`,
    steps: [
      { say: 'Turn the dolphin right round the other way in exactly 2 little turns.', hint: 'The same arrow twice!', bravo: 'Two little turns make a half turn!' },
      { say: 'Now do 4 little turns, always the same way. Where does the dolphin go?', hint: 'Always the same arrow, 4 times.', bravo: 'It’s back at the start! 4 little turns = nothing at all.' },
    ],
  },

  // ---------------------------------------------------------------- 5
  minusi: {
    title: 'The backwards turn',
    concept: `<p>Turning 3 times one way is the same as turning once the other way: <b>i³ = −i</b>, and <b>−i</b> is the <b>inverse</b> of i (i × (−i) = 1).</p>
      <p>A first meeting with the idea of an <b>inverse</b> and of <b>equivalent paths</b>: two different sequences of gestures give the same result.</p>`,
    steps: [
      { say: 'This dolphin can only turn one way ↺. Make it look down ⬇️', hint: 'It takes 3 little turns.', bravo: '3 turns one way…' },
      { say: '…or just 1 turn the other way! With ↻, make it look down in just 1 turn.', hint: 'Use the ↻ arrow.', bravo: 'Both paths end up in the same place!' },
    ],
  },

  // ---------------------------------------------------------------- 6
  bunnies: {
    title: 'Bunnies up, bunnies upside down',
    concept: `<p>The values <b>1, 0, −1</b> become animals: bunny standing up = <b>+1</b>, cloud = <b>0</b>, bunny upside down = <b>−1</b>.</p>
      <p>Key point: <b>−1 is not another animal, it’s the same one turned through a half turn</b>. This is exactly the geometric view of negative numbers (−1 = a 180° rotation) that prepares for i (a 90° rotation).</p>
      <p>Last step: 0 without any cloud → two opposites cancel out (1 + (−1) = 0).</p>`,
    steps: [
      { say: 'A bunny standing up is worth one, a cloud is worth zero. Bring the ladybird to the flag: you need 2!', hint: 'Swipe on the cubes to make bunnies appear.' },
      { say: 'An upside-down bunny is worth minus one! Make minus three.', hint: 'Turn the bunnies over with ↻.' },
      { say: 'Challenge: make zero… with no clouds at all!', hint: 'One bunny up and one bunny upside down… cancel out!', bravo: 'One up + one upside down = nothing at all!' },
    ],
  },

  // ---------------------------------------------------------------- 7
  multiply: {
    title: 'The turning machine',
    concept: `<p>The machine <b>multiplies</b> two directions: it <b>adds the angles</b>. This is multiplication of complex numbers of modulus 1: e<sup>iα</sup> × e<sup>iβ</sup> = e<sup>i(α+β)</sup>.</p>
      <p>Step 1: find the <b>inverse</b> (i × (−i) = 1). Step 2: two symmetric solutions of x² = −1 (i and −i). Step 3: solve (−i) × ? = i.</p>`,
    steps: [
      { say: 'The machine mixes the two dolphins. Dolphin A looks up. Turn B so the machine gives a dolphin facing right ➡️', hint: 'B must turn the other way: downwards.', bravo: 'Up and down cancel out!' },
      { say: 'Now A and B must look the same way, and the machine must show the dolphin facing left ⬅️', hint: 'Both up… or both down!' },
      { say: 'A looks down ⬇️. Find B so the machine shows the dolphin facing up ⬆️', hint: 'Put A facing down first.' },
    ],
  },

  // ---------------------------------------------------------------- 8
  roots: {
    title: 'The magic root',
    concept: `<p>The octagon turns in <b>eighths of a turn</b> (45°). The machine does “A × A”: it doubles the angle.</p>
      <p>Step 1: which dolphin, multiplied by itself, gives <b>i</b> (up)? Answer: 45° (or 225°): that is <b>√i</b>.</p>
      <p>Steps 2 and 3: x² = −1 has <b>two</b> solutions, i and −i. An equation can have more than one answer!</p>`,
    steps: [
      { say: 'The octagon turns in tiny steps. The machine multiplies the dolphin by itself. Make a dolphin come out facing up ⬆️', hint: 'Just one little step ↺ is enough!', bravo: 'Half a step, twice, makes a whole step!' },
      { say: 'Now the machine must show the dolphin facing left ⬅️' },
      { say: 'There’s another answer! Find another dolphin that also gives left ⬅️', hint: 'Try the dolphin facing the other way.', bravo: 'Two answers for just one question!' },
    ],
  },

  // ---------------------------------------------------------------- 9
  matrix: {
    title: 'The changing grid',
    concept: `<p>Four number cubes make a <b>2×2 matrix</b> [[a, b], [c, d]]. The matrix transforms the garden: the red arrow (→) goes to (a, c), the blue arrow (↑) goes to (b, d).</p>
      <p>We look for: the <b>identity</b> [[1,0],[0,1]], the <b>mirror</b> [[−1,0],[0,1]], the <b>quarter turn</b> [[0,−1],[1,0]] and the <b>half turn</b> [[−1,0],[0,−1]].</p>
      <p>A note for grown-ups: the quarter turn squared gives the half turn = −1: the matrix [[0,−1],[1,0]] <b>is</b> the number i.</p>`,
    steps: [
      { say: 'The garden has vanished! Each cube is a number. Bring the garden back like the dotted picture.', hint: 'One bunny standing up at the top left, one at the bottom right.', bravo: 'The garden is back!' },
      { say: 'Now show the garden in a mirror 🪞: the house must move to the other side.', hint: 'Turn over the bunny at the top left.' },
      { say: 'Make the garden do a quarter turn ↺', hint: 'The bunnies go into the other boxes. Look where the red and blue arrows go.' },
      { say: 'And now, turn the garden upside down!', hint: 'Two upside-down bunnies.', bravo: 'Upside down = two quarter turns!' },
    ],
  },

  // ---------------------------------------------------------------- 10
  det: {
    title: 'The vanishing garden',
    concept: `<p>The <b>determinant</b> ad − bc is the <b>size of the transformed garden</b>, with a sign: positive if the garden is “the right way round”, negative if it is seen in a mirror, zero if it is squashed into a line.</p>
      <p>The child discovers that you can squash the garden without everything being zero (a non-zero matrix with determinant 0), then double its size, then double it in a mirror.</p>`,
    steps: [
      { say: 'Squash the garden until it’s completely flat… but not with only clouds!', hint: 'Put four bunnies standing up!', bravo: 'Whoosh! The garden is all flat.' },
      { say: 'Now make a garden twice as big!', hint: 'Four bunnies, and only one upside down.' },
      { say: 'And a garden twice as big… in the mirror 🪞!', hint: 'Four bunnies: turn one or two over, and look at the badge.', bravo: 'The sign tells you if you’re in the mirror!' },
    ],
  },

  // ---------------------------------------------------------------- 11
  mirrors: {
    title: 'Two mirrors make a turn',
    concept: `<p>The heart of <b>Hestenes’ geometric algebra</b>: a <b>reflection</b> (mirror) is the basic operation. A mirror flips the dolphin over (belly up).</p>
      <p><b>Two mirrors in a row = a rotation</b>, through <b>twice</b> the angle between the mirrors. In geometric algebra, a unit vector <i>a</i> acts as a mirror (x ↦ −a x a) and the product <i>ba</i> is a <b>rotor</b> that turns by 2θ.</p>
      <p>That is also why octagons (45° steps) are enough to make quarter turns.</p>`,
    steps: [
      { say: 'The dolphin swims towards a magic mirror. Turn the mirror so its reflection looks up ⬆️', hint: 'Just one little step ↺ of the mirror.', bravo: 'It’s looking up… but it’s belly up!' },
      { say: 'A second mirror! Make the last dolphin look up ⬆️, the right way up.', hint: 'The two mirrors must be tilted a little bit from each other.', bravo: 'Two mirrors = one turn, and the dolphin is the right way up again!' },
      { say: 'With the two mirrors, make the dolphin swim to the left ⬅️', hint: 'Lay one mirror down and stand the other one up.', bravo: 'Crossed mirrors = a half turn!' },
    ],
  },

  // ---------------------------------------------------------------- 12
  bivector: {
    title: 'The secret whirl',
    concept: `<p>The <b>geometric product</b> of two arrows (vectors) ab = a·b (the “number” part) + a∧b (the “oriented plane” part, the <b>bivector</b>).</p>
      <p>Same direction → <b>+1</b> (bunny standing up); opposite directions → <b>−1</b> (upside down); perpendicular → a <b>whirl</b>: the oriented plane e₁e₂, which spins one way or the other.</p>
      <p>Order matters: <b>e₁e₂ = −e₂e₁</b>. And this whirl satisfies (e₁e₂)² = −1: it is Hestenes’ “i”, no longer mysterious but a <b>spinning piece of plane</b>.</p>`,
    steps: [
      { say: 'When you multiply two arrows, strange things happen! Make a standing bunny appear.', hint: 'Both arrows must point the same way.' },
      { say: 'Now make the whirl appear, spinning like this ↺', hint: 'The arrows must make a corner, like an L.', bravo: 'A whirl! Two arrows in a corner make a plane spin.' },
      { say: 'Point the pink arrow up ⬆️ and the green one right ➡️. Look at the whirl!', hint: 'Pink up, green right.', bravo: 'It spins the other way! The order of the arrows matters.' },
      { say: 'The pink arrow looks left ⬅️. Find the green one to make the whirl ↺ again', hint: 'Put the pink one on the left first.', bravo: 'You’ve tamed the secret whirl!' },
    ],
  },

  // ---- bac à sable ----
  sandbox: {
    title: 'Sandbox',
    concept: `<p>All the shapes, with no goal. Use it to try out the gestures and to dream up new levels (see <code>js/levels.js</code> and the README).</p>`,
    steps: [{ say: 'Play freely with the shapes!' }],
  },
};
