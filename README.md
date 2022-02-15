
# Temporal Monorepo

A lightweight [Temporal] polyfill and other futuristic JavaScript date utilities.


## temporal-polyfill

A spec-compliant polyfill in less than 15kb.

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

[Read more about temporal-polyfill](packages/temporal-polyfill/README.md)


## Repo Dev Commands

```
yarn build
yarn watch
yarn test --watch
yarn test --coverage
yarn lint
yarn size
```


[Temporal]: https://github.com/tc39/proposal-temporal
