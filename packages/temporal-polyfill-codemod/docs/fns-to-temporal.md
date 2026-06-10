# `fns-to-temporal` Codemod Reference

This document is the implementation contract for migrating the
`temporal-polyfill/fns` API to the real Temporal API. The per-type functional
API docs remain the source of truth for individual helper mappings:

- `packages/temporal-polyfill/docs/fns/index.md`
- `packages/temporal-polyfill/docs/fns/types.md`
- `packages/temporal-polyfill/docs/fns/*.md`

The codemod-specific rules below cover import handling, diagnostics, fallback
helpers, and cases where a syntactic rewrite would be unsafe.

## Coverage Matrix

`src/fns-api-coverage.ts` is the explicit coverage matrix for the documented
runtime fns API. Each helper in `packages/temporal-polyfill/docs/fns/*.md`
except `index.md` and `types.md` must be classified there.

Statuses:

- `direct`: rewrites to global `Temporal` or a Temporal prototype/static member.
- `temporal-utils`: should rewrite through `temporal-utils`.
- `contextual-calendar`: rewrites only inside a known Temporal-consuming
  calendar slot.
- `diagnostic-only`: intentionally left unchanged with a diagnostic.

`src/__tests__/fns-api-coverage.test.ts` parses the fns docs and fails if a
documented runtime helper is missing from the matrix or if the matrix contains a
helper that is no longer documented.

## Package

- Package directory: `packages/temporal-polyfill-codemod`
- Package name: `temporal-polyfill-codemod`
- Initial package visibility: private
- Transform name: `fns-to-temporal`
- CLI shape:

```sh
temporal-polyfill-codemod fns-to-temporal <path>
temporal-polyfill-codemod fns-to-temporal <path> --dry --print
temporal-polyfill-codemod fns-to-temporal <path> --allow-warnings
```

The initial implementation should use plain-text reporting. JSON output can be
added later if CI or editor integrations need structured diagnostics.

## Goals

Rewrite code that uses functional API records into code that uses real Temporal
objects. Functional records are not compatible with real Temporal objects, so a
completed migration must not leave any `temporal-polyfill/fns` runtime usage in
the migrated codebase.

The codemod should prefer direct Temporal API calls when they are simple and
semantically equivalent. It should use `temporal-utils` only for helpers that
Temporal does not provide directly or when an overload cannot be normalized
statically.

## Import Shapes

The codemod only recognizes public functional API imports.

Shared type imports from the root fns entrypoint:

```ts
import type { OverflowOptions } from 'temporal-polyfill/fns'
```

Runtime namespace imports from per-type entrypoints:

```ts
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
```

Runtime named imports from per-type entrypoints:

```ts
import { addDays } from 'temporal-polyfill/fns/PlainDate'
```

Per-type type imports from per-type entrypoints:

```ts
import type { Record as PlainDateRecord } from 'temporal-polyfill/fns/PlainDate'
```

The root `temporal-polyfill/fns` entrypoint does not export per-type runtime
namespaces such as `PlainDateFns`. Code written as below is not a valid import
shape for this API and should not influence transform design:

```ts
import { PlainDateFns } from 'temporal-polyfill/fns'
```

Non-exact import paths should not be transformed. Emit a diagnostic instead.

## Temporal Target

The codemod targets global `Temporal`.

```ts
Temporal.PlainDate.from(fields)
```

It should not add this import:

```ts
import { Temporal } from 'temporal-polyfill'
```

Type rewrites should also target the global `Temporal` namespace, except for
types intentionally owned by `temporal-utils`.

## Diagnostics

Use one diagnostic concept for skipped or unsafe transformations. User-facing
text may call these warnings, but the default CLI outcome treats them as
migration-blocking.

Default behavior:

- Continue processing all files after each diagnostic.
- Apply every safe transform that can still be applied.
- Print all diagnostics at the end.
- Exit nonzero if any diagnostics were emitted.

`--allow-warnings` changes only the final exit code. It does not suppress
diagnostic output.

Hard errors are separate from diagnostics. Parser failures, transform crashes,
invalid CLI usage, and file write failures are errors.

## Unsafe Cases

If the codemod cannot prove a `temporal-polyfill/fns` usage is safe to rewrite,
it should leave that usage unchanged and emit a diagnostic. Because fns records
are incompatible with real Temporal objects, the run should still exit nonzero
by default after all files are processed.

Examples of unsafe cases:

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

```ts
doSomething(CalendarFns.getGregory())
```

```ts
const isDate = PlainDateFns.isRecord
```

The codemod can add support for more cases over time, but every supported case
needs a fixture proving that the rewrite is safe.

## Calendar Records

Functional calendar records should rewrite to calendar ID strings.

`CalendarFns.Record` maps to:

```ts
string
```

`CalendarFns.getISO()` maps to:

```ts
'iso8601'
```

`CalendarFns.getGregory()` maps to:

```ts
'gregory'
```

Named calendar record getters map to literal calendar ID strings:

| fns getter | Temporal value |
| --- | --- |
| `CalendarFns.getISO()` | `'iso8601'` |
| `CalendarFns.getGregory()` | `'gregory'` |
| `CalendarFns.getBuddhist()` | `'buddhist'` |
| `CalendarFns.getChinese()` | `'chinese'` |
| `CalendarFns.getCoptic()` | `'coptic'` |
| `CalendarFns.getDangi()` | `'dangi'` |
| `CalendarFns.getEthiopic()` | `'ethiopic'` |
| `CalendarFns.getEthiopicAmeteAlem()` | `'ethioaa'` |
| `CalendarFns.getHebrew()` | `'hebrew'` |
| `CalendarFns.getIndian()` | `'indian'` |
| `CalendarFns.getJapanese()` | `'japanese'` |
| `CalendarFns.getIslamicCivil()` | `'islamic-civil'` |
| `CalendarFns.getIslamicTabular()` | `'islamic-tbla'` |
| `CalendarFns.getIslamicUmmAlQura()` | `'islamic-umalqura'` |
| `CalendarFns.getPersian()` | `'persian'` |
| `CalendarFns.getRoc()` | `'roc'` |

`CalendarFns.getExotic(id)`, `CalendarFns.getAny(id)`, and similar resolver
calls should rewrite to the calendar ID expression when the value is being
passed to known Temporal-consuming code. The fns API accepts a narrow calendar
ID string here, not a broader `Temporal.CalendarLike` value such as a Temporal
object or a date-time string with a calendar annotation.

Calendar record values used outside known Temporal-consuming contexts are
unsafe. Leave them unchanged and emit a diagnostic.

## Record Guards

Per-type `isRecord(value)` calls should rewrite to `instanceof` checks against
the matching global Temporal constructor when the codemod sees a direct call.

```ts
PlainDateFns.isRecord(value)
```

becomes:

```ts
value instanceof Temporal.PlainDate
```

The same direct-call rule applies to named imports:

```ts
isRecord(value)
```

when `isRecord` was imported from a specific per-type fns entrypoint.

`instanceof` is the practical Temporal API equivalent because Temporal does not
provide public `Temporal.PlainDate.is(...)`-style brand-check helpers. This is
not a general structural check, and it intentionally follows the codemod's
global `Temporal` target.

Do not transform predicate references or other higher-order uses until the
codemod has explicit support for them. Leave them unchanged and emit a
diagnostic:

```ts
const isDate = PlainDateFns.isRecord
values.filter(PlainDateFns.isRecord)
```

## Type Rewrites

Type-only imports should be transformed from the first implementation pass. Use
`packages/temporal-polyfill/docs/fns/types.md` as the mapping source.

Examples:

```ts
import type { OverflowOptions } from 'temporal-polyfill/fns'
```

becomes a reference to:

```ts
Temporal.OverflowOptions
```

```ts
import type { Record as PlainDateRecord } from 'temporal-polyfill/fns/PlainDate'
```

becomes a reference to:

```ts
Temporal.PlainDate
```

Types owned by `temporal-utils` should import from `temporal-utils`:

```ts
import type { RoundingMode, RoundingMathOptions } from 'temporal-utils'
```

The codemod should not try to install or inject Temporal TypeScript
declarations. TypeScript projects need appropriate global `Temporal` types for
the rewritten code, but there are multiple valid ways for a project to provide
those declarations. Choosing and configuring that type source is the
developer's responsibility.

## `temporal-utils`

The codemod may add imports from `temporal-utils` when a helper has no direct
Temporal equivalent or when an overload cannot be normalized statically.

Do not modify `package.json` to add `temporal-utils`. Instead, print a summary
when the migration introduces `temporal-utils` imports:

```text
This migration introduced imports from temporal-utils.
Install temporal-utils in the affected package(s).
```

## Rounding Helpers

Prefer direct Temporal calls when the options argument can be normalized.

```ts
ZonedDateTimeFns.roundToHour(zdt)
```

becomes:

```ts
zdt.round({ smallestUnit: 'hour' })
```

```ts
ZonedDateTimeFns.roundToHour(zdt, 'ceil')
```

becomes:

```ts
zdt.round({ roundingMode: 'ceil', smallestUnit: 'hour' })
```

```ts
ZonedDateTimeFns.roundToHour(zdt, { roundingMode: 'ceil' })
```

becomes:

```ts
zdt.round({ roundingMode: 'ceil', smallestUnit: 'hour' })
```

If the options argument is not an object literal or a string literal, use the
matching `temporal-utils` helper:

```ts
roundToHour(zdt, roundingModeOrOptions)
```

If an object literal already contains `smallestUnit`, leave the call unchanged
and emit a diagnostic for manual review.

## Import Cleanup

Remove only `temporal-polyfill/fns`-related imports that the codemod fully
consumed.

- Remove transformed fns import specifiers.
- Remove a fns import declaration if all of its specifiers were transformed.
- Keep untransformed fns bindings when any unsafe usage remains.
- Do not clean up unrelated unused imports from other packages.

Attached comments should follow AST attachment plus a simple adjacency rule:

- A leading comment immediately adjacent to a removed fns import is removed
  with that import.
- A leading comment separated from the import by a blank line is treated as a
  standalone file or section comment and preserved.
- A trailing same-line comment on a removed fns import is removed with the
  import.
- Comments on partially remaining imports are preserved.

## Formatting

Use `jscodeshift` and `recast` so formatting is preserved where possible. Do
not run Prettier, Biome, or another formatter automatically as part of the
codemod.

Default file extensions:

```text
js, jsx, ts, tsx, mjs, cjs, mts, cts
```

## Tests

Use fixture tests. Group fixtures by fns entrypoint and by cross-cutting
behavior:

- import tracking and cleanup
- diagnostics and default failing behavior
- type-only imports
- `temporal-utils` imports
- calendar records
- `PlainDate`
- `PlainDateTime`
- `PlainTime`
- `PlainYearMonth`
- `PlainMonthDay`
- `ZonedDateTime`
- `Instant`
- `Duration`
- `Now`

Every unsafe case that emits a diagnostic should have a fixture proving that the
source stays unchanged and the diagnostic is reported.

## Initial Rollout

Start with package scaffolding, CLI/reporting, import tracking, and a narrow
fixture-backed transform slice:

1. Type-only rewrites from `types.md`.
2. Shared import tracking and fns import cleanup.
3. `PlainDate` runtime mappings.
4. Calendar record rewrites needed by the first `PlainDate` mappings.

After that, expand helper-by-helper using the per-type fns docs as the mapping
source.
