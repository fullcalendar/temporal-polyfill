<!--
  Links here are NOT rewritten on publish. Any link to another file in this repo
  must be an absolute GitHub URL rooted at:
    https://github.com/fullcalendar/temporal-polyfill/blob/main/
  (use /tree/main/ instead of /blob/main/ when linking a directory)
-->

# temporal-spec

TypeScript type definitions for [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal), the successor to the JavaScript `Date` object.

This package ships **only** type declarations — no runtime code. It describes the
shape of the Temporal API (plus the Temporal-related additions to `Intl` and
`Date`) so that any Temporal implementation, polyfill, or application can share a
single, accurate set of types.


## Table of Contents

- [Why This Exists](#why-this-exists)
- [Installation](#installation)
- [Entry Points](#entry-points)
  - [Namespaced (no global pollution)](#namespaced-no-global-pollution)
  - [Global](#global)
- [What's Included](#whats-included)
- [TypeScript Version Notes](#typescript-version-notes)
- [For Polyfill Authors](#for-polyfill-authors)
- [Provenance & License](#provenance--license)


## Why This Exists

Temporal is a Stage 4 TC39 proposal that, until recently, no version of
TypeScript shipped types for. Implementations each had to carry their own copy of
the declarations, and they tended to drift apart.

`temporal-spec` centralizes those declarations into a standalone, dependency-free
package. It's the type layer behind
[`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill/blob/main/polyfill/README.md),
and it's published separately so other Temporal implementations can reuse the
exact same types.


## Installation

```
npm install temporal-spec
```

Because it contains nothing but `.d.ts` files, it's a `devDependency` for most
consumers.


## Entry Points

There are two ways to pull in the types, depending on whether you want `Temporal`
to be a global.

### Namespaced (no global pollution)

Import the `Temporal` (and `Intl`) namespaces explicitly. This has **no side
effects** — it does not touch the global TypeScript scope, so it's the right
choice for libraries:

```ts
import type { Temporal } from 'temporal-spec'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```

### Global

Import for its side effects to augment the global scope, making `Temporal`
available everywhere without an explicit import (mirrors how the real API will
behave once shipped):

```ts
import 'temporal-spec/global'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```


## What's Included

Both entry points cover the full surface of the proposal:

- The **`Temporal`** namespace — `Instant`, `ZonedDateTime`, `PlainDate`,
  `PlainTime`, `PlainDateTime`, `PlainYearMonth`, `PlainMonthDay`, `Duration`,
  `Now`, and all of their supporting `*Like` / options types.
- **`Intl.DateTimeFormat`** augmentations, so `format`, `formatToParts`,
  `formatRange`, and `formatRangeToParts` accept Temporal objects.
- **`Date.prototype.toTemporalInstant`** (exposed as a standalone
  `toTemporalInstant` function from the namespaced entry point), for bridging
  legacy `Date` values into Temporal.


## TypeScript Version Notes

TypeScript **6.0+** bundles Temporal types in its built-in `lib` files
(`esnext.temporal`), so if you're on a recent TypeScript and only need the
global types, you may not need this package at all — just enable the lib:

```diff
{
  "compilerOptions": {
+   "lib": ["esnext"]
  }
}
```

Or with more granularity:

```diff
{
  "compilerOptions": {
+   "lib": ["esnext.temporal", "esnext.intl", "esnext.date"]
  }
}
```

`temporal-spec` remains useful when you:

- are on **TypeScript < 6.0**, which has no built-in Temporal types
- want the **namespaced** (non-global) form, which `lib` does not provide
- are authoring a polyfill and want types decoupled from the consumer's
  TypeScript version


## For Polyfill Authors

If you're building your own Temporal implementation, `temporal-spec` lets you
type-check your output against the same declarations everyone else uses, instead
of vendoring a copy that slowly drifts from the spec. Depend on it, point your
public types at the `Temporal` namespace, and stay in sync as the proposal
evolves.


## Provenance & License

These declarations are derived from the TypeScript project's `lib` files
([`esnext.temporal.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.temporal.d.ts),
[`esnext.intl.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.intl.d.ts),
and [`esnext.date.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.date.d.ts)),
which are Copyright (c) Microsoft Corporation.

Licensed under the [Apache License, Version 2.0](https://github.com/fullcalendar/temporal-polyfill/blob/main/spec/LICENSE).
