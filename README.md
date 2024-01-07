
# temporal-polyfill

A lightweight polyfill for [Temporal](https://tc39.es/proposal-temporal/docs/), successor to the JavaScript `Date` object.

Only 20.0 kB, with near-perfect [spec compliance](#spec-compliance).


## Table of Contents

- [Installation](#installation)
- [Comparison with `@js-temporal/polyfill`](#comparison-with-js-temporalpolyfill)
- [Spec Compliance](#spec-compliance)
- [Browser Support](#browser-support)
- [BigInt Considerations](#bigint-considerations)
- [Tree-shakeable API](#tree-shakeable-api) (coming soon)


## Installation

```
npm install temporal-polyfill
```

Import as an ES module without side effects:

```js
import { Temporal } from 'temporal-polyfill'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```

Or, import globally:

```js
import 'temporal-polyfill/global'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```

Use a `<script>` tags with a CDN link:

```html
<script src='https://cdn.jsdelivr.net/npm/temporal-polyfill@0.2.0/global.min.js'></script>
<script>
  console.log(Temporal.Now.zonedDateTimeISO().toString())
</script>
```


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
        github.com/fullcalendar/temporal-polyfill
      </a>
    </td>
    <td>
      <a href='https://github.com/js-temporal/temporal-polyfill'>
        github.com/js-temporal/temporal-polyfill
      </a>
    </td>
  </tr>
  <tr>
    <td>Creators</td>
    <td><a href='https://fullcalendar.io/'>FullCalendar</a> lead dev <a href='https://github.com/arshaw'>arshaw</a></td>
    <td>Champions of the <a href='https://github.com/tc39/proposal-temporal'>Temporal proposal</a></td>
  </tr>
  <tr>
    <td>Minified+gzip size &#10013;</td>
    <td>20.0 kB</td>
    <td>43.2 kB (+116%)</td>
  </tr>
  <tr>
    <td>Minified-only size &#10013;</td>
    <td>58.7 kB</td>
    <td>206.0 kB (+251%)</td>
  </tr>
  <tr>
    <td>Spec compliance</td>
    <td>
      Strict compliance for common API.<br />
      Functional compliance for <i>custom-implemented</i> Calendar/TimeZone,<br />
      though internal calling order may differ (<a href='#spec-compliance'>more info</a>).
    </td>
    <td>
      Strict compliance for entire API.
    </td>
  </tr>
  <tr>
    <td>Spec date</td>
    <td>
      Nov 2023 (latest)
    </td>
    <td>
      May 2023
    </td>
  </tr>
  <tr>
    <td>BigInt Approach</td>
    <td>Internally avoids BigInt operations altogether</td>
    <td>Internally relies on <a href='https://github.com/GoogleChromeLabs/jsbi'>JSBI</a></td>
  </tr>
  <tr>
    <td>Global usage in ESM/CJS</td>
    <td>
      <pre><code>import 'temporal-polyfill/global'; // ESM
require('temporal-polyfill/global'); // CJS</code></pre>
    </td>
    <td>Not currently possible</td>
  </tr>
  <tr>
    <td>Global usage directly in browser</td>
    <td>
      <pre><code>&lt;script&gt;
&nbsp;&nbsp;Temporal.Now.zonedDateTimeISO()
&lt;/script&gt;</code></pre>
    </td>
    <td>
      <pre><code>&lt;script&gt;
&nbsp;&nbsp;temporal.Temporal.Now.zonedDateTimeISO()
&lt;/script&gt;</code></pre>
    </td>
  </tr>
</table>

&#10013; Compares [global.min.js](https://cdn.jsdelivr.net/npm/temporal-polyfill@0.2.0/global.min.js) with [index.esm.js](https://cdn.jsdelivr.net/npm/@js-temporal/polyfill@0.4.4/dist/index.esm.js), which are similarly transpiled.


## Spec Compliance

All calendar systems (ex: `chinese`, `persian`) and time zones are supported.

Compliance with the latest version of the Temporal spec (Nov 2023) is near-perfect with the following intentional deviations:

- `Duration::toString` does not display units greater than `Number.MAX_SAFE_INTEGER` according to spec. Precision is chosen differently.
- *Custom implementations* of Calendars and TimeZones are queried differently. Only affects those subclassing built-in classes, which is extremely rare. See the CALLING entries in the [test-ignore file](https://github.com/fullcalendar/temporal/blob/main/packages/temporal-polyfill/scripts/test-config/expected-failures.txt).
- There are believed to be 3 bugs in the Temporal spec itself, one of which [has been filed](https://github.com/tc39/proposal-temporal/issues/2742). See SPEC-BUG entries in the [test-ignore file](https://github.com/fullcalendar/temporal/blob/main/packages/temporal-polyfill/scripts/test-config/expected-failures.txt).
- Canonicalization of time zone IDs is simplified, leveraging the built-in `Intl` API.
- `Intl.DateTimeFormat` has not been polyfilled to accept number-offset values for the `timeZone` option.
- Method descriptors and `Function::length` are not strictly compliant due to ES-related space-saving techniques.

The [Official ECMAScript Conformance Test Suite](https://github.com/tc39/test262) has:

- 6811 *total* Temporal-related test files
- 6138 *passed* by `temporal-polyfill`
- 495 *ignored* due to superficial method descriptor compliance
- 178 *ignored* due to other aforementioned intentional deviations


## Browser Support

<table>
  <tr>
    <th colspan='6'>
      Minimum required browsers:
    </th>
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
    <th colspan='6'>
      If you transpile, you can support older browsers down to:
    </th>
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
</table>

<!--
## Browser Support Worksheet

Use caniuse's star feature to find intersection of features.

Libraries:
- [Intl.DateTimeFormat IANA time zone names](https://caniuse.com/mdn-javascript_builtins_intl_datetimeformat_datetimeformat_options_parameter_options_timezone_parameter_iana_time_zones)
- [Number.isInteger](https://caniuse.com/mdn-javascript_builtins_number_isinteger)
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

This polyfill works fine in environments that do not support [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).

However, to use methods that accept/emit them, your browser [must support BigInt](https://caniuse.com/bigint).

Here's how to sidestep this browser compatibility issue:

<table>
  <tr>
    <th>❌ Avoid microseconds/nanoseconds</th>
    <th>✅ Use milliseconds instead</th>
  </tr>
  <tr>
    <td><code>instant.epochMicroseconds</code></td>
    <td><code>instant.epochMilliseconds</code></td>
  </tr>
  <tr>
    <td><code>instant.epochNanoseconds</code></td>
    <td><code>instant.epochMilliseconds</code></td>
  </tr>
  <tr>
    <td><code>Temporal.Instant.fromEpochMicroseconds(micro)</code></td>
    <td><code>Temporal.Instant.fromEpochMilliseconds(milli)</code></td>
  </tr>
  <tr>
    <td><code>Temporal.Instant.fromEpochNanoseconds(nano)</code></td>
    <td><code>Temporal.Instant.fromEpochMilliseconds(milli)</code></td>
  </tr>
  <tr>
    <td><code>new Temporal.Instant(nano)</code></td>
    <td><code>Temporal.Instant.fromEpochMilliseconds(milli)</code></td>
  </tr>
  <tr>
    <td><code>zonedDateTime.epochMicroseconds</code></td>
    <td><code>zonedDateTime.epochMilliseconds</code></td>
  </tr>
  <tr>
    <td><code>zonedDateTime.epochNanoseconds</code></td>
    <td><code>zonedDateTime.epochMilliseconds</code></td>
  </tr>
  <tr>
    <td>
      <code>
        new Temporal.ZonedDateTime(nano, tz, cal)
      </code>
    </td>
    <td>
      <code>
        Temporal.Instant.fromEpochMilliseconds(milli)<br />
        &nbsp;&nbsp;.toZonedDateTimeISO() // or toZonedDateTime
      </code>
    </td>
</table>


## Tree-shakeable API

🚧 Coming Soon

For library authors and other devs who are hyper-concerned about bundle size, `temporal-polyfill` will be providing an alternate API designed for tree-shaking.

```js
import * as ZonedDateTime from 'temporal-polyfill/fns/zoneddatetime'

const zdt = ZonedDateTime.from({ year: 2024, month: 1, day: 1 })
const s = ZonedDateTime.toString(zdt) // not how you normally call a method!
```
