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
- [Calendar Records](#calendar-records)
  - [`getIsoCalendar`](#getisocalendar)
  - [`getGregoryCalendar`](#getgregorycalendar)
  - [`getExoticCalendar`](#getexoticcalendar)
  - [`getCoreCalendar`](#getcorecalendar)
  - [`getAnyCalendar`](#getanycalendar)

## Record Shape

```ts
type CalendarRecord = {
  toJSON(): string
  valueOf(): never
}
```

The record has no public calendar fields. It is a branded handle that lets the
functional API keep calendar behavior tree-shakeable without exposing the
full Temporal object model.

Calendar records are memoized. Calendar IDs passed through `getExoticCalendar`
are normalized to lowercase, and `toJSON()` returns the normalized calendar ID.

Codemods should usually replace a `CalendarRecord` value with the equivalent
calendar identifier string before rewriting the surrounding date, date-time,
month-day, year-month, or zoned-date-time operation to the real Temporal API.

## Calendar Records

### `getIsoCalendar`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getIsoCalendar()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'iso8601'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getGregoryCalendar`

Signature:

```ts
() => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getGregoryCalendar()
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'gregory'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

### `getExoticCalendar`

Signature:

```ts
(calendarId: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getExoticCalendar('buddhist')
const date = PlainDateFns.create(2024, 5, 1, calendar)
```

Temporal API:

```ts
const calendar = 'buddhist'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

For dynamic calendar IDs, the codemod shape is the same:

```ts
const calendar = calendarId
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
```

`getExoticCalendar` validates that the calendar is one of the functional API's
supported Intl-backed calendars. A direct rewrite to a string preserves the
calendar choice, but it does not preserve that eager validation boundary.

### `getCoreCalendar`

Signature:

```ts
(calendarId: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getCoreCalendar('gregory')
const date = PlainDateFns.create(2024, 5, 1, calendar)
const parsed = PlainDateFns.fromString(
  '2024-05-01[u-ca=gregory]',
  CalendarFns.getCoreCalendar,
)
```

Temporal API:

```ts
const calendar = 'gregory'
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
const parsed = Temporal.PlainDate.from('2024-05-01[u-ca=gregory]')
```

`getCoreCalendar` accepts only `iso8601` and `gregory`. When it appears as a
resolver argument, the real Temporal parser can usually own the calendar
annotation directly. If the explicit core-calendar validation matters, preserve
that validation around the rewritten code.

### `getAnyCalendar`

Signature:

```ts
(calendarId: string) => CalendarRecord
```

Fn API:

```ts
const calendar = CalendarFns.getAnyCalendar(calendarId)
const date = PlainDateFns.create(2024, 5, 1, calendar)
const parsed = PlainDateFns.fromString(
  '2024-05-01[u-ca=buddhist]',
  CalendarFns.getAnyCalendar,
)
```

Temporal API:

```ts
const calendar = calendarId
const date = new Temporal.PlainDate(2024, 5, 1, calendar)
const parsed = Temporal.PlainDate.from('2024-05-01[u-ca=buddhist]')
```

`getAnyCalendar` returns the shared ISO or Gregorian records for core calendar
IDs, and otherwise falls through to `getExoticCalendar`. A direct rewrite to a
calendar identifier string keeps the calendar selection but drops the functional
API's memoized handle and Intl-calendar validation.
