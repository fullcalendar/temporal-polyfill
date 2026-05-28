# PlainDate Functional API

Public functions exported for `PlainDate`.

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

## Standard Functions

### Type Guard

| Function | Abbreviated signature |
| --- | --- |
| `isRecord` | `(arg: unknown) => arg is Record` |

### Construction And Parsing

| Function | Abbreviated signature |
| --- | --- |
| `create` | `(isoYear: number, isoMonth: number, isoDay: number, calendar?: CalendarRecord) => Record` |
| `fromFields` | `(fields: Partial<DateFields> & { calendar: CalendarRecord }, options?: OverflowOptions) => Record` |
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
| `withFields` | `(record: Record, mod: Partial<DateFields>, options?: OverflowOptions) => Record` |
| `withCalendar` | `(record: Record, calendarRecord: CalendarRecord) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `subtract` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<DateUnitName>) => DurationRecord` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toZonedDateTime` | `(record: Record, options: string \| ToZonedDateTimeOptions<PlainTimeRecord>) => ZonedDateTimeRecord` |
| `toPlainDateTime` | `(record: Record, plainTimeRecord?: PlainTimeRecord) => PlainDateTimeRecord` |
| `toPlainYearMonth` | `(record: Record) => PlainYearMonthRecord` |
| `toPlainMonthDay` | `(record: Record) => PlainMonthDayRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: CalendarDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/plaindate'

const record = PlainDateFns.create(2024, 5, 1)
const format = PlainDateFns.createFormat('en-US', { dateStyle: 'long' })

format.format(record) // "May 1, 2024"
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

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, weeks: number) => Record` |
| `subtractDays` | `(record: Record, days: number) => Record` |

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

### End-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `endOfYear` | `(record: Record) => Record` |
| `endOfMonth` | `(record: Record) => Record` |
| `endOfWeek` | `(record: Record) => Record` |

### Unit Difference Helpers

| Function | Abbreviated signature |
| --- | --- |
| `diffYears` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMonths` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffWeeks` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffDays` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
