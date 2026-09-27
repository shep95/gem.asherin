import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORPUS, CORPUS_SIZE, DOMAIN_ORDER, DOMAIN_LABELS, findByOrdinal, findByReduced, findWord } from '../js/data/corpus.mjs';
import { CORPUS_BASE } from '../js/data/corpus-base.mjs';
import * as K from '../js/data/index.mjs';
import { BUILTIN_CIPHERS, ds, lettersOnly } from '../js/ciphers.mjs';
import { computeIntegrity } from '../tools/build-integrity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('base corpus values match the ordinal cipher', () => {
  for (const it of CORPUS_BASE) {
    const o = BUILTIN_CIPHERS.ordinal.fn(lettersOnly(it.w.replace(/_/g, ' ')));
    assert.equal(o, it.o, it.w);
    assert.equal(ds(o), it.r, it.w);
  }
});

test('merged corpus is large, de-duplicated and consistent', () => {
  assert.ok(CORPUS_SIZE >= 700, `corpus has ${CORPUS_SIZE}`);
  const seen = new Set();
  for (const it of CORPUS) {
    assert.ok(DOMAIN_ORDER.includes(it.d), `unknown domain ${it.d} for ${it.w}`);
    assert.ok(DOMAIN_LABELS[it.d]);
    assert.equal(it.o, BUILTIN_CIPHERS.ordinal.fn(lettersOnly(it.w)));
    assert.equal(it.r, ds(it.o));
    assert.ok(!seen.has(it.w + '|' + it.d), 'duplicate ' + it.w);
    seen.add(it.w + '|' + it.d);
    assert.ok(typeof it.n === 'string' && it.n.length > 0);
  }
});

test('lookups', () => {
  assert.ok(findByOrdinal(74).some((i) => i.w === 'jesus'));
  assert.ok(!findByOrdinal(74, 'jesus').some((i) => i.w === 'jesus'));
  assert.ok(findByReduced(2).length > 10);
  assert.equal(findWord('Uriel').w, 'uriel');
  assert.equal(findWord('nope-not-here'), null);
});

test('knowledge tables are frozen and well-formed', () => {
  assert.equal(Object.isFrozen(K.ETYMOLOGY), true);
  assert.equal(Object.isFrozen(K.TRADITIONS), true);
  for (const [w, e] of Object.entries(K.ETYMOLOGY)) {
    assert.ok(Array.isArray(e.parts) && e.parts.length, w);
    for (const p of e.parts) { assert.ok(p.p && Array.isArray(p.ch), w); for (const s of p.ch) assert.ok(s.l && s.w && s.m, w); }
    assert.ok(e.syn, w);
  }
  for (const [w, t] of Object.entries(K.TRADITIONS)) for (const k of ['hebrew', 'biblical', 'greek', 'occult']) {
    assert.ok(typeof t[k] === 'string' && t[k].length > 20, `${w}.${k}`);
    assert.ok(!/<(?!\/?em>)/.test(t[k]), `${w}.${k} contains a tag other than <em>`);
  }
  assert.ok(K.SUGGESTED.length >= 8);
  for (const s of K.SUGGESTED) assert.ok(K.ETYMOLOGY[s] && K.TRADITIONS[s], s);
  assert.equal(K.HEB_LETTERS.length, 22);
  assert.equal(K.SEFIROT.length, 10);
  assert.equal(Object.keys(K.TAROT_MAJOR).length, 22);
  assert.ok(Object.keys(K.SCRIPTURE_REFS).length >= 50);
  assert.ok(Object.keys(K.CIPHER_NOTES).length >= Object.keys(BUILTIN_CIPHERS).length - 1);
});

test('every built-in cipher has a note', () => {
  for (const k of Object.keys(BUILTIN_CIPHERS)) assert.ok(K.CIPHER_NOTES[k], `missing note for ${k}`);
});

test('integrity.json is current', () => {
  const manifestPath = path.join(root, 'integrity.json');
  assert.ok(fs.existsSync(manifestPath), 'run: npm run integrity');
  const onDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const fresh = computeIntegrity();
  assert.deepEqual(onDisk.files, fresh.files, 'integrity.json is stale — run: npm run integrity');
});

test('service worker precache list only names files that exist', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const list = /const PRECACHE = \[([\s\S]*?)\];/.exec(sw)[1];
  const files = [...list.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter((f) => f !== '');
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f)), `precache entry missing on disk: ${f}`);
});

test('no inline event handlers or inline scripts in index.html', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'inline handler found');
  assert.ok(!/<script(?![^>]*\ssrc=)(?![^>]*type="application\/ld\+json")/i.test(html), 'inline script found');
  assert.ok(!/\sstyle\s*=/i.test(html), 'inline style attribute found');
  assert.ok(/require-trusted-types-for 'script'/.test(html));
  assert.ok(!/unsafe-inline|unsafe-eval/.test(html));
});
