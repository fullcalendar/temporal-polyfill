
## Porting

Download: https://raw.githubusercontent.com/microsoft/TypeScript/refs/heads/main/src/lib/esnext.temporal.d.ts

Copy and paste into global.d.ts and convert 4-spaces -> 2-spaces

Remove reliance on
  /// <reference lib="es2025.intl" />
and add DurationFormatOptions workaround

Take everything wrapped in
  declare namespace Temporal {
and wrap it into this instead:
  export {} // treat as a module
  declare global {
    namespace Temporal {
    }
  }

See: https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.intl.d.ts
  See FormattableTemporalObject and how it's used in DateTimeFormat
  Create a new `namespace Intl {` within the `declare global {` and port changes

See: https://github.com/microsoft/TypeScript/blob/main/src/lib/esnext.date.d.ts
  Create a new `interface Date {` within the `declare global {` and port changes

global.d.ts is now DONE. COPY to global.d.cts

now for index.d.ts (which does NOT have side effects. just exports a namespace)
  base changes on new global.d.ts...

Take everything wrapped in
  declare global {
    namespace Temporal {
and change it to
  export namespace Temporal {
  }
  export namespace Intl {
    //...
    interface DateTimeFormat extends Omit<globalThis.Intl.DateTimeFormat, 'format' | 'formatToParts' | 'formatRange' | 'formatRangeToParts'> {
    }
    const DateTimeFormat: Omit<typeof globalThis.Intl.DateTimeFormat, 'prototype'> & {
      new (locales?: globalThis.Intl.LocalesArgument, options?: globalThis.Intl.DateTimeFormatOptions): DateTimeFormat
      (locales?: globalThis.Intl.LocalesArgument, options?: globalThis.Intl.DateTimeFormatOptions): DateTimeFormat
      readonly prototype: DateTimeFormat
    }
  }
and just this literal type definition, which does NOT live on Date:
  export function toTemporalInstant(this: Date): Temporal.Instant;

Keep the `Intl.DateTimeFormat` value declaration above. `temporal-polyfill`
reexports these declarations as its public type surface, so omitting the value
would make its runtime `Intl` export type-only under `verbatimModuleSyntax`.

WORKAROUNDS:
  and ALL Intl -> globalThis.Intl. examples:
    DateTimeFormatPart -> globalThis.Intl.DateTimeFormatPart
    DateTimeRangeFormatPart -> globalThis.Intl.DateTimeRangeFormatPart

index.d.ts is now DONE. COPY to index.d.cts


## Typechecking

Run `pnpm run typecheck`
