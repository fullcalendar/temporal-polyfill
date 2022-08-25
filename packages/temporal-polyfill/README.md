
# temporal-polyfill

A spec-compliant [Temporal] JavaScript polyfill in 16kb.

[Codepen](https://codepen.io/arshaw/pen/VwrMQPJ?editors=1111)

[CDN link](https://cdn.jsdelivr.net/npm/temporal-polyfill@0.0.8/dist/global.js)
<!-- NOTE: when updating this link, update the codepen too -->


## Browser Support

| Minimum required version if... | Chrome | Edge | Safari | Safari iOS | Firefox | Node |
| --- | --- | --- | --- | --- | --- | --- |
| ...transpiling to target environment | 36 (Jul 2014) | 14 (Aug 2016) | 10 (Sep 2016) | 10 (Sep 2016) | 52 (Mar 2017) | 12 (Apr 2019) |
| ...leaving untranspiled | 60 (Jul 2017) | 79 (Jan 2020) | 11.1 (Mar 2018) | 11.3 (Mar 2018) | 55 (Aug 2017) | 12 (Apr 2019) |
| ...using BigInt features | 67 (May 2018) | 79 (Jan 2020) | 14 (Sep 2020) | 14 (Sep 2020) | 68 (July 2019) | 12 (Apr 2019) |


## BigInt Considerations

This polyfill works fine in environments without [BigInt]. However, without BigInt, the following will throw errors:

| ❌ Avoid microseconds/nanoseconds | ✅ Use milliseconds instead |
| -------------------------------- | --------------------------- |
| `instant.epochMicroseconds` | `instant.epochMilliseconds` |
| `instant.epochNanoseconds` | `instant.epochMilliseconds` |
| `Temporal.Instant.fromEpochMicroseconds(micro)` | `Temporal.Instant.fromEpochMilliseconds(milli)` |
| `Temporal.Instant.fromEpochNanoseconds(nano)` | `Temporal.Instant.fromEpochMilliseconds(milli)` |
| `new Temporal.Instant(nano)` | `Temporal.Instant.fromEpochMilliseconds(milli)` |
| `zonedDateTime.epochMicroseconds` | `zonedDateTime.epochMilliseconds` |
| `zonedDateTime.epochNanoseconds` | `zonedDateTime.epochMilliseconds` |
| `new Temporal.ZonedDateTime(nano, tz, cal)` | `Temporal.Instant.fromEpochMilliseconds(milli).toZonedDateTimeISO()` |
|                                             | `Temporal.Instant.fromEpochMilliseconds(milli).toZonedDateTime(cal)` |

FYI, it is not possible to properly polyfill BigInt. [More Information][JSBI-why]


## Installation

```
npm install temporal-polyfill
```

**A) Import globally:**

```js
import 'temporal-polyfill/global'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```

**B) Import as an ES module** without side effects:

```js
import { Temporal } from 'temporal-polyfill'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```

**C)** The above techniques try using the built-in `Temporal` object and fall back to the polyfill.
To guarantee using the polyfill, do this:

```js
import { Temporal } from 'temporal-polyfill/impl'

console.log(Temporal.Now.zonedDateTimeISO().toString())
```


[Temporal]: https://github.com/tc39/proposal-temporal
[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[JSBI-why]: https://github.com/GoogleChromeLabs/jsbi#why
