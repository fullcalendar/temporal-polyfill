# Tree-shakeable API 🌳

`temporal-polyfill` ships an alternate function-based API for libraries and bundle-sensitive apps. Instead of `Temporal.*` classes that carry every method, every operation is a standalone function on a plain record, so bundlers keep only what you import:

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2026, 6, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2026-08-01'
```

🧩 **Building a component library?** See [For component authors](./for-component-authors.md) for how to share one copy with the host app.

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*`, such as `temporal-polyfill/fns/PlainDate` or `temporal-polyfill/fns/ZonedDateTime`. The pages below list each type's functions, TypeScript exports, and standard `Temporal` equivalents.

When native `Temporal` is available everywhere you support, [temporal-polyfill-codemod](../../codemod/README.md) can rewrite these calls into standard `Temporal.*` expressions (for example, `PlainDateFns.addMonths(date, 2)` becomes `date.add({ months: 2 })`). Each reference page includes the rewritten equivalent under every function.

Unlike the class-based entrypoints, the tree-shakeable API always delegates to the runtime's native `Temporal` when available; there is no `/implementation` variant to force the polyfill.

Some functions in the catalog do not have a direct `Temporal.*` counterpart; see [Non-standard functions](#non-standard-functions).

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

## Non-standard functions

Several functions in the catalog have no direct `Temporal.*` method, such as `addDays`, `toBasicString`, `startOfYear`, `roundToWeek`, and `diffYears`. They fall into three categories:

1. **Fixed-unit or narrowed variants of standard methods.** `addDays` is `.add({ days })` fixed to days; `toBasicString` is `.toString()` restricted to a basic ISO string.
2. **Helpers Temporal does not provide.** Operations such as `startOfYear`, `endOfMonth`, and `roundToWeek`.
3. **Combined multi-step operations.** Single calls that replace several method calls and option bags — for example, `diffYears(a, b)` returns fractional years, which in standard Temporal takes `until()` plus `total()` with a `relativeTo`.

### Why they live in this API

Fixing the unit or output format up front lets a function call a smaller internal code path directly instead of pulling in the general-purpose `add`, `round`, or `until` logic. Keeping these helpers in the same package lets them share those internals so a tree-shaking bundler only keeps the narrower path. A separate add-on library would not have access to those internals and could not achieve the same bundle savings.

### Migration path

When you run [temporal-polyfill-codemod](../../codemod/README.md), standard functions are rewritten to `Temporal.*` calls, while non-standard helpers are rewritten to [`temporal-utils`](../../utils/README.md), which implements the same operations (`startOfYear`, `roundToWeek`, `diffYears`, etc.) on standard `Temporal` objects.

## Temporal Interop

Each record-bearing type exports a `toTemporal` function (listed under that type's Conversion section) that constructs a real `Temporal.*` instance directly from the record's internal ISO/epoch slots without a string round-trip.

`toTemporal` reads the constructors from the global `Temporal` object at call time, so it works with either a host-native `Temporal` or any global polyfill. If the host environment does not have native `Temporal`, install a global polyfill first (using `temporal-polyfill/global` lets the bundler share internals with the `fns` imports).

`toTemporal` throws if no global `Temporal` is present.

## Abbreviations

Abbreviations used by the type pages:

- `Record` is the record type exported by the file being cataloged.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundingMathOptions` contains rounding increment and rounding mode options.
  The unit is implied by the `roundTo*` function name. Round helpers also
  accept a `RoundingMode` string as shorthand for `options.roundingMode`.
