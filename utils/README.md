# temporal-utils

Small helpers for working with standard [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) objects 🛠️

Most helpers preserve the input type. Passing a `Temporal.PlainDateTime` to `startOfMonth` returns a `Temporal.PlainDateTime`; passing a `Temporal.ZonedDateTime` returns a `Temporal.ZonedDateTime`.

## Installation

```
npm install temporal-utils
```

Does not bundle a Temporal implementation. See [Requirements](#requirements).

## Usage

Import helpers from the package root and pass any supported `Temporal` instance:

```ts
import { startOfMonth, diffDays } from 'temporal-utils'

// Pass a PlainDate, get a PlainDate back
startOfMonth(Temporal.PlainDate.from('2024-07-20')).toString()
// '2024-07-01'

// Pass a ZonedDateTime, get a ZonedDateTime back
startOfMonth(
  Temporal.ZonedDateTime.from('2024-07-20T12:30[America/New_York]'),
).toString()
// '2024-07-01T00:00:00-04:00[America/New_York]'

diffDays(
  Temporal.PlainDate.from('2024-07-01'),
  Temporal.PlainDate.from('2024-07-20'),
)
// 19
```

## Requirements

`temporal-utils` does not bundle a Temporal implementation. It operates on any standard `Temporal` instances you pass in — whether from native `Temporal`, a global polyfill, or a local ponyfill import such as `import { Temporal } from 'temporal-polyfill'`.

The examples in this README assume a global `Temporal`, provided either by:

- **Native `Temporal`** in browsers and runtimes that ship it.
- **A global polyfill**, such as [`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill/blob/main/polyfill/README.md):

  ```ts
  import 'temporal-polyfill/global'
  ```

## Function Reference

- [Field Replacement](#field-replacement)
  - [`withDayOfYear`](#withdayofyear)
  - [`withDayOfWeek`](#withdayofweek)
  - [`withWeekOfYear`](#withweekofyear)
- [Difference Helpers](#difference-helpers)
  - [`diffYears`](#diffyears)
  - [`diffMonths`](#diffmonths)
  - [`diffWeeks`](#diffweeks)
  - [`diffDays`](#diffdays)
  - [`diffHours`](#diffhours)
  - [`diffMinutes`](#diffminutes)
  - [`diffSeconds`](#diffseconds)
  - [`diffMilliseconds`](#diffmilliseconds)
  - [`diffMicroseconds`](#diffmicroseconds)
  - [`diffNanoseconds`](#diffnanoseconds)
- [Rounding Helpers](#rounding-helpers)
  - [`roundToYear`](#roundtoyear)
  - [`roundToMonth`](#roundtomonth)
  - [`roundToWeek`](#roundtoweek)
  - [⚠️ `roundToDay`](#roundtoday)
  - [⚠️ `roundToHour`](#roundtohour)
  - [⚠️ `roundToMinute`](#roundtominute)
  - [⚠️ `roundToSecond`](#roundtosecond)
  - [⚠️ `roundToMillisecond`](#roundtomillisecond)
  - [⚠️ `roundToMicrosecond`](#roundtomicrosecond)
- [Start Of Unit](#start-of-unit)
  - [`startOfYear`](#startofyear)
  - [`startOfMonth`](#startofmonth)
  - [`startOfWeek`](#startofweek)
  - [`startOfDay`](#startofday)
  - [`startOfHour`](#startofhour)
  - [`startOfMinute`](#startofminute)
  - [`startOfSecond`](#startofsecond)
  - [`startOfMillisecond`](#startofmillisecond)
  - [`startOfMicrosecond`](#startofmicrosecond)
- [End Of Unit](#end-of-unit)
  - [`endOfYear`](#endofyear)
  - [`endOfMonth`](#endofmonth)
  - [`endOfWeek`](#endofweek)
  - [`endOfDay`](#endofday)
  - [`endOfHour`](#endofhour)
  - [`endOfMinute`](#endofminute)
  - [`endOfSecond`](#endofsecond)
  - [`endOfMillisecond`](#endofmillisecond)
  - [`endOfMicrosecond`](#endofmicrosecond)
- [Shared Types](#shared-types)
  - [`RoundingMode`](#roundingmode)
  - [`RoundingMathOptions`](#roundingmathoptions)

## Field Replacement

These helpers fill gaps where Temporal exposes calendar-derived fields such as
`dayOfYear`, `dayOfWeek`, and `weekOfYear`, but does not provide direct
`with({ ... })` fields for replacing them.

All field replacement helpers:

- accept `Temporal.PlainDate`, `Temporal.PlainDateTime`, or
  `Temporal.ZonedDateTime`
- truncate numeric input toward zero before applying it
- accept Temporal field overflow options: `{ overflow: 'constrain' }` or
  `{ overflow: 'reject' }`
- default overflow behavior to `'constrain'`

### `withDayOfYear`

Signature:

```ts
function withDayOfYear<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(
  date: T,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): T
```

Returns the same calendar year with `dayOfYear` replaced. The time, time zone,
and calendar are preserved.

```ts
import { withDayOfYear } from 'temporal-utils'

const date = Temporal.PlainDate.from('2024-02-27')

withDayOfYear(date, 5).toString()
// '2024-01-05'

withDayOfYear(date, 500).toString()
// '2024-12-31'

withDayOfYear(date, 500, { overflow: 'reject' })
// RangeError
```

### `withDayOfWeek`

Signature:

```ts
function withDayOfWeek<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(
  date: T,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): T
```

Returns the same ISO week with `dayOfWeek` replaced. Temporal uses ISO weekday
numbers: Monday is `1` and Sunday is `7`.

```ts
import { withDayOfWeek } from 'temporal-utils'

const date = Temporal.PlainDate.from('2024-02-27') // Tuesday

withDayOfWeek(date, 4).toString()
// '2024-02-29'

withDayOfWeek(date, 8).toString()
// '2024-03-03'
```

### `withWeekOfYear`

Signature:

```ts
function withWeekOfYear<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(
  date: T,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): T
```

Returns the same ISO week-year with `weekOfYear` replaced, preserving the
current day of week. This helper is ISO-only and throws a `RangeError` for
calendars where Temporal does not expose ISO week fields.

```ts
import { withWeekOfYear } from 'temporal-utils'

const date = Temporal.PlainDate.from('2024-02-27') // Tuesday, week 9

withWeekOfYear(date, 27).toString()
// '2024-07-02'

withWeekOfYear(date.withCalendar('hebrew'), 27)
// RangeError
```

## Difference Helpers

Single-unit difference helpers return a number for `date0.until(date1)`. The
helpers are directional: reversing the arguments flips the sign (for variable-length
calendar units such as months or years, the magnitude can also differ slightly
depending on which endpoint anchors the calculation).

If no options are supplied, the result is the exact total in the requested unit.
Pass a `RoundingMode` string or a `RoundingMathOptions` object to request Temporal
rounding behavior for that unit.

```ts
import { diffDays, diffMonths } from 'temporal-utils'

const start = Temporal.PlainDate.from('2024-02-20')
const end = Temporal.PlainDate.from('2024-04-10')

diffMonths(start, end)
// approximately 1.677...

diffMonths(start, end, 'floor')
// 1

diffDays(start, end, { roundingMode: 'ceil', roundingIncrement: 7 })
// 56
```

Date and calendar unit helpers use `relativeTo` internally so totals account
for calendar units. For `Temporal.ZonedDateTime`, totals also account for
time-zone transitions. Time-unit helpers produce elapsed-time totals.

### `diffYears`

Signature:

```ts
function diffYears(
  date0: Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in years. Supported input types are
`Temporal.PlainYearMonth`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

### `diffMonths`

Signature:

```ts
function diffMonths(
  date0: Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in months. Supported input types are
`Temporal.PlainYearMonth`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

### `diffWeeks`

Signature:

```ts
function diffWeeks(
  date0: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in weeks. Supported input types are `Temporal.PlainDate`,
`Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `diffDays`

Signature:

```ts
function diffDays(
  date0: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in days. Supported input types are `Temporal.PlainDate`,
`Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `diffHours`

Signature:

```ts
function diffHours(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in hours. Supported input types are `Temporal.Instant`,
`Temporal.PlainTime`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `diffMinutes`

Signature:

```ts
function diffMinutes(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in minutes. Supported input types are `Temporal.Instant`,
`Temporal.PlainTime`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `diffSeconds`

Signature:

```ts
function diffSeconds(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in seconds. Supported input types are `Temporal.Instant`,
`Temporal.PlainTime`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `diffMilliseconds`

Signature:

```ts
function diffMilliseconds(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in milliseconds. Supported input types are
`Temporal.Instant`, `Temporal.PlainTime`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

### `diffMicroseconds`

Signature:

```ts
function diffMicroseconds(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in microseconds. Supported input types are
`Temporal.Instant`, `Temporal.PlainTime`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

### `diffNanoseconds`

Signature:

```ts
function diffNanoseconds(
  date0: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  date1: Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  options?: RoundingMode | RoundingMathOptions,
): number
```

Returns the difference in nanoseconds. Supported input types are
`Temporal.Instant`, `Temporal.PlainTime`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

## Rounding Helpers

Calendar rounding helpers return the closest start of the named unit. Temporal's built-in `.round()` stops at days (and `PlainDate` / `PlainYearMonth` have no `.round()`), so these helpers cover year, month, and week boundaries.

If `options` or `options.roundingMode` is omitted, `roundingMode` defaults to
`'halfExpand'`. Pass a `RoundingMode` string as shorthand for
`{ roundingMode }`.

`RoundingMathOptions` must not include `smallestUnit`; the helper name supplies
the unit. For the year, month, and week helpers, `roundingIncrement` must be
omitted or `1`.

```ts
import { roundToMonth, roundToWeek, roundToYear } from 'temporal-utils'

const dateTime = Temporal.PlainDateTime.from('2024-07-20T12:30:00')

roundToYear(dateTime).toString()
// '2025-01-01T00:00:00'

roundToMonth(dateTime, 'floor').toString()
// '2024-07-01T00:00:00'

roundToWeek(dateTime, { roundingMode: 'floor' }).toString()
// '2024-07-15T00:00:00'
```

⚠️ The day and smaller `roundTo*` helpers are exported as codemod targets rather
than recommended hand-written API. In application code, prefer Temporal's built-in
`.round()` directly:

```ts
dateTime.round({ smallestUnit: 'day' })
time.round({ smallestUnit: 'minute', roundingMode: 'ceil' })
instant.round({ smallestUnit: 'second' })
```

### `roundToYear`

Signature:

```ts
function roundToYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Rounds to the nearest year boundary. Supported input types are
`Temporal.PlainYearMonth`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, and
`Temporal.ZonedDateTime`.

### `roundToMonth`

Signature:

```ts
function roundToMonth<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Rounds to the nearest month boundary. Supported input types are
`Temporal.PlainDate`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

### `roundToWeek`

Signature:

```ts
function roundToWeek<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Rounds to the nearest ISO week boundary. Supported input types are
`Temporal.PlainDate`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime`.

<a id="roundtoday"></a>

### ⚠️ `roundToDay`

Signature:

```ts
function roundToDay<T extends Temporal.PlainDateTime | Temporal.ZonedDateTime>(
  date: T,
  options?: RoundingMode | RoundingMathOptions,
): T
```

Codemod target for rounding to the nearest day. Prefer
`dateTime.round({ smallestUnit: 'day' })` in hand-written code.

<a id="roundtohour"></a>

### ⚠️ `roundToHour`

Signature:

```ts
function roundToHour<
  T extends Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Codemod target for rounding to the nearest hour. Prefer
`value.round({ smallestUnit: 'hour' })` in hand-written code.

<a id="roundtominute"></a>

### ⚠️ `roundToMinute`

Signature:

```ts
function roundToMinute<
  T extends Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Codemod target for rounding to the nearest minute. Prefer
`value.round({ smallestUnit: 'minute' })` in hand-written code.

<a id="roundtosecond"></a>

### ⚠️ `roundToSecond`

Signature:

```ts
function roundToSecond<
  T extends Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Codemod target for rounding to the nearest second. Prefer
`value.round({ smallestUnit: 'second' })` in hand-written code.

<a id="roundtomillisecond"></a>

### ⚠️ `roundToMillisecond`

Signature:

```ts
function roundToMillisecond<
  T extends Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Codemod target for rounding to the nearest millisecond. Prefer
`value.round({ smallestUnit: 'millisecond' })` in hand-written code.

<a id="roundtomicrosecond"></a>

### ⚠️ `roundToMicrosecond`

Signature:

```ts
function roundToMicrosecond<
  T extends Temporal.Instant | Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T, options?: RoundingMode | RoundingMathOptions): T
```

Codemod target for rounding to the nearest microsecond. Prefer
`value.round({ smallestUnit: 'microsecond' })` in hand-written code.

## Start Of Unit

Start helpers truncate smaller fields to the beginning of the named unit.
`startOfWeek` uses ISO weeks, so the week starts on Monday.

For `Temporal.ZonedDateTime`, these helpers use Temporal's own field
replacement behavior. If local midnight is skipped by a time-zone transition,
Temporal resolves to the first real instant after the skipped wall time.

```ts
import { startOfMonth, startOfWeek } from 'temporal-utils'

const zdt = Temporal.ZonedDateTime.from('2024-07-20T12:30:00[America/New_York]')

startOfMonth(zdt).toString()
// '2024-07-01T00:00:00-04:00[America/New_York]'

startOfWeek(zdt).toString()
// '2024-07-15T00:00:00-04:00[America/New_York]'
```

### `startOfYear`

Signature:

```ts
function startOfYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the start of the current year. For `Temporal.PlainYearMonth`, this is
the first month of the same year.

### `startOfMonth`

Signature:

```ts
function startOfMonth<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the start of the current month.

### `startOfWeek`

Signature:

```ts
function startOfWeek<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the start of the current ISO week, which is Monday.

### `startOfDay`

Signature:

```ts
function startOfDay<T extends Temporal.PlainDateTime | Temporal.ZonedDateTime>(
  dateTime: T,
): T
```

Returns the start of the current day (`00:00`, or the first valid instant of the
day if midnight is skipped by a time-zone transition).

### `startOfHour`

Signature:

```ts
function startOfHour<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(dateTime: T): T
```

Returns the start of the current hour.

### `startOfMinute`

Signature:

```ts
function startOfMinute<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(dateTime: T): T
```

Returns the start of the current minute.

### `startOfSecond`

Signature:

```ts
function startOfSecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(dateTime: T): T
```

Returns the start of the current second.

### `startOfMillisecond`

Signature:

```ts
function startOfMillisecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(dateTime: T): T
```

Returns the start of the current millisecond.

### `startOfMicrosecond`

Signature:

```ts
function startOfMicrosecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(dateTime: T): T
```

Returns the start of the current microsecond.

## End Of Unit

End helpers return the last representable value before the next unit begins.
For date-time and zoned date-time values, this means one nanosecond before the
exclusive end. For date-only values, it means one day before the exclusive end.
For `Temporal.PlainYearMonth`, `endOfYear` returns the last month of the same year.

```ts
import { endOfDay, endOfMonth } from 'temporal-utils'

const dateTime = Temporal.PlainDateTime.from('2024-07-20T12:30:00')

endOfDay(dateTime).toString()
// '2024-07-20T23:59:59.999999999'

endOfMonth(dateTime).toString()
// '2024-07-31T23:59:59.999999999'
```

### `endOfYear`

Signature:

```ts
function endOfYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current year.

### `endOfMonth`

Signature:

```ts
function endOfMonth<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current month.

### `endOfWeek`

Signature:

```ts
function endOfWeek<
  T extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current ISO week.

### `endOfDay`

Signature:

```ts
function endOfDay<T extends Temporal.PlainDateTime | Temporal.ZonedDateTime>(
  date: T,
): T
```

Returns the last representable value in the current day.

### `endOfHour`

Signature:

```ts
function endOfHour<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current hour.

### `endOfMinute`

Signature:

```ts
function endOfMinute<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current minute.

### `endOfSecond`

Signature:

```ts
function endOfSecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current second.

### `endOfMillisecond`

Signature:

```ts
function endOfMillisecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current millisecond.

### `endOfMicrosecond`

Signature:

```ts
function endOfMicrosecond<
  T extends Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T
```

Returns the last representable value in the current microsecond.

## Shared Types

### `RoundingMode`

Type:

```ts
import type { RoundingMode } from 'temporal-utils'
```

`RoundingMode` is shared by the rounding and difference helpers.

### `RoundingMathOptions`

Type:

```ts
import type { RoundingMathOptions } from 'temporal-utils'
```

`RoundingMathOptions` contains the rounding fields used by single-unit math
helpers.

The unit is implied by the helper name. For example, `roundToWeek(date,
options)` forces `smallestUnit: 'week'` internally, and `diffMonths(date0,
date1, options)` forces month-based difference math internally.
