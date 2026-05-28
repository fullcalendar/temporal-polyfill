# PlainDate Functional API

Public functions exported for `PlainDate`.

Examples assume the functional API is imported as:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/plaindate'
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
- [Conversion](#conversion)
  - [`toZonedDateTime`](#tozoneddatetime)
  - [`toPlainDateTime`](#toplaindatetime)
  - [`toPlainYearMonth`](#toplainyearmonth)
  - [`toPlainMonthDay`](#toplainmonthday)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toSimpleString`](#tosimplestring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)

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
records need a separate calendar transform: when a functional API call receives
a `CalendarRecord`, the real Temporal API normally wants the calendar identifier
or calendar-like value instead.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (PlainDateFns.isRecord(value)) {
  value.day
}
```

Temporal API:

```ts
if (value instanceof Temporal.PlainDate) {
  value.day
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoYear: number, isoMonth: number, isoDay: number, calendar?: CalendarRecord) => Record
```

Fn API:

```ts
const date = PlainDateFns.create(2024, 5, 1)
```

Temporal API:

```ts
const date = new Temporal.PlainDate(2024, 5, 1)
```

If the optional calendar argument is present, replace a known `CalendarRecord`
expression with its calendar identifier.

### `fromFields`

Signature:

```ts
(fields: Partial<DateFields> & { calendar: CalendarRecord }, options?: OverflowOptions) => Record
```

Fn API:

```ts
const date = PlainDateFns.fromFields(fields, options)
```

Temporal API:

```ts
const date = Temporal.PlainDate.from(fields, options)
```

If `fields.calendar` is still a `CalendarRecord`, replace it with the calendar
identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record
```

Fn API:

```ts
const date = PlainDateFns.fromString(value, getCalendar)
```

Temporal API:

```ts
const date = Temporal.PlainDate.from(value)
```

The resolver argument has no direct counterpart and can usually be dropped once
its import or local binding is unused.

## Calendar Properties

### `dayOfWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfWeek = PlainDateFns.dayOfWeek(date)
```

Temporal API:

```ts
const dayOfWeek = date.dayOfWeek
```

### `daysInWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInWeek = PlainDateFns.daysInWeek(date)
```

Temporal API:

```ts
const daysInWeek = date.daysInWeek
```

### `weekOfYear`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const weekOfYear = PlainDateFns.weekOfYear(date)
```

Temporal API:

```ts
const weekOfYear = date.weekOfYear
```

### `yearOfWeek`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const yearOfWeek = PlainDateFns.yearOfWeek(date)
```

Temporal API:

```ts
const yearOfWeek = date.yearOfWeek
```

### `dayOfYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfYear = PlainDateFns.dayOfYear(date)
```

Temporal API:

```ts
const dayOfYear = date.dayOfYear
```

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInMonth = PlainDateFns.daysInMonth(date)
```

Temporal API:

```ts
const daysInMonth = date.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInYear = PlainDateFns.daysInYear(date)
```

Temporal API:

```ts
const daysInYear = date.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const monthsInYear = PlainDateFns.monthsInYear(date)
```

Temporal API:

```ts
const monthsInYear = date.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Fn API:

```ts
const inLeapYear = PlainDateFns.inLeapYear(date)
```

Temporal API:

```ts
const inLeapYear = date.inLeapYear
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<DateFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withFields(date, fields, options)
```

Temporal API:

```ts
const nextDate = date.with(fields, options)
```

### `withCalendar`

Signature:

```ts
(record: Record, calendarRecord: CalendarRecord) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withCalendar(date, calendarRecord)
```

Temporal API:

```ts
const nextDate = date.withCalendar(calendar)
```

Replace a known `CalendarRecord` expression with its calendar identifier.

### `withDayOfYear`

Signature:

```ts
(record: Record, dayOfYear: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withDayOfYear(date, dayOfYear, options)
```

Temporal API:

```ts
import { withDayOfYear } from 'temporal-utils'

const nextDate = withDayOfYear(date, dayOfYear, options)
```

### `withDayOfMonth`

Signature:

```ts
(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withDayOfMonth(date, day, options)
```

Temporal API:

```ts
const nextDate = date.with({ day }, options)
```

### `withDayOfWeek`

Signature:

```ts
(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withDayOfWeek(date, dayOfWeek, options)
```

Temporal API:

```ts
import { withDayOfWeek } from 'temporal-utils'

const nextDate = withDayOfWeek(date, dayOfWeek, options)
```

### `withWeekOfYear`

Signature:

```ts
(record: Record, weekOfYear: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.withWeekOfYear(date, weekOfYear, options)
```

Temporal API:

```ts
import { withWeekOfYear } from 'temporal-utils'

const nextDate = withWeekOfYear(date, weekOfYear, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.add(date, duration, options)
```

Temporal API:

```ts
const nextDate = date.add(duration, options)
```

Duration records need the same record-to-Temporal transform as date records.

### `addYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.addYears(date, years, options)
```

Temporal API:

```ts
const nextDate = date.add({ years }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.addMonths(date, months, options)
```

Temporal API:

```ts
const nextDate = date.add({ months }, options)
```

### `addWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.addWeeks(date, weeks)
```

Temporal API:

```ts
const nextDate = date.add({ weeks })
```

### `addDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.addDays(date, days)
```

Temporal API:

```ts
const nextDate = date.add({ days })
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.subtract(date, duration, options)
```

Temporal API:

```ts
const nextDate = date.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as date records.

### `subtractYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.subtractYears(date, years, options)
```

Temporal API:

```ts
const nextDate = date.subtract({ years }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.subtractMonths(date, months, options)
```

Temporal API:

```ts
const nextDate = date.subtract({ months }, options)
```

### `subtractWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.subtractWeeks(date, weeks)
```

Temporal API:

```ts
const nextDate = date.subtract({ weeks })
```

### `subtractDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.subtractDays(date, days)
```

Temporal API:

```ts
const nextDate = date.subtract({ days })
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<DateUnitName>) => DurationRecord
```

Fn API:

```ts
const duration = PlainDateFns.diff(date, otherDate, options)
```

Temporal API:

```ts
const duration = date.until(otherDate, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const years = PlainDateFns.diffYears(date, otherDate, options)
```

Temporal API:

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(date, otherDate, options)
```

This preserves the helper's exact fractional result when no rounding mode is
provided. With rounding options, the result is rounded to whole years.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const months = PlainDateFns.diffMonths(date, otherDate, options)
```

Temporal API:

```ts
import { diffMonths } from 'temporal-utils'

const months = diffMonths(date, otherDate, options)
```

This preserves the helper's exact fractional result when no rounding mode is
provided. With rounding options, the result is rounded to whole months.

### `diffWeeks`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const weeks = PlainDateFns.diffWeeks(date, otherDate, options)
```

Temporal API:

```ts
import { diffWeeks } from 'temporal-utils'

const weeks = diffWeeks(date, otherDate, options)
```

This preserves the helper's exact fractional result when no rounding mode is
provided. With rounding options, the result is rounded to whole weeks.

### `diffDays`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const days = PlainDateFns.diffDays(date, otherDate, options)
```

Temporal API:

```ts
import { diffDays } from 'temporal-utils'

const days = diffDays(date, otherDate, options)
```

This keeps the helper behavior aligned with the other unit difference helpers;
with rounding options, the result is rounded to whole days.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = PlainDateFns.equals(date, otherDate)
```

Temporal API:

```ts
const same = date.equals(otherDate)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => NumberSign
```

Fn API:

```ts
const order = PlainDateFns.compare(date, otherDate)
```

Temporal API:

```ts
const order = Temporal.PlainDate.compare(date, otherDate)
```

## Rounding

### `roundToYear`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.roundToYear(date, options)
```

Temporal API:

```ts
import { roundToYear } from 'temporal-utils'

const nextDate = roundToYear(date, options)
```

### `roundToMonth`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.roundToMonth(date, options)
```

Temporal API:

```ts
import { roundToMonth } from 'temporal-utils'

const nextDate = roundToMonth(date, options)
```

### `roundToWeek`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.roundToWeek(date, options)
```

Temporal API:

```ts
import { roundToWeek } from 'temporal-utils'

const nextDate = roundToWeek(date, options)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.startOfYear(date)
```

Temporal API:

```ts
import { startOfYear } from 'temporal-utils'

const nextDate = startOfYear(date)
```

### `startOfMonth`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.startOfMonth(date)
```

Temporal API:

```ts
import { startOfMonth } from 'temporal-utils'

const nextDate = startOfMonth(date)
```

### `startOfWeek`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDate = PlainDateFns.startOfWeek(date)
```

Temporal API:

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

Fn API:

```ts
const nextDate = PlainDateFns.endOfYear(date)
```

Temporal API:

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

Fn API:

```ts
const nextDate = PlainDateFns.endOfMonth(date)
```

Temporal API:

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

Fn API:

```ts
const nextDate = PlainDateFns.endOfWeek(date)
```

Temporal API:

```ts
import { endOfWeek } from 'temporal-utils'

const nextDate = endOfWeek(date)
```

## Conversion

### `toZonedDateTime`

Signature:

```ts
(record: Record, options: string | ToZonedDateTimeOptions<PlainTimeRecord>) => ZonedDateTimeRecord
```

Fn API:

```ts
const zonedDateTime = PlainDateFns.toZonedDateTime(date, options)
```

Temporal API:

```ts
const zonedDateTime = date.toZonedDateTime(options)
```

If `options` is a string time zone, keep it as the single argument.

### `toPlainDateTime`

Signature:

```ts
(record: Record, plainTimeRecord?: PlainTimeRecord) => PlainDateTimeRecord
```

Fn API:

```ts
const dateTime = PlainDateFns.toPlainDateTime(date, time)
```

Temporal API:

```ts
const dateTime = date.toPlainDateTime(time)
```

Any `PlainTimeRecord` argument needs its own record-to-Temporal transform.

### `toPlainYearMonth`

Signature:

```ts
(record: Record) => PlainYearMonthRecord
```

Fn API:

```ts
const yearMonth = PlainDateFns.toPlainYearMonth(date)
```

Temporal API:

```ts
const yearMonth = date.toPlainYearMonth()
```

### `toPlainMonthDay`

Signature:

```ts
(record: Record) => PlainMonthDayRecord
```

Fn API:

```ts
const monthDay = PlainDateFns.toPlainMonthDay(date)
```

Temporal API:

```ts
const monthDay = date.toPlainMonthDay()
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: CalendarDisplayOptions) => string
```

Fn API:

```ts
const text = PlainDateFns.toString(date, options)
```

Temporal API:

```ts
const text = date.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = PlainDateFns.toSimpleString(date)
```

Temporal API:

```ts
const text = date.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = PlainDateFns.toLocaleString(date, locales, options)
```

Temporal API:

```ts
const text = date.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = PlainDateFns.createFormat('en-US', { dateStyle: 'long' })
const text = format.format(date)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' })
const text = format.format(date)
```

This rewrite is appropriate when later uses rely on `format.format(date)`.
