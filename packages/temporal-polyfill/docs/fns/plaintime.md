# PlainTime Functional API

Public functions exported for `PlainTime`.

## Record Shape

```ts
type Record = {
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
| `create` | `(hour?: number, minute?: number, second?: number, millisecond?: number, microsecond?: number, nanosecond?: number) => Record` |
| `fromFields` | `(fields: Partial<TimeFields>, options?: OverflowOptions) => Record` |
| `fromString` | `(s: string) => Record` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withFields` | `(record: Record, mod: Partial<TimeFields>, options?: OverflowOptions) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, duration: DurationRecord) => Record` |
| `subtract` | `(record: Record, duration: DurationRecord) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<TimeUnitName>) => DurationRecord` |
| `round` | `(record: Record, options: TimeUnitName \| RoundingOptions<TimeUnitName>) => Record` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: TimeDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as PlainTimeFns from 'temporal-polyfill/fns/plaintime'

const record = PlainTimeFns.create(9, 30)
const format = PlainTimeFns.createFormat('en-US', { timeStyle: 'short' })

format.format(record) // "9:30 AM"
```
