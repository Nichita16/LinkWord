#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');

const LANGS = ['en','es','it','fr','de','pt','ru','ro','uk','tr','pl','nl','ja','ko','zh','ar','hi','id','th','vi'];

function hash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

// ══════════════════════════════════════════
//  STEP 1: Consolidate EXTRA_STRINGS
// ══════════════════════════════════════════
function consolidateExtraStrings() {
  console.log('[1/4] Consolidating EXTRA_STRINGS...');
  const gameJs = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

  const merged = {};
  LANGS.forEach(l => merged[l] = {});

  const pattern = /const EXTRA_STRINGS(?:_V\d+)?\s*=\s*\{([\s\S]*?)\n  \};/g;
  let match;
  while ((match = pattern.exec(gameJs)) !== null) {
    const block = '{' + match[1] + '}';
    try {
      const obj = eval('(' + block + ')');
      for (const [lang, strings] of Object.entries(obj)) {
        if (merged[lang]) Object.assign(merged[lang], strings);
      }
    } catch (e) {
      console.warn('  Could not parse block, skipping:', e.message);
    }
  }

  const totalKeys = Object.keys(merged.en || {}).length;
  console.log(`  Merged ${totalKeys} keys across ${LANGS.length} languages`);

  let output = '// LinkWords — Consolidated UI Strings (auto-generated)\nwindow.EXTRA_STRINGS_ALL = {\n';
  for (const lang of LANGS) {
    const entries = Object.entries(merged[lang])
      .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
      .join(', ');
    output += `  ${lang}: { ${entries} },\n`;
  }
  output += '};\n';

  const outPath = path.join(ROOT, 'i18n-strings.js');
  fs.writeFileSync(outPath, output);
  console.log(`  Written: i18n-strings.js (${(output.length / 1024).toFixed(1)} KB)`);
  return totalKeys;
}

// ══════════════════════════════════════════
//  STEP 2: Split data.js by language
// ══════════════════════════════════════════
function splitDataByLanguage() {
  console.log('[2/4] Splitting data.js by language...');

  const dataJs = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const dataMatch = dataJs.match(/window\.WORD_DATA\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!dataMatch) { console.error('  Could not parse data.js'); return; }

  let wordData;
  try { wordData = eval('(' + dataMatch[1] + ')'); } catch (e) {
    console.error('  Could not eval data.js:', e.message); return;
  }

  const concepts = wordData.concepts;
  const conceptKeys = Object.keys(concepts);
  console.log(`  Found ${conceptKeys.length} concepts`);

  let coreOutput = '// LinkWords — Core word data (connections + groups, no translations)\nwindow.WORD_DATA = {\n  concepts: {\n';
  for (const key of conceptKeys) {
    const c = concepts[key];
    coreOutput += `    ${JSON.stringify(key)}: { c: ${JSON.stringify(c.c)}, g: ${JSON.stringify(c.g)} },\n`;
  }
  coreOutput += '  }';
  if (wordData.strings) {
    coreOutput += ',\n  strings: ' + JSON.stringify(wordData.strings, null, 2).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
  }
  coreOutput += '\n};\n';

  fs.writeFileSync(path.join(ROOT, 'data-core.js'), coreOutput);
  console.log(`  Written: data-core.js (${(coreOutput.length / 1024).toFixed(1)} KB)`);

  const langDir = path.join(ROOT, 'lang');
  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir);

  for (const lang of LANGS) {
    let langOutput = `// LinkWords — Word translations: ${lang}\nwindow.WORD_TRANSLATIONS_${lang.toUpperCase()} = {\n`;
    for (const key of conceptKeys) {
      const word = concepts[key].t?.[lang] || concepts[key].t?.en || key.toUpperCase();
      langOutput += `  ${JSON.stringify(key)}: ${JSON.stringify(word)},\n`;
    }
    langOutput += '};\n';

    fs.writeFileSync(path.join(langDir, `data-${lang}.js`), langOutput);
  }
  console.log(`  Written: lang/data-{lang}.js for ${LANGS.length} languages`);
  return conceptKeys.length;
}

// ══════════════════════════════════════════
//  STEP 3: Generate hashed filenames
// ══════════════════════════════════════════
function generateHashedAssets() {
  console.log('[3/4] Generating content-hashed assets...');

  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  const manifest = {};
  const files = ['game.js', 'data-core.js', 'i18n-strings.js', 'lw-graph.js', 'lw-scoring.js', 'lw-i18n.js', 'lw-audio.js', 'lw-collection.js', 'auth.js', 'ads.js', 'style.css'];

  for (const file of files) {
    const srcPath = path.join(ROOT, file);
    if (!fs.existsSync(srcPath)) continue;
    const content = fs.readFileSync(srcPath);
    const h = hash(content);
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const hashed = `${base}.${h}${ext}`;
    fs.copyFileSync(srcPath, path.join(distDir, hashed));
    manifest[file] = hashed;
  }

  for (const lang of LANGS) {
    const srcPath = path.join(ROOT, 'lang', `data-${lang}.js`);
    if (!fs.existsSync(srcPath)) continue;
    const content = fs.readFileSync(srcPath);
    const h = hash(content);
    const hashed = `data-${lang}.${h}.js`;
    fs.copyFileSync(srcPath, path.join(distDir, hashed));
    manifest[`lang/data-${lang}.js`] = hashed;
  }

  fs.writeFileSync(path.join(ROOT, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`  Written: dist/ with ${Object.keys(manifest).length} hashed files`);
  console.log('  Written: asset-manifest.json');
  return manifest;
}

// ══════════════════════════════════════════
//  STEP 4: Update index.html with hashes
// ══════════════════════════════════════════
function updateIndexHtml(manifest) {
  console.log('[4/4] Generating dist/index.html with hashed references...');

  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  for (const [original, hashed] of Object.entries(manifest)) {
    if (original.startsWith('lang/')) continue;
    const escaped = original.replace('.', '\\.');
    const re = new RegExp(`(src|href)=["']/?${escaped}["']`, 'g');
    html = html.replace(re, `$1="/dist/${hashed}"`);
  }

  fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), html);
  console.log('  Written: dist/index.html');
}

// ══════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════
try {
  const i18nPath = path.join(ROOT, 'i18n-strings.js');
  if (fs.existsSync(i18nPath) && fs.statSync(i18nPath).size > 1000) {
    console.log('[1/4] i18n-strings.js already exists, skipping consolidation');
  } else {
    consolidateExtraStrings();
  }
  splitDataByLanguage();
  const manifest = generateHashedAssets();
  updateIndexHtml(manifest);
  console.log('\nBuild complete!');
} catch (e) {
  console.error('Build failed:', e);
  process.exit(1);
}
