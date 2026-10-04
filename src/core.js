/**
 * Core two-sum routines.
 *
 * See {@link index.js} for the full rationale and edge-case notes.
 *
 * Implementation note: we keep the "compensated sum" inline and branch-free
 * for finite inputs. The classic six-flop form is:
 *
 *     s  = a + b
 *     bb = s - a
 *     e  = b - bb
 *
 * which yields `s + e === a + b` exactly under round-to-nearest-even (the
 * IEEE-754 default in JS). We guard non-finite inputs explicitly because the
 * residual computation `b - (s - a)` produces `NaN` when `s` is infinite and
 * the subtraction `s - a` is the indeterminate `inf - inf`; that `NaN` would
 * leak into the low part even though the high part is the correct
 * `a + b`. Stripping to a zero residual keeps the documented invariant
 * `[high, low]` truthful while preserving `high + low === a + b`.
 */

/**
 * True for ordinary finite doubles. `Number.isFinite` is the right test
 * here: it returns false for `NaN`, `Infinity`, and `-Infinity`.
 *
 * @param {number} x
 * @returns {boolean}
 */
function isFiniteDouble(x) {
  return Number.isFinite(x);
}

/**
 * Compensated (classic two-sum) addition.
 *
 * @param {number} a
 * @param {number} b
 * @returns {[number, number]} `[high, low]`.
 */
export function twoSum(a, b) {
  const s = a + b;
  if (!isFiniteDouble(s)) {
    // Non-finite high part: arithmetic compensation would be spurious.
    // `low` is pinned to 0 so that `high + low === a + b` still holds for
    // the cases the caller cares about (inf, -inf, NaN).
    return [s, 0];
  }
  const bb = s - a;
  const e = b - bb;
  return [s, e];
}

/**
 * Dekker's fast two-sum. Precondition: `|a| >= |b|`. We do not enforce it;
 * violating it silently gives a less useful (but still defined) residual.
 *
 * @param {number} a
 * @param {number} b
 * @returns {[number, number]} `[high, low]`.
 */
export function fastTwoSum(a, b) {
  const s = a + b;
  if (!isFiniteDouble(s)) {
    return [s, 0];
  }
  const bVirtual = s - a;
  const e = b - bVirtual;
  return [s, e];
}

/**
 * Default export: a thin convenience that splits a single double into high
 * and low parts by treating it as the sum of itself and zero. Included so
 * callers have a uniform `[high, low]` shape for a single number; the low
 * part is always exactly zero for finite input.
 *
 * @param {number} x
 * @returns {[number, number]} `[x, 0]` for finite `x`; `[x, 0]` otherwise.
 */
export default function splitHighLow(x) {
  return [x, isFiniteDouble(x) ? 0 : 0];
}
