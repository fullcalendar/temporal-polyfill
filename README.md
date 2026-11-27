# temporal-polyfill monorepo

> [!NOTE]
> 🎉 **temporal-polyfill 1.0 is out!** See the [1.0 release notes](https://github.com/fullcalendar/temporal-polyfill/releases/tag/temporal-polyfill%401.0.1).

Packages for working with [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal), the modern successor to the JavaScript `Date` object 🕒

Most projects just need [temporal-polyfill](./polyfill/README.md); the other packages build on it.

## Contents

- 📦 [**temporal-polyfill**](#temporal-polyfill) — Lightweight, spec-compliant polyfill for Temporal
- 🌳 [**Tree-shakeable function API**](#tree-shakeable-function-api) — The same polyfill as standalone functions
- 🧩 [**For component libraries**](#for-component-libraries) — Use Temporal in a library without bundling a second date library
- 🔄 [**temporal-polyfill-codemod**](#temporal-polyfill-codemod) — Migrate from the function API to standard Temporal
- 🛠️ [**temporal-utils**](#temporal-utils) — Convenience helpers for standard Temporal objects
- 📐 [**temporal-spec**](#temporal-spec) — Standalone TypeScript type definitions for Temporal

---

<a id="temporal-polyfill"></a>

## 📦 temporal-polyfill

A lightweight polyfill for [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal). Under 20 kB gzipped and spec-compliant.

```sh
npm install temporal-polyfill
```

```js
import 'temporal-polyfill/global' // most common entrypoint

Temporal.Now.zonedDateTimeISO().toString()
// e.g. '2026-06-18T13:45:00-04:00[America/New_York]'
```

See the package README for other entrypoints, CDN usage, the expanded-calendar `/full/` build, and TypeScript setup.

📖 [**Read the temporal-polyfill docs →**](./polyfill/README.md)

---

<a id="tree-shakeable-function-api"></a>

## 🌳 Tree-shakeable function API

Also shipped inside `temporal-polyfill`, for library authors and bundle-size-sensitive apps. Every Temporal operation is exposed as a standalone function operating on plain record objects rather than `Temporal.*` classes, so your bundler keeps only the functions you import.

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2026, 6, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2026-08-01'
```

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*`, such as `temporal-polyfill/fns/ZonedDateTime`.

📖 [**Read the tree-shakeable API docs →**](./docs/fns/index.md)

---

<a id="for-component-libraries"></a>

## 🧩 For component libraries

Date pickers, schedulers, and other calendar-driven libraries usually end up bundling their own date utility library or asking consumers to configure an adapter.

With the [tree-shakeable API](./docs/fns/index.md), a component library can declare `temporal-polyfill` as a peer dependency and import only the functions it needs. Host applications decide whether to load the global polyfill (for browsers and runtimes without native `Temporal`), and because both entrypoints come from the same package, the bundler deduplicates the shared internals:

```
app
|
├─▶ temporal-polyfill/global ····┐
|                  (optional)    |
└─▶ <DatePicker>                 ├─▶ one shared copy of internals
     |                           |
     └─▶ temporal-polyfill/fns ··┘
        (only select functions)
```

Once native `Temporal` is available in all environments you support, [temporal-polyfill-codemod](./codemod/README.md) rewrites the function calls to standard `Temporal.*` code so you can remove the dependency with no lock-in.

📖 [**Read more: For component authors →**](./docs/fns/for-component-authors.md)

---

<a id="temporal-polyfill-codemod"></a>

## 🔄 temporal-polyfill-codemod

Automated migrations for `temporal-polyfill` codebases. The `fns-to-temporal` transform rewrites code using the [tree-shakeable function API](./docs/fns/index.md) into standard `Temporal` objects and methods.

```sh
npx temporal-polyfill-codemod fns-to-temporal <path>
```

```ts
// Before
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
const date = PlainDateFns.create(2024, 5, 1)
const next = PlainDateFns.addDays(date, 3)

// After
const date = new Temporal.PlainDate(2024, 5, 1)
const next = date.add({ days: 3 })
```

Any usage that cannot be rewritten unambiguously is left unchanged and reported as a diagnostic with a non-zero exit code.

📖 [**Read the codemod docs →**](./codemod/README.md)

---

<a id="temporal-utils"></a>

## 🛠️ temporal-utils

Convenience helpers for standard `Temporal` objects (not the tree-shakeable function API), covering common operations that Temporal leaves out: `startOfMonth`, `endOfDay`, `diffDays`, `roundToWeek`, and similar utilities. Most helpers preserve the input type (`PlainDate` returns `PlainDate`, `ZonedDateTime` returns `ZonedDateTime`).

```sh
npm install temporal-utils
```

```ts
import { startOfMonth, diffDays } from 'temporal-utils'

startOfMonth(Temporal.PlainDate.from('2024-07-20')).toString()
// '2024-07-01'

diffDays(
  Temporal.PlainDate.from('2024-07-01'),
  Temporal.PlainDate.from('2024-07-20'),
)
// 19
```

`temporal-utils` works on any standard `Temporal` instances (native, global polyfill, or local ponyfill import). The examples above assume a global `Temporal`, such as native `Temporal` or [`temporal-polyfill`](./polyfill/README.md).

📖 [**Read the temporal-utils docs →**](./utils/README.md)

---

<a id="temporal-spec"></a>

## 📐 temporal-spec

Standalone TypeScript type definitions for Temporal (plus the Temporal additions to `Intl` and `Date`), with no runtime code. It is the type layer used by `temporal-polyfill` and is published separately so other implementations and apps can share the same declarations.

```sh
npm install temporal-spec
```

```ts
import type { Temporal } from 'temporal-spec'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```

Useful on TypeScript < 6.0 (which lacks built-in Temporal types) or when you want namespaced imports without modifying the global scope.

📖 [**Read the temporal-spec docs →**](./spec/README.md)
