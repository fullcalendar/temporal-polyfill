# Chinese `daysInYear` Stopgap

Context: Bucket I still contains non-ISO calendar field-math failures. During
the Chinese `daysInYear` pass, Node 22 ICU4C disagreed with test262 for a small
set of Chinese calendar year lengths.

## Current Stopgap

`src/internal/calendarConfig.ts` currently defines
`daysInYearOverridesByCalendarIdBase`.

As of this note, it contains Chinese overrides for:

- `2026: 354`
- `2027: 354`
- `2029: 355`
- `2030: 354`

`src/internal/intlMath.ts` applies this table in `computeIntlDaysInYear()` before
falling back to the normal Intl-scraped year-boundary calculation.

This is intentionally an accessor-level fix. It makes the bucket-I
`daysInYear/basic-chinese.js` tests pass for `PlainDate`, `PlainDateTime`,
`PlainYearMonth`, and `ZonedDateTime`, but it does not make the underlying
Chinese calendar model coherent for those years.

## Why This Is Not Fully Satisfying

The normal implementation derives calendar structure from `Intl.DateTimeFormat`:

1. `createIntlYearDataCache()` scrapes month boundary epoch milliseconds for a
   calendar year.
2. `computeIntlEpochMilli()` uses those month starts for date construction.
3. `computeIntlDaysInYear()` normally subtracts the start of `year + 1` from the
   start of `year`.
4. Month/day arithmetic and other accessors can depend on the same boundary data.

If ICU4C's Chinese year boundary data is wrong, then overriding only
`daysInYear` can leave related behavior inconsistent. Potentially affected
areas include date construction near the boundary, `inLeapYear`, month
arithmetic crossing the boundary, and `since`/`until` behavior.

## Evidence So Far

The focused tests:

```sh
pnpm run test262 $(awk -F '\t' '$1 == "I" && $2 ~ /prototype\/daysInYear\/basic-chinese\.js$/ { print "../../test262/" $2 }' TEST-FAILURE-BUCKETS.tsv) --no-max
```

passed after adding the override table.

Before the override, the sample mismatch scan showed:

```text
2026 got 355 expected 354
2027 got 353 expected 354
2029 got 354 expected 355
2030 got 355 expected 354
```

## Better Follow-Up

For a coherent fix, inspect the Chinese `queryYearData()` month-boundary arrays
for years around `2026`, `2027`, `2029`, and `2030`.

The useful question is which boundary is wrong:

- the start of one of those years,
- the start of the following year,
- an internal month boundary,
- leap-month placement or labeling,
- or a broader ICU4C-vs-ICU4X data disagreement.

If the mismatch is narrow, prefer correcting the scraped year data in
`createIntlYearDataCache()` / `correctIntlYearData()` so all consumers see the
same calendar model. If it turns into broad Chinese calendar reconciliation,
pause before replacing the stopgap with a larger algorithmic change.
