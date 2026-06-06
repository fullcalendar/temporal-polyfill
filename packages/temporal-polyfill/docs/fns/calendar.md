# Calendar Functional API

Public functions exported for `Calendar`.

`CalendarRecord` is an opaque handle used by the functional API wherever a
calendar is needed. In the real Temporal API, the matching value is usually the
calendar identifier string itself.

Examples assume the functional API is imported as:

```ts
import * as CalendarFns from 'temporal-polyfill/fns/calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/plaindate'
```

## Contents

- [Record Shape](#record-shape)
- [Core & Aggregator Records](#core--aggregator-records)
  - [`getIso`](#getiso)
  - [`getGregory`](#getgregory)
  - [`getCore`](#getcore)
  - [`getExotic`](#getexotic)
  - [`getAny`](#getany)
- [Individual Calendar Records](#individual-calendar-records)
  - [`getBuddhist`](#getbuddhist)
  - [`getChinese`](#getchinese)
  - [`getDangi`](#getdangi)
  - [`getCoptic`](#getcoptic)
  - [`getEthiopic`](#getethiopic)
  - [`getEthiopicAmeteAlem`](#getethiopicametealem)
  - [`getHebrew`](#gethebrew)
  - [`getIndian`](#getindian)
  - [`getJapanese`](#getjapanese)
  - [`getIslamicCivil`](#getislamiccivil)
  - [`getIslamicTabular`](#getislamictabular)
  - [`getIslamicUmmAlQura`](#getislamicummalqura)
  - [`getPersian`](#getpersian)
  - [`getRoc`](#getroc)

## Record Shape

```ts
type CalendarRecord = {
  toJSON(): string
  valueOf(): string
}
```

The record has no public calendar fields. It is a branded handle that lets the
functional API keep calendar behavior tree-shakeable without exposing the
full Temporal object model.

Calendar records are memoized. Calendar IDs passed through `getExotic`
are normalized to lowercase, and both `toJSON()` and `valueOf()` return the
normalized calendar ID.

Each getter below pairs its functional-API usage with the equivalent real
Temporal API code, for readers curious how the two line up. In the real API a
`CalendarRecord` is just the calendar identifier string, passed straight to the
surrounding date, date-time, month-day, year-month, or zoned-date-time
operation.

## Core & Aggregator Records

These getters cover the two built-in core calendars plus the resolvers and
aggregators that accept a calendar ID at runtime. For a calendar that is known
at the call site, prefer one of the [individual calendar
records](#individual-calendar-records) instead.

### `getIso`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIso()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'iso8601'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getGregory`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getGregory()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'gregory'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getCore`

Signature:

```ts
(calendarId: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getCore('gregory')
const date = PlainDateFns.create(2024, 5, 1, calendar)
const parsed = PlainDateFns.fromString(
  '2024-05-01[u-ca=gregory]',
  CalendarFns.getCore,
)
```

Temporal API:

```ts
const calendar = 'gregory'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
const parsed = Temporal.PlainDate.from('2024-05-01[u-ca=gregory]')
```

`getCore` accepts only `iso8601` and `gregory`. When it is passed as a
resolver, the real Temporal parser owns the calendar annotation directly, as the
example above shows. Note that the bare string form has no equivalent of
`getCore`'s up-front check that the calendar is one of the two core IDs.

### `getExotic`

Signature:

```ts
(name: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getExotic('buddhist')
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'buddhist'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

For dynamic calendar IDs, the real Temporal equivalent is the same:

```ts
const calendar = calendarId
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

`getExotic` validates that `name` is one of the functional API's
supported Intl-backed calendars. It is the aggregator behind the [individual
calendar records](#individual-calendar-records) — each one takes no arguments
and returns the same memoized record as `getExotic` pinned to a fixed
calendar ID.

Because `getExotic` is reached with a runtime `name`, a bundler cannot
tell which calendar you will ask for, so it must keep the implementations of
*every* supported exotic calendar. The individual getters name a single calendar
statically, letting the bundler tree-shake away the calendars you never
reference. Prefer an individual getter when the calendar is known at the call
site, and reserve `getExotic(name)` for when the ID is only known
dynamically.

The bare string form preserves the calendar choice, but not that eager
validation: `getExotic(name)` throws immediately if `name` is
unsupported, whereas a bare string is not checked until Temporal actually uses
it to build or parse a value.

### `getAny`

Signature:

```ts
(calendarId: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getAny(calendarId)
const date = PlainDateFns.create(2024, 5, 1, calendar)
const parsed = PlainDateFns.fromString(
  '2024-05-01[u-ca=buddhist]',
  CalendarFns.getAny,
)
```

Temporal API:

```ts
const calendar = calendarId
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
const parsed = Temporal.PlainDate.from('2024-05-01[u-ca=buddhist]')
```

`getAny` returns the shared ISO or Gregorian records for core calendar
IDs, and otherwise falls through to `getExotic`. Because it can route to
any exotic calendar at runtime, it carries the same bundle cost as
`getExotic` — every supported calendar is retained. Prefer
`getCore` or an individual calendar record when the ID is known, and
reserve `getAny` for fully dynamic IDs. The bare string form keeps the
calendar selection but drops the functional API's memoized handle and
Intl-calendar validation.

## Individual Calendar Records

Each of these getters takes no arguments and returns the same memoized record as
`getExotic` pinned to a fixed calendar ID. Because they name a single
calendar statically, a bundler can tree-shake away every other calendar's
implementation — prefer them whenever the calendar is known at the call site.

### `getBuddhist`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getBuddhist()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'buddhist'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getChinese`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getChinese()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'chinese'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getDangi`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getDangi()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'dangi'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getCoptic`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getCoptic()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'coptic'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getEthiopic`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getEthiopic()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'ethiopic'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getEthiopicAmeteAlem`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getEthiopicAmeteAlem()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'ethioaa'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getHebrew`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getHebrew()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'hebrew'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getIndian`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIndian()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'indian'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getJapanese`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getJapanese()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'japanese'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getIslamicCivil`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIslamicCivil()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'islamic-civil'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getIslamicTabular`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIslamicTabular()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'islamic-tbla'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getIslamicUmmAlQura`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIslamicUmmAlQura()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'islamic-umalqura'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getPersian`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getPersian()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'persian'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getRoc`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getRoc()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'roc'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```
