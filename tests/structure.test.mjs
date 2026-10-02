import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/structure.mjs';

test('arithmetic primitives', () => {
  assert.deepEqual(S.primeFactors(360), [[2, 3], [3, 2], [5, 1]]);
  assert.deepEqual(S.divisors(28), [1, 2, 4, 7, 14, 28]);
  assert.deepEqual(S.factorPairs(36), [[1, 36], [2, 18], [3, 12], [4, 9], [6, 6]]);
  assert.equal(S.digitalRoot(151), 7);
  assert.equal(S.isPrime(151), true);
  assert.equal(S.polygonalIndex(153, 3), 17);
  assert.equal(S.polygonalIndex(22, 5), 4);
  assert.equal(S.polygonalIndex(45, 6), 5);
  assert.equal(S.fibonacciIndex(144), 12);
  assert.equal(S.fibonacciIndex(145), 0);
  assert.deepEqual(S.perfectPower(729), { base: 3, exp: 6 });
  assert.equal(S.perfectPower(10), null);
  assert.equal(S.aliquotClass(28), 'perfect');
  assert.equal(S.aliquotClass(12), 'abundant');
  assert.deepEqual(S.sumOfTwoSquares(25), [[3, 4]]);
  assert.deepEqual(S.sumOfTwoSquares(65), [[1, 8], [4, 7]]);
  assert.deepEqual(S.differenceOfSquares(15), [[8, 7], [4, 1]]);
  assert.deepEqual(S.sumOfTwoCubes(1729), [[1, 12], [9, 10]]);
  assert.equal(S.gcd(84, 36), 12);
  assert.equal(S.lcm(4, 6), 12);
  assert.equal(S.reverseNumber(151), 151);
  assert.equal(S.isPalindrome(151), true);
  const a = S.arithmetic(666);
  assert.equal(a.factorization, '2 × 3^2 × 37');
  assert.ok(a.notable.some((x) => x.tag === 'triangular'));
});

test('algebraic relations between entity values', () => {
  const ents = [
    { id: 'a', label: 'A', kind: 'person', value: 3 }, { id: 'b', label: 'B', kind: 'person', value: 4 },
    { id: 'c', label: 'C', kind: 'event', value: 5 }, { id: 'd', label: 'D', kind: 'org', value: 7 }, { id: 'e', label: 'E', kind: 'org', value: 12 },
  ];
  const alg = S.algebraic(ents);
  assert.ok(alg.triples.some((t) => t.type === 'pythagorean' && t.values.join() === '3,4,5'));
  assert.ok(alg.triples.some((t) => t.type === 'additive' && t.text === 'A + B = D'));
  assert.ok(alg.triples.some((t) => t.type === 'multiplicative' && t.text === 'A + B = D' === false && t.values.join() === '3,4,12'));
  assert.ok(alg.pairs.find((p) => p.a.label === 'A' && p.b.label === 'B').hits.some((h) => h.type === 'sum' && h.matches.includes('D')));
  assert.ok(alg.sequences.some((s) => s.type === 'arithmetic' && s.values.join() === '3,4,5'));
  assert.ok(alg.tested > 0 && alg.hits > 0 && alg.expectedHits > 0);
});

test('geometry of a value against entities', () => {
  const g = S.geometry(65, [{ label: 'x', value: 5 }, { label: 'y', value: 13 }]);
  assert.ok(g.rectangles.some((r) => r.a === 5 && r.b === 13 && r.meaningful));
  assert.equal(g.hypotenuseOf.length, 2);
  assert.ok(g.legOf.some((t) => t.b === 72 && t.c === 97));
  assert.equal(g.angle.deg, 65);
  assert.ok(g.scaling.some((s) => s.fraction === '5:1'));
  const sq = S.geometry(25, []);
  assert.ok(sq.asHypotenuse.some((t) => t.a === 7 && t.b === 24));
  assert.equal(sq.angle.regularPolygonWithThisInteriorAngle, null);
  assert.equal(S.geometry(60, []).angle.regularPolygonWithThisInteriorAngle, 3);
});

test('temporal intervals and components', () => {
  assert.equal(S.parseDate('2024-02-29') !== null, true);
  assert.equal(S.parseDate('2023-02-29'), null);
  assert.equal(S.parseDate('nope'), null);
  const t = S.temporal([
    { label: 'birth', value: 100, date: '2000-01-01' },
    { label: 'event', value: 366, date: '2001-01-01' },
    { label: 'code', value: 31 },
  ]);
  assert.equal(t.intervals[0].days, 366);
  assert.ok(t.intervals[0].matches.some((m) => m.type === 'equal' && /event/.test(m.text)));
  assert.equal(t.intervals[0].months, 12);
  assert.equal(t.intervals[0].midpoint, '2000-07-02');
  assert.ok(t.components.length === 2);
  assert.equal(t.dated[0].dayOfYear, 1);
});

test('spatial distances are computed from supplied coordinates only', () => {
  const s = S.spatial([
    { label: 'london', value: 74, lat: 51.5074, lon: -0.1278 },
    { label: 'paris', value: 344, lat: 48.8566, lon: 2.3522 },
    { label: 'rome', value: 51, lat: 41.9028, lon: 12.4964 },
    { label: 'no-coords', value: 9 },
  ]);
  assert.equal(s.located.length, 3);
  const lp = s.distances.find((d) => d.a === 'london' && d.b === 'paris');
  assert.ok(lp.km > 340 && lp.km < 345, `london-paris ${lp.km}`);
  assert.ok(lp.matches.some((m) => m.type === 'equal' && /paris/.test(m.text)));
  assert.equal(s.triangles.length, 1);
  assert.ok(s.centre && Math.abs(s.centre.lat - 47.5) < 1.5);
  assert.ok(S.validCoord(0, 0) && !S.validCoord(91, 0) && !S.validCoord(NaN, 0));
});

test('reverse search, multi-scale, nearby density and convergence', () => {
  const ents = [{ label: 'head', value: 144 }, { label: 'twelve', value: 12 }, { label: 'other', value: 50 }];
  const rev = S.reverseSearch(144, ents, (v) => (v === 12 ? ['twelve-word'] : []));
  assert.ok(rev.structures.some((s) => /12\^2/.test(s)));
  assert.ok(rev.rows.some((r) => /square root/.test(r.structure) && r.members.includes('twelve [entity]')));
  const ms = S.multiScale(153, [{ label: 'a', value: 10 }, { label: 'b', value: 143 }], [1, 2, 3, 4]);
  assert.ok(ms.recurring.includes('triangular'));
  assert.equal(ms.letters.arithmeticStep, 1);
  const nd = S.nearbyDensity(100, [98, 100, 103, 200], 5);
  assert.deepEqual(nd.alsoMatching, [98, 103]);
  const full = S.analyze([{ id: 'h', label: 'h', kind: 'word', value: 65 }, { id: 'p', label: 'p', kind: 'person', value: 5, date: '2020-01-01' }, { id: 'q', label: 'q', kind: 'event', value: 13, date: '2020-03-06' }]);
  assert.equal(full.n, 65);
  assert.ok(full.algebraic.triples.some((t) => t.type === 'multiplicative'));
  assert.equal(full.temporal.intervals[0].days, 65);
  assert.ok(full.temporal.intervals[0].matches.some((m) => m.type === 'equal'));
  assert.ok(['possible match', 'multiple independent correspondences', 'statistically unusual correspondence'].includes(full.convergence.verdict));
  assert.ok(full.nearby.length >= 1);
});

test('monte carlo significance is deterministic and bounded', () => {
  const rngVals = (seed, k) => { const r = S.mulberry32(seed); return Array.from({ length: k }, () => r()); };
  assert.deepEqual(rngVals(42, 3), rngVals(42, 3), 'same seed → same stream');
  assert.ok(rngVals(1, 100).every((v) => v >= 0 && v < 1));
  const a = S.monteCarloMatch({ trials: 1000, sampleValue: (rng) => Math.round(rng() * 100), isHit: (v) => v === 50, observedHit: true, observedValue: 50 });
  const b = S.monteCarloMatch({ trials: 1000, sampleValue: (rng) => Math.round(rng() * 100), isHit: (v) => v === 50, observedHit: true, observedValue: 50 });
  assert.equal(a.rate, b.rate, 'stable between calls for the same value');
  assert.ok(a.rate >= 0 && a.rate <= 1);
  assert.equal(a.observedHit, true);
  const miss = S.monteCarloMatch({ trials: 500, sampleValue: (rng) => Math.round(rng() * 100), isHit: (v) => v === 9999, observedHit: false, observedValue: 12 });
  assert.equal(miss.hits, 0);
  assert.equal(miss.rate, 0);
  assert.equal(miss.observedHit, false);
});
