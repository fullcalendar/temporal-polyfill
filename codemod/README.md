# temporal-polyfill-codemod

Automated migrations for `temporal-polyfill` codebases 🔄

The `fns-to-temporal` transform rewrites code using the tree-shakeable [`temporal-polyfill/fns` function API](https://github.com/fullcalendar/temporal-polyfill/blob/main/docs/fns/index.md) into standard `Temporal` objects and methods.

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

The `temporal-polyfill/fns` API keeps bundles small by exposing each operation as a standalone function on plain record objects. Once native `Temporal` is available in all environments you target, you can drop the polyfill and switch to standard `Temporal` classes and methods. This codemod automates that conversion across a codebase.

The transform targets the global `Temporal` object. It does not insert `import { Temporal } from 'temporal-polyfill'`, so wire up your Temporal source (native or global polyfill) however your project prefers.

## Quick start

Run against a file or directory:

```sh
npx temporal-polyfill-codemod fns-to-temporal <path>
```

Preview changes without modifying files:

```sh
npx temporal-polyfill-codemod fns-to-temporal <path> --dry --print
```

Directories are traversed recursively, skipping `node_modules`, `dist`, and dot-directories. Supported extensions: `js, jsx, ts, tsx, mjs, cjs, mts, cts`.

The codemod preserves existing formatting where possible, but does not run a formatter; run your own formatter afterward.

## What it migrates

### Constructors and methods

`fns` calls are rewritten to constructors, instance methods, and static methods:

```ts
PlainDateFns.create(2024, 5, 1)        // → new Temporal.PlainDate(2024, 5, 1)
PlainDateFns.addDays(date, 3)          // → date.add({ days: 3 })
PlainDateFns.compare(a, b)             // → Temporal.PlainDate.compare(a, b)
```

### Calendar records to calendar IDs

Calendar getter and resolver calls are replaced with calendar ID strings, since standard Temporal uses string IDs instead of calendar records:

```ts
PlainDateFns.create(2024, 5, 1, CalendarFns.getBuddhist())
// → new Temporal.PlainDate(2024, 5, 1, 'buddhist')

doSomething(CalendarFns.getGregory())
// → doSomething('gregory')
```

### Types

Record and option types are rewritten to their `Temporal` equivalents (or `temporal-utils` where Temporal has no equivalent):

```ts
type DateValue = PlainDateRecord     // → Temporal.PlainDate
type CalendarValue = CalendarRecord  // → string
```

### Type guards

`isRecord` checks become `instanceof`:

```ts
if (PlainDateFns.isRecord(value)) { /* ... */ }
// → if (value instanceof Temporal.PlainDate) { /* ... */ }
```

### Helpers without a Temporal equivalent

Some `fns` helpers have no direct `Temporal` method and are rewritten to imports from [`temporal-utils`](https://www.npmjs.com/package/temporal-utils). When that happens, the CLI prints a reminder to install `temporal-utils` (it does not edit `package.json`). Imported names that collide with existing local identifiers are aliased automatically.

## Unmigrated code and diagnostics

The codemod only rewrites calls whose target `Temporal` expression is unambiguous from the syntax. Shapes it cannot safely rewrite are left unchanged and reported as diagnostics, including:

- Function references passed around as values
- Dynamic or computed property access on an `fns` namespace
- Namespace destructuring
- `roundTo*` calls whose options object already specifies `smallestUnit`

Because leftover `fns` records are not interchangeable with `Temporal` instances, diagnostics cause the CLI to exit with code `1` by default so CI can catch an incomplete migration. Pass `--allow-warnings` to inspect partial results with exit code `0`. Files that fail to parse are reported individually without stopping the rest of the run.

Example diagnostic:

```txt
warning: ZonedDateTime roundToHour options object already has smallestUnit; manual review needed
warning: Untransformed ZonedDateTimeFns.roundToHour usage
```

Resolve any reported cases manually, then re-run until the output is clean.

## TypeScript

Rewritten types reference the global `Temporal` namespace. The codemod does not install or inject global Temporal type declarations, so configure those separately if your project does not already have them.

## Development

```sh
cd codemod
pnpm run lint
pnpm run test
pnpm run build
```

See [`ARCHITECTURE.md`](https://github.com/fullcalendar/temporal-polyfill/blob/main/codemod/ARCHITECTURE.md) for the full transform contract, supported import paths, deferred cases, and exit codes.
