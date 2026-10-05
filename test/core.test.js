import { test } from "node:test";
import assert from "node:assert/strict";

import { twoSum, fastTwoSum, splitHighLow } from "../src/index.js";

/**
 * Equality on doubles is forbidden in this project; use an absolute
 * tolerance. `1e-30` is well below the residuals two-sum actually produces
 * for the magnitudes in these tests, so it catches real regressions without
 * being noisy.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} [tol=1e-30]
 */
function almostEqual(x, y, tol = 1e-30) {
  if (Number.isNaN(x) && Number.isNaN(y)) return;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    assert.equal(x, y);
    return;
  }
  assert.ok(
    Math.abs(x - y) <= tol,
    `|${x} - ${y}| = ${Math.abs(x - y)} exceeds ${tol}`
  );
}

/**
 * The fundamental invariant: `high + low === a + b` exactly. We re-add through
 * `String(... | 0)`-free, plain JS addition and compare with a tolerance.
 * For the two-sum algorithm on finite inputs the residual is exact, so the
 * only sources of imprecision here are the very last recombination step for
 * numbers spanning the full exponent range; `1e-30` covers that.
 */
function assertInvariant(a, b, [hi, lo]) {
  almostEqual(hi + lo, a + b);
}

// --- happy path ------------------------------------------------------------

test("twoSum: 0 + 0 is [0, 0]", () => {
  const r = twoSum(0, 0);
  assert.deepEqual(r, [0, 0]);
});

test("twoSum: integer-valued inputs collapse the low part to 0", () => {
  const r = twoSum(2, 3);
  assert.deepEqual(r, [5, 0]);
});

test("twoSum: captures the lost low bit when a + b rounds", () => {
  // a is just below a power of two; adding the tiny b loses precision in
  // the high part, and two-sum must recover it into the low part.
  const a = 1;
  const b = Number.EPSILON / 2; // half a ULP at 1.0
  const [hi, lo] = twoSum(a, b);
  almostEqual(hi, 1);
  almostEqual(lo, b);
  assertInvariant(a, b, [hi, lo]);
});

test("twoSum: recovers residual across a large magnitude gap", () => {
  const big = 2 ** 53; // doubles beyond 2^53 cannot represent odd integers
  const small = 1;
  const [hi, lo] = twoSum(big, small);
  // high part rounded back to the even double; low part holds the lost 1.
  almostEqual(hi, big);
  almostEqual(lo, small);
  assertInvariant(big, small, [hi, lo]);
});

test("twoSum: cancellation produces a tiny high and the absorbed operand as low", () => {
  const a = 1 + 2 ** -52; // 1 + 1 ULP
  const b = -1;            // cancels the leading 1 exactly
  const [hi, lo] = twoSum(a, b);
  almostEqual(hi, 2 ** -52);
  almostEqual(lo, 0);
  assertInvariant(a, b, [hi, lo]);
});

// --- edge cases ------------------------------------------------------------

test("twoSum: +Infinity + finite yields [Infinity, 0]", () => {
  const r = twoSum(Infinity, 3);
  assert.deepEqual(r, [Infinity, 0]);
});

test("twoSum: Infinity + Infinity yields [Infinity, 0]", () => {
  const r = twoSum(Infinity, Infinity);
  assert.deepEqual(r, [Infinity, 0]);
});

test("twoSum: Infinity + -Infinity yields [NaN, 0]", () => {
  const r = twoSum(Infinity, -Infinity);
  assert.ok(Number.isNaN(r[0]));
  assert.equal(r[1], 0);
});

test("twoSum: NaN input yields [NaN, 0]", () => {
  const r = twoSum(NaN, 1);
  assert.ok(Number.isNaN(r[0]));
  assert.equal(r[1], 0);
});

test("twoSum: subnormal inputs are handled by the arithmetic", () => {
  const tiny = Number.MIN_VALUE; // smallest positive subnormal
  const [hi, lo] = twoSum(tiny, tiny);
  almostEqual(hi, 2 * tiny);
  almostEqual(lo, 0);
  assertInvariant(tiny, tiny, [hi, lo]);
});

// --- fastTwoSum: same invariants where the precondition holds --------------

test("fastTwoSum: matches twoSum when |a| >= |b|", () => {
  const a = 1;
  const b = Number.EPSILON / 2;
  const fast = fastTwoSum(a, b);
  const classic = twoSum(a, b);
  almostEqual(fast[0], classic[0]);
  almostEqual(fast[1], classic[1]);
  assertInvariant(a, b, fast);
});

test("fastTwoSum: non-finite short-circuits identically", () => {
  assert.deepEqual(fastTwoSum(Infinity, 1), [Infinity, 0]);
  assert.deepEqual(fastTwoSum(-Infinity, -Infinity), [-Infinity, 0]);
  const nan = fastTwoSum(NaN, 0);
  assert.ok(Number.isNaN(nan[0]));
  assert.equal(nan[1], 0);
});

// --- splitHighLow ----------------------------------------------------------

test("splitHighLow: returns [x, 0] for finite input", () => {
  assert.deepEqual(splitHighLow(42), [42, 0]);
  assert.deepEqual(splitHighLow(0), [0, 0]);
  assert.deepEqual(splitHighLow(-1.5), [-1.5, 0]);
});

test("splitHighLow: passes non-finite through with a 0 low part", () => {
  assert.deepEqual(splitHighLow(Infinity), [Infinity, 0]);
  assert.deepEqual(splitHighLow(-Infinity), [-Infinity, 0]);
  const r = splitHighLow(NaN);
  assert.ok(Number.isNaN(r[0]));
  assert.equal(r[1], 0);
});
