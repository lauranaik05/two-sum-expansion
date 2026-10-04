/**
 * Two-sum expansion for exactly adding two IEEE-754 double-precision floats.
 *
 * Given two floating point numbers `a` and `b`, `twoSum` returns a pair
 * `[s, e]` such that `s + e === a + b` exactly, where `s` is the nearest
 * double to the true sum (the "high" part) and `e` is the residual rounding
 * error (the "low" compensation part).
 *
 * Algorithm: Knuth / Dekker two-sum (also called the "compensated sum").
 *
 * Trade-off: we use the classic two-sum (six flops) rather than Dekker's
 * fast-two-sum (three flops) because fast-two-sum requires `|a| >= |b|`.
 * Reordering the inputs in JS would cost a branch and a comparison; the
 * measured cost is negligible here, but more importantly classic two-sum is
 * branch-free and unconditional, which keeps the behaviour trivially
 * predictable and easy to reason about. If you already know your inputs are
 * magnitude-ordered, you can call `fastTwoSum` directly.
 *
 * Edge cases that flow through without special handling and are asserted by
 * the tests:
 *   - `0 + 0` returns `[0, 0]`.
 *   - Finite + Infinity returns `[Infinity, 0]`.
 *   - `Infinity + Infinity` returns `[Infinity, 0]`.
 *   - `Infinity + -Infinity` returns `[NaN, 0]` (matches the underlying
 *     `a + b` exactly; the residual is a -NaN-stripped zero).
 *   - `NaN` in, `NaN` out (high) with a zero low part.
 *   - Subnormal inputs are handled by the arithmetic itself.
 *
 * Edge cases that are deliberately handled by fast paths:
 *   - Any non-finite input short-circuits the compensation arithmetic, which
 *     would otherwise produce spurious `NaN` residuals from the
 *     `b - virtual` step.
 */

import { twoSum as twoSumImpl, fastTwoSum as fastTwoSumImpl } from "./core.js";

/** @typedef {[number, number]} TwoSumResult [high, low] */

/**
 * Compensated sum of two doubles.
 *
 * @param {number} a
 * @param {number} b
 * @returns {TwoSumResult} `[s, e]` with `s + e === a + b` exactly.
 */
export function twoSum(a, b) {
  return twoSumImpl(a, b);
}

/**
 * Fast (Dekker) two-sum. Requires `|a| >= |b|`; when that holds it is
 * cheaper than `twoSum`. Behaviour for non-finite inputs matches `twoSum`.
 *
 * @param {number} a
 * @param {number} b
 * @returns {TwoSumResult} `[s, e]`.
 */
export function fastTwoSum(a, b) {
  return fastTwoSumImpl(a, b);
}

export { default as splitHighLow } from "./core.js";
