
# Temporal Monorepo

A lightweight [Temporal] polyfill and other futuristic JavaScript date utilities.


## Project Updates

- **2023-04-22:** The codebase is undergoing a refactor to respond to the lastest changes in the [Temporal] spec. This refactor will also improve minification size, performance, and conformance to [TC39 tests](https://github.com/tc39/test262). Please subscribe to [this ticket](https://github.com/fullcalendar/temporal/issues/3) for updates.
- **2023-09-12:** The refactor [is going well](https://github.com/fullcalendar/temporal/issues/3#issuecomment-1716106547). A number of bugfixes and bundle-size optimizations are outstanding.

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
pnpm build
pnpm watch
pnpm test --watch
pnpm test --coverage
pnpm lint
pnpm size
```


[Temporal]: https://github.com/tc39/proposal-temporal
