// Single entry point for all knowledge tables. Everything exported here is frozen.
import { ETYM, TRAD, SCRIPTURE, NUM_MEAN, HEB_LETTERS, SEFIROT, TAROT_MAJOR, RELIGIONS } from './knowledge.mjs';
import { ETYM_EXTRA, TRAD_EXTRA, SCRIPTURE_EXTRA } from './readings.mjs';
import { UNREDUCED_MEANINGS } from './meanings.mjs';
import { CIPHER_ETYM } from './cipher-notes.mjs';

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
};

export const ETYMOLOGY = deepFreeze({ ...ETYM, ...ETYM_EXTRA });
export const TRADITIONS = deepFreeze({ ...TRAD, ...TRAD_EXTRA });
export const SCRIPTURE_REFS = deepFreeze({ ...SCRIPTURE_EXTRA, ...SCRIPTURE });
export const NUMBER_MEANINGS = deepFreeze(UNREDUCED_MEANINGS);
export const CIPHER_NOTES = deepFreeze({
  ...CIPHER_ETYM,
  hebrew: 'mispar hechrachi — the standard hebrew gematria. aleph=1 … yod=10, kaf=20 … qof=100, resh=200, shin=300, tav=400. the system of the talmud and the zohar. type hebrew letters to use it.',
  hebrew_gadol: 'mispar gadol — the "great number". final letters continue past tav: ך=500 ם=600 ן=700 ף=800 ץ=900. used when a word ends in a final form and the author wants the larger reading.',
  greek: 'isopsephy — greek letters were numerals. α=1 … ι=10 … ρ=100 … ω=800, with the archaic stigma (6), koppa (90) and sampi (900). ΙΗΣΟΥΣ = 888. type greek letters to use it.',
  sumerian: 'ordinal × 6000. the sumerians counted in base 60; 6000 = 6 × 1000 keeps the sexagesimal signature while scaling the english ordinal. popular in modern numerology forums rather than in any ancient source.',
  eng_hebrew: 'latin letters mapped to their nearest hebrew letter values (a=aleph 1, b=bet 2, c=kaf 20, d=dalet 4 …). the common "english hebrew gematria" of online calculators — a transliteration, not a translation.',
});
export { NUM_MEAN, HEB_LETTERS, SEFIROT, TAROT_MAJOR, RELIGIONS };
deepFreeze(NUM_MEAN); deepFreeze(HEB_LETTERS); deepFreeze(SEFIROT); deepFreeze(TAROT_MAJOR); deepFreeze(RELIGIONS);

export const TRADITION_LABELS = Object.freeze({
  hebrew: 'hebrew · kabbalistic', biblical: 'biblical · christian', greek: 'greek · classical', occult: 'hermetic · western occult',
});

/** Words that have full offline readings — surfaced as suggestions. */
export const SUGGESTED = Object.freeze(Object.keys(TRADITIONS).filter((k) => ETYMOLOGY[k]));
