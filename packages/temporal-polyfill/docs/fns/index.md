# Functional API

The functional API docs are organized by Temporal type or support object. Each
page catalogs the public functions exported for that area and shows the
codemod-shaped rewrite to the real Temporal API.

Abbreviations used by the type pages:

- `Record` is the record type exported by the file being cataloged.
- `CalendarRecord` is the opaque calendar handle used by function APIs that
  accept calendar behavior.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundingMathOptions` contains rounding increment and rounding mode options.
  The unit is implied by the `roundTo*` function name. Round helpers also
  accept a `RoundingMode` string as shorthand for `options.roundingMode`.

## Catalog

- [`PlainDate`](plaindate.md) - date construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
- [`PlainDateTime`](plaindatetime.md) - date-time construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
- [`PlainMonthDay`](plainmonthday.md) - month-day construction, field replacement, comparison, conversion, and formatting.
- [`PlainTime`](plaintime.md) - time construction, fields, arithmetic, comparison, conversion, differences, and formatting.
- [`PlainYearMonth`](plainyearmonth.md) - year-month construction, fields, arithmetic, comparison, conversion, differences, and formatting.
- [`ZonedDateTime`](zoneddatetime.md) - zoned date-time construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
- [`Instant`](instant.md) - exact-time construction, epoch conversion, arithmetic, comparison, time-zone projection, and formatting.
- [`Now`](now.md) - current-time helpers.
- [`Duration`](duration.md) - duration construction, arithmetic, rounding, totaling, comparison, and formatting.
- [`Calendar`](calendar.md) - `CalendarRecord` factories and calendar resolver helpers.
- [`Types`](types.md) - TypeScript-only exports and their codemod targets for the real Temporal API.

## Native Interop

Each record-bearing type also exports a `toNative` function (listed under that
type's Conversion section) that builds a real `Temporal.*` instance from the
record's internal ISO/epoch slots. This is awkward to do in userspace — the
native constructors want ISO values that the records deliberately don't expose —
so the polyfill provides it directly, with no string round-trip. `toNative`
reads the native constructors from `globalThis.Temporal`, throwing when no
global `Temporal` is present. The codemod rewrites a `toNative` call to its bare
record argument, since a migrated record is already a native Temporal object.
