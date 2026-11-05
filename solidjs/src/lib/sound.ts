import { createSignal } from "solid-js";

/**
 * Tactile sound layer — Stella Phase 4.
 * No audio assets: a short mechanical "click" is synthesized with the
 * Web Audio API (filtered square blip, ~28ms). Zero-latency feel,
 * fully muteable, never autoplaying.
 */
const [muted, setMuted] = createSignal(
  typeof localStorage !== "undefined" && localStorage.getItem("sol-explorer-muted") === "1",
);

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Play a mechanical micro-click. `pitch` 1 = click, 0.7 = low thunk, 1.4 = bright tick. */
export function click(pitch = 1) {
  if (muted()) return;
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800 * pitch, t);
  osc.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.028);
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

/** Two-note confirm chirp for a successful action. */
export function confirm() {
  if (muted()) return;
  click(1.2);
  window.setTimeout(() => click(1.6), 55);
}

/** Micro-haptic bump on supported devices (mobile/touch). */
export function bump(ms = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* haptics unsupported — visual feedback carries it */
  }
}

/** Combined tactile tap: sound + haptic in one call. */
export function tap(pitch = 1) {
  click(pitch);
  bump();
}

export function toggleMute() {
  const next = !muted();
  setMuted(next);
  try {
    localStorage.setItem("sol-explorer-muted", next ? "1" : "0");
  } catch {
    /* storage unavailable — mute still applies for the session */
  }
  if (!next) click(1.2);
}

export { muted };
