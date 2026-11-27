# Tree-shakeable API Type Exports

TypeScript-only exports from the tree-shakeable API, and the type each one should
become when code is rewritten to the object-oriented Temporal API.

Examples use the tree-shakeable API import paths:

```ts
import type { OverflowOptions } from 'temporal-polyfill/fns'
import type { Record as PlainDateRecord } from 'temporal-polyfill/fns/PlainDate'
```

After a codemod, tree-shakeable API records and option aliases should generally be
rewritten to the `Temporal` namespace type used by the real API:

```ts
import type { Temporal } from 'temporal-polyfill'

type PlainDateRecord = Temporal.PlainDate
type OverflowOptions = Temporal.OverflowOptions
```

If a project already includes the global Temporal declarations, the import is
not needed and the same names can be referenced as global `Temporal.*` types.
The mappings below are based on `temporal-spec/global.d.ts`.

## Contents

- [Shared Types](#shared-types)
  - [`OverflowOptions`](#overflowoptions)
  - [`DisambiguationOptions`](#disambiguationoptions)
  - [`RoundingMode`](#roundingmode)
  - [`RoundingMathOptions`](#roundingmathoptions)
- [Calendar](#calendar)
  - [`Record`](#calendar-record)
- [Instant](#instant)
  - [`Record`](#instant-record)
  - [`Format`](#instant-format)
  - [`DiffOptions`](#instant-diffoptions)
  - [`ToStringOptions`](#instant-tostringoptions)
- [ZonedDateTime](#zoneddatetime)
  - [`Record`](#zoneddatetime-record)
  - [`FromFields`](#zoneddatetime-fromfields)
  - [`FromOptions`](#zoneddatetime-fromoptions)
  - [`WithFields`](#zoneddatetime-withfields)
  - [`WithOptions`](#zoneddatetime-withoptions)
  - [`DiffOptions`](#zoneddatetime-diffoptions)
  - [`ToStringOptions`](#zoneddatetime-tostringoptions)
  - [`TransitionOptions`](#transitionoptions)
  - [`TransitionDirection`](#transitiondirection)
- [PlainDateTime](#plaindatetime)
  - [`Record`](#plaindatetime-record)
  - [`Format`](#plaindatetime-format)
  - [`FromFields`](#plaindatetime-fromfields)
  - [`WithFields`](#plaindatetime-withfields)
  - [`DiffOptions`](#plaindatetime-diffoptions)
  - [`ToStringOptions`](#plaindatetime-tostringoptions)
- [PlainDate](#plaindate)
  - [`Record`](#plaindate-record)
  - [`Format`](#plaindate-format)
  - [`FromFields`](#plaindate-fromfields)
  - [`WithFields`](#plaindate-withfields)
  - [`DiffOptions`](#plaindate-diffoptions)
  - [`ToZonedDateTimeOptions`](#tozoneddatetimeoptions)
  - [`ToStringOptions`](#plaindate-tostringoptions)
- [PlainTime](#plaintime)
  - [`Record`](#plaintime-record)
  - [`Format`](#plaintime-format)
  - [`FromFields`](#plaintime-fromfields)
  - [`WithFields`](#plaintime-withfields)
  - [`DiffOptions`](#plaintime-diffoptions)
  - [`ToStringOptions`](#plaintime-tostringoptions)
- [PlainYearMonth](#plainyearmonth)
  - [`Record`](#plainyearmonth-record)
  - [`Format`](#plainyearmonth-format)
  - [`FromFields`](#plainyearmonth-fromfields)
  - [`WithFields`](#plainyearmonth-withfields)
  - [`DiffOptions`](#plainyearmonth-diffoptions)
  - [`ToStringOptions`](#plainyearmonth-tostringoptions)
- [PlainMonthDay](#plainmonthday)
  - [`Record`](#plainmonthday-record)
  - [`Format`](#plainmonthday-format)
  - [`FromFields`](#plainmonthday-fromfields)
  - [`WithFields`](#plainmonthday-withfields)
  - [`ToStringOptions`](#plainmonthday-tostringoptions)
- [Duration](#duration)
  - [`Record`](#duration-record)
  - [`FromFields`](#duration-fromfields)
  - [`WithFields`](#duration-withfields)
  - [`ToStringOptions`](#duration-tostringoptions)
  - [`RoundingUnit`](#roundingunit)
  - [`RoundingOptions`](#duration-roundingoptions)
  - [`TotalUnit`](#totalunit)
  - [`DurationTotalOptions`](#durationtotaloptions)
  - [`RelativeToOptions`](#relativetooptions)

## Shared Types

These types are exported from `temporal-polyfill/fns`.

### `OverflowOptions`

Temporal API type:

```ts
Temporal.OverflowOptions
```

Used by `from`, `with`, `add`, and `subtract` operations that accept
`{ overflow }`.

### `DisambiguationOptions`

Temporal API type:

```ts
Temporal.DisambiguationOptions
```

Used by date-time to zoned-date-time conversion.

### `RoundingMode`

Codemod target:

```ts
import type { RoundingMode } from 'temporal-utils'
```

The tree-shakeable API exports the projected property type, including `undefined`.
`temporal-utils` owns this shared helper type because it is also used by
single-unit rounding and diff utilities outside the tree-shakeable API.

### `RoundingMathOptions`

Codemod target:

```ts
import type { RoundingMathOptions } from 'temporal-utils'
```

Used by the helper functions that round or diff by a single unit.
`temporal-utils` owns this shared helper type because it is also used by
single-unit rounding and diff utilities outside the tree-shakeable API.

## Calendar

<a id="calendar-record"></a>

### `Record`

Import path:

```ts
import type { Record } from 'temporal-polyfill/fns/Calendar'
```

Temporal API type:

```ts
string
```

The tree-shakeable API calendar record usually becomes a calendar identifier string such
as `'iso8601'` or `'gregory'`. Use `Temporal.CalendarLike` only when preserving
a wider annotation type.

## Instant

<a id="instant-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.Instant
```

<a id="instant-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

`global.d.ts` extends `Intl.DateTimeFormat` methods to accept formattable
Temporal objects.

<a id="instant-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
```

Used by `Temporal.Instant.prototype.until` and `since`.

<a id="instant-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.InstantToStringOptions
```

The tree-shakeable API type accepts a string-only `timeZone`; the Temporal API accepts
`Temporal.TimeZoneLike`.

## ZonedDateTime

<a id="zoneddatetime-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.ZonedDateTime
```

<a id="zoneddatetime-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.ZonedDateTimeLikeObject
```

Tree-shakeable API `calendar` is a `CalendarFns.Record`; Temporal `calendar` is a
string.

<a id="zoneddatetime-fromoptions"></a>

### `FromOptions`

Temporal API type:

```ts
Temporal.ZonedDateTimeFromOptions
```

Used by `Temporal.ZonedDateTime.from`.

<a id="zoneddatetime-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.ZonedDateTimeLikeObject>
```

Used by `Temporal.ZonedDateTime.prototype.with`.

<a id="zoneddatetime-withoptions"></a>

### `WithOptions`

Temporal API type:

```ts
Temporal.ZonedDateTimeFromOptions
```

Used by `Temporal.ZonedDateTime.prototype.with`.

<a id="zoneddatetime-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
```

Used by `Temporal.ZonedDateTime.prototype.until` and `since`.

<a id="zoneddatetime-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.ZonedDateTimeToStringOptions
```

### `TransitionOptions`

Temporal API type:

```ts
Temporal.TransitionOptions
```

### `TransitionDirection`

Temporal API type:

```ts
Temporal.TransitionOptions['direction']
```

## PlainDateTime

<a id="plaindatetime-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.PlainDateTime
```

<a id="plaindatetime-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

<a id="plaindatetime-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.DateTimeLikeObject
```

Tree-shakeable API `calendar` is optional and record-valued; Temporal `calendar` is
optional and string-valued in the object type.

<a id="plaindatetime-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateTimeLikeObject>
```

Used by `Temporal.PlainDateTime.prototype.with`.

<a id="plaindatetime-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
```

Used by `Temporal.PlainDateTime.prototype.until` and `since`.

<a id="plaindatetime-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateTimeToStringOptions
```

## PlainDate

<a id="plaindate-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.PlainDate
```

<a id="plaindate-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

<a id="plaindate-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.DateLikeObject
```

Tree-shakeable API `calendar` is optional and record-valued; Temporal `calendar` is
optional and string-valued in the object type.

<a id="plaindate-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateLikeObject>
```

Used by `Temporal.PlainDate.prototype.with`.

<a id="plaindate-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
```

Used by `Temporal.PlainDate.prototype.until` and `since`.

### `ToZonedDateTimeOptions`

Temporal API type:

```ts
Temporal.PlainDateToZonedDateTimeOptions
```

Tree-shakeable API `plainTime` is a `PlainTimeFns.Record`; Temporal `plainTime` is
`Temporal.PlainTimeLike`.

<a id="plaindate-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

## PlainTime

<a id="plaintime-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.PlainTime
```

<a id="plaintime-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

<a id="plaintime-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.TimeLikeObject
```

<a id="plaintime-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.TimeLikeObject>
```

Used by `Temporal.PlainTime.prototype.with`.

<a id="plaintime-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
```

Used by `Temporal.PlainTime.prototype.until` and `since`.

<a id="plaintime-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainTimeToStringOptions
```

## PlainYearMonth

<a id="plainyearmonth-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.PlainYearMonth
```

<a id="plainyearmonth-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

<a id="plainyearmonth-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.YearMonthLikeObject
```

Tree-shakeable API `calendar` is record-valued; Temporal `calendar` is string-valued.

<a id="plainyearmonth-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.YearMonthLikeObject>
```

Used by `Temporal.PlainYearMonth.prototype.with`.

<a id="plainyearmonth-diffoptions"></a>

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>
```

Used by `Temporal.PlainYearMonth.prototype.until` and `since`.

<a id="plainyearmonth-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

The spec uses the same calendar-name option bag for `PlainYearMonth`.

## PlainMonthDay

<a id="plainmonthday-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.PlainMonthDay
```

<a id="plainmonthday-format"></a>

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

<a id="plainmonthday-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.DateLikeObject
```

Tree-shakeable API `calendar` is record-valued; Temporal `calendar` is string-valued.

<a id="plainmonthday-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateLikeObject>
```

Used by `Temporal.PlainMonthDay.prototype.with`.

<a id="plainmonthday-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

The spec uses the same calendar-name option bag for `PlainMonthDay`.

## Duration

<a id="duration-record"></a>

### `Record`

Temporal API type:

```ts
Temporal.Duration
```

<a id="duration-fromfields"></a>

### `FromFields`

Temporal API type:

```ts
Temporal.DurationLikeObject
```

<a id="duration-withfields"></a>

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DurationLikeObject>
```

Used by `Temporal.Duration.prototype.with`.

<a id="duration-tostringoptions"></a>

### `ToStringOptions`

Temporal API type:

```ts
Temporal.DurationToStringOptions
```

### `RoundingUnit`

Temporal API type:

```ts
Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
```

Used by `Temporal.Duration.prototype.round`.

<a id="duration-roundingoptions"></a>

### `RoundingOptions`

Temporal API type:

```ts
Temporal.DurationRoundingOptions
```

Tree-shakeable API `relativeTo` accepts record values; Temporal `relativeTo`
accepts Temporal object-like values.

### `TotalUnit`

Temporal API type:

```ts
Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
```

Used by `Temporal.Duration.prototype.total`. This mapping widens the type: the
tree-shakeable API's `TotalUnit` only includes `'day'` and time units, whereas
the Temporal target also accepts `'year'`, `'month'`, and `'week'`.

### `DurationTotalOptions`

Temporal API type:

```ts
Temporal.DurationTotalOptions
```

Tree-shakeable API `relativeTo` accepts record values; Temporal `relativeTo`
accepts Temporal object-like values.

### `RelativeToOptions`

Temporal API type:

```ts
Temporal.DurationRelativeToOptions
```

Used by `Temporal.Duration.compare`.
