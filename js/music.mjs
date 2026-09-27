// ── Ambient music: public radio streams with a Web Audio synth fallback ───────
// Streams need an explicit media-src in the CSP (see index.html). When every
// stream fails (offline, blocked) the 432 Hz synth pad takes over locally.
const STREAMS = Object.freeze([
  { url: 'https://ice1.somafm.com/dronezone-128-mp3', label: 'drone zone' },
  { url: 'https://ice1.somafm.com/groovesalad-128-mp3', label: 'groove salad' },
  { url: 'https://ice1.somafm.com/deepspaceone-128-mp3', label: 'deep space' },
  { url: 'https://ice1.somafm.com/sonicuniverse-128-mp3', label: 'sonic universe' },
  { url: 'https://stream.radioparadise.com/mellow-128', label: 'mellow mix' },
]);
const CHORDS = [[130.81, 164.81, 196], [116.54, 146.83, 174.61], [146.83, 185, 220], [110, 138.59, 164.81], [123.47, 155.56, 185]];

let audio = null, idx = 0, playing = false, vol = 0.35, usingSynth = false;
let ctx = null, master = null, timer = null, chord = 0;
let onState = () => {};

export function onMusicState(fn) { onState = fn; }
export const isPlaying = () => playing;

function emit(label) { onState({ playing, label, station: STREAMS[idx].label }); }

function synthInit() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = vol;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ctx.destination);
}
function synthChord(freqs, dur = 9) {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(i === 0 ? 0.09 : 0.04, now + 2.5); g.gain.setTargetAtTime(0, now + dur - 2, 0.9);
    o.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 1);
    if (i === 0) { // 4 Hz binaural offset
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.value = f + 4;
      g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(0.07, now + 2.5); g2.gain.setTargetAtTime(0, now + dur - 2, 0.9);
      o2.connect(g2); g2.connect(master); o2.start(now); o2.stop(now + dur + 1);
    }
  });
  timer = setTimeout(() => { chord = (chord + 1) % CHORDS.length; synthChord(CHORDS[chord]); }, (dur - 2) * 1000);
}
function synthStart() {
  synthInit();
  if (!ctx) { emit('audio unavailable'); return; }
  usingSynth = true;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  synthChord(CHORDS[chord]);
  emit('432hz synth ♪');
}
function synthStop() { clearTimeout(timer); usingSynth = false; }

function nextStream() {
  idx = (idx + 1) % STREAMS.length;
  if (idx === 0) { synthStop(); synthStart(); return; }
  loadStream();
}
function loadStream() {
  if (!navigator.onLine) { synthStart(); return; }
  if (!audio) {
    audio = new Audio();
    audio.preload = 'none';
    audio.addEventListener('playing', () => { usingSynth = false; emit(STREAMS[idx].label + ' ♪'); });
    audio.addEventListener('error', () => { if (playing) nextStream(); });
    audio.addEventListener('stalled', () => setTimeout(() => { if (playing && audio.paused) audio.play().catch(() => nextStream()); }, 4000));
  }
  audio.src = STREAMS[idx].url;
  audio.volume = vol;
  emit('connecting…');
  audio.play().catch(() => { if (playing) nextStream(); });
}

export function start() { if (playing) return; playing = true; loadStream(); emit('connecting…'); }
export function stop() {
  playing = false;
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  synthStop();
  emit('paused');
}
export function toggle() { playing ? stop() : start(); }
export function skip() {
  if (audio) { audio.pause(); audio.removeAttribute('src'); }
  synthStop();
  idx = (idx + 1) % STREAMS.length;
  if (playing) loadStream();
  else emit(STREAMS[idx].label);
}
export function setVolume(v) {
  vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
  if (audio) audio.volume = vol;
  if (master && ctx) master.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
}
export const getVolume = () => vol;
export const isSynth = () => usingSynth;
