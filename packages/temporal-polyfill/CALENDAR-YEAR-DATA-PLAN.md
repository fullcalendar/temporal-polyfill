# Calendar Year Data Plan

## Goal

Replace narrow `daysInYear` accessor overrides with coherent corrected year
data for known host-Intl calendar-data disagreements.

The intended model is:

- scrape `IntlYearData` from the host, as today
- replace known-bad years with canonical bounded data after scraping
- use that corrected year data for both directions in corrected ranges:
  - calendar Y/M/D -> ISO
  - ISO -> calendar Y/M/D

This keeps month lengths, year lengths, date construction, and field accessors
on the same calendar model.

## Part 1: Canonical Year Data Overrides

### Current State

`createIntlYearDataCache()` scrapes `Intl.DateTimeFormat` results into:

```ts
interface IntlYearData {
  monthEpochMillis: number[]
  monthStrings: string[]
}
```

That data is then consumed by paths such as:

- `computeIntlEpochMilli()`
- `computeIntlDaysInMonth()`
- `computeIntlMonthsInYear()`
- `computeIntlDaysInYear()`, unless an accessor override exists

The existing `daysInYearOverridesByCalendarIdBase` table fixes only
`daysInYear`. It does not make the underlying month-boundary table coherent.

### Proposed Shape

Add a bounded canonical year-data table, keyed by calendar and calendar year:

```ts
const canonicalIntlYearDataByCalendarIdBase: Record<
  string,
  Record<number, IntlYearData>
> = {
  chinese: {
    2026: {
      monthEpochMillis: [...],
      monthStrings: [...],
    },
  },
}
```

The table should contain complete year data, not just year lengths:

- the ISO epoch millis for every month start
- month labels in the same shape expected by existing month-code logic
- leap-month labels/positions where relevant

### Integration Point

Keep the host scrape path, then replace only known-bad years:

```text
scraped = scrape Intl year data
corrected = correctIntlYearData(calendarIdBase, year, scraped)
canonical = canonicalYearDataByCalendarIdBase[calendarIdBase]?.[year]
return canonical ?? corrected
```

Scraping first preserves the current pipeline and makes this an explicit
bounded replacement step. Returning canonical data before scraping is also
possible, but replacing after scraping makes the override easier to compare
against the host result during development.

### Chinese Use Case

The Chinese `daysInYear` mismatch is currently patched only at accessor level:

```text
ICU-derived lengths:
2026: 355
2027: 353
2029: 354
2030: 355

test262 expects:
2026: 354
2027: 354
2029: 355
2030: 354
```

Canonical year data for the affected years would let `daysInYear` fall out from
month boundaries naturally. It would also make construction and arithmetic use
the same corrected Chinese year shape.

The hard part is not plumbing. The hard part is sourcing enough authoritative
Chinese/ICU4X data to populate full month-boundary tables, including leap-month
placement and labels.

### Hebrew Use Case

Hebrew is more tractable because it is rule-based. Canonical year data could
eventually replace:

- old `correctIntlYearData()` special cases for impossible leap-year shapes
- `daysInYearOverridesByCalendarIdBase.hebrew`
- the remaining 5806/5807 accessor-only year-length overrides

The same table would be able to represent both old internal year-shape fixes and
the 2046 year-start correction.

## Part 2: Use Corrected Year Data For ISO -> Calendar Fields

### Current Split

Today the Intl-backed bridge has two different sources of calendar facts:

- ISO -> calendar Y/M/D mostly trusts raw `Intl.DateTimeFormat.formatToParts()`
- calendar Y/M/D -> ISO mostly trusts `queryYearData().monthEpochMillis`

That split is why correcting `IntlYearData` fixes construction and
month-boundary math without necessarily fixing ISO -> calendar field accessors.

### Proposed Lookup

For known corrected calendars/years, derive ISO -> calendar fields from the
corrected year data instead of blindly trusting raw Intl fields.

Given an ISO `epochMilli`, find the calendar year whose corrected year interval
contains that instant:

```text
start = queryYearData(year).monthEpochMillis[0]
end   = queryYearData(year + 1).monthEpochMillis[0]

start <= epochMilli < end
```

This can be implemented with either:

- a binary search over calendar years, comparing `epochMilli` to corrected year
  starts, or
- a narrower search using raw Intl's reported year as a hint, then checking
  neighboring year tables such as `year - 1`, `year`, and `year + 1`

After finding the year, binary search within that year's
`monthEpochMillis` array:

```text
monthStart = largest monthEpochMillis[i] <= epochMilli
month      = i + 1
day        = diffDays(monthStart, epochMilli) + 1
monthLabel = monthStrings[i]
```

The calendar-specific month-code logic can then derive `monthCode` from the
month index and leap-month position.

### Scope Control

Do not apply this globally at first.

A conservative rollout should:

- keep raw Intl field extraction as the default
- use corrected-year-data field derivation only for calendars/years with
  canonical year-data overrides
- check neighboring years when the ISO date is near a corrected boundary
- assert or test that corrected Y/M/D -> ISO and ISO -> corrected Y/M/D roundtrip
  across the corrected boundaries

## Validation Checklist

For each canonical year-data entry:

- `monthEpochMillis` is strictly increasing
- the first month start equals the intended new-year boundary
- the next year's first month start minus this year's first month start equals
  the expected `daysInYear`
- every month length is plausible for the calendar
- leap-month labels and positions match the intended data source
- calendar Y/M/D -> ISO -> calendar Y/M/D roundtrips over the corrected boundary
- ISO -> calendar Y/M/D -> ISO roundtrips over the corrected boundary
- related test262 buckets pass without broadening expected failures

## Remaining Risks

This approach solves bridge consistency. It does not by itself prove the
canonical data is correct.

For Hebrew, the evidence burden is lower because the calendar is rule-based and
month-code mapping is predictable.

For Chinese/Dangi, the evidence burden is higher because year starts, month
starts, and leap-month placement are astronomical data. A corrected year-data
table should be sourced from the same intended data model as test262, such as
ICU4X-derived expected data, and kept bounded to the years that need it.
