# PlainYearMonth Functional API

Public functions exported for `PlainYearMonth`.

## Record Shape

```ts
type Record = {
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
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
| `create` | `(isoYear: number, isoMonth: number, calendar?: CalendarRecord, referenceIsoDay?: number) => Record` |
| `fromFields` | `(fields: Partial<YearMonthFields> & { calendar?: CalendarRecord }, options?: OverflowOptions) => Record` |
| `fromString` | `(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record` |

### Calendar Properties

| Function | Abbreviated signature |
| --- | --- |
| `daysInMonth` | `(record: Record) => number` |
| `daysInYear` | `(record: Record) => number` |
| `monthsInYear` | `(record: Record) => number` |
| `inLeapYear` | `(record: Record) => boolean` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withFields` | `(record: Record, mod: Partial<YearMonthFields>, options?: OverflowOptions) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `subtract` | `(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<YearMonthUnitName>) => DurationRecord` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toPlainDate` | `(record: Record, fields: DayFields) => PlainDateRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: CalendarDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as PlainYearMonthFns from 'temporal-polyfill/fns/plainyearmonth'

const record = PlainYearMonthFns.create(2024, 5)
const format = PlainYearMonthFns.createFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

format.format(record) // "May 2024"
```
