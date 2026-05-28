# Functional API

The functional API docs are organized by Temporal type. Each type page catalogs
the public functions exported for that type. Non-standard helpers are grouped in
the second half of each document.

Abbreviations used by the type pages:

- `Record` is the record type exported by the file being cataloged.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundOptions` is `RoundingModeName | RoundingMathOptions`.

## Types

| Temporal type | Catalog |
| --- | --- |
| [`Duration`](duration.md) | Standard functions only |
| [`Instant`](instant.md) | Standard functions only |
| [`Now`](now.md) | Current-time functions |
| [`PlainDate`](plaindate.md) | Standard functions and non-standard helpers |
| [`PlainDateTime`](plaindatetime.md) | Standard functions and non-standard helpers |
| [`PlainMonthDay`](plainmonthday.md) | Standard functions only |
| [`PlainTime`](plaintime.md) | Standard functions only |
| [`PlainYearMonth`](plainyearmonth.md) | Standard functions only |
| [`ZonedDateTime`](zoneddatetime.md) | Standard functions and non-standard helpers |
