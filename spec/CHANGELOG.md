
# `temporal-spec` Changelog

## v1.0.1

- FIX: `Intl` export is value at runtime but type-only in declarations (#97)
- FIX: Restrict `Duration.total`'s string argument to units that don't require `relativeTo`

## v1.0.0

- FEATURE: Updated to June 2026 spec and aligns with the official TypeScript types in [`esnext.temporal.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.temporal.d.ts), [`esnext.intl.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.intl.d.ts), and [`esnext.date.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.date.d.ts).
- BREAKING: Interface names for `options` types have changed.
- BREAKING: No longer distributing `.d.cts` files for CJS-compatible systems.
- FIX: `Duration.toLocaleString`'s options argument has incorrect type definition (#59)

## Older

See [temporal-polyfill's CHANGELOG.md](../polyfill/CHANGELOG.md) for prior changelog items.
