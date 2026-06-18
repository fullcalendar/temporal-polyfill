# Tree-shakeable API

For library authors and other developers who are hyper-concerned about bundle
size, `temporal-polyfill` ships an alternate, function-based API designed for
tree-shaking. Instead of large `Temporal.*` classes, every operation is a
standalone function that acts on a plain record, so a bundler keeps only the
functions you actually import:

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2026, 6, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2026-08-01'
```

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*` — for
example `temporal-polyfill/fns/PlainDate` or `temporal-polyfill/fns/ZonedDateTime`.
These docs are organized by Temporal type or support object: each page catalogs
the public functions exported for that area, the TypeScript types it exports,
and the codemod-shaped rewrite back to the real Temporal API.

Best of all, this isn't a one-way door. When the time is right — once native
`Temporal` is available in every environment you target, and you no longer need
the polyfill — [temporal-polyfill-codemod](../../../temporal-polyfill-codemod/README.md)
rewrites your function calls back into idiomatic `Temporal.*` expressions. So
`PlainDateFns.addMonths(date, 2)` becomes `date.add({ months: 2 })`, with no
manual find-and-replace. That rewrite is exactly what each page's "Temporal API
equivalent" snippets describe.

The tree-shakeable API always uses the runtime's native `Temporal` when one is
available. Unlike the class-based entry points — which offer
`/implementation` variants for forcing the bundled JavaScript implementation —
the tree-shakeable API has no such option.

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
- [`Calendar`](calendar.md) - `CalendarFns.Record` factories and calendar resolver helpers.
- [`Types`](types.md) - TypeScript-only exports and their codemod targets for the real Temporal API.

## Temporal Interop

Each record-bearing type also exports a `toTemporal` function (listed under that
type's Conversion section) that builds a real `Temporal.*` instance from the
record's internal ISO/epoch slots. This is awkward to do in userspace — the
class constructors want ISO values that the records deliberately don't expose —
so the polyfill provides it directly, with no string round-trip.

`toTemporal` reads the constructors from the global `Temporal` at call time, so
it works against whatever implementation is installed — a host-native `Temporal`
or any polyfill. When the host has no native `Temporal`, install one globally
before calling `toTemporal`; we recommend this package's own
`temporal-polyfill/global` entrypoint for optimal code sharing.

`toTemporal` throws when no global `Temporal` is present.

## Abbreviations

Abbreviations used by the type pages:

- `Record` is the record type exported by the file being cataloged.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundingMathOptions` contains rounding increment and rounding mode options.
  The unit is implied by the `roundTo*` function name. Round helpers also
  accept a `RoundingMode` string as shorthand for `options.roundingMode`.
