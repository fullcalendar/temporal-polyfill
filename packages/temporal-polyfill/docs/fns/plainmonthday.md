# PlainMonthDay Functional API

Public functions exported for `PlainMonthDay`.

## Record Shape

```ts
type Record = {
  readonly calendarId: string
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
| `create` | `(isoMonth: number, isoDay: number, calendar?: CalendarRecord, referenceIsoYear?: number) => Record` |
| `fromFields` | `(fields: Partial<MonthDayFields> & { calendar?: CalendarRecord }, options?: OverflowOptions) => Record` |
| `fromString` | `(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withFields` | `(record: Record, mod: Partial<MonthDayFields>, options?: OverflowOptions) => Record` |

### Comparison

| Function | Abbreviated signature |
| --- | --- |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toPlainDate` | `(record: Record, fields: EraYearOrYear) => PlainDateRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: CalendarDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as PlainMonthDayFns from 'temporal-polyfill/fns/plainmonthday'

const record = PlainMonthDayFns.create(5, 1)
const format = PlainMonthDayFns.createFormat('en-US', {
  month: 'long',
  day: 'numeric',
})

format.format(record) // "May 1"
```
