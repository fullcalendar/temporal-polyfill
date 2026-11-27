# temporal-spec

Standalone TypeScript type definitions for [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) 📐

This package ships only `.d.ts` declarations, with no runtime code. It covers the `Temporal` API along with the Temporal-related additions to `Intl` and `Date`.


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

Before 6.0, TypeScript shipped no Temporal types, so every implementation carried its own copy, and the copies drifted apart.

`temporal-spec` packages those declarations in a standalone, dependency-free module. It provides the types for [`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill/blob/main/polyfill/README.md) and is published separately so other implementations and apps can reuse the same definitions.


## Installation

```
npm install temporal-spec
```

Because it contains only `.d.ts` files, most consumers can install it as a `devDependency`.


## Entry Points

There are two entry points, depending on whether you want `Temporal` declared globally.

### Namespaced (no global pollution)

Import the `Temporal` (and `Intl`) namespaces explicitly. This has no side effects and does not modify the global TypeScript scope, making it suitable for libraries:

```ts
import type { Temporal } from 'temporal-spec'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```

### Global

Import for side effects to augment the global scope so `Temporal` is available everywhere without explicit imports, matching the runtime global API:

```ts
import 'temporal-spec/global'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```


## What's Included

Both entry points cover the full Temporal surface:

- The `Temporal` namespace (`Instant`, `ZonedDateTime`, `PlainDate`, `PlainTime`, `PlainDateTime`, `PlainYearMonth`, `PlainMonthDay`, `Duration`, `Now`, and all supporting `*Like` and options types).
- `Intl.DateTimeFormat` augmentations so `format`, `formatToParts`, `formatRange`, and `formatRangeToParts` accept Temporal objects.
- `Date.prototype.toTemporalInstant` (plus a standalone `toTemporalInstant` function type declaration in the namespaced `.d.ts` entry point; there is no runtime export).


## TypeScript Version Notes

TypeScript 6.0+ includes Temporal types in its built-in `lib` files (`esnext.temporal`). If you are on TypeScript 6.0+ and only need the global types, enable the built-in lib instead:

```diff
{
  "compilerOptions": {
+   "lib": ["esnext"]
  }
}
```

Or enable the individual libs:

```diff
{
  "compilerOptions": {
+   "lib": ["esnext.temporal", "esnext.intl", "esnext.date"]
  }
}
```

`temporal-spec` is still useful when you:

- use TypeScript < 6.0, which has no built-in Temporal types
- want the namespaced (non-global) form, which `lib` does not provide
- author a polyfill and want types decoupled from the consumer's TypeScript version


## For Polyfill Authors

If you are building a Temporal implementation, you can depend on `temporal-spec` and type-check your public API against its `Temporal` namespace instead of maintaining a separate copy of the declarations.


## Provenance & License

These declarations are derived from the TypeScript project's `lib` files ([`esnext.temporal.d.ts`](https://github.com/microsoft/TypeScript/blob/v6.0.3/src/lib/esnext.temporal.d.ts), [`esnext.intl.d.ts`](https://github.com/microsoft/TypeScript/blob/v6.0.3/src/lib/esnext.intl.d.ts), and [`esnext.date.d.ts`](https://github.com/microsoft/TypeScript/blob/v6.0.3/src/lib/esnext.date.d.ts)), which are Copyright (c) Microsoft Corporation.

Licensed under the [Apache License, Version 2.0](https://github.com/fullcalendar/temporal-polyfill/blob/main/spec/LICENSE).
