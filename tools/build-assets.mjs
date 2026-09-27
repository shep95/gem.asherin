// Generates PWA icons, the Open Graph image and the manifest screenshots with
// headless Chromium (Playwright). Run: npm run assets
// Requires a local Playwright + Chromium; the committed PNGs are the output.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => path.join(root, p);
const exe = process.env.CHROMIUM_PATH || undefined;
// Playwright may live in a global prefix: PLAYWRIGHT_MODULE=/path/to/node_modules/playwright
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');

const ICON_SVG = (maskable) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#16321b"/><stop offset="1" stop-color="#030704"/></radialGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#g)"/>
  <circle cx="256" cy="256" r="${maskable ? 150 : 176}" fill="none" stroke="#79a563" stroke-opacity="0.35" stroke-width="3"/>
  <text x="256" y="${maskable ? 318 : 330}" text-anchor="middle" font-family="Georgia,'EB Garamond',serif" font-style="italic" font-size="${maskable ? 190 : 230}" fill="#ccd7c5">U</text>
  <text x="${maskable ? 350 : 372}" y="${maskable ? 190 : 176}" text-anchor="middle" font-family="serif" font-size="${maskable ? 60 : 72}" fill="#79a563">✦</text>
</svg>`;

fs.mkdirSync(out('assets/icons'), { recursive: true });
fs.writeFileSync(out('assets/icons/icon.svg'), ICON_SVG(false));

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();

async function rasterSvg(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: out(file), omitBackground: true, type: 'png' });
}
await rasterSvg(ICON_SVG(false), 192, 'assets/icons/icon-192.png');
await rasterSvg(ICON_SVG(false), 512, 'assets/icons/icon-512.png');
await rasterSvg(ICON_SVG(false), 180, 'assets/icons/apple-touch-icon.png');
await rasterSvg(ICON_SVG(true), 512, 'assets/icons/icon-maskable-512.png');

// Open Graph card: uses assets/og-source.png (a real screenshot) when present,
// otherwise renders a synthetic card. Output is always 1200x630 over the app background.
await page.setViewportSize({ width: 1200, height: 630 });
if (fs.existsSync(out('assets/og-source.png'))) {
  const shot = fs.readFileSync(out('assets/og-source.png')).toString('base64');
  await page.setContent(`<body style="margin:0;width:1200px;height:630px;background:#030704;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="data:image/png;base64,${shot}" style="width:1200px;height:auto;display:block"></body>`);
} else {
  const bg = fs.readFileSync(out('assets/bg.webp')).toString('base64');
  await page.setContent(`<html><body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Georgia,serif;background:#030704">
<img src="data:image/webp;base64,${bg}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(168deg,rgba(2,5,3,0.45),rgba(2,4,2,0.92))"></div>
<div style="position:absolute;left:80px;top:150px;color:#ccd7c5">
  <div style="font-size:120px;font-style:italic;color:#79a563;line-height:1">Uriel</div>
  <div style="font-family:Menlo,monospace;font-size:22px;letter-spacing:0.18em;color:#85997e;margin-top:14px">GEMATRIA ENGINE</div>
  <div style="font-size:34px;font-style:italic;margin-top:44px;max-width:900px;line-height:1.35">hebrew · greek · english ciphers<br>etymology, scripture, tree of life, tarot — private, offline</div>
</div></body></html>`);
}
await page.screenshot({ path: out('assets/og.png'), type: 'png' });
await browser.close();
console.log('assets written');
