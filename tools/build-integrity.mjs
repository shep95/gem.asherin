// Writes integrity.json: SHA-256 of every shipped script, stylesheet and page.
// The app verifies these hashes at runtime and warns when a served file differs
// from the published build (tampered mirror, injecting proxy, stale cache mix).
// Run after any change to the listed files: npm run integrity
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'index.html', 'offline.html', 'sw.js', 'manifest.webmanifest', 'css/uriel.css', 'css/fonts.css',
  'js/guard.js', 'js/app.mjs', 'js/config.mjs', 'js/ciphers.mjs', 'js/sanitize.mjs', 'js/storage.mjs', 'js/ai.mjs', 'js/sources.mjs', 'js/theme.mjs', 'js/music.mjs', 'js/structure.mjs', 'js/structure-ui.mjs', 'js/spells.mjs', 'js/spells-ui.mjs', 'data/lexicon.txt',
  'js/data/index.mjs', 'js/data/corpus.mjs', 'js/data/corpus-base.mjs', 'js/data/corpus-extra.mjs', 'js/data/knowledge.mjs', 'js/data/readings.mjs', 'js/data/meanings.mjs', 'js/data/cipher-notes.mjs',
];
export function computeIntegrity() {
  const files = {};
  for (const f of FILES) files[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
  return { generated: new Date().toISOString().slice(0, 10), algorithm: 'sha256', files };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const man = computeIntegrity();
  fs.writeFileSync(path.join(root, 'integrity.json'), JSON.stringify(man, null, 2) + '\n');
  console.log(`integrity.json written for ${Object.keys(man.files).length} files`);
}
