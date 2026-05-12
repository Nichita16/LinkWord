const fs = require('fs');
let src = fs.readFileSync('data-core.js', 'utf8');

// Extract concepts object
const conceptsMatch = src.match(/concepts:\s*\{/);
const startIdx = src.indexOf('{', conceptsMatch.index);
let depth = 0, endIdx = -1;
for (let i = startIdx; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
}
const conceptsStr = src.substring(startIdx, endIdx + 1);
eval('var concepts = ' + conceptsStr);

let fixed = 0;
for (const [word, data] of Object.entries(concepts)) {
  for (const conn of data.c) {
    if (concepts[conn] && !concepts[conn].c.includes(word)) {
      concepts[conn].c.push(word);
      fixed++;
    }
  }
}

// Sort connections alphabetically for consistency
for (const data of Object.values(concepts)) {
  data.c.sort();
}

// Rebuild concepts string
const lines = [];
const sortedWords = Object.keys(concepts).sort();
for (const w of sortedWords) {
  const d = concepts[w];
  const conns = d.c.map(c => `"${c}"`).join(',');
  lines.push(`    "${w}": { c: [${conns}], g: "${d.g}" }`);
}
const newConceptsStr = '{\n' + lines.join(',\n') + '\n  }';

src = src.substring(0, startIdx) + newConceptsStr + src.substring(endIdx + 1);
fs.writeFileSync('data-core.js', src);

// Verify
let totalConns = 0, unidirectional = 0;
for (const [w, data] of Object.entries(concepts)) {
  for (const conn of data.c) {
    totalConns++;
    if (concepts[conn] && !concepts[conn].c.includes(w)) unidirectional++;
  }
}
console.log('Fixed', fixed, 'unidirectional links');
console.log('Total connections:', totalConns);
console.log('Remaining unidirectional:', unidirectional);
console.log('Concepts:', sortedWords.length);
