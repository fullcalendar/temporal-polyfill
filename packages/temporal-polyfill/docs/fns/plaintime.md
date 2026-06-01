# PlainTime Functional API

Public functions exported for `PlainTime`.

Examples assume the functional API is imported as:

```ts
import * as PlainTimeFns from 'temporal-polyfill/fns/plaintime'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromFields`](#fromfields)
  - [`fromString`](#fromstring)
- [Field Replacement](#field-replacement)
  - [`withFields`](#withfields)
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
- [Start And End Of Unit](#start-and-end-of-unit)
  - [`startOfHour`](#startofhour)
  - [`startOfMinute`](#startofminute)
  - [`startOfSecond`](#startofsecond)
  - [`startOfMillisecond`](#startofmillisecond)
  - [`startOfMicrosecond`](#startofmicrosecond)
  - [`endOfHour`](#endofhour)
  - [`endOfMinute`](#endofminute)
  - [`endOfSecond`](#endofsecond)
  - [`endOfMillisecond`](#endofmillisecond)
  - [`endOfMicrosecond`](#endofmicrosecond)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toSimpleString`](#tosimplestring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)

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

The codemod examples assume the surrounding transform has already converted
`PlainTimeFns.Record` values into `Temporal.PlainTime` instances.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (PlainTimeFns.isRecord(value)) {
  value.hour
}
```

Temporal API:

```ts
if (value instanceof Temporal.PlainTime) {
  value.hour
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(hour?: number, minute?: number, second?: number, millisecond?: number, microsecond?: number, nanosecond?: number) => Record
```

Fn API:

```ts
const time = PlainTimeFns.create(9, 30)
```

Temporal API:

```ts
const time = new Temporal.PlainTime(9, 30)
```

### `fromFields`

Signature:

```ts
(fields: Partial<TimeFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const time = PlainTimeFns.fromFields(fields, options)
```

Temporal API:

```ts
const time = Temporal.PlainTime.from(fields, options)
```

### `fromString`

Signature:

```ts
(s: string) => Record
```

Fn API:

```ts
const time = PlainTimeFns.fromString(value)
```

Temporal API:

```ts
const time = Temporal.PlainTime.from(value)
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<TimeFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.withFields(time, fields, options)
```

Temporal API:

```ts
const nextTime = time.with(fields, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationRecord) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.add(time, duration)
```

Temporal API:

```ts
const nextTime = time.add(duration)
```

Duration records need the same record-to-Temporal transform as time records.

### `addHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addHours(time, hours)
```

Temporal API:

```ts
const nextTime = time.add({ hours })
```

### `addMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addMinutes(time, minutes)
```

Temporal API:

```ts
const nextTime = time.add({ minutes })
```

### `addSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addSeconds(time, seconds)
```

Temporal API:

```ts
const nextTime = time.add({ seconds })
```

### `addMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addMilliseconds(time, milliseconds)
```

Temporal API:

```ts
const nextTime = time.add({ milliseconds })
```

### `addMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addMicroseconds(time, microseconds)
```

Temporal API:

```ts
const nextTime = time.add({ microseconds })
```

### `addNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.addNanoseconds(time, nanoseconds)
```

Temporal API:

```ts
const nextTime = time.add({ nanoseconds })
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationRecord) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtract(time, duration)
```

Temporal API:

```ts
const nextTime = time.subtract(duration)
```

Duration records need the same record-to-Temporal transform as time records.

### `subtractHours`

Signature:

```ts
(record: Record, hours: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractHours(time, hours)
```

Temporal API:

```ts
const nextTime = time.subtract({ hours })
```

### `subtractMinutes`

Signature:

```ts
(record: Record, minutes: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractMinutes(time, minutes)
```

Temporal API:

```ts
const nextTime = time.subtract({ minutes })
```

### `subtractSeconds`

Signature:

```ts
(record: Record, seconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractSeconds(time, seconds)
```

Temporal API:

```ts
const nextTime = time.subtract({ seconds })
```

### `subtractMilliseconds`

Signature:

```ts
(record: Record, milliseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractMilliseconds(time, milliseconds)
```

Temporal API:

```ts
const nextTime = time.subtract({ milliseconds })
```

### `subtractMicroseconds`

Signature:

```ts
(record: Record, microseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractMicroseconds(time, microseconds)
```

Temporal API:

```ts
const nextTime = time.subtract({ microseconds })
```

### `subtractNanoseconds`

Signature:

```ts
(record: Record, nanoseconds: number) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.subtractNanoseconds(time, nanoseconds)
```

Temporal API:

```ts
const nextTime = time.subtract({ nanoseconds })
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<TimeUnitName>) => DurationRecord
```

Fn API:

```ts
const duration = PlainTimeFns.diff(time, otherTime, options)
```

Temporal API:

```ts
const duration = time.until(otherTime, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffHours`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const hours = PlainTimeFns.diffHours(time, otherTime, options)
```

Temporal API:

```ts
import { diffHours } from 'temporal-utils'

const hours = diffHours(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMinutes`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const minutes = PlainTimeFns.diffMinutes(time, otherTime, options)
```

Temporal API:

```ts
import { diffMinutes } from 'temporal-utils'

const minutes = diffMinutes(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffSeconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const seconds = PlainTimeFns.diffSeconds(time, otherTime, options)
```

Temporal API:

```ts
import { diffSeconds } from 'temporal-utils'

const seconds = diffSeconds(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMilliseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const milliseconds = PlainTimeFns.diffMilliseconds(time, otherTime, options)
```

Temporal API:

```ts
import { diffMilliseconds } from 'temporal-utils'

const milliseconds = diffMilliseconds(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffMicroseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const microseconds = PlainTimeFns.diffMicroseconds(time, otherTime, options)
```

Temporal API:

```ts
import { diffMicroseconds } from 'temporal-utils'

const microseconds = diffMicroseconds(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `diffNanoseconds`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Fn API:

```ts
const nanoseconds = PlainTimeFns.diffNanoseconds(time, otherTime, options)
```

Temporal API:

```ts
import { diffNanoseconds } from 'temporal-utils'

const nanoseconds = diffNanoseconds(time, otherTime, options)
```

If `options` is omitted, no rounding occurs.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = PlainTimeFns.equals(time, otherTime)
```

Temporal API:

```ts
const same = time.equals(otherTime)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => number
```

Fn API:

```ts
const order = PlainTimeFns.compare(time, otherTime)
```

Temporal API:

```ts
const order = Temporal.PlainTime.compare(time, otherTime)
```

## Rounding

`RoundingMathOptions` must not include `smallestUnit`. Pass a `RoundingMode`
string as shorthand for `options.roundingMode`.

### `roundToHour`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.roundToHour(time)
const nextTime = PlainTimeFns.roundToHour(time, 'ceil')
const nextTime = PlainTimeFns.roundToHour(time, options)
```

Temporal API:

```ts
const nextTime = time.round({ smallestUnit: 'hour' })
const nextTime = time.round({ roundingMode: 'ceil', smallestUnit: 'hour' })
const nextTime = time.round({ ...options, smallestUnit: 'hour' })
```

Temporal API, generically, for second argument:

```ts
import { roundToHour } from 'temporal-utils'

const nextTime = roundToHour(time, roundingModeOrOptions)
```

### `roundToMinute`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.roundToMinute(time)
const nextTime = PlainTimeFns.roundToMinute(time, 'ceil')
const nextTime = PlainTimeFns.roundToMinute(time, options)
```

Temporal API:

```ts
const nextTime = time.round({ smallestUnit: 'minute' })
const nextTime = time.round({ roundingMode: 'ceil', smallestUnit: 'minute' })
const nextTime = time.round({ ...options, smallestUnit: 'minute' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMinute } from 'temporal-utils'

const nextTime = roundToMinute(time, roundingModeOrOptions)
```

### `roundToSecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.roundToSecond(time)
const nextTime = PlainTimeFns.roundToSecond(time, 'ceil')
const nextTime = PlainTimeFns.roundToSecond(time, options)
```

Temporal API:

```ts
const nextTime = time.round({ smallestUnit: 'second' })
const nextTime = time.round({ roundingMode: 'ceil', smallestUnit: 'second' })
const nextTime = time.round({ ...options, smallestUnit: 'second' })
```

Temporal API, generically, for second argument:

```ts
import { roundToSecond } from 'temporal-utils'

const nextTime = roundToSecond(time, roundingModeOrOptions)
```

### `roundToMillisecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.roundToMillisecond(time)
const nextTime = PlainTimeFns.roundToMillisecond(time, 'ceil')
const nextTime = PlainTimeFns.roundToMillisecond(time, options)
```

Temporal API:

```ts
const nextTime = time.round({ smallestUnit: 'millisecond' })
const nextTime = time.round({ roundingMode: 'ceil', smallestUnit: 'millisecond' })
const nextTime = time.round({ ...options, smallestUnit: 'millisecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMillisecond } from 'temporal-utils'

const nextTime = roundToMillisecond(time, roundingModeOrOptions)
```

### `roundToMicrosecond`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.roundToMicrosecond(time)
const nextTime = PlainTimeFns.roundToMicrosecond(time, 'ceil')
const nextTime = PlainTimeFns.roundToMicrosecond(time, options)
```

Temporal API:

```ts
const nextTime = time.round({ smallestUnit: 'microsecond' })
const nextTime = time.round({ roundingMode: 'ceil', smallestUnit: 'microsecond' })
const nextTime = time.round({ ...options, smallestUnit: 'microsecond' })
```

Temporal API, generically, for second argument:

```ts
import { roundToMicrosecond } from 'temporal-utils'

const nextTime = roundToMicrosecond(time, roundingModeOrOptions)
```

## Start And End Of Unit

### `startOfHour`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.startOfHour(time)
```

Temporal API:

```ts
import { startOfHour } from 'temporal-utils'

const nextTime = startOfHour(time)
```

### `startOfMinute`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.startOfMinute(time)
```

Temporal API:

```ts
import { startOfMinute } from 'temporal-utils'

const nextTime = startOfMinute(time)
```

### `startOfSecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.startOfSecond(time)
```

Temporal API:

```ts
import { startOfSecond } from 'temporal-utils'

const nextTime = startOfSecond(time)
```

### `startOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.startOfMillisecond(time)
```

Temporal API:

```ts
import { startOfMillisecond } from 'temporal-utils'

const nextTime = startOfMillisecond(time)
```

### `startOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextTime = PlainTimeFns.startOfMicrosecond(time)
```

Temporal API:

```ts
import { startOfMicrosecond } from 'temporal-utils'

const nextTime = startOfMicrosecond(time)
```

### `endOfHour`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextTime = PlainTimeFns.endOfHour(time)
```

Temporal API:

```ts
import { endOfHour } from 'temporal-utils'

const nextTime = endOfHour(time)
```

### `endOfMinute`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextTime = PlainTimeFns.endOfMinute(time)
```

Temporal API:

```ts
import { endOfMinute } from 'temporal-utils'

const nextTime = endOfMinute(time)
```

### `endOfSecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextTime = PlainTimeFns.endOfSecond(time)
```

Temporal API:

```ts
import { endOfSecond } from 'temporal-utils'

const nextTime = endOfSecond(time)
```

### `endOfMillisecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextTime = PlainTimeFns.endOfMillisecond(time)
```

Temporal API:

```ts
import { endOfMillisecond } from 'temporal-utils'

const nextTime = endOfMillisecond(time)
```

### `endOfMicrosecond`

Signature:

```ts
(record: Record) => Record
```

This returns the last representable nanosecond before the exclusive end of the unit.

Fn API:

```ts
const nextTime = PlainTimeFns.endOfMicrosecond(time)
```

Temporal API:

```ts
import { endOfMicrosecond } from 'temporal-utils'

const nextTime = endOfMicrosecond(time)
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: TimeDisplayOptions) => string
```

Fn API:

```ts
const text = PlainTimeFns.toString(time, options)
```

Temporal API:

```ts
const text = time.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = PlainTimeFns.toSimpleString(time)
```

Temporal API:

```ts
const text = time.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = PlainTimeFns.toLocaleString(time, locales, options)
```

Temporal API:

```ts
const text = time.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = PlainTimeFns.createFormat('en-US', { timeStyle: 'short' })
const text = format.format(time)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' })
const text = format.format(time)
```

This rewrite is appropriate when later uses rely on `format.format(time)`.
