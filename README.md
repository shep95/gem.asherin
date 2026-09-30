# Uriel — gematria engine

**Live:** https://shep95.github.io/gem.asherin/

Uriel calculates the numerical value of any word or phrase across 22 cipher
systems — Hebrew *mispar hechrachi* and *mispar gadol*, Greek isopsephy, English
ordinal, Pythagorean, Chaldean, Agrippa, Bacon, Crowley, prime, Fibonacci and
more — then shows what shares that number: a 750-word corpus across biblical,
hebrew, greek, hermetic, islamic, eastern, cosmic and cultural domains, Hebrew
letter and sefirot correspondences, scripture references, tarot arcana, number
properties, etymologies and per-tradition readings.

It is a single static site: no server, no accounts, no analytics. After the
first visit it works fully offline and can be installed as an app.

## Features

- **22 ciphers** with provenance notes, plus a custom cipher builder with
  inline validation. Hebrew and Greek input use real letter values.
- **Corpus matches** — exact (same ordinal) and reduced (same digital root),
  grouped by domain and filtered by the traditions you have enabled.
- **Readings** — built-in etymologies and tradition readings for common words;
  computed readings (Hebrew/Greek numeral decomposition, scripture numbers,
  tree of life, tarot, number theory) for everything else.
- **Sources** — optional live dictionary, Wikipedia and scripture-text lookups
  with no key needed, cached on-device for offline reuse.
- **Optional AI readings** using your own Anthropic API key, stored encrypted
  on your device and sent nowhere else.
- **Mathematical structure layer** — takes the calculator's own values as
  mathematical objects: factorisation, polygonal and Fibonacci membership, sums
  and differences of squares and cubes, rectangles, right triangles, circles and
  angles; an entity workbench (people, organisations, events, locations, dates)
  tests sums, differences, products, ratios, Pythagorean triples and sequences
  between values, day intervals between dates and great-circle distances between
  coordinates (user-supplied or fetched from Wikipedia, never invented), with a
  cross-entity relationship map, reverse structural search, multi-scale check
  and an honest convergence verdict: every hit is shown next to the number of
  candidates tested, a chance baseline and nearby-value match density.
- **Compare** up to six words side by side with a compatibility score;
  **trajectory** arcs; atbash and albam mirrors; phrase breakdowns.
- **Shareable links** (`?q=word`), keyboard shortcuts, adaptive theme from a
  background image you drop in, ambient radio with an offline synth fallback.
- **Responsive** from phones to ultrawide; respects reduced motion and high
  contrast; installable PWA with an offline page.

## Security

See [SECURITY.md](SECURITY.md) for the threat model. In short: strict CSP with
Trusted Types, no inline or third-party scripts, allowlist HTML sanitizer,
frozen data tables, prototype-pollution guards, console self-XSS warning,
domain allowlist, file-integrity manifest, secret scanning and CodeQL in CI.

## Development

```sh
npm start          # serve locally on :8080
npm test           # tests (ciphers, corpus, policies, integrity)
npm run integrity  # after editing any shipped file
```

See [DEPLOY.md](DEPLOY.md) for hosting, custom domains and headers.

## Layout

```
index.html            page, SEO metadata, CSP
css/                  stylesheet + self-hosted fonts
js/app.mjs            UI and rendering
js/ciphers.mjs        pure cipher engine (unit-tested)
js/sanitize.mjs       allowlist sanitizer + Trusted Types policy
js/structure.mjs      mathematical structure engine (pure, unit-tested)
js/structure-ui.mjs   structure tab + entity workbench
js/guard.js           console / frame / injection / host guard
js/storage.mjs        AES-GCM device storage + response cache
js/ai.mjs             optional Anthropic streaming client
js/sources.mjs        dictionary / wikipedia / scripture lookups
js/data/              corpus, meanings, letters, readings
sw.js                 service worker (offline-first)
tests/                node:test suites
tools/                asset + integrity generators
```

Fonts: EB Garamond and JetBrains Mono, SIL Open Font License.
