# temporal-polyfill-codemod

Automated migrations for `temporal-polyfill` codebases.

The current transform, `fns-to-temporal`, rewrites code that uses the
tree-shakable [`temporal-polyfill/fns` function API](../docs/fns/index.md)
into idiomatic Temporal — real `Temporal` objects and their methods.

```ts
// Before
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
const date = PlainDateFns.create(2024, 5, 1)
const next = PlainDateFns.addDays(date, 3)

// After
const date = new Temporal.PlainDate(2024, 5, 1)
const next = date.add({ days: 3 })
```

## Why migrate

The `temporal-polyfill/fns` API is great for bundle size — every function is
independently tree-shakable — but it operates on plain record objects, not real
Temporal instances. As Temporal ships natively across browsers and runtimes, the
polyfill stops being necessary and standard, spec-shaped Temporal becomes the
natural way to write this code. This codemod does the mechanical work of
converting an entire codebase over.

The transform targets the global `Temporal` object. It does not add
`import { Temporal } from 'temporal-polyfill'` — wire up your Temporal source
(global polyfill or native) however your project prefers.

## Quick start

Run it against a file or directory:

```sh
npx temporal-polyfill-codemod fns-to-temporal <path>
```

Preview the changes without touching your files:

```sh
temporal-polyfill-codemod fns-to-temporal <path> --dry --print
```

Directories are walked recursively; `node_modules`, `dist`, and dot-directories
are skipped. Supported extensions: `js, jsx, ts, tsx, mjs, cjs, mts, cts`.

The codemod preserves your formatting where it can but doesn't run a formatter —
run yours afterward.

## What it migrates

The transform covers the common shapes you'll have across a codebase:

**Constructors and methods** — `fns` calls become constructors and instance
methods:

```ts
PlainDateFns.create(2024, 5, 1)        // → new Temporal.PlainDate(2024, 5, 1)
PlainDateFns.addDays(date, 3)          // → date.add({ days: 3 })
PlainDateFns.compare(a, b)             // → Temporal.PlainDate.compare(a, b)
```

**Calendar records → calendar IDs** — in slots where Temporal expects a
calendar ID string:

```ts
PlainDateFns.create(2024, 5, 1, CalendarFns.getBuddhist())
// → new Temporal.PlainDate(2024, 5, 1, 'buddhist')
```

**Types** — record and option types are rewritten to their `Temporal`
equivalents (falling back to `temporal-utils` where Temporal has no equivalent):

```ts
type DateValue = PlainDateRecord     // → Temporal.PlainDate
type CalendarValue = CalendarRecord  // → string
```

**Type guards** — `isRecord` checks become `instanceof`:

```ts
if (PlainDateFns.isRecord(value)) { /* ... */ }
// → if (value instanceof Temporal.PlainDate) { /* ... */ }
```

Some `fns` helpers have no direct Temporal equivalent and are rewritten to
[`temporal-utils`](https://www.npmjs.com/package/temporal-utils) instead. When
that happens the codemod prints a note so you can add the dependency — it won't
edit your `package.json`. If the import would collide with a local name, it's
aliased automatically.

## When it can't migrate something

The codemod is deliberately conservative: it only rewrites code when the
intended Temporal expression is unambiguous from the syntax. Anything it isn't
sure about — function references passed around as values, dynamic/computed
property access, namespace destructuring, `roundTo*` calls whose options already
conflict with the implied unit — is **left unchanged** and reported as a
diagnostic.

Because leftover `fns` records aren't interchangeable with real Temporal
objects, these diagnostics are migration-blocking by default: the run prints
every issue it found and exits with code `1` so CI catches an incomplete
migration. Pass `--allow-warnings` to inspect partial results without the
nonzero exit. A file that can't be parsed is reported individually and doesn't
stop the rest of the run.

Example diagnostic:

```txt
warning: ZonedDateTime roundToHour options object already has smallestUnit; manual review needed
warning: Untransformed ZonedDateTimeFns.roundToHour usage
```

Work through the reported spots by hand, then re-run until the codemod is clean.

## TypeScript

Types are rewritten to global `Temporal` types, but the codemod doesn't install
or inject Temporal type declarations. If your project doesn't already provide
global Temporal types, set that up separately.

## Development

```sh
cd codemod
pnpm run lint
pnpm run test
pnpm run build
```

The full transform contract — every supported import path, every deferred shape,
and the exit-code matrix — lives in [`ARCHITECTURE.md`](ARCHITECTURE.md).
