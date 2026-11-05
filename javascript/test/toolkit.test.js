import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deepClone, deepEqual, pick, omit, groupBy, sortBy, chunk, unique, clamp,
  formatMoney, formatDate, timeAgo, escapeHtml, slugify,
  debounce, throttle, retry, pipe, memoize, createStore,
} from '../src/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('deepClone / deepEqual', () => {
  it('clones nested objects, dates and maps without sharing references', () => {
    const original = { a: [1, { b: 2 }], d: new Date('2026-11-05'), m: new Map([['k', { v: 1 }]]) };
    const copy = deepClone(original);
    assert.ok(deepEqual(original, copy));
    assert.notStrictEqual(copy.a, original.a);
    assert.notStrictEqual(copy.m.get('k'), original.m.get('k'));
    copy.a[1].b = 99;
    assert.equal(original.a[1].b, 2);
  });
  it('handles circular references', () => {
    const obj = { name: 'loop' };
    obj.self = obj;
    const copy = deepClone(obj);
    assert.strictEqual(copy.self, copy);
    assert.notStrictEqual(copy, obj);
  });
  it('deepEqual ignores key order and distinguishes values', () => {
    assert.ok(deepEqual({ a: 1, b: [2, 3] }, { b: [2, 3], a: 1 }));
    assert.ok(!deepEqual({ a: 1 }, { a: 2 }));
    assert.ok(!deepEqual([1, 2], [2, 1]));
    assert.ok(deepEqual(new Date(0), new Date(0)));
  });
});

describe('objects / arrays', () => {
  it('pick and omit', () => {
    assert.deepEqual(pick({ a: 1, b: 2, c: 3 }, ['a', 'c']), { a: 1, c: 3 });
    assert.deepEqual(omit({ a: 1, b: 2, c: 3 }, ['b']), { a: 1, c: 3 });
  });
  it('groupBy property and function', () => {
    const rows = [{ t: 'a', v: 1 }, { t: 'b', v: 2 }, { t: 'a', v: 3 }];
    assert.deepEqual(groupBy(rows, 't').a.map((r) => r.v), [1, 3]);
    assert.deepEqual(groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even')).odd, [1, 3]);
  });
  it('sortBy does not mutate and supports desc', () => {
    const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];
    assert.deepEqual(sortBy(rows, 'n').map((r) => r.n), [1, 2, 3]);
    assert.deepEqual(sortBy(rows, 'n', { desc: true }).map((r) => r.n), [3, 2, 1]);
    assert.deepEqual(rows.map((r) => r.n), [3, 1, 2]);
  });
  it('chunk / unique / clamp', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.throws(() => chunk([1], 0), RangeError);
    assert.deepEqual(unique([3, 1, 3, 2, 1]), [3, 1, 2]);
    assert.equal(clamp(15, 0, 10), 10);
    assert.equal(clamp(-5, 0, 10), 0);
    assert.throws(() => clamp(1, 5, 0), RangeError);
  });
});

describe('formatting', () => {
  it('formatMoney', () => {
    assert.equal(formatMoney(1234.5), '$1,234.50');
    assert.equal(formatMoney(-9.99, 'EUR', 'en-IE'), '-€9.99');
    assert.throws(() => formatMoney(Number.NaN), TypeError);
  });
  it('formatDate and timeAgo', () => {
    assert.equal(formatDate('2026-11-05'), 'Nov 5, 2026');
    assert.throws(() => formatDate('not-a-date'), TypeError);
    assert.equal(timeAgo(new Date(Date.now() - 5 * 60e3)), '5 minutes ago');
    assert.equal(timeAgo(new Date(Date.now() + 24 * 3600e3)), 'tomorrow');
  });
  it('escapeHtml and slugify', () => {
    assert.equal(escapeHtml('<b>"a" & \'b\'</b>'), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
    assert.equal(slugify('Hello, World! 2026'), 'hello-world-2026');
    assert.equal(slugify('Café au lait'), 'cafe-au-lait');
  });
});

describe('timing', () => {
  it('debounce fires once after the wait, and flush forces it', async () => {
    let calls = 0;
    const fn = debounce(() => { calls += 1; }, 20);
    fn(); fn(); fn();
    assert.equal(calls, 0);
    await sleep(40);
    assert.equal(calls, 1);
    fn(); fn.flush();
    assert.equal(calls, 2);
    fn.cancel();
  });
  it('throttle limits calls to one per window', async () => {
    let calls = 0;
    const fn = throttle(() => { calls += 1; }, 30);
    fn(); fn(); fn();
    assert.equal(calls, 1); // leading edge only so far
    await sleep(80);
    assert.equal(calls, 2); // trailing call fired once
  });
  it('retry succeeds after failures and throws after exhausting retries', async () => {
    let attempts = 0;
    const ok = await retry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('boom');
      return 'done';
    }, { retries: 3, delayMs: 1 });
    assert.equal(ok, 'done');
    await assert.rejects(() => retry(async () => { throw new Error('nope'); }, { retries: 1, delayMs: 1 }), /nope/);
  });
});

describe('functional helpers', () => {
  it('pipe composes left to right', () => {
    assert.equal(pipe((x) => x + 1, (x) => x * 2)(3), 8);
  });
  it('memoize caches by arguments', () => {
    let calls = 0;
    const add = memoize((a, b) => { calls += 1; return a + b; });
    assert.equal(add(2, 3), 5);
    assert.equal(add(2, 3), 5);
    assert.equal(calls, 1);
  });
});

describe('createStore', () => {
  it('notifies subscribers with next and prev, and unsubscribe works', () => {
    const store = createStore({ count: 0 });
    const seen = [];
    const off = store.subscribe((next, prev) => seen.push([next.count, prev.count]));
    store.set((s) => ({ count: s.count + 1 }));
    store.set({ count: 5 });
    off();
    store.set({ count: 99 });
    assert.deepEqual(seen, [[1, 0], [5, 1]]);
    assert.equal(store.get().count, 99);
  });
  it('does not notify when the state reference is unchanged', () => {
    const store = createStore({ count: 0 });
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    const same = store.get();
    store.set(same);
    assert.equal(calls, 0);
  });
});
