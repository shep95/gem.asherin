// Builds data/lexicon.txt — the offline word and name list used by the
// "spells" tab to find words hidden inside a word or phrase.
//
//   npm i --no-save wordlist-english human-names
//   node tools/build-lexicon.mjs
//
// Sources (both permissively licensed, notices in data/LICENSE-lexicon.txt):
//   - SCOWL via wordlist-english, sizes 10-35 (common English words)
//   - human-names (English male and female first names)
// Output format, one entry per line:  word|tier
//   tier 1 = very common word, 2 = common word, n = name, p = proper noun
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(process.env.LEXICON_MODULES ? path.join(process.env.LEXICON_MODULES, 'x.js') : import.meta.url);
const wl = (size) => req(`wordlist-english/english-words-${size}.json`);
const names = (sex) => req(`human-names/data/${sex}-human-names-en.json`);

// Ethnic and other slurs are excluded so they never appear as "hidden" words.
const BLOCK = new Set(['nigger', 'nigga', 'niggas', 'niggers', 'faggot', 'faggots', 'fag', 'fags', 'kike', 'kikes', 'spic', 'spics', 'chink', 'chinks', 'gook', 'gooks', 'wetback', 'wetbacks', 'retard', 'retards', 'tranny', 'dyke', 'dykes', 'coon', 'coons', 'darkie', 'darky', 'paki', 'pakis', 'raghead', 'towelhead', 'kraut', 'krauts', 'jap', 'japs', 'wop', 'wops', 'dago', 'dagos', 'spastic', 'gyp', 'gypped', 'gypsy']);

const out = new Map(); // word -> tier
const put = (w, tier) => {
  if (!/^[a-z]{1,20}$/.test(w) || BLOCK.has(w)) return;
  const prev = out.get(w);
  const rank = { 1: 0, 2: 1, n: 2, p: 3 };
  if (!prev || rank[tier] < rank[prev]) out.set(w, tier);
};

for (const size of [10, 20]) for (const w of wl(size)) {
  if (/^[a-z]+$/.test(w)) put(w, '1');
  else if (/^[A-Z][a-z]+$/.test(w)) put(w.toLowerCase(), 'p');
}
for (const w of wl(35)) {
  if (/^[a-z]+$/.test(w)) put(w, '2');
  else if (/^[A-Z][a-z]+$/.test(w)) put(w.toLowerCase(), 'p');
}
for (const sex of ['male', 'female']) for (const n of names(sex)) {
  const w = n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/^[a-z]{2,15}$/.test(w) && !out.has(w)) put(w, 'n');
}

const lines = [...out.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([w, t]) => `${w}|${t}`);
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/lexicon.txt'), lines.join('\n') + '\n');
const counts = lines.reduce((m, l) => { const t = l.split('|')[1]; m[t] = (m[t] || 0) + 1; return m; }, {});
console.log(`data/lexicon.txt: ${lines.length} entries`, counts);

const scowl = fs.readFileSync(req.resolve('wordlist-english/Copyright'), 'utf8');
const hn = fs.readFileSync(path.join(path.dirname(req.resolve('human-names/package.json')), 'LICENSE'), 'utf8');
fs.writeFileSync(path.join(root, 'data/LICENSE-lexicon.txt'), `data/lexicon.txt is compiled from the following sources.\n\n== SCOWL (Spell Checker Oriented Word Lists), via the wordlist-english package ==\n\n${scowl}\n\n== human-names ==\n\n${hn}\n`);
