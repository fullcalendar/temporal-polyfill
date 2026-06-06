# Functional API Type Exports

TypeScript-only exports from the functional API, and the type each one should
become when code is rewritten to the object-oriented Temporal API.

Examples use the functional API import paths:

```ts
import type { OverflowOptions } from 'temporal-polyfill/fns'
import type { Record as PlainDateRecord } from 'temporal-polyfill/fns/PlainDate'
```

After a codemod, functional records and option aliases should generally be
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
  - [`Format`](#zoneddatetime-format)
  - [`FromFields`](#zoneddatetime-fromfields)
  - [`FromOptions`](#zoneddatetime-fromoptions)
  - [`WithFields`](#zoneddatetime-withfields)
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

The functional API exports the projected property type, including `undefined`.
`temporal-utils` owns this shared helper type because it is also used by
single-unit rounding and diff utilities outside the functional API.

### `RoundingMathOptions`

Codemod target:

```ts
import type { RoundingMathOptions } from 'temporal-utils'
```

Used by the helper functions that round or diff by a single unit.
`temporal-utils` owns this shared helper type because it is also used by
single-unit rounding and diff utilities outside the functional API.

## Calendar

### `Record`

Import path:

```ts
import type { Record } from 'temporal-polyfill/fns/Calendar'
```

Temporal API type:

```ts
string
```

The functional calendar record usually becomes a calendar identifier string such
as `'iso8601'` or `'gregory'`. Use `Temporal.CalendarLike` only when preserving
a wider annotation type.

## Instant

### `Record`

Temporal API type:

```ts
Temporal.Instant
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

`global.d.ts` extends `Intl.DateTimeFormat` methods to accept formattable
Temporal objects.

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
```

Used by `Temporal.Instant.prototype.until` and `since`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.InstantToStringOptions
```

The functional type accepts a string-only `timeZone`; the Temporal API accepts
`Temporal.TimeZoneLike`.

## ZonedDateTime

### `Record`

Temporal API type:

```ts
Temporal.ZonedDateTime
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.ZonedDateTimeLikeObject
```

Functional `calendar` is a `CalendarFns.Record`; Temporal `calendar` is a
string.

### `FromOptions`

Temporal API type:

```ts
Temporal.ZonedDateTimeFromOptions
```

Used by `Temporal.ZonedDateTime.from`.

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.ZonedDateTimeLikeObject>
```

Used by `Temporal.ZonedDateTime.prototype.with`.

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
```

Used by `Temporal.ZonedDateTime.prototype.until` and `since`.

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

### `Record`

Temporal API type:

```ts
Temporal.PlainDateTime
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.DateTimeLikeObject
```

Functional `calendar` is required and record-valued; Temporal `calendar` is
optional and string-valued in the object type.

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateTimeLikeObject>
```

Used by `Temporal.PlainDateTime.prototype.with`.

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
```

Used by `Temporal.PlainDateTime.prototype.until` and `since`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateTimeToStringOptions
```

## PlainDate

### `Record`

Temporal API type:

```ts
Temporal.PlainDate
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.DateLikeObject
```

Functional `calendar` is required and record-valued; Temporal `calendar` is
optional and string-valued in the object type.

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateLikeObject>
```

Used by `Temporal.PlainDate.prototype.with`.

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

Functional `plainTime` is a `PlainTimeFns.Record`; Temporal `plainTime` is
`Temporal.PlainTimeLike`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

## PlainTime

### `Record`

Temporal API type:

```ts
Temporal.PlainTime
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.TimeLikeObject
```

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.TimeLikeObject>
```

Used by `Temporal.PlainTime.prototype.with`.

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>
```

Used by `Temporal.PlainTime.prototype.until` and `since`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainTimeToStringOptions
```

## PlainYearMonth

### `Record`

Temporal API type:

```ts
Temporal.PlainYearMonth
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.YearMonthLikeObject
```

Functional `calendar` is record-valued; Temporal `calendar` is string-valued.

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.YearMonthLikeObject>
```

Used by `Temporal.PlainYearMonth.prototype.with`.

### `DiffOptions`

Temporal API type:

```ts
Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>
```

Used by `Temporal.PlainYearMonth.prototype.until` and `since`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

The spec uses the same calendar-name option bag for `PlainYearMonth`.

## PlainMonthDay

### `Record`

Temporal API type:

```ts
Temporal.PlainMonthDay
```

### `Format`

Temporal API type:

```ts
Intl.DateTimeFormat
```

### `FromFields`

Temporal API type:

```ts
Temporal.DateLikeObject
```

Functional `calendar` is record-valued; Temporal `calendar` is string-valued.

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DateLikeObject>
```

Used by `Temporal.PlainMonthDay.prototype.with`.

### `ToStringOptions`

Temporal API type:

```ts
Temporal.PlainDateToStringOptions
```

The spec uses the same calendar-name option bag for `PlainMonthDay`.

## Duration

### `Record`

Temporal API type:

```ts
Temporal.Duration
```

### `FromFields`

Temporal API type:

```ts
Temporal.DurationLikeObject
```

### `WithFields`

Temporal API type:

```ts
Temporal.PartialTemporalLike<Temporal.DurationLikeObject>
```

Used by `Temporal.Duration.prototype.with`.

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

### `RoundingOptions`

Temporal API type:

```ts
Temporal.DurationRoundingOptions
```

Functional `relativeTo` accepts functional records; Temporal `relativeTo`
accepts Temporal object-like values.

### `TotalUnit`

Temporal API type:

```ts
Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>
```

Used by `Temporal.Duration.prototype.total`.

### `DurationTotalOptions`

Temporal API type:

```ts
Temporal.DurationTotalOptions
```

Functional `relativeTo` accepts functional records; Temporal `relativeTo`
accepts Temporal object-like values.

### `RelativeToOptions`

Temporal API type:

```ts
Temporal.DurationRelativeToOptions
```

Used by `Temporal.Duration.compare`.
