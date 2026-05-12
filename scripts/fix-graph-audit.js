const fs = require('fs');
let src = fs.readFileSync('data-core.js', 'utf8');
const m = src.match(/concepts:\s*\{/);
const startIdx = src.indexOf('{', m.index);
let depth = 0, endIdx = -1;
for (let i = startIdx; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
}
eval('var concepts = ' + src.substring(startIdx, endIdx + 1));

// 1. Remove self-references
let selfFixed = 0;
for (const [w, data] of Object.entries(concepts)) {
  const idx = data.c.indexOf(w);
  if (idx !== -1) { data.c.splice(idx, 1); selfFixed++; }
}

// 2. Add connections to low-connectivity words
const additions = {
  "abacus": ["bead","count","math","old","scholar","merchant"],
  "accordion": ["air","fold","play","squeeze","song"],
  "aversion": ["disgust","hate","push","turn"],
  "banjo": ["music","play","song","pluck","dance"],
  "burlap": ["cloth","coarse","rough","sack","bag","grain"],
  "butcher": ["blood","cook","cut","farm","bone","cleave"],
  "cashmere": ["coat","cold","mountain","silk","soft","warm"],
  "catalyst": ["change","fast","start","transform","ignite"],
  "conundrum": ["maze","mystery","puzzle","solve","think"],
  "craving": ["desire","food","hunger","sweet","taste","thirst"],
  "cruciform": ["cross","holy","pattern","sacred","symbol","shape"],
  "curtain": ["cloth","dark","hide","red","stage","theater"],
  "denim": ["cloth","jacket","strong","tough","wear","work"],
  "dice": ["bone","cube","game","ivory","roll","table"],
  "donkey": ["carry","heavy","mule","stubborn","village","hill"],
  "earlobe": ["hang","jewel","soft","small","pierce"],
  "emerald": ["gem","jewel","precious","sparkle","stone","treasure"],
  "enamel": ["glass","hard","shine","smooth","tooth","white"],
  "encore": ["applaud","cheer","end","more","play","repeat","stage"],
  "epoch": ["age","ancient","era","history","long","old"],
  "fetch": {"add":["bring","carry","come","fast","find","get","throw"]},
  "fingertip": ["feel","finger","skin","soft","small","tap"],
  "folly": ["castle","fool","mistake","tower","trick","ruin"],
  "healer": ["cure","doctor","hand","heal","medicine","plant","potion"],
  "hesitation": ["doubt","pause","slow","wait","cold"],
  "instinct": ["animal","feel","gut","nature","sense","wild"],
  "jubilation": ["cheer","feast","gold","laugh","light","sing","triumph"],
  "kangaroo": ["australia","baby","bounce","hop","kick","pouch","run"],
  "lacquer": ["black","coat","hard","paint","polish","red","shine","smooth"],
  "legion": ["army","battle","march","rome","shield","soldier","sword"],
  "lobe": ["lung","round","soft","head"],
  "navel": ["center","core","middle","round","skin"],
  "nexus": ["center","connect","core","gate","join","link","web"],
  "nostril": ["air","smell","cold","flare","inhale"],
  "opus": ["compose","create","great","masterpiece","number","work"],
  "pliers": ["bend","grip","metal","pull","squeeze","tool","twist","wire"],
  "plight": ["danger","despair","grief","poor","sorrow","trouble","woe"],
  "pulley": ["chain","crane","gear","hoist","lift","pull","weight"],
  "pulsar": ["bright","fast","glow","night","pulse","sky","spin","star"],
  "rhino": ["africa","armor","charge","heavy","large","strong","thick","tough"],
  "satin": ["cloth","dress","glow","glossy","red","shine","smooth","soft"],
  "scissors": ["blade","cloth","craft","cut","sharp","steel","thread"],
  "sieve": ["drain","grain","hole","mesh","pour","separate","small"],
  "spy": ["dark","eye","hide","mask","night","secret","silent","watch"],
  "threshold": ["begin","cross","edge","enter","gate","pass","start","step"],
  "thrill": {"add":["dance","fast","joy","jump","peak","rush","spark","wild"]},
  "thumb": ["fist","grab","grip","hold","nail","press","touch"],
  "tripod": ["camera","leg","stand","stable","support","three","wood"],
  "tweed": ["cloth","coat","cold","jacket","rough","warm","winter"],
  "vertebra": ["back","curve","disk","neck","skeleton","spine"],
  "weasel": {"add":["burrow","fast","quick","red","sly","small","thin","tunnel"]}
};

let addedConns = 0;
for (const [word, conns] of Object.entries(additions)) {
  if (!concepts[word]) continue;
  const toAdd = Array.isArray(conns) ? conns : conns.add;
  for (const c of toAdd) {
    if (concepts[c] && !concepts[word].c.includes(c)) {
      concepts[word].c.push(c);
      addedConns++;
    }
  }
}

// Make bidirectional
let bidiFixed = 0;
for (const [word, data] of Object.entries(concepts)) {
  for (const conn of data.c) {
    if (concepts[conn] && !concepts[conn].c.includes(word)) {
      concepts[conn].c.push(word);
      bidiFixed++;
    }
  }
}

// Sort and deduplicate
for (const data of Object.values(concepts)) {
  data.c = [...new Set(data.c)].sort();
}

// Rebuild
const lines = [];
const sortedWords = Object.keys(concepts).sort();
for (const w of sortedWords) {
  const d = concepts[w];
  lines.push(`    "${w}": { c: [${d.c.map(c => `"${c}"`).join(',')}], g: "${d.g}" }`);
}
src = src.substring(0, startIdx) + '{\n' + lines.join(',\n') + '\n  }' + src.substring(endIdx + 1);
fs.writeFileSync('data-core.js', src);

// Final stats
let totalConns = 0, unidir = 0, selfRefs = 0, danglingCount = 0;
let minC = Infinity, maxC = 0;
for (const [w, data] of Object.entries(concepts)) {
  if (data.c.length < minC) minC = data.c.length;
  if (data.c.length > maxC) maxC = data.c.length;
  for (const c of data.c) {
    totalConns++;
    if (c === w) selfRefs++;
    if (!concepts[c]) danglingCount++;
    else if (!concepts[c].c.includes(w)) unidir++;
  }
}

const lowConn = Object.entries(concepts).filter(([w,d]) => d.c.length < 3);

const visited = new Set();
const queue = [sortedWords[0]];
visited.add(sortedWords[0]);
while (queue.length) {
  const w = queue.shift();
  for (const c of concepts[w].c) {
    if (!visited.has(c)) { visited.add(c); queue.push(c); }
  }
}

console.log('Self-refs fixed:', selfFixed);
console.log('Connections added:', addedConns);
console.log('Bidi fixes:', bidiFixed);
console.log('\n=== FINAL AUDIT ===');
console.log('Concepts:', sortedWords.length);
console.log('Connections:', totalConns);
console.log('Avg:', (totalConns / sortedWords.length).toFixed(1));
console.log('Min connections:', minC);
console.log('Max connections:', maxC);
console.log('Self-references:', selfRefs);
console.log('Unidirectional:', unidir);
console.log('Dangling:', danglingCount);
console.log('Low-connectivity (<3):', lowConn.length, lowConn.map(([w,d]) => w+'('+d.c.length+')').join(', '));
console.log('Connected:', visited.size + '/' + sortedWords.length);
