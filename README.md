# two-sum-expansion

Exactly add two IEEE-754 doubles and return the result split into a high (nearest) part and a low (residual rounding error) part.

## Usage

```js
import { twoSum, fastTwoSum, splitHighLow } from "two-sum-expansion";

const [hi, lo] = twoSum(1, Number.EPSILON / 2);
// hi === 1, lo === Number.EPSILON / 2, and hi + lo === 1 + Number.EPSILON / 2 exactly

// fastTwoSum is cheaper but requires |a| >= |b|:
const [h2, l2] = fastTwoSum(2 ** 53, 1); // h2 === 2**53, l2 === 1

// splitHighLow([x, 0]) returns [x, 0] for a single number, giving a uniform shape:
const [x, x0] = splitHighLow(0.1); // [0.1, 0]
```

Run the tests with `node --test`.

## Why

Plain `a + b` on doubles rounds once and silently discards up to half a ULP. For summation chains, that discarded piece is what eventually accumulates into visible error. Two-sum recovers it: `twoSum(a, b)` returns `[s, e]` such that `s + e === a + b` *exactly* in round-to-nearest-even, and the error `e` can be folded into the next addition (Shewchuk-style expansion arithmetic).

This library implements the classic Knuth/Dekker six-flop two-sum rather than Dekker's three-flop `fastTwoSum`. Classic two-sum is unconditional (no `|a| >= |b|` precondition), branch-free, and trivially predictable; `fastTwoSum` is provided separately for the common case where the caller already knows the magnitudes are ordered.

## Edge you will hit

Non-finite inputs short-circuit to `[a + b, 0]`. That means `Infinity + -Infinity` returns `[NaN, 0]`, not `[NaN, NaN]`. If you are building a compensated summation over data that may contain infinities, carry the low part forward unconditionally; the residual is never NaN for the finite inputs you care about, and it is exactly zero whenever the high part is non-finite. Do not rely on the low part to signal that an overflow occurred — it won't.

The single-number helper `splitHighLow` exists only to give a uniform `[high, low]` shape; its low part is always `0`. It is not a Veltkamp-style split.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

