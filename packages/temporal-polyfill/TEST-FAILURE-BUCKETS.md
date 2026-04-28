# Test Failure Buckets

Derived from the current [`TEST-FAILURES.txt`](./TEST-FAILURES.txt) run.

- Count basis: `956` unique failing test files.
- Deduping note: `TEST-FAILURES.txt` contains duplicate path mentions when the stack trace repeats the same test path. This file groups unique failing test files only.
- Goal: give future parallel agents buckets that are as root-cause-oriented, and as non-overlapping, as possible.
- Authoritative full membership list:
  [`TEST-FAILURE-BUCKETS.tsv`](./TEST-FAILURE-BUCKETS.tsv)
- TSV format:
  `<bucket-id><TAB><test-path>`
- Example lookup:
  `awk -F '\t' '$1 == "B" { print $2 }' TEST-FAILURE-BUCKETS.tsv`

## Bucket A: Observable side effects / option materialization

- Status: DONE
- Count: `21`
- Shared root cause:
  option bags or shorthand arguments are being observed in the wrong way or in the wrong order.
- Path patterns:
  - `test/built-ins/Temporal/*/prototype/*/options-read-before-algorithmic-validation.js`
  - `test/built-ins/Temporal/*/prototype/*/string-shorthand-no-object-prototype-pollution.js`
  - `test/built-ins/Temporal/*/prototype/*/no-observable-array-iteration.js`
- Representative tests:
  - `test/built-ins/Temporal/Instant/prototype/since/options-read-before-algorithmic-validation.js`
  - `test/built-ins/Temporal/PlainDate/prototype/toZonedDateTime/no-observable-array-iteration.js`
  - `test/built-ins/Temporal/PlainTime/prototype/round/string-shorthand-no-object-prototype-pollution.js`

## Bucket B: Built-in parsing / validation / coercion

- Count: `27`
- Shared root cause:
  built-in Temporal parsing and validation mismatches, including invalid ISO strings, invalid offsets, monthCode typing, calendar-field error ordering, constructor coercion, and date-limit checks.
- Representative tests:
  - `test/built-ins/Temporal/Instant/from/argument-string-invalid.js`
  - `test/built-ins/Temporal/ZonedDateTime/from/offset-string-invalid.js`
  - `test/built-ins/Temporal/PlainDate/from/month-code-wrong-type.js`
  - `test/built-ins/Temporal/PlainMonthDay/from/argument-string-calendar-case-insensitive.js`
  - `test/built-ins/Temporal/ZonedDateTime/argument-convert.js`

## Bucket C: Duration round / total algorithms

- Count: `9`
- Shared root cause:
  `Temporal.Duration.compare`, `.round()`, and `.total()` disagree with spec on relative duration math, rounding windows, blank durations, sign handling around DST fallback, or precision/bounds.
- Representative tests:
  - `test/built-ins/Temporal/Duration/prototype/round/blank-duration.js`
  - `test/built-ins/Temporal/Duration/prototype/round/rounding-window.js`
  - `test/built-ins/Temporal/Duration/prototype/total/precision-exact-mathematical-values-5.js`
  - `test/intl402/Temporal/Duration/prototype/round/relativeto-dst-back-transition.js`
  - `test/intl402/Temporal/Duration/prototype/total/relativeto-dst-back-transition.js`

## Bucket D: Built-in PlainYearMonth arithmetic

- Count: `6`
- Shared root cause:
  `PlainYearMonth` built-in add/subtract semantics for lower units, overflow, and representable bounds.
- Path patterns:
  - `test/built-ins/Temporal/PlainYearMonth/prototype/add/{argument-lower-units,overflow,subtract-from-last-representable-month}.js`
  - `test/built-ins/Temporal/PlainYearMonth/prototype/subtract/{argument-lower-units,overflow,subtract-from-last-representable-month}.js`

## Bucket E: Time zone / offset specific behavior

- Count: `15`
- Shared root cause:
  sub-minute offsets, time zone normalization, reverse wall-clock comparisons, transition edge cases, or other zone-specific semantics.
- Representative tests:
  - `test/intl402/Temporal/Duration/compare/relativeto-sub-minute-offset.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/since/sub-minute-offset.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/until/same-date-reverse-wallclock.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/getTimeZoneTransition/transitions-close-together.js`
  - `test/intl402/DateTimeFormat/canonicalize-timezone.js`

## Bucket F: Calendar ID canonicalization / fallback

- Count: `20`
- Shared root cause:
  calendar identifier acceptance, canonicalization, case handling, and fallback behavior.
- Representative tests:
  - `test/intl402/Temporal/PlainDate/canonicalize-calendar.js`
  - `test/intl402/Temporal/PlainDateTime/canonicalize-calendar.js`
  - `test/intl402/Temporal/ZonedDateTime/canonicalize-calendar.js`
  - `test/intl402/Temporal/PlainMonthDay/from/islamic.js`
  - `test/intl402/DateTimeFormat/constructor-options-calendar-islamic-fallback.js`

## Bucket G: Intl formatting bridge

- Count: `55`
- Shared root cause:
  Temporal-to-`Intl.DateTimeFormat` integration, including `toLocaleString`, `format*`, `formatToParts*`, `resolvedOptions`, style conflicts, and time-zone-name formatting on Temporal objects.
- Representative tests:
  - `test/intl402/Temporal/Instant/prototype/toLocaleString/dateStyle-timeStyle-undefined.js`
  - `test/intl402/Temporal/PlainDate/prototype/toLocaleString/options-conflict.js`
  - `test/intl402/DateTimeFormat/prototype/format/temporal-objects-no-time-clip.js`
  - `test/intl402/DateTimeFormat/prototype/formatRangeToParts/temporal-plaindatetime-formatting-timezonename.js`
  - `test/intl402/DateTimeFormat/prototype/resolvedOptions/resolved-calendar-unicode-extensions-and-options.js`

## Bucket H: Era model / era round-tripping

- Count: `188`
- Shared root cause:
  era validation, era aliases, era boundary handling, year-era remapping, round-tripping via string/property bag, and derived era/year accessors.
- Representative tests:
  - `test/intl402/Temporal/PlainDate/from/calendar-invalid-era.js`
  - `test/intl402/Temporal/PlainDate/from/canonicalize-era-codes.js`
  - `test/intl402/Temporal/PlainDate/from/era-boundary-japanese.js`
  - `test/intl402/Temporal/PlainYearMonth/from/remapping-era.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/year/epoch-year.js`

## Bucket I: Calendar field math

- Count: `276`
- Shared root cause:
  non-ISO month/day/year field derivation, leap-month logic, leap-year logic, monthCode/reference-day generation, intercalary month handling, calendar-specific field error ordering, and related derived accessors.
- Representative tests:
  - `test/intl402/Temporal/PlainDate/from/calc-epoch-year-hebrew.js`
  - `test/intl402/Temporal/PlainMonthDay/from/hebrew-month-codes.js`
  - `test/intl402/Temporal/PlainDate/prototype/add/leap-months-chinese.js`
  - `test/intl402/Temporal/PlainDate/prototype/until/intercalary-month-coptic.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/monthCode/chinese-calendar-dates.js`

## Bucket J: Non-ISO calendar arithmetic and generic operation semantics

- Count: `339`
- Shared root cause:
  remaining non-ISO arithmetic and field-resolution behavior not already isolated above: generic `add`, `subtract`, `with`, `since`, `until`, extreme-date handling, mutually-exclusive field checks, and calendar-specific operation semantics.
- Representative tests:
  - `test/intl402/Temporal/PlainDate/from/extreme-dates.js`
  - `test/intl402/Temporal/PlainDate/prototype/add/month-boundary-gregory.js`
  - `test/intl402/Temporal/PlainDateTime/prototype/with/basic-indian.js`
  - `test/intl402/Temporal/PlainYearMonth/prototype/with/basic-gregory.js`
  - `test/intl402/Temporal/ZonedDateTime/prototype/with/mutually-exclusive-fields-islamic-civil.js`

## Suggested sequencing for parallel agents

If the main goal is minimizing overlap, run the buckets in waves instead of starting all of them at once.

### Wave 1: start immediately, all in parallel

- Bucket `A`: observability / options
- Bucket `B`: built-in parsing / validation / coercion
- Bucket `C`: duration algorithms
- Bucket `D`: built-in `PlainYearMonth` arithmetic
- Bucket `E`: time zone / offset behavior
- Bucket `F`: calendar ID canonicalization / fallback
- Bucket `G`: Intl formatting bridge

These are the cleanest separations and should be the safest group to run concurrently.

### Wave 2: start after Wave 1 is underway

- Bucket `H`: era model / round-tripping
- Bucket `I`: calendar field math

These two both live in the intl-calendar area, but they still split reasonably well if ownership is explicit:

- `H` should own era names, aliases, era boundaries, era/year mapping, and round-trip behavior.
- `I` should own leap months, leap years, monthCode/reference-day generation, intercalary-month behavior, and related field math.

### Wave 3: start last

- Bucket `J`: generic non-ISO calendar arithmetic / operation semantics

`J` is the broad catch-all bucket. It is the most likely to overlap with `H` and `I`, and some `J` failures may disappear once `H` and `I` land. Because of that, `J` should usually wait until `H` and `I` have stabilized.

In short:

1. Start `A` through `G` together.
2. Start `H` and `I` together.
3. Let `H` and `I` settle.
4. Then start `J`.

## Bucket Lookup

Use the TSV manifest for the exact file list:

- Bucket `A`: `awk -F '\t' '$1 == "A" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `B`: `awk -F '\t' '$1 == "B" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `C`: `awk -F '\t' '$1 == "C" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `D`: `awk -F '\t' '$1 == "D" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `E`: `awk -F '\t' '$1 == "E" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `F`: `awk -F '\t' '$1 == "F" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `G`: `awk -F '\t' '$1 == "G" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `H`: `awk -F '\t' '$1 == "H" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `I`: `awk -F '\t' '$1 == "I" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
- Bucket `J`: `awk -F '\t' '$1 == "J" { print $2 }' TEST-FAILURE-BUCKETS.tsv`
