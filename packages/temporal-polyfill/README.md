
# temporal-polyfill

A spec-compliant<super>*</super> [Temporal] JavaScript polyfill in less than 15kb<super>**</super>.

Works in modern browsers<super>***</super>, not Internet Explorer.

[Codepen](https://codepen.io/arshaw/pen/VwrMQPJ?editors=1111)


## Installation

```
npm install temporal-polyfill
```

**A) Import globally:**

```js
import 'temporal-polyfill/global'

// the global Temporal object is now available
const zdt = Temporal.ZonedDateTime.from('2020-08-05T20:06:13[America/Chicago]')
console.log(zdt.toLocaleString())
```

**B) Import as an ES module** without side effects:

```js
import { ZonedDateTime } from 'temporal-polyfill'

const zdt = ZonedDateTime.from('2020-08-05T20:06:13[America/Chicago]')
console.log(zdt.toLocaleString())
```

**C)** The above techniques try using the built-in `Temporal` object and fall back to the polyfill.
To guarantee using the polyfill, do this:

```js
import { ZonedDateTime } from 'temporal-polyfill/impl'

const zdt = ZonedDateTime.from('2020-08-05T20:06:13[America/Chicago]')
console.log(zdt.toLocaleString())
```


<super>*</super> = *almost* spec-compliant.
[a few more tests must pass](jest.config.cjs)
([see results](https://github.com/fullcalendar/temporal/actions))

<super>**</super> = the size will shrink as the codebase is cleaned up

<super>***</super> = targets browsers that support [BigInt], however, more browser-compatibility
work is needed


[Temporal]: https://github.com/tc39/proposal-temporal
[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
