# ZonedDateTime Functional API

Public functions exported for `ZonedDateTime`.

Examples assume the functional API is imported as:

```ts
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/zoneddatetime'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromFields`](#fromfields)
  - [`fromString`](#fromstring)
- [Calendar And Offset Properties](#calendar-and-offset-properties)
  - [`offsetNanoseconds`](#offsetnanoseconds)
  - [`offset`](#offset)
  - [`dayOfWeek`](#dayofweek)
  - [`daysInWeek`](#daysinweek)
  - [`weekOfYear`](#weekofyear)
  - [`yearOfWeek`](#yearofweek)
  - [`dayOfYear`](#dayofyear)
  - [`daysInMonth`](#daysinmonth)
  - [`daysInYear`](#daysinyear)
  - [`monthsInYear`](#monthsinyear)
  - [`inLeapYear`](#inleapyear)
  - [`hoursInDay`](#hoursinday)
- [Field Replacement](#field-replacement)
  - [`withFields`](#withfields)
  - [`withCalendar`](#withcalendar)
  - [`withTimeZone`](#withtimezone)
  - [`withPlainTime`](#withplaintime)
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
  - [`addHours`](#addhours)
  - [`addMinutes`](#addminutes)
  - [`addSeconds`](#addseconds)
  - [`addMilliseconds`](#addmilliseconds)
  - [`addMicroseconds`](#addmicroseconds)
  - [`addNanoseconds`](#addnanoseconds)
  - [`subtract`](#subtract)
  - [`subtractYears`](#subtractyears)
  - [`subtractMonths`](#subtractmonths)
  - [`subtractWeeks`](#subtractweeks)
  - [`subtractDays`](#subtractdays)
  - [`subtractHours`](#subtracthours)
  - [`subtractMinutes`](#subtractminutes)
  - [`subtractSeconds`](#subtractseconds)
  - [`subtractMilliseconds`](#subtractmilliseconds)
  - [`subtractMicroseconds`](#subtractmicroseconds)
  - [`subtractNanoseconds`](#subtractnanoseconds)
- [Difference And Comparison](#difference-and-comparison)
  - [`diff`](#diff)
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
  - [`equals`](#equals)
  - [`compare`](#compare)
- [Rounding](#rounding)
  - [`roundToYear`](#roundtoyear)
  - [`roundToMonth`](#roundtomonth)
  - [`roundToWeek`](#roundtoweek)
  - [`roundToDay`](#roundtoday)
  - [`roundToHour`](#roundtohour)
  - [`roundToMinute`](#roundtominute)
  - [`roundToSecond`](#roundtosecond)
  - [`roundToMillisecond`](#roundtomillisecond)
  - [`roundToMicrosecond`](#roundtomicrosecond)
- [Start And End Of Unit](#start-and-end-of-unit)
  - [`startOfYear`](#startofyear)
  - [`startOfMonth`](#startofmonth)
  - [`startOfWeek`](#startofweek)
  - [`startOfDay`](#startofday)
  - [`startOfHour`](#startofhour)
  - [`startOfMinute`](#startofminute)
  - [`startOfSecond`](#startofsecond)
  - [`startOfMillisecond`](#startofmillisecond)
  - [`startOfMicrosecond`](#startofmicrosecond)
  - [`endOfYear`](#endofyear)
  - [`endOfMonth`](#endofmonth)
  - [`endOfWeek`](#endofweek)
  - [`endOfDay`](#endofday)
  - [`endOfHour`](#endofhour)
  - [`endOfMinute`](#endofminute)
  - [`endOfSecond`](#endofsecond)
  - [`endOfMillisecond`](#endofmillisecond)
  - [`endOfMicrosecond`](#endofmicrosecond)
- [Time Zone Transition](#time-zone-transition)
  - [`getTimeZoneTransition`](#gettimezonetransition)
- [Conversion](#conversion)
  - [`toInstant`](#toinstant)
  - [`toPlainDateTime`](#toplaindatetime)
  - [`toPlainDate`](#toplaindate)
  - [`toPlainTime`](#toplaintime)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toSimpleString`](#tosimplestring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)

## Record Shape

```ts
type Record = {
  readonly calendarId: string
  readonly epochMilliseconds: number
  readonly epochNanoseconds: bigint
  readonly timeZoneId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  toJSON(): string
  valueOf(): never
}
```

The codemod examples assume the surrounding transform has already converted
`ZonedDateTimeFns.Record` values into `Temporal.ZonedDateTime` instances.
Calendar records need a separate calendar transform: when a functional API call
receives a `CalendarRecord`, the real Temporal API normally wants the calendar
identifier or calendar-like value instead.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (ZonedDateTimeFns.isRecord(value)) {
  value.timeZoneId
}
```

Temporal API:

```ts
if (value instanceof Temporal.ZonedDateTime) {
  value.timeZoneId
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(epochNanoseconds: bigint, timeZoneId: string, calendar?: CalendarRecord) => Record
```

Fn API:

```ts
const zonedDateTime = ZonedDateTimeFns.create(epochNanoseconds, timeZoneId, calendar)
```

Temporal API:

```ts
const zonedDateTime = new Temporal.ZonedDateTime(epochNanoseconds, timeZoneId, calendar)
```

If the optional calendar argument is present, replace a known `CalendarRecord` expression with its calendar identifier.

### `fromFields`

Signature:

```ts
(fields: ZonedFields, options?: ZonedFieldOptions) => Record
```

Fn API:

```ts
const zonedDateTime = ZonedDateTimeFns.fromFields(fields, options)
```

Temporal API:

```ts
const zonedDateTime = Temporal.ZonedDateTime.from(fields, options)
```

If `fields.calendar` is still a `CalendarRecord`, replace it with the calendar identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarRecord, options?: ZonedFieldOptions) => Record
```

Fn API:

```ts
const zonedDateTime = ZonedDateTimeFns.fromString(value, getCalendar, options)
```

Temporal API:

```ts
const zonedDateTime = Temporal.ZonedDateTime.from(value, options)
```

The resolver argument has no direct counterpart and can usually be dropped once its import or local binding is unused.

## Calendar And Offset Properties

### `offsetNanoseconds`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const offsetNanoseconds = ZonedDateTimeFns.offsetNanoseconds(zonedDateTime)
```

Temporal API:

```ts
const offsetNanoseconds = zonedDateTime.offsetNanoseconds
```

### `offset`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const offset = ZonedDateTimeFns.offset(zonedDateTime)
```

Temporal API:

```ts
const offset = zonedDateTime.offset
```

### `dayOfWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfWeek = ZonedDateTimeFns.dayOfWeek(zonedDateTime)
```

Temporal API:

```ts
const dayOfWeek = zonedDateTime.dayOfWeek
```

### `daysInWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInWeek = ZonedDateTimeFns.daysInWeek(zonedDateTime)
```

Temporal API:

```ts
const daysInWeek = zonedDateTime.daysInWeek
```

### `weekOfYear`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const weekOfYear = ZonedDateTimeFns.weekOfYear(zonedDateTime)
```

Temporal API:

```ts
const weekOfYear = zonedDateTime.weekOfYear
```

### `yearOfWeek`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const yearOfWeek = ZonedDateTimeFns.yearOfWeek(zonedDateTime)
```

Temporal API:

```ts
const yearOfWeek = zonedDateTime.yearOfWeek
```

### `dayOfYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfYear = ZonedDateTimeFns.dayOfYear(zonedDateTime)
```

Temporal API:

```ts
const dayOfYear = zonedDateTime.dayOfYear
```

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInMonth = ZonedDateTimeFns.daysInMonth(zonedDateTime)
```

Temporal API:

```ts
const daysInMonth = zonedDateTime.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInYear = ZonedDateTimeFns.daysInYear(zonedDateTime)
```

Temporal API:

```ts
const daysInYear = zonedDateTime.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const monthsInYear = ZonedDateTimeFns.monthsInYear(zonedDateTime)
```

Temporal API:

```ts
const monthsInYear = zonedDateTime.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Fn API:

```ts
const inLeapYear = ZonedDateTimeFns.inLeapYear(zonedDateTime)
```

Temporal API:

```ts
const inLeapYear = zonedDateTime.inLeapYear
```

### `hoursInDay`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const hoursInDay = ZonedDateTimeFns.hoursInDay(zonedDateTime)
```

Temporal API:

```ts
const hoursInDay = zonedDateTime.hoursInDay
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<DateTimeFields>, options?: ZonedFieldOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withFields(zonedDateTime, fields, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.with(fields, options)
```

### `withCalendar`

Signature:

```ts
(record: Record, calendarRecord: CalendarRecord) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withCalendar(zonedDateTime, calendarRecord)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.withCalendar(calendar)
```

Replace a known `CalendarRecord` expression with its calendar identifier.

### `withTimeZone`

Signature:

```ts
(record: Record, timeZoneId: string) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withTimeZone(zonedDateTime, timeZoneId)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.withTimeZone(timeZoneId)
```

### `withPlainTime`

Signature:

```ts
(record: Record, plainTimeRecord?: PlainTimeRecord) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withPlainTime(zonedDateTime, time)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.withPlainTime(time)
```

Any `PlainTimeRecord` argument needs its own record-to-Temporal transform.

### `withDayOfYear`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withDayOfYear(zonedDateTime, dayOfYear, options)
```

Temporal API:

```ts
import { withDayOfYear } from 'temporal-utils'

const nextZonedDateTime = withDayOfYear(zonedDateTime, dayOfYear, options)
```

### `withDayOfMonth`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withDayOfMonth(zonedDateTime, day, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.with({ day }, options)
```

### `withDayOfWeek`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withDayOfWeek(zonedDateTime, dayOfWeek, options)
```

Temporal API:

```ts
import { withDayOfWeek } from 'temporal-utils'

const nextZonedDateTime = withDayOfWeek(zonedDateTime, dayOfWeek, options)
```

### `withWeekOfYear`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.withWeekOfYear(zonedDateTime, weekOfYear, options)
```

Temporal API:

```ts
import { withWeekOfYear } from 'temporal-utils'

const nextZonedDateTime = withWeekOfYear(zonedDateTime, weekOfYear, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.add(zonedDateTime, duration, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add(duration, options)
```

Duration records need the same record-to-Temporal transform as zoned date-time records.

### `addYears`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addYears(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ years: value }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addMonths(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ months: value }, options)
```

### `addWeeks`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addWeeks(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ weeks: value }, options)
```

### `addDays`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addDays(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ days: value }, options)
```

### `addHours`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addHours(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ hours: value }, options)
```

### `addMinutes`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addMinutes(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ minutes: value }, options)
```

### `addSeconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addSeconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ seconds: value }, options)
```

### `addMilliseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addMilliseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ milliseconds: value }, options)
```

### `addMicroseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addMicroseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ microseconds: value }, options)
```

### `addNanoseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.addNanoseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.add({ nanoseconds: value }, options)
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtract(zonedDateTime, duration, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as zoned date-time records.

### `subtractYears`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractYears(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ years: value }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractMonths(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ months: value }, options)
```

### `subtractWeeks`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractWeeks(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ weeks: value }, options)
```

### `subtractDays`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractDays(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ days: value }, options)
```

### `subtractHours`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractHours(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ hours: value }, options)
```

### `subtractMinutes`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractMinutes(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ minutes: value }, options)
```

### `subtractSeconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractSeconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ seconds: value }, options)
```

### `subtractMilliseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractMilliseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ milliseconds: value }, options)
```

### `subtractMicroseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractMicroseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ microseconds: value }, options)
```

### `subtractNanoseconds`

Signature:

```ts
(record: Record, value: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.subtractNanoseconds(zonedDateTime, value, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.subtract({ nanoseconds: value }, options)
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<UnitName>) => DurationRecord
```

Fn API:

```ts
const duration = ZonedDateTimeFns.diff(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
const duration = zonedDateTime.until(otherZonedDateTime, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const years = ZonedDateTimeFns.diffYears(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const months = ZonedDateTimeFns.diffMonths(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffMonths } from 'temporal-utils'

const months = diffMonths(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffWeeks`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const weeks = ZonedDateTimeFns.diffWeeks(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffWeeks } from 'temporal-utils'

const weeks = diffWeeks(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffDays`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const days = ZonedDateTimeFns.diffDays(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffDays } from 'temporal-utils'

const days = diffDays(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffHours`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const hours = ZonedDateTimeFns.diffHours(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffHours } from 'temporal-utils'

const hours = diffHours(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMinutes`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const minutes = ZonedDateTimeFns.diffMinutes(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffMinutes } from 'temporal-utils'

const minutes = diffMinutes(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffSeconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const seconds = ZonedDateTimeFns.diffSeconds(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffSeconds } from 'temporal-utils'

const seconds = diffSeconds(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMilliseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const milliseconds = ZonedDateTimeFns.diffMilliseconds(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffMilliseconds } from 'temporal-utils'

const milliseconds = diffMilliseconds(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMicroseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const microseconds = ZonedDateTimeFns.diffMicroseconds(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffMicroseconds } from 'temporal-utils'

const microseconds = diffMicroseconds(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffNanoseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const nanoseconds = ZonedDateTimeFns.diffNanoseconds(zonedDateTime, otherZonedDateTime, options)
```

Temporal API:

```ts
import { diffNanoseconds } from 'temporal-utils'

const nanoseconds = diffNanoseconds(zonedDateTime, otherZonedDateTime, options)
```

If `options` is omitted, no rounding occurs.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = ZonedDateTimeFns.equals(zonedDateTime, otherZonedDateTime)
```

Temporal API:

```ts
const same = zonedDateTime.equals(otherZonedDateTime)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => number
```

Fn API:

```ts
const order = ZonedDateTimeFns.compare(zonedDateTime, otherZonedDateTime)
```

Temporal API:

```ts
const order = Temporal.ZonedDateTime.compare(zonedDateTime, otherZonedDateTime)
```

## Rounding

`RoundingMathOptions` must not include `smallestUnit`. Pass a `RoundingMode`
string as shorthand for `options.roundingMode`.

### `roundToYear`

If `options` or `options.roundingMode` is omitted, the rounding mode defaults to `'halfExpand'`.

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToYear(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToYear(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToYear(zonedDateTime, options)
```

Temporal API:

```ts
import { roundToYear } from 'temporal-utils'

const nextZonedDateTime = roundToYear(zonedDateTime)
const nextZonedDateTime = roundToYear(zonedDateTime, 'ceil')
const nextZonedDateTime = roundToYear(zonedDateTime, options)
```

### `roundToMonth`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToMonth(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToMonth(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToMonth(zonedDateTime, options)
```

Temporal API:

```ts
import { roundToMonth } from 'temporal-utils'

const nextZonedDateTime = roundToMonth(zonedDateTime)
const nextZonedDateTime = roundToMonth(zonedDateTime, 'ceil')
const nextZonedDateTime = roundToMonth(zonedDateTime, options)
```

### `roundToWeek`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToWeek(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToWeek(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToWeek(zonedDateTime, options)
```

Temporal API:

```ts
import { roundToWeek } from 'temporal-utils'

const nextZonedDateTime = roundToWeek(zonedDateTime)
const nextZonedDateTime = roundToWeek(zonedDateTime, 'ceil')
const nextZonedDateTime = roundToWeek(zonedDateTime, options)
```

### `roundToDay`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToDay(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToDay(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToDay(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'day' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'day' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'day' })
```

Temporal API, generically, for second argument:

```ts
import { roundToDay } from 'temporal-utils'

const nextZonedDateTime = roundToDay(zonedDateTime, roundingModeOrOptions)
```

### `roundToHour`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToHour(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToHour(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToHour(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'hour' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'hour' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'hour' })
```

Temporal API, generically, for second argument:

```ts
import { roundToHour } from 'temporal-utils'

const nextZonedDateTime = roundToHour(zonedDateTime, roundingModeOrOptions)
```

### `roundToMinute`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToMinute(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToMinute(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToMinute(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'minute' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'minute' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'minute' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMinute } from 'temporal-utils'

const nextZonedDateTime = roundToMinute(zonedDateTime, roundingModeOrOptions)
```

### `roundToSecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToSecond(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToSecond(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToSecond(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'second' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'second' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'second' })
```

Temporal API, generically, for second argument:

```ts
import { roundToSecond } from 'temporal-utils'

const nextZonedDateTime = roundToSecond(zonedDateTime, roundingModeOrOptions)
```

### `roundToMillisecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToMillisecond(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToMillisecond(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToMillisecond(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'millisecond' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'millisecond' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'millisecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMillisecond } from 'temporal-utils'

const nextZonedDateTime = roundToMillisecond(zonedDateTime, roundingModeOrOptions)
```

### `roundToMicrosecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.roundToMicrosecond(zonedDateTime)
const nextZonedDateTime = ZonedDateTimeFns.roundToMicrosecond(zonedDateTime, 'ceil')
const nextZonedDateTime = ZonedDateTimeFns.roundToMicrosecond(zonedDateTime, options)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.round({ smallestUnit: 'microsecond' })
const nextZonedDateTime = zonedDateTime.round({ roundingMode: 'ceil', smallestUnit: 'microsecond' })
const nextZonedDateTime = zonedDateTime.round({ ...options, smallestUnit: 'microsecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMicrosecond } from 'temporal-utils'

const nextZonedDateTime = roundToMicrosecond(zonedDateTime, roundingModeOrOptions)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfYear(zonedDateTime)
```

Temporal API:

```ts
import { startOfYear } from 'temporal-utils'

const nextZonedDateTime = startOfYear(zonedDateTime)
```

### `startOfMonth`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfMonth(zonedDateTime)
```

Temporal API:

```ts
import { startOfMonth } from 'temporal-utils'

const nextZonedDateTime = startOfMonth(zonedDateTime)
```

### `startOfWeek`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfWeek(zonedDateTime)
```

Temporal API:

```ts
import { startOfWeek } from 'temporal-utils'

const nextZonedDateTime = startOfWeek(zonedDateTime)
```

### `startOfDay`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfDay(zonedDateTime)
```

Temporal API:

```ts
const nextZonedDateTime = zonedDateTime.startOfDay()
```

### `startOfHour`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfHour(zonedDateTime)
```

Temporal API:

```ts
import { startOfHour } from 'temporal-utils'

const nextZonedDateTime = startOfHour(zonedDateTime)
```

### `startOfMinute`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfMinute(zonedDateTime)
```

Temporal API:

```ts
import { startOfMinute } from 'temporal-utils'

const nextZonedDateTime = startOfMinute(zonedDateTime)
```

### `startOfSecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfSecond(zonedDateTime)
```

Temporal API:

```ts
import { startOfSecond } from 'temporal-utils'

const nextZonedDateTime = startOfSecond(zonedDateTime)
```

### `startOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfMillisecond(zonedDateTime)
```

Temporal API:

```ts
import { startOfMillisecond } from 'temporal-utils'

const nextZonedDateTime = startOfMillisecond(zonedDateTime)
```

### `startOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.startOfMicrosecond(zonedDateTime)
```

Temporal API:

```ts
import { startOfMicrosecond } from 'temporal-utils'

const nextZonedDateTime = startOfMicrosecond(zonedDateTime)
```

### `endOfYear`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfYear(zonedDateTime)
```

Temporal API:

```ts
import { endOfYear } from 'temporal-utils'

const nextZonedDateTime = endOfYear(zonedDateTime)
```

### `endOfMonth`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfMonth(zonedDateTime)
```

Temporal API:

```ts
import { endOfMonth } from 'temporal-utils'

const nextZonedDateTime = endOfMonth(zonedDateTime)
```

### `endOfWeek`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfWeek(zonedDateTime)
```

Temporal API:

```ts
import { endOfWeek } from 'temporal-utils'

const nextZonedDateTime = endOfWeek(zonedDateTime)
```

### `endOfDay`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfDay(zonedDateTime)
```

Temporal API:

```ts
import { endOfDay } from 'temporal-utils'

const nextZonedDateTime = endOfDay(zonedDateTime)
```

### `endOfHour`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfHour(zonedDateTime)
```

Temporal API:

```ts
import { endOfHour } from 'temporal-utils'

const nextZonedDateTime = endOfHour(zonedDateTime)
```

### `endOfMinute`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfMinute(zonedDateTime)
```

Temporal API:

```ts
import { endOfMinute } from 'temporal-utils'

const nextZonedDateTime = endOfMinute(zonedDateTime)
```

### `endOfSecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfSecond(zonedDateTime)
```

Temporal API:

```ts
import { endOfSecond } from 'temporal-utils'

const nextZonedDateTime = endOfSecond(zonedDateTime)
```

### `endOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfMillisecond(zonedDateTime)
```

Temporal API:

```ts
import { endOfMillisecond } from 'temporal-utils'

const nextZonedDateTime = endOfMillisecond(zonedDateTime)
```

### `endOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextZonedDateTime = ZonedDateTimeFns.endOfMicrosecond(zonedDateTime)
```

Temporal API:

```ts
import { endOfMicrosecond } from 'temporal-utils'

const nextZonedDateTime = endOfMicrosecond(zonedDateTime)
```

## Time Zone Transition

### `getTimeZoneTransition`

Signature:

```ts
(record: Record, direction: DirectionName) => Record | null
(record: Record, options: DirectionOptions) => Record | null
```

Fn API:

```ts
const transition = ZonedDateTimeFns.getTimeZoneTransition(zonedDateTime, direction)
```

Temporal API:

```ts
const transition = zonedDateTime.getTimeZoneTransition(direction)
```

## Conversion

### `toInstant`

Signature:

```ts
(record: Record) => InstantRecord
```

Fn API:

```ts
const instant = ZonedDateTimeFns.toInstant(zonedDateTime)
```

Temporal API:

```ts
const instant = zonedDateTime.toInstant()
```

### `toPlainDateTime`

Signature:

```ts
(record: Record) => PlainDateTimeRecord
```

Fn API:

```ts
const dateTime = ZonedDateTimeFns.toPlainDateTime(zonedDateTime)
```

Temporal API:

```ts
const dateTime = zonedDateTime.toPlainDateTime()
```

### `toPlainDate`

Signature:

```ts
(record: Record) => PlainDateRecord
```

Fn API:

```ts
const date = ZonedDateTimeFns.toPlainDate(zonedDateTime)
```

Temporal API:

```ts
const date = zonedDateTime.toPlainDate()
```

### `toPlainTime`

Signature:

```ts
(record: Record) => PlainTimeRecord
```

Fn API:

```ts
const time = ZonedDateTimeFns.toPlainTime(zonedDateTime)
```

Temporal API:

```ts
const time = zonedDateTime.toPlainTime()
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: ZonedDateTimeDisplayOptions) => string
```

Fn API:

```ts
const text = ZonedDateTimeFns.toString(zonedDateTime, options)
```

Temporal API:

```ts
const text = zonedDateTime.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = ZonedDateTimeFns.toSimpleString(zonedDateTime)
```

Temporal API:

```ts
const text = zonedDateTime.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = ZonedDateTimeFns.toLocaleString(zonedDateTime, locales, options)
```

Temporal API:

```ts
const text = zonedDateTime.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = ZonedDateTimeFns.createFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})
const text = format.format(zonedDateTime)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})
const text = format.format(zonedDateTime)
```

This rewrite is appropriate when later uses rely on `format.format(zonedDateTime)`.
