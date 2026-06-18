# For component authors

Notes for authors of third-party component libraries and other reusable tools —
date pickers, schedulers, calendar grids, and anything else that needs date math
under the hood.

If you build one of these, you know the date-library dilemma: bundle
`dayjs`/`date-fns`, hand-roll helpers around `Date`, or pull in an adapter like
`date-io` and make your users pick a library. Each path bundles *another* date
library into every app that installs your component.

The [tree-shakeable API](./index.md) is designed to end that — and to make
Temporal the shared standard third-party components can finally agree on. Two
properties make it a low-risk dependency.

## Shared, not duplicated

Declare `temporal-polyfill` as a **peer dependency** in your library's
`package.json`, so the host app supplies the single shared install:

```json
{
  "peerDependencies": {
    "temporal-polyfill": "^1.0.1"
  }
}
```

Then import only the functions you need from `temporal-polyfill/fns/*`:

```js
// inside your component library
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
```

You never force the full polyfill onto anyone. Whether to load it is the host
application's choice, driven by which browsers and runtimes they need to support
(Safari and older environments still lack native `Temporal`). Either way, the
host ends up with a single `temporal-polyfill` install. Every consumer resolves
to it — your component via `temporal-polyfill/fns` and the host app via
`temporal-polyfill/global` — so the bundler deduplicates the shared code:

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

The function internals your component pulls in are the *same* internals the
polyfill is built from — the payoff of shipping both as a single package rather
than two. So several components that depend on the tree-shakeable API contribute
one copy of Temporal's logic to the bundle, not one each, and an app that opts
into the polyfill pays little extra on top.

For this sharing to work, the host must have a `temporal-polyfill` install the
component can resolve against. The functions operate on plain records and run
without a global `Temporal`, but interop helpers like `toTemporal` still read
the global at call time — see [Temporal Interop](./index.md#temporal-interop).

Custom (non-ISO) calendars are where the tree-shakeable API asks the most of you: the
class-based API resolves calendars for you, but the `fns` API expects you to
query and pass calendar objects explicitly. Rather than detail every case here,
see the [`fns-and-global` example project](../../examples/fns-and-global), which
works through this alongside the function-API-plus-global-polyfill setup
described above.

## A dependency you can delete

Adopting the tree-shakeable API is not a permanent commitment. It carries your
calendar logic while native `Temporal` is still rolling out, and once `Temporal`
is available everywhere you target, [temporal-polyfill-codemod](../../codemod/README.md)
rewrites your function calls into idiomatic `Temporal.*` and you remove the
dependency entirely.

No lock-in — and because each function maps one-to-one onto its `Temporal.*`
equivalent, the migration is mechanical, with few edge cases and little to
debug.
