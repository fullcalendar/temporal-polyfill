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

## #2: Zoned time rounding uses the wrong day window

**Symptom:** the day and time split came out wrong. These gave `P1DT6M` and
`PT24H42M`; correct is `PT24H6M` and `P1DT42M`.

```js
const opts = { largestUnit: 'day', smallestUnit: 'minute' }
Temporal.ZonedDateTime.from('2024-11-03T01:30-05:00[America/New_York]')
  .until('2024-11-04T00:36[America/New_York]', opts)
Temporal.ZonedDateTime.from('2024-11-02T01:30[America/New_York]')
  .until('2024-11-03T01:12-05:00[America/New_York]', opts)
```

**How it happens:** `until`, `since` and `Duration#round` with a zoned origin, when
rounding to a time unit with a day-or-larger `largestUnit`, and the origin or
endpoint is in a repeated hour. It's rare: 38 of 12,000 inputs in a sweep near DST
changes.

**Why:** `nudgeZonedTimeDuration` built its final-day interval with two helpers
meant for the calendar-unit window (the spec's `ComputeNudgeWindow`). The origin
shortcut reused the origin's own instant for a zero-length move, and the retry moved
to the next day when the endpoint was outside the interval. The spec's
`NudgeToZonedTime` does neither: both edges always resolve from the wall clock, with
`compatible` disambiguation, so an origin in the second occurrence still starts from
the first. It also throws a `RangeError` if a skipped day leaves the interval empty,
such as Pacific/Apia's 2011-12-30.

**Fix:** compute both edges directly with `moveToEpochNano`, and throw on an empty
interval. Reference:
`NudgeToZonedTime`. Lite: `nudgeToZonedTime`.

**Left alone:** relative `total` across a skipped day returns a number, such as
`Duration.from({ hours: -1 }).total({ unit: 'day', relativeTo: '2011-12-31T12:00[Pacific/Apia]' })`
giving `-1.0416666666666667`, because `clampRelativeUnitValue` doesn't validate its
retried window. Lite throws a `RangeError`, and the reference fails an internal
assertion. It's a separate path from this fix.

## #4: `Duration#toString` keeps a stale negative sign

**Symptom:** `Duration.from({ milliseconds: -1 }).toString({ smallestUnit: 'second' })`
gave `-PT0S`. Correct is `PT0S`.

**How it happens:** any negative duration whose every field rounds to zero, including
with the default `trunc` mode. The function API shares the formatter.

**Why:** `formatDurationIso` merged the rounded fields over the original slots with
`{ ...slots, ...rounded }`, which kept the old `sign`. The formatter then printed the
`-` from that sign. It's not a rounding error: the fields were correct.

**Fix:** recompute the sign from the rounded fields.

## #5: `Duration#toString` loses precision on huge sub-second fields

**Symptom:** `new Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 2 ** 60).toString({ smallestUnit: 'microsecond', roundingMode: 'ceil' })`
gave `PT1152921504.606846S`. Correct is `PT1152921504.606847S`.

**How it happens:** rounding a duration whose largest non-zero field is a sub-second
one, with a value above 2^53. It failed about 25% of the time at that size, and never
below it.

**Why:** this is real double rounding. `roundDayTimeDurationByInc` rounds exactly in
BigInt, but then balances the result back into the input's largest unit. `Number()`
at that size can only hold multiples of 256, so it undoes the rounding:

```text
1152921504606846976   the input
1152921504606847000   rounded with `ceil`, exact in BigInt
1152921504606846976   after Number(), back to the input
```

**Fix:** balance into at least seconds, like the spec's `Duration#toString`, which
uses `LargerOfTwoTemporalUnits(largestUnit, second)`. Whole seconds and small
sub-second remainders are all exact. Lite does the same in `Duration.ts`'s `toString`.
