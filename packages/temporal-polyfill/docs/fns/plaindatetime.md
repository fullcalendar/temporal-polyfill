# PlainDateTime Functional API

Public functions exported for `PlainDateTime`.

Examples assume the functional API is imported as:

```ts
import * as PlainDateTimeFns from 'temporal-polyfill/fns/plaindatetime'
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
  - [`withCalendar`](#withcalendar)
  - [`withFields`](#withfields)
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
  - [`round`](#round)
  - [`roundToYear`](#roundtoyear)
  - [`roundToMonth`](#roundtomonth)
  - [`roundToWeek`](#roundtoweek)
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
- [Conversion](#conversion)
  - [`toZonedDateTime`](#tozoneddatetime)
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
`PlainDateTimeFns.Record` values into `Temporal.PlainDateTime` instances.
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
if (PlainDateTimeFns.isRecord(value)) {
  value.hour
}
```

Temporal API:

```ts
if (value instanceof Temporal.PlainDateTime) {
  value.hour
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoYear: number, isoMonth: number, isoDay: number, hour?: number, minute?: number, second?: number, millisecond?: number, microsecond?: number, nanosecond?: number, calendar?: CalendarRecord) => Record
```

Fn API:

```ts
const dateTime = PlainDateTimeFns.create(2024, 5, 1, 9, 30)
```

Temporal API:

```ts
const dateTime = new Temporal.PlainDateTime(2024, 5, 1, 9, 30)
```

If the optional calendar argument is present, replace a known `CalendarRecord` expression with its calendar identifier.

### `fromFields`

Signature:

```ts
(fields: Partial<DateTimeFields> & { calendar: CalendarRecord }, options?: OverflowOptions) => Record
```

Fn API:

```ts
const dateTime = PlainDateTimeFns.fromFields(fields, options)
```

Temporal API:

```ts
const dateTime = Temporal.PlainDateTime.from(fields, options)
```

If `fields.calendar` is still a `CalendarRecord`, replace it with the calendar identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record
```

Fn API:

```ts
const dateTime = PlainDateTimeFns.fromString(value, getCalendar)
```

Temporal API:

```ts
const dateTime = Temporal.PlainDateTime.from(value)
```

The resolver argument has no direct counterpart and can usually be dropped once its import or local binding is unused.

## Calendar Properties

### `dayOfWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfWeek = PlainDateTimeFns.dayOfWeek(dateTime)
```

Temporal API:

```ts
const dayOfWeek = dateTime.dayOfWeek
```

### `daysInWeek`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInWeek = PlainDateTimeFns.daysInWeek(dateTime)
```

Temporal API:

```ts
const daysInWeek = dateTime.daysInWeek
```

### `weekOfYear`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const weekOfYear = PlainDateTimeFns.weekOfYear(dateTime)
```

Temporal API:

```ts
const weekOfYear = dateTime.weekOfYear
```

### `yearOfWeek`

Signature:

```ts
(record: Record) => number | undefined
```

Fn API:

```ts
const yearOfWeek = PlainDateTimeFns.yearOfWeek(dateTime)
```

Temporal API:

```ts
const yearOfWeek = dateTime.yearOfWeek
```

### `dayOfYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const dayOfYear = PlainDateTimeFns.dayOfYear(dateTime)
```

Temporal API:

```ts
const dayOfYear = dateTime.dayOfYear
```

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInMonth = PlainDateTimeFns.daysInMonth(dateTime)
```

Temporal API:

```ts
const daysInMonth = dateTime.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInYear = PlainDateTimeFns.daysInYear(dateTime)
```

Temporal API:

```ts
const daysInYear = dateTime.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const monthsInYear = PlainDateTimeFns.monthsInYear(dateTime)
```

Temporal API:

```ts
const monthsInYear = dateTime.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Fn API:

```ts
const inLeapYear = PlainDateTimeFns.inLeapYear(dateTime)
```

Temporal API:

```ts
const inLeapYear = dateTime.inLeapYear
```

## Field Replacement

### `withCalendar`

Signature:

```ts
(record: Record, calendarRecord: CalendarRecord) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withCalendar(dateTime, calendarRecord)
```

Temporal API:

```ts
const nextDateTime = dateTime.withCalendar(calendar)
```

Replace a known `CalendarRecord` expression with its calendar identifier.

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<DateTimeFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withFields(dateTime, fields, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.with(fields, options)
```

### `withPlainTime`

Signature:

```ts
(record: Record, plainTimeRecord?: PlainTimeRecord) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withPlainTime(dateTime, time)
```

Temporal API:

```ts
const nextDateTime = dateTime.withPlainTime(time)
```

Any `PlainTimeRecord` argument needs its own record-to-Temporal transform.

### `withDayOfYear`

Signature:

```ts
(record: Record, dayOfYear: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withDayOfYear(dateTime, dayOfYear, options)
```

Temporal API:

```ts
import { withDayOfYear } from 'temporal-utils'

const nextDateTime = withDayOfYear(dateTime, dayOfYear, options)
```

### `withDayOfMonth`

Signature:

```ts
(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withDayOfMonth(dateTime, day, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.with({ day }, options)
```

### `withDayOfWeek`

Signature:

```ts
(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withDayOfWeek(dateTime, dayOfWeek, options)
```

Temporal API:

```ts
import { withDayOfWeek } from 'temporal-utils'

const nextDateTime = withDayOfWeek(dateTime, dayOfWeek, options)
```

### `withWeekOfYear`

Signature:

```ts
(record: Record, weekOfYear: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.withWeekOfYear(dateTime, weekOfYear, options)
```

Temporal API:

```ts
import { withWeekOfYear } from 'temporal-utils'

const nextDateTime = withWeekOfYear(dateTime, weekOfYear, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.add(dateTime, duration, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.add(duration, options)
```

Duration records need the same record-to-Temporal transform as date-time records.

### `addYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addYears(dateTime, years, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ years }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addMonths(dateTime, months, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ months }, options)
```

### `addWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addWeeks(dateTime, weeks)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ weeks })
```

### `addDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addDays(dateTime, days)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ days })
```

### `addHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addHours(dateTime, hours)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ hours })
```

### `addMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addMinutes(dateTime, minutes)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ minutes })
```

### `addSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addSeconds(dateTime, seconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ seconds })
```

### `addMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addMilliseconds(dateTime, milliseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ milliseconds })
```

### `addMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addMicroseconds(dateTime, microseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ microseconds })
```

### `addNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.addNanoseconds(dateTime, nanoseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.add({ nanoseconds })
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtract(dateTime, duration, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as date-time records.

### `subtractYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractYears(dateTime, years, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ years }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractMonths(dateTime, months, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ months }, options)
```

### `subtractWeeks`

Signature:

```ts
(record: Record, weeks: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractWeeks(dateTime, weeks)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ weeks })
```

### `subtractDays`

Signature:

```ts
(record: Record, days: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractDays(dateTime, days)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ days })
```

### `subtractHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractHours(dateTime, hours)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ hours })
```

### `subtractMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractMinutes(dateTime, minutes)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ minutes })
```

### `subtractSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractSeconds(dateTime, seconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ seconds })
```

### `subtractMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractMilliseconds(dateTime, milliseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ milliseconds })
```

### `subtractMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractMicroseconds(dateTime, microseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ microseconds })
```

### `subtractNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.subtractNanoseconds(dateTime, nanoseconds)
```

Temporal API:

```ts
const nextDateTime = dateTime.subtract({ nanoseconds })
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<UnitName>) => DurationRecord
```

Fn API:

```ts
const duration = PlainDateTimeFns.diff(dateTime, otherDateTime, options)
```

Temporal API:

```ts
const duration = dateTime.until(otherDateTime, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const years = PlainDateTimeFns.diffYears(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const months = PlainDateTimeFns.diffMonths(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffMonths } from 'temporal-utils'

const months = diffMonths(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffWeeks`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const weeks = PlainDateTimeFns.diffWeeks(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffWeeks } from 'temporal-utils'

const weeks = diffWeeks(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffDays`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const days = PlainDateTimeFns.diffDays(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffDays } from 'temporal-utils'

const days = diffDays(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffHours`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const hours = PlainDateTimeFns.diffHours(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffHours } from 'temporal-utils'

const hours = diffHours(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffMinutes`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const minutes = PlainDateTimeFns.diffMinutes(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffMinutes } from 'temporal-utils'

const minutes = diffMinutes(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffSeconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const seconds = PlainDateTimeFns.diffSeconds(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffSeconds } from 'temporal-utils'

const seconds = diffSeconds(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffMilliseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const milliseconds = PlainDateTimeFns.diffMilliseconds(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffMilliseconds } from 'temporal-utils'

const milliseconds = diffMilliseconds(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffMicroseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const microseconds = PlainDateTimeFns.diffMicroseconds(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffMicroseconds } from 'temporal-utils'

const microseconds = diffMicroseconds(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `diffNanoseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const nanoseconds = PlainDateTimeFns.diffNanoseconds(dateTime, otherDateTime, options)
```

Temporal API:

```ts
import { diffNanoseconds } from 'temporal-utils'

const nanoseconds = diffNanoseconds(dateTime, otherDateTime, options)
```

This preserves the helper behavior, including exact totals when no rounding mode is provided.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = PlainDateTimeFns.equals(dateTime, otherDateTime)
```

Temporal API:

```ts
const same = dateTime.equals(otherDateTime)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => NumberSign
```

Fn API:

```ts
const order = PlainDateTimeFns.compare(dateTime, otherDateTime)
```

Temporal API:

```ts
const order = Temporal.PlainDateTime.compare(dateTime, otherDateTime)
```

## Rounding

### `round`

Signature:

```ts
(record: Record, options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.round(dateTime, options)
```

Temporal API:

```ts
const nextDateTime = dateTime.round(options)
```

### `roundToYear`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.roundToYear(dateTime, options)
```

Temporal API:

```ts
import { roundToYear } from 'temporal-utils'

const nextDateTime = roundToYear(dateTime, options)
```

### `roundToMonth`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.roundToMonth(dateTime, options)
```

Temporal API:

```ts
import { roundToMonth } from 'temporal-utils'

const nextDateTime = roundToMonth(dateTime, options)
```

### `roundToWeek`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.roundToWeek(dateTime, options)
```

Temporal API:

```ts
import { roundToWeek } from 'temporal-utils'

const nextDateTime = roundToWeek(dateTime, options)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfYear(dateTime)
```

Temporal API:

```ts
import { startOfYear } from 'temporal-utils'

const nextDateTime = startOfYear(dateTime)
```

### `startOfMonth`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfMonth(dateTime)
```

Temporal API:

```ts
import { startOfMonth } from 'temporal-utils'

const nextDateTime = startOfMonth(dateTime)
```

### `startOfWeek`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfWeek(dateTime)
```

Temporal API:

```ts
import { startOfWeek } from 'temporal-utils'

const nextDateTime = startOfWeek(dateTime)
```

### `startOfDay`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfDay(dateTime)
```

Temporal API:

```ts
import { startOfDay } from 'temporal-utils'

const nextDateTime = startOfDay(dateTime)
```

### `startOfHour`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfHour(dateTime)
```

Temporal API:

```ts
import { startOfHour } from 'temporal-utils'

const nextDateTime = startOfHour(dateTime)
```

### `startOfMinute`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfMinute(dateTime)
```

Temporal API:

```ts
import { startOfMinute } from 'temporal-utils'

const nextDateTime = startOfMinute(dateTime)
```

### `startOfSecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfSecond(dateTime)
```

Temporal API:

```ts
import { startOfSecond } from 'temporal-utils'

const nextDateTime = startOfSecond(dateTime)
```

### `startOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfMillisecond(dateTime)
```

Temporal API:

```ts
import { startOfMillisecond } from 'temporal-utils'

const nextDateTime = startOfMillisecond(dateTime)
```

### `startOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.startOfMicrosecond(dateTime)
```

Temporal API:

```ts
import { startOfMicrosecond } from 'temporal-utils'

const nextDateTime = startOfMicrosecond(dateTime)
```

### `endOfYear`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfYear(dateTime)
```

Temporal API:

```ts
import { endOfYear } from 'temporal-utils'

const nextDateTime = endOfYear(dateTime)
```

### `endOfMonth`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfMonth(dateTime)
```

Temporal API:

```ts
import { endOfMonth } from 'temporal-utils'

const nextDateTime = endOfMonth(dateTime)
```

### `endOfWeek`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfWeek(dateTime)
```

Temporal API:

```ts
import { endOfWeek } from 'temporal-utils'

const nextDateTime = endOfWeek(dateTime)
```

### `endOfDay`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfDay(dateTime)
```

Temporal API:

```ts
import { endOfDay } from 'temporal-utils'

const nextDateTime = endOfDay(dateTime)
```

### `endOfHour`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfHour(dateTime)
```

Temporal API:

```ts
import { endOfHour } from 'temporal-utils'

const nextDateTime = endOfHour(dateTime)
```

### `endOfMinute`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfMinute(dateTime)
```

Temporal API:

```ts
import { endOfMinute } from 'temporal-utils'

const nextDateTime = endOfMinute(dateTime)
```

### `endOfSecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfSecond(dateTime)
```

Temporal API:

```ts
import { endOfSecond } from 'temporal-utils'

const nextDateTime = endOfSecond(dateTime)
```

### `endOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfMillisecond(dateTime)
```

Temporal API:

```ts
import { endOfMillisecond } from 'temporal-utils'

const nextDateTime = endOfMillisecond(dateTime)
```

### `endOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextDateTime = PlainDateTimeFns.endOfMicrosecond(dateTime)
```

Temporal API:

```ts
import { endOfMicrosecond } from 'temporal-utils'

const nextDateTime = endOfMicrosecond(dateTime)
```

## Conversion

### `toZonedDateTime`

Signature:

```ts
(record: Record, timeZoneId: string, options?: EpochDisambigOptions) => ZonedDateTimeRecord
```

Fn API:

```ts
const zonedDateTime = PlainDateTimeFns.toZonedDateTime(dateTime, timeZoneId, options)
```

Temporal API:

```ts
const zonedDateTime = dateTime.toZonedDateTime(timeZoneId, options)
```

### `toPlainDate`

Signature:

```ts
(record: Record) => PlainDateRecord
```

Fn API:

```ts
const date = PlainDateTimeFns.toPlainDate(dateTime)
```

Temporal API:

```ts
const date = dateTime.toPlainDate()
```

### `toPlainTime`

Signature:

```ts
(record: Record) => PlainTimeRecord
```

Fn API:

```ts
const time = PlainDateTimeFns.toPlainTime(dateTime)
```

Temporal API:

```ts
const time = dateTime.toPlainTime()
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: DateTimeDisplayOptions) => string
```

Fn API:

```ts
const text = PlainDateTimeFns.toString(dateTime, options)
```

Temporal API:

```ts
const text = dateTime.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = PlainDateTimeFns.toSimpleString(dateTime)
```

Temporal API:

```ts
const text = dateTime.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = PlainDateTimeFns.toLocaleString(dateTime, locales, options)
```

Temporal API:

```ts
const text = dateTime.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = PlainDateTimeFns.createFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
})
const text = format.format(dateTime)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
})
const text = format.format(dateTime)
```

This rewrite is appropriate when later uses rely on `format.format(dateTime)`.
