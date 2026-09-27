# Deploying Uriel

Uriel is plain static files — no build step is required to run it. Any static
host works. The repository is set up for GitHub Pages out of the box.

## GitHub Pages (default)

1. Push to `main`. The workflow in `.github/workflows/pages.yml` runs the tests
   and publishes the site.
2. In **Settings → Pages** choose **Source: GitHub Actions** the first time.
3. The site appears at `https://shep95.github.io/gem.asherin/`.

### Custom domain

1. Add a `CNAME` file at the repository root containing only the domain, e.g.
   `gem.asherin.com`, and point DNS at GitHub Pages (`CNAME` → `shep95.github.io`
   for a subdomain; the four `A` records for an apex).
2. In **Settings → Pages** enter the domain, wait for the check, tick
   **Enforce HTTPS**, and verify the domain under your **profile → Pages**
   settings so it cannot be taken over.
3. Update the canonical URL in `index.html`, `sitemap.xml`, `robots.txt`,
   `.well-known/security.txt`, and `siteUrl` / `allowedHosts` in
   `js/config.mjs` and `js/guard.js`. Then run `npm run integrity`.

GitHub Pages cannot set HTTP headers. For HSTS, `frame-ancestors`,
`Permissions-Policy` and the cache headers, put Cloudflare in front of the
domain (proxied DNS) and add the headers as a **Transform Rule**, or host on
Cloudflare Pages / Netlify (`_headers`) or Vercel (`vercel.json`) which are
already configured in this repo.

## Any other static host

Upload the repository contents except `tests/`, `tools/`, `.github/` and the
markdown files. Make sure:

- `sw.js` is served with `Cache-Control: no-cache` (it is the update channel).
- `manifest.webmanifest` is served as `application/manifest+json`.
- `.well-known/security.txt` is served as `text/plain`.

## Local development

```sh
npm start          # http://localhost:8080
npm test           # unit + data + policy tests
npm run integrity  # regenerate integrity.json after editing any shipped file
npm run assets     # regenerate icons / og image (needs Playwright + Chromium)
```

`npm test` fails when `integrity.json` is stale, so remember to run
`npm run integrity` before committing changes to any file it lists.

## Updating the service worker

Bump `VERSION` in `sw.js` whenever a precached file changes. Returning visitors
get a "new version is ready — reload" toast.
