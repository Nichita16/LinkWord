const fs = require('fs');
let src = fs.readFileSync('i18n-strings.js','utf8');

const newKeys = JSON.parse(fs.readFileSync('scripts/new-keys.json','utf8'));
const langs = ['en','es','it','fr','de','pt','ru','ro','uk','tr','pl','nl','ja','ko','zh','ar','hi','id','th','vi'];

for (const lang of langs) {
  const searchStr = lang + ': {';
  const idx = src.indexOf(searchStr);
  if (idx === -1) { console.log('NOT FOUND:', lang); continue; }

  let depth = 0;
  let closeIdx = -1;
  for (let i = idx + searchStr.length; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      if (depth === 0) { closeIdx = i; break; }
      depth--;
    }
  }
  if (closeIdx === -1) { console.log('NO CLOSE:', lang); continue; }

  const additions = [];
  for (const [key, translations] of Object.entries(newKeys)) {
    const val = (translations[lang] || translations.en).replace(/"/g, '\\"');
    additions.push(` ${key}:"${val}"`);
  }

  src = src.substring(0, closeIdx) + ',' + additions.join(',') + src.substring(closeIdx);
}

fs.writeFileSync('i18n-strings.js', src);

// Verify
let verify = fs.readFileSync('i18n-strings.js','utf8');
verify = verify.replace('window.EXTRA_STRINGS_ALL','globalThis.EXTRA_STRINGS_ALL');
eval(verify);
const s = globalThis.EXTRA_STRINGS_ALL;
console.log('Total EN keys:', Object.keys(s.en).length);
const newKeyNames = Object.keys(newKeys);
const missing = newKeyNames.filter(k => !s.en[k]);
console.log('Missing:', missing.length, missing);
console.log('Sample - dailyPath EN:', s.en.dailyPath);
console.log('Sample - freeWeave IT:', s.it.freeWeave);
console.log('Sample - nudge AR:', s.ar.nudge);
console.log('Sample - weeklyTrial JA:', s.ja.weeklyTrial);
