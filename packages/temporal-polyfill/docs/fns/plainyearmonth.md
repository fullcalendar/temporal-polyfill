# PlainYearMonth Tree-shakeable API

Public functions exported for `PlainYearMonth`.

Examples assume the tree-shakeable API is imported as:

```ts
import * as PlainYearMonthFns from 'temporal-polyfill/fns/PlainYearMonth'
```

## Contents

- [Record Shape](#record-shape)
- [Type Guard](#type-guard)
  - [`isRecord`](#isrecord)
- [Construction And Parsing](#construction-and-parsing)
  - [`create`](#create)
  - [`fromFields`](#fromfields)
  - [`fromString`](#fromstring)
- [Calendar Properties](#calendar-properties)
  - [`daysInMonth`](#daysinmonth)
  - [`daysInYear`](#daysinyear)
  - [`monthsInYear`](#monthsinyear)
  - [`inLeapYear`](#inleapyear)
- [Field Replacement](#field-replacement)
  - [`withFields`](#withfields)
- [Arithmetic](#arithmetic)
  - [`add`](#add)
  - [`addYears`](#addyears)
  - [`addMonths`](#addmonths)
  - [`subtract`](#subtract)
  - [`subtractYears`](#subtractyears)
  - [`subtractMonths`](#subtractmonths)
- [Difference And Comparison](#difference-and-comparison)
  - [`diff`](#diff)
  - [`diffYears`](#diffyears)
  - [`diffMonths`](#diffmonths)
  - [`equals`](#equals)
  - [`compare`](#compare)
- [Rounding](#rounding)
  - [`roundToYear`](#roundtoyear)
- [Start And End Of Unit](#start-and-end-of-unit)
  - [`startOfYear`](#startofyear)
  - [`endOfYear`](#endofyear)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toBasicString`](#tobasicstring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)
- [Conversion](#conversion)
  - [`toPlainDate`](#toplaindate)
  - [`toTemporal`](#totemporal)

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

The codemod examples assume the surrounding transform has already converted
`PlainYearMonthFns.Record` values into `Temporal.PlainYearMonth` instances.
Calendar records need a separate calendar transform: when a tree-shakeable API call
receives a `CalendarFns.Record`, the real Temporal API normally wants the calendar
identifier or calendar-like value instead.

## Type Guard

### `isRecord`

Signature:

```ts
(arg: unknown) => arg is Record
```

Tree-shakeable API:

```ts
if (PlainYearMonthFns.isRecord(value)) {
  value.monthCode
}
```

Temporal API equivalent:

```ts
if (value instanceof Temporal.PlainYearMonth) {
  value.monthCode
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoYear: number, isoMonth: number, calendar?: CalendarFns.Record, referenceIsoDay?: number) => Record
```

Tree-shakeable API:

```ts
const yearMonth = PlainYearMonthFns.create(2026, 6)
```

Temporal API equivalent:

```ts
const yearMonth = new Temporal.PlainYearMonth(2026, 6)
```

If the optional calendar argument is present, replace a known `CalendarFns.Record` expression with its calendar identifier. Preserve `referenceIsoDay` as the fourth constructor argument when present.

### `fromFields`

Signature:

```ts
(fields: Partial<YearMonthFields> & { calendar?: CalendarFns.Record }, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const yearMonth = PlainYearMonthFns.fromFields(fields, options)
```

Temporal API equivalent:

```ts
const yearMonth = Temporal.PlainYearMonth.from(fields, options)
```

If `fields.calendar` is still a `CalendarFns.Record`, replace it with the calendar identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarFns.Record) => Record
```

Tree-shakeable API:

```ts
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'

const yearMonth = PlainYearMonthFns.fromString(
  '2026-06[u-ca=gregory]',
  CalendarFns.getBasic,
)
```

Temporal API equivalent:

```ts
const yearMonth = Temporal.PlainYearMonth.from('2026-06[u-ca=gregory]')
```

Pass `getCalendar` to resolve the string's `[u-ca=…]` annotation into a
`CalendarFns.Record`. Most callers supply
[`getBasic`](calendar.md#getbasic) (ISO and Gregorian only) or
[`getAny`](calendar.md#getany) (also exotic calendars); see the
[Calendar docs](calendar.md) for the full set of resolvers.

The resolver argument has no direct counterpart and can usually be dropped once its import or local binding is unused.

## Calendar Properties

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const daysInMonth = PlainYearMonthFns.daysInMonth(yearMonth)
```

Temporal API equivalent:

```ts
const daysInMonth = yearMonth.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const daysInYear = PlainYearMonthFns.daysInYear(yearMonth)
```

Temporal API equivalent:

```ts
const daysInYear = yearMonth.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Tree-shakeable API:

```ts
const monthsInYear = PlainYearMonthFns.monthsInYear(yearMonth)
```

Temporal API equivalent:

```ts
const monthsInYear = yearMonth.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Tree-shakeable API:

```ts
const inLeapYear = PlainYearMonthFns.inLeapYear(yearMonth)
```

Temporal API equivalent:

```ts
const inLeapYear = yearMonth.inLeapYear
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<YearMonthFields>, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.withFields(yearMonth, fields, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.with(fields, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationFns.Record, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.add(yearMonth, duration, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.add(duration, options)
```

Duration records need the same record-to-Temporal transform as year-month records.

### `addYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.addYears(yearMonth, years, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.add({ years }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.addMonths(yearMonth, months, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.add({ months }, options)
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationFns.Record, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.subtract(yearMonth, duration, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as year-month records.

### `subtractYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.subtractYears(yearMonth, years, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.subtract({ years }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.subtractMonths(yearMonth, months, options)
```

Temporal API equivalent:

```ts
const nextYearMonth = yearMonth.subtract({ months }, options)
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<YearMonthUnitName>) => DurationFns.Record
```

Tree-shakeable API:

```ts
const duration = PlainYearMonthFns.diff(yearMonth, otherYearMonth, options)
```

Temporal API equivalent:

```ts
const duration = yearMonth.until(otherYearMonth, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const years = PlainYearMonthFns.diffYears(yearMonth, otherYearMonth, options)
```

Temporal API equivalent:

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(yearMonth, otherYearMonth, options)
```

If `options` is omitted, no rounding occurs.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record) => number
(record0: Record, record1: Record, roundingMode: RoundingMode) => number
(record0: Record, record1: Record, options: RoundingMathOptions) => number
```

Tree-shakeable API:

```ts
const months = PlainYearMonthFns.diffMonths(yearMonth, otherYearMonth, options)
```

Temporal API equivalent:

```ts
import { diffMonths } from 'temporal-utils'

const months = diffMonths(yearMonth, otherYearMonth, options)
```

If `options` is omitted, no rounding occurs.

### `equals`

Signature:

```ts
(record: Record, otherRecord: Record) => boolean
```

Tree-shakeable API:

```ts
const same = PlainYearMonthFns.equals(yearMonth, otherYearMonth)
```

Temporal API equivalent:

```ts
const same = yearMonth.equals(otherYearMonth)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => number
```

Tree-shakeable API:

```ts
const order = PlainYearMonthFns.compare(yearMonth, otherYearMonth)
```

Temporal API equivalent:

```ts
const order = Temporal.PlainYearMonth.compare(yearMonth, otherYearMonth)
```

## Rounding

If `options` or `options.roundingMode` is omitted, the rounding mode defaults to `'halfExpand'`.
`RoundingMathOptions` must not include `smallestUnit`. Pass a `RoundingMode`
string as shorthand for `options.roundingMode`.

### `roundToYear`

Signature:

```ts
(record: Record) => Record
(record: Record, roundingMode: RoundingMode) => Record
(record: Record, options: RoundingMathOptions) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.roundToYear(yearMonth)
const nextYearMonth = PlainYearMonthFns.roundToYear(yearMonth, 'ceil')
const nextYearMonth = PlainYearMonthFns.roundToYear(yearMonth, options)
```

Temporal API equivalent:

```ts
import { roundToYear } from 'temporal-utils'

const nextYearMonth = roundToYear(yearMonth)
const nextYearMonth = roundToYear(yearMonth, 'ceil')
const nextYearMonth = roundToYear(yearMonth, options)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.startOfYear(yearMonth)
```

Temporal API equivalent:

```ts
import { startOfYear } from 'temporal-utils'

const nextYearMonth = startOfYear(yearMonth)
```

### `endOfYear`

Signature:

```ts
(record: Record) => Record
```

This returns the last month before the exclusive end of the unit.

Tree-shakeable API:

```ts
const nextYearMonth = PlainYearMonthFns.endOfYear(yearMonth)
```

Temporal API equivalent:

```ts
import { endOfYear } from 'temporal-utils'

const nextYearMonth = endOfYear(yearMonth)
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: CalendarDisplayOptions) => string
```

Tree-shakeable API:

```ts
const text = PlainYearMonthFns.toString(yearMonth, options)
```

Temporal API equivalent:

```ts
const text = yearMonth.toString(options)
```

If you aren't passing any display options, use [`toBasicString`](#tobasicstring) instead — it yields the same string and tree-shakes to a smaller bundle.

### `toBasicString`

Signature:

```ts
(record: Record) => string
```

Tree-shakeable API:

```ts
const text = PlainYearMonthFns.toBasicString(yearMonth)
```

Temporal API equivalent:

```ts
const text = yearMonth.toString()
```

Prefer `toBasicString` over [`toString`](#tostring) when you don't need display options. It returns the same string as `toString` called with no options, but pulls in none of the option-handling code, so it tree-shakes to a smaller bundle.

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Tree-shakeable API:

```ts
const text = PlainYearMonthFns.toLocaleString(yearMonth, locales, options)
```

Temporal API equivalent:

```ts
const text = yearMonth.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Tree-shakeable API:

```ts
const format = PlainYearMonthFns.createFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const text = format.format(yearMonth)
```

Temporal API equivalent:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const text = format.format(yearMonth)
```

This rewrite is appropriate when later uses rely on `format.format(yearMonth)`.

## Conversion

### `toPlainDate`

Signature:

```ts
(record: Record, fields: DayFields) => PlainDateFns.Record
```

Tree-shakeable API:

```ts
const date = PlainYearMonthFns.toPlainDate(yearMonth, { day: 1 })
```

Temporal API equivalent:

```ts
const date = yearMonth.toPlainDate({ day: 1 })
```

### `toTemporal`

Signature:

```ts
(record: Record) => Temporal.PlainYearMonth
```

Tree-shakeable API:

```ts
const realPlainYearMonth = PlainYearMonthFns.toTemporal(yearMonth)
```

Produces a real `Temporal.PlainYearMonth` built directly from the record's ISO
date slots (including the reference ISO day) and `calendarId`, with no string
round-trip. The constructor comes from the global `Temporal` at call time, so it
uses whatever implementation is installed — a host-native `Temporal` or any
polyfill (see [Temporal Interop](index.md#temporal-interop)) — and `toTemporal`
throws when no global `Temporal` is present.
