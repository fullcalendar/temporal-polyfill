# Instant Functional API

Public functions exported for `Instant`.

Examples assume the functional API is imported as:

```ts
import * as InstantFns from 'temporal-polyfill/fns/instant'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromEpochMilliseconds`](#fromepochmilliseconds)
  - [`fromEpochNanoseconds`](#fromepochnanoseconds)
  - [`fromString`](#fromstring)
- [Arithmetic](#arithmetic)
  - [`add`](#add)
  - [`addHours`](#addhours)
  - [`addMinutes`](#addminutes)
  - [`addSeconds`](#addseconds)
  - [`addMilliseconds`](#addmilliseconds)
  - [`addMicroseconds`](#addmicroseconds)
  - [`addNanoseconds`](#addnanoseconds)
  - [`subtract`](#subtract)
  - [`subtractHours`](#subtracthours)
  - [`subtractMinutes`](#subtractminutes)
  - [`subtractSeconds`](#subtractseconds)
  - [`subtractMilliseconds`](#subtractmilliseconds)
  - [`subtractMicroseconds`](#subtractmicroseconds)
  - [`subtractNanoseconds`](#subtractnanoseconds)
- [Difference And Comparison](#difference-and-comparison)
  - [`diff`](#diff)
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
- [Conversion](#conversion)
  - [`toZonedDateTimeISO`](#tozoneddatetimeiso)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toSimpleString`](#tosimplestring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)

## Record Shape

```ts
type Record = {
  readonly epochMilliseconds: number
  readonly epochNanoseconds: bigint
  toJSON(): string
  valueOf(): never
}
```

The codemod examples assume the surrounding transform has already converted
`InstantFns.Record` values into `Temporal.Instant` instances.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (InstantFns.isRecord(value)) {
  value.epochNanoseconds
}
```

Temporal API:

```ts
if (value instanceof Temporal.Instant) {
  value.epochNanoseconds
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(epochNanoseconds: bigint) => Record
```

Fn API:

```ts
const instant = InstantFns.create(1714570200000000000n)
```

Temporal API:

```ts
const instant = new Temporal.Instant(1714570200000000000n)
```

### `fromEpochMilliseconds`

Signature:

```ts
(epochMilliseconds: number) => Record
```

Fn API:

```ts
const instant = InstantFns.fromEpochMilliseconds(1714570200000)
```

Temporal API:

```ts
const instant = Temporal.Instant.fromEpochMilliseconds(1714570200000)
```

### `fromEpochNanoseconds`

Signature:

```ts
(epochNanoseconds: bigint) => Record
```

Fn API:

```ts
const instant = InstantFns.fromEpochNanoseconds(1714570200000000000n)
```

Temporal API:

```ts
const instant = Temporal.Instant.fromEpochNanoseconds(1714570200000000000n)
```

### `fromString`

Signature:

```ts
(s: string) => Record
```

Fn API:

```ts
const instant = InstantFns.fromString('2024-05-01T13:30:00Z')
```

Temporal API:

```ts
const instant = Temporal.Instant.from('2024-05-01T13:30:00Z')
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, durationRecord: DurationRecord) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.add(instant, duration)
```

Temporal API:

```ts
const nextInstant = instant.add(duration)
```

Duration records need the same record-to-Temporal transform as instant records.

### `addHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addHours(instant, hours)
```

Temporal API:

```ts
const nextInstant = instant.add({ hours })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `addMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addMinutes(instant, minutes)
```

Temporal API:

```ts
const nextInstant = instant.add({ minutes })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `addSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addSeconds(instant, seconds)
```

Temporal API:

```ts
const nextInstant = instant.add({ seconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `addMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addMilliseconds(instant, milliseconds)
```

Temporal API:

```ts
const nextInstant = instant.add({ milliseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `addMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addMicroseconds(instant, microseconds)
```

Temporal API:

```ts
const nextInstant = instant.add({ microseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `addNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.addNanoseconds(instant, nanoseconds)
```

Temporal API:

```ts
const nextInstant = instant.add({ nanoseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtract`

Signature:

```ts
(record: Record, durationRecord: DurationRecord) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtract(instant, duration)
```

Temporal API:

```ts
const nextInstant = instant.subtract(duration)
```

Duration records need the same record-to-Temporal transform as instant records.

### `subtractHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractHours(instant, hours)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ hours })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtractMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractMinutes(instant, minutes)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ minutes })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtractSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractSeconds(instant, seconds)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ seconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtractMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractMilliseconds(instant, milliseconds)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ milliseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtractMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractMicroseconds(instant, microseconds)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ microseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

### `subtractNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.subtractNanoseconds(instant, nanoseconds)
```

Temporal API:

```ts
const nextInstant = instant.subtract({ nanoseconds })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<TimeUnitName>) => DurationRecord
```

Fn API:

```ts
const duration = InstantFns.diff(instant, otherInstant, options)
```

Temporal API:

```ts
const duration = instant.until(otherInstant, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffHours`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const hours = InstantFns.diffHours(instant, otherInstant, options)
```

Temporal API:

```ts
const hours = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'hours',
  })
  .total({ unit: 'hours' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `diffMinutes`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const minutes = InstantFns.diffMinutes(instant, otherInstant, options)
```

Temporal API:

```ts
const minutes = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'minutes',
  })
  .total({ unit: 'minutes' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `diffSeconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const seconds = InstantFns.diffSeconds(instant, otherInstant, options)
```

Temporal API:

```ts
const seconds = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'seconds',
  })
  .total({ unit: 'seconds' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `diffMilliseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const milliseconds = InstantFns.diffMilliseconds(instant, otherInstant, options)
```

Temporal API:

```ts
const milliseconds = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'milliseconds',
  })
  .total({ unit: 'milliseconds' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `diffMicroseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const microseconds = InstantFns.diffMicroseconds(instant, otherInstant, options)
```

Temporal API:

```ts
const microseconds = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'microseconds',
  })
  .total({ unit: 'microseconds' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `diffNanoseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundOptions) => number
```

Fn API:

```ts
const nanoseconds = InstantFns.diffNanoseconds(instant, otherInstant, options)
```

Temporal API:

```ts
const nanoseconds = instant
  .until(otherInstant, {
    ...(typeof options === 'string' ? { roundingMode: options } : options),
    largestUnit: 'nanoseconds',
  })
  .total({ unit: 'nanoseconds' })
```

TODO: This helper does not exist yet in the functional API. The example assumes the intended future helper shape.

This should preserve exact totals when no rounding mode is provided.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = InstantFns.equals(instant, otherInstant)
```

Temporal API:

```ts
const same = instant.equals(otherInstant)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => NumberSign
```

Fn API:

```ts
const order = InstantFns.compare(instant, otherInstant)
```

Temporal API:

```ts
const order = Temporal.Instant.compare(instant, otherInstant)
```

## Rounding

### `round`

Signature:

```ts
(record: Record, options: TimeUnitName | RoundingOptions<TimeUnitName>) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.round(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round(options)
```

## Conversion

### `toZonedDateTimeISO`

Signature:

```ts
(record: Record, timeZoneId: string) => ZonedDateTimeRecord
```

Fn API:

```ts
const zonedDateTime = InstantFns.toZonedDateTimeISO(instant, timeZoneId)
```

Temporal API:

```ts
const zonedDateTime = instant.toZonedDateTimeISO(timeZoneId)
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: InstantDisplayOptions) => string
```

Fn API:

```ts
const text = InstantFns.toString(instant, options)
```

Temporal API:

```ts
const text = instant.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = InstantFns.toSimpleString(instant)
```

Temporal API:

```ts
const text = instant.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = InstantFns.toLocaleString(instant, locales, options)
```

Temporal API:

```ts
const text = instant.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = InstantFns.createFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})
const text = format.format(instant)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})
const text = format.format(instant)
```

This rewrite is appropriate when later uses rely on `format.format(instant)`.
