// ── Keyless data sources ──────────────────────────────────────────────────────
// Dictionary definitions, encyclopedia summaries and scripture text pulled from
// free public APIs. Every response is cached on-device (30 days) and, once seen,
// also served by the service worker — so a word looked up once works offline.
import { CONFIG } from './config.mjs';
import { cacheGet, cacheSet } from './storage.mjs';

const TTL = CONFIG.sources.cacheTtlMs;
const TIMEOUT = 8000;

async function getJSON(url, cacheKey) {
  const hit = cacheGet(cacheKey, TTL);
  if (hit !== null) return hit;
  if (!navigator.onLine) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' }, referrerPolicy: 'no-referrer' });
    if (res.status === 404) { cacheSet(cacheKey, { none: true }); return { none: true }; }
    if (!res.ok) return null;
    const data = await res.json();
    cacheSet(cacheKey, data);
    return data;
  } catch { return null; } finally { clearTimeout(t); }
}

const clean = (s) => String(s).replace(/\s+/g, ' ').trim().slice(0, 600);

/** Free Dictionary API (Wiktionary-derived): meanings, phonetics, origin. */
export async function lookupDictionary(word) {
  const w = String(word).trim().toLowerCase();
  if (!/^[a-z][a-z\-' ]{0,60}$/.test(w)) return null;
  const data = await getJSON(CONFIG.sources.dictionary + encodeURIComponent(w), 'dict:' + w);
  if (!data || data.none || !Array.isArray(data) || !data[0]) return null;
  const e = data[0];
  const meanings = (e.meanings || []).slice(0, 4).map((m) => ({
    pos: clean(m.partOfSpeech || ''),
    defs: (m.definitions || []).slice(0, 3).map((d) => clean(d.definition || '')).filter(Boolean),
    synonyms: (m.synonyms || []).slice(0, 6).map(clean),
  }));
  const phon = (e.phonetics || []).map((p) => p.text).find(Boolean) || e.phonetic || '';
  return { word: clean(e.word || w), phonetic: clean(phon), origin: e.origin ? clean(e.origin) : '', meanings, source: 'dictionaryapi.dev', url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(w) };
}

/** Wikipedia REST summary. */
export async function lookupWikipedia(term) {
  const t = String(term).trim();
  if (!t || t.length > 80) return null;
  const title = t.replace(/\s+/g, '_');
  const data = await getJSON(CONFIG.sources.wikipedia + encodeURIComponent(title), 'wiki:' + title.toLowerCase());
  if (!data || data.none || data.type === 'disambiguation' && !data.extract) return null;
  if (!data.extract) return null;
  return {
    title: clean(data.title || t),
    description: clean(data.description || ''),
    extract: clean(data.extract),
    url: data.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title),
    thumbnail: data.thumbnail?.source && /^https:\/\/upload\.wikimedia\.org\//.test(data.thumbnail.source) ? data.thumbnail.source : '',
    source: 'wikipedia',
  };
}

/** bible-api.com — public domain text for a reference like "john 1:1". */
export async function lookupVerse(ref) {
  const r = String(ref).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!/^[1-3]?\s?[a-z]+ \d{1,3}(:\d{1,3}(-\d{1,3})?)?$/.test(r)) return null;
  const data = await getJSON(CONFIG.sources.bible + encodeURIComponent(r) + '?translation=web', 'bible:' + r);
  if (!data || data.none || !data.text) return null;
  return { reference: clean(data.reference || r), text: clean(data.text).slice(0, 700), translation: clean(data.translation_name || 'web'), source: 'bible-api.com' };
}

/** Pull a scripture reference like "(john 1:1)" or "rev 13:18" out of free text. */
export function extractReference(text) {
  const m = /\b((?:[1-3]\s?)?(?:gen|genesis|exod|exodus|lev|leviticus|num|numbers|deut|deuteronomy|josh|judg|judges|ruth|sam|samuel|kgs|kings|chr|chronicles|ezra|neh|esth|job|ps|psalm|psalms|prov|eccl|isa|isaiah|jer|jeremiah|ezek|ezekiel|dan|daniel|hos|hosea|joel|amos|jonah|mic|micah|hab|zech|mal|matt|matthew|mark|luke|john|acts|rom|romans|cor|corinthians|gal|galatians|eph|ephesians|phil|col|thess|tim|timothy|titus|heb|hebrews|jas|james|pet|peter|jude|rev|revelation)\s?\d{1,3}:\d{1,3}(?:-\d{1,3})?)\b/i.exec(String(text));
  return m ? m[1].toLowerCase() : null;
}
