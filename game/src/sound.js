// All sound is synthesized with WebAudio: a sizzle, a ding, a pop and a buzz.
// No audio files, no network. Created lazily on the first gesture, muted with M.
export function createSound() {
  let audio = null;
  let muted = false;

  function ensure() {
    if (!audio) {
      try {
        audio = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        audio = null;
      }
    }
    if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + seconds);
  }

  function noise(seconds, gainValue, filterFreq) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensure();
    },
    play(kind) {
      if (muted) return;
      switch (kind) {
        case 'pickup':
          tone(520, 0.07, 'sine', 0.12);
          break;
        case 'cook-done':
          tone(880, 0.12, 'sine', 0.15);
          tone(1320, 0.18, 'sine', 0.12, 0.1);
          break;
        case 'serve':
          tone(660, 0.1, 'triangle', 0.16);
          tone(880, 0.1, 'triangle', 0.16, 0.09);
          tone(1100, 0.22, 'triangle', 0.16, 0.18);
          noise(0.25, 0.05, 4000);
          break;
        case 'wrong':
          tone(160, 0.22, 'sawtooth', 0.1);
          break;
        case 'expire':
          tone(220, 0.3, 'square', 0.08);
          tone(180, 0.35, 'square', 0.08, 0.15);
          break;
        case 'burnt':
          noise(0.4, 0.08, 800);
          break;
        case 'sizzle':
          noise(0.5, 0.04, 3000);
          break;
        default:
          break;
      }
    },
  };
}
