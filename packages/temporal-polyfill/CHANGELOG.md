
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
