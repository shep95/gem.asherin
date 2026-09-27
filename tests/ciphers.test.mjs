import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/ciphers.mjs';

test('ordinal and reduced', () => {
  assert.equal(C.BUILTIN_CIPHERS.ordinal.fn('jesus'), 74);
  assert.equal(C.BUILTIN_CIPHERS.ordinal.fn('Jesus Christ'), 151);
  assert.equal(C.BUILTIN_CIPHERS.reduced.fn('jesus'), 11); // j1+e5+s1+u3+s1
  assert.equal(C.ds(74), 2);
  assert.equal(C.ds(0), 0);
  assert.equal(C.ds(NaN), 0);
});

test('accents fold to latin letters', () => {
  assert.equal(C.BUILTIN_CIPHERS.ordinal.fn('café'), C.BUILTIN_CIPHERS.ordinal.fn('cafe'));
});

test('hebrew mispar hechrachi and gadol', () => {
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('חי'), 18);
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('אהבה'), 13);
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('יהוה'), 26);
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('אמת'), 441);
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('שלום'), 376);
  assert.equal(C.BUILTIN_CIPHERS.hebrew_gadol.fn('שלום'), 936);
  // vowel points are ignored
  assert.equal(C.BUILTIN_CIPHERS.hebrew.fn('שָׁלוֹם'), 376);
});

test('greek isopsephy', () => {
  assert.equal(C.BUILTIN_CIPHERS.greek.fn('Ιησους'), 888);
  assert.equal(C.BUILTIN_CIPHERS.greek.fn('Ἰησοῦς'), 888);
  assert.equal(C.BUILTIN_CIPHERS.greek.fn('λογος'), 373);
});

test('script detection and applicability', () => {
  assert.deepEqual(C.detectScripts('hello'), ['latin']);
  assert.deepEqual(C.detectScripts('שלום'), ['hebrew']);
  assert.ok(C.detectScripts('hello שלום').includes('hebrew'));
  assert.equal(C.cipherApplies(C.BUILTIN_CIPHERS.hebrew, 'hello'), false);
  assert.equal(C.cipherApplies(C.BUILTIN_CIPHERS.ordinal, 'hello'), true);
  assert.equal(C.cipherApplies(C.BUILTIN_CIPHERS.ascii_sum, 'שלום'), true);
});

test('calcWord returns applies flags and rounds', () => {
  const r = C.calcWord('jesus christ', C.BUILTIN_CIPHERS);
  assert.equal(r.ordinal.v, 151);
  assert.equal(r.ordinal.rd, 7);
  assert.equal(r.hebrew.applies, false);
  assert.equal(r.trigramic.v, [...'jesuschrist'].reduce((s, c, i) => s + (c.charCodeAt(0) - 96) * (i + 1), 0));
});

test('other ciphers match known values', () => {
  assert.equal(C.BUILTIN_CIPHERS.reverse_ord.fn('a'), 26);
  assert.equal(C.BUILTIN_CIPHERS.english_std.fn('abc'), 36);
  assert.equal(C.BUILTIN_CIPHERS.sumerian.fn('a'), 6000);
  assert.equal(C.BUILTIN_CIPHERS.satanic.fn('a'), 37);
  assert.equal(C.BUILTIN_CIPHERS.eq_crowley.fn('b'), 6);
  assert.equal(C.BUILTIN_CIPHERS.bacon.fn('Ab'), 29);
  assert.equal(C.BUILTIN_CIPHERS.prime.fn('z'), 101);
  assert.equal(C.BUILTIN_CIPHERS.fibonacci.fn('z'), 121393);
  assert.equal(C.BUILTIN_CIPHERS.master_num.fn('jesus'), 11); // master number kept
  assert.equal(C.BUILTIN_CIPHERS.master_num.fn('kk'), 4);
  assert.equal(C.BUILTIN_CIPHERS.chaldean.fn('abc'), 6);
  assert.equal(C.BUILTIN_CIPHERS.eng_hebrew.fn('t'), 400);
});

test('atbash, albam, mirror', () => {
  assert.equal(C.atbash('abc'), 'zyx');
  assert.equal(C.atbash('sheshach'), 'hsvhszxs');
  assert.equal(C.albam('a'), 'n');
  assert.equal(C.mirrorWord('holy spirit'), 'yloh tirips');
});

test('number words and properties', () => {
  assert.equal(C.numToWords(0), 'zero');
  assert.equal(C.numToWords(21), 'twenty-one');
  assert.equal(C.numToWords(151), 'one hundred fifty-one');
  assert.equal(C.numToWords(6000), 'six thousand');
  assert.equal(C.numToWords(121393), 'one hundred twenty-one thousand three hundred ninety-three');
  assert.equal(C.isPrime(97), true);
  assert.equal(C.isPrime(1), false);
  assert.equal(C.triangularIndex(153), 17);
  assert.equal(C.triangularIndex(10), 4);
  assert.equal(C.triangularIndex(11), 0);
  assert.equal(C.isSquare(441), true);
  assert.equal(C.isFibonacci(144), true);
  assert.equal(C.isPalindrome(151), true);
  assert.deepEqual(C.factorize(666), [2, 3, 3, 37]);
});

test('custom cipher validator rejects dangerous or malformed input', () => {
  assert.equal(C.validateCipherCode('{a:1,b:2}').ok, true);
  assert.equal(C.validateCipherCode('{"__proto__":1}').ok, false);
  assert.equal(C.validateCipherCode('{"constructor":1}').ok, false);
  assert.equal(C.validateCipherCode('[1,2]').ok, false);
  assert.equal(C.validateCipherCode('{"ab":1}').ok, false);
  assert.equal(C.validateCipherCode('{"a":"x"}').ok, false);
  assert.equal(C.validateCipherCode('{"a":-1}').ok, false);
  assert.equal(C.validateCipherCode('{"a":1e12}').ok, false);
  assert.equal(C.validateCipherCode('{').ok, false);
  const r = C.validateCipherCode('{"a":1.5}');
  assert.equal(r.ok, true); assert.equal(r.warnings.length > 0, true);
  const fn = C.buildCustomFn(r.parsed);
  assert.equal(fn('aa'), 4);
  assert.equal(Object.getPrototypeOf(r.parsed) === Object.prototype, true);
});

test('convergence and compatibility scores are bounded', () => {
  const r1 = C.calcWord('love', C.BUILTIN_CIPHERS), r2 = C.calcWord('love', C.BUILTIN_CIPHERS);
  assert.equal(C.compatibilityScore(r1, r2), 100);
  const r3 = C.calcWord('zzzzzz', C.BUILTIN_CIPHERS);
  const s = C.compatibilityScore(r1, r3);
  assert.ok(s >= 0 && s <= 100);
  const conv = C.convScore(r1, new Set(['ordinal', 'reduced', 'chaldean']));
  assert.ok(conv >= 0 && conv <= 0.95);
});

test('cipher tables are frozen', () => {
  assert.equal(Object.isFrozen(C.BUILTIN_CIPHERS), true);
  assert.equal(Object.isFrozen(C.BUILTIN_CIPHERS.ordinal), true);
  assert.throws(() => { 'use strict'; C.BUILTIN_CIPHERS.ordinal.fn = () => 0; });
});
