# Instant Functional API

Public functions exported for `Instant`.

## Record Shape

```ts
type Record = {
  readonly epochMilliseconds: number
  readonly epochNanoseconds: bigint
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
| `create` | `(epochNanoseconds: bigint) => Record` |
| `fromEpochMilliseconds` | `(epochMilliseconds: number) => Record` |
| `fromEpochNanoseconds` | `(epochNanoseconds: bigint) => Record` |
| `fromString` | `(s: string) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `add` | `(record: Record, durationRecord: DurationRecord) => Record` |
| `subtract` | `(record: Record, durationRecord: DurationRecord) => Record` |
| `diff` | `(record: Record, otherRecord: Record, options?: DiffOptions<TimeUnitName>) => DurationRecord` |
| `round` | `(record: Record, options: TimeUnitName \| RoundingOptions<TimeUnitName>) => Record` |
| `equals` | `(record: Record, otherRecord: Record) => boolean` |
| `compare` | `(record: Record, otherRecord: Record) => NumberSign` |

### Conversion

| Function | Abbreviated signature |
| --- | --- |
| `toZonedDateTimeISO` | `(record: Record, timeZoneId: string) => ZonedDateTimeRecord` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(record: Record, options?: InstantDisplayOptions) => string` |
| `toSimpleString` | `(record: Record) => string` |
| `createFormat` | `(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>` |

```ts
import * as InstantFns from 'temporal-polyfill/fns/instant'

const record = InstantFns.fromString('2024-05-01T13:30:00Z')
const format = InstantFns.createFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})

format.format(record) // "May 1, 2024 at 1:30 PM"
```
