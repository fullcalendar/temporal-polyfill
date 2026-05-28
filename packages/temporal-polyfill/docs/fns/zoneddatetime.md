# ZonedDateTime Functional API

Public functions exported for `ZonedDateTime`.

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

## Standard Functions

### Type Guard

| Function | Abbreviated signature |
| --- | --- |
| `isRecord` | `(arg: unknown) => arg is Record` |

### Construction And Parsing

| Function | Abbreviated signature |
| --- | --- |
| `create` | `(epochNanoseconds: bigint, timeZoneId: string, calendar?: CalendarRecord) => Record` |
| `fromFields` | `(fields: ZonedFields, options?: ZonedFieldOptions) => Record` |
| `fromString` | `(s: string, getCalendar: (calendarId: string) => CalendarRecord, options?: ZonedFieldOptions) => Record` |

### Calendar And Offset Properties

| Function | Abbreviated signature |
| --- | --- |
| `offsetNanoseconds` | `(record: Record) => number` |
| `offset` | `(record: Record) => string` |
| `dayOfWeek` | `(record: Record) => number` |
| `daysInWeek` | `(record: Record) => number` |
| `weekOfYear` | `(record: Record) => number \| undefined` |
| `yearOfWeek` | `(record: Record) => number \| undefined` |
| `dayOfYear` | `(record: Record) => number` |
| `daysInMonth` | `(record: Record) => number` |
| `daysInYear` | `(record: Record) => number` |
| `monthsInYear` | `(record: Record) => number` |
| `inLeapYear` | `(record: Record) => boolean` |
| `hoursInDay` | `(record: Record) => number` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withFields` | `(record: Record, mod: Partial<DateTimeFields>, options?: ZonedFieldOptions) => Record` |
| `withCalendar` | `(record: Record, calendarRecord: CalendarRecord) => Record` |
| `withTimeZone` | `(record: Record, timeZoneId: string) => Record` |
| `withPlainTime` | `(record: Record, plainTimeRecord?: PlainTimeRecord) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `subtract` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<UnitName>) => DurationRecord` |
| `round` | `(record: Record, options: DayTimeUnitName \| RoundingOptions<DayTimeUnitName>) => Record` |
| `startOfDay` | `(record: Record) => Record` |
| `getTimeZoneTransition` | `(record: Record, options: DirectionOptions \| DirectionName) => Record \| null` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toInstant` | `(record: Record) => InstantRecord` |
| `toPlainDateTime` | `(record: Record) => PlainDateTimeRecord` |
| `toPlainDate` | `(record: Record) => PlainDateRecord` |
| `toPlainTime` | `(record: Record) => PlainTimeRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: ZonedDateTimeDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |

## Non-Standard Helpers

### With Helpers

| Function | Abbreviated signature |
| --- | --- |
| `withDayOfYear` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `withDayOfMonth` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `withDayOfWeek` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `withWeekOfYear` | `(record: Record, value: number, options?: OverflowOptions) => Record` |

### Unit Add Helpers

| Function | Abbreviated signature |
| --- | --- |
| `addYears` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addMonths` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addWeeks` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addDays` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addHours` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addMinutes` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addSeconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addMilliseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addMicroseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `addNanoseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractDays` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractHours` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractMinutes` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractSeconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractMilliseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractMicroseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |
| `subtractNanoseconds` | `(record: Record, value: number, options?: OverflowOptions) => Record` |

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
