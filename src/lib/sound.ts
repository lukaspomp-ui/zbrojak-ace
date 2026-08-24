/**
 * Optional, very subtle UI sounds (OFF by default, toggle in Profil).
 * Synthesised with WebAudio — no assets, no autoplay on page load.
 */
const KEY = "zbrojak-sounds";

export function soundsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "on";
}

export function setSoundsEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, on ? "on" : "off");
}

type Ctor = typeof AudioContext;
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone({
  freq,
  to,
  duration,
  type = "sine",
  gain = 0.06,
}: {
  freq: number;
  to?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, ac.currentTime + duration);
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
}

/** Soft trigger click on answer tap. */
export function playClick() {
  if (!soundsEnabled()) return;
  tone({ freq: 900, to: 320, duration: 0.05, type: "square", gain: 0.03 });
}

/** Steel-target "cink" on a correct answer. */
export function playHit() {
  if (!soundsEnabled()) return;
  tone({ freq: 1760, duration: 0.32, type: "triangle", gain: 0.05 });
  tone({ freq: 2640, duration: 0.18, type: "sine", gain: 0.025 });
}

/** Muted thud on a wrong answer. */
export function playMiss() {
  if (!soundsEnabled()) return;
  tone({ freq: 150, to: 60, duration: 0.22, type: "sine", gain: 0.07 });
}
