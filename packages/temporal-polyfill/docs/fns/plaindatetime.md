# PlainDateTime Functional API

Public functions exported for `PlainDateTime`.

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

## Standard Functions

### Type Guard

| Function | Abbreviated signature |
| --- | --- |
| `isRecord` | `(arg: unknown) => arg is Record` |

### Construction And Parsing

| Function | Abbreviated signature |
| --- | --- |
| `create` | `(isoYear: number, isoMonth: number, isoDay: number, hour?: number, minute?: number, second?: number, millisecond?: number, microsecond?: number, nanosecond?: number, calendar?: CalendarRecord) => Record` |
| `fromFields` | `(fields: Partial<DateTimeFields> & { calendar: CalendarRecord }, options?: OverflowOptions) => Record` |
| `fromString` | `(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record` |

### Calendar Properties

| Function | Abbreviated signature |
| --- | --- |
| `dayOfWeek` | `(record: Record) => number` |
| `daysInWeek` | `(record: Record) => number` |
| `weekOfYear` | `(record: Record) => number \| undefined` |
| `yearOfWeek` | `(record: Record) => number \| undefined` |
| `dayOfYear` | `(record: Record) => number` |
| `daysInMonth` | `(record: Record) => number` |
| `daysInYear` | `(record: Record) => number` |
| `monthsInYear` | `(record: Record) => number` |
| `inLeapYear` | `(record: Record) => boolean` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withCalendar` | `(record: Record, calendarRecord: CalendarRecord) => Record` |
| `withFields` | `(record: Record, mod: Partial<DateTimeFields>, options?: OverflowOptions) => Record` |
| `withPlainTime` | `(record: Record, plainTimeRecord?: PlainTimeRecord) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `subtract` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<UnitName>) => DurationRecord` |
| `round` | `(record: Record, options: DayTimeUnitName \| RoundingOptions<DayTimeUnitName>) => Record` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toZonedDateTime` | `(record: Record, timeZoneId: string, options?: EpochDisambigOptions) => ZonedDateTimeRecord` |
| `toPlainDate` | `(record: Record) => PlainDateRecord` |
| `toPlainTime` | `(record: Record) => PlainTimeRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: DateTimeDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as PlainDateTimeFns from 'temporal-polyfill/fns/plaindatetime'

const record = PlainDateTimeFns.create(2024, 5, 1, 9, 30)
const format = PlainDateTimeFns.createFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
})

format.format(record) // "May 1, 2024 at 9:30 AM"
```

## Non-Standard Helpers

### With Helpers

| Function | Abbreviated signature |
| --- | --- |
| `withDayOfYear` | `(record: Record, dayOfYear: number, options?: OverflowOptions) => Record` |
| `withDayOfMonth` | `(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record` |
| `withDayOfWeek` | `(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record` |
| `withWeekOfYear` | `(record: Record, weekOfYear: number, options?: OverflowOptions) => Record` |

### Unit Add Helpers

| Function | Abbreviated signature |
| --- | --- |
| `addYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `addMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `addWeeks` | `(record: Record, weeks: number) => Record` |
| `addDays` | `(record: Record, days: number) => Record` |
| `addHours` | `(record: Record, hours: number) => Record` |
| `addMinutes` | `(record: Record, minutes: number) => Record` |
| `addSeconds` | `(record: Record, seconds: number) => Record` |
| `addMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `addMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `addNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, weeks: number) => Record` |
| `subtractDays` | `(record: Record, days: number) => Record` |
| `subtractHours` | `(record: Record, hours: number) => Record` |
| `subtractMinutes` | `(record: Record, minutes: number) => Record` |
| `subtractSeconds` | `(record: Record, seconds: number) => Record` |
| `subtractMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `subtractMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `subtractNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Round Helpers

| Function | Abbreviated signature |
| --- | --- |
| `roundToYear` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToMonth` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToWeek` | `(record: Record, options?: RoundOptions) => Record` |

### Start-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `startOfYear` | `(record: Record) => Record` |
| `startOfMonth` | `(record: Record) => Record` |
| `startOfWeek` | `(record: Record) => Record` |
| `startOfDay` | `(record: Record) => Record` |
| `startOfHour` | `(record: Record) => Record` |
| `startOfMinute` | `(record: Record) => Record` |
| `startOfSecond` | `(record: Record) => Record` |
| `startOfMillisecond` | `(record: Record) => Record` |
| `startOfMicrosecond` | `(record: Record) => Record` |

### End-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `endOfYear` | `(record: Record) => Record` |
| `endOfMonth` | `(record: Record) => Record` |
| `endOfWeek` | `(record: Record) => Record` |
| `endOfDay` | `(record: Record) => Record` |
| `endOfHour` | `(record: Record) => Record` |
| `endOfMinute` | `(record: Record) => Record` |
| `endOfSecond` | `(record: Record) => Record` |
| `endOfMillisecond` | `(record: Record) => Record` |
| `endOfMicrosecond` | `(record: Record) => Record` |

### Unit Difference Helpers

| Function | Abbreviated signature |
| --- | --- |
| `diffYears` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMonths` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffWeeks` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffDays` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffHours` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMinutes` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffSeconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMilliseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMicroseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffNanoseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
