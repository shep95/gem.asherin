# Security policy

Uriel is a static, client-side web app. There is no server, no account and no
database: every calculation, reading and saved session lives in the visitor's
browser. This document describes the threat model, the defences in place, and
how to report a problem.

## Reporting a vulnerability

- Preferred: open a private advisory at
  https://github.com/shep95/gem.asherin/security/advisories/new
- Otherwise open an issue with the label `security` and no exploit details;
  a maintainer will move it to a private channel.
- Machine-readable contact: `/.well-known/security.txt`.

Please give us a reasonable time to fix before public disclosure.

## Threat model

| Threat | Defence |
|---|---|
| Cross-site scripting through user input, URL `?q=`, session data, dictionary / encyclopedia responses | Every string is escaped before it enters markup; every markup write goes through an allowlist sanitizer (`js/sanitize.mjs`); Trusted Types are required by the CSP so no string can reach an HTML sink without it; API text is written with `textContent` only. |
| Script injection by an extension, a compromised CDN, a man-in-the-middle | `script-src 'self'` with no inline scripts or handlers; no third-party JavaScript at all; fonts are self-hosted; `object-src 'none'`, `base-uri 'none'`; a MutationObserver removes injected `<script>`/`<iframe>`/`<object>` elements; `integrity.json` hashes every shipped file and the app warns when a served file differs. |
| Data exfiltration after a hypothetical XSS | `connect-src`, `img-src`, `media-src` and `form-action` restrict where the page may send anything: only the optional AI and data-source hosts are reachable. |
| Prototype pollution via JSON (custom ciphers, saved sessions, cached API data) | Keys are allowlisted; `__proto__`, `constructor` and `prototype` are rejected; maps are built on `Object.create(null)`; core built-ins are locked in `js/guard.js`; all data tables are deep-frozen. |
| Clickjacking | Frame-busting in `js/guard.js` plus `frame-ancestors 'none'` / `X-Frame-Options: DENY` where headers can be set. |
| Self-XSS (someone told to paste code into the console) | A prominent console warning; no globals to call — the app is an ES module and exposes only a frozen, read-only `window.uriel`. |
| Phishing mirror / scraped copy on another domain | `allowedHosts` in `js/config.mjs` (mirrored in `js/guard.js`): an unknown host shows a warning banner and disables all network features. |
| API key theft | The key is stored AES-GCM encrypted, sent only to `api.anthropic.com` (enforced by CSP), never logged, scrubbed from error messages, and spend is capped at 20 requests per minute and 4 in flight. |
| Service-worker cache poisoning | Only `GET`, only same-origin files and an explicit allowlist of data hosts are cached; error responses are never cached; the AI API and audio streams are never cached; `sw.js` is served with `no-cache`. |
| Denial of service via pathological input | Input is capped at 200 characters; corpus lookups are indexed maps; all regexes are linear. |
| Malicious uploaded background image | Only raster types (png, jpeg, webp, gif, avif) under 15 MB are accepted; SVG is refused; the image is used as an object URL and never persisted or uploaded. |
| Secrets in the repository | Gitleaks runs in CI on every push; CodeQL (security-extended) runs on `main` weekly. |

## Limitations to be honest about

- **Local encryption is not a vault.** The AES-GCM key is derived from stable
  browser properties so saved data survives reloads without a password. It
  protects against casual inspection and cross-site leakage, not against
  someone with full access to the unlocked device. Do not store an API key on
  a shared computer.
- **GitHub Pages cannot send HTTP headers.** The `<meta>` CSP covers the
  important directives, but `frame-ancestors`, HSTS, `X-Content-Type-Options`
  and `Permissions-Policy` only apply when the site is served through a host
  that honours `_headers` (Cloudflare Pages, Netlify) or `vercel.json`
  (Vercel), or when Cloudflare is placed in front of Pages. See `DEPLOY.md`.
- **The integrity manifest is served from the same origin.** It detects
  partial tampering, injecting proxies and stale cache mixes, not an attacker
  who controls the whole origin. Compare `integrity.json` against the
  repository if you need a stronger guarantee.
- **Third-party data sources** (dictionaryapi.dev, Wikipedia, bible-api.com)
  see the word you look up when live sources are on. Turn them off in settings
  if that matters to you; everything else works without them.

## Domain defence checklist (for whoever owns the DNS)

1. Enforce HTTPS and enable **HSTS** (and submit to the preload list once
   stable).
2. Add a **CAA** record so only your CA can issue certificates:
   `example.com. CAA 0 issue "letsencrypt.org"`.
3. Enable **DNSSEC** at the registrar.
4. Publish **SPF**, **DKIM** and a `p=reject` **DMARC** policy even if the
   domain sends no mail, so it cannot be spoofed:
   `v=spf1 -all` and `_dmarc TXT "v=DMARC1; p=reject"`.
5. Lock the registrar account (2FA, transfer lock) and set the GitHub Pages
   custom domain **verified** in repository settings so nobody else can claim it.
6. Keep `allowedHosts` in `js/config.mjs` and `js/guard.js` in sync with the
   real domain list.
