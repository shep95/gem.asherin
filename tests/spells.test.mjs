import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as W from '../js/spells.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lex = W.parseLexicon(fs.readFileSync(path.join(root, 'data/lexicon.txt'), 'utf8'));
const find = (h, w) => ['anagram', 'sequence', 'inOrder', 'rearranged'].find((k) => h[k].some((x) => x.w === w));

test('lexicon loads and is clean', () => {
  assert.ok(lex.size > 30000, `lexicon has ${lex.size}`);
  for (const w of ['bible', 'lie', 'live', 'vile', 'god', 'dog']) assert.ok(lex.words.includes(w), w);
  for (const bad of ['nigger', 'faggot', 'kike']) assert.ok(!lex.words.includes(bad), bad);
  assert.ok(lex.words.every((w) => /^[a-z]+$/.test(w)));
});

test('bible spells lie, bile and eli', () => {
  const h = W.hiddenWords('bible', lex);
  assert.equal(find(h, 'lie'), 'rearranged');
  assert.equal(find(h, 'bile'), 'inOrder');
  assert.equal(find(h, 'bib'), 'sequence');
  assert.ok(h.rearranged.some((x) => x.w === 'eli' && x.tier === 'n'));
  assert.equal(find(h, 'bible'), undefined, 'the word itself is excluded');
  assert.equal(find(h, 'bibles'), undefined, 'letters cannot be reused beyond their count');
});

test('anagrams and categories', () => {
  const h = W.hiddenWords('evil', lex);
  for (const w of ['live', 'vile', 'veil']) assert.equal(find(h, w), 'anagram', w);
  const g = W.hiddenWords('god', lex);
  assert.equal(find(g, 'dog'), 'anagram');
  const p = W.hiddenWords('the end', lex);
  assert.ok(p.sequence.some((x) => x.w === 'thee' && x.crossesWords === true), 'thee spans th-e|e-nd');
  assert.equal(find(p, 'hen'), 'inOrder', 'h-e-(e)-n skips a letter');
  assert.equal(find(p, 'end'), undefined, 'the input\'s own words are excluded');
});

test('multi-word anagram statements', () => {
  const h = W.hiddenWords('dormitory', lex);
  const all = [...h.anagram, ...h.sequence, ...h.inOrder, ...h.rearranged];
  const r = W.anagramPhrases('dormitory', all);
  assert.ok(r.phrases.includes('dirty room'), r.phrases.join(', '));
  for (const ph of r.phrases) assert.equal([...W.letters(ph)].sort().join(''), [...'dormitory'].sort().join(''), ph);
  assert.equal(W.anagramPhrases('ab', all).phrases.length, 0);
});

test('extras add corpus words and statements', () => {
  const lx = W.withExtras(lex, [{ text: 'uriel', tier: 'c' }, { text: 'let there be light', tier: 's' }]);
  const h = W.hiddenWords('let there be lights everywhere', lx);
  assert.ok([...h.sequence, ...h.inOrder, ...h.rearranged].some((x) => x.label === 'let there be light' && x.tier === 's'));
});

test('vowels in order from first to last', () => {
  const v = W.vowelOrder('bible');
  assert.deepEqual(v.sequence, ['i', 'e']);
  assert.equal(v.consonants, 'bbl');
  assert.equal(v.pattern, 'CVCCV');
  assert.deepEqual(v.positions, [2, 5]);
  const f = W.vowelOrder('facetious');
  assert.equal(f.vowels, 'aeiou');
  assert.equal(f.allFive, true);
  assert.equal(f.alphabetical, true);
  const p = W.vowelOrder('in the beginning');
  assert.equal(p.vowels, 'ieeii');
  assert.equal(p.perWord.length, 3);
  assert.deepEqual(p.firstAppearance, ['i', 'e']);
  const y = W.vowelOrder('myth yes');
  assert.equal(y.vowels, 'e');
  assert.equal(y.vowelsWithY, 'ye');
  assert.equal(y.hasY, true);
  assert.equal(W.vowelOrder('').total, 0);
  assert.equal(W.vowelOrder('café').vowels, 'ae');
});
