# temporal-polyfill-codemod

Codemods for migrating `temporal-polyfill` code.

The first transform, `fns-to-temporal`, rewrites code that uses
`temporal-polyfill/fns` records into code that uses real Temporal objects.

## Philosophy

The functional API records are not compatible with real Temporal objects. A
successful migration should remove `temporal-polyfill/fns` runtime usage from a
file rather than mixing both models.

The transform is intentionally conservative:

- Prefer the simplest equivalent global `Temporal` API.
- Use `temporal-utils` only when Temporal has no direct equivalent.
- Leave ambiguous or unsafe code unchanged and print a diagnostic.
- Continue processing after diagnostics so one run reports all problems.
- Exit nonzero by default if any diagnostics were emitted.

The codemod targets global `Temporal`. It does not add
`import { Temporal } from 'temporal-polyfill'`.

## Usage

Install or run the package with your package manager once it is published:

```sh
npx temporal-polyfill-codemod fns-to-temporal <path>
```

```sh
pnpm dlx temporal-polyfill-codemod fns-to-temporal <path>
```

Build the package first when running from the monorepo checkout:

```sh
pnpm --dir packages/temporal-polyfill-codemod run build
```

Run the transform:

```sh
temporal-polyfill-codemod fns-to-temporal <path>
```

Preview changes without writing:

```sh
temporal-polyfill-codemod fns-to-temporal <path> --dry --print
```

Allow diagnostics without a nonzero exit code:

```sh
temporal-polyfill-codemod fns-to-temporal <path> --allow-warnings
```

Supported input extensions:

```txt
js, jsx, ts, tsx, mjs, cjs, mts, cts
```

When a directory is passed, `node_modules`, `dist`, and dot-directories are
skipped.

The codemod preserves source formatting where practical but does not run a code
formatter. Run your project formatter after migration.

## Supported Source Shapes

The transform supports exact fns package imports:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import { create, addDays } from 'temporal-polyfill/fns/PlainDate'
import type { Record } from 'temporal-polyfill/fns/PlainDate'
import type { RoundingMode } from 'temporal-polyfill/fns'
```

Supported runtime import paths are:

```txt
temporal-polyfill/fns/Calendar
temporal-polyfill/fns/Instant
temporal-polyfill/fns/ZonedDateTime
temporal-polyfill/fns/PlainDateTime
temporal-polyfill/fns/PlainDate
temporal-polyfill/fns/PlainTime
temporal-polyfill/fns/PlainYearMonth
temporal-polyfill/fns/PlainMonthDay
temporal-polyfill/fns/Duration
temporal-polyfill/fns/Now
```

The root `temporal-polyfill/fns` import is supported for documented shared type
exports only.

The transform does not rewrite default imports, re-exports, require calls,
dynamic imports, computed fns property access, namespace destructuring, or
function references. Those shapes are left unchanged with diagnostics.

## Diagnostics

Diagnostics are warnings in the printed report, but they are migration-blocking
by default because leftover fns records are incompatible with real Temporal
objects.

The default behavior is:

- Process every file.
- Apply every safe rewrite.
- Print all diagnostics.
- Exit with code `1` if any diagnostics were emitted.

Use `--allow-warnings` only when you intentionally want to inspect partial
results despite remaining manual work.

### Exit Codes

The CLI exits with:

- `0` when all scanned files were processed and no diagnostics were emitted.
- `0` with `--allow-warnings` when warnings were emitted but no file-level
  errors occurred.
- `1` when warnings were emitted without `--allow-warnings`.
- `1` when any file could not be read, parsed, transformed, or written.

Parser and file errors are reported per file. One bad file does not stop the
rest of the run.

### Warning Example

This call is left unchanged because the object literal already controls
`smallestUnit`, which conflicts with the unit implied by `roundToHour`:

```ts
ZonedDateTimeFns.roundToHour(zdt, { smallestUnit: 'minute' })
```

The report includes diagnostics like:

```txt
warning: ZonedDateTime roundToHour options object already has smallestUnit; manual review needed
warning: Untransformed ZonedDateTimeFns.roundToHour usage
```

### Error Example

A syntax error in an input file is reported as an error for that file. The CLI
continues scanning later files and exits with code `1`.

## TypeScript

The transform rewrites TypeScript types to global `Temporal` types, but it does
not install or inject Temporal declarations.

If the migrated TypeScript project does not already provide global Temporal
types, choose and configure the type source separately.

## temporal-utils

Some fns helpers do not have direct Temporal equivalents. Those helpers are
intended to rewrite to `temporal-utils`.

If a generated `temporal-utils` import would collide with a local binding, the
codemod aliases the import:

```ts
import { startOfWeek as startOfWeekTemporalUtils } from 'temporal-utils'
```

If the file already imports the same helper from `temporal-utils`, the codemod
reuses that existing local name.

The codemod does not edit `package.json`. If a run introduces imports from
`temporal-utils`, the CLI prints a summary note so the package owner can add the
dependency where appropriate.

## Known Limitations

The first implementation is intentionally conservative. These cases require
manual review or a later transform pass:

- `roundTo*` calls with object literals that already contain `smallestUnit` are
  left unchanged with diagnostics.
- `createFormat` is currently diagnostic-only.
- Function references, predicate references, dynamic namespace access, and
  namespace destructuring are left unchanged with diagnostics.
- Standalone `CalendarFns.get*()` calls are left unchanged unless they appear in
  a known Temporal-consuming calendar slot.
- The codemod does not edit `package.json`.
- The codemod does not install or inject TypeScript Temporal declarations.

## Examples

### Construction

Before:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1)
```

After:

```ts
const date = new Temporal.PlainDate(2024, 5, 1)
```

### Named Imports

Before:

```ts
import { addDays, compare } from 'temporal-polyfill/fns/PlainDate'

const next = addDays(date, 3)
const order = compare(date, otherDate)
```

After:

```ts
const next = date.add({ days: 3 })
const order = Temporal.PlainDate.compare(date, otherDate)
```

### Calendar Records

Calendar records become calendar ID strings in known Temporal-consuming slots.

Before:

```ts
import * as CalendarFns from 'temporal-polyfill/fns/Calendar'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 5, 1, CalendarFns.getBuddhist())
```

After:

```ts
const date = new Temporal.PlainDate(2024, 5, 1, 'buddhist')
```

Resolver calls become their calendar ID argument in known calendar slots:

```ts
PlainDateFns.withCalendar(date, CalendarFns.getAny(calendarId))
```

becomes:

```ts
date.withCalendar(calendarId)
```

Standalone calendar record values are left unchanged with a diagnostic because
the codemod cannot prove the surrounding code expects a calendar ID string.

### Type Imports

Before:

```ts
import type { OverflowOptions, RoundingMode } from 'temporal-polyfill/fns'
import type { Record as PlainDateRecord } from 'temporal-polyfill/fns/PlainDate'
import type { Record as CalendarRecord } from 'temporal-polyfill/fns/Calendar'

type DateValue = PlainDateRecord
type CalendarValue = CalendarRecord
type Overflow = OverflowOptions
type Mode = RoundingMode
```

After:

```ts
import type { RoundingMode } from 'temporal-utils'

type DateValue = Temporal.PlainDate
type CalendarValue = string
type Overflow = Temporal.OverflowOptions
type Mode = RoundingMode
```

### Type Guards

Before:

```ts
if (PlainDateFns.isRecord(value)) {
  value.day
}
```

After:

```ts
if (value instanceof Temporal.PlainDate) {
  value.day
}
```

Predicate references are not rewritten yet:

```ts
values.filter(PlainDateFns.isRecord)
```

That shape is left unchanged with a diagnostic.

### Unsupported Or Ambiguous Shapes

These are intentionally left unchanged with diagnostics:

```ts
const fn = PlainDateFns.addDays
fn(date, 3)
```

```ts
PlainDateFns[name](date, 3)
```

```ts
const { create } = PlainDateFns
```

The transform only rewrites code when the target Temporal expression is clear
from syntax.

## Development

Run checks for this package:

```sh
pnpm --dir packages/temporal-polyfill-codemod run lint
pnpm --dir packages/temporal-polyfill-codemod run test
pnpm --dir packages/temporal-polyfill-codemod run build
```

The test suite includes:

- runtime API coverage against the fns docs
- generated direct-rewrite tests
- generated diagnostic tests for deferred helpers
- exhaustive type-rewrite tests
- unit tests for CLI behavior
- smoke tests against the built `dist/cli.js`

The detailed implementation contract lives in
`docs/fns-to-temporal.md`.
