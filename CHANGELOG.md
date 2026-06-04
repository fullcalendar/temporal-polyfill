
next
----

- breaking: no more cjs in dist
- fix: `Temporal.Duration.round()` no longer throws `RangeError: Invalid protocol results` for zero durations with `relativeTo` ([#87](https://github.com/fullcalendar/temporal-polyfill/issues/87)). This correct behavior is now also covered by test262's `test/built-ins/Temporal/Duration/prototype/round/blank-duration.js`.
- fix: `Temporal.Duration.prototype.total()` now returns `0` for blank durations with `relativeTo` instead of throwing `RangeError: Invalid protocol results` ([#55](https://github.com/fullcalendar/temporal-polyfill/issues/55)). This correct behavior is now also covered by test262's `test/built-ins/Temporal/Duration/prototype/total/blank-duration.js` and `test/built-ins/Temporal/Duration/prototype/total/zero-duration.js`.
- fix: `Temporal.Duration.from()` no longer double-rounds huge subsecond values, avoiding false out-of-range errors for valid nanosecond durations and preserving exact microsecond stringification ([#92](https://github.com/fullcalendar/temporal-polyfill/issues/92)).
- fix: Day rounding no longer loses tiny sub-day remainders for large `Temporal.Duration` and `Temporal.PlainDateTime` differences, so modes like `ceil` correctly round up when the exact value is just past a whole day ([#84](https://github.com/fullcalendar/temporal-polyfill/issues/84)).
- fix: `Temporal.PlainMonthDay.prototype.toLocaleString()` no longer includes the internal reference year when formatting with date styles ([#75](https://github.com/fullcalendar/temporal-polyfill/issues/75)). This correct behavior is now also covered by test262's `test/intl402/Temporal/PlainMonthDay/prototype/toLocaleString/dateStyle.js` and `test/intl402/Temporal/PlainMonthDay/prototype/toLocaleString/default-does-not-include-year-time-and-time-zone-name.js`.
- fix: `Temporal.PlainDate.prototype.withCalendar()` now preserves the correct Buddhist calendar month for historical ISO dates such as 1582-01-01 ([#74](https://github.com/fullcalendar/temporal-polyfill/issues/74)). This correct behavior is mostly covered by test262's broader Buddhist calendar conversion tests, including `test/intl402/Temporal/PlainDate/from/roundtrip-from-property-bag.js` and `test/intl402/Temporal/PlainDate/prototype/withCalendar/extreme-dates.js`, though not by this exact edge case.
- fix: `Temporal.ZonedDateTime.from()` now accepts Brazilian time-zone wall times near close-together 2000 offset transitions, including `America/Noronha` and `America/Boa_Vista` ([#73](https://github.com/fullcalendar/temporal-polyfill/issues/73)). The root cause is mostly covered by test262's `test/intl402/Temporal/ZonedDateTime/prototype/getTimeZoneTransition/transitions-close-together.js` and `test/intl402/Temporal/ZonedDateTime/prototype/startOfDay/transitions-close-together.js`, though not by these exact string parsing cases.
- fix: `Temporal.ZonedDateTime.from()` no longer clamps future time-zone offset calculations, preserving the expected `+02:00` summer offset for future `Europe/Berlin` dates such as 2044-06-10 ([#49](https://github.com/fullcalendar/temporal-polyfill/issues/49)). No matching test262 coverage was found for this future-offset property-bag construction case.
- No more temporal-spec?
- Calendars more conformant
- Removed Node 14 support


v0.3.2 (2026-03-10)
-------------------

- feature: function API in dist, though poorly documented and in alpha
- fix: incorrect placement of `/*@__PURE__*/` (#90)


v0.3.1 (2026-03-09)
-------------------

- feature: More readable objects on console (#46)
- feature: support require(esm) in Node.js to avoid dual package hazard (#62)
- fix: use `new Date()` for `maxPossibleTransition` malfunctions in some environments (#83)
- fix: Duration toLocaleString uses DateTimeFormatOptions (#80)
- fix: ZonedDateTime should not be considered Formattable (#78)
- fix: stop using locale `en-GB` for computations, not present in some environments (#76)
- fix: result of `Temporal.Now.timeZoneId()` should not be cached (#63)


v0.3.0 (2025-03-28)
-------------------

- Updated to March 2025 version of Temporal spec (#47). Including but not limited to:
  - timeZones can ONLY be strings; no longer accepts custom objects
  - calendars can ONLY be strings; no longer accepts custom objects
  - `Temporal.TimeZone` class removed; most functionality exists on `Temporal.ZonedDateTime`
    - Added `zonedDateTime.getTimeZoneTransition()`
  - `Temporal.Calendar` class removed; all functionality exists on Plain/Zoned types
  - `.getISOFields()` methods removed on all Plain/Zoned types
  - Better conformance for `Intl.DateTimeFormat`
  - Many removals, with alternatives:

```js
// Temporal.Now

❌ Temporal.Now.zonedDateTime(calendar)
✅ Temporal.Now.zonedDateTimeISO().withCalendar(calendar)

❌ Temporal.Now.plainDateTime(calendar)
✅ Temporal.Now.plainDateTimeISO().withCalendar(calendar)

❌ Temporal.Now.plainDate(calendar)
✅ Temporal.Now.plainDateISO().withCalendar(calendar)

// Temporal.Instant

❌ Temporal.Instant.fromEpochSeconds(seconds)
✅ Temporal.Instant.fromEpochMilliseconds(seconds * 1000)

❌ Temporal.Instant.fromEpochMicroseconds(micro)
✅ Temporal.Instant.fromEpochNanoseconds(micro * 1000n)

❌ instant.epochSeconds
✅ instant.epochMilliseconds / 1000

❌ instant.epochMicroseconds
✅ instant.epochNanoseconds / 1000n

❌ instant.toZonedDateTime()
✅ instant.toZonedDateTimeISO().withCalendar(cal)

// Temporal.ZonedDateTime

❌ zonedDateTime.epochSeconds
✅ zonedDateTime.epochMilliseconds / 1000

❌ zonedDateTime.epochMicroseconds
✅ zonedDateTime.epochNanoseconds / 1000n

❌ zonedDateTime.withPlainDate(plainDate)
✅ plainDate.toZonedDateTime({
     plainTime: zonedDateTime,
     timeZone: zonedDateTime.timeZone,
   })

❌ zonedDateTime.toPlainYearMonth()
✅ zonedDateTime.toPlainDate().toPlainYearMonth()

❌ zonedDateTime.toPlainMonthDay()
✅ zonedDateTime.toPlainDate().toPlainMonthDay()

// Temporal.PlainDateTime

❌ plainDateTime.toPlainYearMonth()
✅ plainDateTime.toPlainDate().toPlainYearMonth()

❌ plainDateTime.toPlainMonthDay()
✅ plainDateTime.toPlainDate().toPlainMonthDay()

❌ plainDateTime.withPlainDate(plainDate)
✅ plainDate.toPlainDateTime(plainDateTime)

// Temporal.PlainTime

❌ plainTime.toPlainDateTime(plainDate)
✅ plainDate.toPlainDateTime(plainTime)

❌ plainTime.toZonedDateTime({ plainDate, timeZone })
✅ plainDate.toZonedDateTime({ plainTime, timeZone })
```

[Learn more about these breaking changes &raquo;](https://github.com/js-temporal/temporal-polyfill/blob/main/CHANGELOG.md#050)


v0.2.5 (2024-05-30)
-------------------

- conformance to latest spec (May 2024)
- fix: Chrome on Android reporting wrong era for islamic calendars (#39)
- fix: Bug with eras on Firefox 96 - 105
  (https://bugzilla.mozilla.org/show_bug.cgi?id=1752253)


v0.2.4 (2024-04-05)
-------------------

- conformance to latest spec (Apr 2024)
- fix: Typescript error when using CommonJS module outputs (#35)
- fix: PlainTime.toString() throws error with SWC minifier (#36)
- fix: temporal-spec types updated for weekOfYear/yearOfWeek


v0.2.3 (2024-03-01)
-------------------

- fix: more readable error message when no valid fields specified (#30)
- fix: more readable error message when unit is out of range
- fix: non-iso/gregory calendars dayOfYear/weekOfYear off-by-one
- conformance to latest spec
  - yearOfWeek/weekOfYear should return undefined for non-iso/gregory calendars
  - updates to since/until algorithm
  - more validation of custom timeZones' returned instants
  - more validation of Duration units, max values
  - prevent legacy ICU time zone IDs
  - don't normalize the islamicc calenadar name to islamic-civil


v0.2.2 (2024-02-20)
-------------------

- fix: when importing `'temporal-polyfill'` or `'temporal-polyfill/impl'`,
  the symbol `DateTimeFormat` is exported when in fact `Intl` should be exported
  according to the `temporal-spec` package. (#28)
  Potentially BREAKING CHANGE for vanilla JS users importing `DateTimeFormat`.
- fix: closed off potential attack vector for ReDoS attacks on regular
  expressions that parse ISO datetime strings (76a6aca)


v0.2.1 (2024-02-05)
-------------------

- fix: `dayOfWeek`/`yearOfWeek`/`weekOfYear` incorrectly using local time (#26, #27)
- fix: Compliant string-level normalization of time zone IDs (mentioned in #3)
- fix: `DateTimeFormat` constructor cannot be invoked without `new` (#25)
- fix: `DateTimeFormat::format` correctly implemented as bound getter
- fix: `Duration::toLocaleString` falls back to `toString`
- feature: better tree-shakability for ESM


v0.2.0 (2024-01-07)
-------------------

- Updated with latest [test262](https://github.com/tc39/test262) conformance tests (Nov 2023) (#3).
All tests passing barring intentional deviations from spec, documented in [README](README.md).
- Breaking changes include all those [mentioned here](https://github.com/js-temporal/temporal-polyfill/blob/main/CHANGELOG.md#044)
and [normative changes](https://github.com/tc39/proposal-temporal/issues/2628) introduced between May 2023 - Nov 2023,
most notably changes to "user-visible operations".
- Size of minified+gzipped bundle increased from 17.3 kB -> 20.0 kB due to stricter compliance with latest spec.
- In NPM directory, all files are now top-level as opposed to within `dist/`. Thus, the [jsDelivr URL](https://cdn.jsdelivr.net/npm/temporal-polyfill@0.2.0/global.min.js) has changed.
- Fixed bugs: #9, #12, #13, #21
- Improved README content, including comparison with @js-temporal (#22)
- Renamed github repo to fullcalendar/temporal-polyfill


v0.1.1 (2023-02-15)
-------------------

- fix: upgrade temporal-spec, which is now compatible with moduleResolution:node16 (#17 cont'd)
- fix: don't fallback to native Temporal implementation for ponyfill (#19 cont'd)


v0.1.0 (2023-02-09)
-------------------

- fix: Support TypeScript 4.7 moduleResolution:node16 (#17)
- fix: Avoiding fallback to native Temporal implementation (#19)


v0.0.8 (2022-08-24)
-------------------

- Support environments without BigInt. See browser version matrix in README.
- Fixed TypeScript syntax error in `temporal-spec/index.d.ts` (#10)
- Fixed missing .d.ts files for environments that don't support export maps.


v0.0.7 (2022-05-06)
-------------------

- BREAKING: side-effect-free entrypoint now exports named exports instead of default `Temporal`
  - No longer works: `import Temporal from 'temporal-polyfill'`
  - Works: `import { Temporal } from 'temporal-polyfill'`
  - Allows access to `Intl` side-effect-free export
- Uses types created by TC39 Committee


v0.0.6 (2022-04-06)
-------------------

- Improved spec-compliance. Passes all tests from @js-temporal/polyfill repo.


v0.0.5 (2022-03-16)
-------------------

- Intl.DateTimeFormat correctly polyfilled to customize output based on Temporal type
- fixes to TimeZone object


v0.0.4 (2022-03-10)
-------------------

- improved support for non-ISO calendars
- fixed `Now` methods returning wrong results (#5)
