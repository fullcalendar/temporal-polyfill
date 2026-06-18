# temporal-polyfill monorepo

> [!NOTE]
> 🎉 **temporal-polyfill 1.0 is out!** See the [1.0 release notes](#) for everything new.

A collection of packages for working with [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal), the modern successor to the JavaScript `Date` object 🕒

The headliner is **[temporal-polyfill](#temporal-polyfill)** — a tiny, spec-compliant polyfill. The other packages orbit it: a tree-shakeable function API, a migration codemod, convenience helpers, and standalone TypeScript types.

## Contents

- 📦 [**temporal-polyfill**](#temporal-polyfill) — A lightweight, spec-compliant polyfill for Temporal
- 🌳 [**Tree-shakeable function API**](#tree-shakeable-function-api) — The same polyfill as standalone, tree-shakeable functions
- 🤝 [**Built to be shared**](#built-to-be-shared) — Why the tree-shakeable API is a great fit for component libraries
- 🔄 [**temporal-polyfill-codemod**](#temporal-polyfill-codemod) — Convert the tree-shakeable API to idiomatic Temporal
- 🛠️ [**temporal-utils**](#temporal-utils) — Handy helpers for idiomatic Temporal objects
- 📐 [**temporal-spec**](#temporal-spec) — Standalone TypeScript type definitions for Temporal

---

<a id="temporal-polyfill"></a>

## 📦 temporal-polyfill

A lightweight polyfill for [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal), the successor to the JavaScript `Date` object. Less than 20 kB and spec-compliant.

```sh
npm install temporal-polyfill
```

```js
import 'temporal-polyfill/global' // most common entrypoint

Temporal.Now.zonedDateTimeISO().toString()
// '2026-06-18T13:45:00-04:00[America/New_York]'
```

See the full docs for the other entrypoints, CDN usage, the expanded-calendar `/full/` build, and TypeScript setup.

📖 [**Read the full temporal-polyfill docs →**](./polyfill/README.md)

---

<a id="tree-shakeable-function-api"></a>

## 🌳 Tree-shakeable function API

Shipped inside `temporal-polyfill`, but a different beast. For library authors and anyone hyper-concerned about bundle size, every Temporal operation is exposed as a standalone function that acts on a plain record. Instead of pulling in entire `Temporal.*` classes, your bundler keeps only the functions you actually import.

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2026, 6, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2026-08-01'
```

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*`, such as `temporal-polyfill/fns/ZonedDateTime`.

📖 [**Read the full Tree-shakeable API docs →**](./docs/fns/index.md)

---

<a id="built-to-be-shared"></a>

## 🤝 Built to be shared

If you build a date picker, scheduler, or any calendar-driven component, you know the date-library dilemma: bundle `dayjs`/`date-fns`, hand-roll helpers around `Date`, or pull in an adapter like `date-io` and make your users pick a library. Each path bundles *another* date library into every app that installs your component.

The [tree-shakeable API](./docs/fns/index.md) is designed to end that — and to make Temporal the shared standard third-party components can finally agree on.

**Shared, not duplicated.** Depend on `temporal-polyfill` as a peer dependency and import only the tree-shakeable functions you need — you never force the full polyfill onto anyone. Whether to load it is the host app's call, driven by which browsers and runtimes they need to support (Safari and older environments still lack native `Temporal`). And because that's the *same package* your component already draws from, the shared internals dedupe instead of doubling up:

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

**A dependency you can delete.** Adopt the tree-shakeable API today, and when native Temporal is everywhere you target, [the codemod](./codemod/README.md) rewrites your code into idiomatic `Temporal.*` and the dependency falls away. No lock-in — and because each function maps one-to-one onto its `Temporal.*` equivalent, the migration is mechanical, with few edge cases and little to debug.

📖 [**Read more: For component authors →**](./docs/fns/for-component-authors.md)

---

<a id="temporal-polyfill-codemod"></a>

## 🔄 temporal-polyfill-codemod

Automated migrations for `temporal-polyfill` codebases. The current transform, `fns-to-temporal`, rewrites code that uses the [tree-shakeable function API](./docs/fns/index.md) into idiomatic Temporal — real `Temporal` objects and their methods — so you can drop the polyfill once native Temporal has landed everywhere you target.

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

It's deliberately conservative — anything it can't unambiguously rewrite is left untouched and reported as a migration-blocking diagnostic, so CI catches an incomplete migration.

📖 [**Read the full codemod docs →**](./codemod/README.md)

---

<a id="temporal-utils"></a>

## 🛠️ temporal-utils

Small, convenience helpers for the **idiomatic** `Temporal.*` API — not the tree-shakeable API above — providing the everyday `startOfMonth`, `endOfDay`, `diffDays`, and `roundToWeek` operations Temporal itself doesn't ship. They're what you reach for once you're writing real `Temporal` objects and methods (whether via the polyfill, native Temporal, or after running the codemod). Most helpers preserve the input type: pass a `PlainDate`, get a `PlainDate` back; pass a `ZonedDateTime`, get a `ZonedDateTime` back.

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

`temporal-utils` operates on a global `Temporal`, so pair it with `temporal-polyfill` (or native Temporal) at runtime.

📖 [**Read the full temporal-utils docs →**](./utils/README.md)

---

<a id="temporal-spec"></a>

## 📐 temporal-spec

Standalone TypeScript type definitions for Temporal — **only** `.d.ts` files, no runtime code. It describes the shape of the Temporal API (plus the Temporal-related additions to `Intl` and `Date`) so any implementation, polyfill, or application can share a single, accurate set of types. It's the type layer behind `temporal-polyfill`, published separately so other implementations can reuse it.

```sh
npm install temporal-spec
```

```ts
import type { Temporal } from 'temporal-spec'

function format(zdt: Temporal.ZonedDateTime): string {
  return zdt.toString()
}
```

Most useful on **TypeScript < 6.0** (which has no built-in Temporal types) or when you want the namespaced, non-global form that `lib` doesn't provide.

📖 [**Read the full temporal-spec docs →**](./spec/README.md)
