// ── Background image + adaptive palette ──────────────────────────────────────
const SIZE = 64;

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}
function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
function hsl2rgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)].map((v) => Math.round(v * 255));
}
const hex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

export function extractPalette(img) {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
  let darkest = [255, 255, 255], lightest = [0, 0, 0], mr = 0, mg = 0, mb = 0, mc = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue;
    const px = [d[i], d[i + 1], d[i + 2]], l = lum(px);
    if (l < lum(darkest)) darkest = px;
    if (l > lum(lightest)) lightest = px;
    if (l > 60 && l < 180) { mr += px[0]; mg += px[1]; mb += px[2]; mc++; }
  }
  const mid = mc ? [Math.round(mr / mc), Math.round(mg / mc), Math.round(mb / mc)] : darkest;
  const [h, s] = rgb2hsl(...mid);
  const accent = hsl2rgb((h + 0.1) % 1, Math.min(s + 0.2, 0.8), 0.55);
  return { dark: darkest, mid, light: lightest, accent, hue: h };
}

export function applyPalette(p) {
  const root = document.documentElement.style;
  const [r, g, b] = p.dark, [ar, ag, ab] = p.accent;
  const lift = (n) => hex(p.dark.map((v) => v + n));
  root.setProperty('--gh', `rgba(${r},${g},${b},0.82)`);
  root.setProperty('--gm', `rgba(${r},${g},${b},0.64)`);
  root.setProperty('--gl', `rgba(${r},${g},${b},0.40)`);
  root.setProperty('--ln', `rgba(${ar},${ag},${ab},0.14)`);
  root.setProperty('--ln2', `rgba(${ar},${ag},${ab},0.07)`);
  root.setProperty('--t0', lift(160)); root.setProperty('--t1', lift(100)); root.setProperty('--t2', lift(50)); root.setProperty('--t3', lift(30));
  root.setProperty('--a', hex(p.accent));
  root.setProperty('--a2', `rgba(${ar},${ag},${ab},0.14)`);
  root.setProperty('--a3', `rgba(${ar},${ag},${ab},0.07)`);
  const cool = p.hue > 0.45 && p.hue < 0.75;
  root.setProperty('--serif', cool ? "'JetBrains Mono',monospace" : "'EB Garamond',Georgia,serif");
}

export function resetPalette() {
  const root = document.documentElement.style;
  ['--gh', '--gm', '--gl', '--ln', '--ln2', '--t0', '--t1', '--t2', '--t3', '--a', '--a2', '--a3', '--serif'].forEach((k) => root.removeProperty(k));
}

let _objectUrl = null;
/** Apply a user image as background (object URL, never persisted). */
export function setBackgroundFile(file, onPalette) {
  if (!file || !/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type) || file.size > 15 * 1024 * 1024) return false;
  if (_objectUrl) URL.revokeObjectURL(_objectUrl);
  _objectUrl = URL.createObjectURL(file);
  const layer = document.getElementById('bg-layer');
  const img = new Image();
  img.onload = () => {
    if (layer) layer.style.backgroundImage = `url("${_objectUrl}")`;
    try { const p = extractPalette(img); applyPalette(p); onPalette?.(p); } catch { /* tainted canvas etc. */ }
  };
  img.src = _objectUrl;
  return true;
}
