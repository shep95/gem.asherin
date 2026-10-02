// ── Hidden words and vowel order ──────────────────────────────────────────────
// Pure functions, no DOM. Finds the other words, names and statements that can
// be spelled from the letters of a word or phrase ("bible" → "lie"), and lists
// its vowels in order from first to last. The cipher engine is not touched;
// gematria values for hidden words come from the existing calcWord.

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** Lowercase latin letters only, accents folded. */
export function letters(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}

/** y counts as a vowel when it is not followed by a vowel (by, myth, mary), not when it starts a syllable (yes, beyond). */
function yIsVowel(word, i) {
  const next = word[i + 1];
  if (i === 0) return false;
  return !next || !VOWELS.has(next);
}

/**
 * Vowels of a word or phrase in order from first to last.
 * Returns per-word and whole-text sequences, positions, consonant skeleton
 * and the consonant/vowel pattern.
 */
export function vowelOrder(text) {
  const words = String(text ?? '').split(/\s+/).map(letters).filter(Boolean);
  let pos = 0;
  const all = [], allWithY = [], perWord = [];
  for (const w of words) {
    const seq = [], seqY = [], pattern = [];
    for (let i = 0; i < w.length; i++) {
      const ch = w[i]; pos++;
      if (VOWELS.has(ch)) { seq.push(ch); seqY.push(ch); all.push({ v: ch, pos, word: w }); allWithY.push(ch); pattern.push('V'); }
      else if (ch === 'y' && yIsVowel(w, i)) { seqY.push('y'); allWithY.push('y'); pattern.push('y'); }
      else pattern.push('C');
    }
    perWord.push({ word: w, vowels: seq.join(''), vowelsWithY: seqY.join(''), consonants: [...w].filter((c, i) => pattern[i] === 'C').join(''), pattern: pattern.join('') });
  }
  const seq = all.map((x) => x.v);
  const counts = {}; for (const v of seq) counts[v] = (counts[v] || 0) + 1;
  const firstAppearance = [...new Set(seq)];
  const flat = words.join('');
  return {
    sequence: seq, vowels: seq.join(''), vowelsWithY: allWithY.join(''), positions: all.map((x) => x.pos),
    consonants: perWord.map((p) => p.consonants).join(''), pattern: perWord.map((p) => p.pattern).join(' '),
    counts, firstAppearance, perWord, total: flat.length, vowelCount: seq.length,
    alphabetical: seq.length > 1 && seq.join('') === [...seq].sort().join(''),
    reverseAlphabetical: seq.length > 1 && seq.join('') === [...seq].sort().reverse().join(''),
    allFive: ['a', 'e', 'i', 'o', 'u'].every((v) => counts[v]),
    hasY: allWithY.length !== seq.length,
  };
}

// ── lexicon ───────────────────────────────────────────────────────────────────
/** Parse data/lexicon.txt ("word|tier" lines) into a compact index. */
export function parseLexicon(text) {
  const words = [], tiers = [];
  for (const line of String(text).split('\n')) {
    const bar = line.indexOf('|'); if (bar < 1) continue;
    const w = line.slice(0, bar); if (!/^[a-z]{1,20}$/.test(w)) continue;
    words.push(w); tiers.push(line.slice(bar + 1).trim() || '2');
  }
  return { words, tiers, size: words.length };
}

/** Merge extra entries (corpus words, names, phrases) into a lexicon. */
export function withExtras(lex, extras) {
  const seen = new Set(lex.words);
  const words = [...lex.words], tiers = [...lex.tiers], labels = new Map();
  for (const { text, tier } of extras) {
    const key = letters(text); if (key.length < 2 || key.length > 40) continue;
    const display = String(text).toLowerCase().trim();
    if (display.includes(' ')) { if (!labels.has(key)) { labels.set(key, display); words.push(key); tiers.push(tier || 's'); } continue; }
    if (seen.has(key)) continue;
    seen.add(key); words.push(key); tiers.push(tier || 'c');
  }
  return { words, tiers, labels, size: words.length };
}

const counts26 = (s) => { const c = new Uint8Array(26); for (let i = 0; i < s.length; i++) c[s.charCodeAt(i) - 97]++; return c; };
function fitsIn(word, bank, scratch) {
  scratch.set(bank);
  for (let i = 0; i < word.length; i++) { const k = word.charCodeAt(i) - 97; if (scratch[k] === 0) return false; scratch[k]--; }
  return true;
}
function isSubsequence(word, src) {
  let j = 0;
  for (let i = 0; i < src.length && j < word.length; i++) if (src[i] === word[j]) j++;
  return j === word.length;
}

export const TIER_LABEL = Object.freeze({ 1: 'common word', 2: 'word', n: 'name', p: 'proper noun', c: 'corpus', s: 'statement' });
const TIER_RANK = { c: 0, s: 0, n: 1, 1: 2, p: 3, 2: 4 };

/**
 * Every lexicon entry that can be spelled from the letters of `text`.
 * Categories (each word appears once, in the strongest category):
 *   anagram     uses every letter exactly once
 *   sequence    appears as consecutive letters (may span a space: crossesWords)
 *   inOrder     letters appear left to right, skipping some
 *   rearranged  letters are all available but out of order ("bible" → "lie")
 */
export function hiddenWords(text, lex, { minLength = 3, limitPerCategory = 400 } = {}) {
  const src = letters(text);
  const wordsOfText = String(text ?? '').split(/\s+/).map(letters).filter(Boolean);
  const own = new Set([src, ...wordsOfText]);
  const bank = counts26(src);
  const scratch = new Uint8Array(26);
  const out = { anagram: [], sequence: [], inOrder: [], rearranged: [] };
  const totals = { anagram: 0, sequence: 0, inOrder: 0, rearranged: 0 };
  if (src.length < 2) return { source: src, ...out, totals, tested: 0 };
  for (let i = 0; i < lex.words.length; i++) {
    const w = lex.words[i];
    if (w.length > src.length || w.length < Math.min(minLength, src.length) || own.has(w)) continue;
    if (!fitsIn(w, bank, scratch)) continue;
    const tier = lex.tiers[i];
    const entry = { w, label: lex.labels?.get(w) || w, tier, len: w.length };
    let cat;
    if (w.length === src.length) cat = 'anagram';
    else if (src.includes(w)) { cat = 'sequence'; entry.crossesWords = !wordsOfText.some((x) => x.includes(w)); entry.at = src.indexOf(w); }
    else if (isSubsequence(w, src)) cat = 'inOrder';
    else cat = 'rearranged';
    totals[cat]++;
    out[cat].push(entry);
  }
  const rank = (a, b) => (b.len - a.len) || (TIER_RANK[a.tier] - TIER_RANK[b.tier]) || (a.w < b.w ? -1 : 1);
  for (const k of Object.keys(out)) out[k] = out[k].sort(rank).slice(0, limitPerCategory);
  return { source: src, ...out, totals, tested: lex.words.length };
}

/**
 * Multi-word anagram statements that use every letter exactly once
 * ("dormitory" → "dirty room"). Depth-first over the sub-anagram candidates,
 * bounded by word count, result count and a time budget.
 */
export function anagramPhrases(text, candidates, { maxWords = 3, limit = 40, budgetMs = 80, minWordLength = 2 } = {}) {
  const src = letters(text);
  if (src.length < 4 || src.length > 24) return { phrases: [], complete: false, reason: src.length > 24 ? 'too many letters to search exhaustively' : 'too short' };
  const pool = candidates.filter((c) => c.w.length >= minWordLength && c.w.length < src.length && !c.label.includes(' ') && (c.tier === '1' || c.tier === 'n' || c.tier === 'c' || c.w.length >= 4))
    .sort((a, b) => b.w.length - a.w.length || (TIER_RANK[a.tier] - TIER_RANK[b.tier]));
  const vec = pool.map((c) => counts26(c.w));
  const bank = counts26(src);
  const results = [];
  const start = Date.now();
  let timedOut = false;
  const chosen = [];
  const dfs = (from, remaining) => {
    if (results.length >= limit) return;
    if (Date.now() - start > budgetMs) { timedOut = true; return; }
    if (remaining === 0) { results.push(chosen.map((i) => pool[i].label).join(' ')); return; }
    if (chosen.length >= maxWords) return;
    for (let i = from; i < pool.length; i++) {
      const w = pool[i].w;
      if (w.length > remaining) continue;
      if (chosen.length === maxWords - 1 && w.length !== remaining) continue;
      const v = vec[i]; let ok = true;
      for (let k = 0; k < 26; k++) if (v[k] > bank[k]) { ok = false; break; }
      if (!ok) continue;
      for (let k = 0; k < 26; k++) bank[k] -= v[k];
      chosen.push(i);
      dfs(i, remaining - w.length);
      chosen.pop();
      for (let k = 0; k < 26; k++) bank[k] += v[k];
      if (results.length >= limit || timedOut) return;
    }
  };
  dfs(0, src.length);
  return { phrases: results, complete: !timedOut && results.length < limit, reason: timedOut ? 'time budget reached' : results.length >= limit ? 'result limit reached' : '' };
}

/**
 * How many hidden words would a random string of the same length be expected
 * to contain? Gives the counts a baseline: longer inputs hide more words.
 */
export function hiddenBaseline(length) {
  if (length <= 3) return 'very short: few hidden words are possible';
  if (length <= 6) return 'short: a handful of hidden words is typical for any word this length';
  if (length <= 10) return 'medium: dozens of rearranged words are typical for any word this length';
  return 'long: hundreds of rearranged words are typical — the in-sequence words are the rarer finds';
}
