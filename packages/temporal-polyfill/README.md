
# temporal-polyfill

A lightweight polyfill for [Temporal](https://tc39.es/proposal-temporal/docs/), successor to the JavaScript `Date` object

Only 20 kB, [spec compliant](#spec-compliance)


## Table of Contents

- [Installation](#installation)
- [Entry Points](#entry-points)
- [TypeScript Types](#typescript-types)
- [Comparison with `@js-temporal/polyfill`](#comparison-with-js-temporalpolyfill)
- [Spec Compliance](#spec-compliance)
- [Browser Support](#browser-support)
- [BigInt Considerations](#bigint-considerations)
- [Tree-shakeable API](#tree-shakeable-api)


## Installation

```
npm install temporal-polyfill
```

The simplest way to start is the global install, which adds `Temporal` to the
global scope:

```js
import 'temporal-polyfill/global'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```

If the runtime already has a native `Temporal`, the polyfill steps aside and
uses it. For side-effect-free imports, app-controlled installation, and
all-calendar builds, see [Entry Points](#entry-points) below.

Or use a `<script>` tag with a CDN link:

```html
<script src='https://cdn.jsdelivr.net/npm/temporal-polyfill@{VERSION}/global.min.js'></script>
<script>
  console.log(Temporal.Now.zonedDateTimeISO().toString())
</script>
```

The default build covers ISO 8601 and Gregorian. For other calendars, load the
all-calendars `/full/` build instead:

```html
<script src='https://cdn.jsdelivr.net/npm/temporal-polyfill@{VERSION}/full/global.min.js'></script>
<script>
  // every calendar is bundled: hebrew, chinese, persian, islamic, …
  const date = Temporal.PlainDate.from('2024-01-01').withCalendar('hebrew')

  console.log(date.year) // 5784
  console.log(date.toLocaleString('en-US', { calendar: 'hebrew' }))
  // e.g. 'Tevet 20, 5784'
</script>
```


## Entry Points

`temporal-polyfill` offers a few entry points so you can choose **how** the
polyfill is applied and **which calendars** are bundled. They're native-aware
unless noted: when the runtime already has a built-in `Temporal`, the polyfill
uses it instead of the bundled implementation.

### How it's applied

- **`temporal-polyfill/global`** — installs `Temporal` onto the global scope on import.
- **`temporal-polyfill`** — no side effects; exports `Temporal` as a value to use directly (a ponyfill).
- **`temporal-polyfill/implementation`** — like the ponyfill, but **always** the bundled implementation, never native.
- **`temporal-polyfill/shim`** — no import side effects; you call `install()` yourself when ready.

```js
// Auto-install on the global scope.
import 'temporal-polyfill/global'

// Side-effect-free ponyfill — native when available, otherwise the bundled implementation.
import { Temporal } from 'temporal-polyfill'

// Side-effect-free, bundled implementation only (never native).
import { Temporal } from 'temporal-polyfill/implementation'

// App-controlled global installation.
import { install, installImplementation } from 'temporal-polyfill/shim'
install()               // installs the bundled implementation only if there's no native Temporal
installImplementation() // always installs the bundled implementation, even over a native one
```

The `install()` / `installImplementation()` pair follows the TC39 shim
convention (like `regexp.escape/shim`): `install()` defers to a native
`Temporal`, while `installImplementation()` is unconditional.

### Which calendars are included

Each entry point above comes in two variants:

- **Basic** (default) — the ISO 8601 and Gregorian calendars, for the smallest bundle.
- **Full** (`/full/…`) — every calendar Temporal supports, such as Chinese, Hebrew, and Persian.

```js
// Basic — ISO + Gregorian
import 'temporal-polyfill/global'
import { Temporal } from 'temporal-polyfill'
import { Temporal } from 'temporal-polyfill/implementation'
import { install } from 'temporal-polyfill/shim'

// Full — all calendars
import 'temporal-polyfill/full/global'
import { Temporal } from 'temporal-polyfill/full'
import { Temporal } from 'temporal-polyfill/full/implementation'
import { install } from 'temporal-polyfill/full/shim'
```

Only need a few operations? The [Tree-shakeable API](#tree-shakeable-api) lets
you import individual functions — and individual calendars — so your bundle
includes only what you use. It's always native-aware and needs no separate
`/full` build.


## TypeScript Types

If using the global import (`import 'temporal-polyfill/global'`), you must worry about where your types are coming from. You can choose one of two options:

**Options A)** If using TypeScript >= 6.0, modify your `tsconfig.json`:

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

**Options B)** If using TypeScript < 6.0, import types manually:

```diff
  import 'temporal-polyfill/global'
+ import 'temporal-polyfill/types/global'

  console.log(Temporal.Now.zonedDateTimeISO().toString())
```

Other entry points (like `import {} from 'temporal-polyfill'`) will load types automatically.


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
    <td>Minified+gzip size</td>
    <td><a href='https://bundlephobia.com/package/temporal-polyfill'>19.8 KB<a></td>
    <td><a href='https://bundlephobia.com/package/@js-temporal/polyfill'>51.9 KB</a> (+162%)</td>
  </tr>
  <tr>
    <td>Spec date</td>
    <td>
      Mar 2025
    </td>
    <td>
      Mar 2025
    </td>
  </tr>
  <tr>
    <td>BigInt approach</td>
    <td>Internally avoids BigInt operations altogether</td>
    <td>Internally relies on <a href='https://github.com/GoogleChromeLabs/jsbi'>JSBI</a></td>
  </tr>
  <tr>
    <td>Global usage in ESM</td>
    <td>
      <code>import 'temporal-polyfill/global'</code>
    </td>
    <td>Not currently possible</td>
  </tr>
</table>


## Spec Compliance

All calendar systems (ex: `chinese`, `persian`) and all time zones are supported.

Compliance with the latest version of the Temporal spec is near-perfect [with just 4 intentional deviations](https://github.com/fullcalendar/temporal-polyfill/blob/main/packages/temporal-polyfill/scripts/test262-config/expected-failures.txt).


## Browser Support

<table>
  <tr>
    <td colspan='6'>
      <strong>Minimum required browsers for ISO/gregory calendars:</strong>
    </td>
  </tr>
  <tr>
    <!-- Computed from Libraries+Syntax in worksheet below  -->
    <td>Chrome 60<br />(Jul 2017)</td>
    <td>Firefox 55<br />(Aug 2017)</td>
    <td>Safari 11.1<br />(Mar 2018)</td>
    <td>Safari iOS 11.3<br />(Mar 2018)</td>
    <td>Edge 79<br />(Jan 2020)</td>
    <td>Node.js 14<br />(Apr 2020)</td>
  </tr>
  <tr>
    <td colspan='6'>
      <br />
      <strong>If you transpile, you can support older browsers down to:</strong>
    </td>
  </tr>
  <tr>
    <!-- Computed from Libraries in worksheet below  -->
    <td>Chrome 57<br />(Mar 2017)</td>
    <td>Firefox 52<br />(Mar 2017)</td>
    <td>Safari 10<br />(Sep 2016)</td>
    <td>Safari iOS 10<br />(Sep 2016)</td>
    <td>Edge 15<br />(Apr 2017)</td>
    <td>Node.js 14<br />(Apr 2020)</td>
  </tr>
  <tr>
    <td colspan='6'>
      <br />
      <strong>For non-ISO/gregory calendars, requirements are higher:</strong>
    </td>
  </tr>
  <tr>
    <!-- https://caniuse.com/mdn-javascript_builtins_intl_datetimeformat_datetimeformat_options_parameter_options_calendar_parameter -->
    <td>Chrome 80<br />(Feb 2020)</td>
    <td>Firefox 76<br />(May 2020)</td>
    <td>Safari 14.1<br />(Apr 2021)</td>
    <td>Safari iOS 14.5<br />(Apr 2021)</td>
    <td>Edge 80<br />(Feb 2020)</td>
    <td>Node.js 14<br />(Apr 2020)</td>
  </tr>
</table>

<!--
## Browser Support Worksheet

Use caniuse's star feature to find intersection of features.

Libraries:
- [Intl.DateTimeFormat IANA time zone names](https://caniuse.com/mdn-javascript_builtins_intl_datetimeformat_datetimeformat_options_parameter_options_timezone_parameter_iana_time_zones)
- [Number.isInteger](https://caniuse.com/mdn-javascript_builtins_number_isinteger)
- [Number.isSafeInteger] (https://caniuse.com/mdn-javascript_builtins_number_issafeinteger)
- [String::padStart](https://caniuse.com/mdn-javascript_builtins_string_padstart)
- [WeakMap](https://caniuse.com/mdn-javascript_builtins_weakmap)

Syntax:
- [Classes](https://caniuse.com/es6-class)
- [Exponentiation](https://caniuse.com/mdn-javascript_operators_exponentiation)
- [Spread in array literals](https://caniuse.com/mdn-javascript_operators_spread_spread_in_arrays)
- [Spread in function calls](https://caniuse.com/mdn-javascript_operators_spread_spread_in_function_calls)
- [Spread in object literals](https://caniuse.com/mdn-javascript_operators_spread_spread_in_object_literals)

BigInt (https://caniuse.com/bigint):
- Chrome 67 (May 2018)
- Firefox 68 (Jul 2019)
- Safari 14 (Sep 2020)
- Safari iOS 14 (Sep 2020)
- Edge 79 (Jan 2020)

Node.js is always 14 because the test-runner doesn't work with lower
-->


## BigInt Considerations

This polyfill does NOT depend on [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) support. Internally, no operations leverage BigInt arithmetics. :thumbsup:

However, if you plan to use methods that accept/emit BigInts, your environment must support it. Alternatively, you can avoid using these methods altogether. [There's a cheatsheet](https://gist.github.com/arshaw/1ef4bf945d68654b86cef2dd8471c48f) to help you.


## Tree-shakeable API

For library authors and other developers who are hyper-concerned about bundle
size, `temporal-polyfill` also ships an alternate, function-based API designed
for tree-shaking. Instead of large `Temporal.*` classes, every operation is a
standalone function that acts on a plain record, so a bundler keeps only the
functions you actually import.

```js
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'

const date = PlainDateFns.create(2024, 1, 1)
const later = PlainDateFns.addMonths(date, 2)

PlainDateFns.toString(later) // '2024-03-01'
```

Each Temporal type has its own entrypoint under `temporal-polyfill/fns/*` — for
example `temporal-polyfill/fns/PlainDate` or `temporal-polyfill/fns/ZonedDateTime`.
See the **[Tree-shakeable API docs](./docs/fns/index.md)** for the full catalog
of functions, their TypeScript type exports, and how each one maps back to the
standard `Temporal` API.
