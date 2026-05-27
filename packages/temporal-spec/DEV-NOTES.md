
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
  }
and just this literal type definition, which does NOT live on Date:
  export function toTemporalInstant(this: Date): Temporal.Instant;

WORKAROUNDS:
  and ALL Intl -> globalThis.Intl. examples:
    DateTimeFormatPart -> globalThis.Intl.DateTimeFormatPart
    DateTimeRangeFormatPart -> globalThis.Intl.DateTimeRangeFormatPart

index.d.ts is now DONE. COPY to index.d.cts


## Typechecking

Keep tsconfig.json and tsconfig.cts.json separate.

tsconfig.json checks:
  index.d.ts
  global.d.ts

tsconfig.cts.json checks:
  index.d.cts
  global.d.cts

Do not combine all four declaration files into one "files" list. The global
declaration files are alternate published entrypoints for different module
worlds. Loading global.d.ts and global.d.cts into the same TypeScript program
would declare the same global Temporal type aliases twice, and type aliases do
not merge.

If an editor shows errors in the .d.cts files but `pnpm run typecheck` passes,
check which TypeScript project the editor attached those files to. The .d.cts
files are meant to be checked by tsconfig.cts.json. Some IDEs may instead put
them in an inferred project, or may only be showing diagnostics from
tsconfig.json, whose "files" list intentionally does not include the .d.cts
entrypoints.
