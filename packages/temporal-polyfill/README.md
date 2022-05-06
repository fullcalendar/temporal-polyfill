
# temporal-polyfill

A spec-compliant [Temporal] JavaScript polyfill in 16kb<super>*</super>.

Works in modern browsers<super>**</super>, not Internet Explorer.

[Codepen](https://codepen.io/arshaw/pen/VwrMQPJ?editors=1111)

[CDN link](https://cdn.jsdelivr.net/npm/temporal-polyfill@0.0.6/dist/global.js)
<!-- NOTE: when updating this link, update the codepen too -->

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

<super>*</super> = the size will shrink as the codebase is cleaned up

<super>**</super> = targets browsers that support [BigInt], however, more browser-compatibility
work is needed


[Temporal]: https://github.com/tc39/proposal-temporal
[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
