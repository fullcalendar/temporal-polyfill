# DRY TODO: classApi and classApiFull

`classApiFull` intentionally duplicates `classApi` for now. The goal was to
make Intl calendar support an explicit entrypoint branch instead of a
side-effect import, while keeping the refactor easy to reason about.

## Current split

- `classApi` is the core branch. Calendar strings resolve only to the core
  internal calendar sentinels: ISO and Gregory.
- `classApiFull` is the full branch. Calendar strings resolve through
  `resolveFullCalendar`, which handles ISO, Gregory, and Intl-backed calendars.
- Shared internals should accept already-resolved `InternalCalendar` values when
  calendar behavior is involved. They should not decide whether a string
  calendar ID is core-only or full.

## Likely DRY path

1. Keep `calendarArg.ts` branch-local.
   This is the main policy boundary. Core and full intentionally answer
   calendar strings differently.

2. Keep `construct.ts` branch-local for now.
   Constructor argument coercion order is observable, and calendar resolution
   is branch policy. The calendar-bearing constructor mechanics therefore live
   in each API branch instead of behind shared `internal/construct.ts` helpers.
   `internal/construct.ts` should stay limited to constructors with no calendar
   policy: Instant, PlainTime, and Duration.

   The DRY problem spans `classApi/construct.ts`, `classApiFull/construct.ts`,
   and `funcApi/shim/construct.ts`. That duplication is intentional for now,
   but the shape is regular enough that a later helper could remove most of it
   without reintroducing internal string calendar resolution.

   Possible direction:

   - keep a branch-local calendar refiner/resolver callback
   - share the ISO/time/time-zone coercion and bounds checks
   - preserve observable order by calling the resolver at the exact point each
     public constructor requires
   - make the function API construct file part of the cleanup, even though this
     document is mostly about `classApi` vs `classApiFull`

3. Merge duplicate Temporal type modules only after their calendar resolution
   dependency is injectable.
   Most files differ only in imports from `./calendarArg` and `./construct`.
   A future shared implementation could accept a small branch config:

   - calendar argument refinement
   - constructor slot wrappers
   - parse calendar resolver

4. Watch parse entrypoints.
   `from(...)` string paths call `parsePlainDate`, `parseZonedDateTime`, etc.
   Those parser calls should continue receiving an explicit resolver from the
   API branch.

5. Leave `intlDateTimeFormat.ts`, `intlExtended.ts`, and `intlFormatConfig.ts`
   as low-priority duplication.
   They are currently copied as-is. DRY-ing them is mostly mechanical and less
   important than the calendar argument and construction paths.

## Cleanup targets

- Remove duplicated method bodies once calendar policy can be injected cleanly.
- Prefer deleting newly-unused branch helpers immediately when inlining or
  merging code.
- Avoid reintroducing side-effect calendar registration or internal string
  calendar resolution.
