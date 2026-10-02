// ── Mathematical Structure & Geometric Analysis layer ─────────────────────────
// Pure functions, no DOM. Consumes the numbers the existing cipher engine has
// already produced (never recomputes or replaces them) and asks what
// mathematical structures those numbers can occupy: arithmetic, algebraic,
// geometric, temporal (dates), spatial (coordinates) and cross-entity.
//
// Every relationship comes with the count of candidates that were tested, a
// chance baseline, and the density of near-miss values, so a "hit" is always
// reported next to how easy it was to obtain.

// ── arithmetic ────────────────────────────────────────────────────────────────
export function primeFactors(n) { // [[p, e], ...]
  const out = []; let x = Math.abs(Math.round(n));
  if (x < 2) return out;
  for (let p = 2; p * p <= x; p += p === 2 ? 1 : 2) { let e = 0; while (x % p === 0) { x /= p; e++; } if (e) out.push([p, e]); }
  if (x > 1) out.push([x, 1]);
  return out;
}
export const isPrime = (n) => n >= 2 && primeFactors(n).length === 1 && primeFactors(n)[0][1] === 1;
export function divisors(n) {
  n = Math.abs(Math.round(n)); if (n < 1) return [];
  const small = [], large = [];
  for (let d = 1; d * d <= n; d++) if (n % d === 0) { small.push(d); if (d * d !== n) large.push(n / d); }
  return small.concat(large.reverse());
}
export function factorPairs(n) { const d = divisors(n); return d.filter((a) => a * a <= n).map((a) => [a, n / a]); }
export const digits = (n) => [...String(Math.abs(Math.round(n)))].map(Number);
export const digitSum = (n) => digits(n).reduce((a, b) => a + b, 0);
export function digitalRoot(n) { let x = Math.abs(Math.round(n)); while (x > 9) x = digitSum(x); return x; }
export const isPalindrome = (n) => { const s = String(Math.abs(Math.round(n))); return s.length > 1 && s === [...s].reverse().join(''); };
export const reverseNumber = (n) => Number([...String(Math.abs(Math.round(n)))].reverse().join(''));
export const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
export const isCube = (n) => n >= 0 && Number.isInteger(Math.cbrt(n)) || Math.round(Math.cbrt(n)) ** 3 === n;
export function perfectPower(n) { // n = b^e with e >= 2, smallest base
  if (n < 4) return null;
  for (let e = Math.floor(Math.log2(n)); e >= 2; e--) { const b = Math.round(Math.pow(n, 1 / e)); for (const c of [b - 1, b, b + 1]) if (c >= 2 && c ** e === n) return { base: c, exp: e }; }
  return null;
}
/** k such that n is the k-th s-gonal number, or 0. s=3 triangular, 4 square, 5 pentagonal, 6 hexagonal … */
export function polygonalIndex(n, s) {
  if (n < 1 || s < 3) return 0;
  const disc = 8 * (s - 2) * n + (s - 4) ** 2;
  const r = Math.sqrt(disc); if (!Number.isInteger(r)) return 0;
  const k = (r + (s - 4)) / (2 * (s - 2));
  return Number.isInteger(k) && k > 0 ? k : 0;
}
export const POLYGON_NAMES = Object.freeze({ 3: 'triangular', 4: 'square', 5: 'pentagonal', 6: 'hexagonal', 7: 'heptagonal', 8: 'octagonal', 9: 'nonagonal', 10: 'decagonal', 12: 'dodecagonal' });
export function polygonalMemberships(n) { return Object.keys(POLYGON_NAMES).map(Number).map((s) => ({ s, name: POLYGON_NAMES[s], k: polygonalIndex(n, s) })).filter((x) => x.k); }
export function fibonacciIndex(n) { let a = 0, b = 1, i = 0; while (b < n) { [a, b] = [b, a + b]; i++; } return b === n && n > 0 ? i + 1 : 0; }
export function lucasIndex(n) { let a = 2, b = 1, i = 0; if (n === 2) return 0; while (b < n) { [a, b] = [b, a + b]; i++; } return b === n ? i : -1; }
export function aliquotClass(n) { if (n < 2) return 'none'; const s = divisors(n).reduce((a, b) => a + b, 0) - n; return s === n ? 'perfect' : s > n ? 'abundant' : 'deficient'; }
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0);
export function sumOfTwoSquares(n) { const out = []; for (let a = 1; 2 * a * a <= n; a++) { const b2 = n - a * a; const b = Math.round(Math.sqrt(b2)); if (b >= a && b * b === b2) out.push([a, b]); } return out; }
export function differenceOfSquares(n) { // n = a² − b², b ≥ 1
  return factorPairs(n).filter(([d, e]) => (d + e) % 2 === 0 && e > d).map(([d, e]) => [(d + e) / 2, (e - d) / 2]);
}
export function sumOfTwoCubes(n) { const out = []; for (let a = 1; 2 * a ** 3 <= n; a++) { const b = Math.round(Math.cbrt(n - a ** 3)); if (b >= a && a ** 3 + b ** 3 === n) out.push([a, b]); } return out; }
export function differenceOfCubes(n) { const out = []; for (let b = 1; b ** 3 < n && b < 200; b++) { const a = Math.round(Math.cbrt(n + b ** 3)); if (a ** 3 - b ** 3 === n) out.push([a, b]); } return out; }
export function modProfile(n) { return { 7: n % 7, 9: n % 9, 12: n % 12, 22: n % 22, 26: n % 26, 60: n % 60, 360: n % 360 }; }
export function toBase(n, b) { return Math.abs(Math.round(n)).toString(b); }

/** Full arithmetic profile of one value. */
export function arithmetic(n) {
  n = Math.round(n);
  const pf = primeFactors(n);
  const poly = polygonalMemberships(n);
  const notable = [];
  if (isPrime(n)) notable.push({ tag: 'prime', text: 'prime — no factorisation' });
  const pp = perfectPower(n); if (pp) notable.push({ tag: 'power', text: `${pp.base}^${pp.exp}` });
  for (const p of poly) notable.push({ tag: p.name, text: `${p.name} number, index ${p.k}` });
  const fi = fibonacciIndex(n); if (fi) notable.push({ tag: 'fibonacci', text: `fibonacci F(${fi})` });
  const li = lucasIndex(n); if (li >= 0) notable.push({ tag: 'lucas', text: `lucas L(${li})` });
  if (isPalindrome(n)) notable.push({ tag: 'palindrome', text: 'palindromic digits' });
  const ac = aliquotClass(n); if (ac === 'perfect') notable.push({ tag: 'perfect', text: 'perfect number (sum of proper divisors = n)' });
  if (n > 1 && n % 9 === 0 && isSquare(n)) notable.push({ tag: 'square-of-multiple-of-3', text: '' });
  return {
    n, primeFactors: pf, factorization: pf.map(([p, e]) => (e > 1 ? `${p}^${e}` : String(p))).join(' × ') || String(n),
    divisors: divisors(n), factorPairs: factorPairs(n), digitSum: digitSum(n), digitalRoot: digitalRoot(n), reversed: reverseNumber(n),
    mods: modProfile(n), binary: toBase(n, 2), base12: toBase(n, 12), base60: n >= 60 ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}` : null,
    square: n * n, cube: n ** 3, sqrt: Math.sqrt(n), cbrt: Math.cbrt(n), isSquare: isSquare(n), isCube: Math.round(Math.cbrt(n)) ** 3 === n,
    sumOfTwoSquares: sumOfTwoSquares(n), differenceOfSquares: differenceOfSquares(n), sumOfTwoCubes: sumOfTwoCubes(n), differenceOfCubes: differenceOfCubes(n),
    aliquot: ac, notable: notable.filter((x) => x.text),
  };
}

// ── helpers for relations ─────────────────────────────────────────────────────
const reduceFraction = (a, b) => { const g = gcd(a, b) || 1; return [a / g, b / g]; };
const near = (x, y, tol) => Math.abs(x - y) <= tol;
export function describeNumber(n) { // short structural tags for any integer
  const a = arithmetic(n); return a.notable.map((x) => x.tag);
}

// ── algebraic: pairs and triples among entity values ──────────────────────────
/**
 * entities: [{ id, label, kind, value }]  (value = the existing cipher result)
 * Returns pair relations and triple relations with hit flags and test counts.
 */
export function algebraic(entities) {
  const ents = entities.filter((e) => Number.isFinite(e.value) && e.value > 0);
  const valueIndex = new Map(); ents.forEach((e) => { if (!valueIndex.has(e.value)) valueIndex.set(e.value, []); valueIndex.get(e.value).push(e); });
  const other = (v, exclude) => (valueIndex.get(v) || []).filter((e) => !exclude.includes(e));
  const pairs = [], triples = [];
  let tested = 0, hits = 0;
  for (let i = 0; i < ents.length; i++) for (let j = i + 1; j < ents.length; j++) {
    const A = ents[i], B = ents[j]; const a = A.value, b = B.value; const [hi, lo] = a >= b ? [a, b] : [b, a];
    const rel = { a: A, b: B, sum: a + b, diff: hi - lo, product: a * b, ratio: reduceFraction(hi, lo), gcd: gcd(a, b), lcm: lcm(a, b), hits: [] };
    const checks = [['sum', a + b, `${A.label} + ${B.label}`], ['difference', hi - lo, `|${A.label} − ${B.label}|`], ['product', a * b, `${A.label} × ${B.label}`], ['gcd', gcd(a, b), `gcd`], ['lcm', lcm(a, b), `lcm`]];
    for (const [type, v, expr] of checks) {
      tested++;
      const m = other(v, [A, B]);
      if (m.length && v > 1) { hits++; rel.hits.push({ type, expr, value: v, matches: m.map((e) => e.label) }); }
    }
    if (lo > 0 && hi % lo === 0 && hi !== lo) rel.hits.push({ type: 'multiple', expr: `${hi} = ${hi / lo} × ${lo}`, value: hi / lo, matches: [] });
    if (a === b) rel.hits.push({ type: 'equal', expr: `${A.label} = ${B.label} = ${a}`, value: a, matches: [] });
    const g = gcd(a, b); if (g > 1 && a !== b) rel.shared = { gcd: g, a: a / g, b: b / g };
    pairs.push(rel);
  }
  // triples: a+b=c, a×b=c, a²+b²=c², a²+b²=c, a²−b²=c (c any entity)
  for (let i = 0; i < ents.length; i++) for (let j = i + 1; j < ents.length; j++) for (let k = 0; k < ents.length; k++) {
    if (k === i || k === j) continue;
    const a = ents[i].value, b = ents[j].value, c = ents[k].value; const L = [ents[i].label, ents[j].label, ents[k].label];
    tested += 4;
    if (a + b === c) { hits++; triples.push({ type: 'additive', text: `${L[0]} + ${L[1]} = ${L[2]}`, values: [a, b, c] }); }
    if (a * b === c) { hits++; triples.push({ type: 'multiplicative', text: `${L[0]} × ${L[1]} = ${L[2]}`, values: [a, b, c] }); }
    if (a * a + b * b === c * c) { hits++; triples.push({ type: 'pythagorean', text: `${L[0]}² + ${L[1]}² = ${L[2]}²  (right triangle ${a}, ${b}, ${c})`, values: [a, b, c] }); }
    if (a * a + b * b === c) { hits++; triples.push({ type: 'sum-of-squares', text: `${L[0]}² + ${L[1]}² = ${L[2]}  (${L[2]} is the squared hypotenuse of ${a} × ${b})`, values: [a, b, c] }); }
    const [hi, lo] = a >= b ? [a, b] : [b, a];
    if (hi * hi - lo * lo === c && lo > 0) { hits++; triples.push({ type: 'difference-of-squares', text: `${hi}² − ${lo}² = ${c}`, values: [hi, lo, c] }); }
  }
  // sequences among distinct sorted values
  const vals = [...new Set(ents.map((e) => e.value))].sort((x, y) => x - y);
  const sequences = [];
  for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) {
    const d = vals[j] - vals[i]; let run = [vals[i], vals[j]]; let next = vals[j] + d;
    while (vals.includes(next)) { run.push(next); next += d; }
    if (run.length >= 3 && d > 0) sequences.push({ type: 'arithmetic', step: d, values: run, text: run.join(', ') + ` (step ${d})` });
    if (vals[i] > 1 && vals[j] % vals[i] === 0) { const r = vals[j] / vals[i]; let g = [vals[i], vals[j]]; let n2 = vals[j] * r; while (r > 1 && vals.includes(n2)) { g.push(n2); n2 *= r; } if (g.length >= 3) sequences.push({ type: 'geometric', ratio: r, values: g, text: g.join(', ') + ` (ratio ${r})` }); }
  }
  // chance baseline: values spread over a range R; each equality test hits by chance ≈ 1/R
  const range = Math.max(9, ...vals) || 9;
  const expected = tested / range;
  return { entities: ents, pairs, triples, sequences: dedupe(sequences), tested, hits, expectedHits: expected, range };
}
function dedupe(seqs) { const seen = new Set(); return seqs.filter((s) => { const k = s.type + s.values.join(','); if (seen.has(k)) return false; seen.add(k); return true; }); }

// ── geometric ─────────────────────────────────────────────────────────────────
export function geometry(n, entities = []) {
  n = Math.round(n); if (n < 1) return null;
  const vals = new Set(entities.map((e) => e.value));
  const labelOf = (v) => entities.filter((e) => e.value === v).map((e) => e.label);
  const rect = factorPairs(n).filter(([a]) => a > 1).map(([a, b]) => ({ a, b, aLabels: labelOf(a), bLabels: labelOf(b), meaningful: vals.has(a) || vals.has(b) }));
  const hyp = sumOfTwoSquares(n).map(([a, b]) => ({ a, b, aLabels: labelOf(a), bLabels: labelOf(b), meaningful: vals.has(a) || vals.has(b), c: Math.sqrt(n) }));
  const asHypotenuse = isSquare(n) ? sumOfTwoSquares(n * n).map(([a, b]) => ({ a, b, c: n })) : [];
  const triplesWithN = []; // n as a leg: n² + b² = c²  (b, c integers)
  for (let b = 1; b <= 2 * n && b < 5000; b++) { const c2 = n * n + b * b; const c = Math.round(Math.sqrt(c2)); if (c * c === c2) triplesWithN.push({ a: n, b, c, meaningful: vals.has(b) || vals.has(c) }); }
  const circle = { asRadius: { circumference: 2 * Math.PI * n, area: Math.PI * n * n }, asDiameter: { circumference: Math.PI * n, area: Math.PI * n * n / 4 }, asCircumference: { radius: n / (2 * Math.PI), diameter: n / Math.PI } };
  const angle = { deg: n % 360, turns: n / 360, isRightMultiple: n % 90 === 0, isFullTurns: n % 360 === 0, interiorAngleOfNgon: n >= 3 ? (n - 2) * 180 / n : null, exteriorAngleOfNgon: n >= 3 ? 360 / n : null, regularPolygonWithThisInteriorAngle: n < 180 && Number.isInteger(360 / (180 - n)) ? 360 / (180 - n) : null };
  const square = { asArea: { side: Math.sqrt(n), integer: isSquare(n) }, asSide: { area: n * n, diagonal: n * Math.SQRT2, perimeter: 4 * n } };
  const cube = { asVolume: { side: Math.cbrt(n), integer: Math.round(Math.cbrt(n)) ** 3 === n }, asSide: { volume: n ** 3, surface: 6 * n * n } };
  const triangle = { equilateralArea: Math.sqrt(3) / 4 * n * n, equilateralHeight: Math.sqrt(3) / 2 * n, triangularIndex: polygonalIndex(n, 3) };
  const grids = rect.filter((r) => r.a >= 2 && r.b >= 2).map((r) => `${r.a} × ${r.b}`);
  const symmetry = { rotational: divisors(n).filter((d) => d > 1 && d <= 24), reflection: n % 2 === 0 ? 'even — splits into two equal halves' : 'odd — has a centre element' };
  const scaling = entities.filter((e) => e.value > 0 && e.value !== n).map((e) => { const [p, q] = reduceFraction(n, e.value); return { label: e.label, value: e.value, ratio: n / e.value, fraction: `${p}:${q}`, simple: Math.max(p, q) <= 12 }; }).filter((s) => s.simple);
  return { n, rectangles: rect, hypotenuseOf: hyp, asHypotenuse, legOf: triplesWithN.slice(0, 6), circle, angle, square, cube, triangle, grids, symmetry, scaling };
}

// ── temporal ──────────────────────────────────────────────────────────────────
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim()); if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]); const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return t;
}
export const dayOfYear = (t) => Math.round((t - Date.UTC(new Date(t).getUTCFullYear(), 0, 1)) / 86400000) + 1;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
function monthsBetween(t1, t2) { const a = new Date(Math.min(t1, t2)), b = new Date(Math.max(t1, t2)); return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) - (b.getUTCDate() < a.getUTCDate() ? 1 : 0); }
/**
 * entities: [{ label, value, date: 'YYYY-MM-DD' }]. Compares intervals and date
 * components with every entity value. Only exact integer relationships count as hits.
 */
export function temporal(entities) {
  const dated = entities.filter((e) => parseDate(e.date) !== null).map((e) => ({ ...e, t: parseDate(e.date) }));
  const values = entities.filter((e) => e.value > 0).map((e) => ({ label: e.label, value: e.value }));
  const intervals = [], components = [];
  let tested = 0, hits = 0;
  const compare = (quantity, text) => {
    const out = [];
    for (const v of values) {
      tested++;
      if (quantity === v.value) { hits++; out.push({ type: 'equal', text: `${text} = ${v.label} (${v.value})` }); }
      else if (quantity > 0 && v.value > quantity && v.value % quantity === 0) out.push({ type: 'multiple', text: `${v.label} (${v.value}) = ${v.value / quantity} × ${text}` });
      else if (quantity > 0 && quantity > v.value && quantity % v.value === 0 && v.value > 1) out.push({ type: 'multiple', text: `${text} = ${quantity / v.value} × ${v.label} (${v.value})` });
      else if (quantity > 9 && digitalRoot(quantity) === digitalRoot(v.value)) out.push({ type: 'digital-root', weak: true, text: `${text} and ${v.label} share digital root ${digitalRoot(quantity)}` });
    }
    return out;
  };
  for (let i = 0; i < dated.length; i++) for (let j = i + 1; j < dated.length; j++) {
    const A = dated[i], B = dated[j]; const days = Math.round(Math.abs(B.t - A.t) / 86400000);
    const iv = { a: A.label, b: B.label, from: iso(Math.min(A.t, B.t)), to: iso(Math.max(A.t, B.t)), days, weeks: +(days / 7).toFixed(2), months: monthsBetween(A.t, B.t), years: +(days / 365.2425).toFixed(3), midpoint: iso((A.t + B.t) / 2), matches: [] };
    iv.matches.push(...compare(days, `${days} days (${A.label} → ${B.label})`));
    if (days % 7 === 0) iv.matches.push(...compare(days / 7, `${days / 7} weeks (${A.label} → ${B.label})`));
    if (iv.months > 0) iv.matches.push(...compare(iv.months, `${iv.months} months (${A.label} → ${B.label})`));
    const y = Math.round(days / 365.2425); if (y > 0 && near(days / 365.2425, y, 0.02)) iv.matches.push(...compare(y, `${y} years (${A.label} → ${B.label})`));
    iv.structure = describeNumber(days);
    intervals.push(iv);
  }
  for (const d of dated) {
    const dt = new Date(d.t);
    const comps = [['day of month', dt.getUTCDate()], ['month', dt.getUTCMonth() + 1], ['year', dt.getUTCFullYear()], ['day of year', dayOfYear(d.t)], ['year digit sum', digitSum(dt.getUTCFullYear())], ['dd+mm+yyyy', dt.getUTCDate() + dt.getUTCMonth() + 1 + dt.getUTCFullYear()], ['dd×mm', dt.getUTCDate() * (dt.getUTCMonth() + 1)]];
    const c = { label: d.label, date: d.date, components: comps.map(([k, v]) => ({ k, v })), matches: [] };
    for (const [k, v] of comps) c.matches.push(...compare(v, `${d.label} ${k} (${v})`).filter((m) => m.type === 'equal'));
    components.push(c);
  }
  // ratios between intervals
  const ratios = [];
  for (let i = 0; i < intervals.length; i++) for (let j = i + 1; j < intervals.length; j++) {
    const a = intervals[i].days, b = intervals[j].days; if (!a || !b) continue;
    const [p, q] = reduceFraction(Math.max(a, b), Math.min(a, b));
    if (Math.max(p, q) <= 12) ratios.push({ text: `${intervals[i].a}→${intervals[i].b} : ${intervals[j].a}→${intervals[j].b} = ${p}:${q}`, p, q });
  }
  const range = Math.max(30, ...values.map((v) => v.value));
  return { dated: dated.map((d) => ({ label: d.label, date: d.date, dayOfYear: dayOfYear(d.t) })), intervals, components, ratios, tested, hits, expectedHits: tested / range };
}

// ── spatial ───────────────────────────────────────────────────────────────────
const R_KM = 6371.0088;
const rad = (d) => d * Math.PI / 180;
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
}
export function bearingDeg(lat1, lon1, lat2, lon2) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
export function midpoint(lat1, lon1, lat2, lon2) {
  const φ1 = rad(lat1), φ2 = rad(lat2), Δλ = rad(lon2 - lon1);
  const bx = Math.cos(φ2) * Math.cos(Δλ), by = Math.cos(φ2) * Math.sin(Δλ);
  const φ3 = Math.atan2(Math.sin(φ1) + Math.sin(φ2), Math.sqrt((Math.cos(φ1) + bx) ** 2 + by ** 2));
  const λ3 = rad(lon1) + Math.atan2(by, Math.cos(φ1) + bx);
  return { lat: +(φ3 * 180 / Math.PI).toFixed(4), lon: +((λ3 * 180 / Math.PI + 540) % 360 - 180).toFixed(4) };
}
export const validCoord = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
/** entities: [{ label, value, lat, lon }] */
export function spatial(entities) {
  const located = entities.filter((e) => validCoord(e.lat, e.lon));
  const values = entities.filter((e) => e.value > 0).map((e) => ({ label: e.label, value: e.value }));
  const distances = []; let tested = 0, hits = 0;
  const compare = (q, text) => { const out = []; for (const v of values) { tested++; if (q === v.value) { hits++; out.push({ type: 'equal', text: `${text} = ${v.label} (${v.value})` }); } else if (q > 1 && v.value % q === 0 && v.value !== q) out.push({ type: 'multiple', text: `${v.label} (${v.value}) = ${v.value / q} × ${text}` }); } return out; };
  for (let i = 0; i < located.length; i++) for (let j = i + 1; j < located.length; j++) {
    const A = located[i], B = located[j]; const km = haversineKm(A.lat, A.lon, B.lat, B.lon); const mi = km * 0.621371;
    const d = { a: A.label, b: B.label, km: +km.toFixed(1), miles: +mi.toFixed(1), bearing: +bearingDeg(A.lat, A.lon, B.lat, B.lon).toFixed(1), midpoint: midpoint(A.lat, A.lon, B.lat, B.lon), matches: [] };
    d.matches.push(...compare(Math.round(km), `${Math.round(km)} km (${A.label} → ${B.label})`), ...compare(Math.round(mi), `${Math.round(mi)} mi (${A.label} → ${B.label})`), ...compare(Math.round(d.bearing), `bearing ${Math.round(d.bearing)}° (${A.label} → ${B.label})`));
    distances.push(d);
  }
  const triangles = [];
  for (let i = 0; i < located.length; i++) for (let j = i + 1; j < located.length; j++) for (let k = j + 1; k < located.length; k++) {
    const P = [located[i], located[j], located[k]];
    const s = [haversineKm(P[0].lat, P[0].lon, P[1].lat, P[1].lon), haversineKm(P[1].lat, P[1].lon, P[2].lat, P[2].lon), haversineKm(P[0].lat, P[0].lon, P[2].lat, P[2].lon)].map((x) => +x.toFixed(1));
    const sorted = [...s].sort((a, b) => a - b); const sp = (s[0] + s[1] + s[2]) / 2;
    const area = Math.sqrt(Math.max(0, sp * (sp - s[0]) * (sp - s[1]) * (sp - s[2])));
    const pyth = sorted[2] > 0 ? Math.abs(sorted[0] ** 2 + sorted[1] ** 2 - sorted[2] ** 2) / sorted[2] ** 2 : 1;
    const ratio = sorted[0] > 0 ? [sorted[1] / sorted[0], sorted[2] / sorted[0]] : null;
    triangles.push({ points: P.map((p) => p.label), sides: s, areaKm2: +area.toFixed(1), nearRight: pyth < 0.02, nearEquilateral: sorted[2] / sorted[0] < 1.05, nearIsosceles: (sorted[1] / sorted[0] < 1.05) || (sorted[2] / sorted[1] < 1.05), ratio });
  }
  const centre = located.length >= 2 ? (() => { let x = 0, y = 0, z = 0; for (const p of located) { const φ = rad(p.lat), λ = rad(p.lon); x += Math.cos(φ) * Math.cos(λ); y += Math.cos(φ) * Math.sin(λ); z += Math.sin(φ); } x /= located.length; y /= located.length; z /= located.length; return { lat: +(Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI).toFixed(4), lon: +(Math.atan2(y, x) * 180 / Math.PI).toFixed(4) }; })() : null;
  const coordMatches = [];
  for (const p of located) for (const q of [['lat', Math.round(Math.abs(p.lat))], ['lon', Math.round(Math.abs(p.lon))], ['lat+lon', Math.round(Math.abs(p.lat) + Math.abs(p.lon))]]) coordMatches.push(...compare(q[1], `${p.label} ${q[0]} (${q[1]})`).filter((m) => m.type === 'equal'));
  const range = Math.max(100, ...values.map((v) => v.value));
  return { located: located.map((e) => ({ label: e.label, lat: e.lat, lon: e.lon, source: e.coordSource || 'user' })), distances, triangles, centre, coordMatches, tested, hits, expectedHits: tested / range };
}

// ── reverse search: structure → members ───────────────────────────────────────
/** What structures does value n belong to, and which entities / corpus words occupy them? */
export function reverseSearch(n, entities, corpusLookup) {
  n = Math.round(n); if (n < 1) return null;
  const a = arithmetic(n);
  const rows = [];
  const add = (structure, members) => { if (members.length) rows.push({ structure, members: members.slice(0, 12) }); };
  const byValue = (v) => [...entities.filter((e) => e.value === v).map((e) => `${e.label} [entity]`), ...(corpusLookup ? corpusLookup(v).slice(0, 6).map((w) => `${w} [corpus]`) : [])];
  add(`equal to ${n}`, byValue(n).filter((m) => !m.startsWith(`${entities[0]?.label} [`)));
  for (const d of a.divisors.filter((d) => d > 1 && d < n)) add(`divisor ${d} of ${n} (${n} = ${n / d} × ${d})`, byValue(d));
  for (const m of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) add(`multiple ${m}×${n} = ${n * m}`, byValue(n * m));
  if (a.isSquare) add(`square root √${n} = ${Math.sqrt(n)}`, byValue(Math.sqrt(n)));
  add(`square ${n}² = ${a.square}`, byValue(a.square));
  for (const [x, y] of a.sumOfTwoSquares) add(`${n} = ${x}² + ${y}²`, [...byValue(x), ...byValue(y)]);
  for (const [x, y] of a.differenceOfSquares) add(`${n} = ${x}² − ${y}²`, [...byValue(x), ...byValue(y)]);
  add(`reversed digits ${a.reversed}`, a.reversed !== n ? byValue(a.reversed) : []);
  add(`digital root ${a.digitalRoot}`, byValue(a.digitalRoot));
  const poly = polygonalMemberships(n); for (const p of poly) add(`${p.name} index ${p.k}`, byValue(p.k));
  const fi = fibonacciIndex(n); if (fi) add(`fibonacci index ${fi}`, byValue(fi));
  return { n, structures: a.notable.map((x) => x.text), rows };
}

// ── multi-scale ───────────────────────────────────────────────────────────────
/** words: [{ label, value }] for the words of a phrase; letters: [values]. Which structures recur across scales? */
export function multiScale(phraseValue, words, letters) {
  const tagsAt = (v) => new Set(describeNumber(v));
  const phraseTags = tagsAt(phraseValue);
  const wordTags = words.map((w) => ({ label: w.label, value: w.value, tags: [...tagsAt(w.value)] }));
  const recurring = [...phraseTags].filter((t) => wordTags.some((w) => w.tags.includes(t)));
  const letterSeq = letters.filter((v) => v > 0);
  let arithmeticLetters = null;
  if (letterSeq.length >= 3) { const d = letterSeq[1] - letterSeq[0]; if (letterSeq.every((v, i) => i === 0 || v - letterSeq[i - 1] === d)) arithmeticLetters = d; }
  const letterStats = letterSeq.length ? { count: letterSeq.length, min: Math.min(...letterSeq), max: Math.max(...letterSeq), mean: +(letterSeq.reduce((a, b) => a + b, 0) / letterSeq.length).toFixed(2), arithmeticStep: arithmeticLetters, symmetric: letterSeq.join() === [...letterSeq].reverse().join() } : null;
  return { phrase: { value: phraseValue, tags: [...phraseTags] }, words: wordTags, recurring, letters: letterStats };
}

// ── Monte Carlo significance ──────────────────────────────────────────────────
/**
 * Empirical answer to "is this match unusual, or expected for a word this size?"
 * Runs `trials` random draws; `sampleValue()` returns the gematria value of a
 * random word of the same length under the same cipher, `isHit(v)` says whether
 * that value lands a corpus match. Compares the random hit-rate to the real word.
 * Pure: all randomness and scoring are supplied or computed here, nothing mocked.
 */
export function monteCarloMatch({ trials = 2000, sampleValue, isHit, observedHit, observedValue }) {
  let hits = 0;
  const rng = mulberry32((observedValue || 1) * 2654435761 >>> 0); // deterministic per value → stable UI
  for (let i = 0; i < trials; i++) if (isHit(sampleValue(rng))) hits++;
  const rate = hits / trials;
  // rarity of the observed outcome: if the word hit, how surprising given the base rate
  let rarity, verdict;
  if (observedHit) {
    rarity = rate; // p ≈ chance a random word of this length also hits
    verdict = rate < 0.01 ? 'rare — under 1% of random words this size land a corpus match' : rate < 0.05 ? 'uncommon — a few percent of random words this size would match' : rate < 0.2 ? 'common — many random words this size match' : 'expected — most random words this size match something';
  } else {
    rarity = 1 - rate;
    verdict = 'no corpus match (neither did ' + Math.round((1 - rate) * 100) + '% of random words this size)';
  }
  return { trials, hits, rate: +rate.toFixed(4), observedHit: !!observedHit, rarity: +rarity.toFixed(4), verdict };
}

/** Small deterministic PRNG so the significance figure is stable between renders. */
export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── anti-cherry-picking: nearby density ───────────────────────────────────────
/**
 * For an equality hit between quantity q and an entity value, how many of the
 * values q−w … q+w would also have matched something in the pool? High density
 * means the match was easy to obtain.
 */
export function nearbyDensity(q, pool, w = 5) {
  const set = new Set(pool.filter((v) => Number.isFinite(v)));
  const also = [];
  for (let d = -w; d <= w; d++) { if (d === 0) continue; if (set.has(q + d)) also.push(q + d); }
  return { window: 2 * w, alsoMatching: also, density: also.length / (2 * w) };
}

// ── convergence ───────────────────────────────────────────────────────────────
/** Combine the sections into a verdict that is honest about test counts. */
export function convergence({ alg, tmp, spa, geoHits }) {
  const layers = [];
  if (alg && (alg.triples.length || alg.pairs.some((p) => p.hits.some((h) => h.matches?.length)))) layers.push('algebraic');
  if (geoHits > 0) layers.push('geometric');
  if (tmp && (tmp.intervals.some((i) => i.matches.some((m) => m.type === 'equal')) || tmp.components.some((c) => c.matches.length))) layers.push('temporal');
  if (spa && (spa.distances.some((d) => d.matches.some((m) => m.type === 'equal')) || spa.coordMatches.length)) layers.push('spatial');
  const tested = (alg?.tested || 0) + (tmp?.tested || 0) + (spa?.tested || 0);
  const hits = (alg?.hits || 0) + (tmp?.hits || 0) + (spa?.hits || 0);
  const expected = (alg?.expectedHits || 0) + (tmp?.expectedHits || 0) + (spa?.expectedHits || 0);
  let verdict = 'no exact structural match';
  if (hits > 0) verdict = 'possible match';
  if (layers.length >= 2 && hits >= 2) verdict = 'multiple independent correspondences';
  if (layers.length >= 3 && hits > Math.max(2, 3 * expected)) verdict = 'statistically unusual correspondence';
  return { layers, tested, hits, expected: +expected.toFixed(2), verdict };
}

// ── full report ───────────────────────────────────────────────────────────────
/**
 * entities: [{ id, label, kind, value, date?, lat?, lon? }] where entities[0] is the
 * headline word and value is the existing cipher result under the chosen cipher.
 */
export function analyze(entities, { corpusLookup, words = [], letters = [] } = {}) {
  const head = entities[0];
  const n = head?.value || 0;
  const arith = arithmetic(n);
  const geo = geometry(n, entities.slice(1));
  const alg = algebraic(entities);
  const tmp = temporal(entities);
  const spa = spatial(entities);
  const rev = reverseSearch(n, entities, corpusLookup);
  const ms = multiScale(n, words, letters);
  const geoHits = geo ? geo.rectangles.filter((r) => r.meaningful).length + geo.hypotenuseOf.filter((h) => h.meaningful).length + geo.legOf.filter((l) => l.meaningful).length + geo.scaling.length : 0;
  const conv = convergence({ alg, tmp, spa, geoHits });
  // nearby densities for every exact hit
  const pool = entities.map((e) => e.value);
  const nearby = [];
  for (const iv of tmp.intervals) for (const m of iv.matches) if (m.type === 'equal') nearby.push({ hit: m.text, ...nearbyDensity(iv.days, pool) });
  for (const d of spa.distances) for (const m of d.matches) if (m.type === 'equal') nearby.push({ hit: m.text, ...nearbyDensity(Math.round(d.km), pool) });
  for (const p of alg.pairs) for (const h of p.hits) if (h.matches?.length) nearby.push({ hit: `${h.expr} = ${h.value}`, ...nearbyDensity(h.value, pool) });
  return { head, n, arithmetic: arith, geometry: geo, algebraic: alg, temporal: tmp, spatial: spa, reverse: rev, multiScale: ms, convergence: conv, nearby };
}
