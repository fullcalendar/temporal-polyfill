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

🤝 **Building a component library?** The tree-shakeable API is designed to be a
shared, deletable peer dependency for third-party tools like date pickers and
schedulers. See [For component authors](./for-component-authors.md).

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*` — for
example `temporal-polyfill/fns/PlainDate` or `temporal-polyfill/fns/ZonedDateTime`.
Each page below catalogs that type's functions, its TypeScript type exports, and
the codemod-shaped rewrite back to the real Temporal API.

This isn't a one-way door: once native `Temporal` is everywhere you target,
[temporal-polyfill-codemod](../../codemod/README.md) rewrites your function calls
back into idiomatic `Temporal.*` — so `PlainDateFns.addMonths(date, 2)` becomes
`date.add({ months: 2 })`. Each page's "Temporal API equivalent" snippets show
that mapping.

The tree-shakeable API always uses the runtime's native `Temporal` when present;
unlike the class-based entry points, it offers no `/implementation` variant for
forcing the bundled implementation.

Some catalog entries are intentionally non-standard, with no direct `Temporal.*`
equivalent — see [Non-standard functions](#non-standard-functions) for why.

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

Browsing the catalog, you'll spot functions with no direct `Temporal.*`
counterpart — `addDays`, `toBasicString`, `startOfYear`, `roundToWeek`,
`diffYears`. This is deliberate, not drift from the spec. They fall into three
groups:

1. **Narrowed forms of standard methods** — `addDays` is `.add({ days })`
   restricted to days; `toBasicString` is `.toString()` restricted to a plain
   ISO string. The unit or output shape is fixed at the call site.
2. **Gaps the standard API doesn't fill** — operations Temporal simply lacks,
   like `startOfYear` on a `ZonedDateTime`, `endOfMonth` on a `PlainDate`, or
   `roundToWeek`.
3. **Compressed multi-step operations** — one call in place of several method
   calls and option bags. The unit-named diff helpers are the clearest case:
   `diffYears(a, b)` returns a floating-point total that the standard API makes
   you work for.

### Why they live in this API

Bundle size, mostly — and group 1 is the heart of it. When a function fixes its
unit up front, it can take a shortcut straight to an internal that already
exists: diffing days-and-smaller, or rounding to a single fixed unit, is far
simpler than the fully general `add` / `round` / `diff` that must handle every
unit and every option. Exposing those shortcuts as standalone functions lets a
tree-shaking bundler keep only the cheap path.

Splitting them into a separate add-on library wouldn't work cleanly — it would
have to reach into this API's internals to get the same savings — so they're
bundled right alongside the functions they build on.

### It all maps back

Non-standard doesn't mean dead end. When you
[codemod to idiomatic Temporal](../../codemod/README.md), functions that mirror
Temporal become the real method calls, and the non-standard helpers map to
[`temporal-utils`](../../utils/README.md) — a companion package that performs the
same operations on real `Temporal` objects with matching semantics. `startOfYear`,
`roundToWeek`, `diffYears`, and the rest all have a direct equivalent there. So
the non-standard surface is just the bundle-optimized front door to behavior that
has a clean, supported home once you no longer need the polyfill.

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
