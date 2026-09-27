// ── Device-local storage ──────────────────────────────────────────────────────
// Session state and the optional API key are AES-GCM encrypted with a key
// derived from a device fingerprint. Nothing here ever leaves the browser.
// Every read/write is wrapped so a blocked or full storage never crashes the UI.

const SAVE_KEY = 'uriel_v2';
const KEY_KEY = 'uriel_apikey_v1';
const PREF_KEY = 'uriel_prefs_v1';
const CACHE_PREFIX = 'uriel_cache:';

const hasCrypto = typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined';

function ls(op, ...args) {
  try { return localStorage[op](...args); } catch { return null; }
}

let _keyPromise = null;
function deriveKey() {
  if (!_keyPromise) {
    _keyPromise = (async () => {
      const fp = [
        navigator.language || '',
        (typeof screen !== 'undefined' && screen.colorDepth) || '',
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        navigator.hardwareConcurrency || '',
        'uriel-local-seed-2026',
      ].join('|');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp));
      return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    })();
  }
  return _keyPromise;
}

async function encrypt(data) {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  return JSON.stringify({ v: 2, iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) });
}

async function decrypt(raw) {
  const { v, iv, ct } = JSON.parse(raw);
  if (v !== 2 || !Array.isArray(iv) || !Array.isArray(ct)) return null;
  const key = await deriveKey();
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(ct));
  return JSON.parse(new TextDecoder().decode(dec));
}

export async function saveEncrypted(slot, data) {
  if (!hasCrypto) return false;
  try { ls('setItem', slot, await encrypt(data)); return true; } catch { return false; }
}
export async function loadEncrypted(slot) {
  if (!hasCrypto) return null;
  const raw = ls('getItem', slot);
  if (!raw) return null;
  try { return await decrypt(raw); } catch { return null; }
}

// ── session ───────────────────────────────────────────────────────────────────
export const saveSessionData = (data) => saveEncrypted(SAVE_KEY, data);
export const loadSessionData = () => loadEncrypted(SAVE_KEY);
export function clearSessionData() { ls('removeItem', SAVE_KEY); }

// ── api key ───────────────────────────────────────────────────────────────────
export async function saveApiKey(key) {
  const k = String(key || '').trim();
  if (!k) { ls('removeItem', KEY_KEY); return true; }
  if (!/^[A-Za-z0-9_\-]{20,200}$/.test(k)) return false;
  return saveEncrypted(KEY_KEY, { k });
}
export async function loadApiKey() {
  const d = await loadEncrypted(KEY_KEY);
  return d && typeof d.k === 'string' ? d.k : '';
}
export function clearApiKey() { ls('removeItem', KEY_KEY); }

// ── plain prefs (non-sensitive, e.g. music volume) ────────────────────────────
export function loadPrefs() {
  try { const p = JSON.parse(ls('getItem', PREF_KEY) || '{}'); return p && typeof p === 'object' ? p : {}; } catch { return {}; }
}
export function savePrefs(patch) {
  const next = { ...loadPrefs(), ...patch };
  ls('setItem', PREF_KEY, JSON.stringify(next));
  return next;
}

// ── response cache with TTL (for keyless data sources) ────────────────────────
export function cacheGet(key, ttlMs) {
  const raw = ls('getItem', CACHE_PREFIX + key);
  if (!raw) return null;
  try {
    const { t, d } = JSON.parse(raw);
    if (typeof t !== 'number' || Date.now() - t > ttlMs) { ls('removeItem', CACHE_PREFIX + key); return null; }
    return d;
  } catch { return null; }
}
export function cacheSet(key, data) {
  try { ls('setItem', CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), d: data })); }
  catch { pruneCache(); }
}
export function pruneCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(CACHE_PREFIX)) keys.push(k); }
    keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
export function clearAll() {
  clearSessionData(); clearApiKey(); ls('removeItem', PREF_KEY);
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('uriel')) keys.push(k); }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
