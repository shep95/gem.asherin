// Merged, de-duplicated corpus with fast lookup indexes.
import { CORPUS_BASE } from './corpus-base.mjs';
import { CORPUS_EXTRA } from './corpus-extra.mjs';
import { BUILTIN_CIPHERS, ds, lettersOnly } from '../ciphers.mjs';

export const DOMAIN_ORDER = Object.freeze(['biblical', 'hebrew', 'greek', 'angelic', 'occult', 'islamic', 'eastern', 'cosmos', 'virtue', 'society', 'numerical']);
export const DOMAIN_LABELS = Object.freeze({
  biblical: 'biblical', hebrew: 'hebrew / kabbalistic', greek: 'greek / classical', angelic: 'angelic',
  occult: 'hermetic / occult', islamic: 'islamic', eastern: 'eastern traditions', cosmos: 'cosmos / elements',
  virtue: 'virtues & states', society: 'society / culture', numerical: 'sacred numbers',
});

const ord = BUILTIN_CIPHERS.ordinal.fn;

function build() {
  const seen = new Map();
  for (const raw of [...CORPUS_BASE, ...CORPUS_EXTRA]) {
    const w = String(raw.w).replace(/_/g, ' ').trim().toLowerCase();
    if (!w) continue;
    const key = w + '|' + raw.d;
    if (seen.has(key)) continue;
    const o = ord(lettersOnly(w));
    seen.set(key, Object.freeze({ w, d: raw.d, n: raw.n, o, r: ds(o) }));
  }
  return Object.freeze([...seen.values()]);
}

export const CORPUS = build();

const byOrdinal = new Map();
const byReduced = new Map();
const byWord = new Map();
for (const item of CORPUS) {
  if (!byOrdinal.has(item.o)) byOrdinal.set(item.o, []);
  byOrdinal.get(item.o).push(item);
  if (!byReduced.has(item.r)) byReduced.set(item.r, []);
  byReduced.get(item.r).push(item);
  byWord.set(item.w, item);
}

export function findByOrdinal(value, exclude = '') {
  const x = String(exclude).toLowerCase();
  return (byOrdinal.get(value) || []).filter((i) => i.w !== x);
}
export function findByReduced(value, exclude = '') {
  const x = String(exclude).toLowerCase();
  return (byReduced.get(value) || []).filter((i) => i.w !== x);
}
export function findWord(w) { return byWord.get(String(w).toLowerCase()) || null; }
export function groupByDomain(items) {
  const g = {};
  for (const it of items) (g[it.d] ||= []).push(it);
  return g;
}
export const CORPUS_SIZE = CORPUS.length;
