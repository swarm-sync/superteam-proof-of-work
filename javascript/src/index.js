/**
 * toolkit — a dependency-free vanilla JavaScript (ES2023) utility library.
 *
 * Data helpers, formatting, timing utilities and a tiny observable store.
 * Zero dependencies, no build step. Works in Node (>= 18) and browsers
 * (ES module import, or the UMD-style global via the demo page's import map).
 *
 * @module toolkit
 */

/* ------------------------------------------------------------------ */
/* Cloning / equality                                                 */
/* ------------------------------------------------------------------ */

/**
 * Deep-clone a JSON-shaped value (plain objects, arrays, Date, RegExp,
 * Map, Set). Functions, class instances and symbols are returned as-is
 * for primitives / by reference for functions; circular references are
 * preserved via a WeakMap so cloning never recurses forever.
 *
 * @template T
 * @param {T} value - value to clone
 * @returns {T} a deep copy
 */
export function deepClone(value) {
  const seen = new WeakMap();
  const clone = (v) => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return seen.get(v);
    if (v instanceof Date) return new Date(v.getTime());
    if (v instanceof RegExp) return new RegExp(v.source, v.flags);
    if (v instanceof Map) {
      const out = new Map();
      seen.set(v, out);
      for (const [k, val] of v) out.set(clone(k), clone(val));
      return out;
    }
    if (v instanceof Set) {
      const out = new Set();
      seen.set(v, out);
      for (const item of v) out.add(clone(item));
      return out;
    }
    if (Array.isArray(v)) {
      const out = [];
      seen.set(v, out);
      for (const item of v) out.push(clone(item));
      return out;
    }
    const out = Object.create(Object.getPrototypeOf(v));
    seen.set(v, out);
    for (const key of Reflect.ownKeys(v)) {
      const desc = Object.getOwnPropertyDescriptor(v, key);
      if (desc) {
        if ('value' in desc) desc.value = clone(desc.value);
        Object.defineProperty(out, key, desc);
      }
    }
    return out;
  };
  return clone(value);
}

/**
 * Structural deep equality for JSON-shaped values, Dates, RegExps,
 * Maps and Sets. Object key order does not matter.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    }
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

/* ------------------------------------------------------------------ */
/* Objects / arrays                                                    */
/* ------------------------------------------------------------------ */

/**
 * Pick a subset of keys from an object (keys that are absent are skipped).
 * @template {object} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {K[]} keys
 * @returns {Pick<T, K>}
 */
export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

/**
 * Return a copy of an object without the listed keys.
 * @template {object} T
 * @param {T} obj
 * @param {(keyof T)[]} keys
 * @returns {Omit<T, (typeof keys)[number]>}
 */
export function omit(obj, keys) {
  const drop = new Set(keys);
  const out = {};
  for (const k of Reflect.ownKeys(obj)) if (!drop.has(k)) out[k] = obj[k];
  return out;
}

/**
 * Group array items by a key function or property name.
 * @template T
 * @param {T[]} items
 * @param {((item: T) => string | number) | keyof T} key
 * @returns {Record<string, T[]>}
 */
export function groupBy(items, key) {
  const fn = typeof key === 'function' ? key : (item) => item[key];
  const out = {};
  for (const item of items) {
    const k = String(fn(item));
    (out[k] ??= []).push(item);
  }
  return out;
}

/**
 * Sort a copy of an array by a key function or property name.
 * Stable (Array.prototype.sort is stable in modern engines) and
 * non-mutating; pass `desc: true` for descending order.
 * @template T
 * @param {T[]} items
 * @param {((item: T) => string | number) | keyof T} [key]
 * @param {{ desc?: boolean }} [opts]
 * @returns {T[]}
 */
export function sortBy(items, key, opts = {}) {
  const fn = key === undefined ? (x) => x : typeof key === 'function' ? key : (item) => item[key];
  const dir = opts.desc ? -1 : 1;
  return [...items].sort((a, b) => {
    const va = fn(a);
    const vb = fn(b);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
}

/**
 * Split an array into chunks of `size`. The last chunk may be smaller.
 * @template T
 * @param {T[]} items
 * @param {number} size - positive integer
 * @returns {T[][]}
 */
export function chunk(items, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('chunk size must be a positive integer');
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Remove duplicates, preserving first-seen order. @template T @param {T[]} items @returns {T[]} */
export function unique(items) {
  return [...new Set(items)];
}

/** Clamp a number into [min, max]. @param {number} value @param {number} min @param {number} max @returns {number} */
export function clamp(value, min, max) {
  if (min > max) throw new RangeError('clamp: min must not exceed max');
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/**
 * Format a number as money, e.g. formatMoney(1234.5, 'USD') -> "$1,234.50".
 * Uses Intl.NumberFormat; defaults to en-US / USD.
 * @param {number} amount
 * @param {string} [currency='USD']
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatMoney(amount, currency = 'USD', locale = 'en-US') {
  if (!Number.isFinite(amount)) throw new TypeError('formatMoney: amount must be a finite number');
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Format a Date (or ISO string / timestamp) as e.g. "Nov 5, 2026".
 * @param {Date | string | number} value
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDate(value, locale = 'en-US') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('formatDate: invalid date');
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

/**
 * Human-readable relative time, e.g. "5 minutes ago" / "in 2 days".
 * @param {Date | string | number} value
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function timeAgo(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('timeAgo: invalid date');
  const diffMs = now.getTime() - date.getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 365 * 24 * 3600e3],
    ['month', 30 * 24 * 3600e3],
    ['week', 7 * 24 * 3600e3],
    ['day', 24 * 3600e3],
    ['hour', 3600e3],
    ['minute', 60e3],
    ['second', 1e3],
  ];
  for (const [unit, ms] of units) {
    const amount = Math.trunc(diffMs / ms);
    if (Math.abs(amount) >= 1 || unit === 'second') return rtf.format(-amount, unit);
  }
  return rtf.format(0, 'second');
}

/**
 * Escape a string for safe insertion into HTML text content.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Turn "Hello, World! 2026" into "hello-world-2026".
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return String(str)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

/**
 * Debounce: invoke `fn` only after `wait` ms have passed without a new
 * call. The returned function has `.cancel()` and `.flush()`.
 * @template {(...args: never[]) => unknown} F
 * @param {F} fn
 * @param {number} wait - milliseconds
 * @returns {F & { cancel: () => void, flush: () => void }}
 */
export function debounce(fn, wait) {
  let timer = undefined;
  let lastArgs;
  let lastThis;
  const invoke = () => {
    timer = undefined;
    fn.apply(lastThis, lastArgs);
  };
  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;
    clearTimeout(timer);
    timer = setTimeout(invoke, wait);
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  debounced.flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      invoke();
    }
  };
  return debounced;
}

/**
 * Throttle: invoke `fn` at most once per `wait` ms (leading edge, with a
 * trailing call if calls happened during the wait).
 * @template {(...args: never[]) => unknown} F
 * @param {F} fn
 * @param {number} wait - milliseconds
 * @returns {F & { cancel: () => void }}
 */
export function throttle(fn, wait) {
  let lastCall = 0;
  let timer = undefined;
  let lastArgs;
  let lastThis;
  const throttled = function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    lastArgs = args;
    lastThis = this;
    if (remaining <= 0) {
      clearTimeout(timer);
      timer = undefined;
      lastCall = now;
      fn.apply(lastThis, lastArgs);
    } else if (timer === undefined) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = undefined;
        fn.apply(lastThis, lastArgs);
      }, remaining);
    }
  };
  throttled.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return throttled;
}

/**
 * Retry an async function up to `retries` times with exponential backoff.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, delayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
export async function retry(fn, { retries = 3, delayMs = 100 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** (attempt - 1)));
    }
  }
}

/* ------------------------------------------------------------------ */
/* Functional helpers                                                  */
/* ------------------------------------------------------------------ */

/** Left-to-right function composition: pipe(f, g)(x) === g(f(x)). @param {...Function} fns @returns {Function} */
export function pipe(...fns) {
  return (input) => fns.reduce((value, fn) => fn(value), input);
}

/**
 * Memoize a function by its JSON-serialised arguments.
 * @template {(...args: never[]) => unknown} F
 * @param {F} fn
 * @returns {F}
 */
export function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/* ------------------------------------------------------------------ */
/* Tiny observable store                                               */
/* ------------------------------------------------------------------ */

/**
 * A tiny observable store: immutable-ish state, `set`/`update`, and
 * subscriptions that receive (next, prev) on every change.
 *
 * @template T
 * @param {T} initialState
 * @returns {{
 *   get: () => T,
 *   set: (next: T | ((prev: T) => T)) => void,
 *   subscribe: (listener: (next: T, prev: T) => void) => () => void
 * }}
 *
 * @example
 * const store = createStore({ count: 0 });
 * const off = store.subscribe((next) => console.log(next.count));
 * store.set((s) => ({ ...s, count: s.count + 1 }));
 * off();
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    get() {
      return state;
    },
    set(next) {
      const prev = state;
      state = typeof next === 'function' ? next(prev) : next;
      if (!Object.is(state, prev)) {
        for (const listener of [...listeners]) listener(state, prev);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
