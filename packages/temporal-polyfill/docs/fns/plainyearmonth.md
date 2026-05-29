# PlainYearMonth Functional API

Public functions exported for `PlainYearMonth`.

Examples assume the functional API is imported as:

```ts
import * as PlainYearMonthFns from 'temporal-polyfill/fns/plainyearmonth'
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
- [Conversion](#conversion)
  - [`toPlainDate`](#toplaindate)
- [Formatting](#formatting)
  - [`toString`](#tostring)
  - [`toSimpleString`](#tosimplestring)
  - [`toLocaleString`](#tolocalestring)
  - [`createFormat`](#createformat)

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
if (PlainYearMonthFns.isRecord(value)) {
  value.monthCode
}
```

Temporal API:

```ts
if (value instanceof Temporal.PlainYearMonth) {
  value.monthCode
}
```

## Construction And Parsing

### `create`

Signature:

```ts
(isoYear: number, isoMonth: number, calendar?: CalendarRecord, referenceIsoDay?: number) => Record
```

Fn API:

```ts
const yearMonth = PlainYearMonthFns.create(2024, 5)
```

Temporal API:

```ts
const yearMonth = new Temporal.PlainYearMonth(2024, 5)
```

If the optional calendar argument is present, replace a known `CalendarRecord` expression with its calendar identifier. Preserve `referenceIsoDay` as the fourth constructor argument when present.

### `fromFields`

Signature:

```ts
(fields: Partial<YearMonthFields> & { calendar?: CalendarRecord }, options?: OverflowOptions) => Record
```

Fn API:

```ts
const yearMonth = PlainYearMonthFns.fromFields(fields, options)
```

Temporal API:

```ts
const yearMonth = Temporal.PlainYearMonth.from(fields, options)
```

If `fields.calendar` is still a `CalendarRecord`, replace it with the calendar identifier before calling the real Temporal API.

### `fromString`

Signature:

```ts
(s: string, getCalendar: (calendarId: string) => CalendarRecord) => Record
```

Fn API:

```ts
const yearMonth = PlainYearMonthFns.fromString(value, getCalendar)
```

Temporal API:

```ts
const yearMonth = Temporal.PlainYearMonth.from(value)
```

The resolver argument has no direct counterpart and can usually be dropped once its import or local binding is unused.

## Calendar Properties

### `daysInMonth`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInMonth = PlainYearMonthFns.daysInMonth(yearMonth)
```

Temporal API:

```ts
const daysInMonth = yearMonth.daysInMonth
```

### `daysInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const daysInYear = PlainYearMonthFns.daysInYear(yearMonth)
```

Temporal API:

```ts
const daysInYear = yearMonth.daysInYear
```

### `monthsInYear`

Signature:

```ts
(record: Record) => number
```

Fn API:

```ts
const monthsInYear = PlainYearMonthFns.monthsInYear(yearMonth)
```

Temporal API:

```ts
const monthsInYear = yearMonth.monthsInYear
```

### `inLeapYear`

Signature:

```ts
(record: Record) => boolean
```

Fn API:

```ts
const inLeapYear = PlainYearMonthFns.inLeapYear(yearMonth)
```

Temporal API:

```ts
const inLeapYear = yearMonth.inLeapYear
```

## Field Replacement

### `withFields`

Signature:

```ts
(record: Record, mod: Partial<YearMonthFields>, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.withFields(yearMonth, fields, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.with(fields, options)
```

## Arithmetic

### `add`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.add(yearMonth, duration, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.add(duration, options)
```

Duration records need the same record-to-Temporal transform as year-month records.

### `addYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.addYears(yearMonth, years, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.add({ years }, options)
```

### `addMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.addMonths(yearMonth, months, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.add({ months }, options)
```

### `subtract`

Signature:

```ts
(record: Record, duration: DurationRecord, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.subtract(yearMonth, duration, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.subtract(duration, options)
```

Duration records need the same record-to-Temporal transform as year-month records.

### `subtractYears`

Signature:

```ts
(record: Record, years: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.subtractYears(yearMonth, years, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.subtract({ years }, options)
```

### `subtractMonths`

Signature:

```ts
(record: Record, months: number, options?: OverflowOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.subtractMonths(yearMonth, months, options)
```

Temporal API:

```ts
const nextYearMonth = yearMonth.subtract({ months }, options)
```

## Difference And Comparison

### `diff`

Signature:

```ts
(record: Record, otherRecord: Record, options?: DiffOptions<YearMonthUnitName>) => DurationRecord
```

Fn API:

```ts
const duration = PlainYearMonthFns.diff(yearMonth, otherYearMonth, options)
```

Temporal API:

```ts
const duration = yearMonth.until(otherYearMonth, options)
```

This helper is directional: it matches `until`, not `since`.

### `diffYears`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingModeName | RoundingMathOptions) => number
```

Fn API:

```ts
const years = PlainYearMonthFns.diffYears(yearMonth, otherYearMonth, options)
```

Temporal API:

```ts
import { diffYears } from 'temporal-utils'

const years = diffYears(yearMonth, otherYearMonth, options)
```

If `options` is omitted, no rounding occurs.

### `diffMonths`

Signature:

```ts
(record0: Record, record1: Record, options?: RoundingModeName | RoundingMathOptions) => number
```

Fn API:

```ts
const months = PlainYearMonthFns.diffMonths(yearMonth, otherYearMonth, options)
```

Temporal API:

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

Fn API:

```ts
const same = PlainYearMonthFns.equals(yearMonth, otherYearMonth)
```

Temporal API:

```ts
const same = yearMonth.equals(otherYearMonth)
```

### `compare`

Signature:

```ts
(record: Record, otherRecord: Record) => NumberSign
```

Fn API:

```ts
const order = PlainYearMonthFns.compare(yearMonth, otherYearMonth)
```

Temporal API:

```ts
const order = Temporal.PlainYearMonth.compare(yearMonth, otherYearMonth)
```

## Rounding

### `roundToYear`

Signature:

```ts
(record: Record, options?: RoundOptions) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.roundToYear(yearMonth, options)
```

Temporal API:

```ts
import { roundToYear } from 'temporal-utils'

const nextYearMonth = roundToYear(yearMonth, options)
```

## Start And End Of Unit

### `startOfYear`

Signature:

```ts
(record: Record) => Record
```

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.startOfYear(yearMonth)
```

Temporal API:

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

Fn API:

```ts
const nextYearMonth = PlainYearMonthFns.endOfYear(yearMonth)
```

Temporal API:

```ts
import { endOfYear } from 'temporal-utils'

const nextYearMonth = endOfYear(yearMonth)
```

## Conversion

### `toPlainDate`

Signature:

```ts
(record: Record, fields: DayFields) => PlainDateRecord
```

Fn API:

```ts
const date = PlainYearMonthFns.toPlainDate(yearMonth, { day: 1 })
```

Temporal API:

```ts
const date = yearMonth.toPlainDate({ day: 1 })
```

## Formatting

### `toString`

Signature:

```ts
(record: Record, options?: CalendarDisplayOptions) => string
```

Fn API:

```ts
const text = PlainYearMonthFns.toString(yearMonth, options)
```

Temporal API:

```ts
const text = yearMonth.toString(options)
```

### `toSimpleString`

Signature:

```ts
(record: Record) => string
```

Fn API:

```ts
const text = PlainYearMonthFns.toSimpleString(yearMonth)
```

Temporal API:

```ts
const text = yearMonth.toString()
```

### `toLocaleString`

Signature:

```ts
(record: Record, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => string
```

Fn API:

```ts
const text = PlainYearMonthFns.toLocaleString(yearMonth, locales, options)
```

Temporal API:

```ts
const text = yearMonth.toLocaleString(locales, options)
```

### `createFormat`

Signature:

```ts
(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) => DateTimeFormatLike<Record>
```

Fn API:

```ts
const format = PlainYearMonthFns.createFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const text = format.format(yearMonth)
```

Temporal API:

```ts
const format = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const text = format.format(yearMonth)
```

This rewrite is appropriate when later uses rely on `format.format(yearMonth)`.
