# For component authors 🧩

Guidance for authors of reusable libraries such as date pickers, schedulers, and calendar grids that need date math internally.

Component libraries usually have to choose between bundling a date library like `dayjs` or `date-fns`, writing custom `Date` helpers, or introducing an adapter layer like `date-io`. Every one of those options adds another date library to every app that installs your component.

The [tree-shakeable API](./index.md) shares its internals with the host app's own Temporal polyfill, so your component doesn't bundle a second date library, and you can remove the dependency once native `Temporal` is available everywhere you target.

## Shared, not duplicated

List `temporal-polyfill` as a peer dependency in your library's `package.json` so the host application controls the single installed copy:

```json
{
  "peerDependencies": {
    "temporal-polyfill": "^1.0.1"
  }
}
```

Import only the functions you need from `temporal-polyfill/fns/*`:

```js
// inside your component library
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
```

Your library never forces the full class-based polyfill into the bundle. The host application decides whether to load `temporal-polyfill/global` based on the browsers and runtimes it targets (for example, Safari and older environments without native `Temporal`).

Because both entrypoints live in the same package and share the same internal implementation, the bundler deduplicates them:

```
app
|
├─▶ temporal-polyfill/global ····┐
|                  (optional)    |
└─▶ <DatePicker>                 ├─▶ one shared copy of internals
     |                           |
     └─▶ temporal-polyfill/fns ··┘
        (only select functions)
```

Multiple components depending on `temporal-polyfill/fns` share a single copy of the internals, and an app that also loads `temporal-polyfill/global` pays little extra.

The host application still needs `temporal-polyfill` installed so the peer dependency resolves. The `fns` functions operate on plain records and do not require a global `Temporal`, except for interop helpers like `toTemporal` which read the global at call time (see [Temporal Interop](./index.md#temporal-interop)).

### Non-ISO calendars

Unlike the class-based API, which resolves calendar IDs automatically, the `fns` API requires you to resolve and pass calendar objects explicitly. See the [`fns-and-global` example project](../../examples/fns-and-global) for a working setup that combines non-ISO calendars, the function API, and the global polyfill.

## A dependency you can delete

Once native `Temporal` is available in every environment your library supports, run [temporal-polyfill-codemod](../../codemod/README.md) to rewrite your `temporal-polyfill/fns/*` calls to standard `Temporal.*` expressions and drop the `temporal-polyfill` peer dependency. No lock-in: each function maps one-to-one onto a `Temporal` method or `temporal-utils` helper, so the migration is mechanical, with few edge cases.
