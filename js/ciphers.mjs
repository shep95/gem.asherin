// ── Uriel cipher engine ───────────────────────────────────────────────────────
// Pure functions only: no DOM, no network. Everything here is unit-tested in
// tests/ciphers.test.mjs and frozen at load so it cannot be tampered with from
// the console or by an injected script.

const A = 96; // 'a'.charCodeAt(0) - 1

/** Strip accents so "café" scores as "cafe". */
export function foldLatin(w) {
  return String(w).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Letters only (any script), spaces collapsed. Used for cipher input. */
export function lettersOnly(w) {
  return String(w).replace(/[^\p{L}\p{M}]/gu, '');
}

/** Digit sum until a single digit remains. */
export function ds(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  let x = Math.abs(Math.round(n));
  while (x > 9) x = [...String(x)].reduce((a, b) => a + +b, 0);
  return x;
}

const latinReduce = (w, f) => [...foldLatin(w)].reduce((s, c) => {
  const n = c.charCodeAt(0) - A;
  return n > 0 && n < 27 ? s + f(n, c) : s;
}, 0);

const tableFn = (table) => (w) => [...foldLatin(w)].reduce((s, c) => s + (table[c] || 0), 0);

// ── Hebrew (mispar hechrachi) ─────────────────────────────────────────────────
export const HEBREW_VALUES = Object.freeze({
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200,
  'ש': 300, 'ת': 400,
});
// mispar gadol: final forms continue the sequence past 400
export const HEBREW_FINAL_GADOL = Object.freeze({ 'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900 });

// ── Greek isopsephy ───────────────────────────────────────────────────────────
export const GREEK_VALUES = Object.freeze({
  'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ϛ': 6, 'ϝ': 6, 'ζ': 7, 'η': 8, 'θ': 9,
  'ι': 10, 'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60, 'ο': 70, 'π': 80, 'ϙ': 90, 'ϟ': 90,
  'ρ': 100, 'σ': 200, 'ς': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800, 'ϡ': 900,
});

const stripMarks = (w) => String(w).normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g, '').toLowerCase();
const scriptSum = (table) => (w) => [...stripMarks(w)].reduce((s, c) => s + (table[c] || 0), 0);

export const SCRIPT_RX = Object.freeze({
  hebrew: /[֐-׿]/,
  greek: /[Ͱ-Ͽἀ-῿]/,
  arabic: /[؀-ۿ]/,
  cyrillic: /[Ѐ-ӿ]/,
  devanagari: /[ऀ-ॿ]/,
  cjk: /[一-鿿぀-ヿ]/,
  latin: /[a-zA-ZÀ-ɏ]/,
});

/** Which scripts appear in the text (may be several for mixed input). */
export function detectScripts(text) {
  const found = [];
  for (const [name, rx] of Object.entries(SCRIPT_RX)) if (rx.test(text)) found.push(name);
  return found.length ? found : ['latin'];
}

export const SCRIPT_LABELS = Object.freeze({
  hebrew: 'Hebrew', greek: 'Greek', arabic: 'Arabic', cyrillic: 'Cyrillic', devanagari: 'Devanagari',
  cjk: 'Chinese / Japanese', latin: 'Latin',
});

// ── built-in cipher library ───────────────────────────────────────────────────
// tier 1: popular worldwide · tier 2: regional / traditional · tier 3: specialized
// script: which alphabet the cipher reads. Latin ciphers ignore other scripts.
const chaldean = { a: 1, b: 2, c: 3, d: 4, e: 5, u: 6, v: 6, w: 6, z: 7, h: 5, f: 8, p: 8, q: 1, j: 1, r: 2, s: 3, n: 5, t: 4, m: 4, l: 3, g: 3, y: 1, x: 6, k: 2, i: 1, o: 7 };
const agrippa = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 600, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, v: 700, w: 900, x: 300, y: 400, z: 500 };
const septenary = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 6, i: 5, j: 4, k: 3, l: 2, m: 1, n: 1, o: 2, p: 3, q: 4, r: 5, s: 6, t: 7, u: 6, v: 5, w: 4, x: 3, y: 2, z: 1 };
const abjad = { a: 1, b: 2, j: 3, d: 4, h: 5, w: 6, z: 7, c: 8, t: 9, y: 10, k: 20, l: 30, m: 40, n: 50, s: 60, e: 70, f: 80, p: 90, q: 100, r: 200, x: 300, u: 400, v: 500, g: 600, i: 700 };
const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393];
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
const KATAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8];
// Latin → Hebrew transliteration used by most English "Hebrew gematria" tables
const eng_hebrew = { a: 1, b: 2, c: 20, d: 4, e: 5, f: 80, g: 3, h: 8, i: 10, j: 10, k: 20, l: 30, m: 40, n: 50, o: 70, p: 80, q: 100, r: 200, s: 60, t: 400, u: 6, v: 6, w: 6, x: 90, y: 10, z: 7 };
const reducedFn = (n) => (n > 9 ? (n > 18 ? n - 18 : n - 9) : n);

export const BUILTIN_CIPHERS = Object.freeze({
  ordinal: { name: 'ordinal', desc: 'a=1 to z=26', region: 'global', tier: 1, script: 'latin', fn: (w) => latinReduce(w, (n) => n) },
  reduced: { name: 'pythagorean / reduced', desc: 'digits summed to single digit', region: 'global', tier: 1, script: 'latin', fn: (w) => latinReduce(w, reducedFn) },
  chaldean: { name: 'chaldean', desc: 'babylonian system, 1-8 only', region: 'global', tier: 1, script: 'latin', fn: tableFn(chaldean) },
  english_std: { name: 'standard english (×6)', desc: 'ordinal × 6', region: 'western', tier: 1, script: 'latin', fn: (w) => latinReduce(w, (n) => n * 6) },
  hebrew: { name: 'hebrew (mispar hechrachi)', desc: 'א=1 … ת=400 on hebrew letters', region: 'hebrew', tier: 1, script: 'hebrew', fn: scriptSum(HEBREW_VALUES) },
  greek: { name: 'greek isopsephy', desc: 'α=1 … ω=800 on greek letters', region: 'greek', tier: 1, script: 'greek', fn: scriptSum(GREEK_VALUES) },
  agrippa: { name: 'agrippa / jewish', desc: 'renaissance occult values', region: 'western', tier: 2, script: 'latin', fn: tableFn(agrippa) },
  eng_hebrew: { name: 'english → hebrew', desc: 'latin letters transliterated to hebrew values', region: 'hebrew', tier: 2, script: 'latin', fn: tableFn(eng_hebrew) },
  reverse_ord: { name: 'reverse ordinal', desc: 'z=1 to a=26', region: 'western', tier: 2, script: 'latin', fn: (w) => latinReduce(w, (n) => 27 - n) },
  bacon: {
    name: 'francis bacon', desc: 'lowercase 1-26, uppercase 27-52', region: 'western', tier: 2, script: 'latin',
    fn: (w) => [...String(w).normalize('NFD').replace(/[̀-ͯ]/g, '')].reduce((s, c) => {
      const u = c.toUpperCase().charCodeAt(0) - 64, l = c.toLowerCase().charCodeAt(0) - 96;
      if (c === c.toUpperCase() && c !== c.toLowerCase() && u > 0 && u < 27) return s + u + 26;
      if (l > 0 && l < 27) return s + l;
      return s;
    }, 0),
  },
  eq_crowley: { name: 'crowley english qabalah', desc: 'a=0, b=6, c=12...', region: 'western', tier: 2, script: 'latin', fn: (w) => latinReduce(w, (n) => (n - 1) * 6) },
  satanic: { name: 'satanic (36+)', desc: 'a=37 to z=62', region: 'western', tier: 2, script: 'latin', fn: (w) => latinReduce(w, (n) => n + 36) },
  abjad: { name: 'arabic abjad', desc: 'traditional arabic letter values', region: 'arabic/islamic', tier: 2, script: 'latin', fn: tableFn(abjad) },
  mispar_katan: { name: 'mispar katan', desc: 'hebrew reduced — each letter mod 9', region: 'hebrew', tier: 2, script: 'latin', fn: (w) => latinReduce(w, (n) => KATAN[n - 1]) },
  master_num: {
    name: 'pythagorean + master numbers', desc: '11/22/33 not reduced', region: 'numerology', tier: 2, script: 'latin',
    fn: (w) => {
      let n = latinReduce(w, reducedFn);
      while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
        const s = [...String(n)].reduce((a, b) => a + +b, 0);
        if (s === n) break;
        n = s;
      }
      return n;
    },
  },
  hebrew_gadol: { name: 'hebrew (mispar gadol)', desc: 'final letters ך ם ן ף ץ = 500–900', region: 'hebrew', tier: 3, script: 'hebrew', fn: scriptSum({ ...HEBREW_VALUES, ...HEBREW_FINAL_GADOL }) },
  septenary: { name: 'septenary', desc: 'druidic/celtic, cycles of 7', region: 'celtic', tier: 3, script: 'latin', fn: tableFn(septenary) },
  fibonacci: { name: 'fibonacci', desc: 'letters mapped to fibonacci sequence', region: 'sacred geometry', tier: 3, script: 'latin', fn: (w) => latinReduce(w, (n) => FIB[n - 1]) },
  prime: { name: 'prime number', desc: 'a=2 (first prime) through z=101', region: 'mathematical', tier: 3, script: 'latin', fn: (w) => latinReduce(w, (n) => PRIMES[n - 1]) },
  ascii_sum: { name: 'ascii / digital', desc: 'raw character codes summed', region: 'digital', tier: 3, script: 'any', fn: (w) => [...String(w)].reduce((s, c) => s + c.codePointAt(0), 0) },
  sumerian: { name: 'sumerian (×6000)', desc: 'ordinal × 6000', region: 'ancient', tier: 3, script: 'latin', fn: (w) => latinReduce(w, (n) => n * 6000) },
  trigramic: { name: 'trigramic', desc: 'sum of (position × letter value)', region: 'esoteric', tier: 3, script: 'latin', fn: (w) => { let i = 0; return latinReduce(w, (n) => n * ++i); } },
});
for (const c of Object.values(BUILTIN_CIPHERS)) Object.freeze(c);

export const TIER_LABELS = Object.freeze({ 1: 'popular worldwide', 2: 'regional / traditional', 3: 'specialized', custom: 'custom' });

/** Atbash mirror for Latin letters (a↔z). Non-letters pass through. */
export function atbash(w) {
  return [...foldLatin(w)].map((c) => {
    const n = c.charCodeAt(0) - A;
    return n > 0 && n < 27 ? String.fromCharCode(122 - (n - 1)) : c;
  }).join('');
}

/** Albam: alphabet halved and mirrored (a↔n, b↔o …). */
export function albam(w) {
  return [...foldLatin(w)].map((c) => {
    const n = c.charCodeAt(0) - A;
    return n > 0 && n < 27 ? String.fromCharCode(((n - 1 + 13) % 26) + 97) : c;
  }).join('');
}

/** Reverse each word's characters, keeping word order. */
export function mirrorWord(w) {
  return String(w).split(' ').map((p) => [...p].reverse().join('')).join(' ');
}

/** Does this cipher read anything in the word? */
export function cipherApplies(cipher, word) {
  if (!cipher.script || cipher.script === 'any') return true;
  if (cipher.script === 'latin') return SCRIPT_RX.latin.test(word);
  return SCRIPT_RX[cipher.script]?.test(word) ?? false;
}

/** Compute every cipher for a word. Returns {key:{v,rd,applies}}. */
export function calcWord(w, ciphers) {
  const r = {};
  const word = lettersOnly(w);
  for (const [k, c] of Object.entries(ciphers)) {
    try {
      const v = c.fn(word);
      const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0;
      r[k] = { v: n, rd: ds(n), applies: cipherApplies(c, word) };
    } catch {
      r[k] = { v: 0, rd: 0, applies: false, err: true };
    }
  }
  return r;
}

// ── number words ──────────────────────────────────────────────────────────────
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numToWords(n) {
  n = Math.abs(Math.round(n));
  if (n < 20) return NUM_WORDS[n];
  if (n < 100) { const t = TENS[Math.floor(n / 10)], u = n % 10; return u ? `${t}-${NUM_WORDS[u]}` : t; }
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return `${NUM_WORDS[h]} hundred${r ? ' ' + numToWords(r) : ''}`; }
  if (n < 1000000) { const th = Math.floor(n / 1000), r = n % 1000; return `${numToWords(th)} thousand${r ? ' ' + numToWords(r) : ''}`; }
  return String(n);
}

// ── number properties ─────────────────────────────────────────────────────────
export function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
export function triangularIndex(n) {
  const k = Math.floor((Math.sqrt(8 * n + 1) - 1) / 2);
  return k * (k + 1) / 2 === n && n > 0 ? k : 0;
}
export function isSquare(n) { const r = Math.round(Math.sqrt(n)); return n > 0 && r * r === n; }
export function isFibonacci(n) { return n > 0 && (isSquare(5 * n * n + 4) || isSquare(5 * n * n - 4)); }
export function isPalindrome(n) { const s = String(n); return s.length > 1 && s === [...s].reverse().join(''); }
export function factorize(n) {
  const f = []; let x = n;
  for (let p = 2; p * p <= x; p++) while (x % p === 0) { f.push(p); x /= p; }
  if (x > 1) f.push(x);
  return f;
}

// ── custom cipher validator ───────────────────────────────────────────────────
export function validateCipherCode(code) {
  const errors = [], warnings = [];
  let parsed = null;
  try {
    const normalized = String(code).trim().replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
    parsed = JSON.parse(normalized);
  } catch (e) {
    const m = /position (\d+)/.exec(e.message);
    const pos = m ? parseInt(m[1], 10) : null;
    let line = 1, col = 0;
    if (pos !== null) { const before = String(code).slice(0, pos); line = before.split('\n').length; col = pos - before.lastIndexOf('\n') - 1; }
    errors.push({ line, col, msg: 'JSON parse error: ' + e.message.replace(/at position \d+/, '').trim(), type: 'syntax' });
    return { ok: false, errors, warnings, parsed: null };
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    errors.push({ line: 1, col: 0, msg: 'cipher must be a plain object: { a: 1, b: 2, ... }', type: 'type' });
    return { ok: false, errors, warnings, parsed: null };
  }
  const keys = Object.keys(parsed);
  if (keys.length === 0) errors.push({ line: 1, col: 0, msg: 'cipher is empty — add at least one letter mapping', type: 'empty' });
  if (keys.length > 64) errors.push({ line: 1, col: 0, msg: 'too many keys (max 64)', type: 'size' });
  const seen = new Set();
  for (const k of keys) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') { errors.push({ line: 1, col: 0, msg: `key "${k}" is not allowed`, type: 'key' }); continue; }
    if (k.length !== 1) errors.push({ line: 1, col: 0, msg: `key "${k}" must be a single character`, type: 'key' });
    if (!/^[a-zA-Z]$/.test(k)) errors.push({ line: 1, col: 0, msg: `key "${k}" must be a letter a-z`, type: 'key' });
    const v = parsed[k];
    if (typeof v !== 'number') errors.push({ line: 1, col: 0, msg: `"${k}": value must be a number, got ${typeof v}`, type: 'value' });
    else if (!Number.isFinite(v) || v < 0 || v > 1e9) errors.push({ line: 1, col: 0, msg: `"${k}": value must be a positive finite number below 1e9`, type: 'value' });
    else if (!Number.isInteger(v)) warnings.push({ msg: `"${k}": value ${v} is not an integer — will be rounded to ${Math.round(v)}` });
    if (seen.has(k.toLowerCase())) warnings.push({ msg: `"${k}" appears twice (case-insensitive) — last value wins` });
    seen.add(k.toLowerCase());
  }
  const missing = [...'abcdefghijklmnopqrstuvwxyz'].filter((l) => !seen.has(l));
  if (missing.length > 0 && missing.length < 20) warnings.push({ msg: 'missing letters: ' + missing.join(', ') + ' — will score 0' });
  return { ok: errors.length === 0, errors, warnings, parsed };
}

export function buildCustomFn(parsed) {
  const map = Object.create(null);
  for (const [k, v] of Object.entries(parsed)) if (/^[a-zA-Z]$/.test(k)) map[k.toLowerCase()] = Math.round(v);
  return (w) => [...foldLatin(w)].reduce((s, c) => s + (map[c] || 0), 0);
}

// ── scoring ───────────────────────────────────────────────────────────────────
/** Fraction of active ciphers agreeing on the dominant reduced value (cap .95). */
export function convScore(res, activeKeys) {
  const vals = Object.entries(res).filter(([k, r]) => activeKeys.has(k) && r.applies).map(([, r]) => r.rd);
  if (!vals.length) return 0;
  const freq = {};
  for (const v of vals) freq[v] = (freq[v] || 0) + 1;
  return Math.min(0.95, Math.max(...Object.values(freq)) / vals.length);
}

/**
 * Compatibility of two words: weighted cipher matches normalised to 0-100.
 * ordinal 25 · reduced 20 · chaldean 15 · agrippa 12 · others 8 (max 2) · cross-level +5 · same archetype +8
 */
export function compatibilityScore(r1, r2) {
  let score = 0;
  const weights = { ordinal: 25, reduced: 20, chaldean: 15, agrippa: 12 };
  let other = 0;
  for (const [k, w] of Object.entries(weights)) if (r1[k] && r2[k] && r1[k].v === r2[k].v) score += w;
  for (const k of Object.keys(r1)) {
    if (weights[k]) continue;
    if (r1[k] && r2[k] && r1[k].v > 0 && r1[k].v === r2[k].v && other < 2) { score += 8; other++; }
  }
  if (r1.ordinal && r2.reduced && r1.ordinal.v === r2.reduced.v) score += 5;
  if (r2.ordinal && r1.reduced && r2.ordinal.v === r1.reduced.v) score += 5;
  if (r1.reduced && r2.reduced && r1.reduced.rd === r2.reduced.rd) score += 8;
  return Math.min(100, Math.round(score / 88 * 100));
}
