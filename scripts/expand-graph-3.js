const fs = require('fs');
let src = fs.readFileSync('data-core.js', 'utf8');
const conceptsMatch = src.match(/concepts:\s*\{/);
const startIdx = src.indexOf('{', conceptsMatch.index);
let depth = 0, endIdx = -1;
for (let i = startIdx; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
}
eval('var concepts = ' + src.substring(startIdx, endIdx + 1));

const newConcepts = {
  "atlas": { c: ["book","earth","globe","map","mountain","shoulder","strong","titan","world"], g: "mythology" },
  "minotaur_maze": { c: ["bull","dark","horn","labyrinth","maze","minotaur","monster","stone","sword","thread"], g: "mythology" },
  "pyre": { c: ["ash","burn","dead","death","fire","flame","hot","smoke","wood"], g: "abstract" },
  "oath_sworn": { c: ["blood","bond","honor","knight","oath","promise","sacred","steel","sword","trust","vow","word"], g: "abstract" },
  "fallow": { c: ["brown","dry","earth","empty","farm","field","rest","soil","wait","winter"], g: "nature" },
  "heath_moor": { c: ["cold","fog","heather","moor","open","shrub","wide","wild","wind"], g: "nature" },
  "dew_morning": { c: ["cold","dew","drop","fresh","glass","grass","light","morning","soft","water","wet"], g: "nature" },
  "acacia": { c: ["africa","desert","dry","gold","savanna","shade","thorn","tree","warm","yellow"], g: "nature" },
  "cicely": { c: ["cook","flower","garden","green","herb","plant","seed","smell","sweet","white"], g: "food" },
  "beet": { c: ["blood","cook","dark","earth","garden","juice","purple","red","root","sweet"], g: "food" },
  "fig_fruit": { c: ["brown","fig","fruit","garden","jam","leaf","seed","soft","sweet","tree","warm"], g: "food" },
  "millet": { c: ["bird","cook","farm","field","grain","harvest","seed","small","yellow"], g: "food" },
  "elk_bull": { c: ["antler","bull","cold","elk","forest","horn","large","moose","mountain","strong"], g: "animals" },
  "finch_bird": { c: ["bird","bright","color","feather","finch","fly","seed","sing","small","song","tree","wing"], g: "animals" },
  "crane_bird": { c: ["bird","crane","dance","fly","grace","lake","leg","long","marsh","migrate","tall","wade","water","wing"], g: "animals" },
  "asp": { c: ["bite","cobra","death","desert","fang","poison","sand","snake","venom"], g: "animals" },
  "loach": { c: ["bottom","creek","fish","mud","river","small","swim","water"], g: "animals" },
  "grebe": { c: ["bird","dive","feather","fish","lake","nest","swim","water"], g: "animals" },
  "linnet": { c: ["bird","brown","bush","fly","nest","red","seed","sing","small","song","tree"], g: "animals" },
  "censer": { c: ["burn","church","gold","hang","holy","incense","monk","smoke","swing","temple"], g: "objects" },
  "crook": { c: ["bend","curve","hook","iron","shepherd","staff","steal","turn","walk","wood"], g: "objects" },
  "girdle": { c: ["belt","bind","cloth","hip","leather","strap","tie","waist","wrap"], g: "objects" },
  "reliquary": { c: ["bone","box","crystal","glass","gold","holy","jewel","sacred","saint","silver","treasure"], g: "objects" },
  "rampart_stone": { c: ["brick","castle","defend","gate","guard","high","rampart","siege","stone","tower","wall","war"], g: "places" },
  "cloister_quiet": { c: ["arch","calm","cloister","garden","monk","peace","pray","quiet","silence","stone","walk"], g: "places" },
  "whirlpool": { c: ["circle","current","dark","deep","down","ocean","pull","spin","swirl","water","wave"], g: "nature" },
  "plankton": { c: ["drift","glow","green","light","ocean","sea","small","swim","water","wave"], g: "animals" },
  "cochineal": { c: ["bug","color","crimson","dye","insect","pigment","red","small"], g: "animals" },
  "cuttlefish": { c: ["camouflage","change","color","ink","ocean","sea","squid","swim","tentacle","water"], g: "animals" },
  "nutcracker": { c: ["beak","bird","crack","eat","forest","mountain","nut","pine","seed","tree"], g: "animals" },
  "clasp": { c: ["bind","buckle","chain","close","grip","hand","hold","hook","lock","metal"], g: "objects" },
  "cruciform": { c: ["church","cross","holy","pattern","sacred","shape","stone","symbol"], g: "objects" },
  "awl": { c: ["craft","hole","leather","needle","pierce","point","sharp","small","stitch","tool"], g: "objects" },
  "trestle": { c: ["beam","bridge","build","cross","frame","stand","support","table","wood"], g: "objects" },
  "pilgrim": { c: ["church","faith","far","foot","holy","journey","path","pray","road","sacred","temple","travel","walk"], g: "professions" },
  "reeve": { c: ["count","farm","judge","law","lord","manage","village"], g: "professions" },
  "yeoman": { c: ["bow","farm","field","free","guard","honest","land","plow","strong"], g: "professions" },
  "warden": { c: ["castle","defend","forest","gate","guard","keep","key","law","prison","tower","wall","watch"], g: "professions" },
  "virtuoso": { c: ["fast","genius","master","music","piano","play","skill","solo","violin"], g: "music" },
  "tremolo": { c: ["fast","finger","flutter","guitar","music","note","quick","shake","string","tremble","violin"], g: "music" },
  "diminuendo": { c: ["calm","die","dim","fade","fall","music","quiet","silence","slow","soft"], g: "music" },
  "opal": { c: ["color","fire","gem","glow","iridescent","jewel","light","rainbow","shimmer","sparkle","stone","water","white"], g: "elements" },
  "beryl": { c: ["aqua","blue","crystal","gem","green","hard","jewel","light","mineral","pale","sparkle","stone"], g: "elements" },
  "tourmaline": { c: ["color","crystal","dark","gem","green","hard","jewel","mineral","pink","sparkle","stone"], g: "elements" },
  "perihelion_close": { c: ["close","fast","hot","near","orbit","planet","sun","warm"], g: "celestial" }
};

let newCount = 0;
for (const [word, data] of Object.entries(newConcepts)) {
  if (!concepts[word]) {
    concepts[word] = { c: data.c.slice(), g: data.g };
    newCount++;
  }
}

let bidiFixed = 0;
for (const [word, data] of Object.entries(concepts)) {
  for (const conn of data.c) {
    if (concepts[conn] && !concepts[conn].c.includes(word)) {
      concepts[conn].c.push(word);
      bidiFixed++;
    }
  }
}

let danglingRemoved = 0;
for (const [word, data] of Object.entries(concepts)) {
  const before = data.c.length;
  data.c = data.c.filter(conn => concepts[conn]);
  danglingRemoved += before - data.c.length;
}

for (const data of Object.values(concepts)) {
  data.c = [...new Set(data.c)].sort();
}

const lines = [];
const sortedWords = Object.keys(concepts).sort();
for (const w of sortedWords) {
  const d = concepts[w];
  lines.push(`    "${w}": { c: [${d.c.map(c => `"${c}"`).join(',')}], g: "${d.g}" }`);
}
src = src.substring(0, startIdx) + '{\n' + lines.join(',\n') + '\n  }' + src.substring(endIdx + 1);
fs.writeFileSync('data-core.js', src);

const visited = new Set();
const queue = [sortedWords[0]];
visited.add(sortedWords[0]);
while (queue.length) {
  const w = queue.shift();
  for (const c of concepts[w].c) {
    if (!visited.has(c)) { visited.add(c); queue.push(c); }
  }
}

const groups = {};
for (const d of Object.values(concepts)) groups[d.g] = (groups[d.g] || 0) + 1;
let totalConns = 0, unidir = 0;
for (const [w, d] of Object.entries(concepts)) {
  for (const c of d.c) { totalConns++; if (concepts[c] && !concepts[c].c.includes(w)) unidir++; }
}

console.log('Wave 3: +' + newCount + ' concepts');
console.log('Bidi fixes:', bidiFixed);
console.log('Dangling removed:', danglingRemoved);
console.log('\n=== FINAL STATS ===');
console.log('Concepts:', sortedWords.length);
console.log('Connections:', totalConns);
console.log('Avg conns:', (totalConns / sortedWords.length).toFixed(1));
console.log('Unidirectional:', unidir);
console.log('Connected:', visited.size + '/' + sortedWords.length);
console.log('Groups:', JSON.stringify(groups));
