# Time Zone Resolution Refactor Notes

This is a memory note for a possible future cleanup of `src/internal/timeZoneId.ts`.

## Current shape

The current API splits related time-zone resolution facts across a few concepts:

- `getTimeZoneEssence(id)` returns either:
  - a fixed-offset nanosecond number,
  - an `Intl.DateTimeFormat` for a named time zone,
  - or `undefined` for UTC.
- `getTimeZoneAtomic(id)` returns a comparison key:
  - fixed-offset nanoseconds for offset zones,
  - a host-canonical time-zone ID for named zones,
  - or `"UTC"` for UTC.
- `timeZoneAtomicMap` stores the host-canonical ID for an internal formatter object.

This works, but the names `essence` and `atomic` hide the real responsibilities. The
`WeakMap` is also a sign that related facts are being carried separately.

## Proposed direction

Replace the split API with an explicit resolved record, for example:

```ts
type ResolvedTimeZone =
  | {
      kind: 'fixed'
      id: string
      offsetNano: number
      compareKey: number
    }
  | {
      kind: 'named'
      id: string
      format: Intl.DateTimeFormat
      compareKey: string
    }
```

Then callers can ask for the specific fact they need:

```ts
resolveTimeZoneRecord(id).id // public normalized ID
resolveTimeZoneRecord(id).compareKey // equality key
resolveTimeZoneRecord(id).format // native named-zone math
resolveTimeZoneRecord(id).offsetNano // fixed-zone math
```

This should make it possible to remove or rename:

- `getTimeZoneEssence`
- `getTimeZoneAtomic`
- `timeZoneAtomicMap`
- `queryTimeZoneAtomic`

## Refactor cautions

This is a shared internal surface. It feeds time-zone ID normalization, native-zone
math, fixed-zone math, and time-zone equality. Do this separately from targeted
test262 behavior fixes, with focused tests around:

- offset-string time zones,
- UTC and `Etc/*`/`GMT` names,
- IANA link names such as `Australia/Canberra`,
- the explicit `Antarctica/South_Pole` / `Antarctica/McMurdo` special case,
- repeated calls to `queryNativeTimeZone` and equality helpers.
