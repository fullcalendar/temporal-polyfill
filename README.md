
# Temporal Monorepo

A lightweight [Temporal] polyfill and other futuristic JavaScript date utilities.


## temporal-polyfill

A spec-compliant polyfill in 16kb.

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
