# Func API Wrapper Refactor Plan

This plan describes the next direction for `src/funcApi`. The goal is a small,
tree-shakeable functional API that can later be codemodded to native Temporal
operations once native support is mature enough.

The func API currently has no users, so breaking API changes are acceptable.

## Settled Public Contract

Func API values are opaque records. They are not raw internal slots and they are
not native Temporal instances. Public functions create and consume these records.

Records expose getter properties that mirror the standard Temporal API where
possible. For date-like records, expose the simple calendar-aware fields that
are currently returned by `getFields`, plus `calendarId`. Do not expose
`calendar` as a public property.

Records have no public instance methods. Formatting and serialization remain
module functions, for example `PlainDateFns.toString(record)`, so users who do
not need formatting do not pull in formatting code.

Remove `getFields`. It does not map cleanly to the standard Temporal API and
would be hard to codemod later.

Rename `isInstance` to `isRecord`. It should identify func API wrapper records,
not raw native Temporal objects. A future codemod can rewrite
`PlainDateFns.isRecord(value)` to `value instanceof Temporal.PlainDate`.

Keep each module's exported `Record` type for now, such as
`PlainDateFns.Record`.

Missing `calendar` input means ISO, so this remains valid:

```ts
PlainDateFns.fromFields({ year: 2029, month: 1, day: 1 })
```

When a calendar is supplied in an input bag, the property name stays
`calendar`, but the value must be an opaque calendar token:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/plaindate'
import { getGregoryCalendar } from 'temporal-polyfill/fns/calendar'

const date = PlainDateFns.fromFields({
  year: 2029,
  month: 1,
  day: 1,
  calendar: getGregoryCalendar(),
})

date.calendarId // "gregory"
```

Calendar strings are no longer accepted by the func API.

## Calendar Tokens

Calendar tokens are opaque public values. They have no public `.id` property,
no public methods, and no public type guard.

Do not add `isCalendar`.

Use a `Symbol.toStringTag` value of `Temporal.Calendar` for console familiarity.
Do not add a semantic `toString` method.

Core calendar helpers live in:

```ts
temporal-polyfill/fns/calendar
```

This entrypoint exports:

```ts
getIsoCalendar()
getGregoryCalendar()
```

Intl calendar helpers live in a separate entrypoint:

```ts
temporal-polyfill/fns/intl-calendar
```

This entrypoint exports:

```ts
getIntlCalendar(calendarId)
```

Calendar token equality should work for same calendars:

```ts
getGregoryCalendar() === getGregoryCalendar() // true
getIsoCalendar() === getIsoCalendar() // true
getIntlCalendar('buddhist') === getIntlCalendar('buddhist') // true
```

Implement this with singleton core tokens and a normalized-ID cache for Intl
tokens.

Public token types should be opaque in TypeScript. Prefer a private or exported
`unique symbol` brand over shape-based public properties:

```ts
declare const calendarBrand: unique symbol

export interface Calendar {
  readonly [calendarBrand]: never
}
```

Internally, use narrow unwrap helpers at calendar boundaries. Invalid calendar
tokens should fail from those helpers with intentional errors instead of leaking
unhelpful property-access failures. This does not mean every func operation
needs extra brand checks.

Calendar token hidden storage should distinguish runtime mode explicitly. Do
not use the internal calendar value itself as the discriminator because ISO is
represented internally as `undefined`.

Example hidden storage shape:

```ts
type CalendarStorage =
  | { kind: 'polyfill'; calendar: InternalCalendar; calendarId: string }
  | { kind: 'native'; calendarId: string }
```

For the first implementation milestone, only the polyfill storage branch is
needed. The native branch is reserved for later.

## Wrapper Infrastructure

Do not reuse `createSlotClass` directly. It builds class-style prototypes with
methods and static methods, which is not the desired func API surface.

Create smaller func-specific helpers, likely in `src/funcApi/record.ts` or a
similar file:

```ts
createFuncRecordType(...)
createFuncTokenType(...)
```

The helpers should provide:

- hidden storage through `WeakMap`
- `Symbol.toStringTag`
- getter descriptors
- no public constructor
- no instance methods
- no static methods
- optional debug-only `_str_` behavior if it remains useful and size permits

Records and tokens can share descriptor and hidden-storage plumbing, but tokens
do not need getter maps.

For date/time record storage, plan for a future native-backed mode without
exposing that distinction publicly:

```ts
type FuncRecordStorage<TSlots, TNative> =
  | { kind: 'slots'; slots: TSlots }
  | { kind: 'native'; native: TNative }
```

Initially, implement only the `slots` branch.

Do not optimize for mixed native/polyfill records. Runtime mode should be chosen
once at module initialization, and normal use should create only one kind of
record in a given runtime.

## Native-Backed Wrapper Direction

The func API should eventually use native Temporal internally when available,
but native Temporal objects should not escape directly. Public records keep the
same wrapper shape in both native-backed and polyfill-backed modes.

At module initialization, choose the implementation path once and cache the
needed functions. Avoid per-input native support checks.

Both native-backed and polyfill-backed builds may include the polyfill
implementation code and share common chunks. The priority is stable public
shape and codemod friendliness, not making native-backed mode eliminate all
polyfill code.

Add this only after the wrapper API has been proven with polyfill slots.

## Codemod Contract

The eventual codemod assumes users treat func API records and calendar tokens as
opaque handles.

Allowed public operations:

- pass records into funcs from their module
- read documented getter properties from records
- pass calendar tokens into func API input bags
- compare calendar tokens by identity

Avoid public surface area that cannot map to native Temporal cleanly.

Expected future rewrites:

```ts
getIsoCalendar() -> 'iso8601'
getGregoryCalendar() -> 'gregory'
getIntlCalendar(id) -> id

PlainDateFns.isRecord(value) -> value instanceof Temporal.PlainDate
```

Records should expose `.calendarId`, not `.calendar`, because standard Temporal
objects expose `.calendarId`.

## Implementation Sub-Projects

### 0. Contract Doc

Keep this file up to date as the implementation changes. Treat it as the
handoff document for future work.

### 1. Core Wrapper Infrastructure

Add func-specific record/token helpers without converting public Temporal types
yet.

Suggested files:

- `src/funcApi/record.ts`
- possibly `src/funcApi/calendarToken.ts` if the calendar code would otherwise
  crowd the shared helper

Include focused tests for:

- getter descriptors
- `Symbol.toStringTag`
- hidden storage access
- invalid object behavior
- token singleton/caching behavior if calendar tokens are included in this step

### 2. Calendar Tokens

Add the public calendar entrypoints:

- `src/funcApi/calendar.ts`
- `src/funcApi/intlCalendar.ts`

Add corresponding package export config entries:

- `./fns/calendar`
- `./fns/intl-calendar`

The core calendar entrypoint must not pull in Intl calendar data. Splitting
`getIntlCalendar` into its own public entrypoint avoids relying on consumer
bundlers to tree-shake unused reexports correctly.

Add internal helpers for:

- creating core tokens
- creating/caching Intl tokens
- unwrapping a token to `calendarId`
- unwrapping a token to `InternalCalendar` for polyfill execution

### 3. Convert PlainDate First

Use `PlainDate` as the pilot conversion because it exercises calendar-aware
fields without time-zone complexity.

Changes:

- `PlainDateFns.Record` becomes a wrapper type, not `PlainDateSlots`
- public getters include all fields currently returned by `getFields`, plus
  `calendarId`
- remove `PlainDateFns.getFields`
- rename `PlainDateFns.isInstance` to `PlainDateFns.isRecord`
- `fromFields` accepts `calendar?: Calendar`
- `create` should be reviewed separately; if it remains public, its calendar
  argument should also stop accepting strings
- all functions unwrap slots internally and return wrapped records
- `withCalendar` accepts a `Calendar` token instead of a string

Keep missing calendar input as ISO.

### 4. Convert PlainDateTime

Apply the same model to `PlainDateTime`.

This proves the wrapper and getter infrastructure can handle combined date/time
fields.

### 5. Convert PlainYearMonth And PlainMonthDay

Convert these after `PlainDate` and `PlainDateTime` because their calendar field
resolution has special behavior.

Remove their `getFields` exports.

### 6. Convert ZonedDateTime

Convert after the plain date/time types. `ZonedDateTime` adds time-zone storage,
epoch math, and more formatting/conversion paths, so it should not be the pilot.

Expose standard-like getter props, including `calendarId` and `timeZoneId` if
that matches the current Temporal API target.

### 7. Convert PlainTime, Instant, And Duration

These are less calendar-sensitive. They may be done before `ZonedDateTime` for
quick progress, but do not do them before the calendar-heavy `PlainDate` pilot.

For these types, remove `getFields` where present and expose standard-like
simple getter props.

### 8. Clean Up Old Slot Record Assumptions

After each type is converted, remove now-unused public slot aliases, tests, and
helper functions. Do not leave unused old implementations behind.

Search for:

- `getFields`
- `isInstance`
- `PlainDateSlots` or other slot types exported as func `Record`
- direct public access to `.calendar`
- string calendar arguments in func API modules and tests

### 9. Add Native-Backed Wrapper Mode

Only start this after the polyfill-backed wrappers are stable.

Use top-level runtime selection. Native mode wraps native Temporal objects in
the same func record wrappers. Native Temporal instances should not escape from
func API creation functions.

Do not add mixed native/polyfill record support unless a real use case appears.

## Validation

After code changes, run from `packages/temporal-polyfill`:

```sh
pnpm run lint
```

Run targeted Vitest files while iterating on individual func modules.

For test262 work, remember that test262 uses built output. Run:

```sh
pnpm run build
pnpm run test262 --no-max
```

For size-oriented changes, measure baseline first and do not run bare
`pnpm run size`. Build `packages/export-size` first, then run:

```sh
pnpm run size --raw
```

For this refactor, size checks are especially important around the new calendar
entrypoints to ensure importing `temporal-polyfill/fns/calendar` does not pull
in Intl calendar data.

## Non-Goals For The First Milestone

- native-backed wrappers
- mixed native/polyfill record interoperability
- broad API compatibility with the current func API
- accepting calendar strings
- exposing public calendar token properties
- preserving `getFields`

The first milestone should end with `PlainDate` converted to opaque wrappers and
calendar tokens, plus passing focused tests and lint.
