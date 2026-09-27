// ── HTML sanitizer + Trusted Types policy ─────────────────────────────────────
// Every innerHTML write in the app goes through setHTML(). The markup is parsed
// inert, walked, and anything outside a strict allowlist of tags / attributes
// is dropped: no <script>, no event handlers, no javascript: URLs, no <style>,
// no foreign namespaces. Where the browser supports Trusted Types the CSP
// (require-trusted-types-for 'script') makes this the ONLY way to reach a
// string-to-HTML sink, so an escaping bug elsewhere cannot become XSS.

const TAGS = new Set(['div', 'span', 'p', 'b', 'i', 'em', 'strong', 'small', 'br', 'ol', 'ul', 'li', 'button', 'a', 'img', 'input', 'h2', 'h3', 'label', 'details', 'summary', 'code']);
const ATTRS = new Set(['class', 'id', 'title', 'role', 'tabindex', 'hidden', 'type', 'placeholder', 'maxlength', 'autocomplete', 'autocapitalize', 'spellcheck', 'enterkeyhint', 'value', 'alt', 'loading', 'decoding', 'width', 'height', 'rel', 'target', 'lang', 'dir', 'for', 'open', 'referrerpolicy']);
const URL_ATTRS = { href: /^(https:\/\/[^\s]+|\.\/[^\s]*|\?[^\s]*|#[\w\-]*)$/i, src: /^https:\/\/upload\.wikimedia\.org\/[^\s]+$/i };

function clean(node) {
  const kids = [...node.childNodes];
  for (const k of kids) {
    if (k.nodeType === 3) continue; // text
    if (k.nodeType !== 1 || k.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !TAGS.has(k.localName)) { k.remove(); continue; }
    for (const a of [...k.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('data-') || n.startsWith('aria-')) { if (/[<>"'`]/.test(a.value)) k.removeAttribute(a.name); continue; }
      if (URL_ATTRS[n]) { if (!URL_ATTRS[n].test(a.value.trim())) k.removeAttribute(a.name); continue; }
      if (!ATTRS.has(n)) k.removeAttribute(a.name);
    }
    if (k.localName === 'a') { k.setAttribute('rel', 'noopener noreferrer'); if (k.getAttribute('target') && k.getAttribute('target') !== '_blank') k.removeAttribute('target'); }
    if (k.localName === 'input' && !/^(text|search|password)$/.test(k.getAttribute('type') || 'text')) k.setAttribute('type', 'text');
    clean(k);
  }
}

// Parsing into an inert DOMParser document is itself a Trusted Types sink, so a
// second policy exists only to feed the parser. The document it produces is
// never connected to the page; only the cleaned serialisation is.
let parsePolicy = null;
try {
  if (window.trustedTypes && window.trustedTypes.createPolicy) parsePolicy = window.trustedTypes.createPolicy('uriel-parse', { createHTML: (s) => s });
} catch { parsePolicy = null; }
const parser = new DOMParser();

export function sanitize(html) {
  const raw = '<body>' + String(html);
  const doc = parser.parseFromString(parsePolicy ? parsePolicy.createHTML(raw) : raw, 'text/html');
  clean(doc.body);
  return doc.body.innerHTML;
}

let policy = null;
try {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    policy = window.trustedTypes.createPolicy('uriel', {
      createHTML: (s) => sanitize(s),
      // the only script URL the app ever assigns is its own service worker
      createScriptURL: (s) => (s === 'sw.js' ? s : null),
    });
  }
} catch { policy = null; }

/** Replace an element's children with sanitized markup. */
export function setHTML(el, html) {
  if (!el) return;
  el.innerHTML = policy ? policy.createHTML(html) : sanitize(html);
}

/** Escape text for interpolation into markup. */
export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/** Static reading text may use <em> only; everything else is escaped. */
export function escEm(s) {
  return esc(s).replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>').replace(/&lt;span class=&quot;heb&quot;&gt;/g, '<span class="heb">').replace(/&lt;\/span&gt;/g, '</span>');
}

/** The service-worker URL as a TrustedScriptURL where required. */
export function swURL() { return policy ? policy.createScriptURL('sw.js') : 'sw.js'; }
