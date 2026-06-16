# Duration Functional API

Public functions exported for `Duration`.

Examples assume the functional API is imported as:

```ts
import * as DurationFns from 'temporal-polyfill/fns/Duration'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromFields`](#fromfields)
  - [`fromString`](#fromstring)
- [Properties](#properties)
  - [`sign`](#sign)
  - [`blank`](#blank)
- [Field Replacement](#field-replacement)
  - [`withFields`](#withfields)
- [Arithmetic](#arithmetic)
  - [`negated`](#negated)
  - [`abs`](#abs)
  - [`add`](#add)
  - [`subtract`](#subtract)
- [Rounding And Totaling](#rounding-and-totaling)
  - [`round`](#round)
  - [`total`](#total)
- [Comparison](#comparison)
  - [`compare`](#compare)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toBasicString`](#tobasicstring)
  - [`toLocaleString`](#tolocalestring)
- [Conversion](#conversion)
  - [`toNative`](#tonative)

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

The codemod examples assume the surrounding transform has already converted
`DurationFns.Record` values into `Temporal.Duration` instances. Relative-to
records in options need their own record-to-Temporal transform before being
passed to the real Temporal API.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (DurationFns.isRecord(value)) {
  value.hours
}
```

Temporal API:

```ts
if (value instanceof Temporal.Duration) {
  value.hours
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(years?: number, months?: number, weeks?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number, microseconds?: number, nanoseconds?: number) => Record
```

Fn API:

```ts
const duration = DurationFns.create(0, 0, 0, 0, 1, 30)
```

Temporal API:

```ts
const duration = new Temporal.Duration(0, 0, 0, 0, 1, 30)
```

### `fromFields`

Signature:

```ts
(fields: Partial<DurationFields>) => Record
```

Fn API:

```ts
const duration = DurationFns.fromFields(fields)
```

Temporal API:

```ts
const duration = Temporal.Duration.from(fields)
```

### `fromString`

Signature:

```ts
(s: string) => Record
```

Fn API:

```ts
const duration = DurationFns.fromString('PT1H30M')
```

Temporal API:

```ts
const duration = Temporal.Duration.from('PT1H30M')
```

## Properties

### `sign`

Signature:

```ts
(duration: Record) => number
```

Fn API:

```ts
const sign = DurationFns.sign(duration)
```

Temporal API:

```ts
const sign = duration.sign
```

### `blank`

Signature:

```ts
(duration: Record) => boolean
```

Fn API:

```ts
const blank = DurationFns.blank(duration)
```

Temporal API:

```ts
const blank = duration.blank
```

## Field Replacement

### `withFields`

Signature:

```ts
(duration: Record, mod: Partial<DurationFields>) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.withFields(duration, fields)
```

Temporal API:

```ts
const nextDuration = duration.with(fields)
```

## Arithmetic

### `negated`

Signature:

```ts
(duration: Record) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.negated(duration)
```

Temporal API:

```ts
const nextDuration = duration.negated()
```

### `abs`

Signature:

```ts
(duration: Record) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.abs(duration)
```

Temporal API:

```ts
const nextDuration = duration.abs()
```

### `add`

Signature:

```ts
(duration: Record, otherDuration: Record) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.add(duration, otherDuration)
```

Temporal API:

```ts
const nextDuration = duration.add(otherDuration)
```

Duration records and any `relativeTo` record need their own record-to-Temporal
transform.

### `subtract`

Signature:

```ts
(duration: Record, otherDuration: Record) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.subtract(duration, otherDuration)
```

Temporal API:

```ts
const nextDuration = duration.subtract(otherDuration)
```

Duration records and any `relativeTo` record need their own record-to-Temporal
transform.

## Rounding And Totaling

### `round`

Signature:

```ts
(duration: Record, options: DurationRoundingOptions<RelativeTo>) => Record
```

Fn API:

```ts
const nextDuration = DurationFns.round(duration, options)
```

Temporal API:

```ts
const nextDuration = duration.round(options)
```

Any `relativeTo` record in `options` needs its own record-to-Temporal transform.

### `total`

Signature:

```ts
(duration: Record, unit: UnitName) => number
(duration: Record, options: DurationTotalOptions<RelativeTo>) => number
```

Fn API:

```ts
const hours = DurationFns.total(duration, 'hours')
```

Temporal API:

```ts
const hours = duration.total('hours')
```

Any `relativeTo` record in an options object needs its own record-to-Temporal
transform.

## Comparison

### `compare`

Signature:

```ts
(duration: Record, otherDuration: Record, options?: RelativeToOptions<RelativeTo>) => number
```

Fn API:

```ts
const order = DurationFns.compare(duration, otherDuration, options)
```

Temporal API:

```ts
const order = Temporal.Duration.compare(duration, otherDuration, options)
```

Duration records and any `relativeTo` record need their own record-to-Temporal
transform.

## Formatting

### `toString`

Signature:

```ts
(duration: Record, options?: TimeDisplayOptions) => string
```

Fn API:

```ts
const text = DurationFns.toString(duration, options)
```

Temporal API:

```ts
const text = duration.toString(options)
```

If you aren't passing any display options, use [`toBasicString`](#tobasicstring) instead — it yields the same string and tree-shakes to a smaller bundle.

### `toBasicString`

Signature:

```ts
(duration: Record) => string
```

Fn API:

```ts
const text = DurationFns.toBasicString(duration)
```

Temporal API:

```ts
const text = duration.toString()
```

Prefer `toBasicString` over [`toString`](#tostring) when you don't need display options. It returns the same string as `toString` called with no options, but pulls in none of the option-handling code, so it tree-shakes to a smaller bundle.

### `toLocaleString`

Signature:

```ts
(duration: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = DurationFns.toLocaleString(duration, locales, options)
```

Temporal API:

```ts
const text = duration.toLocaleString(locales, options)
```

## Conversion

### `toNative`

Signature:

```ts
(record: Record) => Temporal.Duration
```

Fn API:

```ts
const native = DurationFns.toNative(duration)
```

Temporal API:

```ts
const native = duration
```

Produces a real `Temporal.Duration` built directly from the record's duration
fields. The native constructor comes from `globalThis.Temporal`; `toNative`
throws when no global `Temporal` is present. Because a migrated record is already
a `Temporal.Duration`, the codemod rewrites the entire call to the bare record
expression.
