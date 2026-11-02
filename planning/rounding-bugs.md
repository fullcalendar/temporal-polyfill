# Rounding, sign and BigInt bugs

Context for the fixes that followed
[#110](https://github.com/fullcalendar/temporal-polyfill/issues/110) and
[#117](https://github.com/fullcalendar/temporal-polyfill/issues/117). Only those
two were reported by users. Everything else came from an audit of `polyfill/src`
that they prompted, and test262 doesn't catch any of it.

The `#N` labels below are row numbers from that audit, **not GitHub issues**.

"Reference" means `proposal-temporal/polyfill`. "Lite" means
`temporal-polyfill-lite`, whose behavior is the target for these fixes.

## Pre-epoch Instant rounding (GitHub #110, #117, PR #111)

**Symptom:** `Instant.fromEpochNanoseconds(-1n).toString({ smallestUnit: 'second' })`
gave `1970-01-01T00:00:00Z`, not `1969-12-31T23:59:59Z`.

**How it happens:** only when the floored quotient is odd and negative, and only
in modes that depend on sign: `trunc`, `expand`, `halfExpand` and `halfTrunc`.

**Why:** `roundBigNanoToDayOriginInc` passes rounding functions a small stand-in
for the huge quotient, called the tail, that needs the quotient's parity and the
fraction's sign. Measuring from the start of the UTC day makes the fraction
positive, but the tail used `% 2n`, and BigInt `%` takes the dividend's sign. That
gave `-1n + 0.7 = -0.3`, so sign-sensitive modes rounded the wrong way.

**Fix:** `& 1n`, which reads the low bit and is always `0n` or `1n`.

**Why test262 missed it:** its negative-instant inputs all floor to even quotients.

## #1: Backward zoned diff into a repeated hour

**Symptom:** this threw `RangeError: Cannot mix duration signs`. Correct is
`-P27DT24H`.

```js
Temporal.ZonedDateTime.from('2024-12-01T01:30[America/New_York]')
  .until('2024-11-03T01:30-05:00[America/New_York]', { largestUnit: 'day' })
```

**How it happens:** a backward diff whose end is the *second* occurrence of a
repeated hour, with wall-clock times that don't conflict. `since`,
`Duration#total` and `Duration#round` with a zoned `relativeTo`, and the function
API's `diff*` helpers share the path. `ZonedDateTimeFns.diffDays` returned a wrong
total instead of throwing.

**Why:** the diff moves the start's wall-clock time onto the end's date and backs
up by days if that overshoots. Here the marker resolves to the *first* 01:30, an
hour past the end. `prepareZonedEpochDiff` computed its limit relative to the
correction already applied, so a backward diff got no retry, and the overshooting
marker's opposite-sign remainder was combined with the date part.

**Fix:** use the spec's absolute limits, which are 2 forward and 1 backward.
Reference: `DifferenceZonedDateTime`, `maxDayCorrection`. Lite:
`differenceZonedDateTime`.
