// ── Mathematical Structure panel ──────────────────────────────────────────────
// Renders the report from js/structure.mjs underneath the existing result
// panels. Values come straight from the existing cipher engine (calcWord); this
// module never assigns letter values of its own.
import * as C from './ciphers.mjs';
import * as S from './structure.mjs';
import { esc } from './sanitize.mjs';

export const ENTITY_KINDS = Object.freeze(['person', 'organization', 'event', 'location', 'date', 'title', 'other']);

/** Compute the existing cipher value for a text under one cipher key. */
export function valueOf(text, all, cipherKey) {
  const r = C.calcWord(C.lettersOnly(text), all);
  const v = r[cipherKey];
  return v && v.applies ? v.v : 0;
}

/**
 * Build the entity list the engine analyses: the headline word first, then the
 * user's entities. Every value is the existing calculator's output.
 */
export function buildEntities(raw, userEntities, all, cipherKey) {
  const head = { id: 'head', label: raw, kind: 'word', text: raw, value: valueOf(raw, all, cipherKey) };
  const rest = userEntities.map((e) => ({ ...e, value: e.text ? valueOf(e.text, all, cipherKey) : 0, lat: Number.isFinite(e.lat) ? e.lat : undefined, lon: Number.isFinite(e.lon) ? e.lon : undefined }));
  return [head, ...rest];
}

const num = (x, d = 2) => (Number.isFinite(x) ? (Number.isInteger(x) ? String(x) : x.toFixed(d)) : '—');
const row = (k, v) => `<div class="st-row"><span class="st-k">${esc(k)}</span><span class="st-v">${v}</span></div>`;
const sec = (title, body, note) => `<div class="st-sec"><div class="sec-lbl">${esc(title)}</div>${note ? `<div class="st-note">${esc(note)}</div>` : ''}${body}</div>`;
const list = (items) => (items.length ? `<ul class="st-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '');
const tag = (t) => `<span class="prop">${t}</span>`;
const labelsOf = (arr) => (arr && arr.length ? ` <i class="st-who">← ${arr.map(esc).join(', ')}</i>` : '');

function arithmeticHTML(a) {
  const body = row('factorization', esc(a.factorization))
    + row('divisors', esc(a.divisors.length > 24 ? a.divisors.slice(0, 24).join(', ') + ' …' : a.divisors.join(', ')) + ` <i class="st-who">(${a.divisors.length})</i>`)
    + row('factor pairs', esc(a.factorPairs.map(([x, y]) => `${x}×${y}`).join(', ')))
    + row('digits', `sum ${a.digitSum} · digital root ${a.digitalRoot} · reversed ${a.reversed}`)
    + row('modular', esc(Object.entries(a.mods).map(([m, r]) => `mod ${m} = ${r}`).join(' · ')))
    + row('powers & roots', `${a.n}² = ${a.square} · ${a.n}³ = ${a.cube} · √${a.n} = ${num(a.sqrt, 3)}${a.isSquare ? ' (integer)' : ''} · ∛${a.n} = ${num(a.cbrt, 3)}${a.isCube ? ' (integer)' : ''}`)
    + row('bases', `binary ${esc(a.binary)} · base 12 ${esc(a.base12)}${a.base60 ? ` · base 60 ${esc(a.base60)}` : ''}`)
    + row('aliquot', esc(a.aliquot))
    + (a.sumOfTwoSquares.length ? row('sum of two squares', esc(a.sumOfTwoSquares.map(([x, y]) => `${x}² + ${y}²`).join(' = '))) : '')
    + (a.differenceOfSquares.length ? row('difference of squares', esc(a.differenceOfSquares.map(([x, y]) => `${x}² − ${y}²`).join(' = '))) : '')
    + (a.sumOfTwoCubes.length ? row('sum of two cubes', esc(a.sumOfTwoCubes.map(([x, y]) => `${x}³ + ${y}³`).join(' = '))) : '')
    + (a.differenceOfCubes.length ? row('difference of cubes', esc(a.differenceOfCubes.map(([x, y]) => `${x}³ − ${y}³`).join(' = '))) : '');
  const tags = a.notable.length ? `<div class="props">${a.notable.map((x) => tag(esc(x.text))).join('')}</div>` : '<div class="st-note">no named sequence membership (not prime, polygonal, fibonacci, power or palindrome)</div>';
  return sec('arithmetic structure', tags + body);
}

function algebraicHTML(alg) {
  if (alg.entities.length < 2) return sec('algebraic structure', '<div class="st-note">add entities in the workbench above to test sums, differences, products, ratios, gcd and lcm between their existing values.</div>');
  const pairRows = alg.pairs.map((p) => {
    const hits = p.hits.map((h) => `<b>${esc(h.expr)} = ${h.value}</b>${labelsOf(h.matches)}`);
    return `<div class="st-pair"><div class="st-pair-h">${esc(p.a.label)} (${p.a.value}) ↔ ${esc(p.b.label)} (${p.b.value})</div>`
      + `<div class="st-pair-v">sum ${p.sum} · diff ${p.diff} · product ${p.product} · ratio ${p.ratio[0]}:${p.ratio[1]} · gcd ${p.gcd} · lcm ${p.lcm}${p.shared ? ` · both multiples of ${p.shared.gcd} (${p.shared.a}×, ${p.shared.b}×)` : ''}</div>`
      + (hits.length ? list(hits) : '') + '</div>';
  }).join('');
  const triples = alg.triples.map((t) => `<b>${esc(t.text)}</b>`);
  const seqs = alg.sequences.map((s) => `${esc(s.type)} sequence: ${esc(s.text)}`);
  const stats = `<div class="st-note">tested ${alg.tested} candidate relations across ${alg.entities.length} values (range up to ${alg.range}); ${alg.hits} exact hits, ≈${alg.expectedHits.toFixed(2)} expected by chance.</div>`;
  return sec('algebraic structure', stats + (triples.length ? '<div class="sec-lbl">equations satisfied</div>' + list(triples) : '<div class="st-note">no A+B=C, A×B=C, A²+B²=C² or A²±B²=C relation among the entity values (non-match reported).</div>') + (seqs.length ? '<div class="sec-lbl">sequences</div>' + list(seqs) : '') + '<div class="sec-lbl">pairwise</div>' + pairRows);
}

// Placeholder figures the app fills with inline SVG (initStructureMount).
function geoFigures(n, g) {
  const figs = [];
  const fig = (kind, label, k = 0) => `<figure class="geo-fig"><div class="geo-canvas" data-geo="${kind}" data-n="${n}" data-k="${k}"></div><figcaption>${esc(label)}</figcaption></figure>`;
  if (n >= 3 && n <= 24) figs.push(fig('ngon', `regular ${n}-gon with all chords`));
  else figs.push(fig('circle', `${n}° around the circle`));
  if (g.triangle.triangularIndex) figs.push(fig('triangular', `${n} dots → triangle of ${g.triangle.triangularIndex} rows`, g.triangle.triangularIndex));
  if (g.square.asArea.integer) figs.push(fig('square', `${n} = ${Math.round(Math.sqrt(n))}² square`, Math.round(Math.sqrt(n))));
  else { const fp = g.rectangles.find((r) => r.a > 1 && r.a !== 1); if (fp) figs.push(fig('factorgrid', `${fp.a} × ${fp.b} grid`, fp.a)); }
  if (n >= 5 && n <= 60) { const step = n % 2 === 0 ? (n % 3 === 0 ? 0 : 0) : (n - 1) / 2 >= 2 ? 2 : 0; const k = n >= 5 ? (Math.floor(n / 2) >= 2 ? 2 : 0) : 0; if (k >= 2 && gcdInt(n, k) === 1) figs.push(fig('star', `star polygon {${n}/${k}}`, k)); }
  return figs.length ? `<div class="geo-figs">${figs.join('')}</div>` : '';
}
function gcdInt(a, b) { while (b) [a, b] = [b, a % b]; return a; }

function geometryHTML(g, n) {
  if (!g) return '';
  const rects = g.rectangles.slice(0, 8).map((r) => `${r.a} × ${r.b}${r.meaningful ? ' <b>← both/one side is an entity value</b>' + labelsOf([...r.aLabels, ...r.bLabels]) : ''}`);
  const hyps = g.hypotenuseOf.map((h) => `${n} = ${h.a}² + ${h.b}² — distance √${n} = ${num(h.c, 3)} between (0,0) and (${h.a},${h.b})${h.meaningful ? ' <b>← leg is an entity value</b>' + labelsOf([...h.aLabels, ...h.bLabels]) : ''}`);
  const asH = g.asHypotenuse.map((t) => `right triangle ${t.a}, ${t.b}, ${t.c} — ${n} is the hypotenuse`);
  const legs = g.legOf.map((t) => `right triangle ${t.a}, ${t.b}, ${t.c} — ${n} is a leg${t.meaningful ? ' <b>← another side is an entity value</b>' : ''}`);
  const body = row('as a rectangle / grid', rects.length ? list(rects) : 'prime — only 1 × ' + n)
    + row('as a squared distance', hyps.length ? list(hyps) : `not a sum of two squares (no lattice point at distance √${n})`)
    + (asH.length ? row('as a hypotenuse', list(asH)) : '')
    + (legs.length ? row('as a leg', list(legs)) : '')
    + row('as a square', `side ${n} → area ${g.square.asSide.area}, perimeter ${g.square.asSide.perimeter}, diagonal ${num(g.square.asSide.diagonal)} · area ${n} → side ${num(g.square.asArea.side, 3)}${g.square.asArea.integer ? ' (integer)' : ''}`)
    + row('as a cube', `side ${n} → volume ${g.cube.asSide.volume}, surface ${g.cube.asSide.surface} · volume ${n} → side ${num(g.cube.asVolume.side, 3)}${g.cube.asVolume.integer ? ' (integer)' : ''}`)
    + row('as a circle', `radius ${n} → circumference ${num(g.circle.asRadius.circumference)}, area ${num(g.circle.asRadius.area)} · circumference ${n} → radius ${num(g.circle.asCircumference.radius)}, diameter ${num(g.circle.asCircumference.diameter)}`)
    + row('as an angle', `${g.angle.deg}° (${num(g.angle.turns, 3)} turns)${g.angle.isRightMultiple ? ' · multiple of 90°' : ''}${g.angle.regularPolygonWithThisInteriorAngle ? ` · interior angle of a regular ${g.angle.regularPolygonWithThisInteriorAngle}-gon` : ''} · a regular ${n}-gon has interior angle ${num(g.angle.interiorAngleOfNgon)}° and exterior ${num(g.angle.exteriorAngleOfNgon)}°`)
    + row('as a triangle', `equilateral side ${n} → height ${num(g.triangle.equilateralHeight)}, area ${num(g.triangle.equilateralArea)}${g.triangle.triangularIndex ? ` · ${n} dots form a triangle of ${g.triangle.triangularIndex} rows` : ''}`)
    + row('symmetry', `rotational orders ${esc(g.symmetry.rotational.join(', ') || 'none')} · ${esc(g.symmetry.reflection)}`)
    + (g.scaling.length ? row('scaling vs entities', list(g.scaling.map((s) => `${n} : ${s.value} (${esc(s.label)}) = ${esc(s.fraction)}`))) : '');
  return sec('geometric structure', geoFigures(n, g) + body, 'geometric readings are only flagged (bold) when a dimension is independently an entity value; the rest are the shapes the number can occupy.');
}

function temporalHTML(t) {
  if (!t.dated.length) return sec('temporal structure', '<div class="st-note">no entity has a date. add dates (YYYY-MM-DD) in the workbench to compare intervals with the values.</div>');
  const dates = t.dated.map((d) => `${esc(d.label)} — ${esc(d.date)} (day ${d.dayOfYear} of the year)`);
  const ivs = t.intervals.map((iv) => {
    const strong = iv.matches.filter((m) => !m.weak).map((m) => `<b>${esc(m.text)}</b>`);
    const weak = iv.matches.filter((m) => m.weak).map((m) => esc(m.text));
    return `<div class="st-pair"><div class="st-pair-h">${esc(iv.a)} → ${esc(iv.b)}</div><div class="st-pair-v">${iv.days} days · ${iv.weeks} weeks · ${iv.months} months · ${iv.years} years · midpoint ${esc(iv.midpoint)}${iv.structure.length ? ' · ' + iv.days + ' is ' + esc(iv.structure.join(', ')) : ''}</div>${strong.length ? list(strong) : '<div class="st-note">no exact equality or integer multiple with any entity value (non-match reported)</div>'}${weak.length ? `<div class="st-note">weak: ${weak.join('; ')}</div>` : ''}</div>`;
  }).join('');
  const comps = t.components.flatMap((c) => c.matches.map((m) => `<b>${esc(m.text)}</b>`));
  const ratios = t.ratios.map((r) => esc(r.text));
  const stats = `<div class="st-note">tested ${t.tested} interval/component comparisons; ${t.hits} exact hits, ≈${t.expectedHits.toFixed(2)} expected by chance.</div>`;
  return sec('temporal structure', stats + list(dates) + (t.intervals.length ? ivs : '<div class="st-note">add a second dated entity to measure an interval.</div>') + (comps.length ? '<div class="sec-lbl">date components equal to a value</div>' + list(comps) : '') + (ratios.length ? '<div class="sec-lbl">interval ratios</div>' + list(ratios) : ''));
}

function spatialHTML(s) {
  if (!s.located.length) return sec('spatial structure', '<div class="st-note">no entity has coordinates. add latitude/longitude in the workbench, or fetch them from wikipedia for a location, to compare distances and bearings with the values. geography is never invented.</div>');
  const locs = s.located.map((l) => `${esc(l.label)} — ${l.lat}, ${l.lon} <i class="st-who">(${esc(l.source)})</i>`);
  const ds = s.distances.map((d) => {
    const hits = d.matches.map((m) => `<b>${esc(m.text)}</b>`);
    return `<div class="st-pair"><div class="st-pair-h">${esc(d.a)} → ${esc(d.b)}</div><div class="st-pair-v">${d.km} km · ${d.miles} mi · bearing ${d.bearing}° · midpoint ${d.midpoint.lat}, ${d.midpoint.lon}</div>${hits.length ? list(hits) : '<div class="st-note">no exact equality with any entity value (non-match reported)</div>'}</div>`;
  }).join('');
  const tris = s.triangles.map((t) => `${t.points.map(esc).join(' – ')}: sides ${t.sides.join(' / ')} km · area ${t.areaKm2} km²${t.nearRight ? ' · <b>near right-angled (within 2%)</b>' : ''}${t.nearEquilateral ? ' · <b>near equilateral</b>' : t.nearIsosceles ? ' · near isosceles' : ''}${t.ratio ? ` · side ratio 1 : ${num(t.ratio[0])} : ${num(t.ratio[1])}` : ''}`);
  const stats = `<div class="st-note">tested ${s.tested} distance/bearing/coordinate comparisons; ${s.hits} exact hits, ≈${s.expectedHits.toFixed(2)} expected by chance.</div>`;
  return sec('spatial structure', stats + list(locs) + (s.centre ? `<div class="st-note">geometric centre of all located entities: ${s.centre.lat}, ${s.centre.lon}</div>` : '') + ds + (tris.length ? '<div class="sec-lbl">triangles</div>' + list(tris) : '') + (s.coordMatches.length ? '<div class="sec-lbl">coordinate components equal to a value</div>' + list(s.coordMatches.map((m) => `<b>${esc(m.text)}</b>`)) : ''));
}

function networkHTML(entities, alg, t, s) {
  if (entities.length < 2) return '';
  const edges = [];
  for (const p of alg.pairs) for (const h of p.hits) if (h.matches?.length || h.type === 'multiple' || h.type === 'equal') edges.push(`${esc(p.a.label)} —[${esc(h.type)}: ${esc(h.expr)}${h.matches?.length ? ' = ' + esc(h.matches.join(', ')) : ''}]— ${esc(p.b.label)}`);
  for (const tr of alg.triples) edges.push(`${esc(tr.text)} [${esc(tr.type)}]`);
  for (const iv of t.intervals) { edges.push(`${esc(iv.a)} —[${iv.days} days]— ${esc(iv.b)}`); for (const m of iv.matches) if (m.type === 'equal') edges.push(`  ↳ <b>${esc(m.text)}</b>`); }
  for (const d of s.distances) { edges.push(`${esc(d.a)} —[${d.km} km, ${d.bearing}°]— ${esc(d.b)}`); for (const m of d.matches) if (m.type === 'equal') edges.push(`  ↳ <b>${esc(m.text)}</b>`); }
  const nodes = entities.map((e) => `<span class="prop"><b>${esc(e.label)}</b> ${esc(e.kind)} · ${e.value}${e.date ? ' · ' + esc(e.date) : ''}${Number.isFinite(e.lat) ? ' · 📍' : ''}</span>`).join('');
  return sec('cross-entity relationships', `<div class="props">${nodes}</div>` + (edges.length ? list(edges) : '<div class="st-note">no measured edge links these entities yet.</div>'), 'nodes carry the existing calculator\'s values; edges are measured relationships (difference, ratio, interval, distance) rather than symbolic ones.');
}

function convergenceHTML(c, nearby) {
  const layers = c.layers.length ? c.layers.map((l) => tag(esc(l))).join('') : tag('none');
  const dens = nearby.map((n) => `${esc(n.hit)} — ${n.alsoMatching.length} of the ${n.window} neighbouring values (${esc(n.alsoMatching.join(', ') || 'none')}) would also have matched an entity value → match density ${(n.density * 100).toFixed(0)}%`);
  const verdictCls = c.verdict.startsWith('statistically') ? 'hi' : c.verdict.startsWith('multiple') ? 'mid' : 'lo';
  return sec('structural convergence', `<div class="props">${layers}</div>` + row('verdict', `<b class="st-${verdictCls}">${esc(c.verdict)}</b>`) + row('exact hits / tests', `${c.hits} / ${c.tested} (≈${c.expected} expected by chance)`) + (dens.length ? '<div class="sec-lbl">nearby-value density (anti-cherry-picking)</div>' + list(dens) : ''), 'a single equality is a possible match. independent layers (algebraic + temporal + spatial + geometric) must each contribute before the verdict rises, and hits are always read against the number of candidates tested.');
}

function reverseHTML(r) {
  if (!r) return '';
  const rows = r.rows.map((x) => `${esc(x.structure)}: ${x.members.map(esc).join(', ')}`);
  return sec('reverse structural search', (r.structures.length ? `<div class="props">${r.structures.map((s) => tag(esc(s))).join('')}</div>` : '') + (rows.length ? list(rows) : `<div class="st-note">no entity or corpus word occupies a structure of ${r.n} (divisors, multiples, roots, squares, square-sum components, reversal, digital root, sequence indices).</div>`), 'which entities and corpus words occupy the structures this number belongs to — the reverse of value lookup.');
}

function multiScaleHTML(m) {
  const words = m.words.length > 1 ? list(m.words.map((w) => `${esc(w.label)} = ${w.value}${w.tags.length ? ' — ' + esc(w.tags.join(', ')) : ''}`)) : '';
  const rec = m.recurring.length ? `<div class="st-note"><b>recurs across scales:</b> ${esc(m.recurring.join(', '))} holds at phrase and word level.</div>` : (m.words.length > 1 ? '<div class="st-note">no structure of the phrase value recurs at word level — the pattern is scale-specific.</div>' : '');
  const letters = m.letters ? row('letters', `${m.letters.count} letter values · min ${m.letters.min} · max ${m.letters.max} · mean ${m.letters.mean}${m.letters.arithmeticStep !== null ? ` · <b>arithmetic progression, step ${m.letters.arithmeticStep}</b>` : ''}${m.letters.symmetric ? ' · <b>palindromic value sequence</b>' : ''}`) : '';
  return sec('multi-scale', row('phrase', `${m.phrase.value}${m.phrase.tags.length ? ' — ' + esc(m.phrase.tags.join(', ')) : ''}`) + words + rec + letters, 'letter → word → phrase. a relationship that only exists at one level is reported as such.');
}

function alternativesHTML(report, all, activeKeys, cipherKey) {
  // alternatives: same headline structures under the other active ciphers, and corpus words sharing them
  const items = [];
  const headTags = new Set(report.arithmetic.notable.map((x) => x.tag));
  for (const k of activeKeys) {
    if (k === cipherKey) continue;
    const v = report.head.cipherValues?.[k];
    if (!Number.isFinite(v) || v <= 0) continue;
    const tags = S.describeNumber(v);
    const shared = tags.filter((t) => headTags.has(t));
    items.push(`${esc(all[k]?.name || k)}: ${v}${tags.length ? ' — ' + esc(tags.join(', ')) : ' — no named structure'}${shared.length ? ` <b>(shares ${esc(shared.join(', '))} with ${esc(all[cipherKey]?.name || cipherKey)})</b>` : ''}`);
  }
  return sec('alternative matches', (items.length ? '<div class="sec-lbl">same word under the other active ciphers</div>' + list(items) : '') + `<div class="st-note">the cipher selector above re-runs the whole layer on another system's values; compare before concluding anything about one of them.</div>`, 'each cipher system is analysed independently. structures that survive a change of cipher are more robust than those that appear in only one.');
}

export function workbenchHTML(userEntities, all, activeKeys, cipherKey, primaryKey, opts = {}) {
  const options = [...activeKeys].map((k) => `<option value="${esc(k)}"${k === cipherKey ? ' selected' : ''}>${esc(all[k]?.name || k)}${k === primaryKey ? ' (primary)' : ''}</option>`).join('');
  const rows = userEntities.map((e) => `<tr><td><b>${esc(e.label)}</b><br><small>${esc(e.text)}</small></td><td>${esc(e.kind)}</td><td>${e.value ?? '—'}</td><td>${esc(e.date || '')}</td><td>${Number.isFinite(e.lat) ? `${e.lat}, ${e.lon}<br><small>${esc(e.coordSource || 'user')}</small>` : (e.kind === 'location' && opts.sources ? `<button type="button" class="go-btn auto tiny" data-action="ent-geo" data-id="${esc(e.id)}">fetch from wikipedia</button>` : '')}</td><td><button type="button" class="c-del" data-action="ent-remove" data-id="${esc(e.id)}" aria-label="remove ${esc(e.label)}">×</button></td></tr>`).join('');
  return `<div class="st-bench">
<div class="st-bench-h"><span class="sec-lbl">entities</span><label class="st-sel">cipher <select id="st-cipher" data-role="st-cipher">${options}</select></label></div>
<div class="st-note">the headline word is entity one. add the people, organisations, events, locations and dates connected to it; each is run through the existing calculator under the selected cipher. dates and coordinates are only used when you supply them or fetch them from wikipedia.</div>
${userEntities.length ? `<table class="st-table"><thead><tr><th>entity</th><th>kind</th><th>value</th><th>date</th><th>coordinates</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : ''}
<div class="st-form">
  <input class="srch-in sm" id="ent-label" type="text" placeholder="label (e.g. a person)" maxlength="80" aria-label="entity label">
  <select class="srch-in sm" id="ent-kind" aria-label="entity kind">${ENTITY_KINDS.map((k) => `<option value="${k}">${k}</option>`).join('')}</select>
  <input class="srch-in sm" id="ent-text" type="text" placeholder="text to calculate (defaults to label)" maxlength="200" aria-label="text to calculate">
  <input class="srch-in sm" id="ent-date" type="text" inputmode="numeric" placeholder="date YYYY-MM-DD" maxlength="10" aria-label="date">
  <input class="srch-in sm" id="ent-lat" type="text" inputmode="decimal" placeholder="lat" maxlength="12" aria-label="latitude">
  <input class="srch-in sm" id="ent-lon" type="text" inputmode="decimal" placeholder="lon" maxlength="12" aria-label="longitude">
  <button type="button" class="go-btn auto" data-action="ent-add">add entity</button>
  ${opts.ai ? '<button type="button" class="go-btn auto" data-action="ent-suggest" title="ask the ai for related people, places, dates and organisations">suggest related</button>' : ''}
  ${userEntities.length ? '<button type="button" class="go-btn auto danger" data-action="ent-clear">clear all</button>' : ''}
</div></div>`;
}

/** Full panel: workbench + §13 report. */
export function renderStructure({ raw, all, activeKeys, primaryKey, cipherKey, userEntities, corpusLookup, sources, ai }) {
  const key = activeKeys.has(cipherKey) ? cipherKey : primaryKey;
  const entities = buildEntities(raw, userEntities, all, key);
  const full = C.calcWord(C.lettersOnly(raw), all);
  entities[0].cipherValues = Object.fromEntries(Object.entries(full).map(([k, v]) => [k, v.applies ? v.v : 0]));
  const words = raw.split(' ').filter(Boolean).map((w) => ({ label: w, value: valueOf(w, all, key) }));
  const letters = [...C.lettersOnly(raw)].map((ch) => valueOf(ch, all, key));
  const report = S.analyze(entities, { corpusLookup, words, letters });
  const head = `<div class="st-head"><div class="st-head-n">${report.n}</div><div class="st-head-t">existing gematria result · ${esc(all[key]?.name || key)} · “${esc(raw)}”</div></div>`;
  const significanceSec = significanceHTML(raw, all, key, report.n, corpusLookup);
  const interp = sec('interpretation', `<div class="st-note">everything above the verdict is arithmetic fact about the calculator's output: factorisations, shapes, intervals and distances are computed, not read into. the <em>verdict</em> and any “meaningful” flags are hypotheses about whether independent measurements coincide; they are only as strong as the test counts and chance baselines shown beside them.</div>`);
  const entitiesWithValues = entities.slice(1);
  return `<div class="st-wrap">${workbenchHTML(entitiesWithValues, all, activeKeys, key, primaryKey, { sources, ai })}${head}`
    + arithmeticHTML(report.arithmetic) + algebraicHTML(report.algebraic) + geometryHTML(report.geometry, report.n)
    + temporalHTML(report.temporal) + spatialHTML(report.spatial) + networkHTML(entities, report.algebraic, report.temporal, report.spatial)
    + convergenceHTML(report.convergence, report.nearby) + significanceSec + alternativesHTML(report, all, activeKeys, key) + reverseHTML(report.reverse) + multiScaleHTML(report.multiScale)
    + interp + '</div>';
}

const LETTER_FREQ = 'eeeeeeeeeeeettttttttttaaaaaaaaoooooooiiiiiiinnnnnnsssssshhhhhhrrrrrrddddllllcccuuummmwwffggyyppbbvkjxqz';
function significanceHTML(raw, all, key, n, corpusLookup) {
  const len = C.lettersOnly(raw).length;
  const fn = all[key]?.fn;
  if (!fn || len < 1 || len > 40) return '';
  const isHit = (v) => corpusLookup(v).length > 0;
  const observedHit = isHit(n);
  const sampleValue = (rng) => {
    let w = '';
    for (let i = 0; i < len; i++) w += LETTER_FREQ[(rng() * LETTER_FREQ.length) | 0];
    try { const v = fn(w); return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0; } catch { return 0; }
  };
  const mc = S.monteCarloMatch({ trials: 2000, sampleValue, isHit, observedHit, observedValue: n });
  const cls = mc.observedHit ? (mc.rate < 0.05 ? 'hi' : mc.rate < 0.2 ? 'mid' : 'lo') : 'lo';
  const body = row('corpus match', observedHit ? `yes — ${esc(cipherLabel(all, key))} value ${n} appears in the corpus` : `no — value ${n} is not a corpus value`)
    + row('random baseline', `${(mc.rate * 100).toFixed(1)}% of ${mc.trials.toLocaleString()} random ${len}-letter words (english letter frequencies) produce a value that also lands a corpus match`)
    + row('reading', `<b class="st-${cls}">${esc(mc.verdict)}</b>`);
  return sec('significance (monte carlo)', body, 'a gematria match means more when few random words of the same length would also match. this samples ' + '2,000 random words under the same cipher and reports how often they hit — the match\'s rarity, computed rather than asserted.');
}
function cipherLabel(all, key) { return all[key]?.name || key; }
