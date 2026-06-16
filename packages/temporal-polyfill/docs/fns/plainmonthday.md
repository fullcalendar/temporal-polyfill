# PlainMonthDay Functional API

Public functions exported for `PlainMonthDay`.

Examples assume the functional API is imported as:

```ts
import * as PlainMonthDayFns from 'temporal-polyfill/fns/PlainMonthDay'
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
- [Comparison](#comparison)
  - [`equals`](#equals)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toBasicString`](#tobasicstring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)
- [Conversion](#conversion)
  - [`toPlainDate`](#toplaindate)
  - [`toNative`](#tonative)

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

The codemod examples assume the surrounding transform has already converted
`PlainMonthDayFns.Record` values into `Temporal.PlainMonthDay` instances.
Calendar records need a separate calendar transform: when a functional API call
receives a `CalendarRecord`, the real Temporal API normally wants the calendar
identifier or calendar-like value instead.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Fn API:

```ts
if (PlainMonthDayFns.isRecord(value)) {
  value.monthCode
}
```

Temporal API:

```ts
if (value instanceof Temporal.PlainMonthDay) {
  value.monthCode
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoMonth: number, isoDay: number, calendar?: CalendarRecord, referenceIsoYear?: number) => Record
```

Fn API:

```ts
const monthDay = PlainMonthDayFns.create(5, 1)
```

Temporal API:

```ts
const monthDay = new Temporal.PlainMonthDay(5, 1)
```

If the optional calendar argument is present, replace a known `CalendarRecord`
expression with its calendar identifier. Preserve `referenceIsoYear` as the
fourth constructor argument when present.

### `fromFields`

Signature:

```ts
(fields: Partial<MonthDayFields> & { calendar?: CalendarRecord }, options?: OverflowOptions) => Record
```

Fn API:

```ts
const monthDay = PlainMonthDayFns.fromFields(fields, options)
```

Temporal API:

```ts
const monthDay = Temporal.PlainMonthDay.from(fields, options)
```

If `fields.calendar` is still a `CalendarRecord`, replace it with the calendar
identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record
```

Fn API:

```ts
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'

const monthDay = PlainMonthDayFns.fromString(
  '1972-05-01[u-ca=gregory]',
  CalendarFns.getBasic,
)
```

Temporal API:

```ts
const monthDay = Temporal.PlainMonthDay.from('1972-05-01[u-ca=gregory]')
```

Pass `getCalendar` to resolve the string's `[u-ca=…]` annotation into a
`CalendarRecord`. Most callers supply
[`getBasic`](calendar.md#getbasic) (ISO and Gregorian only) or
[`getAny`](calendar.md#getany) (also exotic calendars); see the
[Calendar docs](calendar.md) for the full set of resolvers.

The resolver argument has no direct counterpart and can usually be dropped once
its import or local binding is unused.

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<MonthDayFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextMonthDay = PlainMonthDayFns.withFields(monthDay, fields, options)
```

Temporal API:

```ts
const nextMonthDay = monthDay.with(fields, options)
```

## Comparison

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Fn API:

```ts
const same = PlainMonthDayFns.equals(monthDay, otherMonthDay)
```

Temporal API:

```ts
const same = monthDay.equals(otherMonthDay)
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: CalendarDisplayOptions) => string
```

Fn API:

```ts
const text = PlainMonthDayFns.toString(monthDay, options)
```

Temporal API:

```ts
const text = monthDay.toString(options)
```

If you aren't passing any display options, use [`toBasicString`](#tobasicstring) instead — it yields the same string and tree-shakes to a smaller bundle.

### `toBasicString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = PlainMonthDayFns.toBasicString(monthDay)
```

Temporal API:

```ts
const text = monthDay.toString()
```

Prefer `toBasicString` over [`toString`](#tostring) when you don't need display options. It returns the same string as `toString` called with no options, but pulls in none of the option-handling code, so it tree-shakes to a smaller bundle.

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = PlainMonthDayFns.toLocaleString(monthDay, locales, options)
```

Temporal API:

```ts
const text = monthDay.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = PlainMonthDayFns.createFormat('en-US', {
  month: 'long',
  day: 'numeric',
})
const text = format.format(monthDay)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
})
const text = format.format(monthDay)
```

This rewrite is appropriate when later uses rely on `format.format(monthDay)`.

## Conversion

### `toPlainDate`

Signature:

```ts
(record: Record, fields: EraYearOrYear) => PlainDateRecord
```

Fn API:

```ts
const date = PlainMonthDayFns.toPlainDate(monthDay, { year: 2024 })
```

Temporal API:

```ts
const date = monthDay.toPlainDate({ year: 2024 })
```

### `toNative`

Signature:

```ts
(record: Record) => Temporal.PlainMonthDay
```

Fn API:

```ts
const native = PlainMonthDayFns.toNative(monthDay)
```

Temporal API:

```ts
const native = monthDay
```

Produces a real `Temporal.PlainMonthDay` built directly from the record's ISO
date slots (including the reference ISO year) and `calendarId`, with no string
round-trip. The native constructor comes from `globalThis.Temporal`; `toNative`
throws when no global `Temporal` is present. Because a migrated record is already
a `Temporal.PlainMonthDay`, the codemod rewrites the entire call to the bare
record expression.
