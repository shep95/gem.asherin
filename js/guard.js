/* ── Uriel console & runtime guard ─────────────────────────────────────────────
 * Classic script, loaded first, before any module. Defence in depth on top of
 * the CSP in index.html:
 *   1. frame-busting (clickjacking) — meta CSP cannot express frame-ancestors
 *   2. self-XSS warning in the devtools console
 *   3. domain check — a copy served from an unknown host is flagged and its
 *      network features are disabled
 *   4. MutationObserver that removes injected <script>/<iframe>/<object>
 *      elements (CSP already blocks them from running; this also logs it)
 *   5. prototype-pollution hardening of the core built-ins we depend on
 *   6. a tiny read-only diagnostics surface at window.uriel
 * Nothing here collects data; nothing leaves the device.
 */
(function () {
  'use strict';
  var FLAGS = { framed: false, hostOk: true, injected: 0 };

  // 1 ── frame-busting
  try {
    if (window.top !== window.self) {
      FLAGS.framed = true;
      try { window.top.location.href = window.self.location.href; } catch (e) { /* cross-origin */ }
      document.documentElement.style.display = 'none';
    }
  } catch (e) { /* ignore */ }

  // 2 ── console warning (shown once per page load)
  try {
    var big = 'color:#e87a7a;font-size:28px;font-weight:bold;font-family:Georgia,serif';
    var txt = 'color:#85997e;font-size:13px;font-family:monospace;line-height:1.6';
    console.log('%cStop.', big);
    console.log('%cThis console is for developers. If someone told you to paste something here to "unlock" a feature, it is a scam that can hand them your data. Uriel stores nothing on a server and never asks you to paste code.', txt);
    console.log('%csource: https://github.com/shep95/gem.asherin · report: /.well-known/security.txt', txt);
  } catch (e) { /* ignore */ }

  // 3 ── domain check (list lives in js/config.mjs; mirrored here so it runs before modules)
  var ALLOWED = ['localhost', '127.0.0.1', 'shep95.github.io', 'gem.asherin.com', 'www.gem.asherin.com', 'asherin.com', 'www.asherin.com'];
  try {
    var host = location.hostname;
    var isFile = location.protocol === 'file:';
    if (!isFile && ALLOWED.length && ALLOWED.indexOf(host) === -1 && !/\.local$/.test(host) && !/^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host)) {
      FLAGS.hostOk = false;
      document.documentElement.setAttribute('data-untrusted-host', '1');
    }
  } catch (e) { /* ignore */ }

  // 4 ── injected element watchdog (armed once the document has finished parsing,
  //      so the page's own scripts are never mistaken for injections)
  try {
    var BAD = { IFRAME: 1, OBJECT: 1, EMBED: 1, BASE: 1 };
    var armed = false;
    var isForeignScript = function (n) {
      if (n.tagName !== 'SCRIPT') return false;
      var src = n.getAttribute('src');
      if (!src) return true; // inline script: never legitimate after load
      try { return new URL(src, location.href).origin !== location.origin; } catch (e) { return true; }
    };
    var obs = new MutationObserver(function (muts) {
      if (!armed) return;
      for (var m = 0; m < muts.length; m++) {
        var added = muts[m].addedNodes;
        for (var i = 0; i < added.length; i++) {
          var n = added[i];
          if (n && n.nodeType === 1 && (BAD[n.tagName] || isForeignScript(n))) {
            FLAGS.injected++;
            try { n.parentNode && n.parentNode.removeChild(n); } catch (e) { /* ignore */ }
            try { console.warn('[uriel guard] removed injected <' + n.tagName.toLowerCase() + '>'); } catch (e) { /* ignore */ }
          }
        }
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    var arm = function () { armed = true; };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm, { once: true }); else arm();
  } catch (e) { /* ignore */ }

  // 5 ── prototype pollution hardening (only the properties attackers target)
  try {
    var lock = function (obj, prop) {
      var d = Object.getOwnPropertyDescriptor(obj, prop);
      if (d && d.configurable) Object.defineProperty(obj, prop, { configurable: false, writable: false, value: d.value });
    };
    lock(Object.prototype, 'toString'); lock(Object.prototype, 'hasOwnProperty'); lock(Object.prototype, 'valueOf');
    lock(Array.prototype, 'map'); lock(Array.prototype, 'forEach'); lock(Array.prototype, 'reduce'); lock(Array.prototype, 'filter');
    lock(String.prototype, 'replace'); lock(String.prototype, 'toLowerCase');
    lock(JSON, 'parse'); lock(JSON, 'stringify');
    lock(window, 'fetch');
  } catch (e) { /* ignore */ }

  // 6 ── read-only diagnostics
  try {
    Object.defineProperty(window, 'uriel', {
      configurable: false, enumerable: false, writable: false,
      value: Object.freeze({
        version: '2.2.0',
        guard: Object.freeze({ get flags() { return Object.freeze(Object.assign({}, FLAGS)); } }),
        source: 'https://github.com/shep95/gem.asherin',
      }),
    });
  } catch (e) { /* ignore */ }
})();
