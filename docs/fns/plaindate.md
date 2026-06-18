# PlainDate Tree-shakeable API

Public functions exported for `PlainDate`.

Examples assume the tree-shakeable API is imported as:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromFields`](#fromfields)
  - [`fromString`](#fromstring)
- [Calendar Properties](#calendar-properties)
  - [`dayOfWeek`](#dayofweek)
  - [`daysInWeek`](#daysinweek)
  - [`weekOfYear`](#weekofyear)
  - [`yearOfWeek`](#yearofweek)
  - [`dayOfYear`](#dayofyear)
  - [`daysInMonth`](#daysinmonth)
  - [`daysInYear`](#daysinyear)
  - [`monthsInYear`](#monthsinyear)
  - [`inLeapYear`](#inleapyear)
- [Field Replacement](#field-replacement)
  - [`withFields`](#withfields)
  - [`withCalendar`](#withcalendar)
  - [`withDayOfYear`](#withdayofyear)
  - [`withDayOfMonth`](#withdayofmonth)
  - [`withDayOfWeek`](#withdayofweek)
  - [`withWeekOfYear`](#withweekofyear)
- [Arithmetic](#arithmetic)
  - [`add`](#add)
  - [`addYears`](#addyears)
  - [`addMonths`](#addmonths)
  - [`addWeeks`](#addweeks)
  - [`addDays`](#adddays)
  - [`subtract`](#subtract)
  - [`subtractYears`](#subtractyears)
  - [`subtractMonths`](#subtractmonths)
  - [`subtractWeeks`](#subtractweeks)
  - [`subtractDays`](#subtractdays)
- [Difference And Comparison](#difference-and-comparison)
  - [`diff`](#diff)
  - [`diffYears`](#diffyears)
  - [`diffMonths`](#diffmonths)
  - [`diffWeeks`](#diffweeks)
  - [`diffDays`](#diffdays)
  - [`equals`](#equals)
  - [`compare`](#compare)
- [Rounding](#rounding)
  - [`roundToYear`](#roundtoyear)
  - [`roundToMonth`](#roundtomonth)
  - [`roundToWeek`](#roundtoweek)
- [Start And End Of Unit](#start-and-end-of-unit)
  - [`startOfYear`](#startofyear)
  - [`startOfMonth`](#startofmonth)
  - [`startOfWeek`](#startofweek)
  - [`endOfYear`](#endofyear)
  - [`endOfMonth`](#endofmonth)
  - [`endOfWeek`](#endofweek)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toBasicString`](#tobasicstring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)
- [Conversion](#conversion)
  - [`toZonedDateTime`](#tozoneddatetime)
  - [`toPlainDateTime`](#toplaindatetime)
  - [`toPlainYearMonth`](#toplainyearmonth)
  - [`toPlainMonthDay`](#toplainmonthday)
  - [`toTemporal`](#totemporal)

## Record Shape

```ts
type Record = {
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  toJSON(): string
  valueOf(): never
}
```

The codemod examples assume the surrounding transform has already converted
`PlainDateFns.Record` values into `Temporal.PlainDate` instances. Calendar
records need a separate calendar transform: when a tree-shakeable API call receives
a `CalendarFns.Record`, the real Temporal API normally wants the calendar identifier
or calendar-like value instead.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Tree-shakeable API:

```ts
if (PlainDateFns.isRecord(value)) {
  value.day
}
```

Temporal API equivalent:

```ts
if (value instanceof Temporal.PlainDate) {
  value.day
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoYear: number, isoMonth: number, isoDay: number, calendar?: CalendarFns.Record) => Record
```

Tree-shakeable API:

```ts
const date = PlainDateFns.create(2026, 6, 1)
```

Temporal API equivalent:

```ts
const date = new Temporal.PlainDate(2026, 6, 1)
```

If the optional calendar argument is present, replace a known `CalendarFns.Record`
expression with its calendar identifier.

### `fromFields`

Signature:

```ts
(fields: PlainDateFns.FromFields, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const date = PlainDateFns.fromFields(fields, options)
```

Temporal API equivalent:

```ts
const date = Temporal.PlainDate.from(fields, options)
```

If `fields.calendar` is still a `CalendarFns.Record`, replace it with the calendar
identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarFns.Record) => Record
```

Tree-shakeable API:

```ts
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'

const date = PlainDateFns.fromString(
  '2026-06-01[u-ca=gregory]',
  CalendarFns.getBasic,
)
```

Temporal API equivalent:

```ts
const date = Temporal.PlainDate.from('2026-06-01[u-ca=gregory]')
```

Pass `getCalendar` to resolve the string's `[u-ca=…]` annotation into a
`CalendarFns.Record`. Most callers supply
[`getBasic`](calendar.md#getbasic) (ISO and Gregorian only) or
[`getAny`](calendar.md#getany) (also exotic calendars); see the
[Calendar docs](calendar.md) for the full set of resolvers.

The resolver argument has no direct counterpart and can usually be dropped once
its import or local binding is unused.

## Calendar Properties

### `dayOfWeek`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const dayOfWeek = PlainDateFns.dayOfWeek(date)
```

Temporal API equivalent:

```ts
const dayOfWeek = date.dayOfWeek
```

### `daysInWeek`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const daysInWeek = PlainDateFns.daysInWeek(date)
```

Temporal API equivalent:

```ts
const daysInWeek = date.daysInWeek
```

### `weekOfYear`

Signature:

```ts
(record: Record) => number | undefined
```

Tree-shakeable API:

```ts
const weekOfYear = PlainDateFns.weekOfYear(date)
```

Temporal API equivalent:

```ts
const weekOfYear = date.weekOfYear
```

### `yearOfWeek`

Signature:

```ts
(record: Record) => number | undefined
```

Tree-shakeable API:

```ts
const yearOfWeek = PlainDateFns.yearOfWeek(date)
```

Temporal API equivalent:

```ts
const yearOfWeek = date.yearOfWeek
```

### `dayOfYear`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const dayOfYear = PlainDateFns.dayOfYear(date)
```

Temporal API equivalent:

```ts
const dayOfYear = date.dayOfYear
```

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const daysInMonth = PlainDateFns.daysInMonth(date)
```

Temporal API equivalent:

```ts
const daysInMonth = date.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const daysInYear = PlainDateFns.daysInYear(date)
```

Temporal API equivalent:

```ts
const daysInYear = date.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const monthsInYear = PlainDateFns.monthsInYear(date)
```

Temporal API equivalent:

```ts
const monthsInYear = date.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Tree-shakeable API:

```ts
const inLeapYear = PlainDateFns.inLeapYear(date)
```

Temporal API equivalent:

```ts
const inLeapYear = date.inLeapYear
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: PlainDateFns.WithFields, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withFields(date, fields, options)
```

Temporal API equivalent:

```ts
const nextDate = date.with(fields, options)
```

### `withCalendar`

Signature:

```ts
(record: Record, calendarRecord: CalendarFns.Record) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withCalendar(date, calendarRecord)
```

Temporal API equivalent:

```ts
const nextDate = date.withCalendar(calendar)
```

Replace a known `CalendarFns.Record` expression with its calendar identifier.

### `withDayOfYear`

Signature:

```ts
(record: Record, dayOfYear: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withDayOfYear(date, dayOfYear, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { withDayOfYear } from 'temporal-utils'

const nextDate = withDayOfYear(date, dayOfYear, options)
```

### `withDayOfMonth`

Signature:

```ts
(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withDayOfMonth(date, day, options)
```

Temporal API equivalent:

```ts
const nextDate = date.with({ day }, options)
```

### `withDayOfWeek`

Signature:

```ts
(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withDayOfWeek(date, dayOfWeek, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { withDayOfWeek } from 'temporal-utils'

const nextDate = withDayOfWeek(date, dayOfWeek, options)
```

### `withWeekOfYear`

Signature:

```ts
(record: Record, weekOfYear: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.withWeekOfYear(date, weekOfYear, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { withWeekOfYear } from 'temporal-utils'

const nextDate = withWeekOfYear(date, weekOfYear, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationFns.Record, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.add(date, duration, options)
```

Temporal API equivalent:

```ts
const nextDate = date.add(duration, options)
```

Duration records need the same record-to-Temporal transform as date records.

### `addYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.addYears(date, years, options)
```

Temporal API equivalent:

```ts
const nextDate = date.add({ years }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.addMonths(date, months, options)
```

Temporal API equivalent:

```ts
const nextDate = date.add({ months }, options)
```

### `addWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.addWeeks(date, weeks)
```

Temporal API equivalent:

```ts
const nextDate = date.add({ weeks })
```

### `addDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.addDays(date, days)
```

Temporal API equivalent:

```ts
const nextDate = date.add({ days })
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationFns.Record, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.subtract(date, duration, options)
```

Temporal API equivalent:

```ts
const nextDate = date.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as date records.

### `subtractYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.subtractYears(date, years, options)
```

Temporal API equivalent:

```ts
const nextDate = date.subtract({ years }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.subtractMonths(date, months, options)
```

Temporal API equivalent:

```ts
const nextDate = date.subtract({ months }, options)
```

### `subtractWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.subtractWeeks(date, weeks)
```

Temporal API equivalent:

```ts
const nextDate = date.subtract({ weeks })
```

### `subtractDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.subtractDays(date, days)
```

Temporal API equivalent:

```ts
const nextDate = date.subtract({ days })
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<DateUnitName>) => DurationFns.Record
```

Tree-shakeable API:

```ts
const duration = PlainDateFns.diff(date, otherDate, options)
```

Temporal API equivalent:

```ts
const duration = date.until(otherDate, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const years = PlainDateFns.diffYears(date, otherDate, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(date, otherDate, options)
```

If `options` is omitted, no rounding occurs.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const months = PlainDateFns.diffMonths(date, otherDate, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { diffMonths } from 'temporal-utils'

const months = diffMonths(date, otherDate, options)
```

If `options` is omitted, no rounding occurs.

### `diffWeeks`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const weeks = PlainDateFns.diffWeeks(date, otherDate, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { diffWeeks } from 'temporal-utils'

const weeks = diffWeeks(date, otherDate, options)
```

If `options` is omitted, no rounding occurs.

### `diffDays`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const days = PlainDateFns.diffDays(date, otherDate, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { diffDays } from 'temporal-utils'

const days = diffDays(date, otherDate, options)
```

If `options` is omitted, no rounding occurs.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Tree-shakeable API:

```ts
const same = PlainDateFns.equals(date, otherDate)
```

Temporal API equivalent:

```ts
const same = date.equals(otherDate)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => number
```

Tree-shakeable API:

```ts
const order = PlainDateFns.compare(date, otherDate)
```

Temporal API equivalent:

```ts
const order = Temporal.PlainDate.compare(date, otherDate)
```

## Rounding

If `options` or `options.roundingMode` is omitted, the rounding mode defaults to `'halfExpand'`.
`RoundingMathOptions` must not include `smallestUnit`. Pass a `RoundingMode`
string as shorthand for `options.roundingMode`.

### `roundToYear`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.roundToYear(date)
const nextDate = PlainDateFns.roundToYear(date, 'ceil')
const nextDate = PlainDateFns.roundToYear(date, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { roundToYear } from 'temporal-utils'

const nextDate = roundToYear(date)
const nextDate = roundToYear(date, 'ceil')
const nextDate = roundToYear(date, options)
```

### `roundToMonth`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.roundToMonth(date)
const nextDate = PlainDateFns.roundToMonth(date, 'ceil')
const nextDate = PlainDateFns.roundToMonth(date, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { roundToMonth } from 'temporal-utils'

const nextDate = roundToMonth(date)
const nextDate = roundToMonth(date, 'ceil')
const nextDate = roundToMonth(date, options)
```

### `roundToWeek`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.roundToWeek(date)
const nextDate = PlainDateFns.roundToWeek(date, 'ceil')
const nextDate = PlainDateFns.roundToWeek(date, options)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { roundToWeek } from 'temporal-utils'

const nextDate = roundToWeek(date)
const nextDate = roundToWeek(date, 'ceil')
const nextDate = roundToWeek(date, options)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.startOfYear(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { startOfYear } from 'temporal-utils'

const nextDate = startOfYear(date)
```

### `startOfMonth`

Signature:

```ts
(record: Record) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.startOfMonth(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { startOfMonth } from 'temporal-utils'

const nextDate = startOfMonth(date)
```

### `startOfWeek`

Signature:

```ts
(record: Record) => Record
```

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.startOfWeek(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { startOfWeek } from 'temporal-utils'

const nextDate = startOfWeek(date)
```

### `endOfYear`

Signature:

```ts
(record: Record) => Record
```

This returns the last date before the exclusive end of the unit.

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.endOfYear(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { endOfYear } from 'temporal-utils'

const nextDate = endOfYear(date)
```

### `endOfMonth`

Signature:

```ts
(record: Record) => Record
```

This returns the last date before the exclusive end of the unit.

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.endOfMonth(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { endOfMonth } from 'temporal-utils'

const nextDate = endOfMonth(date)
```

### `endOfWeek`

Signature:

```ts
(record: Record) => Record
```

This returns the last date before the exclusive end of the unit.

Tree-shakeable API:

```ts
const nextDate = PlainDateFns.endOfWeek(date)
```

Temporal API equivalent (with help of [temporal-utils](../../utils/README.md)):

```ts
import { endOfWeek } from 'temporal-utils'

const nextDate = endOfWeek(date)
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: CalendarDisplayOptions) => string
```

Tree-shakeable API:

```ts
const text = PlainDateFns.toString(date, options)
```

Temporal API equivalent:

```ts
const text = date.toString(options)
```

If you aren't passing any display options, use [`toBasicString`](#tobasicstring) instead — it yields the same string and tree-shakes to a smaller bundle.

### `toBasicString`

Signature:

```ts
(record: Record) => string
```

Tree-shakeable API:

```ts
const text = PlainDateFns.toBasicString(date)
```

Temporal API equivalent:

```ts
const text = date.toString()
```

Prefer `toBasicString` over [`toString`](#tostring) when you don't need display options. It returns the same string as `toString` called with no options, but pulls in none of the option-handling code, so it tree-shakes to a smaller bundle.

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Tree-shakeable API:

```ts
const text = PlainDateFns.toLocaleString(date, locales, options)
```

Temporal API equivalent:

```ts
const text = date.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Tree-shakeable API:

```ts
const format = PlainDateFns.createFormat('en-US', { dateStyle: 'long' })
const text = format.format(date)
```

Temporal API equivalent:

```ts
const format = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' })
const text = format.format(date)
```

This rewrite is appropriate when later uses rely on `format.format(date)`.

## Conversion

### `toZonedDateTime`

Signature:

```ts
(record: Record, timeZoneId: string) => ZonedDateTimeFns.Record
(record: Record, options: ToZonedDateTimeOptions) => ZonedDateTimeFns.Record
```

Tree-shakeable API:

```ts
const zonedDateTime = PlainDateFns.toZonedDateTime(date, options)
```

Temporal API equivalent:

```ts
const zonedDateTime = date.toZonedDateTime(options)
```

If `options` is a string time zone, keep it as the single argument.

### `toPlainDateTime`

Signature:

```ts
(record: Record, plainTimeRecord?: PlainTimeFns.Record) => PlainDateTimeFns.Record
```

Tree-shakeable API:

```ts
const dateTime = PlainDateFns.toPlainDateTime(date, time)
```

Temporal API equivalent:

```ts
const dateTime = date.toPlainDateTime(time)
```

Any `PlainTimeFns.Record` argument needs its own record-to-Temporal transform.

### `toPlainYearMonth`

Signature:

```ts
(record: Record) => PlainYearMonthFns.Record
```

Tree-shakeable API:

```ts
const yearMonth = PlainDateFns.toPlainYearMonth(date)
```

Temporal API equivalent:

```ts
const yearMonth = date.toPlainYearMonth()
```

### `toPlainMonthDay`

Signature:

```ts
(record: Record) => PlainMonthDayFns.Record
```

Tree-shakeable API:

```ts
const monthDay = PlainDateFns.toPlainMonthDay(date)
```

Temporal API equivalent:

```ts
const monthDay = date.toPlainMonthDay()
```

### `toTemporal`

Signature:

```ts
(record: Record) => Temporal.PlainDate
```

Tree-shakeable API:

```ts
const realPlainDate = PlainDateFns.toTemporal(date)
```

Produces a real `Temporal.PlainDate` built directly from the record's ISO date
slots and `calendarId`, with no string round-trip. The constructor comes from
the global `Temporal` at call time, so it uses whatever implementation is
installed — a host-native `Temporal` or any polyfill (see [Temporal Interop](index.md#temporal-interop)) — and `toTemporal` throws when no global
`Temporal` is present.
