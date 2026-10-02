// ── "spells" tab: hidden words, names, statements and vowel order ─────────────
// Values shown beside each hidden word come from the existing calcWord under the
// word's primary cipher; this module assigns no letter values of its own.
import * as C from './ciphers.mjs';
import * as W from './spells.mjs';
import { esc } from './sanitize.mjs';

let lexPromise = null;
/** Load data/lexicon.txt once, merged with the app's corpus words and phrases. */
export function loadLexicon(extras) {
  if (!lexPromise) {
    lexPromise = fetch('data/lexicon.txt')
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '')
      .then((txt) => W.withExtras(W.parseLexicon(txt), extras));
  }
  return lexPromise;
}

const valueOf = (word, all, key) => { const r = C.calcWord(C.lettersOnly(word), all)[key]; return r && r.applies ? r : null; };

/** Vowel section — synchronous, needs no word list. */
export function vowelHTML(raw, all, key) {
  const v = W.vowelOrder(raw);
  if (!v.total) return '';
  // the text with vowels highlighted in place
  let p = 0;
  const marked = String(raw).split(/(\s+)/).map((chunk) => {
    if (/^\s+$/.test(chunk)) return ' ';
    return [...chunk].map((ch) => {
      const l = W.letters(ch);
      if (!l) return esc(ch);
      p++;
      return v.positions.includes(p) ? `<b class="sp-v">${esc(ch)}</b>` : `<span class="sp-c">${esc(ch)}</span>`;
    }).join('');
  }).join('');
  const seq = v.sequence.length ? v.sequence.map((x) => `<span class="sp-vowel">${esc(x)}</span>`).join('<span class="sp-arrow">→</span>') : '<span class="st-note">no a e i o u</span>';
  const vv = v.vowels ? valueOf(v.vowels, all, key) : null;
  const cv = v.consonants ? valueOf(v.consonants, all, key) : null;
  const whole = valueOf(raw, all, key);
  const cname = esc(all[key]?.name || key);
  const flags = [];
  if (v.allFive) flags.push('contains all five vowels');
  if (v.alphabetical) flags.push('vowels run in alphabetical order (a → u)');
  if (v.reverseAlphabetical) flags.push('vowels run in reverse alphabetical order');
  if (v.firstAppearance.length !== v.sequence.length) flags.push(`distinct vowels in order of first appearance: ${v.firstAppearance.join(' ')}`);
  if (v.hasY) flags.push(`with y acting as a vowel: ${v.vowelsWithY.split('').join(' → ')}`);
  const perWord = v.perWord.length > 1
    ? `<div class="st-sec"><div class="sec-lbl">vowels word by word</div><ul class="st-list">${v.perWord.map((w) => `<li><b>${esc(w.word)}</b> — ${w.vowels ? esc(w.vowels.split('').join(' → ')) : 'no a e i o u'}${w.vowelsWithY !== w.vowels ? ` <i class="st-who">(with y: ${esc(w.vowelsWithY.split('').join(' → '))})</i>` : ''} · consonants ${esc(w.consonants || '—')} · pattern ${esc(w.pattern)}</li>`).join('')}</ul></div>` : '';
  return `<div class="st-sec"><div class="sec-lbl">vowels in order, first to last</div>
<div class="sp-marked" aria-label="vowels highlighted">${marked}</div>
<div class="sp-seq" aria-label="vowel order">${seq}</div>
<div class="st-row"><span class="st-k">vowel string</span><span class="st-v">${esc(v.vowels || '—')}${vv ? ` = <b>${vv.v}</b> (${cname})` : ''}</span></div>
<div class="st-row"><span class="st-k">consonant skeleton</span><span class="st-v">${esc(v.consonants || '—')}${cv ? ` = <b>${cv.v}</b> (${cname})` : ''}</span></div>
${vv && cv && whole ? `<div class="st-row"><span class="st-k">split of the value</span><span class="st-v">${vv.v} vowels + ${cv.v} consonants${whole.v === vv.v + cv.v ? ` = ${whole.v}, the full ${cname} value` : ` · full value ${whole.v}`}</span></div>` : ''}
<div class="st-row"><span class="st-k">counts</span><span class="st-v">${v.vowelCount} vowels of ${v.total} letters · ${esc(Object.entries(v.counts).map(([k, n]) => `${k}×${n}`).join(' ') || '—')}</span></div>
<div class="st-row"><span class="st-k">positions</span><span class="st-v">${esc(v.positions.join(', ') || '—')}</span></div>
<div class="st-row"><span class="st-k">pattern</span><span class="st-v">${esc(v.pattern)} <i class="st-who">(C consonant · V vowel · y y-as-vowel)</i></span></div>
${flags.length ? `<div class="props">${flags.map((f) => `<span class="prop">${esc(f)}</span>`).join('')}</div>` : ''}
</div>${perWord}`;
}

function chips(items, all, key, src) {
  if (!items.length) return '<div class="st-note">none found.</div>';
  return `<div class="sp-chips">${items.map((it) => {
    const r = valueOf(it.label, all, key);
    const same = r && src && r.v === src.v;
    const sameRd = r && src && !same && r.rd === src.rd;
    const tag = it.tier === 'n' ? '<i>name</i>' : it.tier === 's' ? '<i>statement</i>' : it.tier === 'c' ? '<i>corpus</i>' : '';
    return `<button type="button" class="sp-chip${same ? ' same' : ''}${it.tier === 'n' ? ' name' : ''}" data-action="analyze-word" data-w="${esc(it.label)}" title="${esc(W.TIER_LABEL[it.tier] || 'word')}${r ? ` · ${r.v}` : ''}${it.crossesWords ? ' · spans a word break' : ''}">${esc(it.label)}${tag}${r ? `<small>${r.v}${same ? ' =' : sameRd ? ' ~' : ''}</small>` : ''}</button>`;
  }).join('')}</div>`;
}

function group(title, note, items, total, all, key, src, open = true) {
  const shown = items.slice(0, 60), rest = items.slice(60);
  return `<div class="st-sec"><div class="sec-lbl">${esc(title)} <span class="matches-val">${total}</span></div>${note ? `<div class="st-note">${esc(note)}</div>` : ''}${chips(shown, all, key, src)}${rest.length ? `<details${open ? '' : ''}><summary class="st-note">show ${rest.length}${total > items.length ? ` of ${total - shown.length}` : ''} more</summary>${chips(rest, all, key, src)}</details>` : ''}</div>`;
}

/** Hidden-words section — needs the lexicon. */
export function hiddenHTML(raw, lex, all, key) {
  const src = valueOf(raw, all, key);
  const h = W.hiddenWords(raw, lex);
  if (h.source.length < 3) return '<div class="st-note">hidden words and vowel order work on latin letters. enter at least three to search; hebrew and greek text keep their values in the other tabs.</div>';
  const names = [...h.anagram, ...h.sequence, ...h.inOrder, ...h.rearranged].filter((x) => x.tier === 'n' || x.tier === 'c');
  const statements = [...h.anagram, ...h.sequence, ...h.inOrder, ...h.rearranged].filter((x) => x.tier === 's');
  const plain = (arr) => arr.filter((x) => x.tier !== 'n' && x.tier !== 'c' && x.tier !== 's');
  const all4 = [...h.anagram, ...h.sequence, ...h.inOrder, ...h.rearranged];
  const phrases = W.anagramPhrases(raw, all4);
  const sameValue = all4.filter((x) => { const r = valueOf(x.label, all, key); return r && src && r.v === src.v; });
  const cname = all[key]?.name || key;
  const total = h.totals.anagram + h.totals.sequence + h.totals.inOrder + h.totals.rearranged;
  return `<div class="st-sec"><div class="sec-lbl">what “${esc(raw)}” spells</div>
<div class="st-note">${total} words, names and statements from a ${h.tested.toLocaleString()}-entry list can be spelled with these ${h.source.length} letters, each letter used at most as often as it appears. tap any one to analyse it. the small number is its ${esc(cname)} value; <b>=</b> marks the same value as “${esc(raw)}”, <b>~</b> the same reduced value.</div>
<div class="st-note">${esc(W.hiddenBaseline(h.source.length))}.</div></div>
${sameValue.length ? group(`hidden words with the same ${cname} value (${src.v})`, 'spelled from its letters and equal in value — the two tests together.', sameValue, sameValue.length, all, key, src) : ''}
${group('full anagrams', 'every letter used exactly once, rearranged into another word or name.', plain(h.anagram), plain(h.anagram).length, all, key, src)}
${phrases.phrases.length ? `<div class="st-sec"><div class="sec-lbl">anagram statements <span class="matches-val">${phrases.phrases.length}${phrases.complete ? '' : '+'}</span></div><div class="st-note">every letter used exactly once across two or three words${phrases.reason ? ` · search stopped: ${esc(phrases.reason)}` : ''}.</div><div class="sp-chips">${phrases.phrases.map((p) => `<button type="button" class="sp-chip phrase" data-action="analyze-word" data-w="${esc(p)}">${esc(p)}${valueOf(p, all, key) ? `<small>${valueOf(p, all, key).v}</small>` : ''}</button>`).join('')}</div></div>` : ''}
${names.length ? group('names and corpus words', 'people, biblical and traditional names and words from the uriel corpus that the letters contain.', names, names.length, all, key, src) : ''}
${statements.length ? group('corpus statements', 'multi-word entries from the uriel corpus whose letters are all present.', statements, statements.length, all, key, src) : ''}
${group('in sequence', 'consecutive letters, read straight through' + (h.sequence.some((x) => x.crossesWords) ? '; some run across a word break' : '') + '.', plain(h.sequence), plain(h.sequence).length, all, key, src)}
${group('in order, skipping letters', 'letters appear left to right with others in between.', plain(h.inOrder), plain(h.inOrder).length, all, key, src)}
${group('rearranged', 'all the letters are there but out of order — like “lie” inside “bible”.', plain(h.rearranged), Math.max(plain(h.rearranged).length, h.totals.rearranged - (h.rearranged.length - plain(h.rearranged).length)), all, key, src)}`;
}
