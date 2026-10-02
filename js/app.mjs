// ── Uriel — application ───────────────────────────────────────────────────────
// UI state, rendering and event wiring. All markup is built as strings with
// esc()/escEm() and written through setHTML() (allowlist sanitizer + Trusted
// Types). There are no inline event handlers: every control carries a
// data-action attribute handled by one delegated listener.
import { CONFIG } from './config.mjs';
import * as C from './ciphers.mjs';
import { CORPUS, CORPUS_SIZE, DOMAIN_ORDER, DOMAIN_LABELS, findByOrdinal, findByReduced, findWord, groupByDomain } from './data/corpus.mjs';
import * as K from './data/index.mjs';
import * as Store from './storage.mjs';
import { streamAI, cancelAllStreams, hasApiKey, PROMPTS } from './ai.mjs';
import { lookupDictionary, lookupWikipedia, lookupVerse, extractReference } from './sources.mjs';
import { setBackgroundFile, resetPalette } from './theme.mjs';
import * as Music from './music.mjs';
import { setHTML, esc, escEm, swURL } from './sanitize.mjs';
import { renderStructure, ENTITY_KINDS } from './structure-ui.mjs';
import { parseDate, validCoord } from './structure.mjs';
import { vowelHTML, hiddenHTML, loadLexicon } from './spells-ui.mjs';
import { vowelOrder } from './spells.mjs';

const $ = (id) => document.getElementById(id);
const UNTRUSTED = document.documentElement.hasAttribute('data-untrusted-host');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth <= 680;

// ── state ─────────────────────────────────────────────────────────────────────
const STATE = {
  mode: 'biblical',
  traditions: { hebrew: true, biblical: true, greek: true, occult: false },
  layers: { etym: true, trad: true, root: true, phrase: true, conv: true, letters: true, sefirot: false, tarot: false, scripture: true, sources: true, structure: true, spells: true },
  entities: [], // structure-layer workbench: { id, label, kind, text, date, lat, lon, coordSource }
  structCipher: '', // '' = the primary cipher of the current word
  religions: { christianity: true, judaism: true, islam: false, hinduism: false, buddhism: false, taoism: false, zoroastrianism: false, sikhism: false },
  activeCiphers: new Set(['ordinal', 'reduced', 'chaldean', 'agrippa', 'hebrew', 'greek']),
  customCiphers: {},
  history: [],
  compare: [],
  trajectory: [],
  currentWord: '',
  activeTab: 'numbers',
  sidebarW: 256,
  musicAutostart: false,
  sources: true,
  aiKey: false,
  online: navigator.onLine,
  mobilePanel: 'main',
};
const MODE_PRESETS = Object.freeze({
  biblical: { traditions: { hebrew: true, biblical: true, greek: true, occult: false }, ciphers: ['ordinal', 'reduced', 'chaldean', 'agrippa', 'mispar_katan', 'hebrew', 'greek'], layers: { sefirot: false, tarot: false, scripture: true, letters: true } },
  occult: { traditions: { hebrew: false, biblical: false, greek: true, occult: true }, ciphers: ['ordinal', 'reduced', 'english_std', 'agrippa', 'eq_crowley', 'satanic', 'fibonacci', 'hebrew', 'greek'], layers: { sefirot: true, tarot: true, scripture: false, letters: false } },
  scholar: { traditions: { hebrew: true, biblical: true, greek: true, occult: true }, ciphers: ['ordinal', 'reduced', 'english_std', 'chaldean', 'agrippa', 'prime', 'eng_hebrew', 'hebrew', 'greek'], layers: { sefirot: true, tarot: false, scripture: true, letters: true } },
});
const RELIGION_DOMAINS = Object.freeze({ christianity: ['biblical'], judaism: ['hebrew'], islam: ['islamic'], hinduism: ['eastern'], buddhism: ['eastern'], taoism: ['eastern'], zoroastrianism: ['eastern'], sikhism: ['eastern'] });
const ALWAYS_DOMAINS = ['angelic', 'cosmos', 'virtue', 'society', 'numerical'];
const GREEK_LETTERS = Object.freeze([[900, 'ϡ', 'sampi'], [800, 'ω', 'omega'], [700, 'ψ', 'psi'], [600, 'χ', 'chi'], [500, 'φ', 'phi'], [400, 'υ', 'upsilon'], [300, 'τ', 'tau'], [200, 'σ', 'sigma'], [100, 'ρ', 'rho'], [90, 'ϙ', 'koppa'], [80, 'π', 'pi'], [70, 'ο', 'omicron'], [60, 'ξ', 'xi'], [50, 'ν', 'nu'], [40, 'μ', 'mu'], [30, 'λ', 'lambda'], [20, 'κ', 'kappa'], [10, 'ι', 'iota'], [9, 'θ', 'theta'], [8, 'η', 'eta'], [7, 'ζ', 'zeta'], [6, 'ϛ', 'stigma'], [5, 'ε', 'epsilon'], [4, 'δ', 'delta'], [3, 'γ', 'gamma'], [2, 'β', 'beta'], [1, 'α', 'alpha']]);
const HEB_DESC = [...K.HEB_LETTERS].sort((a, b) => b.v - a.v);

// ── helpers ───────────────────────────────────────────────────────────────────
const safeWord = (s) => String(s ?? '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s\-']/gu, '').replace(/\s+/g, ' ').trim().slice(0, CONFIG.limits.maxInput);
const getAllCiphers = () => ({ ...C.BUILTIN_CIPHERS, ...STATE.customCiphers });
const cipherName = (k) => getAllCiphers()[k]?.name || k;
const setPressed = (el, on) => { if (!el) return; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on ? 'true' : 'false'); };
const hostBlocksNetwork = () => UNTRUSTED;
let toastTimer = null;
function toast(msg, { label, onClick, ms = 3200 } = {}) {
  const t = $('toast');
  if (!t) return;
  t.replaceChildren(document.createTextNode(msg));
  if (label && onClick) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => { onClick(); t.hidden = true; }); t.appendChild(b); }
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, label ? ms * 3 : ms);
}
function visibleDomains() {
  const s = new Set(ALWAYS_DOMAINS);
  for (const [t, on] of Object.entries(STATE.traditions)) if (on) s.add(t);
  for (const [r, on] of Object.entries(STATE.religions)) if (on) RELIGION_DOMAINS[r]?.forEach((d) => s.add(d));
  return s;
}
function decompose(n, table) { // greedy letters for a number — table: [[value, sym, name]] desc
  if (n <= 0 || n > 9999) return [];
  const out = []; let x = n;
  for (const [v, sym, name] of table) while (x >= v && out.length < 14) { out.push({ v, sym, name }); x -= v; }
  return x === 0 ? out : [];
}
function numberProps(n) {
  const p = [];
  if (n < 2) return p;
  if (C.isPrime(n)) p.push(['prime', 'indivisible']);
  const t = C.triangularIndex(n); if (t) p.push(['triangular', `T(${t}) = 1+…+${t}`]);
  if (C.isSquare(n)) p.push(['square', `${Math.round(Math.sqrt(n))}²`]);
  if (C.isFibonacci(n)) p.push(['fibonacci', 'on the growth sequence']);
  if (C.isPalindrome(n)) p.push(['palindrome', 'reads both ways']);
  if (n % 7 === 0) p.push(['÷ 7', `${n / 7} × 7`]);
  if (n % 12 === 0) p.push(['÷ 12', `${n / 12} × 12`]);
  if (n % 26 === 0) p.push(['÷ 26', `${n / 26} × yhwh`]);
  if (n % 72 === 0) p.push(['÷ 72', `${n / 72} × 72`]);
  const f = C.factorize(n); if (f.length > 1) p.push(['factors', f.join(' × ')]);
  return p;
}
function unreducedMeaning(n) {
  if (K.NUMBER_MEANINGS[n]) return K.NUMBER_MEANINGS[n];
  for (const [b, l] of [[72, 'multiple of 72 (names of god)'], [26, 'multiple of 26 (yhwh)'], [13, 'multiple of 13 (echad · ahavah)'], [7, 'multiple of 7 (sacred seventh)'], [12, 'multiple of 12 (cosmic order)'], [9, 'multiple of 9 (completion)'], [11, 'multiple of 11 (master number)']]) {
    if (n > b && n % b === 0) return `${l} — ${n / b} × ${b}`;
  }
  if (C.isPrime(n)) return `prime number — indivisible, self-contained — primes carry special weight in number mysticism`;
  const t = C.triangularIndex(n); if (t) return `triangular number T(${t}) — sum of 1 to ${t} — associated with perfect accumulation`;
  return null;
}

// ── cipher list ───────────────────────────────────────────────────────────────
function rebuildCipherList() {
  const list = $('cipher-list');
  if (!list) return;
  const all = getAllCiphers();
  const byTier = { 1: [], 2: [], 3: [], custom: [] };
  for (const [k, c] of Object.entries(all)) (STATE.customCiphers[k] ? byTier.custom : byTier[c.tier] || byTier[3]).push([k, c]);
  const frag = document.createDocumentFragment();
  const word = C.lettersOnly(STATE.currentWord);
  for (const tier of ['1', '2', '3', 'custom']) {
    const group = byTier[tier];
    if (!group.length) continue;
    const lbl = document.createElement('div'); lbl.className = 'cipher-tier-lbl'; lbl.textContent = C.TIER_LABELS[tier]; frag.appendChild(lbl);
    for (const [k, c] of group) {
      const row = document.createElement('div');
      row.className = 'c-item' + (STATE.activeCiphers.has(k) ? ' on' : '') + (word && !C.cipherApplies(c, word) ? ' na' : '');
      row.dataset.c = k; row.setAttribute('role', 'checkbox'); row.setAttribute('aria-checked', STATE.activeCiphers.has(k) ? 'true' : 'false'); row.tabIndex = 0;
      const dot = document.createElement('div'); dot.className = 'c-dot'; dot.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.className = 'c-name'; name.textContent = c.name;
      row.append(dot, name);
      if (c.script && c.script !== 'latin' && c.script !== 'any') { const s = document.createElement('span'); s.className = 'c-script'; s.textContent = c.script; row.appendChild(s); }
      if (K.CIPHER_NOTES[k]) { const tip = document.createElement('div'); tip.className = 'cipher-tooltip'; tip.setAttribute('role', 'tooltip'); tip.textContent = K.CIPHER_NOTES[k]; row.appendChild(tip); }
      const val = document.createElement('span'); val.className = 'c-val'; val.id = 'cv-' + k; val.textContent = '—'; row.appendChild(val);
      if (STATE.customCiphers[k]) { const del = document.createElement('button'); del.type = 'button'; del.className = 'c-del'; del.textContent = '×'; del.title = 'remove'; del.dataset.action = 'remove-cipher'; del.dataset.c = k; row.appendChild(del); }
      frag.appendChild(row);
    }
  }
  list.replaceChildren(frag);
  updateSidebarVals(STATE.currentWord);
}
function toggleCipher(k) {
  const row = document.querySelector(`.c-item[data-c="${CSS.escape(k)}"]`);
  if (STATE.activeCiphers.has(k)) { if (STATE.activeCiphers.size <= 1) { toast('keep at least one cipher active'); return; } STATE.activeCiphers.delete(k); }
  else STATE.activeCiphers.add(k);
  if (row) { row.classList.toggle('on', STATE.activeCiphers.has(k)); row.setAttribute('aria-checked', STATE.activeCiphers.has(k) ? 'true' : 'false'); }
  if (STATE.currentWord) analyze({ silent: true });
}
function updateSidebarVals(word) {
  const w = C.lettersOnly(word);
  const all = getAllCiphers();
  const r = w ? C.calcWord(w, all) : null;
  for (const k of Object.keys(all)) {
    const el = $('cv-' + k); if (!el) continue;
    el.textContent = r && r[k].applies ? String(r[k].v) : '—';
    el.closest('.c-item')?.classList.toggle('na', Boolean(r) && !r[k].applies);
  }
}

// ── modes / settings ──────────────────────────────────────────────────────────
function applyMode(m) {
  const p = MODE_PRESETS[m]; if (!p) return;
  STATE.mode = m;
  STATE.traditions = { ...p.traditions };
  STATE.activeCiphers = new Set([...p.ciphers, ...Object.keys(STATE.customCiphers)]);
  Object.assign(STATE.layers, p.layers);
  syncSettingsUI();
  rebuildCipherList();
  if (STATE.currentWord) analyze({ silent: true });
}
function syncSettingsUI() {
  document.querySelectorAll('.mode-pill').forEach((b) => setPressed(b, b.dataset.m === STATE.mode));
  document.querySelectorAll('[data-modetog]').forEach((b) => b.classList.toggle('on', b.dataset.modetog === STATE.mode));
  for (const [k, v] of Object.entries(STATE.layers)) { const el = $('sl-' + k) || (k === 'sources' ? $('sl-sourcesLayer') : null); if (el) el.classList.toggle('on', !!v); }
  for (const [k, v] of Object.entries(STATE.traditions)) { $('st-' + k)?.classList.toggle('on', !!v); }
  document.querySelectorAll('.trad-btn[data-t]').forEach((b) => { setPressed(b, !!STATE.traditions[b.dataset.t]); });
  document.querySelectorAll('.trad-btn[data-rel]').forEach((b) => setPressed(b, !!STATE.religions[b.dataset.rel]));
  $('sl-music')?.classList.toggle('on', !!STATE.musicAutostart);
  $('sl-music')?.setAttribute('aria-pressed', STATE.musicAutostart ? 'true' : 'false');
  $('sl-sources')?.classList.toggle('on', !!STATE.sources);
  $('sl-sources')?.setAttribute('aria-pressed', STATE.sources ? 'true' : 'false');
  $('music-player')?.classList.toggle('hidden', !STATE.musicAutostart);
}
let lastFocus = null;
function openSettings() {
  syncSettingsUI(); refreshKeyStatus();
  lastFocus = document.activeElement;
  $('settings-overlay').hidden = false;
  $('settings-overlay').querySelector('.sp-close')?.focus();
}
function closeSettings() { $('settings-overlay').hidden = true; lastFocus?.focus?.(); }
async function refreshKeyStatus() {
  const el = $('key-status'); if (!el) return;
  STATE.aiKey = await hasApiKey();
  el.className = 'key-status' + (STATE.aiKey ? ' ok' : '');
  el.textContent = STATE.aiKey ? 'key stored on this device — live readings on' : 'no key stored — offline readings only';
}

// ── session persistence ───────────────────────────────────────────────────────
function buildSaveData() {
  return {
    v: 2, mode: STATE.mode, traditions: { ...STATE.traditions }, layers: { ...STATE.layers }, religions: { ...STATE.religions },
    activeCiphers: [...STATE.activeCiphers],
    customCiphers: Object.fromEntries(Object.entries(STATE.customCiphers).map(([k, c]) => [k, { name: c.name, map: c.map }])),
    history: STATE.history.slice(0, CONFIG.limits.maxHistory), musicAutostart: STATE.musicAutostart, sources: STATE.sources, sidebarW: STATE.sidebarW, savedAt: Date.now(),
    entities: STATE.entities.slice(0, 24), structCipher: STATE.structCipher,
  };
}
const isPlainObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
function applyBools(target, src) { if (!isPlainObj(src)) return; for (const k of Object.keys(target)) if (typeof src[k] === 'boolean') target[k] = src[k]; }
async function saveSession() {
  const ok = await Store.saveSessionData(buildSaveData());
  const b = $('save-btn'); if (b) { b.textContent = ok ? 'saved ✓' : 'save failed'; setTimeout(() => { b.textContent = 'save session'; }, 2000); }
  if (!ok) toast('could not save — storage blocked or full');
}
async function loadSession({ quiet } = {}) {
  const d = await Store.loadSessionData();
  if (!isPlainObj(d) || d.v !== 2) { if (!quiet) toast('no saved session on this device'); return false; }
  if (typeof d.mode === 'string' && MODE_PRESETS[d.mode]) STATE.mode = d.mode;
  applyBools(STATE.traditions, d.traditions); applyBools(STATE.layers, d.layers); applyBools(STATE.religions, d.religions);
  STATE.customCiphers = {};
  if (isPlainObj(d.customCiphers)) {
    for (const [k, c] of Object.entries(d.customCiphers).slice(0, 12)) {
      if (!/^custom_\d{1,16}$/.test(k) || !isPlainObj(c) || !isPlainObj(c.map)) continue;
      const v = C.validateCipherCode(JSON.stringify(c.map));
      if (!v.ok) continue;
      STATE.customCiphers[k] = { name: safeWord(c.name).slice(0, 50) || 'custom cipher', desc: 'user-defined', region: 'custom', tier: 'custom', script: 'latin', map: v.parsed, fn: C.buildCustomFn(v.parsed) };
    }
  }
  const all = getAllCiphers();
  if (Array.isArray(d.activeCiphers)) { const s = new Set(d.activeCiphers.filter((k) => typeof k === 'string' && k in all)); if (s.size) STATE.activeCiphers = s; }
  if (Array.isArray(d.history)) STATE.history = d.history.filter((h) => isPlainObj(h) && typeof h.word === 'string' && Number.isFinite(h.val)).map((h) => ({ word: safeWord(h.word), val: Math.round(h.val) })).filter((h) => h.word).slice(0, CONFIG.limits.maxHistory);
  if (typeof d.musicAutostart === 'boolean') STATE.musicAutostart = d.musicAutostart;
  if (typeof d.sources === 'boolean') STATE.sources = d.sources;
  if (Array.isArray(d.entities)) STATE.entities = d.entities.map(sanitizeEntity).filter(Boolean).slice(0, 24);
  if (typeof d.structCipher === 'string' && (d.structCipher === '' || d.structCipher in all)) STATE.structCipher = d.structCipher;
  if (Number.isFinite(d.sidebarW) && d.sidebarW >= 180 && d.sidebarW <= 420) setSidebarWidth(d.sidebarW);
  syncSettingsUI(); rebuildCipherList(); renderHistory();
  if (STATE.musicAutostart) $('music-player')?.classList.remove('hidden');
  if (STATE.currentWord) analyze({ silent: true });
  if (!quiet) toast('session restored');
  return true;
}
async function clearSession() {
  Store.clearSessionData();
  const b = $('clear-btn'); if (b) { b.textContent = 'cleared'; setTimeout(() => { b.textContent = 'clear data'; }, 2000); }
}

// ── history / suggestions ─────────────────────────────────────────────────────
function histRow(word, val, cls) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'hist-row' + (cls ? ' ' + cls : '') + (word === STATE.currentWord ? ' on' : '');
  b.dataset.action = 'analyze-word'; b.dataset.w = word;
  const s1 = document.createElement('span'); s1.className = 'hist-word'; s1.textContent = word; b.appendChild(s1);
  if (val !== undefined) { const s2 = document.createElement('span'); s2.className = 'hist-num'; s2.textContent = String(val); b.appendChild(s2); }
  return b;
}
function renderHistory() {
  const list = $('hist-list'), empty = $('hist-empty');
  list.querySelectorAll('.hist-row').forEach((r) => r.remove());
  empty.hidden = STATE.history.length > 0;
  const frag = document.createDocumentFragment();
  STATE.history.forEach((h) => frag.appendChild(histRow(h.word, h.val)));
  list.appendChild(frag);
}
function renderSuggestions() {
  const list = $('sug-list'); if (!list) return;
  const frag = document.createDocumentFragment();
  K.SUGGESTED.forEach((w) => frag.appendChild(histRow(w, undefined, 'sug')));
  list.replaceChildren(frag);
  const tw = $('try-words');
  if (tw) { const f2 = document.createDocumentFragment(); K.SUGGESTED.forEach((w) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.action = 'analyze-word'; b.dataset.w = w; b.textContent = w; f2.appendChild(b); }); tw.replaceChildren(f2); }
}

// ── analysis ──────────────────────────────────────────────────────────────────
let urlTimer = null;
function updateUrl(word) {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    try {
      const u = new URL(location.href);
      if (word) u.searchParams.set('q', word); else u.searchParams.delete('q');
      u.searchParams.delete('source');
      history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
      const rr = C.calcWord(word, C.BUILTIN_CIPHERS); const pv = (C.detectScripts(word).includes('latin') ? rr.ordinal : C.detectScripts(word).includes('hebrew') ? rr.hebrew : rr.greek).v;
      document.title = word ? `${word} · ${pv} — Uriel gematria` : 'Uriel — Gematria Calculator & Engine · Hebrew, Greek and English Ciphers';
    } catch { /* ignore */ }
  }, 300);
}
function showEmpty() {
  STATE.currentWord = '';
  cancelAllStreams();
  $('m-empty').hidden = false;
  const res = $('result'); res.hidden = true; res.classList.remove('stale'); res.replaceChildren();
  $('split-view').hidden = true;
  updateSidebarVals(''); updateUrl('');
  document.querySelectorAll('.hist-row').forEach((r) => r.classList.remove('on'));
}
function analyze({ silent = false } = {}) {
  const raw = safeWord($('main-input').value);
  if (!raw) { showEmpty(); return; }
  cancelAllStreams();
  STATE.currentWord = raw;
  const all = getAllCiphers();
  updateSidebarVals(raw);
  if (!silent) {
    if (!STATE.history.find((h) => h.word === raw)) {
      const r = C.calcWord(raw, all);
      const sc = C.detectScripts(raw);
      STATE.history.unshift({ word: raw, val: (sc.includes('latin') ? r.ordinal : sc.includes('hebrew') ? r.hebrew : sc.includes('greek') ? r.greek : r.ordinal).v });
      if (STATE.history.length > CONFIG.limits.maxHistory) STATE.history.length = CONFIG.limits.maxHistory;
      renderHistory();
    }
    document.querySelectorAll('.hist-row').forEach((r) => r.classList.toggle('on', r.dataset.w === raw));
    if (isMobile()) showPanel('main');
    updateUrl(raw);
  }
  renderResult(raw, all);
  if (!$('split-view').hidden) renderSplitView();
}

function buildMirrorTooltip(raw, etym, results) {
  const mirror = C.mirrorWord(raw);
  const layers = [
    { d: '0', l: 'surface', c: `mirror of “${raw}” — the word reversed` },
    { d: '1', l: 'atbash', c: `atbash mirror: ${C.atbash(C.lettersOnly(raw))} — the shadow encoding (jeremiah 25:26)` },
    { d: '2', l: 'albam', c: `albam mirror: ${C.albam(C.lettersOnly(raw))} — alphabet halved and folded` },
    { d: '3', l: 'morphology', c: etym ? etym.parts.map((p) => p.p).join(' + ') + ' — reversed: ' + etym.parts.map((p) => [...p.p].reverse().join('')).join(' + ') : 'decompose morphemes then read backwards' },
    { d: '4', l: 'numerical', c: `ordinal → ${results.ordinal.v} (same forwards and backwards)` },
    { d: '5', l: 'tradition', c: 'in kabbalah, reversal reveals the concealed face (panim v’achor). the mirror of a word shows its shadow-meaning.' },
    { d: '∞', l: 'root', c: etym?.root ? `shadow root: the inverse of “${etym.root}”` : 'the mirror principle: every word encodes its opposite' },
  ];
  return `<div class="mirror-tooltip" role="tooltip"><div class="mirror-tooltip-head"><span class="mt-mirror-word">${esc(mirror)}</span><span class="mt-label">tap / hover — surface to root</span></div>`
    + layers.map((r) => `<div class="mirror-tooltip-row"><span class="mt-depth">${esc(r.d)}</span><span class="mt-layer">${esc(r.l)}</span><span class="mt-content">${esc(r.c)}</span></div>`).join('') + '</div>';
}

function offlineReading(t, raw, results, dominantRd, primary = results.ordinal) {
  const v = primary.v, rd = primary.rd;
  const scripts = C.detectScripts(raw);
  const parts = [];
  if (t === 'hebrew') {
    if (scripts.includes('hebrew')) parts.push(`the hebrew letters of <em>${esc(raw)}</em> sum to <em>${results.hebrew.v}</em> by mispar hechrachi (reduced ${results.hebrew.rd})${results.hebrew_gadol && results.hebrew_gadol.v !== results.hebrew.v ? `, or ${results.hebrew_gadol.v} by mispar gadol` : ''}.`);
    const dec = decompose(v, HEB_DESC.map((l) => [l.v, l.sym, l.n]));
    if (dec.length) {
      parts.push(`the value ${v} written in hebrew letters is <span class="heb">${esc(dec.map((d) => d.sym).join(''))}</span> — ${dec.map((d) => `${esc(d.name.toLowerCase())} (${d.v})`).join(' + ')}.`);
      const meanings = [...new Map(dec.map((d) => [d.sym, K.HEB_LETTERS.find((l) => l.sym === d.sym)])).values()].filter(Boolean).slice(0, 4);
      parts.push(meanings.map((l) => `<em>${esc(l.n.toLowerCase())}</em>: ${esc(l.m)}`).join(' · ') + '.');
    }
    if (K.NUMBER_MEANINGS[v]) parts.push(`in the number traditions ${v} is ${esc(K.NUMBER_MEANINGS[v])}.`);
    parts.push(`reduced to ${rd}: ${esc(K.NUM_MEAN[rd] || '')}.`);
  } else if (t === 'biblical') {
    const refs = [...new Set([v, rd])].map((n) => K.SCRIPTURE_REFS[n] ? `<em>${n}</em> — ${esc(K.SCRIPTURE_REFS[n])}` : null).filter(Boolean);
    if (refs.length) parts.push('scripture numbers: ' + refs.join('; ') + '.');
    const um = unreducedMeaning(v);
    if (um && !K.SCRIPTURE_REFS[v]) parts.push(`the value ${v}: ${esc(um)}.`);
    const hit = findWord(raw);
    if (hit) parts.push(`in the corpus <em>${esc(hit.w)}</em> is listed under ${esc(DOMAIN_LABELS[hit.d] || hit.d)}: ${esc(hit.n)}.`);
    const same = findByOrdinal(v, raw).filter((m) => m.d === 'biblical').slice(0, 5);
    if (same.length) parts.push(`biblical words sharing ${v}: ${same.map((m) => `<em>${esc(m.w)}</em>`).join(', ')}.`);
    if (!parts.length) parts.push(`no documented scripture number for ${v}. reduced to ${rd}: ${esc(K.NUM_MEAN[rd] || '')}.`);
  } else if (t === 'greek') {
    if (scripts.includes('greek')) parts.push(`by isopsephy the greek letters of <em>${esc(raw)}</em> sum to <em>${results.greek.v}</em> (reduced ${results.greek.rd}).`);
    const dec = decompose(v, GREEK_LETTERS);
    if (dec.length) parts.push(`written as greek numerals, ${v} is <span class="heb">${esc(dec.map((d) => d.sym).join(''))}</span> — ${dec.map((d) => `${d.name} (${d.v})`).join(' + ')}.`);
    const props = numberProps(v).slice(0, 3);
    if (props.length) parts.push(`the pythagoreans would note that ${v} is ${props.map(([a, b]) => `${esc(a)} (${esc(b)})`).join(', ')}.`);
    const same = findByOrdinal(v, raw).filter((m) => m.d === 'greek').slice(0, 5);
    if (same.length) parts.push(`greek terms sharing ${v}: ${same.map((m) => `<em>${esc(m.w)}</em>`).join(', ')}.`);
    parts.push(`the monad-to-ennead reading of ${rd}: ${esc(K.NUM_MEAN[rd] || '')}.`);
  } else if (t === 'occult') {
    const sef = K.SEFIROT.find((s) => s.v === dominantRd) || K.SEFIROT.find((s) => s.v === rd);
    if (sef) parts.push(`on the tree of life the dominant reduced value ${sef.v} is <em>${esc(sef.n.toLowerCase())}</em> — ${esc(sef.m)}.`);
    const tar = K.TAROT_MAJOR[dominantRd]; if (tar) parts.push(`tarot: arcanum ${dominantRd}, ${esc(tar)}.`);
    const t22 = v <= 21 ? K.TAROT_MAJOR[v] : null; if (t22 && v !== dominantRd) parts.push(`the unreduced ${v} is also arcanum ${v}, ${esc(t22)}.`);
    if (results.master_num && [11, 22, 33].includes(results.master_num.v)) parts.push(`<em>${results.master_num.v}</em> is a master number — left unreduced in the pythagorean tradition.`);
    const same = findByOrdinal(v, raw).filter((m) => m.d === 'occult').slice(0, 5);
    if (same.length) parts.push(`hermetic terms sharing ${v}: ${same.map((m) => `<em>${esc(m.w)}</em>`).join(', ')}.`);
    if (!parts.length) parts.push(`no hermetic correspondence documented for ${v}; reduced ${rd}: ${esc(K.NUM_MEAN[rd] || '')}.`);
  }
  return parts.join(' ');
}

function renderResult(raw, all) {
  const words = raw.split(' ');
  const isPhrase = words.length > 1;
  const results = C.calcWord(raw, all);
  const active = (k) => STATE.activeCiphers.has(k) && results[k]?.applies && !(STATE.mode === 'biblical' && k === 'satanic');
  const phraseData = isPhrase ? words.map((w) => ({ word: w, vals: C.calcWord(w, all) })) : null;
  const key = raw.toLowerCase();
  const etym = K.ETYMOLOGY[key] || null;
  const tradR = K.TRADITIONS[key] || null;
  const activeKeys = new Set(Object.keys(results).filter(active));
  const conv = C.convScore(results, activeKeys);
  const rdVals = [...activeKeys].map((k) => results[k].rd);
  const freq = {}; rdVals.forEach((x) => { freq[x] = (freq[x] || 0) + 1; });
  const sortedRd = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const dominantRd = sortedRd.length ? parseInt(sortedRd[0][0], 10) : results.ordinal.rd;
  const maxVal = Math.max(1, ...[...activeKeys].map((k) => results[k].v));
  const scripts = C.detectScripts(raw);
  // primary value: ordinal for latin text; the native script cipher for hebrew / greek only input
  const primaryKey = !scripts.includes('latin') && scripts.includes('hebrew') ? 'hebrew' : !scripts.includes('latin') && scripts.includes('greek') ? 'greek' : 'ordinal';
  const primary = results[primaryKey];

  // numbers
  let numCards = '';
  for (const k of activeKeys) {
    const r = results[k];
    numCards += `<div class="num-card"><div class="num-card-name" title="${esc(cipherName(k))}">${esc(cipherName(k))}</div><div class="num-card-val">${r.v}</div><div class="num-card-word">${esc(C.numToWords(r.v))}</div><div class="num-card-red">→ ${r.rd} · ${esc(C.numToWords(r.rd))}</div><div class="num-card-bar"><div class="num-card-fill" data-pct="${Math.round(r.v / maxVal * 100)}"></div></div></div>`;
  }
  const props = numberProps(primary.v);
  const propsHTML = props.length ? `<div><div class="sec-lbl mt">number properties of ${primary.v}</div><div class="props">${props.map(([a, b]) => `<span class="prop"><b>${esc(a)}</b> ${esc(b)}</span>`).join('')}</div></div>` : '';
  const um = unreducedMeaning(primary.v);
  const unreducedHTML = `<div class="sec-lbl mt">${esc(cipherName(primaryKey))} value: ${primary.v}</div><div class="unred-block">${um ? `<div class="unred-meaning">${esc(um)}</div>` : `<div class="unred-meaning dim">no documented cross-traditional significance found for ${primary.v}</div>`}<div class="unred-note">unreduced value carries direct significance in sacred number traditions. reduction to ${primary.rd} gives the archetypal quality; ${primary.v} gives the specific historical and textual context.</div></div>`;
  let convHTML = '';
  if (STATE.layers.conv) { const pct = Math.round(conv * 100); const cls = conv > 0.6 ? 'hi' : conv > 0.3 ? 'mid' : 'lo'; convHTML = `<div class="stat-row"><span class="stat-lbl">cipher convergence</span><div class="stat-bar"><div class="stat-fill" data-pct="${pct}"></div></div><span class="stat-val ${cls}">${pct}%</span></div><div class="note">dominant reduced: <b>${dominantRd}</b> — ${esc(K.NUM_MEAN[dominantRd] || '')}</div>`; }
  let letterHTML = '';
  if (STATE.layers.letters) { const m = K.HEB_LETTERS.filter((l) => rdVals.includes(l.v) || l.v === primary.rd || l.v === primary.v); if (m.length) letterHTML = `<div><div class="sec-lbl">hebrew letter correspondences</div><div class="letter-grid">${m.map((l) => `<div class="letter-card"><div class="letter-sym">${esc(l.sym)}</div><div class="letter-name">${esc(l.n)} (${l.v})</div><div class="letter-mean">${esc(l.m)}</div></div>`).join('')}</div></div>`; }
  let scriptureHTML = '';
  let scriptureHits = [];
  if (STATE.layers.scripture) {
    const vals = [...new Set([...activeKeys].flatMap((k) => [results[k].v, results[k].rd]))];
    scriptureHits = vals.filter((x) => K.SCRIPTURE_REFS[x]).map((x) => ({ v: x, t: K.SCRIPTURE_REFS[x] }));
    if (scriptureHits.length) scriptureHTML = `<div><div class="sec-lbl">scripture references</div>${scriptureHits.map((h) => `<div class="ref-block"><span class="ref-num">${h.v}</span><span class="ref-text">${esc(h.t)}</span></div>`).join('')}</div>`;
  }
  let sefirotHTML = '';
  if (STATE.layers.sefirot) { const m = K.SEFIROT.filter((s) => s.v === dominantRd || rdVals.includes(s.v)); if (m.length) sefirotHTML = `<div><div class="sec-lbl">tree of life</div>${m.map((s) => `<div class="sef-row"><div class="sef-dot" data-col="${esc(s.col)}"></div><div><div class="sef-name">${esc(s.n)} (${s.v})</div><div class="sef-mean">${esc(s.m)}</div></div></div>`).join('')}</div>`; }
  let tarotHTML = '';
  if (STATE.layers.tarot) { const t = K.TAROT_MAJOR[dominantRd]; if (t) tarotHTML = `<div><div class="sec-lbl">tarot correspondence</div><div class="trad-block"><div class="trad-block-head">major arcana ${dominantRd}</div><div class="trad-block-body">${esc(t)}</div></div></div>`; }

  // phrase
  let phraseHTML = '';
  if (STATE.layers.phrase && isPhrase) {
    const rows = phraseData.map((p) => `<div class="pb-row"><span class="pb-word">${esc(p.word)}</span><div class="pb-vals"><span><span class="pb-vl">ord </span><span class="pb-val">${p.vals.ordinal.v}</span></span><span><span class="pb-vl">red </span><span class="pb-val">${p.vals.ordinal.rd}</span></span></div></div>`).join('');
    const total = phraseData.reduce((s, p) => s + p.vals.ordinal.v, 0);
    phraseHTML = `<div><div class="sec-lbl">phrase breakdown</div><div class="pb-breakdown">${rows}<div class="phrase-total"><span class="pt-lbl">ordinal total</span><span class="pt-val">${total}</span></div></div></div>`;
  }

  // etymology
  let etymHTML = '';
  if (STATE.layers.etym) {
    if (etym) {
      etymHTML = `<div><div class="sec-lbl">etymology</div>${etym.parts.map((p) => `<div class="etym-part"><div class="etym-head">${esc(p.p)}</div><div class="etym-chain">${p.ch.map((s) => `<div class="etym-step"><span class="etym-lang">${esc(s.l)}</span><span class="etym-w">${esc(s.w)}</span><span class="etym-m">— ${esc(s.m)}</span></div>`).join('')}</div></div>`).join('')}<div class="etym-syn">${esc(etym.syn)}</div></div>`;
    } else {
      etymHTML = `<div><div class="sec-lbl">etymology</div><div id="etym-ai-target"><div class="note">no built-in etymology for <b>${esc(raw)}</b>. ${STATE.aiKey ? 'requesting a live reading…' : 'the <button type="button" class="link" data-action="tab" data-tab="sources">sources</button> tab shows dictionary origin when online, or add an api key in settings for live readings.'}</div></div></div>`;
    }
  }

  // traditions
  const activeTL = ['hebrew', 'biblical', 'greek', 'occult'].filter((t) => STATE.traditions[t]);
  let tradHTML = '';
  if (STATE.layers.trad && activeTL.length) {
    tradHTML = `<div><div class="sec-lbl">tradition readings</div>${activeTL.map((t) => {
      const known = tradR?.[t];
      const body = known ? `<div class="trad-block-body">${escEm(known)}</div>` : `<div class="trad-block-body">${offlineReading(t, raw, results, dominantRd, primary)}</div>${STATE.aiKey ? `<div class="trad-block-body" id="trad-ai-${t}"></div>` : ''}`;
      return `<div class="trad-block"><div class="trad-block-head"><span>${esc(K.TRADITION_LABELS[t])}</span><span class="src">${known ? 'library' : 'computed' + (STATE.aiKey ? ' + live' : '')}</span></div>${body}</div>`;
    }).join('')}</div>`;
  }

  // sources
  let sourcesHTML = '';
  if (STATE.layers.sources) {
    sourcesHTML = `<div class="src-card"><div class="src-head"><span class="src-title">dictionary</span></div><div class="src-body" id="src-dict"><span class="src-empty">…</span></div></div>`
      + `<div class="src-card"><div class="src-head"><span class="src-title">encyclopedia</span></div><div class="src-body" id="src-wiki"><span class="src-empty">…</span></div></div>`
      + `<div class="src-card"><div class="src-head"><span class="src-title">scripture text</span></div><div class="src-body" id="src-verse"><span class="src-empty">…</span></div></div>`
      + `<div class="note">live sources: dictionaryapi.dev · wikipedia · bible-api.com (world english bible). fetched only when this tab is opened, cached on your device for 30 days.</div>`;
  }

  // root
  let rootHTML = '';
  if (STATE.layers.root) {
    const layers = [
      { d: '0', l: 'surface', c: `the word as commonly understood: “${esc(raw)}”` },
      { d: '1', l: 'script', c: `${scripts.map((s) => esc(C.SCRIPT_LABELS[s] || s)).join(' + ')} · ${C.lettersOnly(raw).length} letters${isPhrase ? ` · ${words.length} words` : ''}` },
      { d: '2', l: 'morphology', c: etym ? esc(etym.parts.map((p) => p.p).join(' + ')) : 'decompose constituent morphemes' },
      { d: '3', l: 'etymology', c: etym ? esc(etym.syn) : 'trace root through original language' },
      { d: '4', l: 'tradition', c: tradR ? 'cross-tradition readings available above' : 'computed readings applied from the active tradition lenses' },
      { d: '5', l: 'numerical', c: `reduces to ${dominantRd} — ${esc(K.NUM_MEAN[dominantRd] || '')}` },
      { d: '6', l: 'behavioral', c: 'does the actual function match the layers?' },
      { d: '∞', l: 'root', c: etym?.root ? esc(etym.root) : 'the irreducible principle underlying this word' },
    ];
    rootHTML = `<div><div class="sec-lbl">root archaeology</div><div class="root-rows">${layers.map((r, i) => `<div class="root-row${i === layers.length - 1 ? ' final' : ''}"><span class="root-d">${esc(r.d)}</span><span class="root-l">${esc(r.l)}</span><span class="root-c">${r.c}</span></div>`).join('')}</div></div>`;
  }

  // oracle
  const allRd = [...activeKeys].map((k) => ({ cipher: k, v: results[k].v, rd: results[k].rd }));
  const rdFreq = {}; allRd.forEach((x) => { (rdFreq[x.rd] ||= []).push(x); });
  const rdSorted = Object.entries(rdFreq).sort((a, b) => b[1].length - a[1].length);
  const topG = rdSorted[0] || [String(dominantRd), []];
  const topRd = parseInt(topG[0], 10), topCount = topG[1].length, totalC = allRd.length;
  const prob = totalC > 1 ? Math.pow(1 / 9, topCount - 1) : 1;
  const probStr = prob < 0.0001 ? (prob * 100).toExponential(2) : (prob * 100).toFixed(2);
  const sigLevel = topCount >= 5 ? 'strong' : topCount >= 3 ? 'moderate' : 'weak';
  const sigCls = topCount >= 5 ? 'hi' : topCount >= 3 ? 'mid' : 'lo';
  const convRows = topG[1].map((x) => `<div class="pred-row"><span class="pred-lbl">${esc(cipherName(x.cipher))}</span><span class="pred-val a">${x.v} → ${x.rd}</span></div>`).join('');
  const divRows = rdSorted.slice(1).map((g) => `<div class="pred-row"><span class="pred-lbl">${g[1].map((x) => esc(cipherName(x.cipher))).join(', ')}</span><span class="pred-val dim">→ ${esc(g[0])}</span></div>`).join('');
  const traj = STATE.trajectory;
  let trajHTML = '';
  if (traj.length >= 2) {
    const arc = traj.map((t) => t.rd); const dir = arc[arc.length - 1] - arc[0];
    const arcD = dir < 0 ? 'descending — toward initiation/genesis' : dir > 0 ? 'ascending — toward ending/dissolution' : 'stable — consolidation phase';
    const tM = { 1: 'initiation', 2: 'tension', 3: 'expansion', 4: 'consolidation', 5: 'disruption', 6: 'resolution', 7: 'completion', 8: 'consequence', 9: 'ending' };
    trajHTML = `<div class="traj-arc"><div class="traj-label">arc across ${arc.length} terms</div><div class="traj-dots">${arc.map((v, i) => `<div class="traj-dot${i === arc.length - 1 ? ' last' : ''}" title="${esc(traj[i].word)}">${v}</div>`).join('<div class="traj-arr">›</div>')}</div><div class="traj-reading">${esc(arcD)}</div><div class="traj-terminal">terminal ${arc[arc.length - 1]} — ${esc(tM[arc[arc.length - 1]] || '')}</div></div>`;
  } else if (traj.length === 1) trajHTML = `<div class="pred-note">first term: ${esc(traj[0].word)} (${traj[0].rd}). add more terms to build the arc.</div>`;
  else trajHTML = '<div class="pred-note">enter situation terms in sequence. the arc of reduced values shows phase movement.</div>';
  const atb = C.atbash(C.lettersOnly(raw)); const atbR = C.calcWord(atb, all);
  const oracleHTML = `<div class="oracle-header"><span class="oracle-badge">2 theories active</span><span class="oracle-note">theories 1 and 3 eliminated — false positive rates too high</span></div>`
    + `<div class="pred-section"><div class="pred-section-head"><span class="pred-section-title">convergence</span><span class="pred-score">4.1 / 5</span></div><div class="pred-block"><div class="pred-row"><span class="pred-lbl">signal</span><span class="pred-val ${sigCls}">${sigLevel} — ${topCount} / ${totalC} ciphers agree</span></div><div class="pred-row"><span class="pred-lbl">convergence value</span><span class="pred-val a">reduced ${topRd}</span></div><div class="pred-row"><span class="pred-lbl">chance probability</span><span class="pred-val">${esc(probStr)}%</span></div>${convRows ? '<div class="pred-group-label">agreeing</div>' + convRows : ''}${divRows ? '<div class="pred-group-label">diverging</div>' + divRows : ''}<div class="pred-note">3+ ciphers agreeing = below 1.2% chance. 5+ = below 0.015%.</div></div></div>`
    + `<div class="pred-section"><div class="pred-section-head"><span class="pred-section-title">phrase trajectory</span><span class="pred-score">3.8 / 5</span></div><div class="pred-block"><div class="traj-row"><input class="traj-in" id="traj-input" type="text" placeholder="next situation term…" maxlength="100" autocomplete="off" aria-label="next trajectory term"><button class="traj-btn" type="button" data-action="add-traj">add</button><button class="traj-clear" type="button" data-action="clear-traj">clear</button></div>${trajHTML}</div></div>`
    + `<div class="pred-section"><div class="pred-section-head"><span class="pred-section-title">atbash mirror</span><span class="pred-score">3.5 / 5 hebrew</span></div><div class="pred-block"><div class="pred-row"><span class="pred-lbl">mirror</span><span class="pred-val a">${esc(atb)}</span></div><div class="pred-row"><span class="pred-lbl">mirror ordinal</span><span class="pred-val">${atbR.ordinal.v} → ${atbR.ordinal.rd}</span></div><div class="pred-note">documented in jeremiah 25:26 (sheshach = babel). hebrew score 3.5/5. in english: phonetic displacement, not semantic meaning.</div></div></div>`;

  // matches
  const domains = visibleDomains();
  const targetOrd = primary.v, targetRd = primary.rd;
  const exact = findByOrdinal(targetOrd, raw).filter((m) => domains.has(m.d));
  const reduced = findByReduced(targetRd, raw).filter((m) => m.o !== targetOrd && domains.has(m.d));
  const renderGroup = (items, type) => {
    const by = groupByDomain(items);
    if (!Object.keys(by).length) return `<div class="note">no ${type} matches in the visible corpus domains.</div>`;
    return DOMAIN_ORDER.filter((d) => by[d]?.length).map((d) => `<div class="match-domain"><div class="match-domain-lbl">${esc(DOMAIN_LABELS[d] || d)}</div>${by[d].map((it) => `<button type="button" class="match-row" data-action="analyze-word" data-w="${esc(it.w)}"><span class="match-word">${esc(it.w)}</span><span class="match-ord">${it.o}</span><span class="match-note">${esc(it.n)}</span></button>`).join('')}</div>`).join('');
  };
  const matchesHTML = `${primaryKey !== 'ordinal' ? `<div class="note">matching the ${esc(cipherName(primaryKey))} value ${targetOrd} against the english-ordinal corpus — equal numbers across systems, not equal spellings.</div>` : ''}<div class="matches-head"><div class="matches-title">exact matches <span class="matches-val">${esc(primaryKey === 'ordinal' ? 'ordinal' : 'value')} ${targetOrd} · ${exact.length}</span></div></div>${renderGroup(exact, 'exact')}<div class="matches-head mt"><div class="matches-title">reduced matches <span class="matches-val dim">reduced ${targetRd} (${reduced.length} words)</span></div></div><div class="note">these words share the same reduced value (${targetRd}) but different ordinal values — a softer resonance across ${reduced.length} corpus entries.</div>${renderGroup(reduced, 'reduced')}`;

  const tabs = [
    { id: 'numbers', label: 'numbers', show: true }, { id: 'matches', label: 'matches', show: true }, { id: 'spells', label: 'spells', show: STATE.layers.spells },
    { id: 'breakdown', label: 'phrase', show: isPhrase && STATE.layers.phrase }, { id: 'etymology', label: 'etymology', show: STATE.layers.etym },
    { id: 'tradition', label: 'tradition', show: STATE.layers.trad && activeTL.length > 0 }, { id: 'sources', label: 'sources', show: STATE.layers.sources },
    { id: 'root', label: 'root', show: STATE.layers.root }, { id: 'structure', label: 'structure', show: STATE.layers.structure }, { id: 'predict', label: 'oracle', show: true },
  ].filter((t) => t.show);
  if (!tabs.find((t) => t.id === STATE.activeTab)) STATE.activeTab = tabs[0].id;
  const tabHTML = tabs.map((t) => `<button class="tab${STATE.activeTab === t.id ? ' on' : ''}" type="button" role="tab" aria-selected="${STATE.activeTab === t.id}" aria-controls="p-${t.id}" data-action="tab" data-tab="${t.id}">${t.label}</button>`).join('');
  const panel = (id, inner) => `<div class="panel${STATE.activeTab === id ? ' on' : ''}" id="p-${id}" role="tabpanel">${inner}</div>`;
  const meta = [];
  if (scripts.includes('latin')) meta.push(`<span class="rw-meta-item">ordinal <span>${results.ordinal.v}</span></span>`, `<span class="rw-meta-item">reduced <span>${results.ordinal.rd}</span></span>`);
  if (scripts.includes('hebrew')) meta.push(`<span class="rw-meta-item">hebrew <span>${results.hebrew.v}</span></span>`, `<span class="rw-meta-item">reduced <span>${results.hebrew.rd}</span></span>`);
  if (scripts.includes('greek')) meta.push(`<span class="rw-meta-item">isopsephy <span>${results.greek.v}</span></span>`, `<span class="rw-meta-item">reduced <span>${results.greek.rd}</span></span>`);
  if (isPhrase) meta.push(`<span class="rw-meta-item">words <span>${words.length}</span></span>`);
  { const vo = vowelOrder(raw); if (vo.vowels) meta.push(`<span class="rw-meta-item">vowels <span>${esc(vo.sequence.join('·'))}</span></span>`); }
  meta.push(`<span class="rw-meta-item">script <span>${scripts.map((s) => esc(C.SCRIPT_LABELS[s] || s)).join(' + ')}</span></span>`);

  const html = `<div class="rw"><div class="rw-head"><div class="rw-head-row"><h2 class="rw-word">${esc(raw)}</h2><button type="button" class="rw-mirror" data-action="mirror" aria-label="mirror reading">${esc(C.mirrorWord(raw))}${buildMirrorTooltip(raw, etym, results)}</button></div><div class="rw-meta">${meta.join('')}</div></div>`
    + `<div class="tabs" role="tablist">${tabHTML}</div>`
    + panel('numbers', `<div class="num-grid">${numCards}</div>${propsHTML}${unreducedHTML}${convHTML}${letterHTML}${scriptureHTML}${sefirotHTML}${tarotHTML}`)
    + panel('matches', matchesHTML)
    + (STATE.layers.spells ? panel('spells', `${vowelHTML(raw, all, primaryKey)}<div id="spells-hidden"><div class="st-note">loading the word list…</div></div>`) : '')
    + (isPhrase && STATE.layers.phrase ? panel('breakdown', phraseHTML) : '')
    + (STATE.layers.etym ? panel('etymology', etymHTML) : '')
    + (STATE.layers.trad && activeTL.length ? panel('tradition', tradHTML) : '')
    + (STATE.layers.sources ? panel('sources', sourcesHTML) : '')
    + (STATE.layers.root ? panel('root', rootHTML) : '')
    + (STATE.layers.structure ? panel('structure', structureHTML(raw, all, activeKeys, primaryKey)) : '')
    + panel('predict', oracleHTML) + '</div>';

  $('m-empty').hidden = true;
  const res = $('result'); res.hidden = false; res.classList.remove('stale');
  setHTML(res, html);
  // post-render: widths and colours via CSSOM (no inline style attributes under the strict CSP)
  res.querySelectorAll('[data-pct]').forEach((el) => { el.style.width = Math.max(0, Math.min(100, parseInt(el.dataset.pct, 10) || 0)) + '%'; });
  res.querySelectorAll('.sef-dot[data-col]').forEach((el) => { if (/^#[0-9a-f]{6}$/i.test(el.dataset.col)) el.style.background = el.dataset.col; });
  if (!REDUCED_MOTION) {
    res.querySelectorAll('.num-card').forEach((c, i) => { c.style.animationDelay = (i * 0.06) + 's'; });
    res.querySelectorAll('.match-row').forEach((r, i) => { r.style.animationDelay = Math.min(i, 30) * 0.03 + 's'; });
  }
  $('main-area').scrollTop = 0;
  if (STATE.layers.spells) fillSpells(raw, all, primaryKey);
  scheduleLive(raw, results, scriptureHits, etym, tradR, activeTL);
}

// ── live data (AI + keyless sources) ──────────────────────────────────────────
let liveToken = 0;
const AI_WINDOW = []; // timestamps of AI calls in the last minute (spend guard)
function aiBudgetOk() { const now = Date.now(); while (AI_WINDOW.length && now - AI_WINDOW[0] > 60000) AI_WINDOW.shift(); if (AI_WINDOW.length >= 20) return false; AI_WINDOW.push(now); return true; }
function scheduleLive(raw, results, scriptureHits, etym, tradR, activeTL) {
  const token = ++liveToken;
  requestAnimationFrame(() => {
    if (token !== liveToken) return;
    if (STATE.aiKey && !hostBlocksNetwork()) {
      const et = $('etym-ai-target');
      if (et && !etym && aiBudgetOk()) streamAI(PROMPTS.etymology(raw), et);
      if (!tradR) {
        const names = { hebrew: 'hebrew/kabbalistic', biblical: 'biblical/christian', greek: 'greek classical', occult: 'hermetic/western occult' };
        for (const t of activeTL) { const el = $('trad-ai-' + t); if (el && aiBudgetOk()) streamAI(PROMPTS.tradition(names[t], raw, results.ordinal.v, results.ordinal.rd), el); }
      }
    }
    if (STATE.activeTab === 'sources') loadSources(raw, scriptureHits, token);
    else pendingSources = { raw, scriptureHits, token };
  });
}
let pendingSources = null;
async function loadSources(raw, scriptureHits, token) {
  pendingSources = null;
  const dict = $('src-dict'), wiki = $('src-wiki'), verse = $('src-verse');
  if (!dict || !wiki || !verse) return;
  const blocked = !STATE.sources ? 'live sources are off — enable them in settings.' : hostBlocksNetwork() ? 'network features are disabled on this host.' : !navigator.onLine ? 'offline — showing cached data only.' : '';
  if (blocked && !navigator.onLine === false) { [dict, wiki, verse].forEach((el) => setHTML(el, `<span class="src-empty">${esc(blocked)}</span>`)); if (blocked !== 'offline — showing cached data only.') return; }
  const guard = () => token === liveToken && document.body.contains(dict);
  const firstWord = raw.split(' ')[0];
  lookupDictionary(raw.includes(' ') ? firstWord : raw).then((d) => {
    if (!guard()) return;
    if (!d) return setHTML(dict, `<span class="src-empty">no dictionary entry${navigator.onLine ? '' : ' cached'} for “${esc(raw)}”.</span>`);
    setHTML(dict, `<div><b>${esc(d.word)}</b> ${d.phonetic ? `<span class="phon">${esc(d.phonetic)}</span>` : ''}</div>${d.origin ? `<div class="desc">origin: ${esc(d.origin)}</div>` : ''}${d.meanings.map((m) => `<div class="pos">${esc(m.pos)}</div><ol>${m.defs.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${m.synonyms.length ? `<div class="syn">synonyms: ${m.synonyms.map(esc).join(', ')}</div>` : ''}`).join('')}<div class="mt8"><a class="src-link" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">wiktionary ↗</a></div>`);
  });
  lookupWikipedia(raw).then((w) => {
    if (!guard()) return;
    if (!w) return setHTML(wiki, `<span class="src-empty">no encyclopedia summary${navigator.onLine ? '' : ' cached'} for “${esc(raw)}”.</span>`);
    setHTML(wiki, `${w.thumbnail ? `<img class="src-thumb" src="${esc(w.thumbnail)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}<div><b>${esc(w.title)}</b>${w.description ? ` <span class="desc">— ${esc(w.description)}</span>` : ''}</div><p>${esc(w.extract)}</p><div class="mt8"><a class="src-link" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">wikipedia ↗</a></div>`);
  });
  const ref = scriptureHits.map((h) => extractReference(h.t)).find(Boolean) || (K.TRADITIONS[raw.toLowerCase()]?.biblical ? extractReference(K.TRADITIONS[raw.toLowerCase()].biblical) : null);
  if (!ref) { setHTML(verse, '<span class="src-empty">no scripture reference attached to this value.</span>'); return; }
  lookupVerse(ref).then((v) => {
    if (!guard()) return;
    if (!v) return setHTML(verse, `<span class="src-empty">could not load ${esc(ref)}${navigator.onLine ? '' : ' (offline)'}.</span>`);
    setHTML(verse, `<div><b>${esc(v.reference)}</b> <span class="desc">${esc(v.translation)}</span></div><p>${esc(v.text)}</p>`);
  });
}

function switchTab(id) {
  STATE.activeTab = id;
  document.querySelectorAll('.tab').forEach((t) => { const on = t.dataset.tab === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.id === 'p-' + id));
  if (id === 'sources' && pendingSources) loadSources(pendingSources.raw, pendingSources.scriptureHits, pendingSources.token);
}

// ── compare / split view ──────────────────────────────────────────────────────
function addCompare() {
  const inp = $('compare-input');
  const w = safeWord(inp.value);
  if (!w) return;
  if (STATE.compare.includes(w)) { toast('already in comparison'); return; }
  if (STATE.compare.length >= CONFIG.limits.maxCompare) { toast(`compare up to ${CONFIG.limits.maxCompare} words`); return; }
  STATE.compare.push(w); inp.value = '';
  renderCompareChips(); openSplitView();
}
function renderCompareChips() {
  const el = $('compare-chips'); if (!el) return;
  const frag = document.createDocumentFragment();
  for (const w of STATE.compare) {
    const chip = document.createElement('span'); chip.className = 'chip';
    const lbl = document.createElement('span'); lbl.textContent = w;
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'remove ' + w); x.dataset.action = 'remove-compare'; x.dataset.w = w;
    chip.append(lbl, x); frag.appendChild(chip);
  }
  el.replaceChildren(frag);
}
function openSplitView() {
  if (!STATE.compare.length && !STATE.currentWord) { toast('enter a word to compare first'); return; }
  $('split-view').hidden = false; renderSplitView();
  if (isMobile()) showPanel('main');
}
function renderSplitView() {
  const container = $('split-panels'), compatEl = $('split-compat');
  const words = [STATE.currentWord, ...STATE.compare].filter(Boolean);
  const all = getAllCiphers();
  const res = words.map((w) => ({ w, r: C.calcWord(w, all) }));
  container.replaceChildren();
  for (const { w, r } of res) {
    const panel = document.createElement('div'); panel.className = 'split-panel';
    const head = document.createElement('div'); head.className = 'split-panel-head';
    const wordEl = document.createElement('div'); wordEl.className = 'split-word'; wordEl.textContent = w;
    const metaEl = document.createElement('div'); metaEl.className = 'split-meta';
    setHTML(metaEl, `ord <span>${r.ordinal.v}</span> (${esc(C.numToWords(r.ordinal.v))}) &nbsp;·&nbsp; red <span>${r.ordinal.rd}</span>`);
    head.append(wordEl, metaEl); panel.appendChild(head);
    const table = document.createElement('div'); table.className = 'split-table';
    const pairs = Object.entries(r).filter(([k, v]) => STATE.activeCiphers.has(k) && v.applies);
    const maxV = Math.max(1, ...pairs.map(([, v]) => v.v));
    for (const [k, cv] of pairs) {
      const row = document.createElement('div'); row.className = 'split-row';
      const n = document.createElement('span'); n.className = 'split-cipher'; n.textContent = cipherName(k); n.title = cipherName(k);
      const v = document.createElement('span'); v.className = 'split-val'; v.textContent = `${cv.v} (${C.numToWords(cv.v)})`;
      const bar = document.createElement('div'); bar.className = 'split-bar'; const fill = document.createElement('i'); fill.style.width = Math.round(cv.v / maxV * 100) + '%'; bar.appendChild(fill);
      row.append(n, v, bar); table.appendChild(row);
    }
    panel.appendChild(table); container.appendChild(panel);
  }
  if (res.length >= 2) {
    compatEl.hidden = false; compatEl.replaceChildren();
    const h = document.createElement('div'); h.className = 'split-lbl'; h.textContent = 'compatibility'; compatEl.appendChild(h);
    for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++) {
      const score = C.compatibilityScore(res[i].r, res[j].r);
      const cls = score >= 70 ? 'hi' : score >= 40 ? 'mid' : 'lo';
      const row = document.createElement('div'); row.className = 'compat-row';
      const pair = document.createElement('span'); pair.className = 'compat-pair'; pair.textContent = `${res[i].w} ↔ ${res[j].w}`;
      const bar = document.createElement('div'); bar.className = 'compat-bar ' + cls; const fill = document.createElement('i'); fill.style.width = score + '%'; bar.appendChild(fill);
      const val = document.createElement('span'); val.className = 'compat-val ' + cls; val.textContent = score + '%';
      row.append(pair, bar, val); compatEl.appendChild(row);
    }
  } else compatEl.hidden = true;
}

// ── trajectory ────────────────────────────────────────────────────────────────
function addTrajectory() {
  const inp = $('traj-input'); if (!inp) return;
  const w = safeWord(inp.value); if (!w) return;
  if (STATE.trajectory.length >= CONFIG.limits.maxTrajectory) { toast('trajectory is full — clear it to start over'); return; }
  const r = C.calcWord(w, C.BUILTIN_CIPHERS);
  STATE.trajectory.push({ word: w, rd: r.ordinal.rd, val: r.ordinal.v });
  inp.value = '';
  STATE.activeTab = 'predict';
  if (STATE.currentWord) analyze({ silent: true });
  $('traj-input')?.focus();
}

// ── custom ciphers ────────────────────────────────────────────────────────────
function validateAndPreview() {
  const code = $('custom-code').value, errEl = $('custom-errors'), prevEl = $('custom-preview');
  if (!code.trim()) { errEl.replaceChildren(); prevEl.replaceChildren(); return null; }
  const r = C.validateCipherCode(code);
  errEl.replaceChildren();
  for (const e of r.errors) { const d = document.createElement('div'); d.className = 'ce-error'; const loc = document.createElement('span'); loc.className = 'ce-loc'; loc.textContent = e.line ? `line ${e.line}${e.col ? ' col ' + e.col : ''}` : ''; const m = document.createElement('span'); m.className = 'ce-msg'; m.textContent = e.msg; d.append(loc, m); errEl.appendChild(d); }
  for (const w of r.warnings) { const d = document.createElement('div'); d.className = 'ce-warn'; d.textContent = '⚠ ' + w.msg; errEl.appendChild(d); }
  if (r.ok && r.parsed) { const test = STATE.currentWord || 'hello'; const val = C.buildCustomFn(r.parsed)(C.lettersOnly(test)); setHTML(prevEl, `<span class="ce-ok">✓ valid cipher</span><span class="ce-test">“${esc(test)}” = ${val} → ${C.ds(val)}</span>`); }
  else prevEl.replaceChildren();
  return r;
}
function installCustomCipher() {
  const r = validateAndPreview();
  if (!r || !r.ok) { toast('fix the errors first'); return; }
  if (Object.keys(STATE.customCiphers).length >= 12) { toast('up to 12 custom ciphers'); return; }
  const name = safeWord($('custom-name').value).slice(0, 50) || 'custom cipher';
  const key = 'custom_' + Date.now();
  STATE.customCiphers[key] = { name, desc: 'user-defined', region: 'custom', tier: 'custom', script: 'latin', map: r.parsed, fn: C.buildCustomFn(r.parsed) };
  STATE.activeCiphers.add(key);
  rebuildCipherList();
  $('custom-code').value = ''; $('custom-name').value = ''; $('custom-errors').replaceChildren();
  setHTML($('custom-preview'), '<span class="ce-ok">✓ cipher installed</span>');
  closeSettings();
  if (STATE.currentWord) analyze({ silent: true });
  toast(`installed “${name}”`, { label: 'save session', onClick: saveSession });
}

// ── hidden words ("spells") ─────────────────────────────────────────────────────
let spellsToken = 0;
const lexiconExtras = () => [
  ...CORPUS.map((c) => ({ text: c.w, tier: c.w.includes(' ') ? 's' : 'c' })),
  ...K.SUGGESTED.map((w) => ({ text: w, tier: w.includes(' ') ? 's' : 'c' })),
];
function fillSpells(raw, all, key) {
  const token = ++spellsToken;
  loadLexicon(lexiconExtras()).then((lex) => {
    const el = $('spells-hidden');
    if (token !== spellsToken || !el) return;
    if (!lex.size) { setHTML(el, '<div class="note note-warn">the word list could not be loaded. it is cached after the first online visit.</div>'); return; }
    try { setHTML(el, hiddenHTML(raw, lex, all, key)); }
    catch (e) { console.warn('[uriel] hidden-word search failed', e); setHTML(el, '<div class="note note-warn">hidden-word search failed for this input.</div>'); }
  });
}

// ── mathematical structure layer ──────────────────────────────────────────────
// Sits on top of the existing calculation: every value it analyses is the
// unchanged output of calcWord under the selected cipher.
function structureHTML(raw, all, activeKeys, primaryKey) {
  try {
    return renderStructure({
      raw, all, activeKeys, primaryKey, cipherKey: STATE.structCipher || primaryKey, userEntities: STATE.entities,
      corpusLookup: (v) => findByOrdinal(v).map((i) => i.w), sources: STATE.sources && !hostBlocksNetwork(), ai: STATE.aiKey && !hostBlocksNetwork(),
    });
  } catch (e) {
    console.warn('[uriel] structure layer failed', e);
    return '<div class="note note-warn">the structure layer could not analyse this input.</div>';
  }
}
function sanitizeEntity(e) {
  if (!isPlainObj(e)) return null;
  const label = safeWord(e.label).slice(0, 80); if (!label) return null;
  const kind = ENTITY_KINDS.includes(e.kind) ? e.kind : 'other';
  const text = safeWord(e.text || label) || label;
  const date = parseDate(e.date) !== null ? String(e.date) : '';
  const lat = Number(e.lat), lon = Number(e.lon);
  const hasCoord = validCoord(lat, lon);
  const id = /^ent_\d{1,16}$/.test(String(e.id)) ? String(e.id) : 'ent_' + Date.now() + Math.floor(Math.random() * 1000);
  return { id, label, kind, text, date, lat: hasCoord ? +lat.toFixed(4) : undefined, lon: hasCoord ? +lon.toFixed(4) : undefined, coordSource: hasCoord ? (e.coordSource === 'wikipedia' ? 'wikipedia' : 'user') : undefined };
}
function addEntityFromForm() {
  const label = safeWord($('ent-label')?.value);
  if (!label) { toast('give the entity a label'); $('ent-label')?.focus(); return; }
  if (STATE.entities.length >= 24) { toast('up to 24 entities'); return; }
  const dateRaw = ($('ent-date')?.value || '').trim();
  if (dateRaw && parseDate(dateRaw) === null) { toast('date must be YYYY-MM-DD'); $('ent-date')?.focus(); return; }
  const latRaw = ($('ent-lat')?.value || '').trim(), lonRaw = ($('ent-lon')?.value || '').trim();
  if ((latRaw || lonRaw) && !validCoord(Number(latRaw), Number(lonRaw))) { toast('coordinates must be decimal degrees: lat −90…90, lon −180…180'); return; }
  const e = sanitizeEntity({ id: 'ent_' + Date.now(), label, kind: $('ent-kind')?.value, text: $('ent-text')?.value || label, date: dateRaw, lat: latRaw ? Number(latRaw) : undefined, lon: lonRaw ? Number(lonRaw) : undefined, coordSource: 'user' });
  if (!e) return;
  STATE.entities.push(e);
  STATE.activeTab = 'structure';
  if (STATE.currentWord) analyze({ silent: true });
  setTimeout(() => $('ent-label')?.focus(), 0);
}
async function fetchEntityCoords(id) {
  const e = STATE.entities.find((x) => x.id === id); if (!e) return;
  if (!STATE.sources || hostBlocksNetwork()) { toast('enable live sources in settings first'); return; }
  toast('looking up coordinates on wikipedia…');
  const w = await lookupWikipedia(e.text || e.label);
  if (!w || !w.coordinates) { toast(`wikipedia has no coordinates for “${e.label}”`); return; }
  e.lat = w.coordinates.lat; e.lon = w.coordinates.lon; e.coordSource = 'wikipedia';
  STATE.activeTab = 'structure';
  if (STATE.currentWord) analyze({ silent: true });
  toast(`coordinates for ${e.label}: ${e.lat}, ${e.lon} (wikipedia)`);
}
async function suggestEntities() {
  if (!STATE.aiKey || hostBlocksNetwork() || !STATE.currentWord) { toast('add an api key in settings to use suggestions'); return; }
  if (!aiBudgetOk()) { toast('ai request budget reached — try again in a minute'); return; }
  const holder = document.createElement('div');
  toast('asking for related entities…');
  const text = await streamAI(`List up to 8 real, well-documented entities directly connected to "${STATE.currentWord}" (people, organizations, events, locations, dates). Reply ONLY with a JSON array of objects with keys: label (string), kind (one of person, organization, event, location, date, title), date (YYYY-MM-DD or empty string, only if it is a documented date). No prose.`, holder);
  let arr = null;
  try { const m = /\[[\s\S]*\]/.exec(text); arr = m ? JSON.parse(m[0]) : null; } catch { arr = null; }
  if (!Array.isArray(arr) || !arr.length) { toast('no usable suggestions returned'); return; }
  let added = 0;
  for (const it of arr.slice(0, 8)) {
    const e = sanitizeEntity({ id: 'ent_' + Date.now() + added, label: it?.label, kind: it?.kind, text: it?.label, date: it?.date });
    if (!e || STATE.entities.some((x) => x.label.toLowerCase() === e.label.toLowerCase()) || STATE.entities.length >= 24) continue;
    e.suggested = true; STATE.entities.push(e); added++;
  }
  STATE.activeTab = 'structure';
  if (STATE.currentWord) analyze({ silent: true });
  toast(added ? `${added} suggested entities added — verify them; coordinates still need to be supplied or fetched` : 'nothing new to add');
}

// ── layout ────────────────────────────────────────────────────────────────────
function setSidebarWidth(w) { STATE.sidebarW = w; document.documentElement.style.setProperty('--sb-w', w + 'px'); }
function initResize() {
  const h = $('resize-handle'); if (!h) return;
  let startX = 0, startW = 0, active = false;
  h.addEventListener('pointerdown', (e) => { active = true; startX = e.clientX; startW = STATE.sidebarW; h.setPointerCapture(e.pointerId); e.preventDefault(); });
  h.addEventListener('pointermove', (e) => { if (!active) return; setSidebarWidth(Math.max(180, Math.min(420, startW + e.clientX - startX))); });
  const end = () => { active = false; };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  h.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') setSidebarWidth(Math.max(180, STATE.sidebarW - 16)); if (e.key === 'ArrowRight') setSidebarWidth(Math.min(420, STATE.sidebarW + 16)); });
  h.tabIndex = 0;
}
function showPanel(p) {
  STATE.mobilePanel = p;
  $('sidebar').classList.toggle('mobile-hidden', p !== 'sidebar');
  $('main-area').classList.toggle('mobile-hidden', p !== 'main');
  document.querySelectorAll('.mob-tab').forEach((b) => setPressed(b, b.dataset.p === p));
}
function spawnMist() {
  if (REDUCED_MOTION || isMobile()) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div'); p.className = 'mist-particle'; p.setAttribute('aria-hidden', 'true');
    const size = Math.random() * 120 + 40;
    Object.assign(p.style, { width: size + 'px', height: size + 'px', left: Math.random() * 100 + 'vw', top: Math.random() * 100 + 100 + 'vh', opacity: String(Math.random() * 0.06 + 0.02), animationDuration: Math.random() * 40 + 30 + 's', animationDelay: -Math.random() * 40 + 's' });
    frag.appendChild(p);
  }
  document.body.appendChild(frag);
}

// ── share / install / network ─────────────────────────────────────────────────
async function share() {
  const u = new URL(CONFIG.siteUrl);
  if (STATE.currentWord) u.searchParams.set('q', STATE.currentWord);
  const url = u.toString();
  const title = STATE.currentWord ? `${STATE.currentWord} — Uriel gematria` : 'Uriel — gematria engine';
  try {
    if (navigator.share && isMobile()) { await navigator.share({ title, url }); return; }
    await navigator.clipboard.writeText(url); toast('link copied');
  } catch { toast(url, { ms: 6000 }); }
}
let installEvt = null;
function setOnline(on) {
  STATE.online = on;
  const b = $('net-status'); if (b) b.hidden = on;
  if (on && pendingSources === null && STATE.currentWord && STATE.activeTab === 'sources') { const hits = []; loadSources(STATE.currentWord, hits, liveToken); }
}
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(swURL(), { scope: './' });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('a new version is ready', { label: 'reload', onClick: () => nw.postMessage('SKIP_WAITING') });
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; location.reload(); });
    } catch { /* offline or unsupported */ }
  });
}
async function verifyIntegrity() {
  if (!navigator.onLine || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || !crypto?.subtle) return;
  try {
    const res = await fetch('integrity.json', { cache: 'no-store' }); if (!res.ok) return;
    const man = await res.json(); if (!isPlainObj(man?.files)) return;
    const bad = [];
    for (const [file, hash] of Object.entries(man.files).slice(0, 40)) {
      if (!/^[\w./-]+$/.test(file) || !/^[0-9a-f]{64}$/.test(hash)) continue;
      const r = await fetch(file, { cache: 'no-store' }); if (!r.ok) continue;
      const buf = await r.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');
      if (digest !== hash) bad.push(file);
    }
    if (bad.length) { console.warn('[uriel] integrity mismatch:', bad); toast(`warning: ${bad.length} file(s) differ from the published build`, { ms: 8000 }); }
  } catch { /* ignore */ }
}

// ── events ────────────────────────────────────────────────────────────────────
const ACTIONS = {
  'home': () => { $('main-input').value = ''; showEmpty(); },
  'mode': (el) => applyMode(el.dataset.m),
  'open-settings': openSettings, 'close-settings': closeSettings,
  'share': share,
  'install': async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; $('install-btn').hidden = true; },
  'trad': (el) => { STATE.traditions[el.dataset.t] = !STATE.traditions[el.dataset.t]; syncSettingsUI(); if (STATE.currentWord) analyze({ silent: true }); },
  'setting-trad': (el) => { STATE.traditions[el.dataset.t] = !STATE.traditions[el.dataset.t]; syncSettingsUI(); if (STATE.currentWord) analyze({ silent: true }); },
  'religion': (el) => { STATE.religions[el.dataset.rel] = !STATE.religions[el.dataset.rel]; syncSettingsUI(); if (STATE.currentWord) analyze({ silent: true }); },
  'layer': (el) => { const l = el.dataset.l; STATE.layers[l] = !STATE.layers[l]; syncSettingsUI(); if (STATE.currentWord) analyze({ silent: true }); },
  'toggle-sources': () => { STATE.sources = !STATE.sources; syncSettingsUI(); if (STATE.currentWord) analyze({ silent: true }); },
  'toggle-music-setting': () => { STATE.musicAutostart = !STATE.musicAutostart; syncSettingsUI(); if (STATE.musicAutostart) Music.start(); else Music.stop(); },
  'music-toggle': () => Music.toggle(), 'music-next': () => Music.skip(),
  'save-session': saveSession, 'load-session': async () => { if (await loadSession()) closeSettings(); }, 'clear-session': clearSession,
  'wipe-all': () => { Store.clearAll(); STATE.history = []; renderHistory(); refreshKeyStatus(); toast('everything stored on this device was wiped'); },
  'save-key': async () => { const inp = $('api-key'); const ok = await Store.saveApiKey(inp.value); inp.value = ''; if (!ok) { $('key-status').className = 'key-status err'; $('key-status').textContent = 'that does not look like an api key'; return; } await refreshKeyStatus(); if (STATE.currentWord) analyze({ silent: true }); },
  'clear-key': async () => { Store.clearApiKey(); $('api-key').value = ''; await refreshKeyStatus(); if (STATE.currentWord) analyze({ silent: true }); },
  'bg-upload': () => $('bg-upload').click(),
  'bg-reset': () => { const l = $('bg-layer'); l.style.backgroundImage = ''; l.classList.remove('custom'); resetPalette(); },
  'add-compare': addCompare, 'remove-compare': (el) => { STATE.compare = STATE.compare.filter((w) => w !== el.dataset.w); renderCompareChips(); renderSplitView(); },
  'open-split': openSplitView, 'close-split': () => { $('split-view').hidden = true; },
  'panel': (el) => showPanel(el.dataset.p),
  'tab': (el) => switchTab(el.dataset.tab),
  'analyze-word': (el) => { $('main-input').value = el.dataset.w || ''; analyze(); },
  'add-traj': addTrajectory, 'clear-traj': () => { STATE.trajectory = []; if (STATE.currentWord) analyze({ silent: true }); },
  'install-cipher': installCustomCipher,
  'remove-cipher': (el) => { const k = el.dataset.c; delete STATE.customCiphers[k]; STATE.activeCiphers.delete(k); if (!STATE.activeCiphers.size) STATE.activeCiphers.add('ordinal'); rebuildCipherList(); if (STATE.currentWord) analyze({ silent: true }); },
  'mirror': (el) => el.classList.toggle('open'),
  'ent-add': addEntityFromForm,
  'ent-remove': (el) => { STATE.entities = STATE.entities.filter((e) => e.id !== el.dataset.id); STATE.activeTab = 'structure'; if (STATE.currentWord) analyze({ silent: true }); },
  'ent-clear': () => { STATE.entities = []; STATE.activeTab = 'structure'; if (STATE.currentWord) analyze({ silent: true }); },
  'ent-geo': (el) => fetchEntityCoords(el.dataset.id),
  'ent-suggest': suggestEntities,
};
function wireEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el) { const fn = ACTIONS[el.dataset.action]; if (fn) { if (el.tagName === 'A') e.preventDefault(); e.stopPropagation(); fn(el); } return; }
    const row = e.target.closest('.c-item');
    if (row?.dataset.c) toggleCipher(row.dataset.c);
  });
  $('cipher-list').addEventListener('keydown', (e) => { const row = e.target.closest('.c-item'); if (row && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleCipher(row.dataset.c); } });
  const input = $('main-input');
  let liveTimer = null;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(liveTimer); analyze(); } });
  input.addEventListener('input', () => {
    clearTimeout(liveTimer);
    const v = safeWord(input.value);
    if (!v) { showEmpty(); return; }
    updateSidebarVals(v);
    $('result').classList.add('stale');
    liveTimer = setTimeout(() => analyze(), 280);
  });
  $('compare-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCompare(); } });
  $('custom-code').addEventListener('input', validateAndPreview);
  document.addEventListener('change', (e) => {
    if (e.target?.dataset?.role === 'st-cipher') { const k = e.target.value; STATE.structCipher = k in getAllCiphers() ? k : ''; STATE.activeTab = 'structure'; if (STATE.currentWord) analyze({ silent: true }); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'traj-input' && e.key === 'Enter') { e.preventDefault(); addTrajectory(); return; }
    if (/^ent-(label|text|date|lat|lon)$/.test(e.target.id || '') && e.key === 'Enter') { e.preventDefault(); addEntityFromForm(); return; }
    if (e.key === 'Escape' && !$('settings-overlay').hidden) { closeSettings(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveSession(); return; }
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); if (isMobile()) showPanel('sidebar'); input.focus(); input.select(); }
  });
  $('settings-overlay').addEventListener('mousedown', function (e) { if (e.target === this) closeSettings(); });
  $('bg-upload').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f && setBackgroundFile(f)) $('bg-layer').classList.add('custom'); else if (f) toast('use a png, jpeg, webp, gif or avif under 15 mb'); e.target.value = ''; });
  const main = $('main-area');
  main.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  main.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && setBackgroundFile(f)) $('bg-layer').classList.add('custom'); });
  $('music-vol').addEventListener('input', (e) => { Music.setVolume(e.target.value); Store.savePrefs({ vol: Music.getVolume() }); });
  Music.onMusicState(({ playing, label }) => { $('music-play-btn').textContent = playing ? '⏸' : '▶'; $('music-play-btn').setAttribute('aria-label', playing ? 'pause music' : 'play music'); $('music-label-el').textContent = label; document.querySelectorAll('.eq-bar').forEach((b) => b.classList.toggle('paused', !playing)); });
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('install-btn').hidden = false; });
  window.addEventListener('appinstalled', () => { installEvt = null; $('install-btn').hidden = true; toast('uriel installed'); });
  window.addEventListener('resize', () => { if (!isMobile()) { $('sidebar').classList.remove('mobile-hidden'); $('main-area').classList.remove('mobile-hidden'); } else showPanel(STATE.mobilePanel); });
  document.addEventListener('click', () => { if (STATE.musicAutostart && !Music.isPlaying()) Music.start(); }, { once: true });
}

// ── startup ───────────────────────────────────────────────────────────────────
async function init() {
  wireEvents();
  initResize();
  renderSuggestions();
  $('about-corpus') && ($('about-corpus').textContent = String(CORPUS_SIZE));
  $('about-corpus-n') && ($('about-corpus-n').textContent = String(CORPUS_SIZE));
  $('about-ciphers-n') && ($('about-ciphers-n').textContent = String(Object.keys(C.BUILTIN_CIPHERS).length));
  $('about-version') && ($('about-version').textContent = CONFIG.version);
  const prefs = Store.loadPrefs();
  if (Number.isFinite(prefs.vol)) { Music.setVolume(prefs.vol); $('music-vol').value = String(Music.getVolume()); }
  applyMode('biblical');
  await refreshKeyStatus();
  await loadSession({ quiet: true });
  renderHistory();
  setOnline(navigator.onLine);
  if (UNTRUSTED) { STATE.sources = false; STATE.aiKey = false; }
  const q = safeWord(new URLSearchParams(location.search).get('q') || '');
  if (q) { $('main-input').value = q; analyze(); if (isMobile()) showPanel('main'); }
  else if (!isMobile()) $('main-input').focus();
  spawnMist();
  registerSW();
  if ('requestIdleCallback' in window) requestIdleCallback(verifyIntegrity, { timeout: 8000 }); else setTimeout(verifyIntegrity, 4000);
}
init();
