v0.2.3 (2024-02-29)
-------------------

- fix: more readable error message when no valid fields specified (#30)
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

- Intl.DateTimeFormat corretly polyfilled to customize output based on Temporal type
- fixes to TimeZone object


v0.0.4 (2022-03-10)
-------------------

- improved support for non-ISO calendars
- fixed `Now` methods returning wrong results (#5)
