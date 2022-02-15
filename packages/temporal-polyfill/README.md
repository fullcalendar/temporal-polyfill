
# temporal-polyfill

A spec-compliant<super>*</super> [Temporal] JavaScript polyfill in less than 15kb<super>**</super>.


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

The above techniques will attempt to use the built-in `Temporal` global object and will fall
back to the polyfill. To guarantee using the polyfill, do this:

```js
import { ZonedDateTime } from 'temporal-polyfill/impl'

const zdt = ZonedDateTime.from('2020-08-05T20:06:13[America/Chicago]')
console.log(zdt.toLocaleString())
```


<super>*</super> = *almost* spec-compliant.
[a few more tests must pass](jest.config.cjs)
([see results](https://github.com/fullcalendar/temporal/actions))

<super>**</super> = the size might shrink further as the codebase is cleaned up


[Temporal]: https://github.com/tc39/proposal-temporal
