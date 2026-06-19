
# temporal-polyfill

A lightweight polyfill for [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal), successor to the JavaScript `Date` object 🕒

Less than 20 kB, [spec compliant](#spec-compliance)

🌳 Need an even smaller footprint? Check out the [tree-shakeable API](../docs/fns/index.md)

## Table of Contents

- [Installation](#installation)
- [Package Entrypoints](#package-entrypoints)
- [CDN Usage](#cdn-usage)
- [Global TypeScript Types](#global-typescript-types)
- [Spec Compliance](#spec-compliance)
- [Supported Environments](#supported-environments)
- [Comparison with `@js-temporal/polyfill`](#comparison-with-js-temporalpolyfill)
- [Tree-shakeable API](#tree-shakeable-api)

## Installation

```
npm install temporal-polyfill
```

```js
import 'temporal-polyfill/global' // most common entrypoint
```

Or learn about [CDN usage](#cdn-usage)

## Package Entrypoints

The following entrypoints support the `iso8601` and `gregory` calendar systems only:

- Global polyfill. Uses native if available. 👈 **What most people need**

  ```js
  import 'temporal-polyfill/global'

  Temporal.Now.zonedDateTimeISO().toString()
  ```

- Local side-effect-free import (ponyfill). Uses native if available

  ```js
  import { Temporal } from 'temporal-polyfill'

  Temporal.Now.zonedDateTimeISO().toString()
  ```

- Forced non-native side-effect-free import

  ```js
  import { Temporal } from 'temporal-polyfill/implementation'

  Temporal.Now.zonedDateTimeISO().toString()
  ```

- Install the global polyfill *when* you want

  ```js
  import { install } from 'temporal-polyfill/shim'

  install() // uses native if available

  Temporal.Now.zonedDateTimeISO().toString()
  ```

- Install the non-native implementation globally based on a custom condition

  ```js
  import { installImplementation } from 'temporal-polyfill/shim'

  if (!globalThis.Temporal || CUSTOM_CONDITION) {
    installImplementation()
  }

  Temporal.Now.zonedDateTimeISO().toString()
  ```

The `/full/` entrypoints support an expanded set of calendar systems: `buddhist`, `chinese`, `coptic`, `dangi`, `ethiopic`, `ethioaa`, `hebrew`, `indian`, `islamic-civil`, `islamic-tbla`, `islamic-umalqura`, `japanese`, `persian`, and `roc`.

- Global polyfill. Uses native if available

  ```js
  import 'temporal-polyfill/full/global'

  Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString()
  ```

- Local side-effect-free import (ponyfill). Uses native if available

  ```js
  import { Temporal } from 'temporal-polyfill/full'

  Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString()
  ```

- Forced non-native side-effect-free import

  ```js
  import { Temporal } from 'temporal-polyfill/full/implementation'

  Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString()
  ```

- Install the global polyfill *when* you want

  ```js
  import { install } from 'temporal-polyfill/full/shim'

  install() // uses native if available

  Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString()
  ```

- Install the non-native implementation globally based on a custom condition

  ```js
  import { installImplementation } from 'temporal-polyfill/full/shim'

  if (!globalThis.Temporal || CUSTOM_CONDITION) {
    installImplementation()
  }

  Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString()
  ```


## CDN Usage

Globally install the polyfill that supports only the `iso8601` and `gregory` calendar systems. Uses native if available.

```html
<script src='https://cdn.jsdelivr.net/npm/temporal-polyfill@1.0.1/global.min.js'></script>
<script>
  console.log(Temporal.Now.zonedDateTimeISO().toString())
</script>
```

Globally install the `/full/` polyfill that supports an expanded set of calendar systems: `buddhist`, `chinese`, `coptic`, `dangi`, `ethiopic`, `ethioaa`, `hebrew`, `indian`, `islamic-civil`, `islamic-tbla`, `islamic-umalqura`, `japanese`, `persian`, and `roc`.

```html
<script src='https://cdn.jsdelivr.net/npm/temporal-polyfill@1.0.1/full/global.min.js'></script>
<script>
  console.log(Temporal.Now.zonedDateTimeISO().withCalendar('buddhist').toString())
</script>
```


## Global TypeScript Types

If using the `temporal-polyfill/global` or `temporal-polyfill/full/global` entrypoints, you must configure types:

### If using TypeScript >= 6.0

In your `tsconfig.json`:

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

### If using TypeScript < 6.0

Write an ESM import that loads the types:

```diff
  import 'temporal-polyfill/global'
+ import 'temporal-polyfill/types/global'

  console.log(Temporal.Now.zonedDateTimeISO().toString())
```

## Spec Compliance

All time zones are supported. The following calendar systems are supported: `buddhist`, `chinese`, `coptic`, `dangi`, `ethiopic`, `ethioaa`, `hebrew`, `indian`, `islamic-civil`, `islamic-tbla`, `islamic-umalqura`, `japanese`, `persian`, and `roc`.

Compliance with the latest version of the Temporal spec is near-perfect [with just 1 intentional deviation](./scripts/test262-expected-failures/shim.txt).


## Supported Environments

<!--
https://caniuse.com/bigint
https://caniuse.com/mdn-javascript_builtins_intl_datetimeformat_datetimeformat_options_parameter_options_calendar_parameter
-->

| Browser    | Minimum Release | For `chinese`, `dangi`, `islamic-umalqura` |
| :--------- | --------------: | -----------------------------------------: |
| Chrome     |   67 (May 2018) |                              80 (Feb 2020) |
| Firefox    |   68 (Jul 2019) |                              76 (May 2020) |
| Safari     |   14 (Sep 2020) |                            14.1 (Apr 2021) |
| Safari iOS |   14 (Sep 2020) |                            14.5 (Apr 2021) |
| Edge       |   79 (Jan 2020) |                              80 (Feb 2020) |

Node.js is supported down to version 16 (Released Apr 2021, EOL since Sep 2023)

## Comparison with `@js-temporal/polyfill`

<table>
  <tr>
    <td>Package</td>
    <td>
      <code>temporal-polyfill</code>
    </td>
    <td>
      <code>@js-temporal/polyfill</code>
    </td>
  </tr>
  <tr>
    <td>Repo</td>
    <td>
      <a href='https://github.com/fullcalendar/temporal-polyfill'>
        fullcalendar/temporal-polyfill
      </a>
    </td>
    <td>
      <a href='https://github.com/js-temporal/temporal-polyfill'>
        js-temporal/temporal-polyfill
      </a>
    </td>
  </tr>
  <tr>
    <td>Creators</td>
    <td><a href='https://fullcalendar.io/'>FullCalendar</a> lead dev <a href='https://github.com/arshaw'>arshaw</a></td>
    <td>Champions of the <a href='https://github.com/tc39/proposal-temporal'>Temporal proposal</a></td>
  </tr>
  <tr>
    <td><a href='./scripts/size-comparison/RESULTS.md'>Min+gzip size</a></td>
    <td>19.6 kB, 23.5 kB (full)</td>
    <td>52.1 kB (+166%, +122%)</td>
  </tr>
  <tr>
    <td>Spec date</td>
    <td>
      June 2026
    </td>
    <td>
      March 2025
    </td>
  </tr>
  <tr>
    <td>BigInt approach</td>
    <td>Uses real <code>bigint</code> sparingly</td>
    <td>Internally relies on <a href='https://github.com/GoogleChromeLabs/jsbi'>JSBI</a></td>
  </tr>
  <tr>
    <td>Global install</td>
    <td>Possible via <a href='#package-entrypoints'>ESM</a> and <a href='#cdn-usage'>CDN</a></td>
    <td>Not currently possible</td>
  </tr>
</table>


## Tree-shakeable API 🌳

For anyone hyper-concerned about bundle size, `temporal-polyfill` also ships an
alternate function API designed for tree-shaking. Instead of large `Temporal.*`
classes, every operation is a standalone function that acts on a plain record,
so a bundler keeps only the functions you actually import.

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2026, 6, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2026-08-01'
```

🤝 **Building a component library?** The function API is built to be a shared,
deletable peer dependency for third-party tools like date pickers and
schedulers. See [For component authors](../docs/fns/for-component-authors.md).

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*` — for
example `temporal-polyfill/fns/PlainDate` or `temporal-polyfill/fns/ZonedDateTime`.

Best of all, this isn't a one-way door. When the time is right — once native
`Temporal` is available in every environment you target, and you no longer need
the polyfill — [temporal-polyfill-codemod](../codemod/README.md)
rewrites your function calls back into idiomatic `Temporal.*` expressions.
So `PlainDateFns.addMonths(date, 2)` becomes `date.add({ months: 2 })`,
with no manual find-and-replace.

📖 [**Read the full Tree-shakeable API docs →**](../docs/fns/index.md)

The docs cover the complete catalog of functions, their TypeScript type exports,
the codemod workflow, and how each function maps back to the standard `Temporal`
API.
