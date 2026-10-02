// ── Site configuration ────────────────────────────────────────────────────────
// Edit these when you deploy to your own domain. Everything is frozen at load.
export const CONFIG = Object.freeze({
  name: 'Uriel',
  version: '2.2.0',
  // Canonical origin of the deployed site (used for share links and the sitemap).
  siteUrl: 'https://shep95.github.io/gem.asherin/',
  // Domain defence: hosts this build is allowed to run on. When the page is
  // opened from any other host (a phishing mirror, a scraped copy) a banner is
  // shown and network features are disabled. Leave empty to disable the check.
  allowedHosts: Object.freeze(['localhost', '127.0.0.1', 'shep95.github.io', 'gem.asherin.com', 'www.gem.asherin.com', 'asherin.com', 'www.asherin.com']),
  // Anthropic Messages API (optional, needs a user-supplied key stored on-device).
  ai: Object.freeze({
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-6',
    maxTokens: 500,
    maxInflight: 4,
  }),
  // Free, keyless data sources. Responses are cached on-device with a TTL.
  sources: Object.freeze({
    dictionary: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
    wikipedia: 'https://en.wikipedia.org/api/rest_v1/page/summary/',
    bible: 'https://bible-api.com/',
    cacheTtlMs: 1000 * 60 * 60 * 24 * 30, // 30 days
  }),
  limits: Object.freeze({ maxInput: 200, maxHistory: 24, maxCompare: 6, maxTrajectory: 12 }),
});
