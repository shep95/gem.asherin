// ── Optional AI readings (Anthropic Messages API, streamed) ───────────────────
// Only runs when the user has stored their own API key on-device. Without a key
// the UI shows the offline reading instead. Prompts are bounded, responses are
// written with textContent only, and in-flight streams are cancelled on every
// new analysis so stale text never lands in a fresh result.
import { CONFIG } from './config.mjs';
import { loadApiKey } from './storage.mjs';

let _genId = 0;
let _inflight = 0;
const _controllers = new Set();
const _cache = new Map(); // prompt -> text (session only)

export function cancelAllStreams() {
  _genId++;
  for (const c of _controllers) { try { c.abort(); } catch { /* ignore */ } }
  _controllers.clear();
  _inflight = 0;
}

export async function hasApiKey() { return Boolean(await loadApiKey()); }

/** Redact anything that looks like a key before an error reaches the DOM/console. */
function scrub(msg) { return String(msg).replace(/sk-[A-Za-z0-9_\-]+/g, 'sk-***'); }

/**
 * Stream a completion into targetEl. Resolves with the final text ('' if
 * skipped or cancelled). Never throws.
 */
export async function streamAI(prompt, targetEl, { onDone } = {}) {
  if (!targetEl || !navigator.onLine) return '';
  const key = await loadApiKey();
  if (!key) return '';
  const p = String(prompt).slice(0, 2000);
  if (_cache.has(p)) { targetEl.textContent = _cache.get(p); onDone?.(_cache.get(p)); return _cache.get(p); }
  if (_inflight >= CONFIG.ai.maxInflight) return '';
  _inflight++;
  const myGen = _genId;
  const ctrl = new AbortController();
  _controllers.add(ctrl);

  const loader = document.createElement('div');
  loader.className = 'ai-loading';
  loader.setAttribute('aria-label', 'loading');
  for (let i = 0; i < 3; i++) loader.appendChild(Object.assign(document.createElement('div'), { className: 'ai-dot' }));
  targetEl.replaceChildren(loader);

  let text = '';
  try {
    const res = await fetch(CONFIG.ai.endpoint, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: CONFIG.ai.model, max_tokens: CONFIG.ai.maxTokens, stream: true, messages: [{ role: 'user', content: p }] }),
    });
    if (_genId !== myGen || !document.body.contains(targetEl)) return '';
    if (!res.ok) {
      let detail = res.status === 401 ? 'invalid api key' : res.status === 429 ? 'rate limited — try again shortly' : `api error ${res.status}`;
      try { const j = await res.json(); if (j?.error?.message) detail += ' · ' + scrub(j.error.message).slice(0, 160); } catch { /* ignore */ }
      throw new Error(detail);
    }
    const out = document.createElement('div');
    out.className = 'ai-stream stream-cursor';
    targetEl.replaceChildren(out);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (_genId !== myGen || !document.body.contains(targetEl)) { reader.cancel().catch(() => {}); break; }
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const j = JSON.parse(line.slice(5).trim());
          if (j.type === 'content_block_delta' && typeof j.delta?.text === 'string') { text += j.delta.text; out.textContent = text; }
        } catch { /* partial frame */ }
      }
    }
    out.classList.remove('stream-cursor');
    if (text) _cache.set(p, text);
    if (_genId === myGen) onDone?.(text);
    return text;
  } catch (e) {
    if (e.name !== 'AbortError' && document.body.contains(targetEl) && _genId === myGen) {
      const err = document.createElement('div');
      err.className = 'note note-warn';
      err.textContent = 'ai reading unavailable: ' + scrub(e.message);
      targetEl.replaceChildren(err);
    }
    return '';
  } finally {
    _controllers.delete(ctrl);
    _inflight = Math.max(0, _inflight - 1);
  }
}

export const PROMPTS = Object.freeze({
  etymology: (w) => `You are a linguistic etymologist. Give a precise, factual etymology of "${w}" in 3-5 sentences. Cover the original language, root meaning, and how the meaning evolved. Write in lowercase. Be specific.`,
  tradition: (t, w, o, r) => `You are a scholar of the ${t} tradition. Analyze the word "${w}" (ordinal value ${o}, reduces to ${r}) from the ${t} perspective. 3-4 sentences. Cover specific texts, figures, or practices. Be factual. Lowercase.`,
  behavioral: (w) => `For the word "${w}" — in 1-2 sentences, does the actual function of this thing in the world match what its etymological roots and gematria value suggest it should be? Be direct and specific. Lowercase. No preamble.`,
  root: (w) => `State in one precise sentence the single irreducible principle the word "${w}" encodes at its deepest structural level. No metaphor. No preamble. Lowercase.`,
});
