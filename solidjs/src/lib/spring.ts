import { createSignal, onCleanup } from "solid-js";

/**
 * Spring-animated number — Stella Phase 3.
 * Real spring integrator (stiffness 300, damping 30, mass 0.8) driven by
 * requestAnimationFrame, so values glide and settle instead of snapping
 * or easing linearly. When the user prefers reduced motion, values jump
 * straight to target with no animation at all.
 */
export const SPRING = { stiffness: 300, damping: 30, mass: 0.8 };

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createSpringNumber(initial: number) {
  const [value, setValue] = createSignal(initial);
  const [target, setTarget] = createSignal(initial);

  let raf = 0;
  let x = initial;
  let v = 0;
  let last = 0;
  let running = false;

  function step(ts: number) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    const goal = target();
    // F = -k(x - goal) - c*v ; a = F/m
    const a = (-SPRING.stiffness * (x - goal) - SPRING.damping * v) / SPRING.mass;
    v += a * dt;
    x += v * dt;
    setValue(x);
    if (Math.abs(x - goal) < 0.01 && Math.abs(v) < 0.01) {
      x = goal;
      v = 0;
      setValue(goal);
      running = false;
      return;
    }
    raf = requestAnimationFrame(step);
  }

  function set(next: number) {
    setTarget(next);
    if (prefersReducedMotion) {
      x = next;
      v = 0;
      setValue(next);
      return;
    }
    if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  }

  onCleanup(() => cancelAnimationFrame(raf));
  return [value, set] as const;
}

/** Format helpers for the telemetry readouts. */
export const fmt = {
  int: (n: number) => Math.round(n).toLocaleString("en-US"),
  usd: (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
  sol: (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 }),
  pct: (n: number) => `${n.toFixed(1)}%`,
};
