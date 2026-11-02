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

## #7: `-0` leaks from relative rounding

**Symptom:** `Object.is(PlainDate.from('2020-06-01').until('2020-01-01', { largestUnit: 'year', smallestUnit: 'year', roundingMode: 'trunc' }).years, -0)`
was `true`. Correct is `false`.

**How it happens:** `until` and `Duration#round` on negative spans that round to zero
in a year, month, week or zoned-day unit, and the function API's `diffYears`,
`diffMonths`, `diffWeeks` and zoned `diffDays`. It's only visible through `Object.is`
or `1 / value`. `sign` and `toString` were already fine.

**Why:** rounding a small negative toward zero can return `-0`, such as
`Math.ceil(-0.1)`, `Math.trunc(-0.1)`, and the `Math.round` branch of the half modes.
`roundNumberToInc` passed that result straight through.

**Fix:** `|| 0` in `roundNumberToInc`, the choke point for every Number-based
rounding caller.

## #8: `Instant#round` accepts `roundingIncrement` above 1e9

**Symptom:** `new Instant(5n).round({ smallestUnit: 'nanosecond', roundingIncrement: 2e9 })`
returned a result. Correct is a `RangeError`.

**How it happens:** only for values above 1e9 that divide evenly into a day, such as
`2e9` or `86400e9`. `1e9 + 1` already threw, but only because it doesn't divide a
day. Other APIs already rejected these values, though sometimes only after reading
later options.

**Why:** the spec's `GetRoundingIncrementOption` rejects anything outside 1 to 1e9 as
soon as the option is read. We only coerced to an integer at that point and left the
range to `validateRoundingInc`, whose Instant "solar mode" allows anything up to a
full day in nanoseconds.

**Fix:** check the range in `coerceRoundingIncInteger`. This isn't a rounding bug: it
turned up in the increment sweep.

**Left alone:** objects whose `valueOf` returns a BigInt, such as
`roundingIncrement: { valueOf() { return 1n } }`, skip the expected `TypeError` in
the shared number converter. The reference, lite and native all throw. It's
unrelated to this range check.

## #6 and #9: `Duration#total` off in the last bit (WONTFIX)

**Symptom:** `Duration.from({ minutes: 146 }).total('hour')` gives
`2.4333333333333336`, where the exact result rounds to `2.433333333333333`. Relative
totals such as `{ unit: 'year', relativeTo }` have the same kind of error.

**How it happens:** in sweeps, non-relative totals (#6) were wrong in up to about 4.5%
of inputs, and relative totals (#9) in about 14% for years, 2% for months and 0.7% for
weeks. The error never exceeded 1 ULP, the last bit of the float.

**Why:** the steps round more than once. `divideBigNanoToExactNumber` rounds the
fraction, then rounds again when adding the whole part. `totalRelativeUnit` divides,
multiplies and adds in floats, and a year in nanoseconds is already above 2^53.

**Decision:** leave both. Lite documents the same limitation in
`docs/restrictions.md`, native had identical failure counts for #9 in our sweep, and
being exact costs size and speed. A narrow fix for #6 was tried and dropped, since no
user reported this. The comment in
`polyfill/scripts/test262-expected-failures/shim.txt` records the deviation.

## #3: Chinese and Dangi year moves

**Symptom:** `PlainDate.from({ year: 1984, monthCode: 'M10L', day: 1, calendar: 'chinese' }).add({ years: 20 }).monthCode`
gave `M09`. Correct is `M10`. Year-unit `until` could also give wrong results or throw
`Cannot mix duration signs`.

**How it happens:** moving a date in a leap month by years, when the target year lacks
that leap month but has an earlier one. About 16% of year moves from leap-month
sources were wrong in a 1950-2050 sweep. `PlainYearMonth#add` and year-unit diffs share
the path.

**Why:** `resolveMonthInMovedYear` correctly constrains `MxxL` to `Mxx`, but then
returned the month code's number as if it were an ordinal month. An earlier leap month
in the target year shifts every later ordinal up by one, so `M10` is ordinal 11 there,
and ordinal 10 is really `M09`.

**Fix:** convert with `monthCodeNumberToMonth`, which accounts for the target year's
leap month. Lite separates the same two steps as `constrainMonthCode` and
`monthCodeToOrdinal`. Hebrew's branch is unchanged because its leap slot is fixed.

**Left alone:** year-unit `until`/`since` still differs from the reference and lite on
some leap-month sources, for all three lunisolar calendars. For example,
`M03L` day 13 of 1955 in Chinese, `until` 10238 days later, gives `P27Y13M20D` where the
reference and lite give `P28Y20D`. It's a separate cause in `diffCalendarDates`, which
borrows a month for the day difference *before* comparing month codes, while the spec's
`NonISODateSurpasses` compares the original month code first. Fixing that means
reworking that diff logic.
