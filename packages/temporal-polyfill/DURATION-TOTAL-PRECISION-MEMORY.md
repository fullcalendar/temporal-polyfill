# Duration.total Calendar Precision Memory

This note records a temporary precision tradeoff in `Duration.prototype.total`
calendar-unit math. It exists so the code and expected-failure entry have a
single place to point at until the exact-rational fix is implemented.

## Relevant Code

- `src/internal/total.ts`
  - `totalRelativeDuration()`
  - The return expression currently groups the whole-unit and fractional-window
    pieces into one division:

```ts
return (integerPart * denom + numerator * sign) / denom
```

This is intentionally better for the `NudgeToCalendarUnit` exact mathematical
value than:

```ts
return integerPart + (numerator / denom) * sign
```

However, it is still not the final ideal implementation because
`integerPart * denom` is plain JS `Number` arithmetic. For large enough
`integerPart`, that product can lose precision before the final division.

## Tests In Conflict

### More Authoritative Precision Test

- `../../test262/test/built-ins/Temporal/Duration/prototype/total/precision-exact-mathematical-values-5.js`
- Status: this is the more authoritative precision regression test to keep
  passing.
- Important assertion:

```js
const d = new Temporal.Duration(0, 0, 5, 5);
const result = d.total({ unit: "months", relativeTo: "1972-01-31" });
assert.sameValue(result, 1.3548387096774193);
```

For this case:

```text
integerPart = 1
denom       = 2678400000000000
numerator   = 950400000000000
```

The two JS-number formula shapes produce different values:

```text
integerPart + numerator / denom       => 1.3548387096774195
(integerPart * denom + numerator) / denom => 1.3548387096774193
```

The combined-division form passes this test. This lines up with the Temporal
spec note in `NudgeToCalendarUnit`: the arithmetic should be performed before
one final floating-point division.

### Temporarily Expected Failure

- `../../test262/test/built-ins/Temporal/Duration/prototype/total/relativeto-total-of-each-unit.js`
- Status: this is intentionally listed in
  `scripts/test262-config/expected-failures.txt` until the exact-rational fix
  is implemented.
- Failing assertion after preferring the combined-division form:

```text
Duration.total results for months relative to 2000-01-01
Expected SameValue(«66.32941495109206», «66.32941495109208») to be true
```

For that month case:

```text
integerPart = 66
denom       = 2678400000000000
numerator   = 882305005005005
```

The representative Test262 expected value is computed with ordinary JS
arithmetic as `fullMonths + fractionalMonths`, which matches the separate-add
formula:

```text
integerPart + numerator / denom       => 66.32941495109208
(integerPart * denom + numerator) / denom => 66.32941495109206
```

The combined form is conceptually closer to the spec, but the current
implementation forms `integerPart * denom` as a `Number`, which makes this test
land one ulp low.

## Current Intent

Prefer passing `precision-exact-mathematical-values-5.js` and temporarily expect
`relativeto-total-of-each-unit.js` to fail. The former directly tests
`NudgeToCalendarUnit` exact mathematical behavior; the latter is a broader
representative-value test whose expected value happens to encode a different
JS-number operation order.

## Desired Fix Shape

Parentheses alone cannot satisfy both tests. The real fix needs the
combined-division shape without forming the combined numerator through lossy
`Number` multiplication.

A likely implementation shape:

```ts
const denomNano = diffBigNanos(epochNano0, epochNano1)
const progressNano = diffBigNanos(epochNano0, endEpochNano)

const denom = bigNanoToBigInt(denomNano)
const progress = bigNanoToBigInt(progressNano)

const totalNumerator =
  BigInt(integerPart) * denom +
  BigInt(sign) * progress

return numberFromExactRational(totalNumerator, denom)
```

`BigNano` is a good fit for the epoch-nanosecond differences, but the final
`numberFromExactRational()` step is more generic exact-rational-to-Number math.
That final conversion overlaps with the broader precision issue already noted
for:

- `../../test262/test/built-ins/Temporal/Duration/prototype/total/precision-exact-mathematical-values-6.js`
- `scripts/test262-config/expected-failures.txt`
