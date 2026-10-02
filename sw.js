/* Uriel service worker — offline-first app shell, runtime caching for fonts
 * and keyless data APIs. Bump VERSION whenever a precached file changes. */
const VERSION = 'uriel-v2.3.0';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const DATA = `${VERSION}-data`;

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/uriel.css',
  './js/guard.js',
  './js/app.mjs',
  './js/config.mjs',
  './js/ciphers.mjs',
  './js/storage.mjs',
  './js/ai.mjs',
  './js/sources.mjs',
  './js/theme.mjs',
  './js/music.mjs',
  './js/sanitize.mjs',
  './js/structure.mjs',
  './js/structure-ui.mjs',
  './js/spells.mjs',
  './js/spells-ui.mjs',
  './data/lexicon.txt',
  './js/data/index.mjs',
  './js/data/corpus.mjs',
  './js/data/corpus-base.mjs',
  './js/data/corpus-extra.mjs',
  './js/data/knowledge.mjs',
  './js/data/readings.mjs',
  './js/data/meanings.mjs',
  './js/data/cipher-notes.mjs',
  './assets/bg.webp',
  './assets/bg-800.webp',
  './assets/bg-tiny.webp',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

const DATA_HOSTS = ['api.dictionaryapi.dev', 'en.wikipedia.org', 'bible-api.com'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const NEVER_CACHE = ['api.anthropic.com', 'ice1.somafm.com', 'stream.radioparadise.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Precache individually so one missing file does not abort the install.
    await Promise.all(PRECACHE.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); } catch { /* skip */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch { /* ignore */ } }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function staleWhileRevalidate(request, cacheName, maxEntries = 200) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (res) => {
    if (res && res.ok) { await cache.put(request, res.clone()); trim(cacheName, maxEntries); }
    return res;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

async function trim(cacheName, max) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  } catch { /* ignore */ }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (NEVER_CACHE.includes(url.hostname)) return; // live streams and the AI API go straight to the network

  // Navigations: network first (fresh HTML), fall back to cached shell, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const res = await fetch(request);
        if (res && res.ok) { const c = await caches.open(SHELL); c.put('./index.html', res.clone()); }
        return res;
      } catch {
        return (await caches.match('./index.html')) || (await caches.match('./offline.html')) || Response.error();
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    // Same-origin assets: cache first, refresh in background.
    event.respondWith(staleWhileRevalidate(request, SHELL, 400));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME, 40));
    return;
  }
  if (DATA_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, DATA, 300));
  }
});
