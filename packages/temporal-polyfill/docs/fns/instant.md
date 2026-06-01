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
  - [`roundToHour`](#roundtohour)
  - [`roundToMinute`](#roundtominute)
  - [`roundToSecond`](#roundtosecond)
  - [`roundToMillisecond`](#roundtomillisecond)
  - [`roundToMicrosecond`](#roundtomicrosecond)
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
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const hours = InstantFns.diffHours(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffHours } from 'temporal-utils'

const hours = diffHours(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

### `diffMinutes`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const minutes = InstantFns.diffMinutes(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffMinutes } from 'temporal-utils'

const minutes = diffMinutes(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

### `diffSeconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const seconds = InstantFns.diffSeconds(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffSeconds } from 'temporal-utils'

const seconds = diffSeconds(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

### `diffMilliseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const milliseconds = InstantFns.diffMilliseconds(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffMilliseconds } from 'temporal-utils'

const milliseconds = diffMilliseconds(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

### `diffMicroseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const microseconds = InstantFns.diffMicroseconds(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffMicroseconds } from 'temporal-utils'

const microseconds = diffMicroseconds(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

### `diffNanoseconds`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingMathOptions | RoundingModeName) => number
```

Fn API:

```ts
const nanoseconds = InstantFns.diffNanoseconds(instant, otherInstant, options)
```

Temporal API:

```ts
import { diffNanoseconds } from 'temporal-utils'

const nanoseconds = diffNanoseconds(instant, otherInstant, options)
```

If `options` is omitted, no rounding occurs.

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
(record: Record, otherRecord: Record) => number
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

`RoundingMathOptions` must not include `smallestUnit`. Pass a `RoundingModeName`
string as shorthand for `options.roundingMode`.

### `roundToHour`

Signature:

```ts
(record: Record, options?: RoundingMathOptions | RoundingModeName) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.roundToHour(instant)
const nextInstant = InstantFns.roundToHour(instant, 'ceil')
const nextInstant = InstantFns.roundToHour(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round({ smallestUnit: 'hour' })
const nextInstant = instant.round({ roundingMode: 'ceil', smallestUnit: 'hour' })
const nextInstant = instant.round({ ...options, smallestUnit: 'hour' })
```

Temporal API, generically, for second argument:

```ts
import { roundToHour } from 'temporal-utils'

const nextInstant = roundToHour(instant, optionsOrRoundingMode)
```

### `roundToMinute`

Signature:

```ts
(record: Record, options?: RoundingMathOptions | RoundingModeName) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.roundToMinute(instant)
const nextInstant = InstantFns.roundToMinute(instant, 'ceil')
const nextInstant = InstantFns.roundToMinute(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round({ smallestUnit: 'minute' })
const nextInstant = instant.round({ roundingMode: 'ceil', smallestUnit: 'minute' })
const nextInstant = instant.round({ ...options, smallestUnit: 'minute' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMinute } from 'temporal-utils'

const nextInstant = roundToMinute(instant, optionsOrRoundingMode)
```

### `roundToSecond`

Signature:

```ts
(record: Record, options?: RoundingMathOptions | RoundingModeName) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.roundToSecond(instant)
const nextInstant = InstantFns.roundToSecond(instant, 'ceil')
const nextInstant = InstantFns.roundToSecond(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round({ smallestUnit: 'second' })
const nextInstant = instant.round({ roundingMode: 'ceil', smallestUnit: 'second' })
const nextInstant = instant.round({ ...options, smallestUnit: 'second' })
```

Temporal API, generically, for second argument:

```ts
import { roundToSecond } from 'temporal-utils'

const nextInstant = roundToSecond(instant, optionsOrRoundingMode)
```

### `roundToMillisecond`

Signature:

```ts
(record: Record, options?: RoundingMathOptions | RoundingModeName) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.roundToMillisecond(instant)
const nextInstant = InstantFns.roundToMillisecond(instant, 'ceil')
const nextInstant = InstantFns.roundToMillisecond(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round({ smallestUnit: 'millisecond' })
const nextInstant = instant.round({ roundingMode: 'ceil', smallestUnit: 'millisecond' })
const nextInstant = instant.round({ ...options, smallestUnit: 'millisecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMillisecond } from 'temporal-utils'

const nextInstant = roundToMillisecond(instant, optionsOrRoundingMode)
```

### `roundToMicrosecond`

Signature:

```ts
(record: Record, options?: RoundingMathOptions | RoundingModeName) => Record
```

Fn API:

```ts
const nextInstant = InstantFns.roundToMicrosecond(instant)
const nextInstant = InstantFns.roundToMicrosecond(instant, 'ceil')
const nextInstant = InstantFns.roundToMicrosecond(instant, options)
```

Temporal API:

```ts
const nextInstant = instant.round({ smallestUnit: 'microsecond' })
const nextInstant = instant.round({ roundingMode: 'ceil', smallestUnit: 'microsecond' })
const nextInstant = instant.round({ ...options, smallestUnit: 'microsecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMicrosecond } from 'temporal-utils'

const nextInstant = roundToMicrosecond(instant, optionsOrRoundingMode)
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
