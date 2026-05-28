# Functional API

The functional API docs are organized by Temporal type or support object. Each
page catalogs the public functions exported for that area and shows the
codemod-shaped rewrite to the real Temporal API.

Abbreviations used by the type pages:

- `Record` is the record type exported by the file being cataloged.
- `CalendarRecord` is the opaque calendar handle used by function APIs that
  accept calendar behavior.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundOptions` is `RoundingModeName | RoundingMathOptions`.

## Catalog

- [`Calendar`](calendar.md) - `CalendarRecord` factories and calendar resolver helpers.
- [`Duration`](duration.md) - duration construction, arithmetic, rounding, totaling, comparison, and formatting.
- [`Instant`](instant.md) - exact-time construction, epoch conversion, arithmetic, comparison, time-zone projection, and formatting.
- [`Now`](now.md) - current-time helpers.
- [`PlainDate`](plaindate.md) - date construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
- [`PlainDateTime`](plaindatetime.md) - date-time construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
- [`PlainMonthDay`](plainmonthday.md) - month-day construction, field replacement, comparison, conversion, and formatting.
- [`PlainTime`](plaintime.md) - time construction, fields, arithmetic, comparison, conversion, differences, and formatting.
- [`PlainYearMonth`](plainyearmonth.md) - year-month construction, fields, arithmetic, comparison, conversion, differences, and formatting.
- [`ZonedDateTime`](zoneddatetime.md) - zoned date-time construction, fields, arithmetic, comparison, conversion, start/end helpers, differences, and formatting.
