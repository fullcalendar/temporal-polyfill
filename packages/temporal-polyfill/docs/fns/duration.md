# Duration Functional API

Public functions exported for `Duration`.

## Record Shape

```ts
type Record = {
  readonly years: number
  readonly months: number
  readonly weeks: number
  readonly days: number
  readonly hours: number
  readonly minutes: number
  readonly seconds: number
  readonly milliseconds: number
  readonly microseconds: number
  readonly nanoseconds: number
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
| `create` | `(years?: number, months?: number, weeks?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number, microseconds?: number, nanoseconds?: number) => Record` |
| `fromFields` | `(fields: Partial<DurationFields>) => Record` |
| `fromString` | `(s: string) => Record` |

### Properties

| Function | Abbreviated signature |
| --- | --- |
| `sign` | `(duration: Record) => NumberSign` |
| `blank` | `(duration: Record) => boolean` |

### Field Replacement

| Function | Abbreviated signature |
| --- | --- |
| `withFields` | `(duration: Record, mod: Partial<DurationFields>) => Record` |

### Arithmetic And Comparison

| Function | Abbreviated signature |
| --- | --- |
| `negated` | `(duration: Record) => Record` |
| `abs` | `(duration: Record) => Record` |
| `add` | `(duration: Record, otherDuration: Record, options?: RelativeToOptions<RelativeTo>) => Record` |
| `subtract` | `(duration: Record, otherDuration: Record, options?: RelativeToOptions<RelativeTo>) => Record` |
| `round` | `(duration: Record, options: DurationRoundingOptions<RelativeTo>) => Record` |
| `total` | `(duration: Record, options: UnitName \| DurationTotalOptions<RelativeTo>) => number` |
| `compare` | `(duration: Record, otherDuration: Record, options?: RelativeToOptions<RelativeTo>) => NumberSign` |

### Formatting

| Function | Abbreviated signature |
| --- | --- |
| `toLocaleString` | `(duration: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string` |
| `toString` | `(duration: Record, options?: TimeDisplayOptions) => string` |
| `toSimpleString` | `(duration: Record) => string` |

```ts
import * as DurationFns from 'temporal-polyfill/fns/duration'

const duration = DurationFns.create(0, 0, 0, 0, 1, 30)

DurationFns.toString(duration) // "PT1H30M"
```
