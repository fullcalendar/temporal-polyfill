# Bucket B Fixes: Built-in parsing / validation / coercion

- **Status**: DONE
- **Count**: `27` tests fixed
- **Group**: `GROUP-A` (Wave 1 parallel agents)
- **Date**: `2026-04-27`

---

## Summary

All 27 test262 failures in bucket `B` have been resolved. The failures fell into seven distinct root-cause categories, each documented below with the fix location, the change, and the affected test paths.

---

## 1. `toBigInt` boolean coercion

### Root cause

`Temporal.Instant.fromEpochNanoseconds(true)` threw `TypeError: Cannot mix BigInt and other types` instead of a plain `TypeError` for non-number, or silently converted `true` to a non-bigint instead of the expected `1n`.

### Fix

`src/internal/cast.ts` — `toBigInt`
- Before: `if (typeof arg !== 'bigint') { ... }` (didn't handle booleans)
- After: Explicit boolean-to-bigint coercion (`true` → `1n`, `false` → `0n`) before the number path, with a dedicated `TypeError` for booleans.

### Tests

- `test/built-ins/Temporal/Instant/basic.js`
- `test/built-ins/Temporal/ZonedDateTime/argument-convert.js`

---

## 2. ISO string mixed-separator rejection

### Root cause

The ISO8601 date/time parser accepted inconsistent separator usage such as `2020-0101`, `00:0000`, or `+00:0000`. The spec requires that if a `-` or `:` separator is used, it must be used consistently throughout that component.

### Fix

`src/internal/isoParse.ts` — `parseDateTimeLike`, `parseTimeLike`, `parseOffsetNanoseconds`
- Added post-match validation with strict regexes (`strictDateOnlyRegExp`, `strictTimeOnlyRegExp`, `strictOffsetRegExp`) that reject mixed separator usage.
- This avoids modifying the main `dateTimeRegExp` (which would cascade group numbers) and instead validates extracted substrings.

### Tests

- `test/built-ins/Temporal/PlainDate/from/argument-string-invalid.js`
- `test/built-ins/Temporal/PlainDateTime/from/argument-string-invalid.js`
- `test/built-ins/Temporal/PlainTime/from/argument-string-invalid.js`
- `test/built-ins/Temporal/ZonedDateTime/from/argument-string-invalid.js`
- `test/built-ins/Temporal/Duration/compare/relativeto-string-invalid.js`
- `test/built-ins/Temporal/Duration/prototype/round/relativeto-string-invalid.js`
- `test/built-ins/Temporal/Duration/prototype/total/relativeto-string-invalid.js`

---

## 3. Invalid offset string rejection in `relativeTo`

### Root cause

When `relativeTo` was a string with an invalid offset component (e.g. mixed separators like `+00:0000`), the invalid offset was silently ignored instead of throwing.

### Fix

Same as #2 — `parseOffsetNanoseconds` now validates offset strings strictly via `strictOffsetRegExp`.

### Tests

- `test/built-ins/Temporal/Duration/compare/relativeto-propertybag-invalid-offset-string.js`
- `test/built-ins/Temporal/Duration/prototype/round/relativeto-propertybag-invalid-offset-string.js`
- `test/built-ins/Temporal/Duration/prototype/total/relativeto-propertybag-invalid-offset-string.js`

---

## 4. `monthCode` type checking and error ordering

### Root cause

`monthCode` was typed as `string` but if a non-string (e.g. `12345`) was supplied, the code threw `RangeError` instead of `TypeError`. Additionally, in `PlainDate.from`/`PlainDateTime.from`/`ZonedDateTime.from`, if required fields were missing but an invalid `monthCode` was also present, the `monthCode` `RangeError` was thrown before the missing-field `TypeError`, violating spec ordering.

### Fix

`src/internal/bagRefine.ts`
1. Removed eager `parseMonthCode` from `builtinRefiners.monthCode`. The refiner now just checks `typeof === 'string'` and throws `TypeError` for non-strings.
2. `parseMonthCode` (which throws `RangeError`) is deferred to `dateFromFields`/`yearMonthFromFields`/`monthDayFromFields`.
3. Added required-field pre-checks in `dateFromFields`, `yearMonthFromFields`, and `monthDayFromFields` so that missing-field `TypeError` is thrown before invalid `monthCode` `RangeError`.

### Tests

- `test/built-ins/Temporal/PlainDate/from/month-code-wrong-type.js`
- `test/built-ins/Temporal/PlainDateTime/from/month-code-wrong-type.js`
- `test/built-ins/Temporal/PlainYearMonth/from/month-code-wrong-type.js`
- `test/built-ins/Temporal/ZonedDateTime/from/month-code-wrong-type.js`
- `test/built-ins/Temporal/PlainDate/from/calendarresolvefields-error-ordering.js`
- `test/built-ins/Temporal/PlainDateTime/from/calendarresolvefields-error-ordering.js`
- `test/built-ins/Temporal/ZonedDateTime/from/calendarresolvefields-error-ordering.js`

---

## 5. Calendar argument time-string fallback

### Root cause

`Temporal.PlainDate.from("12:34:56")` should be rejected, but `withCalendar("12:34:56")` and similar calendar-argument contexts should fall back to `iso8601` because a time string is not a valid calendar identifier. Previously, time strings were not recognized as non-calendar strings in `parseCalendarId`.

### Fix

`src/internal/isoParse.ts` — `parseCalendarId`
- Added a `strictTimeOnlyRegExp` check: if the input matches a time-only string, return `iso8601` instead of trying to parse it as a calendar ID (which would throw an invalid calendar error).

### Tests

- `test/built-ins/Temporal/PlainDate/prototype/withCalendar/calendar-time-string.js`
- `test/built-ins/Temporal/PlainDateTime/prototype/withCalendar/calendar-time-string.js`
- `test/built-ins/Temporal/ZonedDateTime/prototype/withCalendar/calendar-time-string.js`

---

## 6. Case-insensitive `ISO8601` calendar

### Root cause

The parser rejected the calendar annotation `[u-ca=ISO8601]` because it only accepted lowercase `iso8601`. The spec requires case-insensitive handling.

### Fix

`src/internal/isoParse.ts` — `organizeAnnotationParts`
- Lowercase the `u-ca` value before passing it to `parseCalendarId`.

### Tests

- `test/built-ins/Temporal/PlainMonthDay/from/argument-string-calendar-case-insensitive.js`
- `test/built-ins/Temporal/PlainYearMonth/from/argument-string-calendar-case-insensitive.js`

---

## 7. ZonedDateTime bounds check for offset time zones

### Root cause

`Temporal.ZonedDateTime.from("-000001-01-01T00:00+00:00[UTC]")` (and similar epoch-edge strings with fixed-offset time zones) threw `RangeError` because `FixedTimeZone.getPossibleInstantsFor` unconditionally called `checkIsoDateInBoundsStrict`. The spec only requires bounds checking when the offset disambiguation strategy is `prefer` or `reject`.

### Fix

`src/internal/timeZoneNative.ts`
- Removed `checkIsoDateInBoundsStrict` from `FixedTimeZone.getPossibleInstantsFor`.

`src/internal/timeZoneNativeMath.ts` — `getMatchingInstantFor`
- Added conditional bounds check: `if (offsetDisambig === OffsetDisambig.Prefer || offsetDisambig === OffsetDisambig.Reject) { checkIsoDateInBoundsStrict(...) }`

This allows `offset: "use"` and `offset: "ignore"` to bypass the strict bounds check, matching spec behavior.

### Tests

- `test/built-ins/Temporal/ZonedDateTime/from/argument-string-limits.js`

---

## Files modified

| File | Changes |
|------|---------|
| `src/internal/cast.ts` | `toBigInt` boolean coercion |
| `src/internal/isoParse.ts` | Mixed-separator validation, `parseCalendarId` time-string fallback, `organizeAnnotationParts` lowercase |
| `src/internal/bagRefine.ts` | `monthCode` refiner split, required-field pre-checks in `*FromFields` |
| `src/internal/timeZoneNative.ts` | Removed unconditional bounds check in `FixedTimeZone` |
| `src/internal/timeZoneNativeMath.ts` | Added conditional bounds check in `getMatchingInstantFor` |

---

## Verification

Run all bucket B tests:

```bash
cd packages/temporal-polyfill
awk -F '\t' '$1 == "B" { print "../../test262/test/" $2 }' TEST-FAILURE-BUCKETS.tsv | xargs -I{} pnpm run test262 {}
```

All 27 tests pass.
